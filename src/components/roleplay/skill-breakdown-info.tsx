"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Heart,
  Search,
  DollarSign,
  Shield,
  Compass,
  Target,
  Scale,
  Info,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SKILL_AREAS = [
  {
    name: "Building Rapport",
    icon: Heart,
    description: "Personal connection, active listening, making buyer comfortable",
    tips: [
      "Use their name naturally",
      "Ask about their current situation",
      "Mirror their energy level",
      "Show genuine interest in their story",
    ],
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    name: "Discovery Questions",
    icon: Search,
    description: "Understanding buyer needs, motivations, timeline",
    tips: [
      "Ask open-ended questions",
      "Dig deeper into their 'why'",
      "Understand their timeline",
      "Uncover hidden concerns",
    ],
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    name: "Money Qualification",
    icon: DollarSign,
    description: "Budget discussion, pre-approval, financing comfort",
    tips: [
      "Ask about pre-approval status",
      "Discuss budget range comfortably",
      "Address financing concerns",
      "Ensure they understand costs",
    ],
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    name: "Objection Handling",
    icon: Shield,
    description: "Responding to concerns, staying calm, turning objections around",
    tips: [
      "Acknowledge their concern first",
      "Stay calm and professional",
      "Ask clarifying questions",
      "Provide reassurance with facts",
    ],
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    name: "Frame Control",
    icon: Compass,
    description: "Leading conversation, maintaining authority professionally",
    tips: [
      "Guide the conversation flow",
      "Set clear expectations",
      "Keep the discussion on track",
      "Demonstrate expertise confidently",
    ],
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    name: "Closing Skills",
    icon: Target,
    description: "Asking for commitment, clear next steps, handling hesitation",
    tips: [
      "Ask for the next step directly",
      "Create urgency appropriately",
      "Handle hesitation gracefully",
      "Confirm commitments clearly",
    ],
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    name: "Compliance",
    icon: Scale,
    description: "Nevada RE law adherence, proper disclosures, no illegal promises",
    tips: [
      "Never guarantee appreciation",
      "Disclose agency relationship",
      "Avoid discriminatory language",
      "Don't make unauthorized promises",
    ],
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
  },
];

interface SkillBreakdownInfoProps {
  className?: string;
  compact?: boolean;
}

export function SkillBreakdownInfo({ className, compact = false }: SkillBreakdownInfoProps) {
  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-primary" />
            How You&apos;ll Be Graded
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-2">
            {SKILL_AREAS.map((skill) => (
              <div
                key={skill.name}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <skill.icon className={`h-3 w-3 ${skill.color}`} />
                <span>{skill.name}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Have at least 2+ conversation exchanges for a detailed report.
          </p>
        </CardContent>
      </Card>
    );
  }

  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Performance Analysis Factors
        </CardTitle>
        <CardDescription>
          Your session will be analyzed across these 7 skill areas. Each receives a grade from A+ to F.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {SKILL_AREAS.map((skill) => (
            <div key={skill.name} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedSkill(expandedSkill === skill.name ? null : skill.name)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${skill.bgColor}`}>
                    <skill.icon className={`h-4 w-4 ${skill.color}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground text-sm">{skill.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {skill.description}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expandedSkill === skill.name && "rotate-180"
                  )}
                />
              </button>
              {expandedSkill === skill.name && (
                <div className="px-3 pb-3 pl-14 space-y-2 border-t bg-muted/30">
                  <p className="text-sm text-muted-foreground pt-2">
                    Tips for scoring well:
                  </p>
                  <ul className="space-y-1.5">
                    {skill.tips.map((tip, tipIndex) => (
                      <li
                        key={tipIndex}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-foreground text-sm mb-2">
            Requirements for a Detailed Report
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              At least 2 conversation exchanges (more is better)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Complete at least one full phase
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Speak clearly for accurate transcription
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
