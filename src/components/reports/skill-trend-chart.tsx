"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { SkillName, SkillChange } from "@/types/gamification";
import { SKILL_DISPLAY_NAMES } from "@/types/gamification";

interface SkillTrendChartProps {
  skillGrades: Partial<Record<SkillName, string>>;
  skillChanges: Partial<Record<SkillName, SkillChange>>;
  className?: string;
}

export function SkillTrendChart({
  skillGrades,
  skillChanges,
  className,
}: SkillTrendChartProps) {
  const skills = Object.keys(skillGrades) as SkillName[];

  return (
    <div className={cn("space-y-3", className)}>
      {skills.map((skill) => {
        const grade = skillGrades[skill] || "C";
        const change = skillChanges[skill];
        const trend = change?.trend || "stable";
        const percentage = gradeToPercentage(grade);

        return (
          <div key={skill} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {SKILL_DISPLAY_NAMES[skill]}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-semibold",
                    getGradeColor(grade)
                  )}
                >
                  {grade}
                </span>
                <TrendIndicator trend={trend} />
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  getBarColor(grade)
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrendIndicator({ trend }: { trend: "improving" | "stable" | "declining" }) {
  if (trend === "improving") {
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  }
  if (trend === "declining") {
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function gradeToPercentage(grade: string): number {
  const percentages: Record<string, number> = {
    "A+": 100, A: 95, "A-": 90,
    "B+": 85, B: 80, "B-": 75,
    "C+": 70, C: 65, "C-": 60,
    "D+": 55, D: 50, "D-": 45,
    F: 30,
  };
  return percentages[grade] || 50;
}

function getGradeColor(grade: string): string {
  if (grade.startsWith("A")) return "text-green-500";
  if (grade.startsWith("B")) return "text-blue-500";
  if (grade.startsWith("C")) return "text-yellow-500";
  if (grade.startsWith("D")) return "text-orange-500";
  return "text-red-500";
}

function getBarColor(grade: string): string {
  if (grade.startsWith("A")) return "bg-green-500";
  if (grade.startsWith("B")) return "bg-blue-500";
  if (grade.startsWith("C")) return "bg-yellow-500";
  if (grade.startsWith("D")) return "bg-orange-500";
  return "bg-red-500";
}

// Compact version for dashboard
interface SkillGradeCardProps {
  skill: SkillName;
  grade: string;
  change?: SkillChange;
  className?: string;
}

export function SkillGradeCard({
  skill,
  grade,
  change,
  className,
}: SkillGradeCardProps) {
  const trend = change?.trend || "stable";

  return (
    <div
      className={cn(
        "p-3 rounded-lg border bg-card",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          {SKILL_DISPLAY_NAMES[skill]}
        </span>
        <TrendIndicator trend={trend} />
      </div>
      <div className={cn("text-2xl font-bold", getGradeColor(grade))}>
        {grade}
      </div>
      {change?.previous && change.previous !== grade && (
        <div className="text-xs text-muted-foreground mt-1">
          was {change.previous}
        </div>
      )}
    </div>
  );
}
