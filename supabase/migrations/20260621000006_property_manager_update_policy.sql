-- Create policy to allow property managers to update properties assigned to them
CREATE POLICY properties_update_pm ON public.properties
    FOR UPDATE TO authenticated
    USING (
        public.get_auth_user_role() = 'property_manager' AND
        id IN (SELECT property_id FROM public.user_properties WHERE profile_id = auth.uid())
    )
    WITH CHECK (
        public.get_auth_user_role() = 'property_manager' AND
        id IN (SELECT property_id FROM public.user_properties WHERE profile_id = auth.uid())
    );
