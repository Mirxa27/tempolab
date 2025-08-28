// Comprehensive validation schemas and error handling
import { z } from 'zod';

// User validation schemas
export const userRegistrationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number and special character'),
  full_name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
    .optional(),
  date_of_birth: z.string()
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18;
    }, 'You must be at least 18 years old')
    .optional(),
  nationality: z.string().max(100).optional(),
  terms_accepted: z.boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
});

export const userLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional(),
});

export const userUpdateSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  date_of_birth: z.string().optional(),
  nationality: z.string().max(100).optional(),
  preferred_language: z.string().max(10).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

// Property validation schemas
export const propertyCreateSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  short_description: z.string()
    .max(500, 'Short description must be less than 500 characters')
    .optional(),
  location: z.string()
    .min(5, 'Location must be at least 5 characters')
    .max(200, 'Location must be less than 200 characters'),
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(500, 'Address must be less than 500 characters'),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be less than 100 characters'),
  country: z.string().default('Saudi Arabia'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  property_type: z.enum(['apartment', 'villa', 'house', 'studio', 'penthouse', 'townhouse']),
  bedrooms: z.number()
    .min(0, 'Bedrooms cannot be negative')
    .max(20, 'Maximum 20 bedrooms allowed'),
  bathrooms: z.number()
    .min(0.5, 'Must have at least half bathroom')
    .max(20, 'Maximum 20 bathrooms allowed'),
  max_guests: z.number()
    .min(1, 'Must accommodate at least 1 guest')
    .max(50, 'Maximum 50 guests allowed'),
  square_meters: z.number()
    .min(10, 'Minimum 10 square meters')
    .max(10000, 'Maximum 10000 square meters')
    .optional(),
  base_price: z.number()
    .min(50, 'Minimum price is 50 SAR per night')
    .max(50000, 'Maximum price is 50000 SAR per night'),
  minimum_stay: z.number()
    .min(1, 'Minimum stay must be at least 1 night')
    .max(365, 'Maximum stay cannot exceed 365 nights')
    .default(1),
  maximum_stay: z.number()
    .min(1)
    .max(365)
    .optional(),
  house_rules: z.string().max(2000).optional(),
  cancellation_policy: z.string().max(2000).optional(),
  amenity_ids: z.array(z.string().uuid()).optional(),
});

export const propertyUpdateSchema = propertyCreateSchema.partial();

// Booking validation schemas
export const bookingCreateSchema = z.object({
  property_id: z.string().uuid('Invalid property ID'),
  check_in_date: z.string()
    .refine((date) => {
      const checkIn = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return checkIn >= today;
    }, 'Check-in date cannot be in the past'),
  check_out_date: z.string(),
  guests_count: z.number()
    .min(1, 'Must have at least 1 guest')
    .max(50, 'Maximum 50 guests allowed'),
  adults_count: z.number()
    .min(1, 'Must have at least 1 adult')
    .max(50, 'Maximum 50 adults allowed'),
  children_count: z.number()
    .min(0, 'Children count cannot be negative')
    .max(20, 'Maximum 20 children allowed')
    .default(0),
  infants_count: z.number()
    .min(0, 'Infants count cannot be negative')
    .max(10, 'Maximum 10 infants allowed')
    .default(0),
  special_requests: z.string()
    .max(1000, 'Special requests must be less than 1000 characters')
    .optional(),
}).refine((data) => {
  const checkIn = new Date(data.check_in_date);
  const checkOut = new Date(data.check_out_date);
  return checkOut > checkIn;
}, {
  message: 'Check-out date must be after check-in date',
  path: ['check_out_date'],
}).refine((data) => {
  const checkIn = new Date(data.check_in_date);
  const checkOut = new Date(data.check_out_date);
  const daysDiff = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff <= 365;
}, {
  message: 'Booking cannot exceed 365 nights',
  path: ['check_out_date'],
}).refine((data) => {
  return data.guests_count === data.adults_count + data.children_count;
}, {
  message: 'Total guests must equal adults plus children',
  path: ['guests_count'],
});

// Investment validation schemas
export const investmentCreateSchema = z.object({
  opportunity_id: z.string().uuid('Invalid opportunity ID'),
  amount: z.number()
    .min(1000, 'Minimum investment is 1000 SAR')
    .max(10000000, 'Maximum investment is 10,000,000 SAR'),
  currency: z.string().default('SAR'),
  payment_method: z.enum(['credit_card', 'bank_transfer', 'wallet']),
  terms_accepted: z.boolean()
    .refine((val) => val === true, 'You must accept the investment terms'),
});

// Review validation schemas
export const reviewCreateSchema = z.object({
  booking_id: z.string().uuid('Invalid booking ID'),
  rating: z.number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  title: z.string()
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  content: z.string()
    .min(10, 'Review must be at least 10 characters')
    .max(2000, 'Review must be less than 2000 characters'),
  cleanliness_rating: z.number().min(1).max(5).optional(),
  communication_rating: z.number().min(1).max(5).optional(),
  location_rating: z.number().min(1).max(5).optional(),
  value_rating: z.number().min(1).max(5).optional(),
  accuracy_rating: z.number().min(1).max(5).optional(),
  checkin_rating: z.number().min(1).max(5).optional(),
});

