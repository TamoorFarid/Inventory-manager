# SunPulse Inventory

Production-style multi-company inventory management SaaS built with React, Vite, Tailwind CSS, shadcn/ui patterns, Supabase, React Hook Form, Zod, Recharts, Framer Motion, and Lucide icons.

## Highlights

- Email/password auth with Supabase Auth
- Role-based access for `admin` and `member`
- Multi-company scoping with Row Level Security
- Company management and member assignment
- Inventory CRUD with search, filters, sorting, pagination, and table/card toggle
- Atomic sales recording through a PostgreSQL RPC function
- Realtime notifications with Supabase Realtime
- Dashboard metrics, sales charts, and recent activity
- Audit-friendly fields including `updated_by`, `deleted_by`, and soft deletes

## Default Admin

- Email: `admin@sunpulse.com`
- Password: `Admin@123`

The default admin is created by the seed script after the migration is applied.

## Stack

- Frontend: React 19 + Vite + TypeScript
- UI: Tailwind CSS + shadcn/ui-style components + Framer Motion
- Routing: React Router
- Forms: React Hook Form + Zod
- State: React Context + Zustand
- Backend: Supabase Auth, Postgres, Realtime, Edge Functions
- Charts: Recharts

## Project Structure

```text
src/
  components/
  contexts/
  hooks/
  layouts/
  lib/
  pages/
  services/
  store/
  types/

supabase/
  functions/
    create-member/
  migrations/

scripts/
  seed-admin.mjs
```

## Where Supabase Credentials Go

### Frontend credentials

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

These are used by the React app in [`src/lib/env.ts`](/Users/boltechsolution/Documents/untitled%20folder/src/lib/env.ts:1).

### Seed script credentials

The admin seed script uses:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can load them in your shell or use Node’s `--env-file` support.

### Edge function secrets

Set these in Supabase Edge Function secrets before deploying `create-member`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your frontend env file

Copy `.env.example` to `.env.local` and add your Supabase values.

### 3. Run the SQL migration in Supabase

Run the migration from:

[`supabase/migrations/20260512190000_inventory_management.sql`](/Users/boltechsolution/Documents/untitled%20folder/supabase/migrations/20260512190000_inventory_management.sql:1)

You can paste it into the Supabase SQL editor or apply it with the Supabase CLI.

This migration creates:

- `profiles`
- `companies`
- `company_members`
- `inventory_items`
- `sales`
- `notifications`
- `notification_reads`
- `activity_logs`
- helper functions for access control
- the `record_sale(...)` RPC for atomic sale creation
- RLS policies
- activity logging triggers
- realtime publication for `notifications`

### 4. Deploy the edge function

Deploy:

[`supabase/functions/create-member/index.ts`](/Users/boltechsolution/Documents/untitled%20folder/supabase/functions/create-member/index.ts:1)

Example:

```bash
supabase functions deploy create-member
```

Make sure the function secrets listed above are configured first.

### 5. Seed the default admin

Run:

```bash
node --env-file=.env.local scripts/seed-admin.mjs
```

Or export the variables directly:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:admin
```

The seed script lives at:

[`scripts/seed-admin.mjs`](/Users/boltechsolution/Documents/untitled%20folder/scripts/seed-admin.mjs:1)

### 6. Start the app

```bash
npm run dev
```

### 7. Build for production

```bash
npm run build
```

## Important Backend Flows

### Create member

Member creation is handled through the `create-member` edge function instead of the browser client so the service role key never touches the frontend.

Flow:

1. Validate the requesting user from the bearer token.
2. Confirm the requester is an admin.
3. Create the Supabase auth user.
4. Insert the public profile.
5. Insert the company membership.

### Record sale

Sales are recorded through the SQL RPC:

`public.record_sale(p_company_id, p_inventory_item_id, p_quantity_sold, p_selling_price_per_unit)`

It performs the following atomically:

1. Locks the inventory row.
2. Validates stock availability.
3. Validates the selling price range.
4. Reduces inventory quantity.
5. Inserts the sale row.
6. Inserts a notification row.
7. Inserts an activity log row.

## Security Notes

- Members only see records for companies they belong to.
- Admin can access all active companies.
- Soft-deleted rows are hidden through RLS-aware policies.
- Profile visibility is restricted to self, admin, or users sharing a company.
- Notification reads are scoped to the current authenticated user.
- The frontend never uses the service role key.

## UI Notes

- Light theme only
- Responsive sidebar + top navigation
- Loading skeletons, empty states, toasts, and confirmation dialogs
- Inventory card/table switch
- Sales charts and CSV export
- Realtime notification dropdown and full notification page

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run typecheck`
- `npm run seed:admin`

## Suggested Next Steps

- Add Supabase Storage for product images
- Add email notifications for high-priority events
- Add a dark mode if the product direction changes
- Add PWA support for warehouse/tablet usage
# Inventory-manager
