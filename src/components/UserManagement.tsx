import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import {
  Users,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Lock,
  Unlock,
  LogOut,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
} from "lucide-react";

interface User {
  _id: Id<"userManagement">;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  roleName: string;
  roleId: Id<"userRoles">;
  branchName?: string;
  designation?: string;
  status: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  lastLogin?: number;
  joinDate: number;
}

interface Role {
  _id: Id<"userRoles">;
  roleName: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("users"); // users, roles, activity, sessions
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Add User Form
  const [showAddUser, setShowAddUser] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    userId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    roleId: "",
    roleName: "",
    branchId: "",
    branchName: "",
    department: "",
    designation: "",
    isSuperAdmin: false,
    isAdmin: false,
  });

  // Add Role Form
  const [showAddRole, setShowAddRole] = useState(false);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [newRole, setNewRole] = useState({
    roleName: "",
    description: "",
    permissions: [] as string[],
  });

  // Queries
  const users = useQuery(api.userManagement.listUsers, {});
  const roles = useQuery(api.userManagement.listRoles, {});
  const branches = useQuery(api.branches.list, {});
  const userSummary = useQuery(api.userManagement.getUserManagementSummary, {});

  // Mutations
  const createUser = useMutation(api.userManagement.createUser);
  const updateUser = useMutation(api.userManagement.updateUser);
  const suspendUser = useMutation(api.userManagement.suspendUser);
  const deleteUserMutation = useMutation(api.userManagement.deleteUser);
  const lockUser = useMutation(api.userManagement.lockUser);
  const unlockUser = useMutation(api.userManagement.unlockUser);
  const createRole = useMutation(api.userManagement.createRole);

  // New mutation for seeding default roles
  const seedRoles = useMutation(api.roleSeed.seedDefaultRoles);
  const getPermissions = useMutation(api.roleSeed.getAvailablePermissions);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.password !== newUser.confirmPassword) {
      toast.error("পাসওয়ার্ড মিলছে না");
      return;
    }

    if (
      !newUser.firstName ||
      !newUser.email ||
      !newUser.password ||
      !newUser.roleId
    ) {
      toast.error("সব প্রয়োজনীয় ফিল্ড পূরণ করুন");
      return;
    }

    setIsSubmittingUser(true);
    try {
      const branch = branches?.find((b) => b._id === newUser.branchId);
      
      await createUser({
        userId: newUser.userId,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        password: newUser.password,
        roleId: newUser.roleId as Id<"userRoles">,
        roleName: newUser.roleName,
        branchId: newUser.branchId ? (newUser.branchId as Id<"branches">) : undefined,
        branchName: branch?.name || newUser.branchName,
        department: newUser.department,
        designation: newUser.designation,
        isSuperAdmin: newUser.isSuperAdmin,
        isAdmin: newUser.isAdmin,
      });

      toast.success("ব্যবহারকারী সফলভাবে তৈরি হয়েছে!");
      setShowAddUser(false);
      setNewUser({
        userId: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        roleId: "",
        roleName: "",
        branchId: "",
        branchName: "",
        department: "",
        designation: "",
        isSuperAdmin: false,
        isAdmin: false,
      });
    } catch (error) {
      toast.error("ব্যবহারকারী তৈরিতে ব্যর্থ");
      console.error(error);
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.roleName || !newRole.description) {
      toast.error("ভূমিকার নাম এবং বর্ণনা প্রয়োজন");
      return;
    }

    setIsSubmittingRole(true);
    try {
      await createRole({
        roleName: newRole.roleName,
        description: newRole.description,
        permissions: newRole.permissions,
      });

      toast.success("ভূমিকা সফলভাবে তৈরি হয়েছে!");
      setShowAddRole(false);
      setNewRole({
        roleName: "",
        description: "",
        permissions: [],
      });
    } catch (error) {
      toast.error("ভূমিকা তৈরিতে ব্যর্থ");
      console.error(error);
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleSuspendUser = async (userId: Id<"userManagement">) => {
    try {
      await suspendUser({
        id: userId,
        reason: "প্রশাসক দ্বারা স্থগিত",
      });
      toast.success("ব্যবহারকারী স্থগিত করা হয়েছে");
    } catch (error) {
      toast.error("স্থগিত করতে ব্যর্থ");
      console.error(error);
    }
  };

  const handleDeleteUser = async (userId: Id<"userManagement">) => {
    if (window.confirm("এই ব্যবহারকারীকে মুছে ফেলতে চান?")) {
      try {
        await deleteUserMutation({ id: userId });
        toast.success("ব্যবহারকারী মুছে ফেলা হয়েছে");
      } catch (error) {
        toast.error("মুছে ফেলতে ব্যর্থ");
        console.error(error);
      }
    }
  };

  const handleLockUser = async (userId: Id<"userManagement">) => {
    try {
      await lockUser({ id: userId });
      toast.success("ব্যবহারকারী তালাবদ্ধ করা হয়েছে");
    } catch (error) {
      toast.error("তালাবদ্ধ করতে ব্যর্থ");
      console.error(error);
    }
  };

  const handleUnlockUser = async (userId: Id<"userManagement">) => {
    try {
      await unlockUser({ id: userId });
      toast.success("ব্যবহারকারী আনলক করা হয়েছে");
    } catch (error) {
      toast.error("আনলক করতে ব্যর্থ");
      console.error(error);
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    let result: typeof users = users;

    if (statusFilter !== "all") {
      result = result.filter((u: User) => u.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (u: User) =>
          u.fullName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.userId.toLowerCase().includes(term)
      );
    }

    return result;
  }, [users, statusFilter, searchTerm]);

  const permissionOptions = [
    "user_management",
    "inventory_management",
    "sales_management",
    "customer_management",
    "reports_access",
    "settings_access",
    "outstanding_management",
    "hr_management",
    "analytics_access",
    "backup_access",
    "system_logs_access",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">ব্যবহারকারী ব্যবস্থাপনা</h1>
        {activeTab === "users" && (
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} /> নতুন ব্যবহারকারী
          </button>
        )}
        {activeTab === "roles" && (
          <button
            onClick={() => setShowAddRole(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} /> নতুন ভূমিকা
          </button>
        )}
      </div>

      {/* Dashboard Summary */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <p className="text-sm opacity-80">মোট ব্যবহারকারী</p>
            <p className="text-2xl font-bold">{userSummary?.totalUsers || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg">
            <p className="text-sm opacity-80">সক্রিয়</p>
            <p className="text-2xl font-bold">{userSummary?.activeUsers || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-4 rounded-lg">
            <p className="text-sm opacity-80">নিষ্ক্রিয়</p>
            <p className="text-2xl font-bold">{userSummary?.inactiveUsers || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-lg">
            <p className="text-sm opacity-80">স্থগিত</p>
            <p className="text-2xl font-bold">{userSummary?.suspendedUsers || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg">
            <p className="text-sm opacity-80">সুপার অ্যাডমিন</p>
            <p className="text-2xl font-bold">{userSummary?.superAdmins || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 rounded-lg">
            <p className="text-sm opacity-80">অ্যাডমিন</p>
            <p className="text-2xl font-bold">{userSummary?.admins || 0}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: "users", label: "ব্যবহারকারী", icon: Users },
          { id: "roles", label: "ভূমিকা", icon: Shield },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition ${
              activeTab === id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-blue-600"
            }`}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === "users" && !selectedUser && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded">
              <Search size={18} />
              <input
                type="text"
                placeholder="খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent flex-1 outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-100 rounded outline-none"
            >
              <option value="all">সব স্ট্যাটাস</option>
              <option value="active">সক্রিয়</option>
              <option value="inactive">নিষ্ক্রিয়</option>
              <option value="suspended">স্থগিত</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">নাম</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">ইমেইল</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">ভূমিকা</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">স্ট্যাটাস</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">শেষ লগইন</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: User) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{user.fullName}</td>
                    <td className="px-6 py-4 text-sm">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {user.roleName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          user.status === "active"
                            ? "bg-green-100 text-green-700"
                            : user.status === "suspended"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.status === "active"
                          ? "সক্রিয়"
                          : user.status === "suspended"
                          ? "স্থগিত"
                          : "নিষ্ক্রিয়"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("bn-BD") : "কখনো না"}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleSuspendUser(user._id)}
                        className="text-yellow-600 hover:text-yellow-800"
                        title="স্থগিত করুন"
                      >
                        <AlertCircle size={16} />
                      </button>
                      <button
                        onClick={() => handleLockUser(user._id)}
                        className="text-red-600 hover:text-red-800"
                        title="তালাবদ্ধ করুন"
                      >
                        <Lock size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-800"
                        title="মুছুন"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Detail View */}
      {activeTab === "users" && selectedUser && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">{selectedUser.fullName}</h2>
              <p className="text-gray-600">{selectedUser.designation}</p>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4 text-lg">ব্যক্তিগত তথ্য</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">ব্যবহারকারী আইডি</p>
                  <p className="font-semibold">{selectedUser.userId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ইমেইল</p>
                  <p className="font-semibold">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ফোন</p>
                  <p className="font-semibold">{selectedUser.phone || "N/A"}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-lg">কর্মসংক্রান্ত তথ্য</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">ভূমিকা</p>
                  <p className="font-semibold">{selectedUser.roleName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">স্ট্যাটাস</p>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedUser.status === "active"
                        ? "bg-green-100 text-green-700"
                        : selectedUser.status === "suspended"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {selectedUser.status === "active"
                      ? "সক্রিয়"
                      : selectedUser.status === "suspended"
                      ? "স্থগিত"
                      : "নিষ্ক্রিয়"}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">যোগদানের তারিখ</p>
                  <p className="font-semibold">
                    {new Date(selectedUser.joinDate).toLocaleDateString("bn-BD")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t flex gap-2">
            <button
              onClick={() => handleSuspendUser(selectedUser._id)}
              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 flex items-center gap-2"
            >
              <AlertCircle size={18} /> স্থগিত করুন
            </button>
            <button
              onClick={() => handleLockUser(selectedUser._id)}
              className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-2"
            >
              <Lock size={18} /> তালাবদ্ধ করুন
            </button>
            <button
              onClick={() => handleDeleteUser(selectedUser._id)}
              className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-2"
            >
              <Trash2 size={18} /> মুছুন
            </button>
            <button
              onClick={() => setSelectedUser(null)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 ml-auto"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          {/* Seed Roles Button */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 rounded-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-blue-900">ডিফল্ট ভূমিকা সেটআপ</h3>
              <p className="text-sm text-blue-800">সিস্টেমে সমস্ত প্রয়োজনীয় ভূমিকা স্বয়ংক্রিয়ভাবে তৈরি করুন</p>
            </div>
            <button
              onClick={async () => {
                try {
                  const result = await seedRoles();
                  if (result.createdRoles && result.createdRoles.length > 0) {
                    toast.success(result.message);
                  } else {
                    toast.info("সমস্ত ভূমিকা ইতিমধ্যে তৈরি করা হয়েছে");
                  }
                } catch (error) {
                  toast.error("ভূমিকা তৈরিতে ব্যর্থ");
                  console.error(error);
                }
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
            >
              <Zap size={18} /> ভূমিকা সেটআপ
            </button>
          </div>
          {showAddRole && (
            <form
              onSubmit={handleAddRole}
              className="bg-white rounded-lg shadow p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold mb-2">ভূমিকার নাম</label>
                <input
                  type="text"
                  placeholder="যেমন: Manager, Supervisor"
                  value={newRole.roleName}
                  onChange={(e) => setNewRole({ ...newRole, roleName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">বর্ণনা</label>
                <textarea
                  placeholder="ভূমিকার বর্ণনা"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">অনুমতি</label>
                <div className="space-y-2 grid grid-cols-1 md:grid-cols-2">
                  {permissionOptions.map((permission) => {
                    const permissionLabels: { [key: string]: string } = {
                      user_management: "ব্যবহারকারী ব্যবস্থাপনা",
                      inventory_management: "ইনভেন্টরি ব্যবস্থাপনা",
                      sales_management: "বিক্রয় ব্যবস্থাপনা",
                      customer_management: "গ্রাহক ব্যবস্থাপনা",
                      reports_access: "রিপোর্ট অ্যাক্সেস",
                      settings_access: "সেটিংস অ্যাক্সেস",
                      outstanding_management: "বকেয়া ব্যবস্থাপনা",
                      hr_management: "HR ও পেরোল ব্যবস্থাপনা",
                      analytics_access: "বিশ্লেষণ অ্যাক্সেস",
                      backup_access: "ব্যাকআপ অ্যাক্সেস",
                      system_logs_access: "সিস্টেম লগ অ্যাক্সেস",
                    };

                    return (
                      <label key={permission} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newRole.permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRole({
                                ...newRole,
                                permissions: [...newRole.permissions, permission],
                              });
                            } else {
                              setNewRole({
                                ...newRole,
                                permissions: newRole.permissions.filter(
                                  (p) => p !== permission
                                ),
                              });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{permissionLabels[permission] || permission}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingRole}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmittingRole ? "তৈরি করছে..." : "তৈরি করুন"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddRole(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  বাতিল করুন
                </button>
              </div>
            </form>
          )}

          {/* Roles List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">ভূমিকার নাম</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">বর্ণনা</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">অনুমতি</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {roles?.map((role: Role) => {
                  const permissionLabels: { [key: string]: string } = {
                    user_management: "ব্যবহারকারী",
                    inventory_management: "ইনভেন্টরি",
                    sales_management: "বিক্রয়",
                    customer_management: "গ্রাহক",
                    reports_access: "রিপোর্ট",
                    settings_access: "সেটিংস",
                    outstanding_management: "বকেয়া",
                    hr_management: "HR",
                    analytics_access: "বিশ্লেষণ",
                    backup_access: "ব্যাকআপ",
                    system_logs_access: "লগ",
                  };

                  return (
                    <tr key={role._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{role.roleName}</td>
                      <td className="px-6 py-4 text-sm">{role.description}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((perm: string) => (
                            <span
                              key={perm}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                            >
                              {permissionLabels[perm] || perm.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            role.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {role.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto max-w-2xl w-full">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">নতুন ব্যবহারকারী যুক্ত করুন</h2>
              <button
                onClick={() => setShowAddUser(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">ব্যবহারকারী আইডি</label>
                  <input
                    type="text"
                    placeholder="USER-001"
                    value={newUser.userId}
                    onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">ভূমিকা</label>
                  <select
                    value={newUser.roleId}
                    onChange={(e) => {
                      const role = roles?.find((r: Role) => r._id === e.target.value);
                      setNewUser({
                        ...newUser,
                        roleId: e.target.value,
                        roleName: role?.roleName || "",
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  >
                    <option value="">নির্বাচন করুন</option>
                    {roles?.map((role: Role) => (
                      <option key={role._id} value={role._id}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">প্রথম নাম</label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">শেষ নাম</label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">ইমেইল</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">ফোন</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">শাখা</label>
                  <select
                    value={newUser.branchId}
                    onChange={(e) => {
                      const branch = branches?.find((b) => b._id === e.target.value);
                      setNewUser({
                        ...newUser,
                        branchId: e.target.value,
                        branchName: branch?.name || "",
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">নির্বাচন করুন</option>
                    {branches?.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">বিভাগ</label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">পদবি</label>
                  <input
                    type="text"
                    value={newUser.designation}
                    onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold mb-1">পাসওয়ার্ড</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-800"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">পাসওয়ার্ড নিশ্চিত করুন</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newUser.isSuperAdmin}
                      onChange={(e) => setNewUser({ ...newUser, isSuperAdmin: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">সুপার অ্যাডমিন</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newUser.isAdmin}
                      onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">অ্যাডমিন</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmittingUser ? "তৈরি করছে..." : "তৈরি করুন"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  বাতিল করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
