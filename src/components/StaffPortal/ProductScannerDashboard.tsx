import React, { useState } from 'react';
import { Camera, History, Heart, Search, BarChart3, Edit2 } from 'lucide-react';

// নতুন ফিচার components ইম্পোর্ট করুন
import ProductImageRecognition from './ProductImageRecognition';
import ScanHistory from './ScanHistory';
import ProductFavorites from './ProductFavorites';
import AdvancedSearch from './AdvancedSearch';
import ProductComparison from './ProductComparison';
import ImageEditor from './ImageEditor';

/**
 * Integrated Product Scanner Dashboard
 * সব ফিচার একটি জায়গায় - স্ক্যান, হিস্ট্রি, প্রিয় পছন্দ, সার্চ, তুলনা
 */

export const ProductScannerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('scan');
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editorImage, setEditorImage] = useState<string | null>(null);

  // ছবি সম্পাদনা করুন
  const handleEditImage = (imageUrl: string) => {
    setEditorImage(imageUrl);
    setShowImageEditor(true);
  };

  // সম্পাদিত ছবি সংরক্ষণ করুন
  const handleSaveEditedImage = (editedImageUrl: string) => {
    setShowImageEditor(false);
    // এডিটেড ইমেজ দিয়ে স্ক্যানিং শুরু করুন
    console.log('সম্পাদিত ছবি:', editedImageUrl);
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* হেডার */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            📱 পণ্য স্ক্যানার সম্পূর্ণ সিস্টেম
          </h1>
          <p className="text-gray-400 text-lg">
            স্ক্যান করুন, ইতিহাস দেখুন, পছন্দ সংরক্ষণ করুন এবং পণ্য তুলনা করুন
          </p>
        </div>

        {/* ট্যাব নেভিগেশন */}
        <div className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 mb-6 bg-slate-800/50 p-2 rounded-lg">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-2 text-sm md:text-base px-4 py-2 rounded-md transition-colors ${
              activeTab === 'scan'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">স্ক্যান করুন</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 text-sm md:text-base px-4 py-2 rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">ইতিহাস</span>
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 text-sm md:text-base px-4 py-2 rounded-md transition-colors ${
              activeTab === 'favorites'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">প্রিয় পছন্দ</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 text-sm md:text-base px-4 py-2 rounded-md transition-colors ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">অনুসন্ধান</span>
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-2 text-sm md:text-base px-4 py-2 rounded-md transition-colors ${
              activeTab === 'compare'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">তুলনা</span>
          </button>
        </div>

        {/* ট্যাব কন্টেন্ট */}
        <div className="bg-slate-800/30 rounded-lg p-6 backdrop-blur-sm">
          {/* স্ক্যান ট্যাব */}
          {activeTab === 'scan' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/20 rounded-lg p-4 mb-4">
                <p className="text-gray-300 text-sm">
                  💡 টিপ: ছবি আপলোড করার আগে সম্পাদনা করতে
                  <button
                    onClick={() => handleEditImage('https://via.placeholder.com/400')}
                    className="text-blue-400 hover:text-blue-300 ml-1 underline"
                  >
                    ছবি সম্পাদক
                  </button>
                  ব্যবহার করুন।
                </p>
              </div>
              <ProductImageRecognition />
            </div>
          )}

          {/* ইতিহাস ট্যাব */}
          {activeTab === 'history' && <ScanHistory />}

          {/* প্রিয় পছন্দ ট্যাব */}
          {activeTab === 'favorites' && <ProductFavorites />}

          {/* অনুসন্ধান ট্যাব */}
          {activeTab === 'search' && <AdvancedSearch />}

          {/* তুলনা ট্যাব */}
          {activeTab === 'compare' && <ProductComparison />}
        </div>

        {/* ছবি সম্পাদক মোডাল */}
        {showImageEditor && editorImage && (
          <ImageEditor
            imageUrl={editorImage}
            onSave={handleSaveEditedImage}
            onClose={() => setShowImageEditor(false)}
          />
        )}

        {/* নীচের তথ্য */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-400/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">📸 ফিচার</p>
            <p className="text-white font-semibold">ছবি স্বীকৃতি</p>
            <p className="text-xs text-gray-500 mt-1">তাৎক্ষণিক পণ্য সনাক্তকরণ</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-400/10 border border-purple-500/20 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">🎨 উন্নতি</p>
            <p className="text-white font-semibold">ছবি সম্পাদনা</p>
            <p className="text-xs text-gray-500 mt-1">ক্রপ, রোটেট, জুম</p>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-400/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">💾 সংরক্ষণ</p>
            <p className="text-white font-semibold">স্মার্ট স্টোরেজ</p>
            <p className="text-xs text-gray-500 mt-1">localStorage সিঙ্ক</p>
          </div>
          <div className="bg-gradient-to-br from-orange-600/20 to-orange-400/10 border border-orange-500/20 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">📊 বিশ্লেষণ</p>
            <p className="text-white font-semibold">উন্নত তুলনা</p>
            <p className="text-xs text-gray-500 mt-1">একাধিক মেট্রিক্স</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductScannerDashboard;
