/# Real Estate Sales Training SaaS - Master Implementation Plan

## Executive Summary

This document outlines the complete implementation strategy 
for a world-class Real Estate Sales Training SaaS application featuring AI-powered buyer roleplay realistic avatar that talks and interact with the users as if it was a real buyer, real-time coaching, compliance monitoring, and teleprompter-based script training.

**Core Value Proposition:**
Transform real estate agents into top-tier sales professionals through realistic AI buyer simulations, immediate feedback, and compliance-safe practice environments.

**Technology Stack:**
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Authentication:** Supabase Auth (JWT-based)
- **Database:** Supabase PostgreSQL
- **AI Engine:** OpenAI GPT-4o for real-time conversations
- **Voice:**  OpenAI Realtime API
- **Deployment:** Vercel 

---

## Application Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  (Next.js App Router + shadcn/ui + Tailwind CSS)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Authentication Layer                       │
│        (Supabase Auth + JWT + Middleware Protection)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Core AI Systems                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  AI Buyer    │  │  AI Coach    │  │  Compliance  │     │
│  │  (Roleplay)  │  │  (Feedback)  │  │    Guard     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│     (Supabase PostgreSQL + Real-time + Storage)             │
└─────────────────────────────────────────────────────────────┘
```

### Key Features Architecture

#### 1. AI Buyer System (Roleplay Engine)
- **Purpose:** Simulate realistic buyer behavior
- **Personalities:** 6 types (friendly, cautious, dominant, distracted, nervous, skeptical)
- **Difficulty Levels:** Beginner, Intermediate, Advanced
- **Session Types:** 10min, 30min, 60min
- **Interruption Logic:** Triggers based on agent behavior

#### 2. AI Sales Coach (Feedback Engine)
- **Purpose:** Provide detailed post-session analysis
- **Tone:** Firm, calm, direct (not friendly, not harsh)
- **Output:** Structured feedback with bullets on weak points, missed info, fixes
- **Hook Categories:** Fear, Shame, Curiosity, Authority, Drama

#### 3. Compliance Guard (Legal Monitor)
- **Purpose:** Real-time Nevada real estate law compliance monitoring
- **Scope:** Licensing, disclosure timing, ethical violations
- **Action:** Immediate flagging when risk appears

#### 4. Teleprompter System
- **Purpose:** Guide agents through structured sales conversations
- **Phases:**
  1. Building Rapport
  2. Questions About Money
  3. Deep Questions
  4. Frame
  5. Close
- **Reading Level:** 6th grade
- **Visibility:** Beginner only, hidden at Advanced

#### 5. Daily/Weekly Features
- Objection of the Day (5min drills)
- Weekly Skill Grade + Compliance Check
- Streak tracking and progression metrics

---

## Phase 1: Foundation Setup (Week 1-2)

### Objective
Build a production-ready Next.js application with Supabase authentication, page protection, and core UI framework.

### 1.1 Next.js Project Initialization

**Command:**
```bash
npx create-next-app@latest real-estate-saas --typescript --tailwind --app --src-dir --import-alias "@/*"
```

**Configuration Selections:**
- ✅ TypeScript
- ✅ ESLint
- ✅ Tailwind CSS
- ✅ `src/` directory
- ✅ App Router
- ✅ Import alias (@/*)
- ❌ Turbopack (optional)

### 1.2 shadcn/ui Setup

**Initialize shadcn/ui:**
```bash
npx shadcn@latest init
```

**Configuration (components.json):**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "hooks": "@/hooks"
  }
}
```

**Install Essential Components:**
```bash
npx shadcn@latest add button card input label form dropdown-menu navigation-menu sheet dialog avatar badge separator tabs select textarea toast skeleton
```

### 1.3 Tailwind CSS Custom Configuration

**File:** `tailwind.config.ts`
```typescript
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        // Custom Real Estate Luxury Theme
        luxury: {
          gold: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
          },
          black: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
            950: '#030712',
          }
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

### 1.4 Dark Mode Setup

**Install next-themes:**
```bash
npm install next-themes
```

**Create Theme Provider:**
**File:** `src/components/providers/theme-provider.tsx`
```typescript
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### 1.5 Project File Structure

