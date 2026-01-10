import { createClient } from "@/lib/supabase/server";
import { generateJSONCompletion } from "@/lib/ai/openai";
import {
  REALTIME_COACH_SYSTEM_PROMPT,
  buildCoachAnalysisPrompt,
} from "@/lib/ai/prompts/coach-realtime";
import type { CoachAnalysisResponse } from "@/types/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return new Response("Session ID required", { status: 400 });
  }

  // Verify user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify user owns this session
  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .select("user_id, transcript, session_phases")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return new Response("Session not found", { status: 404 });
  }

  if (session.user_id !== user.id) {
    return new Response("Unauthorized", { status: 403 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  let isAborted = false;
  const previousSuggestions: string[] = [];

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial heartbeat
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}\n\n`
        )
      );

      // Analysis interval - check every 15 seconds
      const interval = setInterval(async () => {
        if (isAborted) {
          clearInterval(interval);
          return;
        }

        try {
          // Fetch latest transcript
          const { data: currentSession } = await supabase
            .from("training_sessions")
            .select("transcript, session_phases")
            .eq("id", sessionId)
            .single();

          if (!currentSession?.transcript?.length) {
            return;
          }

          const transcript = currentSession.transcript as Array<{
            speaker: string;
            content: string;
          }>;

          // Only analyze if we have enough conversation
          if (transcript.length < 2) {
            return;
          }

          // Get recent exchanges (last 6 messages)
          const recentExchanges = transcript.slice(-6);
          const currentPhase =
            currentSession.session_phases?.[
              currentSession.session_phases.length - 1
            ] || "rapport";

          // Build analysis prompt
          const analysisPrompt = buildCoachAnalysisPrompt(
            recentExchanges,
            currentPhase,
            previousSuggestions
          );

          // Get coach analysis from OpenAI
          const analysis = await generateJSONCompletion<CoachAnalysisResponse>(
            [
              { role: "system", content: REALTIME_COACH_SYSTEM_PROMPT },
              { role: "user", content: analysisPrompt },
            ],
            { model: "gpt-4o-mini", temperature: 0.7, maxTokens: 200 }
          );

          // Send suggestion if warranted
          if (analysis.shouldSuggest && analysis.content) {
            previousSuggestions.push(analysis.content);

            const event = {
              type: analysis.type || "suggestion",
              content: analysis.content,
              priority: analysis.priority || "medium",
              timestamp: Date.now(),
              id: crypto.randomUUID(),
            };

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );
          }
        } catch (error) {
          console.error("Coach analysis error:", error);
          // Don't send error to client, just log it
        }
      }, 15000); // Every 15 seconds

      // Handle abort
      request.signal.addEventListener("abort", () => {
        isAborted = true;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
