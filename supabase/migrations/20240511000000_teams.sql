-- Teams Feature SQL Migration
-- This migration adds tables, functions, triggers, and policies for team management.

-- Create ENUM types
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE public.subscription_tier AS ENUM ('free', 'basic', 'pro', 'enterprise');

-- Create Teams Table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  is_personal BOOLEAN NOT NULL DEFAULT FALSE,
  personal_user_id UUID REFERENCES auth.users(id),
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  subscription_id TEXT,
  max_members INTEGER NOT NULL DEFAULT 5,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Personal teams must have a personal_user_id
  CONSTRAINT personal_teams_have_user_id CHECK (
    (is_personal = FALSE) OR (is_personal = TRUE AND personal_user_id IS NOT NULL)
  )
);

-- Create Team Members Table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create Team Invitations Table
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, email)
);

-- Create Subscription Tiers Table
CREATE TABLE public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name subscription_tier NOT NULL UNIQUE,
  max_members INTEGER NOT NULL,
  max_resources JSONB,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER NOT NULL,
  features JSONB,
  is_team_plan BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Team Analytics Table (Optional)
CREATE TABLE public.team_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  active_users INTEGER NOT NULL DEFAULT 0,
  resource_usage JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, month)
);

-- Insert default subscription tiers
INSERT INTO public.subscription_tiers 
(name, max_members, max_resources, price_monthly, price_yearly, features, is_team_plan)
VALUES
('free', 5, '{"storage": 1073741824, "api_calls": 10000}', 0, 0, '["basic_features"]', true),
('basic', 10, '{"storage": 5368709120, "api_calls": 100000}', 1999, 19999, '["basic_features", "priority_support"]', true),
('pro', 20, '{"storage": 10737418240, "api_calls": 1000000}', 4999, 49999, '["basic_features", "priority_support", "advanced_features"]', true),
('enterprise', 100, '{"storage": 107374182400, "api_calls": 10000000}', 9999, 99999, '["basic_features", "priority_support", "advanced_features", "premium_features"]', true);

-- Function to auto-create a personal team on user signup
CREATE OR REPLACE FUNCTION public.create_personal_team()
RETURNS TRIGGER AS $$
DECLARE
  _user_id UUID;
  _user_email TEXT;
  _username TEXT;
  _personal_team_id UUID;
