# GymPro - Multi-Tenant Gym Management SaaS

A comprehensive, production-ready multi-tenant gym management system built with React, Vite, Tailwind CSS, and Supabase.

## Features

### Core Features
- **Multi-tenant Architecture**: Complete data isolation between gyms
- **Role-Based Access Control**: Super Admin, Gym Owner, Manager, Trainer, Frontdesk, Member
- **Member Management**: CRUD operations, membership tracking, status management
- **Attendance System**: QR code-based check-in/check-out
- **Trainer Scheduling**: Booking system with availability management
- **Billing & Payments**: Stripe integration for payment processing
- **Workout Plans**: Create and assign custom workout routines
- **Diet Plans**: Nutrition planning and assignment
- **Analytics Dashboard**: Revenue tracking, attendance analytics, member insights
- **Data Export**: CSV export for reports and analysis

### Technical Features
- **Modern Tech Stack**: React 18 + Vite + TypeScript + Tailwind CSS
- **Real-time Updates**: Supabase Realtime for live data synchronization
- **Responsive Design**: Mobile-first approach with shadcn/ui components
- **Performance**: React Query for efficient data fetching and caching
- **Security**: Row-Level Security (RLS) policies in PostgreSQL
- **Scalability**: Optimized for multi-tenant SaaS deployment

## Tech Stack

### Frontend
- **React 18** - UI Library
- **Vite** - Build Tool
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component Library
- **React Query** - Data Fetching
- **React Router** - Routing
- **React Hook Form** - Form Management
- **Zod** - Schema Validation

### Backend
- **Supabase** - Backend as a Service
  - **PostgreSQL** - Database
  - **Auth** - Authentication
  - **Storage** - File Storage
  - **Realtime** - Real-time Subscriptions
- **Stripe** - Payment Processing

### Development
- **ESLint** - Code Linting
- **Vitest** - Testing Framework
- **GitHub Actions** - CI/CD

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gym-management-saas
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your Supabase and Stripe credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the schema SQL files in order:
     - `supabase_schema.sql` - Database schema and RLS policies
     - `supabase_seed.sql` - Sample data (optional)
   - Configure authentication settings
   - Set up storage buckets for file uploads

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

### Default Login Credentials

After running the seed script, you can use these default credentials:

**Super Admin Account:**
- Email: `admin@gympro.com`
- Password: `admin123`

**Sample Gym Owners:**
- FitLife Premium: `owner@fitlife.com` / `owner123`
- PowerHouse Fitness: `owner@powerhouse.com` / `owner123`

## Project Structure

```
src/
├── api/                 # API client and Supabase configuration
├── assets/              # Static assets
├── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── charts/          # Chart components
│   └── widgets/         # Complex UI widgets
├── features/            # Feature modules
│   ├── auth/            # Authentication logic
│   ├── members/         # Member management
│   ├── trainers/        # Trainer management
│   ├── attendance/      # Attendance system
│   ├── billing/         # Billing and payments
│   └── workouts/        # Workout plans
├── layouts/             # Page layouts
├── pages/               # Page components
│   ├── app/             # Protected pages
│   └── auth/            # Public pages
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and helpers
├── routes/              # Route configuration
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Database Schema

The application uses a multi-tenant database schema with Row-Level Security (RLS) policies:

### Core Tables
- `tenants` - Gym/tenant information
- `users_profile` - User profiles and roles
- `members` - Member information
- `memberships` - Membership plans
- `trainers` - Trainer information
- `attendance` - Attendance records
- `payments` - Payment transactions
- `workouts` - Workout plans
- `diet_plans` - Nutrition plans

### Security Features
- Multi-tenant isolation via `tenant_id`
- Role-based access control
- RLS policies for data protection
- JWT-based authentication

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy with automatic CI/CD

### Manual Deployment
```bash
npm run build
```
The built files will be in the `dist` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Roadmap

### Phase 1 (Completed)
- ✅ Basic multi-tenant architecture
- ✅ Authentication and authorization
- ✅ Member management
- ✅ Dashboard with analytics
- ✅ Core UI components

### Phase 2 (In Progress)
- 🔄 QR code attendance system
- 🔄 Trainer scheduling
- 🔄 Payment integration
- 🔄 Workout plan management

### Phase 3 (Planned)
- 📋 Mobile app (React Native)
- 📋 Advanced analytics
- 📋 API integrations
- 📋 White-label customization

### Phase 4 (Future)
- 📋 AI-powered insights
- 📋 IoT device integration
- 📋 Advanced reporting
- 📋 Multi-language support