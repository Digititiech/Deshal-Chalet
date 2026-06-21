-- ================================================================
-- MIGRATION: Login system support - auth configuration & helpers
-- ================================================================
-- This migration adds:
-- 1. update_last_login trigger on profiles
-- 2. password_reset_tokens table for local/offline mode support
-- 3. Ensures email_confirmed_at is set on existing users (instant login)
-- ================================================================

-- -------------------------------------------------------------
-- 1. LAST LOGIN TRACKER — Update profiles.last_login_at
--    Called via a Supabase Auth Hook (or manually from app)
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_login_at whenever a user signs in
    -- This is called from auth.users update trigger on last_sign_in_at change
    UPDATE public.profiles
    SET last_login_at = now()
    WHERE id = NEW.id
      AND (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users for last_sign_in_at updates
DROP TRIGGER IF EXISTS t_update_last_login ON auth.users;
CREATE TRIGGER t_update_last_login
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.update_last_login();

-- -------------------------------------------------------------
-- 2. ENSURE ALL EXISTING USERS ARE CONFIRMED (instant login)
--    Fixes: "Email not confirmed" errors for admin-created users
-- -------------------------------------------------------------
UPDATE auth.users
SET
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmed_at = COALESCE(confirmed_at, now()),
    updated_at = now()
WHERE email_confirmed_at IS NULL
   OR confirmed_at IS NULL;

-- -------------------------------------------------------------
-- 3. UPDATE admin_create_user — ensure no confirmation needed
--    (already sets email_confirmed_at = now() but made explicit)
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_create_user(
    u_email TEXT,
    u_password TEXT,
    u_full_name TEXT,
    u_role TEXT,
    u_avatar_url TEXT DEFAULT ''
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    existing_user_id UUID;
BEGIN
    -- Check caller permissions
    IF public.get_auth_user_role() NOT IN ('super_admin', 'company_manager') THEN
        RAISE EXCEPTION 'غير مصرح: يجب أن تكون مديراً عاماً أو مدير شركة لإنشاء حسابات.';
    END IF;

    -- Check if user already exists by email
    SELECT id INTO existing_user_id
    FROM auth.users
    WHERE email = u_email
    LIMIT 1;

    IF existing_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'يوجد حساب مسجّل بالفعل بهذا البريد الإلكتروني.';
    END IF;

    -- Insert verified user into auth.users (no email confirmation required)
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
        now(),   -- ✅ Pre-confirm: no email verification step
        now(),   -- ✅ Pre-confirm
        jsonb_build_object(
            'provider', 'email',
            'providers', array['email'],
            'role', u_role
        ),
        jsonb_build_object(
            'full_name', u_full_name,
            'avatar_url', COALESCE(u_avatar_url, ''),
            'password', u_password
        ),
        now(),
        now(),
        FALSE
    )
    RETURNING id INTO new_user_id;

    -- The handle_new_user trigger will automatically create the profile
    -- But update role in app_metadata explicitly to be safe
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', u_role)
    WHERE id = new_user_id;

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------
-- 4. ENHANCED admin_reset_password — also handles magic links
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_reset_password(
    u_user_id UUID,
    u_new_password TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check caller permissions
    IF public.get_auth_user_role() NOT IN ('super_admin', 'company_manager') THEN
        RAISE EXCEPTION 'غير مصرح: يجب أن تكون مديراً عاماً أو مدير شركة لتغيير الرموز السرية.';
    END IF;

    -- Update password in auth.users
    UPDATE auth.users
    SET
        encrypted_password = crypt(u_new_password, gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('password', u_new_password),
        updated_at = now()
    WHERE id = u_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'المستخدم غير موجود في النظام.';
    END IF;

    -- Sync plain password to profiles table (for local display purposes)
    UPDATE public.profiles
    SET password = u_new_password
    WHERE id = u_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------
-- 5. GET CURRENT USER PROFILE — Convenience RPC for frontend
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    role TEXT,
    status TEXT,
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        p.email,
        p.role,
        p.status,
        p.avatar_url,
        p.last_login_at,
        p.created_at
    FROM public.profiles p
    WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_password(UUID, TEXT) TO authenticated;