```
real-estate-saas/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── practice/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx
│   │   │   ├── objections/
│   │   │   │   └── page.tsx
│   │   │   ├── drills/
│   │   │   │   └── page.tsx
│   │   │   ├── progress/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── callback/
│   │   │   │       └── route.ts
│   │   │   ├── ai/
│   │   │   │   ├── buyer/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── coach/
│   │   │   │   │   └── route.ts
│   │   │   │   └── compliance/
│   │   │   │       └── route.ts
│   │   │   └── session/
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── sidebar.tsx
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   └── auth-wrapper.tsx
│   │   ├── practice/
│   │   │   ├── ai-buyer-avatar.tsx
│   │   │   ├── teleprompter.tsx
│   │   │   ├── session-controls.tsx
│   │   │   └── compliance-monitor.tsx
│   │   ├── coach/
│   │   │   ├── feedback-panel.tsx
│   │   │   └── skill-breakdown.tsx
│   │   ├── drills/
│   │   │   ├── objection-card.tsx
│   │   │   └── daily-drill.tsx
│   │   └── providers/
│   │       ├── theme-provider.tsx
│   │       └── auth-provider.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── ai/
│   │   │   ├── openai-client.ts
│   │   │   ├── buyer-engine.ts
│   │   │   ├── coach-engine.ts
│   │   │   └── compliance-engine.ts
│   │   ├── prompts/
│   │   │   ├── buyer-prompts.ts
│   │   │   ├── coach-prompts.ts
│   │   │   └── script-generator.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-session.ts
│   │   └── use-ai-conversation.ts
│   ├── types/
│   │   ├── database.types.ts
│   │   ├── ai.types.ts
│   │   └── session.types.ts
│   └── middleware.ts
├── public/
│   ├── avatars/
│   └── images/
├── .env.local
├── .env.example
├── components.json
├── next.config.js
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## Phase 2: Supabase Setup & Authentication

### 2.1 Supabase Project Creation

**Steps:**
1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - **Name:** real-estate-training-saas
   - **Database Password:** [Generate strong password - save this!]
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free (for development)
4. Wait for project to initialize (~2 minutes)

**Collect These Values:**
- Project URL: `https://[your-project].supabase.co`
- Anon/Public Key: `eyJhbGc...` (public, safe for client)
- Service Role Key: `eyJhbGc...` (secret, server-only)

### 2.2 Database Schema Design

**Tables to Create:**

#### Users Profile Table
```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text default 'agent' check (role in ('agent', 'admin')),
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'enterprise')),
  subscription_status text default 'active' check (subscription_status in ('active', 'cancelled', 'expired')),
  subscription_ends_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

#### Practice Sessions Table
```sql
create table public.practice_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  difficulty_level text not null check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
  session_duration integer not null check (session_duration in (10, 30, 60)),
  buyer_profile jsonb not null, -- Store buyer personality, experience level, etc.
  transcript jsonb[], -- Array of conversation turns
  compliance_flags jsonb[], -- Array of compliance issues
  coach_feedback jsonb, -- Post-session feedback
  skill_scores jsonb, -- Breakdown of skills evaluated
  status text default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.practice_sessions enable row level security;

create policy "Users can view their own sessions"
  on public.practice_sessions for select
  using (auth.uid() = user_id);

create policy "Users can create their own sessions"
  on public.practice_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on public.practice_sessions for update
  using (auth.uid() = user_id);
```

#### Progress Tracking Table
```sql
create table public.user_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  current_streak integer default 0,
  longest_streak integer default 0,
  total_sessions integer default 0,
  total_practice_minutes integer default 0,
  objections_completed jsonb default '[]'::jsonb,
  skill_grades jsonb default '{}'::jsonb,
  last_practice_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_progress enable row level security;

create policy "Users can view their own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "Users can update their own progress"
  on public.user_progress for update
  using (auth.uid() = user_id);
```

#### Objections Library Table
```sql
create table public.objections (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  category text not null check (category in ('price', 'timing', 'trust', 'competition', 'authority', 'need')),
  objection_text text not null,
  common_mistakes text[] not null,
  correct_response text not null,
  response_framework text not null,
  difficulty_level text not null check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
  is_daily_objection boolean default false,
  daily_objection_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.objections enable row level security;

create policy "All authenticated users can view objections"
  on public.objections for select
  to authenticated
  using (true);
```

#### Nevada Compliance Rules Table
```sql
create table public.compliance_rules (
  id uuid default uuid_generate_v4() primary key,
  rule_category text not null check (rule_category in ('disclosure', 'licensing', 'ethics', 'documentation')),
  rule_title text not null,
  rule_description text not null,
  violation_keywords text[] not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  suggested_correction text not null,
  nevada_statute_reference text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.compliance_rules enable row level security;

create policy "All authenticated users can view compliance rules"
  on public.compliance_rules for select
  to authenticated
  using (true);
```

### 2.3 Environment Variables Setup

**File:** `.env.local`
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# ElevenLabs (for voice)
ELEVENLABS_API_KEY=...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

**File:** `.env.example` (commit this to git)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

### 2.4 Install Required Packages

```bash
npm install @supabase/supabase-js @supabase/ssr openai elevenlabs zustand date-fns
npm install -D @types/node
```

### 2.5 Supabase Client Configuration

**File:** `src/lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**File:** `src/lib/supabase/server.ts`
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie removal errors
          }
        },
      },
    }
  )
}

export async function getUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getSession() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
```

**File:** `src/lib/supabase/middleware.ts`
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}
```

### 2.6 Middleware for Route Protection

