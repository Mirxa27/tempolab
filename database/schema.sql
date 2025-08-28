-- HabibStay Database Schema
-- Complete production-ready schema with all tables and relationships

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for location-based features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable pgcrypto for secure password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- USER MANAGEMENT AND AUTHENTICATION
-- =====================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'property_owner', 'investor', 'guest', 'support');

-- User status enum
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role DEFAULT 'guest',
    status user_status DEFAULT 'pending_verification',
    avatar_url TEXT,
    date_of_birth DATE,
    nationality VARCHAR(100),
    preferred_language VARCHAR(10) DEFAULT 'en',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    kyc_verified BOOLEAN DEFAULT FALSE,
    kyc_documents JSONB,
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Create super admin user (password will be set through Supabase Auth)
-- This is just to ensure we have the user profile
INSERT INTO public.users (id, email, full_name, role, status, email_verified, phone_verified, kyc_verified)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'admin@habibstay.com',
    'Super Administrator',
    'super_admin',
    'active',
    true,
    true,
    true
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PROPERTY MANAGEMENT
-- =====================================================

-- Property status enum
CREATE TYPE property_status AS ENUM ('draft', 'pending_approval', 'active', 'inactive', 'suspended', 'sold');

-- Property type enum
CREATE TYPE property_type AS ENUM ('apartment', 'house', 'villa', 'studio', 'condo', 'townhouse', 'penthouse', 'loft');

-- Rental duration enum
CREATE TYPE rental_duration AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

-- Properties table
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    property_type property_type NOT NULL,
    status property_status DEFAULT 'draft',
    
    -- Location
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location GEOGRAPHY(POINT, 4326),
    
    -- Property details
    bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
    bathrooms DECIMAL(3, 1) NOT NULL CHECK (bathrooms >= 0),
    area_sqft INTEGER,
    area_sqm INTEGER,
    floor_number INTEGER,
    total_floors INTEGER,
    year_built INTEGER,
    parking_spaces INTEGER DEFAULT 0,
    
    -- Pricing
    base_price_daily DECIMAL(10, 2),
    base_price_weekly DECIMAL(10, 2),
    base_price_monthly DECIMAL(10, 2),
    base_price_yearly DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    cleaning_fee DECIMAL(10, 2),
    security_deposit DECIMAL(10, 2),
    
    -- Availability
    minimum_stay_days INTEGER DEFAULT 1,
    maximum_stay_days INTEGER,
    advance_booking_days INTEGER DEFAULT 1,
    instant_booking BOOLEAN DEFAULT FALSE,
    
    -- Investment
    available_for_investment BOOLEAN DEFAULT FALSE,
    investment_min_amount DECIMAL(12, 2),
    expected_annual_return DECIMAL(5, 2),
    total_investment_needed DECIMAL(12, 2),
    current_investment_amount DECIMAL(12, 2) DEFAULT 0,
    
    -- Features and amenities (stored as JSONB for flexibility)
    amenities JSONB DEFAULT '[]'::jsonb,
    house_rules JSONB DEFAULT '[]'::jsonb,
    nearby_attractions JSONB DEFAULT '[]'::jsonb,
    
    -- Media
    main_image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    virtual_tour_url TEXT,
    video_url TEXT,
    floor_plan_url TEXT,
    
    -- SEO and marketing
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT[],
    
    -- Statistics
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT valid_location CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude IS NOT NULL AND longitude IS NOT NULL)
    )
);

-- Create index for location-based searches
CREATE INDEX idx_properties_location ON properties USING GIST(location);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_city_country ON properties(city, country);

-- =====================================================
-- BOOKINGS AND RESERVATIONS
-- =====================================================

-- Booking status enum
CREATE TYPE booking_status AS ENUM (
    'pending', 'confirmed', 'cancelled', 'completed', 
    'no_show', 'in_progress', 'disputed'
);

-- Payment status enum
CREATE TYPE payment_status AS ENUM (
    'pending', 'processing', 'completed', 'failed', 
    'refunded', 'partially_refunded', 'disputed'
);

-- Bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    
    -- Dates
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    number_of_nights INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
    
    -- Guests
    number_of_adults INTEGER NOT NULL DEFAULT 1,
    number_of_children INTEGER DEFAULT 0,
    number_of_infants INTEGER DEFAULT 0,
    
    -- Pricing
    base_amount DECIMAL(10, 2) NOT NULL,
    cleaning_fee DECIMAL(10, 2) DEFAULT 0,
    service_fee DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    security_deposit DECIMAL(10, 2) DEFAULT 0,
    security_deposit_status payment_status DEFAULT 'pending',
    
    -- Status
    booking_status booking_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    
    -- Guest information
    guest_message TEXT,
    special_requests TEXT,
    arrival_time TIME,
    
    -- Host approval
    requires_host_approval BOOLEAN DEFAULT FALSE,
    host_approved_at TIMESTAMPTZ,
    host_message TEXT,
    
    -- Cancellation
    cancellation_policy JSONB,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES public.users(id),
    cancellation_reason TEXT,
    refund_amount DECIMAL(10, 2),
    
    -- Check-in/out
    actual_check_in TIMESTAMPTZ,
    actual_check_out TIMESTAMPTZ,
    
    -- Metadata
    source VARCHAR(50), -- website, mobile_app, api, admin
    device_info JSONB,
    ip_address INET,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT valid_guests CHECK (number_of_adults > 0)
);

CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_guest ON bookings(guest_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);

-- =====================================================
-- INVESTMENT MANAGEMENT
-- =====================================================

-- Investment status enum
CREATE TYPE investment_status AS ENUM (
    'pending', 'active', 'completed', 'cancelled', 'on_hold'
);

-- Investments table
CREATE TABLE public.investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- Investment details
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    ownership_percentage DECIMAL(5, 2),
    
    -- Terms
    investment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    maturity_date DATE,
    lock_in_period_months INTEGER,
    expected_annual_return DECIMAL(5, 2),
    actual_returns DECIMAL(12, 2) DEFAULT 0,
    
    -- Status
    status investment_status DEFAULT 'pending',
    
    -- Documentation
    contract_url TEXT,
    contract_signed_at TIMESTAMPTZ,
    documents JSONB DEFAULT '[]'::jsonb,
    
    -- Payouts
    total_payouts DECIMAL(12, 2) DEFAULT 0,
    last_payout_date DATE,
    next_payout_date DATE,
    
    -- Metadata
    notes TEXT,
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ
);

CREATE INDEX idx_investments_investor ON investments(investor_id);
CREATE INDEX idx_investments_property ON investments(property_id);
CREATE INDEX idx_investments_status ON investments(status);

-- =====================================================
-- REVIEWS AND RATINGS
-- =====================================================

-- Reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Ratings (1-5 scale)
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    checkin_rating INTEGER CHECK (checkin_rating BETWEEN 1 AND 5),
    accuracy_rating INTEGER CHECK (accuracy_rating BETWEEN 1 AND 5),
    location_rating INTEGER CHECK (location_rating BETWEEN 1 AND 5),
    value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
    
    -- Review content
    title VARCHAR(255),
    comment TEXT NOT NULL,
    
    -- Host response
    host_response TEXT,
    host_response_at TIMESTAMPTZ,
    
    -- Moderation
    is_verified BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    moderated_by UUID REFERENCES public.users(id),
    moderated_at TIMESTAMPTZ,
    moderation_notes TEXT,
    
    -- Media
    images JSONB DEFAULT '[]'::jsonb,
    
    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT one_review_per_booking UNIQUE(booking_id)
);

