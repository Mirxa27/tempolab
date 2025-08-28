// Enhanced database types with comprehensive business logic types
import { Database } from './supabase';

// User roles enum
export type UserRole = 'guest' | 'host' | 'investor' | 'admin' | 'super_admin';

// Property related types
export type PropertyStatus = 'active' | 'inactive' | 'pending' | 'maintenance' | 'archived';
export type PropertyType = 'apartment' | 'villa' | 'house' | 'studio' | 'penthouse' | 'townhouse';
export type PricingDuration = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Booking related types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

// Investment related types
export type InvestmentStatus = 'open' | 'closed' | 'fully_funded' | 'paused';

// Notification types
export type NotificationType = 'booking' | 'payment' | 'investment' | 'property' | 'system' | 'marketing';

// Enhanced property interface with all business logic
export interface Property {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  short_description?: string;
  location: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  country: string;
  city: string;
  neighborhood?: string;
  postal_code?: string;
  host_id: string;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  square_meters?: number;
  floor_number?: number;
  total_floors?: number;
  year_built?: number;
  furnished: boolean;
  parking_spaces: number;
  status: PropertyStatus;
  base_price: number;
  currency: string;
  minimum_stay: number;
  maximum_stay?: number;
  check_in_time: string;
  check_out_time: string;
  house_rules?: string;
  cancellation_policy?: string;
  is_instant_book: boolean;
  booking_lead_time: number;
  featured: boolean;
  featured_until?: string;
  views_count: number;
  bookings_count: number;
  rating: number;
  reviews_count: number;
  license_number?: string;
  tax_registration?: string;
  insurance_policy?: string;
  safety_features: string[];
  accessibility_features: string[];
  metadata: Record<string, any>;
  
  // Related data (populated via joins)
  host?: Host;
  images?: PropertyImage[];
  amenities?: Amenity[];
  pricing_plans?: PricingPlan[];
  investment_opportunity?: InvestmentOpportunity;
  reviews?: Review[];
  primary_image_url?: string;
  amenity_names?: string[];
  average_rating?: number;
  total_reviews?: number;
  total_bookings?: number;
}

// Host interface
export interface Host {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  business_name?: string;
  bio?: string;
  rating: number;
  total_reviews: number;
  total_properties: number;
  total_bookings: number;
  verified: boolean;
  verification_date?: string;
  commission_rate: number;
  payout_method?: Record<string, any>;
  tax_info?: Record<string, any>;
  is_superhost: boolean;
  response_rate: number;
  response_time_minutes: number;
  user?: User;
}

// Enhanced user interface
export interface User {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  preferred_language: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  profile_image_url?: string;
  address?: Record<string, any>;
  emergency_contact?: Record<string, any>;
  verification_documents?: Record<string, any>;
  preferences: Record<string, any>;
  last_login_at?: string;
  login_count: number;
  host_profile?: Host;
}

// Property image interface
export interface PropertyImage {
  id: string;
  created_at: string;
  property_id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  display_order: number;
  room_type?: string;
  image_type: string;
  width?: number;
  height?: number;
  file_size?: number;
  uploaded_by?: string;
}

// Amenity interface
export interface Amenity {
  id: string;
  created_at: string;
  name: string;
  description?: string;
  icon: string;
  category: string;
  is_premium: boolean;
  display_order: number;
  is_active: boolean;
}

// Pricing plan interface
export interface PricingPlan {
  id: string;
  created_at: string;
  updated_at: string;
  property_id: string;
  duration: PricingDuration;
  price: number;
  minimum_stay: number;
  maximum_stay?: number;
  discount_percentage: number;
  is_active: boolean;
  valid_from?: string;
  valid_until?: string;
}

// Booking interface
export interface Booking {
  id: string;
  created_at: string;
  updated_at: string;
  property_id: string;
  guest_id: string;
  host_id: string;
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  adults_count: number;
  children_count: number;
  infants_count: number;
  nights_count: number;
  base_price: number;
  cleaning_fee: number;
  service_fee: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  confirmation_code: string;
  special_requests?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  refund_amount: number;
  check_in_time?: string;
  check_out_time?: string;
  guest_review_id?: string;
  host_review_id?: string;
  
  // Related data
  property?: Property;
  guest?: User;
  host?: Host;
  payments?: Payment[];
  reviews?: Review[];
}

// Investment opportunity interface
export interface InvestmentOpportunity {
  id: string;
  created_at: string;
  updated_at: string;
  property_id: string;
  title: string;
  description: string;
  expected_return: number;
  expected_return_period: number;
  min_investment: number;
  max_investment?: number;
  total_investment_needed: number;
  current_investment: number;
  investor_count: number;
  status: InvestmentStatus;
  start_date: string;
  end_date: string;
  expected_completion_date?: string;
  risk_level: number;
  investment_type: string;
  projected_annual_income?: number;
  projected_capital_appreciation?: number;
  business_plan?: string;
  financial_projections?: Record<string, any>;
  legal_documents: string[];
  due_diligence_docs: string[];
  featured: boolean;
  
  // Related data
  property?: Property;
  investments?: Investment[];
  funding_percentage?: number;
}

