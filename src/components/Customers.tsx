import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface Customer {
  _id: Id<"customers">;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  preferredStyle?: string;
  preferredSize?: string;
  preferredColors?: string[];
  totalPurchases: number;
  lastPurchaseDate?: number;
  loyaltyPoints?: number;
  notes?: string;
  isActive: boolean;
  _creationTime: number;
}

export default function Customers() {
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    preferredStyle: "",
    preferredSize: "",
    preferredColors: [] as string[],
    loyaltyPoints: 0,
    notes: "",
  });

  const customers = useQuery(api.customers.list, { 
    searchTerm: searchTerm || undefined 
  });
  
  const createCustomer = useMutation(api.customers.create);
  const updateCustomer = useMutation(api.customers.update);
  const deleteCustomer = useMutation(api.customers.remove);

  // Memoize constant arrays to prevent re-renders
  const abayaStyles = useMemo(() => ["Traditional", "Modern", "Dubai Style", "Saudi Style", "Kaftan", "Butterfly", "Umbrella"], []);
  const standardSizes = useMemo(() => ['50"', '52"', '54"', '56"', '58"', '60"', '62"'], []);
  const popularColors = useMemo(() => ["Black", "Navy Blue", "Maroon", "Brown", "Gray", "White", "Beige", "Green"], []);

  // Debounce search to reduce API calls
  useEffect(() => {
    if (customers && searchTerm) {
      // Only show notification on successful search
      const timer = setTimeout(() => {
        toast.success(`👥 Found ${customers.length} customer(s)`, { duration: 1500 });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [customers, searchTerm]);

  // Validation functions
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 2) {
          return "Customer name must be at least 2 characters long";
        }
        if (value.trim().length > 100) {
          return "Customer name cannot exceed 100 characters";
        }
        break;
      case 'email':
        if (value && value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            return "Please enter a valid email address";
          }
          // Check for duplicate email (excluding current customer when editing)
          if (customers) {
            const duplicate = customers.find(cust => 
              cust.email?.toLowerCase() === value.trim().toLowerCase() && 
              (!editingCustomer || cust._id !== editingCustomer._id)
            );
            if (duplicate) {
              return "A customer with this email already exists";
            }
          }
        }
        break;
      case 'phone':
        if (value && value.trim()) {
          const phoneRegex = /^[\+]?[0-9\-\(\)\s]{10,20}$/;
          if (!phoneRegex.test(value.trim())) {
            return "Please enter a valid phone number (10-20 digits)";
          }
          // Check for duplicate phone (excluding current customer when editing)
          if (customers) {
            const duplicate = customers.find(cust => 
              cust.phone === value.trim() && 
              (!editingCustomer || cust._id !== editingCustomer._id)
            );
            if (duplicate) {
              return "A customer with this phone number already exists";
            }
          }
        }
        break;
      case 'address':
        if (value && value.trim().length > 200) {
          return "Address cannot exceed 200 characters";
        }
        break;
      case 'city':
        if (value && value.trim().length > 50) {
          return "City name cannot exceed 50 characters";
        }
        break;
      case 'notes':
        if (value && value.trim().length > 500) {
          return "Notes cannot exceed 500 characters";
        }
        break;
    }
    return "";
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    errors.name = validateField('name', newCustomer.name);
    errors.email = validateField('email', newCustomer.email);
    errors.phone = validateField('phone', newCustomer.phone);
    errors.address = validateField('address', newCustomer.address);
    errors.city = validateField('city', newCustomer.city);
    errors.notes = validateField('notes', newCustomer.notes);

    // At least one contact method required
    if (!newCustomer.email?.trim() && !newCustomer.phone?.trim()) {
      errors.contact = "Either email or phone number is required";
    }

    // Remove empty errors
    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field: string, value: any) => {
    setNewCustomer(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear contact error if either email or phone is provided
    if ((field === 'email' || field === 'phone') && validationErrors.contact) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.contact;
        return newErrors;
      });
    }
    
    // Real-time validation
    const error = validateField(field, value);
    if (error) {
      setValidationErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleColorToggle = (color: string) => {
    const newColors = newCustomer.preferredColors.includes(color)
      ? newCustomer.preferredColors.filter(c => c !== color)
      : [...newCustomer.preferredColors, color];
    
    handleFieldChange('preferredColors', newColors);
    toast.success(`Color ${color} ${newColors.includes(color) ? 'added' : 'removed'} from preferences`);
  };

  const resetForm = () => {
    setNewCustomer({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      preferredStyle: "",
      preferredSize: "",
      preferredColors: [],
      loyaltyPoints: 0,
      notes: "",
    });
    setValidationErrors({});
    setEditingCustomer(null);
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
      if (editingCustomer) {
        await updateCustomer({
          id: editingCustomer._id,
          ...newCustomer,
          email: newCustomer.email?.trim() || undefined,
          phone: newCustomer.phone?.trim() || undefined,
          address: newCustomer.address.trim() || undefined,
          city: newCustomer.city.trim() || undefined,
          preferredStyle: newCustomer.preferredStyle || undefined,
          preferredSize: newCustomer.preferredSize || undefined,
          notes: newCustomer.notes.trim() || undefined,
        });
        toast.success(`✅ Customer "${newCustomer.name}" updated successfully!`);
        setEditingCustomer(null);
      } else {
        await createCustomer({
          ...newCustomer,
          email: newCustomer.email?.trim() || undefined,
          phone: newCustomer.phone?.trim() || undefined,
          address: newCustomer.address.trim() || undefined,
          city: newCustomer.city.trim() || undefined,
          preferredStyle: newCustomer.preferredStyle || undefined,
          preferredSize: newCustomer.preferredSize || undefined,
          notes: newCustomer.notes.trim() || undefined,
        });
        toast.success(`✅ Customer "${newCustomer.name}" added successfully!`);
      }
      
      resetForm();
      setShowAddCustomer(false);
    } catch (error: any) {
      console.error("Error saving customer:", error);
      toast.error(`❌ Failed to save customer: ${error.message || "Please try again"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    if (isSubmitting) {
      toast.warning("Please wait for the current operation to complete");
      return;
    }

    setNewCustomer({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      preferredStyle: customer.preferredStyle || "",
      preferredSize: customer.preferredSize || "",
      preferredColors: customer.preferredColors || [],
      loyaltyPoints: customer.loyaltyPoints || 0,
      notes: customer.notes || "",
    });
    setEditingCustomer(customer);
    setValidationErrors({});
    setShowAddCustomer(true);
    toast.info(`📝 Editing customer: ${customer.name}`);
  };

  const handleDelete = async (customerId: Id<"customers">) => {
    const customer = customers?.find(c => c._id === customerId);
    if (!customer) return;

    const confirmed = window.confirm(
      `⚠️ Are you sure you want to delete "${customer.name}"?\n\n` +
      "This action cannot be undone and will permanently remove:\n" +
      "• Customer information\n" +
      "• Purchase history\n" +
      "• Loyalty points\n" +
      "• All related data"
    );

    if (!confirmed) {
      toast.info("Delete operation cancelled");
      return;
    }

    try {
      await deleteCustomer({ id: customerId });
      toast.success(`✅ Customer "${customer.name}" deleted successfully!`);
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      if (error.message?.includes("sales")) {
        toast.error("❌ Cannot delete customer with existing sales records");
      } else {
        toast.error(`❌ Failed to delete customer: ${error.message || "Please try again"}`);
      }
    }
  };

  const handleCloseModal = () => {
    if (isSubmitting) {
      toast.warning("Please wait for the current operation to complete");
      return;
    }

    const hasChanges = newCustomer.name || newCustomer.email || newCustomer.phone;

    if (hasChanges && !editingCustomer) {
      const confirmed = window.confirm(
        "⚠️ You have unsaved changes.\n\nAre you sure you want to close without saving?"
      );
      if (!confirmed) {
        return;
      }
    }

    resetForm();
    setShowAddCustomer(false);
    toast.info("Form closed");
  };

  // Memoized filter and sort to prevent unnecessary recalculations
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    return customers
      .filter(customer => {
        const matchesFilter = filterBy === "all" ||
                             (filterBy === "active" && customer.isActive) ||
                             (filterBy === "inactive" && !customer.isActive) ||
                             (filterBy === "recent" && customer.lastPurchaseDate && 
                              Date.now() - customer.lastPurchaseDate < 30 * 24 * 60 * 60 * 1000);
        return matchesFilter;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "purchases":
            return b.totalPurchases - a.totalPurchases;
          case "recent":
            return (b.lastPurchaseDate || 0) - (a.lastPurchaseDate || 0);
          case "created":
            return b._creationTime - a._creationTime;
          default:
            return 0;
        }
      });
  }, [customers, filterBy, sortBy]);

  if (!customers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">👥 Customer Management</h2>
          <p className="text-sm text-white mt-1">
            Manage your customer relationships • {customers.length} customers
          </p>
        </div>
        <button
          onClick={() => {
            if (isSubmitting) {
              toast.warning("Please wait for the current operation to complete");
              return;
            }
            resetForm();
            setShowAddCustomer(true);
            toast.info("📝 Opening new customer form");
          }}
          disabled={isSubmitting}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add Customer
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter</label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="all">All Customers</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="recent">Recent Purchases</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="name">Name</option>
              <option value="purchases">Total Purchases</option>
              <option value="recent">Last Purchase</option>
              <option value="created">Date Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="text-lg sm:text-2xl font-bold text-gray-900">{customers?.length || 0}</div>
          <div className="text-xs sm:text-sm text-gray-600">Total Customers</div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="text-lg sm:text-2xl font-bold text-green-600">
            {customers?.filter(c => c.isActive).length || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="text-lg sm:text-2xl font-bold text-blue-600">
            {customers.filter(c => c.lastPurchaseDate && Date.now() - c.lastPurchaseDate < 30 * 24 * 60 * 60 * 1000).length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Recent Buyers</div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="text-lg sm:text-2xl font-bold text-purple-600">
            {Math.round(customers.reduce((sum, c) => sum + c.totalPurchases, 0) / customers.length) || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Avg Purchases</div>
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl sm:text-6xl">👥</span>
            <h3 className="text-lg font-medium text-gray-900 mt-4">No customers found</h3>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm || filterBy !== "all"
                ? "Try adjusting your search or filters"
                : "Add your first customer to get started"}
            </p>
            {!searchTerm && filterBy === "all" && (
              <button
                onClick={() => {
                  resetForm();
                  setShowAddCustomer(true);
                  toast.info("📝 Let's add your first customer!");
                }}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
              >
                Add First Customer
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchases
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-purple-600">
                              {customer.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {customer.city && `${customer.city} • `}
                              Member since {new Date(customer._creationTime).toLocaleDateString('en-BD')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {customer.email && (
                            <div className="flex items-center">
                              <span className="mr-1">📧</span>
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center text-xs text-gray-500">
                              <span className="mr-1">📱</span>
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.totalPurchases} orders
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer.loyaltyPoints || 0} points
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          customer.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.isActive ? '✅ Active' : '⏸️ Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(customer)}
                            disabled={isSubmitting}
                            className="text-xs text-purple-600 hover:text-purple-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(customer._id)}
                            disabled={isSubmitting}
                            className="text-xs text-red-600 hover:text-red-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3 p-4">
              {filteredCustomers.map((customer) => (
                <div key={customer._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-purple-600">
                          {customer.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{customer.name}</h3>
                        <p className="text-xs text-gray-500">{customer.totalPurchases} orders</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      customer.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.isActive ? '✅' : '⏸️'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    {customer.email && (
                      <p className="text-xs text-gray-600">📧 {customer.email}</p>
                    )}
                    {customer.phone && (
                      <p className="text-xs text-gray-600">📱 {customer.phone}</p>
                    )}
                    {customer.city && (
                      <p className="text-xs text-gray-600">📍 {customer.city}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {customer.loyaltyPoints || 0} points
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(customer)}
                        disabled={isSubmitting}
                        className="text-xs text-purple-600 hover:text-purple-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(customer._id)}
                        disabled={isSubmitting}
                        className="text-xs text-red-600 hover:text-red-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCustomer ? `📝 Edit Customer: ${editingCustomer.name}` : "➕ Add New Customer"}
                </h3>
                <button
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">📋 Basic Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCustomer.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                          validationErrors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Fatima Ahmed"
                        disabled={isSubmitting}
                      />
                      {validationErrors.name && (
                        <p className="text-xs text-red-600 mt-1">⚠️ {validationErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                          validationErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., fatima@example.com"
                        disabled={isSubmitting}
                      />
                      {validationErrors.email && (
                        <p className="text-xs text-red-600 mt-1">⚠️ {validationErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newCustomer.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                          validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., +880 1234 567890"
                        disabled={isSubmitting}
                      />
                      {validationErrors.phone && (
                        <p className="text-xs text-red-600 mt-1">⚠️ {validationErrors.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={newCustomer.city}
                        onChange={(e) => handleFieldChange('city', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                          validationErrors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Dhaka"
                        disabled={isSubmitting}
                      />
                      {validationErrors.city && (
                        <p className="text-xs text-red-600 mt-1">⚠️ {validationErrors.city}</p>
                      )}
                    </div>
                  </div>
                  {validationErrors.contact && (
                    <p className="text-xs text-red-600 mt-2">⚠️ {validationErrors.contact}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    rows={2}
                    value={newCustomer.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      validationErrors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Full address..."
                    disabled={isSubmitting}
                  />
                  {validationErrors.address && (
                    <p className="text-xs text-red-600 mt-1">⚠️ {validationErrors.address}</p>
                  )}
                </div>

                {/* Preferences */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">👗 Preferences</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Style
                      </label>
                      <select
                        value={newCustomer.preferredStyle}
                        onChange={(e) => handleFieldChange('preferredStyle', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        disabled={isSubmitting}
                      >
                        <option value="">Select Style</option>
                        {abayaStyles.map((style) => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Size
                      </label>
                      <select
                        value={newCustomer.preferredSize}
                        onChange={(e) => handleFieldChange('preferredSize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        disabled={isSubmitting}
                      >
                        <option value="">Select Size</option>
                        {standardSizes.map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Preferred Colors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Colors {newCustomer.preferredColors.length > 0 && `(${newCustomer.preferredColors.length} selected)`}
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {popularColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorToggle(color)}
                        disabled={isSubmitting}
                        className={`px-2 py-1 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          newCustomer.preferredColors.includes(color)
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={newCustomer.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      validationErrors.notes ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Additional notes about the customer..."
                    disabled={isSubmitting}
                  />
                  {validationErrors.notes && (
                    <p className="text-xs text-red-600 mt-1">⚠️ {validationErrors.notes}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {newCustomer.notes.length}/500 characters
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isSubmitting || Object.keys(validationErrors).length > 0}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingCustomer ? "Updating..." : "Adding..."}
                      </>
                    ) : (
                      <>
                        {editingCustomer ? "✅ Update Customer" : "➕ Add Customer"}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
