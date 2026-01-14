// src/app/api/coach/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type Turn = {
  speaker: "agent" | "buyer";
  text: string;
  ts: number;
};

type CoachReport = {
  summary: string;
  overall_score: number; // 0-100
  skill_grade: "A" | "B" | "C" | "D" | "F";
  phase_scores: Record<string, number>; // {rapport: 80, money: 62...}
  compliance: {
    pass: boolean;
    flags: Array<{ rule: string; detail: string; ts?: number }>;
  };
  strengths: string[];
  improvements: string[];
  next_drill: { title: string; script: string; rule: string };
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function gradeFromScore(score: number): CoachReport["skill_grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

// basic keyword helpers
function includesAny(haystack: string, needles: string[]) {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n.toLowerCase()));
}

function buildCompliance(agentTurns: Turn[]) {
  // v1: check for “representation / broker / duties owed” language existing at all.
  // (Next iteration: enforce "before touring" by checking within first N agent turns or before phase 2.)
  const joined = agentTurns.map((t) => t.text).join(" ").toLowerCase();

  const rules = [
    {
      rule: "Buyer Broker / Representation disclosed",
      keywords: ["buyer broker", "broker agreement", "representation", "represent you", "i represent you"],
      detail: "Missing mention of buyer-broker/representation.",
    },
    {
      rule: "Duties Owed / Agency disclosure",
      keywords: ["duties owed", "agency", "fiduciary", "agency disclosure"],
      detail: "Missing mention of duties owed / agency disclosure.",
    },
  ];

  const flags: Array<{ rule: string; detail: string; ts?: number }> = [];
  for (const r of rules) {
    const ok = includesAny(joined, r.keywords);
    if (!ok) flags.push({ rule: r.rule, detail: r.detail });
  }

  return {
    pass: flags.length === 0,
    flags,
  };
}

function scorePhaseHeuristics(phaseKey: string, turns: Turn[]) {
  const agent = turns.filter((t) => t.speaker === "agent");
  const buyer = turns.filter((t) => t.speaker === "buyer");

  const agentText = agent.map((t) => t.text).join(" ");
  const buyerText = buyer.map((t) => t.text).join(" ");

  const agentTurns = agent.length;
  const buyerTurns = buyer.length;

  const agentAvgLen =
    agentTurns === 0 ? 0 : agent.reduce((s, t) => s + t.text.length, 0) / agentTurns;

  const questionCount = (agentText.match(/\?/g) || []).length;

  // “money” phase signals
  const mentionsBudget = includesAny(agentText, ["budget", "monthly", "payment", "down payment", "closing costs"]);
  const mentionsCredit = includesAny(agentText, ["credit", "score", "pre-approval", "preapproval", "lender"]);
  const mentionsProcess = includesAny(agentText, ["here’s how", "my process", "step", "plan", "next step"]);

  // base score
  let score = 50;

  // general conversational control: agent speaks enough + not zero
  if (agentTurns >= 2) score += 10;
  if (agentTurns >= 4) score += 5;

  // questions = good (in most phases)
  score += clamp(questionCount * 6, 0, 24);

  // too long / rambling penalty
  if (agentAvgLen > 260) score -= 10;
  if (agentAvgLen > 400) score -= 15;

  // phase-specific boosts
  if (phaseKey === "rapport") {
    if (includesAny(agentText, ["glad", "thanks", "appreciate", "happy to", "totally fair"])) score += 10;
    if (questionCount >= 1) score += 8;
  }

  if (phaseKey === "money") {
    if (mentionsBudget) score += 15;
    if (mentionsCredit) score += 12;
    if (includesAny(agentText, ["comfortable", "range", "safe payment"])) score += 6;
  }

  if (phaseKey === "deep") {
    if (includesAny(agentText, ["worried", "concern", "fear", "hesitate", "what would make"])) score += 14;
    if (questionCount >= 2) score += 8;
  }

  if (phaseKey === "frame") {
    if (mentionsProcess) score += 18;
    if (includesAny(agentText, ["tour with a purpose", "i’ll lead", "i’ll guide", "i’ll keep you updated"])) score += 10;
  }

  if (phaseKey === "close") {
    if (includesAny(agentText, ["today or tomorrow", "next step", "schedule", "book", "commit"])) score += 18;
    if (includesAny(agentText, ["no pressure", "totally fine", "we can"])) score += 6;
  }

  // buyer engagement sanity check (if buyer is talking and agent isn't, penalty)
  if (buyerTurns > agentTurns + 3) score -= 12;

  return clamp(score);
}

