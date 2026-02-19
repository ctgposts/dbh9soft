import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface UserRule {
  _id: string;
  name: string;
  description?: string;
  condition: string;
  action: string;
  actionParams?: any;
  isActive: boolean;
  priority: number;
  createdAt: number;
  updatedAt: number;
}

interface UserRole {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface PermissionTemplate {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  category: string;
  createdAt: number;
}

export function RuleBasedUserManagement() {
  const [activeTab, setActiveTab] = useState("rules");
  const [showAddRule, setShowAddRule] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [editingRule, setEditingRule] = useState<UserRule | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);

  // Form states
  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    condition: "",
    action: "assignRole",
    priority: 0,
  });

  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  // Fetch data
  const rules = useQuery(api.userRules.getAllRules);
  const roles = useQuery(api.userRules.getAllRoles);
  const permissionTemplates = useQuery(api.userRules.getPermissionTemplates, {
    category: undefined,
  });
  const ruleLogs = useQuery(api.userRules.getRuleApplicationLogs, {
    limit: 20,
  });

  // Mutations
  const createRuleMutation = useMutation(api.userRules.createRule);
  const updateRuleMutation = useMutation(api.userRules.updateRule);
  const deleteRuleMutation = useMutation(api.userRules.deleteRule);
  const createRoleMutation = useMutation(api.userRules.createRole);
  const updateRoleMutation = useMutation(api.userRules.updateRole);
  const deleteRoleMutation = useMutation(api.userRules.deleteRole);

  const availablePermissions = [
    "view_dashboard",
    "pos_access",
    "inventory_manage",
    "customer_manage",
    "sales_view",
    "reports_view",
    "settings_manage",
    "users_manage",
    "branch_manage",
    "admin_access",
  ];

  const handleCreateRule = async () => {
    if (!newRule.name || !newRule.condition || !newRule.action) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingRule) {
        await updateRuleMutation({
          ruleId: editingRule._id as any,
          name: newRule.name,
          description: newRule.description,
          condition: newRule.condition,
          action: newRule.action,
          priority: newRule.priority,
        });
        toast.success("Rule updated successfully!");
        setEditingRule(null);
      } else {
        await createRuleMutation({
          name: newRule.name,
          description: newRule.description,
          condition: newRule.condition,
          action: newRule.action,
          priority: newRule.priority,
        });
        toast.success("Rule created successfully!");
      }
      setNewRule({
        name: "",
        description: "",
        condition: "",
        action: "assignRole",
        priority: 0,
      });
      setShowAddRule(false);
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name || newRole.permissions.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingRole) {
        await updateRoleMutation({
          roleId: editingRole._id as any,
          roleName: newRole.name,
          description: newRole.description,
          permissions: newRole.permissions,
        });
        toast.success("Role updated successfully!");
        setEditingRole(null);
      } else {
        await createRoleMutation({
          roleName: newRole.name,
          description: newRole.description,
          permissions: newRole.permissions,
        });
        toast.success("Role created successfully!");
      }
      setNewRole({
        name: "",
        description: "",
        permissions: [],
      });
      setShowAddRole(false);
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      await deleteRuleMutation({ ruleId: ruleId as any });
      toast.success("Rule deleted successfully!");
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      await deleteRoleMutation({ roleId: roleId as any });
      toast.success("Role deleted successfully!");
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`);
    }
  };

  const handleEditRule = (rule: UserRule) => {
    setEditingRule(rule);
    setNewRule({
      name: rule.name,
      description: rule.description || "",
      condition: rule.condition,
      action: rule.action,
      priority: rule.priority,
    });
    setShowAddRule(true);
  };

  const handleEditRole = (role: UserRole | any) => {
    setEditingRole(role);
    setNewRole({
      name: role.name || role.roleName,
      description: role.description || "",
      permissions: role.permissions,
    });
    setShowAddRole(true);
  };

  const togglePermission = (permission: string) => {
    setNewRole((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <h3 className="text-xl font-semibold text-gray-900">
          🔐 Rule-Based User Management
        </h3>
        <p className="text-sm text-gray-500">
          Create roles, define rules, and manage user permissions
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "rules", name: "Rules" },
            { id: "roles", name: "Roles" },
            { id: "templates", name: "Templates" },
            { id: "logs", name: "Logs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Rules Tab */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <button
            onClick={() => {
              setEditingRule(null);
              setNewRule({
                name: "",
                description: "",
                condition: "",
                action: "assignRole",
                priority: 0,
              });
              setShowAddRule(!showAddRule);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            {showAddRule ? "✕ Cancel" : "+ Add New Rule"}
          </button>

          {showAddRule && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <input
                type="text"
                placeholder="Rule Name"
                value={newRule.name}
                onChange={(e) =>
                  setNewRule((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <textarea
                placeholder="Description"
                value={newRule.description}
                onChange={(e) =>
                  setNewRule((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                rows={2}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition (JavaScript expression)
                </label>
                <textarea
                  placeholder="e.g., position==='Manager' || permissions.includes('admin')"
                  value={newRule.condition}
                  onChange={(e) =>
                    setNewRule((prev) => ({
                      ...prev,
                      condition: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action
                  </label>
                  <select
                    value={newRule.action}
                    onChange={(e) =>
                      setNewRule((prev) => ({
                        ...prev,
                        action: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="assignRole">Assign Role</option>
                    <option value="grantPermissions">Grant Permissions</option>
                    <option value="restrict">Restrict Access</option>
                    <option value="notify">Send Notification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={newRule.priority}
                    onChange={(e) =>
                      setNewRule((prev) => ({
                        ...prev,
                        priority: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateRule}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  {editingRule ? "✓ Update Rule" : "✓ Create Rule"}
                </button>
                <button
                  onClick={() => {
                    setShowAddRule(false);
                    setEditingRule(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {rules && rules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                        Condition
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rules.map((rule: UserRule) => (
                      <tr key={rule._id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                          {rule.name}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600 font-mono">
                          {rule.condition.substring(0, 30)}...
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {rule.action}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {rule.priority}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm space-x-2">
                          <button
                            onClick={() => handleEditRule(rule)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No rules created yet. Create your first rule!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          <button
            onClick={() => {
              setEditingRole(null);
              setNewRole({
                name: "",
                description: "",
                permissions: [],
              });
              setShowAddRole(!showAddRole);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            {showAddRole ? "✕ Cancel" : "+ Add New Role"}
          </button>

          {showAddRole && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <input
                type="text"
                placeholder="Role Name"
                value={newRole.name}
                onChange={(e) =>
                  setNewRole((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <textarea
                placeholder="Description"
                value={newRole.description}
                onChange={(e) =>
                  setNewRole((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                rows={2}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissions
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {availablePermissions.map((permission) => (
                    <label
                      key={permission}
                      className="flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={newRole.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="mr-2 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {permission.replace(/_/g, " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateRole}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  {editingRole ? "✓ Update Role" : "✓ Create Role"}
                </button>
                <button
                  onClick={() => {
                    setShowAddRole(false);
                    setEditingRole(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles && roles.length > 0 ? (
              roles.map((role: any) => (
                <div
                  key={role._id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-gray-900">{role.roleName}</h4>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role._id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {role.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {role.description}
                    </p>
                  )}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700">
                      Permissions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission: any) => (
                        <span
                          key={permission}
                          className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-8">
                No roles created yet. Create your first role!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 mb-4">
            Built-in permission templates to quickly assign common role permissions:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {permissionTemplates && permissionTemplates.length > 0 ? (
              permissionTemplates.map((template: PermissionTemplate) => (
                <div
                  key={template._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {template.name}
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">{template.category}</p>
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {template.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {template.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-8">
                No templates available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {ruleLogs && ruleLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      Rule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      Result
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      Applied At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ruleLogs.map((log: any) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {log.ruleName}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {log.userName}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                          {log.applicationType}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            log.result === "success"
                              ? "bg-green-100 text-green-800"
                              : log.result === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {log.result}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {new Date(log.appliedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No logs available yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
