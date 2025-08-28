// Properties service with full CRUD operations and real API integration
import { supabase } from '../supabase';
import { 
  Property, 
  PropertySearchFilters, 
  PaginatedResponse, 
  ApiResponse,
  PropertyImage,
  PricingPlan,
  BookingCalculation
} from '@/types/database';

export class PropertiesService {
  /**
   * Search properties with advanced filters
   */
  static async searchProperties(
    filters: PropertySearchFilters = {}
  ): Promise<PaginatedResponse<Property>> {
    try {
      let query = supabase
        .from('property_summary')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,location.ilike.%${filters.searchTerm}%,city.ilike.%${filters.searchTerm}%`);
      }

      if (filters.city) {
        query = query.eq('city', filters.city);
      }

      if (filters.property_type) {
        query = query.eq('property_type', filters.property_type);
      }

      if (filters.min_price || filters.max_price) {
        if (filters.min_price) {
          query = query.gte('base_price', filters.min_price);
        }
        if (filters.max_price) {
          query = query.lte('base_price', filters.max_price);
        }
      }

      if (filters.bedrooms) {
        query = query.eq('bedrooms', filters.bedrooms);
      }

      if (filters.bathrooms) {
        query = query.gte('bathrooms', filters.bathrooms);
      }

      if (filters.min_guests) {
        query = query.gte('max_guests', filters.min_guests);
      }

      if (filters.max_guests) {
        query = query.lte('max_guests', filters.max_guests);
      }

      if (filters.instant_book) {
        query = query.eq('is_instant_book', true);
      }

      if (filters.investment_only) {
        // Join with investment_opportunities
        query = query.not('investment_opportunities', 'is', null);
      }

      if (filters.featured_only) {
        query = query.eq('featured', true);
      }

      // Only show active properties
      query = query.eq('status', 'active');

      // Check availability if dates provided
      if (filters.check_in_date && filters.check_out_date) {
        // This would require a more complex query or function
        // For now, we'll filter on the client side or use a database function
      }

      // Apply sorting
      switch (filters.sort_by) {
        case 'price_asc':
          query = query.order('base_price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('base_price', { ascending: false });
          break;
        case 'rating':
          query = query.order('average_rating', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('featured', { ascending: false })
                      .order('average_rating', { ascending: false });
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > to + 1,
      };
    } catch (error) {
      console.error('Error searching properties:', error);
      return {
        data: [],
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 20,
        has_more: false,
      };
    }
  }

  /**
   * Get property by ID with all related data
   */
  static async getPropertyById(id: string): Promise<Property | null> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          host:hosts(*,
            user:users(*)
          ),
          images:property_images(*),
          amenities:property_amenities(
            amenity:amenities(*)
          ),
          pricing_plans(*),
          investment_opportunity:investment_opportunities(*),
          reviews:reviews(
            *,
            reviewer:users(full_name, profile_image_url)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      // Transform the data to match our Property interface
      if (data) {
        return {
          ...data,
          amenities: data.amenities?.map((pa: any) => pa.amenity) || [],
          primary_image_url: data.images?.find((img: any) => img.is_primary)?.url || data.images?.[0]?.url,
          amenity_names: data.amenities?.map((pa: any) => pa.amenity?.name) || [],
          average_rating: data.reviews?.length > 0 
            ? data.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / data.reviews.length 
            : 0,
          total_reviews: data.reviews?.length || 0,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching property:', error);
      return null;
    }
  }

  /**
   * Create a new property
   */
  static async createProperty(propertyData: Partial<Property>): Promise<ApiResponse<Property>> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([propertyData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data,
        message: 'Property created successfully',
      };
    } catch (error) {
      console.error('Error creating property:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Update property
   */
  static async updateProperty(id: string, updates: Partial<Property>): Promise<ApiResponse<Property>> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data,
        message: 'Property updated successfully',
      };
    } catch (error) {
      console.error('Error updating property:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Delete property
   */
  static async deleteProperty(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Property deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting property:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Upload property images
   */
  static async uploadPropertyImages(
    propertyId: string, 
    files: File[]
  ): Promise<ApiResponse<PropertyImage[]>> {
    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${propertyId}/${Date.now()}_${index}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        // Save image record to database
        const { data: imageData, error: imageError } = await supabase
          .from('property_images')
          .insert([
            {
              property_id: propertyId,
              url: publicUrl,
              is_primary: index === 0, // First image is primary
              display_order: index,
              image_type: 'interior',
              file_size: file.size,
            },
          ])
          .select()
          .single();

        if (imageError) {
          throw imageError;
        }

        return imageData;
      });

      const images = await Promise.all(uploadPromises);

      return {
        success: true,
        data: images,
        message: 'Images uploaded successfully',
      };
    } catch (error) {
      console.error('Error uploading images:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get property pricing for dates
   */
  static async getPropertyPricing(
    propertyId: string,
    checkInDate: string,
    checkOutDate: string,
    guestsCount: number
  ): Promise<ApiResponse<BookingCalculation>> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_booking_total', {
          property_id: propertyId,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          guests_count: guestsCount,
        });

      if (error) {
        throw error;
      }

      const pricing = data[0];
      const nights = new Date(checkOutDate).getTime() - new Date(checkInDate).getTime();
      const nightsCount = Math.ceil(nights / (1000 * 3600 * 24));

      const calculation: BookingCalculation = {
        base_amount: pricing.base_amount,
        cleaning_fee: pricing.cleaning_fee,
        service_fee: pricing.service_fee,
        tax_amount: pricing.tax_amount,
        discount_amount: 0,
        total_amount: pricing.total_amount,
        currency: 'SAR',
        breakdown: {
          nights: nightsCount,
          rate_per_night: pricing.base_amount / nightsCount,
          service_fee_rate: 3.0, // From system settings
          tax_rate: 15.0, // From system settings
          cleaning_fee_rate: guestsCount > 4 ? 100 : 50,
        },
      };

      return {
        success: true,
        data: calculation,
      };
    } catch (error) {
      console.error('Error calculating pricing:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check property availability
   */
  static async checkAvailability(
    propertyId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .rpc('check_property_availability', {
          property_id: propertyId,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
        });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get properties by host
   */
  static async getPropertiesByHost(
    hostId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Property>> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from('property_summary')
        .select('*', { count: 'exact' })
        .eq('host_id', hostId)
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > to + 1,
      };
    } catch (error) {
      console.error('Error fetching host properties:', error);
      return {
        data: [],
        total: 0,
        page,
        limit,
        has_more: false,
      };
    }
  }

  /**
   * Get featured properties
   */
  static async getFeaturedProperties(limit: number = 10): Promise<Property[]> {
    try {
      const { data, error } = await supabase
        .from('property_summary')
        .select('*')
        .eq('featured', true)
        .eq('status', 'active')
        .order('featured_until', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching featured properties:', error);
      return [];
    }
  }

  /**
   * Get property amenities
   */
  static async getPropertyAmenities(propertyId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('property_amenities')
        .select(`
          amenity:amenities(*)
        `)
        .eq('property_id', propertyId);

      if (error) {
        throw error;
      }

      return data?.map(pa => pa.amenity) || [];
    } catch (error) {
      console.error('Error fetching property amenities:', error);
      return [];
    }
  }

  /**
   * Add amenity to property
   */
  static async addPropertyAmenity(
    propertyId: string, 
    amenityId: string
  ): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('property_amenities')
        .insert([
          {
            property_id: propertyId,
            amenity_id: amenityId,
          },
        ]);

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Amenity added successfully',
      };
    } catch (error) {
      console.error('Error adding property amenity:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Remove amenity from property
   */
  static async removePropertyAmenity(
    propertyId: string, 
    amenityId: string
  ): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('property_amenities')
        .delete()
        .eq('property_id', propertyId)
        .eq('amenity_id', amenityId);

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Amenity removed successfully',
      };
    } catch (error) {
      console.error('Error removing property amenity:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get property statistics
   */
  static async getPropertyStats(propertyId: string): Promise<{
    total_bookings: number;
    total_revenue: number;
    average_rating: number;
    occupancy_rate: number;
    recent_bookings: any[];
  }> {
    try {
      // This would typically involve multiple queries or a complex view
      // For now, returning basic structure
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('property_id', propertyId)
        .eq('status', 'completed');

      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('property_id', propertyId);

      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, booking) => sum + booking.total_amount, 0) || 0;
      const averageRating = reviews?.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;

      return {
        total_bookings: totalBookings,
        total_revenue: totalRevenue,
        average_rating: averageRating,
        occupancy_rate: 0, // Would calculate based on calendar
        recent_bookings: bookings?.slice(-5) || [],
      };
    } catch (error) {
      console.error('Error fetching property stats:', error);
      return {
        total_bookings: 0,
        total_revenue: 0,
        average_rating: 0,
        occupancy_rate: 0,
        recent_bookings: [],
      };
    }
  }
}

export default PropertiesService;