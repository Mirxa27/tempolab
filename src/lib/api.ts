const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "sara";
  timestamp: Date;
}

export interface ChatResponse {
  message: ChatMessage;
  suggestedProperties?: string[];
  actions?: {
    type: "search" | "book" | "invest";
    data: any;
  }[];
}

// DTO validation schemas using Zod
import { z } from "zod";

export const ChatMessageSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  sender: z.enum(["user", "sara"]),
  timestamp: z.union([z.date(), z.string().transform((s) => new Date(s))]),
});

export const ChatResponseSchema = z.object({
  message: ChatMessageSchema,
  suggestedProperties: z.array(z.string()).optional(),
  actions: z
    .array(
      z.object({
        type: z.enum(["search", "book", "invest"]),
        data: z.unknown(),
      }),
    )
    .optional(),
});

export const chatWithSara = async (
  message: string,
  conversationHistory: ChatMessage[],
): Promise<ChatResponse> => {
  try {
    if (!API_BASE_URL) {
      throw new Error("VITE_API_BASE_URL is not configured");
    }
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        conversationHistory,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI chat error: ${response.status} ${text}`);
    }

    const json = await response.json();
    const parsed = ChatResponseSchema.parse(json) as unknown as ChatResponse;
    return parsed;
  } catch (error) {
    console.error("Error chatting with Sara:", error);
    throw error;
  }
};
