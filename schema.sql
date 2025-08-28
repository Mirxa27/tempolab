-- HabibStay Complete Database Schema
-- Production-ready schema with all necessary tables, constraints, indexes, and triggers

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE user_role AS ENUM ('guest', 'host', 'investor', 'admin', 'super_admin');
CREATE TYPE property_status AS ENUM ('active', 'inactive', 'pending', 'maintenance', 'archived');
CREATE TYPE property_type AS ENUM ('apartment', 'villa', 'house', 'studio', 'penthouse', 'townhouse');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE investment_status AS ENUM ('open', 'closed', 'fully_funded', 'paused');
CREATE TYPE pricing_duration AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
CREATE TYPE notification_type AS ENUM ('booking', 'payment', 'investment', 'property', 'system', 'marketing');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    nationality VARCHAR(100),
    preferred_language VARCHAR(10) DEFAULT 'en',
    role user_role DEFAULT 'guest',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    profile_image_url TEXT,
    address JSONB,
    emergency_contact JSONB,
    verification_documents JSONB,
    preferences JSONB DEFAULT '{}',
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0
);

-- Hosts table
CREATE TABLE IF NOT EXISTS hosts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    bio TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    total_properties INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMPTZ,
    commission_rate DECIMAL(5,2) DEFAULT 15.00,
    payout_method JSONB,
    tax_info JSONB,
    is_superhost BOOLEAN DEFAULT FALSE,
    response_rate DECIMAL(5,2) DEFAULT 0.00,
    response_time_minutes INTEGER DEFAULT 0,
    UNIQUE(user_id)
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT,
    location VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    coordinates GEOGRAPHY(POINT, 4326),
    country VARCHAR(100) DEFAULT 'Saudi Arabia',
    city VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100),
    postal_code VARCHAR(20),
    host_id UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
    property_type property_type NOT NULL,
    bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
    bathrooms DECIMAL(3,1) NOT NULL CHECK (bathrooms >= 0),
    max_guests INTEGER NOT NULL CHECK (max_guests > 0),
    square_meters INTEGER CHECK (square_meters > 0),
    floor_number INTEGER,
    total_floors INTEGER,
    year_built INTEGER CHECK (year_built > 1800),
    furnished BOOLEAN DEFAULT TRUE,
    parking_spaces INTEGER DEFAULT 0,
    status property_status DEFAULT 'pending',
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price > 0),
    currency VARCHAR(3) DEFAULT 'SAR',
    minimum_stay INTEGER DEFAULT 1,
    maximum_stay INTEGER,
    check_in_time TIME DEFAULT '15:00',
    check_out_time TIME DEFAULT '11:00',
    house_rules TEXT,
    cancellation_policy TEXT,
    is_instant_book BOOLEAN DEFAULT FALSE,
    booking_lead_time INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    featured_until TIMESTAMPTZ,
    views_count INTEGER DEFAULT 0,
    bookings_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    reviews_count INTEGER DEFAULT 0,
    license_number VARCHAR(100),
    tax_registration VARCHAR(100),
    insurance_policy TEXT,
    safety_features JSONB DEFAULT '[]',
    accessibility_features JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}'
);

-- Property images table
CREATE TABLE IF NOT EXISTS property_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    room_type VARCHAR(100),
    image_type VARCHAR(50) DEFAULT 'interior',
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    uploaded_by UUID REFERENCES users(id)
);

-- Amenities table
CREATE TABLE IF NOT EXISTS amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Property amenities junction table
CREATE TABLE IF NOT EXISTS property_amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
    notes TEXT,
    UNIQUE(property_id, amenity_id)
);

-- Pricing plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    duration pricing_duration NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    minimum_stay INTEGER DEFAULT 1,
    maximum_stay INTEGER,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATE,
    valid_until DATE,
    UNIQUE(property_id, duration, valid_from, valid_until)
);

-- Seasonal pricing table
CREATE TABLE IF NOT EXISTS seasonal_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price_multiplier DECIMAL(5,2) NOT NULL CHECK (price_multiplier > 0),
    minimum_stay INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    CHECK (end_date > start_date)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    guest_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    host_id UUID NOT NULL REFERENCES hosts(id) ON DELETE RESTRICT,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guests_count INTEGER NOT NULL CHECK (guests_count > 0),
    adults_count INTEGER NOT NULL CHECK (adults_count > 0),
    children_count INTEGER DEFAULT 0 CHECK (children_count >= 0),
    infants_count INTEGER DEFAULT 0 CHECK (infants_count >= 0),
    nights_count INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
    base_price DECIMAL(10,2) NOT NULL,
    cleaning_fee DECIMAL(10,2) DEFAULT 0.00,
    service_fee DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SAR',
    status booking_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    confirmation_code VARCHAR(20) UNIQUE,
    special_requests TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    guest_review_id UUID,
    host_review_id UUID,
    CHECK (check_out_date > check_in_date),
    CHECK (guests_count = adults_count + children_count)
);

