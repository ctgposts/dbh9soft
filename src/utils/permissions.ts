/**
 * 🔐 Permission Utility - Centralized Permission Management
 * 
 * এই ফাইল সব permission logic handle করে:
 * - Role থেকে permissions extract করা
 * - Component এ permission check করা
 * - Consistent permission naming
 */

export interface UserPermissions {
  // Access control
  canAccessPOS: boolean;
  canAccessInventory: boolean;
  canAccessReports: boolean;
  canAccessSettings: boolean;
  canAccessAnalytics: boolean;
  
  // User management
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManagePermissions: boolean;
  canManageEmployees: boolean;
  
  // Business operations
  canManageSales: boolean;
  canManageCustomers: boolean;
  canManageOutstanding: boolean;
  canManageBranches: boolean;
  
  // Advanced features
  canAccessBackup: boolean;
  canAccessSystemLogs: boolean;
  canAccessHR: boolean;
}

/**
 * Role permissions (from userRoles table) কে UI permissions এ convert করুন
 * @param rolePermissions - Role এর permissions array
 * @returns User permissions object
 */
export const getUserPermissions = (rolePermissions: string[]): UserPermissions => {
  const permissionMap: Record<string, string[]> = {
    canAccessPOS: ["sales_management", "pos_access"],
    canAccessInventory: ["inventory_management", "inventory_manage"],
    canAccessReports: ["reports_access", "reports_view"],
    canAccessSettings: ["settings_access", "settings_manage"],
    canAccessAnalytics: ["analytics_access", "analytics_manage"],
    canManageUsers: ["user_management", "users_manage"],
    canManageRoles: ["role_management", "roles_manage"],
    canManagePermissions: ["permission_management", "permissions_manage"],
    canManageEmployees: ["hr_management", "employee_manage"],
    canManageSales: ["sales_management"],
    canManageCustomers: ["customer_management", "customer_manage"],
    canManageOutstanding: ["outstanding_management"],
    canManageBranches: ["branch_management", "branch_manage"],
    canAccessBackup: ["backup_access"],
    canAccessSystemLogs: ["system_logs_access", "logs_access"],
    canAccessHR: ["hr_management", "hr_access"],
  };

  const result: UserPermissions = {
    canAccessPOS: false,
    canAccessInventory: false,
    canAccessReports: false,
    canAccessSettings: false,
    canAccessAnalytics: false,
    canManageUsers: false,
    canManageRoles: false,
    canManagePermissions: false,
    canManageEmployees: false,
    canManageSales: false,
    canManageCustomers: false,
    canManageOutstanding: false,
    canManageBranches: false,
    canAccessBackup: false,
    canAccessSystemLogs: false,
    canAccessHR: false,
  };

  // সব permission keys loop করুন
  Object.keys(permissionMap).forEach((key) => {
    const requiredPerms = permissionMap[key];
    // যদি কোনো required permission role এ থাকে
    const hasPermission = requiredPerms.some(p => 
      rolePermissions.includes(p) || 
      rolePermissions.includes(p.replace(/_/g, "_"))
    );
    
    if (hasPermission) {
      (result as any)[key] = true;
    }
  });

  return result;
};

/**
 * Super Admin ছাড়া কোনো এক্সেস দেবেন না
 */
export const getFullPermissions = (): UserPermissions => {
  return {
    canAccessPOS: true,
    canAccessInventory: true,
    canAccessReports: true,
    canAccessSettings: true,
    canAccessAnalytics: true,
    canManageUsers: true,
    canManageRoles: true,
    canManagePermissions: true,
    canManageEmployees: true,
    canManageSales: true,
    canManageCustomers: true,
    canManageOutstanding: true,
    canManageBranches: true,
    canAccessBackup: true,
    canAccessSystemLogs: true,
    canAccessHR: true,
  };
};

/**
 * Default permissions (যখন role load না হয়)
 */
export const getDefaultPermissions = (): UserPermissions => {
  return {
    canAccessPOS: false,
    canAccessInventory: false,
    canAccessReports: false,
    canAccessSettings: false,
    canAccessAnalytics: false,
    canManageUsers: false,
    canManageRoles: false,
    canManagePermissions: false,
    canManageEmployees: false,
    canManageSales: false,
    canManageCustomers: false,
    canManageOutstanding: false,
    canManageBranches: false,
    canAccessBackup: false,
    canAccessSystemLogs: false,
    canAccessHR: false,
  };
};

/**
 * Role name থেকে কমন positions extract করুন
 */
