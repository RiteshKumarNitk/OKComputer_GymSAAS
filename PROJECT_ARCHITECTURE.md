# Gym Management SaaS - Project Architecture

## Overview
A production-ready multi-tenant Gym Management SaaS application built with React, Vite, Tailwind CSS, and Supabase.

## Tech Stack
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query (TanStack Query) + Zod
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime)
- **Authentication**: Supabase Auth with JWT custom claims
- **Payments**: Stripe integration
- **Deployment**: Vercel (frontend) + Supabase (backend)

## Multi-Tenant Architecture
- **Row-Level Security**: All tenant-scoped tables include `tenant_id` foreign key
- **RLS Policies**: Enforce tenant isolation based on user claims
- **Role-Based Access**: Super Admin, Gym Owner, Manager, Trainer, Frontdesk, Member
- **Custom JWT Claims**: Include `role` and `tenant_id` for efficient policy enforcement

## Database Schema
- **Core Tables**: tenants, users_profile, members, memberships, payments, attendance, trainers, trainer_slots, workouts, diet_plans
- **Security**: Comprehensive RLS policies for all tenant-scoped tables
- **Indexes**: Optimized for multi-tenant queries and performance

## Frontend Structure
```
src/
├── api/           # Supabase client wrappers
├── components/    # UI primitives and widgets
├── features/      # Feature modules (auth, members, etc.)
├── layouts/       # Dashboard and auth layouts
├── pages/         # Route components
├── hooks/         # Custom React hooks
└── utils/         # Utilities and helpers
```

## Key Features
1. **Multi-tenant isolation** with secure data separation
2. **Role-based dashboards** for different user types
3. **Member management** with membership tracking
4. **QR code attendance** system
5. **Trainer scheduling** and booking
6. **Payment processing** with Stripe
7. **Workout and diet plan** management
8. **Analytics dashboards** with charts and reports
9. **Export functionality** for data
10. **Real-time updates** using Supabase Realtime

## Security
- Row-Level Security (RLS) policies on all tables
- JWT-based authentication with custom claims
- Role-based access control
- Secure payment processing
- Audit logging for critical actions

## Performance
- React Query for efficient data fetching
- Optimistic updates for better UX
- Proper indexing for multi-tenant queries
- Lazy loading and code splitting
- Image optimization and caching