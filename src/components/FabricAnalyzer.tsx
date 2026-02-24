import { useState } from "react";
import { analyzeFile, FabricAnalysis } from "../services/dbhAnalyzer";

export default function FabricAnalyzer() {
  const [result, setResult] = useState<FabricAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeFile(file);
      setResult(analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* File Upload Section */}
      <div className="border-2 border-dashed border-amber-300 rounded-lg p-6 sm:p-8 hover:border-amber-400 hover:bg-amber-50/50 transition-all cursor-pointer">
        <label className="cursor-pointer space-y-2 sm:space-y-3 flex flex-col items-center">
          <span className="text-4xl sm:text-5xl">📸</span>
          <span className="text-sm sm:text-base font-semibold text-slate-700">Upload Fabric Image</span>
          <span className="text-xs sm:text-sm text-slate-500">PNG, JPG, or WebP format</span>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
        </label>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="animate-spin text-lg sm:text-xl">⏳</div>
            <p className="text-xs sm:text-sm font-semibold text-slate-700">Analyzing fabric...</p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-red-800">
            <strong>❌ Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Analysis Results */}
      {result && (
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900">📊 Analysis Results</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {/* Fabric Name */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4 border border-blue-200">
              <p className="text-xs font-semibold text-blue-600 uppercase mb-1 sm:mb-2">Fabric</p>
              <p className="text-sm sm:text-lg font-bold text-blue-900 line-clamp-2">{result.fabric_name}</p>
            </div>

            {/* Fabric Type */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 sm:p-4 border border-purple-200">
              <p className="text-xs font-semibold text-purple-600 uppercase mb-1 sm:mb-2">Type</p>
              <p className="text-sm sm:text-lg font-bold text-purple-900 line-clamp-2">{result.fabric_type}</p>
            </div>

            {/* Color */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-3 sm:p-4 border border-pink-200">
              <p className="text-xs font-semibold text-pink-600 uppercase mb-1 sm:mb-2">Color</p>
              <p className="text-sm sm:text-lg font-bold text-pink-900 line-clamp-2">{result.color}</p>
            </div>

            {/* Category */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 sm:p-4 border border-green-200">
              <p className="text-xs font-semibold text-green-600 uppercase mb-1 sm:mb-2">Category</p>
              <p className="text-sm sm:text-lg font-bold text-green-900 line-clamp-2">{result.category}</p>
            </div>

            {/* Embellishment */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 sm:p-4 border border-yellow-200">
              <p className="text-xs font-semibold text-yellow-600 uppercase mb-1 sm:mb-2">Embellish</p>
              <p className="text-sm sm:text-lg font-bold text-yellow-900 line-clamp-2">{result.embellishment}</p>
            </div>

            {/* Confidence */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 sm:p-4 border border-orange-200">
              <p className="text-xs font-semibold text-orange-600 uppercase mb-1 sm:mb-2">Confidence</p>
              <p className="text-sm sm:text-lg font-bold text-orange-900 capitalize">{result.confidence}</p>
            </div>
          </div>

          {/* Craftsmanship */}
          <div className="bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1 sm:mb-2">Craftsmanship</p>
            <p className="text-xs sm:text-sm text-slate-700">{result.craftsmanship}</p>
          </div>

          {/* Additional Details */}
          <div className="bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1 sm:mb-2">Details</p>
            <p className="text-xs sm:text-sm text-slate-700">{result.additional_details}</p>
          </div>

          {/* Copy Results Button */}
          <button
            onClick={() => {
              const resultText = `Fabric Name: ${result.fabric_name}
Fabric Type: ${result.fabric_type}
Color: ${result.color}
Category: ${result.category}
Embellishment: ${result.embellishment}
Craftsmanship: ${result.craftsmanship}
Details: ${result.additional_details}
Confidence: ${result.confidence}`;
              navigator.clipboard.writeText(resultText);
              alert('✅ Results copied to clipboard!');
            }}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm sm:text-base rounded-lg hover:from-amber-700 hover:to-orange-700 font-semibold transition-all"
          >
            📋 Copy Results
          </button>
        </div>
      )}
    </div>
  );
}
