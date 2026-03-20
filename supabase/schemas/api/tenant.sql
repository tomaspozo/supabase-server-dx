-- @agentlink api.tenant_select
-- @type function
-- @summary Selects a tenant and sets JWT claims for the current session
-- @description Verifies the user is a member of the requested tenant, then updates
--   their raw_app_meta_data with tenant_id and tenant_role. Returns the tenant data.
--   The updated claims take effect on the next token refresh.
-- @signature api.tenant_select(p_tenant_id uuid)
-- @returns jsonb
-- @security SECURITY DEFINER — needs to update auth.users directly
-- @related tenants, memberships, _auth_tenant_id
CREATE OR REPLACE FUNCTION api.tenant_select(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_membership record;
  v_tenant record;
BEGIN
  SELECT * INTO v_membership
  FROM public.memberships
  WHERE tenant_id = p_tenant_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not a member of this tenant';
  END IF;

  SELECT * INTO v_tenant
  FROM public.tenants
  WHERE id = p_tenant_id;

  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'tenant_id', p_tenant_id,
    'tenant_role', v_membership.role
  )
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'id', v_tenant.id,
    'name', v_tenant.name,
    'slug', v_tenant.slug,
    'role', v_membership.role
  );
END;
$$;

-- @agentlink api.tenant_list
-- @type function
-- @summary Lists all tenants the current user belongs to
-- @description Returns a JSON array of tenants with the user's role in each.
--   Uses SECURITY INVOKER so RLS is not applied on memberships (we query all
--   memberships for the user, not just the current tenant).
-- @signature api.tenant_list()
-- @returns jsonb
-- @security SECURITY DEFINER — queries memberships across tenants
-- @related tenants, memberships
CREATE OR REPLACE FUNCTION api.tenant_list()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'name', t.name,
    'slug', t.slug,
    'role', m.role
  )), '[]'::jsonb)
  INTO v_result
  FROM public.memberships m
  JOIN public.tenants t ON t.id = m.tenant_id
  WHERE m.user_id = (SELECT auth.uid());

  RETURN v_result;
END;
$$;

-- @agentlink api.tenant_create
-- @type function
-- @summary Creates a new tenant with the current user as owner
-- @description Creates a tenant row, adds an owner membership for the calling user,
--   and sets the JWT claims to the new tenant. Returns the new tenant data.
-- @signature api.tenant_create(p_name text, p_slug text)
-- @returns jsonb
-- @security SECURITY DEFINER — needs to insert into tenants/memberships and update auth.users
-- @related tenants, memberships, api.tenant_select
CREATE OR REPLACE FUNCTION api.tenant_create(p_name text, p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_tenant_id uuid;
BEGIN
  INSERT INTO public.tenants (name, slug)
  VALUES (p_name, p_slug)
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.memberships (tenant_id, user_id, role)
  VALUES (v_tenant_id, v_user_id, 'owner');

  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'tenant_id', v_tenant_id,
    'tenant_role', 'owner'
  )
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'id', v_tenant_id,
    'name', p_name,
    'slug', p_slug,
    'role', 'owner'
  );
END;
$$;

-- @agentlink api.invitation_create
-- @type function
-- @summary Creates an invitation for a user to join the current tenant
-- @description Admin-only function that creates an invitation record with a unique token.
--   Fires the send-email edge function to notify the invitee. Returns the invitation data.
-- @signature api.invitation_create(p_email text, p_role text DEFAULT 'member')
-- @returns jsonb
-- @security SECURITY DEFINER — needs to insert invitation and call edge function
-- @related invitations, memberships, _internal_admin_call_edge_function
CREATE OR REPLACE FUNCTION api.invitation_create(
  p_email text,
  p_role text DEFAULT 'member'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_tenant_id uuid := public._auth_tenant_id();
  v_invitation record;
BEGIN
  IF NOT public._auth_has_role('admin') THEN
    RAISE EXCEPTION 'Only admins can create invitations';
  END IF;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant selected';
  END IF;

  INSERT INTO public.invitations (tenant_id, email, role, invited_by)
  VALUES (v_tenant_id, p_email, p_role, v_user_id)
  RETURNING * INTO v_invitation;

  RETURN jsonb_build_object(
    'id', v_invitation.id,
    'email', v_invitation.email,
    'role', v_invitation.role,
    'token', v_invitation.token,
    'expires_at', v_invitation.expires_at
  );
END;
$$;

-- @agentlink api.invitation_accept
-- @type function
-- @summary Accepts a tenant invitation using a token
-- @description Validates the invitation token, checks expiry, creates a membership,
--   marks the invitation as accepted, and sets JWT claims to the new tenant.
-- @signature api.invitation_accept(p_token uuid)
-- @returns jsonb
-- @security SECURITY DEFINER — needs to create membership and update auth.users
-- @related invitations, memberships, api.tenant_select
CREATE OR REPLACE FUNCTION api.invitation_accept(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_invitation record;
  v_tenant record;
BEGIN
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token = p_token
    AND accepted_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  INSERT INTO public.memberships (tenant_id, user_id, role)
  VALUES (v_invitation.tenant_id, v_user_id, v_invitation.role)
  ON CONFLICT (tenant_id, user_id) DO NOTHING;

  UPDATE public.invitations
  SET accepted_at = now()
  WHERE id = v_invitation.id;

  SELECT * INTO v_tenant
  FROM public.tenants
  WHERE id = v_invitation.tenant_id;

  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'tenant_id', v_invitation.tenant_id,
    'tenant_role', v_invitation.role
  )
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'id', v_tenant.id,
    'name', v_tenant.name,
    'slug', v_tenant.slug,
    'role', v_invitation.role
  );
END;
$$;

-- @agentlink api.membership_list
-- @type function
-- @summary Lists all members of the current tenant
-- @description Returns a JSON array of members with their profile info and roles.
--   Scoped to the current tenant from JWT claims.
-- @signature api.membership_list()
-- @returns jsonb
-- @security SECURITY DEFINER — joins memberships with profiles
-- @related memberships, profiles, _auth_tenant_id
CREATE OR REPLACE FUNCTION api.membership_list()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid := public._auth_tenant_id();
  v_result jsonb;
BEGIN
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant selected';
  END IF;

  IF NOT public._auth_is_tenant_member(v_tenant_id) THEN
    RAISE EXCEPTION 'Not a member of this tenant';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', m.id,
    'user_id', m.user_id,
    'role', m.role,
    'email', p.email,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url,
    'created_at', m.created_at
  )), '[]'::jsonb)
  INTO v_result
  FROM public.memberships m
  LEFT JOIN public.profiles p ON p.id = m.user_id
  WHERE m.tenant_id = v_tenant_id;

  RETURN v_result;
END;
$$;
