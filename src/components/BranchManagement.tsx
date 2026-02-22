import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface Branch {
  _id: Id<"branches">;
  name: string;
  code: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  managerId?: Id<"employees">;
  managerName?: string;
  isActive: boolean;
  settings?: {
    allowNegativeStock: boolean;
    autoReorderLevel: number;
    taxRate: number;
    currency: string;
  };
  _creationTime: number;
}

export function BranchManagement() {
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const [newBranch, setNewBranch] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    managerId: "",
    managerName: "",
  });

  const branches = useQuery(api.branches.list, {}) || [];
  const employees = useQuery(api.employees.list, {}) || [];
  const branchStats = useQuery(api.branches.getStats, 
    selectedBranch ? { branchId: selectedBranch as unknown as Id<"branches"> } : {}
  ) || {};
  
  const createBranch = useMutation(api.branches.create);
  const updateBranch = useMutation(api.branches.update);
  const deleteBranch = useMutation(api.branches.remove);

  const resetForm = () => {
    setNewBranch({
      name: "",
      code: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      managerId: "",
      managerName: "",
    });
    setEditingBranch(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBranch) {
        await updateBranch({
          id: editingBranch._id,
          name: newBranch.name,
          code: newBranch.code,
          address: newBranch.address,
          city: newBranch.city,
          phone: newBranch.phone || undefined,
          email: newBranch.email || undefined,
          managerId: newBranch.managerId ? newBranch.managerId as Id<"employees"> : undefined,
          managerName: newBranch.managerName || undefined,
          isActive: true,
        });
        toast.success("Branch updated successfully!");
      } else {
        await createBranch({
          name: newBranch.name,
          code: newBranch.code,
          address: newBranch.address,
          city: newBranch.city,
          phone: newBranch.phone || undefined,
          email: newBranch.email || undefined,
          managerId: newBranch.managerId ? newBranch.managerId as Id<"employees"> : undefined,
          managerName: newBranch.managerName || undefined,
        });
        toast.success("Branch created successfully!");
      }
      
      resetForm();
      setShowAddBranch(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save branch");
    }
  };

  const handleEdit = (branch: Branch) => {
    setNewBranch({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      city: branch.city,
      phone: branch.phone || "",
      email: branch.email || "",
      managerId: branch.managerId || "",
      managerName: branch.managerName || "",
    });
    setEditingBranch(branch);
    setShowAddBranch(true);
  };

  const handleDelete = async (branchId: Id<"branches">) => {
    const branch = branches?.find(b => b._id === branchId);
    if (!branch) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${branch.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteBranch({ id: branchId });
      toast.success("Branch deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete branch");
    }
  };

  if (!branches) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">🏢 Branch Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage multiple locations and showrooms</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddBranch(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 sm:w-auto w-full"
        >
          + Add Branch
        </button>
      </div>

      {/* Stats Overview */}
      {branchStats && Object.keys(branchStats).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 p-5 hover:shadow-md transition-all duration-300">
            <div className="text-2xl font-bold text-blue-700">
              {selectedBranch ? (branchStats as any).totalSales || 0 : (branchStats as any).totalBranches || 0}
            </div>
            <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide mt-2">
              {selectedBranch ? "Total Sales" : "Active Branches"}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 p-5 hover:shadow-md transition-all duration-300">
            <div className="text-2xl font-bold text-green-700">
              ৳{((branchStats as any).totalRevenue || 0).toLocaleString('en-BD')}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-2xl font-bold text-purple-700">
              {(branchStats as any).totalEmployees || 0}
            </div>
            <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide mt-2">Employees</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-2xl font-bold text-orange-700">
              {(branchStats as any).totalProducts || 0}
            </div>
            <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide mt-2">Products</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-2xl font-bold text-red-700">
              {(branchStats as any).lowStockProducts || 0}
            </div>
            <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide mt-2">Low Stock</div>
          </div>
        </div>
      )}

      {/* Branch Filter */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <label className="block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          View Branch Statistics
        </label>
        <select
          value={selectedBranch || ""}
          onChange={(e) => setSelectedBranch(e.target.value || null)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Branches Overview</option>
          {branches.map((branch) => (
            <option key={branch._id} value={branch._id as unknown as string}>
              {branch.name} ({branch.code})
            </option>
          ))}
        </select>
      </div>

      {/* Branches List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60">
        {branches.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-6xl">🏢</span>
            <h3 className="text-xl font-bold text-gray-900 mt-6">No branches found</h3>
            <p className="text-gray-600 mt-2">Add your first branch to get started</p>
            <button
              onClick={() => {
                resetForm();
                setShowAddBranch(true);
              }}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-2xl font-semibold transition-all duration-300"
            >
              Add First Branch
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
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
                {branches.map((branch) => (
                  <tr key={branch._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {branch.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Code: {branch.code}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{branch.address}</div>
                      <div className="text-sm text-gray-500">{branch.city}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {branch.managerName || "Not assigned"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {branch.phone && (
                          <div>📱 {branch.phone}</div>
                        )}
                        {branch.email && (
                          <div>📧 {branch.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        branch.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {branch.isActive ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(branch)}
                          className="text-purple-600 hover:text-purple-900 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(branch._id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
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
        )}
      </div>
      {/* Add/Edit Branch Modal */}
      {showAddBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl w-full max-w-2xl max-h-screen overflow-y-auto border border-white/60">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingBranch ? "📝 Edit Branch" : "➕ Add New Branch"}
                </h3>
                <button
                  onClick={() => setShowAddBranch(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Branch Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newBranch.name}
                      onChange={(e) => setNewBranch({...newBranch, name: e.target.value})}
                      className="input-field"
                      placeholder="e.g., Main Showroom"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Branch Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={newBranch.code}
                      onChange={(e) => setNewBranch({...newBranch, code: e.target.value.toUpperCase()})}
                      className="input-field"
                      placeholder="e.g., MAIN01"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={newBranch.city}
                      onChange={(e) => setNewBranch({...newBranch, city: e.target.value})}
                      className="input-field"
                      placeholder="e.g., Dhaka"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newBranch.phone}
                      onChange={(e) => setNewBranch({...newBranch, phone: e.target.value})}
                      className="input-field"
                      placeholder="e.g., +880 1234 567890"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newBranch.email}
                      onChange={(e) => setNewBranch({...newBranch, email: e.target.value})}
                      className="input-field"
                      placeholder="e.g., main@abayastore.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Manager
                    </label>
                    <select
                      value={newBranch.managerId}
                      onChange={(e) => {
                        const selectedEmployee = employees?.find(emp => emp._id === (e.target.value as Id<"employees">));
                        setNewBranch({
                          ...newBranch, 
                          managerId: e.target.value,
                          managerName: selectedEmployee?.name || ""
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select Manager</option>
                      {employees?.filter(emp => {
                        const pos = emp.position?.toLowerCase().trim() || "";
                        return pos === "manager" || pos === "branch manager";
                      }).map((employee) => (
                        <option key={employee._id} value={employee._id}>
                          {employee.name} ({employee.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newBranch.address}
                    onChange={(e) => setNewBranch({...newBranch, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Full address of the branch"
                  />
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {editingBranch ? "Update Branch" : "Add Branch"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddBranch(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
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
    </div>
  );
}
