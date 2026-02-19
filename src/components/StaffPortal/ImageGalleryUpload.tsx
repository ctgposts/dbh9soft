import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  compressImage,
  formatFileSize,
  imageToBase64,
  blobToFile,
  CompressionResult,
} from '../../utils/ImageCompression';

interface ImageGalleryUploadProps {
  productId: string;
  barcode: string;
  serialNumber: string;
  variantId: number;
  maxImages?: number;
  targetSize?: number;
  onClose: () => void;
  onImagesUploaded: (images: string[]) => void;
}

interface ImagePreview {
  id: string;
  file?: File;
  preview: string;
  compression?: CompressionResult;
  uploading?: boolean;
  error?: string;
}

export const ImageGalleryUpload: React.FC<ImageGalleryUploadProps> = ({
  productId,
  barcode,
  serialNumber,
  variantId,
  maxImages = 3,
  targetSize = 100000,
  onClose,
  onImagesUploaded,
}) => {
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const newImages: ImagePreview[] = [];

      for (let i = 0; i < files.length; i++) {
        if (images.length + newImages.length >= maxImages) {
          toast.warning(`সর্বোচ্চ ${maxImages} ছবি যোগ করা যায়`);
          break;
        }

        const file = files[i];

        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} একটি ছবি নয়`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} খুব বড় (সর্বোচ্চ 5MB)`);
          continue;
        }

        // প্রিভিউ তৈরি করুন
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview: ImagePreview = {
            id: `${Date.now()}-${i}`,
            file,
            preview: e.target?.result as string,
          };

          newImages.push(preview);

          if (newImages.length === [...files].filter((f) => f.type.startsWith('image/')).length) {
            setImages((prev) => [...prev, ...newImages]);
            toast.success(`${newImages.length} ছবি যোগ করা হয়েছে`);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [images.length, maxImages]
  );

  const handleDragDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    toast.info('ছবি সরানো হয়েছে');
  };

  const compressAndPrepareImages = async () => {
    const compressionResults: ImagePreview[] = [];

    for (const image of images) {
      if (!image.file) continue;

      try {
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id ? { ...img, uploading: true } : img
          )
        );

        // কম্প্রেস করুন
        const result = await compressImage(image.file, targetSize, {
          quality: 0.85,
        });

        if (result.success && result.blob) {
          const compressedFile = blobToFile(result.blob, image.file.name);

          const updatedImage: ImagePreview = {
            ...image,
            file: compressedFile,
            compression: result,
            uploading: false,
          };

          compressionResults.push(updatedImage);

          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id ? updatedImage : img
            )
          );

          toast.success(
            `✅ ${image.file.name} - সংরক্ষিত: ${formatFileSize(result.compressedSize)}`
          );
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'কম্প্রেশন ব্যর্থ';

        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? { ...img, error: errorMsg, uploading: false }
              : img
          )
        );

        toast.error(`❌ ${image.file?.name}: ${errorMsg}`);
      }
    }

    return compressionResults;
  };

  const handleUpload = async () => {
    if (images.length === 0) {
      toast.warning('কোনো ছবি নির্বাচন করা হয়নি');
      return;
    }

    setIsUploading(true);

    try {
      // কম্প্রেস করুন
      const compressedImages = await compressAndPrepareImages();

      if (compressedImages.length === 0) {
        throw new Error('কোনো ছবি প্রস্তুত করা যায়নি');
      }

      // এখানে আপনার ব্যাকএন্ড API কলটি থাকবে
      // ফিলহাল simulated upload
      setUploadProgress(0);

      for (let i = 0; i < compressedImages.length; i++) {
        const image = compressedImages[i];

        if (!image.file) continue;

        try {
          // Base64 এ রূপান্তর করুন (production এ FormData ব্যবহার করুন)
          const base64 = await imageToBase64(image.file);

          // Simulated upload delay
          await new Promise((resolve) => setTimeout(resolve, 1000));

          setUploadProgress(Math.round(((i + 1) / compressedImages.length) * 100));
        } catch (error) {
          console.error(`Upload error for image ${i}:`, error);
        }
      }

      toast.success(`${compressedImages.length} ছবি সফলভাবে আপলোড করা হয়েছে`);

      // Callback
      const uploadedImages = compressedImages
        .map((img) => img.preview)
        .filter(Boolean);
      onImagesUploaded(uploadedImages);

      // Reset
      setImages([]);
      setUploadProgress(0);
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      toast.error(`আপলোড ব্যর্থ: ${error instanceof Error ? error.message : 'অজানা ত্রুটি'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
        {/* হেডার */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sticky top-0 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            <h2 className="text-lg font-bold">ছবি আপলোড করুন</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="hover:bg-green-800 p-1 rounded transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* কন্টেন্ট */}
        <div className="p-6 space-y-4">
          {/* পণ্য তথ্য */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="font-semibold text-blue-900 mb-2">📋 পণ্য তথ্য:</p>
            <div className="grid grid-cols-2 gap-2 text-blue-800">
              <div>
                <span className="font-semibold">সিরিয়াল:</span> {serialNumber}
              </div>
              <div>
                <span className="font-semibold">ভেরিয়েন্ট:</span> #{variantId}
              </div>
              <div>
                <span className="font-semibold">বারকোড:</span> {barcode}
              </div>
              <div>
                <span className="font-semibold">ছবি:</span> {images.length}/{maxImages}
              </div>
            </div>
          </div>

          {/* ড্র্যাগ-ড্রপ এরিয়া */}
          {images.length < maxImages && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDragDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 bg-purple-50 transition"
            >
              <Upload className="w-10 h-10 text-purple-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-700">ছবি ড্র্যাগ করুন বা ক্লিক করুন</p>
              <p className="text-sm text-gray-500">JPEG, PNG বা WebP (সর্বোচ্চ 5MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
          )}

          {/* ছবির লিস্ট */}
          {images.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">নির্বাচিত ছবি ({images.length}/{maxImages})</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />

                    {/* স্ট্যাটাস ব্যাজ */}
                    <div className="absolute top-1 right-1">
                      {image.uploading && (
                        <div className="bg-blue-500 text-white rounded-full p-1">
                          <Loader className="w-4 h-4 animate-spin" />
                        </div>
                      )}
                      {image.error && (
                        <div className="bg-red-500 text-white rounded-full p-1" title={image.error}>
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                      {image.compression?.success && !image.uploading && (
                        <div className="bg-green-500 text-white rounded-full p-1" title="প্রস্তুত">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* তথ্য */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg transition flex items-center justify-center">
                      {image.compression && !image.error && (
                        <div className="text-white text-center text-xs opacity-0 group-hover:opacity-100 transition">
                          <div>{formatFileSize(image.compression.compressedSize)}</div>
                          <div>{image.compression.compressionRatio}%</div>
                        </div>
                      )}
                    </div>

                    {/* ডিলিট বাটন */}
                    <button
                      onClick={() => removeImage(image.id)}
                      disabled={image.uploading}
                      className="absolute top-1 left-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* কম্প্রেশন সেটিংস */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="font-semibold text-gray-700 mb-2">⚙️ কম্প্রেশন সেটিংস:</p>
            <div className="text-sm text-gray-600 space-y-1">
              <div>টার্গেট সাইজ: {formatFileSize(targetSize)}</div>
              <div>কোয়ালিটি: 85%</div>
              <div>ফরম্যাট: JPEG</div>
            </div>
          </div>

          {/* আপলোড প্রগতি */}
          {isUploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">আপলোড হচ্ছে...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* ফুটার */}
        <div className="bg-gray-100 p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-medium hover:bg-gray-600 transition disabled:opacity-50"
          >
            বাতিল করুন
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || images.length === 0}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                আপলোড হচ্ছে...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                আপলোড করুন ({images.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
