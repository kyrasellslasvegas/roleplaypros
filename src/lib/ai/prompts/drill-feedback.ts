// ============================================
// DRILL FEEDBACK PROMPTS
// Quick feedback for 5-minute objection drills
// ============================================

import type { DrillFeedback, SkillName, ObjectionCategory, BuyerScenario } from "@/types/gamification";
import type { TranscriptEntry } from "@/types/session";

export const DRILL_FEEDBACK_SYSTEM_PROMPT = `You are an expert real estate sales coach evaluating a quick 5-minute objection handling drill. Your feedback should be:

1. IMMEDIATE - Get to the point quickly
2. SPECIFIC - Reference exact moments from the transcript
3. ACTIONABLE - Give one clear thing to improve
4. ENCOURAGING - Acknowledge what they did well
5. SCORED - Provide a fair grade based on performance

Grade Scale:
- A+ (95-100): Exceptional handling, textbook response
- A (90-94): Excellent, minor improvements possible
- A- (87-89): Very good with small gaps
- B+ (83-86): Good response, some technique issues
- B (80-82): Solid but room for improvement
- B- (77-79): Adequate but missing key elements
- C+ (73-76): Fair, significant gaps
- C (70-72): Needs work on fundamentals
- C- (67-69): Below expectations
- D (60-66): Poor handling
- F (0-59): Failed to address the objection

Focus on whether they:
1. Acknowledged the buyer's concern
2. Asked clarifying questions
3. Addressed the underlying issue
4. Moved toward a positive next step
5. Maintained rapport throughout`;

export interface DrillFeedbackInput {
  objectionText: string;
  objectionCategory: ObjectionCategory;
  targetSkill: SkillName;
  difficulty: "beginner" | "intermediate" | "advanced";
  buyerScenario: BuyerScenario | null;
  transcript: TranscriptEntry[];
  durationSeconds: number;
  tips: string[];
}

export function buildDrillFeedbackPrompt(input: DrillFeedbackInput): string {
  const {
    objectionText,
    objectionCategory,
    targetSkill,
    difficulty,
    buyerScenario,
    transcript,
    durationSeconds,
    tips,
  } = input;

  const formattedTranscript = transcript
    .map((entry, index) => {
      const speaker = entry.speaker === "user" ? "AGENT" : "BUYER";
      return `[${index + 1}] ${speaker}: "${entry.content}"`;
    })
    .join("\n");

  const durationMinutes = Math.floor(durationSeconds / 60);
  const durationRemainderSeconds = durationSeconds % 60;

  return `Evaluate this 5-minute objection handling drill.

## Drill Context

**The Objection:**
"${objectionText}"

**Category:** ${formatCategory(objectionCategory)}
**Target Skill:** ${formatSkillName(targetSkill)}
**Difficulty:** ${difficulty}
**Duration:** ${durationMinutes}:${durationRemainderSeconds.toString().padStart(2, "0")}

${buyerScenario ? `**Buyer Profile:**
- Name: ${buyerScenario.name}
- Personality: ${buyerScenario.personality}
- Situation: ${buyerScenario.situation}
- Emotional State: ${buyerScenario.emotionalState}
- Resistance: ${buyerScenario.resistanceLevel}` : ""}

**Coaching Tips Given:**
${tips.map((tip, i) => `${i + 1}. ${tip}`).join("\n")}

## Transcript

${formattedTranscript || "No transcript recorded"}

## Evaluation Criteria

Based on the ${difficulty} difficulty level:
${getDifficultyExpectations(difficulty)}

## Required Output

Return a JSON object:
{
  "overallScore": <number 0-100>,
  "grade": "<letter grade with +/- if applicable>",
  "summary": "<2-3 sentence summary of their performance>",
  "strengths": [
    "<specific thing they did well, reference transcript>",
    "<another strength if applicable>"
  ],
  "improvement": "<ONE specific thing to improve - be direct and actionable>",
  "suggestedResponse": "<Brief framework or key phrase they could have used>"
}

Be fair but honest. If they did poorly, say so. If they did well, acknowledge it. Reference specific moments from the transcript.`;
}

