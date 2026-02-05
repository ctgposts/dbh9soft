import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { Camera, ImagePlus, Settings, Home, BarChart3, Trophy, FileText, Package, Sliders } from 'lucide-react';
import { toast } from 'sonner';
import { ProductScanner } from './ProductScanner';
import { ProductDetailView } from './ProductDetailView';
import { ImageGalleryUpload } from './ImageGalleryUpload';
import { StaffProductSettingsPanel } from './StaffProductSettingsPanel';
import { StaffStatisticsDashboard } from './StaffStatisticsDashboard';
import { StaffLeaderboard } from './StaffLeaderboard';
import { DailyReportGenerator } from './DailyReportGenerator';
import { StaffProductDetailModule } from './StaffProductDetailModule';
import { StaffProductFeatureDashboard } from './StaffProductFeatureDashboard';

interface ScannedProduct {
  _id: string;
  name: string;
  brand?: string;
  description?: string;
  categoryId?: string;
  category?: string;
  price?: number;
  discountedPrice?: number;
  fabric?: string;
  color?: string;
  sizes?: string[];
  stock?: number;
  material?: string;
  embellishments?: string;
  imageUrl?: string;
  barcode?: string;
  rating?: number;
  reviews?: number;
}

interface ScannedBarcode {
  serialNumber: string;
  variantId: number;
  color: string;
  size: string;
  material?: string;
  embellishments?: string;
  createdDate?: string;
}

type ViewState = 'home' | 'scanner' | 'detail' | 'upload' | 'settings' | 'statistics' | 'leaderboard' | 'report' | 'product-detail-module' | 'feature-dashboard';

