# HabibStay - Premium Property Rental & Investment Platform

![HabibStay Logo](https://via.placeholder.com/400x100/1E40AF/FFFFFF?text=HabibStay)

A modern, full-stack property rental and investment platform built for the Saudi Arabian market. HabibStay combines the convenience of short-term rentals with innovative real estate investment opportunities.

## 🌟 Features

### 🏠 Property Management
- **Complete Property Listings**: Detailed property information with high-quality images
- **Smart Search & Filters**: Advanced filtering by location, price, amenities, and more
- **Real-time Availability**: Dynamic booking system with availability checking
- **Multi-currency Support**: SAR, USD, EUR with real-time conversion

### 👥 User Management
- **Role-based Access Control**: Guest, Host, Investor, Admin, Super Admin roles
- **Secure Authentication**: Email verification, password reset, social login
- **User Profiles**: Comprehensive user profiles with verification systems
- **Host Dashboard**: Property management, booking analytics, revenue tracking

### 💼 Investment Platform
- **Investment Opportunities**: Real estate investment with projected returns
- **Portfolio Management**: Track investments, returns, and performance
- **Due Diligence**: Document management and investment analytics
- **Secure Transactions**: Integrated payment processing with escrow

### 🤖 AI-Powered Assistant
- **Sara AI Chat**: Intelligent property recommendations and booking assistance
- **Natural Language Search**: Find properties using conversational queries
- **Personalized Suggestions**: ML-powered property recommendations
- **Multi-language Support**: Arabic and English support

### 📱 Mobile-First Design
- **Responsive Design**: Optimized for all screen sizes
- **Touch-friendly Interface**: Large touch targets and smooth animations
- **Progressive Web App**: Offline support and app-like experience
- **Fast Loading**: Optimized images and lazy loading

### 🔧 Admin Panel
- **Comprehensive Dashboard**: Real-time analytics and system monitoring
- **User Management**: User roles, verification, and account management
- **Property Approval**: Content moderation and quality control
- **System Configuration**: Dynamic settings and feature flags

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for modern styling
- **Radix UI** for accessible components
- **Framer Motion** for smooth animations
- **React Router** for navigation
- **Zod** for schema validation

### Backend & Database
- **Supabase** for backend-as-a-service
- **PostgreSQL** with advanced features
- **Row Level Security (RLS)** for data protection
- **Real-time subscriptions** for live updates
- **Edge Functions** for serverless compute

### Infrastructure
- **Vercel** for deployment and hosting
- **Vercel Edge Network** for global CDN
- **Automatic SSL** and security headers
- **Preview deployments** for testing

### Integrations
- **OpenAI GPT** for AI chat functionality
- **Mapbox** for location services and maps
- **Stripe** for payment processing
- **SendGrid** for email notifications
- **Twilio** for SMS notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/habibstay.git
   cd habibstay
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Set up the database**
   ```sql
   -- Run the schema.sql file in your Supabase SQL editor
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📦 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── PropertyCard.tsx
│   ├── PropertyGrid.tsx
│   ├── Header.tsx
│   └── ErrorBoundary.tsx
├── pages/              # Route components
│   ├── admin.tsx       # Admin dashboard
│   ├── about.tsx
│   └── ...
├── lib/                # Utilities and services
│   ├── api.ts          # API functions
│   ├── auth.ts         # Authentication service
│   ├── supabase.ts     # Supabase client
│   ├── validation.ts   # Zod schemas
│   ├── error-handler.ts # Error handling
│   └── services/       # Service modules
├── types/              # TypeScript type definitions
│   ├── database.ts     # Database types
│   └── index.ts        # Exports
├── hooks/              # Custom React hooks
└── stories/            # Storybook stories
```

## 🔐 Authentication & Authorization

### User Roles
- **Guest**: Browse and book properties
- **Host**: Manage properties and bookings
- **Investor**: Access investment opportunities
- **Admin**: Platform administration
- **Super Admin**: Full system access

### Security Features
- JWT-based authentication
- Row Level Security (RLS)
- Rate limiting
- CSRF protection
- XSS prevention
- SQL injection protection

## 🏗 Database Schema

The application uses a comprehensive PostgreSQL schema with:

- **Users & Authentication**: User profiles, roles, verification
- **Properties**: Listings, images, amenities, pricing
- **Bookings**: Reservations, payments, reviews
- **Investments**: Opportunities, transactions, returns
- **System**: Settings, logs, notifications

See `schema.sql` for the complete database structure.

## 🎨 UI/UX Design

### Design System
- **Color Palette**: Professional blues and grays with accent colors
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent 8px grid system
- **Components**: Accessible, reusable components
- **Animations**: Subtle, purposeful motion design

### Mobile Optimization
- Touch-friendly interface (44px minimum touch targets)
- Responsive grid system
- Optimized images with lazy loading
- Smooth scrolling and gestures
- Fast loading with skeleton screens

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 📈 Performance

### Optimization Features
- Code splitting and lazy loading
- Image optimization and WebP support
- Service worker for caching
- Bundle size optimization
- Database query optimization
- CDN for static assets

### Monitoring
- Real-time performance monitoring
- Error tracking and reporting
- User analytics and insights
- Database performance metrics

## 🌍 Deployment

### Automatic Deployment
Every push to `main` triggers automatic deployment to production.

### Manual Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Environment Variables
Set the following variables in Vercel:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_OPENAI_API_KEY=your_openai_key
STRIPE_PUBLISHABLE_KEY=your_stripe_key
# ... see .env.example for complete list
```

## 🔧 Configuration

### Feature Flags
- AI Chat: `ENABLE_AI_CHAT=true`
- Investments: `ENABLE_INVESTMENT_FEATURE=true`
- Analytics: `ENABLE_ANALYTICS=true`
- Notifications: `ENABLE_EMAIL_NOTIFICATIONS=true`

### System Settings
Configure platform settings through the admin panel:
- Commission rates
- Service fees
- Tax rates
- Currency settings
- Email templates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write comprehensive tests
- Update documentation for new features
- Follow semantic versioning

## 📝 API Documentation

### Authentication
```typescript
// Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "password"
}

