-- @agentlink _auth_tenant_id
-- @type function
-- @summary Extracts tenant_id from the current user's JWT app_metadata
-- @description Reads tenant_id from auth.jwt()->'app_metadata' and returns it as uuid.
--   Used in RLS policies to scope queries to the current tenant. Returns NULL if no
--   tenant is selected.
-- @signature _auth_tenant_id()
-- @returns uuid
-- @security SECURITY INVOKER — runs as the calling user
-- @related tenants, memberships, _auth_tenant_role
CREATE OR REPLACE FUNCTION public._auth_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT ((auth.jwt()->'app_metadata'->>'tenant_id')::uuid);
$$;

-- @agentlink _auth_tenant_role
-- @type function
-- @summary Extracts tenant_role from the current user's JWT app_metadata
-- @description Reads tenant_role from auth.jwt()->'app_metadata' and returns it as text.
--   Possible values: 'owner', 'admin', 'member', 'viewer'. Returns NULL if no tenant
--   is selected.
-- @signature _auth_tenant_role()
-- @returns text
-- @security SECURITY INVOKER — runs as the calling user
-- @related tenants, memberships, _auth_tenant_id, _auth_has_role
CREATE OR REPLACE FUNCTION public._auth_tenant_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT (auth.jwt()->'app_metadata'->>'tenant_role');
$$;

-- @agentlink _auth_has_role
-- @type function
-- @summary Checks if the current user's tenant role meets a minimum level
-- @description Compares the user's tenant_role from JWT against a numeric hierarchy:
--   viewer=1, member=2, admin=3, owner=4. Returns true if the user's role is >=
--   the requested minimum role.
-- @signature _auth_has_role(p_minimum_role text)
-- @returns boolean
-- @security SECURITY INVOKER — runs as the calling user
-- @related _auth_tenant_role, memberships
CREATE OR REPLACE FUNCTION public._auth_has_role(p_minimum_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_role_rank integer;
  v_min_rank integer;
  v_roles jsonb := '{"viewer":1,"member":2,"admin":3,"owner":4}'::jsonb;
BEGIN
  v_role_rank := COALESCE((v_roles->>public._auth_tenant_role())::integer, 0);
  v_min_rank := COALESCE((v_roles->>p_minimum_role)::integer, 0);
  RETURN v_role_rank >= v_min_rank;
END;
$$;

-- @agentlink _auth_is_tenant_member
-- @type function
-- @summary Checks if the current user is a member of the given tenant
-- @description SECURITY DEFINER function that queries public.memberships directly,
--   bypassing RLS to avoid recursion when used inside RLS policies on the tenants table.
-- @signature _auth_is_tenant_member(p_tenant_id uuid)
-- @returns boolean
-- @security SECURITY DEFINER — bypasses RLS to avoid recursion
-- @related tenants, memberships, _auth_tenant_id
CREATE OR REPLACE FUNCTION public._auth_is_tenant_member(p_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships
    WHERE tenant_id = p_tenant_id
      AND user_id = (SELECT auth.uid())
  );
END;
$$;
