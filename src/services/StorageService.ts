/**
 * স্টোরেজ সার্ভিস - ইমেজ আপলোড এবং ম্যানেজমেন্ট
 * 
 * Phase 2: Cloudinary বা অন্য সার্ভিস ইন্টিগ্রেশন করতে হবে
 * Phase 1: Base64 সরাসরি storage এ সংরক্ষণ
 */

export interface StorageConfig {
  provider: "cloudinary" | "aws-s3" | "local";
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  awsBucket?: string;
  awsRegion?: string;
}

export interface UploadResult {
  success: boolean;
  url: string;
  key: string;
  size: number;
  format: string;
  error?: string;
}

export interface StorageService {
  uploadImage(
    imageData: string | Blob,
    filename: string,
    metadata?: Record<string, any>
  ): Promise<UploadResult>;

  deleteImage(key: string): Promise<boolean>;

  getImageUrl(key: string): Promise<string>;

  optimizeImage(imageData: Blob): Promise<Blob>;
}

/**
 * Cloudinary স্টোরেজ সার্ভিস (Production এর জন্য)
 */
export class CloudinaryStorageService implements StorageService {
  private cloudName: string;
  private apiKey: string;

  constructor(cloudName: string, apiKey: string) {
    this.cloudName = cloudName;
    this.apiKey = apiKey;
  }

  async uploadImage(
    imageData: string | Blob,
    filename: string,
    metadata?: Record<string, any>
  ): Promise<UploadResult> {
    try {
      const formData = new FormData();

      if (typeof imageData === "string") {
        // Base64 string
        const blob = this.base64ToBlob(imageData);
        formData.append("file", blob);
      } else {
        formData.append("file", imageData);
      }

      formData.append("upload_preset", "dbh_staff_products"); // এনভায়রনমেন্ট ভেরিয়েবল থেকে আসবে
      formData.append("folder", "staff-products");
      formData.append("public_id", filename);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Upload failed");
      }

      return {
        success: true,
        url: data.secure_url,
        key: data.public_id,
        size: data.bytes,
        format: data.format,
      };
    } catch (error) {
      return {
        success: false,
        url: "",
        key: "",
        size: 0,
        format: "",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteImage(key: string): Promise<boolean> {
    try {
      // TODO: Implement Cloudinary delete API
      console.log("Deleting image:", key);
      return true;
    } catch (error) {
      console.error("Delete failed:", error);
      return false;
    }
  }

  async getImageUrl(key: string): Promise<string> {
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${key}`;
  }

  async optimizeImage(imageData: Blob): Promise<Blob> {
    // অপটিমাইজেশন Cloudinary তে স্বয়ংক্রিয়
    return imageData;
  }

  private base64ToBlob(base64: string): Blob {
    const parts = base64.split(",");
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);

    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }

    return new Blob([u8arr], { type: mime });
  }
}

/**
 * Local স্টোরেজ সার্ভিস (Development এর জন্য)
 */
export class LocalStorageService implements StorageService {
  async uploadImage(
    imageData: string | Blob,
    filename: string,
    metadata?: Record<string, any>
  ): Promise<UploadResult> {
    try {
      // Development এ localStorage এ সংরক্ষণ করুন
      const key = `staff-product-image-${Date.now()}-${filename}`;
      const dataToStore =
        typeof imageData === "string" ? imageData : await this.blobToBase64(imageData);

      localStorage.setItem(key, dataToStore);

      // মেটাডেটা সংরক্ষণ করুন
      if (metadata) {
        localStorage.setItem(`${key}-metadata`, JSON.stringify(metadata));
      }

      return {
        success: true,
        url: dataToStore,
        key,
        size: dataToStore.length,
        format: "JPEG",
      };
    } catch (error) {
      return {
        success: false,
        url: "",
        key: "",
        size: 0,
        format: "",
        error: error instanceof Error ? error.message : "Storage failed",
      };
    }
  }

  async deleteImage(key: string): Promise<boolean> {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}-metadata`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getImageUrl(key: string): Promise<string> {
    const data = localStorage.getItem(key);
    return data || "";
  }

  async optimizeImage(imageData: Blob): Promise<Blob> {
    return imageData;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }
}

/**
 * স্টোরেজ সার্ভিস ফ্যাক্টরি
 */
export class StorageServiceFactory {
  static create(config: StorageConfig): StorageService {
    switch (config.provider) {
      case "cloudinary":
        if (!config.cloudinaryCloudName || !config.cloudinaryApiKey) {
          throw new Error("Cloudinary credentials required");
        }
        return new CloudinaryStorageService(
          config.cloudinaryCloudName,
          config.cloudinaryApiKey
        );

      case "local":
      default:
        return new LocalStorageService();
    }
  }
}

/**
 * ডিফল্ট স্টোরেজ সার্ভিস ইনস্ট্যান্স
 */
export const getStorageService = (): StorageService => {
  // Environment পরিবর্তনের ভিত্তিতে সঠিক সার্ভিস রিটার্ন করুন
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    return new LocalStorageService();
  }

  const config: StorageConfig = {
    provider: "cloudinary",
    cloudinaryCloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.REACT_APP_CLOUDINARY_API_KEY,
  };

  return StorageServiceFactory.create(config);
};
