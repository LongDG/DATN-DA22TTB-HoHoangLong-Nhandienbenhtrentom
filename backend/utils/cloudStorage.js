/**
 * cloudStorage.js — Dual-write: Local disk + Cloudinary
 *
 * - Nếu CLOUDINARY_* env vars chưa set → chỉ dùng local (dev mode)
 * - Nếu đã set → upload lên Cloudinary SAU KHI đã lưu local (không mất ảnh)
 * - Không làm crash nếu Cloudinary thất bại → fallback về local silently
 */

const fs = require('fs');

let cloudinary = null;
let CLOUD_CONFIGURED = false;

try {
  const cld = require('cloudinary').v2;
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cld.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    cloudinary      = cld;
    CLOUD_CONFIGURED = true;
    console.log('[CLOUD] Cloudinary đã được cấu hình ✅');
  } else {
    console.log('[CLOUD] Cloudinary chưa cấu hình → chỉ dùng local storage');
  }
} catch {
  console.log('[CLOUD] Thư viện cloudinary chưa cài → chỉ dùng local storage');
}

/**
 * Upload ảnh chẩn đoán:
 *   - Luôn giữ file local (không xóa)
 *   - Nếu Cloudinary cấu hình → upload thêm lên cloud
 *
 * @param {string} localFilePath  - Đường dẫn tuyệt đối file local
 * @param {string} folder         - Thư mục trên Cloudinary
 * @returns {{ cloud_url: string|null, local_relative: string }}
 */
async function uploadDiagnosisImage(localFilePath, folder = 'shrimp-diagnoses') {
  const filename       = require('path').basename(localFilePath);
  const local_relative = `/uploads/diagnoses/${filename}`;  // URL relative
  let   cloud_url      = null;

  if (!CLOUD_CONFIGURED) {
    return { cloud_url: null, local_relative };
  }

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type:  'image',
      quality:        'auto:good',
      fetch_format:   'auto',
      transformation: [{ width: 1024, crop: 'limit' }],  // Giới hạn size upload
    });
    cloud_url = result.secure_url;
    console.log(`[CLOUD] Upload thành công: ${cloud_url}`);
  } catch (err) {
    console.warn(`[CLOUD] Upload thất bại (dùng local): ${err.message}`);
  }

  return { cloud_url, local_relative };
}

/**
 * Lấy URL tốt nhất để hiển thị ảnh:
 *   - cloud_url nếu có
 *   - Hoặc ghép SERVER_URL + local_relative
 *
 * @param {{ cloud_url?: string, hinhanh_url?: string }} doc
 */
function getBestImageUrl(doc) {
  if (doc.cloud_url) return doc.cloud_url;
  if (doc.hinhanh_url) {
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    return `${serverUrl}${doc.hinhanh_url}`;
  }
  return null;
}

module.exports = { uploadDiagnosisImage, getBestImageUrl, CLOUD_CONFIGURED };
