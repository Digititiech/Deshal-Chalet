-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------
-- 1. SETTINGS TABLE (Singleton)
-- -------------------------------------------------------------
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL DEFAULT 'The Star Chalet',
    currency_code TEXT NOT NULL DEFAULT 'OMR',
    currency_name TEXT NOT NULL DEFAULT 'ر.ع.',
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    price_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    is_singleton BOOLEAN DEFAULT TRUE UNIQUE CHECK (is_singleton = TRUE),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default system settings
INSERT INTO public.settings (company_name, currency_code, currency_name, tax_rate, price_multiplier, is_singleton)
VALUES ('The Star Chalet', 'OMR', 'ر.ع.', 5.00, 1.00, TRUE)
ON CONFLICT (is_singleton) DO NOTHING;

-- -------------------------------------------------------------
-- 2. PROFILES TABLE
-- -------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'company_manager', 'property_manager', 'booking_staff')) DEFAULT 'booking_staff',
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    avatar_url TEXT,
    password TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------
-- 3. PROPERTIES TABLE
-- -------------------------------------------------------------
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ref_code TEXT UNIQUE NOT NULL,
    city TEXT NOT NULL, -- e.g., 'muscat', 'salalah', 'nizwa', 'riyadh', 'alula', 'abha'
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

-- Introduce default property details
INSERT INTO public.properties (id, name, ref_code, city, type, status, price_full_day, price_half_day, rating, rooms, amenities, size_sqm, image_url, location_text) VALUES
('b3c2c1a0-0000-0000-0000-000000000001', 'منتجع الرمال الذهبية', 'REF-1042', 'riyadh', 'resort', 'available', 4500.00, 2500.00, 4.90, 4, ARRAY['مسبح خاص', 'شاشة عملاقة', 'موقف خاص'], 850, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbdAlDyYUrhKekDAalzFhhDhK9S4xHO7VMhQEPUG2o7pedISr3BKrfseuWgzRrSqMCmtJ6IdeFzJdeAtDNMsPrW2d541q0X5aSvB8MclIlQP4P3BH1Q2kU8QjaEAeMxL1ynDU1vcpLvgliQvwfi6g7ce0GhmVdUWzJN2tC-m9tVSRVSH8EGa2oVxYl5GRMUbKtlkAxzdsZr9_SRHEKPiyPJ3bDL7TNnSdkUU6wmONEnHnr7IiizDsCdnnK_Fq3rtH75HK9vJndNZQ', 'الثمامة، الرياض'),
('b3c2c1a0-0000-0000-0000-000000000002', 'شاليه الأفق العالي', 'REF-2291', 'abha', 'chalet', 'occupied', 3200.00, 1800.00, 4.70, 3, ARRAY['مدفأة', 'إطلالة جبلية', 'جلسة خارجية'], 420, 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-W5w7qp9jqjCsktASGqJjx2qZfsEKr3jtsO6Ziq4_zrIbr-o884rj3HJm03tfBTy-e4VfBrjeD_UzsqpgbciJOhvzftS9F7x71ST6cGqOAmnUrN4Ztc9s1c55n8T_djS5NcADzzVKhYw1mrBN5OisOWHV33fUFncRS_Vh1rTPG-Ep-73ACgUmZnv8_rBgkSDElC1PfT05WBKTfLTp55xwX4MeUWkYR8zz_HCtbHFQQcmugASXYgHMWlLmUBlKvOlzxRFSJXdlRSU', 'السودة، أبها'),
('b3c2c1a0-0000-0000-0000-000000000003', 'مخيم النجوم الملكي', 'REF-3005', 'alula', 'camp', 'available', 5800.00, 3500.00, 5.00, 1, ARRAY['شواء خاص', 'تلسكوب النجوم', 'حوض جاكوزي'], 200, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBawnTmUfAqSVq_v53yp-GGLy2OzB65utRxQZUzNdAp3SOiHApTG_wuBsauHy6GQPouimHe2LLRlJLDjcUvaUuPqP-qU7LRJHDYKRincHoFzPpSIocD8Ropk-13xBl3K2etwbv-DlzRV0g2Z_RaAaAFd0dAdb0MjBJhHsl26gU2K-HJouy9voSudRq8JRWCPlj4wVzAt1HnvqWidqTnm5NzQliQnpBVLWJWLXRcVwGsqc7NfHscoykGqHJLAOhQeJPCYPfTxTC8gpg', 'صحراء العلا، العلا')
ON CONFLICT (ref_code) DO NOTHING;

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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    record_id TEXT NOT NULL,
    payload JSONB,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------
-- 9. PERFORMANCE INDEXES (Foreign Keys & Queries)
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_properties_property_id ON public.user_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_by ON public.bookings(created_by);
CREATE INDEX IF NOT EXISTS idx_bookings_overlap_check ON public.bookings(property_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_logs_booking_id ON public.booking_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_logs_performed_by ON public.booking_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON public.audit_logs(performed_by);

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
END;
$$ LANGUAGE plpgsql;

-- Wait, let's write the actual body
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
-- SECURITY: GET USER ROLE FROM JWT CLAIM (NO DB QUERY - HIGH PERFORMANCE)
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN coalesce(
        (auth.jwt() -> 'app_metadata' ->> 'role'),
        ''
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- -------------------------------------------------------------
-- SECURITY: PROFILE CREATION & ROLE SYNC TRIGGERS
-- -------------------------------------------------------------

-- Trigger function to automatically create a profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role TEXT;
BEGIN
    default_role := coalesce(
        NEW.raw_app_meta_data ->> 'role',
        NEW.raw_user_meta_data ->> 'role',
        'booking_staff'
    );

    INSERT INTO public.profiles (id, full_name, email, role, status, avatar_url, password)
    VALUES (
        NEW.id,
        coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
        NEW.email,
        default_role,
        'active',
        NEW.raw_user_meta_data ->> 'avatar_url',
        NEW.raw_user_meta_data ->> 'password'
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        avatar_url = EXCLUDED.avatar_url,
        password = EXCLUDED.password;
    
    -- Sync the role to app_metadata if not already there
    IF (NEW.raw_app_meta_data ->> 'role') IS NULL OR (NEW.raw_app_meta_data ->> 'role') <> default_role THEN
        UPDATE auth.users
        SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', default_role)
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile
CREATE TRIGGER t_new_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Trigger function to synchronize role changes on profiles back to auth.users raw_app_meta_data
CREATE OR REPLACE FUNCTION public.handle_profile_role_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role <> OLD.role THEN
        UPDATE auth.users
        SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to synchronize role changes
CREATE TRIGGER t_profiles_role_sync
AFTER UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_role_sync();

-- Trigger function to prevent privilege escalation by non-admins updating their own profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF (select public.get_auth_user_role()) NOT IN ('super_admin', 'company_manager') THEN
        IF NEW.role <> OLD.role THEN
            RAISE EXCEPTION 'لا يمكنك تغيير رتبتك الخاصة.';
        END IF;
        IF NEW.status <> OLD.status THEN
            RAISE EXCEPTION 'لا يمكنك تغيير حالة الحساب الخاصة بك.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_prevent_profile_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

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

-- 1. SETTINGS RLS POLICIES
CREATE POLICY settings_select ON public.settings
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY settings_all ON public.settings
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() IN ('super_admin', 'company_manager'))
    WITH CHECK (public.get_auth_user_role() IN ('super_admin', 'company_manager'));

-- 2. PROFILES RLS POLICIES
CREATE POLICY profiles_select ON public.profiles
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY profiles_all ON public.profiles
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() IN ('super_admin', 'company_manager'))
    WITH CHECK (public.get_auth_user_role() IN ('super_admin', 'company_manager'));

CREATE POLICY profiles_update_own ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = (select auth.uid()))
    WITH CHECK (id = (select auth.uid()));

-- 3. PROPERTIES RLS POLICIES
CREATE POLICY properties_select ON public.properties
    FOR SELECT TO authenticated 
    USING (
        public.get_auth_user_role() IN ('super_admin', 'company_manager') OR
        id IN (SELECT property_id FROM public.user_properties WHERE profile_id = (select auth.uid()))
    );

CREATE POLICY properties_modify ON public.properties
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() IN ('super_admin', 'company_manager'))
    WITH CHECK (public.get_auth_user_role() IN ('super_admin', 'company_manager'));

-- 4. USER_PROPERTIES RLS POLICIES
CREATE POLICY user_properties_all ON public.user_properties
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() IN ('super_admin', 'company_manager'))
    WITH CHECK (public.get_auth_user_role() IN ('super_admin', 'company_manager'));

CREATE POLICY user_properties_select_own ON public.user_properties
    FOR SELECT TO authenticated
    USING (profile_id = (select auth.uid()));

-- 5. BOOKINGS RLS POLICIES
CREATE POLICY bookings_all_admins ON public.bookings
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() IN ('super_admin', 'company_manager'))
    WITH CHECK (public.get_auth_user_role() IN ('super_admin', 'company_manager'));

