"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trophy, Zap, Star, Lock } from "lucide-react";
import {
  AchievementCard,
  LevelShowcase,
  XpProgressBar,
} from "@/components/gamification";
import type {
  AchievementWithProgress,
  AchievementCategory,
  GamificationDashboardData,
} from "@/types/gamification";

interface AchievementsResponse {
  achievements: AchievementWithProgress[];
  byCategory: Record<string, AchievementWithProgress[]>;
  stats: {
    total: number;
    unlocked: number;
    percentage: number;
    totalXpEarned: number;
  };
}

const CATEGORY_LABELS: Record<AchievementCategory, { label: string; icon: string }> = {
  beginner: { label: "Getting Started", icon: "Star" },
  streak: { label: "Streaks", icon: "Flame" },
  skill: { label: "Skills", icon: "Target" },
  volume: { label: "Volume", icon: "BarChart2" },
  special: { label: "Special", icon: "Crown" },
};

export default function AchievementsPage() {
  const [achievementsData, setAchievementsData] = useState<AchievementsResponse | null>(null);
  const [gamificationData, setGamificationData] = useState<GamificationDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        const [achievementsRes, gamificationRes] = await Promise.all([
          fetch("/api/gamification/achievements"),
          fetch("/api/gamification/progress"),
        ]);

        if (achievementsRes.ok) {
          const data = await achievementsRes.json();
          setAchievementsData(data);
        }

        if (gamificationRes.ok) {
          const data = await gamificationRes.json();
          setGamificationData(data);
        }
      } catch (error) {
        console.error("Error loading achievements:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!achievementsData || !gamificationData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load achievements</p>
      </div>
    );
  }

  const filteredAchievements =
    activeCategory === "all"
      ? achievementsData.achievements
      : achievementsData.byCategory[activeCategory] || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground">
          Track your progress and unlock rewards
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Level Showcase */}
        <Card className="border-primary/20 bg-muted/50 md:row-span-2">
          <CardContent className="pt-6">
            <LevelShowcase
              level={gamificationData.progress.currentLevel}
              totalXp={gamificationData.progress.totalXp}
            />
            <div className="mt-4">
              <XpProgressBar
                currentXp={gamificationData.progress.totalXp}
                xpToNextLevel={gamificationData.progress.xpToNextLevel}
                currentLevel={gamificationData.progress.currentLevel}
                xpProgress={gamificationData.progress.xpProgress}
                size="sm"
                showDetails={false}
              />
              <p className="text-xs text-center text-muted-foreground mt-2">
                {gamificationData.progress.xpToNextLevel} XP to next level
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Achievement Stats */}
        <Card className="border-primary/20 bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {achievementsData.stats.unlocked}/{achievementsData.stats.total}
                </p>
                <p className="text-sm text-muted-foreground">
                  Achievements Unlocked
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Star className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {achievementsData.stats.percentage}%
                </p>
                <p className="text-sm text-muted-foreground">Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {achievementsData.stats.totalXpEarned.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  XP from Achievements
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Progress */}
        <Card className="border-primary/20 bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm font-medium mb-2">Overall Progress</p>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary rounded-full transition-all"
                style={{ width: `${achievementsData.stats.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{achievementsData.stats.unlocked} unlocked</span>
              <span>
                {achievementsData.stats.total - achievementsData.stats.unlocked}{" "}
                remaining
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-2">
              {achievementsData.stats.total}
            </Badge>
          </TabsTrigger>
          {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => {
            const count = achievementsData.byCategory[key]?.length || 0;
            const unlockedCount =
              achievementsData.byCategory[key]?.filter((a) => a.unlocked).length ||
              0;
            return (
              <TabsTrigger key={key} value={key}>
                {label}
                <Badge
                  variant="secondary"
                  className={`ml-2 ${
                    unlockedCount === count && count > 0
                      ? "bg-green-500/20 text-green-400"
                      : ""
                  }`}
                >
                  {unlockedCount}/{count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {/* Unlocked achievements */}
          {filteredAchievements.filter((a) => a.unlocked).length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Unlocked
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAchievements
                  .filter((a) => a.unlocked)
                  .map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Locked achievements */}
          {filteredAchievements.filter((a) => !a.unlocked).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                Locked
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAchievements
                  .filter((a) => !a.unlocked)
                  .sort((a, b) => (b.progress || 0) - (a.progress || 0))
                  .map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                    />
                  ))}
              </div>
            </div>
          )}

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No achievements in this category
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
