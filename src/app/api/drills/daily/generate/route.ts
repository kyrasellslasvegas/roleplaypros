import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSONCompletion } from "@/lib/ai/openai";
import {
  OBJECTION_GENERATION_SYSTEM_PROMPT,
  buildObjectionGenerationPrompt,
} from "@/lib/ai/prompts/daily-objection";
import type { DailyObjection, SkillName, ObjectionCategory } from "@/types/gamification";

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

// ============================================
// FALLBACK OBJECTIONS LIBRARY
// Professional, real-world objections for each skill
// ============================================

interface FallbackObjection {
  objection_text: string;
  objection_category: ObjectionCategory;
  context: string;
  buyer_scenario: {
    name: string;
    personality: string;
    situation: string;
    emotionalState: string;
    resistanceLevel: "low" | "medium" | "high";
  };
  tips: string[];
  targetSkill: SkillName;
  difficulty: "beginner" | "intermediate" | "advanced";
}

const FALLBACK_OBJECTIONS: FallbackObjection[] = [
  // =====================================================
  // FLAGSHIP OBJECTION: BAD AGENT EXPERIENCE
  // This is designed to be the most impactful first drill
  // =====================================================
  {
    objection_text: "I'm going to be honest with you. My last agent was a nightmare. She showed us houses way above our budget, never listened to what we actually wanted, and then ghosted us when we didn't make an offer fast enough. So before we go any further, I need to know - what makes you any different from her?",
    objection_category: "trust",
    context: "First consultation with a couple who had a traumatic experience with their previous real estate agent 6 months ago. They lost out on their dream home because the agent was slow to submit their offer, and then she blamed them for being 'indecisive.' They're motivated to buy but deeply skeptical of agents. The wife is present on video call while the husband is listening but off-camera.",
    buyer_scenario: {
      name: "Sarah & James",
      personality: "skeptical",
      situation: "Young professional couple, pre-approved for $550K, looking to buy their first home in the suburbs. They've been searching for 8 months total and are emotionally exhausted from the process. Sarah is the primary communicator while James occasionally chimes in with pointed questions.",
      emotionalState: "guarded and frustrated",
      resistanceLevel: "high",
    },
    tips: [
      "DON'T get defensive or badmouth their previous agent - stay professional and empathetic",
      "DO acknowledge their pain first: 'That sounds incredibly frustrating. You deserved better than that.'",
      "ASK a follow-up question to understand specifics: 'What would have made that experience better for you?'",
      "SHARE your process differences with specifics, not vague promises: 'Here's exactly how I communicate with clients...'",
      "OFFER proof points: client testimonials, your response time guarantees, or your specific process",
      "ADDRESS the ghosting concern directly: 'I never disappear on clients. Here's my commitment to you...'",
    ],
    targetSkill: "building_rapport",
    difficulty: "intermediate",
  },

  // BUILDING RAPPORT
  {
    objection_text: "Look, I've worked with agents before and it was a waste of time. They just wanted their commission. Why should I trust you?",
    objection_category: "trust",
    context: "First meeting with a buyer who had a negative experience with a previous agent who pushed them into a home they regretted.",
    buyer_scenario: {
      name: "Marcus",
      personality: "skeptical",
      situation: "Relocating for work, needs to buy within 60 days but hesitant to commit to an agent",
      emotionalState: "guarded",
      resistanceLevel: "high",
    },
    tips: [
      "Acknowledge their past experience without being defensive",
      "Ask specific questions about what went wrong to show you care",
      "Share how your process is different without making promises",
    ],
    targetSkill: "building_rapport",
    difficulty: "intermediate",
  },
  {
    objection_text: "Can we just skip the small talk and get to the listings? I'm really busy.",
    objection_category: "trust",
    context: "Phone consultation with a busy professional who wants to be efficient.",
    buyer_scenario: {
      name: "Jennifer",
      personality: "dominant",
      situation: "C-suite executive buying an investment property, values time over everything",
      emotionalState: "impatient",
      resistanceLevel: "medium",
    },
    tips: [
      "Respect their time while explaining why a few questions will save time later",
      "Reframe the conversation as efficient discovery, not small talk",
      "Offer to make the process as streamlined as possible",
    ],
    targetSkill: "building_rapport",
    difficulty: "beginner",
  },

  // MONEY QUESTIONS
  {
    objection_text: "I'd rather not discuss our budget until we see what's out there. We'll know what we can afford when we see the right house.",
    objection_category: "financing",
    context: "Initial consultation where the buyer is avoiding financial questions.",
    buyer_scenario: {
      name: "David",
      personality: "cautious",
      situation: "First-time buyer, embarrassed about their budget constraints",
      emotionalState: "uncomfortable",
      resistanceLevel: "medium",
    },
    tips: [
      "Explain how knowing the budget helps you find the RIGHT homes, not just any homes",
      "Share that budget conversations are confidential and judgment-free",
      "Offer a range approach: 'Are we looking closer to $300K or $500K?'",
    ],
    targetSkill: "money_questions",
    difficulty: "intermediate",
  },
  {
    objection_text: "We haven't talked to a lender yet. We're pre-approved though... I mean, we checked online and it said we could afford up to $600K.",
    objection_category: "financing",
    context: "Buyers who think online calculators equal pre-approval.",
    buyer_scenario: {
      name: "Ashley",
      personality: "nervous",
      situation: "Young couple excited to buy their first home but haven't done the financial prep work",
      emotionalState: "excited but naive",
      resistanceLevel: "low",
    },
    tips: [
      "Gently explain the difference between online estimates and actual pre-approval",
      "Position lender conversation as protecting them from heartbreak",
      "Offer to connect them with a trusted lender who can help",
    ],
    targetSkill: "money_questions",
    difficulty: "beginner",
  },

  // DEEP QUESTIONS
  {
    objection_text: "We just want a nice 3-bedroom in a good school district. That's all we need to know.",
    objection_category: "commitment",
    context: "Buyer giving surface-level requirements without deeper motivation.",
    buyer_scenario: {
      name: "Michael",
      personality: "distracted",
      situation: "Family of four outgrowing their current home, wife is 6 months pregnant",
      emotionalState: "overwhelmed",
      resistanceLevel: "medium",
    },
    tips: [
      "Acknowledge their stated needs, then dig deeper with 'Help me understand...'",
      "Ask about their current home frustrations to uncover must-haves",
      "Explore the timeline urgency - there's usually more to the story",
    ],
    targetSkill: "deep_questions",
    difficulty: "intermediate",
  },
  {
    objection_text: "My spouse couldn't make it today, but I can tell them everything. Let's just proceed.",
    objection_category: "commitment",
    context: "One half of a couple trying to move forward without the decision-maker present.",
    buyer_scenario: {
      name: "Robert",
      personality: "friendly",
      situation: "Husband house hunting while wife works, but wife has final say on everything",
      emotionalState: "eager to please",
      resistanceLevel: "low",
    },
    tips: [
      "Express appreciation while explaining why both parties should be involved",
      "Ask about the spouse's priorities and concerns",
      "Offer to schedule a quick call to include them before proceeding",
    ],
    targetSkill: "deep_questions",
    difficulty: "beginner",
  },

  // FRAME CONTROL
  {
    objection_text: "My brother-in-law is a contractor and he said I should never pay asking price in this market. He's going to help us negotiate.",
    objection_category: "competition",
    context: "Buyer being influenced by well-meaning but uninformed family member.",
    buyer_scenario: {
      name: "Tony",
      personality: "cautious",
      situation: "First-time buyer relying heavily on family advice, unsure who to trust",
      emotionalState: "conflicted",
      resistanceLevel: "high",
    },
    tips: [
      "Don't dismiss the brother-in-law; acknowledge family input is valuable",
      "Share current market data specific to the areas they're interested in",
      "Position yourself as the expert while respecting their support system",
    ],
    targetSkill: "frame_control",
    difficulty: "advanced",
  },
  {
    objection_text: "I've been researching online for 6 months. I probably know more about this market than most agents.",
    objection_category: "trust",
    context: "Buyer who has done extensive online research and questions your value.",
    buyer_scenario: {
      name: "Kevin",
      personality: "dominant",
      situation: "Tech professional who researches everything thoroughly, trusts data over people",
      emotionalState: "confident",
      resistanceLevel: "high",
    },
    tips: [
      "Validate their research - it shows they're serious buyers",
      "Share insights that aren't available online (off-market, agent intel)",
      "Ask what they've learned and build on it rather than contradicting",
    ],
    targetSkill: "frame_control",
    difficulty: "intermediate",
  },

  // OBJECTION HANDLING
  {
    objection_text: "Interest rates are just too high right now. We're going to wait until they come down.",
    objection_category: "timing",
    context: "Buyer using interest rates as a reason to delay.",
    buyer_scenario: {
      name: "Patricia",
      personality: "cautious",
      situation: "Empty nesters looking to downsize but scared of the financial commitment",
      emotionalState: "fearful",
      resistanceLevel: "medium",
    },
    tips: [
      "Acknowledge rates are higher than recent history",
      "Explain the 'marry the house, date the rate' concept",
      "Show the math on waiting vs. buying now with potential appreciation",
    ],
    targetSkill: "objection_handling",
    difficulty: "intermediate",
  },
  {
    objection_text: "We found a really similar house on Zillow that's $50,000 cheaper. Why is this one so expensive?",
    objection_category: "price",
    context: "Buyer comparing properties without understanding the differences.",
    buyer_scenario: {
      name: "Steve",
      personality: "skeptical",
      situation: "Budget-conscious buyer looking for the best deal possible",
      emotionalState: "frustrated",
      resistanceLevel: "medium",
    },
    tips: [
      "Ask to see the listing they found - show genuine interest",
      "Walk through the specific differences (lot size, updates, location)",
      "Help them understand what drives value in this market",
    ],
    targetSkill: "objection_handling",
    difficulty: "beginner",
  },

  // CLOSING
  {
    objection_text: "This is a big decision. We need to go home and think about it. We'll call you.",
    objection_category: "commitment",
    context: "End of showing where buyers loved the home but are hesitant to commit.",
    buyer_scenario: {
      name: "Linda",
      personality: "nervous",
      situation: "Couple who found their dream home but scared to make an offer",
      emotionalState: "excited but terrified",
      resistanceLevel: "medium",
    },
    tips: [
      "Validate that it IS a big decision - don't minimize their feelings",
      "Ask what specifically they need to think about",
      "Create urgency by sharing market activity without being pushy",
    ],
    targetSkill: "closing",
    difficulty: "intermediate",
  },
  {
    objection_text: "We want to see at least 10 more houses before we make any decisions.",
    objection_category: "commitment",
    context: "Buyer who found a great fit but wants to keep looking 'just in case.'",
    buyer_scenario: {
      name: "Brian",
      personality: "cautious",
      situation: "Analytical buyer afraid of missing out on something better",
      emotionalState: "uncertain",
      resistanceLevel: "medium",
    },
    tips: [
      "Ask what they hope to find in those 10 houses that this one doesn't have",
      "Share data on how long homes stay on market in this area",
      "Offer to keep looking while also protecting this opportunity",
    ],
    targetSkill: "closing",
    difficulty: "beginner",
  },

  // COMPLIANCE
  {
    objection_text: "Can you just tell me if this neighborhood is safe? Like, are there a lot of... you know... certain types of people?",
    objection_category: "property",
    context: "Buyer asking questions that border on fair housing violations.",
    buyer_scenario: {
      name: "Carol",
      personality: "cautious",
      situation: "Family with young children concerned about safety",
      emotionalState: "protective",
      resistanceLevel: "low",
    },
    tips: [
      "Redirect to objective resources like crime statistics websites",
      "Never characterize demographics of neighborhoods",
      "Suggest they visit at different times to get their own feel",
    ],
    targetSkill: "compliance",
    difficulty: "intermediate",
  },
  {
    objection_text: "Just between us, do you think this house will appreciate? I want to make sure it's a good investment.",
    objection_category: "market",
    context: "Buyer asking for appreciation predictions.",
    buyer_scenario: {
      name: "Richard",
      personality: "skeptical",
      situation: "Investor-minded buyer treating primary residence as investment",
      emotionalState: "analytical",
      resistanceLevel: "low",
    },
    tips: [
      "Explain you cannot predict or guarantee appreciation",
      "Share historical data for the area without making promises",
      "Redirect to what makes a property valuable long-term",
    ],
    targetSkill: "compliance",
    difficulty: "beginner",
  },
];

