import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Star, Users, Bath, Bed, Calendar } from "lucide-react";
import { Property, RentalDuration } from "@/types";

interface PropertyDetailsModalProps extends Partial<Property> {
  isOpen: boolean;
  onClose: () => void;
  onBook?: () => void;
  onInvest?: () => void;
  selectedDuration?: RentalDuration;
}

const PropertyDetailsModal = ({
  isOpen,
  onClose,
  onBook = () => console.log("Book clicked"),
  onInvest = () => console.log("Invest clicked"),
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
}: PropertyDetailsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Left Column - Image and Details */}
          <div className="space-y-6">
            <img
              src={imageUrl}
              alt={title}
              className="w-full aspect-video object-cover rounded-lg"
            />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Property Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Bed className="w-4 h-4 text-gray-500" />
                  <span>{bedrooms} Bedrooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-4 h-4 text-gray-500" />
                  <span>{bathrooms} Bathrooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>Up to {bedrooms * 2} guests</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>Instant Book</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Pricing and Booking */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Pricing</h3>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span>{host.rating}</span>
                </div>
              </div>

              <div className="space-y-2">
                {Object.entries(priceByDuration).map(([duration, price]) => (
                  <div
                    key={duration}
                    className="flex justify-between items-center"
                  >
                    <span className="capitalize">{duration}</span>
                    <span className="font-semibold">
                      ${price}/{duration === "daily" ? "night" : duration}
                    </span>
                  </div>
                ))}
              </div>

              <Button className="w-full" onClick={onBook}>
                Book Now
              </Button>
            </div>

            {investmentDetails?.available && (
              <div className="bg-green-50 p-6 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-green-800">
                  Investment Opportunity
                </h3>
                <div className="space-y-2 text-green-700">
                  <div className="flex justify-between">
                    <span>Expected Return</span>
                    <span className="font-semibold">
                      {investmentDetails.expectedReturn}% Annual
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Minimum Investment</span>
                    <span className="font-semibold">
                      ${investmentDetails.minInvestment.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  onClick={onInvest}
                >
                  Invest Now
                </Button>
              </div>
            )}

            <div className="space-y-4">
              <Separator />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div>
                  <p className="font-semibold">{host.name}</p>
                  <p className="text-sm text-gray-500">Property Host</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyDetailsModal;
