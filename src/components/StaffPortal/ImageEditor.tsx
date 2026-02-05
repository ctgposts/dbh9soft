import React, { useRef, useState, useEffect } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Download, X, Crop } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Image Editor Component
 * ছবি ক্রপ, রোটেট, জুম করার টুলস
 */

interface ImageEditorProps {
  imageUrl: string;
  onSave?: (editedImageUrl: string) => void;
  onClose?: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  imageUrl,
  onSave,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [cropMode, setCropMode] = useState(false);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [cropEnd, setCropEnd] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // ছবি লোড করুন
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      drawImage(img, 0, 1);
    };
    img.onerror = () => {
      toast.error('ছবি লোড ব্যর্থ');
    };
  }, [imageUrl]);

  // ছবি আঁকুন
  const drawImage = (img: HTMLImageElement, rot: number, zm: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas সাইজ সেট করুন
    canvas.width = img.width;
    canvas.height = img.height;

    // ক্লিয়ার এবং রিড্র করুন
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // সেন্টার এ রোটেট করুন
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(zm, zm);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // ছবি আঁকুন
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  };

  // রোটেট করুন
  const handleRotate = (degrees: number) => {
    const newRotation = (rotation + degrees) % 360;
    setRotation(newRotation);
    if (image) {
      drawImage(image, newRotation, zoom);
    }
  };

  // জুম করুন
  const handleZoom = (factor: number) => {
    const newZoom = Math.min(Math.max(zoom + factor, 0.1), 3);
    setZoom(newZoom);
    if (image) {
      drawImage(image, rotation, newZoom);
    }
  };

  // ক্রপ স্টার্ট
  const handleCropStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setCropStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // ক্রপ এন্ড
  const handleCropEnd = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setCropEnd({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // সংরক্ষণ করুন
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const editedImage = canvas.toDataURL('image/jpeg', 0.95);
      onSave?.(editedImage);
      toast.success('ছবি সংরক্ষণ করা হয়েছে!');
    }
  };

  // রিসেট করুন
  const handleReset = () => {
    setRotation(0);
    setZoom(1);
    setCropMode(false);
    if (image) {
      drawImage(image, 0, 1);
    }
    toast.info('সম্পাদনা রিসেট করা হয়েছে');
  };

  // ডাউনলোড করুন
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.download = `edited-image-${Date.now()}.jpg`;
      link.click();
      toast.success('ছবি ডাউনলোড করা হয়েছে');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* হেডার */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">🖼️ ছবি সম্পাদক</h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* কন্টেন্ট */}
        <div className="p-6 space-y-4">
          {/* ক্যানভাস */}
          <div
            ref={containerRef}
            className="bg-gray-100 rounded-lg p-4 flex justify-center overflow-auto max-h-96"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleCropStart}
              onMouseUp={handleCropEnd}
              className={`max-w-full max-h-full ${cropMode ? 'cursor-crosshair' : ''}`}
            />
          </div>

          {/* কন্ট্রোলস */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* রোটেশন */}
            <button
              onClick={() => handleRotate(90)}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition font-semibold"
            >
              <RotateCw className="w-4 h-4" />
              ৯০° ঘোরান
            </button>

            {/* জুম ইন */}
            <button
              onClick={() => handleZoom(0.1)}
              className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2 transition font-semibold"
            >
              <ZoomIn className="w-4 h-4" />
              জুম ইন
            </button>

            {/* জুম আউট */}
            <button
              onClick={() => handleZoom(-0.1)}
              className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2 transition font-semibold"
            >
              <ZoomOut className="w-4 h-4" />
              জুম আউট
            </button>

            {/* ক্রপ */}
            <button
              onClick={() => setCropMode(!cropMode)}
              className={`${
                cropMode
                  ? 'bg-red-100 text-red-700'
                  : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
              } px-4 py-2 rounded-lg flex items-center gap-2 transition font-semibold`}
            >
              <Crop className="w-4 h-4" />
              {cropMode ? 'ক্রপ বন্ধ' : 'ক্রপ করুন'}
            </button>

            {/* রিসেট */}
            <button
              onClick={handleReset}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition font-semibold"
            >
              সবকিছু রিসেট করুন
            </button>

            {/* ডাউনলোড */}
            <button
              onClick={handleDownload}
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg flex items-center gap-2 transition font-semibold"
            >
              <Download className="w-4 h-4" />
              ডাউনলোড করুন
            </button>
          </div>

          {/* স্ট্যাটাস */}
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 space-y-1">
            <p>📐 রোটেশন: {rotation}°</p>
            <p>🔍 জুম: {(zoom * 100).toFixed(0)}%</p>
            {cropMode && (
              <p className="text-orange-600">
                ✂️ ক্রপ মোড সক্রিয় - ছবিতে ড্র্যাগ করুন
              </p>
            )}
          </div>

          {/* অ্যাকশন বাটন */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-bold transition"
            >
              বাতিল করুন
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