function formatSkillName(skill: SkillName): string {
  const names: Record<SkillName, string> = {
    building_rapport: "Building Rapport",
    money_questions: "Money Questions",
    deep_questions: "Deep Questions",
    frame_control: "Frame Control",
    objection_handling: "Objection Handling",
    closing: "Closing",
    compliance: "Compliance",
  };
  return names[skill] || skill;
}

function formatCategory(category: ObjectionCategory): string {
  const names: Record<ObjectionCategory, string> = {
    price: "Price Objection",
    timing: "Timing Objection",
    competition: "Competition Objection",
    trust: "Trust Objection",
    commitment: "Commitment Objection",
    financing: "Financing Objection",
    market: "Market Objection",
    property: "Property Objection",
  };
  return names[category] || category;
}

function getDifficultyExpectations(difficulty: "beginner" | "intermediate" | "advanced"): string {
  const expectations = {
    beginner: `- Should acknowledge the buyer's concern
- Should ask at least one clarifying question
- Should provide a basic response that addresses the objection
- Minor fumbles are acceptable
- Focus on fundamentals`,

    intermediate: `- Must acknowledge AND validate the concern
- Should ask 2+ clarifying questions to understand deeper
- Response should address underlying concerns, not just surface
- Should attempt to move toward next steps
- Should maintain conversational flow`,

    advanced: `- Must demonstrate sophisticated objection handling
- Should uncover hidden concerns beneath the objection
- Must reframe the conversation positively
- Should use the objection as an opportunity
- Must maintain complete control while showing empathy
- Should close with clear next step or commitment`,
  };

  return expectations[difficulty];
}

// ============================================
// GRADE CALCULATION HELPERS
// ============================================

export function calculateDrillScore(feedback: DrillFeedback): number {
  return feedback.overallScore;
}

export function gradeToScore(grade: string): number {
  const gradeMap: Record<string, number> = {
    "A+": 98,
    "A": 93,
    "A-": 90,
    "B+": 87,
    "B": 83,
    "B-": 80,
    "C+": 77,
    "C": 73,
    "C-": 70,
    "D+": 67,
    "D": 63,
    "D-": 60,
    "F": 50,
  };
  return gradeMap[grade] || 70;
}

export function scoreToGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 87) return "A-";
  if (score >= 83) return "B+";
  if (score >= 80) return "B";
  if (score >= 77) return "B-";
  if (score >= 73) return "C+";
  if (score >= 70) return "C";
  if (score >= 67) return "C-";
  if (score >= 63) return "D+";
  if (score >= 60) return "D";
  return "F";
}

// ============================================
// XP CALCULATION FOR DRILLS
// ============================================

export function calculateDrillXp(
  score: number,
  difficulty: "beginner" | "intermediate" | "advanced",
  streakDays: number
): {
  baseXp: number;
  gradeBonus: number;
  difficultyBonus: number;
  streakBonus: number;
  totalXp: number;
} {
  // Base XP for completing a drill
  const baseXp = 50;

  // Grade bonus: +10 for each grade above C
  let gradeBonus = 0;
  if (score >= 70) gradeBonus = 10; // C
  if (score >= 77) gradeBonus = 20; // C+
  if (score >= 80) gradeBonus = 30; // B-
  if (score >= 83) gradeBonus = 40; // B
  if (score >= 87) gradeBonus = 50; // B+
  if (score >= 90) gradeBonus = 60; // A-
  if (score >= 93) gradeBonus = 70; // A
  if (score >= 97) gradeBonus = 80; // A+

  // Difficulty bonus
  const difficultyMultipliers = {
    beginner: 0,
    intermediate: 15,
    advanced: 30,
  };
  const difficultyBonus = difficultyMultipliers[difficulty];

  // Streak bonus: +5 per day, capped at +50
  const streakBonus = Math.min(streakDays * 5, 50);

  const totalXp = baseXp + gradeBonus + difficultyBonus + streakBonus;

  return {
    baseXp,
    gradeBonus,
    difficultyBonus,
    streakBonus,
    totalXp,
  };
}
