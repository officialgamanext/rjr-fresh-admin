/**
 * Utility for image compression and ImageKit upload
 */

// ImageKit Configuration from .env
const IMAGEKIT_PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
const IMAGEKIT_URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
const IMAGEKIT_PRIVATE_KEY = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY;

/**
 * Generate ImageKit signature using Web Crypto API
 * (Simulates backend authentication for internal use)
 */
async function getAuthParams() {
  const token = Math.random().toString(36).substring(2) + Date.now();
  const expire = Math.floor(Date.now() / 1000) + 2400; // 40 mins expiry

  const encoder = new TextEncoder();
  // Ensure private key is clean
  const cleanPrivateKey = IMAGEKIT_PRIVATE_KEY?.trim() || "";
  const keyData = encoder.encode(cleanPrivateKey);
  const data = encoder.encode(token + expire);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, data);
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return { token, expire, signature };
}

/**
 * Compress and resize image using Canvas
 */
export const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Upload file to ImageKit
 */
export const uploadToImageKit = async (file, fileName) => {
  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY) {
    throw new Error("ImageKit credentials missing in environment variables.");
  }

  try {
    const { token, expire, signature } = await getAuthParams();
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", fileName);
    formData.append("publicKey", IMAGEKIT_PUBLIC_KEY.trim());
    formData.append("signature", signature);
    formData.append("expire", expire.toString());
    formData.append("token", token);
    formData.append("useUniqueFileName", "true");

    const response = await fetch(`https://upload.imagekit.io/api/v1/files/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Upload failed");
    }

    const result = await response.json();
    return result.url;
  } catch (error) {
    console.error("ImageKit Upload Error:", error);
    throw error;
  }
};
