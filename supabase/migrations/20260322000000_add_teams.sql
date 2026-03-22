-- Teams (one per Business/Enterprise subscription)
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id text, -- Stripe subscription ID
  plan text NOT NULL DEFAULT 'business', -- 'business' | 'enterprise'
  max_seats integer NOT NULL DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Team members (seats)
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member', -- 'admin' | 'member'
  status text NOT NULL DEFAULT 'active', -- 'active' | 'deactivated'
  invited_email text, -- email used to send invite
  joined_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Invitations
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  invited_by uuid REFERENCES auth.users(id),
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, email)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Teams RLS policies
-- Owner and members can read their team
CREATE POLICY "Team members can view their team"
  ON public.teams FOR SELECT
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
        AND team_members.status = 'active'
    )
  );

-- Only owner can update team
CREATE POLICY "Owner can update their team"
  ON public.teams FOR UPDATE
  USING (auth.uid() = owner_id);

-- Owner can insert team (via API with service role, but allow for completeness)
CREATE POLICY "Owner can insert team"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Team members RLS policies
-- Members can read all members of their team
CREATE POLICY "Team members can view team members"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members AS tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
    )
  );

-- Team admins can insert members
CREATE POLICY "Team admins can insert members"
  ON public.team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members AS tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
    )
    -- Also allow inserting yourself (joining via invitation)
    OR team_members.user_id = auth.uid()
  );

-- Team admins can update members
CREATE POLICY "Team admins can update members"
  ON public.team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members AS tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
    )
  );

-- Team admins can delete members
CREATE POLICY "Team admins can delete members"
  ON public.team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members AS tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
    )
  );

-- Team invitations RLS policies
-- Team admins can create invitations
CREATE POLICY "Team admins can create invitations"
  ON public.team_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'admin'
    )
  );

-- Invited email can read by token (handled via service role in API)
-- Team admins can read all team invitations
CREATE POLICY "Team admins can view invitations"
  ON public.team_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'admin'
    )
  );

-- Team admins can update (revoke) invitations
CREATE POLICY "Team admins can update invitations"
  ON public.team_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'admin'
    )
  );
