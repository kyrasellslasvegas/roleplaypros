import { Resend } from "resend";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@roleplaypro.com";
const FROM_NAME = "RoleplayPro";

// Lazy initialization to avoid build-time errors
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const resend = getResendClient();

  if (!resend) {
    console.warn("Resend API key not configured, skipping email");
    return { success: false, error: "Resend not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message);
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

export async function sendApplicationConfirmationEmail({
  to,
  fullName,
  brokerageName,
  licensedStates,
}: {
  to: string;
  fullName: string;
  brokerageName: string;
  licensedStates: string[];
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="text-align: center; padding-bottom: 30px;">
        <h1 style="color: #d4af37; font-size: 28px; margin: 0;">RoleplayPro</h1>
      </td>
    </tr>
    <tr>
      <td style="background-color: #1a1a1a; border-radius: 12px; padding: 40px; border: 1px solid #333;">
        <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 20px 0;">Hi ${fullName},</h2>

        <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Thank you for applying for early access to RoleplayPro! We've received your application and our team is reviewing your license information.
        </p>

        <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          This typically takes <strong style="color: #d4af37;">up to 1 hour</strong> during business hours.
        </p>

        <div style="background-color: #0a0a0a; border-radius: 8px; padding: 20px; margin: 30px 0; border: 1px solid #333;">
          <h3 style="color: #d4af37; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">Application Details</h3>
          <table style="width: 100%;">
            <tr>
              <td style="color: #666; padding: 5px 0;">Name:</td>
              <td style="color: #fff; padding: 5px 0;">${fullName}</td>
            </tr>
            <tr>
              <td style="color: #666; padding: 5px 0;">Email:</td>
              <td style="color: #fff; padding: 5px 0;">${to}</td>
            </tr>
            <tr>
              <td style="color: #666; padding: 5px 0;">Brokerage:</td>
              <td style="color: #fff; padding: 5px 0;">${brokerageName}</td>
            </tr>
            <tr>
              <td style="color: #666; padding: 5px 0;">Licensed States:</td>
              <td style="color: #fff; padding: 5px 0;">${licensedStates.join(", ")}</td>
            </tr>
          </table>
        </div>

        <h3 style="color: #ffffff; font-size: 18px; margin: 30px 0 15px 0;">What happens next?</h3>
        <ol style="color: #a0a0a0; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>We verify your real estate license</li>
          <li>You'll receive an approval email with login link</li>
          <li>Start training with AI buyers immediately</li>
        </ol>

        <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
          Questions? Reply to this email or contact us at <a href="mailto:support@roleplaypro.com" style="color: #d4af37;">support@roleplaypro.com</a>
        </p>

        <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
          Ready to close more deals,<br>
          <strong style="color: #fff;">The RoleplayPro Team</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding-top: 30px;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          &copy; 2026 RoleplayPro. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${fullName},

Thank you for applying for early access to RoleplayPro! We've received your application and our team is reviewing your license information.

This typically takes up to 1 hour during business hours.

APPLICATION DETAILS
Name: ${fullName}
Email: ${to}
Brokerage: ${brokerageName}
Licensed States: ${licensedStates.join(", ")}

What happens next?
1. We verify your real estate license
2. You'll receive an approval email with login link
3. Start training with AI buyers immediately

Questions? Reply to this email or contact us at support@roleplaypro.com

Ready to close more deals,
The RoleplayPro Team
  `.trim();

  return sendEmail({
    to,
    subject: "We received your RoleplayPro application!",
    html,
    text,
  });
}

export async function sendApprovalEmail({
  to,
  fullName,
  magicLink,
}: {
  to: string;
  fullName: string;
  magicLink?: string;
}) {
  const dashboardUrl = magicLink || `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`;
  const firstName = fullName.split(" ")[0];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Approved!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="text-align: center; padding-bottom: 30px;">
        <h1 style="color: #d4af37; font-size: 28px; margin: 0;">RoleplayPro</h1>
      </td>
    </tr>
    <tr>
      <td style="background-color: #1a1a1a; border-radius: 12px; padding: 40px; border: 1px solid #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="font-size: 48px;">&#127881;</span>
        </div>

        <h2 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0; text-align: center;">
          Congratulations, ${firstName}!
        </h2>

        <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
          Your application has been approved! You now have early access to RoleplayPro&mdash;the AI-powered training platform that helps real estate agents close more deals.
        </p>

        <div style="text-align: center; margin: 40px 0;">
          <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #000; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Access Your Dashboard
          </a>
        </div>

        <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
          Click the button above to sign in with your magic link.<br>
          No password needed&mdash;just click and you're in!
        </p>

        <div style="background-color: #0a0a0a; border-radius: 8px; padding: 20px; border: 1px solid #333;">
          <h3 style="color: #d4af37; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">
            As an early access member, you get:
          </h3>
          <ul style="color: #a0a0a0; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>7 days free Pro trial</li>
            <li>Unlimited AI roleplay sessions</li>
            <li>Real-time coaching feedback</li>
            <li>30% lifetime discount when you upgrade</li>
          </ul>
        </div>

        <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
          Your journey to becoming a top-performing agent starts now. Let's get you closing more deals!
        </p>

        <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
          Ready to win,<br>
          <strong style="color: #fff;">The RoleplayPro Team</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding-top: 30px;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          &copy; 2026 RoleplayPro. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Congratulations, ${firstName}!

Your application has been approved! You now have early access to RoleplayPro - the AI-powered training platform that helps real estate agents close more deals.

Access your dashboard here: ${dashboardUrl}

As an early access member, you get:
- 7 days free Pro trial
- Unlimited AI roleplay sessions
- Real-time coaching feedback
- 30% lifetime discount when you upgrade

Your journey to becoming a top-performing agent starts now. Let's get you closing more deals!

Ready to win,
The RoleplayPro Team
  `.trim();

  return sendEmail({
    to,
    subject: "You're approved! Welcome to RoleplayPro",
    html,
    text,
  });
}
