// Bookings service with complete booking lifecycle management
import { supabase } from '../supabase';
import { 
  Booking, 
  BookingStatus, 
  PaymentStatus,
  ApiResponse,
  PaginatedResponse,
  BookingCalculation 
} from '@/types/database';

export interface CreateBookingData {
  property_id: string;
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  adults_count: number;
  children_count?: number;
  infants_count?: number;
  special_requests?: string;
}

export interface BookingFilters {
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  property_id?: string;
  guest_id?: string;
  host_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export class BookingsService {
  /**
   * Create a new booking
   */
  static async createBooking(bookingData: CreateBookingData): Promise<ApiResponse<Booking>> {
    try {
      // First, validate availability
      const { data: isAvailable } = await supabase
        .rpc('check_property_availability', {
          property_id: bookingData.property_id,
          check_in_date: bookingData.check_in_date,
          check_out_date: bookingData.check_out_date,
        });

      if (!isAvailable) {
        return {
          success: false,
          error: 'Property is not available for the selected dates',
        };
      }

      // Calculate pricing
      const { data: pricing } = await supabase
        .rpc('calculate_booking_total', {
          property_id: bookingData.property_id,
          check_in_date: bookingData.check_in_date,
          check_out_date: bookingData.check_out_date,
          guests_count: bookingData.guests_count,
        });

      if (!pricing || !pricing[0]) {
        return {
          success: false,
          error: 'Unable to calculate booking price',
        };
      }

      const calculatedPricing = pricing[0];

      // Get property and host info
      const { data: property } = await supabase
        .from('properties')
        .select('host_id')
        .eq('id', bookingData.property_id)
        .single();

      if (!property) {
        return {
          success: false,
          error: 'Property not found',
        };
      }

      // Create the booking
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            ...bookingData,
            host_id: property.host_id,
            base_price: calculatedPricing.base_amount,
            cleaning_fee: calculatedPricing.cleaning_fee,
            service_fee: calculatedPricing.service_fee,
            tax_amount: calculatedPricing.tax_amount,
            total_amount: calculatedPricing.total_amount,
            status: 'pending',
            payment_status: 'pending',
            children_count: bookingData.children_count || 0,
            infants_count: bookingData.infants_count || 0,
          },
        ])
        .select(`
          *,
          property:properties(*),
          guest:users(*),
          host:hosts(*, user:users(*))
        `)
        .single();

      if (error) {
        throw error;
      }

      // Send notification to host
      await this.sendBookingNotification(data.id, 'new_booking');

