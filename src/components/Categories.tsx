import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface Category {
  _id: Id<"categories">;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  _creationTime: number;
}

export default function Categories() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#8B5CF6"
  });

  const categories = useQuery(api.categories.list);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const deleteCategory = useMutation(api.categories.remove);

  const predefinedColors = [
    { color: "#8B5CF6", name: "Purple" },
    { color: "#EF4444", name: "Red" },
    { color: "#10B981", name: "Green" },
    { color: "#F59E0B", name: "Amber" },
    { color: "#3B82F6", name: "Blue" },
    { color: "#8B5A2B", name: "Brown" },
    { color: "#EC4899", name: "Pink" },
    { color: "#6366F1", name: "Indigo" },
    { color: "#84CC16", name: "Lime" },
    { color: "#F97316", name: "Orange" }
  ];

  // Welcome notification
  useEffect(() => {
    if (categories) {
      toast.success(`📂 Categories loaded: ${categories.length} total`, {
        duration: 2000,
      });
    }
  }, [categories]);

  // Validation functions
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 2) {
          return "Category name must be at least 2 characters long";
        }
        if (value.trim().length > 50) {
          return "Category name cannot exceed 50 characters";
        }
        // Check for duplicate names (excluding current category when editing)
        if (categories) {
          const duplicate = categories.find(cat => 
            cat.name.toLowerCase() === value.trim().toLowerCase() && 
            (!editingCategory || cat._id !== editingCategory._id)
          );
          if (duplicate) {
            return "A category with this name already exists";
          }
        }
        break;
      case 'description':
        if (value && value.trim().length > 200) {
          return "Description cannot exceed 200 characters";
        }
        break;
      case 'color':
        if (!value || !value.match(/^#[0-9A-F]{6}$/i)) {
          return "Please select a valid color";
        }
        break;
    }
    return "";
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    errors.name = validateField('name', formData.name);
    errors.description = validateField('description', formData.description);
    errors.color = validateField('color', formData.color);

    // Remove empty errors
    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Real-time validation
    const error = validateField(field, value);
    if (error) {
      setValidationErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      toast.warning("Please wait, processing your request...");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCategory) {
        await updateCategory({
          id: editingCategory._id,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          color: formData.color,
        });
        toast.success(`✅ Category "${formData.name}" updated successfully!`);
        setEditingCategory(null);
      } else {
        await createCategory({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          color: formData.color,
        });
        toast.success(`✅ Category "${formData.name}" created successfully!`);
        setShowAddForm(false);
      }
      
      setFormData({ name: "", description: "", color: "#8B5CF6" });
      setValidationErrors({});
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast.error(`❌ Failed to save category: ${error.message || "Please try again"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    if (isSubmitting) {
      toast.warning("Please wait for the current operation to complete");
      return;
    }

    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color,
    });
    setValidationErrors({});
    setShowAddForm(true);
    toast.info(`📝 Editing category: ${category.name}`);
  };

  const handleDelete = async (categoryId: Id<"categories">) => {
    const category = categories?.find(c => c._id === categoryId);
    if (!category) return;

    const confirmed = window.confirm(
      `⚠️ Are you sure you want to delete "${category.name}"?\n\n` +
      "This action cannot be undone and may affect:\n" +
      "• Products in this category\n" +
      "• Sales reports\n" +
      "• Category statistics\n\n" +
      "Products will be moved to 'Uncategorized'."
    );

    if (!confirmed) {
      toast.info("Delete operation cancelled");
      return;
    }

    try {
      await deleteCategory({ id: categoryId });
      toast.success(`✅ Category "${category.name}" deleted successfully!`);
    } catch (error: any) {
      console.error("Error deleting category:", error);
      if (error.message?.includes("products")) {
        toast.error("❌ Cannot delete category with existing products");
      } else {
        toast.error(`❌ Failed to delete category: ${error.message || "Please try again"}`);
      }
    }
  };

  const handleCancel = () => {
    if (isSubmitting) {
      toast.warning("Please wait for the current operation to complete");
      return;
    }

    const hasChanges = formData.name || formData.description || formData.color !== "#8B5CF6";

    if (hasChanges && !editingCategory) {
      const confirmed = window.confirm(
        "⚠️ You have unsaved changes.\n\nAre you sure you want to cancel?"
      );
      if (!confirmed) {
        return;
      }
    }

    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "", color: "#8B5CF6" });
    setValidationErrors({});
    toast.info("Form cancelled");
  };

  const handleColorSelect = (color: string) => {
    handleFieldChange('color', color);
    toast.success(`🎨 Color selected: ${predefinedColors.find(c => c.color === color)?.name || 'Custom'}`);
  };

  if (!categories) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-600 mt-1">
              Organize your products • {categories.length} categories
            </p>
          </div>
          <button
            onClick={() => {
              if (isSubmitting) {
                toast.warning("Please wait for the current operation to complete");
                return;
              }
              setShowAddForm(true);
              toast.info("📝 Opening new category form");
            }}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 sm:w-auto w-full disabled:opacity-50"
          >
            + Add Category
          </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 p-6 animate-in slide-in-from-top-2">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {editingCategory ? `📝 Edit Category: ${editingCategory.name}` : "➕ Add New Category"}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={`input-field ${
                    validationErrors.name ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="e.g., Abayas, Hijabs, Accessories"
                  disabled={isSubmitting}
                  required
                />
                {validationErrors.name && (
                  <p className="text-xs text-red-600 mt-1">⚠️ {validationErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Category Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleFieldChange('color', e.target.value)}
                    className="w-12 h-12 border border-gray-200 rounded-2xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  />
                  <div className="flex flex-wrap gap-1">
                    {predefinedColors.map((colorOption) => (
                      <button
                        key={colorOption.color}
                        type="button"
                        onClick={() => handleColorSelect(colorOption.color)}
                        disabled={isSubmitting}
                        className={`w-8 h-8 rounded-full border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          formData.color === colorOption.color 
                            ? 'border-gray-800 scale-110' 
                            : 'border-gray-300 hover:border-gray-500'
                        }`}
                        style={{ backgroundColor: colorOption.color }}
                        title={colorOption.name}
                      />
                    ))}
                  </div>
                </div>
                {validationErrors.color && (
                  <p className="text-xs text-red-600 mt-1">⚠️ {validationErrors.color}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className={`w-full px-4 py-3 border rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all duration-300 ${
                  validationErrors.description ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Optional description for this category..."
                rows={3}
                disabled={isSubmitting}
              />
              {validationErrors.description && (
                <p className="text-xs text-red-600 mt-1">⚠️ {validationErrors.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/200 characters
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting || Object.keys(validationErrors).length > 0}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingCategory ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    {editingCategory ? "✅ Update Category" : "➕ Create Category"}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Categories Grid */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60">
        {categories.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl sm:text-7xl">📂</span>
            <h3 className="text-xl font-bold text-gray-900 mt-6">No categories yet</h3>
            <p className="text-sm text-gray-600 mt-3">
              Create your first category to organize your products
            </p>
            <button
              onClick={() => {
                setShowAddForm(true);
                toast.info("📝 Let's create your first category!");
              }}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-2xl font-semibold transition-all duration-300"
            >
              Create First Category
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 hover:shadow-md hover:bg-white/80 transition-all duration-300 group border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: category.color }}
                      />
                      <h3 className="font-semibold text-gray-900 truncate text-sm">
                        {category.name}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(category)}
                        disabled={isSubmitting}
                        className="text-xs text-purple-600 hover:text-purple-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Edit
                      </button>
                      <span className="text-gray-300">•</span>
                      <button
                        onClick={() => handleDelete(category._id)}
                        disabled={isSubmitting}
                        className="text-xs text-red-600 hover:text-red-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {category.description && (
                    <p className="text-xs text-gray-600 mb-4 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Created: {new Date(category._creationTime).toLocaleDateString('en-BD')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {category.isActive ? '✅ Active' : '⏸️ Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Statistics */}
      {categories.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Category Statistics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
              <p className="text-xs text-gray-600">Total Categories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {categories.filter(c => c.isActive).length}
              </p>
              <p className="text-xs text-gray-600">Active Categories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {categories.filter(c => c.description).length}
              </p>
              <p className="text-xs text-gray-600">With Descriptions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {new Set(categories.map(c => c.color)).size}
              </p>
              <p className="text-xs text-gray-600">Unique Colors</p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
