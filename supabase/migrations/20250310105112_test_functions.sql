-- Create SQL functions to help with testing
-- These functions are only meant to be used in testing environments

-- Function to execute SQL directly (for tests only)
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to disable RLS for tests
CREATE OR REPLACE FUNCTION public.disable_rls_for_tests(table_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_name);
  RETURN jsonb_build_object('success', true, 'message', 'RLS disabled for ' || table_name);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to enable RLS for tests
CREATE OR REPLACE FUNCTION public.enable_rls_for_tests(table_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  RETURN jsonb_build_object('success', true, 'message', 'RLS enabled for ' || table_name);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to create all required test tables
CREATE OR REPLACE FUNCTION public.create_test_tables()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create profiles table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      username TEXT UNIQUE,
      full_name TEXT,
      avatar_url TEXT,
      website TEXT,
      
      CONSTRAINT username_length CHECK (char_length(username) >= 3)
    );
  END IF;
  
  -- Create team role and subscription tier enums if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_role') THEN
    CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'member');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
    CREATE TYPE public.subscription_tier AS ENUM ('free', 'basic', 'pro', 'enterprise');
  END IF;
  
  -- Create teams table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teams') THEN
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
      CONSTRAINT personal_teams_have_user_id CHECK (
        (is_personal = FALSE) OR (is_personal = TRUE AND personal_user_id IS NOT NULL)
      )
    );
  END IF;
  
  -- Create team members table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_members') THEN
    CREATE TABLE public.team_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role team_role NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(team_id, user_id)
    );
  END IF;
  
  -- Create team invitations table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_invitations') THEN
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
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'Test tables created successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;