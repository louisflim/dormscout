const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Resize/compress an image file for profile storage (smaller payload, fewer save failures).
 * Returns a JPEG data URL unless the source is PNG with transparency needs — still JPEG for size.
 */
export function prepareProfileImageDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected'));
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      reject(new Error('Please upload a JPG, PNG, or WebP image'));
      return;
    }
    if (file.size > MAX_BYTES) {
      reject(new Error('File size must be less than 5MB'));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 512;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not process image'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image file'));
    };

    img.src = url;
  });
}

export function profileImageCacheKey(dataUrl) {
  if (!dataUrl) return 'none';
  const len = dataUrl.length;
  return `${len}-${dataUrl.slice(-24)}`;
}
