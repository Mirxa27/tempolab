export type RentalDuration = "daily" | "weekly" | "monthly";

export interface Property {
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
