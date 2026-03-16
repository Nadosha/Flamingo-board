-- Fix: workspace_members policies were recursive (policy queries the same table it guards)
-- Solution: SECURITY DEFINER helper functions that bypass RLS

CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = workspace_uuid
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(workspace_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = workspace_uuid
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

-- Drop old recursive policies on workspace_members
DROP POLICY IF EXISTS "Members can view workspace_members"    ON workspace_members;
DROP POLICY IF EXISTS "Owners and admins can manage members"  ON workspace_members;

-- Recreate without recursion (helper functions query table with SECURITY DEFINER → no RLS loop)
CREATE POLICY "Members can view workspace_members" ON workspace_members
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Owners and admins can insert members" ON workspace_members
  FOR INSERT WITH CHECK (is_workspace_admin(workspace_id));

CREATE POLICY "Owners and admins can delete members" ON workspace_members
  FOR DELETE USING (is_workspace_admin(workspace_id));
