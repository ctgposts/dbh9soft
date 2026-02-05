import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown, DollarSign, Tag } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Advanced Search & Filters Component
 * উন্নত অনুসন্ধান এবং ফিল্টারিং সুবিধা
 */

interface FilterOptions {
  searchTerm: string;
  minPrice: number | null;
  maxPrice: number | null;
  categories: string[];
  colors: string[];
  materials: string[];
  minRating: number;
  inStock: boolean;
  sortBy: 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
}

interface SearchResult {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  colors: string[];
  material: string;
  inStock: boolean;
}

interface AdvancedSearchProps {
  onSearch?: (results: SearchResult[], filters: FilterOptions) => void;
  onClose?: () => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onClose,
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    minPrice: null,
    maxPrice: null,
    categories: [],
    colors: [],
    materials: [],
    minRating: 0,
    inStock: false,
    sortBy: 'relevance',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // উপলব্ধ অপশন
  const availableCategories = [
    'আবায়া',
    'নাক্সো',
    'বোরকা',
    'হেড স্কার্ফ',
    'ফ্লোর জুব্বা',
    'কাসেলা',
  ];

  const availableColors = [
    'কালো',
    'সাদা',
    'লাল',
    'সবুজ',
    'নীল',
    'বেগুনি',
    'গোলাপি',
    'ধূসর',
  ];

  const availableMaterials = [
    'জর্জেট',
    'পলিএস্টার',
    'সিল্ক',
    'কটন',
    'সিল্ক ব্লেন্ড',
    'শিফন',
  ];

