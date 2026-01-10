// ============================================
// WEEKLY INSIGHTS GENERATION PROMPTS
// AI-powered coaching insights using psychological hooks
// ============================================

import type { CoachingInsight, SkillName, SkillChange } from "@/types/gamification";

export const WEEKLY_INSIGHTS_SYSTEM_PROMPT = `You are an elite real estate sales coach with decades of experience training top-producing agents. You provide direct, impactful coaching that drives behavior change.

Your coaching style uses psychological hooks that create urgency and motivation:
- FEAR: Highlight what they risk losing or missing out on
- SHAME: Point out what they should know or be doing better (use sparingly, always constructive)
- CURIOSITY: Open their mind to new possibilities and approaches
- AUTHORITY: Reference what top performers do and industry standards
- DRAMA: Emphasize pivotal moments and high-stakes situations

You are firm, direct, and focused on results. You don't sugarcoat, but you're never cruel. Every insight must be actionable.`;

export interface WeeklyInsightsInput {
  sessionsCount: number;
  drillsCount: number;
  totalPracticeMinutes: number;
  skillGrades: Record<SkillName, string>;
  skillChanges: Record<SkillName, SkillChange>;
  complianceScore: number | null;
  complianceIssuesCount: number;
  streakDays: number;
  overallGrade: string | null;
  weakestSkill: SkillName;
  strongestSkill: SkillName;
  biggestImprovement: SkillName | null;
  biggestDecline: SkillName | null;
}

