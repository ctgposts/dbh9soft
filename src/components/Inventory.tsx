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

// Function to generate random alphanumeric prefix with timestamp
const generateRandomPrefix = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${result}${timestamp}`;
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

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "",
    model: "",
    categoryId: "",
    style: "",
    fabric: "",
    embellishments: "",
    occasion: "",
    costPrice: 0,
    sellingPrice: 0,
    pictureUrl: "",
    barcode: "",
    productCode: "",
    madeBy: "",
    minStockLevel: 5,
    maxStockLevel: 100,
    description: "",
    isActive: true,
  });

  // Product variants state for multiple color/size/stock entries
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([
    { id: `variant-${Date.now()}`, color: "", size: "", stock: 0 }
  ]);

  const products = useQuery(api.products.list, {}) || [];
  const categories = useQuery(api.categories.list) || [];
  const addProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const deleteProduct = useMutation(api.products.remove);
  const addCategory = useMutation(api.categories.create);

  // Create a default category if none exist
  useEffect(() => {
    const createDefaultCategory = async () => {
      if (categories.length === 0) {
        try {
          await addCategory({
            name: "General",
            description: "Default category for products",
            color: "#9333EA"
          });
        } catch (error: any) {
          console.log("Default category may already exist or error:", error);
        }
      }
    };
    
    createDefaultCategory();
  }, [categories.length, addCategory]);

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
      
      // Check standard search fields
      const matchesStandardSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.productCode.toLowerCase().includes(searchLower) ||
        product.barcode.toLowerCase().includes(searchLower);
      
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
      // Category is now optional - if no categories exist, skip it
      if (categories.length > 0 && !newProduct.categoryId) {
        toast.error("Category selection is required");
        return;
      }

      // Price validation
      if (newProduct.costPrice < 0) {
        toast.error("Cost price cannot be negative");
        return;
      }
      if (newProduct.sellingPrice <= 0) {
        toast.error("Selling price must be greater than 0");
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
        brand: "",
        model: "",
        categoryId: "",
        style: "",
        fabric: "",
        embellishments: "",
        occasion: "",
        costPrice: 0,
        sellingPrice: 0,
        pictureUrl: "",
        barcode: "",
        productCode: "",
        madeBy: "",
        minStockLevel: 5,
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
      if (editingProduct.sellingPrice <= 0) {
        toast.error("Selling price must be greater than 0");
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
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <input
              type="text"
              placeholder="Search by product name, code, serial number, or variant ID..."
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
                  className="w-full h-32 sm:h-40 object-cover"
                  loading="lazy"
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
                  <p><span className="font-medium">Fabric:</span> {product.fabric}</p>
                  <p><span className="font-medium">Color:</span> {product.color}</p>
                  <p><span className="font-medium">Sizes:</span> {product.sizes.join(', ')}</p>
                  {product.style && <p><span className="font-medium">Style:</span> {product.style}</p>}
                  {product.occasion && <p><span className="font-medium">Occasion:</span> {product.occasion}</p>}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <p className="text-gray-600">Stock: <span className="font-semibold">{product.currentStock}</span></p>
                      <p className="text-gray-600">Code: <span className="font-mono text-xs">{product.productCode}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600">Cost: ৳{product.costPrice}</p>
                      <p className="font-semibold text-purple-600">৳{product.sellingPrice}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    className="flex-1 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors"
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

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Add New Product with Multiple Variants</h3>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

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
                        Brand *
                      </label>
                      <input
                        type="text"
                        value={newProduct.brand}
                        onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                        placeholder="e.g., DUBAI BORKA HOUSE"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Model *
                      </label>
                      <input
                        type="text"
                        value={newProduct.model}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        placeholder="Auto-generated"
                      />
                      <p className="text-xs text-gray-500 mt-1">Auto-generated sequential model number</p>
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
                        <option value="LILEN">LILEN</option>
                        <option value="KASMIRI">KASMIRI</option>
                        <option value="FAKRU PRINT">FAKRU PRINT</option>
                        <option value="KORIYAN SIMAR">KORIYAN SIMAR</option>
                        <option value="JORI SHIPON">JORI SHIPON</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Style
                      </label>
                      <select
                        value={newProduct.style}
                        onChange={(e) => setNewProduct({...newProduct, style: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                      >
                        <option value="">Select Style</option>
                        <option value="Traditional">Traditional</option>
                        <option value="Modern">Modern</option>
                        <option value="Dubai Style">Dubai Style</option>
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
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Occasion
                      </label>
                      <select
                        value={newProduct.occasion}
                        onChange={(e) => setNewProduct({...newProduct, occasion: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                      >
                        <option value="">Select Occasion</option>
                        <option value="Daily Wear">Daily Wear</option>
                        <option value="Casual">Casual</option>
                        <option value="Formal">Formal</option>
                        <option value="Party Wear">Party Wear</option>
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
                        Selling Price (৳) *
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Code Prefix *
                      </label>
                      <input
                        type="text"
                        value={newProduct.productCode}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        placeholder="Auto-generated"
                      />
                      <p className="text-xs text-gray-500 mt-1">Auto-generated random alphanumeric prefix</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Barcode Prefix (Optional)
                      </label>
                      <input
                        type="text"
                        value={newProduct.barcode}
                        onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                        placeholder="Leave empty for auto-generation (will use brand initials + timestamp)"
                      />
                      <p className="text-xs text-gray-500 mt-1">If provided, must be 6+ characters. Auto-generated if empty.</p>
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
                        Made By
                      </label>
                      <input
                        type="text"
                        value={newProduct.madeBy}
                        onChange={(e) => setNewProduct({...newProduct, madeBy: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                        placeholder="Manufacturer name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Stock Level
                      </label>
                      <input
                        type="number"
                        value={newProduct.minStockLevel}
                        onChange={(e) => setNewProduct({...newProduct, minStockLevel: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Stock Level
                      </label>
                      <input
                        type="number"
                        value={newProduct.maxStockLevel}
                        onChange={(e) => setNewProduct({...newProduct, maxStockLevel: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                        min="0"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Picture URL
                      </label>
                      <input
                        type="url"
                        value={newProduct.pictureUrl}
                        onChange={(e) => setNewProduct({...newProduct, pictureUrl: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                        placeholder="https://example.com/image.jpg"
                      />
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

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleAddProduct}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                  >
                    Add Product Variants ({productVariants.filter(v => v.color?.trim() && v.size?.trim() && typeof v.stock === 'number' && v.stock > 0).length})
                  </button>
                  <button
                    onClick={() => {
                      setShowAddProduct(false);
                      // Reset variants when closing modal
                      setProductVariants([{ id: `variant-${Date.now()}`, color: "", size: "", stock: 0 }]);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal - Comprehensive */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">সম্পাদনা করুন - {editingProduct.name}</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
              >
                ✕
              </button>
            </div>

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
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">(শাখা জুড়ে মোট)</p>
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

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleUpdateProduct}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <span>✓</span> পণ্য আপডেট করুন
                </button>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors flex items-center justify-center gap-2"
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
