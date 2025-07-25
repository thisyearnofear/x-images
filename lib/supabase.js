import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for gallery operations
export async function saveImageToGallery({ imageData, attribution }) {
  try {
    // Convert base64 to blob (browser-safe)
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    // Browser-friendly base64 to Uint8Array
    function base64ToUint8Array(base64) {
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
    const blob = new Blob([base64ToUint8Array(base64Data)], {
      type: "image/png",
    });

    // Create a File object from the blob
    const file = new File([blob], `tweet-${Date.now()}.png`, {
      type: "image/png",
    });

    console.log("Uploading file:", file.name);

    // Upload image to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from("tweet-images")
      .upload(file.name, file);

    if (storageError) {
      console.error("Storage error:", storageError);
      throw storageError;
    }

    console.log("Storage data:", storageData);

    // Get public URL for the uploaded image
    const {
      data: { publicUrl },
    } = supabase.storage.from("tweet-images").getPublicUrl(file.name);

    console.log("Public URL:", publicUrl);

    // Save metadata to database
    const { data, error } = await supabase
      .from("gallery_images")
      .insert([
        {
          image_url: publicUrl,
          attribution: attribution || "Anonymous",
          dimensions: null, // Will be updated when image loads in gallery
        },
      ])
      .select();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    console.log("Database entry created:", data);
    return data[0];
  } catch (error) {
    console.error("Detailed error:", error);
    throw error;
  }
}

export async function getGalleryImages() {
  try {
    const { data, error } = await supabase
      .from("gallery_images")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching images:", error);
    throw error;
  }
}

export async function updateImageDimensions(id, dimensions) {
  try {
    const { data, error } = await supabase
      .from("gallery_images")
      .update({ dimensions })
      .eq("id", id)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Error updating dimensions:", error);
    throw error;
  }
}