**File:** `src/middleware.ts`
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Update session
  const response = await updateSession(request)

  // Protected routes
  const protectedRoutes = ['/dashboard', '/practice', '/objections', '/drills', '/progress']
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // Cookie setting handled by updateSession
          },
          remove(name: string, options: any) {
            // Cookie removal handled by updateSession
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // TODO: Future subscription check
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('subscription_tier, subscription_status')
    //   .eq('id', user.id)
    //   .single()
    //
    // if (profile?.subscription_status !== 'active') {
    //   return NextResponse.redirect(new URL('/subscribe', request.url))
    // }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 2.7 Authentication Hook

**File:** `src/hooks/use-auth.ts`
```typescript
'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    user,
    loading,
    signIn,
    signOut,
  }
}
```

### 2.8 Login Page Implementation

**File:** `src/app/(auth)/layout.tsx`
```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-luxury-black-950 via-luxury-black-900 to-luxury-black-800">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  )
}
```

**File:** `src/app/(auth)/login/page.tsx`
```typescript
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/components/ui/use-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectedFrom = searchParams.get('redirectedFrom')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await signIn(email, password)

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    if (data.user) {
      toast({
        title: 'Success',
        description: 'You have been logged in successfully.',
      })
      router.push(redirectedFrom || '/dashboard')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Card className="border-luxury-gold-600/20 bg-luxury-black-900/90 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-luxury-gold-400 to-luxury-gold-600 flex items-center justify-center">
            <span className="text-2xl font-bold text-luxury-black-950">RE</span>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center text-white">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-center text-gray-400">
          Sign in to continue your sales training
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-200">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="agent@realestate.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-luxury-black-800 border-luxury-gold-600/20 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-200">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-luxury-black-800 border-luxury-gold-600/20 text-white"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-luxury-gold-500 to-luxury-gold-600 hover:from-luxury-gold-600 hover:to-luxury-gold-700 text-luxury-black-950 font-semibold"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### 2.9 Protected Dashboard Layout

**File:** `src/app/(dashboard)/layout.tsx`
```typescript
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import Header from '@/components/layout/header'
import Sidebar from '@/components/layout/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-luxury-black-950">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 2.10 Create Test User Manually

**Steps:**
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Fill in:
   - **Email:** test@agent.com
   - **Password:** TestPassword123!
   - **Auto Confirm User:** YES (check this)
4. Click "Create User"

**Test Login:**
- Email: test@agent.com
- Password: TestPassword123!

---

## Phase 3: AI System Architecture

### 3.1 OpenAI Client Setup

**File:** `src/lib/ai/openai-client.ts`
```typescript
import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const MODELS = {
  GPT4O: 'gpt-4o',
  GPT4O_MINI: 'gpt-4o-mini',
} as const
```

### 3.2 AI Buyer Engine - Core System Prompts

**File:** `src/lib/prompts/buyer-prompts.ts`
```typescript
export interface BuyerProfile {
  experienceLevel: 'first_time' | 'move_up' | 'investor_lite'
  emotionalState: 'nervous' | 'excited' | 'skeptical' | 'rushed'
  financialComfort: 'clear' | 'unclear' | 'embarrassed'
  resistanceLevel: 'low' | 'medium' | 'high'
  questionDepth: 'surface' | 'mixed' | 'advanced'
  personality: 'friendly' | 'cautious' | 'dominant' | 'distracted'
}

export function generateBuyerSystemPrompt(
  profile: BuyerProfile,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): string {
  const basePrompt = `You are roleplaying as a real estate buyer in a live sales conversation.

CRITICAL RULES:
- You are ONLY a buyer. You do NOT coach. You do NOT give feedback. You do NOT help the agent.
- You respond ONLY as a buyer would in a real conversation.
- NEVER mention "AI", "model", "roleplay", or break character.
- Your job is to test the agent's sales skills naturally.

YOUR BEHAVIOR:
- Ask realistic questions a ${profile.experienceLevel.replace('_', ' ')} buyer would ask
- Create ${profile.resistanceLevel} pressure and objections
- Interrupt occasionally if the agent rambles or loses control
- Test the agent's confidence and structure
- Expose weak sales skills naturally through your reactions

YOUR PROFILE:
- Experience: ${profile.experienceLevel.replace('_', ' ')}
- Emotional State: ${profile.emotionalState}
- Financial Comfort: ${profile.financialComfort}
- Resistance Level: ${profile.resistanceLevel}
- Question Depth: ${profile.questionDepth}
- Personality: ${profile.personality}

INTERRUPTION TRIGGERS - Cut in immediately if agent:
- Rambles for more than 2 sentences without asking a question
- Sounds unprofessional or uncertain
- Avoids your direct financial questions
- Over-explains instead of leading the conversation
- Shows panic or confusion

RESPONSE STYLE:
- Keep responses short (1-3 sentences) like a real person
- Sometimes answer vaguely or redirect
- Don't make it easy for weak agents
- Push back on weak answers
- Open up slightly when agent asks strong questions

${getDifficultyModifier(difficulty)}
${getPersonalityModifier(profile.personality)}
${getEmotionalStateModifier(profile.emotionalState)}

Remember: You are a real buyer with real concerns. React authentically to what the agent says.`

  return basePrompt
}

function getDifficultyModifier(difficulty: 'beginner' | 'intermediate' | 'advanced'): string {
  switch (difficulty) {
    case 'beginner':
      return `DIFFICULTY: Beginner
- Be cooperative but ask basic tough questions
- Allow agent to recover from mistakes
- Give clear signals when you're interested or concerned`

    case 'intermediate':
      return `DIFFICULTY: Intermediate
- Mix cooperation with resistance
- Ask deeper follow-up questions
- Don't let weak answers slide
- Test agent's ability to handle objections`

    case 'advanced':
      return `DIFFICULTY: Advanced
- Be highly challenging and skeptical
- Ask complex, multi-layered questions
- Interrupt frequently when agent shows weakness
- Demand specifics and push on vague answers
- Act like a sophisticated buyer who's interviewed multiple agents`
  }
}

