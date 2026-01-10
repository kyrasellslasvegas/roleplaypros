import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { agentApplicationSchema } from "@/components/applications";
import { sendApplicationConfirmationEmail } from "@/lib/services/resend";

// Use service role for inserting applications (bypasses RLS for inserts)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the form data
    const validationResult = agentApplicationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check for existing application with same email
    const { data: existingApplication } = await supabase
      .from("agent_applications")
      .select("id, status")
      .eq("email", data.email)
      .single();

    if (existingApplication) {
      return NextResponse.json(
        {
          error: "An application with this email already exists",
          code: "DUPLICATE_EMAIL",
          status: existingApplication.status,
        },
        { status: 409 }
      );
    }

    // Insert the application
    const { data: application, error: insertError } = await supabase
      .from("agent_applications")
      .insert({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        brokerage_name: data.brokerageName,
        brokerage_address: data.brokerageAddress,
        brokerage_phone: data.brokeragePhone,
        is_active_agent: data.isActiveAgent,
        licensed_states: data.licensedStates,
        license_numbers: data.licenseNumbers,
        years_of_experience: data.yearsOfExperience,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to insert application:", insertError);

      // Handle unique constraint violation
      if (insertError.code === "23505") {
        return NextResponse.json(
          {
            error: "An application with this email already exists",
            code: "DUPLICATE_EMAIL",
          },
          { status: 409 }
        );
      }

      throw insertError;
    }

    // Send confirmation email (non-blocking)
    try {
      await sendApplicationConfirmationEmail({
        to: data.email,
        fullName: data.fullName,
        brokerageName: data.brokerageName,
        licensedStates: data.licensedStates,
      });
    } catch (emailError) {
      // Log but don't fail the request if email fails
      console.error("Failed to send confirmation email:", emailError);
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
    });
  } catch (error) {
    console.error("Application submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
