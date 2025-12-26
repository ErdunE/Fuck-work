-- Migration: Add cognito_sub column to users table
-- Run this on RDS to support Cognito authentication

-- Add cognito_sub column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS cognito_sub VARCHAR(255) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_cognito_sub ON users(cognito_sub);

-- Verify
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'cognito_sub';
