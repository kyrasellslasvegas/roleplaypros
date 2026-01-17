"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  Target,
  TrendingUp,
  Shield,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  CreditCard,
  Trophy,
  Flame,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { GamificationDashboardData } from "@/types/gamification";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Roleplay", href: "/roleplay", icon: Users },
  { name: "Daily Drills", href: "/drills/daily", icon: Target },
  { name: "Achievements", href: "/achievements", icon: Trophy },
  { name: "Progress", href: "/progress", icon: TrendingUp },
  { name: "Compliance", href: "/compliance", icon: Shield },
  { name: "Scripts", href: "/scripts", icon: FileText },
];

const secondaryNavigation = [
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [gamificationData, setGamificationData] = useState<GamificationDashboardData | null>(null);

  useEffect(() => {
    async function loadGamificationData() {
      try {
        const response = await fetch("/api/gamification/progress");
        if (response.ok) {
          const data = await response.json();
          setGamificationData(data);
        }
      } catch (error) {
        console.error("Error loading gamification data:", error);
      }
    }

    loadGamificationData();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2 px-6">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary flex items-center justify-center">
          <span className="font-display text-lg font-bold text-primary-foreground">
            R
          </span>
        </div>
        <span className="font-display text-xl font-semibold">
          <span className="text-primary font-semibold">Roleplay</span>
          <span className="text-foreground"> Pros</span>
        </span>
      </div>

      {/* Gamification Status */}
      {gamificationData && (
        <div className="mx-4 mb-4 p-3 rounded-lg bg-muted/50 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary font-bold text-sm">
                {gamificationData.progress.currentLevel}
              </div>
              <div className="text-xs">
                <p className="font-medium text-foreground">
                  Level {gamificationData.progress.currentLevel}
                </p>
                <p className="text-muted-foreground">
                  {gamificationData.progress.totalXp.toLocaleString()} XP
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className={cn(
                "h-4 w-4",
                gamificationData.streakInfo.current > 0 ? "text-orange-500" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-sm font-medium",
                gamificationData.streakInfo.current > 0 ? "text-orange-500" : "text-muted-foreground"
              )}>
                {gamificationData.streakInfo.current}
              </span>
            </div>
          </div>
          {/* XP Progress Bar */}
          <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (gamificationData.progress.xpProgress / gamificationData.progress.xpToNextLevel) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-center">
            {gamificationData.progress.xpToNextLevel - gamificationData.progress.xpProgress} XP to Level {gamificationData.progress.currentLevel + 1}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-4">
        <ul className="flex flex-1 flex-col gap-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            </li>
          ))}

          <li className="my-4">
            <div className="h-px bg-border" />
          </li>

          {secondaryNavigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Bottom section */}
        <div className="space-y-2 pb-4">
          <div className="flex items-center justify-between px-3">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </Button>
        </div>
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-muted-foreground"
          onClick={() => setMobileOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex-1 text-sm font-semibold text-foreground">
          Roleplay Pros
        </div>
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="relative z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-background">
            <div className="absolute right-4 top-4">
              <button
                type="button"
                className="p-2.5 text-muted-foreground"
                onClick={() => setMobileOpen(false)}
                title="Close sidebar"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex h-full flex-col">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col border-r border-border bg-background">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}
