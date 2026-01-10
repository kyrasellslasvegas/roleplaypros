import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const plan = searchParams.get("plan") as "free" | "pro" | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  // Handle magic link token (email OTP)
  if (token_hash && type === "email") {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: "email",
    });

    if (!error && data.user) {
      // Create or update user profile with selected plan
      const subscriptionTier = plan || "free";

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || null,
          subscription_tier: subscriptionTier,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "id",
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }

      // Also create initial user_progress record
      await supabase
        .from("user_progress")
        .upsert({
          user_id: data.user.id,
          current_streak: 0,
          longest_streak: 0,
          total_sessions: 0,
          total_practice_minutes: 0,
          skill_grades: {},
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
          ignoreDuplicates: true,
        });

      return redirectToDestination(request, origin, next);
    }
  }

  // Handle OAuth code exchange (existing flow)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create or update user profile
      const subscriptionTier = plan || "free";

      await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || null,
          subscription_tier: subscriptionTier,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "id",
        });

      // Also create initial user_progress record
      await supabase
        .from("user_progress")
        .upsert({
          user_id: data.user.id,
          current_streak: 0,
          longest_streak: 0,
          total_sessions: 0,
          total_practice_minutes: 0,
          skill_grades: {},
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
          ignoreDuplicates: true,
        });

      return redirectToDestination(request, origin, next);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

function redirectToDestination(request: Request, origin: string, next: string) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`);
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  } else {
    return NextResponse.redirect(`${origin}${next}`);
  }
}
