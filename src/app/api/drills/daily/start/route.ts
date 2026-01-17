import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DailyDrillStartResponse } from "@/types/gamification";
import { buildDrillBuyerPrompt } from "@/lib/prompts/drillBuyerPrompt";

async function safeJson(req: Request) {
  try {
    const text = await req.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await safeJson(request);
    const objectionId =
      body?.objectionId ??
      body?.objectionID ??
      body?.objection_id ??
      null;

    if (!objectionId || typeof objectionId !== "string") {
      return NextResponse.json({ error: "objectionId (string) is required" }, { status: 400 });
    }

    const { data: objection, error: fetchError } = await supabase
      .from("daily_objections")
      .select("*")
      .eq("id", objectionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !objection) {
      return NextResponse.json({ error: "Objection not found" }, { status: 404 });
    }

    if (objection.completed) {
      return NextResponse.json({ error: "This drill has already been completed" }, { status: 400 });
    }

    // Custom avatar image URL
    const avatarImageUrl = "/avatars/default-buyer.svg";

    const { data: session, error: sessionError } = await supabase
      .from("training_sessions")
      .insert({
        user_id: user.id,
        session_type: "drill",
        difficulty: objection.difficulty,
        duration_minutes: 5,
        is_drill: true,
        drill_type: "daily_objection",
        analysis_status: "pending",
        transcript: [],
        coach_suggestions: [],
        session_phases: ["objection_handling"],
        buyer_profile: objection.buyer_scenario
          ? {
              personality: objection.buyer_scenario.personality,
              experienceLevel: "mixed",
              emotionalState: objection.buyer_scenario.emotionalState,
              financialComfort: "unclear",
              resistanceLevel: objection.buyer_scenario.resistanceLevel,
              questionDepth: "mixed",
            }
          : null,
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error("Error creating drill session:", sessionError);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    const { error: updErr } = await supabase
      .from("daily_objections")
      .update({ drill_session_id: session.id })
      .eq("id", objectionId)
      .eq("user_id", user.id);

    if (updErr) console.warn("Failed to update drill_session_id:", updErr);

    const buyerSystemPrompt = buildDrillBuyerPrompt(objection);

    const response: DailyDrillStartResponse = {
      sessionId: session.id,
      avatarImageUrl,
      buyerSystemPrompt,
      objection: {
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
        drillSessionId: session.id,
        score: objection.score,
        feedback: objection.feedback,
        xpEarned: objection.xp_earned || 0,
        createdAt: objection.created_at,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in POST /api/drills/daily/start:", error);
    return NextResponse.json({ error: "Failed to start drill session" }, { status: 500 });
  }
}
