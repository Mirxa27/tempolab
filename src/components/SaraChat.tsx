import React, { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "@/lib/api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { MessageCircle, Send, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Using ChatMessage type from api.ts

interface SaraChatProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialMessages?: ChatMessage[];
}

const SaraChat = ({
  isOpen = true,
  onClose = () => {},
  initialMessages = [
    {
      id: "1",
      text: "Hello! I'm Sara, your AI booking assistant. How can I help you today?",
      sender: "sara",
      timestamp: new Date(),
    },
  ],
}: SaraChatProps) => {
  const [inputMessage, setInputMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, isLoading, error } = useChat(initialMessages);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage;
    setInputMessage("");

    const response = await sendMessage(message);

    // Handle any suggested actions from the AI
    if (response?.actions) {
      response.actions.forEach((action) => {
        switch (action.type) {
          case "search":
            // Implement search functionality
            break;
          case "book":
            // Implement booking functionality
            break;
          case "invest":
            // Implement investment functionality
            break;
        }
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isMinimized ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Button
              className="rounded-full w-14 h-14 bg-primary shadow-lg"
              onClick={() => setIsMinimized(false)}
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <Card className="w-[380px] h-[600px] bg-white shadow-xl flex flex-col">
              <div className="p-4 border-b flex justify-between items-center bg-primary text-primary-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">Sara AI Assistant</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(true)}
                  className="hover:bg-primary-foreground/10"
                >
                  <Minimize2 className="w-5 h-5" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                  ))}
                  {error && (
                    <div className="text-red-600 text-sm">{error}</div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={isLoading}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SaraChat;