function buildReport(turns: Turn[]) : CoachReport {
  const agentTurns = turns.filter((t) => t.speaker === "agent");
  const compliance = buildCompliance(agentTurns);

  // Score phases using all turns (simple v1).
  // Later: score by segmenting turns per phase.
  const phase_scores: Record<string, number> = {
    rapport: scorePhaseHeuristics("rapport", turns),
    money: scorePhaseHeuristics("money", turns),
    deep: scorePhaseHeuristics("deep", turns),
    frame: scorePhaseHeuristics("frame", turns),
    close: scorePhaseHeuristics("close", turns),
  };

  // Weighted overall
  const overall =
    Math.round(
      phase_scores.rapport * 0.2 +
      phase_scores.money * 0.2 +
      phase_scores.deep * 0.2 +
      phase_scores.frame * 0.2 +
      phase_scores.close * 0.2
    );

  // Grade + compliance gating (world-class “provable, not vibes”)
  let grade = gradeFromScore(overall);
  if (!compliance.pass) {
    // cap grade if compliance fails (you can make this harsher later)
    if (grade === "A") grade = "B";
    if (grade === "B") grade = "C";
  }

  const strengths: string[] = [];
  const improvements: string[] = [];

  // strengths/improvements based on phase scores
  const sorted = Object.entries(phase_scores).sort((a, b) => b[1] - a[1]);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  strengths.push(`Strongest phase: ${best[0]} (${best[1]}/100).`);
  improvements.push(`Biggest opportunity: ${worst[0]} (${worst[1]}/100).`);

  if (!compliance.pass) {
    improvements.push("Compliance missing: add required disclosures early (before tours / before specifics).");
  } else {
    strengths.push("Compliance ✅ disclosures appear present.");
  }

  const summary =
    `Score ${overall}/100 • Grade ${grade} • Compliance ${compliance.pass ? "PASS" : "FAIL"}.\n` +
    `Best: ${best[0]} • Needs work: ${worst[0]}.`;

  const next_drill =
    worst[0] === "money"
      ? {
          title: "60s Money Drill — Payment + Credit",
          rule: "Ask payment comfort + credit range in simple language.",
          script:
            "Say: “Quick question — what monthly payment feels safe for you?”\n" +
            "Then: “Do you know your credit range: over 700, 640–700, or under 640?”\n" +
            "Then stop talking and listen.",
        }
      : worst[0] === "frame"
      ? {
          title: "60s Frame Drill — Your Process",
          rule: "Explain your process in 5 simple steps.",
          script:
            "Say: “Here’s how I help buyers win in 5 steps…”\n" +
            "1) Budget + approval\n2) Smart plan\n3) Tour with purpose\n4) Offer + negotiate\n5) Closing support\n" +
            "Then ask: “Does that feel simple and clear?”",
        }
      : worst[0] === "deep"
      ? {
          title: "60s Deep Questions Drill",
          rule: "Ask 2 fear/driver questions and pause.",
          script:
            "Ask: “What are you most worried about with buying?” (pause)\n" +
            "Then: “What would make you feel confident saying yes?” (pause)",
        }
      : worst[0] === "close"
      ? {
          title: "60s Close Drill — Commit to Next Step",
          rule: "Offer a binary next-step choice.",
          script:
            "Say: “Best next step is approval + a short list.”\n" +
            "Ask: “Do you want to talk to a lender today, or tomorrow?”",
        }
      : {
          title: "60s Rapport Drill — Calm Control",
          rule: "Set agenda + mirror once.",
          script:
            "Say: “Glad we’re talking. What made you start looking now?” (pause)\n" +
            "Mirror their key phrase once.\n" +
            "Then: “I’ll ask a few quick questions, then I’ll map the best next step.”",
        };

  return {
    summary,
    overall_score: clamp(overall),
    skill_grade: grade,
    phase_scores,
    compliance,
    strengths,
    improvements,
    next_drill,
  };
}

