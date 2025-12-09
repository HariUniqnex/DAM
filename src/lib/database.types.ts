export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'editor' | 'client'
          company: string | null
          avatar_url: string | null
          quota_limit: number
          quota_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'editor' | 'client'
          company?: string | null
          avatar_url?: string | null
          quota_limit?: number
          quota_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'editor' | 'client'
          company?: string | null
          avatar_url?: string | null
          quota_limit?: number
          quota_used?: number
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          category: string | null
          base_price: number | null
          sku: string | null
          is_public: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          category?: string | null
          base_price?: number | null
          sku?: string | null
          is_public?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          category?: string | null
          base_price?: number | null
          sku?: string | null
          is_public?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      product_components: {
        Row: {
          id: string
          product_id: string
          name: string
          type: 'leg' | 'cushion' | 'fabric' | 'hardware' | 'frame' | 'other'
          material: string | null
          is_default: boolean
          price_modifier: number
          mesh_url: string | null
          thumbnail_url: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          type: 'leg' | 'cushion' | 'fabric' | 'hardware' | 'frame' | 'other'
          material?: string | null
          is_default?: boolean
          price_modifier?: number
          mesh_url?: string | null
          thumbnail_url?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          type?: 'leg' | 'cushion' | 'fabric' | 'hardware' | 'frame' | 'other'
          material?: string | null
          is_default?: boolean
          price_modifier?: number
          mesh_url?: string | null
          thumbnail_url?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      uploads: {
        Row: {
          id: string
          user_id: string
          product_id: string | null
          status: 'uploaded' | 'processing' | 'completed' | 'failed'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id?: string | null
          status?: 'uploaded' | 'processing' | 'completed' | 'failed'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string | null
          status?: 'uploaded' | 'processing' | 'completed' | 'failed'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      images: {
        Row: {
          id: string
          upload_id: string
          user_id: string
          url: string
          thumbnail_url: string | null
          width: number | null
          height: number | null
          camera_angle: string | null
          exif_data: Json
          masks: Json
          embeddings_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          upload_id: string
          user_id: string
          url: string
          thumbnail_url?: string | null
          width?: number | null
          height?: number | null
          camera_angle?: string | null
          exif_data?: Json
          masks?: Json
          embeddings_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          upload_id?: string
          user_id?: string
          url?: string
          thumbnail_url?: string | null
          width?: number | null
          height?: number | null
          camera_angle?: string | null
          exif_data?: Json
          masks?: Json
          embeddings_id?: string | null
          created_at?: string
        }
      }
      textures: {
        Row: {
          id: string
          user_id: string
          name: string
          albedo_url: string
          normal_url: string | null
          roughness_url: string | null
          ao_url: string | null
          preview_url: string | null
          stain_color: string | null
          preserve_grain: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          albedo_url: string
          normal_url?: string | null
          roughness_url?: string | null
          ao_url?: string | null
          preview_url?: string | null
          stain_color?: string | null
          preserve_grain?: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          albedo_url?: string
          normal_url?: string | null
          roughness_url?: string | null
          ao_url?: string | null
          preview_url?: string | null
          stain_color?: string | null
          preserve_grain?: number
          metadata?: Json
          created_at?: string
        }
      }
      models_3d: {
        Row: {
          id: string
          user_id: string
          product_id: string
          upload_id: string | null
          name: string
          glb_url: string | null
          usdz_url: string | null
          fbx_url: string | null
          gltf_url: string | null
          generation_method: 'photogrammetry' | 'nerf' | 'single_image' | 'manual' | null
          quality_score: number | null
          polygon_count: number | null
          texture_id: string | null
          component_mapping: Json
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          upload_id?: string | null
          name: string
          glb_url?: string | null
          usdz_url?: string | null
          fbx_url?: string | null
          gltf_url?: string | null
          generation_method?: 'photogrammetry' | 'nerf' | 'single_image' | 'manual' | null
          quality_score?: number | null
          polygon_count?: number | null
          texture_id?: string | null
          component_mapping?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          upload_id?: string | null
          name?: string
          glb_url?: string | null
          usdz_url?: string | null
          fbx_url?: string | null
          gltf_url?: string | null
          generation_method?: 'photogrammetry' | 'nerf' | 'single_image' | 'manual' | null
          quality_score?: number | null
          polygon_count?: number | null
          texture_id?: string | null
          component_mapping?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      configurations: {
        Row: {
          id: string
          user_id: string
          product_id: string
          name: string | null
          components: Json
          custom_options: Json
          total_price: number | null
          preview_url: string | null
          is_saved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          name?: string | null
          components?: Json
          custom_options?: Json
          total_price?: number | null
          preview_url?: string | null
          is_saved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          name?: string | null
          components?: Json
          custom_options?: Json
          total_price?: number | null
          preview_url?: string | null
          is_saved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          user_id: string
          type: 'segment' | 'stain' | '3d' | 'render' | 'export'
          status: 'pending' | 'processing' | 'completed' | 'failed'
          input_data: Json
          output_data: Json
          error_message: string | null
          cost_estimate: number | null
          cost_actual: number | null
          webhook_url: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'segment' | 'stain' | '3d' | 'render' | 'export'
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          input_data: Json
          output_data?: Json
          error_message?: string | null
          cost_estimate?: number | null
          cost_actual?: number | null
          webhook_url?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'segment' | 'stain' | '3d' | 'render' | 'export'
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          input_data?: Json
          output_data?: Json
          error_message?: string | null
          cost_estimate?: number | null
          cost_actual?: number | null
          webhook_url?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      stain_library: {
        Row: {
          id: string
          name: string
          color_hex: string
          color_lab: Json | null
          category: string | null
          preview_url: string | null
          texture_sample_url: string | null
          is_public: boolean
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color_hex: string
          color_lab?: Json | null
          category?: string | null
          preview_url?: string | null
          texture_sample_url?: string | null
          is_public?: boolean
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color_hex?: string
          color_lab?: Json | null
          category?: string | null
          preview_url?: string | null
          texture_sample_url?: string | null
          is_public?: boolean
          metadata?: Json
          created_at?: string
        }
      }
      fabric_library: {
        Row: {
          id: string
          name: string
          category: string | null
          color: string | null
          texture_id: string | null
          preview_url: string | null
          is_public: boolean
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          color?: string | null
          texture_id?: string | null
          preview_url?: string | null
          is_public?: boolean
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          color?: string | null
          texture_id?: string | null
          preview_url?: string | null
          is_public?: boolean
          metadata?: Json
          created_at?: string
        }
      }
      render_outputs: {
        Row: {
          id: string
          user_id: string
          model_id: string
          type: '360_video' | 'turntable' | 'ar_preview' | 'thumbnail' | null
          mp4_url: string | null
          gif_url: string | null
          thumbnail_urls: Json
          frames: number | null
          resolution: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          model_id: string
          type?: '360_video' | 'turntable' | 'ar_preview' | 'thumbnail' | null
          mp4_url?: string | null
          gif_url?: string | null
          thumbnail_urls?: Json
          frames?: number | null
          resolution?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          model_id?: string
          type?: '360_video' | 'turntable' | 'ar_preview' | 'thumbnail' | null
          mp4_url?: string | null
          gif_url?: string | null
          thumbnail_urls?: Json
          frames?: number | null
          resolution?: string | null
          metadata?: Json
          created_at?: string
        }
      }
    }
  }
}
