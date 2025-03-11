# Supabase Setup Guide

This guide provides instructions for setting up Supabase for the Supa-SaaS project, including database configuration, authentication, and Row Level Security (RLS) policies.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Basic understanding of PostgreSQL
- Node.js and npm installed

## Creating a Supabase Project

1. Log in to the Supabase dashboard
2. Click "New Project"
3. Enter a name for your project
4. Choose a database password (store this securely)
5. Select a region close to your users
6. Click "Create New Project"

Wait for the project to be created. This might take a few minutes.

## Environment Variables

After creating your Supabase project, you'll need to configure environment variables for your local development environment:

1. Find the API URL and API Key from your Supabase project dashboard:
   - API URL: Project Settings > API > Project URL
   - API Key: Project Settings > API > Project API Keys > `anon` public key and `service_role` key

2. Copy the `.env.example` files to `.env.local` for each package:
   ```bash
   cp apps/api/.env.example apps/api/.env.local
   cp apps/web/.env.example apps/web/.env.local
   ```

3. Update the environment variables with your Supabase credentials:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase project anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase project service role key

## Database Schema Setup

The Supa-SaaS project requires several tables in your Supabase database. You can set these up using the SQL editor in the Supabase dashboard.

### Option 1: Using Migrations

The project includes database migrations that you can run to set up the schema:

```bash
cd packages/database
npm run migration:up
```

### Option 2: Manual Setup

Alternatively, you can run the following SQL commands in the Supabase SQL editor:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  is_personal BOOLEAN DEFAULT FALSE,
  personal_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT DEFAULT 'free',
  subscription_id TEXT,
  max_members INTEGER DEFAULT 5,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON public.team_members (team_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON public.team_members (user_id);
CREATE INDEX IF NOT EXISTS team_invitations_team_id_idx ON public.team_invitations (team_id);
CREATE INDEX IF NOT EXISTS team_invitations_email_idx ON public.team_invitations (email);
CREATE INDEX IF NOT EXISTS team_invitations_token_idx ON public.team_invitations (token);
```

## Setting Up Row Level Security (RLS)

Supabase uses Row Level Security to control access to your data. Here are the RLS policies for the Supa-SaaS project:

### Profiles Table

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow service role to manage all profiles
CREATE POLICY "Service role can do anything with profiles"
  ON public.profiles
  USING (auth.role() = 'service_role');
```

### Teams Table

```sql
-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Allow team members to read teams they belong to
CREATE POLICY "Team members can read teams they belong to"
  ON public.teams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

-- Allow users to create teams
CREATE POLICY "Users can create teams"
  ON public.teams
  FOR INSERT
  WITH CHECK (true);

-- Allow team owners and admins to update teams
CREATE POLICY "Team owners and admins can update teams"
  ON public.teams
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- Allow team owners to delete teams
CREATE POLICY "Team owners can delete teams"
  ON public.teams
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'owner'
    )
  );

-- Allow service role to manage all teams
CREATE POLICY "Service role can do anything with teams"
  ON public.teams
  USING (auth.role() = 'service_role');
```

### Team Members Table

```sql
-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Allow team members to read team members from teams they belong to
CREATE POLICY "Team members can read team members from teams they belong to"
  ON public.team_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members AS tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
    )
  );

-- Allow team owners and admins to create team members
CREATE POLICY "Team owners and admins can create team members"
  ON public.team_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members AS tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Allow team owners and admins to update team members
CREATE POLICY "Team owners and admins can update team members"
  ON public.team_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members AS tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Allow team owners and admins to delete team members
CREATE POLICY "Team owners and admins can delete team members"
  ON public.team_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members AS tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Prevent owners from downgrading or removing themselves
CREATE POLICY "Owners cannot downgrade or remove themselves"
  ON public.team_members
  FOR UPDATE
  USING (
    NOT (
      team_members.user_id = auth.uid() AND
      team_members.role = 'owner'
    )
  );

-- Allow service role to manage all team members
CREATE POLICY "Service role can do anything with team members"
  ON public.team_members
  USING (auth.role() = 'service_role');
```

### Team Invitations Table

```sql
-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Allow team owners and admins to read invitations for their teams
CREATE POLICY "Team owners and admins can read invitations for their teams"
  ON public.team_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = team_invitations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- Allow invited users to read their own invitations
CREATE POLICY "Invited users can read their own invitations"
  ON public.team_invitations
  FOR SELECT
  USING (
    auth.email() = team_invitations.email
  );

-- Allow team owners and admins to create invitations
CREATE POLICY "Team owners and admins can create invitations"
  ON public.team_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = team_invitations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- Allow team owners and admins to delete invitations
CREATE POLICY "Team owners and admins can delete invitations"
  ON public.team_invitations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = team_invitations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- Allow service role to manage all invitations
CREATE POLICY "Service role can do anything with invitations"
  ON public.team_invitations
  USING (auth.role() = 'service_role');
```

## Setting Up Authentication

Supabase Auth is already set up when you create a project. For the Supa-SaaS project, you might want to configure:

1. Email authentication (enabled by default)
2. OAuth providers (optional)
3. Email templates (for invitation emails)

### Configure OAuth Providers (Optional)

1. Go to Authentication > Providers
2. Enable and configure the OAuth providers you want to use (Google, GitHub, etc.)
3. Add the redirect URLs for your application

### Email Templates

1. Go to Authentication > Email Templates
2. Customize the invitation email template to include information about the team invitation

## Database Functions and Triggers

The Supa-SaaS project uses several PostgreSQL functions and triggers:

### Create Profile on User Creation

This trigger creates a profile when a new user is created:

```sql
-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Generate Unique Slug for Teams

This function generates a unique slug for each team:

```sql
-- Function to generate a unique slug
CREATE OR REPLACE FUNCTION public.generate_unique_slug(name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special characters
  base_slug := lower(regexp_replace(name, '[^a-zA-Z0-9 ]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  
  -- Initialize slug to base_slug
  slug := base_slug;
  
  -- Check if slug exists, if so, append a number
  WHILE EXISTS (SELECT 1 FROM public.teams WHERE slug = slug) LOOP
    counter := counter + 1;
    slug := base_slug || '-' || counter::TEXT;
  END LOOP;
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set slug before insert
CREATE OR REPLACE FUNCTION public.set_team_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_unique_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_team_insert
  BEFORE INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.set_team_slug();
```

## Testing Your Setup

After setting up your Supabase project, you can test it using the Supa-SaaS API:

1. Start the API server:
   ```bash
   cd apps/api
   npm run dev
   ```

2. Run the tests:
   ```bash
   npm test
   ```

If the tests pass, your Supabase setup is correct!

## Common Issues and Troubleshooting

### Issue: Row Level Security blocking access

If you're getting 403 Forbidden errors, it may be due to RLS policies:
1. Check that you're authenticated
2. Verify that the user has the correct permissions
3. Check the RLS policies for the affected table

### Issue: Foreign key constraints failing

If you're seeing foreign key constraint errors:
1. Ensure you're creating tables in the correct order
2. Check that referenced records exist
3. Use CASCADE for deletion if appropriate

### Issue: Authentication problems

If authentication is not working:
1. Check your Supabase URL and API keys
2. Verify that the authentication method is enabled in Supabase
3. Check for CORS issues if using a web frontend

## Next Steps

After setting up Supabase, you can:

1. Create an initial admin user for your application
2. Configure additional authentication methods
3. Set up a development workflow for schema changes
4. Add custom functions and triggers for your specific needs 