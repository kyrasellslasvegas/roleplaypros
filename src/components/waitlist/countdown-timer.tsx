"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  targetDate: Date;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }

      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-gold-500/30 bg-obsidian-900/80 backdrop-blur-sm sm:h-24 sm:w-24">
                <span className="font-display text-3xl font-bold text-gold-500 sm:text-4xl">
                  --
                </span>
              </div>
              <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-gold-500/20 to-transparent opacity-50" />
            </div>
            <span className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">
              {["Days", "Hours", "Minutes", "Seconds"][i]}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const timeUnits = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      {timeUnits.map((unit, index) => (
        <div key={unit.label} className="flex flex-col items-center">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-gold-500/20 via-gold-400/30 to-gold-500/20 opacity-75 blur-sm group-hover:opacity-100 transition-opacity" />

            {/* Main container */}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-xl border border-gold-500/40 bg-obsidian-900/90 backdrop-blur-sm sm:h-24 sm:w-24 overflow-hidden">
              {/* Animated shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-500/10 to-transparent animate-shimmer" />

              {/* Number */}
              <span className="relative font-display text-3xl font-bold text-gold-500 sm:text-4xl tabular-nums">
                {String(unit.value).padStart(2, "0")}
              </span>
            </div>

            {/* Top reflection */}
            <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          </div>

          {/* Label */}
          <span className="mt-3 text-xs font-medium uppercase tracking-widest text-gold-500/70 sm:text-sm">
            {unit.label}
          </span>

          {/* Separator dots (except last) */}
          {index < timeUnits.length - 1 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 hidden sm:flex flex-col gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-gold-500/50" />
              <div className="h-1.5 w-1.5 rounded-full bg-gold-500/50" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