export async function POST(req: Request) {
  try {
    const sb = await supabaseServer();
    const body = await req.json();

    // accept both styles
    const sessionKey: string =
      body.sessionKey ?? body.session_key ?? body.sessionId ?? body.session_id;

    const stateMode: string = body.stateMode ?? body.state_mode ?? "NV";
    const difficulty: string = body.difficulty ?? "beginner";
    const phaseReached: number = body.phase ?? body.phase_reached ?? 1;
    const phaseKey: string = body.phase_key ?? "rapport";
    const turns: Turn[] = Array.isArray(body.turns) ? body.turns : [];

    // may or may not exist
    const reportJson: any = body.reportJson ?? body.report_json ?? body.report ?? null;

    if (!sessionKey) {
      return NextResponse.json(
        { error: "session_key (or sessionKey) is required" },
        { status: 400 }
      );
    }

    // auth from cookies
    const { data: userData, error: userErr } = await sb.auth.getUser();
    if (userErr || !userData.user) {
      return NextResponse.json(
        { error: "Auth session missing!", detail: userErr?.message ?? null },
        { status: 401 }
      );
    }
    const user = userData.user;

    // 1) ensure roleplay_sessions row exists
    const { error: upsertSessionErr } = await sb
      .from("roleplay_sessions")
      .upsert(
        {
          session_key: sessionKey,
          user_id: user.id,
          state_mode: stateMode,
          difficulty,
          started_at: new Date().toISOString(),
        },
        { onConflict: "session_key" }
      );

    if (upsertSessionErr) {
      return NextResponse.json(
        { error: "Failed to upsert roleplay_sessions", detail: upsertSessionErr.message },
        { status: 400 }
      );
    }

    // 2) upsert turns
    if (turns.length > 0) {
      const rows = turns.map((t, idx) => ({
        session_key: sessionKey,
        idx,
        speaker: t.speaker,
        text: t.text,
        ts: t.ts,
      }));

      const { error: upsertTurnsErr } = await sb
        .from("roleplay_turns")
        .upsert(rows, { onConflict: "session_key,idx" });

      if (upsertTurnsErr) {
        return NextResponse.json(
          { error: "Failed to upsert roleplay_turns", detail: upsertTurnsErr.message },
          { status: 400 }
        );
      }
    }

    // 3) Generate report if not provided (always return a real report)
    const report: CoachReport =
      reportJson && typeof reportJson === "object" && reportJson.overall_score != null
        ? reportJson
        : buildReport(turns);

    // 4) Save session-level score
    const { error: scoreErr } = await sb.from("roleplay_session_scores").upsert(
      {
        session_key: sessionKey,
        user_id: user.id,
        overall_score: report.overall_score,
        skill_grade: report.skill_grade,
        phase_scores: report.phase_scores,
        compliance_pass: report.compliance.pass,
        compliance_flags: report.compliance.flags,
        summary: report.summary,
        strengths: report.strengths,
        improvements: report.improvements,
        next_drill: report.next_drill,
      },
      { onConflict: "session_key" }
    );

    if (scoreErr) {
      return NextResponse.json(
        { error: "Failed to upsert roleplay_session_scores", detail: scoreErr.message },
        { status: 400 }
      );
    }

// 5) Save phase score row (upsert, no duplicates)
const phaseScore = report.phase_scores?.[phaseKey] ?? report.overall_score;

const { error: phaseErr } = await sb.from("roleplay_phase_scores").upsert(
  {
    session_key: sessionKey,
    user_id: user.id,
    phase_key: phaseKey,
    phase_score: phaseScore,
    notes: { strengths: report.strengths, improvements: report.improvements },
  },
  { onConflict: "session_key,phase_key" }
);

if (phaseErr) {
  // Don’t nuke the whole request if this fails — return partial success
  return NextResponse.json({
    ok: true,
    sessionKey,
    savedTurns: turns.length,
    warnings: [{ step: "phase_scores", error: phaseErr.message }],
  });
}

// 6) Save raw coach report (optional “audit trail”)
const { error: reportErr } = await sb.from("roleplay_coach_reports").insert({
  session_key: sessionKey,
  phase: phaseReached,
  report_json: report,
  created_at: new Date().toISOString(),
});

if (reportErr) {
  // not fatal — scores already saved
  // (but still good to surface)
  console.warn("roleplay_coach_reports insert failed:", reportErr.message);
}

    // debug counts
    const buyerCount = turns.filter((t) => t.speaker === "buyer").length;
    const agentCount = turns.filter((t) => t.speaker === "agent").length;

    return NextResponse.json({
      ok: true,
      sessionKey,
      userId: user.id,
      savedTurns: turns.length,
      agentCount,
      buyerCount,
      report, // ✅ return report for UI too
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Coach route crashed", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
