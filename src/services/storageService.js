/**
 * Cloudinary upload helper for admin menu images.
 */
export async function uploadMenuItemImage(file) {
  if (!file) throw new Error('No file selected.')
  const cloudName = String(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '').trim()
  const uploadPreset = String(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? '').trim()
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || 'Cloudinary upload failed.')
  }
  return data.secure_url
}
