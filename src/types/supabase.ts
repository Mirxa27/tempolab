export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          description: string;
          location: string;
          coordinates: { lat: number; lng: number } | null;
          bedrooms: number;
          bathrooms: number;
          max_guests: number;
          base_price: number;
          host_id: string;
          status: "active" | "inactive" | "pending";
          property_type: string;
          square_meters: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          description: string;
          location: string;
          coordinates?: { lat: number; lng: number } | null;
          bedrooms: number;
          bathrooms: number;
          max_guests: number;
          base_price: number;
          host_id: string;
          status?: "active" | "inactive" | "pending";
          property_type: string;
          square_meters: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string;
          description?: string;
          location?: string;
          coordinates?: { lat: number; lng: number } | null;
          bedrooms?: number;
          bathrooms?: number;
          max_guests?: number;
          base_price?: number;
          host_id?: string;
          status?: "active" | "inactive" | "pending";
          property_type?: string;
          square_meters?: number;
        };
      };
      property_images: {
        Row: {
          id: string;
          created_at: string;
          property_id: string;
          url: string;
          is_primary: boolean;
          order: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          property_id: string;
          url: string;
          is_primary?: boolean;
          order?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          property_id?: string;
          url?: string;
          is_primary?: boolean;
          order?: number;
        };
      };
      property_amenities: {
        Row: {
          id: string;
          created_at: string;
          property_id: string;
          amenity_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          property_id: string;
          amenity_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          property_id?: string;
          amenity_id?: string;
        };
      };
      amenities: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          icon: string;
          category: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          icon: string;
          category: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          icon?: string;
          category?: string;
        };
      };
      pricing_plans: {
        Row: {
          id: string;
          created_at: string;
          property_id: string;
          duration: "daily" | "weekly" | "monthly";
          price: number;
          minimum_stay: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          property_id: string;
          duration: "daily" | "weekly" | "monthly";
          price: number;
          minimum_stay: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          property_id?: string;
          duration?: "daily" | "weekly" | "monthly";
          price?: number;
          minimum_stay?: number;
        };
      };
      investment_opportunities: {
        Row: {
          id: string;
          created_at: string;
          property_id: string;
          expected_return: number;
          min_investment: number;
          total_investment_needed: number;
          current_investment: number;
          status: "open" | "closed" | "fully_funded";
          end_date: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          property_id: string;
          expected_return: number;
          min_investment: number;
          total_investment_needed: number;
          current_investment?: number;
          status?: "open" | "closed" | "fully_funded";
          end_date: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          property_id?: string;
          expected_return?: number;
          min_investment?: number;
          total_investment_needed?: number;
          current_investment?: number;
          status?: "open" | "closed" | "fully_funded";
          end_date?: string;
        };
      };
      hosts: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          name: string;
          bio: string | null;
          rating: number;
          total_reviews: number;
          verified: boolean;
          profile_image_url: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          name: string;
          bio?: string | null;
          rating?: number;
          total_reviews?: number;
          verified?: boolean;
          profile_image_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          name?: string;
          bio?: string | null;
          rating?: number;
          total_reviews?: number;
          verified?: boolean;
          profile_image_url?: string | null;
        };
      };
    };
  };
}
