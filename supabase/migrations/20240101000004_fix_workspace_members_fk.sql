-- Fix workspace_members.user_id FK to reference public.profiles instead of auth.users
-- PostgREST can only resolve JOINs within the public schema

ALTER TABLE workspace_members
  DROP CONSTRAINT workspace_members_user_id_fkey;

ALTER TABLE workspace_members
  ADD CONSTRAINT workspace_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