CREATE INDEX idx_reviews_property ON reviews(property_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_rating ON reviews(overall_rating);
CREATE INDEX idx_reviews_published ON reviews(is_published);

-- =====================================================
-- TRANSACTIONS AND PAYMENTS
-- =====================================================

-- Transaction type enum
CREATE TYPE transaction_type AS ENUM (
    'booking_payment', 'booking_refund', 'security_deposit', 
    'security_refund', 'investment', 'payout', 'commission', 
    'service_fee', 'other'
);

-- Payment method enum
CREATE TYPE payment_method AS ENUM (
    'credit_card', 'debit_card', 'paypal', 'stripe', 
    'bank_transfer', 'crypto', 'cash', 'other'
);

-- Transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Related entities
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    investment_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    
    -- Transaction details
    transaction_type transaction_type NOT NULL,
    payment_method payment_method,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Payment gateway details
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    
    -- Status
    status payment_status DEFAULT 'pending',
    
    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_booking ON transactions(booking_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

-- =====================================================
-- MESSAGES AND COMMUNICATIONS
-- =====================================================

-- Message status enum
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- Messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Related entities
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    
    -- Message content
    subject VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Status
    status message_status DEFAULT 'sent',
    
    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    
    -- Metadata
    is_automated BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_property ON messages(property_id);

-- =====================================================
-- AI CHAT HISTORY (SARA)
-- =====================================================

-- AI chat sessions table
CREATE TABLE public.ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE,
    
    -- Session details
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Context
    context JSONB DEFAULT '{}'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    device_info JSONB
);

-- AI chat messages table
CREATE TABLE public.ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
    
    -- Message details
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- AI specific
    tokens_used INTEGER,
    model_version VARCHAR(50),
    
    -- Actions and suggestions
    suggested_properties UUID[],
    suggested_actions JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Feedback
    helpful BOOLEAN,
    feedback TEXT
);

CREATE INDEX idx_ai_messages_session ON ai_chat_messages(session_id);
CREATE INDEX idx_ai_sessions_user ON ai_chat_sessions(user_id);

-- =====================================================
-- ADMIN CONFIGURATIONS
-- =====================================================

-- System configurations table
CREATE TABLE public.system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    category VARCHAR(100),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configurations
INSERT INTO system_configs (key, value, category, description, is_public) VALUES
('site_settings', '{"name": "HabibStay", "tagline": "Your Home Away From Home", "logo_url": "/logo.png", "favicon_url": "/favicon.ico"}', 'general', 'Site settings', true),
('commission_rates', '{"booking": 0.15, "investment": 0.02, "property_listing": 0}', 'financial', 'Commission rates for different services', false),
('payment_gateways', '{"stripe": {"enabled": true, "public_key": "", "secret_key": ""}, "paypal": {"enabled": false}}', 'payment', 'Payment gateway configurations', false),
('email_settings', '{"smtp_host": "", "smtp_port": 587, "smtp_user": "", "smtp_password": "", "from_email": "noreply@habibstay.com"}', 'email', 'Email configuration', false),
('ai_settings', '{"enabled": true, "model": "gpt-4", "max_tokens": 1000, "temperature": 0.7}', 'ai', 'AI assistant settings', false),
('booking_policies', '{"min_advance_days": 1, "max_advance_days": 365, "cancellation_window_hours": 24}', 'booking', 'Booking policies', true),
('investment_settings', '{"min_investment": 1000, "max_investment_percentage": 49, "lock_in_period_months": 12}', 'investment', 'Investment settings', true);

-- =====================================================
-- AUDIT LOGS
-- =====================================================

