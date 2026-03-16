-- Fix card_activities.user_id FK to reference public.profiles instead of auth.users
-- PostgREST can only resolve JOINs within the public schema

ALTER TABLE card_activities
  DROP CONSTRAINT card_activities_user_id_fkey;

ALTER TABLE card_activities
  ADD CONSTRAINT card_activities_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
