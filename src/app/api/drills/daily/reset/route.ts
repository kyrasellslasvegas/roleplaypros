import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/drills/daily/reset - Reset today's daily drill (for testing/development)
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];

    // Delete today's objection for this user
    const { error: deleteError, count } = await supabase
      .from("daily_objections")
      .delete()
      .eq("user_id", user.id)
      .eq("date", today);

    if (deleteError) {
      console.error("Error deleting daily objection:", deleteError);
      return NextResponse.json(
        { error: "Failed to reset daily drill" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Daily drill reset successfully. Refresh the page to get the new drill.",
      deleted: count || 0,
    });
  } catch (error) {
    console.error("Error in POST /api/drills/daily/reset:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
