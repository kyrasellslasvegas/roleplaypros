import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import openai from "@/lib/ai/openai";
import {
  OBJECTION_GENERATION_SYSTEM_PROMPT,
  buildObjectionGenerationPrompt,
} from "@/lib/ai/prompts/daily-objection";
import type { SkillName } from "@/types/gamification";

// This route is called by Vercel Cron at midnight to generate daily objections
// Add to vercel.json: { "crons": [{ "path": "/api/cron/daily-objections", "schedule": "0 0 * * *" }] }

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create service role client for admin operations
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

    const today = new Date().toISOString().split("T")[0];

    // Get all active users who need objections generated
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id")
      .eq("subscription_status", "active");

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: "No active users", generated: 0 });
    }

    let generated = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      try {
        // Check if objection already exists for today
        const { data: existingObjection } = await supabase
          .from("daily_objections")
          .select("id")
          .eq("user_id", user.id)
          .eq("date", today)
          .single();

        if (existingObjection) {
          skipped++;
          continue;
        }

        // Get user's skill grades and progress
        const { data: progress } = await supabase
          .from("user_progress")
          .select("skill_grades")
          .eq("user_id", user.id)
          .single();

        // Get recent objections to avoid repetition
        const { data: recentObjections } = await supabase
          .from("daily_objections")
          .select("objection_text")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(7);

        // Find weakest skill
        const skillGrades = progress?.skill_grades || {};
        const weakestSkill = findWeakestSkill(skillGrades);

        // Determine difficulty based on user's overall performance
        const difficulty = determineDifficulty(skillGrades);

        // Extract just the objection texts as strings
        const recentObjectionTexts = (recentObjections || []).map(
          (o: { objection_text: string }) => o.objection_text
        );

        // Generate objection using AI
        const prompt = buildObjectionGenerationPrompt({
          skillGrades,
          recentObjections: recentObjectionTexts,
          targetSkill: weakestSkill,
          difficulty,
          userExperienceLevel: "intermediate",
        });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: OBJECTION_GENERATION_SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.9,
          max_tokens: 800,
          response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          failed++;
          continue;
        }

        const objectionData = JSON.parse(content);

        // Insert the new objection
        const { error: insertError } = await supabase
          .from("daily_objections")
          .insert({
            user_id: user.id,
            date: today,
            objection_text: objectionData.objectionText,
            objection_category: objectionData.category || "general",
            difficulty,
            target_skill: weakestSkill,
            tips: objectionData.tips || [],
            context: objectionData.context || null,
            buyer_scenario: objectionData.buyerScenario || null,
          });

        if (insertError) {
          console.error(`Error creating objection for user ${user.id}:`, insertError);
          failed++;
        } else {
          generated++;
        }
      } catch (err) {
        console.error(`Error processing user ${user.id}:`, err);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      stats: {
        total: users.length,
        generated,
        skipped,
        failed,
      },
    });
  } catch (error) {
    console.error("Error in daily objections cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function findWeakestSkill(skillGrades: Record<string, any>): SkillName {
  const gradePoints: Record<string, number> = {
    "A+": 4.3, A: 4.0, "A-": 3.7,
    "B+": 3.3, B: 3.0, "B-": 2.7,
    "C+": 2.3, C: 2.0, "C-": 1.7,
    "D+": 1.3, D: 1.0, "D-": 0.7,
    F: 0,
  };

  const defaultSkills: SkillName[] = [
    "objection_handling",
    "closing",
    "building_rapport",
    "money_questions",
    "deep_questions",
    "frame_control",
  ];

  let weakestSkill: SkillName = "objection_handling";
  let lowestScore = Infinity;

  for (const skill of defaultSkills) {
    const gradeData = skillGrades[skill];
    const grade =
      typeof gradeData === "object" && gradeData?.grade
        ? gradeData.grade
        : typeof gradeData === "string"
        ? gradeData
        : "C";
    const score = gradePoints[grade] ?? 2.0;

    if (score < lowestScore) {
      lowestScore = score;
      weakestSkill = skill;
    }
  }

  return weakestSkill;
}

function determineDifficulty(
  skillGrades: Record<string, any>
): "beginner" | "intermediate" | "advanced" {
  const gradePoints: Record<string, number> = {
    "A+": 4.3, A: 4.0, "A-": 3.7,
    "B+": 3.3, B: 3.0, "B-": 2.7,
    "C+": 2.3, C: 2.0, "C-": 1.7,
    "D+": 1.3, D: 1.0, "D-": 0.7,
    F: 0,
  };

  const grades = Object.values(skillGrades);
  if (grades.length === 0) return "beginner";

  const totalPoints = grades.reduce((sum, gradeData) => {
    const grade =
      typeof gradeData === "object" && gradeData?.grade
        ? gradeData.grade
        : typeof gradeData === "string"
        ? gradeData
        : "C";
    return sum + (gradePoints[grade] ?? 2.0);
  }, 0);

  const avgPoints = totalPoints / grades.length;

  if (avgPoints >= 3.3) return "advanced";
  if (avgPoints >= 2.3) return "intermediate";
  return "beginner";
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
