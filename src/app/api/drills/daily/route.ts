import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DailyObjection } from "@/types/gamification";

// GET /api/drills/daily - Get today's objection for the user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Fetch today's objection
    const { data: objection, error: fetchError } = await supabase
      .from("daily_objections")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error fetching daily objection:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch daily objection" },
        { status: 500 }
      );
    }

    if (!objection) {
      // No objection for today - client should call generate endpoint
      return NextResponse.json({
        objection: null,
        needsGeneration: true,
        message: "No objection generated for today. Call POST /api/drills/daily/generate",
      });
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

    return NextResponse.json({
      objection: transformedObjection,
      needsGeneration: false,
    });
  } catch (error) {
    console.error("Error in GET /api/drills/daily:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
