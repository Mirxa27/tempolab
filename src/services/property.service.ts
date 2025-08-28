import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// =====================================================
// DTOs and Validation Schemas
// =====================================================

export const PropertyDTO = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  propertyType: z.enum(['apartment', 'house', 'villa', 'studio', 'condo', 'townhouse', 'penthouse', 'loft']),
  
  // Location
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  stateProvince: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(2, 'Country is required'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  
  // Property details
  bedrooms: z.number().min(0, 'Bedrooms cannot be negative').max(50),
  bathrooms: z.number().min(0, 'Bathrooms cannot be negative').max(50),
  areaSqft: z.number().min(0).optional(),
  areaSqm: z.number().min(0).optional(),
  floorNumber: z.number().optional(),
  totalFloors: z.number().optional(),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear() + 5).optional(),
  parkingSpaces: z.number().min(0).default(0),
  
  // Pricing
  basePriceDaily: z.number().min(0).optional(),
  basePriceWeekly: z.number().min(0).optional(),
  basePriceMonthly: z.number().min(0).optional(),
  basePriceYearly: z.number().min(0).optional(),
  currency: z.string().length(3).default('USD'),
  cleaningFee: z.number().min(0).optional(),
  securityDeposit: z.number().min(0).optional(),
  
  // Availability
  minimumStayDays: z.number().min(1).default(1),
  maximumStayDays: z.number().min(1).optional(),
  advanceBookingDays: z.number().min(0).default(1),
  instantBooking: z.boolean().default(false),
  
  // Investment
  availableForInvestment: z.boolean().default(false),
  investmentMinAmount: z.number().min(0).optional(),
  expectedAnnualReturn: z.number().min(0).max(100).optional(),
  totalInvestmentNeeded: z.number().min(0).optional(),
  
  // Features
  amenities: z.array(z.string()).default([]),
  houseRules: z.array(z.string()).default([]),
  nearbyAttractions: z.array(z.object({
    name: z.string(),
    distance: z.string(),
    type: z.string(),
  })).default([]),
  
  // Media
  mainImageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),
  virtualTourUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  floorPlanUrl: z.string().url().optional(),
});

export const PropertySearchDTO = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  propertyType: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  guests: z.number().min(1).optional(),
  instantBooking: z.boolean().optional(),
  availableForInvestment: z.boolean().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'rating', 'newest', 'popular']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius: z.number().min(0).optional(), // in kilometers
});

export const AvailabilityDTO = z.object({
  propertyId: z.string().uuid(),
  date: z.string(),
  isAvailable: z.boolean(),
  priceOverride: z.number().min(0).optional(),
  minStayOverride: z.number().min(1).optional(),
  notes: z.string().optional(),
});

// Types
export type PropertyData = z.infer<typeof PropertyDTO>;
export type PropertySearchData = z.infer<typeof PropertySearchDTO>;
export type AvailabilityData = z.infer<typeof AvailabilityDTO>;

export type PropertyStatus = 'draft' | 'pending_approval' | 'active' | 'inactive' | 'suspended' | 'sold';
export type PropertyType = 'apartment' | 'house' | 'villa' | 'studio' | 'condo' | 'townhouse' | 'penthouse' | 'loft';
export type RentalDuration = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Property {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  description: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  
  // Location
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  
  // Details
  bedrooms: number;
  bathrooms: number;
  areaSqft?: number;
  areaSqm?: number;
  floorNumber?: number;
  totalFloors?: number;
  yearBuilt?: number;
  parkingSpaces: number;
  
  // Pricing
  basePriceDaily?: number;
  basePriceWeekly?: number;
  basePriceMonthly?: number;
  basePriceYearly?: number;
  currency: string;
  cleaningFee?: number;
  securityDeposit?: number;
  
  // Availability
  minimumStayDays: number;
  maximumStayDays?: number;
  advanceBookingDays: number;
  instantBooking: boolean;
  
  // Investment
  availableForInvestment: boolean;
  investmentMinAmount?: number;
  expectedAnnualReturn?: number;
  totalInvestmentNeeded?: number;
  currentInvestmentAmount: number;
  
  // Features
  amenities: string[];
  houseRules: string[];
  nearbyAttractions: any[];
  
  // Media
  mainImageUrl?: string;
  images: string[];
  virtualTourUrl?: string;
  videoUrl?: string;
  floorPlanUrl?: string;
  
  // Statistics
  viewCount: number;
  favoriteCount: number;
  averageRating: number;
  totalReviews: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  
  // Relations (when included)
  owner?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  isFavorited?: boolean;
  availability?: PropertyAvailability[];
}

