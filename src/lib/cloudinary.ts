import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  folder = "agency-flow"
): Promise<{ url: string; publicId: string; type: string }> {
  return new Promise((resolve, reject) => {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const resourceType = ["mp4", "mov", "avi", "webm"].includes(ext)
      ? "video"
      : ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)
        ? "image"
        : "raw";

    cloudinary.uploader
      .upload_stream(
        { folder, resource_type: resourceType, public_id: filename },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error("Upload failed"));
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            type: resourceType,
          });
        }
      )
      .end(buffer);
  });
}

export async function deleteFile(publicId: string) {
  await cloudinary.uploader.destroy(publicId);
}
