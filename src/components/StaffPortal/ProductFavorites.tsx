import React, { useState, useEffect } from 'react';
import { Heart, Trash2, Share2, ShoppingCart, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Product Favorites/Wishlist Component
 * পছন্দের পণ্য সংরক্ষণ এবং পরিচালনা করুন
 */

interface FavoriteProduct {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  category: string;
  colors: string[];
  material: string;
  addedAt: Date;
  notes?: string;
  rating?: number;
}

interface FavoritesProps {
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
}

export const ProductFavorites: React.FC<FavoritesProps> = ({
  onAddToCart,
  onViewDetails,
}) => {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteProduct[]>(
    []
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'name'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  // localStorage থেকে প্রিয় পণ্য লোড করুন
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const stored = localStorage.getItem('favoriteProducts');
        if (stored) {
          const parsed = JSON.parse(stored);
          const products = parsed.map((p: any) => ({
            ...p,
            addedAt: new Date(p.addedAt),
          }));
          setFavorites(products);
          applyFilters(products, selectedCategory, sortBy, searchTerm);
        }
      } catch (error) {
        console.error('প্রিয় পণ্য লোড ব্যর্থ:', error);
      }
    };

    loadFavorites();
  }, []);

  // ফিল্টার এবং সর্ট প্রয়োগ করুন
  const applyFilters = (
    products: FavoriteProduct[],
    category: string,
    sort: string,
    search: string
  ) => {
    let filtered = products;

    // ক্যাটাগরি ফিল্টার
    if (category !== 'all') {
      filtered = filtered.filter((p) => p.category === category);
    }

    // সার্চ ফিল্টার
    if (search) {
      filtered = filtered.filter((p) =>
        p.productName.toLowerCase().includes(search.toLowerCase())
      );
    }

    // সর্ট করুন
    switch (sort) {
      case 'price':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
      case 'date':
      default:
        filtered.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
    }

    setFilteredFavorites(filtered);
  };

  // সার্চ পরিচালনা করুন
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(favorites, selectedCategory, sortBy, term);
  };

  // ক্যাটাগরি পরিবর্তন করুন
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    applyFilters(favorites, category, sortBy, searchTerm);
  };

  // সর্ট পরিবর্তন করুন
  const handleSortChange = (sort: 'date' | 'price' | 'name') => {
    setSortBy(sort);
    applyFilters(favorites, selectedCategory, sort, searchTerm);
  };

  // প্রিয় পণ্য যোগ করুন
  const addFavorite = (product: FavoriteProduct) => {
    const exists = favorites.find((f) => f.productId === product.productId);
    if (exists) {
      toast.warning('এটি ইতিমধ্যে আপনার প্রিয় তালিকায় আছে');
      return;
    }

    const updated = [...favorites, product];
    setFavorites(updated);
    localStorage.setItem('favoriteProducts', JSON.stringify(updated));
    applyFilters(updated, selectedCategory, sortBy, searchTerm);
    toast.success('প্রিয় তালিকায় যোগ করা হয়েছে');
  };

  // প্রিয় পণ্য সরান
  const removeFavorite = (productId: string) => {
    const updated = favorites.filter((f) => f.productId !== productId);
    setFavorites(updated);
    localStorage.setItem('favoriteProducts', JSON.stringify(updated));
    applyFilters(updated, selectedCategory, sortBy, searchTerm);
    toast.success('প্রিয় তালিকা থেকে সরানো হয়েছে');
  };

  // রেটিং আপডেট করুন
  const updateRating = (productId: string, rating: number) => {
    const updated = favorites.map((f) =>
      f.productId === productId ? { ...f, rating } : f
    );
    setFavorites(updated);
    localStorage.setItem('favoriteProducts', JSON.stringify(updated));
    applyFilters(updated, selectedCategory, sortBy, searchTerm);
    toast.success('রেটিং আপডেট করা হয়েছে');
  };

  // নোট যোগ করুন
  const updateNotes = (productId: string, notes: string) => {
    const updated = favorites.map((f) =>
      f.productId === productId ? { ...f, notes } : f
    );
    setFavorites(updated);
    localStorage.setItem('favoriteProducts', JSON.stringify(updated));
  };

  // শেয়ার করুন
  const handleShare = (product: FavoriteProduct) => {
    const text = `আমি "${product.productName}" পছন্দ করেছি - ৳${product.price}`;
    if (navigator.share) {
      navigator.share({
        title: 'প্রিয় পণ্য',
        text,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('টেক্সট কপি করা হয়েছে');
    }
  };

  // তালিকা সংরক্ষণ করুন
  const exportList = () => {
    const csv = 'পণ্যের নাম,দাম,ক্যাটাগরি,যোগ করার সময়\n' +
      filteredFavorites.map((p) =>
        `"${p.productName}",${p.price},"${p.category}","${p.addedAt.toLocaleDateString('bn-BD')}"`
      ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `প্রিয়-পণ্য-${Date.now()}.csv`;
    link.click();
    toast.success('তালিকা ডাউনলোড করা হয়েছে');
  };

  // ইউনিক ক্যাটাগরি পান
  const categories = ['all', ...new Set(favorites.map((f) => f.category))];

  // গ্রিড ভিউ কার্ড
  const GridCard = ({ product }: { product: FavoriteProduct }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      {/* ছবি */}
      <div className="relative bg-gray-200 aspect-square overflow-hidden">
        <img
          src={product.productImage}
          alt={product.productName}
          className="w-full h-full object-cover hover:scale-105 transition"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://via.placeholder.com/300?text=পণ্য';
          }}
        />
        <button
          onClick={() => removeFavorite(product.productId)}
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition"
        >
          <Heart className="w-5 h-5" fill="white" />
        </button>
      </div>

      {/* তথ্য */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-gray-800 text-sm line-clamp-2">
            {product.productName}
          </h3>
          <p className="text-xs text-gray-600">{product.category}</p>
        </div>

        {/* মূল্য */}
        <div className="text-2xl font-bold text-blue-600">৳{product.price}</div>

        {/* রেটিং */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => updateRating(product.productId, star)}
              className={`text-lg ${
                star <= (product.rating || 0)
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }`}
            >
              ★
            </button>
          ))}
        </div>

        {/* অ্যাকশন */}
        <div className="flex gap-2 pt-2 border-t">
          <button
            onClick={() => onAddToCart?.(product.productId)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            কার্টে যোগ
          </button>
          <button
            onClick={() => handleShare(product)}
            className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // লিস্ট ভিউ আইটেম
  const ListItem = ({ product }: { product: FavoriteProduct }) => (
    <div className="bg-white rounded-lg shadow-md p-4 flex gap-4 items-center hover:shadow-lg transition">
      {/* ছবি */}
      <img
        src={product.productImage}
        alt={product.productName}
        className="w-24 h-24 object-cover rounded-lg"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://via.placeholder.com/100?text=পণ্য';
        }}
      />

      {/* মধ্যম তথ্য */}
      <div className="flex-1">
        <h3 className="font-bold text-gray-800">{product.productName}</h3>
        <p className="text-sm text-gray-600">{product.category}</p>
        <div className="flex gap-2 mt-2">
          {product.colors.map((color) => (
            <span key={color} className="text-xs bg-gray-200 px-2 py-1 rounded">
              {color}
            </span>
          ))}
        </div>
        {product.notes && (
          <p className="text-sm text-gray-600 mt-1">📝 {product.notes}</p>
        )}
      </div>

      {/* দাম এবং অ্যাকশন */}
      <div className="text-right space-y-2">
        <p className="text-2xl font-bold text-blue-600">৳{product.price}</p>
        <div className="flex gap-2">
          <button
            onClick={() => onAddToCart?.(product.productId)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            কার্টে যোগ
          </button>
          <button
            onClick={() => removeFavorite(product.productId)}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg transition"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* হেডার */}
      <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">❤️ প্রিয় পণ্য তালিকা</h2>
        <p className="text-red-100">
          মোট প্রিয় পণ্য: <span className="font-bold">{favorites.length}</span>
        </p>
      </div>

      {/* সরঞ্জাম পট্টি */}
      {favorites.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
          {/* সার্চ */}
          <input
            type="text"
            placeholder="পণ্য খুঁজুন..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          {/* ফিল্টার এবং সর্ট */}
          <div className="flex flex-wrap gap-2">
            {/* ক্যাটাগরি */}
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'সবকিছু' : cat}
                </option>
              ))}
            </select>

            {/* সর্ট */}
            <select
              value={sortBy}
              onChange={(e) =>
                handleSortChange(e.target.value as 'date' | 'price' | 'name')
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="date">যোগ করার সময়</option>
              <option value="price">দাম (কম থেকে বেশি)</option>
              <option value="name">নাম (A-Z)</option>
            </select>

            {/* ভিউ মোড */}
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                গ্রিড
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                তালিকা
              </button>
              <button
                onClick={exportList}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                ডাউনলোড
              </button>
            </div>
          </div>
        </div>
      )}

      {/* পণ্য প্রদর্শন */}
      {filteredFavorites.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFavorites.map((product) => (
              <GridCard key={product.productId} product={product} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFavorites.map((product) => (
              <ListItem key={product.productId} product={product} />
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {favorites.length === 0
              ? 'আপনার প্রিয় তালিকা এখনো খালি'
              : 'এই ফিল্টারে কোনো পণ্য পাওয়া যায়নি'}
          </p>
        </div>
      )}

      {/* সংক্ষিপ্ত পরিসংখ্যান */}
      {favorites.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm">মোট পছন্দ</p>
            <p className="text-2xl font-bold text-red-600">
              {filteredFavorites.length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm">গড় দাম</p>
            <p className="text-2xl font-bold text-blue-600">
              ৳{Math.round(filteredFavorites.reduce((sum, p) => sum + p.price, 0) / Math.max(filteredFavorites.length, 1))}
            </p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm">মোট দাম</p>
            <p className="text-2xl font-bold text-yellow-600">
              ৳{filteredFavorites.reduce((sum, p) => sum + p.price, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm">রেটেড পণ্য</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredFavorites.filter((p) => p.rating).length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFavorites;
