import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bot, Search } from "lucide-react";

interface AISearchToggleProps {
  isAIMode?: boolean;
  onToggle?: (enabled: boolean) => void;
}

const AISearchToggle = ({
  isAIMode = false,
  onToggle = () => {},
}: AISearchToggleProps) => {
  return (
    <div className="flex items-center justify-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center space-x-2">
        <Search
          className={`w-5 h-5 ${!isAIMode ? "text-primary" : "text-muted-foreground"}`}
        />
        <Label htmlFor="ai-mode" className="text-sm font-medium cursor-pointer">
          Traditional
        </Label>
      </div>

      <Switch
        id="ai-mode"
        checked={isAIMode}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary"
      />

      <div className="flex items-center space-x-2">
        <Bot
          className={`w-5 h-5 ${isAIMode ? "text-primary" : "text-muted-foreground"}`}
        />
        <Label htmlFor="ai-mode" className="text-sm font-medium cursor-pointer">
          Sara AI
        </Label>
      </div>
    </div>
  );
};

export default AISearchToggle;
