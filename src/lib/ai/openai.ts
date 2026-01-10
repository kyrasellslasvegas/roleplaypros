import OpenAI from "openai";
import type { OpenAIMessage } from "@/types/ai";

// Server-side only OpenAI client
// This file should only be imported in API routes
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;

export async function generateChatCompletion(
  messages: OpenAIMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: options?.model ?? "gpt-4o",
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 500,
  });

  return response.choices[0]?.message?.content ?? "";
}

export async function generateStreamingCompletion(
  messages: OpenAIMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<AsyncIterable<string>> {
  const stream = await openai.chat.completions.create({
    model: options?.model ?? "gpt-4o",
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 500,
    stream: true,
  });

  return {
    async *[Symbol.asyncIterator]() {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    },
  };
}

export async function generateJSONCompletion<T>(
  messages: OpenAIMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<T> {
  const response = await openai.chat.completions.create({
    model: options?.model ?? "gpt-4o",
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 1000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content) as T;
}
