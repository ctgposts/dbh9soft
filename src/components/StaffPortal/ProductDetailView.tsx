import React, { useMemo } from 'react';
import { ArrowLeft, Star, AlertCircle } from 'lucide-react';

interface BarcodeDetail {
  serialNumber: string;
  variantId: number;
  color: string;
  size: string;
  material?: string;
  embellishments?: string;
  createdDate?: string;
}

interface ProductDetailViewProps {
  product?: {
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
  };
  barcodeDetail?: BarcodeDetail;
  images?: string[];
  loading?: boolean;
  onBack: () => void;
  onUploadImage: () => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  barcodeDetail,
  images = [],
  loading = false,
  onBack,
  onUploadImage,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  const allImages = useMemo(() => {
    const imgs = [...(images || [])];
    if (product?.imageUrl && !imgs.includes(product.imageUrl)) {
      imgs.unshift(product.imageUrl);
    }
    return imgs;
  }, [product?.imageUrl, images]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">পণ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-2xl max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-center mb-2">পণ্য খুঁজে পাওয়া যাচ্ছে না</h3>
          <p className="text-gray-600 text-center mb-4">বারকোডটি সঠিক নয় অথবা পণ্যটি সিস্টেমে নেই</p>
          <button
            onClick={onBack}
            className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            পুনরায় চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 my-8">
        {/* হেডার */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 flex justify-between items-center">
          <button
            onClick={onBack}
            className="hover:bg-purple-800 p-1 rounded transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold flex-1 text-center">পণ্য বিবরণ</h2>
          <div className="w-6"></div>
        </div>

        {/* কন্টেন্ট */}
        <div className="p-6 space-y-6">
          {/* ইমেজ গ্যালারি */}
          {allImages.length > 0 && (
            <div className="space-y-3">
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={allImages[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-64 object-cover"
                />
              </div>

              {/* গ্যালারি নিয়ন্ত্রণ */}
              {allImages.length > 1 && (
                <div className="flex gap-2 items-center justify-between">
                  <button
                    onClick={() =>
                      setSelectedImageIndex(
                        selectedImageIndex === 0
                          ? allImages.length - 1
                          : selectedImageIndex - 1
                      )
                    }
                    className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 transition"
                  >
                    ← পূর্ববর্তী
                  </button>
                  <div className="text-sm text-gray-600">
                    {selectedImageIndex + 1} / {allImages.length}
                  </div>
                  <button
                    onClick={() =>
                      setSelectedImageIndex(
                        (selectedImageIndex + 1) % allImages.length
                      )
                    }
                    className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 transition"
                  >
                    পরবর্তী →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* প্রোডাক্ট তথ্য */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* বাম কলাম */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-600">পণ্য নাম</label>
                <p className="text-lg font-bold text-gray-900">{product.name}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">ব্র্যান্ড</label>
                <p className="text-gray-700">{product.brand || 'N/A'}</p>
              </div>

              {product.category && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">ক্যাটেগরি</label>
                  <p className="text-gray-700">{product.category}</p>
                </div>
              )}

              {product.price !== undefined && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">মূল্য</label>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-green-600">৳ {product.price}</p>
                    {product.discountedPrice && product.discountedPrice < product.price && (
                      <p className="text-sm text-red-600 line-through">
                        ৳ {product.discountedPrice}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {product.stock !== undefined && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">স্টক</label>
                  <p className={`font-bold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock} পিস
                  </p>
                </div>
              )}
            </div>

            {/* ডান কলাম */}
            <div className="space-y-3">
              {product.description && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">বিবরণ</label>
                  <p className="text-gray-700 text-sm">{product.description}</p>
                </div>
              )}

              {product.fabric && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">ফ্যাব্রিক</label>
                  <p className="text-gray-700">{product.fabric}</p>
                </div>
              )}

              {product.material && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">উপকরণ</label>
                  <p className="text-gray-700">{product.material}</p>
                </div>
              )}

              {product.color && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">রঙ</label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: product.color }}
                    ></div>
                    <p className="text-gray-700">{product.color}</p>
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">সাইজ</label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <span
                        key={size}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm font-medium"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.rating !== undefined && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">রেটিং</label>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(product.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.rating?.toFixed(1)}/5 ({product.reviews || 0} রিভিউ)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* বারকোড বিবরণ */}
          {barcodeDetail && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-3">🏷️ বারকোড বিবরণ</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-blue-700">সিরিয়াল নম্বর</label>
                  <p className="font-bold text-blue-900">{barcodeDetail.serialNumber}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-blue-700">ভেরিয়েন্ট আইডি</label>
                  <p className="font-bold text-blue-900">#{barcodeDetail.variantId}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-blue-700">রঙ</label>
                  <p className="text-blue-900">{barcodeDetail.color}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-blue-700">সাইজ</label>
                  <p className="text-blue-900">{barcodeDetail.size}</p>
                </div>
                {barcodeDetail.material && (
                  <div>
                    <label className="text-xs font-semibold text-blue-700">উপকরণ</label>
                    <p className="text-blue-900">{barcodeDetail.material}</p>
                  </div>
                )}
                {barcodeDetail.createdDate && (
                  <div>
                    <label className="text-xs font-semibold text-blue-700">তৈরির তারিখ</label>
                    <p className="text-blue-900 text-sm">{barcodeDetail.createdDate}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* কর্ম বাটন */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onUploadImage}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
            >
              📸 ছবি যোগ করুন
            </button>
            <button
              onClick={onBack}
              className="flex-1 bg-gray-400 text-white py-2 rounded-lg font-medium hover:bg-gray-500 transition"
            >
              ← ফিরে যান
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
