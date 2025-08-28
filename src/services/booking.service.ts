import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { propertyService } from './property.service';

// =====================================================
// DTOs and Validation Schemas
// =====================================================

export const CreateBookingDTO = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  numberOfAdults: z.number().min(1, 'At least one adult is required').max(20),
  numberOfChildren: z.number().min(0).max(20).default(0),
  numberOfInfants: z.number().min(0).max(10).default(0),
  guestMessage: z.string().optional(),
  specialRequests: z.string().optional(),
  arrivalTime: z.string().optional(),
}).refine((data) => {
  const checkIn = new Date(data.checkInDate);
  const checkOut = new Date(data.checkOutDate);
  return checkOut > checkIn;
}, {
  message: 'Check-out date must be after check-in date',
  path: ['checkOutDate'],
}).refine((data) => {
  const checkIn = new Date(data.checkInDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return checkIn >= today;
}, {
  message: 'Check-in date cannot be in the past',
  path: ['checkInDate'],
});

export const UpdateBookingDTO = z.object({
  guestMessage: z.string().optional(),
  specialRequests: z.string().optional(),
  arrivalTime: z.string().optional(),
  numberOfAdults: z.number().min(1).max(20).optional(),
  numberOfChildren: z.number().min(0).max(20).optional(),
  numberOfInfants: z.number().min(0).max(10).optional(),
});

export const CancelBookingDTO = z.object({
  reason: z.string().min(10, 'Please provide a reason for cancellation'),
});

export const ReviewBookingDTO = z.object({
  overallRating: z.number().min(1).max(5),
  cleanlinessRating: z.number().min(1).max(5).optional(),
  communicationRating: z.number().min(1).max(5).optional(),
  checkinRating: z.number().min(1).max(5).optional(),
  accuracyRating: z.number().min(1).max(5).optional(),
  locationRating: z.number().min(1).max(5).optional(),
  valueRating: z.number().min(1).max(5).optional(),
  title: z.string().min(5).max(255).optional(),
  comment: z.string().min(20, 'Review must be at least 20 characters'),
});

// Types
export type CreateBookingData = z.infer<typeof CreateBookingDTO>;
export type UpdateBookingData = z.infer<typeof UpdateBookingDTO>;
export type CancelBookingData = z.infer<typeof CancelBookingDTO>;
export type ReviewBookingData = z.infer<typeof ReviewBookingDTO>;

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'in_progress' | 'disputed';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | 'disputed';

export interface Booking {
  id: string;
  propertyId: string;
  guestId: string;
  bookingReference: string;
  
  // Dates
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  
  // Guests
  numberOfAdults: number;
  numberOfChildren: number;
  numberOfInfants: number;
  totalGuests: number;
  
  // Pricing
  baseAmount: number;
  cleaningFee: number;
  serviceFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  securityDeposit: number;
  securityDepositStatus: PaymentStatus;
  
  // Status
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  
  // Guest information
  guestMessage?: string;
  specialRequests?: string;
  arrivalTime?: string;
  
  // Host approval
  requiresHostApproval: boolean;
  hostApprovedAt?: string;
  hostMessage?: string;
  
  // Cancellation
  cancellationPolicy?: any;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  refundAmount?: number;
  
  // Check-in/out
  actualCheckIn?: string;
  actualCheckOut?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Relations (when included)
  property?: {
    id: string;
    title: string;
    mainImageUrl?: string;
    city: string;
    country: string;
    owner: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  guest?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  review?: {
    id: string;
    overallRating: number;
    comment: string;
  };
}

export interface BookingPriceBreakdown {
  nights: number;
  pricePerNight: number;
  baseAmount: number;
  cleaningFee: number;
  serviceFee: number;
  taxAmount: number;
  discountAmount: number;
  securityDeposit: number;
  totalAmount: number;
  currency: string;
}

// =====================================================
// Booking Service Class
// =====================================================

class BookingService {
  private static instance: BookingService;

  private constructor() {}

  public static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  // =====================================================
  // Booking Creation and Management
  // =====================================================

  public async createBooking(data: CreateBookingData): Promise<Booking> {
    try {
      // Validate input
      const validatedData = CreateBookingDTO.parse(data);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check property availability
      const isAvailable = await propertyService.checkAvailability(
        validatedData.propertyId,
        validatedData.checkInDate,
        validatedData.checkOutDate
      );

      if (!isAvailable) {
        throw new Error('Property is not available for the selected dates');
      }

      // Get property details
      const property = await propertyService.getProperty(validatedData.propertyId);

      // Check minimum stay requirements
      const nights = this.calculateNights(validatedData.checkInDate, validatedData.checkOutDate);
      if (nights < property.minimumStayDays) {
        throw new Error(`Minimum stay is ${property.minimumStayDays} nights`);
      }

      // Check maximum stay if applicable
      if (property.maximumStayDays && nights > property.maximumStayDays) {
        throw new Error(`Maximum stay is ${property.maximumStayDays} nights`);
      }

      // Calculate pricing
      const pricing = await this.calculateBookingPrice(
        validatedData.propertyId,
        validatedData.checkInDate,
        validatedData.checkOutDate,
        validatedData.numberOfAdults + validatedData.numberOfChildren
      );

      // Create booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          property_id: validatedData.propertyId,
          guest_id: user.id,
          check_in_date: validatedData.checkInDate,
          check_out_date: validatedData.checkOutDate,
          number_of_adults: validatedData.numberOfAdults,
          number_of_children: validatedData.numberOfChildren,
          number_of_infants: validatedData.numberOfInfants,
          base_amount: pricing.baseAmount,
          cleaning_fee: pricing.cleaningFee,
          service_fee: pricing.serviceFee,
          tax_amount: pricing.taxAmount,
          discount_amount: pricing.discountAmount,
          total_amount: pricing.totalAmount,
          currency: pricing.currency,
          security_deposit: pricing.securityDeposit,
          security_deposit_status: 'pending',
          booking_status: property.instantBooking ? 'confirmed' : 'pending',
          payment_status: 'pending',
          guest_message: validatedData.guestMessage,
          special_requests: validatedData.specialRequests,
          arrival_time: validatedData.arrivalTime,
          requires_host_approval: !property.instantBooking,
          source: 'website',
          device_info: this.getDeviceInfo(),
        })
        .select()
        .single();

      if (error) throw error;

      // Block dates in availability calendar
      await propertyService.blockDateRange(
        validatedData.propertyId,
        validatedData.checkInDate,
        validatedData.checkOutDate,
        `Booking ${booking.booking_reference}`
      );

      // Send notifications
      await this.sendBookingNotifications(booking.id, 'created');

      // If instant booking, initiate payment
      if (property.instantBooking) {
        await this.initiatePayment(booking.id);
      }

      return this.transformBooking(booking);
    } catch (error) {
      console.error('Create booking error:', error);
      if (error instanceof z.ZodError) {
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  }

  public async updateBooking(id: string, data: UpdateBookingData): Promise<Booking> {
    try {
      // Validate input
      const validatedData = UpdateBookingDTO.parse(data);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check ownership
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('guest_id, booking_status')
        .eq('id', id)
        .single();

      if (!existingBooking) throw new Error('Booking not found');
      if (existingBooking.guest_id !== user.id) {
        throw new Error('Unauthorized to update this booking');
      }

      // Check if booking can be updated
      if (['cancelled', 'completed'].includes(existingBooking.booking_status)) {
        throw new Error('Cannot update a cancelled or completed booking');
      }

      // Update booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .update({
          guest_message: validatedData.guestMessage,
          special_requests: validatedData.specialRequests,
          arrival_time: validatedData.arrivalTime,
          number_of_adults: validatedData.numberOfAdults,
          number_of_children: validatedData.numberOfChildren,
          number_of_infants: validatedData.numberOfInfants,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.transformBooking(booking);
    } catch (error) {
      console.error('Update booking error:', error);
      if (error instanceof z.ZodError) {
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  }

  public async cancelBooking(id: string, data: CancelBookingData): Promise<Booking> {
    try {
      // Validate input
      const validatedData = CancelBookingDTO.parse(data);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get booking details
      const { data: booking } = await supabase
        .from('bookings')
        .select('*, property:properties(*)')
        .eq('id', id)
        .single();

      if (!booking) throw new Error('Booking not found');

      // Check if user can cancel (guest or property owner)
      if (booking.guest_id !== user.id && booking.property.owner_id !== user.id) {
        // Check if user is admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!['admin', 'super_admin'].includes(userData?.role)) {
          throw new Error('Unauthorized to cancel this booking');
        }
      }

      // Check if booking can be cancelled
      if (['cancelled', 'completed'].includes(booking.booking_status)) {
        throw new Error('Booking is already cancelled or completed');
      }

      // Calculate refund amount based on cancellation policy
      const refundAmount = await this.calculateRefundAmount(booking);

      // Update booking status
      const { data: updatedBooking, error } = await supabase
        .from('bookings')
        .update({
          booking_status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: validatedData.reason,
          refund_amount: refundAmount,
          payment_status: refundAmount > 0 ? 'refunded' : booking.payment_status,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Release dates in availability calendar
      await this.releaseDates(booking.property_id, booking.check_in_date, booking.check_out_date);

      // Process refund if applicable
      if (refundAmount > 0 && booking.payment_status === 'completed') {
        await this.processRefund(id, refundAmount);
      }

      // Send notifications
      await this.sendBookingNotifications(id, 'cancelled');

      return this.transformBooking(updatedBooking);
    } catch (error) {
      console.error('Cancel booking error:', error);
      if (error instanceof z.ZodError) {
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  }

  // =====================================================
  // Booking Retrieval
  // =====================================================

  public async getBooking(id: string): Promise<Booking> {
    try {
      const { data, error } = await supabase
        .from('booking_dashboard_view')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Booking not found');

      // Get review if exists
      const { data: review } = await supabase
        .from('reviews')
        .select('id, overall_rating, comment')
        .eq('booking_id', id)
        .single();

      const booking = this.transformBooking(data);
      if (review) {
        booking.review = review;
      }

      return booking;
    } catch (error) {
      console.error('Get booking error:', error);
      throw error;
    }
  }

  public async getUserBookings(
    userId?: string,
    status?: BookingStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    bookings: Booking[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // Get current user if not specified
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        userId = user.id;
      }

      let query = supabase
        .from('booking_dashboard_view')
        .select('*', { count: 'exact' })
        .eq('guest_id', userId);

      if (status) {
        query = query.eq('booking_status', status);
      }

      // Pagination
      const offset = (page - 1) * limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const bookings = data?.map(b => this.transformBooking(b)) || [];
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        bookings,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      console.error('Get user bookings error:', error);
      throw error;
    }
  }

  public async getPropertyBookings(
    propertyId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Booking[]> {
    try {
      let query = supabase
        .from('booking_dashboard_view')
        .select('*')
        .eq('property_id', propertyId)
        .in('booking_status', ['confirmed', 'in_progress', 'completed']);

      if (startDate) {
        query = query.gte('check_in_date', startDate);
      }

      if (endDate) {
        query = query.lte('check_out_date', endDate);
      }

      const { data, error } = await query.order('check_in_date');

      if (error) throw error;

      return data?.map(b => this.transformBooking(b)) || [];
    } catch (error) {
      console.error('Get property bookings error:', error);
      throw error;
    }
  }

  // =====================================================
  // Pricing and Availability
  // =====================================================

  public async calculateBookingPrice(
    propertyId: string,
    checkInDate: string,
    checkOutDate: string,
    guests: number
  ): Promise<BookingPriceBreakdown> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_booking_price', {
          p_property_id: propertyId,
          p_check_in: checkInDate,
          p_check_out: checkOutDate,
          p_guests: guests,
        });

      if (error) throw error;

      const nights = this.calculateNights(checkInDate, checkOutDate);

      return {
        nights,
        pricePerNight: data.base_amount / nights,
        baseAmount: data.base_amount,
        cleaningFee: data.cleaning_fee,
        serviceFee: data.service_fee,
        taxAmount: data.tax_amount,
        discountAmount: 0, // Can be calculated based on promotions
        securityDeposit: data.security_deposit || 0,
        totalAmount: data.total_amount,
        currency: 'USD',
      };
    } catch (error) {
      console.error('Calculate booking price error:', error);
      throw error;
    }
  }

  private async calculateRefundAmount(booking: any): Promise<number> {
    const now = new Date();
    const checkIn = new Date(booking.check_in_date);
    const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Simple cancellation policy
    // Full refund if cancelled more than 48 hours before check-in
    // 50% refund if cancelled 24-48 hours before check-in
    // No refund if cancelled less than 24 hours before check-in

    if (hoursUntilCheckIn > 48) {
      return booking.total_amount - booking.service_fee; // Full refund minus service fee
    } else if (hoursUntilCheckIn > 24) {
      return (booking.total_amount - booking.service_fee) * 0.5; // 50% refund
    } else {
      return 0; // No refund
    }
  }

  // =====================================================
  // Check-in/Check-out
  // =====================================================

  public async checkIn(bookingId: string): Promise<Booking> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get booking
      const booking = await this.getBooking(bookingId);

      // Verify user is property owner or admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (booking.property?.owner.id !== user.id && 
          !['admin', 'super_admin'].includes(userData?.role)) {
        throw new Error('Unauthorized to check in this booking');
      }

      // Update booking status
      const { data, error } = await supabase
        .from('bookings')
        .update({
          booking_status: 'in_progress',
          actual_check_in: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Send notification to guest
      await this.sendBookingNotifications(bookingId, 'checked_in');

      return this.transformBooking(data);
    } catch (error) {
      console.error('Check-in error:', error);
      throw error;
    }
  }

  public async checkOut(bookingId: string): Promise<Booking> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get booking
      const booking = await this.getBooking(bookingId);

      // Verify user is property owner or admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (booking.property?.owner.id !== user.id && 
          !['admin', 'super_admin'].includes(userData?.role)) {
        throw new Error('Unauthorized to check out this booking');
      }

      // Update booking status
      const { data, error } = await supabase
        .from('bookings')
        .update({
          booking_status: 'completed',
          actual_check_out: new Date().toISOString(),
          security_deposit_status: 'refunded', // Assuming no damages
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Process security deposit refund
      if (booking.securityDeposit > 0) {
        await this.processSecurityDepositRefund(bookingId);
      }

      // Send notification to guest
      await this.sendBookingNotifications(bookingId, 'checked_out');

      return this.transformBooking(data);
    } catch (error) {
      console.error('Check-out error:', error);
      throw error;
    }
  }

  // =====================================================
  // Reviews
  // =====================================================

  public async createReview(bookingId: string, data: ReviewBookingData): Promise<void> {
    try {
      // Validate input
      const validatedData = ReviewBookingDTO.parse(data);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get booking
      const booking = await this.getBooking(bookingId);

      // Verify user is the guest
      if (booking.guestId !== user.id) {
        throw new Error('Only the guest can review this booking');
      }

      // Check if booking is completed
      if (booking.bookingStatus !== 'completed') {
        throw new Error('Can only review completed bookings');
      }

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingId)
        .single();

      if (existingReview) {
        throw new Error('Review already exists for this booking');
      }

      // Create review
      const { error } = await supabase
        .from('reviews')
        .insert({
          property_id: booking.propertyId,
          booking_id: bookingId,
          reviewer_id: user.id,
          overall_rating: validatedData.overallRating,
          cleanliness_rating: validatedData.cleanlinessRating,
          communication_rating: validatedData.communicationRating,
          checkin_rating: validatedData.checkinRating,
          accuracy_rating: validatedData.accuracyRating,
          location_rating: validatedData.locationRating,
          value_rating: validatedData.valueRating,
          title: validatedData.title,
          comment: validatedData.comment,
          is_verified: true, // Since it's linked to a completed booking
        });

      if (error) throw error;

      // Send notification to property owner
      await this.sendReviewNotification(bookingId);

    } catch (error) {
      console.error('Create review error:', error);
      if (error instanceof z.ZodError) {
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  }

  // =====================================================
  // Payment Processing
  // =====================================================

  private async initiatePayment(bookingId: string): Promise<void> {
    try {
      // This would integrate with a payment gateway like Stripe
      // For now, we'll simulate payment processing

      // Update payment status
      await supabase
        .from('bookings')
        .update({
          payment_status: 'processing',
        })
        .eq('id', bookingId);

      // Simulate payment processing delay
      setTimeout(async () => {
        await supabase
          .from('bookings')
          .update({
            payment_status: 'completed',
          })
          .eq('id', bookingId);

        // Create transaction record
        const booking = await this.getBooking(bookingId);
        await this.createTransaction({
          bookingId,
          userId: booking.guestId,
          amount: booking.totalAmount,
          type: 'booking_payment',
          status: 'completed',
        });

        // Send confirmation
        await this.sendBookingNotifications(bookingId, 'payment_confirmed');
      }, 2000);

    } catch (error) {
      console.error('Initiate payment error:', error);
      throw error;
    }
  }

  private async processRefund(bookingId: string, amount: number): Promise<void> {
    try {
      // This would integrate with payment gateway for actual refund
      // For now, we'll create a refund transaction

      const booking = await this.getBooking(bookingId);

      await this.createTransaction({
        bookingId,
        userId: booking.guestId,
        amount: -amount,
        type: 'booking_refund',
        status: 'completed',
      });

    } catch (error) {
      console.error('Process refund error:', error);
      throw error;
    }
  }

  private async processSecurityDepositRefund(bookingId: string): Promise<void> {
    try {
      const booking = await this.getBooking(bookingId);

      if (booking.securityDeposit > 0) {
        await this.createTransaction({
          bookingId,
          userId: booking.guestId,
          amount: -booking.securityDeposit,
          type: 'security_refund',
          status: 'completed',
        });
      }
    } catch (error) {
      console.error('Process security deposit refund error:', error);
      throw error;
    }
  }

  private async createTransaction(data: {
    bookingId: string;
    userId: string;
    amount: number;
    type: string;
    status: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: data.userId,
          booking_id: data.bookingId,
          transaction_type: data.type,
          amount: Math.abs(data.amount),
          currency: 'USD',
          status: data.status,
          processed_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Create transaction error:', error);
      throw error;
    }
  }

  // =====================================================
  // Notifications
  // =====================================================

  private async sendBookingNotifications(bookingId: string, type: string): Promise<void> {
    try {
      const booking = await this.getBooking(bookingId);

      let title = '';
      let content = '';
      let recipientId = '';

      switch (type) {
        case 'created':
          title = 'New Booking Request';
          content = `You have a new booking request for ${booking.property?.title}`;
          recipientId = booking.property?.owner.id || '';
          break;
        case 'confirmed':
          title = 'Booking Confirmed';
          content = `Your booking for ${booking.property?.title} has been confirmed`;
          recipientId = booking.guestId;
          break;
        case 'cancelled':
          title = 'Booking Cancelled';
          content = `The booking for ${booking.property?.title} has been cancelled`;
          recipientId = booking.property?.owner.id || '';
          break;
        case 'payment_confirmed':
          title = 'Payment Received';
          content = `Payment for your booking at ${booking.property?.title} has been received`;
          recipientId = booking.guestId;
          break;
        case 'checked_in':
          title = 'Guest Checked In';
          content = `Welcome to ${booking.property?.title}! Enjoy your stay.`;
          recipientId = booking.guestId;
          break;
        case 'checked_out':
          title = 'Thank You for Staying';
          content = `We hope you enjoyed your stay at ${booking.property?.title}. Please leave a review!`;
          recipientId = booking.guestId;
          break;
      }

      if (title && content && recipientId) {
        const { error } = await supabase
          .from('notifications')
          .insert({
            user_id: recipientId,
            type: 'booking_confirmation',
            title,
            content,
            action_url: `/bookings/${bookingId}`,
            metadata: { bookingId },
          });

        if (error) console.error('Send notification error:', error);
      }
    } catch (error) {
      console.error('Send booking notifications error:', error);
    }
  }

  private async sendReviewNotification(bookingId: string): Promise<void> {
    try {
      const booking = await this.getBooking(bookingId);

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: booking.property?.owner.id,
          type: 'review_received',
          title: 'New Review Received',
          content: `${booking.guest?.fullName} has left a review for ${booking.property?.title}`,
          action_url: `/properties/${booking.propertyId}/reviews`,
          metadata: { bookingId, propertyId: booking.propertyId },
        });

      if (error) console.error('Send review notification error:', error);
    } catch (error) {
      console.error('Send review notification error:', error);
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  private async releaseDates(propertyId: string, checkIn: string, checkOut: string): Promise<void> {
    try {
      const dates = this.getDateRange(checkIn, checkOut);
      const dateStrings = dates.map(d => d.toISOString().split('T')[0]);

      const { error } = await supabase
        .from('property_availability')
        .delete()
        .eq('property_id', propertyId)
        .in('date', dateStrings);

      if (error) console.error('Release dates error:', error);
    } catch (error) {
      console.error('Release dates error:', error);
    }
  }

  private calculateNights(checkIn: string, checkOut: string): number {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getDateRange(startDate: string, endDate: string): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current < end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  private getDeviceInfo(): any {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private transformBooking(data: any): Booking {
    return {
      id: data.id,
      propertyId: data.property_id,
      guestId: data.guest_id,
      bookingReference: data.booking_reference,
      
      // Dates
      checkInDate: data.check_in_date,
      checkOutDate: data.check_out_date,
      numberOfNights: data.number_of_nights,
      
      // Guests
      numberOfAdults: data.number_of_adults,
      numberOfChildren: data.number_of_children,
      numberOfInfants: data.number_of_infants,
      totalGuests: data.number_of_adults + data.number_of_children + data.number_of_infants,
      
      // Pricing
      baseAmount: data.base_amount,
      cleaningFee: data.cleaning_fee,
      serviceFee: data.service_fee,
      taxAmount: data.tax_amount,
      discountAmount: data.discount_amount,
      totalAmount: data.total_amount,
      currency: data.currency,
      securityDeposit: data.security_deposit,
      securityDepositStatus: data.security_deposit_status,
      
      // Status
      bookingStatus: data.booking_status,
      paymentStatus: data.payment_status,
      
      // Guest information
      guestMessage: data.guest_message,
      specialRequests: data.special_requests,
      arrivalTime: data.arrival_time,
      
      // Host approval
      requiresHostApproval: data.requires_host_approval,
      hostApprovedAt: data.host_approved_at,
      hostMessage: data.host_message,
      
      // Cancellation
      cancellationPolicy: data.cancellation_policy,
      cancelledAt: data.cancelled_at,
      cancelledBy: data.cancelled_by,
      cancellationReason: data.cancellation_reason,
      refundAmount: data.refund_amount,
      
      // Check-in/out
      actualCheckIn: data.actual_check_in,
      actualCheckOut: data.actual_check_out,
      
      // Timestamps
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      
      // Relations
      property: data.property_title ? {
        id: data.property_id,
        title: data.property_title,
        mainImageUrl: data.property_image,
        city: data.property_city,
        country: data.property_country,
        owner: {
          id: data.owner_id || '',
          fullName: data.owner_name || '',
          email: data.owner_email || '',
        },
      } : undefined,
      guest: data.guest_name ? {
        id: data.guest_id,
        fullName: data.guest_name,
        email: data.guest_email,
        phone: data.guest_phone,
        avatarUrl: data.guest_avatar,
      } : undefined,
    };
  }
}

// Export singleton instance
export const bookingService = BookingService.getInstance();