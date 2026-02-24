const API_URL = import.meta.env.VITE_DBH_API_URL;
const API_KEY = import.meta.env.VITE_DBH_API_KEY;

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
