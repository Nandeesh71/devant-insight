-- Migration: Add user_id to projects table
-- This links projects to users so they persist across login sessions

-- Add user_id column to projects table
ALTER TABLE projects
ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Add comment
COMMENT ON COLUMN projects.user_id IS 'Links project to the user who created/owns it';
