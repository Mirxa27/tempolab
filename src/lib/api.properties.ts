import { z } from "zod";
import { supabase } from "./supabase";

export const RentalDurationSchema = z.enum(["daily", "weekly", "monthly"]);

export const HostSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  rating: z.number().or(z.string().transform((s) => Number(s))).default(0),
});

export const PriceByDurationSchema = z.record(
  z.string(),
  z.number().or(z.string().transform((s) => Number(s))),
);

export const PropertyCardSchema = z.object({
  id: z.string().uuid(),
  imageUrl: z.string().url().optional(),
  imageurl: z.string().url().optional(),
  title: z.string(),
  location: z.string(),
  bedrooms: z.number().or(z.string().transform((s) => Number(s))),
  bathrooms: z.number().or(z.string().transform((s) => Number(s))),
  host: HostSchema.or(z.any()),
  amenities: z.array(z.string()).nullable().optional(),
  priceByDuration: PriceByDurationSchema.optional(),
  pricebyduration: PriceByDurationSchema.optional(),
  investmentDetails: z
    .object({
      available: z.boolean().default(false),
      expectedReturn: z.number().nullable().optional(),
      minInvestment: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  investmentdetails: z.any().optional(),
});

export type PropertyCard = z.infer<typeof PropertyCardSchema> & {
  imageUrl: string;
  priceByDuration: Record<string, number>;
  host: { id: string; name: string; rating: number };
  investmentDetails?: {
    available: boolean;
    expectedReturn?: number | null;
    minInvestment?: number | null;
  } | null;
};

function normalizePropertyRow(row: z.infer<typeof PropertyCardSchema>): PropertyCard {
  const imageUrl = row.imageUrl ?? row.imageurl ?? "";
  const priceByDuration = (row.priceByDuration ?? row.pricebyduration ?? {}) as Record<string, number>;
  const host = (typeof row.host === "object" && row.host !== null ? row.host : { id: "", name: "", rating: 0 }) as any;
  const investment = (row.investmentDetails ?? row.investmentdetails ?? null) as any;
  return {
    ...row,
    imageUrl,
    priceByDuration,
    host: {
      id: String((host as any).id ?? ""),
      name: String((host as any).name ?? ""),
      rating: Number((host as any).rating ?? 0),
    },
    investmentDetails: investment
      ? {
          available: Boolean(investment.available ?? false),
          expectedReturn: typeof investment.expectedReturn !== "undefined" ? Number(investment.expectedReturn) : null,
          minInvestment: typeof investment.minInvestment !== "undefined" ? Number(investment.minInvestment) : null,
        }
      : null,
  };
}

export const PropertyQuerySchema = z.object({
  searchTerm: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  bedrooms: z.number().nullable().optional(),
  duration: RentalDurationSchema.optional(),
  investmentOnly: z.boolean().optional(),
  sortBy: z.enum(["price-asc", "price-desc", "rating", "newest"]).optional(),
});

export type PropertyQuery = z.infer<typeof PropertyQuerySchema>;

export async function fetchPropertyCards(query: PropertyQuery = {}): Promise<PropertyCard[]> {
  const { searchTerm, minPrice, maxPrice, bedrooms, duration, investmentOnly, sortBy } = query;

  // Query Supabase view
  let request = supabase.from("property_cards_view").select("*");

  if (bedrooms != null) {
    request = request.eq("bedrooms", bedrooms);
  }
  if (searchTerm && searchTerm.trim().length > 0) {
    // Using ilike on title and location
    request = request.or(
      `title.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`,
    );
  }
  if (investmentOnly) {
    request = request.eq("investmentdetails->>available", "true");
  }

  const { data, error } = await request;
  if (error) throw error;

  const parsed = z.array(PropertyCardSchema).parse(data ?? []);
  let normalized = parsed.map(normalizePropertyRow);

  // Apply price range and sorting client-side due to JSON view limitations
  if (typeof minPrice === "number" || typeof maxPrice === "number") {
    normalized = normalized.filter((p) => {
      const key = duration ?? "daily";
      const price = Number(p.priceByDuration?.[key] ?? 0);
      if (typeof minPrice === "number" && price < minPrice) return false;
      if (typeof maxPrice === "number" && price > maxPrice) return false;
      return true;
    });
  }

  if (sortBy) {
    normalized = [...normalized].sort((a, b) => {
      switch (sortBy) {
        case "price-asc": {
          const key = duration ?? "daily";
          return Number(a.priceByDuration?.[key] ?? 0) - Number(b.priceByDuration?.[key] ?? 0);
        }
        case "price-desc": {
          const key = duration ?? "daily";
          return Number(b.priceByDuration?.[key] ?? 0) - Number(a.priceByDuration?.[key] ?? 0);
        }
        case "rating":
          return Number(b.host?.rating ?? 0) - Number(a.host?.rating ?? 0);
        case "newest":
          return b.id.localeCompare(a.id);
        default:
          return 0;
      }
    });
  }

  return normalized;
}