BEGIN
  _user_id := NEW.id;
  _user_email := NEW.email;
  
  -- Extract username from email
  _username := split_part(_user_email, '@', 1);
  
  -- Create personal team
  INSERT INTO public.teams (
    name, 
    slug, 
    is_personal, 
    personal_user_id,
    subscription_tier
  ) 
  VALUES (
    _username || '''s Team', 
    _username || '-' || _user_id,
    TRUE, 
    _user_id,
    'free'
  )
  RETURNING id INTO _personal_team_id;
  
  -- Add user as team owner
  INSERT INTO public.team_members (
    team_id,
    user_id,
    role
  )
  VALUES (
    _personal_team_id,
    _user_id,
    'owner'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create personal team on user creation
CREATE TRIGGER on_team_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_personal_team();

-- Function to validate member count before insertion
CREATE OR REPLACE FUNCTION public.validate_team_member_count()
RETURNS TRIGGER AS $$
DECLARE
  _team_max_members INTEGER;
  _current_member_count INTEGER;
  _is_personal BOOLEAN;
BEGIN
  -- Get team details
  SELECT max_members, is_personal INTO _team_max_members, _is_personal
  FROM public.teams
  WHERE id = NEW.team_id;
  
  -- Skip validation for personal teams
  IF _is_personal THEN
    RETURN NEW;
  END IF;
  
  -- Count current members
  SELECT COUNT(*) INTO _current_member_count
  FROM public.team_members
  WHERE team_id = NEW.team_id;
  
  -- Check if adding new member would exceed limit
  IF _current_member_count >= _team_max_members THEN
    RAISE EXCEPTION 'Team has reached the maximum number of members (%).',
      _team_max_members;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to validate member count
CREATE TRIGGER before_team_member_insert
BEFORE INSERT ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.validate_team_member_count();

-- Function to ensure team owner safety
CREATE OR REPLACE FUNCTION public.prevent_last_owner_removal()
RETURNS TRIGGER AS $$
DECLARE
  _owner_count INTEGER;
  _is_personal BOOLEAN;
BEGIN
  -- For DELETE operation
  IF (TG_OP = 'DELETE') THEN
    -- Get team details
    SELECT is_personal INTO _is_personal
    FROM public.teams
    WHERE id = OLD.team_id;
    
    -- Don't allow removal of owner from personal team
    IF _is_personal AND OLD.role = 'owner' THEN
      RAISE EXCEPTION 'Cannot remove the owner from a personal team.';
    END IF;
    
    -- Count remaining owners if deleting an owner
    IF OLD.role = 'owner' THEN
      SELECT COUNT(*) INTO _owner_count
      FROM public.team_members
      WHERE team_id = OLD.team_id AND role = 'owner' AND user_id != OLD.user_id;
      
      IF _owner_count = 0 THEN
        RAISE EXCEPTION 'Cannot remove the last owner of a team.';
      END IF;
    END IF;
    
    RETURN OLD;
  -- For UPDATE operation
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Get team details
    SELECT is_personal INTO _is_personal
    FROM public.teams
    WHERE id = NEW.team_id;
    
    -- Don't allow changing owner role in personal team
    IF _is_personal AND OLD.role = 'owner' AND NEW.role != 'owner' THEN
      RAISE EXCEPTION 'Cannot change the owner role in a personal team.';
    END IF;
    
    -- Count remaining owners if changing from owner role
    IF OLD.role = 'owner' AND NEW.role != 'owner' THEN
      SELECT COUNT(*) INTO _owner_count
      FROM public.team_members
      WHERE team_id = NEW.team_id AND role = 'owner' AND user_id != NEW.user_id;
      
      IF _owner_count = 0 THEN
        RAISE EXCEPTION 'Cannot change the role of the last owner of a team.';
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to prevent last owner removal
CREATE TRIGGER before_team_member_delete
BEFORE DELETE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.prevent_last_owner_removal();

CREATE TRIGGER before_team_member_update
BEFORE UPDATE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.prevent_last_owner_removal();

-- Function to generate updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER subscription_tiers_updated_at
BEFORE UPDATE ON public.subscription_tiers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER team_analytics_updated_at
BEFORE UPDATE ON public.team_analytics
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to prevent personal team deletion
CREATE OR REPLACE FUNCTION public.prevent_personal_team_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_personal = TRUE THEN
    RAISE EXCEPTION 'Personal teams cannot be deleted.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to prevent personal team deletion
CREATE TRIGGER before_team_delete
BEFORE DELETE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.prevent_personal_team_deletion();

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Teams Table
CREATE POLICY "Users can view teams they belong to" ON public.teams
FOR SELECT USING (
  id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create teams" ON public.teams
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND is_personal = FALSE
);

CREATE POLICY "Team owners can update their teams" ON public.teams
FOR UPDATE USING (
  id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "Team owners can delete non-personal teams" ON public.teams
FOR DELETE USING (
  id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  ) AND is_personal = FALSE
);

-- RLS Policies for Team Members Table
CREATE POLICY "Users can view members of teams they belong to" ON public.team_members
FOR SELECT USING (
  team_id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team owners and admins can add members" ON public.team_members
FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Team owners can update member roles" ON public.team_members
FOR UPDATE USING (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "Team admins can update non-owner and non-admin roles" ON public.team_members
FOR UPDATE USING (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
) WITH CHECK (
  role = 'member'
);

CREATE POLICY "Team owners and admins can remove members" ON public.team_members
FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ) AND user_id != auth.uid() -- Cannot remove yourself
);

-- RLS Policies for Team Invitations Table
CREATE POLICY "Team owners and admins can create invitations" ON public.team_invitations
FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ) AND created_by = auth.uid()
);

CREATE POLICY "Team owners and admins can view invitations" ON public.team_invitations
FOR SELECT USING (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Team owners and admins can delete invitations" ON public.team_invitations
FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- RLS Policies for Subscription Tiers Table
CREATE POLICY "Anyone can view subscription tiers" ON public.subscription_tiers
FOR SELECT USING (true);

-- RLS Policies for Team Analytics Table
CREATE POLICY "Team owners and admins can view team analytics" ON public.team_analytics
FOR SELECT USING (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Create function to check if a user is a team member
CREATE OR REPLACE FUNCTION public.is_team_member(team_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = $1 AND user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if a user has a specific role in a team
CREATE OR REPLACE FUNCTION public.has_team_role(team_id UUID, user_id UUID, required_role team_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = $1 AND user_id = $2 AND role = $3
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get a user's teams
CREATE OR REPLACE FUNCTION public.get_user_teams(user_id UUID)
RETURNS SETOF public.teams AS $$
BEGIN
  RETURN QUERY
    SELECT t.*
    FROM public.teams t
    JOIN public.team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify and process invitation acceptance
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token UUID, accepting_user_id UUID)
RETURNS UUID AS $$
DECLARE
  _invitation_id UUID;
  _team_id UUID;
  _role team_role;
  _email TEXT;
  _user_email TEXT;
BEGIN
  -- Get user's email
  SELECT email INTO _user_email
  FROM auth.users
  WHERE id = accepting_user_id;
  
  -- Find the invitation
  SELECT id, team_id, role, email INTO _invitation_id, _team_id, _role, _email
  FROM public.team_invitations
  WHERE token = invitation_token
    AND expires_at > NOW();
  
  -- Check if invitation exists and hasn't expired
  IF _invitation_id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or has expired';
  END IF;
  
  -- Check if invitation email matches user email
  IF _email != _user_email THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address';
  END IF;
  
  -- Check if user is already a team member
  IF public.is_team_member(_team_id, accepting_user_id) THEN
    RAISE EXCEPTION 'User is already a member of this team';
  END IF;
  
  -- Add user to team with the specified role
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (_team_id, accepting_user_id, _role);
  
  -- Delete the used invitation
  DELETE FROM public.team_invitations WHERE id = _invitation_id;
  
  RETURN _team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 