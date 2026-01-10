import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSONCompletion } from "@/lib/ai/openai";
import {
  OBJECTION_GENERATION_SYSTEM_PROMPT,
  buildObjectionGenerationPrompt,
} from "@/lib/ai/prompts/daily-objection";
import type { DailyObjection, SkillName } from "@/types/gamification";

interface GeneratedObjection {
  objection_text: string;
  objection_category: string;
  context: string;
  buyer_scenario: {
    name: string;
    personality: string;
    situation: string;
    emotionalState: string;
    resistanceLevel: "low" | "medium" | "high";
  };
  tips: string[];
  ideal_response_framework: string;
}

// POST /api/drills/daily/generate - Generate today's objection for the user
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if objection already exists for today
    const { data: existing } = await supabase
      .from("daily_objections")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Objection already generated for today", objectionId: existing.id },
        { status: 400 }
      );
    }

    // Get user's progress and skill grades
    const { data: progress } = await supabase
      .from("user_progress")
      .select("skill_grades, total_sessions")
      .eq("user_id", user.id)
      .single();

    const skillGrades = (progress?.skill_grades as Record<string, { grade: string; trend?: string }>) || {};
    const totalSessions = progress?.total_sessions || 0;

    // Determine user experience level
    let userExperienceLevel: "new" | "intermediate" | "experienced" = "new";
    if (totalSessions >= 50) userExperienceLevel = "experienced";
    else if (totalSessions >= 10) userExperienceLevel = "intermediate";

    // Find the weakest skill
    const targetSkill = findWeakestSkill(skillGrades);

    // Determine difficulty based on skill grade
    const skillGrade = skillGrades[targetSkill]?.grade || "C";
    const difficulty = determineDifficulty(skillGrade, userExperienceLevel);

    // Get recent objections to avoid repetition
    const { data: recentObjections } = await supabase
      .from("daily_objections")
      .select("objection_text")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(7);

    const recentObjectionTexts = recentObjections?.map((o) => o.objection_text) || [];

    // Generate the objection using AI
    const prompt = buildObjectionGenerationPrompt({
      targetSkill,
      difficulty,
      skillGrades,
      recentObjections: recentObjectionTexts,
      userExperienceLevel,
    });

    const generated = await generateJSONCompletion<GeneratedObjection>(
      [
        { role: "system", content: OBJECTION_GENERATION_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      { model: "gpt-4o", temperature: 0.8, maxTokens: 1000 }
    );

    // Insert the new objection
    const { data: objection, error: insertError } = await supabase
      .from("daily_objections")
      .insert({
        user_id: user.id,
        date: today,
        objection_text: generated.objection_text,
        objection_category: generated.objection_category,
        difficulty,
        target_skill: targetSkill,
        tips: generated.tips,
        context: generated.context,
        buyer_scenario: generated.buyer_scenario,
        completed: false,
        xp_earned: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting daily objection:", insertError);
      return NextResponse.json(
        { error: "Failed to save generated objection" },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const transformedObjection: DailyObjection = {
      id: objection.id,
      userId: objection.user_id,
      date: objection.date,
      objectionText: objection.objection_text,
      objectionCategory: objection.objection_category,
      difficulty: objection.difficulty,
      targetSkill: objection.target_skill,
      tips: objection.tips || [],
      context: objection.context,
      buyerScenario: objection.buyer_scenario,
      completed: objection.completed,
      completedAt: objection.completed_at,
      drillSessionId: objection.drill_session_id,
      score: objection.score,
      feedback: objection.feedback,
      xpEarned: objection.xp_earned || 0,
      createdAt: objection.created_at,
    };

    return NextResponse.json({ objection: transformedObjection });
  } catch (error) {
    console.error("Error in POST /api/drills/daily/generate:", error);
    return NextResponse.json(
      { error: "Failed to generate daily objection" },
      { status: 500 }
    );
  }
}

// Helper: Find the weakest skill based on grades
function findWeakestSkill(
  skillGrades: Record<string, { grade: string; trend?: string }>
): SkillName {
  const skills: SkillName[] = [
    "building_rapport",
    "money_questions",
    "deep_questions",
    "frame_control",
    "objection_handling",
    "closing",
    "compliance",
  ];

  const gradeToPoints: Record<string, number> = {
    "A+": 12, "A": 11, "A-": 10,
    "B+": 9, "B": 8, "B-": 7,
    "C+": 6, "C": 5, "C-": 4,
    "D": 2, "F": 0,
  };

  let weakestSkill: SkillName = "objection_handling"; // Default
  let lowestPoints = Infinity;

  for (const skill of skills) {
    const grade = skillGrades[skill]?.grade || "C";
    const points = gradeToPoints[grade] ?? 5;

    // Prioritize declining skills
    const trend = skillGrades[skill]?.trend;
    const trendPenalty = trend === "declining" ? 2 : 0;

    const effectivePoints = points - trendPenalty;

    if (effectivePoints < lowestPoints) {
      lowestPoints = effectivePoints;
      weakestSkill = skill;
    }
  }

  return weakestSkill;
}

// Helper: Determine difficulty based on skill grade and experience
function determineDifficulty(
  skillGrade: string,
  userExperience: "new" | "intermediate" | "experienced"
): "beginner" | "intermediate" | "advanced" {
  const gradeToPoints: Record<string, number> = {
    "A+": 12, "A": 11, "A-": 10,
    "B+": 9, "B": 8, "B-": 7,
    "C+": 6, "C": 5, "C-": 4,
    "D": 2, "F": 0,
  };

  const points = gradeToPoints[skillGrade] ?? 5;

  // New users get easier drills
  if (userExperience === "new") {
    return "beginner";
  }

  // Experienced users with good grades get harder drills
  if (userExperience === "experienced" && points >= 8) {
    return "advanced";
  }

  // Intermediate difficulty for middle ground
  if (points >= 6) {
    return "intermediate";
  }

  return "beginner";
}
