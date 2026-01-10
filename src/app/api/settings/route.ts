import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Create authenticated Supabase client
async function getAuthenticatedUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, supabase };
}

// Service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch user settings
export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }

    // Get settings (or create if doesn't exist)
    let { data: settings, error: settingsError } = await supabaseAdmin
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // If no settings exist, create defaults
    if (!settings) {
      const { data: newSettings, error: createError } = await supabaseAdmin
        .from("user_settings")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (createError) {
        console.error("Settings create error:", createError);
      } else {
        settings = newSettings;
      }
    }

    return NextResponse.json({
      profile: profile || { full_name: null, email: user.email, avatar_url: null },
      settings: settings || null,
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT - Update user settings
export async function PUT(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { profile, settings } = body;

    // Update profile if provided
    if (profile) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          full_name: profile.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        );
      }
    }

    // Update settings if provided
    if (settings) {
      // Check if settings exist
      const { data: existingSettings } = await supabaseAdmin
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingSettings) {
        // Update existing settings
        const { error: settingsError } = await supabaseAdmin
          .from("user_settings")
          .update({
            email_notifications: settings.email_notifications,
            email_weekly_summary: settings.email_weekly_summary,
            email_session_reminders: settings.email_session_reminders,
            email_product_updates: settings.email_product_updates,
            reminder_enabled: settings.reminder_enabled,
            reminder_time: settings.reminder_time,
            reminder_days: settings.reminder_days,
            default_difficulty: settings.default_difficulty,
            default_duration: settings.default_duration,
            timezone: settings.timezone,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (settingsError) {
          console.error("Settings update error:", settingsError);
          return NextResponse.json(
            { error: "Failed to update settings" },
            { status: 500 }
          );
        }
      } else {
        // Create new settings
        const { error: createError } = await supabaseAdmin
          .from("user_settings")
          .insert({
            user_id: user.id,
            email_notifications: settings.email_notifications,
            email_weekly_summary: settings.email_weekly_summary,
            email_session_reminders: settings.email_session_reminders,
            email_product_updates: settings.email_product_updates,
            reminder_enabled: settings.reminder_enabled,
            reminder_time: settings.reminder_time,
            reminder_days: settings.reminder_days,
            default_difficulty: settings.default_difficulty,
            default_duration: settings.default_duration,
            timezone: settings.timezone,
          });

        if (createError) {
          console.error("Settings create error:", createError);
          return NextResponse.json(
            { error: "Failed to create settings" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
