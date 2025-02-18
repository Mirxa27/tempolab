const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.habibstay.com";

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

export const chatWithSara = async (
  message: string,
  conversationHistory: ChatMessage[],
): Promise<ChatResponse> => {
  try {
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
      throw new Error("Failed to get AI response");
    }

    return await response.json();
  } catch (error) {
    console.error("Error chatting with Sara:", error);
    // Fallback response if API fails
    return {
      message: {
        id: Date.now().toString(),
        text: "I apologize, but I'm having trouble connecting to my services right now. Please try again in a moment.",
        sender: "sara",
        timestamp: new Date(),
      },
    };
  }
};
