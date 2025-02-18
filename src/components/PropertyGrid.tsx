import React, { useState, useMemo } from "react";
import PropertyCard from "./PropertyCard";
import FilterBar, { FilterOptions } from "./FilterBar";
import { Property } from "@/types";

interface PropertyGridProps {
  filters?: FilterOptions;
  onFilterChange?: (filters: Partial<FilterOptions>) => void;
  properties?: Property[];
  onQuickView?: (propertyId: string) => void;
  onBook?: (propertyId: string) => void;
  onInvest?: (propertyId: string) => void;
}

const defaultFilters: FilterOptions = {
  searchTerm: "",
  priceRange: [0, 10000],
  bedrooms: null,
  duration: "daily",
  sortBy: "price-asc",
  investmentOnly: false,
};

const PropertyGrid = ({
  filters: externalFilters,
  onFilterChange: externalFilterChange,
  properties = [
    {
      id: "1",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=60",
      title: "Luxury Villa with Pool",
      price: 1500,
      location: "Riyadh, Saudi Arabia",
      bedrooms: 3,
      bathrooms: 2,
      rentalDurations: ["daily", "weekly", "monthly"],
      priceByDuration: { daily: 1500, weekly: 9000, monthly: 32000 },
      amenities: ["Pool", "WiFi", "Air Conditioning", "Kitchen", "Parking"],
      host: { id: "1", name: "Ahmed", rating: 4.8 },
      investmentDetails: {
        available: true,
        expectedReturn: 17,
        minInvestment: 50000,
      },
    },
    {
      id: "2",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=60",
      title: "Modern Downtown Apartment",
      price: 900,
      location: "Jeddah, Saudi Arabia",
      bedrooms: 2,
      bathrooms: 1,
      rentalDurations: ["daily", "weekly", "monthly"],
      priceByDuration: { daily: 900, weekly: 5400, monthly: 19000 },
      amenities: ["WiFi", "Air Conditioning", "Kitchen", "Gym Access"],
      host: { id: "2", name: "Fatima", rating: 4.9 },
      investmentDetails: {
        available: true,
        expectedReturn: 15,
        minInvestment: 35000,
      },
    },
    {
      id: "3",
      imageUrl:
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&auto=format&fit=crop&q=60",
      title: "Beachfront Resort Villa",
      price: 2500,
      location: "Dammam, Saudi Arabia",
      bedrooms: 4,
      bathrooms: 3,
      rentalDurations: ["daily", "weekly", "monthly"],
      priceByDuration: { daily: 2500, weekly: 15000, monthly: 52000 },
      amenities: [
        "Beach Access",
        "Pool",
        "WiFi",
        "Air Conditioning",
        "Kitchen",
        "Parking",
      ],
      host: { id: "3", name: "Omar", rating: 4.7 },
      investmentDetails: {
        available: true,
        expectedReturn: 19,
        minInvestment: 75000,
      },
    },
  ],
  onQuickView = (id: string) =>
    console.log("Quick view clicked for property", id),
  onBook = (id: string) => console.log("Book clicked for property", id),
  onInvest = (id: string) => console.log("Invest clicked for property", id),
}: PropertyGridProps) => {
  const [localFilters, setLocalFilters] =
    useState<FilterOptions>(defaultFilters);
  const filters = externalFilters || localFilters;

  const filteredProperties = useMemo(() => {
    return properties
      .filter((property) => {
        // Search term filter
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          const matchesSearch =
            property.title.toLowerCase().includes(searchLower) ||
            property.location.toLowerCase().includes(searchLower);
          if (!matchesSearch) return false;
        }

        // Price range filter
        const currentPrice = property.priceByDuration[filters.duration] || 0;
        if (
          currentPrice < filters.priceRange[0] ||
          currentPrice > filters.priceRange[1]
        ) {
          return false;
        }

        // Bedrooms filter
        if (
          filters.bedrooms !== null &&
          property.bedrooms !== filters.bedrooms
        ) {
          return false;
        }

        // Investment only filter
        if (filters.investmentOnly && !property.investmentDetails?.available) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "price-asc":
            return (
              (a.priceByDuration[filters.duration] || 0) -
              (b.priceByDuration[filters.duration] || 0)
            );
          case "price-desc":
            return (
              (b.priceByDuration[filters.duration] || 0) -
              (a.priceByDuration[filters.duration] || 0)
            );
          case "rating":
            return (b.host.rating || 0) - (a.host.rating || 0);
          case "newest":
            // Assuming newer properties have higher IDs
            return b.id.localeCompare(a.id);
          default:
            return 0;
        }
      });
  }, [properties, filters]);

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    if (externalFilterChange) {
      externalFilterChange(newFilters);
    } else {
      setLocalFilters((prev) => ({ ...prev, ...newFilters }));
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto bg-gray-50 p-6">
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        maxPrice={Math.max(
          ...properties.map((p) => p.priceByDuration[filters.duration] || 0),
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
        {filteredProperties.map((property) => (
          <PropertyCard
            key={property.id}
            {...property}
            onQuickView={() => onQuickView(property.id)}
            onBook={() => onBook(property.id)}
            onInvest={() => onInvest(property.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default PropertyGrid;
