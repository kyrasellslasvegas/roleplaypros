"use client";

import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { getPhaseScript } from "@/lib/phaseScripts";
import type { ConsultFormat, Difficulty, PhaseId, StateMode, Vibe } from "@/lib/types";
import { connectVoice, disconnectVoice } from "@/lib/realtimeVoiceClient";
import { AvatarTalker } from "@/components/AvatarTalker";

type PressureKey =
  | "fees_question"
  | "market_fear"
  | "skeptical_wait"
  | "other_realtor"
  | "time_pressure"
  | "just_browsing";

type CoachReport = {
  sessionId: string;
  score: number;
  grade: string;
  compliance: "PASS" | "FAIL";
  phaseScores: { rapport: number; money: number; deep: number; frame: number; close: number };
  complianceFlags: { key: string; label: string; detail: string }[];
  coachSummary: { best: string; needsWork: string; note: string };
  updatedAt: string;
};

export default function SessionPage({ params }: { params: { id: string } }) {
  const sessionId = params.id;

  // UI state (keep)
  const [difficulty, setDifficulty] = useState<Difficulty>("Beginner");
  const [stateMode, setStateMode] = useState<StateMode>("NV");
  const [phase, setPhase] = useState<PhaseId>(1);

  const [vibe, setVibe] = useState<Vibe>("Direct");
  const [format, setFormat] = useState<ConsultFormat>("phone");
  const [includeRepAgreement, setIncludeRepAgreement] = useState(true);

  const [pressure, setPressure] = useState<PressureKey>("just_browsing");

  // Voice
  const [voiceStatus, setVoiceStatus] = useState<"Idle" | "Connecting" | "Connected" | "Disconnected">(
    "Idle"
  );
  const voiceRef = useRef<{ pc: RTCPeerConnection | null; stream: MediaStream | null }>({
    pc: null,
    stream: null,
  });

  // Audio level for avatar animation
  const [audioLevel, setAudioLevel] = useState(0);
  const analyzerRef = useRef<{ analyser: AnalyserNode | null; ctx: AudioContext | null; animId: number | null }>({
    analyser: null,
    ctx: null,
    animId: null,
  });

  // Coaching / transcript
  const [coachStatus, setCoachStatus] = useState<"idle" | "running" | "saved">("idle");
  const [turns, setTurns] = useState<{ speaker: "agent" | "buyer"; text: string; ts: number }[]>([]);
  const [report, setReport] = useState<CoachReport | null>(null);

  // Derived transcript text for display and coaching
  const transcriptText = useMemo(() => {
    return turns.map((t) => `${t.speaker}: ${t.text}`).join("\n");
  }, [turns]);

  const capturedTurns = turns.length;

  // Real script (wired)
  const script = useMemo(() => {
    return getPhaseScript({
      phase,
      vibe,
      format,
      includeRepAgreement,
      pressure,
    });
  }, [phase, vibe, format, includeRepAgreement, pressure]);

  async function onConnectVoice() {
    try {
      setVoiceStatus("Connecting");
      const { pc, stream } = await connectVoice();
      voiceRef.current = { pc, stream };

      // Set up audio analyzer for avatar mouth animation
      pc.ontrack = (event) => {
        if (event.track.kind === "audio") {
          const audioEl = document.createElement("audio");
          audioEl.srcObject = new MediaStream([event.track]);
          audioEl.autoplay = true;

          // Create audio analyzer
          const ctx = new AudioContext();
          const source = ctx.createMediaStreamSource(new MediaStream([event.track]));
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          analyzerRef.current = { analyser, ctx, animId: null };

          // Animation loop for audio level
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const tick = () => {
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setAudioLevel(Math.min(1, avg / 128));
            analyzerRef.current.animId = requestAnimationFrame(tick);
          };
          tick();
        }
      };

      // Set up data channel for transcript capture
      pc.ondatachannel = (event) => {
        const dc = event.channel;
        dc.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            // Handle transcript events from OpenAI realtime API
            if (data.type === "conversation.item.created" && data.item?.content) {
              const content = data.item.content[0];
              if (content?.transcript) {
                const speaker = data.item.role === "assistant" ? "buyer" : "agent";
                setTurns((prev) => [...prev, { speaker, text: content.transcript, ts: Date.now() }]);
              }
            }
            // Handle response audio transcript
            if (data.type === "response.audio_transcript.done" && data.transcript) {
              setTurns((prev) => [...prev, { speaker: "buyer", text: data.transcript, ts: Date.now() }]);
            }
            // Handle input audio transcript (user speech)
            if (data.type === "conversation.item.input_audio_transcription.completed" && data.transcript) {
              setTurns((prev) => [...prev, { speaker: "agent", text: data.transcript, ts: Date.now() }]);
            }
          } catch {
            // Ignore non-JSON messages
          }
        };
      };

      setVoiceStatus("Connected");
    } catch (e: any) {
      console.error(e);
      setVoiceStatus("Disconnected");
      alert(e?.message || "Voice connect failed.");
    }
  }

  function onDisconnectVoice() {
    // Clean up audio analyzer
    if (analyzerRef.current.animId) {
      cancelAnimationFrame(analyzerRef.current.animId);
    }
    if (analyzerRef.current.ctx) {
      analyzerRef.current.ctx.close();
    }
    analyzerRef.current = { analyser: null, ctx: null, animId: null };
    setAudioLevel(0);

    disconnectVoice(voiceRef.current);
    voiceRef.current = { pc: null, stream: null };
    setVoiceStatus("Disconnected");
  }

  async function onRunCoachingNow() {
    try {
      setCoachStatus("running");

      // Use the full coach endpoint with turns for better analysis
      const payload = {
        sessionKey: sessionId,
        stateMode,
        difficulty,
        phase,
        phase_key: ["rapport", "money", "deep", "frame", "close"][phase - 1],
        turns: turns.length > 0 ? turns : [],
        transcriptText: transcriptText || "(no transcript captured yet)",
      };

      // Try full coach endpoint first, fall back to simple run endpoint
      let res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      // If auth fails (401), fall back to simpler endpoint that doesn't require auth
      if (res.status === 401) {
        res = await fetch("/api/coach/run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId,
            stateMode,
            transcriptText: transcriptText || "(no transcript captured yet)",
          }),
        });
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Coaching failed: ${res.status} ${txt}`);
      }

      const data = await res.json();

      // Normalize response from either endpoint
      const report: CoachReport = {
        sessionId: data.sessionKey || data.sessionId || sessionId,
        score: data.report?.overall_score ?? data.overall_score ?? data.score ?? 50,
        grade: data.report?.skill_grade ?? data.skill_grade ?? data.grade ?? "F",
        compliance: (data.report?.compliance?.pass ?? data.compliance === "PASS") ? "PASS" : "FAIL",
        phaseScores: data.report?.phase_scores ?? data.phaseScores ?? { rapport: 50, money: 50, deep: 50, frame: 50, close: 50 },
        complianceFlags: data.report?.compliance?.flags?.map((f: any) => ({
          key: f.rule,
          label: f.rule,
          detail: f.detail,
        })) ?? data.complianceFlags ?? [],
        coachSummary: {
          best: data.report?.strengths?.[0] ?? data.coachSummary?.best ?? "rapport",
          needsWork: data.report?.improvements?.[0] ?? data.coachSummary?.needsWork ?? "close",
          note: data.report?.summary ?? data.coachSummary?.note ?? "Session analyzed.",
        },
        updatedAt: new Date().toISOString(),
      };

      setReport(report);
      setCoachStatus("saved");
    } catch (e: any) {
      console.error(e);
      setCoachStatus("idle");
      alert(e?.message || "Run Coaching Now failed.");
    }
  }

  // Auto-connect voice when session starts
  useEffect(() => {
    onConnectVoice();

    // Cleanup on unmount
    return () => {
      onDisconnectVoice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI helpers
  const phaseDots: PhaseId[] = [1, 2, 3, 4, 5];

  const pressureOptions: { key: PressureKey; label: string }[] = [
    { key: "fees_question", label: "fees_question" },
    { key: "market_fear", label: "market_fear" },
    { key: "skeptical_wait", label: "skeptical_wait" },
    { key: "other_realtor", label: "other_realtor" },
    { key: "time_pressure", label: "time_pressure" },
    { key: "just_browsing", label: "just_browsing" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-4">
          <div className="font-semibold text-lg">Live Roleplay Session</div>

          <div className="ml-2 flex items-center gap-2 text-sm">
            <span className="rounded-full border px-3 py-1 text-gray-700">Session: {sessionId}</span>
            <span className="rounded-full border px-3 py-1 text-gray-700">Mode: {stateMode}</span>
            <span className="rounded-full border px-3 py-1 text-gray-700">
              Difficulty: {difficulty}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="rounded-full border px-3 py-1 text-gray-700">Status: {voiceStatus}</span>
            <span className="rounded-full border px-3 py-1 text-gray-700">Turns: {capturedTurns}</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left card */}
          <div className="rounded-2xl border p-6">
            <div className="font-semibold">AI Buyer Avatar</div>

            <div className="mt-4 flex justify-center">
              <AvatarTalker level={audioLevel} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={onConnectVoice}
                className="rounded-full bg-black px-4 py-3 text-white font-semibold"
              >
                Connect Voice
              </button>
              <button
                onClick={onDisconnectVoice}
                className="rounded-full border px-4 py-3 font-semibold"
              >
                Disconnect
              </button>

              <button
                onClick={onRunCoachingNow}
                disabled={coachStatus === "running"}
                className="col-span-2 rounded-full border px-4 py-3 font-semibold"
              >
                {coachStatus === "running" ? "Running Coaching..." : "Run Coaching Now"}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-600 mb-1">Difficulty</div>
                <label htmlFor="difficulty-select" className="sr-only">
                  Difficulty
                </label>
                <select
                  id="difficulty-select"
                  className="w-full rounded-xl border px-3 py-2"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  aria-label="Difficulty"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              <div>
                <div className="text-gray-600 mb-1">Mode</div>
                <label htmlFor="stateMode-select" className="sr-only">
                  Mode
                </label>
                <select
                  id="stateMode-select"
                  className="w-full rounded-xl border px-3 py-2"
                  value={stateMode}
                  onChange={(e) => setStateMode(e.target.value as StateMode)}
                  aria-label="Mode"
                >
                  <option value="NV">NV</option>
                  <option value="GENERIC_US">GENERIC_US</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right card */}
          <div className="rounded-2xl border p-6">
            <div className="flex items-start gap-4">
              <div>
                <div className="text-xl font-semibold">{script.title}</div>
                <div className="text-gray-500">{script.subtitle}</div>
              </div>

              <div className="ml-auto flex gap-2">
                {phaseDots.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPhase(n)}
                    className={`h-10 w-10 rounded-full border text-sm font-semibold ${
                      phase === n ? "bg-black text-white" : "bg-white"
                    }`}
                    aria-label={`Phase ${n}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border p-5">
              <div className="text-xs font-semibold tracking-wide text-gray-500">PHASE GOAL</div>
              <div className="mt-1 font-medium">{script.goal}</div>

              <div className="mt-4 rounded-2xl border p-4">
                <div className="text-xs font-semibold tracking-wide text-gray-500">Say this</div>
                <div className="mt-1">{script.sayThis}</div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <div className="text-xs font-semibold tracking-wide text-gray-500">
                    Best follow-up
                  </div>
                  <div className="mt-1">{script.bestFollowUp}</div>
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="text-xs font-semibold tracking-wide text-gray-500">
                    Regain control line
                  </div>
                  <div className="mt-1">{script.regainControlLine}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="font-semibold">Buyer just said</div>
                <div className="text-sm text-gray-500">Pick the pressure spike you want the buyer to apply.</div>

                <div className="ml-auto flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Vibe</span>
                    <label htmlFor="vibe-select" className="sr-only">
                      Vibe
                    </label>
                    <select
                      id="vibe-select"
                      className="rounded-xl border px-3 py-2"
                      value={vibe}
                      onChange={(e) => setVibe(e.target.value as Vibe)}
                      aria-label="Vibe"
                    >
                      <option value="Direct">Direct</option>
                      <option value="Warm">Warm</option>
                      <option value="Analytical">Analytical</option>
                      <option value="Hype">Hype</option>
                      <option value="Calm">Calm</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Format</span>
                    <label htmlFor="format-select" className="sr-only">
                      Format
                    </label>
                    <select
                      id="format-select"
                      className="rounded-xl border px-3 py-2"
                      value={format}
                      onChange={(e) => setFormat(e.target.value as ConsultFormat)}
                      aria-label="Format"
                    >
                      <option value="phone">Phone</option>
                      <option value="zoom">Zoom</option>
                      <option value="in_person">In person</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={includeRepAgreement}
                      onChange={(e) => setIncludeRepAgreement(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Include rep agreement line
                  </label>
                </div>
              </div>

              {/* Single row of pressure chips (no 3 rows) */}
              <div className="mt-4 flex flex-wrap gap-2">
                {pressureOptions.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPressure(p.key)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium ${
                      pressure === p.key ? "bg-black text-white" : "bg-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                className="rounded-xl border px-6 py-3 font-semibold"
                onClick={() => setPhase((prev) => (prev > 1 ? ((prev - 1) as PhaseId) : prev))}
              >
                Back
              </button>

              <button
                className="rounded-xl bg-black px-6 py-3 font-semibold text-white"
                onClick={() => setPhase((prev) => (prev < 5 ? ((prev + 1) as PhaseId) : prev))}
              >
                Next Phase
              </button>
            </div>
          </div>
        </div>

        {/* Coach report (renders if available, does not change your UI layout above) */}
        {report && (
          <div className="mt-8 rounded-2xl border p-6">
            <div className="flex items-center gap-4">
              <div className="text-lg font-semibold">Coach Report</div>
              <div className="text-sm text-gray-500">Updated: {new Date(report.updatedAt).toLocaleString()}</div>
              <div className="ml-auto flex items-center gap-4 text-sm">
                <span className="font-semibold">Skill Grade: {report.grade}</span>
                <span className="font-semibold">Score: {report.score}/100</span>
                <span className={`font-semibold ${report.compliance === "FAIL" ? "text-red-600" : "text-green-600"}`}>
                  Compliance: {report.compliance}
                </span>
              </div>
            </div>

            <div className="mt-4 text-sm">
              <div className="font-semibold">Coach Summary:</div>
              <div className="text-gray-700">{report.coachSummary.note}</div>
            </div>

            {report.complianceFlags?.length > 0 && (
              <div className="mt-6 rounded-2xl border bg-orange-50 p-5">
                <div className="font-semibold">Compliance Flags</div>
                <div className="mt-2 space-y-1 text-sm">
                  {report.complianceFlags.map((f) => (
                    <div key={f.key}>
                      <span className="font-semibold">{f.label}:</span> {f.detail}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
