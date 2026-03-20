-- ============================================================
-- Multitenancy: tables, RLS policies, indexes, triggers
-- Order matters: tenants → memberships → invitations (FK deps)
-- ============================================================

-- @agentlink tenants
-- @type table
-- @summary Tenant/workspace entities for multitenancy
-- @description Each tenant represents an organization or workspace. Users are linked
--   to tenants via the memberships table. Protected by RLS policies that restrict
--   access to members only, with updates limited to owners.
-- @related memberships, invitations, _auth_is_tenant_member, _auth_has_role
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read own tenant" ON public.tenants;
CREATE POLICY "Members can read own tenant" ON public.tenants
  FOR SELECT TO authenticated
  USING (public._auth_is_tenant_member(id));

DROP POLICY IF EXISTS "Owners can update tenant" ON public.tenants;
CREATE POLICY "Owners can update tenant" ON public.tenants
  FOR UPDATE TO authenticated
  USING (public._auth_is_tenant_member(id) AND public._auth_has_role('owner'));

DROP TRIGGER IF EXISTS trg_tenants_updated_at ON public.tenants;
CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- @agentlink memberships
-- @type table
-- @summary Links users to tenants with role-based access
-- @description Join table between auth.users and tenants. Each row assigns a user
--   a role within a tenant. Roles: owner, admin, member, viewer. Protected by RLS
--   that scopes access to the user's current tenant.
-- @related tenants, _auth_tenant_id, _auth_has_role, api.membership_list
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_memberships_tenant_user ON public.memberships (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships (user_id);

DROP POLICY IF EXISTS "Members can read memberships in their tenant" ON public.memberships;
CREATE POLICY "Members can read memberships in their tenant" ON public.memberships
  FOR SELECT TO authenticated
  USING (tenant_id = public._auth_tenant_id());

DROP POLICY IF EXISTS "Admins can insert memberships" ON public.memberships;
CREATE POLICY "Admins can insert memberships" ON public.memberships
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public._auth_tenant_id() AND public._auth_has_role('admin'));

DROP POLICY IF EXISTS "Admins can delete memberships" ON public.memberships;
CREATE POLICY "Admins can delete memberships" ON public.memberships
  FOR DELETE TO authenticated
  USING (
    tenant_id = public._auth_tenant_id()
    AND public._auth_has_role('admin')
    AND user_id != (SELECT auth.uid())
  );

-- @agentlink invitations
-- @type table
-- @summary Pending invitations to join a tenant
-- @description Stores email-based invitations with a unique token. Invitations expire
--   and can be accepted once. Protected by RLS that restricts visibility to admins
--   of the inviting tenant.
-- @related tenants, memberships, api.invitation_create, api.invitation_accept
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations (token) WHERE accepted_at IS NULL;

DROP POLICY IF EXISTS "Admins can read invitations in their tenant" ON public.invitations;
CREATE POLICY "Admins can read invitations in their tenant" ON public.invitations
  FOR SELECT TO authenticated
  USING (tenant_id = public._auth_tenant_id() AND public._auth_has_role('admin'));
