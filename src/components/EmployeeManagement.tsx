import { useState, useCallback, useMemo, memo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

export default function EmployeeManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Id<"employees"> | null>(null);
  const [filterBranch, setFilterBranch] = useState<Id<"branches"> | "all">("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");

  const employees = useQuery(api.employees.list, {
    branchId: filterBranch !== "all" ? filterBranch : undefined,
    position: filterPosition !== "all" ? filterPosition : undefined,
  });
  const branches = useQuery(api.branches.list, {});

  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    position: "Cashier",
    branchId: "" as Id<"branches">,
    salary: 0,
    commissionRate: 0,
    permissions: [] as string[],
    address: "",
    emergencyContact: {
      name: "",
      phone: "",
      relation: "",
    },
  });

  const createEmployee = useMutation(api.employees.create);
  const updateEmployee = useMutation(api.employees.update);
  const removeEmployee = useMutation(api.employees.remove);

  // Memoize constant arrays
  const positions = useMemo(() => ["Manager", "Cashier", "Sales Associate", "Stock Keeper"], []);
  const permissionsList = useMemo(() => ["pos", "inventory", "reports", "customers", "settings"], []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (showEditModal && selectedEmployee) {
        const employee = employees?.find(e => e._id === selectedEmployee);
        await updateEmployee({
          id: selectedEmployee,
          ...formData,
          isActive: employee?.isActive ?? true,
        });
        toast.success("Employee updated successfully!");
      } else {
        await createEmployee(formData);
        toast.success("Employee added successfully!");
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to save employee");
    }
  }, [showEditModal, selectedEmployee, employees, formData, updateEmployee, createEmployee]);

  const handleEdit = useCallback((employeeId: Id<"employees">) => {
    const employee = employees?.find(e => e._id === employeeId);
    if (employee) {
      setFormData({
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email || "",
        phone: employee.phone,
        position: employee.position,
        branchId: employee.branchId,
        salary: employee.salary || 0,
        commissionRate: employee.commissionRate || 0,
        permissions: employee.permissions,
        address: employee.address || "",
        emergencyContact: employee.emergencyContact || { name: "", phone: "", relation: "" },
      });
      setSelectedEmployee(employeeId);
      setShowEditModal(true);
    }
  }, [employees]);

  const handleDelete = useCallback(async (employeeId: Id<"employees">) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      try {
        await removeEmployee({ id: employeeId });
        toast.success("Employee deleted successfully!");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete employee");
      }
    }
  }, [removeEmployee]);

  const resetForm = useCallback(() => {
    setFormData({
      employeeId: "",
      name: "",
      email: "",
      phone: "",
      position: "Cashier",
      branchId: "" as Id<"branches">,
      salary: 0,
      commissionRate: 0,
      permissions: [],
      address: "",
      emergencyContact: { name: "", phone: "", relation: "" },
    });
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedEmployee(null);
  }, []);

  const togglePermission = useCallback((permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage team members and permissions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 sm:w-auto w-full text-sm sm:text-base"
          >
            + Add Employee
          </button>
        </div>

        {/* Filters - iOS Style */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Filter by Branch
            </label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value as any)}
              className="input-field"
            >
              <option value="all">All Branches</option>
              {branches?.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Filter by Position
            </label>
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="input-field"
            >
              <option value="all">All Positions</option>
              {positions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Employees List - Desktop Table */}
      <div className="hidden md:block bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees?.map((employee) => (
                <tr key={employee._id} className="hover:bg-gray-50/50 transition-colors duration-200">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {employee.employeeId}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{employee.name}</div>
                    <div className="text-xs text-gray-500">{employee.email}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                    {employee.position}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {employee.branchName}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {employee.phone}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${employee.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(employee._id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(employee._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employees List - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {employees?.map((employee) => (
          <div key={employee._id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-4 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="text-sm font-bold text-gray-900">{employee.name}</div>
                <div className="text-xs text-gray-500">{employee.email}</div>
              </div>
              <span className={`badge ${employee.isActive ? 'badge-success' : 'badge-danger'}`}>
                {employee.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="font-semibold text-gray-900">{employee.employeeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Position:</span>
                <span className="font-semibold text-gray-900">{employee.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Branch:</span>
                <span className="font-semibold text-gray-900">{employee.branchName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-semibold text-gray-900">{employee.phone}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => handleEdit(employee._id)}
                className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDelete(employee._id)}
                className="flex-1 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-3xl">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                {showEditModal ? "Edit Employee" : "Add New Employee"}
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Employee ID *
                    </label>
                    <input
                      type="text"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Position *
                    </label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="input-field"
                      required
                    >
                      {positions.map((position) => (
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Branch *
                    </label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value as Id<"branches"> })}
                      className="input-field"
                      required
                    >
                      <option value="">Select Branch</option>
                      {branches?.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Salary (BDT)
                    </label>
                    <input
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) })}
                      className="input-field"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                      className="input-field"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    {permissionsList.map((permission) => (
                      <label key={permission} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                          className="rounded w-4 h-4"
                        />
                        <span className="capitalize">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm sm:text-base mb-3">Emergency Contact</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContact.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                        })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencyContact.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                        })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Relation
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContact.relation}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, relation: e.target.value }
                        })}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary order-1 sm:order-2">
                    {showEditModal ? "Update" : "Add"} Employee
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
