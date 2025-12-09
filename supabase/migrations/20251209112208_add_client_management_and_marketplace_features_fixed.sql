/*
  # Add Client Management and Marketplace Features

  ## Overview
  Comprehensive schema for multi-tenant client management, product categorization,
  marketplace syndication, and promotional features.

  ## New Tables

  1. **clients**
     - Client organizations managed by admin
     - Cloudinary folder paths, branding settings
     - API credentials and business rules

  2. **categories**
     - Product categorization hierarchy
     - Support for parent-child relationships
     - SEO metadata and thumbnails

  3. **brands**
     - Brand information and metadata
     - Logo URLs and descriptions

  4. **vendors**
     - Vendor/supplier information
     - Contact details and metadata

  5. **product_metadata**
     - Extended product information (SKU, MPN, UPC, EAN)
     - Category, brand, and vendor relationships
     - Pricing and inventory details

  6. **promotional_tags**
     - Gift tags, discount offers
     - Validity periods and scope (category/brand-specific)
     - Auto-apply rules

  7. **marketplace_operations**
     - Syndication operations tracking
     - Infographic creation, resizing, 360 spin, etc.
     - Bulk operation support

  8. **ai_prompts**
     - LLM prompts for image optimization
     - Template library and user-specific prompts
     - Result tracking

  9. **ar_assets**
     - Augmented reality asset management
     - USDZ, GLB files for AR experiences
     - iOS/Android compatibility tracking

  ## Changes to Existing Tables

  1. **profiles**
     - Add client_id for client association
     - Add settings JSONB for user preferences

  2. **images**
     - Add SKU, MPN fields for searchability
     - Add category_id, brand_id references
     - Add promotional_tag_id reference

  3. **products**
     - Add extended metadata references

  ## Security
  - RLS policies for multi-tenant isolation
  - Admins can manage all clients
  - Clients can only access their own data
  - Role-based access control

  ## Indexes
  - Performance indexes on frequently queried columns
  - Full-text search support for SKU/MPN
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  company_code text UNIQUE NOT NULL,
  cloudinary_folder text,
  logo_url text,
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#1E40AF',
  business_rules jsonb DEFAULT '{}',
  api_credentials jsonb DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Update profiles table with client association
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'settings'
  ) THEN
    ALTER TABLE profiles ADD COLUMN settings jsonb DEFAULT '{}';
  END IF;
END $$;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  thumbnail_url text,
  display_order integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, slug)
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories of their client"
  ON categories FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE profiles.id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
    )
  );

-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  logo_url text,
  description text,
  website_url text,
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, slug)
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view brands of their client"
  ON brands FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE profiles.id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert brands"
  ON brands FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins can update brands"
  ON brands FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
    )
  );

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  contact_email text,
  contact_phone text,
  address text,
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, code)
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vendors of their client"
  ON vendors FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE profiles.id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert vendors"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
    )
  );

-- Create product_metadata table
CREATE TABLE IF NOT EXISTS product_metadata (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  sku text,
  mpn text,
  upc text,
  ean text,
  gtin text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  msrp numeric(10,2),
  cost numeric(10,2),
  weight numeric(10,2),
  dimensions jsonb DEFAULT '{}',
  inventory_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view product metadata of their products"
  ON product_metadata FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_metadata.product_id
      AND products.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert product metadata for their products"
  ON product_metadata FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_metadata.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update product metadata for their products"
  ON product_metadata FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_metadata.product_id
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_metadata.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Update images table with SKU/MPN and category/brand
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'sku'
  ) THEN
    ALTER TABLE images ADD COLUMN sku text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'mpn'
  ) THEN
    ALTER TABLE images ADD COLUMN mpn text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE images ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE images ADD COLUMN brand_id uuid REFERENCES brands(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create promotional_tags table
CREATE TABLE IF NOT EXISTS promotional_tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  tag_type text NOT NULL CHECK (tag_type IN ('gift', 'discount', 'new', 'sale', 'featured')),
  discount_percentage numeric(5,2),
  applicable_to text CHECK (applicable_to IN ('all', 'category', 'brand', 'product')),
  scope_id uuid,
  valid_from timestamptz,
  valid_until timestamptz,
  badge_color text DEFAULT '#EF4444',
  badge_text text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE promotional_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view promotional tags of their client"
  ON promotional_tags FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE profiles.id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage promotional tags"
  ON promotional_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
    )
  );

-- Add promotional_tag_id to images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'promotional_tag_id'
  ) THEN
    ALTER TABLE images ADD COLUMN promotional_tag_id uuid REFERENCES promotional_tags(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create marketplace_operations table
CREATE TABLE IF NOT EXISTS marketplace_operations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  operation_type text NOT NULL CHECK (operation_type IN (
    'infographic', 'resize', '360-spin', 'bg-remove', 'bulk-edit',
    'color-correction', 'watermark', 'compress'
  )),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input_images jsonb DEFAULT '[]',
  output_images jsonb DEFAULT '[]',
  parameters jsonb DEFAULT '{}',
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own marketplace operations"
  ON marketplace_operations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert marketplace operations"
  ON marketplace_operations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own marketplace operations"
  ON marketplace_operations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create ai_prompts table
CREATE TABLE IF NOT EXISTS ai_prompts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  prompt_text text NOT NULL,
  prompt_type text CHECK (prompt_type IN ('optimization', 'enhancement', 'generation', 'analysis')),
  parameters jsonb DEFAULT '{}',
  is_template boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  success_rate numeric(5,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prompts and templates"
  ON ai_prompts FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    is_template = true OR
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own prompts"
  ON ai_prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts"
  ON ai_prompts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create ar_assets table
CREATE TABLE IF NOT EXISTS ar_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  model_id uuid REFERENCES models_3d(id) ON DELETE CASCADE,
  usdz_url text,
  glb_url text,
  ios_compatible boolean DEFAULT false,
  android_compatible boolean DEFAULT false,
  file_size_mb numeric(10,2),
  preview_image_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ar_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AR assets"
  ON ar_assets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AR assets"
  ON ar_assets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AR assets"
  ON ar_assets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_categories_client_id ON categories(client_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_brands_client_id ON brands(client_id);
CREATE INDEX IF NOT EXISTS idx_vendors_client_id ON vendors(client_id);
CREATE INDEX IF NOT EXISTS idx_product_metadata_sku ON product_metadata(sku);
CREATE INDEX IF NOT EXISTS idx_product_metadata_mpn ON product_metadata(mpn);
CREATE INDEX IF NOT EXISTS idx_product_metadata_category ON product_metadata(category_id);
CREATE INDEX IF NOT EXISTS idx_product_metadata_brand ON product_metadata(brand_id);
CREATE INDEX IF NOT EXISTS idx_images_sku ON images(sku);
CREATE INDEX IF NOT EXISTS idx_images_mpn ON images(mpn);
CREATE INDEX IF NOT EXISTS idx_images_category ON images(category_id);
CREATE INDEX IF NOT EXISTS idx_images_brand ON images(brand_id);
CREATE INDEX IF NOT EXISTS idx_promotional_tags_client ON promotional_tags(client_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_ops_user ON marketplace_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_ops_client ON marketplace_operations(client_id);
CREATE INDEX IF NOT EXISTS idx_ar_assets_product ON ar_assets(product_id);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_product_metadata_sku_trgm ON product_metadata USING gin(sku gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_product_metadata_mpn_trgm ON product_metadata USING gin(mpn gin_trgm_ops);