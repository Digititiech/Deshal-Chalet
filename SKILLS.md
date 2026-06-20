---
name: database-schema
description: Supabase Database schema details, RLS policies, access scopes, dynamic currency formatting rules, and date check logic for the Omani Chalet and Camp Vacation Rental Management System.
---

# 💡 Advanced Database Schema & System Blueprints (`SKILLS.md`)

This reference manual dictates the strict technical implementation patterns, architectural recipes, and database management logic for the Omani Chalet & Camp Vacation Rental Management System. Any AI agent or developer modifying the backend, writing migrations, or querying database layers must adhere to this exact structural blueprint.

---

## 📑 1. Supabase Database Schema & Migration Blueprint
Execute or query this exact PostgreSQL structure. All IDs use UUID format unless specified otherwise.

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- A. System Settings (Multi-Currency Support)
create table public.settings (
    id uuid primary key default uuid_generate_v4(),
    company_name text not null default 'The Star Chalet',
    currency_code text not null default 'OMR',
    currency_name text not null default 'ر.ع.',
    tax_rate numeric(5,2) not null default 5.00,
    price_multiplier numeric(5,2) not null default 1.00,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- B. User Profiles (RBAC)
create table public.profiles (
    id uuid primary key default uuid_generate_v4(),
    full_name text not null,
    email text unique not null,
    role text not null check (role in ('super_admin', 'company_manager', 'property_manager', 'booking_staff')),
    status text not null check (status in ('active', 'inactive')) default 'active',
    avatar_url text,
    last_login_at timestamp with time zone,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- C. Properties (Units)
create table public.properties (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    ref_code text unique not null,
    city text not null, -- Expected cities: مسقط، صلالة، البريمي، بدية، الجبل الأخضر (also الرياض، أبها، العلا in tests)
    type text not null check (type in ('resort', 'chalet', 'camp')),
    status text not null check (status in ('available', 'occupied', 'maintenance')) default 'available',
    price_full_day numeric(10, 2) not null,
    price_half_day numeric(10, 2) not null,
    rating numeric(3, 2) default 5.00,
    rooms integer not null default 1,
    amenities text[] default '{}',
    size_sqm integer not null default 100,
    image_url text,
    location_text text,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- D. Junction Table for Staff-to-Property Binding (RBAC Scope restriction)
create table public.user_properties (
    profile_id uuid not null references public.profiles(id) on delete cascade,
    property_id uuid not null references public.properties(id) on delete cascade,
    primary key (profile_id, property_id)
);

-- E. Bookings Table
create table public.bookings (
    id uuid primary key default uuid_generate_v4(),
    ref_code text unique not null,
    property_id uuid not null references public.properties(id) on delete restrict,
    guest_name text not null,
    guest_phone text not null,
    guest_email text not null,
    check_in timestamp with time zone not null,
    check_out timestamp with time zone not null,
    booking_type text not null check (booking_type in ('full_day', 'half_day')),
    status text not null check (status in ('confirmed', 'pending', 'cancelled', 'completed')) default 'pending',
    total_price numeric(10, 2) not null,
    created_by uuid references public.profiles(id) on delete set null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    constraint chk_dates check (check_out > check_in)
);

-- F. Booking Logs
create table public.booking_logs (
    id uuid primary key default uuid_generate_v4(),
    booking_id uuid not null references public.bookings(id) on delete cascade,
    action text not null, -- e.g., 'created', 'status_changed', 'edited'
    performed_by uuid references public.profiles(id) on delete set null,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- G. Notifications Table
create table public.notifications (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    message text not null,
    type text not null check (type in ('info', 'warning', 'success', 'error')) default 'info',
    is_read boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- H. Audit Logs
create table public.audit_logs (
    id uuid primary key default uuid_generate_v4(),
    table_name text not null,
    action_type text not null, -- 'INSERT', 'UPDATE', 'DELETE'
    record_id text not null,
    payload jsonb,
    performed_by uuid references public.profiles(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

---

## 🔒 2. Row Level Security (RLS) & Access Scopes

Every table in the database has RLS policies enabled. Ensure that backend queries and frontend interactions obey the security scopes defined for user roles:

### User Roles Description:
1. **`super_admin`**: Full write and read access to all settings, profiles, properties, user properties, bookings, notifications, and logs.
2. **`company_manager`**: Administrative access equivalent to super_admin for bookings and properties, with settings management.
3. **`property_manager`**: Can read/write bookings only for properties explicitly mapped in the `user_properties` junction table.
4. **`booking_staff`**: Can read properties and manage bookings only for assigned properties.

### Database Trigger: Overlapping Bookings Prevention
A database trigger executes before any `INSERT` or `UPDATE` on the `bookings` table to prevent double bookings. If a date collision is detected, the database raises an exception in Arabic:
```sql
CREATE OR REPLACE FUNCTION public.prevent_overlapping_bookings()
RETURNS TRIGGER AS $$
DECLARE
    overlap_count INTEGER;
END;
...
```

---

## 💸 3. Front-End Rules & Constraints

### A. Dynamic Currency Support
**Never hardcode the currency abbreviation "ر.ع." or "OMR" in frontend pages.**
Always query the currency details dynamically from the `settings` table:
```typescript
// Fetch setting dynamically
const settings = await DatabaseService.getSettings();
const currency = settings.currency_name; // e.g. "ر.ع." or "USD"
```

### B. RTL Formatting
Use Tailwind-compatible RTL features for Arabic language support (e.g. `pe-*`, `ps-*`, `space-x-reverse`).