// Search and filter validation
export const propertySearchSchema = z.object({
  searchTerm: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  property_type: z.enum(['apartment', 'villa', 'house', 'studio', 'penthouse', 'townhouse']).optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
  bedrooms: z.number().min(0).max(20).optional(),
  bathrooms: z.number().min(0).max(20).optional(),
  min_guests: z.number().min(1).optional(),
  max_guests: z.number().min(1).optional(),
  check_in_date: z.string().optional(),
  check_out_date: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  duration: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  instant_book: z.boolean().optional(),
  investment_only: z.boolean().optional(),
  featured_only: z.boolean().optional(),
  sort_by: z.enum(['price_asc', 'price_desc', 'rating', 'newest', 'distance']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
}).refine((data) => {
  if (data.min_price && data.max_price) {
    return data.max_price >= data.min_price;
  }
  return true;
}, {
  message: 'Maximum price must be greater than or equal to minimum price',
  path: ['max_price'],
}).refine((data) => {
  if (data.check_in_date && data.check_out_date) {
    const checkIn = new Date(data.check_in_date);
    const checkOut = new Date(data.check_out_date);
    return checkOut > checkIn;
  }
  return true;
}, {
  message: 'Check-out date must be after check-in date',
  path: ['check_out_date'],
});

// Contact form validation
export const contactFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
    .optional(),
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  message: z.string()
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message must be less than 2000 characters'),
  inquiry_type: z.enum(['general', 'booking', 'investment', 'support', 'partnership']),
});

// System settings validation
export const systemSettingSchema = z.object({
  key: z.string()
    .min(1, 'Setting key is required')
    .max(100, 'Key must be less than 100 characters'),
  value: z.any(),
  description: z.string().max(500).optional(),
  category: z.string().max(50).default('general'),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  bucket: z.string().min(1, 'Bucket name is required'),
  path: z.string().min(1, 'File path is required'),
}).refine((data) => {
  // Check file size (max 10MB)
  return data.file.size <= 10 * 1024 * 1024;
}, {
  message: 'File size must be less than 10MB',
  path: ['file'],
}).refine((data) => {
  // Check file type for images
  if (data.bucket === 'property-images' || data.bucket === 'user-avatars') {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return allowedTypes.includes(data.file.type);
  }
  return true;
}, {
  message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed',
  path: ['file'],
});

// Validation error handler
export class ValidationError extends Error {
  public errors: z.ZodError;

  constructor(zodError: z.ZodError) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = zodError;
  }

  public getFieldErrors(): Record<string, string[]> {
    return this.errors.flatten().fieldErrors;
  }

  public getFirstError(): string | null {
    const issues = this.errors.issues;
    return issues.length > 0 ? issues[0].message : null;
  }

  public getErrorsForField(field: string): string[] {
    const fieldErrors = this.getFieldErrors();
    return fieldErrors[field] || [];
  }
}

// Validation utilities
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error);
    }
    throw error;
  }
};

export const validateSchemaAsync = async <T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> => {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error);
    }
    throw error;
  }
};

// Sanitization utilities
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Remove potential HTML tags
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizePhone = (phone: string): string => {
  return phone.replace(/\D/g, ''); // Remove all non-digits
};

// Custom validation rules
export const isValidSaudiPhone = (phone: string): boolean => {
  const saudiPhoneRegex = /^(\+966|966|0)?5[0-9]{8}$/;
  return saudiPhoneRegex.test(phone.replace(/\s/g, ''));
};

export const isValidIBAN = (iban: string): boolean => {
  const ibanRegex = /^SA\d{2}\d{4}[A-Z0-9]{16}$/;
  return ibanRegex.test(iban.replace(/\s/g, ''));
};

export const isValidCoordinates = (lat: number, lng: number): boolean => {
  // Saudi Arabia approximate bounds
  const saudiBounds = {
    north: 32.158,
    south: 16.0,
    east: 55.666,
    west: 34.495
  };
  
  return lat >= saudiBounds.south && 
         lat <= saudiBounds.north && 
         lng >= saudiBounds.west && 
         lng <= saudiBounds.east;
};

// Rate limiting validation
export const rateLimitSchema = z.object({
  window_ms: z.number().min(1000).max(3600000), // 1 second to 1 hour
  max_requests: z.number().min(1).max(10000),
  identifier: z.string().min(1), // IP address or user ID
});

// API response validation
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    has_more: z.boolean(),
  }).optional(),
});

// Export commonly used types
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type PropertyCreate = z.infer<typeof propertyCreateSchema>;
export type PropertyUpdate = z.infer<typeof propertyUpdateSchema>;
export type BookingCreate = z.infer<typeof bookingCreateSchema>;
export type InvestmentCreate = z.infer<typeof investmentCreateSchema>;
export type ReviewCreate = z.infer<typeof reviewCreateSchema>;
export type PropertySearch = z.infer<typeof propertySearchSchema>;
export type ContactForm = z.infer<typeof contactFormSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;

export default {
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,
  propertyCreateSchema,
  propertyUpdateSchema,
  bookingCreateSchema,
  investmentCreateSchema,
  reviewCreateSchema,
  propertySearchSchema,
  contactFormSchema,
  systemSettingSchema,
  fileUploadSchema,
  ValidationError,
  validateSchema,
  validateSchemaAsync,
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  isValidSaudiPhone,
  isValidIBAN,
  isValidCoordinates,
};