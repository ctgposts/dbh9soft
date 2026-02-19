import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Upload, Search, X, Loader, AlertCircle, Camera, Video, RotateCcw, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { PdfReportGenerator } from '../../services/PdfReportGenerator';
import { FabricAndDesignAnalyzer, type FabricAnalysis } from '../../services/FabricAndDesignAnalyzer';

/**
 * Product Image Recognition Feature
 * ছবি আপলোড করে পণ্যের বিস্তারিত তথ্য প্রদর্শন করে
 */

interface ProductMatch {
  productId: string;
  name: string;
  category: string;
  description: string;
  price: number;
  color: string;
  size: string;
  material: string;
  stock: number;
  imageUrl: string;
  matchScore: number; // 0-100 শতাংশ
  similarProducts: Array<{
    id: string;
    name: string;
    matchScore: number;
  }>;
}

interface ImageRecognitionResult {
  uploadedImageUrl: string;
  primaryMatch: ProductMatch | null;
  allMatches: ProductMatch[];
  confidence: number;
  processingTime: number;
  tags: string[]; // যেমন: বোরকা, নাক্সো, কালো, একসাইজ ইত্যাদি
  fabricAnalysis?: FabricAnalysis; // নতুন - বিস্তারিত ফ্যাব্রিক বিশ্লেষণ
  analysisDetails?: {
    embroideryType: string[];
    fabricTypes: string[];
    neckline: string;
    sleeves: string;
    colors: { primary: string; secondary: string[] };
    decorationLevel: string;
  };
}