// Register
POST /auth/register
{
  "email": "user@example.com",
  "password": "password",
  "full_name": "John Doe"
}
```

### Properties
```typescript
// Search properties
GET /api/properties?city=Riyadh&bedrooms=2&max_price=1000

// Get property details
GET /api/properties/:id

// Create property (hosts only)
POST /api/properties
```

### Bookings
```typescript
// Create booking
POST /api/bookings
{
  "property_id": "uuid",
  "check_in_date": "2024-06-01",
  "check_out_date": "2024-06-05",
  "guests_count": 2
}

// Get user bookings
GET /api/bookings?user_id=uuid
```

## 🔒 Security

### Security Measures
- HTTPS everywhere
- Content Security Policy (CSP)
- Rate limiting
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

### Data Privacy
- GDPR compliance
- Data encryption at rest and in transit
- Personal data anonymization
- Right to deletion
- Data export capabilities

## 📊 Analytics

### User Analytics
- Page views and user sessions
- Conversion tracking
- User flow analysis
- Feature usage statistics

### Business Analytics
- Revenue tracking
- Booking conversion rates
- Investment performance
- Property performance metrics

## 📞 Support

### Documentation
- [API Documentation](docs/api.md)
- [Deployment Guide](deployment-guide.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

### Contact
- **Website**: https://habibstay.com
- **Email**: support@habibstay.com
- **Discord**: [HabibStay Community](https://discord.gg/habibstay)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the amazing backend platform
- [Vercel](https://vercel.com) for seamless deployment
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Radix UI](https://radix-ui.com) for accessible components
- [OpenAI](https://openai.com) for AI capabilities

---

Built with ❤️ for the Saudi Arabian property market

**HabibStay** - Where Hospitality Meets Investment