-- Audit logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- Notification type enum
CREATE TYPE notification_type AS ENUM (
    'booking_confirmation', 'booking_cancellation', 'payment_received',
    'review_received', 'message_received', 'investment_update',
    'property_approved', 'system_announcement', 'other'
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- =====================================================
-- FAVORITES
-- =====================================================

-- Favorites table
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_property_favorite UNIQUE(user_id, property_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_property ON favorites(property_id);

-- =====================================================
-- PROPERTY AVAILABILITY
-- =====================================================

-- Property availability table (for blocking dates)
CREATE TABLE public.property_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    price_override DECIMAL(10, 2),
    min_stay_override INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_property_date UNIQUE(property_id, date)
);

CREATE INDEX idx_availability_property_date ON property_availability(property_id, date);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_availability ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Properties policies
CREATE POLICY "Anyone can view active properties" ON public.properties
    FOR SELECT USING (status = 'active' OR owner_id = auth.uid());

CREATE POLICY "Owners can manage their properties" ON public.properties
    FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Admins can manage all properties" ON public.properties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
    FOR SELECT USING (guest_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.properties 
            WHERE id = property_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (guest_id = auth.uid());

-- System configs policies
CREATE POLICY "Public configs are viewable by all" ON public.system_configs
    FOR SELECT USING (is_public = true);

CREATE POLICY "Only admins can manage configs" ON public.system_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON public.system_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update property location point from lat/lng
CREATE OR REPLACE FUNCTION update_property_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_property_location_trigger
    BEFORE INSERT OR UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION update_property_location();

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_reference = 'BK' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                            LPAD(NEXTVAL('booking_reference_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE booking_reference_seq;

CREATE TRIGGER generate_booking_reference_trigger
    BEFORE INSERT ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION generate_booking_reference();

-- Function to update property statistics
CREATE OR REPLACE FUNCTION update_property_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'reviews' THEN
        UPDATE public.properties
        SET average_rating = (
                SELECT AVG(overall_rating) FROM public.reviews 
                WHERE property_id = NEW.property_id AND is_published = true
            ),
            total_reviews = (
                SELECT COUNT(*) FROM public.reviews 
                WHERE property_id = NEW.property_id AND is_published = true
            )
        WHERE id = NEW.property_id;
    END IF;
    
    IF TG_TABLE_NAME = 'favorites' THEN
        UPDATE public.properties
        SET favorite_count = (
                SELECT COUNT(*) FROM public.favorites 
                WHERE property_id = NEW.property_id
            )
        WHERE id = NEW.property_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_property_stats_on_review
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_property_stats();

CREATE TRIGGER update_property_stats_on_favorite
    AFTER INSERT OR DELETE ON public.favorites
    FOR EACH ROW EXECUTE FUNCTION update_property_stats();

-- Function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_properties AFTER INSERT OR UPDATE OR DELETE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_bookings AFTER INSERT OR UPDATE OR DELETE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_system_configs AFTER INSERT OR UPDATE OR DELETE ON public.system_configs
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional performance indexes
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_properties_price ON public.properties(base_price_daily);
CREATE INDEX idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX idx_transactions_created ON public.transactions(created_at DESC);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- Full text search indexes
CREATE INDEX idx_properties_search ON public.properties USING GIN(
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for property search with calculated fields
CREATE OR REPLACE VIEW property_search_view AS
SELECT 
    p.*,
    u.full_name as owner_name,
    u.avatar_url as owner_avatar,
    COALESCE(p.average_rating, 0) as rating,
    COALESCE(p.total_reviews, 0) as reviews,
    COALESCE(p.favorite_count, 0) as favorites,
    CASE 
        WHEN p.available_for_investment = true 
        THEN (p.total_investment_needed - p.current_investment_amount)
        ELSE 0 
    END as investment_available
FROM public.properties p
JOIN public.users u ON p.owner_id = u.id
WHERE p.status = 'active' AND p.deleted_at IS NULL;

-- View for booking dashboard
CREATE OR REPLACE VIEW booking_dashboard_view AS
SELECT 
    b.*,
    p.title as property_title,
    p.main_image_url as property_image,
    p.city as property_city,
    p.country as property_country,
    g.full_name as guest_name,
    g.email as guest_email,
    g.phone as guest_phone,
    o.full_name as owner_name,
    o.email as owner_email
FROM public.bookings b
JOIN public.properties p ON b.property_id = p.id
JOIN public.users g ON b.guest_id = g.id
JOIN public.users o ON p.owner_id = o.id;

-- View for investment portfolio
CREATE OR REPLACE VIEW investment_portfolio_view AS
SELECT 
    i.*,
    p.title as property_title,
    p.main_image_url as property_image,
    p.city as property_city,
    p.country as property_country,
    p.average_rating as property_rating,
    u.full_name as investor_name,
    (i.amount + i.actual_returns) as total_value,
    CASE 
        WHEN i.maturity_date IS NOT NULL 
        THEN i.maturity_date - CURRENT_DATE 
        ELSE NULL 
    END as days_to_maturity
FROM public.investments i
JOIN public.properties p ON i.property_id = p.id
JOIN public.users u ON i.investor_id = u.id;

-- =====================================================
-- STORED PROCEDURES FOR COMPLEX OPERATIONS
-- =====================================================

-- Procedure to calculate property availability
CREATE OR REPLACE FUNCTION check_property_availability(
    p_property_id UUID,
    p_check_in DATE,
    p_check_out DATE
) RETURNS BOOLEAN AS $$
DECLARE
    v_is_available BOOLEAN := TRUE;
BEGIN
    -- Check if dates are blocked in availability calendar
    IF EXISTS (
        SELECT 1 FROM public.property_availability
        WHERE property_id = p_property_id
        AND date >= p_check_in
        AND date < p_check_out
        AND is_available = FALSE
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Check for overlapping bookings
    IF EXISTS (
        SELECT 1 FROM public.bookings
        WHERE property_id = p_property_id
        AND booking_status IN ('confirmed', 'in_progress')
        AND (
            (check_in_date <= p_check_in AND check_out_date > p_check_in) OR
            (check_in_date < p_check_out AND check_out_date >= p_check_out) OR
            (check_in_date >= p_check_in AND check_out_date <= p_check_out)
        )
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Procedure to calculate booking price
CREATE OR REPLACE FUNCTION calculate_booking_price(
    p_property_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_guests INTEGER
) RETURNS TABLE (
    base_amount DECIMAL,
    cleaning_fee DECIMAL,
    service_fee DECIMAL,
    tax_amount DECIMAL,
    total_amount DECIMAL
) AS $$
DECLARE
    v_nights INTEGER;
    v_base_price DECIMAL;
    v_cleaning_fee DECIMAL;
    v_service_fee_rate DECIMAL;
    v_tax_rate DECIMAL := 0.10; -- 10% tax
BEGIN
    v_nights := p_check_out - p_check_in;
    
    -- Get base price based on duration
    SELECT 
        CASE 
            WHEN v_nights >= 30 THEN COALESCE(base_price_monthly / 30, base_price_daily)
            WHEN v_nights >= 7 THEN COALESCE(base_price_weekly / 7, base_price_daily)
            ELSE base_price_daily
        END,
        COALESCE(p.cleaning_fee, 0)
    INTO v_base_price, v_cleaning_fee
    FROM public.properties p
    WHERE id = p_property_id;
    
    -- Get service fee rate from config
    SELECT (value->>'booking')::DECIMAL
    INTO v_service_fee_rate
    FROM public.system_configs
    WHERE key = 'commission_rates';
    
    base_amount := v_base_price * v_nights;
    cleaning_fee := v_cleaning_fee;
    service_fee := base_amount * COALESCE(v_service_fee_rate, 0.15);
    tax_amount := (base_amount + service_fee) * v_tax_rate;
    total_amount := base_amount + cleaning_fee + service_fee + tax_amount;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Procedure to process investment payout
CREATE OR REPLACE PROCEDURE process_investment_payouts()
AS $$
DECLARE
    v_investment RECORD;
    v_payout_amount DECIMAL;
BEGIN
    FOR v_investment IN 
        SELECT i.*, p.base_price_monthly
        FROM public.investments i
        JOIN public.properties p ON i.property_id = p.id
        WHERE i.status = 'active'
        AND i.next_payout_date <= CURRENT_DATE
    LOOP
        -- Calculate payout (simplified - should be based on actual revenue)
        v_payout_amount := v_investment.amount * (v_investment.expected_annual_return / 100 / 12);
        
        -- Create transaction
        INSERT INTO public.transactions (
            user_id,
            investment_id,
            property_id,
            transaction_type,
            amount,
            status,
            description
        ) VALUES (
            v_investment.investor_id,
            v_investment.id,
            v_investment.property_id,
            'payout',
            v_payout_amount,
            'completed',
            'Monthly investment payout'
        );
        
        -- Update investment record
        UPDATE public.investments
        SET 
            actual_returns = actual_returns + v_payout_amount,
            total_payouts = total_payouts + v_payout_amount,
            last_payout_date = CURRENT_DATE,
            next_payout_date = CURRENT_DATE + INTERVAL '1 month'
        WHERE id = v_investment.id;
        
        -- Send notification
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            content
        ) VALUES (
            v_investment.investor_id,
            'investment_update',
            'Investment Payout Received',
            'You have received a payout of $' || v_payout_amount || ' for your investment.'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON public.users TO authenticated;
GRANT INSERT ON public.bookings TO authenticated;
GRANT INSERT ON public.reviews TO authenticated;
GRANT INSERT ON public.messages TO authenticated;
GRANT INSERT ON public.favorites TO authenticated;
GRANT INSERT ON public.ai_chat_sessions TO authenticated;
GRANT INSERT ON public.ai_chat_messages TO authenticated;

-- Grant permissions to service role (for backend operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;