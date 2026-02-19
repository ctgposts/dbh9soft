import React, { useState } from 'react';
import { X, Plus, Trash2, Download, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Product Comparison Component
 * একাধিক পণ্য তুলনা করুন
 */

interface ComparisonProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  colors: string[];
  material: string;
  size: string;
  rating: number;
  reviews: number;
  stock: number;
  image: string;
  features: {
    [key: string]: string | number | boolean;
  };
}

interface ProductComparisonProps {
  onClose?: () => void;
}

export const ProductComparison: React.FC<ProductComparisonProps> = ({
  onClose,
}) => {
  const [products, setProducts] = useState<ComparisonProduct[]>([]);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  // মক পণ্য ডেটা
  const mockProducts: ComparisonProduct[] = [
    {
      id: '1',
      name: 'প্রিমিয়াম কালো আবায়া',
      price: 2500,
      category: 'আবায়া',
      colors: ['কালো'],
      material: 'জর্জেট',
      size: 'একসাইজ',
      rating: 4.5,
      reviews: 120,
      stock: 15,
      image: '/products/abaya-01.jpg',
      features: {
        'সেলাই প্রযুক্তি': 'মেশিন সেলাই',
        'ডিজাইন': 'ঐতিহ্যবাহী',
        'দীর্ঘস্থায়িত্ব': '২ বছর',
        'ওয়াশিং': 'হাতে ধোওয়া',
      },
    },
    {
      id: '2',
      name: 'ডিএক্স কালো আবায়া',
      price: 1800,
      category: 'আবায়া',
      colors: ['কালো'],
      material: 'পলিএস্টার',
      size: 'এম/এল/এক্সএল',
      rating: 4.2,
      reviews: 85,
      stock: 25,
      image: '/products/abaya-02.jpg',
      features: {
        'সেলাই প্রযুক্তি': 'মেশিন সেলাই',
        'ডিজাইন': 'আধুনিক',
        'দীর্ঘস্থায়িত্ব': '১.৫ বছর',
        'ওয়াশিং': 'মেশিন ধোওয়া',
      },
    },
    {
      id: '3',
      name: 'গাঢ় লাল নাক্সো',
      price: 3200,
      category: 'নাক্সো',
      colors: ['গাঢ় লাল'],
      material: 'সিল্ক ব্লেন্ড',
      size: 'এস/এম/এল',
      rating: 4.8,
      reviews: 200,
      stock: 8,
      image: '/products/niqab-01.jpg',
      features: {
        'সেলাই প্রযুক্তি': 'হাতে সেলাই',
        'ডিজাইন': 'প্রিমিয়াম',
        'দীর্ঘস্থায়িত্ব': '৩ বছর',
        'ওয়াশিং': 'শুকনো পরিষ্কার',
      },
    },
  ];

  // তুলনার জন্য পণ্য যোগ করুন
  const addProduct = (productId: string) => {
    if (selectedForComparison.includes(productId)) {
      toast.warning('এই পণ্য ইতিমধ্যে যোগ করা আছে');
      return;
    }
    if (selectedForComparison.length >= 4) {
      toast.warning('সর্বোচ্চ 4টি পণ্য তুলনা করা যায়');
      return;
    }

    const product = mockProducts.find((p) => p.id === productId);
    if (product) {
      setSelectedForComparison([...selectedForComparison, productId]);
      setProducts([...products, product]);
      toast.success('পণ্য যোগ করা হয়েছে');
    }
  };

  // তুলনা থেকে পণ্য সরান
  const removeProduct = (productId: string) => {
    setProducts(products.filter((p) => p.id !== productId));
    setSelectedForComparison(
      selectedForComparison.filter((id) => id !== productId)
    );
    toast.info('পণ্য সরানো হয়েছে');
  };

  // তুলনা রিসেট করুন
  const resetComparison = () => {
    setProducts([]);
    setSelectedForComparison([]);
    toast.info('তুলনা রিসেট করা হয়েছে');
  };

  // তুলনা এক্সপোর্ট করুন
  const exportComparison = () => {
    if (products.length === 0) {
      toast.warning('তুলনার জন্য কমপক্ষে একটি পণ্য যোগ করুন');
      return;
    }

    let csv = 'বৈশিষ্ট্য,' + products.map((p) => p.name).join(',') + '\n';

    // বেসিক তথ্য
    csv += 'মূল্য,' + products.map((p) => p.price).join(',') + '\n';
    csv += 'উপাদান,' + products.map((p) => p.material).join(',') + '\n';
    csv += 'রেটিং,' + products.map((p) => p.rating).join(',') + '\n';
    csv += 'রিভিউ,' + products.map((p) => p.reviews).join(',') + '\n';
    csv += 'স্টক,' + products.map((p) => p.stock).join(',') + '\n';

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `পণ্য-তুলনা-${Date.now()}.csv`;
    link.click();
    toast.success('তুলনা এক্সপোর্ট করা হয়েছে');
  };

  // স্কোর গণনা করুন (উচ্চতর ভালো)
  const calculateScore = (product: ComparisonProduct, metric: string) => {
    const maxRating = 5;
    const maxReviews = 300;
    const maxStock = 100;
    const minPrice = 1000;
    const maxPrice = 5000;

    switch (metric) {
      case 'rating':
        return (product.rating / maxRating) * 100;
      case 'reviews':
        return Math.min((product.reviews / maxReviews) * 100, 100);
      case 'stock':
        return Math.min((product.stock / maxStock) * 100, 100);
      case 'price':
        // কম দাম আরও ভালো
        return Math.max(((maxPrice - product.price) / (maxPrice - minPrice)) * 100, 0);
      case 'material_quality':
        const materialScores: { [key: string]: number } = {
          'সিল্ক ব্লেন্ড': 100,
          'শিফন': 90,
          'জর্জেট': 85,
          'সিল্ক': 95,
          'কটন': 75,
          'পলিএস্টার': 60,
        };
        return materialScores[product.material] || 50;
      default:
        return 50;
    }
  };

  return (
    <div className="space-y-4">
      {/* হেডার */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">📊 পণ্য তুলনা</h2>
          <p className="text-purple-100">
            একাধিক পণ্য তুলনা করুন এবং সঠিক পছন্দ করুন
          </p>
        </div>
        {products.length > 0 && (
          <div className="text-right">
            <p className="text-3xl font-bold">{products.length}/4</p>
            <p className="text-sm text-purple-100">পণ্য তুলনা করছে</p>
          </div>
        )}
      </div>

      {/* পণ্য নির্বাচন */}
      {products.length < 4 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            পণ্য যোগ করুন
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mockProducts
              .filter((p) => !selectedForComparison.includes(p.id))
              .map((product) => (
                <button
                  key={product.id}
                  onClick={() => addProduct(product.id)}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 border border-gray-200 hover:border-blue-400 p-3 rounded-lg transition text-left"
                >
                  <h4 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                    {product.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    ৳{product.price} • {product.rating}⭐
                  </p>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* তুলনা টেবিল */}
      {products.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full">
            {/* হেডার */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-700 font-bold min-w-40">
                  বৈশিষ্ট্য
                </th>
                {products.map((product) => (
                  <th
                    key={product.id}
                    className="px-4 py-3 text-center min-w-48"
                  >
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="float-right text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg mx-auto mb-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/100?text=পণ্য';
                      }}
                    />
                    <h4 className="font-bold text-gray-800 text-sm line-clamp-2">
                      {product.name}
                    </h4>
                  </th>
                ))}
              </tr>
            </thead>

            {/* বডি */}
            <tbody className="divide-y">
              {/* মূল্য */}
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-700">মূল্য</td>
                {products.map((product) => (
                  <td
                    key={product.id}
                    className="px-4 py-3 text-center text-blue-600 font-bold text-lg"
                  >
                    ৳{product.price}
                  </td>
                ))}
              </tr>

              {/* রেটিং */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-700">রেটিং</td>
                {products.map((product) => (
                  <td key={product.id} className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg font-bold text-yellow-500">
                        {product.rating}⭐
                      </span>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{
                            width: `${calculateScore(product, 'rating')}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* রিভিউ */}
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-700">রিভিউ</td>
                {products.map((product) => (
                  <td key={product.id} className="px-4 py-3 text-center">
                    <p className="font-bold text-gray-800">{product.reviews}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-400 h-2 rounded-full"
                        style={{
                          width: `${calculateScore(product, 'reviews')}%`,
                        }}
                      />
                    </div>
                  </td>
                ))}
              </tr>

              {/* স্টক */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-700">স্টক</td>
                {products.map((product) => (
                  <td key={product.id} className="px-4 py-3 text-center">
                    <p className="font-bold text-gray-800">{product.stock}</p>
                    <span
                      className={`text-xs font-semibold ${
                        product.stock > 10
                          ? 'text-green-600'
                          : product.stock > 0
                          ? 'text-orange-600'
                          : 'text-red-600'
                      }`}
                    >
                      {product.stock > 10
                        ? 'প্রচুর'
                        : product.stock > 0
                        ? 'সীমিত'
                        : 'স্টকে নেই'}
                    </span>
                  </td>
                ))}
              </tr>

              {/* উপাদান */}
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-700">উপাদান</td>
                {products.map((product) => (
                  <td key={product.id} className="px-4 py-3 text-center">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-semibold">
                      {product.material}
                    </span>
                  </td>
                ))}
              </tr>

              {/* সাইজ */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-700">সাইজ</td>
                {products.map((product) => (
                  <td key={product.id} className="px-4 py-3 text-center text-gray-700">
                    {product.size}
                  </td>
                ))}
              </tr>

              {/* রঙ */}
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-700">রঙ</td>
                {products.map((product) => (
                  <td key={product.id} className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center flex-wrap">
                      {product.colors.map((color) => (
                        <span
                          key={color}
                          className="bg-gray-200 px-2 py-1 rounded text-xs font-semibold"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* সামগ্রিক স্কোর */}
              <tr className="bg-gradient-to-r from-blue-50 to-blue-100 font-bold">
                <td className="px-4 py-3 text-gray-800">সামগ্রিক স্কোর</td>
                {products.map((product) => {
                  const scores = [
                    calculateScore(product, 'rating'),
                    calculateScore(product, 'reviews'),
                    calculateScore(product, 'stock'),
                    calculateScore(product, 'price'),
                    calculateScore(product, 'material_quality'),
                  ];
                  const average = scores.reduce((a, b) => a + b) / scores.length;
                  return (
                    <td key={product.id} className="px-4 py-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {average.toFixed(0)}%
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-3 mt-2">
                        <div
                          className="bg-green-500 h-3 rounded-full"
                          style={{ width: `${average}%` }}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            তুলনা শুরু করতে পণ্য যোগ করুন
          </p>
        </div>
      )}

      {/* অ্যাকশন বাটন */}
      {products.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 flex gap-3">
          <button
            onClick={exportComparison}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            এক্সপোর্ট করুন
          </button>
          <button
            onClick={resetComparison}
            className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            রিসেট করুন
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductComparison;