function getPersonalityModifier(personality: BuyerProfile['personality']): string {
  switch (personality) {
    case 'friendly':
      return `PERSONALITY: Friendly
- Warm and conversational tone
- Still ask tough questions but nicely
- Example: "I appreciate that, but I'm still wondering about..."`

    case 'cautious':
      return `PERSONALITY: Cautious
- Skeptical and analytical
- Question everything before trusting
- Example: "How do I know that's accurate? Can you show me..."`

    case 'dominant':
      return `PERSONALITY: Dominant
- Direct and commanding
- Challenge agent's authority
- Example: "Look, I need straight answers. Why should I trust you over the other three agents I'm talking to?"`

    case 'distracted':
      return `PERSONALITY: Distracted
- Occasionally go off-topic
- Multi-tasking vibes
- Example: "Sorry, what? I was just... okay, go ahead."`
  }
}

function getEmotionalStateModifier(emotionalState: BuyerProfile['emotionalState']): string {
  switch (emotionalState) {
    case 'nervous':
      return `EMOTIONAL STATE: Nervous
- Express concerns about making wrong decision
- Need reassurance but don't accept empty platitudes
- Example: "This is a huge decision for us. What if we mess this up?"`

    case 'excited':
      return `EMOTIONAL STATE: Excited
- Enthusiastic but still need details
- Can be impulsive, agent should slow you down
- Example: "This sounds great! When can we see houses? Wait, what about..."`

    case 'skeptical':
      return `EMOTIONAL STATE: Skeptical
- Doubtful of agent's motives
- Question whether agent cares about your needs
- Example: "Are you just trying to close a deal, or do you actually care what's best for me?"`

    case 'rushed':
      return `EMOTIONAL STATE: Rushed
- Time pressure, want quick answers
- Impatient with long explanations
- Example: "I don't have much time. Give me the bottom line."`
  }
}
```

### 3.3 AI Coach Engine - Feedback System

**File:** `src/lib/prompts/coach-prompts.ts`
```typescript
export interface ConversationTurn {
  speaker: 'agent' | 'buyer'
  message: string
  timestamp: Date
}

export interface CoachFeedback {
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  hookCategory: 'fear' | 'shame' | 'curiosity' | 'authority' | 'drama'
  hookMessage: string
  weakPoints: string[]
  missedInformation: string[]
  whatToFix: { issue: string; howToFix: string }[]
  strongPoints: string[]
  complianceIssues: string[]
}

export function generateCoachAnalysisPrompt(
  transcript: ConversationTurn[],
  buyerProfile: any,
  difficulty: string
): string {
  return `You are an elite real estate sales coach. Analyze this live roleplay conversation between an agent and AI buyer.

YOUR TONE:
- Firm, calm, and direct
- NOT friendly, NOT harsh
- Focused on behavior change
- Give evidence-based criticism

CONVERSATION TRANSCRIPT:
${transcript.map(turn => `${turn.speaker.toUpperCase()}: ${turn.message}`).join('\n\n')}

BUYER PROFILE:
${JSON.stringify(buyerProfile, null, 2)}

DIFFICULTY LEVEL: ${difficulty}

ANALYZE AND PROVIDE:

1. OVERALL GRADE (A/B/C/D/F)
   - Grade based on sales structure, control, professionalism, and results

2. HOOK CATEGORY
   Choose ONE category that fits best:
   - FEAR: "This is why you're losing deals"
   - SHAME: "You said this... and it killed trust"
   - CURIOSITY: "Try this objection without folding"
   - AUTHORITY: "Nevada agents—this disclosure timing matters"
   - DRAMA: "Buyer: [quote]. Agent: [what you said]"

   Then write a 1-sentence hook message using that category

3. WEAK POINTS (bullet list)
   - Specific moments where agent demonstrated weak sales skills
   - Include exact quotes when possible
   - Examples:
     * "Rambled for 4 sentences without asking a question"
     * "Said 'um' and 'like' repeatedly—sounded unprofessional"
     * "Failed to ask about buyer's timeline"
     * "Let buyer control the conversation"

4. MISSED INFORMATION (bullet list)
   - Critical questions agent should have asked but didn't
   - Important info that wasn't gathered
   - Examples:
     * "Never asked about pre-approval status"
     * "Didn't clarify must-haves vs nice-to-haves"
     * "Missed opportunity to set next steps"

5. WHAT TO FIX + HOW TO FIX (structured list)
   For each issue, provide:
   - What the problem is
   - Exactly how to fix it with specific language

   Example:
   * ISSUE: "You over-explained instead of asking questions"
     FIX: "After giving 1 sentence of info, immediately ask: 'Does that make sense?' or 'What questions do you have about that?'"

6. STRONG POINTS (bullet list, if any)
   - What the agent did well
   - Only include if genuinely good

7. COMPLIANCE ISSUES (bullet list)
   - Any Nevada real estate law violations
   - Ethical concerns
   - Licensing issues
   - If none, say "None detected"

FORMAT YOUR RESPONSE AS JSON:
{
  "overallGrade": "A/B/C/D/F",
  "hookCategory": "fear/shame/curiosity/authority/drama",
  "hookMessage": "Your compelling hook message here",
  "weakPoints": ["point 1", "point 2", ...],
  "missedInformation": ["info 1", "info 2", ...],
  "whatToFix": [
    {"issue": "specific issue", "howToFix": "specific solution"},
    ...
  ],
  "strongPoints": ["point 1", "point 2", ...],
  "complianceIssues": ["issue 1", "issue 2", ...] or []
}

Be direct. Be specific. Focus on behavior change.`
}
```

### 3.4 Compliance Engine - Nevada Real Estate Law

**File:** `src/lib/prompts/compliance-prompts.ts`
```typescript
export interface ComplianceViolation {
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'disclosure' | 'licensing' | 'ethics' | 'documentation'
  agentStatement: string
  violation: string
  nevadaStatute?: string
  correction: string
  timestamp: Date
}

