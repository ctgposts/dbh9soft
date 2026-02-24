import { useState, useRef } from "react";
import { FabricAndDesignAnalyzer, FabricAnalysis } from "../services/FabricAndDesignAnalyzer";

export default function FabricAnalyzer() {
  const [result, setResult] = useState<FabricAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // ছবি URL তৈরি করুন
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);

      // Image লোড করুন একটি canvas এ
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = async () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error("Canvas not available");
        }

        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Cannot get canvas context");
        }

        ctx.drawImage(img, 0, 0);

        // ImageData extract করুন
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Advanced Fabric Analysis করুন (Client-side, real-time)
        const analysis = await FabricAndDesignAnalyzer.analyzeImageForFabric(imageData);
        setResult(analysis);

        console.log("✅ Fabric Analysis Complete:", analysis);
      };

      img.onerror = () => {
        throw new Error("Failed to load image");
      };

      img.src = imageUrl;
    } catch (err: any) {
      setError(err.message || "Analysis failed");
      console.error("❌ Analysis Error:", err);
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

      {/* Hidden Canvas for Image Processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Analysis Results */}
      {result && (
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900">📊 Analysis Results</h3>
          
          {/* Uploaded Image Preview */}
          {uploadedImage && (
            <div className="rounded-lg overflow-hidden max-h-48 sm:max-h-64 w-full">
              <img src={uploadedImage} alt="Uploaded fabric" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Fabric Type */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4 border border-blue-200">
            <p className="text-xs font-semibold text-blue-600 uppercase mb-1 sm:mb-2">🧵 Fabric Type</p>
            <div className="flex flex-wrap gap-2">
              {result.fabricType?.map((type, idx) => (
                <span key={idx} className="text-sm sm:text-base font-bold text-blue-900 bg-blue-200 px-2 sm:px-3 py-1 rounded">
                  {type}
                </span>
              )) || <span className="text-sm text-gray-500">Not detected</span>}
            </div>
          </div>

          {/* Embroidery Type */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 sm:p-4 border border-purple-200">
            <p className="text-xs font-semibold text-purple-600 uppercase mb-1 sm:mb-2">💎 Embroidery</p>
            <div className="flex flex-wrap gap-2">
              {result.embroideryType?.map((type, idx) => (
                <span key={idx} className="text-sm sm:text-base font-bold text-purple-900 bg-purple-200 px-2 sm:px-3 py-1 rounded">
                  {type}
                </span>
              )) || <span className="text-sm text-gray-500">Not detected</span>}
            </div>
          </div>

          {/* Design Elements */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-3 sm:p-4 border border-pink-200">
              <p className="text-xs font-semibold text-pink-600 uppercase mb-1">👔 Neckline</p>
              <p className="text-sm sm:text-lg font-bold text-pink-900 line-clamp-2">{result.designElements?.neckline || "Unknown"}</p>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg p-3 sm:p-4 border border-rose-200">
              <p className="text-xs font-semibold text-rose-600 uppercase mb-1">🤚 Sleeve</p>
              <p className="text-sm sm:text-lg font-bold text-rose-900 line-clamp-2">{result.designElements?.sleeve || "Unknown"}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 sm:p-4 border border-orange-200">
              <p className="text-xs font-semibold text-orange-600 uppercase mb-1">✨ Sleeve Design</p>
              <p className="text-sm sm:text-lg font-bold text-orange-900 line-clamp-2">{result.designElements?.sleeveDesign || "Unknown"}</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 sm:p-4 border border-amber-200">
              <p className="text-xs font-semibold text-amber-600 uppercase mb-1">🪡 Hem</p>
              <p className="text-sm sm:text-lg font-bold text-amber-900 line-clamp-2">{result.designElements?.hem || "Unknown"}</p>
            </div>
          </div>

          {/* Colors */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 sm:p-4 border border-green-200">
            <p className="text-xs font-semibold text-green-600 uppercase mb-2">🎨 Colors</p>
            <div>
              <p className="text-xs font-semibold text-green-700 mb-1">Primary:</p>
              <p className="text-sm sm:text-lg font-bold text-green-900 mb-3">{result.colors?.primary || "Unknown"}</p>
              {result.colors?.secondary && result.colors.secondary.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-green-700 mb-1">Secondary:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.colors.secondary.map((color, idx) => (
                      <span key={idx} className="text-xs sm:text-sm font-bold text-green-900 bg-green-200 px-2 py-1 rounded">
                        {color}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <p className="text-xs mt-2">Finish: <span className="font-semibold capitalize">{result.colors?.finish || "Unknown"}</span></p>
              {result.colors?.gradient && <p className="text-xs mt-1 text-green-700">✓ Gradient detected</p>}
            </div>
          </div>

          {/* Decorations & Patterns */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-3 sm:p-4 border border-indigo-200">
              <p className="text-xs font-semibold text-indigo-600 uppercase mb-2">🪨 Stone Work</p>
              <p className="text-lg sm:text-2xl">{result.decorations?.stoneWork ? "✅ Yes" : "❌ No"}</p>
            </div>

            <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg p-3 sm:p-4 border border-violet-200">
              <p className="text-xs font-semibold text-violet-600 uppercase mb-2">💠 Bead Work</p>
              <p className="text-lg sm:text-2xl">{result.decorations?.beadWork ? "✅ Yes" : "❌ No"}</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 sm:p-4 border border-red-200">
              <p className="text-xs font-semibold text-red-600 uppercase mb-2">🌹 Flowers</p>
              <p className="text-lg sm:text-2xl">{result.decorations?.flowerPatterns?.present ? "✅ Yes" : "❌ No"}</p>
              {result.decorations?.flowerPatterns?.present && (
                <p className="text-xs mt-1 text-red-700">Density: {result.decorations.flowerPatterns.density}</p>
              )}
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-3 sm:p-4 border border-cyan-200">
              <p className="text-xs font-semibold text-cyan-600 uppercase mb-2">🌙 Paisley</p>
              <p className="text-lg sm:text-2xl">{result.decorations?.paisleyPattern ? "✅ Yes" : "❌ No"}</p>
            </div>
          </div>

          {/* Borders */}
          {result.borders?.present && (
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-3 sm:p-4 border border-teal-200">
              <p className="text-xs font-semibold text-teal-600 uppercase mb-2">🖼️ Border Details</p>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div>
                  <p className="font-semibold text-teal-700">Type:</p>
                  <p className="text-teal-900">{result.borders.type || "Unknown"}</p>
                </div>
                <div>
                  <p className="font-semibold text-teal-700">Width:</p>
                  <p className="text-teal-900 capitalize">{result.borders.width || "Unknown"}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-semibold text-teal-700">Color:</p>
                  <p className="text-teal-900">{result.borders.color || "Unknown"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Copy Results Button */}
          <button
            onClick={() => {
              const resultText = `
=== FABRIC ANALYSIS REPORT ===

FABRIC TYPE: ${result.fabricType?.join(", ") || "Not detected"}
EMBROIDERY: ${result.embroideryType?.join(", ") || "Not detected"}

DESIGN ELEMENTS:
- Neckline: ${result.designElements?.neckline || "Unknown"}
- Sleeve: ${result.designElements?.sleeve || "Unknown"}
- Sleeve Design: ${result.designElements?.sleeveDesign || "Unknown"}
- Hem: ${result.designElements?.hem || "Unknown"}

COLORS:
- Primary: ${result.colors?.primary || "Unknown"}
- Secondary: ${result.colors?.secondary?.join(", ") || "None"}
- Finish: ${result.colors?.finish || "Unknown"}
- Gradient: ${result.colors?.gradient ? "Yes" : "No"}

DECORATIONS:
- Stone Work: ${result.decorations?.stoneWork ? "Yes" : "No"}
- Bead Work: ${result.decorations?.beadWork ? "Yes" : "No"}
- Flower Patterns: ${result.decorations?.flowerPatterns?.present ? "Yes" : "No"}
${result.decorations?.flowerPatterns?.present ? `  Density: ${result.decorations.flowerPatterns.density}` : ""}
- Paisley Pattern: ${result.decorations?.paisleyPattern ? "Yes" : "No"}

BORDERS:
- Present: ${result.borders?.present ? "Yes" : "No"}
${result.borders?.present ? `- Type: ${result.borders.type}` : ""}
${result.borders?.present ? `- Width: ${result.borders.width}` : ""}
${result.borders?.present ? `- Color: ${result.borders.color}` : ""}
              `;
              navigator.clipboard.writeText(resultText.trim());
              alert("✅ Analysis copied to clipboard!");
            }}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm sm:text-base rounded-lg hover:from-amber-700 hover:to-orange-700 font-semibold transition-all"
          >
            📋 Copy Report
          </button>
        </div>
      )}
    </div>
  );
}
