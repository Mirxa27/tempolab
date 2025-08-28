import React, { useState, useMemo, useEffect } from "react";
import PropertyCard from "./PropertyCard";
import FilterBar, { FilterOptions } from "./FilterBar";
import { Property, PropertySearchFilters } from "@/types";
import { PropertiesService } from "@/lib/api";

interface PropertyGridProps {
  filters?: FilterOptions;
  onFilterChange?: (filters: Partial<FilterOptions>) => void;
  properties?: Property[];
  onQuickView?: (propertyId: string) => void;
  onBook?: (propertyId: string) => void;
  onInvest?: (propertyId: string) => void;
  loading?: boolean;
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
  properties: externalProperties,
  onQuickView = (id: string) =>
    console.log("Quick view clicked for property", id),
  onBook = (id: string) => console.log("Book clicked for property", id),
  onInvest = (id: string) => console.log("Invest clicked for property", id),
  loading: externalLoading = false,
}: PropertyGridProps) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(defaultFilters);
  const [internalProperties, setInternalProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const filters = externalFilters || localFilters;
  const properties = externalProperties || internalProperties;

  // Fetch properties when filters change (if no external properties provided)
  useEffect(() => {
    if (!externalProperties) {
      fetchProperties();
    }
  }, [filters, externalProperties]);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      const searchFilters: PropertySearchFilters = {
        searchTerm: filters.searchTerm || undefined,
        min_price: filters.priceRange[0],
        max_price: filters.priceRange[1],
        bedrooms: filters.bedrooms || undefined,
        duration: filters.duration as any,
        investment_only: filters.investmentOnly,
        sort_by: filters.sortBy === 'price-asc' ? 'price_asc' : 
                  filters.sortBy === 'price-desc' ? 'price_desc' :
                  filters.sortBy === 'rating' ? 'rating' : 'newest',
        page: 1,
        limit: 20,
      };

      const result = await PropertiesService.searchProperties(searchFilters);
      setInternalProperties(result.data);
      setTotal(result.total);
    } catch (err) {
      setError('Failed to load properties. Please try again.');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayProperties = useMemo(() => {
    // If external properties are provided, apply client-side filtering
    if (externalProperties) {
      return externalProperties.filter((property) => {
        // Search term filter
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          const matchesSearch =
            property.title.toLowerCase().includes(searchLower) ||
            property.location.toLowerCase().includes(searchLower);
          if (!matchesSearch) return false;
        }

        // Price range filter
        const currentPrice = property.base_price || 0;
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
        if (filters.investmentOnly && !property.investment_opportunity) {
          return false;
        }

        return true;
      }).sort((a, b) => {
        switch (filters.sortBy) {
          case "price-asc":
            return (a.base_price || 0) - (b.base_price || 0);
          case "price-desc":
            return (b.base_price || 0) - (a.base_price || 0);
          case "rating":
            return (b.rating || 0) - (a.rating || 0);
          case "newest":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          default:
            return 0;
        }
      });
    }

    // For internal properties, they're already filtered by the API
    return properties;
  }, [properties, filters, externalProperties]);

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    if (externalFilterChange) {
      externalFilterChange(newFilters);
    } else {
      setLocalFilters((prev) => ({ ...prev, ...newFilters }));
    }
  };

  const isLoading = externalLoading || loading;

  return (
    <div className="w-full max-w-[1400px] mx-auto bg-gray-50 p-4 md:p-6">
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        maxPrice={Math.max(
          ...displayProperties.map((p) => p.base_price || 0),
          10000
        )}
        loading={isLoading}
        resultCount={displayProperties.length}
      />
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={fetchProperties}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-full max-w-sm animate-pulse">
              <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-300 h-4 rounded mb-2"></div>
              <div className="bg-gray-300 h-4 rounded mb-2 w-2/3"></div>
              <div className="bg-gray-300 h-4 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : displayProperties.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {displayProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onQuickView={() => onQuickView(property.id)}
                onBook={() => onBook(property.id)}
                onInvest={() => onInvest(property.id)}
              />
            ))}
          </div>
          
          {total > displayProperties.length && (
            <div className="mt-8 text-center">
              <button 
                onClick={() => {
                  // Load more functionality could be implemented here
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Load More Properties
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No properties found
          </h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your search filters or check back later for new listings.
          </p>
          <button 
            onClick={() => setLocalFilters(defaultFilters)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default PropertyGrid;
