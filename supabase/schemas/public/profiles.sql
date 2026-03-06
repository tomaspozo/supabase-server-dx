-- @agentlink profiles
-- @type table
-- @summary User profile data synced from auth.users on signup
-- @description Stores display name, email, and avatar for each authenticated user.
--   Automatically populated by _admin_handle_new_user trigger. Protected by
--   RLS policies that restrict access to the owning user only.
-- @related _admin_handle_new_user, set_updated_at, api.profile_get, api.profile_update
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()));

-- Auto-update updated_at on row modification
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create profile row when a new user signs up
DROP TRIGGER IF EXISTS trg_auth_users_new_user ON auth.users;
CREATE TRIGGER trg_auth_users_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public._admin_handle_new_user();
