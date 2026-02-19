/**
 * Detailed Fabric Analysis Report Component
 * আবায়া এবং বোরকার বিস্তারিত বিশ্লেষণ রিপোর্ট প্রদর্শন করে
 */

import React from 'react';
import { FabricAnalysis } from '@/services/FabricAndDesignAnalyzer';
import { Sparkles, Check, AlertCircle } from 'lucide-react';

interface DetailedAnalysisReportProps {
  analysis: FabricAnalysis;
  productName: string;
  matchScore: number;
}

export const DetailedAnalysisReport: React.FC<DetailedAnalysisReportProps> = ({
  analysis,
  productName,
  matchScore,
}) => {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-6 space-y-6">
      {/* হেডার */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            বিস্তারিত বিশ্লেষণ: {productName}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            উন্নত AI প্রযুক্তি দ্বারা বিশ্লেষিত
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-purple-600">{matchScore}%</div>
          <p className="text-xs text-gray-600">নির্ভুলতা</p>
        </div>
      </div>

      {/* ১. ফ্যাব্রিক্স বিশ্লেষণ */}
      <div className="bg-white rounded-lg p-4 border-l-4 border-purple-600">
        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
          কাপড়ের ধরণ (Fabric Type)
        </h4>
        <div className="space-y-2">
          {analysis.fabricType.map((fabric) => (
            <div key={fabric} className="flex items-center gap-2 text-gray-700">
              <Check className="w-4 h-4 text-green-600" />
              <span className="font-medium">{fabric}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2 italic">
          💡 টিপ: বিভিন্ন ধরনের সাদা ফ্যাব্রিক্স চিহ্নিত হয়েছে যা প্রিমিয়াম মানের পোশাকের জন্য উপযুক্ত।
        </p>
      </div>

      {/* ২. এমব্রয়ডারি এবং কারুকাজ */}
      <div className="bg-white rounded-lg p-4 border-l-4 border-pink-600">
        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-pink-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
          এমব্রয়ডারি এবং কারুকাজ
        </h4>
        <div className="space-y-2">
          {analysis.embroideryType.map((type) => (
            <div key={type} className="flex items-center gap-2 text-gray-700">
              <Check className="w-4 h-4 text-green-600" />
              <span className="font-medium">{type}</span>
            </div>
          ))}
        </div>

        {/* পুতি এবং পাথরের কাজ */}
        <div className="mt-3 pt-3 border-t space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">পাথর/বিড কাজ:</span>
            <span className={`font-semibold ${analysis.decorations.stoneWork ? 'text-green-600' : 'text-gray-500'}`}>
              {analysis.decorations.stoneWork ? '✓ উপস্থিত' : '✗ অনুপস্থিত'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">পুতির কাজ:</span>
            <span className={`font-semibold ${analysis.decorations.beadWork ? 'text-green-600' : 'text-gray-500'}`}>
              {analysis.decorations.beadWork ? '✓ উপস্থিত' : '✗ অনুপস্থিত'}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-2 italic">
          💡 টিপ: পোশাকের মধ্যে শোভামণ্ডন এবং কারুকাজ সেই পণ্যের গুণমান নির্দেশ করে।
        </p>
      </div>

      {/* ৩. ডিজাইন এবং নকশা */}
      <div className="bg-white rounded-lg p-4 border-l-4 border-blue-600">
        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">3</span>
          ডিজাইন এবং নকশা
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-gray-600 font-medium">গলার আকৃতি (Neckline):</p>
            <p className="font-semibold text-gray-800 text-lg">
              {analysis.designElements.neckline}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">হাতার স্টাইল:</p>
            <p className="font-semibold text-gray-800 text-lg">
              {analysis.designElements.sleeve}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">হাতার নকশা:</p>
            <p className="font-semibold text-gray-800">
              {analysis.designElements.sleeveDesign}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">হেম স্টাইল:</p>
            <p className="font-semibold text-gray-800">
              {analysis.designElements.hem}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-3 italic">
          💡 টিপ: প্রতিটি ডিজাইন উপাদান পোশাকের প্রামাণিকতা এবং ঐতিহ্যবাহী শৈলী নির্ধারণ করে।
        </p>
      </div>

      {/* ৪. ফুল এবং প্যাটার্ন */}
      {analysis.decorations.flowerPatterns.present && (
        <div className="bg-white rounded-lg p-4 border-l-4 border-rose-600">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs">4</span>
            ফুলের প্যাটার্ন এবং ডিজাইন
          </h4>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600 font-medium">ফুলের ধরণ:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {analysis.decorations.flowerPatterns.types.map((flower) => (
                  <span key={flower} className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-sm font-medium">
                    {flower}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">ঘনত্ব:</p>
              <p className="font-semibold text-gray-800">
                {analysis.decorations.flowerPatterns.density === 'dense' 
                  ? '🌹 ঘনভাবে সজ্জিত' 
                  : analysis.decorations.flowerPatterns.density === 'moderate'
                  ? '🌸 মাঝারি সজ্জা'
                  : '🌼 হালকা সজ্জা'}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2 italic">
            💡 টিপ: ফুলের ঘনত্ব পোশাকের জমকালোতা এবং মূল্য নির্ধারণে সহায়তা করে।
          </p>
        </div>
      )}

      {/* ৫. সীমানা এবং প্রান্ত */}
      {analysis.borders.present && (
        <div className="bg-white rounded-lg p-4 border-l-4 border-amber-600">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs">5</span>
            সীমানা এবং প্রান্ত (Borders)
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">সীমানার ধরণ:</span>
              <span className="font-semibold text-amber-700">{analysis.borders.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">সীমানার প্রস্থ:</span>
              <span className="font-semibold text-amber-700">
                {analysis.borders.width === 'wide' ? '📏 প্রশস্ত' : analysis.borders.width === 'medium' ? '📏 মাঝারি' : '📏 সরু'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">সীমানার রঙ:</span>
              <span className="font-semibold text-amber-700">{analysis.borders.color}</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2 italic">
            💡 টিপ: বাস্তব সীমানা পোশাকের নকশায় একটি গুরুত্বপূর্ণ ভূমিকা পালন করে।
          </p>
        </div>
      )}

      {/* ৬. রঙ এবং ফিনিশ */}
      <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-600">
        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs">6</span>
          রঙ এবং ফিনিশ
        </h4>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 font-medium">প্রধান রঙ:</p>
            <div className="flex items-center gap-2 mt-1">
              <div 
                className="w-8 h-8 rounded border-2 border-gray-300"
                style={{
                  backgroundColor: getColorHex(analysis.colors.primary)
                }}
              />
              <span className="font-semibold text-gray-800">{analysis.colors.primary}</span>
            </div>
          </div>
          {analysis.colors.secondary.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 font-medium">সাহায্যকারী রঙ:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {analysis.colors.secondary.map((color) => (
                  <div key={color} className="flex items-center gap-1">
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{
                        backgroundColor: getColorHex(color)
                      }}
                    />
                    <span className="text-sm text-gray-700">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 font-medium">ফিনিশের ধরণ:</p>
            <p className="font-semibold text-gray-800">
              {analysis.colors.finish === 'glossy' 
                ? '✨ উজ্জ্বল (Glossy)' 
                : analysis.colors.finish === 'shimmer'
                ? '✨ চকচকে (Shimmer)'
                : '✨ ম্যাট (Matte)'}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2 italic">
          💡 টিপ: রঙ এবং ফিনিশ পোশাকের আধুনিকতা এবং ঐতিহ্যের সংমিশ্রণ প্রতিফলিত করে।
        </p>
      </div>

      {/* সামগ্রিক মূল্যায়ন */}
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 border border-purple-300">
        <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          সামগ্রিক মূল্যায়ন
        </h4>
        <p className="text-gray-700 text-sm leading-relaxed">
          এই পোশাকটি উন্নত কৃত্রিম বুদ্ধিমত্তা প্রযুক্তি ব্যবহার করে বিস্তারিতভাবে বিশ্লেষণ করা হয়েছে। 
          সকল ডিজাইন উপাদান, ফ্যাব্রিক্স, এমব্রয়ডারি এবং রঙের মিশ্রণ পরীক্ষা করা হয়েছে যাতে সর্বোচ্চ নির্ভুলতা নিশ্চিত করা যায়।
        </p>
      </div>
    </div>
  );
};

// Helper function to get color hex
const getColorHex = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'কালো': '#000000',
    'সাদা': '#FFFFFF',
    'লাল': '#FF0000',
    'গাঢ় লাল': '#8B0000',
    'সবুজ': '#008000',
    'নীল': '#0000FF',
    'হলুদ': '#FFFF00',
    'গোলাপি': '#FFC0CB',
    'বেগুনি': '#800080',
    'ধূসর': '#808080',
    'অজানা': '#CCCCCC',
  };
  return colorMap[colorName] || '#CCCCCC';
};

export default DetailedAnalysisReport;