CREATE POLICY bookings_staff_select ON public.bookings
    FOR SELECT TO authenticated
    USING (
        public.get_auth_user_role() IN ('property_manager', 'booking_staff') AND
        property_id IN (SELECT property_id FROM public.user_properties WHERE profile_id = (select auth.uid()))
    );

CREATE POLICY bookings_staff_insert ON public.bookings
    FOR INSERT TO authenticated
    WITH CHECK (
        public.get_auth_user_role() IN ('property_manager', 'booking_staff') AND
        property_id IN (SELECT property_id FROM public.user_properties WHERE profile_id = (select auth.uid()))
    );

CREATE POLICY bookings_staff_update ON public.bookings
    FOR UPDATE TO authenticated
    USING (
        public.get_auth_user_role() IN ('property_manager', 'booking_staff') AND
        property_id IN (SELECT property_id FROM public.user_properties WHERE profile_id = (select auth.uid()))
    )
    WITH CHECK (
        public.get_auth_user_role() IN ('property_manager', 'booking_staff') AND
        property_id IN (SELECT property_id FROM public.user_properties WHERE profile_id = (select auth.uid()))
    );

-- 6. BOOKING_LOGS RLS POLICIES
CREATE POLICY booking_logs_select ON public.booking_logs
    FOR SELECT TO authenticated
    USING (
        public.get_auth_user_role() IN ('super_admin', 'company_manager') OR
        booking_id IN (
            SELECT b.id FROM public.bookings b
            JOIN public.user_properties up ON up.property_id = b.property_id
            WHERE up.profile_id = (select auth.uid())
        )
    );

