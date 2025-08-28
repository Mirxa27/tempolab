# HabibStay Deployment Guide

## Prerequisites

Before deploying HabibStay, ensure you have:

1. **Supabase Project**: Set up your Supabase project with the provided schema
2. **Vercel Account**: For frontend deployment
3. **Domain**: Configure your domain (habibstay.com)
4. **Third-party Services**: API keys for OpenAI, Mapbox, Stripe, etc.

## Step 1: Database Setup

### 1.1 Create Supabase Project
1. Go to [Supabase](https://supabase.com) and create a new project
2. Note down your project URL and anon key
3. Navigate to SQL Editor in your Supabase dashboard

### 1.2 Run Database Schema
```sql
-- Copy and paste the contents of schema.sql into the SQL editor
-- This will create all tables, functions, and initial data
```

### 1.3 Set up Storage Buckets
1. Go to Storage in your Supabase dashboard
2. Create the following buckets:
   - `property-images` (public)
   - `user-avatars` (public)
   - `documents` (private)

### 1.4 Configure Authentication
1. Go to Authentication → Settings
2. Enable email confirmations
3. Configure email templates
4. Set up social providers if needed (Google, Facebook)

## Step 2: Environment Configuration

### 2.1 Local Development
```bash
# Copy environment template
cp .env.example .env.local

# Fill in your environment variables
# Minimum required for local development:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2.2 Production Environment
Set the following environment variables in Vercel:

#### Essential Variables
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PROJECT_ID=your_project_id
```

#### Optional Features
```
VITE_OPENAI_API_KEY=your_openai_key (for AI chat)
VITE_MAPBOX_API_KEY=your_mapbox_key (for location autocomplete)
STRIPE_PUBLISHABLE_KEY=your_stripe_key (for payments)
SENDGRID_API_KEY=your_sendgrid_key (for emails)
```

## Step 3: Vercel Deployment

### 3.1 Connect Repository
1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Select "Other" framework (Vite is auto-detected)

### 3.2 Configure Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.3 Environment Variables
Add all environment variables from `.env.example` to Vercel:
1. Go to Project Settings → Environment Variables
2. Add each variable with appropriate values

### 3.4 Domain Configuration
1. Go to Project Settings → Domains
2. Add your custom domain: `habibstay.com`
3. Configure DNS records as instructed by Vercel

## Step 4: Post-Deployment Setup

### 4.1 Create Super Admin Account
```sql
-- Run this in Supabase SQL Editor to create your super admin
-- Replace with your actual credentials
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('admin@habibstay.com', crypt('your_secure_password', gen_salt('bf')), NOW(), NOW(), NOW());

-- Get the user ID and create the profile
INSERT INTO users (id, email, full_name, role, is_verified, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@habibstay.com'),
  'admin@habibstay.com',
  'Super Administrator',
  'super_admin',
  true,
  true
);
```

### 4.2 Initial System Configuration
1. Access the admin panel: `https://habibstay.com/admin`
2. Log in with your super admin credentials
3. Review and update system settings
4. Configure payment gateways, email templates, etc.

### 4.3 Sample Data (Optional)
```sql
-- Add some sample amenities, properties, etc.
-- This can be done through the admin panel or SQL
```

## Step 5: Third-Party Integrations

### 5.1 Payment Gateway (Stripe)
1. Create Stripe account
2. Get API keys (publishable and secret)
3. Configure webhooks for payment events
4. Test payments in sandbox mode

### 5.2 Email Service (SendGrid)
1. Create SendGrid account
2. Get API key
3. Configure sender authentication
4. Set up email templates

### 5.3 SMS Service (Twilio)
1. Create Twilio account
2. Get Account SID and Auth Token
3. Purchase phone number
4. Configure SMS templates

### 5.4 AI Chat (OpenAI)
1. Create OpenAI account
2. Get API key
3. Test AI responses
4. Configure usage limits

## Step 6: Security and Performance

### 6.1 Security Headers
Vercel automatically sets security headers from `vercel.json`

### 6.2 CORS Configuration
Configure allowed origins in environment variables

### 6.3 Rate Limiting
Implement rate limiting for API endpoints

### 6.4 SSL/TLS
Vercel automatically provides SSL certificates

## Step 7: Monitoring and Analytics

### 7.1 Supabase Analytics
Monitor database performance and usage

### 7.2 Vercel Analytics
Monitor website performance and usage

### 7.3 Error Tracking
Set up error tracking service (Sentry, LogRocket)

### 7.4 Uptime Monitoring
Set up uptime monitoring (UptimeRobot, Pingdom)

## Step 8: Content Management

### 8.1 Property Management
- Upload property images to Supabase Storage
- Configure pricing plans
- Set up amenities

### 8.2 User Management
- Configure user roles and permissions
- Set up email verification flows
- Configure password policies

## Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database schema deployed
- [ ] Storage buckets created
- [ ] Environment variables configured
- [ ] Vercel project deployed
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Super admin account created
- [ ] System settings configured
- [ ] Payment gateway integrated
- [ ] Email service configured
- [ ] SMS service configured (optional)
- [ ] AI chat configured (optional)
- [ ] Analytics configured
- [ ] Error tracking configured
- [ ] Uptime monitoring configured
- [ ] Sample data added (optional)
- [ ] Testing completed

## Maintenance

### Regular Tasks
- Monitor database performance
- Update dependencies
- Review system logs
- Backup database
- Monitor costs and usage

### Updates
- Test updates in staging environment
- Deploy during low-traffic periods
- Monitor post-deployment

## Troubleshooting

### Common Issues
1. **Environment Variables**: Ensure all required variables are set
2. **Database Permissions**: Check RLS policies
3. **CORS Errors**: Verify allowed origins
4. **Build Failures**: Check Node.js version compatibility
5. **API Errors**: Verify third-party service configurations

### Support
- Check Supabase documentation
- Review Vercel deployment logs
- Contact support if needed

## Performance Optimization

### Frontend
- Enable Vercel Edge Network
- Optimize images
- Implement code splitting
- Use React.lazy for route-based splitting

### Backend
- Optimize database queries
- Implement caching strategies
- Use database indexes effectively
- Monitor query performance

### SEO
- Configure meta tags
- Implement structured data
- Set up sitemap
- Configure robots.txt