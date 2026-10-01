import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { env } from "../config/env";

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

export async function uploadBufferToCloud(
  buffer: Buffer,
  folder: string,
  fileName?: string
): Promise<{ url: string; publicId: string }> {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    // Return mock URL in local development if no Cloudinary configured
    const mockUrl = `https://picsum.photos/seed/${Date.now()}/800/800`;
    return { url: mockUrl, publicId: `mock_${Date.now()}` };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `pharmacy-admin/${folder}`,
        public_id: fileName,
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error("Upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}
