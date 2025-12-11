import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { imageId, imageUrl, operation, originalName } = await req.json();
    if (!imageId || !imageUrl || !operation) {
      throw new Error("Missing required fields:imageId,imageUrl, or operation");
    }
    const baseName = originalName
      ? originalName.replace(/\.[^/.]+$/, "")
      : `image_${imageId}`;
    const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");
    let opSuffix = "";
    const fileExt = "png";
    if (operation === "remove-bg") {
      opSuffix = "no-bg";
    } else if (operation === "resize") {
      opSuffix = "resized";
    } else {
      opSuffix = operation;
    }
    const finalPublicId = `${safeName}_${opSuffix}`;
    const finalFileName = `${finalPublicId}.${fileExt}`;
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    let resultBlob: Blob;
    if (operation === "bg-remove") {
      const REMOVE_BG_API_KEY = Deno.env.get("REMOVE_BG_API_KEY");
      if (!REMOVE_BG_API_KEY) throw new Error("Remove  BG API KEY missing!");
      console.log(`Processing ${imageId} with remove bg....`);
      const formData = new FormData();
      formData.append("image_url", imageUrl);
      formData.append("size", "auto");
      const apiRes = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": REMOVE_BG_API_KEY },
        body: formData,
      });
      if (!apiRes.ok) {
        const errText = await apiRes.text();
        throw new Error(`Remove BG API failed: ${errText}`);
      }
      resultBlob = await apiRes.blob();
    } else {
      throw new Error(`Operation ${operation} not supported!`);
    }
    const fileName = `${imageId}_processed.png`;
    const filePath = `processed/${fileName}`;
    const arrayBuffer = await resultBlob.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
      .from("images")
      .upload(filePath, arrayBuffer, {
        contentType: "image/png",
        upsert: true,
      });
    if (uploadError) throw uploadError;
    const {
      data: { publicUrl: sbPublicUrl },
    } = supabaseAdmin.storage.from("images").getPublicUrl(filePath);
    const CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const API_KEY = Deno.env.get("CLOUDINARY_API_KEY");
    const API_SECRET = Deno.env.get("CLOUDINAR_API_SECRET");
    let finalCloudinaryUrl = null;
    let finalCloudinaryPublicId = null;
    if (CLOUD_NAME && API_KEY && API_SECRET) {
      console.log(`Uploading to Cloudinary as :${finalPublicId}`);
      const timestamp = Math.round(new Date().getTime() / 1000);
      const folder = 'dam/processed';
      const strToSign = `folder=${folder}&public_id=${finalPublicId}&timestamp=${timestamp}${API_SECRET}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(strToSign);
      const hashBuffer = await crypto.subtle.digest("SHA-1", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const cloudinaryForm = new FormData();
      cloudinaryForm.append("file", resultBlob);
      cloudinaryForm.append("api_key", API_KEY);
      cloudinaryForm.append("timestamp", timestamp.toString());
      cloudinaryForm.append("signature", signature);
      cloudinaryForm.append("folder", folder);
      cloudinaryForm.append("public_id", finalPublicId);
      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: cloudinaryForm }
      );
      const cloudData = await cloudRes.json();
      if (cloudData.error) {
        console.error("Cloudinary upload error:", cloudData.error);
      } else {
        finalCloudinaryUrl = cloudData.secure_url;
        finalCloudinaryPublicId = cloudData.public_id;
      }
    }
    const finalUrl = finalCloudinaryUrl || sbPublicUrl;
    await supabaseAdmin
      .from("images")
      .update({
        processed_url: finalUrl,
        cloudinary_public_id: finalCloudinaryPublicId,
        processing_status: "completed",
        operations_applied: [operation],
      })
      .eq("id", imageId);
    return new Response(
      JSON.stringify({ success: true, url: finalUrl, name: finalFileName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Edge function error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
