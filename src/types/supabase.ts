// Minimal DB types for the app. Replace with `npm run types:supabase` for full types.
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          title: string;
          image_url: string;
          location: string;
          bedrooms: number;
          bathrooms: number;
          host_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["properties"]["Row"]> &
          Pick<Database["public"]["Tables"]["properties"]["Row"], "title" | "image_url" | "location" | "bedrooms" | "bathrooms" | "host_id">;
        Update: Partial<Database["public"]["Tables"]["properties"]["Row"]>;
      };
    };
    Views: {
      property_cards_view: {
        Row: {
          id: string;
          title: string;
          imageurl: string; // Supabase may lowercase columns; we'll map defensively in client code
          imageUrl?: string;
          location: string;
          bedrooms: number;
          bathrooms: number;
          host: Json;
          pricebyduration: Json;
          priceByDuration?: Json;
          amenities: string[] | null;
          investmentdetails: Json | null;
          investmentDetails?: Json | null;
        };
      };
    };
  };
}
 
