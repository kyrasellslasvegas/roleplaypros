export type ConsultFormat = "phone" | "zoom" | "in_person";
export type StateMode = "NV" | "GENERIC_US";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type Vibe = "Direct" | "Warm" | "Analytical" | "Hype" | "Calm";

export type PhaseId = 1 | 2 | 3 | 4 | 5;

export type PhaseScript = {
  phase: PhaseId;
  title: string;
  subtitle: string;
  goal: string;
  sayThis: string;
  bestFollowUp: string;
  regainControlLine: string;
};
