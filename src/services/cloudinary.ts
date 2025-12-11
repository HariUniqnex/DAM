interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
}

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset: string;
}

class CloudinaryService {
  private config: CloudinaryConfig;

  constructor() {
    this.config = {
      cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
      apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || "",
      apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET || "",
      uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "",
    };
  }

  isConfigured(): boolean {
    return !!(this.config.cloudName && this.config.uploadPreset);
  }

  generatePublicId(
    clientCode: string,
    sku?: string,
    mpn?: string,
    timestamp?: number
  ): string {
    const ts = timestamp || Date.now();
    const id = sku || mpn || `img-${ts}`;
    return `${clientCode}/${id.replace(/[^a-zA-Z0-9-_]/g, "_")}`;
  }

  getClientFolder(clientId: string, clientCode: string): string {
    return `clients/${clientCode}`;
  }

  async uploadImage(
    file: File | Blob,
    options: {
      folder?: string;
      publicId?: string;
      tags?: string[];
      transformation?: string;
    } = {}
  ): Promise<CloudinaryUploadResponse> {
    if (!this.isConfigured()) {
      throw new Error(
        "Cloudinary is not configured. Please check your environment variables."
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", this.config.uploadPreset);

    if (options.folder) {
      formData.append("folder", options.folder);
    }

    if (options.publicId) {
      formData.append("public_id", options.publicId);
    }

    if (options.tags && options.tags.length > 0) {
      formData.append("tags", options.tags.join(","));
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`;

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Upload failed");
      }

      const data: CloudinaryUploadResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  }

  async uploadFromUrl(
    url: string,
    options: {
      folder?: string;
      publicId?: string;
      tags?: string[];
    } = {}
  ): Promise<CloudinaryUploadResponse> {
    if (!this.isConfigured()) {
      throw new Error(
        "Cloudinary is not configured. Please check your environment variables."
      );
    }

    const formData = new FormData();
    formData.append("file", url);
    formData.append("upload_preset", this.config.uploadPreset);

    if (options.folder) {
      formData.append("folder", options.folder);
    }

    if (options.publicId) {
      formData.append("public_id", options.publicId);
    }

    if (options.tags && options.tags.length > 0) {
      formData.append("tags", options.tags.join(","));
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`;

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Upload failed");
      }

      const data: CloudinaryUploadResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  }

  getTransformedUrl(
    publicId: string,
    transformations: {
      width?: number;
      height?: number;
      crop?: "scale" | "fit" | "fill" | "crop" | "thumb";
      quality?: "auto" | number;
      format?: string;
      gravity?: string;
      effect?: string;
    } = {}
  ): string {
    if (!this.isConfigured()) {
      throw new Error("Cloudinary is not configured");
    }

    const transformParts: string[] = [];

    if (transformations.width) {
      transformParts.push(`w_${transformations.width}`);
    }
    if (transformations.height) {
      transformParts.push(`h_${transformations.height}`);
    }
    if (transformations.crop) {
      transformParts.push(`c_${transformations.crop}`);
    }
    if (transformations.quality) {
      transformParts.push(`q_${transformations.quality}`);
    }
    if (transformations.gravity) {
      transformParts.push(`g_${transformations.gravity}`);
    }
    if (transformations.effect) {
      transformParts.push(`e_${transformations.effect}`);
    }

    const transformString =
      transformParts.length > 0 ? transformParts.join(",") + "/" : "";
    const format = transformations.format || "jpg";

    return `https://res.cloudinary.com/${this.config.cloudName}/image/upload/${transformString}${publicId}.${format}`;
  }

  async deleteImage(publicId: string): Promise<void> {
    console.warn("Image deletion should be handled server-side for security");
  }
}

export const cloudinary = new CloudinaryService();
