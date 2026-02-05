import React, { useState, useEffect } from 'react';
import { Clock, Trash2, Heart, Share2, Eye, ChevronDown, Filter } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Scan History Component
 * সব স্ক্যান করা পণ্যের ইতিহাস প্রদর্শন করে
 */

interface ScanRecord {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  scannedAt: Date;
  matchScore: number;
  price: number;
  branch?: string;
  staff?: string;
  isFavorite?: boolean;
}

interface ScanHistoryProps {
  onProductSelect?: (productId: string) => void;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({ onProductSelect }) => {
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ScanRecord[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorite' | 'today' | 'week'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // localStorage থেকে ইতিহাস লোড করুন
  useEffect(() => {
    const loadHistory = () => {
      try {
        const stored = localStorage.getItem('scanHistory');
        if (stored) {
          const parsed = JSON.parse(stored);
          const records = parsed.map((r: any) => ({
            ...r,
            scannedAt: new Date(r.scannedAt),
          }));
          setHistory(records);
          applyFilters(records, selectedFilter, searchTerm);
        }
      } catch (error) {
        console.error('ইতিহাস লোড ব্যর্থ:', error);
      }
    };

    loadHistory();
  }, []);

  // ফিল্টার প্রয়োগ করুন
  const applyFilters = (records: ScanRecord[], filter: string, search: string) => {
    let filtered = records;

    // সময় ফিল্টার
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    switch (filter) {
      case 'favorite':
        filtered = filtered.filter((r) => r.isFavorite);
        break;
      case 'today':
        filtered = filtered.filter((r) => r.scannedAt >= today);
        break;
      case 'week':
        filtered = filtered.filter((r) => r.scannedAt >= weekAgo);
        break;
    }

    // সার্চ ফিল্টার
    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.productName.toLowerCase().includes(search.toLowerCase()) ||
          r.productId.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredHistory(filtered);
  };

  // ফিল্টার পরিবর্তন করুন
  const handleFilterChange = (filter: 'all' | 'favorite' | 'today' | 'week') => {
    setSelectedFilter(filter);
    applyFilters(history, filter, searchTerm);
  };

  // সার্চ করুন
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(history, selectedFilter, term);
  };

  // প্রিয় টগল করুন
  const toggleFavorite = (id: string) => {
    const updated = history.map((r) =>
      r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
    );
    setHistory(updated);
    localStorage.setItem('scanHistory', JSON.stringify(updated));
    applyFilters(updated, selectedFilter, searchTerm);
    toast.success('আপডেট করা হয়েছে');
  };

  // রেকর্ড মুছুন
  const deleteRecord = (id: string) => {
    const updated = history.filter((r) => r.id !== id);
    setHistory(updated);
    localStorage.setItem('scanHistory', JSON.stringify(updated));
    applyFilters(updated, selectedFilter, searchTerm);
    toast.success('রেকর্ড মুছে ফেলা হয়েছে');
  };

  // সবকিছু মুছুন
  const clearAll = () => {
    if (window.confirm('সব ইতিহাস মুছে ফেলবেন? এটি পূর্বাবাস করা যাবে না।')) {
      setHistory([]);
      setFilteredHistory([]);
      localStorage.removeItem('scanHistory');
      toast.success('সব ইতিহাস মুছে ফেলা হয়েছে');
    }
  };

  // শেয়ার করুন
  const handleShare = (record: ScanRecord) => {
    const text = `আমি "${record.productName}" খুঁজে পেয়েছি - ৳${record.price} - মিল: ${record.matchScore}%`;
    if (navigator.share) {
      navigator.share({
        title: 'পণ্য শেয়ার করুন',
        text,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('টেক্সট কপি করা হয়েছে');
    }
  };

  // সময় ফর্ম্যাট করুন
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;

    if (diff < 60) return 'এখনই';
    if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} দিন আগে`;
    return date.toLocaleDateString('bn-BD');
  };

  return (
    <div className="space-y-4">
      {/* হেডার */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-4">⏱️ স্ক্যান ইতিহাস</h2>
        <p className="text-blue-100">
          মোট স্ক্যান: <span className="font-bold">{history.length}</span>
        </p>
      </div>

      {/* সার্চ এবং ফিল্টার */}
      <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
        {/* সার্চ */}
        <input
          type="text"
          placeholder="পণ্য নাম বা ID খুঁজুন..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* ফিল্টার বাটন */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            সবকিছু
          </button>
          <button
            onClick={() => handleFilterChange('today')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedFilter === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            আজ
          </button>
          <button
            onClick={() => handleFilterChange('week')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedFilter === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ৭ দিন
          </button>
          <button
            onClick={() => handleFilterChange('favorite')}
            className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
              selectedFilter === 'favorite'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Heart className="w-4 h-4" />
            প্রিয় পছন্দ
          </button>
          {history.length > 0 && (
            <button
              onClick={clearAll}
              className="ml-auto px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-semibold transition"
            >
              সবকিছু মুছুন
            </button>
          )}
        </div>
      </div>

      {/* ইতিহাস তালিকা */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-3">
          {filteredHistory.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
            >
              {/* হেডার */}
              <div
                onClick={() =>
                  setExpandedId(expandedId === record.id ? null : record.id)
                }
                className="p-4 cursor-pointer hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  {/* ছবি */}
                  <img
                    src={record.productImage}
                    alt={record.productName}
                    className="w-16 h-16 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://via.placeholder.com/64?text=ছবি';
                    }}
                  />

                  {/* মধ্যম তথ্য */}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg">
                      {record.productName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      <Clock className="inline w-3 h-3 mr-1" />
                      {formatTime(record.scannedAt)}
                    </p>
                  </div>

                  {/* দাম এবং স্কোর */}
                  <div className="text-right">
                    <p className="font-bold text-blue-600 text-lg">
                      ৳{record.price}
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">
                        {record.matchScore}%
                      </span>
                    </div>
                  </div>

                  {/* এক্সপান্ড আইকন */}
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition ${
                      expandedId === record.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* বিস্তৃত তথ্য */}
              {expandedId === record.id && (
                <div className="bg-gray-50 border-t p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">পণ্য ID</p>
                      <p className="font-semibold text-gray-800">
                        {record.productId}
                      </p>
                    </div>
                    {record.branch && (
                      <div>
                        <p className="text-sm text-gray-600">শাখা</p>
                        <p className="font-semibold text-gray-800">
                          {record.branch}
                        </p>
                      </div>
                    )}
                    {record.staff && (
                      <div>
                        <p className="text-sm text-gray-600">কর্মচারী</p>
                        <p className="font-semibold text-gray-800">
                          {record.staff}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* অ্যাকশন বাটন */}
                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      onClick={() =>
                        onProductSelect?.(record.productId)
                      }
                      className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      বিস্তারিত দেখুন
                    </button>
                    <button
                      onClick={() => toggleFavorite(record.id)}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        record.isFavorite
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Heart
                        className="w-5 h-5"
                        fill={record.isFavorite ? 'currentColor' : 'none'}
                      />
                    </button>
                    <button
                      onClick={() => handleShare(record)}
                      className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-semibold transition"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteRecord(record.id)}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {history.length === 0
              ? 'এখনো কোনো স্ক্যান নেই'
              : 'এই ফিল্টারে কোনো রেকর্ড পাওয়া যায়নি'}
          </p>
        </div>
      )}

      {/* পরিসংখ্যান */}
      {history.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm">মোট স্ক্যান</p>
            <p className="text-2xl font-bold text-blue-600">{history.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm">গড় মিল</p>
            <p className="text-2xl font-bold text-green-600">
              {(
                history.reduce((sum, r) => sum + r.matchScore, 0) /
                history.length
              ).toFixed(0)}
              %
            </p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm">প্রিয় পছন্দ</p>
            <p className="text-2xl font-bold text-red-600">
              {history.filter((r) => r.isFavorite).length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm">গড় মূল্য</p>
            <p className="text-2xl font-bold text-purple-600">
              ৳{Math.round(history.reduce((sum, r) => sum + r.price, 0) / history.length)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanHistory;
