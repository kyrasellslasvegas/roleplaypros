"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CoachSuggestion } from "@/types/session";
import type { CoachSSEEvent } from "@/types/ai";

interface UseAICoachOptions {
  onSuggestion?: (suggestion: CoachSuggestion) => void;
  autoConnect?: boolean;
}

interface UseAICoachReturn {
  suggestions: CoachSuggestion[];
  isConnected: boolean;
  connect: (sessionId: string) => void;
  disconnect: () => void;
  clearSuggestions: () => void;
}

export function useAICoach(options: UseAICoachOptions = {}): UseAICoachReturn {
  const { onSuggestion, autoConnect = false } = options;

  const [suggestions, setSuggestions] = useState<CoachSuggestion[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data: CoachSSEEvent = JSON.parse(event.data);

        // Ignore heartbeat events
        if (data.type === "heartbeat") {
          return;
        }

        // Handle suggestion/warning/praise events
        if (
          data.type === "suggestion" ||
          data.type === "warning" ||
          data.type === "praise"
        ) {
          const suggestion: CoachSuggestion = {
            id: data.id || crypto.randomUUID(),
            type: data.type,
            content: data.content || "",
            timestamp: data.timestamp || Date.now(),
            dismissed: false,
            hookCategory: data.hookCategory,
          };

          setSuggestions((prev) => [...prev, suggestion]);
          onSuggestion?.(suggestion);
        }
      } catch (error) {
        console.error("Failed to parse coach event:", error);
      }
    },
    [onSuggestion]
  );

  const connect = useCallback(
    (sessionId: string) => {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      sessionIdRef.current = sessionId;

      const eventSource = new EventSource(
        `/api/ai/coach/feedback?sessionId=${sessionId}`
      );

      eventSource.onopen = () => {
        console.log("Coach SSE connected");
        setIsConnected(true);
      };

      eventSource.onmessage = handleMessage;

      eventSource.onerror = (error) => {
        console.error("Coach SSE error:", error);
        setIsConnected(false);

        // Attempt to reconnect after 5 seconds
        if (sessionIdRef.current && !reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            if (sessionIdRef.current) {
              connect(sessionIdRef.current);
            }
          }, 5000);
        }
      };

      eventSourceRef.current = eventSource;
    },
    [handleMessage]
  );

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    sessionIdRef.current = null;
    setIsConnected(false);
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    suggestions,
    isConnected,
    connect,
    disconnect,
    clearSuggestions,
  };
}
