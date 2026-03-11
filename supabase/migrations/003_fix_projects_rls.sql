-- ============================================================
-- Fix RLS on projects table
-- Re-enable RLS and simplify policies so the owner can always
-- read/write their team's projects regardless of team_members.
-- ============================================================

alter table public.projects enable row level security;

-- Drop existing policies
drop policy if exists "Team members can view non-private projects" on public.projects;
drop policy if exists "Team members can create projects" on public.projects;
drop policy if exists "Creators and owners can update projects" on public.projects;
drop policy if exists "Creators and owners can delete projects" on public.projects;

-- Helper: is the user a member or owner of the given team?
-- We check BOTH team_members (for invited members) AND teams.owner_id (for the owner
-- who may not have a team_members row).

create policy "Team members can view non-private projects"
  on public.projects for select using (
    -- Owner of the team can always see everything
    team_id in (select id from public.teams where owner_id = auth.uid())
    -- Creator of the project can always see it (even if private)
    or created_by = auth.uid()
    -- Active members can see non-private projects
    or (
      is_private = false
      and team_id in (
        select team_id from public.team_members
        where user_id = auth.uid() and status = 'active'
      )
    )
  );

create policy "Team members can create projects"
  on public.projects for insert with check (
    team_id in (select id from public.teams where owner_id = auth.uid())
    or team_id in (
      select team_id from public.team_members
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Creators and owners can update projects"
  on public.projects for update using (
    team_id in (select id from public.teams where owner_id = auth.uid())
    or created_by = auth.uid()
  );

create policy "Creators and owners can delete projects"
  on public.projects for delete using (
    team_id in (select id from public.teams where owner_id = auth.uid())
    or created_by = auth.uid()
  );
