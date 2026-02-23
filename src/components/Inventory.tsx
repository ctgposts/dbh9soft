import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface ProductVariant {
  id: string; // Unique identifier for variant
  color: string;
  size: string;
  stock: number;
}

// Function to generate random alphanumeric prefix with timestamp - improved for uniqueness
const generateRandomPrefix = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const timestamp = Date.now().toString().slice(-5); // Last 5 digits of timestamp for better uniqueness
  const randomComponent = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3-digit random
  let result = '';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${result}${timestamp}${randomComponent}`; // Format: ABC1234567890 (13 chars total)
};

// Function to generate next model number
const generateNextModelNumber = (existingProducts: any[]) => {
  const currentYear = new Date().getFullYear();
  const prefix = `RD-${currentYear}-`;
  
  // Find all model numbers with current year prefix
  const currentYearModels = existingProducts
    .filter(p => p.model && p.model.startsWith(prefix))
    .map(p => {
      const match = p.model.match(/RD-\d{4}-(\d{4})/);
      return match ? parseInt(match[1]) : 0;
    })
    .filter(num => !isNaN(num));
  
  // Get the highest number and increment
  const maxNumber = currentYearModels.length > 0 ? Math.max(...currentYearModels) : 0;
  const nextNumber = maxNumber + 1;
  
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

// ✅ FIX #5: Image compression function with proper Canvas context handling
const compressImage = (file: File, quality: number = 0.7, maxWidth: number = 1200, maxHeight: number = 1200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Calculate new dimensions to fit within max bounds while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // ✅ FIX #5: Safe Canvas context check
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get Canvas context. Canvas 2D API not available.'));
          return;
        }
        
        try {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          
            // Log compression info
            const originalSize = (file.size / 1024).toFixed(2);
            const compressedSize = (compressedDataUrl.length / 1024).toFixed(2);
            console.log(`📦 Image compressed: ${originalSize}KB → ${compressedSize}KB (${Math.round((1 - parseFloat(compressedSize)/parseFloat(originalSize)) * 100)}% reduction)`);
            
            resolve(compressedDataUrl);
        } catch (error) {
          reject(new Error(`Image processing failed: ${error instanceof Error ? error.message : String(error)}`));
        }
        };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

// Function to auto-generate product name from Category + Fabric + Embellishments
const generateProductName = (categoryId: string, fabric: string, embellishments: string, categories: any[]): string => {
  if (!fabric || !embellishments) {
    return "";
  }
  
  // Get category name from categoryId (optional)
  let categoryName = "";
  if (categoryId) {
    const category = categories.find(c => c._id === categoryId);
    categoryName = category ? category.name : "";
  }
  
  // Combine: Category Name (if exists) + Fabric + Embellishments
  const parts = [categoryName, fabric, embellishments].filter(part => part.trim());
  return parts.join(" ");
};

export default function Inventory() {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterFabric, setFilterFabric] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [filterOccasion, setFilterOccasion] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [imageZoomLevel, setImageZoomLevel] = useState(1);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "DUBAI BORKA HOUSE",
    model: "",
    categoryId: "",
    style: "Dubai Style",
    fabric: "",
    embellishments: "",
    occasion: "Party Wear",
    costPrice: 0,
    sellingPrice: 0,
    pictureUrl: "",
    barcode: "",
    productCode: "",
    madeBy: "U.A.E",
    stockLocation: "",
    minStockLevel: 0,
    maxStockLevel: 100,
    description: "",
    isActive: true,
  });

  // Product variants state for multiple color/size/stock entries
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([
    { id: `variant-${Date.now()}`, color: "", size: "", stock: 0 }
  ]);

  // ✅ UNLIMITED: Load ALL products without pagination
  // Using new getAllProducts query to bypass Convex default 20-item limit
  const products = useQuery(api.products.getAllProducts, {}) || [];
  const categories = useQuery(api.categories.list) || [];
  const addProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const deleteProduct = useMutation(api.products.remove);
  const addCategory = useMutation(api.categories.create);
  const autoAssignBoxNumbers = useMutation(api.products.autoAssignBoxNumbers);

  // ✅ COMPREHENSIVE Debug Logging - Step by step analysis
  useEffect(() => {
    console.group('🔍 INVENTORY COMPREHENSIVE DEBUG');
    
    console.log('Step 1: Query Response');
    console.log('  products (getAllProducts):', products);
    
    console.log('\nStep 2: Products Array');
    console.log('  products.length:', products?.length || 0);
    console.log('  products array:', products);
    
    console.log('\nStep 3: Data Validation');
    if (products && products.length > 0) {
      console.log('  ✅ Products found!', products.length, 'total');
      console.log('  First product:', products[0]);
      console.log('  Last product:', products[products.length - 1]);
      
      const totalValue = products.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.sellingPrice || 0)), 0);
      console.log('  Total stock value:', totalValue);
    } else {
      console.warn('  ❌ NO PRODUCTS! Array is empty');
    }
    
    console.log('\nStep 4: Categories');
    console.log('  categories.length:', categories?.length || 0);
    
    console.groupEnd();
  }, [products?.length, products, categories]);

  // NOTE: Removed auto-creation of "General" category
  // Categories must be manually created by the user

  // Auto-generate model number and product code when form opens
  useEffect(() => {
    if (showAddProduct && products.length > 0) {
      const nextModel = generateNextModelNumber(products);
      const randomPrefix = generateRandomPrefix();
      
      setNewProduct(prev => ({
        ...prev,
        model: nextModel,
        productCode: randomPrefix
      }));
    }
  }, [showAddProduct, products]);

  // Auto-generate product name from Category + Fabric + Embellishments
  useEffect(() => {
    const generatedName = generateProductName(newProduct.categoryId, newProduct.fabric, newProduct.embellishments, categories);
    // Auto-fill the name only if it's empty
    if (generatedName && !newProduct.name.trim()) {
      setNewProduct(prev => ({
        ...prev,
        name: generatedName
      }));
    }
  }, [newProduct.categoryId, newProduct.fabric, newProduct.embellishments, categories]);

  // Memoized unique values for filters - optimized for performance
  const uniqueValues = useMemo(() => {
    const brands = new Set<string>();
    const fabrics = new Set<string>();
    const colors = new Set<string>();
    const occasions = new Set<string>();

    products.forEach(p => {
      brands.add(p.brand);
      fabrics.add(p.fabric);
      colors.add(p.color);
      if (p.occasion) occasions.add(p.occasion);
    });

    return {
      brands: Array.from(brands),
      fabrics: Array.from(fabrics),
      colors: Array.from(colors),
      occasions: Array.from(occasions)
    };
  }, [products]);

  // Common abaya sizes and colors - static arrays for performance
  const commonSizes = useMemo(() => ['50"', '52"', '54"', '56"', '58"', '60"', '62"'], []);
  const commonColors = useMemo(() => [
    'Black', 'Sky Blue', 'Navy Blue', 'Dark Brown', 'Maroon', 'Dark Green', 'Lemon', 'Pink', 'Mint', 
    'Purple', 'Grey', 'Beige', 'White', 'Cream', 'Gold', 'Silver', 'Red', 'Crimson', 'Burgundy', 'Wine', 'Coral', 'Peach', 'Rose Pink', 'Baby Pink', 'Hot Pink',
'Fuchsia', 'Lavender', 'Lilac', 'Violet', 'Plum', 'Royal Blue', 'Cobalt Blue', 'Teal', 'Turquoise', 'Aqua', 'Sea Green', 'Olive', 'Olive Green', 'Bottle Green', 'Emerald Green',
'Pista', 'Mustard', 'Amber', 'Rust', 'Copper', 'Bronze', 'Chocolate Brown', 'Coffee', 'Mocha', 'Camel', 'Khaki', 'Taupe', 'Charcoal', 'Ash', 'Off White', 'Ivory', 'Pearl', 'Champagne', 'Metallic Gold', 'Metallic Silver', 'Gunmetal', 'Midnight Blue', 'Indigo'
  ], []);

  // Memoized filtered and sorted products for optimal performance
  const filteredProducts = useMemo(() => {
    // Load serial and variant data from localStorage for search
    const serialNumberMapStr = localStorage.getItem("productSerialNumbers") || "{}";
    const variantMapStr = localStorage.getItem("variantMap") || "{}";
    const productVariantsStr = localStorage.getItem("productVariants") || "{}";
    
    const serialNumberMap = new Map<string, string>(Object.entries(JSON.parse(serialNumberMapStr)));
    const variantMap = new Map<string, number>(Object.entries(JSON.parse(variantMapStr)));
    const productVariants = new Map<string, number>(Object.entries(JSON.parse(productVariantsStr)));
    
    let filtered = products.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      
      // ✅ ENHANCED SEARCH #8: Search by barcode, color, size, productCode, style #, and box number
      const matchesStandardSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.productCode.toLowerCase().includes(searchLower) ||
        product.barcode.toLowerCase().includes(searchLower) ||
        // Search by Style Number (DBH-0000 format)
        (product.styleNumber && product.styleNumber.toLowerCase().includes(searchLower)) ||
        // Search by Box/Stock Location (BOX-1, BOX-2, etc)
        (product.stockLocation && product.stockLocation.toLowerCase().includes(searchLower)) ||
        // Search by color + size combination for variant lookup
        (product.color && `${product.color.toLowerCase()} ${product.sizes?.join(' ').toLowerCase() || ''}`.includes(searchLower)) ||
        // Search by individual color or size
        (product.color && product.color.toLowerCase().includes(searchLower)) ||
        (product.sizes && product.sizes.some(s => s.toLowerCase().includes(searchLower))) ||
        // Search by fabric and embellishments
        (product.fabric && product.fabric.toLowerCase().includes(searchLower)) ||
        (product.embellishments && product.embellishments.toLowerCase().includes(searchLower)) ||
        // Search by occasion and style
        (product.occasion && product.occasion.toLowerCase().includes(searchLower)) ||
        (product.style && product.style.toLowerCase().includes(searchLower)) ||
        // Search by Made By information
        (product.madeBy && product.madeBy.toLowerCase().includes(searchLower));
      
      // Check serial number search (if product has sequential serial)
      const serialNumber = serialNumberMap.get(product._id);
      const matchesSerialNumber = !searchTerm || (serialNumber && serialNumber.toLowerCase().includes(searchLower));
      
      // Check variant ID search (if product has variant ID)
      const variantId = productVariants.get(product._id);
      const matchesVariantId = !searchTerm || (variantId && variantId.toString().includes(searchLower));
      
      const matchesSearch = matchesStandardSearch || matchesSerialNumber || matchesVariantId;
      
      const matchesCategory = !filterCategory || product.categoryId === filterCategory;
      const matchesBrand = !filterBrand || product.brand === filterBrand;
      const matchesFabric = !filterFabric || product.fabric === filterFabric;
      const matchesColor = !filterColor || product.color === filterColor;
      const matchesOccasion = !filterOccasion || product.occasion === filterOccasion;

      return matchesSearch && matchesCategory && matchesBrand && matchesFabric && matchesColor && matchesOccasion;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a];
      let bValue: any = b[sortBy as keyof typeof b];
      
      if (aValue === undefined) aValue = "";
      if (bValue === undefined) bValue = "";
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [products, searchTerm, filterCategory, filterBrand, filterFabric, filterColor, filterOccasion, sortBy, sortOrder]);

  // Optimized callback functions
  const addVariant = useCallback(() => {
    setProductVariants(prev => [...prev, { id: `variant-${Date.now()}-${Math.random()}`, color: "", size: "", stock: 0 }]);
  }, []);

  const removeVariant = useCallback((index: number) => {
    setProductVariants(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  }, []);

  const updateVariant = useCallback((index: number, field: keyof ProductVariant, value: string | number) => {
    setProductVariants(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleAddProduct = useCallback(async () => {
    try {
      // Enhanced validation
      if (!newProduct.name?.trim()) {
        toast.error("Product name is required");
        return;
      }
      if (!newProduct.brand?.trim()) {
        toast.error("Brand name is required");
        return;
      }
      if (!newProduct.fabric?.trim()) {
        toast.error("Fabric selection is required");
        return;
      }
      // ✅ MANDATORY: Category is now always required
      if (!newProduct.categoryId) {
        toast.error("Category selection is required");
        return;
      }

      // Price validation
      if (newProduct.costPrice <= 0) {
        toast.error("Cost price must be greater than 0");
        return;
      }
      // ✅ OPTIONAL: Selling price can be 0 or empty, but if provided must be >= cost price
      if (newProduct.sellingPrice > 0 && newProduct.sellingPrice < newProduct.costPrice) {
        toast.error(`Selling price (৳${newProduct.sellingPrice}) cannot be less than cost price (৳${newProduct.costPrice})`);
        return;
      }

      // Auto-generate barcode if not provided
      let baseBarcode = newProduct.barcode?.trim();
      if (!baseBarcode) {
        // Auto-generate: Use brand initials + random numbers
        const brandInitials = newProduct.brand.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-4);
        baseBarcode = `${brandInitials}${timestamp}`;
      } else if (baseBarcode.length < 6) {
        toast.error("Barcode must be at least 6 characters long");
        return;
      } else if (!/^[A-Z0-9-]+$/.test(baseBarcode)) {
        // Auto-fix: Convert to uppercase and remove invalid characters
        baseBarcode = baseBarcode.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        if (baseBarcode.length < 6) {
          toast.error("Barcode must be at least 6 characters long");
          return;
        }
      }

      // Validate variants
      const validVariants = productVariants.filter(v => 
        v.color?.trim() && v.size?.trim() && typeof v.stock === 'number' && v.stock > 0
      );
      
      if (validVariants.length === 0) {
        toast.error("Please add at least one valid color/size/stock combination with stock quantity greater than 0");
        return;
      }

      // Check for duplicate variants
      const variantKeys = validVariants.map(v => `${v.color.trim()}-${v.size.trim()}`);
      const uniqueKeys = new Set(variantKeys);
      if (variantKeys.length !== uniqueKeys.size) {
        toast.error("Duplicate color/size combinations found. Please ensure each color/size combination is unique.");
        return;
      }

      // Additional variant validation
      for (const variant of validVariants) {
        if (!variant.color?.trim()) {
          toast.error("All variants must have a color selected");
          return;
        }
        if (!variant.size?.trim()) {
          toast.error("All variants must have a size selected");
          return;
        }
        if (typeof variant.stock !== 'number' || variant.stock <= 0) {
          toast.error("All variants must have a valid stock quantity (greater than 0)");
          return;
        }
      }

      // Create products for each variant
      const promises = validVariants.map((variant, index) => {
        // Generate unique product code and barcode for each variant
        const colorCode = variant.color.substring(0, 2).toUpperCase();
        const sizeCode = variant.size.replace('"', '');
        const variantCode = `${newProduct.productCode}-${colorCode}-${sizeCode}`;
        
        // Generate unique scannable barcode for each variant
        // Format: BASEBARCODE-COLORCODE-SIZECODE-VARIANTINDEX
        // Example: ABC1234-BL-52-01
        const variantIndex = String(index + 1).padStart(2, '0');
        const variantBarcode = `${baseBarcode}-${colorCode}-${sizeCode}-${variantIndex}`;
        
        // Ensure barcode is not too long (max 20 chars for most barcode scanners)
        const truncatedBarcode = variantBarcode.length > 20 
          ? `${baseBarcode.substring(0, 6)}-${colorCode}-${sizeCode}-${variantIndex}`
          : variantBarcode;

        return addProduct({
          name: `${newProduct.name} - ${variant.color} (${variant.size})`,
          brand: newProduct.brand,
          model: newProduct.model,
          categoryId: newProduct.categoryId ? newProduct.categoryId as any : undefined,
          style: newProduct.style,
          fabric: newProduct.fabric,
          color: variant.color,
          sizes: [variant.size],
          embellishments: newProduct.embellishments,
          occasion: newProduct.occasion,
          costPrice: newProduct.costPrice,
          sellingPrice: newProduct.sellingPrice,
          barcode: truncatedBarcode,
          productCode: variantCode,
          madeBy: newProduct.madeBy,
          pictureUrl: newProduct.pictureUrl,
          currentStock: variant.stock,
          minStockLevel: newProduct.minStockLevel,
          maxStockLevel: newProduct.maxStockLevel,
          description: newProduct.description,
          isActive: newProduct.isActive,
        });
      });

      await Promise.all(promises);

      toast.success(`Successfully added ${validVariants.length} product variant(s)!`);
      
      // Reset form
      setNewProduct({
        name: "",
        brand: "DUBAI BORKA HOUSE",
        model: "",
        categoryId: "",
        style: "Dubai Style",
        fabric: "",
        embellishments: "",
        occasion: "Party Wear",
        costPrice: 0,
        sellingPrice: 0,
        pictureUrl: "",
        barcode: "",
        productCode: "",
        madeBy: "U.A.E",
        minStockLevel: 0,
        maxStockLevel: 100,
        description: "",
        isActive: true,
      });
      setProductVariants([{ id: `variant-${Date.now()}`, color: "", size: "", stock: 0 }]);
      setShowAddProduct(false);
    } catch (error: any) {
      console.error("Detailed Error adding product:", {
        error,
        message: error?.message,
        errorData: error?.data,
        status: error?.status,
      });
      const errorMessage = error?.message || error?.data?.message || "Failed to add product variants";
      toast.error(errorMessage);
    }
  }, [newProduct, productVariants, addProduct]);

  const handleUpdateProduct = useCallback(async () => {
    if (!editingProduct) return;

    try {
      // Validation
      if (!editingProduct.name?.trim()) {
        toast.error("Product name is required");
        return;
      }
      if (!editingProduct.brand?.trim()) {
        toast.error("Brand name is required");
        return;
      }
      // ✅ MANDATORY: Validate Category is selected
      if (!editingProduct.categoryId) {
        toast.error("Category selection is required");
        return;
      }
      // ✅ MANDATORY: Validate Fabric is selected
      if (!editingProduct.fabric?.trim()) {
        toast.error("Fabric selection is required");
        return;
      }
      if (editingProduct.currentStock < 0) {
        toast.error("Stock cannot be negative");
        return;
      }

      const { _id, _creationTime, branchStock, currentStock, ...productData } = editingProduct;
      await updateProduct({
        id: _id,
        name: productData.name,
        brand: productData.brand,
        model: productData.model,
        categoryId: productData.categoryId,
        style: productData.style,
        fabric: productData.fabric,
        color: productData.color,
        sizes: productData.sizes,
        embellishments: productData.embellishments,
        occasion: productData.occasion,
        costPrice: productData.costPrice,
        sellingPrice: productData.sellingPrice,
        barcode: productData.barcode,
        productCode: productData.productCode,
        madeBy: productData.madeBy,
        stockLocation: productData.stockLocation,
        pictureUrl: productData.pictureUrl,
        minStockLevel: productData.minStockLevel,
        maxStockLevel: productData.maxStockLevel,
        description: productData.description,
        isActive: productData.isActive,
      });
      toast.success("Product updated successfully!");
      setEditingProduct(null);
    } catch (error: any) {
      console.error("Error updating product:", error);
      const errorMessage = error?.message || "Failed to update product";
      toast.error(errorMessage);
    }
  }, [editingProduct, updateProduct]);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;

    try {
      await deleteProduct({ id: productId as any });
      toast.success("Product deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting product:", error);
      const errorMessage = error?.message || "Failed to delete product";
      toast.error(errorMessage);
    }
  }, [deleteProduct]);

  const getStockStatus = useCallback((product: any) => {
    if (product.currentStock === 0) return { status: "Out of Stock", color: "text-red-600 bg-red-100" };
    if (product.currentStock <= product.minStockLevel) return { status: "Low Stock", color: "text-yellow-600 bg-yellow-100" };
    return { status: "In Stock", color: "text-green-600 bg-green-100" };
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setFilterCategory("");
    setFilterBrand("");
    setFilterFabric("");
    setFilterColor("");
    setFilterOccasion("");
    setSortBy("name");
    setSortOrder("asc");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-6 sm:py-8 md:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-black flex items-center gap-3">
                <span className="text-4xl sm:text-5xl">📦</span>
                Inventory Management
              </h1>
              <p className="mt-2 text-base sm:text-lg text-slate-900">
                Manage your product inventory and stock levels
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  setShowAddProduct(true);
                  // Reset variants when opening modal
                  setProductVariants([{ id: `variant-${Date.now()}`, color: "", size: "", stock: 0 }]);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                <span className="text-xl">➕</span>
                Add New Product
              </button>
              
              {/* ✅ FIX #16: CSV Batch Import Button */}
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.csv';
                  input.onchange = async (e: any) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        try {
                          const csv = event.target?.result as string;
                          const lines = csv.split('\n').filter(line => line.trim());
                          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                          
                          // Get first available category as default for CSV imports
                          const defaultCategory = categories.length > 0 ? categories[0]._id : null;
                          
                          let importedCount = 0;
                          for (let i = 1; i < lines.length; i++) {
                            const values = lines[i].split(',').map(v => v.trim());
                            const productData: any = {};
                            headers.forEach((header, idx) => {
                              productData[header] = values[idx] || '';
                            });
                            
                            if (!productData.name?.trim() || !productData.brand?.trim()) {
                              console.warn(`Row ${i}: Missing name or brand, skipping`);
                              continue;
                            }
                            
                            if (!defaultCategory) {
                              toast.error('No categories available. Please create a category first.');
                              return;
                            }
                            
                            try {
                              // ✅ Use provided categoryId or default to first category
                              const categoryId = productData.categoryid || defaultCategory;
                              
                              await createProduct({
                                name: productData.name.trim(),
                                brand: productData.brand.trim(),
                                categoryId: categoryId,
                                fabric: productData.fabric?.trim() || 'Jersey',
                                color: productData.color?.trim() || 'Black',
                                sizes: (productData.sizes || '').split(';').filter((s: string) => s?.trim()),
                                costPrice: Math.max(0, parseFloat(productData.costprice) || 100),
                                sellingPrice: Math.max(0, parseFloat(productData.sellingprice) || 0),
                                currentStock: Math.max(0, parseInt(productData.currentstock) || 0),
                                minStockLevel: Math.max(0, parseInt(productData.minstocklevel) || 0),
                                maxStockLevel: Math.max(1, parseInt(productData.maxstocklevel) || 100),
                                barcode: productData.barcode?.trim() || generateRandomPrefix(),
                                productCode: productData.productcode?.trim() || generateRandomPrefix(),
                                isActive: productData.isactive !== 'false',
                              });
                              importedCount++;
                            } catch (err: any) {
                              const errorMsg = err?.message || `Failed to import row ${i}`;
                              console.error(`Row ${i} error:`, err);
                              toast.error(`Row ${i}: ${errorMsg}`);
                            }
                          }
                          toast.success(`✅ Batch imported ${importedCount} products from CSV!`);
                        } catch (error) {
                          console.error('CSV import error:', error);
                          toast.error('Failed to import CSV. Check format and try again.');
                        }
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all duration-300 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-lg hover:shadow-xl whitespace-nowrap"
                title="Import products from CSV (columns: name, brand, fabric, color, sizes, costprice, sellingprice, currentstock)"
              >
                <span className="text-xl">📥</span>
                Import CSV
              </button>
            </div>
            
            <button
              onClick={async () => {
                try {
                  const result = await autoAssignBoxNumbers();
                  toast.success(`✅ ${result.productsAssigned} products assigned to ${result.groupsCreated} groups!\n\n${result.details}`);
                } catch (error: any) {
                  toast.error(error.message || "Failed to assign box numbers");
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl whitespace-nowrap"
              title="আপনার সকল পণ্যকে স্বয়ংক্রিয়ভাবে বক্স নম্বার এসাইন করুন"
            >
              <span className="text-xl">🎯</span>
              Auto-Assign Boxes
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <input
              type="text"
              placeholder="Search by name, code, barcode, style #, box #, color, size, fabric, occasion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-500 text-sm"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
          >
            <option value="">All Brands</option>
            {uniqueValues.brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          <select
            value={filterFabric}
            onChange={(e) => setFilterFabric(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
          >
            <option value="">All Fabrics</option>
            {uniqueValues.fabrics.map((fabric) => (
              <option key={fabric} value={fabric}>
                {fabric}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <select
            value={filterColor}
            onChange={(e) => setFilterColor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="">All Colors</option>
            {uniqueValues.colors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>

          <select
            value={filterOccasion}
            onChange={(e) => setFilterOccasion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="">All Occasions</option>
            {uniqueValues.occasions.map((occasion) => (
              <option key={occasion} value={occasion}>
                {occasion}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="name">Sort by Name</option>
            <option value="brand">Sort by Brand</option>
            <option value="currentStock">Sort by Stock</option>
            <option value="sellingPrice">Sort by Price</option>
            <option value="_creationTime">Sort by Date Added</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
          </button>

          <button
            onClick={clearAllFilters}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {/* Search Help Section */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <details className="cursor-pointer">
            <summary className="font-semibold text-blue-900 text-sm">
              💡 Search Tips & Examples
            </summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-blue-800">
              <div>
                <strong>Product Name:</strong> Search "Abaya" or "Dress"
              </div>
              <div>
                <strong>Brand:</strong> Search "Dubai Borka" or "DUBAI"
              </div>
              <div>
                <strong>Product Code:</strong> Search "ABC1234" or variant codes
              </div>
              <div>
                <strong>Barcode:</strong> Search "DBH-BL-52-01" or scan barcodes
              </div>
              <div>
                <strong>Style # (DBH-XXXX):</strong> Search "DBH-0001" or "DBH-0042"
              </div>
              <div>
                <strong>Box Number:</strong> Search "BOX-1", "BOX-2", etc.
              </div>
              <div>
                <strong>Color:</strong> Search "Black", "Blue", "Pink"
              </div>
              <div>
                <strong>Size:</strong> Search "52", "54", "56" inches
              </div>
              <div>
                <strong>Fabric:</strong> Search "Crepe", "Chiffon", "Jersey"
              </div>
              <div>
                <strong>Occasion:</strong> Search "Party Wear", "Wedding"
              </div>
              <div>
                <strong>Made By:</strong> Search "U.A.E", "Bangladesh"
              </div>
              <div>
                <strong>Embellishments:</strong> Search "Beaded", "Embroidered"
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredProducts.map((product) => {
          const category = categories.find(c => c._id === product.categoryId);
          const stockStatus = getStockStatus(product);
          
          return (
            <div key={product._id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {product.pictureUrl && (
                <img
                  src={product.pictureUrl}
                  alt={product.name}
                  className="w-full h-32 sm:h-40 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  loading="lazy"
                  onClick={() => setImageModalUrl(product.pictureUrl)}
                />
              )}
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">
                    {product.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                    {stockStatus.status}
                  </span>
                </div>
                
                <div className="space-y-1 text-xs text-gray-600">
                  <p><span className="font-medium">Brand:</span> {product.brand}</p>
                  {product.model && <p><span className="font-medium">Model:</span> {product.model}</p>}
                  <p><span className="font-medium">Category:</span> {category?.name || 'N/A'}</p>
                  {product.styleNumber && (
                    <p><span className="font-medium">Style #:</span> <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">{product.styleNumber}</span></p>
                  )}
                  <p><span className="font-medium">Fabric:</span> {product.fabric}</p>
                  <p><span className="font-medium">Color:</span> {product.color}</p>
                  {product.stockLocation && <p><span className="font-medium">📍 Box:</span> <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold">{product.stockLocation}</span></p>}
                  <p><span className="font-medium">Sizes:</span> {product.sizes.join(', ')}</p>
                  {product.style && <p><span className="font-medium">Style:</span> {product.style}</p>}
                  {product.occasion && <p><span className="font-medium">Occasion:</span> {product.occasion}</p>}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <p className="text-gray-600">Stock: <span className="font-semibold text-lg text-purple-600">{product.currentStock}</span></p>
                      {/* ✅ FIX #14: Show min/max levels */}
                      <p className="text-xs text-gray-500 mt-1">Min: {product.minStockLevel} | Max: {product.maxStockLevel}</p>
                      <p className="text-gray-600">Code: <span className="font-mono text-xs">{product.productCode}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600">Cost: ৳{product.costPrice}</p>
                      <p className="font-semibold text-purple-600">৳{product.sellingPrice}</p>
                    </div>
                  </div>
                  
                  {/* ✅ FIX #14: Alert when stock below minimum */}
                  {product.currentStock <= product.minStockLevel && product.currentStock > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      ⚠️ Low Stock Alert: {product.minStockLevel - product.currentStock} units below minimum
                    </div>
                  )}
                </div>

                {/* ✅ FIX #13: Quick Stock Update */}
                <div className="mt-3 flex gap-1">
                  <button
                    onClick={() => {
                      const newStock = product.currentStock + 1;
                      updateProduct({
                        ...product,
                        currentStock: newStock,
                      });
                    }}
                    className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 font-medium transition-colors"
                    title="Add 1 unit"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => {
                      const newStock = Math.max(0, product.currentStock - 1);
                      updateProduct({
                        ...product,
                        currentStock: newStock,
                      });
                    }}
                    className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 font-medium transition-colors"
                    title="Remove 1 unit"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No products found matching your criteria.</p>
        </div>
      )}

      {/* Image Modal with Zoom */}
      {imageModalUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" 
          onClick={() => {
            setImageModalUrl(null);
            setImageZoomLevel(1);
          }}
        >
          <div 
            className="max-w-4xl max-h-[90vh] relative flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setImageModalUrl(null);
                setImageZoomLevel(1);
              }}
              className="absolute top-2 right-2 bg-white rounded-full p-2 hover:bg-gray-200 transition-colors z-10"
            >
              ✕
            </button>

            {/* Zoom Controls */}
            <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded-lg p-2 flex items-center gap-2 z-10">
              <button
                onClick={() => setImageZoomLevel(prev => Math.max(0.5, prev - 0.2))}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium transition-colors"
                title="Zoom Out"
              >
                −
              </button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {Math.round(imageZoomLevel * 100)}%
              </span>
              <button
                onClick={() => setImageZoomLevel(prev => Math.min(3, prev + 0.2))}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium transition-colors"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => setImageZoomLevel(1)}
                className="px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded text-sm font-medium transition-colors"
                title="Reset Zoom"
              >
                Reset
              </button>
            </div>

            {/* Image Container with Scrollable Zoom */}
            <div 
              className="flex-1 overflow-auto flex items-center justify-center bg-black bg-opacity-50 rounded-lg"
              onWheel={(e) => {
                e.preventDefault();
                const newZoom = e.deltaY > 0 
                  ? Math.max(0.5, imageZoomLevel - 0.1)
                  : Math.min(3, imageZoomLevel + 0.1);
                setImageZoomLevel(newZoom);
              }}
            >
              <img
                src={imageModalUrl}
                alt="Product"
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{
                  transform: `scale(${imageZoomLevel})`,
                  transition: 'transform 0.2s ease-out',
                  cursor: imageZoomLevel > 1 ? 'grab' : 'auto'
                }}
              />
            </div>

            {/* Info Text */}
            <div className="text-center text-white text-xs mt-2 opacity-70">
              <p>Use +/− buttons or scroll wheel to zoom • Click outside to close</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl my-4 sm:my-8 shadow-2xl flex flex-col max-h-[95vh]">
            {/* Fixed Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center rounded-t-lg z-10">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex-1">Add New Product with Multiple Variants</h3>
              <button
                onClick={() => setShowAddProduct(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-4 text-xl sm:text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-6">
              <div className="space-y-6">
                {/* Validation Info Banner */}
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ℹ️ <strong>Tip:</strong> Each variant (color/size combination) will create a unique product. Fill in at least one variant to proceed.
                  </p>
                </div>

                {/* Basic Product Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">Basic Product Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                        placeholder="e.g., Elegant Evening Abaya"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={newProduct.categoryId}
                        onChange={(e) => setNewProduct({...newProduct, categoryId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fabric *
                      </label>
                      <select
                        value={newProduct.fabric}
                        onChange={(e) => setNewProduct({...newProduct, fabric: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                      >
                        <option value="">Select Fabric</option>
                        <option value="Crepe">Crepe</option>
                        <option value="Chiffon">Chiffon</option>
                        <option value="Georgette">Georgette</option>
                        <option value="Nida">Nida</option>
                        <option value="Jersey">Jersey</option>
                        <option value="Silk">Silk</option>
                        <option value="Cotton">Cotton</option>
                        <option value="Polyester">Polyester</option>
                        <option value="ZOOM">ZOOM</option>
                        <option value="CEY">CEY</option>
                        <option value="ORGANJA">ORGANJA</option>
                        <option value="POKA">POKA</option>
                        <option value="AROWA">AROWA</option>
                        <option value="TICTOC">TICTOC</option>
                        <option value="PRINT">PRINT</option>
                        <option value="BABLA">BABLA</option>
                        <option value="BELVET">BELVET</option>
                        <option value="LILEN">LILEN</option>
                        <option value="KASMIRI">KASMIRI</option>
                        <option value="FAKRU PRINT">FAKRU PRINT</option>
                        <option value="KORIYAN SIMAR">KORIYAN SIMAR</option>
                        <option value="JORI SHIPON">JORI SHIPON</option>
						<option value="BELVET">BELVET</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Style (Default: Dubai Style)
                      </label>
                      <select
                        value={newProduct.style}
                        onChange={(e) => setNewProduct({...newProduct, style: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                      >
                        <option value="Dubai Style">Dubai Style</option>
                        <option value="Traditional">Traditional</option>
                        <option value="Modern">Modern</option>
                        <option value="Saudi Style">Saudi Style</option>
                        <option value="Turkish Style">Turkish Style</option>
                        <option value="Moroccan Style">Moroccan Style</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Embellishments
                      </label>
                      <select
                        value={newProduct.embellishments}
                        onChange={(e) => setNewProduct({...newProduct, embellishments: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                      >
                        <option value="">Select Embellishments</option>
                        <option value="Plain">Plain</option>
                        <option value="Embroidered">Embroidered</option>
                        <option value="Beaded">Beaded</option>
                        <option value="Lace">Lace</option>
                        <option value="Sequined">Sequined</option>
                        <option value="Stone Work">Stone Work</option>
                        <option value="HAND WORK">HAND WORK</option>
                        <option value="ARI WORK">ARI WORK</option>
                        <option value="CREP Work">CREP Work</option>
                        <option value="BeadSton">BeadSton</option>
                        <option value="LaceSton">LaceSton</option>
                        <option value="EmbroStone">EmbroStone</option>
                        <option value="AriStone">AriStone</option>
                        <option value="HandSton">HandSton</option>
                        <option value="CrepStone">CrepStone</option>
                        <option value="SeqenStone">SeqenStone</option>
                        <option value="StoneFbody">StoneFbody</option>
                        <option value="StoneHbody">StoneHbody</option>
                        <option value="Stonehand">Stonehand</option>
                        <option value="StoneBack">StoneBack</option>
                        <option value="AriHbody">AriHbody</option>
                        <option value="AriFBoday">AriFBoday</option>
                        <option value="Arihand">Arihand</option>
                        <option value="AriFront">AriFront</option>
                        <option value="AriBack">AriBack</option>
                        <option value="EmbroFBody">EmbroFBody</option>
                        <option value="EmbroHbody">EmbroHbody</option>
                        <option value="EmbroHand">EmbroHand</option>
                        <option value="EmbroFront">EmbroFront</option>
						<option value="BelvetStone">BelvetStone</option>
						<option value="Belvet">Belvet</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Occasion (Default: Party Wear)
                      </label>
                      <select
                        value={newProduct.occasion}
                        onChange={(e) => setNewProduct({...newProduct, occasion: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                      >
                        <option value="Party Wear">Party Wear</option>
                        <option value="Daily Wear">Daily Wear</option>
                        <option value="Casual">Casual</option>
                        <option value="Formal">Formal</option>
                        <option value="Wedding">Wedding</option>
                        <option value="Eid Special">Eid Special</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Pricing and Codes */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">Pricing & Product Codes</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost Price (৳) *
                      </label>
                      <input
                        type="number"
                        value={newProduct.costPrice}
                        onChange={(e) => setNewProduct({...newProduct, costPrice: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Selling Price (৳)
                      </label>
                      <input
                        type="number"
                        value={newProduct.sellingPrice}
                        onChange={(e) => setNewProduct({...newProduct, sellingPrice: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                        min="0"
                        step="0.01"
                      />
                    </div>


                  </div>
                </div>

                {/* Product Variants */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Product Variants (Color, Size, Stock)</h4>
                    <button
                      onClick={addVariant}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition-colors"
                    >
                      + Add Variant
                    </button>
                  </div>

                  <div className="space-y-3">
                    {productVariants.map((variant, index) => (
                      <div key={variant.id} className="bg-white p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Variant {index + 1}</span>
                          {productVariants.length > 1 && (
                            <button
                              onClick={() => removeVariant(index)}
                              className="text-red-600 hover:text-red-800 text-sm transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Color *
                            </label>
                            <select
                              value={variant.color}
                              onChange={(e) => updateVariant(index, 'color', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 transition-all"
                            >
                              <option value="">Select Color</option>
                              {commonColors.map((color) => (
                                <option key={color} value={color}>
                                  {color}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Size *
                            </label>
                            <select
                              value={variant.size}
                              onChange={(e) => updateVariant(index, 'size', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 transition-all"
                            >
                              <option value="">Select Size</option>
                              {commonSizes.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Stock Quantity *
                            </label>
                            <input
                              type="number"
                              value={variant.stock}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                                updateVariant(index, 'stock', value);
                              }}
                              className={`w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-purple-500 transition-all ${
                                variant.stock > 0 ? 'border-gray-300' : 'border-red-300 bg-red-50'
                              }`}
                              min="1"
                              step="1"
                              placeholder="0"
                            />
                            {variant.stock <= 0 && (
                              <p className="text-xs text-red-600 mt-1">Stock must be greater than 0</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Each color/size combination will create a separate product entry with unique identification.
                      Product codes will be automatically generated as: {newProduct.productCode || 'PREFIX'}-{'{COLOR}'}-{'{SIZE}'}
                    </p>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">Additional Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Made By (Default: U.A.E)
                      </label>
                      <input
                        type="text"
                        value={newProduct.madeBy}
                        onChange={(e) => setNewProduct({...newProduct, madeBy: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                        placeholder="U.A.E"
                      />
                      <p className="text-xs text-gray-500 mt-1">Default: U.A.E</p>
                    </div>



                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Image
                      </label>
                      
                      {/* ✅ FIX #15: Image Upload with Compression */}
                      <div className="flex gap-2 mb-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImage(file);
                                setNewProduct({...newProduct, pictureUrl: compressed});
                                toast.success("Image compressed and ready!");
                              } catch (error) {
                                toast.error("Failed to compress image");
                                console.error(error);
                              }
                              e.target.value = ""; // Reset input
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                        <span className="text-xs text-gray-500 self-center">Or paste URL:</span>
                      </div>
                      
                      <input
                        type="url"
                        value={newProduct.pictureUrl}
                        onChange={(e) => setNewProduct({...newProduct, pictureUrl: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                        placeholder="https://example.com/image.jpg"
                      />
                      <p className="text-xs text-gray-500 mt-1">✅ Upload JPG/PNG (auto-compressed) or paste image URL</p>
                      {newProduct.pictureUrl && (
                        <div className="mt-2">
                          <img
                            src={newProduct.pictureUrl}
                            alt="Preview"
                            className="h-32 rounded-lg object-cover border border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '';
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                        rows={3}
                        placeholder="Product description..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer with Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6 rounded-b-lg">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddProduct}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors text-sm sm:text-base"
                >
                  Add Product Variants ({productVariants.filter(v => v.color?.trim() && v.size?.trim() && typeof v.stock === 'number' && v.stock > 0).length})
                </button>
                <button
                  onClick={() => {
                    setShowAddProduct(false);
                    // Reset variants when closing modal
                    setProductVariants([{ id: `variant-${Date.now()}`, color: "", size: "", stock: 0 }]);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal - Comprehensive */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl sm:max-w-4xl lg:max-w-5xl my-4 sm:my-8 shadow-2xl flex flex-col max-h-[95vh]">
            {/* Fixed Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center rounded-t-lg z-10">
              <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 flex-1 truncate">সম্পাদনা করুন - {editingProduct.name}</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl sm:text-2xl flex-shrink-0 ml-4"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-6">

            <div className="p-6 space-y-6">
              {/* Basic Product Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  মৌলিক তথ্য
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">পণ্যের নাম *</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ব্র্যান্ড *</label>
                    <input
                      type="text"
                      value={editingProduct.brand}
                      onChange={(e) => setEditingProduct({...editingProduct, brand: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">মডেল</label>
                    <input
                      type="text"
                      value={editingProduct.model || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, model: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">পণ্য কোড</label>
                    <input
                      type="text"
                      value={editingProduct.productCode || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, productCode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">বারকোড</label>
                    <input
                      type="text"
                      value={editingProduct.barcode || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, barcode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">স্টাইল নম্বর</label>
                    <input
                      type="text"
                      value={editingProduct.styleNumber || ""}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-purple-100 text-purple-800 font-bold cursor-not-allowed"
                      placeholder="DBH-XXXX"
                    />
                    <p className="text-xs text-gray-500 mt-1">স্বয়ংক্রিয়-বরাদ্দ: ক্যাটাগরি, ফেব্রিক, সজ্জা এবং মূল্যের উপর ভিত্তি করে</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📍 স্টক লোকেশন (BOX-1, BOX-2...)</label>
                    <input
                      type="text"
                      value={editingProduct.stockLocation || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, stockLocation: e.target.value})}
                      placeholder="BOX-1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">নির্মাতা</label>
                    <input
                      type="text"
                      value={editingProduct.madeBy || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, madeBy: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Product Specifications */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  পণ্যের বৈশিষ্ট্য
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ক্যাটাগরি *</label>
                    <select
                      value={editingProduct.categoryId || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, categoryId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ফ্যাব্রিক *</label>
                    <input
                      type="text"
                      value={editingProduct.fabric || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, fabric: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">রঙ *</label>
                    <input
                      type="text"
                      value={editingProduct.color || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, color: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">স্টাইল</label>
                    <input
                      type="text"
                      value={editingProduct.style || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, style: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">অনুষ্ঠান</label>
                    <input
                      type="text"
                      value={editingProduct.occasion || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, occasion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">সজ্জা</label>
                    <input
                      type="text"
                      value={editingProduct.embellishments || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, embellishments: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">সাইজসমূহ (কমা দ্বারা আলাদা)</label>
                    <input
                      type="text"
                      value={editingProduct.sizes ? editingProduct.sizes.join(", ") : ""}
                      onChange={(e) => setEditingProduct({...editingProduct, sizes: e.target.value.split(",").map(s => s.trim()).filter(s => s)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                      placeholder='52", 54", 56"'
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">বিবরণ</label>
                  <textarea
                    value={editingProduct.description || ""}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all h-24"
                    placeholder="পণ্যের বিস্তারিত বিবরণ..."
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">পণ্যের ছবি</label>
                  
                  {/* ✅ FIX #15: File upload with compression in edit form */}
                  <div className="flex gap-2 mb-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file);
                            setEditingProduct({...editingProduct, pictureUrl: compressed});
                            toast.success("Image compressed and updated!");
                          } catch (error) {
                            toast.error("Failed to compress image");
                            console.error(error);
                          }
                          e.target.value = ""; // Reset input
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    />
                    <span className="text-xs text-gray-500 self-center">Or paste URL:</span>
                  </div>
                  
                  <input
                    type="url"
                    value={editingProduct.pictureUrl || ""}
                    onChange={(e) => setEditingProduct({...editingProduct, pictureUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">✅ Upload JPG/PNG (auto-compressed) or paste URL</p>
                  {editingProduct.pictureUrl && (
                    <div className="mt-2">
                      <img
                        src={editingProduct.pictureUrl}
                        alt="Product"
                        className="h-32 w-32 object-cover rounded border border-gray-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                  মূল্য নির্ধারণ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">খরচ মূল্য (৳) *</label>
                    <input
                      type="number"
                      value={editingProduct.costPrice || 0}
                      onChange={(e) => setEditingProduct({...editingProduct, costPrice: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">বিক্রয় মূল্য (৳) *</label>
                    <input
                      type="number"
                      value={editingProduct.sellingPrice || 0}
                      onChange={(e) => setEditingProduct({...editingProduct, sellingPrice: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">লাভ/ক্ষতি (৳)</label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white flex items-center">
                      <span className={`font-semibold ${(editingProduct.sellingPrice || 0) - (editingProduct.costPrice || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {((editingProduct.sellingPrice || 0) - (editingProduct.costPrice || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">মার্জিন (%)</label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white flex items-center">
                      <span className={`font-semibold ${(editingProduct.costPrice || 0) > 0 ? ((((editingProduct.sellingPrice || 0) - (editingProduct.costPrice || 0)) / (editingProduct.costPrice || 0)) * 100) >= 0 ? 'text-green-600' : 'text-red-600' : 'text-gray-600'}`}>
                        {(editingProduct.costPrice || 0) > 0 ? ((((editingProduct.sellingPrice || 0) - (editingProduct.costPrice || 0)) / (editingProduct.costPrice || 0)) * 100).toFixed(2) : "0.00"}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Management */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                  মজুদ ব্যবস্থাপনা
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">বর্তমান মজুদ</label>
                    <input
                      type="number"
                      value={editingProduct.currentStock || 0}
                      onChange={(e) => setEditingProduct({...editingProduct, currentStock: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">✅ এখন সম্পাদনযোগ্য - শাখা জুড়ে মোট</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ন্যূনতম মজুদ স্তর</label>
                    <input
                      type="number"
                      value={editingProduct.minStockLevel || 0}
                      onChange={(e) => setEditingProduct({...editingProduct, minStockLevel: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      min="0"
                      step="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">সর্বোচ্চ মজুদ স্তর</label>
                    <input
                      type="number"
                      value={editingProduct.maxStockLevel || 0}
                      onChange={(e) => setEditingProduct({...editingProduct, maxStockLevel: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      min="1"
                      step="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">মজুদ অবস্থা</label>
                    <div className={`w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center font-medium ${getStockStatus(editingProduct).color}`}>
                      {getStockStatus(editingProduct).status}
                    </div>
                  </div>
                </div>

                {/* Branch-wise Stock */}
                {editingProduct.branchStock && editingProduct.branchStock.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">শাখা অনুযায়ী মজুদ:</label>
                    <div className="space-y-2">
                      {editingProduct.branchStock.map((branch: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                          <span className="font-medium text-gray-700">{branch.branchName}</span>
                          <div className="flex gap-4 items-center">
                            <span className="text-sm text-gray-600">স্টক: {branch.currentStock}</span>
                            <span className="text-sm text-gray-600">নূ: {branch.minStockLevel}</span>
                            <span className="text-sm text-gray-600">সর্ব: {branch.maxStockLevel}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status and Additional Settings */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">5</span>
                  অন্যান্য সেটিংস
                </h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingProduct.isActive}
                      onChange={(e) => setEditingProduct({...editingProduct, isActive: e.target.checked})}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      id="isActive"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                      সক্রিয় পণ্য
                    </label>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${editingProduct.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {editingProduct.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Fixed Footer with Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6 rounded-b-lg">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleUpdateProduct}
                  className="flex-1 px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <span>✓</span> পণ্য আপডেট করুন
                </button>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 px-4 py-2 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <span>✕</span> বাতিল করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
