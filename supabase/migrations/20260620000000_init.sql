-- Create custom schemas or structures if needed, but standard public schema is used for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------
-- 1. SETTINGS TABLE
-- -------------------------------------------------------------
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL DEFAULT 'The Star Chalet',
    currency_code TEXT NOT NULL DEFAULT 'OMR',
    currency_name TEXT NOT NULL DEFAULT 'ر.ع.',
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    price_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default system settings
INSERT INTO public.settings (company_name, currency_code, currency_name, tax_rate, price_multiplier)
VALUES ('The Star Chalet', 'OMR', 'ر.ع.', 5.00, 1.00)
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- 2. PROFILES TABLE
-- -------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'company_manager', 'property_manager', 'booking_staff')),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    avatar_url TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------
-- 3. PROPERTIES TABLE
-- -------------------------------------------------------------
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    ref_code TEXT UNIQUE NOT NULL,
    city TEXT NOT NULL, -- e.g., 'muscat', 'salalah', 'nizwa', 'riyadh', 'alula'
    type TEXT NOT NULL CHECK (type IN ('resort', 'chalet', 'camp')),
    status TEXT NOT NULL CHECK (status IN ('available', 'occupied', 'maintenance')) DEFAULT 'available',
    price_full_day NUMERIC(10,2) NOT NULL,
    price_half_day NUMERIC(10,2) NOT NULL,
    rating NUMERIC(3,2) DEFAULT 5.00,
    rooms INTEGER NOT NULL DEFAULT 1,
    amenities TEXT[] DEFAULT '{}', -- e.g., {'Pool', 'Fireplace', 'Seaview'}
    size_sqm INTEGER NOT NULL DEFAULT 100,
    image_url TEXT,
    location_text TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Introduce default property details to correspond to designs
INSERT INTO public.properties (name, ref_code, city, type, status, price_full_day, price_half_day, rating, rooms, amenities, size_sqm, image_url, location_text) VALUES
('منتجع الرمال الذهبية', 'REF-1042', 'الرياض', 'resort', 'available', 4500.00, 2500.00, 4.90, 4, ARRAY['مسبح خاص', 'شاشة عملاقة', 'موقف خاص'], 850, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbdAlDyYUrhKekDAalzFhhDhK9S4xHO7VMhQEPUG2o7pedISr3BKrfseuWgzRrSqMCmtJ6IdeFzJdeAtDNMsPrW2d541q0X5aSvB8MclIlQP4P3BH1Q2kU8QjaEAeMxL1ynDU1vcpLvgliQvwfi6g7ce0GhmVdUWzJN2tC-m9tVSRVSH8EGa2oVxYl5GRMUbKtlkAxzdsZr9_SRHEKPiyPJ3bDL7TNnSdkUU6wmONEnHnr7IiizDsCdnnK_Fq3rtH75HK9vJndNZQ', 'الثمامة، الرياض'),
('شاليه الأفق العالي', 'REF-2291', 'أبها', 'chalet', 'occupied', 3200.00, 1800.00, 4.70, 3, ARRAY['مدفأة', 'إطلالة جبلية', 'جلسة خارجية'], 420, 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-W5w7qp9jqjCsktASGqJjx2qZfsEKr3jtsO6Ziq4_zrIbr-o884rj3HJm03tfBTy-e4VfBrjeD_UzsqpgbciJOhvzftS9F7x71ST6cGqOAmnUrN4Ztc9s1c55n8T_djS5NcADzzVKhYw1mrBN5OisOWHV33fUFncRS_Vh1rTPG-Ep-73ACgUmZnv8_rBgkSDElC1PfT05WBKTfLTp55xwX4MeUWkYR8zz_HCtbHFQQcmugASXYgHMWlLmUBlKvOlzxRFSJXdlRSU', 'السودة، أبها'),
('مخيم النجوم الملكي', 'REF-3005', 'العلا', 'camp', 'maintenance', 5800.00, 3500.00, 5.00, 1, ARRAY['شواء خاص', 'تلسكوب النجوم', 'حوض جاكوزي'], 200, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBawnTmUfAqSVq_v53yp-GGLy2OzB65utRxQZUzNdAp3SOiHApTG_wuBsauHy6GQPouimHe2LLRlJLDjcUvaUuPqP-qU7LRJHDYKRincHoFzPpSIocD8Ropk-13xBl3K2etwbv-DlzRV0g2Z_RaAaAFd0dAdb0MjBJhHsl26gU2K-HJouy9voSudRq8JRWCPlj4wVzAt1HnvqWidqTnm5NzQliQnpBVLWJWLXRcVwGsqc7NfHscoykGqHJLAOhQeJPCYPfTxTC8gpg', 'صحراء العلا، العلا')
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- 4. USER_PROPERTIES RELATION TABLE
-- -------------------------------------------------------------
CREATE TABLE public.user_properties (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, property_id)
);

-- -------------------------------------------------------------
-- 5. BOOKINGS TABLE
-- -------------------------------------------------------------
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ref_code TEXT UNIQUE NOT NULL, -- e.g., '#CH-892'
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    guest_name TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out TIMESTAMP WITH TIME ZONE NOT NULL,
    booking_type TEXT NOT NULL CHECK (booking_type IN ('full_day', 'half_day')),
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'pending', 'cancelled', 'completed')) DEFAULT 'pending',
    total_price NUMERIC(10,2) NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT chk_dates CHECK (check_out > check_in)
);

