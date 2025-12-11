import { useState, useCallback } from "react";
import {
  Upload,
  Link,
  FileText,
  Cloud,
  Globe,
  Loader2,
  CheckCircle,
  XCircle,
  Wand2,
} from "lucide-react";
import { api } from "../services/api";

interface ImageItem {
  id: string;
  url: string;
  name: string;
  preview?: string;
}

type UploadSource = "files" | "urls" | "csv" | "product-page" | "cloud";

const PROCESSING_OPTIONS = [
  {
    id: "resize",
    label: "Image Resizing",
    description: "Resize to specific dimensions",
  },
  {
    id: "bg-remove",
    label: "Background Removal",
    description: "Remove background automatically",
  },
  {
    id: "retouch",
    label: "Image Retouch / Enhancer",
    description: "Enhance image quality",
  },
  {
    id: "crop",
    label: "Image Cropping / Reframing",
    description: "Smart cropping",
  },
  {
    id: "compress",
    label: "Image Compression & Optimization",
    description: "Optimize file size",
  },
  {
    id: "lifestyle",
    label: "Lifestyle Image Creation",
    description: "Create lifestyle scenes",
  },
  {
    id: "infographic",
    label: "Infographic Creation",
    description: "Generate infographics",
  },
  {
    id: "line-diagram",
    label: "Line Diagram",
    description: "Technical line drawings",
  },
  {
    id: "swatch",
    label: "Material Swatch Creation",
    description: "Generate material swatches",
  },
  {
    id: "color-analysis",
    label: "Color Analysis",
    description: "Analyze colors",
  },
  { id: "3d-model", label: "3D Modeling", description: "Generate 3D models" },
  {
    id: "360-spin",
    label: "360° Product Spin Video",
    description: "Turntable videos",
  },
  {
    id: "recolor",
    label: "Image Re-coloring",
    description: "Change product colors",
  },
  {
    id: "configurator",
    label: "3D Product Configurator",
    description: "Create configurator",
  },
  {
    id: "pdf-extract",
    label: "Image Extraction from PDF",
    description: "Extract from PDFs",
  },
];

