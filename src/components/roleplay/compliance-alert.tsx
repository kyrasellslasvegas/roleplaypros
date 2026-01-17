"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getComplianceEducation } from "@/lib/ai/prompts/compliance-rules";
import type { ComplianceViolation } from "@/types/session";

interface ComplianceAlertProps {
  violations: ComplianceViolation[];
  onDismiss: (id: string) => void;
  className?: string;
}

export function ComplianceAlert({
  violations,
  onDismiss,
  className,
}: ComplianceAlertProps) {
  // Show only the most recent violations (max 3)
  const activeViolations = violations.slice(-3);

  if (activeViolations.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {activeViolations.map((violation) => (
        <ComplianceAlertCard
          key={violation.id}
          violation={violation}
          onDismiss={() => onDismiss(violation.id)}
        />
      ))}
    </div>
  );
}

interface ComplianceAlertCardProps {
  violation: ComplianceViolation;
  onDismiss: () => void;
}

function ComplianceAlertCard({ violation, onDismiss }: ComplianceAlertCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss info after 10 seconds, warnings after 15 seconds
  useEffect(() => {
    const duration = violation.severity === "info" ? 10000 : violation.severity === "warning" ? 15000 : 0;
    if (duration === 0) return; // Critical stays until dismissed

    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [violation.severity]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const getSeverityStyles = () => {
    switch (violation.severity) {
      case "critical":
        return {
          container: "bg-red-500/10 border-red-500/50 text-red-200",
          icon: "text-red-500",
          badge: "bg-red-500 text-white",
        };
      case "warning":
        return {
          container: "bg-orange-500/10 border-orange-500/50 text-orange-200",
          icon: "text-orange-500",
          badge: "bg-orange-500 text-white",
        };
      default:
        return {
          container: "bg-blue-500/10 border-blue-500/50 text-blue-200",
          icon: "text-blue-500",
          badge: "bg-blue-500 text-white",
        };
    }
  };

  const getSeverityIcon = () => {
    switch (violation.severity) {
      case "critical":
        return <AlertTriangle className="h-5 w-5" />;
      case "warning":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const styles = getSeverityStyles();
  const education = getComplianceEducation(violation.category);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border p-4 transition-all duration-300",
        styles.container,
        isVisible && !isLeaving
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 shrink-0", styles.icon)}>
          {getSeverityIcon()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Severity badge */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                styles.badge
              )}
            >
              <Shield className="h-3 w-3" />
              {violation.severity}
            </span>
            <span className="text-xs opacity-60 capitalize">
              {violation.category.replace("_", " ")}
            </span>
          </div>

          {/* Message */}
          <p className="text-sm font-medium">{violation.message}</p>

          {/* Suggestion */}
          <p className="mt-1 text-sm opacity-80">{violation.suggestion}</p>

          {/* Details toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-2 flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-3 w-3" /> Hide details
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" /> Learn more
              </>
            )}
          </button>

          {/* Expanded details */}
          {showDetails && education && (
            <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
              <h4 className="text-xs font-semibold">{education.title}</h4>
              <p className="text-xs opacity-80">{education.description}</p>
              <div className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                  Examples
                </span>
                <ul className="space-y-1">
                  {education.examples.map((example, i) => (
                    <li key={i} className="text-xs opacity-80 flex items-start gap-1">
                      <span className="opacity-60">•</span>
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          aria-label="Dismiss alert"
          title="Dismiss alert"
          onClick={handleDismiss}
          className="shrink-0 rounded p-1 transition-colors hover:bg-white/10"
        >
          <X className="h-4 w-4 opacity-60" />
        </button>
      </div>

      {/* Progress bar for auto-dismiss (non-critical only) */}
      {violation.severity !== "critical" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className={cn(
              "h-full transition-all ease-linear",
              violation.severity === "info"
                ? "bg-blue-500/50 duration-[10000ms]"
                : "bg-orange-500/50 duration-[15000ms]"
            )}
            style={{
              width: isVisible && !isLeaving ? "0%" : "100%",
            }}
          />
        </div>
      )}
    </div>
  );
}

// Compliance status badge for header
interface ComplianceStatusProps {
  violationCount: { info: number; warning: number; critical: number };
  className?: string;
}

export function ComplianceStatus({ violationCount, className }: ComplianceStatusProps) {
  const total = violationCount.info + violationCount.warning + violationCount.critical;
  const hasIssues = total > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1",
        hasIssues
          ? violationCount.critical > 0
            ? "bg-red-500/20 text-red-400"
            : "bg-orange-500/20 text-orange-400"
          : "bg-green-500/20 text-green-400",
        className
      )}
    >
      <Shield className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">
        {hasIssues ? `${total} issue${total > 1 ? "s" : ""}` : "Compliant"}
      </span>
    </div>
  );
}
