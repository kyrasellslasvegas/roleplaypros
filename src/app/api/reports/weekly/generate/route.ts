import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import openai from "@/lib/ai/openai";
import {
  WEEKLY_INSIGHTS_SYSTEM_PROMPT,
  buildWeeklyInsightsPrompt,
  type WeeklyInsightsInput,
} from "@/lib/ai/prompts/weekly-insights";
import type { SkillName, SkillChange, CoachingInsight } from "@/types/gamification";

// POST /api/reports/weekly/generate - Generate weekly report with AI insights
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const weekStart = body.weekStart || getLastWeekMonday();

    // Check if report already exists
    const { data: existingReport } = await supabase
      .from("weekly_reports")
      .select("id")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .single();

    if (existingReport && !body.force) {
      return NextResponse.json(
        { error: "Report already exists for this week", reportId: existingReport.id },
        { status: 409 }
      );
    }

    // Calculate week boundaries
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    // Fetch sessions for the week
    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("*, feedback")
      .eq("user_id", user.id)
      .gte("created_at", weekStart)
      .lte("created_at", weekEndStr + "T23:59:59");

    // Fetch drills for the week
    const { data: drills } = await supabase
      .from("daily_objections")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", weekStart)
      .lte("date", weekEndStr)
      .eq("completed", true);

    // Fetch current and previous user progress
    const { data: currentProgress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Get previous week's report for comparison
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const { data: prevReport } = await supabase
      .from("weekly_reports")
      .select("skill_grades")
      .eq("user_id", user.id)
      .eq("week_start", prevWeekStart.toISOString().split("T")[0])
      .single();

    // Calculate metrics
    const sessionsCount = sessions?.length || 0;
    const drillsCount = drills?.length || 0;
    const totalPracticeMinutes = sessions?.reduce(
      (sum: number, s: any) => sum + Math.floor((s.actual_duration_seconds || 0) / 60),
      0
    ) || 0;

    // Aggregate skill grades from this week's sessions
    const skillGrades = aggregateSkillGrades(sessions || [], currentProgress?.skill_grades);

    // Calculate skill changes from previous week
    const skillChanges = calculateSkillChanges(
      skillGrades,
      prevReport?.skill_grades || {}
    );

    // Calculate XP earned
    const xpFromSessions = sessions?.reduce(
      (sum: number, s: any) => sum + (s.xp_earned || 0),
      0
    ) || 0;
    const xpFromDrills = drills?.reduce(
      (sum: number, d: any) => sum + (d.xp_earned || 0),
      0
    ) || 0;
    const xpEarned = xpFromSessions + xpFromDrills;

    // Calculate compliance
    const complianceData = calculateComplianceMetrics(sessions || []);

    // Calculate overall grade
    const overallGrade = calculateOverallGrade(skillGrades);

    // Find weakest/strongest skills and changes
    const { weakestSkill, strongestSkill, biggestImprovement, biggestDecline } =
      analyzeSkills(skillGrades, skillChanges);

    // Generate AI coaching insights
    const insightsInput: WeeklyInsightsInput = {
      sessionsCount,
      drillsCount,
      totalPracticeMinutes,
      skillGrades,
      skillChanges,
      complianceScore: complianceData.score,
      complianceIssuesCount: complianceData.issuesCount,
      streakDays: currentProgress?.current_streak || 0,
      overallGrade,
      weakestSkill,
      strongestSkill,
      biggestImprovement,
      biggestDecline,
    };

    const coachingInsights = await generateCoachingInsights(insightsInput);

    // Create or update the report
    const reportData = {
      user_id: user.id,
      week_start: weekStart,
      week_end: weekEndStr,
      sessions_count: sessionsCount,
      drills_count: drillsCount,
      total_practice_minutes: totalPracticeMinutes,
      skill_grades: skillGrades,
      skill_changes: skillChanges,
      compliance_score: complianceData.score,
      compliance_issues: complianceData.issues,
      coaching_insights: coachingInsights,
      streak_days: currentProgress?.current_streak || 0,
      xp_earned: xpEarned,
      overall_grade: overallGrade,
      email_sent: false,
    };

    let reportId: string;

    if (existingReport) {
      // Update existing report
      const { error: updateError } = await supabase
        .from("weekly_reports")
        .update(reportData)
        .eq("id", existingReport.id);

      if (updateError) {
        console.error("Error updating report:", updateError);
        return NextResponse.json(
          { error: "Failed to update report" },
          { status: 500 }
        );
      }
      reportId = existingReport.id;
    } else {
      // Insert new report
      const { data: newReport, error: insertError } = await supabase
        .from("weekly_reports")
        .insert(reportData)
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating report:", insertError);
        return NextResponse.json(
          { error: "Failed to create report" },
          { status: 500 }
        );
      }
      reportId = newReport.id;
    }

    return NextResponse.json({
      success: true,
      reportId,
      summary: {
        sessionsCount,
        drillsCount,
        totalPracticeMinutes,
        overallGrade,
        xpEarned,
        insightsCount: coachingInsights.length,
      },
    });
  } catch (error) {
    console.error("Error generating weekly report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getLastWeekMonday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);
  return monday.toISOString().split("T")[0];
}

function aggregateSkillGrades(
  sessions: any[],
  currentGrades: Record<string, any> | null
): Record<SkillName, string> {
  const defaultGrades: Record<SkillName, string> = {
    building_rapport: "C",
    money_questions: "C",
    deep_questions: "C",
    frame_control: "C",
    objection_handling: "C",
    closing: "C",
    compliance: "C",
  };

  if (!sessions.length && !currentGrades) {
    return defaultGrades;
  }

  // If we have current grades from user progress, use those as base
  if (currentGrades) {
    const grades = { ...defaultGrades };
    for (const [skill, data] of Object.entries(currentGrades)) {
      if (typeof data === "object" && data !== null && "grade" in data) {
        grades[skill as SkillName] = data.grade;
      } else if (typeof data === "string") {
        grades[skill as SkillName] = data;
      }
    }
    return grades;
  }

  // Aggregate from sessions
  const skillScores: Record<SkillName, number[]> = {
    building_rapport: [],
    money_questions: [],
    deep_questions: [],
    frame_control: [],
    objection_handling: [],
    closing: [],
    compliance: [],
  };

  for (const session of sessions) {
    if (!session.feedback?.skillGrades) continue;

    for (const [skill, data] of Object.entries(session.feedback.skillGrades)) {
      if (skillScores[skill as SkillName]) {
        const score = typeof data === "object" && data !== null && "score" in data
          ? (data as any).score
          : gradeToScore(typeof data === "string" ? data : "C");
        skillScores[skill as SkillName].push(score);
      }
    }
  }

  const grades = { ...defaultGrades };
  for (const [skill, scores] of Object.entries(skillScores)) {
    if (scores.length > 0) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      grades[skill as SkillName] = scoreToGrade(avgScore);
    }
  }

  return grades;
}

