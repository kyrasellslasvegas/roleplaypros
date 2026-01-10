"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  Eye,
  Lightbulb,
  Award,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { CoachingInsight } from "@/types/gamification";

interface CoachingInsightsProps {
  insights: CoachingInsight[];
  className?: string;
}

export function CoachingInsights({ insights, className }: CoachingInsightsProps) {
  if (!insights.length) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Complete more sessions to unlock personalized coaching insights.</p>
      </div>
    );
  }

  // Sort by priority
  const sortedInsights = [...insights].sort((a, b) => a.priority - b.priority);

  return (
    <div className={cn("space-y-4", className)}>
      {sortedInsights.map((insight, index) => (
        <CoachingInsightCard key={index} insight={insight} />
      ))}
    </div>
  );
}

interface CoachingInsightCardProps {
  insight: CoachingInsight;
  className?: string;
}

export function CoachingInsightCard({
  insight,
  className,
}: CoachingInsightCardProps) {
  const hookStyle = getHookStyle(insight.hookCategory);
  const Icon = hookStyle.icon;

  return (
    <Card
      className={cn(
        "overflow-hidden border-l-4",
        hookStyle.borderColor,
        className
      )}
    >
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg shrink-0", hookStyle.bgColor)}>
            <Icon className={cn("h-5 w-5", hookStyle.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground">{insight.title}</h4>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full capitalize",
                  hookStyle.bgColor,
                  hookStyle.iconColor
                )}
              >
                {insight.hookCategory}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{insight.content}</p>
            <div
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                hookStyle.iconColor
              )}
            >
              <ArrowRight className="h-4 w-4" />
              <span>{insight.actionItem}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getHookStyle(hookCategory: CoachingInsight["hookCategory"]): {
  icon: typeof AlertTriangle;
  borderColor: string;
  bgColor: string;
  iconColor: string;
} {
  switch (hookCategory) {
    case "fear":
      return {
        icon: AlertTriangle,
        borderColor: "border-l-red-500",
        bgColor: "bg-red-500/10",
        iconColor: "text-red-500",
      };
    case "shame":
      return {
        icon: Eye,
        borderColor: "border-l-orange-500",
        bgColor: "bg-orange-500/10",
        iconColor: "text-orange-500",
      };
    case "curiosity":
      return {
        icon: Lightbulb,
        borderColor: "border-l-blue-500",
        bgColor: "bg-blue-500/10",
        iconColor: "text-blue-500",
      };
    case "authority":
      return {
        icon: Award,
        borderColor: "border-l-purple-500",
        bgColor: "bg-purple-500/10",
        iconColor: "text-purple-500",
      };
    case "drama":
      return {
        icon: Sparkles,
        borderColor: "border-l-primary",
        bgColor: "bg-primary/10",
        iconColor: "text-primary",
      };
    default:
      return {
        icon: Lightbulb,
        borderColor: "border-l-muted",
        bgColor: "bg-muted",
        iconColor: "text-muted-foreground",
      };
  }
}

// Compact single insight for dashboard
interface InsightHighlightProps {
  insight: CoachingInsight;
  className?: string;
}

export function InsightHighlight({ insight, className }: InsightHighlightProps) {
  const hookStyle = getHookStyle(insight.hookCategory);
  const Icon = hookStyle.icon;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border",
        hookStyle.bgColor,
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", hookStyle.iconColor)} />
        <span className={cn("font-medium text-sm", hookStyle.iconColor)}>
          {insight.title}
        </span>
      </div>
      <p className="text-sm text-foreground line-clamp-2">{insight.content}</p>
    </div>
  );
}
