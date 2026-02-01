-- Username-only admin auth (no email)
-- In Supabase, pgcrypto lives in the extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE public.admin_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only allow reading via the login RPC (anon cannot select from this table directly)
CREATE POLICY "No direct access to admin_users" ON public.admin_users FOR ALL USING (false);

-- Preset admin: username friendscorporation, password AsdAsd777@#
INSERT INTO public.admin_users (username, password_hash)
VALUES ('friendscorporation', extensions.crypt('AsdAsd777@#', extensions.gen_salt('bf')));

-- RPC: check username + password, returns true if valid (callable by anon)
CREATE OR REPLACE FUNCTION public.check_admin_login(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE username = p_username
      AND password_hash = extensions.crypt(p_password, password_hash)
  );
$$;

-- Allow anonymous clients to call the login function
GRANT EXECUTE ON FUNCTION public.check_admin_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_admin_login(TEXT, TEXT) TO authenticated;
