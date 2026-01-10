"use client";

import { cn } from "@/lib/utils";
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

interface ComplianceGaugeProps {
  score: number | null;
  issuesCount: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ComplianceGauge({
  score,
  issuesCount,
  size = "md",
  className,
}: ComplianceGaugeProps) {
  const displayScore = score ?? 0;
  const status = getComplianceStatus(displayScore);
  const Icon = status.icon;

  const sizes = {
    sm: { wrapper: "w-24 h-24", ring: 80, stroke: 6, text: "text-xl", icon: "h-4 w-4" },
    md: { wrapper: "w-32 h-32", ring: 110, stroke: 8, text: "text-3xl", icon: "h-5 w-5" },
    lg: { wrapper: "w-40 h-40", ring: 140, stroke: 10, text: "text-4xl", icon: "h-6 w-6" },
  };

  const { wrapper, ring, stroke, text, icon } = sizes[size];
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 100) * circumference;

  if (score === null) {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <div className={cn("relative flex items-center justify-center", wrapper)}>
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={stroke}
              className="text-muted"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Shield className={cn("text-muted-foreground", icon)} />
            <span className="text-sm text-muted-foreground mt-1">N/A</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">No compliance data</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn("relative flex items-center justify-center", wrapper)}>
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className={cn("transition-all duration-1000", status.color)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={cn(status.textColor, icon)} />
          <span className={cn("font-bold", text, status.textColor)}>
            {displayScore}%
          </span>
        </div>
      </div>
      <div className="text-center mt-2">
        <p className={cn("font-medium", status.textColor)}>{status.label}</p>
        {issuesCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {issuesCount} issue{issuesCount !== 1 ? "s" : ""} this week
          </p>
        )}
      </div>
    </div>
  );
}

function getComplianceStatus(score: number): {
  label: string;
  color: string;
  textColor: string;
  icon: typeof Shield;
} {
  if (score >= 95) {
    return {
      label: "Excellent",
      color: "text-green-500",
      textColor: "text-green-500",
      icon: ShieldCheck,
    };
  }
  if (score >= 80) {
    return {
      label: "Good",
      color: "text-blue-500",
      textColor: "text-blue-500",
      icon: Shield,
    };
  }
  if (score >= 60) {
    return {
      label: "Needs Work",
      color: "text-yellow-500",
      textColor: "text-yellow-500",
      icon: ShieldAlert,
    };
  }
  return {
    label: "At Risk",
    color: "text-red-500",
    textColor: "text-red-500",
    icon: ShieldX,
  };
}

// Simple badge variant for compact display
interface ComplianceBadgeProps {
  score: number | null;
  className?: string;
}

export function ComplianceBadge({ score, className }: ComplianceBadgeProps) {
  if (score === null) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-muted-foreground text-sm",
          className
        )}
      >
        <Shield className="h-3.5 w-3.5" />
        <span>N/A</span>
      </div>
    );
  }

  const status = getComplianceStatus(score);
  const Icon = status.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm",
        score >= 95 && "bg-green-500/20 text-green-400",
        score >= 80 && score < 95 && "bg-blue-500/20 text-blue-400",
        score >= 60 && score < 80 && "bg-yellow-500/20 text-yellow-400",
        score < 60 && "bg-red-500/20 text-red-400",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{score}%</span>
    </div>
  );
}
