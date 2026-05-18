export const MAX_LISTING_IMAGES = 20;
export const MAX_LISTING_IMAGE_BYTES = 10 * 1024 * 1024;

const ALLOWED_EXT = /\.(jpe?g|png)$/i;

export function isPngFile(file) {
  if (!file) return false;
  const type = (file.type || '').toLowerCase();
  if (type.includes('png')) return true;
  return /\.png$/i.test(file.name || '');
}

function mimeLooksLikeJpegOrPng(type) {
  const t = (type || '').toLowerCase();
  if (!t.startsWith('image/')) return false;
  return t.includes('jpeg') || t.includes('jpg') || t.includes('png') || t === 'image/pjpeg' || t === 'image/x-png';
}

/** Read first bytes to detect JPEG/PNG when the browser omits type/extension. */
export async function isJpegOrPngByMagic(file) {
  if (!file) return false;
  try {
    const buf = await file.slice(0, 12).arrayBuffer();
    const b = new Uint8Array(buf);
    if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return true;
    if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return true;
  } catch {
    return false;
  }
  return false;
}

/** Ensure listing images are always a real array (API/legacy data may send a string). */
export function normalizeListingImages(images) {
  if (!images) return [];
  if (Array.isArray(images)) {
    return images.filter((src) => typeof src === 'string' && src.length > 0);
  }
  if (typeof images === 'string') {
    const trimmed = images.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((src) => typeof src === 'string' && src.length > 0);
        }
      } catch {
        /* fall through */
      }
    }
    if (trimmed.startsWith('data:image')) return [trimmed];
  }
  return [];
}

export function isAllowedListingImageType(file) {
  if (!file) return false;
  if (ALLOWED_EXT.test(file.name || '')) return true;
  return mimeLooksLikeJpegOrPng(file.type);
}

export function validateListingImageFile(file) {
  if (!file) return 'No file selected.';
  if (!isAllowedListingImageType(file)) {
    return 'Only JPEG and PNG images are allowed.';
  }
  if (file.size > MAX_LISTING_IMAGE_BYTES) {
    return 'Each image must be 10MB or smaller.';
  }
  return null;
}

export async function validateListingImageFileAsync(file) {
  const syncError = validateListingImageFile(file);
  if (!syncError) return null;
  if (await isJpegOrPngByMagic(file)) {
    if (file.size > MAX_LISTING_IMAGE_BYTES) {
      return 'Each image must be 10MB or smaller.';
    }
    return null;
  }
  return syncError;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error('Could not read image file'));
    fr.readAsDataURL(file);
  });
}

function compressViaCanvas(file, maxWidth = 1920, quality = 0.88) {
  const outputMime = isPngFile(file) ? 'image/png' : 'image/jpeg';
  const outputQuality = outputMime === 'image/png' ? undefined : quality;

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
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
        resolve(canvas.toDataURL(outputMime, outputQuality));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode image'));
    };

    img.src = url;
  });
}

/**
 * Resize/compress when possible; fall back to raw FileReader so uploads still work.
 */
export async function prepareListingImageDataUrl(file, maxWidth = 1920, quality = 0.88) {
  const validationError = await validateListingImageFileAsync(file);
  if (validationError) {
    throw new Error(validationError);
  }
  try {
    return await compressViaCanvas(file, maxWidth, quality);
  } catch {
    return readFileAsDataUrl(file);
  }
}

export function prepareListingImagesFromFiles(files) {
  return Promise.all(Array.from(files).map((file) => prepareListingImageDataUrl(file)));
}