-- Investment opportunities table
CREATE TABLE IF NOT EXISTS investment_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    expected_return DECIMAL(5,2) NOT NULL CHECK (expected_return > 0),
    expected_return_period INTEGER DEFAULT 12, -- months
    min_investment DECIMAL(12,2) NOT NULL CHECK (min_investment > 0),
    max_investment DECIMAL(12,2),
    total_investment_needed DECIMAL(12,2) NOT NULL CHECK (total_investment_needed > 0),
    current_investment DECIMAL(12,2) DEFAULT 0.00,
    investor_count INTEGER DEFAULT 0,
    status investment_status DEFAULT 'open',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    expected_completion_date DATE,
    risk_level INTEGER DEFAULT 3 CHECK (risk_level BETWEEN 1 AND 5),
    investment_type VARCHAR(50) DEFAULT 'equity',
    projected_annual_income DECIMAL(12,2),
    projected_capital_appreciation DECIMAL(12,2),
    business_plan TEXT,
    financial_projections JSONB,
    legal_documents JSONB DEFAULT '[]',
    due_diligence_docs JSONB DEFAULT '[]',
    featured BOOLEAN DEFAULT FALSE,
    CHECK (end_date > start_date),
    CHECK (max_investment IS NULL OR max_investment >= min_investment)
);

-- Investments table
CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    opportunity_id UUID NOT NULL REFERENCES investment_opportunities(id) ON DELETE RESTRICT,
    investor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'SAR',
    payment_status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_signed_at TIMESTAMPTZ,
    expected_return_amount DECIMAL(12,2),
    actual_return_amount DECIMAL(12,2),
    return_payments_received DECIMAL(12,2) DEFAULT 0.00,
    investment_percentage DECIMAL(5,2),
    notes TEXT
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(255),
    content TEXT NOT NULL,
    is_guest_review BOOLEAN NOT NULL, -- true if guest reviewing host/property, false if host reviewing guest
    cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    location_rating INTEGER CHECK (location_rating BETWEEN 1 AND 5),
    value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
    accuracy_rating INTEGER CHECK (accuracy_rating BETWEEN 1 AND 5),
    checkin_rating INTEGER CHECK (checkin_rating BETWEEN 1 AND 5),
    response TEXT, -- Host response to guest review
    response_date TIMESTAMPTZ,
    is_public BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    reported_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT TRUE
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    booking_id UUID REFERENCES bookings(id) ON DELETE RESTRICT,
    investment_id UUID REFERENCES investments(id) ON DELETE RESTRICT,
    payer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    recipient_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'SAR',
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50) NOT NULL,
    provider_transaction_id VARCHAR(255),
    provider_fee DECIMAL(10,2) DEFAULT 0.00,
    platform_fee DECIMAL(10,2) DEFAULT 0.00,
    status payment_status DEFAULT 'pending',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    processed_at TIMESTAMPTZ,
    CHECK ((booking_id IS NOT NULL AND investment_id IS NULL) OR (booking_id IS NULL AND investment_id IS NOT NULL))
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    action_url TEXT,
    expires_at TIMESTAMPTZ
);

-- System settings table for admin configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_sensitive BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES users(id)
);

-- Activity logs table for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    search_criteria JSONB NOT NULL,
    email_alerts BOOLEAN DEFAULT FALSE,
    push_alerts BOOLEAN DEFAULT FALSE,
    alert_frequency VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly
    last_alert_sent TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    notes TEXT,
    UNIQUE(user_id, property_id)
);

-- Messages table for communication
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_properties_location ON properties USING GIST (coordinates);
CREATE INDEX idx_properties_city ON properties (city);
CREATE INDEX idx_properties_status ON properties (status);
CREATE INDEX idx_properties_host_id ON properties (host_id);
CREATE INDEX idx_properties_property_type ON properties (property_type);
CREATE INDEX idx_properties_featured ON properties (featured) WHERE featured = true;
CREATE INDEX idx_properties_created_at ON properties (created_at DESC);
CREATE INDEX idx_properties_rating ON properties (rating DESC);
CREATE INDEX idx_properties_price ON properties (base_price);