export interface PropertyAvailability {
  id: string;
  propertyId: string;
  date: string;
  isAvailable: boolean;
  priceOverride?: number;
  minStayOverride?: number;
  notes?: string;
}

// =====================================================
// Property Service Class
// =====================================================

class PropertyService {
  private static instance: PropertyService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): PropertyService {
    if (!PropertyService.instance) {
      PropertyService.instance = new PropertyService();
    }
    return PropertyService.instance;
  }

  // =====================================================
  // CRUD Operations
  // =====================================================

  public async createProperty(data: PropertyData): Promise<Property> {
    try {
      // Validate input
      const validatedData = PropertyDTO.parse(data);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate slug
      const slug = this.generateSlug(validatedData.title);

      // Create property
      const { data: property, error } = await supabase
        .from('properties')
        .insert({
          owner_id: user.id,
          title: validatedData.title,
          slug,
          description: validatedData.description,
          property_type: validatedData.propertyType,
          status: 'draft',
          
          // Location
          address_line1: validatedData.addressLine1,
          address_line2: validatedData.addressLine2,
          city: validatedData.city,
          state_province: validatedData.stateProvince,
          postal_code: validatedData.postalCode,
          country: validatedData.country,
          latitude: validatedData.latitude,
          longitude: validatedData.longitude,
          
          // Details
          bedrooms: validatedData.bedrooms,
          bathrooms: validatedData.bathrooms,
          area_sqft: validatedData.areaSqft,
          area_sqm: validatedData.areaSqm,
          floor_number: validatedData.floorNumber,
          total_floors: validatedData.totalFloors,
          year_built: validatedData.yearBuilt,
          parking_spaces: validatedData.parkingSpaces,
          
          // Pricing
          base_price_daily: validatedData.basePriceDaily,
          base_price_weekly: validatedData.basePriceWeekly,
          base_price_monthly: validatedData.basePriceMonthly,
          base_price_yearly: validatedData.basePriceYearly,
          currency: validatedData.currency,
          cleaning_fee: validatedData.cleaningFee,
          security_deposit: validatedData.securityDeposit,
          
          // Availability
          minimum_stay_days: validatedData.minimumStayDays,
          maximum_stay_days: validatedData.maximumStayDays,
          advance_booking_days: validatedData.advanceBookingDays,
          instant_booking: validatedData.instantBooking,
          
          // Investment
          available_for_investment: validatedData.availableForInvestment,
          investment_min_amount: validatedData.investmentMinAmount,
          expected_annual_return: validatedData.expectedAnnualReturn,
          total_investment_needed: validatedData.totalInvestmentNeeded,
          
          // Features
          amenities: validatedData.amenities,
          house_rules: validatedData.houseRules,
          nearby_attractions: validatedData.nearbyAttractions,
          
          // Media
          main_image_url: validatedData.mainImageUrl,
          images: validatedData.images,
          virtual_tour_url: validatedData.virtualTourUrl,
          video_url: validatedData.videoUrl,
          floor_plan_url: validatedData.floorPlanUrl,
        })
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      this.clearCache();

      return this.transformProperty(property);
    } catch (error) {
      console.error('Create property error:', error);
      if (error instanceof z.ZodError) {
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  }

  public async updateProperty(id: string, data: Partial<PropertyData>): Promise<Property> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check ownership
      const { data: existingProperty } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', id)
        .single();

      if (!existingProperty) throw new Error('Property not found');
      
      // Check if user is owner or admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (existingProperty.owner_id !== user.id && 
          userData?.role !== 'admin' && 
          userData?.role !== 'super_admin') {
        throw new Error('Unauthorized to update this property');
      }

      // Prepare update data
      const updateData: any = {};
      if (data.title !== undefined) {
        updateData.title = data.title;
        updateData.slug = this.generateSlug(data.title);
      }
      if (data.description !== undefined) updateData.description = data.description;
      if (data.propertyType !== undefined) updateData.property_type = data.propertyType;
      
      // Map all other fields...
      // (Similar mapping as in createProperty)

      // Update property
      const { data: property, error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      this.clearCache();

      return this.transformProperty(property);
    } catch (error) {
      console.error('Update property error:', error);
      throw error;
    }
  }

  public async deleteProperty(id: string): Promise<void> {
    try {
      // Soft delete by setting deleted_at
      const { error } = await supabase
        .from('properties')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Clear cache
      this.clearCache();
    } catch (error) {
      console.error('Delete property error:', error);
      throw error;
    }
  }

  public async getProperty(id: string): Promise<Property> {
    try {
      // Check cache
      const cached = this.getFromCache(`property:${id}`);
      if (cached) return cached;

      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          owner:users!owner_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Property not found');

      // Increment view count
      await supabase
        .from('properties')
        .update({ view_count: data.view_count + 1 })
        .eq('id', id);

      const property = this.transformProperty(data);
      
      // Check if favorited by current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: favorite } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('property_id', id)
          .single();
        
        property.isFavorited = !!favorite;
      }

      // Cache result
      this.setCache(`property:${id}`, property);

      return property;
    } catch (error) {
      console.error('Get property error:', error);
      throw error;
    }
  }

  // =====================================================
  // Search and Filtering
  // =====================================================

  public async searchProperties(params: PropertySearchData): Promise<{
    properties: Property[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // Validate input
      const validatedParams = PropertySearchDTO.parse(params);
      
      // Build query
      let query = supabase
        .from('property_search_view')
        .select('*', { count: 'exact' });

      // Apply filters
      if (validatedParams.query) {
        query = query.or(`title.ilike.%${validatedParams.query}%,description.ilike.%${validatedParams.query}%`);
      }
      
      if (validatedParams.city) {
        query = query.ilike('city', `%${validatedParams.city}%`);
      }
      
      if (validatedParams.country) {
        query = query.eq('country', validatedParams.country);
      }
      
      if (validatedParams.minPrice !== undefined) {
        query = query.gte('base_price_daily', validatedParams.minPrice);
      }
      
      if (validatedParams.maxPrice !== undefined) {
        query = query.lte('base_price_daily', validatedParams.maxPrice);
      }
      
      if (validatedParams.bedrooms !== undefined) {
        query = query.gte('bedrooms', validatedParams.bedrooms);
      }
      
      if (validatedParams.bathrooms !== undefined) {
        query = query.gte('bathrooms', validatedParams.bathrooms);
      }
      
      if (validatedParams.propertyType && validatedParams.propertyType.length > 0) {
        query = query.in('property_type', validatedParams.propertyType);
      }
      
      if (validatedParams.instantBooking !== undefined) {
        query = query.eq('instant_booking', validatedParams.instantBooking);
      }
      
      if (validatedParams.availableForInvestment !== undefined) {
        query = query.eq('available_for_investment', validatedParams.availableForInvestment);
      }

      // Location-based search
      if (validatedParams.latitude && validatedParams.longitude && validatedParams.radius) {
        // This requires PostGIS extension and custom RPC function
        const { data: nearbyProperties } = await supabase
          .rpc('search_properties_by_location', {
            lat: validatedParams.latitude,
            lng: validatedParams.longitude,
            radius_km: validatedParams.radius,
          });
        
        if (nearbyProperties) {
          const propertyIds = nearbyProperties.map((p: any) => p.id);
          query = query.in('id', propertyIds);
        }
      }

      // Check availability if dates provided
      if (validatedParams.checkInDate && validatedParams.checkOutDate) {
        const { data: availableProperties } = await supabase
          .rpc('get_available_properties', {
            check_in: validatedParams.checkInDate,
            check_out: validatedParams.checkOutDate,
          });
        
        if (availableProperties) {
          const propertyIds = availableProperties.map((p: any) => p.id);
          query = query.in('id', propertyIds);
        }
      }

      // Sorting
      switch (validatedParams.sortBy) {
        case 'price_asc':
          query = query.order('base_price_daily', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('base_price_daily', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('view_count', { ascending: false });
          break;
      }

      // Pagination
      const offset = (validatedParams.page - 1) * validatedParams.limit;
      query = query.range(offset, offset + validatedParams.limit - 1);

      // Execute query
      const { data, error, count } = await query;

      if (error) throw error;

      const properties = data?.map(p => this.transformProperty(p)) || [];
      const total = count || 0;
      const totalPages = Math.ceil(total / validatedParams.limit);

      return {
        properties,
        total,
        page: validatedParams.page,
        totalPages,
      };
    } catch (error) {
      console.error('Search properties error:', error);
      if (error instanceof z.ZodError) {
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  }

  public async getFeaturedProperties(): Promise<Property[]> {
    try {
      const cached = this.getFromCache('featured-properties');
      if (cached) return cached;

      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          owner:users!owner_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'active')
        .order('average_rating', { ascending: false })
        .order('view_count', { ascending: false })
        .limit(12);

      if (error) throw error;

      const properties = data?.map(p => this.transformProperty(p)) || [];
      
      this.setCache('featured-properties', properties);
      
      return properties;
    } catch (error) {
      console.error('Get featured properties error:', error);
      throw error;
    }
  }

  public async getSimilarProperties(propertyId: string): Promise<Property[]> {
    try {
      // Get the reference property
      const referenceProperty = await this.getProperty(propertyId);

      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          owner:users!owner_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'active')
        .eq('city', referenceProperty.city)
        .neq('id', propertyId)
        .gte('bedrooms', referenceProperty.bedrooms - 1)
        .lte('bedrooms', referenceProperty.bedrooms + 1)
        .limit(6);

      if (error) throw error;

      return data?.map(p => this.transformProperty(p)) || [];
    } catch (error) {
      console.error('Get similar properties error:', error);
      throw error;
    }
  }

  // =====================================================
  // Availability Management
  // =====================================================

  public async checkAvailability(
    propertyId: string,
    checkIn: string,
    checkOut: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('check_property_availability', {
          p_property_id: propertyId,
          p_check_in: checkIn,
          p_check_out: checkOut,
        });

      if (error) throw error;

      return data || false;
    } catch (error) {
      console.error('Check availability error:', error);
      throw error;
    }
  }

  public async getAvailabilityCalendar(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<PropertyAvailability[]> {
    try {
      const { data, error } = await supabase
        .from('property_availability')
        .select('*')
        .eq('property_id', propertyId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');

      if (error) throw error;

      return data?.map(a => ({
        id: a.id,
        propertyId: a.property_id,
        date: a.date,
        isAvailable: a.is_available,
        priceOverride: a.price_override,
        minStayOverride: a.min_stay_override,
        notes: a.notes,
      })) || [];
    } catch (error) {
      console.error('Get availability calendar error:', error);
      throw error;
    }
  }

  public async updateAvailability(data: AvailabilityData): Promise<void> {
    try {
      const validatedData = AvailabilityDTO.parse(data);

      const { error } = await supabase
        .from('property_availability')
        .upsert({
          property_id: validatedData.propertyId,
          date: validatedData.date,
          is_available: validatedData.isAvailable,
          price_override: validatedData.priceOverride,
          min_stay_override: validatedData.minStayOverride,
          notes: validatedData.notes,
        }, {
          onConflict: 'property_id,date',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Update availability error:', error);
      if (error instanceof z.ZodError) {
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  }

  public async blockDateRange(
    propertyId: string,
    startDate: string,
    endDate: string,
    notes?: string
  ): Promise<void> {
    try {
      const dates = this.getDateRange(startDate, endDate);
      
      const availabilityData = dates.map(date => ({
        property_id: propertyId,
        date: date.toISOString().split('T')[0],
        is_available: false,
        notes,
      }));

      const { error } = await supabase
        .from('property_availability')
        .upsert(availabilityData, {
          onConflict: 'property_id,date',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Block date range error:', error);
      throw error;
    }
  }

  // =====================================================
  // Favorites
  // =====================================================

  public async toggleFavorite(propertyId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already favorited
      const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('property_id', propertyId)
        .single();

      if (existing) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return false;
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            property_id: propertyId,
          });

        if (error) throw error;
        return true;
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      throw error;
    }
  }

  public async getFavorites(): Promise<Property[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          property:properties (
            *,
            owner:users!owner_id (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(f => this.transformProperty(f.property)) || [];
    } catch (error) {
      console.error('Get favorites error:', error);
      throw error;
    }
  }

  // =====================================================
  // Media Upload
  // =====================================================

  public async uploadPropertyImage(propertyId: string, file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${propertyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Upload property image error:', error);
      throw error;
    }
  }

  public async uploadMultipleImages(propertyId: string, files: File[]): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadPropertyImage(propertyId, file));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Upload multiple images error:', error);
      throw error;
    }
  }

  // =====================================================
  // Statistics
  // =====================================================

  public async getPropertyStats(propertyId: string): Promise<{
    views: number;
    favorites: number;
    bookings: number;
    revenue: number;
    occupancyRate: number;
  }> {
    try {
      // Get property stats
      const { data: property } = await supabase
        .from('properties')
        .select('view_count, favorite_count')
        .eq('id', propertyId)
        .single();

      // Get booking stats
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_amount, check_in_date, check_out_date')
        .eq('property_id', propertyId)
        .eq('booking_status', 'completed');

      const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const totalNights = bookings?.reduce((sum, b) => {
        const checkIn = new Date(b.check_in_date);
        const checkOut = new Date(b.check_out_date);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return sum + nights;
      }, 0) || 0;

      // Calculate occupancy rate (last 30 days)
      const occupancyRate = (totalNights / 30) * 100;

      return {
        views: property?.view_count || 0,
        favorites: property?.favorite_count || 0,
        bookings: bookings?.length || 0,
        revenue: totalRevenue,
        occupancyRate: Math.min(occupancyRate, 100),
      };
    } catch (error) {
      console.error('Get property stats error:', error);
      throw error;
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  private transformProperty(data: any): Property {
    return {
      id: data.id,
      ownerId: data.owner_id,
      title: data.title,
      slug: data.slug,
      description: data.description,
      propertyType: data.property_type,
      status: data.status,
      
      // Location
      addressLine1: data.address_line1,
      addressLine2: data.address_line2,
      city: data.city,
      stateProvince: data.state_province,
      postalCode: data.postal_code,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
      
      // Details
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      areaSqft: data.area_sqft,
      areaSqm: data.area_sqm,
      floorNumber: data.floor_number,
      totalFloors: data.total_floors,
      yearBuilt: data.year_built,
      parkingSpaces: data.parking_spaces,
      
      // Pricing
      basePriceDaily: data.base_price_daily,
      basePriceWeekly: data.base_price_weekly,
      basePriceMonthly: data.base_price_monthly,
      basePriceYearly: data.base_price_yearly,
      currency: data.currency,
      cleaningFee: data.cleaning_fee,
      securityDeposit: data.security_deposit,
      
      // Availability
      minimumStayDays: data.minimum_stay_days,
      maximumStayDays: data.maximum_stay_days,
      advanceBookingDays: data.advance_booking_days,
      instantBooking: data.instant_booking,
      
      // Investment
      availableForInvestment: data.available_for_investment,
      investmentMinAmount: data.investment_min_amount,
      expectedAnnualReturn: data.expected_annual_return,
      totalInvestmentNeeded: data.total_investment_needed,
      currentInvestmentAmount: data.current_investment_amount,
      
      // Features
      amenities: data.amenities || [],
      houseRules: data.house_rules || [],
      nearbyAttractions: data.nearby_attractions || [],
      
      // Media
      mainImageUrl: data.main_image_url,
      images: data.images || [],
      virtualTourUrl: data.virtual_tour_url,
      videoUrl: data.video_url,
      floorPlanUrl: data.floor_plan_url,
      
      // Statistics
      viewCount: data.view_count,
      favoriteCount: data.favorite_count,
      averageRating: data.average_rating || data.rating,
      totalReviews: data.total_reviews || data.reviews,
      
      // Timestamps
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      publishedAt: data.published_at,
      
      // Relations
      owner: data.owner ? {
        id: data.owner.id,
        fullName: data.owner.full_name,
        avatarUrl: data.owner.avatar_url,
      } : undefined,
    };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  private getDateRange(startDate: string, endDate: string): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const propertyService = PropertyService.getInstance();