import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Eye, MapPin, Bed, Bath, Calendar, Star, Heart, Share2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Property, PropertyCardProps } from "@/types";
import PropertyDetailsModal from "./PropertyDetailsModal";

const PropertyCard = ({
  property,
  onQuickView = () => {},
  onInvest = () => {},
  onBook = () => {},
  onToggleWishlist = () => {},
  showInvestment = true,
  compact = false,
}: PropertyCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleQuickView = () => {
    setIsModalOpen(true);
    onQuickView(property);
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    onToggleWishlist(property);
  };

  const primaryImage = property.primary_image_url || property.images?.[0]?.url || 
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=60";

  const displayPrice = property.base_price || 0;
  const hasInvestment = showInvestment && property.investment_opportunity;

  return (
    <>
      <PropertyDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        property={property}
        onBook={onBook}
        onInvest={onInvest}
      />
      <Card className={`
        w-full max-w-sm mx-auto overflow-hidden bg-white hover:shadow-lg transition-all duration-300 
        ${compact ? 'h-auto' : 'h-[420px]'} 
        hover:scale-[1.02] cursor-pointer
      `}>
        <CardContent className="p-0">
          {/* Image Section */}
          <div className="relative group" onClick={handleQuickView}>
            <img
              src={primaryImage}
              alt={property.title}
              className={`
                w-full object-cover transition-transform duration-300 group-hover:scale-105
                ${compact ? 'h-32 sm:h-40' : 'h-48 sm:h-56'}
              `}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex gap-1 sm:gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWishlistToggle();
                      }}
                    >
                      <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Share functionality would go here
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share property</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {hasInvestment && (
                <Badge className="bg-green-600 text-white text-xs">
                  Investment
                </Badge>
              )}
              {property.featured && (
                <Badge className="bg-yellow-600 text-white text-xs">
                  Featured
                </Badge>
              )}
              {property.is_instant_book && (
                <Badge className="bg-blue-600 text-white text-xs">
                  Instant Book
                </Badge>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className={`p-3 sm:p-4 space-y-2 sm:space-y-3 ${compact ? 'space-y-2' : ''}`}>
            {/* Title and Location */}
            <div className="space-y-1">
              <h3 className={`font-semibold line-clamp-1 ${compact ? 'text-sm' : 'text-base sm:text-lg'}`}>
                {property.title}
              </h3>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                <p className="text-xs sm:text-sm line-clamp-1">{property.location}</p>
              </div>
            </div>

            {/* Property Details */}
            <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Bed className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{property.bedrooms}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{property.bathrooms}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{property.max_guests}</span>
              </div>
              {property.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                  <span>{property.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Price and Investment Info */}
            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <div className="flex items-baseline gap-1">
                  <span className={`font-bold ${compact ? 'text-lg' : 'text-xl sm:text-2xl'}`}>
                    {new Intl.NumberFormat('en-SA', {
                      style: 'currency',
                      currency: property.currency || 'SAR',
                      minimumFractionDigits: 0,
                    }).format(displayPrice)}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    /night
                  </span>
                </div>
                {property.reviews_count > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({property.reviews_count} reviews)
                  </span>
                )}
              </div>
              
              {hasInvestment && property.investment_opportunity && (
                <p className="text-xs sm:text-sm text-green-600 font-medium">
                  {property.investment_opportunity.expected_return}% Expected Return
                </p>
              )}
            </div>

            {/* Amenities Preview */}
            {!compact && property.amenity_names && property.amenity_names.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {property.amenity_names.slice(0, 3).map((amenity, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                    {amenity}
                  </Badge>
                ))}
                {property.amenity_names.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0">
                    +{property.amenity_names.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className={`p-3 sm:p-4 pt-0 ${compact ? 'p-2 pt-0' : ''}`}>
          <div className="flex gap-2 w-full">
            <Button
              className={`flex-1 ${compact ? 'h-8 text-xs' : 'h-9'}`}
              variant="outline"
              onClick={handleQuickView}
            >
              <Eye className={`${compact ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
              View
            </Button>
            
            <Button
              className={`flex-1 ${compact ? 'h-8 text-xs' : 'h-9'}`}
              onClick={() => onBook(property)}
            >
              <Calendar className={`${compact ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
              Book
            </Button>
            
            {hasInvestment && (
              <Button
                className={`flex-1 bg-green-600 hover:bg-green-700 ${compact ? 'h-8 text-xs' : 'h-9'}`}
                onClick={() => onInvest(property)}
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