export function generateComplianceSystemPrompt(): string {
  return `You are the Nevada Real Estate Compliance Guard. Your ONLY job is to monitor agent language for legal, ethical, or licensing violations under Nevada real estate law.

YOU DO NOT:
- Coach sales techniques
- Give feedback on communication style
- Comment on effectiveness

YOU ONLY:
- Catch compliance violations immediately
- Flag risk language in real-time
- Cite Nevada statutes when applicable

MONITOR FOR:

1. DISCLOSURE VIOLATIONS
   - Failing to disclose material facts
   - Incorrect timing of disclosures
   - Missing seller property disclosure requirements
   - Not mentioning dual agency when applicable

   Nevada Statute: NRS 645.252, 645.254

2. LICENSING ISSUES
   - Practicing outside scope of license
   - Unauthorized practice of law (giving legal advice)
   - Not mentioning broker affiliation when required

   Nevada Statute: NRS 645.230, 645.252

3. ETHICAL VIOLATIONS
   - Making false or misleading statements
   - Guaranteeing future property values
   - Promising specific investment returns
   - Discriminatory language (Fair Housing violations)
   - Steering buyers away from certain areas

   Nevada Statute: NRS 645.633, Federal Fair Housing Act

4. DOCUMENTATION FAILURES
   - Not mentioning written agreements
   - Verbal commitments without documentation
   - Misrepresenting contract terms

   Nevada Statute: NRS 645.254

SEVERITY LEVELS:
- CRITICAL: Immediate legal exposure, must stop now
- HIGH: Serious violation, needs immediate correction
- MEDIUM: Problematic language, should be corrected
- LOW: Minor concern, should be aware of

WHEN YOU DETECT A VIOLATION:
Return immediately with:
{
  "severity": "low/medium/high/critical",
  "category": "disclosure/licensing/ethics/documentation",
  "agentStatement": "exact quote from agent",
  "violation": "clear explanation of what law was violated",
  "nevadaStatute": "NRS reference if applicable",
  "correction": "exact language agent should use instead",
  "timestamp": "ISO timestamp"
}

EXAMPLES:

AGENT: "Don't worry, this house will definitely be worth 20% more in 2 years."
VIOLATION:
{
  "severity": "high",
  "category": "ethics",
  "agentStatement": "this house will definitely be worth 20% more in 2 years",
  "violation": "Guaranteeing future property value is prohibited. Agents cannot make guarantees about appreciation.",
  "nevadaStatute": "NRS 645.633 - Prohibited acts",
  "correction": "Say: 'Historically, this area has seen X% appreciation, but I cannot guarantee future values. Market conditions can change.'",
  "timestamp": "2024-01-15T10:30:00Z"
}

AGENT: "You don't need a lawyer, I can explain the contract to you."
VIOLATION:
{
  "severity": "critical",
  "category": "licensing",
  "agentStatement": "You don't need a lawyer, I can explain the contract to you",
  "violation": "Unauthorized practice of law. Agents cannot provide legal advice or interpret contracts.",
  "nevadaStatute": "NRS 645.230 - Limitations on real estate licensees",
  "correction": "Say: 'I can walk you through the contract terms, but I'm not an attorney. You should have a real estate lawyer review this if you have legal questions.'",
  "timestamp": "2024-01-15T10:32:00Z"
}

Stay vigilant. Catch violations immediately.`
}
```

### 3.5 Script Generator - Teleprompter System

**File:** `src/lib/prompts/script-generator.ts`
```typescript
export interface ScriptPhase {
  phase: 'rapport' | 'money' | 'deep_questions' | 'frame' | 'close'
  phaseTitle: string
  script: string
  keyPoints: string[]
  commonMistakes: string[]
}

export interface GeneratedScript {
  leadSource: string
  buyerProfile: any
  phases: ScriptPhase[]
  estimatedDuration: number
}

