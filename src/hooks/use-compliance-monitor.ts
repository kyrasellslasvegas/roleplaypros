"use client";

import { useCallback, useState, useRef } from "react";
import { checkCompliance } from "@/lib/ai/prompts/compliance-rules";
import type { ComplianceViolation, TranscriptEntry } from "@/types/session";

interface UseComplianceMonitorOptions {
  onViolation?: (violation: ComplianceViolation) => void;
  enableAICheck?: boolean;
}

interface UseComplianceMonitorReturn {
  violations: ComplianceViolation[];
  checkMessage: (message: string, transcriptIndex: number) => ComplianceViolation[];
  clearViolations: () => void;
  dismissViolation: (id: string) => void;
  getViolationCount: () => { info: number; warning: number; critical: number };
}

export function useComplianceMonitor(
  options: UseComplianceMonitorOptions = {}
): UseComplianceMonitorReturn {
  const { onViolation, enableAICheck = false } = options;

  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const checkedMessagesRef = useRef<Set<string>>(new Set());

  // Check a message for compliance violations
  const checkMessage = useCallback(
    (message: string, transcriptIndex: number): ComplianceViolation[] => {
      // Avoid re-checking the same message
      const messageKey = `${transcriptIndex}:${message}`;
      if (checkedMessagesRef.current.has(messageKey)) {
        return [];
      }
      checkedMessagesRef.current.add(messageKey);

      // Run pattern-based checks
      const newViolations = checkCompliance(message, transcriptIndex);

      if (newViolations.length > 0) {
        setViolations((prev) => [...prev, ...newViolations]);

        // Notify for each violation
        newViolations.forEach((v) => onViolation?.(v));
      }

      // Optionally run AI check for more nuanced detection
      if (enableAICheck && newViolations.length === 0) {
        runAIComplianceCheck(message, transcriptIndex);
      }

      return newViolations;
    },
    [onViolation, enableAICheck]
  );

  // AI-based compliance check (async, supplements pattern matching)
  const runAIComplianceCheck = async (
    message: string,
    transcriptIndex: number
  ) => {
    try {
      const response = await fetch("/api/ai/compliance/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, transcriptIndex }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.violations?.length > 0) {
          const aiViolations: ComplianceViolation[] = data.violations.map(
            (v: Omit<ComplianceViolation, "id" | "timestamp">) => ({
              ...v,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              transcriptIndex,
            })
          );
          setViolations((prev) => [...prev, ...aiViolations]);
          aiViolations.forEach((v) => onViolation?.(v));
        }
      }
    } catch (error) {
      console.error("AI compliance check failed:", error);
    }
  };

  // Clear all violations
  const clearViolations = useCallback(() => {
    setViolations([]);
    checkedMessagesRef.current.clear();
  }, []);

  // Dismiss a specific violation
  const dismissViolation = useCallback((id: string) => {
    setViolations((prev) => prev.filter((v) => v.id !== id));
  }, []);

  // Get violation counts by severity
  const getViolationCount = useCallback(() => {
    return violations.reduce(
      (acc, v) => {
        acc[v.severity]++;
        return acc;
      },
      { info: 0, warning: 0, critical: 0 }
    );
  }, [violations]);

  return {
    violations,
    checkMessage,
    clearViolations,
    dismissViolation,
    getViolationCount,
  };
}