  // ফিল্টার আপডেট করুন
  const updateFilter = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // ক্যাটাগরি টগল করুন
  const toggleCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  // রঙ টগল করুন
  const toggleColor = (color: string) => {
    setFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }));
  };

  // উপাদান টগল করুন
  const toggleMaterial = (material: string) => {
    setFilters((prev) => ({
      ...prev,
      materials: prev.materials.includes(material)
        ? prev.materials.filter((m) => m !== material)
        : [...prev.materials, material],
    }));
  };

  // সার্চ করুন
  const handleSearch = async () => {
    setIsSearching(true);
    try {
      // মক অনুসন্ধান ফলাফল
      const mockResults: SearchResult[] = [
        {
          id: '1',
          name: 'প্রিমিয়াম কালো আবায়া',
          category: 'আবায়া',
          price: 2500,
          rating: 4.5,
          reviews: 120,
          image: '/products/abaya-01.jpg',
          colors: ['কালো'],
          material: 'জর্জেট',
          inStock: true,
        },
        {
          id: '2',
          name: 'ডিএক্স কালো আবায়া',
          category: 'আবায়া',
          price: 1800,
          rating: 4.2,
          reviews: 85,
          image: '/products/abaya-02.jpg',
          colors: ['কালো'],
          material: 'পলিএস্টার',
          inStock: true,
        },
        {
          id: '3',
          name: 'গাঢ় লাল নাক্সো',
          category: 'নাক্সো',
          price: 3200,
          rating: 4.8,
          reviews: 200,
          image: '/products/niqab-01.jpg',
          colors: ['গাঢ় লাল'],
          material: 'সিল্ক ব্লেন্ড',
          inStock: false,
        },
      ];

      // ফিল্টার প্রয়োগ করুন
      let filtered = mockResults;

      // সার্চ টার্ম
      if (filters.searchTerm) {
        filtered = filtered.filter((p) =>
          p.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      }

      // মূল্য পরিসীমা
      if (filters.minPrice !== null) {
        filtered = filtered.filter((p) => p.price >= filters.minPrice!);
      }
      if (filters.maxPrice !== null) {
        filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
      }

      // ক্যাটাগরি
      if (filters.categories.length > 0) {
        filtered = filtered.filter((p) =>
          filters.categories.includes(p.category)
        );
      }

      // রঙ
      if (filters.colors.length > 0) {
        filtered = filtered.filter((p) =>
          p.colors.some((c) => filters.colors.includes(c))
        );
      }

      // উপাদান
      if (filters.materials.length > 0) {
        filtered = filtered.filter((p) =>
          filters.materials.includes(p.material)
        );
      }

      // রেটিং
      if (filters.minRating > 0) {
        filtered = filtered.filter((p) => p.rating >= filters.minRating);
      }

      // স্টক
      if (filters.inStock) {
        filtered = filtered.filter((p) => p.inStock);
      }

      // সর্ট করুন
      switch (filters.sortBy) {
        case 'price-asc':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          // নতুন পণ্য প্রথমে
          break;
      }

      setSearchResults(filtered);
      onSearch?.(filtered, filters);

      if (filtered.length === 0) {
        toast.warning('কোনো ফলাফল পাওয়া যায়নি');
      } else {
        toast.success(`${filtered.length}টি পণ্য পাওয়া গেছে`);
      }
    } catch (error) {
      toast.error('অনুসন্ধান ব্যর্থ হয়েছে');
    } finally {
      setIsSearching(false);
    }
  };

  // ফিল্টার রিসেট করুন
  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      minPrice: null,
      maxPrice: null,
      categories: [],
      colors: [],
      materials: [],
      minRating: 0,
      inStock: false,
      sortBy: 'relevance',
    });
    setSearchResults([]);
    toast.info('সব ফিল্টার রিসেট করা হয়েছে');
  };

  // সক্রিয় ফিল্টার গণনা করুন
  const activeFiltersCount = [
    filters.searchTerm ? 1 : 0,
    filters.minPrice !== null ? 1 : 0,
    filters.maxPrice !== null ? 1 : 0,
    filters.categories.length,
    filters.colors.length,
    filters.materials.length,
    filters.minRating > 0 ? 1 : 0,
    filters.inStock ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* হেডার */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">🔍 উন্নত অনুসন্ধান</h2>
        <p className="text-blue-100">পণ্য খুঁজে পেতে উন্নত ফিল্টার ব্যবহার করুন</p>
      </div>

      {/* সার্চ বক্স */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="পণ্য খুঁজুন (নাম, আইডি ইত্যাদি)..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold transition"
          >
            {isSearching ? 'অনুসন্ধান করছে...' : 'সার্চ'}
          </button>
        </div>

        {/* উন্নত অপশন টগল */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
        >
          <Filter className="w-5 h-5" />
          উন্নত অপশন
          {activeFiltersCount > 0 && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown
            className={`w-5 h-5 transition ${showAdvanced ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* উন্নত ফিল্টার */}
      {showAdvanced && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* মূল্য পরিসীমা */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              মূল্য পরিসীমা
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  সর্বনিম্ন (৳)
                </label>
                <input
                  type="number"
                  placeholder="০"
                  value={filters.minPrice || ''}
                  onChange={(e) =>
                    updateFilter('minPrice', e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  সর্বোচ্চ (৳)
                </label>
                <input
                  type="number"
                  placeholder="১০০০০"
                  value={filters.maxPrice || ''}
                  onChange={(e) =>
                    updateFilter('maxPrice', e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ক্যাটাগরি */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3">ক্যাটাগরি</h3>
            <div className="grid grid-cols-2 gap-2">
              {availableCategories.map((category) => (
                <label
                  key={category}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* রঙ */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3">রঙ</h3>
            <div className="grid grid-cols-3 gap-2">
              {availableColors.map((color) => (
                <label
                  key={color}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.colors.includes(color)}
                    onChange={() => toggleColor(color)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-700 text-sm">{color}</span>
                </label>
              ))}
            </div>
          </div>

          {/* উপাদান */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3">উপাদান</h3>
            <div className="grid grid-cols-2 gap-2">
              {availableMaterials.map((material) => (
                <label
                  key={material}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.materials.includes(material)}
                    onChange={() => toggleMaterial(material)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-700 text-sm">{material}</span>
                </label>
              ))}
            </div>
          </div>

          {/* রেটিং */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3">ন্যূনতম রেটিং</h3>
            <div className="flex gap-2">
              {[0, 3, 3.5, 4, 4.5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => updateFilter('minRating', rating)}
                  className={`px-4 py-2 rounded-lg transition ${
                    filters.minRating === rating
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rating === 0 ? 'সব' : `${rating}⭐`}
                </button>
              ))}
            </div>
          </div>

          {/* স্টক স্ট্যাটাস */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => updateFilter('inStock', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="font-semibold text-gray-800">
                শুধুমাত্র স্টকে থাকা পণ্য
              </span>
            </label>
          </div>

          {/* সর্ট */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3">সর্ট করুন</h3>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                updateFilter(
                  'sortBy',
                  e.target.value as FilterOptions['sortBy']
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="relevance">প্রাসঙ্গিকতা</option>
              <option value="price-asc">দাম (কম থেকে বেশি)</option>
              <option value="price-desc">দাম (বেশি থেকে কম)</option>
              <option value="rating">রেটিং</option>
              <option value="newest">নতুন</option>
            </select>
          </div>

          {/* অ্যাকশন বাটন */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={resetFilters}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-bold transition"
            >
              রিসেট করুন
            </button>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-bold transition"
            >
              {isSearching ? 'অনুসন্ধান করছে...' : 'ফিল্টার এবং সার্চ'}
            </button>
          </div>
        </div>
      )}

      {/* ফলাফল */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 text-lg">
            ফলাফল ({searchResults.length}টি পণ্য)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://via.placeholder.com/300x150?text=পণ্য';
                  }}
                />
                <div className="p-3">
                  <h4 className="font-bold text-gray-800 line-clamp-2">
                    {product.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {product.category}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-blue-600">
                      ৳{product.price}
                    </span>
                    <span className="text-sm text-yellow-500 font-bold">
                      {product.rating}⭐
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
