import { NextResponse } from "next/server";

type Body = {
  recentAgentText: string;
  stateMode: "NV" | "GENERIC_US";
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const t = (body.recentAgentText || "").toLowerCase();

  

  // MVP critical triggers (we will swap to Supabase compliance_rules lookup next)
  const criticalTriggers = [
    "i'm free",
    "i work for free",
    "you don't pay me",
    "skip the paperwork",
    "just sign it",
    "don't worry about the forms",
  ];

  const hit = criticalTriggers.find((x) => t.includes(x));
  if (hit) {
    return NextResponse.json({
      severity: "critical",
      trigger: hit,
      correctiveLine:
        "Quick clarity: my compensation depends on the agreement and the transaction. I will explain it clearly before anything is signed.",
    });
  }
await fetch("/api/compliance/check", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    recentAgentText: body.recentAgentText,
    stateMode: "NV",
    // turnIndex, // <-- add if you have it
  }),
});

  return NextResponse.json({ severity: "pass" });
}
