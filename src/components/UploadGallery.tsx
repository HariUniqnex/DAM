import { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Package,
  Calendar,
  ExternalLink,
  Download,
  Wand2,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface Upload {
  id: string;
  status: string;
  created_at: string;
  metadata: any;
}

interface Image {
  id: string;
  url: string;
  processed_url?: string | null;
  processing_status?: string;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

interface UploadWithImages extends Upload {
  images: Image[];
}

export function UploadGallery() {
  const [uploads, setUploads] = useState<UploadWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUpload, setExpandedUpload] = useState<string | null>(null);

  useEffect(() => {
    loadUploads();
    const interval = setInterval(loadUploads, 10000);

    const handleUploadComplete = () => {
      setTimeout(() => loadUploads(), 1000);
    };

    window.addEventListener("upload-complete", handleUploadComplete);

    return () => {
      clearInterval(interval);
      window.removeEventListener("upload-complete", handleUploadComplete);
    };
  }, []);
  const handleDownload = async (url: string, fallbackName: string) => {
    try {
      let filename = fallbackName;
      try {
        const urlObj = new URL(url);
        const parts = urlObj.pathname.split("/");
        const lastPart = parts[parts.length - 1];
        if (lastPart.length > 3) filename = decodeURIComponent(lastPart);
      } catch (e) {}

      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Download error:", error);
      window.open(url, "_blank"); // Fallback
    }
  };
  const loadUploads = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: uploadsData, error: uploadsError } = await supabase
        .from("uploads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (uploadsError) throw uploadsError;

      const uploadsWithImages = await Promise.all(
        uploadsData.map(async (upload) => {
          const { data: imagesData } = await supabase
            .from("images")
            .select("*")
            .eq("upload_id", upload.id)
            .order("created_at", { ascending: true });

          return {
            ...upload,
            images: imagesData || [],
          };
        })
      );

      setUploads(uploadsWithImages);

      if (uploadsWithImages.length > 0 && !expandedUpload) {
        setExpandedUpload(uploadsWithImages[0].id);
      }
    } catch (error) {
      console.error("Failed to load uploads:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Recent Uploads</h2>
          <p className="text-slate-600 mt-1">
            View your uploaded images and their processing status
          </p>
        </div>
        <Package className="w-8 h-8 text-slate-400" />
      </div>

      {uploads.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No uploads yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Upload some images to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors"
            >
              <div
                className="p-4 bg-slate-50 cursor-pointer"
                onClick={() =>
                  setExpandedUpload(
                    expandedUpload === upload.id ? null : upload.id
                  )
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <ImageIcon className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-slate-900">
                          Upload Session
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                            upload.status
                          )}`}
                        >
                          {upload.status}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {upload.images.length}{" "}
                          {upload.images.length === 1 ? "image" : "images"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(upload.created_at).toLocaleString()}
                          </span>
                        </div>
                        {upload.metadata?.source && (
                          <span className="text-slate-500">
                            Source: {upload.metadata.source}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {upload.id.slice(0, 8)}
                  </span>
                </div>
              </div>

              {expandedUpload === upload.id && upload.images.length > 0 && (
                <div className="p-4 border-t border-slate-200 bg-white">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {upload.images.map((image) => {
                      const displayUrl = image.processed_url || image.url;
                      const isProcessed = !!image.processed_url;

                      return (
                        <div
                          key={image.id}
                          className="group relative border border-slate-100 rounded-lg p-2 hover:shadow-md transition-shadow"
                        >
                          {/* Image Container */}
                          <div className="aspect-square bg-slate-100 rounded-md overflow-hidden relative mb-2">
                            <img
                              src={displayUrl}
                              alt="Uploaded"
                              className="w-full h-full object-contain"
                            />

                            {/* Processed Badge */}
                            {isProcessed && (
                              <div
                                className="absolute top-2 left-2 bg-green-500/90 text-white p-1 rounded-full shadow-sm"
                                title="AI Processed"
                              >
                                <Wand2 className="w-3 h-3" />
                              </div>
                            )}

                            {/* Hover Actions */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                              <a
                                href={displayUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white rounded-full hover:bg-slate-100 transition-colors"
                                title="View Full Size"
                              >
                                <ExternalLink className="w-4 h-4 text-slate-700" />
                              </a>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(
                                    displayUrl,
                                    `image-${image.id}.png`
                                  );
                                }}
                                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                                title="Download Image"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Info Footer */}
                          <div className="flex items-center justify-between px-1">
                            <span className="text-xs text-slate-500 font-mono truncate max-w-[80px]">
                              {isProcessed ? "Processed" : "Original"}
                            </span>
                            {image.width && image.height && (
                              <span className="text-[10px] text-slate-400">
                                {image.width}×{image.height}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {expandedUpload === upload.id && upload.images.length === 0 && (
                <div className="p-8 border-t border-slate-200 bg-white text-center">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">
                    No images in this upload session
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-sm text-slate-600">
          Click on an upload session to expand and view all images. Images are
          automatically stored and linked to your account.
        </p>
      </div>
    </div>
  );
}