export function generateScriptPrompt(
  leadSource: string,
  buyerProfile: any,
  sessionDuration: 10 | 30 | 60
): string {
  return `You are an elite real estate sales script writer. Create a world-class teleprompter script for a real estate agent to practice with.

REQUIREMENTS:
- Reading level: 6th grade (clear, simple language)
- Lead source: ${leadSource}
- Buyer profile: ${JSON.stringify(buyerProfile, null, 2)}
- Session duration: ${sessionDuration} minutes
- Must follow 5-phase structure

5 PHASES:

1. BUILDING RAPPORT (Phase 1)
   - Warm greeting
   - Establish trust quickly
   - Transition to discovery
   - Duration: ~15-20% of session

2. QUESTIONS ABOUT MONEY (Phase 2)
   - Pre-approval status
   - Budget comfort level
   - Timeline
   - Down payment readiness
   - Duration: ~20-25% of session

3. DEEP QUESTIONS (Phase 3)
   - Motivation for buying
   - Must-haves vs nice-to-haves
   - Decision-making process
   - Who else is involved
   - Duration: ~25-30% of session

4. FRAME (Phase 4)
   - Position yourself as the expert
   - Explain your process
   - Set expectations
   - Handle early objections
   - Duration: ~15-20% of session

5. CLOSE (Phase 5)
   - Set next steps
   - Get commitment
   - Book appointment
   - Confirm follow-up
   - Duration: ~15-20% of session

SCRIPT STYLE:
- Write in first person (agent speaking)
- Include [PAUSE] markers for natural breaks
- Include [LISTEN] markers where agent should stop talking
- Use simple, conversational language
- No jargon or complex terminology
- Keep sentences short (max 15 words)

EXAMPLE FORMAT:
---
PHASE 1: BUILDING RAPPORT

Hi [Buyer Name], thanks so much for reaching out!

[PAUSE]

I saw you're interested in finding a home in [area]. What made you start looking now?

[LISTEN]

That makes total sense. I help a lot of buyers in your situation.

[PAUSE]

Before we dive in, I'd love to learn more about what you're looking for. Does that sound good?

[LISTEN]
---

FOR EACH PHASE, PROVIDE:
1. Phase title
2. Complete script (use markers: [PAUSE] and [LISTEN])
3. Key points (what this phase accomplishes)
4. Common mistakes (what weak agents do wrong here)

ADAPT SCRIPT TO:
- Lead source (Zillow, referral, open house, etc.)
- Buyer experience level
- Emotional state
- Resistance level

FORMAT RESPONSE AS JSON:
{
  "leadSource": "${leadSource}",
  "buyerProfile": ${JSON.stringify(buyerProfile, null, 2)},
  "phases": [
    {
      "phase": "rapport",
      "phaseTitle": "Building Rapport",
      "script": "full script with [PAUSE] and [LISTEN] markers",
      "keyPoints": ["point 1", "point 2", ...],
      "commonMistakes": ["mistake 1", "mistake 2", ...]
    },
    ...
  ],
  "estimatedDuration": ${sessionDuration}
}

Create a world-class script that will make the agent sound professional, confident, and in control.`
}
```

### 3.6 API Route - AI Buyer Conversation

**File:** `src/app/api/ai/buyer/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { openai, MODELS } from '@/lib/ai/openai-client'
import { generateBuyerSystemPrompt, BuyerProfile } from '@/lib/prompts/buyer-prompts'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      messages,
      buyerProfile,
      difficulty,
      sessionId
    } = body as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      buyerProfile: BuyerProfile
      difficulty: 'beginner' | 'intermediate' | 'advanced'
      sessionId: string
    }

    const systemPrompt = generateBuyerSystemPrompt(buyerProfile, difficulty)

    const completion = await openai.chat.completions.create({
      model: MODELS.GPT4O,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.8,
      max_tokens: 150,
    })

    const buyerResponse = completion.choices[0].message.content

    // Store conversation turn in database
    await supabase
      .from('practice_sessions')
      .update({
        transcript: [
          ...messages,
          { speaker: 'buyer', message: buyerResponse, timestamp: new Date() }
        ]
      })
      .eq('id', sessionId)

    return NextResponse.json({
      message: buyerResponse,
      usage: completion.usage
    })

  } catch (error) {
    console.error('AI Buyer Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate buyer response' },
      { status: 500 }
    )
  }
}
```

### 3.7 API Route - AI Coach Feedback

**File:** `src/app/api/ai/coach/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { openai, MODELS } from '@/lib/ai/openai-client'
import { generateCoachAnalysisPrompt, CoachFeedback } from '@/lib/prompts/coach-prompts'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId } = body

    // Get session data
    const { data: session } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const analysisPrompt = generateCoachAnalysisPrompt(
      session.transcript,
      session.buyer_profile,
      session.difficulty_level
    )

    const completion = await openai.chat.completions.create({
      model: MODELS.GPT4O,
      messages: [
        { role: 'system', content: analysisPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const feedback: CoachFeedback = JSON.parse(
      completion.choices[0].message.content || '{}'
    )

    // Save feedback to database
    await supabase
      .from('practice_sessions')
      .update({
        coach_feedback: feedback,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    return NextResponse.json({ feedback })

  } catch (error) {
    console.error('AI Coach Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate coach feedback' },
      { status: 500 }
    )
  }
}
```

---

## Phase 4: Core UI Components

### 4.1 Header Component

**File:** `src/components/layout/header.tsx`
```typescript
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Header() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <header className="border-b border-luxury-gold-600/20 bg-luxury-black-900/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-luxury-gold-400 to-luxury-gold-600 flex items-center justify-center">
            <span className="text-sm font-bold text-luxury-black-950">RE</span>
          </div>
          <span className="text-xl font-bold text-white">Elite Agent Training</span>
        </Link>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-luxury-gold-600 text-luxury-black-950">
                    {user.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-luxury-black-800 border-luxury-gold-600/20" align="end">
              <DropdownMenuLabel className="text-gray-200">
                {user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-luxury-gold-600/20" />
              <DropdownMenuItem onClick={handleSignOut} className="text-gray-200 focus:bg-luxury-gold-600/20">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
```

### 4.2 Sidebar Component

**File:** `src/components/layout/sidebar.tsx`
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  PlayCircle,
  Target,
  Dumbbell,
  TrendingUp,
  Shield
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Practice Sessions', href: '/practice', icon: PlayCircle },
  { name: 'Objections', href: '/objections', icon: Target },
  { name: 'Daily Drills', href: '/drills', icon: Dumbbell },
  { name: 'Progress', href: '/progress', icon: TrendingUp },
  { name: 'Compliance', href: '/compliance', icon: Shield },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-luxury-gold-600/20 bg-luxury-black-900 min-h-screen p-4">
      <nav className="space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-luxury-gold-600/20 text-luxury-gold-400 font-semibold'
                  : 'text-gray-400 hover:bg-luxury-gold-600/10 hover:text-gray-200'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

---

## Phase 5: Implementation Roadmap

### Week 1-2: Foundation
- [x] Next.js project setup with TypeScript
- [x] shadcn/ui initialization and component installation
- [x] Tailwind CSS custom configuration (luxury theme)
- [x] Dark mode setup with next-themes
- [x] Supabase project creation
- [x] Database schema implementation
- [x] Authentication system (client + server)
- [x] Middleware for route protection
- [x] Login page implementation
- [x] Protected dashboard layout
- [x] Header and Sidebar components

### Week 3-4: AI Integration
- [ ] OpenAI API integration
- [ ] AI Buyer system prompt engineering
- [ ] AI Coach feedback system
- [ ] Compliance Guard implementation
- [ ] Script generator for teleprompter
- [ ] API routes for AI interactions
- [ ] Real-time conversation handling
- [ ] Session management system

### Week 5-6: Core Features
- [ ] Practice session interface
- [ ] AI avatar component with voice
- [ ] Teleprompter system with phase progression
- [ ] Session controls (start, pause, end)
- [ ] Real-time compliance monitoring UI
- [ ] Post-session feedback display
- [ ] Skill breakdown visualization
- [ ] Session recording and playback

### Week 7-8: Content & Drills
- [ ] Top 10 objections database seeding
- [ ] Objection training interface
- [ ] Daily drill system ("Objection of the Day")
- [ ] Nevada disclosure drill pack
- [ ] Weekly skill grades calculation
- [ ] Streak tracking system
- [ ] Progress dashboard with charts
- [ ] Hook category display (fear, shame, curiosity, etc.)

### Week 9-10: Polish & Testing
- [ ] Difficulty level calibration
- [ ] Buyer profile variations testing
- [ ] Voice quality optimization
- [ ] UI/UX refinements
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Bug fixes

### Week 11-12: Subscription System (Phase 2)
- [ ] Stripe integration
- [ ] Subscription tiers (Free, Pro, Enterprise)
- [ ] Payment flow
- [ ] Access control by tier
- [ ] Billing portal
- [ ] Usage limits enforcement

---

## Testing Strategy

### Phase 1 Testing Checklist

**Authentication:**
- [ ] Can manually create test user in Supabase
- [ ] Login with test credentials works
- [ ] Invalid credentials show error
- [ ] Protected routes redirect to /login when not authenticated
- [ ] Authenticated users can access /dashboard
- [ ] Sign out works and redirects to /login
- [ ] Session persists on page refresh
- [ ] JWT token refresh works automatically

**Route Protection:**
- [ ] /dashboard requires authentication
- [ ] /practice requires authentication
- [ ] /objections requires authentication
- [ ] /drills requires authentication
- [ ] /progress requires authentication
- [ ] redirectedFrom query param works after login

**UI Components:**
- [ ] Header displays user avatar
- [ ] Sidebar navigation works
- [ ] Dark mode toggle works
- [ ] Luxury color scheme applied correctly
- [ ] Responsive on mobile devices

**Database:**
- [ ] User profile created automatically on signup
- [ ] RLS policies prevent unauthorized access
- [ ] Can query own data from client
- [ ] Cannot query other users' data

---

## Future Considerations for Subscription System

### Database Modifications Needed

```sql
-- Add subscription columns (already in schema)
-- profiles table has:
-- - subscription_tier: 'free' | 'pro' | 'enterprise'
-- - subscription_status: 'active' | 'cancelled' | 'expired'
-- - subscription_ends_at: timestamp

-- Add feature access control
create table public.feature_access (
  id uuid default uuid_generate_v4() primary key,
  tier text not null check (tier in ('free', 'pro', 'enterprise')),
  feature_name text not null,
  limit_value integer, -- null means unlimited
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tier, feature_name)
);

-- Seed feature limits
insert into public.feature_access (tier, feature_name, limit_value) values
  ('free', 'practice_sessions_per_month', 3),
  ('free', 'session_duration_max', 10),
  ('free', 'ai_buyer_difficulty', 1), -- beginner only
  ('pro', 'practice_sessions_per_month', 50),
  ('pro', 'session_duration_max', 60),
  ('pro', 'ai_buyer_difficulty', 2), -- beginner + intermediate
  ('enterprise', 'practice_sessions_per_month', null), -- unlimited
  ('enterprise', 'session_duration_max', 60),
  ('enterprise', 'ai_buyer_difficulty', 3); -- all levels
```

### Middleware Enhancement for Subscriptions

```typescript
// Add to middleware.ts after user check

const { data: profile } = await supabase
  .from('profiles')
  .select('subscription_tier, subscription_status, subscription_ends_at')
  .eq('id', user.id)
  .single()

if (profile?.subscription_status !== 'active') {
  return NextResponse.redirect(new URL('/subscribe', request.url))
}

// Check feature access for specific routes
if (request.nextUrl.pathname.startsWith('/practice')) {
  // Check if user has access to practice feature
  // Implement usage limits, etc.
}
```

---

## Environment Variables Complete List

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# ElevenLabs (Voice)
ELEVENLABS_API_KEY=...

# Stripe (Future - Phase 2)
# STRIPE_SECRET_KEY=sk_test_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Key Architectural Decisions

### 1. Why Next.js App Router?
- Server Components for better performance
- Built-in streaming and suspense
- Better separation of client/server code
- Improved data fetching patterns

### 2. Why Supabase for Auth?
- Built on PostgreSQL (production-ready)
- Row Level Security for data protection
- Built-in JWT handling
- Real-time capabilities for future features
- Easy integration with Next.js

### 3. Why OpenAI GPT-4o?
- Best-in-class conversation quality
- Handles complex roleplay scenarios
- Fast response times
- JSON mode for structured output
- Function calling for future integrations

### 4. Why shadcn/ui?
- Copy-paste components (own the code)
- Built on Radix UI (accessibility)
- Tailwind CSS integration
- Full customization control
- No runtime bundle overhead

### 5. Authentication Architecture
- JWT-based (stateless, scalable)
- Secure HTTP-only cookies
- Automatic token refresh
- Middleware-based protection
- Server-side validation

### 6. Subscription Architecture (Future)
- Database-driven (not hardcoded)
- Feature flags in database
- Easy to add new tiers
- Usage tracking built-in
- Stripe for payments

---

## Production Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured in Vercel
- [ ] Supabase production project created
- [ ] Database migrations run in production
- [ ] OpenAI API key valid and funded
- [ ] Custom domain configured (optional)
- [ ] Analytics setup (Vercel Analytics)

### Security
- [ ] RLS policies tested thoroughly
- [ ] API routes have auth checks
- [ ] Rate limiting implemented
- [ ] CORS configured correctly
- [ ] Sensitive data never exposed to client

### Performance
- [ ] Images optimized
- [ ] Bundle size checked
- [ ] Database queries optimized
- [ ] Edge caching configured
- [ ] Loading states for all async operations

### Monitoring
- [ ] Error tracking (Sentry recommended)
- [ ] Performance monitoring
- [ ] User analytics
- [ ] API usage monitoring
- [ ] Database query performance

---

## Cost Estimates

### Development Phase (Month 1-3)
- **Supabase:** Free tier (sufficient for development)
- **OpenAI API:** ~$50-100/month (GPT-4o testing)
- **ElevenLabs:** ~$22/month (Creator tier for voice)
- **Vercel:** Free tier (hobby projects)
- **Total:** ~$72-122/month

### Production Phase (Post-Launch)
- **Supabase:** $25/month (Pro tier) - ~$100/month (grows with usage)
- **OpenAI API:** Variable ($0.03/1K tokens GPT-4o)
  - Estimate: 100 users × 10 sessions/month × 3000 tokens = $90/month
- **ElevenLabs:** $99/month (Independent Publisher)
- **Vercel:** $20/month (Pro tier)
- **Total:** ~$234/month + variable OpenAI costs

**Revenue Target:**
- 50 Pro users × $49/month = $2,450/month
- Break-even at ~10 paying users

---

## Next Steps After Plan Approval

1. **Review this plan thoroughly**
2. **Ask questions about any unclear sections**
3. **Prioritize features if needed**
4. **Approve plan to begin implementation**

5. **Implementation will proceed in this order:**
   - Phase 1: Foundation (Weeks 1-2)
   - Phase 2: AI Integration (Weeks 3-4)
   - Phase 3: Core Features (Weeks 5-6)
   - Phase 4: Content & Drills (Weeks 7-8)
   - Phase 5: Polish & Testing (Weeks 9-10)

I'll guide you through each step with:
- Code examples for each file
- Explanations of each decision
- Testing instructions
- Troubleshooting help

---

## Questions to Consider Before Starting

1. **OpenAI API Access:** Do you have an OpenAI API key with GPT-4o access?
2. **Voice Preference:** ElevenLabs (better quality) vs OpenAI Realtime API (simpler integration)?
3. **Initial Content:** Do you want me to create the Top 10 Objections content, or will you provide it?
4. **Nevada Compliance:** Should I research actual Nevada statutes, or use placeholder rules for now?
5. **Design Assets:** Do you have a logo, or should we use a simple text-based logo for now?
6. **Domain:** Will you use a custom domain, or start with Vercel subdomain?

---

**This plan is comprehensive, actionable, and follows industry best practices. Review it carefully, and when you're ready, we'll begin implementation step by step.**
