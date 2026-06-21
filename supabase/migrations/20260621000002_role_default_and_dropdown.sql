-- Create the roles lookup table
CREATE TABLE IF NOT EXISTS public.user_roles (
    role TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    description TEXT
);

-- Enable RLS on the lookup table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to roles
CREATE POLICY "Allow public read access to roles" ON public.user_roles
    FOR SELECT USING (true);

-- Insert the standard roles
INSERT INTO public.user_roles (role, name_ar, description) VALUES
('super_admin', 'المدير العام', 'التحكم الكامل بكافة جوانب ومرافق الشركة، الإعدادات المالية، الموظفين والحجوزات.'),
('company_manager', 'مدير الشركة', 'إدارة وتعديل الشاليهات والمخيمات، تعيين الرسوم، واعتماد الميزانيات المالية.'),
('property_manager', 'مدير المرفق', 'الإشراف على فروع أو شاليهات معينة فحسب، تحديث حالتها التشغيلية ومراقبة الحجوزات الخاصة بها.'),
('booking_staff', 'موظف الحجوزات', 'إدخال الحجوزات اليومية واستقبال المكالمات، وإتمام الإجراءات دون حق تعديل الهياكل أو شطب السجلات.')
ON CONFLICT (role) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description;

-- Drop check constraint and add foreign key reference
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT fk_profiles_role
FOREIGN KEY (role) REFERENCES public.user_roles (role);

-- Update trigger function handle_new_user to use 'super_admin' as default
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_role TEXT;
    v_full_name TEXT;
    v_avatar_url TEXT;
BEGIN
    -- Determine role: app_metadata takes priority (set by admin_create_user),
    -- then user_metadata, then default 'super_admin'
    v_role := COALESCE(
        NULLIF(TRIM(NEW.raw_app_meta_data ->> 'role'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'role'), ''),
        'super_admin'
    );

    -- Validate role value — reject anything invalid to prevent data corruption
    IF v_role NOT IN ('super_admin', 'company_manager', 'property_manager', 'booking_staff') THEN
        v_role := 'super_admin';
    END IF;

    -- Determine full name: user_metadata > email prefix
    v_full_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),  -- Google OAuth uses 'name'
        split_part(NEW.email, '@', 1)
    );

    -- Avatar: user_metadata > null
    v_avatar_url := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'avatar_url'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'picture'), '')  -- Google OAuth uses 'picture'
    );

    -- Upsert profile (INSERT or UPDATE if already exists)
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        role,
        status,
        avatar_url,
        password,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        v_full_name,
        NEW.email,
        v_role,
        'active',
        v_avatar_url,
        NEW.raw_user_meta_data ->> 'password',  -- plain text stored for admin reference only
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name   = EXCLUDED.full_name,
        email       = EXCLUDED.email,
        role        = EXCLUDED.role,
        avatar_url  = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        password    = COALESCE(EXCLUDED.password, public.profiles.password),
        updated_at  = now();

    -- Sync role back into auth.users app_metadata if missing or stale
    -- (ensures JWT claims always have the correct role)
    IF COALESCE(NEW.raw_app_meta_data ->> 'role', '') <> v_role THEN
        UPDATE auth.users
        SET raw_app_meta_data =
            COALESCE(raw_app_meta_data, '{}'::jsonb)
            || jsonb_build_object('role', v_role)
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$function$;
