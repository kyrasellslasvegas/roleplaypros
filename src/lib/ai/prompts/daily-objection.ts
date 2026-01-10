// ============================================
// DAILY OBJECTION GENERATION PROMPTS
// AI-powered objection generation targeting weak skills
// ============================================

import type { SkillName, ObjectionCategory } from "@/types/gamification";

export const OBJECTION_GENERATION_SYSTEM_PROMPT = `You are an expert real estate buyer simulator and training content creator. Your job is to generate realistic, challenging buyer objections that real estate agents encounter in the field.

You create objections that:
1. Feel natural and authentic - like something a real buyer would say
2. Target specific skills the agent needs to improve
3. Have appropriate difficulty levels
4. Include helpful context and coaching tips

The objections you create are for training Nevada real estate agents on buyer consultations.`;

export interface ObjectionGenerationInput {
  targetSkill: SkillName;
  difficulty: "beginner" | "intermediate" | "advanced";
  skillGrades: Record<string, { grade: string; trend?: string }>;
  recentObjections: string[]; // Last 7 objections to avoid repetition
  userExperienceLevel: "new" | "intermediate" | "experienced";
}

export function buildObjectionGenerationPrompt(input: ObjectionGenerationInput): string {
  const { targetSkill, difficulty, skillGrades, recentObjections, userExperienceLevel } = input;

  const skillContext = getSkillContext(targetSkill);
  const difficultyGuidelines = getDifficultyGuidelines(difficulty);
  const currentGrade = skillGrades[targetSkill]?.grade || "C";
  const trend = skillGrades[targetSkill]?.trend || "stable";

  return `Generate a buyer objection for a real estate agent training drill.

## Target Information
- **Skill to Target**: ${skillContext.displayName}
- **Current Grade**: ${currentGrade} (trend: ${trend})
- **Difficulty Level**: ${difficulty}
- **Agent Experience**: ${userExperienceLevel}

## Skill Context
${skillContext.description}

Common challenges with this skill:
${skillContext.challenges.map(c => `- ${c}`).join("\n")}

## Difficulty Guidelines
${difficultyGuidelines}

## Recent Objections (AVOID THESE - create something different)
${recentObjections.length > 0 ? recentObjections.map((o, i) => `${i + 1}. "${o}"`).join("\n") : "None - this is the first objection"}

## Output Requirements
Return a JSON object with this exact structure:
{
  "objection_text": "The exact words the buyer would say (1-3 sentences, natural speech)",
  "objection_category": "${getValidCategories().join('" | "')}",
  "context": "Brief scenario context (who is the buyer, what's their situation)",
  "buyer_scenario": {
    "name": "Buyer's first name",
    "personality": "friendly | cautious | dominant | distracted | nervous | skeptical",
    "situation": "Brief description of their home-buying situation",
    "emotionalState": "Their current emotional state",
    "resistanceLevel": "low | medium | high"
  },
  "tips": [
    "Tip 1 for handling this objection (actionable, specific)",
    "Tip 2 for handling this objection",
    "Tip 3 for handling this objection"
  ],
  "ideal_response_framework": "A brief framework for the ideal response (not the exact words)"
}

Create a realistic objection that will challenge the agent on their ${skillContext.displayName} skills. Make it feel like a real conversation moment, not a textbook example.`;
}

function getSkillContext(skill: SkillName): {
  displayName: string;
  description: string;
  challenges: string[];
} {
  const contexts: Record<SkillName, { displayName: string; description: string; challenges: string[] }> = {
    building_rapport: {
      displayName: "Building Rapport",
      description: "The ability to create genuine connection, trust, and comfort with buyers early in the relationship.",
      challenges: [
        "Buyers who are guarded or skeptical of agents",
        "Finding common ground quickly",
        "Balancing professionalism with warmth",
        "Handling buyers who want to skip small talk",
        "Building trust when they've had bad agent experiences",
      ],
    },
    money_questions: {
      displayName: "Money Questions",
      description: "Skillfully discussing budget, financing, pre-approval, and financial readiness without making buyers uncomfortable.",
      challenges: [
        "Buyers who are evasive about their budget",
        "Discussing down payment without seeming pushy",
        "Handling buyers who overstate their budget",
        "Asking about pre-approval tactfully",
        "Dealing with buyers embarrassed about their financial situation",
      ],
    },
    deep_questions: {
      displayName: "Deep Questions",
      description: "Uncovering true motivations, timeline pressures, deal-breakers, and emotional drivers behind the purchase.",
      challenges: [
        "Getting beyond surface-level answers",
        "Understanding the 'why' behind the move",
        "Discovering hidden decision-makers",
        "Identifying must-haves vs nice-to-haves",
        "Understanding timeline urgency",
      ],
    },
    frame_control: {
      displayName: "Frame Control",
      description: "Maintaining control of the conversation, establishing expertise, and guiding the buyer through your process.",
      challenges: [
        "Buyers who want to control the conversation",
        "Establishing your value and expertise",
        "Setting expectations about your process",
        "Handling buyers who compare you to other agents",
        "Maintaining authority without being pushy",
      ],
    },
    objection_handling: {
      displayName: "Objection Handling",
      description: "Effectively addressing concerns, hesitations, and pushback while moving the conversation forward.",
      challenges: [
        "Price objections and market concerns",
        "Competition from other agents or online services",
        "Timing objections ('we're not ready')",
        "Trust objections ('we need to think about it')",
        "Commitment objections ('we're just looking')",
      ],
    },
    closing: {
      displayName: "Closing",
      description: "Securing commitment, getting signatures, and moving buyers to the next concrete step.",
      challenges: [
        "Asking for commitment without being pushy",
        "Handling last-minute hesitation",
        "Creating urgency appropriately",
        "Getting specific next steps confirmed",
        "Overcoming 'let us think about it'",
      ],
    },
    compliance: {
      displayName: "Compliance",
      description: "Adhering to Nevada real estate law, fair housing, proper disclosures, and ethical standards.",
      challenges: [
        "Knowing when disclosures are required",
        "Avoiding prohibited promises about appreciation",
        "Fair housing compliance in all interactions",
        "Proper agency disclosure timing",
        "Avoiding unauthorized practice of law",
      ],
    },
  };

  return contexts[skill];
}

