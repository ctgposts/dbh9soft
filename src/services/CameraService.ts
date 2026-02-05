/**
 * Camera Service
 * ক্যামেরা ক্যাপচার এবং ছবি প্রসেসিং সার্ভিস
 */

export interface CapturedPhoto {
  dataUrl: string;           // Base64 ডেটা URL
  timestamp: Date;           // ক্যাপচারের সময়
  width: number;            // প্রস্থ (পিক্সেল)
  height: number;           // উচ্চতা (পিক্সেল)
  size: number;             // ফাইল সাইজ (বাইট)
  mimeType: string;         // MIME টাইপ
}

export class CameraService {
  /**
   * ক্যামেরা উপলব্ধতা চেক করুন
   */
  static async isCameraAvailable(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch {
      return false;
    }
  }

  /**
   * ব্যবহারকারীর অনুমতি চেক করুন
   */
  static async checkCameraPermission(): Promise<PermissionStatus | null> {
    try {
      if ('permissions' in navigator) {
        const permission = await (navigator.permissions as any).query({ 
          name: 'camera' 
        });
        return permission;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * ক্যামেরা স্ট্রীম শুরু করুন
   */
  static async startStream(
    videoElement: HTMLVideoElement,
    facingMode: 'user' | 'environment' = 'environment'
  ): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;

    // ভিডিও সম্পূর্ণ হওয়ার জন্য অপেক্ষা করুন
    await new Promise(resolve => {
      videoElement.onloadedmetadata = () => {
        videoElement.play();
        resolve(null);
      };
    });

    return stream;
  }

  /**
   * স্ট্রীম থামিয়ে দিন
   */
  static stopStream(stream: MediaStream): void {
    stream.getTracks().forEach(track => track.stop());
  }

  /**
   * ভিডিও থেকে ফটো ক্যাপচার করুন
   */
  static captureFrame(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    quality: number = 0.9
  ): CapturedPhoto | null {
    try {
      const context = canvasElement.getContext('2d');
      if (!context) return null;

      const width = videoElement.videoWidth;
      const height = videoElement.videoHeight;

      canvasElement.width = width;
      canvasElement.height = height;

      context.drawImage(videoElement, 0, 0, width, height);

      const dataUrl = canvasElement.toDataURL('image/jpeg', quality);
      const size = Math.round((dataUrl.length - 'data:image/jpeg;base64,'.length) * 0.75);

      return {
        dataUrl,
        timestamp: new Date(),
        width,
        height,
        size,
        mimeType: 'image/jpeg',
      };
    } catch (error) {
      console.error('ফটো ক্যাপচার ত্রুটি:', error);
      return null;
    }
  }

  /**
   * মাল্টিপল ফ্রেম ক্যাপচার করুন (ভিডিও থেকে)
   */
  static async captureFrames(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    frameCount: number = 5,
    intervalMs: number = 500
  ): Promise<CapturedPhoto[]> {
    const frames: CapturedPhoto[] = [];

    for (let i = 0; i < frameCount; i++) {
      const frame = this.captureFrame(videoElement, canvasElement);
      if (frame) {
        frames.push(frame);
      }
      
      if (i < frameCount - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    return frames;
  }

  /**
   * ফটোকে ফাইল হিসাবে ডাউনলোড করুন
   */
  static downloadPhoto(photo: CapturedPhoto, filename?: string): void {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = filename || `photo-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * ফটোকে Blob-এ রূপান্তরিত করুন
   */
  static async photoToBlob(photo: CapturedPhoto): Promise<Blob> {
    const response = await fetch(photo.dataUrl);
    return response.blob();
  }

  /**
   * ছবির মেটাডেটা পান
   */
  static getPhotoMetadata(photo: CapturedPhoto): {
    dimensions: string;
    fileSize: string;
    timestamp: string;
  } {
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return {
      dimensions: `${photo.width}x${photo.height}`,
      fileSize: formatFileSize(photo.size),
      timestamp: photo.timestamp.toLocaleString('bn-BD'),
    };
  }

  /**
   * ব্রাউজার সাপোর্ট চেক করুন
   */
  static isSupported(): boolean {
    return !!(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      HTMLVideoElement.prototype.play
    );
  }

  /**
   * ত্রুটির বার্তা অনুবাদ করুন
   */
  static getErrorMessage(error: any): string {
    if (error.name === 'NotAllowedError') {
      return 'ক্যামেরা অ্যাক্সেস অনুমোদিত হয়নি';
    } else if (error.name === 'NotFoundError') {
      return 'এই ডিভাইসে কোনো ক্যামেরা পাওয়া যায়নি';
    } else if (error.name === 'NotReadableError') {
      return 'ক্যামেরা অন্য অ্যাপ্লিকেশনে ব্যবহৃত হচ্ছে';
    } else if (error.name === 'SecurityError') {
      return 'সিকিউরিটি কারণে ক্যামেরা অ্যাক্সেস অনুমোদিত নয়';
    } else if (error.name === 'TypeError') {
      return 'এই ব্রাউজারে ক্যামেরা সাপোর্ট করা হয় না';
    }
    return error.message || 'অজানা ক্যামেরা ত্রুটি';
  }
}

/**
 * ব্যবহার উদাহরণ:
 * 
 * // ক্যামেরা উপলব্ধ তা চেক করুন
 * if (CameraService.isSupported()) {
 *   const videoEl = document.getElementById('video') as HTMLVideoElement;
 *   const canvasEl = document.getElementById('canvas') as HTMLCanvasElement;
 *   
 *   try {
 *     // ক্যামেরা শুরু করুন
 *     const stream = await CameraService.startStream(videoEl, 'environment');
 *     
 *     // ফটো ক্যাপচার করুন
 *     const photo = CameraService.captureFrame(videoEl, canvasEl);
 *     if (photo) {
 *       console.log('ফটো:', photo);
 *       
 *       // মেটাডেটা পান
 *       const meta = CameraService.getPhotoMetadata(photo);
 *       console.log('আকার:', meta.dimensions);
 *       console.log('সাইজ:', meta.fileSize);
 *     }
 *     
 *     // ক্যামেরা বন্ধ করুন
 *     CameraService.stopStream(stream);
 *   } catch (error) {
 *     console.error(CameraService.getErrorMessage(error));
 *   }
 * }
 */
