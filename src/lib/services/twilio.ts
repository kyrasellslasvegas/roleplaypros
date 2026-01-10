import twilio from "twilio";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

interface SendSMSOptions {
  to: string;
  body: string;
}

export async function sendSMS({ to, body }: SendSMSOptions) {
  if (!accountSid || !authToken || !fromNumber) {
    console.warn("Twilio credentials not configured, skipping SMS");
    return { success: false, error: "Twilio not configured" };
  }

  try {
    // Format phone number to E.164 format if needed
    const formattedTo = formatPhoneNumber(to);

    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: formattedTo,
    });

    return { success: true, sid: message.sid };
  } catch (error) {
    console.error("Failed to send SMS:", error);
    throw error;
  }
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, "");

  // If it's a 10-digit US number, add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If it's 11 digits starting with 1, add +
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // If it already has country code (12+ digits), add +
  if (digits.length >= 11) {
    return `+${digits}`;
  }

  // Return as-is with + prefix
  return `+${digits}`;
}

export async function sendApprovalSMS({
  to,
  firstName,
}: {
  to: string;
  firstName: string;
}) {
  const body = `You're Approved! Welcome to RoleplayPro, ${firstName}! Check your email to get started with your first AI roleplaying session. Let's close some deals! - The RoleplayPro Team`;

  return sendSMS({ to, body });
}
