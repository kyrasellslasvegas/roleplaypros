import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Resend } from "resend";
import openai from "@/lib/ai/openai";
import {
  WEEKLY_INSIGHTS_SYSTEM_PROMPT,
  buildWeeklyInsightsPrompt,
  type WeeklyInsightsInput,
} from "@/lib/ai/prompts/weekly-insights";
import type { SkillName, SkillChange, CoachingInsight } from "@/types/gamification";

// This route is called by Vercel Cron on Monday mornings to generate and send weekly reports
// Add to vercel.json: { "crons": [{ "path": "/api/cron/weekly-reports", "schedule": "0 8 * * 1" }] }

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create service role client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {},
        },
      }
    );

    // Calculate last week's date range
    const today = new Date();
    const lastMonday = new Date(today);
    const dayOfWeek = today.getDay();
    lastMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);
    const weekStart = lastMonday.toISOString().split("T")[0];
    const weekEnd = new Date(lastMonday);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    // Get all active users with email preferences
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, email, full_name, email_preferences")
      .eq("subscription_status", "active");

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: "No active users", processed: 0 });
    }

    let generated = 0;
    let emailed = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      try {
        // Check email preferences
        const emailPrefs = user.email_preferences || {};
        const wantsWeeklyEmail = emailPrefs.weeklyReport !== false;

        // Check if report already exists
        let { data: existingReport } = await supabase
          .from("weekly_reports")
          .select("*")
          .eq("user_id", user.id)
          .eq("week_start", weekStart)
          .single();

        // Generate report if it doesn't exist
        if (!existingReport) {
          const reportData = await generateReportData(supabase, user.id, weekStart, weekEndStr);

          if (!reportData) {
            skipped++;
            continue;
          }

          // Generate AI coaching insights
          const coachingInsights = await generateCoachingInsights(reportData);

          // Insert the report
          const { data: newReport, error: insertError } = await supabase
            .from("weekly_reports")
            .insert({
              user_id: user.id,
              week_start: weekStart,
              week_end: weekEndStr,
              sessions_count: reportData.sessionsCount,
              drills_count: reportData.drillsCount,
              total_practice_minutes: reportData.totalPracticeMinutes,
              skill_grades: reportData.skillGrades,
              skill_changes: reportData.skillChanges,
              compliance_score: reportData.complianceScore,
              compliance_issues: reportData.complianceIssues,
              coaching_insights: coachingInsights,
              streak_days: reportData.streakDays,
              xp_earned: reportData.xpEarned,
              overall_grade: reportData.overallGrade,
              email_sent: false,
            })
            .select()
            .single();

          if (insertError) {
            console.error(`Error creating report for user ${user.id}:`, insertError);
            failed++;
            continue;
          }

          existingReport = newReport;
          generated++;
        }

        // Send email if wanted and not already sent
        if (wantsWeeklyEmail && !existingReport.email_sent && user.email) {
          const emailSent = await sendWeeklyEmail(user, existingReport, weekStart, weekEndStr);

          if (emailSent) {
            // Update report as emailed
            await supabase
              .from("weekly_reports")
              .update({
                email_sent: true,
                email_sent_at: new Date().toISOString(),
              })
              .eq("id", existingReport.id);

            emailed++;
          }
        } else if (!wantsWeeklyEmail) {
          skipped++;
        }
      } catch (err) {
        console.error(`Error processing user ${user.id}:`, err);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      weekStart,
      weekEnd: weekEndStr,
      stats: {
        total: users.length,
        generated,
        emailed,
        skipped,
        failed,
      },
    });
  } catch (error) {
    console.error("Error in weekly reports cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generateReportData(
  supabase: any,
  userId: string,
  weekStart: string,
  weekEnd: string
) {
  // Fetch sessions for the week
  const { data: sessions } = await supabase
    .from("training_sessions")
    .select("*, feedback")
    .eq("user_id", userId)
    .gte("created_at", weekStart)
    .lte("created_at", weekEnd + "T23:59:59");

  // Fetch drills for the week
  const { data: drills } = await supabase
    .from("daily_objections")
    .select("*")
    .eq("user_id", userId)
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .eq("completed", true);

  // Fetch user progress
  const { data: progress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .single();

  const sessionsCount = sessions?.length || 0;
  const drillsCount = drills?.length || 0;

  // Skip if no activity
  if (sessionsCount === 0 && drillsCount === 0) {
    return null;
  }

  const totalPracticeMinutes =
    sessions?.reduce(
      (sum: number, s: any) => sum + Math.floor((s.actual_duration_seconds || 0) / 60),
      0
    ) || 0;

  // Get skill grades
  const skillGrades = progress?.skill_grades || {};

  // Calculate XP earned
  const xpFromSessions =
    sessions?.reduce((sum: number, s: any) => sum + (s.xp_earned || 0), 0) || 0;
  const xpFromDrills =
    drills?.reduce((sum: number, d: any) => sum + (d.xp_earned || 0), 0) || 0;

  // Aggregate compliance data
  const complianceIssues: any[] = [];
  let complianceTotal = 0;
  let complianceCount = 0;

  for (const session of sessions || []) {
    if (session.feedback?.complianceScore !== undefined) {
      complianceTotal += session.feedback.complianceScore;
      complianceCount++;
    }
    if (session.feedback?.complianceIssues) {
      complianceIssues.push(...session.feedback.complianceIssues);
    }
  }

  const complianceScore = complianceCount > 0 ? Math.round(complianceTotal / complianceCount) : null;

  return {
    sessionsCount,
    drillsCount,
    totalPracticeMinutes,
    skillGrades,
    skillChanges: {}, // Would need previous week data
    complianceScore,
    complianceIssues: complianceIssues.slice(0, 10),
    streakDays: progress?.current_streak || 0,
    xpEarned: xpFromSessions + xpFromDrills,
    overallGrade: calculateOverallGrade(skillGrades),
  };
}

async function generateCoachingInsights(
  reportData: any
): Promise<CoachingInsight[]> {
  try {
    const skills = Object.keys(reportData.skillGrades) as SkillName[];
    const weakestSkill = skills[0] || "objection_handling";
    const strongestSkill = skills[0] || "building_rapport";

    const input: WeeklyInsightsInput = {
      sessionsCount: reportData.sessionsCount,
      drillsCount: reportData.drillsCount,
      totalPracticeMinutes: reportData.totalPracticeMinutes,
      skillGrades: reportData.skillGrades,
      skillChanges: reportData.skillChanges,
      complianceScore: reportData.complianceScore,
      complianceIssuesCount: reportData.complianceIssues?.length || 0,
      streakDays: reportData.streakDays,
      overallGrade: reportData.overallGrade,
      weakestSkill,
      strongestSkill,
      biggestImprovement: null,
      biggestDecline: null,
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: WEEKLY_INSIGHTS_SYSTEM_PROMPT },
        { role: "user", content: buildWeeklyInsightsPrompt(input) },
      ],
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : parsed.insights || [];
  } catch (error) {
    console.error("Error generating insights:", error);
    return [];
  }
}

async function sendWeeklyEmail(
  user: { email: string; full_name: string | null },
  report: any,
  weekStart: string,
  weekEnd: string
): Promise<boolean> {
  try {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };

    const weekRange = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    const firstName = user.full_name?.split(" ")[0] || "Agent";

    // Build email HTML
    const html = buildWeeklyEmailHtml({
      firstName,
      weekRange,
      overallGrade: report.overall_grade || "N/A",
      sessionsCount: report.sessions_count,
      drillsCount: report.drills_count,
      totalMinutes: report.total_practice_minutes,
      xpEarned: report.xp_earned,
      streakDays: report.streak_days || 0,
      complianceScore: report.compliance_score,
      insights: report.coaching_insights || [],
    });

    await resend.emails.send({
      from: "RoleplayPro <reports@roleplaypro.com>",
      to: user.email,
      subject: `Your Weekly Training Report - ${weekRange}`,
      html,
    });

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

function buildWeeklyEmailHtml(data: {
  firstName: string;
  weekRange: string;
  overallGrade: string;
  sessionsCount: number;
  drillsCount: number;
  totalMinutes: number;
  xpEarned: number;
  streakDays: number;
  complianceScore: number | null;
  insights: CoachingInsight[];
}): string {
  const gradeColor =
    data.overallGrade.startsWith("A") ? "#22c55e" :
    data.overallGrade.startsWith("B") ? "#3b82f6" :
    data.overallGrade.startsWith("C") ? "#eab308" :
    "#f97316";

  const topInsights = data.insights.slice(0, 3);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 20px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-radius: 12px 12px 0 0; border: 1px solid #262626;">
              <h1 style="margin: 0; color: #d4af37; font-size: 24px; font-weight: 700;">Weekly Training Report</h1>
              <p style="margin: 8px 0 0; color: #a3a3a3; font-size: 14px;">${data.weekRange}</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 20px 20px; background-color: #171717; border-left: 1px solid #262626; border-right: 1px solid #262626;">
              <p style="margin: 0; color: #e5e5e5; font-size: 16px;">Hey ${data.firstName},</p>
              <p style="margin: 12px 0 0; color: #a3a3a3; font-size: 14px;">Here's your performance summary for the week.</p>
            </td>
          </tr>

          <!-- Overall Grade -->
          <tr>
            <td style="padding: 20px; background-color: #171717; border-left: 1px solid #262626; border-right: 1px solid #262626; text-align: center;">
              <div style="display: inline-block; padding: 20px 40px; background-color: #1a1a1a; border-radius: 12px; border: 2px solid ${gradeColor};">
                <p style="margin: 0; color: #a3a3a3; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Overall Grade</p>
                <p style="margin: 8px 0 0; color: ${gradeColor}; font-size: 48px; font-weight: 700;">${data.overallGrade}</p>
              </div>
            </td>
          </tr>

          <!-- Stats Grid -->
          <tr>
            <td style="padding: 20px; background-color: #171717; border-left: 1px solid #262626; border-right: 1px solid #262626;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 25%; padding: 12px; text-align: center; background-color: #1a1a1a; border-radius: 8px;">
                    <p style="margin: 0; color: #3b82f6; font-size: 24px; font-weight: 700;">${data.sessionsCount}</p>
                    <p style="margin: 4px 0 0; color: #a3a3a3; font-size: 11px;">Sessions</p>
                  </td>
                  <td style="width: 8px;"></td>
                  <td style="width: 25%; padding: 12px; text-align: center; background-color: #1a1a1a; border-radius: 8px;">
                    <p style="margin: 0; color: #8b5cf6; font-size: 24px; font-weight: 700;">${data.totalMinutes}</p>
                    <p style="margin: 4px 0 0; color: #a3a3a3; font-size: 11px;">Minutes</p>
                  </td>
                  <td style="width: 8px;"></td>
                  <td style="width: 25%; padding: 12px; text-align: center; background-color: #1a1a1a; border-radius: 8px;">
                    <p style="margin: 0; color: #d4af37; font-size: 24px; font-weight: 700;">+${data.xpEarned}</p>
                    <p style="margin: 4px 0 0; color: #a3a3a3; font-size: 11px;">XP</p>
                  </td>
                  <td style="width: 8px;"></td>
                  <td style="width: 25%; padding: 12px; text-align: center; background-color: #1a1a1a; border-radius: 8px;">
                    <p style="margin: 0; color: #f97316; font-size: 24px; font-weight: 700;">${data.streakDays}</p>
                    <p style="margin: 4px 0 0; color: #a3a3a3; font-size: 11px;">Day Streak</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Coaching Insights -->
          ${topInsights.length > 0 ? `
          <tr>
            <td style="padding: 20px; background-color: #171717; border-left: 1px solid #262626; border-right: 1px solid #262626;">
              <h2 style="margin: 0 0 16px; color: #e5e5e5; font-size: 18px; font-weight: 600;">Coaching Insights</h2>
              ${topInsights.map(insight => `
              <div style="padding: 16px; background-color: #1a1a1a; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #d4af37;">
                <p style="margin: 0; color: #e5e5e5; font-size: 14px; font-weight: 600;">${insight.title}</p>
                <p style="margin: 8px 0; color: #a3a3a3; font-size: 13px;">${insight.content}</p>
                <p style="margin: 0; color: #d4af37; font-size: 12px;">→ ${insight.actionItem}</p>
              </div>
              `).join('')}
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td style="padding: 30px 20px; background-color: #171717; border-left: 1px solid #262626; border-right: 1px solid #262626; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/progress/weekly" style="display: inline-block; padding: 14px 32px; background-color: #d4af37; color: #0a0a0a; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px;">View Full Report</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background-color: #0a0a0a; border-radius: 0 0 12px 12px; border: 1px solid #262626; border-top: none; text-align: center;">
              <p style="margin: 0; color: #525252; font-size: 12px;">RoleplayPro - AI Sales Training</p>
              <p style="margin: 8px 0 0; color: #525252; font-size: 11px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #525252;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function calculateOverallGrade(skillGrades: Record<string, any>): string | null {
  const gradePoints: Record<string, number> = {
    "A+": 4.3, A: 4.0, "A-": 3.7,
    "B+": 3.3, B: 3.0, "B-": 2.7,
    "C+": 2.3, C: 2.0, "C-": 1.7,
    "D+": 1.3, D: 1.0, "D-": 0.7,
    F: 0,
  };

  const grades = Object.values(skillGrades);
  if (grades.length === 0) return null;

  const totalPoints = grades.reduce((sum, data) => {
    const grade =
      typeof data === "object" && data?.grade
        ? data.grade
        : typeof data === "string"
        ? data
        : "C";
    return sum + (gradePoints[grade] ?? 2.0);
  }, 0);

  const avgPoints = totalPoints / grades.length;

  if (avgPoints >= 4.0) return "A";
  if (avgPoints >= 3.7) return "A-";
  if (avgPoints >= 3.3) return "B+";
  if (avgPoints >= 3.0) return "B";
  if (avgPoints >= 2.7) return "B-";
  if (avgPoints >= 2.3) return "C+";
  if (avgPoints >= 2.0) return "C";
  if (avgPoints >= 1.7) return "C-";
  if (avgPoints >= 1.3) return "D+";
  if (avgPoints >= 1.0) return "D";
  return "F";
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