export const StaffProductPortal: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('home');
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [scannedBarcodeDetail, setScannedBarcodeDetail] = useState<ScannedBarcode | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [productsList, setProductsList] = useState<ScannedProduct[]>([]);

  // Production: Real products from database (via useQuery Convex hook)
  // If Convex is deployed with products
  // const convexProducts = useQuery(api.products.listActive);
  
  // For now, using mock data - Production ready to switch to Convex
  useEffect(() => {
    // TODO: When Convex is ready, uncomment above and use:
    // if (convexProducts) {
    //   setProductsList(convexProducts as any);
    //   console.log('✅ পণ্য লোড হয়েছে:', convexProducts.length);
    // }
    
    // Demo করার জন্য sample products (database থেকে replace করবেন)
    const mockProducts: ScannedProduct[] = [
      {
        _id: 'prod_001',
        name: 'প্রিমিয়াম কালো আবায়া',
        brand: 'আল-খাদির',
        category: 'আবায়া',
        price: 2500,
        fabric: 'নকশী সিল্ক',
        color: 'কালো',
        sizes: ['S', 'M', 'L', 'XL'],
        stock: 45,
        material: 'সিল্ক ৮০%, কটন ২০%',
        barcode: 'DBH-0001',
        imageUrl: 'https://via.placeholder.com/300x400?text=পণ্য',
        rating: 4.8,
        reviews: 124,
      },
      {
        _id: 'prod_002',
        name: 'গোলাপী হিজাব স্কার্ফ',
        brand: 'রোজ কালেকশন',
        category: 'হিজাব',
        price: 850,
        fabric: 'মসৃণ শিফন',
        color: 'গোলাপী',
        sizes: ['One Size'],
        stock: 120,
        material: 'শিফন ১০০%',
        barcode: 'DBH-0002',
        imageUrl: 'https://via.placeholder.com/300x400?text=হিজাব',
        rating: 4.6,
        reviews: 89,
      },
      {
        _id: 'prod_003',
        name: 'নীল ডুপাটা সেট',
        brand: 'নীলাম',
        category: 'ডুপাটা',
        price: 1500,
        fabric: 'চুনি কাপড়',
        color: 'নীল',
        sizes: ['M', 'L'],
        stock: 67,
        material: 'চুনি ৯৫%, স্প্যান্ডেক্স ৫%',
        barcode: 'DBH-0003',
        imageUrl: 'https://via.placeholder.com/300x400?text=ডুপাটা',
        rating: 4.7,
        reviews: 156,
      },
      {
        _id: 'prod_004',
        name: 'সবুজ জরির কামিজ',
        brand: 'এমার্ল্যান্ড',
        category: 'কামিজ',
        price: 3200,
        fabric: 'জর্জেট, জরি',
        color: 'সবুজ',
        sizes: ['32', '34', '36', '38', '40'],
        stock: 34,
        material: 'জর্জেট, জরি, মোতি',
        barcode: 'DBH-0004',
        imageUrl: 'https://via.placeholder.com/300x400?text=কামিজ',
        rating: 4.9,
        reviews: 203,
      },
      {
        _id: 'prod_005',
        name: 'লাল বেনারসি শাড়ি',
        brand: 'বেনারস রত্ন',
        category: 'শাড়ি',
        price: 5500,
        fabric: 'খাঁটি বেনারসি শাড়ি',
        color: 'লাল',
        sizes: ['Free Size'],
        stock: 22,
        material: 'রেশম, সোনালী জরি',
        barcode: 'DBH-0005',
        imageUrl: 'https://via.placeholder.com/300x400?text=শাড়ি',
        rating: 4.95,
        reviews: 287,
      },
    ];
    
    setProductsList(mockProducts);
    console.log('✅ Products loaded: ', mockProducts.length, 'items');
  }, []);

  // বারকোড থেকে পণ্য খুঁজুন
  const findProductByBarcode = useCallback(async (barcode: string) => {
    setIsLoading(true);
    try {
      if (!productsList || productsList.length === 0) {
        console.error('❌ পণ্য তালিকা খালি:', productsList);
        toast.error('পণ্য তথ্য লোড হয়নি। আবার চেষ্টা করুন।');
        setViewState('home');
        return;
      }

      console.log('🔍 বারকোড খুঁজছি:', barcode, 'মোট পণ্য:', productsList.length);

      // বারকোড স্বাভাবিক করুন (whitespace সরান)
      const normalizedBarcode = barcode.trim().toUpperCase();

      // বারকোড দিয়ে সঠিক পণ্য খুঁজুন
      const found = productsList.find(
        (p) => p.barcode?.toUpperCase() === normalizedBarcode
      );

      if (!found) {
        console.warn('⚠️ পণ্য পাওয়া যায়নি। উপলব্ধ বারকোড:', 
          productsList.map(p => p.barcode).join(', ')
        );
        toast.error(`বারকোড "${normalizedBarcode}" খুঁজে পাওয়া যায়নি`);
        setScannedProduct(null);
        setViewState('home');
        return;
      }

      console.log('✅ পণ্য খুঁজে পেয়েছি:', found.name);

      // বারকোড ডিটেইল তৈরি করুন (পণ্য তথ্য থেকে)
      // বারকোড ফরম্যাট: "DBH-0001" -> variantId = 1
      const variantMatch = normalizedBarcode.match(/(\d+)/);
      const variantId = variantMatch ? parseInt(variantMatch[1], 10) : 1;

      const barcodeDetail: ScannedBarcode = {
        serialNumber: normalizedBarcode,
        variantId: variantId,
        color: found.color || 'অজানা',
        size: found.sizes?.[0] || 'One Size',
        material: found.material || 'তথ্য উপলব্ধ নয়',
        embellishments: found.embellishments || 'কোনো নিদর্শন নেই',
        createdDate: new Date().toLocaleDateString('bn-BD'),
      };

      // স্টেট আপডেট করুন
      setScannedBarcode(normalizedBarcode);
      setScannedProduct(found);
      setScannedBarcodeDetail(barcodeDetail);
      setProductImages([]); // ছবি রিসেট করুন
      setScanHistory((prev) => [normalizedBarcode, ...prev.slice(0, 9)]); // গত ১০টি রাখুন
      
      setViewState('detail');
      toast.success(`✅ পাওয়া গেছে: ${found.name} (৳${found.price})`);
      
      console.log('📊 পণ্য বিস্তারিত:', {
        name: found.name,
        barcode: normalizedBarcode,
        variant: variantId,
        color: found.color,
        price: found.price,
      });
    } catch (error) {
      console.error('❌ পণ্য খুঁজতে ত্রুটি:', error);
      toast.error('অপ্রত্যাশিত ত্রুটি। আবার চেষ্টা করুন।');
      setViewState('home');
    } finally {
      setIsLoading(false);
    }
  }, [productsList]);

  const handleScanSuccess = (barcode: string) => {
    setViewState('detail');
    findProductByBarcode(barcode);
  };

  const handleImagesUploaded = (images: string[]) => {
    setProductImages((prev) => [...prev, ...images]);
    toast.success(`${images.length} ছবি সফলভাবে সংরক্ষিত হয়েছে`);
    setViewState('detail');
  };

  const resetState = () => {
    setViewState('home');
    setScannedBarcode(null);
    setScannedProduct(null);
    setScannedBarcodeDetail(null);
    setProductImages([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* হেডার */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Camera className="w-8 h-8" />
              <h1 className="text-3xl font-bold">স্টাফ পণ্য পোর্টাল</h1>
            </div>
            <div className="text-sm opacity-75">
              ✨ আপনার দোকানের স্টাফদের জন্য পণ্য তথ্য এবং ছবি ব্যবস্থাপনা
            </div>
          </div>
        </div>
      </div>

      {/* মূল কন্টেন্ট */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {viewState === 'home' && (
          <div className="space-y-6">
            {/* স্বাগত বিভাগ */}
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <Camera className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">স্বাগতম!</h2>
              <p className="text-gray-600 mb-6">
                নিম্নে স্ক্যানার বাটনে ক্লিক করে পণ্য স্ক্যান করুন বা পূর্ববর্তী স্ক্যানগুলি
                দেখুন।
              </p>

              <button
                onClick={() => setViewState('scanner')}
                className="bg-purple-600 hover:bg-purple-700 text-white py-4 px-8 rounded-lg font-bold text-lg transition transform hover:scale-105 inline-flex items-center gap-2 shadow-lg"
              >
                <Camera className="w-6 h-6" />
                📷 বারকোড স্ক্যান করুন
              </button>
            </div>

            {/* দ্রুত অ্যাক্সেস কার্ড */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow p-6 border-t-4 border-indigo-500">
                <Sliders className="w-8 h-8 text-indigo-500 mb-2" />
                <h3 className="font-bold text-gray-800 mb-2">ফিচার সেটিংস</h3>
                <p className="text-sm text-gray-600 mb-3">
                  সব ফিচার দেখুন
                </p>
                <button
                  onClick={() => setViewState('feature-dashboard')}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  খুলুন →
                </button>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-t-4 border-cyan-500">
                <Package className="w-8 h-8 text-cyan-500 mb-2" />
                <h3 className="font-bold text-gray-800 mb-2">পণ্য মডিউল</h3>
                <p className="text-sm text-gray-600 mb-3">
                  সম্পূর্ণ পরিচালনা
                </p>
                <button
                  onClick={() => setViewState('product-detail-module')}
                  className="text-sm text-cyan-600 hover:text-cyan-700 font-semibold"
                >
                  খুলুন →
                </button>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
                <BarChart3 className="w-8 h-8 text-blue-500 mb-2" />
                <h3 className="font-bold text-gray-800 mb-2">স্ট্যাটিস্টিক্স</h3>
                <p className="text-sm text-gray-600 mb-3">
                  মোট স্ক্যান: <span className="font-bold">{scanHistory.length}</span>
                </p>
                <button
                  onClick={() => setViewState('statistics')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  দেখুন →
                </button>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
                <ImagePlus className="w-8 h-8 text-green-500 mb-2" />
                <h3 className="font-bold text-gray-800 mb-2">আপলোড করা ছবি</h3>
                <p className="text-sm text-gray-600 mb-3">
                  মোট: <span className="font-bold">{productImages.length}</span>
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-t-4 border-yellow-500">
                <Trophy className="w-8 h-8 text-yellow-500 mb-2" />
                <h3 className="font-bold text-gray-800 mb-2">লিডারবোর্ড</h3>
                <p className="text-sm text-gray-600 mb-3">প্রতিযোগিতা</p>
                <button
                  onClick={() => setViewState('leaderboard')}
                  className="text-sm text-yellow-600 hover:text-yellow-700 font-semibold"
                >
                  র‍্যাঙ্কিং →
                </button>
              </div>
            </div>

            {/* স্ক্যান হিস্টরি */}
            {scanHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">📜 সাম্প্রতিক স্ক্যান</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {scanHistory.map((barcode, index) => (
                    <button
                      key={index}
                      onClick={() => findProductByBarcode(barcode)}
                      className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold py-2 px-3 rounded-lg transition text-sm truncate"
                      title={barcode}
                    >
                      {barcode}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* নির্দেশনা */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-4">📚 কীভাবে ব্যবহার করবেন:</h3>
              <ol className="space-y-2 text-blue-800 list-decimal list-inside">
                <li>
                  <span className="font-semibold">বারকোড স্ক্যান করুন</span> - উপরের বাটনটি
                  ক্লিক করুন
                </li>
                <li>
                  <span className="font-semibold">পণ্য বিবরণ দেখুন</span> - সম্পূর্ণ তথ্য পাবেন
                </li>
                <li>
                  <span className="font-semibold">ছবি আপলোড করুন</span> - প্রোডাক্টের ছবি
                  যুক্ত করুন
                </li>
                <li>
                  <span className="font-semibold">সংরক্ষিত হয়</span> - স্বয়ংক্রিয়ভাবে
                  ডাটাবেসে যায়
                </li>
              </ol>
            </div>
          </div>
        )}

        {viewState === 'scanner' && (
          <ProductScanner
            onScan={handleScanSuccess}
            onClose={resetState}
          />
        )}

        {viewState === 'detail' && (
          <ProductDetailView
            product={scannedProduct || undefined}
            barcodeDetail={scannedBarcodeDetail || undefined}
            images={productImages}
            loading={isLoading}
            onBack={resetState}
            onUploadImage={() => setViewState('upload')}
          />
        )}

        {viewState === 'upload' && scannedProduct && scannedBarcodeDetail && (
          <ImageGalleryUpload
            productId={scannedProduct._id}
            barcode={scannedBarcode || 'UNKNOWN'}
            serialNumber={scannedBarcodeDetail.serialNumber}
            variantId={scannedBarcodeDetail.variantId}
            maxImages={3}
            targetSize={100000}
            onClose={() => setViewState('detail')}
            onImagesUploaded={handleImagesUploaded}
          />
        )}

        {viewState === 'statistics' && (
          <StaffStatisticsDashboard
            staffId="current-user"
            branchId="current-branch"
            onClose={resetState}
          />
        )}

        {viewState === 'leaderboard' && (
          <StaffLeaderboard
            period="monthly"
            category="uploads"
            onClose={resetState}
          />
        )}

        {viewState === 'report' && (
          <DailyReportGenerator
            branchId="current-branch"
            staffId="current-user"
            onClose={resetState}
          />
        )}

        {viewState === 'settings' && (
          <StaffProductSettingsPanel
            branchId="current-branch"
            onClose={resetState}
          />
        )}

        {viewState === 'product-detail-module' && (
          <StaffProductDetailModule
            productId={scannedProduct?._id || 'NEW'}
            branchId="current-branch"
            onClose={resetState}
            onSave={(config) => {
              console.log('সংরক্ষিত কনফিগ:', config);
              toast.success('পণ্য কনফিগারেশন সংরক্ষিত হয়েছে');
            }}
          />
        )}

        {viewState === 'feature-dashboard' && (
          <StaffProductFeatureDashboard />
        )}
      </div>

      {/* ফুটার */}
      <div className="bg-gray-100 border-t border-gray-300 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2026 DBH স্টাফ পণ্য পোর্টাল | সংস্করণ 1.0.0</p>
          <p className="mt-1">✨ আপনার দোকানের জন্য ডিজাইন করা হয়েছে</p>
        </div>
      </div>
    </div>
  );
};