export function buildWeeklyInsightsPrompt(input: WeeklyInsightsInput): string {
  const {
    sessionsCount,
    drillsCount,
    totalPracticeMinutes,
    skillGrades,
    skillChanges,
    complianceScore,
    complianceIssuesCount,
    streakDays,
    overallGrade,
    weakestSkill,
    strongestSkill,
    biggestImprovement,
    biggestDecline,
  } = input;

  const skillSummary = Object.entries(skillGrades)
    .map(([skill, grade]) => {
      const change = skillChanges[skill as SkillName];
      const trend = change?.trend || "stable";
      const arrow = trend === "improving" ? "↑" : trend === "declining" ? "↓" : "→";
      return `- ${formatSkillName(skill as SkillName)}: ${grade} ${arrow}`;
    })
    .join("\n");

  return `Generate 3-5 coaching insights for this real estate agent based on their weekly performance.

## Weekly Performance Summary

**Activity:**
- Sessions Completed: ${sessionsCount}
- Daily Drills: ${drillsCount}
- Total Practice Time: ${totalPracticeMinutes} minutes
- Current Streak: ${streakDays} days

**Overall Grade:** ${overallGrade || "N/A"}

**Skill Grades:**
${skillSummary}

**Key Observations:**
- Strongest Skill: ${formatSkillName(strongestSkill)} (${skillGrades[strongestSkill]})
- Weakest Skill: ${formatSkillName(weakestSkill)} (${skillGrades[weakestSkill]})
${biggestImprovement ? `- Biggest Improvement: ${formatSkillName(biggestImprovement)}` : ""}
${biggestDecline ? `- Biggest Decline: ${formatSkillName(biggestDecline)}` : ""}

**Compliance:**
- Score: ${complianceScore !== null ? `${complianceScore}%` : "N/A"}
- Issues This Week: ${complianceIssuesCount}

## Insight Requirements

Generate insights that:
1. Are specific to THIS agent's performance data
2. Use one of the five psychological hooks (FEAR, SHAME, CURIOSITY, AUTHORITY, DRAMA)
3. Include a clear, actionable next step
4. Feel personal and direct, not generic
5. Prioritize the most impactful areas for improvement

Each insight should:
- Hook category should match the tone (fear = urgency/risk, shame = should-know, etc.)
- Title should be punchy and attention-grabbing (3-7 words)
- Content should be 2-3 sentences, direct and impactful
- Action item should be specific and doable this week

## Output Format

Return a JSON array with 3-5 insights:
[
  {
    "hookCategory": "fear" | "shame" | "curiosity" | "authority" | "drama",
    "title": "Short, punchy title",
    "content": "2-3 sentences of direct coaching. Reference their specific data. Be firm but constructive.",
    "actionItem": "One specific action they should take this week",
    "priority": 1-5 (1 = highest priority)
  }
]

Create insights that will actually change behavior. Don't be soft. These agents need to hear the truth to improve.`;
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

// ============================================
// INSIGHT TEMPLATES BY HOOK TYPE
// Reference for generating varied insights
// ============================================

export const INSIGHT_TEMPLATES = {
  fear: {
    description: "Highlight what they risk losing or missing",
    examples: [
      {
        title: "You're Leaving Money on the Table",
        content: "Your closing grade dropped to a C+ this week. Every weak close is a commission you're handing to another agent.",
        actionItem: "Practice 3 different closing techniques in your next drill session",
      },
      {
        title: "Your Pipeline is at Risk",
        content: "Zero practice this week means skills are decaying. Top agents who stop practicing see a 40% drop in conversion within 60 days.",
        actionItem: "Complete at least one session tomorrow morning",
      },
    ],
  },
  shame: {
    description: "Point out what they should already know (use constructively)",
    examples: [
      {
        title: "This is Real Estate 101",
        content: "You're still stumbling on money questions. These are fundamental skills that every buyer expects you to handle smoothly.",
        actionItem: "Review the money questions module and do 5 drills focused on budget discussions",
      },
      {
        title: "Compliance Isn't Optional",
        content: "3 compliance violations this week. In Nevada, these aren't just mistakes - they're license risks.",
        actionItem: "Take the compliance refresher before your next roleplay",
      },
    ],
  },
  curiosity: {
    description: "Open their mind to new approaches",
    examples: [
      {
        title: "What If You Listened More?",
        content: "Your transcripts show you're talking 70% of the time. The best rapport builders flip that ratio completely.",
        actionItem: "In your next session, challenge yourself to let the buyer talk for 2 full minutes before responding",
      },
      {
        title: "Try the Opposite Approach",
        content: "You keep pushing through objections. What if you leaned into them instead? 'Tell me more about that concern.'",
        actionItem: "Use 'tell me more' at least 3 times in your next session",
      },
    ],
  },
  authority: {
    description: "Reference what top performers do",
    examples: [
      {
        title: "Top 1% Agents Do This Different",
        content: "Elite agents spend 60% of the first meeting just on rapport. You're rushing to business in under 3 minutes.",
        actionItem: "Extend your rapport phase to at least 5 minutes in your next session",
      },
      {
        title: "Industry Standards Exist for a Reason",
        content: "The best agents qualify on money within the first 15 minutes. Your transcripts show you're waiting until the end.",
        actionItem: "Practice transitioning to money questions naturally within the first 10 minutes",
      },
    ],
  },
  drama: {
    description: "Emphasize pivotal moments and stakes",
    examples: [
      {
        title: "This Week Defines Your Quarter",
        content: "Your 7-day streak is building real momentum. Break it now and you'll spend weeks getting back to this level.",
        actionItem: "Complete today's drill before anything else - protect that streak",
      },
      {
        title: "The Close is Everything",
        content: "You had 3 perfect setups this week and softened at the close every time. Those were real opportunities lost.",
        actionItem: "Record yourself doing 5 strong closes tonight. Listen back. Do 5 more.",
      },
    ],
  },
};

// Helper function to determine which hooks to prioritize based on data
export function suggestHookPriorities(input: WeeklyInsightsInput): {
  primary: keyof typeof INSIGHT_TEMPLATES;
  secondary: keyof typeof INSIGHT_TEMPLATES;
} {
  const { sessionsCount, streakDays, complianceIssuesCount, biggestDecline } = input;

  // No activity? Use fear
  if (sessionsCount === 0) {
    return { primary: "fear", secondary: "drama" };
  }

  // Compliance issues? Use shame (constructively)
  if (complianceIssuesCount >= 3) {
    return { primary: "shame", secondary: "authority" };
  }

  // Declining skills? Use drama
  if (biggestDecline) {
    return { primary: "drama", secondary: "fear" };
  }

  // Good streak? Use authority to push higher
  if (streakDays >= 7) {
    return { primary: "authority", secondary: "curiosity" };
  }

  // Default: curiosity with authority backup
  return { primary: "curiosity", secondary: "authority" };
}