// ============================================
// MAIN ENDPOINT
// ============================================

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

    // Check if objection already exists for today - return it instead of error (idempotent)
    const { data: existing } = await supabase
      .from("daily_objections")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (existing) {
      // Return existing objection - makes this endpoint idempotent
      const transformedObjection: DailyObjection = {
        id: existing.id,
        userId: existing.user_id,
        date: existing.date,
        objectionText: existing.objection_text,
        objectionCategory: existing.objection_category,
        difficulty: existing.difficulty,
        targetSkill: existing.target_skill,
        tips: existing.tips || [],
        context: existing.context,
        buyerScenario: existing.buyer_scenario,
        completed: existing.completed,
        completedAt: existing.completed_at,
        drillSessionId: existing.drill_session_id,
        score: existing.score,
        feedback: existing.feedback,
        xpEarned: existing.xp_earned || 0,
        createdAt: existing.created_at,
      };
      return NextResponse.json({ objection: transformedObjection, source: "existing" });
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

    // Try to generate with AI, fall back to curated objections if needed
    let generated: GeneratedObjection;
    let source: "ai" | "fallback" = "ai";

    const isFirstDrill = recentObjectionTexts.length === 0;

    // For first drill, always use the flagship objection regardless of AI
    if (isFirstDrill) {
      console.log("First drill detected - using flagship 'bad agent experience' objection");
      generated = selectFallbackObjection(targetSkill, difficulty, recentObjectionTexts, true);
      source = "fallback";
    } else if (process.env.OPENAI_API_KEY) {
      try {
        generated = await generateWithAI(
          targetSkill,
          difficulty,
          skillGrades,
          recentObjectionTexts,
          userExperienceLevel
        );
      } catch (aiError) {
        console.warn("AI generation failed, using fallback:", aiError);
        generated = selectFallbackObjection(targetSkill, difficulty, recentObjectionTexts, false);
        source = "fallback";
      }
    } else {
      console.log("No OpenAI API key configured, using fallback objections");
      generated = selectFallbackObjection(targetSkill, difficulty, recentObjectionTexts, false);
      source = "fallback";
    }

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

    return NextResponse.json({ objection: transformedObjection, source });
  } catch (error) {
    console.error("Error in POST /api/drills/daily/generate:", error);
    return NextResponse.json(
      { error: "Failed to generate daily objection" },
      { status: 500 }
    );
  }
}

