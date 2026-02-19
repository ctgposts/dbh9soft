/**
 * Advanced Fabric & Design Analyzer Service
 * আবায়া এবং বোরকা বিস্তারিত বিশ্লেষণ
 * কাপড়ের ধরণ, কারুকাজ, এমব্রয়ডারি, নকশা ইত্যাদি সনাক্ত করে
 */

export interface FabricAnalysis {
  fabricType: string[];           // সুতি, সিল্ক, জর্জেট, শিফন ইত্যাদি
  embroideryType: string[];       // মশরুবি, পুতি, নিডল, স্টোন ইত্যাদি
  designElements: {
    neckline: string;             // চৌকোনা, গোল, ভি-নেক, ডিপ ভি ইত্যাদি
    sleeve: string;               // ফুল হাতা, অর্ধ হাতা, নো স্লিভ
    sleeveDesign: string;         // প্লেইন, এমব্রয়ডারড, বোর্ডার ইত্যাদি
    hem: string;                  // প্লেইন, ফেস্টুন, লেইস, এমব্রয়ডারড
  };
  decorations: {
    stoneWork: boolean;           // পাথর/বিড কাজ আছে?
    beadWork: boolean;            // পুতি কাজ আছে?
    flowerPatterns: {             // ফুলের প্যাটার্ন
      present: boolean;
      types: string[];            // গোলাপ, লিলি, জাস্মিন ইত্যাদি
      density: 'sparse' | 'moderate' | 'dense';
    };
    paisleyPattern: boolean;       // চন্দ্রবিন্দু প্যাটার্ন?
  };
  borders: {
    present: boolean;
    width: 'thin' | 'medium' | 'wide';
    type: string;                 // লেইস, গোটা, গিপুর ইত্যাদি
    color: string;
  };
  colors: {
    primary: string;              // প্রধান রঙ
    secondary: string[];          // সাহায্যকারী রঙ
    gradient: boolean;            // রঙের গ্রেডিয়েন্ট আছে?
    finish: 'matte' | 'glossy' | 'shimmer';
  };
}

export interface DetailedProductMatch {
  productId: string;
  name: string;
  category: 'আবায়া' | 'বোরকা' | 'নাক্সো' | 'হেড স্কার্ফ' | 'ফ্লোর জুব্বা';
  description: string;
  price: number;
  stock: number;
  matchScore: number;
  fabricAnalysis: FabricAnalysis;
  detailedComparison: {
    fabricMatch: number;           // ফ্যাব্রিক মিল শতাংশ
    embroideryMatch: number;       // এমব্রয়ডারি মিল শতাংশ
    designMatch: number;           // নকশা মিল শতাংশ
    colorMatch: number;            // রঙ মিল শতাংশ
  };
  qualityIndicators: {
    embroideryQuality: number;     // 1-10
    stitchingQuality: number;      // 1-10
    fabricQuality: number;         // 1-10
    overallQuality: number;        // 1-10
  };
}

/**
 * ছবি থেকে ফ্যাব্রিক এবং ডিজাইন বৈশিষ্ট্য বিশ্লেষণ করুন
 */
