-- Seed data for development and testing

-- Create a test user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'test@example.com',
  '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Test User"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Add any additional seed data below 