function getDifficultyGuidelines(difficulty: "beginner" | "intermediate" | "advanced"): string {
  const guidelines = {
    beginner: `**Beginner Level Guidelines:**
- Objection should be straightforward and commonly encountered
- Buyer should be relatively cooperative with some hesitation
- The path to resolution should be clear
- One main concern to address
- Emotional intensity: Low to medium`,

    intermediate: `**Intermediate Level Guidelines:**
- Objection should have multiple layers or underlying concerns
- Buyer may have some resistance or skepticism
- Requires active listening to uncover the real issue
- May involve competing priorities
- Emotional intensity: Medium`,

    advanced: `**Advanced Level Guidelines:**
- Complex objection with hidden concerns beneath the surface
- Buyer may be defensive, challenging, or testing the agent
- Requires sophisticated handling and emotional intelligence
- Multiple stakeholders or competing interests may be involved
- May require reframing the entire conversation
- Emotional intensity: Medium to high`,
  };

  return guidelines[difficulty];
}

function getValidCategories(): ObjectionCategory[] {
  return ["price", "timing", "competition", "trust", "commitment", "financing", "market", "property"];
}

// ============================================
// OBJECTION CATEGORIES EXPLAINED
// ============================================

export const OBJECTION_CATEGORIES: Record<ObjectionCategory, {
  name: string;
  description: string;
  examples: string[];
}> = {
  price: {
    name: "Price Objections",
    description: "Concerns about home prices, affordability, or value",
    examples: [
      "These prices are crazy right now",
      "I can't afford what I want in this market",
      "I think homes are overpriced",
    ],
  },
  timing: {
    name: "Timing Objections",
    description: "Hesitation about when to buy or readiness to move forward",
    examples: [
      "We're not ready to buy yet",
      "We want to wait and see what happens",
      "Maybe we should wait for prices to drop",
    ],
  },
  competition: {
    name: "Competition Objections",
    description: "Comparing to other agents, services, or going alone",
    examples: [
      "Why should I use an agent when I can find homes online?",
      "Another agent said they'd do it for less",
      "My friend is an agent, I might use them",
    ],
  },
  trust: {
    name: "Trust Objections",
    description: "Skepticism about agents, the process, or your intentions",
    examples: [
      "How do I know you're looking out for me?",
      "I've heard agents just want their commission",
      "I need to do my own research first",
    ],
  },
  commitment: {
    name: "Commitment Objections",
    description: "Reluctance to commit, sign agreements, or take next steps",
    examples: [
      "I don't want to sign anything yet",
      "Let me think about it",
      "We're just looking right now",
    ],
  },
  financing: {
    name: "Financing Objections",
    description: "Concerns about mortgages, down payments, or qualification",
    examples: [
      "I'm not sure I can get approved",
      "I don't have enough for a down payment",
      "Interest rates are too high right now",
    ],
  },
  market: {
    name: "Market Objections",
    description: "Concerns about market conditions, inventory, or timing",
    examples: [
      "The market is too competitive",
      "There's nothing good on the market",
      "I heard the market is going to crash",
    ],
  },
  property: {
    name: "Property Objections",
    description: "Concerns about specific properties or finding the right home",
    examples: [
      "I don't think I'll find what I'm looking for",
      "Everything needs too much work",
      "I want something that doesn't exist in my budget",
    ],
  },
};
