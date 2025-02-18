import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { RentalDuration } from "@/types";

export interface FilterOptions {
  searchTerm: string;
  priceRange: [number, number];
  bedrooms: number | null;
  duration: RentalDuration;
  sortBy: "price-asc" | "price-desc" | "rating" | "newest";
  investmentOnly: boolean;
}

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  maxPrice?: number;
}

const FilterBar = ({
  filters,
  onFilterChange,
  maxPrice = 10000,
}: FilterBarProps) => {
  return (
    <div className="w-full bg-white shadow-sm border rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
        {/* Search Input */}
        <div className="lg:col-span-2">
          <Input
            placeholder="Search by location or title"
            value={filters.searchTerm}
            onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
          />
        </div>

        {/* Duration Select */}
        <div>
          <Select
            value={filters.duration}
            onValueChange={(value: RentalDuration) =>
              onFilterChange({ duration: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bedrooms Select */}
        <div>
          <Select
            value={filters.bedrooms?.toString() || "any"}
            onValueChange={(value) =>
              onFilterChange({
                bedrooms: value === "any" ? null : parseInt(value),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Bedrooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              {[1, 2, 3, 4, 5].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? "Bedroom" : "Bedrooms"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort By Select */}
        <div>
          <Select
            value={filters.sortBy}
            onValueChange={(value: FilterOptions["sortBy"]) =>
              onFilterChange({ sortBy: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Host Rating</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Investment Only Toggle */}
        <div>
          <Button
            variant={filters.investmentOnly ? "default" : "outline"}
            onClick={() =>
              onFilterChange({ investmentOnly: !filters.investmentOnly })
            }
            className="w-full"
          >
            Investment Only
          </Button>
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="mt-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Price Range</span>
          <span className="text-sm text-gray-600">
            ${filters.priceRange[0]} - ${filters.priceRange[1]}
          </span>
        </div>
        <Slider
          min={0}
          max={maxPrice}
          step={100}
          value={filters.priceRange}
          onValueChange={(value: number[]) =>
            onFilterChange({ priceRange: [value[0], value[1]] })
          }
          className="mt-2"
        />
      </div>
    </div>
  );
};

export default FilterBar;
