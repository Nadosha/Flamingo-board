-- ============================================================
-- Real-Time Collaboration Board — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

-- Auto-create profile on user sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Workspaces
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

-- Workspace members
create table if not exists workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz default now() not null,
  primary key (workspace_id, user_id)
);

-- Auto-add owner as member when workspace is created
create or replace function handle_new_workspace()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

drop trigger if exists on_workspace_created on workspaces;
create trigger on_workspace_created
  after insert on workspaces
  for each row execute function handle_new_workspace();

-- Workspace invites (magic links)
create table if not exists workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  invited_by uuid references auth.users(id) on delete cascade not null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  email text,
  expires_at timestamptz default (now() + interval '7 days') not null,
  created_at timestamptz default now() not null
);

-- Boards
create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  name text not null,
  description text,
  color text not null default '#0079bf',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Columns
create table if not exists columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id) on delete cascade not null,
  name text not null,
  position integer not null default 0,
  created_at timestamptz default now() not null
);

-- Labels
create table if not exists labels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  name text not null,
  color text not null default '#61bd4f'
);

-- Cards
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid references columns(id) on delete cascade not null,
  title text not null,
  description text,
  position integer not null default 0,
  due_date timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Card assignees
create table if not exists card_assignees (
  card_id uuid references cards(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  primary key (card_id, user_id)
);

-- Card labels
create table if not exists card_labels (
  card_id uuid references cards(id) on delete cascade not null,
  label_id uuid references labels(id) on delete cascade not null,
  primary key (card_id, label_id)
);

-- Activity log
create table if not exists card_activities (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  type text not null,
  content text,
  metadata jsonb,
  created_at timestamptz default now() not null
);

-- ============================================================
-- Enable Realtime for live updates
-- ============================================================
alter publication supabase_realtime add table columns;
alter publication supabase_realtime add table cards;
alter publication supabase_realtime add table card_assignees;
alter publication supabase_realtime add table card_labels;
alter publication supabase_realtime add table card_activities;
alter publication supabase_realtime add table workspace_members;

-- ============================================================
-- Row Level Security (Workspace Isolation)
-- ============================================================

-- Profiles: users can read all profiles, only update their own
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Workspaces: viewable/manageable only by members
alter table workspaces enable row level security;
create policy "Workspace members can view workspaces" on workspaces
  for select using (
    exists (
      select 1 from workspace_members
      where workspace_id = workspaces.id and user_id = auth.uid()
    )
  );
create policy "Authenticated users can create workspaces" on workspaces
  for insert with check (auth.uid() = owner_id);
create policy "Owners and admins can update workspaces" on workspaces
  for update using (
    exists (
      select 1 from workspace_members
      where workspace_id = workspaces.id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );
create policy "Only owners can delete workspaces" on workspaces
  for delete using (auth.uid() = owner_id);

-- Workspace members
alter table workspace_members enable row level security;
create policy "Members can view workspace_members" on workspace_members
  for select using (
    exists (
      select 1 from workspace_members wm2
      where wm2.workspace_id = workspace_members.workspace_id and wm2.user_id = auth.uid()
    )
  );
create policy "Owners and admins can manage members" on workspace_members
  for insert with check (
    exists (
      select 1 from workspace_members
      where workspace_id = workspace_members.workspace_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- Workspace invites
alter table workspace_invites enable row level security;
create policy "Members can view invites for their workspaces" on workspace_invites
  for select using (
    exists (
      select 1 from workspace_members
      where workspace_id = workspace_invites.workspace_id and user_id = auth.uid()
    )
  );
create policy "Admins and owners can create invites" on workspace_invites
  for insert with check (
    exists (
      select 1 from workspace_members
      where workspace_id = workspace_invites.workspace_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );
-- Allow anyone to look up invite by token (for joining)
create policy "Anyone can look up invite by token" on workspace_invites
  for select using (token is not null);

-- Boards
alter table boards enable row level security;
create policy "Workspace members can view boards" on boards
  for select using (
    exists (
      select 1 from workspace_members
      where workspace_id = boards.workspace_id and user_id = auth.uid()
    )
  );
create policy "Workspace members can create boards" on boards
  for insert with check (
    exists (
      select 1 from workspace_members
      where workspace_id = boards.workspace_id and user_id = auth.uid()
    )
  );
create policy "Workspace members can update boards" on boards
  for update using (
    exists (
      select 1 from workspace_members
      where workspace_id = boards.workspace_id and user_id = auth.uid()
    )
  );
create policy "Owners and admins can delete boards" on boards
  for delete using (
    exists (
      select 1 from workspace_members
      where workspace_id = boards.workspace_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- Columns
alter table columns enable row level security;
create policy "Workspace members can manage columns" on columns
  for all using (
    exists (
      select 1 from boards b
      join workspace_members wm on wm.workspace_id = b.workspace_id
      where b.id = columns.board_id and wm.user_id = auth.uid()
    )
  );

-- Labels
alter table labels enable row level security;
create policy "Workspace members can manage labels" on labels
  for all using (
    exists (
      select 1 from workspace_members
      where workspace_id = labels.workspace_id and user_id = auth.uid()
    )
  );

-- Cards
alter table cards enable row level security;
create policy "Workspace members can manage cards" on cards
  for all using (
    exists (
      select 1 from columns c
      join boards b on b.id = c.board_id
      join workspace_members wm on wm.workspace_id = b.workspace_id
      where c.id = cards.column_id and wm.user_id = auth.uid()
    )
  );

-- Card assignees
alter table card_assignees enable row level security;
create policy "Workspace members can manage card assignees" on card_assignees
  for all using (
    exists (
      select 1 from cards ca
      join columns c on c.id = ca.column_id
      join boards b on b.id = c.board_id
      join workspace_members wm on wm.workspace_id = b.workspace_id
      where ca.id = card_assignees.card_id and wm.user_id = auth.uid()
    )
  );

-- Card labels
alter table card_labels enable row level security;
create policy "Workspace members can manage card labels" on card_labels
  for all using (
    exists (
      select 1 from cards ca
      join columns c on c.id = ca.column_id
      join boards b on b.id = c.board_id
      join workspace_members wm on wm.workspace_id = b.workspace_id
      where ca.id = card_labels.card_id and wm.user_id = auth.uid()
    )
  );

-- Card activities
alter table card_activities enable row level security;
create policy "Workspace members can view card activities" on card_activities
  for select using (
    exists (
      select 1 from cards ca
      join columns c on c.id = ca.column_id
      join boards b on b.id = c.board_id
      join workspace_members wm on wm.workspace_id = b.workspace_id
      where ca.id = card_activities.card_id and wm.user_id = auth.uid()
    )
  );
create policy "Workspace members can insert card activities" on card_activities
  for insert with check (
    exists (
      select 1 from cards ca
      join columns c on c.id = ca.column_id
      join boards b on b.id = c.board_id
      join workspace_members wm on wm.workspace_id = b.workspace_id
      where ca.id = card_activities.card_id and wm.user_id = auth.uid()
    )
  );
