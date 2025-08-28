# HabibStay Deployment Guide

## 🚀 Complete Deployment Instructions

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account
- Vercel account
- Domain name (optional)

## 📋 Step-by-Step Deployment

### 1. Supabase Setup

#### Create Supabase Project
1. Go to [Supabase](https://supabase.com)
2. Create new project
3. Note down:
   - Project URL
   - Anon Key
   - Service Role Key
   - Project ID

#### Database Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Run migrations
supabase db push database/schema.sql

# Or run directly in SQL editor:
# Copy contents of database/schema.sql and run in Supabase SQL editor
```

#### Enable Authentication Providers
1. Go to Authentication > Providers
2. Enable:
   - Email/Password
   - Google OAuth (optional)
   - Facebook OAuth (optional)

#### Storage Buckets
Create the following buckets in Storage:
- `avatars` (public)
- `property-images` (public)
- `documents` (private)

### 2. Environment Variables Setup

#### Local Development
```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local with your values
```

#### Required Environment Variables
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxx

# AI (OpenAI)
OPENAI_API_KEY=sk-xxxxx
```

### 3. Super Admin Setup

#### Create Super Admin User
1. Run the application locally
2. Sign up with email: `admin@habibstay.com`
3. Run this SQL in Supabase:
```sql
UPDATE public.users 
SET 
  role = 'super_admin',
  status = 'active',
  email_verified = true,
  phone_verified = true,
  kyc_verified = true
WHERE email = 'admin@habibstay.com';
```

### 4. Vercel Deployment

#### Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts to:
# - Link to your Vercel account
# - Set up project
# - Configure environment variables
```

#### Or use Vercel Dashboard:
1. Import GitHub repository
2. Configure build settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add environment variables from `.env.example`

#### Environment Variables in Vercel
Add all variables from `.env.example` in:
- Settings > Environment Variables
- Add for Production, Preview, and Development

### 5. Domain Configuration

#### Custom Domain
1. Go to Vercel Dashboard > Settings > Domains
2. Add your domain
3. Configure DNS:
   - A Record: 76.76.21.21
   - CNAME: cname.vercel-dns.com

#### SSL Certificate
- Automatically provisioned by Vercel

### 6. Post-Deployment Configuration

#### Configure System Settings
1. Login as super admin
2. Go to `/admin`
3. Navigate to System Configuration
4. Configure:
   - Site settings
   - Payment gateways
   - Email settings
   - AI settings
   - Booking policies

#### Test Critical Flows
1. **User Registration**
   ```
   - Sign up as new user
   - Verify email
   - Complete profile
   ```

2. **Property Listing**
   ```
   - Create property listing
   - Upload images
   - Set availability
   - Publish property
   ```

3. **Booking Flow**
   ```
   - Search properties
   - Select dates
   - Make booking
   - Process payment
   ```

4. **Admin Functions**
   ```
   - View dashboard
   - Manage users
   - Approve properties
   - Handle bookings
   ```

### 7. Monitoring & Maintenance

#### Setup Monitoring
1. **Sentry** (Error tracking)
   ```bash
   npm install @sentry/react
   ```
   Configure in main.tsx with your DSN

2. **Google Analytics**
   - Add GA4 measurement ID to env
   - Verify tracking in GA dashboard

3. **Uptime Monitoring**
   - Use Vercel Analytics
   - Or setup UptimeRobot/Pingdom

#### Database Backups
1. Enable automatic backups in Supabase
2. Settings > Database > Backups
3. Configure retention period

#### Regular Maintenance
- Monitor error logs weekly
- Review performance metrics
- Update dependencies monthly
- Test critical paths after updates

## 🔧 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### Database Connection Issues
- Verify Supabase URL and keys
- Check Row Level Security policies
- Ensure migrations ran successfully

#### Payment Integration
- Verify Stripe keys (test vs live)
- Check webhook configuration
- Test with Stripe CLI locally

#### Email Not Sending
- Verify SendGrid API key
- Check from email is verified
- Review email templates

## 📱 Mobile App Deployment (Optional)

### PWA Configuration
The app is PWA-ready. To enable:
1. Uncomment PWA plugin in `vite.config.ts`
2. Configure `manifest.json`
3. Add app icons in public folder

### Native App Wrapper
Use Capacitor for native apps:
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
npx cap sync
```

## 🔐 Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (React handles this)
- [ ] CSRF tokens implemented
- [ ] Regular security audits
- [ ] Dependency updates
- [ ] Backup strategy in place

## 📊 Performance Optimization

### Frontend
- [ ] Code splitting implemented
- [ ] Images optimized (WebP format)
- [ ] Lazy loading for images
- [ ] Bundle size < 200KB initial
- [ ] Service worker for caching

### Backend
- [ ] Database indexes created
- [ ] Query optimization done
- [ ] Caching strategy (Redis optional)
- [ ] CDN for static assets

## 🚦 Launch Checklist

### Pre-Launch
- [ ] All environment variables set
- [ ] Database migrations complete
- [ ] Super admin account created
- [ ] Payment gateway tested
- [ ] Email service verified
- [ ] Mobile responsiveness checked
- [ ] Cross-browser testing done
- [ ] Load testing performed
- [ ] Security audit completed
- [ ] Legal pages added (Terms, Privacy)
- [ ] SEO meta tags configured
- [ ] Sitemap generated
- [ ] Analytics configured

### Launch Day
- [ ] DNS propagated
- [ ] SSL certificate active
- [ ] Monitoring active
- [ ] Support email ready
- [ ] Team briefed
- [ ] Announcement prepared

### Post-Launch
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Fix critical bugs immediately
- [ ] Plan iteration schedule

## 📞 Support

For deployment support:
- Email: support@habibstay.com
- Documentation: /docs
- Admin Panel: /admin

## 🔄 Continuous Deployment

### GitHub Actions Setup
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
```

## 🎉 Congratulations!

Your HabibStay platform is now deployed and ready for production use. Monitor the application closely during the first few days and be ready to respond to any issues that arise.