import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Eye, MapPin, Bed, Bath, Calendar } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Property, RentalDuration } from "@/types";
import PropertyDetailsModal from "./PropertyDetailsModal";

interface PropertyCardProps extends Partial<Property> {
  onQuickView?: () => void;
  onInvest?: () => void;
  onBook?: () => void;
  selectedDuration?: RentalDuration;
}

const PropertyCard = ({
  id = "1",
  imageUrl = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=60",
  title = "Luxury Villa with Pool",
  location = "Riyadh, Saudi Arabia",
  bedrooms = 3,
  bathrooms = 2,
  rentalDurations = ["daily", "weekly", "monthly"],
  priceByDuration = { daily: 1500, weekly: 9000, monthly: 32000 },
  amenities = ["Pool", "WiFi", "Air Conditioning", "Kitchen", "Parking"],
  host = { id: "1", name: "Ahmed", rating: 4.8 },
  investmentDetails = {
    available: true,
    expectedReturn: 17,
    minInvestment: 50000,
  },
  selectedDuration = "daily",
  onQuickView = () => {},
  onInvest = () => {},
  onBook = () => {},
}: PropertyCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleQuickView = () => {
    setIsModalOpen(true);
    onQuickView();
  };

  return (
    <>
      <PropertyDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBook={onBook}
        onInvest={onInvest}
        imageUrl={imageUrl}
        title={title}
        location={location}
        bedrooms={bedrooms}
        bathrooms={bathrooms}
        rentalDurations={rentalDurations}
        priceByDuration={priceByDuration}
        amenities={amenities}
        host={host}
        investmentDetails={investmentDetails}
        selectedDuration={selectedDuration}
      />
      <Card className="w-[320px] overflow-hidden bg-white hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-0">
          {/* Image Section */}
          <div className="relative group">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-[200px] object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-2 right-2 flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="bg-white/90 hover:bg-white"
                      onClick={handleQuickView}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Quick view</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {investmentDetails?.available && (
              <Badge
                className="absolute top-2 left-2 bg-green-600"
                variant="secondary"
              >
                Investment Opportunity
              </Badge>
            )}
          </div>

          {/* Content Section */}
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold line-clamp-1 mb-1">
                {title}
              </h3>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                <p className="text-sm line-clamp-1">{location}</p>
              </div>
            </div>

            <div className="flex justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{bedrooms} Beds</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{bathrooms} Baths</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Instant</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold">
                  ${priceByDuration[selectedDuration]}
                </span>
                <span className="text-sm text-muted-foreground">
                  /{selectedDuration === "daily" ? "night" : selectedDuration}
                </span>
              </div>
              {investmentDetails?.available && (
                <p className="text-sm text-green-600 font-medium">
                  {investmentDetails.expectedReturn}% Expected Return
                </p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <div className="flex gap-2 w-full">
            <Button
              className="flex-1"
              variant="outline"
              onClick={handleQuickView}
            >
              View Details
            </Button>
            {investmentDetails?.available && (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={onInvest}
              >
                Invest
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </>
  );
};

export default PropertyCard;