// Investment interface
export interface Investment {
  id: string;
  created_at: string;
  updated_at: string;
  opportunity_id: string;
  investor_id: string;
  amount: number;
  currency: string;
  payment_status: PaymentStatus;
  payment_method?: string;
  transaction_id?: string;
  contract_signed: boolean;
  contract_signed_at?: string;
  expected_return_amount?: number;
  actual_return_amount?: number;
  return_payments_received: number;
  investment_percentage?: number;
  notes?: string;
  
  // Related data
  opportunity?: InvestmentOpportunity;
  investor?: User;
  payments?: Payment[];
}

// Review interface
export interface Review {
  id: string;
  created_at: string;
  updated_at: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  property_id: string;
  rating: number;
  title?: string;
  content: string;
  is_guest_review: boolean;
  cleanliness_rating?: number;
  communication_rating?: number;
  location_rating?: number;
  value_rating?: number;
  accuracy_rating?: number;
  checkin_rating?: number;
  response?: string;
  response_date?: string;
  is_public: boolean;
  is_featured: boolean;
  helpful_votes: number;
  reported_count: number;
  verified: boolean;
  
  // Related data
  reviewer?: User;
  reviewee?: User;
  property?: Property;
  booking?: Booking;
}

// Payment interface
export interface Payment {
  id: string;
  created_at: string;
  updated_at: string;
  booking_id?: string;
  investment_id?: string;
  payer_id: string;
  recipient_id?: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_provider: string;
  provider_transaction_id?: string;
  provider_fee: number;
  platform_fee: number;
  status: PaymentStatus;
  description?: string;
  metadata: Record<string, any>;
  processed_at?: string;
  
  // Related data
  payer?: User;
  recipient?: User;
  booking?: Booking;
  investment?: Investment;
}

// Notification interface
export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  read_at?: string;
  action_url?: string;
  expires_at?: string;
  user?: User;
}

// System settings interface
export interface SystemSetting {
  id: string;
  created_at: string;
  updated_at: string;
  key: string;
  value: any;
  description?: string;
  category: string;
  is_sensitive: boolean;
  updated_by?: string;
}

// Activity log interface
export interface ActivityLog {
  id: string;
  created_at: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  metadata: Record<string, any>;
  user?: User;
}

// Saved search interface
export interface SavedSearch {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  name: string;
  search_criteria: Record<string, any>;
  email_alerts: boolean;
  push_alerts: boolean;
  alert_frequency: string;
  last_alert_sent?: string;
  is_active: boolean;
  user?: User;
}

// Wishlist interface
export interface Wishlist {
  id: string;
  created_at: string;
  user_id: string;
  property_id: string;
  notes?: string;
  user?: User;
  property?: Property;
}

// Message interface
export interface Message {
  id: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  booking_id?: string;
  subject?: string;
  content: string;
  read: boolean;
  read_at?: string;
  parent_message_id?: string;
  
  // Related data
  sender?: User;
  recipient?: User;
  booking?: Booking;
  parent_message?: Message;
  replies?: Message[];
}

// Search and filter types
export interface PropertySearchFilters {
  searchTerm?: string;
  city?: string;
  property_type?: PropertyType;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  min_guests?: number;
  max_guests?: number;
  amenities?: string[];
  duration?: PricingDuration;
  check_in_date?: string;
  check_out_date?: string;
  instant_book?: boolean;
  investment_only?: boolean;
  featured_only?: boolean;
  sort_by?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'distance';
  page?: number;
  limit?: number;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Booking calculation types
export interface BookingCalculation {
  base_amount: number;
  cleaning_fee: number;
  service_fee: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  breakdown: {
    nights: number;
    rate_per_night: number;
    service_fee_rate: number;
    tax_rate: number;
    cleaning_fee_rate: number;
  };
}

// Chat/AI types
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'sara';
  timestamp: Date;
  type?: 'text' | 'property_suggestion' | 'booking_help' | 'investment_info';
  data?: any;
}

export interface ChatResponse {
  message: ChatMessage;
  suggested_properties?: string[];
  actions?: {
    type: 'search' | 'book' | 'invest' | 'view_property' | 'contact_host';
    data: any;
    label: string;
  }[];
  quick_replies?: string[];
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface FormState {
  isSubmitting: boolean;
  errors: ValidationError[];
  touched: Set<string>;
  values: Record<string, any>;
}

// Component prop types for better reusability
export interface PropertyCardProps {
  property: Property;
  onQuickView?: (property: Property) => void;
  onBook?: (property: Property) => void;
  onInvest?: (property: Property) => void;
  onToggleWishlist?: (property: Property) => void;
  showInvestment?: boolean;
  compact?: boolean;
}

export interface FilterBarProps {
  filters: PropertySearchFilters;
  onFilterChange: (filters: Partial<PropertySearchFilters>) => void;
  loading?: boolean;
  resultCount?: number;
}

// Dashboard/admin types
export interface DashboardStats {
  total_properties: number;
  active_properties: number;
  total_bookings: number;
  total_revenue: number;
  total_users: number;
  total_hosts: number;
  total_investors: number;
  pending_bookings: number;
  recent_bookings: Booking[];
  recent_reviews: Review[];
  revenue_chart: {
    date: string;
    revenue: number;
    bookings: number;
  }[];
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  user_id?: string;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

export interface ImageUploadResponse {
  url: string;
  path: string;
  metadata: {
    width: number;
    height: number;
    size: number;
    format: string;
  };
}