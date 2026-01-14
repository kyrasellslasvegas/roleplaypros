import type { ConsultFormat, PhaseId, PhaseScript, Vibe } from "./types";

type PressureKey =
  | "fees_question"
  | "market_fear"
  | "skeptical_wait"
  | "other_realtor"
  | "time_pressure"
  | "just_browsing";

function addRepAgreementLine(base: string, on: boolean) {
  if (!on) return base;
  const rep =
    "Before we tour homes, we’ll review and sign a simple buyer-broker representation agreement so you’re protected and we’re clear. I’ll text/email it so it’s easy.";
  return `${base}\n\n${rep}`;
}

const PHASE_META: Record<PhaseId, Pick<PhaseScript, "title" | "subtitle">> = {
  1: { title: "Phase 1 — Rapport", subtitle: "Calm control + instant trust" },
  2: { title: "Phase 2 — Money", subtitle: "Payment safety + clarity" },
  3: { title: "Phase 3 — Deep", subtitle: "Pull the real motive" },
  4: { title: "Phase 4 — Frame", subtitle: "Lead the process" },
  5: { title: "Phase 5 — Close", subtitle: "Commit to next step" },
};

export function getPhaseScript(opts: {
  phase: PhaseId;
  vibe: Vibe;
  format: ConsultFormat;
  includeRepAgreement: boolean;
  pressure: PressureKey;
}): PhaseScript {
  const { phase, vibe, format, includeRepAgreement, pressure } = opts;
  const meta = PHASE_META[phase];

  // Keep this simple + consistent. You can expand later per vibe/format/pressure.
  const baseByPhase: Record<PhaseId, Omit<PhaseScript, "phase" | "title" | "subtitle">> = {
    1: {
      goal: "Stay calm and create clarity.",
      sayThis: addRepAgreementLine(
        "Valid fear. We only buy if the payment is safe and the plan makes sense. What would make you feel protected — price, rate, or both?",
        includeRepAgreement
      ),
      bestFollowUp: "What matters most to you right now?",
      regainControlLine: "Let’s slow this down and get clarity.",
    },
    2: {
      goal: "Anchor to monthly payment — not headlines.",
      sayThis:
        "Totally fair. Let’s anchor to the payment first: what monthly number feels comfortable, and what would feel too tight?",
      bestFollowUp: "What’s your ideal monthly payment range?",
      regainControlLine: "Let’s keep this simple: payment first, everything else second.",
    },
    3: {
      goal: "Find the real reason + timeline.",
      sayThis:
        "Help me understand what’s driving the move — what changed recently that has you looking now?",
      bestFollowUp: "If we solved this, what would your life look like in 6 months?",
      regainControlLine: "I’m going to ask a few quick questions so I can protect your time.",
    },
    4: {
      goal: "Lead the process with confidence.",
      sayThis:
        "Here’s how we win: we get you approved, build a short list, and tour with a clear plan. No chaos, no guessing.",
      bestFollowUp: "Do you want speed, value, or certainty most?",
      regainControlLine: "I’ll drive the process — you just tell me what matters.",
    },
    5: {
      goal: "Commit to a next step (binary choice).",
      sayThis:
        "Best next step is approval + a short list. Do you want to talk to a lender today, or tomorrow?",
      bestFollowUp: "If we booked that now, what time works — 3pm or 5pm?",
      regainControlLine: "We’re not deciding on a house today — just the next step.",
    },
  };

  // Tiny style tweaks (optional)
  const tonePrefix =
    vibe === "Direct"
      ? ""
      : vibe === "Warm"
      ? "I hear you. "
      : vibe === "Analytical"
      ? "Let’s look at the facts. "
      : vibe === "Hype"
      ? "Okay, let’s go. "
      : "No rush. ";

  const formatNudge =
    format === "phone"
      ? ""
      : format === "zoom"
      ? " I’ll share my screen so this is easy."
      : " We’ll keep it super simple in-person.";

  const pressureNudge =
    pressure === "time_pressure"
      ? " Quick question so we don’t waste time:"
      : pressure === "fees_question"
      ? " I’ll explain fees clearly in one minute:"
      : pressure === "just_browsing"
      ? " Totally fine — let’s keep it low pressure:"
      : pressure === "other_realtor"
      ? " No drama — here’s how I’m different:"
      : pressure === "market_fear"
      ? " Let’s protect you with a plan:"
      : " ";

  const base = baseByPhase[phase];

  return {
    phase,
    title: meta.title,
    subtitle: meta.subtitle,
    goal: base.goal,
    sayThis: `${tonePrefix}${pressureNudge} ${base.sayThis}${formatNudge}`.replace(/\s+/g, " ").trim(),
    bestFollowUp: base.bestFollowUp,
    regainControlLine: base.regainControlLine,
  };
}
