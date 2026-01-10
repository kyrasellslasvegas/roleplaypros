"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Users,
  Clock,
  Zap,
  Play,
  User,
  Brain,
  DollarSign,
  Shield,
  HelpCircle,
  Smile,
  AlertTriangle,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const difficultyLevels = [
  {
    id: "beginner",
    name: "Beginner",
    description: "Script-guided roleplay with teleprompter",
    icon: User,
  },
  {
    id: "intermediate",
    name: "Intermediate",
    description: "Partial script hints, more buyer resistance",
    icon: Brain,
  },
  {
    id: "advanced",
    name: "Advanced",
    description: "No script, real-time AI coach feedback",
    icon: Zap,
  },
];

const sessionDurations = [
  { id: "10", name: "10 min", description: "Quick practice" },
  { id: "30", name: "30 min", description: "Standard session" },
  { id: "60", name: "60 min", description: "Full buyer call" },
];

const buyerProfiles = {
  experienceLevel: [
    { id: "first_time", label: "First-Time Buyer", icon: User },
    { id: "move_up", label: "Move-Up Buyer", icon: Users },
    { id: "investor_lite", label: "Lite Investor", icon: DollarSign },
  ],
  emotionalState: [
    { id: "excited", label: "Excited" },
    { id: "rushed", label: "Rushed" },
  ],
  financialComfort: [
    { id: "clear", label: "Clear Budget" },
    { id: "unclear", label: "Unclear Budget" },
    { id: "embarrassed", label: "Embarrassed" },
  ],
  resistanceLevel: [
    { id: "low", label: "Low" },
    { id: "medium", label: "Medium" },
    { id: "high", label: "High" },
  ],
  questionDepth: [
    { id: "surface", label: "Surface" },
    { id: "mixed", label: "Mixed" },
    { id: "advanced", label: "Advanced" },
  ],
  personality: [
    { id: "friendly", label: "Friendly", icon: Smile, description: "Warm, personable, enjoys rapport" },
    { id: "cautious", label: "Cautious", icon: Shield, description: "Careful, needs time to think" },
    { id: "dominant", label: "Dominant", icon: Zap, description: "Takes charge, challenges you" },
    { id: "distracted", label: "Distracted", icon: HelpCircle, description: "Busy, hard to pin down" },
    { id: "nervous", label: "Nervous", icon: AlertTriangle, description: "Anxious, worried about mistakes" },
    { id: "skeptical", label: "Skeptical", icon: Search, description: "Doubtful, needs proof" },
  ],
};

export default function RoleplayPage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState("beginner");
  const [duration, setDuration] = useState("30");
  const [profile, setProfile] = useState({
    experienceLevel: "first_time",
    emotionalState: "excited",
    financialComfort: "unclear",
    resistanceLevel: "medium",
    questionDepth: "mixed",
    personality: "cautious",
  });

  const handleProfileChange = (key: string, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleStartSession = () => {
    const config = {
      difficulty,
      durationMinutes: parseInt(duration),
      buyerProfile: profile,
    };
    const encodedConfig = encodeURIComponent(JSON.stringify(config));
    router.push(`/roleplay/session?config=${encodedConfig}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          AI Buyer Roleplay
        </h1>
        <p className="mt-1 text-muted-foreground">
          Configure your practice session and start training
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left column - Configuration */}
        <div className="space-y-6 lg:col-span-2">
          {/* Difficulty Level */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Difficulty Level
              </CardTitle>
              <CardDescription>
                Choose your challenge level for this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {difficultyLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setDifficulty(level.id)}
                    className={cn(
                      "flex flex-col items-start rounded-lg border p-4 text-left transition-colors",
                      difficulty === level.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    )}
                  >
                    <level.icon
                      className={cn(
                        "h-6 w-6 mb-2",
                        difficulty === level.id
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                    <span className="font-medium text-foreground">
                      {level.name}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {level.description}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Session Duration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Session Duration
              </CardTitle>
              <CardDescription>
                How long do you want to practice?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {sessionDurations.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDuration(d.id)}
                    className={cn(
                      "flex-1 rounded-lg border p-4 text-center transition-colors",
                      duration === d.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    )}
                  >
                    <span className="block text-xl font-bold text-foreground">
                      {d.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {d.description}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Buyer Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Buyer Profile
              </CardTitle>
              <CardDescription>
                Customize the AI buyer&apos;s personality and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Experience Level */}
              <div>
                <Label className="text-sm font-medium">Experience Level</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {buyerProfiles.experienceLevel.map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        handleProfileChange("experienceLevel", item.id)
                      }
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                        profile.experienceLevel === item.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emotional State */}
              <div>
                <Label className="text-sm font-medium">Emotional State</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {buyerProfiles.emotionalState.map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        handleProfileChange("emotionalState", item.id)
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        profile.emotionalState === item.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial Comfort */}
              <div>
                <Label className="text-sm font-medium">Financial Comfort</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {buyerProfiles.financialComfort.map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        handleProfileChange("financialComfort", item.id)
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        profile.financialComfort === item.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resistance Level */}
              <div>
                <Label className="text-sm font-medium">Resistance Level</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {buyerProfiles.resistanceLevel.map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        handleProfileChange("resistanceLevel", item.id)
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        profile.resistanceLevel === item.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personality - Now 6 types */}
              <div>
                <Label className="text-sm font-medium">Buyer Personality</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                  Choose how the AI buyer will behave during your roleplay
                </p>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  {buyerProfiles.personality.map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        handleProfileChange("personality", item.id)
                      }
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                        profile.personality === item.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className={cn(
                          "h-4 w-4",
                          profile.personality === item.id
                            ? "text-primary"
                            : "text-muted-foreground"
                        )} />
                        <span className={cn(
                          "font-medium text-sm",
                          profile.personality === item.id
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}>
                          {item.label}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Summary & Start */}
        <div className="space-y-6">
          <Card className="sticky top-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle>Session Summary</CardTitle>
              <CardDescription>
                Review your configuration before starting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty</span>
                  <span className="font-medium capitalize text-foreground">
                    {difficulty}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium text-foreground">
                    {duration} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buyer Type</span>
                  <span className="font-medium capitalize text-foreground">
                    {profile.experienceLevel.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Personality</span>
                  <span className="font-medium capitalize text-foreground">
                    {profile.personality}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Energy</span>
                  <span className="font-medium capitalize text-foreground">
                    {profile.emotionalState}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resistance</span>
                  <span className="font-medium capitalize text-foreground">
                    {profile.resistanceLevel}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleStartSession}
                >
                  <Play className="h-5 w-5" />
                  Start Session
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Session will begin with your selected configuration
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Script Phases Preview (for Beginner) */}
          {difficulty === "beginner" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Script Phases</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      1
                    </span>
                    <span className="text-muted-foreground">
                      Building Rapport
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      2
                    </span>
                    <span className="text-muted-foreground">
                      Questions About Money
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      3
                    </span>
                    <span className="text-muted-foreground">Deep Questions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      4
                    </span>
                    <span className="text-muted-foreground">Frame</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      5
                    </span>
                    <span className="text-muted-foreground">Close</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