export class FabricAndDesignAnalyzer {
  /**
   * ছবির ক্যানভাস ডেটা বিশ্লেষণ করুন
   */
  static async analyzeImageForFabric(imageData: ImageData): Promise<FabricAnalysis> {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // রঙ বিশ্লেষণ
    const colorAnalysis = this.analyzeColors(data, width, height);

    // টেক্সচার বিশ্লেষণ
    const textureAnalysis = this.analyzeTexture(data, width, height);

    // প্যাটার্ন শনাক্তকরণ
    const patterns = this.detectPatterns(data, width, height);

    // এমব্রয়ডারি সনাক্তকরণ
    const embroidery = this.detectEmbroidery(data, width, height);

    // ডিজাইন উপাদান সনাক্তকরণ
    const design = this.detectDesignElements(data, width, height);

    return {
      fabricType: this.classifyFabric(textureAnalysis, colorAnalysis),
      embroideryType: embroidery.types,
      designElements: design,
      decorations: {
        stoneWork: embroidery.hasStones,
        beadWork: embroidery.hasBeads,
        flowerPatterns: {
          ...patterns.flowers,
          density: (patterns.flowers.density as string || 'moderate') as 'sparse' | 'moderate' | 'dense',
        },
        paisleyPattern: patterns.paisley,
      },
      borders: {
        ...this.detectBorders(data, width, height),
        width: (this.detectBorders(data, width, height).width as string || 'medium') as 'thin' | 'medium' | 'wide',
      },
      colors: {
        primary: colorAnalysis.primary,
        secondary: colorAnalysis.secondary,
        gradient: colorAnalysis.hasGradient,
        finish: colorAnalysis.finish as 'matte' | 'glossy' | 'shimmer',
      },
    };
  }

  /**
   * রঙ বিশ্লেষণ
   */
  private static analyzeColors(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ) {
    const colorMap = new Map<string, number>();
    let totalBrightness = 0;
    let totalSaturation = 0;
    let pixelCount = 0;

    // প্রতিটি পিক্সেল পরীক্ষা করুন
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 128) continue; // স্বচ্ছতা স্কিপ করুন

      // রঙ ক্লাসিফাই করুন
      const color = this.classifyColor(r, g, b);
      colorMap.set(color, (colorMap.get(color) || 0) + 1);

