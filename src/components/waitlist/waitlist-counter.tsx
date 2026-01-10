"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

interface WaitlistCounterProps {
  initialCount?: number;
  launchDate?: Date;
}

// Launch date: January 16, 2026 at 12:01 PM PST
const LAUNCH_DATE = new Date("2026-01-16T20:01:00.000Z");

// Base count to display (inflated)
const BASE_COUNT = 427;

// Function to calculate the inflated count based on time of day
function calculateInflatedCount(): number {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hoursElapsed = (now.getTime() - startOfDay.getTime()) / (1000 * 60 * 60);

  // Add 1-3 "signups" per hour, creating a natural growth pattern
  // This gives roughly 24-72 new signups per day
  const dailyGrowth = Math.floor(hoursElapsed * (1 + Math.random() * 2));

  // Also add some based on the day of the month for variation
  const dayBonus = now.getDate() * 2;

  return BASE_COUNT + dailyGrowth + dayBonus;
}

export function WaitlistCounter({ initialCount, launchDate = LAUNCH_DATE }: WaitlistCounterProps) {
  const [count, setCount] = useState(initialCount ?? calculateInflatedCount());
  const [mounted, setMounted] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if launch date has passed
    const checkExpiration = () => {
      const now = new Date();
      if (now >= launchDate) {
        setIsExpired(true);
      }
    };

    checkExpiration();

    // Set initial inflated count
    setCount(calculateInflatedCount());

    // Increment count randomly throughout the day (every 5-15 minutes)
    const incrementInterval = setInterval(() => {
      // Check expiration on each tick
      const now = new Date();
      if (now >= launchDate) {
        setIsExpired(true);
        return;
      }

      // Random chance to increment (about 30% chance each interval)
      if (Math.random() < 0.3) {
        setCount((prev) => prev + Math.floor(1 + Math.random() * 2));
      }
    }, 5 * 60 * 1000 + Math.random() * 10 * 60 * 1000); // 5-15 minutes

    // Also add occasional "burst" signups
    const burstInterval = setInterval(() => {
      const now = new Date();
      if (now >= launchDate) {
        setIsExpired(true);
        return;
      }

      // 10% chance of a small burst (2-5 signups)
      if (Math.random() < 0.1) {
        setCount((prev) => prev + Math.floor(2 + Math.random() * 3));
      }
    }, 30 * 60 * 1000); // Check every 30 minutes

    return () => {
      clearInterval(incrementInterval);
      clearInterval(burstInterval);
    };
  }, [launchDate]);

  // Don't render if countdown has expired
  if (isExpired) {
    return null;
  }

  // Format number with commas
  const formattedCount = count.toLocaleString();

  if (!mounted) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-2">
        <Users className="h-4 w-4 text-gold-500" />
        <span className="text-sm font-medium text-gold-500">
          <span className="tabular-nums">---</span> agents waiting
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-2 backdrop-blur-sm">
      <div className="relative">
        <Users className="h-4 w-4 text-gold-500" />
        {/* Pulse animation */}
        <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-500" />
        </span>
      </div>
      <span className="text-sm font-medium text-gold-500">
        <span className="tabular-nums font-bold">{formattedCount}</span> agents waiting
      </span>
    </div>
  );
}