export function AdvancedUpload() {
  const [uploadSource, setUploadSource] = useState<UploadSource>("files");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [autoDetect, setAutoDetect] = useState(true);
  const [selectedProcessing, setSelectedProcessing] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [productPageUrl, setProductPageUrl] = useState("");
  const [cloudProvider, setCloudProvider] = useState<
    "dropbox" | "google-drive"
  >("dropbox");
  const [cloudPath, setCloudPath] = useState("");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) =>
        file.type.startsWith("image/") ||
        file.type === "text/csv" ||
        file.name.endsWith(".xlsx")
    );

    if (
      droppedFiles.some(
        (f) => f.type === "text/csv" || f.name.endsWith(".xlsx")
      )
    ) {
      setCsvFile(droppedFiles[0]);
      setUploadSource("csv");
      parseCsvFile(droppedFiles[0]);
    } else {
      handleFileSelect(droppedFiles);
    }
  }, []);

  const handleFileSelect = (files: File[]) => {
    const newImages = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      name: file.name,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleUrlsAdd = () => {
    const urls = urlInput.split("\n").filter((u) => u.trim());
    const newImages = urls.map((url, idx) => ({
      id: `url-${Date.now()}-${idx}`,
      url: url.trim(),
      name: `Image ${idx + 1}`,
    }));
    setImages((prev) => [...prev, ...newImages]);
    setUrlInput("");
  };

  const parseCsvFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split("\n").slice(1);
    const urls = lines
      .map((line) => {
        const cols = line.split(",");
        return cols[0]?.trim();
      })
      .filter(Boolean);

    const newImages = urls.map((url, idx) => ({
      id: `csv-${Date.now()}-${idx}`,
      url,
      name: `CSV Image ${idx + 1}`,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const toggleProcessing = (processingId: string) => {
    setSelectedProcessing((prev) =>
      prev.includes(processingId)
        ? prev.filter((p) => p !== processingId)
        : [...prev, processingId]
    );
  };

  const handleUpload = async () => {
    if (images.length === 0 && uploadSource === "files") return;

    setUploading(true);
    setError("");
    setUploadResult(null);

    try {
      let result;

      switch (uploadSource) {
        case "files": {
          const files = await Promise.all(
            images.map(async (img) => {
              if (img.preview) {
                const response = await fetch(img.url);
                const blob = await response.blob();
                return new File([blob], img.name, { type: blob.type });
              }
              return null;
            })
          );
          const validFiles = files.filter((f): f is File => f !== null);
          result = await api.uploadImages(validFiles);
          break;
        }

        case "urls": {
          const urls = images.map((img) => img.url);
          result = await api.uploadFromUrls(urls);
          break;
        }

        case "product-page": {
          result = await api.uploadFromProductPage(productPageUrl);
          break;
        }

        case "cloud": {
          result = await api.uploadFromCloudStorage(cloudProvider, cloudPath);
          break;
        }

        default:
          throw new Error("Invalid upload source");
      }
      const shouldRemoveBG =
        !autoDetect && selectedProcessing.includes("bg-remove");
      if (shouldRemoveBG && result?.images) {
        try {
          console.log("Initiating AI process");
          await Promise.all(
            result.images.map(async (uploadedImage: any, index: number) => {
              const sourceUrl =
                uploadedImage.cloudinaryUrl || uploadedImage.url;
              let originalName = uploadedImage.id;
              if (uploadSource === "files") {
                if (images[index]) originalName = images[index].name;
              } else if (uploadSource === "urls") {
                const parts = images[index]?.url.split("/");
                const lastPart = parts[parts.length - 1];
                if (lastPart) originalName = lastPart;
              }
              await api.processImageAI(
                uploadedImage.id,
                sourceUrl,
                "bg-remove",
                originalName
              );
              console.log(`Processed: ${originalName}`);
            })
          );
        } catch (processError: any) {
          console.error("AI Processing failed", processError);
        }
      }
      const otherProcessing = selectedProcessing.filter(
        (p) => p !== "bg-remove"
      );
      if (!autoDetect && otherProcessing.length > 0) {
        const imageProcessing: Record<string, string[]> = {};
        images.forEach((img) => {
          imageProcessing[img.id] = otherProcessing;
        });
        await api.createBatchProcessingJob(result.uploadId, imageProcessing);
      }

      setUploadResult(result);
      setImages([]);
      setProductPageUrl("");
      setCloudPath("");

      window.dispatchEvent(new CustomEvent("upload-complete"));
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Advanced Upload
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Upload Source
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button
                onClick={() => setUploadSource("files")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  uploadSource === "files"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Upload className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                <span className="text-sm font-medium">Files</span>
              </button>

              <button
                onClick={() => setUploadSource("urls")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  uploadSource === "urls"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Link className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                <span className="text-sm font-medium">URLs</span>
              </button>

              <button
                onClick={() => setUploadSource("csv")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  uploadSource === "csv"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                <span className="text-sm font-medium">CSV</span>
              </button>

              <button
                onClick={() => setUploadSource("product-page")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  uploadSource === "product-page"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Globe className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                <span className="text-sm font-medium">Page</span>
              </button>

              <button
                onClick={() => setUploadSource("cloud")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  uploadSource === "cloud"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Cloud className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                <span className="text-sm font-medium">Cloud</span>
              </button>
            </div>
          </div>

          {uploadSource === "files" && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 hover:border-slate-400"
              }`}
            >
              <Upload
                className={`w-12 h-12 mx-auto mb-4 ${
                  dragActive ? "text-blue-500" : "text-slate-400"
                }`}
              />
              <p className="text-lg font-medium text-slate-700 mb-2">
                Drag and drop images
              </p>
              <p className="text-slate-500 mb-4">or</p>
              <label className="inline-block">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files &&
                    handleFileSelect(Array.from(e.target.files))
                  }
                  className="hidden"
                />
                <span className="px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors inline-block">
                  Browse Files
                </span>
              </label>
            </div>
          )}

          {uploadSource === "urls" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Image URLs (one per line)
              </label>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
              />
              <button
                onClick={handleUrlsAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add URLs
              </button>
            </div>
          )}

          {uploadSource === "csv" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Upload CSV/XLSX File
              </label>
              <p className="text-sm text-slate-600 mb-3">
                CSV format: First column should contain image URLs
              </p>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCsvFile(file);
                    parseCsvFile(file);
                  }
                }}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          )}

          {uploadSource === "product-page" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Product Page URL
              </label>
              <input
                type="url"
                value={productPageUrl}
                onChange={(e) => setProductPageUrl(e.target.value)}
                placeholder="https://example.com/product/chair"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-slate-600">
                Auto-extract all product images from this page
              </p>
            </div>
          )}

          {uploadSource === "cloud" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cloud Provider
                </label>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setCloudProvider("dropbox")}
                    className={`flex-1 px-4 py-3 border-2 rounded-lg ${
                      cloudProvider === "dropbox"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200"
                    }`}
                  >
                    Dropbox
                  </button>
                  <button
                    onClick={() => setCloudProvider("google-drive")}
                    className={`flex-1 px-4 py-3 border-2 rounded-lg ${
                      cloudProvider === "google-drive"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200"
                    }`}
                  >
                    Google Drive
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Folder Path
                </label>
                <input
                  type="text"
                  value={cloudPath}
                  onChange={(e) => setCloudPath(e.target.value)}
                  placeholder="/Furniture/Products"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {images.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Images ({images.length})
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                      {image.preview ? (
                        <img
                          src={image.preview}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Globe className="w-12 h-12 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    <p className="mt-2 text-xs text-slate-600 truncate">
                      {image.name}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>
                      Upload {images.length} Image{images.length > 1 ? "s" : ""}
                      {autoDetect
                        ? " (Auto-detect)"
                        : ` (${selectedProcessing.length} operations)`}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {uploadResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-green-700 font-semibold text-lg">
                    Upload successful!
                  </p>
                  <p className="text-green-600 text-sm mt-2">
                    {uploadResult.images?.length || 0} image(s) uploaded and
                    stored
                  </p>
                  {autoDetect && (
                    <p className="text-green-600 text-sm mt-1">
                      Auto-detection enabled - processing will be determined
                      automatically
                    </p>
                  )}
                  <p className="text-green-700 text-sm mt-3 font-medium">
                    Scroll down to view your uploaded images in the gallery
                    below
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">
              Processing Options
            </h3>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoDetect}
                onChange={(e) => setAutoDetect(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div className="flex items-center space-x-1">
                <Wand2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Auto</span>
              </div>
            </label>
          </div>

          {autoDetect ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                AI will automatically detect and apply the best processing
                operations for each image.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-600 mb-3">
                Select operations to apply:
              </p>
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {PROCESSING_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedProcessing.includes(option.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProcessing.includes(option.id)}
                      onChange={() => toggleProcessing(option.id)}
                      className="w-4 h-4 text-blue-600 rounded mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {option.label}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {selectedProcessing.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-700">
                    {selectedProcessing.length} operation
                    {selectedProcessing.length > 1 ? "s" : ""} selected
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
