// src/lib/phaseScripts.data.ts

export type PhaseKey = "rapport" | "money" | "deep" | "frame" | "close";

export type BuyerState =
  | "just_browsing"
  | "fees_question"
  | "no_lender"
  | "low_credit"
  | "no_savings"
  | "market_fear"
  | "skeptical_wait"
  | "other_realtor"
  | "wants_discount"
  | "needs_spouse"
  | "time_pressure"
  | "neutral";

export type Vibe = "direct" | "warm" | "analytical" | "hype" | "calm";
export type StateMode = "NV" | "GENERIC_US";

// ✅ keep what you want
export type ConsultFormat = "phone" | "zoom" | "in_person";

export type ScriptPackBase = {
  label?: string;
  oneLineGoal?: string;
  script: string;
  bestFollowUp?: string;
  bestFollowUpQuestion?: string;
  regainControl?: string;
  regainControlLine?: string;
  oneOffs?: string[];
  oneOffHumanizers?: string[];
  repAgreementLine?: string;
};
// ...existing code...
export type PhaseScripts = Record<PhaseKey, Record<BuyerState, ScriptPackBase>>;

export const ONE_LINE_GOALS: Record<PhaseKey, string> = {
  rapport: "Earn trust + set the agenda in 20 seconds.",
  money: "Get rent payment + credit + savings in 60 seconds.",
  deep: "Find the real fear + real reason they’ll buy.",
  frame: "Install your process so you lead.",
  close: "Get a clear next step commitment.",
};

export const BUTTON_SETS_BY_PHASE: Record<PhaseKey, BuyerState[]> = {
  rapport: ["fees_question", "market_fear", "skeptical_wait", "other_realtor", "time_pressure", "just_browsing"],
  money: ["no_lender", "low_credit", "no_savings", "fees_question", "wants_discount", "market_fear"],
  deep: ["skeptical_wait", "needs_spouse", "other_realtor", "market_fear", "low_credit", "time_pressure"],
  frame: ["fees_question", "other_realtor", "skeptical_wait", "time_pressure", "wants_discount", "no_lender"],
  close: ["needs_spouse", "time_pressure", "skeptical_wait", "fees_question", "other_realtor", "market_fear"],
};

// ✅ IMPORTANT: no functions in here that read PHASE_SCRIPTS
export const PHASE_SCRIPTS: PhaseScripts = {
  rapport: {
    just_browsing: {
      label: "Just browsing / not sure yet",
      script: `“Totally fair. Let’s keep it simple. What made you even start looking?”`,
      bestFollowUp: `“If you bought this year, what would have to be true for you to feel good about it?”`,
      regainControl: `“I’ll ask 2 quick questions, then I’ll tell you the best next step.”`,
      oneOffs: [`“You’re not behind — you’re early.”`],
    },
    fees_question: {
      label: "Asking about fees",
      script: `“Great question. My job is to protect you and negotiate for you. Before we talk numbers, what are you hoping I handle for you in this process?”`,
      bestFollowUp: `“Have you worked with an agent before — good or bad experience?”`,
      regainControl: `“Fair. Two quick questions, then I’ll explain it clearly.”`,
    },
    no_lender: {
      label: "No lender yet",
      script: `“Perfect. That’s step one — approval sets your real budget. I can connect you with a lender who’ll keep this simple.”`,
      bestFollowUp: `“If a lender approved you today, what monthly payment feels safe?”`,
      regainControl: `“Quick win first: approval. Then we shop smart.”`,
    },
    low_credit: {
      label: "Low / unsure credit",
      script: `“No judgement. Credit is just a starting point. Are you thinking under 640, 640–700, or 700+?”`,
      bestFollowUp: `“Any late payments or collections you already know about?”`,
      regainControl: `“We’re not guessing. We’re building a plan.”`,
    },
    no_savings: {
      label: "No money saved",
      script: `“Real talk — you’re not the only one. There are options, but we need a clear number. What could you realistically save in 60 days?”`,
      bestFollowUp: `“Would you rather plan for 3 months or 6 months?”`,
      regainControl: `“I’m going to simplify this into a 3-step plan.”`,
    },
    market_fear: {
      label: "Worried about crash",
      script: `“Valid fear. We only buy if the payment is safe and the plan makes sense. What would make you feel protected — price, rate, or both?”`,
      bestFollowUp: `“If rates dropped later, would you refinance — yes or no?”`,
      regainControl: `“Let’s anchor this to your monthly payment — not headlines.”`,
    },
    skeptical_wait: {
      label: "Wants to wait",
      script: `“Waiting can be smart — if it’s a plan, not a hope. What needs to change for you: payment, credit, savings, or certainty?”`,
      bestFollowUp: `“How long are you comfortable waiting — 3 months, 6 months, or a year?”`,
      regainControl: `“Cool. Let’s turn ‘wait’ into a timeline.”`,
    },
    other_realtor: {
      label: "Talking to another realtor",
      script: `“Totally fine. You should compare. What matters most: speed, negotiation, or someone who keeps it simple?”`,
      bestFollowUp: `“What did you like or dislike about the other convo?”`,
      regainControl: `“I’ll earn it. Two questions, then you’ll know.”`,
    },
    wants_discount: {
      label: "Wants discount",
      script: `“I hear you. Before we talk price, tell me what a ‘great agent’ looks like in real life for you.”`,
      bestFollowUp: `“If I saved you money in negotiation, would that matter more than a discount?”`,
      regainControl: `“Outcome first, then cost.”`,
    },
    needs_spouse: {
      label: "Needs spouse/partner",
      script: `“Love that. Let’s make them feel confident too. What’s their biggest worry — money, timing, or risk?”`,
      bestFollowUp: `“When can all three of us talk — today or tomorrow?”`,
      regainControl: `“Let’s get alignment before we shop.”`,
    },
    time_pressure: {
      label: "Rushed / short on time",
      script: `“Got you. I’ll be fast. What’s the ONE thing you need from me today to feel progress?”`,
      bestFollowUp: `“Are you trying to move in 30 days, 60 days, or later?”`,
      regainControl: `“60 seconds: budget, credit, savings — then next step.”`,
    },
    neutral: {
      label: "Neutral / no strong signals",
      script: `“Let’s keep it simple. What’s your main goal with this call today?”`,
      bestFollowUp: `“If you could wave a magic wand, what would your ideal outcome look like?”`,
      regainControl: `“I’ll ask two quick questions to make sure I’m helping you best.”`,
      oneOffs: [`“No pressure — just here to help you get clarity.”`],
    },
  },

  // We'll fill these next after the error is gone:
  money: {} as any,
  deep: {} as any,
  frame: {} as any,
  close: {} as any,
};
