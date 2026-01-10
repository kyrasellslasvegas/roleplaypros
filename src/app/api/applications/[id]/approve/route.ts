import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendApprovalEmail } from "@/lib/services/resend";
import { sendApprovalSMS } from "@/lib/services/twilio";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, subscription_tier")
      .eq("id", user.id)
      .single();

    const isAdmin =
      profile?.is_admin || profile?.subscription_tier === "enterprise";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use admin client for privileged operations
    const adminClient = createAdminClient();

    // Fetch the application
    const { data: application, error: fetchError } = await adminClient
      .from("agent_applications")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status !== "pending") {
      return NextResponse.json(
        { error: "Application is not pending" },
        { status: 400 }
      );
    }

    // Create Supabase auth user with magic link
    const { data: authData, error: authError } =
      await adminClient.auth.admin.inviteUserByEmail(application.email, {
        data: {
          full_name: application.full_name,
          subscription_tier: "pro", // Early access gets pro
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?next=/dashboard`,
      });

    if (authError) {
      console.error("Failed to create user:", authError);
      // Check if user already exists
      if (authError.message.includes("already been registered")) {
        // User exists, generate a new magic link instead
        const { error: linkError } = await adminClient.auth.admin.generateLink({
          type: "magiclink",
          email: application.email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?next=/dashboard`,
          },
        });

        if (linkError) {
          throw linkError;
        }
      } else {
        throw authError;
      }
    }

    // Update application status
    const { error: updateError } = await adminClient
      .from("agent_applications")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        user_id: authData?.user?.id || null,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update application:", updateError);
      throw updateError;
    }

    // Send approval email
    try {
      await sendApprovalEmail({
        to: application.email,
        fullName: application.full_name,
      });
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
      // Don't fail the request if email fails
    }

    // Send SMS notification
    try {
      const firstName = application.full_name.split(" ")[0];
      await sendApprovalSMS({
        to: application.phone,
        firstName,
      });
    } catch (smsError) {
      console.error("Failed to send approval SMS:", smsError);
      // Don't fail the request if SMS fails
    }

    return NextResponse.json({
      success: true,
      userId: authData?.user?.id,
    });
  } catch (error) {
    console.error("Error approving application:", error);
    return NextResponse.json(
      { error: "Failed to approve application" },
      { status: 500 }
    );
  }
}