function calculateSkillChanges(
  current: Record<SkillName, string>,
  previous: Record<string, any>
): Record<SkillName, SkillChange> {
  const changes: Record<SkillName, SkillChange> = {} as Record<SkillName, SkillChange>;

  for (const skill of Object.keys(current) as SkillName[]) {
    const currentGrade = current[skill];
    const prevData = previous[skill];
    const prevGrade = typeof prevData === "object" && prevData !== null && "grade" in prevData
      ? prevData.grade
      : typeof prevData === "string"
      ? prevData
      : null;

    const currentPoints = gradeToScore(currentGrade);
    const prevPoints = prevGrade ? gradeToScore(prevGrade) : currentPoints;
    const pointsChange = currentPoints - prevPoints;

    changes[skill] = {
      previous: prevGrade,
      current: currentGrade,
      trend: pointsChange > 0 ? "improving" : pointsChange < 0 ? "declining" : "stable",
      pointsChange,
    };
  }

  return changes;
}

function calculateComplianceMetrics(sessions: any[]): {
  score: number | null;
  issuesCount: number;
  issues: any[];
} {
  if (!sessions.length) {
    return { score: null, issuesCount: 0, issues: [] };
  }

  const allIssues: any[] = [];
  let totalScore = 0;
  let scoredSessions = 0;

  for (const session of sessions) {
    if (session.feedback?.complianceScore !== undefined) {
      totalScore += session.feedback.complianceScore;
      scoredSessions++;
    }
    if (session.feedback?.complianceIssues) {
      allIssues.push(...session.feedback.complianceIssues);
    }
  }

  return {
    score: scoredSessions > 0 ? Math.round(totalScore / scoredSessions) : null,
    issuesCount: allIssues.length,
    issues: allIssues.slice(0, 10), // Keep top 10 issues
  };
}

