import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { WeeklyReport, SkillName, SkillChange } from "@/types/gamification";

// GET /api/reports/weekly - Get weekly report for current or specified week
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get week parameter or default to current week
    const searchParams = request.nextUrl.searchParams;
    const weekParam = searchParams.get("week");

    let weekStart: string;
    if (weekParam) {
      weekStart = weekParam;
    } else {
      // Get current week's Monday
      const today = new Date();
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      weekStart = monday.toISOString().split("T")[0];
    }

    // Fetch the weekly report
    const { data: report, error: reportError } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .single();

    if (reportError && reportError.code !== "PGRST116") {
      console.error("Error fetching weekly report:", reportError);
      return NextResponse.json(
        { error: "Failed to fetch report" },
        { status: 500 }
      );
    }

    // If no report exists, generate one on-the-fly
    if (!report) {
      const generatedReport = await generateWeeklyReport(supabase, user.id, weekStart);
      return NextResponse.json({ report: generatedReport, generated: true });
    }

    // Transform to frontend format
    const transformedReport: WeeklyReport = {
      id: report.id,
      userId: report.user_id,
      weekStart: report.week_start,
      weekEnd: report.week_end,
      sessionsCount: report.sessions_count,
      drillsCount: report.drills_count,
      totalPracticeMinutes: report.total_practice_minutes,
      skillGrades: report.skill_grades || {},
      skillChanges: report.skill_changes || {},
      complianceScore: report.compliance_score,
      complianceIssuesCount: report.compliance_issues?.length || 0,
      coachingInsights: report.coaching_insights || [],
      streakDays: report.streak_days,
      xpEarned: report.xp_earned,
      overallGrade: report.overall_grade,
      emailSent: report.email_sent,
      emailSentAt: report.email_sent_at,
      createdAt: report.created_at,
    };

    // Get previous week for comparison
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekStartStr = prevWeekStart.toISOString().split("T")[0];

    const { data: prevReport } = await supabase
      .from("weekly_reports")
      .select("skill_grades, overall_grade, sessions_count, xp_earned")
      .eq("user_id", user.id)
      .eq("week_start", prevWeekStartStr)
      .single();

    return NextResponse.json({
      report: transformedReport,
      previousWeek: prevReport
        ? {
            skillGrades: prevReport.skill_grades,
            overallGrade: prevReport.overall_grade,
            sessionsCount: prevReport.sessions_count,
            xpEarned: prevReport.xp_earned,
          }
        : null,
      generated: false,
    });
  } catch (error) {
    console.error("Error in weekly report GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to generate a weekly report
async function generateWeeklyReport(
  supabase: any,
  userId: string,
  weekStart: string
): Promise<WeeklyReport> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  // Fetch sessions for the week
  const { data: sessions } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", weekStart)
    .lte("created_at", weekEndStr + "T23:59:59")
    .order("created_at", { ascending: false });

  // Fetch drills for the week
  const { data: drills } = await supabase
    .from("daily_objections")
    .select("*")
    .eq("user_id", userId)
    .gte("date", weekStart)
    .lte("date", weekEndStr)
    .eq("completed", true);

  // Fetch user progress for streak
  const { data: progress } = await supabase
    .from("user_progress")
    .select("current_streak, skill_grades")
    .eq("user_id", userId)
    .single();

  // Calculate totals
  const sessionsCount = sessions?.length || 0;
  const drillsCount = drills?.length || 0;
  const totalPracticeMinutes = sessions?.reduce(
    (sum: number, s: any) => sum + Math.floor((s.actual_duration_seconds || 0) / 60),
    0
  ) || 0;

  // Get skill grades from most recent session or progress
  const skillGrades: Record<SkillName, string> = progress?.skill_grades || {};

  // Calculate XP earned this week
  const xpFromSessions = sessions?.reduce(
    (sum: number, s: any) => sum + (s.xp_earned || 0),
    0
  ) || 0;
  const xpFromDrills = drills?.reduce(
    (sum: number, d: any) => sum + (d.xp_earned || 0),
    0
  ) || 0;
  const xpEarned = xpFromSessions + xpFromDrills;

  // Calculate overall grade
  const overallGrade = calculateOverallGrade(skillGrades);

  // Build report object
  const report: WeeklyReport = {
    id: `temp-${userId}-${weekStart}`,
    userId,
    weekStart,
    weekEnd: weekEndStr,
    sessionsCount,
    drillsCount,
    totalPracticeMinutes,
    skillGrades,
    skillChanges: {},
    complianceScore: null,
    complianceIssuesCount: 0,
    coachingInsights: [],
    streakDays: progress?.current_streak || 0,
    xpEarned,
    overallGrade,
    emailSent: false,
    emailSentAt: null,
    createdAt: new Date().toISOString(),
  };

  return report;
}

function calculateOverallGrade(skillGrades: Record<string, string>): string | null {
  const gradePoints: Record<string, number> = {
    "A+": 4.3, A: 4.0, "A-": 3.7,
    "B+": 3.3, B: 3.0, "B-": 2.7,
    "C+": 2.3, C: 2.0, "C-": 1.7,
    "D+": 1.3, D: 1.0, "D-": 0.7,
    F: 0,
  };

  const grades = Object.values(skillGrades);
  if (grades.length === 0) return null;

  const totalPoints = grades.reduce((sum, grade) => {
    return sum + (gradePoints[grade] || 0);
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
  if (avgPoints >= 0.7) return "D-";
  return "F";
}
