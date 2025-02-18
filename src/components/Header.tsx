import React from "react";
import { Button } from "./ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { Globe, Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Separator } from "./ui/separator";

interface HeaderProps {
  onLanguageChange?: (lang: "en" | "ar") => void;
  currentLanguage?: "en" | "ar";
  onListProperty?: () => void;
  onInvestNow?: () => void;
}

const Header = ({
  onLanguageChange = () => {},
  currentLanguage = "en",
  onListProperty = () => console.log("List Property clicked"),
  onInvestNow = () => console.log("Invest Now clicked"),
}: HeaderProps) => {
  return (
    <header className="w-full h-20 bg-white border-b border-gray-200 px-4 lg:px-8 fixed top-0 z-50">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-primary">HabibStay</h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Explore</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[400px]">
                    <div className="grid gap-1">
                      <h4 className="text-sm font-medium leading-none mb-2">
                        Find Places
                      </h4>
                      <NavigationMenuLink className="cursor-pointer hover:bg-muted p-2 rounded">
                        Featured Properties
                      </NavigationMenuLink>
                      <NavigationMenuLink className="cursor-pointer hover:bg-muted p-2 rounded">
                        New Listings
                      </NavigationMenuLink>
                      <NavigationMenuLink className="cursor-pointer hover:bg-muted p-2 rounded">
                        Popular Areas
                      </NavigationMenuLink>
                    </div>
                    <div className="grid gap-1">
                      <h4 className="text-sm font-medium leading-none mb-2">
                        Duration
                      </h4>
                      <NavigationMenuLink className="cursor-pointer hover:bg-muted p-2 rounded">
                        Daily Stays
                      </NavigationMenuLink>
                      <NavigationMenuLink className="cursor-pointer hover:bg-muted p-2 rounded">
                        Weekly Rentals
                      </NavigationMenuLink>
                      <NavigationMenuLink className="cursor-pointer hover:bg-muted p-2 rounded">
                        Monthly Leases
                      </NavigationMenuLink>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <Button variant="outline" onClick={onListProperty}>
            List Your Property
          </Button>

          <Button variant="default" onClick={onInvestNow}>
            Invest Now
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onLanguageChange("en")}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onLanguageChange("ar")}>
                العربية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[300px] sm:w-[350px] lg:hidden"
          >
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 mt-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Find Places</h4>
                <div className="grid gap-2">
                  <Button variant="ghost" className="w-full justify-start">
                    Featured Properties
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    New Listings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    Popular Areas
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Duration</h4>
                <div className="grid gap-2">
                  <Button variant="ghost" className="w-full justify-start">
                    Daily Stays
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    Weekly Rentals
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    Monthly Leases
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={onListProperty}
                  className="w-full"
                >
                  List Your Property
                </Button>
                <Button
                  variant="default"
                  onClick={onInvestNow}
                  className="w-full"
                >
                  Invest Now
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Language</h4>
                <div className="grid gap-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => onLanguageChange("en")}
                  >
                    English
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => onLanguageChange("ar")}
                  >
                    العربية
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
