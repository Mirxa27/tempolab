import { useState, useCallback } from "react";
import { chatWithSara, ChatMessage, ChatResponse } from "@/lib/api";

export const useChat = (initialMessages: ChatMessage[] = []) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await chatWithSara(text, messages);
        setMessages((prev) => [...prev, response.message]);
        return response;
      } catch (err) {
        setError("Failed to send message");
        console.error("Chat error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [messages],
  );

  return {
    messages,
    sendMessage,
    isLoading,
    error,
  };
};
