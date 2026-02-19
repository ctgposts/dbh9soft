import Compressor from 'compressorjs';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
  convertSize?: number;
}

export interface CompressionResult {
  success: boolean;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  blob?: Blob;
  error?: string;
}

/**
 * কম্প্রেস করা ইমেজ ফাইল (টার্গেট: 100KB পর্যন্ত)
 */
export const compressImage = (
  file: File,
  targetSize: number = 100000, // ১০০ KB
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({
        success: false,
        originalSize: file.size,
        compressedSize: 0,
        compressionRatio: 0,
        error: 'ফাইল ইমেজ নয়',
      });
      return;
    }

    if (file.size <= targetSize) {
      // ইতিমধ্যে টার্গেট সাইজের নিচে
      resolve({
        success: true,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
        blob: file,
      });
      return;
    }

    // শুরু করুন কম্প্রেশন
    let quality = options.quality || 0.85;
    let attempts = 0;
    const maxAttempts = 5;

    const attemptCompression = () => {
      new Compressor(file, {
        quality: quality,
        maxWidth: options.maxWidth || 1920,
        maxHeight: options.maxHeight || 1920,
        mimeType: options.mimeType || 'image/jpeg',
        convertSize: options.convertSize !== undefined ? options.convertSize : 5000000,
        success(result: Blob) {
          // চেক করুন সাইজ
          if (result.size <= targetSize || quality <= 0.6 || attempts >= maxAttempts) {
            const ratio = ((file.size - result.size) / file.size * 100).toFixed(2);
            resolve({
              success: true,
              originalSize: file.size,
              compressedSize: result.size,
              compressionRatio: parseFloat(ratio),
              blob: result,
            });
          } else {
            // আরও কম্প্রেস করার চেষ্টা করুন
            quality -= 0.1;
            attempts++;
            attemptCompression();
          }
        },
        error(err: Error) {
          resolve({
            success: false,
            originalSize: file.size,
            compressedSize: 0,
            compressionRatio: 0,
            error: `কম্প্রেশন ব্যর্থ: ${err.message}`,
          });
        },
      });
    };

    attemptCompression();
  });
};

/**
 * ইমেজ ফাইল পড়ুন Base64 স্ট্রিং হিসাবে
 */
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => {
      reject(new Error('ফাইল পড়তে ব্যর্থ'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Blob কে ফাইল এ রূপান্তর করুন
 */
export const blobToFile = (blob: Blob, filename: string): File => {
  return new File([blob], filename, {
    type: blob.type,
    lastModified: Date.now(),
  });
};

/**
 * ফাইল সাইজ ফরম্যাট করুন পঠনযোগ্য স্ট্রিং এ
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * একাধিক ইমেজ কম্প্রেস করুন
 */
export const compressMultipleImages = async (
  files: File[],
  targetSize: number = 100000,
  options: CompressionOptions = {}
): Promise<CompressionResult[]> => {
  return Promise.all(
    files.map((file) => compressImage(file, targetSize, options))
  );
};

/**
 * ইমেজ রোটেশন ঠিক করুন EXIF ডেটার উপর ভিত্তি করে
 */
export const autoRotateImage = async (file: File): Promise<Blob> => {
  // এই ফাংশনটি browser API ব্যবহার করে auto-rotate সমর্থন করে
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, 'image/jpeg', 0.85);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * ডুপ্লিকেট ইমেজ ডিটেক্ট করুন হ্যাশ ব্যবহার করে (সিম্পল চেক)
 */
export const calculateImageHash = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      resolve(Math.abs(hash).toString(36));
    };
    reader.readAsDataURL(file);
  });
};