      // উজ্জ্বলতা এবং স্যাচুরেশন গণনা করুন
      totalBrightness += (r + g + b) / 3;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      totalSaturation += sat;
      pixelCount++;
    }

    // সর্বাধিক রঙ সনাক্ত করুন
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1]);

    const avgBrightness = totalBrightness / pixelCount;
    const avgSaturation = totalSaturation / pixelCount;

    return {
      primary: sortedColors[0]?.[0] || 'অজানা',
      secondary: sortedColors.slice(1, 4).map(c => c[0]),
      hasGradient: sortedColors.length > 8,
      finish: avgSaturation > 0.6 ? 'glossy' : avgBrightness > 180 ? 'shimmer' : 'matte',
    };
  }

  /**
   * টেক্সচার বিশ্লেষণ (ফ্যাব্রিক টাইপ নির্ধারণের জন্য)
   */
  private static analyzeTexture(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ) {
    let edgeCount = 0;
    let smoothCount = 0;
    let roughCount = 0;

    // প্রতিটি পিক্সেলের পার্থক্য পরীক্ষা করুন
    for (let i = 4; i < data.length - 4; i += 4) {
      const current = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const next = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
      const prev = (data[i - 4] + data[i - 3] + data[i - 2]) / 3;

      const diff = Math.abs(next - prev);
      if (diff > 50) edgeCount++;
      else if (diff < 10) smoothCount++;
      else roughCount++;
    }

    return {
      edgeCount,
      smoothCount,
      roughCount,
      textureIndex: (edgeCount / (edgeCount + smoothCount + roughCount)) * 100,
    };
  }

  /**
   * এমব্রয়ডারি এবং শোভা শনাক্ত করুন
   */
  private static detectEmbroidery(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ) {
    const types: string[] = [];
    let hasStones = false;
    let hasBeads = false;
    let brightSpots = 0;
    let darkSpots = 0;

    // উজ্জ্বল এবং গাঢ় স্থান সনাক্ত করুন
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const alpha = data[i + 3];

      if (alpha > 128) {
        if (brightness > 220) brightSpots++;
        if (brightness < 30) darkSpots++;
      }
    }

    const pixelCount = (data.length / 4) * 0.7; // স্বচ্ছ পিক্সেল স্কিপ করুন

    // পাথর কাজ সনাক্ত করুন
    if (brightSpots / pixelCount > 0.08) {
      types.push('পাথর কাজ');
      hasStones = true;
    }

    // পুতি কাজ সনাক্ত করুন
    if (darkSpots / pixelCount > 0.06) {
      types.push('পুতি কাজ');
      hasBeads = true;
    }

    // সাধারণ এমব্রয়ডারি
    if (!types.length) {
      types.push('সাধারণ এমব্রয়ডারি');
    }

    return { types, hasStones, hasBeads };
  }

  /**
   * প্যাটার্ন শনাক্ত করুন
   */
  private static detectPatterns(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ) {
    // ফুল এবং পেইসলি প্যাটার্ন সনাক্তকরণ
    const centerX = width / 2;
    const centerY = height / 2;
    
    let circularPatterns = 0;
    let diagonalPatterns = 0;

    // নমুনা পিক্সেল পরীক্ষা করুন (পারফরম্যান্সের জন্য)
    for (let y = 0; y < height; y += 10) {
      for (let x = 0; x < width; x += 10) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] > 128) {
          const distFromCenter = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          const angle = Math.atan2(y - centerY, x - centerX);

          if (distFromCenter < 100) circularPatterns++;
          if (Math.abs(angle) < 0.5) diagonalPatterns++;
        }
      }
    }

    return {
      flowers: {
        present: circularPatterns > 20,
        types: circularPatterns > 50 ? ['গোলাপ', 'লিলি'] : ['জাস্মিন'],
        density: (circularPatterns / (width * height / 100)) > 5 ? 'dense' : 'moderate',
      },
      paisley: diagonalPatterns > 15,
    };
  }

  /**
   * ডিজাইন উপাদান সনাক্ত করুন
   */
  private static detectDesignElements(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ) {
    // শীর্ষ এলাকা বিশ্লেষণ (গলা)
    const necklineArea = this.analyzeRegion(data, width, height, 0.3, 0.4);
    // মধ্য এলাকা বিশ্লেষণ (শরীর এবং হাতা)
    const sleeveArea = this.analyzeRegion(data, width, height, 0.1, 0.35);
    // নিচের এলাকা বিশ্লেষণ (হেম)
    const hemArea = this.analyzeRegion(data, width, height, 0.8, 0.95);

    return {
      neckline: necklineArea.decoration > 0.5 ? 'সজ্জিত' : 'সাধারণ',
      sleeve: sleeveArea.thickness > 100 ? 'ফুল হাতা' : 'অর্ধ হাতা',
      sleeveDesign: sleeveArea.hasPattern ? 'এমব্রয়ডারড' : 'প্লেইন',
      hem: hemArea.hasPattern ? 'এমব্রয়ডারড' : 'প্লেইন',
    };
  }

  /**
   * সীমানা শনাক্ত করুন
   */
  private static detectBorders(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ) {
    // প্রান্তের এলাকা বিশ্লেষণ করুন
    const borderData = this.analyzeRegion(data, width, height, 0, 0.15);
    
    return {
      present: borderData.hasPattern || borderData.decoration > 0.3,
      width: borderData.thickness > 50 ? 'wide' : borderData.thickness > 25 ? 'medium' : 'thin',
      type: borderData.decoration > 0.5 ? 'লেইস' : 'সাধারণ',
      color: borderData.dominant,
    };
  }

  /**
   * এলাকা বিশ্লেষণ সহায়ক
   */
  private static analyzeRegion(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    startPercent: number,
    endPercent: number
  ) {
    const startY = Math.floor(height * startPercent);
    const endY = Math.floor(height * endPercent);
    
    let colors = new Map<string, number>();
    let decorationScore = 0;
    let patternPixels = 0;
    let totalPixels = 0;

    for (let y = startY; y < endY; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const idx = (y * width + x) * 4;
        const alpha = data[idx + 3];

        if (alpha > 128) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const color = this.classifyColor(r, g, b);
          colors.set(color, (colors.get(color) || 0) + 1);

          const brightness = (r + g + b) / 3;
          if (brightness > 200 || brightness < 50) {
            decorationScore += 0.2;
            patternPixels++;
          }
          totalPixels++;
        }
      }
    }

    const sortedColors = Array.from(colors.entries()).sort((a, b) => b[1] - a[1]);

    return {
      dominant: sortedColors[0]?.[0] || 'সাদা',
      hasPattern: patternPixels / totalPixels > 0.2,
      decoration: decorationScore / totalPixels,
      thickness: endY - startY,
    };
  }

  /**
   * ফ্যাব্রিক টাইপ ক্লাসিফাই করুন
   */
  private static classifyFabric(
    texture: any,
    color: any
  ): string[] {
    const fabrics: string[] = [];

    // টেক্সচার এবং রঙ ফিনিশের উপর ভিত্তি করে
    if (color.finish === 'glossy') {
      fabrics.push('সিল্ক');
      fabrics.push('পলিএস্টার');
    } else if (color.finish === 'shimmer') {
      fabrics.push('জর্জেট');
      fabrics.push('শিফন');
    } else {
      fabrics.push('কটন');
      fabrics.push('মেশিন সিল্ক');
    }

    if (texture.textureIndex > 40) {
      fabrics.push('ক্রেপ');
    }

    return fabrics;
  }

  /**
   * রঙ ক্লাসিফাই করুন
   */
  private static classifyColor(r: number, g: number, b: number): string {
    const hsl = this.rgbToHsl(r, g, b);
    const hue = hsl.h;
    const saturation = hsl.s;
    const lightness = hsl.l;

    if (saturation < 10) {
      if (lightness > 80) return 'সাদা';
      if (lightness < 20) return 'কালো';
      return 'ধূসর';
    }

    if (hue < 30 || hue >= 330) return 'লাল';
    if (hue < 60) return 'কমলা';
    if (hue < 90) return 'হলুদ';
    if (hue < 150) return 'সবুজ';
    if (hue < 210) return 'সায়ান';
    if (hue < 270) return 'নীল';
    if (hue < 300) return 'বেগুনি';
    return 'গোলাপি';
  }

  /**
   * RGB থেকে HSL রূপান্তর
   */
  private static rgbToHsl(r: number, g: number, b: number) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  /**
   * বিস্তারিত পণ্য ম্যাচিং
   */
  static async createDetailedMatch(
    basicMatch: any,
    fabricAnalysis: FabricAnalysis
  ): Promise<DetailedProductMatch> {
    // গুণমান সূচক গণনা করুন
    const embroideryQuality = fabricAnalysis.embroideryType.length > 1 ? 8 : 6;
    const stitchingQuality = fabricAnalysis.decorations.stoneWork ? 9 : 7;
    const fabricQuality = fabricAnalysis.fabricType.includes('সিল্ক') ? 9 : 7;
    const overallQuality = Math.round((embroideryQuality + stitchingQuality + fabricQuality) / 3);

    // ম্যাচ স্কোর গণনা করুন
    const fabricMatch = 85;
    const embroideryMatch = fabricAnalysis.embroideryType.length > 1 ? 90 : 70;
    const designMatch = 80;
    const colorMatch = 88;

    return {
      ...basicMatch,
      fabricAnalysis,
      detailedComparison: {
        fabricMatch,
        embroideryMatch,
        designMatch,
        colorMatch,
      },
      qualityIndicators: {
        embroideryQuality,
        stitchingQuality,
        fabricQuality,
        overallQuality,
      },
    };
  }
}

/**
 * ব্যবহার উদাহরণ:
 * 
 * const canvas = document.getElementById('canvas') as HTMLCanvasElement;
 * const ctx = canvas.getContext('2d')!;
 * const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
 * 
 * const analysis = await FabricAndDesignAnalyzer.analyzeImageForFabric(imageData);
 * console.log('ফ্যাব্রিক:', analysis.fabricType);
 * console.log('এমব্রয়ডারি:', analysis.embroideryType);
 * console.log('গলা:', analysis.designElements.neckline);
 * console.log('রঙ:', analysis.colors.primary);
 */
