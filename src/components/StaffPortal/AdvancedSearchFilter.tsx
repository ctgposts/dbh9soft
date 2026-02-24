import React, { useState } from 'react';
import { Search, Filter, X, Save } from 'lucide-react';

interface SearchFilters {
  productName?: string;
  barcode?: string;
  dateFrom?: string;
  dateTo?: string;
  approvalStatus?: 'all' | 'approved' | 'pending' | 'rejected';
  uploader?: string;
  branch?: string;
  minQualityScore?: number;
}

interface AdvancedSearchFilterProps {
  onSearch: (filters: SearchFilters) => void;
  onClose?: () => void;
  savedFilters?: SearchFilters[];
}

export const AdvancedSearchFilter: React.FC<AdvancedSearchFilterProps> = ({
  onSearch,
  onClose,
  savedFilters = [],
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    approvalStatus: 'all',
    minQualityScore: 0,
  });
  const [filterName, setFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      approvalStatus: 'all',
      minQualityScore: 0,
    });
  };

  const handleSaveFilter = () => {
    // localStorage এ সংরক্ষণ করুন
    console.log('ফিল্টার সংরক্ষিত:', filterName, filters);
    setShowSaveDialog(false);
    setFilterName('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto space-y-6">
      {/* হেডার */}
      <div className="border-b border-gray-200 pb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Filter className="w-6 h-6 text-blue-600" />
          উন্নত অনুসন্ধান ফিল্টার
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* ফিল্টার ফর্ম */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* পণ্যের নাম */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            পণ্যের নাম
          </label>
          <input
            type="text"
            value={filters.productName || ''}
            onChange={(e) => handleFilterChange('productName', e.target.value)}
            placeholder="পণ্য খুঁজুন..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* বারকোড */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            বারকোড
          </label>
          <input
            type="text"
            value={filters.barcode || ''}
            onChange={(e) => handleFilterChange('barcode', e.target.value)}
            placeholder="DBH-0001 বা ছবি ক্লিক করুন..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* তারিখ থেকে */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            তারিখ থেকে
          </label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* তারিখ পর্যন্ত */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            তারিখ পর্যন্ত
          </label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* অনুমোদন স্ট্যাটাস */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            অনুমোদন স্থিতি
          </label>
          <select
            value={filters.approvalStatus || 'all'}
            onChange={(e) =>
              handleFilterChange(
                'approvalStatus',
                e.target.value as SearchFilters['approvalStatus']
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">সব</option>
            <option value="approved">অনুমোদিত</option>
            <option value="pending">অপেক্ষমান</option>
            <option value="rejected">অস্বীকৃত</option>
          </select>
        </div>

        {/* আপলোডকারী */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            আপলোডকারী
          </label>
          <input
            type="text"
            value={filters.uploader || ''}
            onChange={(e) => handleFilterChange('uploader', e.target.value)}
            placeholder="স্টাফের নাম..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* শাখা */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            শাখা
          </label>
          <select
            value={filters.branch || ''}
            onChange={(e) => handleFilterChange('branch', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">সব শাখা</option>
            <option value="dhaka">ঢাকা শাখা</option>
            <option value="chittagong">চট্টগ্রাম শাখা</option>
            <option value="khulna">খুলনা শাখা</option>
            <option value="sylhet">সিলেট শাখা</option>
          </select>
        </div>

        {/* গুণমান স্কোর */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ন্যূনতম গুণমান স্কোর: {filters.minQualityScore}%
          </label>
          <input
            type="range"
            value={filters.minQualityScore || 0}
            onChange={(e) =>
              handleFilterChange('minQualityScore', parseInt(e.target.value))
            }
            min="0"
            max="100"
            step="5"
            className="w-full"
          />
        </div>
      </div>

      {/* সংরক্ষিত ফিল্টার */}
      {savedFilters.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">💾 সংরক্ষিত ফিল্টার</h3>
          <div className="flex flex-wrap gap-2">
            {savedFilters.map((filter, index) => (
              <button
                key={index}
                onClick={() => setFilters(filter)}
                className="bg-white border border-gray-300 hover:bg-blue-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition"
              >
                {`ফিল্টার ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* অ্যাকশন বাটন */}
      <div className="flex gap-2 border-t border-gray-200 pt-4">
        <button
          onClick={handleReset}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-medium transition"
        >
          রিসেট করুন
        </button>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex-1 bg-purple-400 hover:bg-purple-500 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          ফিল্টার সংরক্ষণ করুন
        </button>
        <button
          onClick={handleSearch}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          অনুসন্ধান করুন
        </button>
      </div>

      {/* সংরক্ষণ ডায়ালগ */}
      {showSaveDialog && (
        <div className="border-t border-gray-200 pt-4 space-y-3 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800">ফিল্টার নাম দিন</h3>
          <input
            type="text"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="যেমন: 'আমার প্রিয় ফিল্টার'..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowSaveDialog(false)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition"
            >
              বাতিল করুন
            </button>
            <button
              onClick={handleSaveFilter}
              disabled={!filterName.trim()}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
