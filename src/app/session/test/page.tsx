"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AvatarTalker } from "@/components/AvatarTalker";

type Difficulty = "beginner" | "intermediate" | "advanced";
type StateMode = "NV" | "GENERIC_US";

type Turn = {
  speaker: "agent" | "buyer";
  text: string;
  ts: number;
};

type PhaseKey = "rapport" | "money" | "deep" | "frame" | "close";

const PHASES: { key: PhaseKey; title: string; subtitle: string }[] = [
  { key: "rapport", title: "Phase 1 — Rapport", subtitle: "Calm control + instant trust" },
  { key: "money", title: "Phase 2 — Money", subtitle: "Comfort, truth, and no awkwardness" },
  { key: "deep", title: "Phase 3 — Deep Questions", subtitle: "Expose fears + decision drivers" },
  { key: "frame", title: "Phase 4 — Frame", subtitle: "Your process (simple, confident)" },
  { key: "close", title: "Phase 5 — Close", subtitle: "Next step + commitment" },
];

const now = () => Date.now();

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id ?? "unknown";

  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [stateMode] = useState<StateMode>("NV");

  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [audioLevel, setAudioLevel] = useState(0);

  // Phase teleprompter
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phase = PHASES[phaseIndex];

  // WebRTC refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const dcQueueRef = useRef<string[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioElRef = useRef<HTMLAudioElement | null>(null);

  // Avatar analyzer refs
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Transcript capture (not displayed)
  const agentUtteranceRef = useRef("");
  const buyerUtteranceRef = useRef("");
  const conversationTurnsRef = useRef<Turn[]>([]);
  const [capturedCount, setCapturedCount] = useState(0);

  const log = (line: string) => setStatus(line);

  function dcSend(event: any) {
    const msg = JSON.stringify(event);
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") {
      dcQueueRef.current.push(msg);
      return;
    }
    dc.send(msg);
  }

  function flushDcQueue() {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    const q = dcQueueRef.current;
    dcQueueRef.current = [];
    for (const msg of q) dc.send(msg);
  }

  function pushTurn(speaker: Turn["speaker"], text: string) {
    const clean = text.trim();
    if (!clean) return;
    conversationTurnsRef.current.push({ speaker, text: clean, ts: now() });
    setCapturedCount(conversationTurnsRef.current.length);
  }

  function handleRealtimeEvent(raw: string) {
    let evt: any;
    try {
      evt = JSON.parse(raw);
    } catch {
      return;
    }

    // Agent mic transcription
    if (evt.type === "conversation.item.input_audio_transcription.delta") {
      agentUtteranceRef.current += evt.delta ?? "";
      return;
    }

    if (evt.type === "conversation.item.input_audio_transcription.completed") {
      const finalText = (evt.transcript ?? "").trim();
      agentUtteranceRef.current = "";
      if (finalText) pushTurn("agent", finalText);
      return;
    }

    // Buyer audio transcript
    if (evt.type === "response.output_audio_transcript.delta") {
      buyerUtteranceRef.current += evt.delta ?? "";
      return;
    }

    if (evt.type === "response.output_audio_transcript.done") {
      const finalText = (evt.text ?? "").trim();
      buyerUtteranceRef.current = "";
      if (finalText) pushTurn("buyer", finalText);
      return;
    }
  }

  const buyerRules = useMemo(() => {
    const difficultyRules =
      difficulty === "beginner"
        ? "Pressure low. Ask one question at a time. Interrupt rarely."
        : difficulty === "intermediate"
        ? "Pressure medium. Interrupt if the agent rambles or dodges money questions."
        : "Pressure high. Interrupt fast. Push hard on trust, fees, and urgency.";

    return `
You are a REAL home buyer in a live call with a real estate agent.

Hard rules:
- Speak ONLY English.
- Never mention AI, model, roleplay, simulation, training, or “session”.
- Never narrate your actions.
- You are NOT a coach. Do not help the agent.

Behavior:
- Sound human and specific.
- Ask realistic buyer questions.
- ${difficultyRules}
`.trim();
  }, [difficulty]);

  async function connectVoice() {
    try {
      setStatus("Starting…");
      setCapturedCount(0);
      conversationTurnsRef.current = [];
      agentUtteranceRef.current = "";
      buyerUtteranceRef.current = "";

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia not supported in this browser.");
      }

      log("Requesting mic permission…");
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = ms;

      log("Mic permission granted ✅ Creating RTCPeerConnection…");
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const track = ms.getTracks()[0];
      pc.addTrack(track, ms);

      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.controls = true; // keep for debugging
      audioEl.style.width = "100%";
      remoteAudioElRef.current = audioEl;

      const mount = document.getElementById("remote-audio-mount");
      mount?.replaceChildren(audioEl);

      pc.ontrack = (e) => {
        const stream = e.streams?.[0];
        if (!stream) return;

        log("Remote audio track received ✅");
        audioEl.srcObject = stream;

        audioEl
          .play()
          .then(() => log("Audio playback started ✅"))
          .catch(() => log("Audio blocked. Click play once on the bar."));

        // mouth movement
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        src.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);
        const loop = () => {
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length;
          setAudioLevel(Math.max(0, Math.min(1, avg / 80)));
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      };

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        log("Data channel open ✅");
        setConnected(true);
        flushDcQueue();

        // session settings
        dcSend({
          type: "session.update",
          session: {
            input_audio_transcription: { model: "gpt-4o-mini-transcribe" },
            output_modalities: ["audio", "text"],
            instructions: buyerRules,
          },
        });

        // instant opener
        dcSend({
          type: "response.create",
          response: {
            output_modalities: ["audio", "text"],
            instructions:
              "Say EXACTLY this one line, then stop: “Hey — before we start, what’s your plan for helping me buy a home?”",
          },
        });
      };

      dc.onmessage = (evt) => handleRealtimeEvent(evt.data);

      log("Creating SDP offer…");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      log("Calling /api/realtime/webrtc relay…");
      const resp = await fetch("/api/realtime/webrtc", {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp || "",
      });

      if (!resp.ok) {
        const errTxt = await resp.text();
        throw new Error("Relay failed: " + errTxt);
      }

      const answerSdp = await resp.text();
      log("Received SDP answer ✅ Setting remote description…");
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      log("Connected ✅");
    } catch (e: any) {
      try {
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      } catch {}
      setConnected(false);
      log("CONNECT FAILED ❌ " + String(e?.message ?? e));
    }
  }

  function disconnect() {
    setConnected(false);
    setStatus("Disconnected");

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setAudioLevel(0);

    try {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    } catch {}

    try {
      dcRef.current?.close();
      dcRef.current = null;
    } catch {}

    try {
      pcRef.current?.getSenders().forEach((s) => s.track?.stop());
      pcRef.current?.close();
      pcRef.current = null;
    } catch {}

    try {
      remoteAudioElRef.current?.pause();
      remoteAudioElRef.current = null;
      document.getElementById("remote-audio-mount")?.replaceChildren();
    } catch {}
  }

  useEffect(() => {
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teleprompter = useMemo(() => {
    const beginnerScripts: Record<PhaseKey, string> = {
      rapport: `
Say this (6th grade level, calm + confident):
“Hey, I’m glad we’re talking. Before we jump in, what made you start looking now?”
(Then pause. Let them talk.)

If they’re tense:
“Totally fair. Buying can feel stressful. My job is to keep it simple and protect you.”

Micro-control line:
“I’ll ask a few quick questions, then I’ll tell you the best next step.”
`.trim(),
      money: `
Say this:
“Real quick — what monthly payment feels safe for you?”
(If they dodge)
“No stress. Even a range helps. What feels comfortable: 1,800… 2,200… 2,600?”

Then:
“Do you know your credit range — over 700, 640–700, or under 640?”
“And do you have money saved for down payment and closing costs?”
`.trim(),
      deep: `
Say this:
“What are you most worried about with buying a home?”
(Then shut up.)

Follow-ups:
“What would make you feel confident saying yes?”
“Have you had a bad experience with an agent or lender before?”
“Is this home for 2 years… or 5+ years?”
`.trim(),
      frame: `
Say this:
“Here’s how I help buyers win in a simple way.”

1) “We get you clear on budget and approval.”
2) “We pick a smart plan — neighborhoods, priorities, and timing.”
3) “We tour with a purpose — not random houses.”
4) “We write a clean offer and negotiate hard.”
5) “I keep you updated until closing.”

Control line:
“I’ll lead the process so you don’t feel lost.”
`.trim(),
      close: `
Say this:
“Based on what you told me, the best next step is approval + a short list of homes.”

Close question:
“Do you want to talk to a lender today, or tomorrow?”

If they hesitate:
“No pressure. If we do the approval first, everything gets easier.”
`.trim(),
    };

    const intermediatePrompts: Record<PhaseKey, string> = {
      rapport: `Prompts:\n- Ask: Why now?\n- Mirror once\n- Set agenda: “I’ll ask a few questions, then we’ll map a plan.”`,
      money: `Prompts:\n- Payment comfort\n- Credit range\n- Savings\n- Timeline\n- No apologizing. No over-explaining.`,
      deep: `Prompts:\n- Biggest fear\n- Past bad experience\n- Must-haves vs dealbreakers\n- Who else influences the decision`,
      frame: `Prompts:\n- Your process in 4–6 simple steps\n- Confidence > complexity\n- “Tour with a purpose”`,
      close: `Prompts:\n- Decide next step (today/tomorrow)\n- Book lender call + showing plan`,
    };

    if (difficulty === "beginner") return beginnerScripts[phase.key];
    if (difficulty === "intermediate") return intermediatePrompts[phase.key];

    return `Advanced mode:
- No script.
- You lead.
- Ask hard questions early.
- Stay in control.`;
  }, [difficulty, phase.key]);

  function nextPhase() {
    setPhaseIndex((i) => Math.min(i + 1, PHASES.length - 1));
  }
  function prevPhase() {
    setPhaseIndex((i) => Math.max(i - 1, 0));
  }

  function triggerBuyerPressureLine() {
    dcSend({
      type: "response.create",
      response: {
        output_modalities: ["audio", "text"],
        instructions:
          "As the buyer, apply pressure in one sentence about trust or fees. Sound human. Do not mention roleplay or AI.",
      },
    });
  }

  return (
    <div style={{ maxWidth: 1200, margin: "30px auto", fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 6 }}>Live Roleplay Session</h1>
      <p style={{ opacity: 0.7, marginTop: 0 }}>
        Session ID: {sessionId} • Mode: {stateMode} • Difficulty: {difficulty}
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
        <label htmlFor="difficulty-select" style={{ marginRight: 6 }}>
          Difficulty:
        </label>

        <select
          id="difficulty-select"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        {!connected ? (
          <button onClick={connectVoice}>Connect Voice</button>
        ) : (
          <button onClick={disconnect}>Disconnect</button>
        )}

        <button onClick={triggerBuyerPressureLine} disabled={!connected} style={{ marginLeft: 8 }}>
          Pressure Spike
        </button>

        <div style={{ marginLeft: 10, fontSize: 12, opacity: 0.75 }}>
          Status: <b>{status}</b>
        </div>

        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.75 }}>
          Captured turns: <b>{capturedCount}</b>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16 }}>
        <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 12 }}>
          <h3 style={{ marginTop: 0 }}>AI Buyer Avatar</h3>
          <AvatarTalker level={audioLevel} />
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>Voice style: mature/pro</div>
          <div id="remote-audio-mount" style={{ marginTop: 12 }} />
        </div>

        <div style={{ border: "1px solid #ddd", padding: 14, borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h2 style={{ margin: 0 }}>{phase.title}</h2>
            <div style={{ opacity: 0.7 }}>{phase.subtitle}</div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {PHASES.map((p, idx) => (
              <button
                key={p.key}
                onClick={() => setPhaseIndex(idx)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid #ddd",
                  background: idx === phaseIndex ? "#111" : "#fff",
                  color: idx === phaseIndex ? "#fff" : "#111",
                  cursor: "pointer",
                }}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 12,
              border: "1px solid #eee",
              background: "#fafafa",
              minHeight: 260,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              fontSize: 15,
            }}
          >
            {teleprompter}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={prevPhase} disabled={phaseIndex === 0}>
              Back
            </button>
            <button onClick={nextPhase} disabled={phaseIndex === PHASES.length - 1}>
              Next Phase
            </button>

            <div style={{ marginLeft: "auto", opacity: 0.7, fontSize: 12, alignSelf: "center" }}>
              Goal: stay in control • ask hard questions early • keep it simple
            </div>
          </div>

          <div style={{ marginTop: 10, opacity: 0.6, fontSize: 12 }}>
            Coaching-ready: Transcript is being captured for post-session grading (not displayed).
          </div>
        </div>
      </div>
    </div>
  );
}
