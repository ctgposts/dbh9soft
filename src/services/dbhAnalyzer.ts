const API_URL = import.meta.env.VITE_DBH_API_URL;
const API_KEY = import.meta.env.VITE_DBH_API_KEY;
const USE_DEMO_MODE = !API_URL || !API_KEY; // ✅ Use demo mode if API credentials missing

export interface FabricAnalysis {
  fabric_name: string;
  fabric_type: string;
  embellishment: string;
  color: string;
  craftsmanship: string;
  category: string;
  additional_details: string;
  confidence: "high" | "medium" | "low";
}

// ✅ DEMO MODE: Mock analysis for development/testing
const MOCK_ANALYSES: FabricAnalysis[] = [
  {
    fabric_name: "Premium Crepe",
    fabric_type: "Crepe",
    embellishment: "Embroidered",
    color: "Black",
    craftsmanship: "Hand-embroidered with fine details",
    category: "Abaya",
    additional_details: "High-quality crepe with exquisite embroidery work. Suitable for formal occasions.",
    confidence: "high"
  },
  {
    fabric_name: "Chiffon",
    fabric_type: "Chiffon",
    embellishment: "Beaded",
    color: "Navy Blue",
    craftsmanship: "Machine beaded with precision",
    category: "Dress",
    additional_details: "Lightweight chiffon with elegant beading pattern.",
    confidence: "high"
  },
  {
    fabric_name: "Jersey Blend",
    fabric_type: "Jersey",
    embellishment: "None",
    color: "Maroon",
    craftsmanship: "Machine stitched",
    category: "Casual Wear",
    additional_details: "Comfortable jersey blend fabric for everyday wear.",
    confidence: "medium"
  }
];

// ✅ Get random mock analysis
function getRandomMockAnalysis(): FabricAnalysis {
  return MOCK_ANALYSES[Math.floor(Math.random() * MOCK_ANALYSES.length)];
}

// Image URL দিয়ে analyze করুন
export async function analyzeByUrl(imageUrl: string): Promise<FabricAnalysis> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ imageUrl }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `API error: ${res.status}`);
  }

  const data = await res.json();
  return data.analysis;
}

// Base64 image দিয়ে analyze করুন
export async function analyzeByBase64(base64: string): Promise<FabricAnalysis> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ imageBase64: base64 }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `API error: ${res.status}`);
  }

  const data = await res.json();
  return data.analysis;
}

// File থেকে base64 এ কনভার্ট করে analyze
export async function analyzeFile(file: File): Promise<FabricAnalysis> {
  return new Promise((resolve, reject) => {
    // ✅ Check if API is configured
    if (USE_DEMO_MODE) {
      console.warn('⚠️ API not configured. Using demo mode. Set VITE_DBH_API_URL and VITE_DBH_API_KEY to use real API.');
      // Simulate delay for realistic UX
      setTimeout(() => {
        resolve(getRandomMockAnalysis());
      }, 1500);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const result = await analyzeByBase64(base64);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
