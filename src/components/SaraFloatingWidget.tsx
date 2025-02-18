import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Minimize2, X } from "lucide-react";
import { Button } from "./ui/button";
import SaraChat from "./SaraChat";

interface SaraFloatingWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const SaraFloatingWidget = ({
  isOpen: propIsOpen = true,
  onClose = () => {},
}: SaraFloatingWidgetProps) => {
  const [isOpen, setIsOpen] = useState(propIsOpen);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {!isOpen ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Button
              className="rounded-full w-14 h-14 bg-primary shadow-lg"
              onClick={() => setIsOpen(true)}
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative"
          >
            <div className="absolute top-0 right-0 z-10 flex gap-2 p-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm"
                onClick={toggleMinimize}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className={isMinimized ? "hidden" : "block"}>
              <SaraChat
                isOpen={isOpen}
                onClose={handleClose}
                initialMessages={[
                  {
                    id: "1",
                    text: "مرحباً! أنا سارة، مساعدتك في الحجز. كيف يمكنني مساعدتك اليوم؟\n\nHello! I'm Sara, your booking assistant. How can I help you today?",
                    sender: "sara",
                    timestamp: new Date(),
                  },
                ]}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SaraFloatingWidget;
