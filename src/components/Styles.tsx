import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Product {
  _id: string;
  name: string;
  brand: string;
  fabric: string;
  color: string;
  sellingPrice: number;
  currentStock: number;
  pictureUrl?: string;
}

interface StyleGroup {
  _id: string;
  styleNumber: string;
  categoryName?: string;
  fabric: string;
  embellishments?: string;
  sellingPrice: number;
  productCount: number;
  productIds: string[];
  createdAt: number;
}

interface StyleWithProducts extends StyleGroup {
  products?: Product[];
}

export default function Styles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFabric, setFilterFabric] = useState("");
  const [sortBy, setSortBy] = useState<"styleNumber" | "fabric" | "price" | "productCount">("styleNumber");
  const [expandedStyle, setExpandedStyle] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleGroup | null>(null);

  // Fetch all styles
  const styles = useQuery(api.styles.list, {});
  
  // Get products for expanded style
  const expandedStyleData = useQuery(
    api.styles.get,
    expandedStyle ? { styleId: expandedStyle as any } : "skip"
  ) as StyleWithProducts | null;

  // Filter styles
  const filteredStyles = (styles || []).filter((style: StyleGroup) => {
    const matchesSearch =
      style.styleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (style.categoryName?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    const matchesFabric = !filterFabric || style.fabric === filterFabric;

    return matchesSearch && matchesFabric;
  });

  // Sort styles
  const sortedStyles = [...filteredStyles].sort((a: StyleGroup, b: StyleGroup) => {
    switch (sortBy) {
      case "styleNumber":
        return a.styleNumber.localeCompare(b.styleNumber);
      case "fabric":
        return a.fabric.localeCompare(b.fabric);
      case "price":
        return a.sellingPrice - b.sellingPrice;
      case "productCount":
        return b.productCount - a.productCount;
      default:
        return 0;
    }
  });

  // Get unique fabrics for filter
  const uniqueFabrics = Array.from(
    new Set((styles || []).map((s: StyleGroup) => s.fabric))
  ).sort();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">স্টাইল ম্যানেজমেন্ট</h1>
          <p className="text-gray-600">একই বৈশিষ্ট্যের পণ্যগুলি দেখুন এবং পরিচালনা করুন</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">মোট স্টাইল</p>
            <p className="text-2xl font-bold text-purple-600">{styles?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">মোট পণ্য</p>
            <p className="text-2xl font-bold text-blue-600">
              {(styles || []).reduce((sum: number, s: StyleGroup) => sum + s.productCount, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">অনন্য ফেব্রিক</p>
            <p className="text-2xl font-bold text-green-600">{uniqueFabrics.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                খুঁজুন স্টাইল নম্বর বা বিভাগ
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g., DBH-0001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ফেব্রিক ফিল্টার
              </label>
              <select
                value={filterFabric}
                onChange={(e) => setFilterFabric(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">সমস্ত ফেব্রিক</option>
                {uniqueFabrics.map((fabric: string) => (
                  <option key={fabric} value={fabric}>
                    {fabric}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                সাজান
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="styleNumber">স্টাইল নম্বর</option>
                <option value="fabric">ফেব্রিক</option>
                <option value="price">মূল্য</option>
                <option value="productCount">পণ্য সংখ্যা</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterFabric("");
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                সব রিসেট করুন
              </button>
            </div>
          </div>
        </div>

        {/* Styles List */}
        <div className="space-y-4">
          {sortedStyles.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 text-lg">কোনো স্টাইল খুঁজে পাওয়া যায়নি</p>
            </div>
          ) : (
            sortedStyles.map((style: StyleGroup) => (
              <div
                key={style._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Style Header */}
                <button
                  onClick={() => setExpandedStyle(expandedStyle === style._id ? null : style._id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className="bg-purple-100 text-purple-800 rounded-lg px-4 py-2 font-bold min-w-fit">
                      {style.styleNumber}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {style.categoryName && `${style.categoryName} - `}
                        {style.fabric}
                        {style.embellishments && ` (${style.embellishments})`}
                      </p>
                      <p className="text-sm text-gray-600">৳{style.sellingPrice.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{style.productCount}</p>
                      <p className="text-xs text-gray-600">পণ্য</p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transform transition-transform ${
                        expandedStyle === style._id ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </div>
                </button>

                {/* Style Details - Products */}
                {expandedStyle === style._id && expandedStyleData && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">এই স্টাইলের পণ্যগুলি:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {(expandedStyleData.products as Product[] || []).map((product: Product) => (
                        <div key={product._id} className="bg-white rounded-lg p-3 border border-gray-200">
                          {product.pictureUrl && (
                            <img
                              src={product.pictureUrl}
                              alt={product.name}
                              className="w-full h-24 object-cover rounded mb-2"
                            />
                          )}
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-600">{product.color}</p>
                          <div className="mt-2 flex justify-between items-center text-sm">
                            <span className="font-semibold text-purple-600">৳{product.sellingPrice}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              product.currentStock > 0
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {product.currentStock} স্টক
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
