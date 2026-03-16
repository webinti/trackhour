-- Fix team_members SELECT policy to avoid circular self-reference
-- Old policy required user to already be in team_members to read team_members (recursive)
-- New policy: also allow users to see rows where user_id = their own id

drop policy if exists "Team members can view their team members" on public.team_members;

-- Simplified policy without self-reference (avoids infinite recursion)
create policy "Team members can view their team members"
  on public.team_members for select using (
    user_id = auth.uid()
    or team_id in (select id from public.teams where owner_id = auth.uid())
  );
