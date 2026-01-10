// HeyGen API helpers - Server-side only
// This file handles HeyGen API interactions that require the API key

const HEYGEN_API_BASE = "https://api.heygen.com";

interface HeyGenTokenResponse {
  data: {
    token: string;
  };
}

interface HeyGenAvatarListResponse {
  data: {
    avatars: {
      avatar_id: string;
      avatar_name: string;
      preview_image_url: string;
      preview_video_url: string;
    }[];
  };
}

export async function generateStreamingToken(): Promise<string> {
  const response = await fetch(`${HEYGEN_API_BASE}/v1/streaming.create_token`, {
    method: "POST",
    headers: {
      "x-api-key": process.env.HEYGEN_API_KEY!,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to generate HeyGen token: ${error}`);
  }

  const data: HeyGenTokenResponse = await response.json();
  return data.data.token;
}

export async function listAvailableAvatars(): Promise<
  HeyGenAvatarListResponse["data"]["avatars"]
> {
  const response = await fetch(`${HEYGEN_API_BASE}/v1/avatar.list`, {
    method: "GET",
    headers: {
      "x-api-key": process.env.HEYGEN_API_KEY!,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list avatars: ${error}`);
  }

  const data: HeyGenAvatarListResponse = await response.json();
  return data.data.avatars;
}

// Default avatar configuration
export const DEFAULT_AVATAR_CONFIG = {
  avatarName: process.env.HEYGEN_AVATAR_ID || "default",
  quality: "high" as const,
  language: "en",
  voiceEmotion: "FRIENDLY" as const,
};

// Voice emotion mappings for buyer emotional states
export function getVoiceEmotionForBuyer(
  emotionalState: string
): "EXCITED" | "SERIOUS" | "FRIENDLY" | "SOOTHING" | "BROADCASTER" {
  const emotionMap: Record<
    string,
    "EXCITED" | "SERIOUS" | "FRIENDLY" | "SOOTHING" | "BROADCASTER"
  > = {
    nervous: "SOOTHING",
    excited: "EXCITED",
    skeptical: "SERIOUS",
    rushed: "BROADCASTER",
  };
  return emotionMap[emotionalState] || "FRIENDLY";
}
