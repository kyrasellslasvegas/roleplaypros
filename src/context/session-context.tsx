"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import type {
  SessionState,
  SessionConfig,
  TranscriptEntry,
  CoachSuggestion,
  SessionPhase,
  ComplianceViolation,
  TeleprompterSuggestion,
} from "@/types/session";

type SessionAction =
  | { type: "SET_CONFIG"; config: SessionConfig }
  | { type: "START_SESSION"; sessionId: string }
  | { type: "SET_STATUS"; status: SessionState["status"] }
  | { type: "ADD_TRANSCRIPT"; entry: TranscriptEntry }
  | { type: "ADD_COACH_SUGGESTION"; suggestion: CoachSuggestion }
  | { type: "DISMISS_SUGGESTION"; id: string }
  | { type: "SET_PHASE"; phase: SessionPhase }
  | { type: "UPDATE_ELAPSED"; seconds: number }
  | { type: "UPDATE_SPEAKING_TIME"; duration: number }
  | { type: "RESET_SPEAKING_TIME" }
  | { type: "ADD_COMPLIANCE_VIOLATION"; violation: ComplianceViolation }
  | { type: "DISMISS_COMPLIANCE_VIOLATION"; id: string }
  | { type: "SET_TELEPROMPTER_SUGGESTIONS"; suggestions: TeleprompterSuggestion[] }
  | { type: "SET_ERROR"; error: string }
  | { type: "RESET" };

const initialState: SessionState = {
  sessionId: null,
  status: "configuring",
  config: null,
  transcript: [],
  coachSuggestions: [],
  complianceViolations: [],
  teleprompterSuggestions: [],
  currentPhase: "rapport",
  startedAt: null,
  elapsedSeconds: 0,
  lastUserSpeakTime: 0,
  agentSpeakingDuration: 0,
  error: null,
};

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "SET_CONFIG":
      return { ...state, config: action.config };

    case "START_SESSION":
      return {
        ...state,
        sessionId: action.sessionId,
        status: "connecting",
        startedAt: Date.now(),
      };

    case "SET_STATUS":
      return { ...state, status: action.status };

    case "ADD_TRANSCRIPT":
      return {
        ...state,
        transcript: [...state.transcript, action.entry],
        // Reset speaking duration when user finishes speaking
        agentSpeakingDuration: action.entry.speaker === "user" ? 0 : state.agentSpeakingDuration,
        lastUserSpeakTime: action.entry.speaker === "user" ? state.elapsedSeconds : state.lastUserSpeakTime,
      };

    case "ADD_COACH_SUGGESTION":
      return {
        ...state,
        coachSuggestions: [...state.coachSuggestions, action.suggestion],
      };

    case "DISMISS_SUGGESTION":
      return {
        ...state,
        coachSuggestions: state.coachSuggestions.map((s) =>
          s.id === action.id ? { ...s, dismissed: true } : s
        ),
      };

    case "SET_PHASE":
      return { ...state, currentPhase: action.phase };

    case "UPDATE_ELAPSED":
      return { ...state, elapsedSeconds: action.seconds };

    case "UPDATE_SPEAKING_TIME":
      return { ...state, agentSpeakingDuration: action.duration };

    case "RESET_SPEAKING_TIME":
      return { ...state, agentSpeakingDuration: 0 };

    case "ADD_COMPLIANCE_VIOLATION":
      return {
        ...state,
        complianceViolations: [...state.complianceViolations, action.violation],
      };

    case "DISMISS_COMPLIANCE_VIOLATION":
      return {
        ...state,
        complianceViolations: state.complianceViolations.filter(
          (v) => v.id !== action.id
        ),
      };

    case "SET_TELEPROMPTER_SUGGESTIONS":
      return { ...state, teleprompterSuggestions: action.suggestions };

    case "SET_ERROR":
      return { ...state, error: action.error, status: "error" };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

interface SessionContextValue {
  state: SessionState;
  setConfig: (config: SessionConfig) => void;
  startSession: (sessionId: string) => void;
  setStatus: (status: SessionState["status"]) => void;
  addTranscriptEntry: (speaker: "user" | "ai_buyer", content: string) => void;
  addCoachSuggestion: (suggestion: Omit<CoachSuggestion, "id">) => void;
  dismissSuggestion: (id: string) => void;
  setPhase: (phase: SessionPhase) => void;
  updateElapsed: (seconds: number) => void;
  updateSpeakingTime: (duration: number) => void;
  resetSpeakingTime: () => void;
  addComplianceViolation: (violation: ComplianceViolation) => void;
  dismissComplianceViolation: (id: string) => void;
  setTeleprompterSuggestions: (suggestions: TeleprompterSuggestion[]) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const setConfig = useCallback((config: SessionConfig) => {
    dispatch({ type: "SET_CONFIG", config });
  }, []);

  const startSession = useCallback((sessionId: string) => {
    dispatch({ type: "START_SESSION", sessionId });
  }, []);

  const setStatus = useCallback((status: SessionState["status"]) => {
    dispatch({ type: "SET_STATUS", status });
  }, []);

  const addTranscriptEntry = useCallback(
    (speaker: "user" | "ai_buyer", content: string) => {
      const entry: TranscriptEntry = {
        id: crypto.randomUUID(),
        speaker,
        content,
        timestamp: state.elapsedSeconds,
        phase: state.currentPhase,
      };
      dispatch({ type: "ADD_TRANSCRIPT", entry });
    },
    [state.elapsedSeconds, state.currentPhase]
  );

  const addCoachSuggestion = useCallback(
    (suggestion: Omit<CoachSuggestion, "id">) => {
      const fullSuggestion: CoachSuggestion = {
        ...suggestion,
        id: crypto.randomUUID(),
      };
      dispatch({ type: "ADD_COACH_SUGGESTION", suggestion: fullSuggestion });
    },
    []
  );

  const dismissSuggestion = useCallback((id: string) => {
    dispatch({ type: "DISMISS_SUGGESTION", id });
  }, []);

  const setPhase = useCallback((phase: SessionPhase) => {
    dispatch({ type: "SET_PHASE", phase });
  }, []);

  const updateElapsed = useCallback((seconds: number) => {
    dispatch({ type: "UPDATE_ELAPSED", seconds });
  }, []);

  const updateSpeakingTime = useCallback((duration: number) => {
    dispatch({ type: "UPDATE_SPEAKING_TIME", duration });
  }, []);

  const resetSpeakingTime = useCallback(() => {
    dispatch({ type: "RESET_SPEAKING_TIME" });
  }, []);

  const addComplianceViolation = useCallback((violation: ComplianceViolation) => {
    dispatch({ type: "ADD_COMPLIANCE_VIOLATION", violation });
  }, []);

  const dismissComplianceViolation = useCallback((id: string) => {
    dispatch({ type: "DISMISS_COMPLIANCE_VIOLATION", id });
  }, []);

  const setTeleprompterSuggestions = useCallback(
    (suggestions: TeleprompterSuggestion[]) => {
      dispatch({ type: "SET_TELEPROMPTER_SUGGESTIONS", suggestions });
    },
    []
  );

  const setError = useCallback((error: string) => {
    dispatch({ type: "SET_ERROR", error });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return (
    <SessionContext.Provider
      value={{
        state,
        setConfig,
        startSession,
        setStatus,
        addTranscriptEntry,
        addCoachSuggestion,
        dismissSuggestion,
        setPhase,
        updateElapsed,
        updateSpeakingTime,
        resetSpeakingTime,
        addComplianceViolation,
        dismissComplianceViolation,
        setTeleprompterSuggestions,
        setError,
        reset,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
