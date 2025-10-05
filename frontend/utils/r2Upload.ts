import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as FileSystem from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, ENDPOINT, PUBLIC_URL } from "@env";

// Polyfill crypto.getRandomValues for AWS SDK using expo-crypto
if (typeof global.crypto === "undefined") {
  global.crypto = {} as any;
}
if (typeof global.crypto.getRandomValues === "undefined") {
  // @ts-ignore - Type mismatch is expected for polyfill
  global.crypto.getRandomValues = (array: any) => {
    const randomBytes = Crypto.getRandomBytes(array.length);
    array.set(randomBytes);
    return array;
  };
}

// Initialize R2 client
const r2 = new S3Client({
  region: "auto",
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

/**
 * Upload an image to R2 storage
 * @param fileUri - Local file URI from image picker
 * @returns Public URL of the uploaded image
 */
export async function uploadImageToR2(fileUri: string): Promise<string> {
  try {
    console.log("🔧 R2 Upload Debug:");
    console.log("  - Access Key ID:", ACCESS_KEY_ID?.substring(0, 8) + "...");
    console.log(
      "  - Secret Key:",
      SECRET_ACCESS_KEY ? "✓ loaded" : "✗ missing"
    );
    console.log("  - Endpoint:", ENDPOINT);
    console.log("  - Bucket: tapp-club");

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: "base64",
    });

    // Convert base64 to buffer
    const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    // Generate a unique filename
    const fileName = `${Date.now()}-${fileUri.split("/").pop()}`;
    console.log("  - File name:", fileName);
    console.log("  - File size:", buffer.length, "bytes");

    // Determine content type based on file extension
    const extension = fileUri.split(".").pop()?.toLowerCase();
    let contentType = "image/jpeg";
    if (extension === "png") contentType = "image/png";
    if (extension === "gif") contentType = "image/gif";
    if (extension === "webp") contentType = "image/webp";
    console.log("  - Content type:", contentType);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: "tapp-club",
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    });

    console.log("📤 Sending upload request...");
    await r2.send(command);

    // Return the public URL
    const publicUrl = `${PUBLIC_URL}/${fileName}`;
    console.log("✅ Upload successful:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error("Failed to upload image");
  }
}
