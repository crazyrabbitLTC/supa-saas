#!/bin/bash

# Setup Script
# This script sets up the project for development.
# Usage: ./scripts/setup.sh

set -e

echo "Setting up the project..."

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Set up environment variables
echo "Setting up environment variables..."
if [ ! -f .env.local ]; then
  echo "Creating .env.local from .env.example..."
  cp .env.example .env.local
else
  echo ".env.local already exists, skipping..."
fi

# Initialize Supabase
echo "Initializing Supabase..."
if ! command -v supabase &> /dev/null; then
  echo "Supabase CLI is not installed. Please install it first."
  echo "https://supabase.com/docs/guides/cli"
  exit 1
fi

# Initialize Supabase if not already initialized
if [ ! -f "supabase/config.toml" ]; then
  echo "Initializing Supabase project..."
  supabase init
else
  echo "Supabase project already initialized."
fi

# Start Supabase
echo "Starting Supabase..."
supabase start

# Generate Supabase types
echo "Generating Supabase types..."
pnpm supabase:gen:types

echo "Setup complete! You can now run the development server with:"
echo "pnpm dev" 