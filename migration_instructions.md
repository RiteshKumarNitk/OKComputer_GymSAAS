# Migration Instructions: Vite + Supabase to Next.js + Prisma

This document details the migration process from Supabase to a custom Prisma + NextAuth + PostgreSQL stack.

## 1. Database Setup
- **Prisma Initialized**: The `prisma/schema.prisma` file contains all models for the multi-tenant SaaS Gym System.
- **Client Configuration**: A singleton Prisma client is available at `/lib/prisma.ts`.
- **Action Required**: Run `npx prisma migrate dev` locally to sync the schema to your PostgreSQL database.
- **Tenant Context**: All models include `tenantId`, ensure this is passed to every query to maintain isolation.

## 2. Authentication (NextAuth)
- **Status**: Supabase Auth has been replaced with **NextAuth (Next.js standard auth)**.
- **Credentials Provider**: Supports email/password login.
- **JWT & Session**: The `tenantId` and `role` are automatically attached to the session object for use in API routes and server components.
- **Password Hashing**: Uses `bcrypt` - ensure all existing users' passwords in the database are hashed before deployment.

## 3. API Routes
- **Status**: New API routes created at `/api/...` to replace direct Supabase client calls.
- **Example**: See `src/app/api/members/route.ts` for a multi-tenant compliant GET/POST implementation.
- **Refactoring Tip**: Replace `supabase.from('table').select(...)` with `prisma.table.findMany(...)` inside these routes.

## 4. Environment Variables
Ensure these are set in your `.env` or production environment:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `NEXTAUTH_SECRET`: A secure random string for JWT hashing.
- `NEXTAUTH_URL`: The base URL of your application (e.g., `http://localhost:3000`).

## 5. UI Changes (Vite to Next.js)
- **Framework**: Moved from Vite to Next.js.
- **Provider**: Wrap your application Root Layout in `<SessionProvider>` from `next-auth/react`.
- **Routing**: Update `react-router-dom` links to use `next/link`.
- **Data Hook**: Use `useSession()` to access current user info instead of `useAuth()`.