export const ProductImageRecognition: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<ImageRecognitionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductMatch | null>(null);
  
  // ক্যামেরা স্টেট
  const [showCamera, setShowCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Real-time Convex queries
  const allProducts = useQuery(api.productImageRecognition?.recognizeProductFromImage, {
    imageFeatures: {
      colors: [],
      patterns: [],
      style: 'abaya',
      tags: [],
    },
  } as any);

  // ক্লিনআপ
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // ক্যামেরা শুরু করুন
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // পিছনের ক্যামেরা
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setShowCamera(true);
        toast.success('ক্যামেরা সক্রিয়');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ক্যামেরা অ্যাক্সেস ব্যর্থ';
      setError(errorMessage);
      toast.error('ক্যামেরা অ্যাক্সেস প্রয়োজন: ' + errorMessage);
    }
  };

  // ক্যামেরা বন্ধ করুন
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
    setShowCamera(false);
  };

  // স্ন্যাপশট ক্যাপচার করুন
  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        // ক্যানভাস থেকে ছবি নিন
        const imageUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
        setUploadedImage(imageUrl);
        stopCamera();
        
        // স্বয়ংক্রিয় স্বীকৃতি শুরু করুন
        setLoading(true);
        recognizeProduct(imageUrl);
        toast.success('ছবি ক্যাপচার হয়েছে');
      }
    }
  };

  // ছবি আপলোড হ্যান্ডলার
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ফাইল সাইজ চেক করুন (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ছবির সাইজ 5MB এর বেশি হতে পারে না');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ছবি পড়ুন
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageUrl = event.target?.result as string;
        setUploadedImage(imageUrl);

        // পণ্য শনাক্তকরণ শুরু করুন
        await recognizeProduct(imageUrl);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ছবি আপলোড ব্যর্থ';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // পণ্য শনাক্তকরণ সেবা
  const recognizeProduct = async (imageUrl: string) => {
    try {
      const startTime = Date.now();

      // Phase 1: ছবি বিশ্লেষণ এবং বৈশিষ্ট্য নির্ধারণ
      const features = await extractImageFeatures(imageUrl);

      // Phase 2: Advanced Fabric এবং Design বিশ্লেষণ
      const fabricAnalysis = await performAdvancedAnalysis(imageUrl);

      // Phase 3: বৈশিষ্ট্যের উপর ভিত্তি করে পণ্য খুঁজুন
      const matches = await findMatchingProducts(features, fabricAnalysis);

      const processingTime = Date.now() - startTime;

      // Phase 4: ফলাফল সংগঠিত করুন
      const result: ImageRecognitionResult = {
        uploadedImageUrl: imageUrl,
        primaryMatch: matches.length > 0 ? matches[0] : null,
        allMatches: matches,
        confidence: matches.length > 0 ? matches[0].matchScore : 0,
        processingTime: processingTime,
        tags: features.tags,
        fabricAnalysis: fabricAnalysis,
        analysisDetails: {
          embroideryType: fabricAnalysis.embroideryType,
          fabricTypes: fabricAnalysis.fabricType,
          neckline: fabricAnalysis.designElements.neckline,
          sleeves: fabricAnalysis.designElements.sleeve,
          colors: {
            primary: fabricAnalysis.colors.primary,
            secondary: fabricAnalysis.colors.secondary,
          },
          decorationLevel: fabricAnalysis.decorations.stoneWork || fabricAnalysis.decorations.beadWork ? 'উচ্চ' : 'মধ্যম',
        },
      };

      // Phase 5: স্বীকৃতি ফলাফল লগ করুন (ভবিষ্যতের জন্য)
      // TODO: logRecognitionSearch mutation তৈরি করুন

      setRecognitionResult(result);
      if (matches.length > 0) {
        setSelectedProduct(matches[0]);
        toast.success(`✨ ${matches[0].name} সফলভাবে সনাক্ত হয়েছে!`);
      } else {
        toast.warning('কোন মিলিয়ে যায় এমন পণ্য পাওয়া যায়নি');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'শনাক্তকরণ ব্যর্থ';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Advanced Fabric এবং Design বিশ্লেষণ
  const performAdvancedAnalysis = async (imageUrl: string): Promise<FabricAnalysis> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageUrl;

      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Advanced Analysis করুন
          const analysis = await FabricAndDesignAnalyzer.analyzeImageForFabric(imageData);
          resolve(analysis);
        }
      };
    });
  };

  // ছবি বৈশিষ্ট্য নির্ধারণ করুন
  const extractImageFeatures = async (imageUrl: string): Promise<{
    colors: string[];
    patterns: string[];
    style: string;
    tags: string[];
  }> => {
    return new Promise((resolve) => {
      // Canvas এ ছবি লোড করুন
      const img = new Image();
      img.src = imageUrl;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            colors: ['Unknown'],
            patterns: [],
            style: 'abaya',
            tags: [],
          });
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // পিক্সেল ডেটা বিশ্লেষণ করুন
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // রং নির্ধারণ করুন
        const colorCounts: Record<string, number> = {};
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // রং শ্রেণীবদ্ধ করুন
          let color = 'অন্যান্য';
          if (r < 100 && g < 100 && b < 100) color = 'কালো';
          else if (r > 200 && g > 200 && b > 200) color = 'সাদা';
          else if (r > g && r > b) color = 'লাল';
          else if (g > r && g > b) color = 'সবুজ';
          else if (b > r && b > g) color = 'নীল';
          else if (r > 150 && g < 100 && b < 100) color = 'গাঢ় লাল';

          colorCounts[color] = (colorCounts[color] || 0) + 1;
        }

        const colors = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([color]) => color);

        // মক ডেটা: আসল ইমপ্লিমেন্টে ML মডেল ব্যবহার করুন
        resolve({
          colors: colors.length > 0 ? colors : ['কালো'],
          patterns: ['সমান', 'প্রসারিত'],
          style: 'abaya',
          tags: colors.concat(['আবায়া', 'ঐতিহ্যবাহী']),
        });
      };

      img.onerror = () => {
        resolve({
          colors: ['Unknown'],
          patterns: [],
          style: 'abaya',
          tags: [],
        });
      };
    });
  };

  // মিলিয়ে যায় এমন পণ্য খুঁজুন (Advanced Analysis সহ)
  const findMatchingProducts = async (
    features: {
      colors: string[];
      patterns: string[];
      style: string;
      tags: string[];
    },
    fabricAnalysis?: FabricAnalysis
  ): Promise<ProductMatch[]> => {
    try {
      // বিদ্যমান API কল ব্যবহার করুন
      const result = await (api as any).productImageRecognition.recognizeProductFromImage({
        imageFeatures: features,
        branchId: "current-branch",
      });

      if (!result?.matches || result.matches.length === 0) {
        return [];
      }

      // ফলাফল রূপান্তরিত করুন
      const matches: ProductMatch[] = (result.matches as any[]).map((product: any, index: number) => ({
        productId: product._id || `p-${index}`,
        name: product.name || 'অজানা পণ্য',
        category: product.category || 'অন্যান্য',
        description: product.description || 'কোনো বর্ণনা নেই',
        price: product.price || 0,
        color: product.color || 'অজানা',
        size: (product.sizes && product.sizes[0]) || 'একসাইজ',
        material: product.material || 'অজানা',
        stock: product.stock || 0,
        imageUrl: product.imageUrl || 'https://via.placeholder.com/300?text=পণ্য+ছবি',
        matchScore: product.matchScore || 75,
        similarProducts: [],
      }));

      // স্কোর অনুসারে সাজান এবং শীর্ষ 3 ফেরত দিন
      return matches.sort((a: ProductMatch, b: ProductMatch) => b.matchScore - a.matchScore).slice(0, 3);
    } catch (err) {
      console.warn('পণ্য অনুসন্ধান ব্যর্থ:', err);
      return [];
    }
  };

  // পণ্য বিবরণ কার্ড
  const ProductCard = ({ product }: { product: ProductMatch }) => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
      {/* পণ্য ছবি */}
      <div className="relative bg-gray-200 aspect-square flex items-center justify-center">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=পণ্য+ছবি';
          }}
        />
        {/* মিল স্কোর ব্যাজ */}
        <div className="absolute top-3 right-3 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">
          {product.matchScore}%
        </div>
      </div>

      {/* পণ্য তথ্য */}
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

        {/* বৈশিষ্ট্য */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">রং:</span>
            <span className="font-semibold ml-1">{product.color}</span>
          </div>
          <div>
            <span className="text-gray-500">সাইজ:</span>
            <span className="font-semibold ml-1">{product.size}</span>
          </div>
          <div>
            <span className="text-gray-500">উপাদান:</span>
            <span className="font-semibold ml-1">{product.material}</span>
          </div>
          <div>
            <span className="text-gray-500">স্টক:</span>
            <span className={`font-semibold ml-1 ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.stock > 0 ? `${product.stock} পণ্য` : 'স্টকে নেই'}
            </span>
          </div>
        </div>

        {/* মূল্য এবং বোতাম */}
        <div className="border-t pt-3 flex items-center justify-between">
          <span className="text-2xl font-bold text-blue-600">৳{product.price}</span>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
            কার্টে যোগ করুন
          </button>
        </div>

        {/* অনুরূপ পণ্য */}
        {product.similarProducts.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">অনুরূপ পণ্য:</p>
            <div className="space-y-1">
              {product.similarProducts.map((similar) => (
                <div key={similar.id} className="text-xs text-gray-600">
                  • {similar.name} ({similar.matchScore}% মিল)
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* হেডার */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🔍 পণ্য ছবি স্বীকৃতি</h1>
          <p className="text-gray-600">
            পণ্যের ছবি আপলোড করুন এবং তাৎক্ষণিক বিস্তারিত তথ্য পান
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* আপলোড সেকশন */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">ছবি আপলোড করুন</h2>

            {/* আপলোড এরিয়া */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300 rounded-lg p-12 text-center cursor-pointer hover:bg-blue-50 transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <p className="text-lg font-semibold text-gray-800">ছবি এখানে ড্র্যাগ করুন</p>
              <p className="text-sm text-gray-600 mt-1">বা ক্লিক করে ব্রাউজ করুন</p>
              <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF সমর্থিত (Max 5MB)</p>
            </div>

            {/* ক্যামেরা বাটন */}
            <div className="mt-4">
              <button
                onClick={startCamera}
                disabled={cameraActive}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
              >
                <Camera className="w-5 h-5" />
                ক্যামেরা দিয়ে ছবি তুলুন
              </button>
            </div>

            {/* ক্যামেরা মোডাল */}
            {showCamera && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full">
                  {/* ক্যামেরা হেডার */}
                  <div className="bg-gray-800 text-white p-4 flex items-center justify-between rounded-t-lg">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      ক্যামেরা থেকে ছবি তুলুন
                    </h3>
                    <button
                      onClick={stopCamera}
                      className="hover:bg-gray-700 p-2 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* ভিডিও স্ট্রীম */}
                  <div className="relative bg-black p-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-80 object-cover rounded-lg"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* ক্যাপচার বাটন */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
                      <button
                        onClick={captureSnapshot}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 transition shadow-lg"
                      >
                        <Camera className="w-5 h-5" />
                        ছবি তুলুন
                      </button>
                      <button
                        onClick={stopCamera}
                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold transition shadow-lg"
                      >
                        বন্ধ করুন
                      </button>
                    </div>
                  </div>

                  {/* ইনফো */}
                  <div className="p-4 bg-blue-50 border-t text-center text-sm text-gray-700">
                    📱 ক্যামেরা ব্যবহার করে পণ্য স্পষ্টভাবে ফোকাস করুন এবং ছবি তুলুন।
                  </div>
                </div>
              </div>
            )}

            {/* আপলোড করা ছবি প্রিভিউ */}
            {uploadedImage && !showCamera && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-2">প্রিভিউ:</h3>
                <div className="relative rounded-lg overflow-hidden">
                  <img src={uploadedImage} alt="প্রিভিউ" className="w-full h-64 object-cover" />
                  <button
                    onClick={() => {
                      setUploadedImage(null);
                      setRecognitionResult(null);
                      setError(null);
                    }}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* লোডিং স্টেট */}
            {loading && (
              <div className="mt-6 flex items-center justify-center gap-3 text-blue-600">
                <Loader className="w-5 h-5 animate-spin" />
                <span className="font-semibold">পণ্য শনাক্ত করা হচ্ছে...</span>
              </div>
            )}

            {/* ত্রুটি বার্তা */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">ত্রুটি</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* ফলাফল সেকশন */}
          <div>
            {recognitionResult && (
              <div className="space-y-4">
                {/* স্ট্যাটিস্টিক্স */}
                <div className="bg-white rounded-xl shadow-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3">📊 স্বীকৃতির বিবরণ</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">মিল শক্তি:</span>
                      <span className="font-semibold text-blue-600">
                        {recognitionResult.confidence}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">প্রক্রিয়াকরণ সময়:</span>
                      <span className="font-semibold">{recognitionResult.processingTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">মিল পণ্য:</span>
                      <span className="font-semibold">{recognitionResult.allMatches.length}</span>
                    </div>
                  </div>

                  {/* Advanced Fabric Analysis */}
                  {recognitionResult.analysisDetails && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <p className="text-sm font-semibold text-gray-800">বিস্তারিত বিশ্লেষণ</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* ফ্যাব্রিক্স */}
                        <div className="bg-purple-50 p-2 rounded">
                          <p className="text-gray-600 font-medium">কাপড়ের ধরণ:</p>
                          <p className="text-purple-700 font-semibold">
                            {recognitionResult.analysisDetails.fabricTypes.join(', ')}
                          </p>
                        </div>

                        {/* এমব্রয়ডারি */}
                        <div className="bg-pink-50 p-2 rounded">
                          <p className="text-gray-600 font-medium">এমব্রয়ডারি:</p>
                          <p className="text-pink-700 font-semibold">
                            {recognitionResult.analysisDetails.embroideryType.join(', ')}
                          </p>
                        </div>

                        {/* গলার আকৃতি */}
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-gray-600 font-medium">গলা:</p>
                          <p className="text-blue-700 font-semibold">
                            {recognitionResult.analysisDetails.neckline}
                          </p>
                        </div>

                        {/* হাতার স্টাইল */}
                        <div className="bg-green-50 p-2 rounded">
                          <p className="text-gray-600 font-medium">হাতা:</p>
                          <p className="text-green-700 font-semibold">
                            {recognitionResult.analysisDetails.sleeves}
                          </p>
                        </div>

                        {/* রঙ */}
                        <div className="bg-yellow-50 p-2 rounded">
                          <p className="text-gray-600 font-medium">প্রধান রঙ:</p>
                          <p className="text-yellow-700 font-semibold">
                            {recognitionResult.analysisDetails.colors.primary}
                          </p>
                        </div>

                        {/* সজ্জা স্তর */}
                        <div className="bg-red-50 p-2 rounded">
                          <p className="text-gray-600 font-medium">সজ্জার স্তর:</p>
                          <p className="text-red-700 font-semibold">
                            {recognitionResult.analysisDetails.decorationLevel}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ট্যাগ */}
                  {recognitionResult.tags.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-600 mb-2">চিহ্নিত বৈশিষ্ট্য:</p>
                      <div className="flex flex-wrap gap-2">
                        {recognitionResult.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* প্রাথমিক মিল */}
                {recognitionResult.primaryMatch && (
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3">🎯 সেরা মিল</h3>
                    <ProductCard product={recognitionResult.primaryMatch} />
                  </div>
                )}

                {/* অন্যান্য মিল */}
                {recognitionResult.allMatches.length > 1 && (
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3">
                      অন্যান্য মিল ({recognitionResult.allMatches.length - 1})
                    </h3>
                    <div className="space-y-3">
                      {recognitionResult.allMatches.slice(1).map((product) => (
                        <div
                          key={product.productId}
                          className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-lg transition"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-800">{product.name}</h4>
                              <p className="text-sm text-gray-600">৳{product.price}</p>
                            </div>
                            <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-bold">
                              {product.matchScore}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!uploadedImage && !recognitionResult && (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">ছবি আপলোড করে শুরু করুন</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductImageRecognition;
