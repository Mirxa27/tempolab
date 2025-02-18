import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, MessageSquare } from "lucide-react";
import { Switch } from "./ui/switch";

interface HeroSectionProps {
  onSearch?: (searchTerm: string) => void;
  onAIToggle?: (enabled: boolean) => void;
  backgroundImage?: string;
}

const HeroSection = ({
  onSearch = () => console.log("Search clicked"),
  onAIToggle = () => console.log("AI toggle clicked"),
  backgroundImage = "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&auto=format&fit=crop&q=60",
}: HeroSectionProps) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [aiEnabled, setAiEnabled] = React.useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleAIToggle = (checked: boolean) => {
    setAiEnabled(checked);
    onAIToggle(checked);
  };

  return (
    <div className="relative w-full h-[500px] bg-white">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white text-center mb-6">
          Find Your Perfect Stay in Saudi Arabia
        </h1>

        <div className="w-full max-w-3xl space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Where would you like to stay?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-lg text-lg bg-white/95 border-2 border-transparent focus:border-primary"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8">
                Search
              </Button>
            </div>
          </form>

          {/* AI Assistant Toggle */}
          <div className="flex items-center justify-center gap-3 bg-white/90 p-3 rounded-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              Book with Sara AI Assistant
            </span>
            <Switch checked={aiEnabled} onCheckedChange={handleAIToggle} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