CREATE INDEX idx_bookings_dates ON bookings (check_in_date, check_out_date);
CREATE INDEX idx_bookings_guest_id ON bookings (guest_id);
CREATE INDEX idx_bookings_property_id ON bookings (property_id);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_created_at ON bookings (created_at DESC);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_active ON users (is_active) WHERE is_active = true;

CREATE INDEX idx_reviews_property_id ON reviews (property_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews (reviewer_id);
CREATE INDEX idx_reviews_rating ON reviews (rating);
CREATE INDEX idx_reviews_created_at ON reviews (created_at DESC);

CREATE INDEX idx_property_images_property_id ON property_images (property_id);
CREATE INDEX idx_property_images_primary ON property_images (is_primary) WHERE is_primary = true;

CREATE INDEX idx_investments_opportunity_id ON investments (opportunity_id);
CREATE INDEX idx_investments_investor_id ON investments (investor_id);
CREATE INDEX idx_investments_status ON investments (payment_status);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_read ON notifications (read) WHERE read = false;
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);

CREATE INDEX idx_activity_logs_user_id ON activity_logs (user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs (action);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hosts_updated_at BEFORE UPDATE ON hosts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_plans_updated_at BEFORE UPDATE ON pricing_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_opportunities_updated_at BEFORE UPDATE ON investment_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_searches_updated_at BEFORE UPDATE ON saved_searches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate confirmation codes
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.confirmation_code = UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_booking_confirmation_code 
    BEFORE INSERT ON bookings 
    FOR EACH ROW 
    WHEN (NEW.confirmation_code IS NULL)
    EXECUTE FUNCTION generate_confirmation_code();

-- Insert default amenities
INSERT INTO amenities (name, icon, category, display_order) VALUES
('WiFi', 'wifi', 'connectivity', 1),
('Air Conditioning', 'snowflake', 'comfort', 2),
('Kitchen', 'chef-hat', 'facilities', 3),
('Pool', 'waves', 'recreation', 4),
('Parking', 'car', 'convenience', 5),
('Gym Access', 'dumbbell', 'recreation', 6),
('Beach Access', 'umbrella-beach', 'location', 7),
('Balcony', 'balcony', 'views', 8),
('Washer/Dryer', 'washing-machine', 'facilities', 9),
('TV', 'tv', 'entertainment', 10),
('Hot Tub', 'hot-tub', 'luxury', 11),
('Garden', 'trees', 'outdoor', 12),
('BBQ Grill', 'grill', 'outdoor', 13),
('Security', 'shield-check', 'safety', 14),
('Elevator', 'elevator', 'accessibility', 15),
('Pet Friendly', 'dog', 'policies', 16),
('Smoking Allowed', 'cigarette', 'policies', 17),
('Breakfast Included', 'coffee', 'services', 18),
('Concierge', 'bell-hop', 'services', 19),
('Room Service', 'room-service', 'services', 20);

-- Insert default system settings
INSERT INTO system_settings (key, value, description, category) VALUES
('platform_commission_rate', '"15.0"', 'Default commission rate for the platform (%)', 'financial'),
('service_fee_rate', '"3.0"', 'Service fee rate for bookings (%)', 'financial'),
('tax_rate', '"15.0"', 'Default tax rate (%)', 'financial'),
('currency', '"SAR"', 'Default platform currency', 'general'),
('supported_currencies', '["SAR", "USD", "EUR"]', 'List of supported currencies', 'financial'),
('max_booking_days', '"365"', 'Maximum days for a single booking', 'booking'),
('min_booking_days', '"1"', 'Minimum days for a booking', 'booking'),
('booking_lead_time_hours', '"24"', 'Minimum hours before check-in to book', 'booking'),
('cancellation_fee_rate', '"10.0"', 'Cancellation fee rate (%)', 'financial'),
('admin_email', '"admin@habibstay.com"', 'Admin email address', 'general'),
('platform_name', '"HabibStay"', 'Platform name', 'general'),
('support_phone', '"+966-XX-XXX-XXXX"', 'Support phone number', 'general'),
('privacy_policy_url', '"https://habibstay.com/privacy"', 'Privacy policy URL', 'legal'),
('terms_of_service_url', '"https://habibstay.com/terms"', 'Terms of service URL', 'legal'),
('ai_chat_enabled', 'true', 'Enable AI chat functionality', 'features'),
('investment_feature_enabled', 'true', 'Enable investment opportunities', 'features'),
('email_notifications_enabled', 'true', 'Enable email notifications', 'notifications'),
('sms_notifications_enabled', 'true', 'Enable SMS notifications', 'notifications');

-- Create super admin user (to be updated with actual credentials)
-- Note: This will need to be coordinated with Supabase auth
INSERT INTO users (id, email, full_name, role, is_verified, is_active) VALUES
('00000000-0000-0000-0000-000000000000', 'superadmin@habibstay.com', 'Super Administrator', 'super_admin', true, true)
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    is_verified = true,
    is_active = true;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Properties policies
CREATE POLICY "Anyone can view active properties" ON properties FOR SELECT USING (status = 'active');
CREATE POLICY "Hosts can manage their own properties" ON properties FOR ALL USING (
    host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage all properties" ON properties FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT USING (
    guest_id = auth.uid() OR 
    host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
);
CREATE POLICY "Guests can create bookings" ON bookings FOR INSERT WITH CHECK (guest_id = auth.uid());
CREATE POLICY "Hosts and guests can update their bookings" ON bookings FOR UPDATE USING (
    guest_id = auth.uid() OR 
    host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
);

-- System settings policies
CREATE POLICY "Only super admins can manage system settings" ON system_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Admins can view non-sensitive settings" ON system_settings FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')) OR
    is_sensitive = false
);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Create views for common queries
CREATE OR REPLACE VIEW property_summary AS
SELECT 
    p.*,
    h.user_id as host_user_id,
    h.name as host_name,
    h.rating as host_rating,
    h.verified as host_verified,
    h.response_rate as host_response_rate,
    COUNT(DISTINCT r.id) as total_reviews,
    AVG(r.rating) as average_rating,
    COUNT(DISTINCT b.id) as total_bookings,
    array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) as amenity_names,
    (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = true LIMIT 1) as primary_image_url
