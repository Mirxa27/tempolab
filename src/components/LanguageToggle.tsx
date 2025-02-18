import React from "react";
import { Button } from "./ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface LanguageToggleProps {
  currentLanguage?: "en" | "ar";
  onLanguageChange?: (language: "en" | "ar") => void;
}

const LanguageToggle = ({
  currentLanguage = "en",
  onLanguageChange = () => {},
}: LanguageToggleProps) => {
  return (
    <div className="bg-white">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="w-[120px] gap-2 border-neutral-200"
          >
            <Globe className="h-4 w-4" />
            <span className="capitalize">
              {currentLanguage === "en" ? "English" : "عربي"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onLanguageChange("en")}>
            English
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLanguageChange("ar")}>
            عربي
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LanguageToggle;
