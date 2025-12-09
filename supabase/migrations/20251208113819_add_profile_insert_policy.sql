/*
  # Fix Profile Creation Issue

  ## Problem
  Users cannot insert their own profiles because there's no INSERT policy on the profiles table.
  This causes foreign key violations when trying to create uploads since uploads.user_id references profiles.id.

  ## Solution
  Add INSERT policy to allow authenticated users to create their own profile during signup.

  ## Changes
  1. Add INSERT policy for profiles table
     - Allow authenticated users to insert their own profile record
     - Ensures user_id matches auth.uid()
*/

-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
