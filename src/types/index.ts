// Re-export all types from database.ts for backward compatibility
export * from './database';

// Legacy types for backward compatibility
export type RentalDuration = "daily" | "weekly" | "monthly";

// Legacy Property interface - deprecated, use Property from database.ts instead
export interface LegacyProperty {
  id: string;
  imageUrl: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  rentalDurations: RentalDuration[];
  priceByDuration: {
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  amenities: string[];
  host: {
    id: string;
    name: string;
    rating: number;
  };
  investmentDetails?: {
    available: boolean;
    expectedReturn: number;
    minInvestment: number;
  };
}