      return {
        success: true,
        data,
        message: 'Booking created successfully',
      };
    } catch (error) {
      console.error('Error creating booking:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(id: string): Promise<Booking | null> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          property:properties(*,
            images:property_images(*),
            host:hosts(*, user:users(*))
          ),
          guest:users(*),
          payments:payments(*),
          reviews:reviews(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      return null;
    }
  }

  /**
   * Search bookings with filters
   */
  static async searchBookings(filters: BookingFilters = {}): Promise<PaginatedResponse<Booking>> {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          property:properties(title, location, city),
          guest:users(full_name, email),
          host:hosts(name)
        `, { count: 'exact' });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
      }

      if (filters.property_id) {
        query = query.eq('property_id', filters.property_id);
      }

      if (filters.guest_id) {
        query = query.eq('guest_id', filters.guest_id);
      }

      if (filters.host_id) {
        query = query.eq('host_id', filters.host_id);
      }

      if (filters.date_from) {
        query = query.gte('check_in_date', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('check_out_date', filters.date_to);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query
        .range(from, to)
        .order('created_at', { ascending: false });

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
      console.error('Error searching bookings:', error);
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
   * Update booking status
   */
  static async updateBookingStatus(
    id: string, 
    status: BookingStatus,
    reason?: string
  ): Promise<ApiResponse<Booking>> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'cancelled' && reason) {
        updateData.cancellation_reason = reason;
        updateData.cancelled_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Send notification about status change
      await this.sendBookingNotification(id, `booking_${status}`);

      return {
        success: true,
        data,
        message: `Booking ${status} successfully`,
      };
    } catch (error) {
      console.error('Error updating booking status:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Process payment for booking
   */
  static async processPayment(
    bookingId: string,
    paymentMethod: string,
    paymentProvider: string,
    providerTransactionId?: string
  ): Promise<ApiResponse<any>> {
    try {
      // Create payment record
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (!booking) {
        return {
          success: false,
          error: 'Booking not found',
        };
      }

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            booking_id: bookingId,
            payer_id: booking.guest_id,
            recipient_id: booking.host_id,
            amount: booking.total_amount,
            currency: booking.currency,
            payment_method: paymentMethod,
            payment_provider: paymentProvider,
            provider_transaction_id: providerTransactionId,
            status: 'processing',
            description: `Payment for booking ${booking.confirmation_code}`,
          },
        ])
        .select()
        .single();

      if (paymentError) {
        throw paymentError;
      }

      // Update booking payment status
      await supabase
        .from('bookings')
        .update({
          payment_status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      // Here you would integrate with actual payment provider (Stripe, PayPal, etc.)
      // For now, we'll simulate successful payment processing
      
      // Simulate payment processing delay
      setTimeout(async () => {
        try {
          // Update payment status to completed
          await supabase
            .from('payments')
            .update({
              status: 'completed',
              processed_at: new Date().toISOString(),
            })
            .eq('id', payment.id);

          // Update booking payment status and confirm booking
          await supabase
            .from('bookings')
            .update({
              payment_status: 'completed',
              status: 'confirmed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', bookingId);

          // Send confirmation notifications
          await this.sendBookingNotification(bookingId, 'payment_successful');
        } catch (error) {
          console.error('Error processing payment completion:', error);
        }
      }, 2000);

      return {
        success: true,
        data: payment,
        message: 'Payment is being processed',
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(
    id: string, 
    reason: string,
    cancelledBy: string
  ): Promise<ApiResponse<Booking>> {
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (!booking) {
        return {
          success: false,
          error: 'Booking not found',
        };
      }

      // Calculate refund amount based on cancellation policy
      const refundAmount = this.calculateRefundAmount(booking);

      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          cancelled_by: cancelledBy,
          refund_amount: refundAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Process refund if applicable
      if (refundAmount > 0) {
        await this.processRefund(id, refundAmount);
      }

      // Send cancellation notifications
      await this.sendBookingNotification(id, 'booking_cancelled');

      return {
        success: true,
        data,
        message: 'Booking cancelled successfully',
      };
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get booking statistics
   */
  static async getBookingStats(filters: { 
    host_id?: string; 
    guest_id?: string; 
    period?: 'month' | 'quarter' | 'year' 
  } = {}): Promise<{
    total_bookings: number;
    confirmed_bookings: number;
    cancelled_bookings: number;
    total_revenue: number;
    average_booking_value: number;
    occupancy_rate: number;
    recent_bookings: Booking[];
  }> {
    try {
      let query = supabase
        .from('bookings')
        .select('*');

      if (filters.host_id) {
        query = query.eq('host_id', filters.host_id);
      }

      if (filters.guest_id) {
        query = query.eq('guest_id', filters.guest_id);
      }

      if (filters.period) {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.period) {
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: bookings } = await query;

      const totalBookings = bookings?.length || 0;
      const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
      const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;
      const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Get recent bookings
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select(`
          *,
          property:properties(title),
          guest:users(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        total_bookings: totalBookings,
        confirmed_bookings: confirmedBookings,
        cancelled_bookings: cancelledBookings,
        total_revenue: totalRevenue,
        average_booking_value: averageBookingValue,
        occupancy_rate: 0, // Would calculate based on calendar availability
        recent_bookings: recentBookings || [],
      };
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      return {
        total_bookings: 0,
        confirmed_bookings: 0,
        cancelled_bookings: 0,
        total_revenue: 0,
        average_booking_value: 0,
        occupancy_rate: 0,
        recent_bookings: [],
      };
    }
  }

  /**
   * Check in guest
   */
  static async checkInGuest(bookingId: string): Promise<ApiResponse<Booking>> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          check_in_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      await this.sendBookingNotification(bookingId, 'guest_checked_in');

      return {
        success: true,
        data,
        message: 'Guest checked in successfully',
      };
    } catch (error) {
      console.error('Error checking in guest:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check out guest
   */
  static async checkOutGuest(bookingId: string): Promise<ApiResponse<Booking>> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          check_out_time: new Date().toISOString(),
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      await this.sendBookingNotification(bookingId, 'guest_checked_out');

      return {
        success: true,
        data,
        message: 'Guest checked out successfully',
      };
    } catch (error) {
      console.error('Error checking out guest:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Send booking notification
   */
  private static async sendBookingNotification(bookingId: string, type: string): Promise<void> {
    try {
      // This would integrate with your notification service
      // For now, we'll just log it
      console.log(`Sending ${type} notification for booking ${bookingId}`);
      
      // You could insert into notifications table here
      const { data: booking } = await supabase
        .from('bookings')
        .select('guest_id, host_id')
        .eq('id', bookingId)
        .single();

      if (booking) {
        const notifications = [];
        
        // Notification for guest
        notifications.push({
          user_id: booking.guest_id,
          type: 'booking',
          title: this.getNotificationTitle(type, 'guest'),
          message: this.getNotificationMessage(type, 'guest'),
          data: { booking_id: bookingId },
        });

        // Notification for host
        notifications.push({
          user_id: booking.host_id,
          type: 'booking',
          title: this.getNotificationTitle(type, 'host'),
          message: this.getNotificationMessage(type, 'host'),
          data: { booking_id: bookingId },
        });

        await supabase
          .from('notifications')
          .insert(notifications);
      }
    } catch (error) {
      console.error('Error sending booking notification:', error);
    }
  }

  /**
   * Calculate refund amount based on cancellation policy
   */
  private static calculateRefundAmount(booking: Booking): number {
    const now = new Date();
    const checkInDate = new Date(booking.check_in_date);
    const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Simple cancellation policy - can be made more sophisticated
    if (hoursUntilCheckIn >= 48) {
      return booking.total_amount * 0.9; // 90% refund
    } else if (hoursUntilCheckIn >= 24) {
      return booking.total_amount * 0.5; // 50% refund
    } else {
      return 0; // No refund
    }
  }

  /**
   * Process refund
   */
  private static async processRefund(bookingId: string, amount: number): Promise<void> {
    try {
      // This would integrate with your payment provider's refund API
      console.log(`Processing refund of ${amount} for booking ${bookingId}`);
      
      // Update payment record
      await supabase
        .from('payments')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId);
    } catch (error) {
      console.error('Error processing refund:', error);
    }
  }

  /**
   * Get notification title
   */
  private static getNotificationTitle(type: string, userType: 'guest' | 'host'): string {
    const titles: Record<string, Record<string, string>> = {
      new_booking: {
        guest: 'Booking Submitted',
        host: 'New Booking Request',
      },
      booking_confirmed: {
        guest: 'Booking Confirmed',
        host: 'Booking Confirmed',
      },
      payment_successful: {
        guest: 'Payment Successful',
        host: 'Payment Received',
      },
      booking_cancelled: {
        guest: 'Booking Cancelled',
        host: 'Booking Cancelled',
      },
      guest_checked_in: {
        guest: 'Check-in Confirmed',
        host: 'Guest Checked In',
      },
      guest_checked_out: {
        guest: 'Check-out Complete',
        host: 'Guest Checked Out',
      },
    };

    return titles[type]?.[userType] || 'Booking Update';
  }

  /**
   * Get notification message
   */
  private static getNotificationMessage(type: string, userType: 'guest' | 'host'): string {
    const messages: Record<string, Record<string, string>> = {
      new_booking: {
        guest: 'Your booking request has been submitted and is pending host approval.',
        host: 'You have a new booking request. Please review and respond.',
      },
      booking_confirmed: {
        guest: 'Your booking has been confirmed. Check your email for details.',
        host: 'You have confirmed a booking. The guest will be notified.',
      },
      payment_successful: {
        guest: 'Your payment has been processed successfully.',
        host: 'Payment has been received for your property booking.',
      },
      booking_cancelled: {
        guest: 'Your booking has been cancelled. Refund details will follow.',
        host: 'A booking for your property has been cancelled.',
      },
      guest_checked_in: {
        guest: 'Your check-in has been confirmed. Enjoy your stay!',
        host: 'Your guest has successfully checked in.',
      },
      guest_checked_out: {
        guest: 'Thank you for your stay! Please consider leaving a review.',
        host: 'Your guest has checked out. Time to prepare for the next guest.',
      },
    };

    return messages[type]?.[userType] || 'Your booking has been updated.';
  }
}

export default BookingsService;