FROM properties p
LEFT JOIN hosts h ON p.host_id = h.id
LEFT JOIN reviews r ON p.id = r.property_id AND r.is_public = true
LEFT JOIN bookings b ON p.id = b.property_id AND b.status = 'completed'
LEFT JOIN property_amenities pa ON p.id = pa.property_id
LEFT JOIN amenities a ON pa.amenity_id = a.id
GROUP BY p.id, h.user_id, h.name, h.rating, h.verified, h.response_rate;

-- Create function to calculate booking totals
CREATE OR REPLACE FUNCTION calculate_booking_total(
    property_id UUID,
    check_in_date DATE,
    check_out_date DATE,
    guests_count INTEGER
) RETURNS TABLE (
    base_amount DECIMAL(10,2),
    cleaning_fee DECIMAL(10,2),
    service_fee DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2)
) AS $$
DECLARE
    nights INTEGER;
    daily_rate DECIMAL(10,2);
    service_rate DECIMAL(5,2);
    tax_rate DECIMAL(5,2);
    base_calc DECIMAL(10,2);
    cleaning_calc DECIMAL(10,2);
    service_calc DECIMAL(10,2);
    tax_calc DECIMAL(10,2);
BEGIN
    nights := check_out_date - check_in_date;
    
    -- Get property daily rate
    SELECT base_price INTO daily_rate FROM properties WHERE id = property_id;
    
    -- Get system rates
    SELECT value::text::decimal INTO service_rate FROM system_settings WHERE key = 'service_fee_rate';
    SELECT value::text::decimal INTO tax_rate FROM system_settings WHERE key = 'tax_rate';
    
    -- Calculate amounts
    base_calc := daily_rate * nights;
    cleaning_calc := CASE WHEN guests_count > 4 THEN 100.00 ELSE 50.00 END; -- Example logic
    service_calc := base_calc * (service_rate / 100);
    tax_calc := (base_calc + cleaning_calc + service_calc) * (tax_rate / 100);
    
    RETURN QUERY SELECT 
        base_calc,
        cleaning_calc,
        service_calc,
        tax_calc,
        base_calc + cleaning_calc + service_calc + tax_calc;
END;
$$ LANGUAGE plpgsql;

-- Create function to check property availability
CREATE OR REPLACE FUNCTION check_property_availability(
    property_id UUID,
    check_in_date DATE,
    check_out_date DATE
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM bookings 
        WHERE 
            property_id = check_property_availability.property_id 
            AND status IN ('confirmed', 'pending')
            AND NOT (
                check_out_date <= bookings.check_in_date OR 
                check_in_date >= bookings.check_out_date
            )
    );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create storage buckets for images (these would be created in Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-avatars', 'user-avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

COMMIT;