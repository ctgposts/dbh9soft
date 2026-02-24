/**
 * CameraCapture Component
 * স্ট্যান্ডালোন ক্যামেরা ক্যাপচার কম্পোনেন্ট
 */

import React, { useRef, useState } from 'react';
import { Camera, RotateCcw, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { CameraService, CapturedPhoto } from '@/services/CameraService';

interface CameraCaptureProps {
  onCapture: (photo: CapturedPhoto) => void;
  onClose?: () => void;
  facingMode?: 'user' | 'environment';
  autoStart?: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onClose,
  facingMode = 'environment',
  autoStart = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isActive, setIsActive] = useState(autoStart);
  const [error, setError] = useState<string | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>(facingMode);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);

  // ক্যামেরা শুরু করুন
  const startCamera = async () => {
    try {
      setError(null);
      // Stop any existing stream before starting a new one
      if (streamRef.current) {
        CameraService.stopStream(streamRef.current);
      }
      if (videoRef.current) {
        const stream = await CameraService.startStream(videoRef.current, currentFacingMode);
        streamRef.current = stream;
        setIsActive(true);
      }
    } catch (err) {
      const errorMsg = CameraService.getErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // ক্যামেরা থামান
  const stopCamera = () => {
    if (streamRef.current) {
      // Stop all tracks to properly release camera
      streamRef.current.getTracks().forEach(track => track.stop());
      CameraService.stopStream(streamRef.current);
      streamRef.current = null;
    }
    setIsActive(false);
  };

  // ফটো ক্যাপচার করুন
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const photo = CameraService.captureFrame(videoRef.current, canvasRef.current);
      if (photo) {
        setCapturedPhoto(photo);
        stopCamera();
        toast.success('ছবি ক্যাপচার হয়েছে');
      }
    }
  };

  // ক্যামেরা পরিবর্তন করুন
  const switchCamera = async () => {
    stopCamera();
    const newMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    setCurrentFacingMode(newMode);
    
    // সামান্য দেরি
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (videoRef.current) {
      try {
        const stream = await CameraService.startStream(videoRef.current, newMode);
        streamRef.current = stream;
        setIsActive(true);
      } catch (err) {
        const errorMsg = CameraService.getErrorMessage(err);
        setError(errorMsg);
        toast.error(errorMsg);
      }
    }
  };

  // ক্যাপচার গ্রহণ করুন
  const acceptCapture = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      toast.success('ছবি নির্বাচিত হয়েছে');
    }
  };

  // পুনরায় ক্যাপচার করুন
  const retakeCapture = async () => {
    setCapturedPhoto(null);
    await startCamera();
  };

  // শুরু করুন যদি autoStart হয়
  React.useEffect(() => {
    if (autoStart && !capturedPhoto) {
      startCamera();
    }
    return () => {
      // Cleanup: Stop camera and release all resources when component unmounts
      stopCamera();
    };
  }, [autoStart]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* হেডার */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          <h2 className="text-lg font-bold">ক্যামেরা থেকে ছবি তুলুন</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="hover:bg-blue-800 p-2 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* কন্টেন্ট */}
      <div className="p-6">
        {/* ত্রুটি সতর্কতা */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ক্যামেরা মোড */}
        {isActive && !capturedPhoto ? (
          <div className="space-y-4">
            {/* ভিডিও স্ট্রীম */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-96 object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* ক্যাপচার ইন্ডিকেটর */}
              <div className="absolute top-4 right-4 flex items-center gap-2 text-white text-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                লাইভ
              </div>
            </div>

            {/* কন্ট্রোলস */}
            <div className="grid grid-cols-3 gap-3">
              {/* ক্যামেরা সুইচ বাটন */}
              <button
                onClick={switchCamera}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">পরিবর্তন</span>
              </button>

              {/* ক্যাপচার বাটন */}
              <button
                onClick={capturePhoto}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 col-span-2"
              >
                <Camera className="w-5 h-5" />
                ছবি তুলুন
              </button>
            </div>
          </div>
        ) : !capturedPhoto ? (
          // ক্যামেরা অবিদ্যমান
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📷</div>
            <p className="text-gray-600 mb-4">ক্যামেরা শুরু করতে প্রস্তুত নন</p>
            <button
              onClick={startCamera}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              ক্যামেরা শুরু করুন
            </button>
          </div>
        ) : (
          // প্রিভিউ মোড
          <div className="space-y-4">
            {/* ক্যাপচার করা ছবি */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={capturedPhoto.dataUrl}
                alt="ক্যাপচার করা ছবি"
                className="w-full h-96 object-cover"
              />
            </div>

            {/* মেটাডেটা */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-gray-600">আকার</div>
                <div className="font-semibold text-gray-800">
                  {capturedPhoto.width}×{capturedPhoto.height}
                </div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-gray-600">সাইজ</div>
                <div className="font-semibold text-gray-800">
                  {Math.round(capturedPhoto.size / 1024)} KB
                </div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-gray-600">সময়</div>
                <div className="font-semibold text-gray-800 text-xs">
                  {capturedPhoto.timestamp.toLocaleTimeString('bn-BD')}
                </div>
              </div>
            </div>

            {/* অ্যাকশন বাটন */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={retakeCapture}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                পুনরায় তুলুন
              </button>
              <button
                onClick={acceptCapture}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                নির্বাচন করুন
              </button>
            </div>
          </div>
        )}

        {/* ব্রাউজার সাপোর্ট চেক */}
        {!CameraService.isSupported() && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
            ⚠️ এই ব্রাউজারে ক্যামেরা সাপোর্ট করা হয় না।
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