CREATE POLICY booking_logs_insert ON public.booking_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        public.get_auth_user_role() IN ('super_admin', 'company_manager') OR
        booking_id IN (
            SELECT b.id FROM public.bookings b
            JOIN public.user_properties up ON up.property_id = b.property_id
            WHERE up.profile_id = (select auth.uid())
        )
    );

-- 7. NOTIFICATIONS RLS POLICIES
CREATE POLICY notifications_select ON public.notifications
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY notifications_write ON public.notifications
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() IN ('super_admin', 'company_manager'))
    WITH CHECK (public.get_auth_user_role() IN ('super_admin', 'company_manager'));

CREATE POLICY notifications_update_is_read ON public.notifications
    FOR UPDATE TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- 8. AUDIT_LOGS RLS POLICIES
CREATE POLICY audit_logs_select ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.get_auth_user_role() IN ('super_admin', 'company_manager'));

CREATE POLICY audit_logs_insert ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (TRUE);

-- -------------------------------------------------------------
-- 10. ADMIN USER MANAGEMENT FUNCTIONS (SECURITY DEFINER)
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_create_user(
    u_email TEXT,
    u_password TEXT,
    u_full_name TEXT,
    u_role TEXT,
    u_avatar_url TEXT
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Check if caller is super_admin or company_manager
    IF public.get_auth_user_role() NOT IN ('super_admin', 'company_manager') THEN
        RAISE EXCEPTION 'غير مصرح: يجب أن تكون مديراً عاماً أو مدير شركة لإنشاء حسابات.';
    END IF;

    -- Insert into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        is_anonymous
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        u_email,
        crypt(u_password, gen_salt('bf')),
        now(),
        now(),
        jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', u_role),
        jsonb_build_object('full_name', u_full_name, 'avatar_url', u_avatar_url, 'password', u_password),
        now(),
        now(),
        FALSE
    )
    RETURNING id INTO new_user_id;

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_reset_password(
    u_user_id UUID,
    u_new_password TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if caller is super_admin or company_manager
    IF public.get_auth_user_role() NOT IN ('super_admin', 'company_manager') THEN
        RAISE EXCEPTION 'غير مصرح: يجب أن تكون مديراً عاماً أو مدير شركة لتغيير الرموز السرية.';
    END IF;

    -- Update password in auth.users
    UPDATE auth.users
    SET encrypted_password = crypt(u_new_password, gen_salt('bf')),
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('password', u_new_password),
        updated_at = now()
    WHERE id = u_user_id;

    -- Update password in public.profiles
    UPDATE public.profiles
    SET password = u_new_password
    WHERE id = u_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
