-- ============================================================
-- TrackHour - Initial Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- TEAMS
-- ============================================================
create table public.teams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text default 'free' check (plan in ('free', 'premium', 'business')) not null,
  plan_status text,
  plan_period_end timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
create table public.team_members (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  invited_email text not null,
  role text default 'member' check (role in ('owner', 'admin', 'member')) not null,
  status text default 'pending' check (status in ('pending', 'active')) not null,
  invitation_token text unique,
  invited_at timestamptz default now() not null,
  joined_at timestamptz,
  unique(team_id, invited_email)
);

-- ============================================================
-- CLIENTS
-- ============================================================
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  name text not null,
  color text default '#3333FF',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- PROJECTS
-- ============================================================
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  team_id uuid references public.teams(id) on delete cascade not null,
  name text not null,
  color text default '#3333FF' not null,
  is_private boolean default false not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- TASKS
-- ============================================================
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  daily_rate numeric(10,2),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- TIME ENTRIES
-- ============================================================
create table public.time_entries (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  description text,
  started_at timestamptz not null,
  ended_at timestamptz, -- NULL = currently running
  created_at timestamptz default now() not null
);

-- Prevent multiple running timers per user
create unique index one_running_timer_per_user
  on public.time_entries (user_id)
  where ended_at is null;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger handle_updated_at before update on public.teams
  for each row execute function public.handle_updated_at();
create trigger handle_updated_at before update on public.clients
  for each row execute function public.handle_updated_at();
create trigger handle_updated_at before update on public.projects
  for each row execute function public.handle_updated_at();
create trigger handle_updated_at before update on public.tasks
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.time_entries enable row level security;

-- PROFILES
create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- TEAMS: owner or member can view
create policy "Team members can view their teams"
  on public.teams for select using (
    id in (
      select team_id from public.team_members
      where user_id = auth.uid() and status = 'active'
    )
    or owner_id = auth.uid()
  );
create policy "Users can create teams"
  on public.teams for insert with check (owner_id = auth.uid());
create policy "Owners can update their team"
  on public.teams for update using (owner_id = auth.uid());
create policy "Owners can delete their team"
  on public.teams for delete using (owner_id = auth.uid());

-- TEAM_MEMBERS
create policy "Team members can view their team members"
  on public.team_members for select using (
    team_id in (
      select team_id from public.team_members
      where user_id = auth.uid() and status = 'active'
    )
    or team_id in (select id from public.teams where owner_id = auth.uid())
  );
create policy "Team owners can manage members"
  on public.team_members for all using (
    team_id in (select id from public.teams where owner_id = auth.uid())
  );
create policy "Users can accept their invitation"
  on public.team_members for update using (
    invited_email = (select email from public.profiles where id = auth.uid())
  );

-- CLIENTS
create policy "Team members can view clients"
  on public.clients for select using (
    team_id in (
      select team_id from public.team_members
      where user_id = auth.uid() and status = 'active'
    )
    or team_id in (select id from public.teams where owner_id = auth.uid())
  );
create policy "Team members can create clients"
  on public.clients for insert with check (
    team_id in (
      select team_id from public.team_members
      where user_id = auth.uid() and status = 'active'
    )
    or team_id in (select id from public.teams where owner_id = auth.uid())
  );
create policy "Creators and owners can update clients"
  on public.clients for update using (
    created_by = auth.uid()
    or team_id in (select id from public.teams where owner_id = auth.uid())
  );
create policy "Creators and owners can delete clients"
  on public.clients for delete using (
    created_by = auth.uid()
    or team_id in (select id from public.teams where owner_id = auth.uid())
  );

-- PROJECTS
create policy "Team members can view non-private projects"
  on public.projects for select using (
    (
      team_id in (
        select team_id from public.team_members
        where user_id = auth.uid() and status = 'active'
      )
      and is_private = false
    )
    or created_by = auth.uid()
    or team_id in (select id from public.teams where owner_id = auth.uid())
  );
create policy "Team members can create projects"
  on public.projects for insert with check (
    team_id in (
      select team_id from public.team_members
      where user_id = auth.uid() and status = 'active'
    )
    or team_id in (select id from public.teams where owner_id = auth.uid())
  );
create policy "Creators and owners can update projects"
  on public.projects for update using (
    created_by = auth.uid()
    or team_id in (select id from public.teams where owner_id = auth.uid())
  );
create policy "Creators and owners can delete projects"
  on public.projects for delete using (
    created_by = auth.uid()
    or team_id in (select id from public.teams where owner_id = auth.uid())
  );

-- TASKS
create policy "Project members can view tasks"
  on public.tasks for select using (
    project_id in (select id from public.projects)
  );
create policy "Project members can create tasks"
  on public.tasks for insert with check (
    project_id in (select id from public.projects)
  );
create policy "Creators can update tasks"
  on public.tasks for update using (created_by = auth.uid());
create policy "Creators can delete tasks"
  on public.tasks for delete using (created_by = auth.uid());

-- TIME ENTRIES
create policy "Users can view their own time entries"
  on public.time_entries for select using (user_id = auth.uid());
create policy "Team owners can view all team entries"
  on public.time_entries for select using (
    project_id in (
      select p.id from public.projects p
      join public.teams t on t.id = p.team_id
      where t.owner_id = auth.uid()
    )
  );
create policy "Users can create their own time entries"
  on public.time_entries for insert with check (user_id = auth.uid());
create policy "Users can update their own time entries"
  on public.time_entries for update using (user_id = auth.uid());
create policy "Users can delete their own time entries"
  on public.time_entries for delete using (user_id = auth.uid());

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_team_members_user_id on public.team_members(user_id);
create index idx_team_members_team_id on public.team_members(team_id);
create index idx_clients_team_id on public.clients(team_id);
create index idx_projects_client_id on public.projects(client_id);
create index idx_projects_team_id on public.projects(team_id);
create index idx_tasks_project_id on public.tasks(project_id);
create index idx_time_entries_user_id on public.time_entries(user_id);
create index idx_time_entries_project_id on public.time_entries(project_id);
create index idx_time_entries_started_at on public.time_entries(started_at);
create index idx_time_entries_running on public.time_entries(user_id) where ended_at is null;
