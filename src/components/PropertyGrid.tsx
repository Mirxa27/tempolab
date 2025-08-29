import React, { useState, useMemo, useEffect } from "react";
import PropertyCard from "./PropertyCard";
import FilterBar, { FilterOptions } from "./FilterBar";
import { Property } from "@/types";
import { fetchPropertyCards } from "@/lib/api.properties";

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
  properties,
  onQuickView = (id: string) =>
    console.log("Quick view clicked for property", id),
  onBook = (id: string) => console.log("Book clicked for property", id),
  onInvest = (id: string) => console.log("Invest clicked for property", id),
}: PropertyGridProps) => {
  const [localFilters, setLocalFilters] =
    useState<FilterOptions>(defaultFilters);
  const filters = externalFilters || localFilters;
  const [fetched, setFetched] = useState<Property[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPropertyCards({
          searchTerm: filters.searchTerm,
          minPrice: filters.priceRange[0],
          maxPrice: filters.priceRange[1],
          bedrooms: filters.bedrooms ?? undefined,
          duration: filters.duration,
          investmentOnly: filters.investmentOnly,
          sortBy: filters.sortBy,
        });
        if (!mounted) return;
        // Map to Property type expected by UI
        const props: Property[] = data.map((p) => ({
          id: p.id,
          imageUrl: p.imageUrl,
          title: p.title,
          price: Number(p.priceByDuration?.[filters.duration] ?? 0),
          location: p.location,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          rentalDurations: ["daily", "weekly", "monthly"],
          priceByDuration: p.priceByDuration,
          amenities: p.amenities ?? [],
          host: p.host,
          investmentDetails:
            p.investmentDetails && p.investmentDetails.available
              ? {
                  available: true,
                  expectedReturn: p.investmentDetails.expectedReturn ?? 0,
                  minInvestment: p.investmentDetails.minInvestment ?? 0,
                }
              : undefined,
        }));
        setFetched(props);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load properties");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [filters.searchTerm, filters.priceRange[0], filters.priceRange[1], filters.bedrooms, filters.duration, filters.investmentOnly, filters.sortBy]);

  const filteredProperties = useMemo(() => {
    const source = (properties ?? fetched ?? [])
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
    return source;
  }, [properties, fetched, filters]);

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
          ...((properties ?? fetched ?? [])
            .map((p) => p.priceByDuration[filters.duration] || 0)
            .concat([10000])),
        )}
      />
      {error && (
        <div className="text-red-600 mb-4">{error}</div>
      )}
      {loading && (
        <div className="text-gray-500 mb-4">Loading properties…</div>
      )}
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