export const getRolePositions = (roleName: string): string[] => {
  const roleMap: Record<string, string[]> = {
    "সুপার অ্যাডমিন": ["Super Admin", "Manager"],
    "অ্যাডমিন": ["Admin", "Manager"],
    "মালিক": ["Owner", "Manager"],
    "ম্যানেজার": ["Manager", "Branch Manager"],
    "ক্যাশিয়ার": ["Cashier", "POS Operator"],
    "ইনভেন্টরি ম্যানেজার": ["Stock Manager", "Stock Keeper", "Inventory Manager"],
    "বিক্রয় প্রতিনিধি": ["Sales Associate", "Sales Representative"],
  };

  return roleMap[roleName] || ["Staff", "Associate"];
};

/**
 * সব available permissions দেখান (admin এর জন্য)
 */
export const getAllAvailablePermissions = (): Array<{
  code: string;
  name: string;
  description: string;
}> => [
  {
    code: "user_management",
    name: "ব্যবহারকারী ব্যবস্থাপনা",
    description: "ব্যবহারকারী তৈরি, সম্পাদনা এবং মুছে ফেলা",
  },
  {
    code: "inventory_management",
    name: "ইনভেন্টরি ব্যবস্থাপনা",
    description: "পণ্য এবং স্টক পরিচালনা",
  },
  {
    code: "sales_management",
    name: "বিক্রয় ব্যবস্থাপনা",
    description: "POS এবং বিক্রয় লেনদেন",
  },
  {
    code: "customer_management",
    name: "গ্রাহক ব্যবস্থাপনা",
    description: "গ্রাহক তথ্য এবং লেনদেন",
  },
  {
    code: "reports_access",
    name: "রিপোর্ট অ্যাক্সেস",
    description: "বিক্রয় এবং অন্যান্য রিপোর্ট দেখা",
  },
  {
    code: "settings_access",
    name: "সেটিংস অ্যাক্সেস",
    description: "সিস্টেম সেটিংস পরিবর্তন করা",
  },
  {
    code: "outstanding_management",
    name: "বকেয়া ব্যবস্থাপনা",
    description: "বকেয়া এবং ঋণ ট্র্যাকিং",
  },
  {
    code: "hr_management",
    name: "HR ব্যবস্থাপনা",
    description: "কর্মচারী এবং পেরোল ব্যবস্থাপনা",
  },
  {
    code: "analytics_access",
    name: "বিশ্লেষণ অ্যাক্সেস",
    description: "উন্নত বিশ্লেষণ এবং রিপোর্ট",
  },
  {
    code: "backup_access",
    name: "ব্যাকআপ অ্যাক্সেস",
    description: "ডেটা ব্যাকআপ এবং পুনরুদ্ধার",
  },
  {
    code: "system_logs_access",
    name: "সিস্টেম লগ অ্যাক্সেস",
    description: "সিস্টেম লগ এবং অডিট ট্রেইল",
  },
];

/**
 * Permission check helper (Convex mutation এ ব্যবহার করুন)
 */
export const hasPermission = (
  userPermissions: UserPermissions,
  requiredPermission: keyof UserPermissions
): boolean => {
  return userPermissions[requiredPermission] === true;
};

/**
 * Multiple permissions check (সব থাকতে হবে)
 */
export const hasAllPermissions = (
  userPermissions: UserPermissions,
  requiredPermissions: (keyof UserPermissions)[]
): boolean => {
  return requiredPermissions.every(p => userPermissions[p] === true);
};

/**
 * Multiple permissions check (কোনো একটি থাকলেই হবে)
 */
export const hasAnyPermission = (
  userPermissions: UserPermissions,
  requiredPermissions: (keyof UserPermissions)[]
): boolean => {
  return requiredPermissions.some(p => userPermissions[p] === true);
};

/**
 * Role name থেকে default permissions suggest করুন
 */
export const getSuggestedPermissions = (roleName: string): string[] => {
  const rolePermissionMap: Record<string, string[]> = {
    "সুপার অ্যাডমিন": [
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
    ],
    "অ্যাডমিন": [
      "user_management",
      "inventory_management",
      "sales_management",
      "customer_management",
      "reports_access",
      "settings_access",
      "outstanding_management",
      "hr_management",
    ],
    "মালিক": [
      "sales_management",
      "customer_management",
      "reports_access",
      "outstanding_management",
      "analytics_access",
      "hr_management",
    ],
    "ম্যানেজার": [
      "sales_management",
      "inventory_management",
      "customer_management",
      "reports_access",
      "outstanding_management",
      "hr_management",
    ],
    "ক্যাশিয়ার": [
      "sales_management",
      "customer_management",
    ],
    "ইনভেন্টরি ম্যানেজার": [
      "inventory_management",
      "reports_access",
      "outstanding_management",
    ],
    "বিক্রয় প্রতিনিধি": [
      "sales_management",
      "customer_management",
    ],
  };

  return rolePermissionMap[roleName] || [];
};
