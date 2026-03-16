-- Fix card_assignees.user_id FK to reference public.profiles instead of auth.users
-- PostgREST can only resolve JOINs within the public schema

ALTER TABLE card_assignees
  DROP CONSTRAINT card_assignees_user_id_fkey;

ALTER TABLE card_assignees
  ADD CONSTRAINT card_assignees_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
