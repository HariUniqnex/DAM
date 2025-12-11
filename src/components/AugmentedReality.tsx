import { useState, useEffect } from "react";
import {
  Smartphone,
  Tablet,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  UploadCloud,
  Box,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface ARAsset {
  id: string;
  product_id: string;
  usdz_url: string | null;
  glb_url: string | null;
  ios_compatible: boolean;
  android_compatible: boolean;
  file_size_mb: number;
  preview_image_url: string | null;
  created_at: string;
}

export function AugmentedReality() {
  const [arAssets, setArAssets] = useState<ARAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const [arData, productsData] = await Promise.all([
        supabase
          .from("ar_assets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("products")
          .select("id, name, description")
          .eq("user_id", user.id),
      ]);

      if (arData.data) setArAssets(arData.data);
      if (productsData.data) setProducts(productsData.data);
    } catch (error) {
      console.error("Error fetching AR assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAR = async () => {
    if (!selectedProduct) {
      alert("Please select a product");
      return;
    }

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      const { data: model } = await supabase
        .from("models_3d")
        .select("*")
        .eq("product_id", selectedProduct)
        .maybeSingle();

      if (!model) {
        alert(
          "No 3D model found for this product. Please generate a 3D model first."
        );
        return;
      }

      const { error } = await supabase.from("ar_assets").insert([
        {
          user_id: user.id,
          product_id: selectedProduct,
          model_id: model.id,
          ios_compatible: true,
          android_compatible: true,
        },
      ]);

      if (error) throw error;

      alert("AR asset generation started. This may take a few minutes.");
      fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Augmented Reality</h1>
        <p className="text-slate-600 mt-1">
          Create and manage AR experiences for your products
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Generate AR Asset
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Product
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  AR Compatibility
                </h3>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4" />
                    <span>iOS devices with ARKit support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Tablet className="w-4 h-4" />
                    <span>Android devices with ARCore support</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateAR}
                disabled={!selectedProduct}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Box className="w-5 h-5" />
                <span>Generate AR Experience</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Your AR Assets
            </h2>

            {arAssets.length === 0 ? (
              <div className="text-center py-12">
                <Box className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No AR assets yet
                </h3>
                <p className="text-slate-600">
                  Generate your first AR experience above
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {arAssets.map((asset) => {
                  const product = products.find(
                    (p) => p.id === asset.product_id
                  );

                  return (
                    <div
                      key={asset.id}
                      className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                    >
                      <div className="aspect-video bg-slate-100 rounded-lg mb-3 flex items-center justify-center">
                        {asset.preview_image_url ? (
                          <img
                            src={asset.preview_image_url}
                            alt="AR Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Box className="w-12 h-12 text-slate-400" />
                        )}
                      </div>

                      <h3 className="font-semibold text-slate-900 mb-2">
                        {product?.name || "Unknown Product"}
                      </h3>

                      <div className="flex items-center space-x-2 mb-3">
                        {asset.ios_compatible && (
                          <span className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>iOS</span>
                          </span>
                        )}
                        {asset.android_compatible && (
                          <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Android</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                        <span>
                          {asset.file_size_mb
                            ? `${asset.file_size_mb.toFixed(2)} MB`
                            : "Processing..."}
                        </span>
                        <span>
                          {new Date(asset.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {asset.usdz_url && (
                          <a
                            href={asset.usdz_url}
                            download
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                          >
                            <Download className="w-4 h-4" />
                            <span>USDZ</span>
                          </a>
                        )}
                        {asset.glb_url && (
                          <a
                            href={asset.glb_url}
                            download
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                          >
                            <Download className="w-4 h-4" />
                            <span>GLB</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">About AR</h2>
            <div className="space-y-4 text-sm text-slate-600">
              <p>
                Augmented Reality allows your customers to visualize products in
                their own space before making a purchase.
              </p>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900">
                  Supported Formats
                </h3>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>USDZ for iOS devices (ARKit)</li>
                  <li>GLB for Android devices (ARCore)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900">Requirements</h3>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>3D model of the product</li>
                  <li>Optimized geometry and textures</li>
                  <li>Proper scale and orientation</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Integration</h3>
            <p className="text-sm text-blue-700 mb-4">
              Add AR quick look to your website with a simple HTML snippet
            </p>
            <code className="block p-3 bg-white rounded text-xs font-mono text-slate-800 overflow-x-auto">
              {'<a rel="ar" href="model.usdz">View in AR</a>'}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
