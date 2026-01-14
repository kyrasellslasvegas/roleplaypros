import { NextResponse } from "next/server";

type Body = {
  sessionId: string;
  stateMode: "NV" | "GENERIC_US";
  transcriptText: string;
};

function containsAny(text: string, phrases: string[]) {
  const t = (text || "").toLowerCase();
  return phrases.some((p) => t.includes(p.toLowerCase()));
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  const transcript = (body.transcriptText || "").trim();
  const stateMode = body.stateMode || "NV";

  // Minimal scoring for now (you’ll replace with GPT grading later)
  const rapport = 50;
  const money = 50;
  const deep = 50;
  const frame = 50;
  const close = 50;

  // Compliance checks (super basic phrase matching MVP)
  const hasBuyerBrokerRep = containsAny(transcript, [
    "buyer-broker",
    "buyer broker",
    "representation agreement",
    "buyer representation",
    "exclusive buyer",
  ]);

  const hasDutiesOwed = containsAny(transcript, [
    "duties owed",
    "agency disclosure",
    "duties",
    "agency",
  ]);

  const complianceFlags: { key: string; label: string; detail: string }[] = [];
  if (stateMode === "NV") {
    if (!hasBuyerBrokerRep) {
      complianceFlags.push({
        key: "buyer_broker_rep",
        label: "Buyer Broker / Representation disclosed",
        detail: "Missing mention of buyer-broker/representation.",
      });
    }
    if (!hasDutiesOwed) {
      complianceFlags.push({
        key: "duties_owed",
        label: "Duties Owed / Agency disclosure",
        detail: "Missing mention of duties owed / agency disclosure.",
      });
    }
  }

  const compliance = complianceFlags.length ? "FAIL" : "PASS";

  const score = 50;
  const grade = "F";

  return NextResponse.json({
    sessionId: body.sessionId,
    score,
    grade,
    compliance,
    phaseScores: { rapport, money, deep, frame, close },
    complianceFlags,
    coachSummary: {
      best: "rapport",
      needsWork: "close",
      note:
        compliance === "FAIL"
          ? "Compliance missing: add required disclosures early (before tours / before specifics)."
          : "Nice — compliance covered. Now tighten your close.",
    },
    updatedAt: new Date().toISOString(),
  });
}