function calculateOverallGrade(skillGrades: Record<string, string>): string | null {
  const grades = Object.values(skillGrades);
  if (grades.length === 0) return null;

  const totalPoints = grades.reduce((sum, grade) => sum + gradeToScore(grade), 0);
  const avgPoints = totalPoints / grades.length;

  return scoreToGrade(avgPoints);
}

function analyzeSkills(
  skillGrades: Record<SkillName, string>,
  skillChanges: Record<SkillName, SkillChange>
): {
  weakestSkill: SkillName;
  strongestSkill: SkillName;
  biggestImprovement: SkillName | null;
  biggestDecline: SkillName | null;
} {
  const skills = Object.keys(skillGrades) as SkillName[];

  // Find weakest and strongest
  let weakestSkill = skills[0];
  let strongestSkill = skills[0];
  let weakestScore = gradeToScore(skillGrades[weakestSkill]);
  let strongestScore = weakestScore;

  for (const skill of skills) {
    const score = gradeToScore(skillGrades[skill]);
    if (score < weakestScore) {
      weakestScore = score;
      weakestSkill = skill;
    }
    if (score > strongestScore) {
      strongestScore = score;
      strongestSkill = skill;
    }
  }

  // Find biggest improvement and decline
  let biggestImprovement: SkillName | null = null;
  let biggestDecline: SkillName | null = null;
  let maxImprovement = 0;
  let maxDecline = 0;

  for (const skill of skills) {
    const change = skillChanges[skill]?.pointsChange || 0;
    if (change > maxImprovement) {
      maxImprovement = change;
      biggestImprovement = skill;
    }
    if (change < maxDecline) {
      maxDecline = change;
      biggestDecline = skill;
    }
  }

  return { weakestSkill, strongestSkill, biggestImprovement, biggestDecline };
}

async function generateCoachingInsights(
  input: WeeklyInsightsInput
): Promise<CoachingInsight[]> {
  try {
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
    if (!content) {
      return getDefaultInsights();
    }

    const parsed = JSON.parse(content);
    const insights = Array.isArray(parsed) ? parsed : parsed.insights || [];

    return insights.map((insight: any) => ({
      hookCategory: insight.hookCategory || "curiosity",
      title: insight.title || "Keep Improving",
      content: insight.content || "Continue practicing to see improvement.",
      actionItem: insight.actionItem || "Complete one session this week.",
      priority: insight.priority || 3,
    }));
  } catch (error) {
    console.error("Error generating coaching insights:", error);
    return getDefaultInsights();
  }
}

function getDefaultInsights(): CoachingInsight[] {
  return [
    {
      hookCategory: "curiosity",
      title: "Track Your Progress",
      content: "Complete more sessions this week to unlock personalized coaching insights based on your performance.",
      actionItem: "Start with a daily drill to build momentum.",
      priority: 1,
    },
  ];
}

function gradeToScore(grade: string): number {
  const scores: Record<string, number> = {
    "A+": 97, A: 93, "A-": 90,
    "B+": 87, B: 83, "B-": 80,
    "C+": 77, C: 73, "C-": 70,
    "D+": 67, D: 63, "D-": 60,
    F: 50,
  };
  return scores[grade] || 73;
}

function scoreToGrade(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D-";
  return "F";
}
