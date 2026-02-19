/**
 * useCamera Hook
 * ক্যামেরা ক্যাপচার এবং ছবি প্রসেসিং এর জন্য কাস্টম হুক
 */

import { useRef, useState, useEffect, useCallback } from 'react';

interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isActive: boolean;
  error: string | null;
  startCamera: (options?: CameraOptions) => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => string | null;
  switchCamera: () => Promise<void>;
  getAvailableCameras: () => Promise<MediaDeviceInfo[]>;
}

export const useCamera = (): UseCameraReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment');

  // ক্লিনআপ
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ক্যামেরা শুরু করুন
  const startCamera = useCallback(async (options?: CameraOptions) => {
    try {
      setError(null);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: options?.facingMode || currentFacingMode,
          width: { ideal: options?.width || 1280 },
          height: { ideal: options?.height || 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsActive(true);
        
        if (options?.facingMode) {
          setCurrentFacingMode(options.facingMode);
        }
      }
    } catch (err) {
      const errorMessage = 
        err instanceof Error ? err.message : 'ক্যামেরা অ্যাক্সেস ব্যর্থ';
      setError(errorMessage);
      console.error('ক্যামেরা ত্রুটি:', err);
    }
  }, [currentFacingMode]);

  // ক্যামেরা বন্ধ করুন
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  }, []);

  // ফটো ক্যাপচার করুন
  const capturePhoto = useCallback((): string | null => {
    if (videoRef.current && canvasRef.current) {
      try {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          
          context.drawImage(videoRef.current, 0, 0);
          return canvasRef.current.toDataURL('image/jpeg', 0.9);
        }
      } catch (err) {
        const errorMessage = 
          err instanceof Error ? err.message : 'ছবি ক্যাপচার ব্যর্থ';
        setError(errorMessage);
        console.error('ক্যাপচার ত্রুটি:', err);
      }
    }
    return null;
  }, []);

  // ক্যামেরা পরিবর্তন করুন
  const switchCamera = useCallback(async () => {
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    stopCamera();
    
    // সামান্য দেরি দিন ক্যামেরা সুইচ হওয়ার জন্য
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await startCamera({ facingMode: newFacingMode });
  }, [currentFacingMode, startCamera, stopCamera]);

  // উপলব্ধ ক্যামেরা সংগ্রহ করুন
  const getAvailableCameras = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (err) {
      console.error('ক্যামেরা তালিকা ত্রুটি:', err);
      return [];
    }
  }, []);

  return {
    videoRef: videoRef as unknown as React.RefObject<HTMLVideoElement>,
    canvasRef: canvasRef as unknown as React.RefObject<HTMLCanvasElement>,
    isActive,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    getAvailableCameras,
  };
};

/**
 * ব্যবহার উদাহরণ:
 * 
 * const { videoRef, canvasRef, isActive, startCamera, stopCamera, capturePhoto } = useCamera();
 * 
 * // ক্যামেরা শুরু করুন
 * <button onClick={() => startCamera()}>ক্যামেরা শুরু করুন</button>
 * 
 * // ভিডিও প্রিভিউ
 * <video ref={videoRef} autoPlay playsInline />
 * 
 * // ক্যানভাস (লুকানো)
 * <canvas ref={canvasRef} className="hidden" />
 * 
 * // ছবি ক্যাপচার করুন
 * <button onClick={() => {
 *   const photoUrl = capturePhoto();
 *   stopCamera();
 * }}>ছবি তুলুন</button>
 */
