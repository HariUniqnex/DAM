/*
  # Add Image Processing Statistics Tracking

  ## Overview
  This migration adds comprehensive tracking for image processing operations and statistics.

  ## New Tables
  
  1. **image_processing_operations**
     - Tracks individual processing operations on images
     - Records operation type, status, input/output URLs
     - Links to images and jobs tables

  2. **processing_statistics**
     - Aggregated statistics per user
     - Total uploads, total processed, counts by operation type
     - Real-time dashboard metrics

  ## Changes to Existing Tables
  
  1. **images**
     - Add `cloudinary_public_id` for Cloudinary integration
     - Add `processed_url` for storing processed image URLs
     - Add `processing_status` to track processing state
     - Add `operations_applied` JSONB array to track applied operations
  
  ## Security
  - Enable RLS on all new tables
  - Users can only view their own statistics and operations
  - Policies enforce user ownership

  ## Indexes
  - Add indexes for performance on frequently queried columns
*/

-- Add columns to images table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'cloudinary_public_id'
  ) THEN
    ALTER TABLE images ADD COLUMN cloudinary_public_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'processed_url'
  ) THEN
    ALTER TABLE images ADD COLUMN processed_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'processing_status'
  ) THEN
    ALTER TABLE images ADD COLUMN processing_status text DEFAULT 'pending' 
      CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'operations_applied'
  ) THEN
    ALTER TABLE images ADD COLUMN operations_applied jsonb DEFAULT '[]';
  END IF;
END $$;

-- Create image_processing_operations table
CREATE TABLE IF NOT EXISTS image_processing_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  image_id uuid REFERENCES images(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  operation_type text NOT NULL CHECK (operation_type IN (
    'resize', 'bg-remove', 'retouch', 'crop', 'compress',
    'lifestyle', 'infographic', 'line-diagram', 'swatch',
    'color-analysis', '3d-model', '360-spin', 'recolor',
    'configurator', 'pdf-extract'
  )),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input_url text NOT NULL,
  output_url text,
  cloudinary_public_id text,
  parameters jsonb DEFAULT '{}',
  error_message text,
  processing_time_ms integer,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE image_processing_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own processing operations"
  ON image_processing_operations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own processing operations"
  ON image_processing_operations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own processing operations"
  ON image_processing_operations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create processing_statistics table
CREATE TABLE IF NOT EXISTS processing_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_images_uploaded integer DEFAULT 0,
  total_images_processed integer DEFAULT 0,
  operation_counts jsonb DEFAULT '{}',
  last_updated timestamptz DEFAULT now()
);

ALTER TABLE processing_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own statistics"
  ON processing_statistics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statistics"
  ON processing_statistics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics"
  ON processing_statistics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_image_processing_ops_user_id ON image_processing_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_image_processing_ops_image_id ON image_processing_operations(image_id);
CREATE INDEX IF NOT EXISTS idx_image_processing_ops_type ON image_processing_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_image_processing_ops_status ON image_processing_operations(status);
CREATE INDEX IF NOT EXISTS idx_image_processing_ops_created_at ON image_processing_operations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_cloudinary_id ON images(cloudinary_public_id);
CREATE INDEX IF NOT EXISTS idx_images_processing_status ON images(processing_status);

-- Function to update statistics when processing operations complete
CREATE OR REPLACE FUNCTION update_processing_statistics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO processing_statistics (user_id, total_images_processed, operation_counts)
    VALUES (
      NEW.user_id,
      1,
      jsonb_build_object(NEW.operation_type, 1)
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_images_processed = processing_statistics.total_images_processed + 1,
      operation_counts = jsonb_set(
        processing_statistics.operation_counts,
        ARRAY[NEW.operation_type],
        to_jsonb(COALESCE((processing_statistics.operation_counts->>NEW.operation_type)::integer, 0) + 1)
      ),
      last_updated = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic statistics updates
DROP TRIGGER IF EXISTS trigger_update_processing_statistics ON image_processing_operations;
CREATE TRIGGER trigger_update_processing_statistics
  AFTER UPDATE ON image_processing_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_processing_statistics();

-- Function to update statistics when images are uploaded
CREATE OR REPLACE FUNCTION update_upload_statistics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO processing_statistics (user_id, total_images_uploaded)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    total_images_uploaded = processing_statistics.total_images_uploaded + 1,
    last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tracking uploads
DROP TRIGGER IF EXISTS trigger_update_upload_statistics ON images;
CREATE TRIGGER trigger_update_upload_statistics
  AFTER INSERT ON images
  FOR EACH ROW
  EXECUTE FUNCTION update_upload_statistics();