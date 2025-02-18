import React from "react";
import { Button } from "@/components/ui/button";
import { Building2, TrendingUp } from "lucide-react";

interface ActionButtonsProps {
  onListProperty?: () => void;
  onInvest?: () => void;
}

const ActionButtons = ({
  onListProperty = () => console.log("List Property clicked"),
  onInvest = () => console.log("Invest clicked"),
}: ActionButtonsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center bg-white p-4 w-full max-w-[480px]">
      <Button
        onClick={onListProperty}
        className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
        size="lg"
      >
        <Building2 className="w-5 h-5" />
        List Your Property
      </Button>

      <Button
        onClick={onInvest}
        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
        size="lg"
      >
        <TrendingUp className="w-5 h-5" />
        Invest Now
      </Button>
    </div>
  );
};

export default ActionButtons;