// ============================================
// AI GENERATION WITH RETRY
// ============================================

async function generateWithAI(
  targetSkill: SkillName,
  difficulty: "beginner" | "intermediate" | "advanced",
  skillGrades: Record<string, { grade: string; trend?: string }>,
  recentObjections: string[],
  userExperienceLevel: "new" | "intermediate" | "experienced"
): Promise<GeneratedObjection> {
  const prompt = buildObjectionGenerationPrompt({
    targetSkill,
    difficulty,
    skillGrades,
    recentObjections,
    userExperienceLevel,
  });

  const models = ["gpt-4o", "gpt-4o-mini"];
  let lastError: Error | null = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await generateJSONCompletion<GeneratedObjection>(
          [
            { role: "system", content: OBJECTION_GENERATION_SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          { model, temperature: 0.8, maxTokens: 1000 }
        );

        // Validate the response has required fields
        if (result.objection_text && result.buyer_scenario && result.tips) {
          return result;
        }
        throw new Error("Invalid AI response structure");
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`AI attempt ${attempt} with ${model} failed:`, lastError.message);

        // Wait before retry (exponential backoff)
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  throw lastError || new Error("All AI generation attempts failed");
}

// ============================================
// FALLBACK SELECTION
// ============================================

function selectFallbackObjection(
  targetSkill: SkillName,
  difficulty: "beginner" | "intermediate" | "advanced",
  recentObjections: string[],
  isFirstDrill: boolean = false
): GeneratedObjection {
  // For first drill, always use the flagship "bad agent experience" objection
  // This is the most impactful introduction to the drill system
  if (isFirstDrill || recentObjections.length === 0) {
    const flagship = FALLBACK_OBJECTIONS[0]; // The bad agent experience objection
    return {
      objection_text: flagship.objection_text,
      objection_category: flagship.objection_category,
      context: flagship.context,
      buyer_scenario: flagship.buyer_scenario,
      tips: flagship.tips,
      ideal_response_framework: "Acknowledge pain, ask clarifying questions, differentiate with specifics, offer proof",
    };
  }

  // Filter objections by target skill
  let candidates = FALLBACK_OBJECTIONS.filter((o) => o.targetSkill === targetSkill);

  // If no exact skill match, get objections for related skills
  if (candidates.length === 0) {
    candidates = FALLBACK_OBJECTIONS;
  }

  // Filter out recently used objections
  candidates = candidates.filter(
    (o) => !recentObjections.some((recent) =>
      recent.toLowerCase().includes(o.objection_text.toLowerCase().slice(0, 30))
    )
  );

  // If all filtered out, reset to all candidates for that skill
  if (candidates.length === 0) {
    candidates = FALLBACK_OBJECTIONS.filter((o) => o.targetSkill === targetSkill);
    if (candidates.length === 0) {
      candidates = FALLBACK_OBJECTIONS;
    }
  }

  // Prefer matching difficulty, but don't require it
  const difficultyMatch = candidates.filter((o) => o.difficulty === difficulty);
  if (difficultyMatch.length > 0) {
    candidates = difficultyMatch;
  }

  // Select a random objection from candidates
  const selected = candidates[Math.floor(Math.random() * candidates.length)];

  return {
    objection_text: selected.objection_text,
    objection_category: selected.objection_category,
    context: selected.context,
    buyer_scenario: selected.buyer_scenario,
    tips: selected.tips,
    ideal_response_framework: "Listen, acknowledge, explore, respond, confirm",
  };
}

// ============================================
// HELPERS
// ============================================

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

  let weakestSkill: SkillName = "objection_handling";
  let lowestPoints = Infinity;

  for (const skill of skills) {
    const grade = skillGrades[skill]?.grade || "C";
    const points = gradeToPoints[grade] ?? 5;

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

  if (userExperience === "new") {
    return "beginner";
  }

  if (userExperience === "experienced" && points >= 8) {
    return "advanced";
  }

  if (points >= 6) {
    return "intermediate";
  }

  return "beginner";
}