-- -------------------------------------------------------------
-- 6. BOOKING_LOGS TABLE
-- -------------------------------------------------------------
CREATE TABLE public.booking_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- e.g., 'created', 'status_changed', 'edited'
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------
-- 7. NOTIFICATIONS TABLE
-- -------------------------------------------------------------
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')) DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------
-- 8. AUDIT_LOGS TABLE
-- -------------------------------------------------------------
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    record_id TEXT NOT NULL,
    payload JSONB,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------
-- AUTOMATE UPDATED_AT TRIGGER
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -------------------------------------------------------------
-- PREVENT OVERLAPPING BOOKINGS DATABASE LEVEL
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_overlapping_bookings()
RETURNS TRIGGER AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    -- Only check overlaps for 'confirmed' or 'pending' bookings
    IF NEW.status IN ('confirmed', 'pending') THEN
        SELECT COUNT(*)
        INTO overlap_count
        FROM public.bookings
        WHERE property_id = NEW.property_id
          AND id <> NEW.id -- ignore current record if updating
          AND status IN ('confirmed', 'pending')
          AND NOT (
              NEW.check_out <= check_in OR
              NEW.check_in >= check_out
          );

        IF overlap_count > 0 THEN
            RAISE EXCEPTION 'هذا العقار محجوز بالفعل خلال هذه التواريخ المحددة. يرجى اختيار تاريخ آخر.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_bookings_overlap_check
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.prevent_overlapping_bookings();

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to fetch current user's profile and role
-- Supposing standard auth.uid() links to public.profiles.id
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT AS $$
DECLARE
    u_role TEXT;
BEGIN
    SELECT role INTO u_role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
    RETURN u_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. SETTINGS RLS POLICIES
CREATE POLICY settings_select ON public.settings
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY settings_all FOR ALL ON public.settings
    TO authenticated
    USING (public.get_auth_user_role() IN ('super_admin', 'company_manager'))
    WITH CHECK (public.get_auth_user_role() IN ('super_admin', 'company_manager'));

-- 2. PROFILES RLS POLICIES
CREATE POLICY profiles_select ON public.profiles
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY profiles_all FOR ALL ON public.profiles
    TO authenticated
    USING (public.get_auth_user_role() IN ('super_admin', 'company_manager'))
    WITH CHECK (public.get_auth_user_role() IN ('super_admin', 'company_manager'));

-- 3. PROPERTIES RLS POLICIES
CREATE POLICY properties_select ON public.properties
    FOR SELECT TO authenticated 
    USING (
        public.get_auth_user_role() IN ('super_admin', 'company_manager') OR
        id IN (SELECT property_id FROM public.user_properties WHERE profile_id = auth.uid())
    );

CREATE POLICY properties_modify FOR ALL ON public.properties
    TO authenticated
    USING (public.get_auth_user_role() IN ('super_admin', 'company_manager'))
    WITH CHECK (public.get_auth_user_role() IN ('super_admin', 'company_manager'));

-- 4. USER_PROPERTIES RLS POLICIES
CREATE POLICY user_properties_all FOR ALL ON public.user_properties
    TO authenticated
    USING (public.get_auth_user_role() IN ('super_admin', 'company_manager'))
    WITH CHECK (public.get_auth_user_role() IN ('super_admin', 'company_manager'));

CREATE POLICY user_properties_select_own ON public.user_properties
    FOR SELECT TO authenticated
    USING (profile_id = auth.uid());

-- 5. BOOKINGS RLS POLICIES
CREATE POLICY bookings_all_admins FOR ALL ON public.bookings
    TO authenticated
    USING (public.get_auth_user_role() IN ('super_admin', 'company_manager'))
    WITH CHECK (public.get_auth_user_role() IN ('super_admin', 'company_manager'));

CREATE POLICY bookings_staff_select ON public.bookings
    FOR SELECT TO authenticated
    USING (
        public.get_auth_user_role() IN ('property_manager', 'booking_staff') AND
        property_id IN (SELECT property_id FROM public.user_properties WHERE profile_id = auth.uid())
    );

CREATE POLICY bookings_staff_insert ON public.bookings
    FOR INSERT TO authenticated
    WITH CHECK (
        public.get_auth_user_role() IN ('property_manager', 'booking_staff') AND
        property_id IN (SELECT property_id FROM public.user_properties WHERE profile_id = auth.uid())
    );

CREATE POLICY bookings_staff_update ON public.bookings
    FOR UPDATE TO authenticated
    USING (
        public.get_auth_user_role() IN ('property_manager', 'booking_staff') AND
        property_id IN (SELECT property_id FROM public.user_properties WHERE profile_id = auth.uid())
    )
    WITH CHECK (
        public.get_auth_user_role() IN ('property_manager', 'booking_staff') AND
        property_id IN (SELECT property_id FROM public.user_properties WHERE profile_id = auth.uid())
    );

-- 6. BOOKING_LOGS RLS POLICIES
CREATE POLICY booking_logs_select ON public.booking_logs
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY booking_logs_insert ON public.booking_logs
    FOR INSERT TO authenticated WITH CHECK (TRUE);

-- 7. NOTIFICATIONS RLS POLICIES
CREATE POLICY notifications_all FOR ALL ON public.notifications
    TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- 8. AUDIT_LOGS RLS POLICIES
CREATE POLICY audit_logs_select ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.get_auth_user_role() IN ('super_admin', 'company_manager'));

CREATE POLICY audit_logs_insert ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (TRUE);
