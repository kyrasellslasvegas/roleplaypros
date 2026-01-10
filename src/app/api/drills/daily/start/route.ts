import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DailyDrillStartResponse } from "@/types/gamification";

// POST /api/drills/daily/start - Start a daily drill session
export async function POST(request: Request) {
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
    const { objectionId } = body;

    if (!objectionId) {
      return NextResponse.json(
        { error: "Objection ID is required" },
        { status: 400 }
      );
    }

    // Fetch the objection
    const { data: objection, error: fetchError } = await supabase
      .from("daily_objections")
      .select("*")
      .eq("id", objectionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !objection) {
      return NextResponse.json(
        { error: "Objection not found" },
        { status: 404 }
      );
    }

    if (objection.completed) {
      return NextResponse.json(
        { error: "This drill has already been completed" },
        { status: 400 }
      );
    }

    // Get HeyGen token
    const heygenToken = await getHeygenToken();

    if (!heygenToken) {
      return NextResponse.json(
        { error: "Failed to get avatar token" },
        { status: 500 }
      );
    }

    // Create a training session record for this drill
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

    if (sessionError) {
      console.error("Error creating drill session:", sessionError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    // Update the objection with the session ID
    await supabase
      .from("daily_objections")
      .update({ drill_session_id: session.id })
      .eq("id", objectionId);

    // Build the buyer system prompt for the drill
    const buyerSystemPrompt = buildDrillBuyerPrompt(objection);

    const response: DailyDrillStartResponse = {
      sessionId: session.id,
      heygenToken,
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
    return NextResponse.json(
      { error: "Failed to start drill session" },
      { status: 500 }
    );
  }
}

// Get HeyGen streaming token
async function getHeygenToken(): Promise<string | null> {
  try {
    const response = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.HEYGEN_API_KEY || "",
      },
    });

    if (!response.ok) {
      console.error("HeyGen token error:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.data?.token || null;
  } catch (error) {
    console.error("Error getting HeyGen token:", error);
    return null;
  }
}

// Build the buyer system prompt for the drill
function buildDrillBuyerPrompt(objection: {
  objection_text: string;
  objection_category: string;
  context: string | null;
  buyer_scenario: {
    name: string;
    personality: string;
    situation: string;
    emotionalState: string;
    resistanceLevel: string;
  } | null;
  target_skill: string;
  difficulty: string;
}): string {
  const scenario = objection.buyer_scenario;

  return `You are roleplaying as a potential home buyer in a real estate training drill.

## Your Character
Name: ${scenario?.name || "Alex"}
Personality: ${scenario?.personality || "cautious"}
Situation: ${scenario?.situation || "Looking to buy a home"}
Current Emotional State: ${scenario?.emotionalState || "uncertain"}
Resistance Level: ${scenario?.resistanceLevel || "medium"}

## Context
${objection.context || "You are meeting with a real estate agent for the first time."}

## Your Objection
You have this concern that you need to voice: "${objection.objection_text}"

## How to Behave
1. Start by stating your objection naturally, as if it just came up in conversation
2. Listen to the agent's response
3. React authentically based on your personality:
   - If they address your concern well, show some openness
   - If they dismiss or ignore your concern, become more resistant
   - If they ask good questions, engage and share more
4. Keep your responses conversational and realistic
5. This is a 5-minute drill, so keep responses relatively brief

## Resistance Guidelines (${scenario?.resistanceLevel || "medium"})
${getResistanceGuidelines(scenario?.resistanceLevel || "medium")}

## Important
- Stay in character throughout the conversation
- Your objection is genuine - don't give in too easily
- But if the agent handles it skillfully, acknowledge that
- Be a fair but challenging practice partner

Start the conversation by presenting your objection in a natural way.`;
}

function getResistanceGuidelines(level: string): string {
  switch (level) {
    case "low":
      return `- You're open to being convinced with good reasoning
- Ask clarifying questions when confused
- Show appreciation for helpful answers
- One or two follow-up concerns, then willing to move forward`;
    case "high":
      return `- You're skeptical and need strong convincing
- Challenge weak arguments
- Bring up additional concerns
- Need to feel truly heard before softening
- Don't give in easily - make them work for it`;
    default: // medium
      return `- You have genuine concerns but are open-minded
- Push back on surface-level answers
- Appreciate when they dig deeper
- Will soften if they truly address your underlying worry`;
  }
}
