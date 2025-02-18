import React, { useState, useCallback } from "react";
import { FilterOptions } from "./FilterBar";
import { Property } from "@/types";
import Header from "./Header";
import HeroSection from "./HeroSection";
import PropertyGrid from "./PropertyGrid";
import SaraChat from "./SaraChat";

interface HomeProps {
  onLanguageChange?: (lang: "en" | "ar") => void;
  onSearch?: (searchTerm: string) => void;
  onAIToggle?: (enabled: boolean) => void;
  onListProperty?: () => void;
  onInvestNow?: () => void;
}

const defaultFilters: FilterOptions = {
  searchTerm: "",
  priceRange: [0, 10000],
  bedrooms: null,
  duration: "daily",
  sortBy: "price-asc",
  investmentOnly: false,
};

const Home = ({
  onLanguageChange = () => {},
  onSearch = () => {},
  onAIToggle = () => {},
  onListProperty = () => {},
  onInvestNow = () => {},
}: HomeProps) => {
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);

  const handleSearch = useCallback(
    (searchTerm: string) => {
      setFilters((prev) => ({ ...prev, searchTerm }));
      onSearch(searchTerm);
    },
    [onSearch],
  );

  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterOptions>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    [],
  );
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onLanguageChange={onLanguageChange}
        onListProperty={onListProperty}
        onInvestNow={onInvestNow}
      />

      <main className="pt-20">
        <HeroSection
          onSearch={handleSearch}
          onAIToggle={onAIToggle}
          backgroundImage="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&auto=format&fit=crop&q=60"
        />

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Featured Properties
            </h2>
            <PropertyGrid
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        </section>
      </main>

      <SaraChat />
    </div>
  );
};

export default Home;
