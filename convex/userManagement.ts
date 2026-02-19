import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Cross-environment base64 encoder (works in Node, Edge, and browser runtimes)
function base64Encode(input: string): string {
  try {
    if (typeof Buffer !== "undefined") return Buffer.from(input).toString("base64");

    if (typeof TextEncoder !== "undefined" && typeof btoa !== "undefined") {
      const uint8 = new TextEncoder().encode(input);
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < uint8.length; i += chunkSize) {
        const slice = uint8.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.prototype.slice.call(slice));
      }
      return btoa(binary);
    }

    if (typeof btoa !== "undefined") return btoa(unescape(encodeURIComponent(input)));
  } catch (e) {
    // fall through to throw below
  }

  throw new Error("No base64 encoder available in this environment");
}

// ============================================
// ROLE MANAGEMENT QUERIES & MUTATIONS
// ============================================

export const listRoles = query({
  args: { isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let roles = await ctx.db.query("userRoles").collect();

    if (args.isActive !== undefined) {
      roles = roles.filter((r) => r.isActive === args.isActive);
    }

    return roles.sort((a, b) => a.roleName.localeCompare(b.roleName));
  },
});

export const getRoleById = query({
  args: { id: v.id("userRoles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createRole = mutation({
  args: {
    roleName: v.string(),
    description: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const roleId = await ctx.db.insert("userRoles", {
      roleName: args.roleName,
      description: args.description,
      permissions: args.permissions,
      isActive: true,
      createdByName: userId.email || "System",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return roleId;
  },
});

export const updateRole = mutation({
  args: {
    id: v.id("userRoles"),
    description: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.description) updates.description = args.description;
    if (args.permissions) updates.permissions = args.permissions;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    updates.updatedAt = Date.now();

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const deleteRole = mutation({
  args: { id: v.id("userRoles") },
  handler: async (ctx, args) => {
    // Check if any users have this role
    const usersWithRole = await ctx.db
      .query("userManagement")
      .collect()
      .then((u) => u.filter((user) => user.roleId === args.id));

    if (usersWithRole.length > 0) {
      throw new Error("ভূমিকা ব্যবহারকারীদের দ্বারা ব্যবহৃত হচ্ছে, অপসারণ করা যাবে না");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// ============================================
// USER MANAGEMENT QUERIES & MUTATIONS
// ============================================

export const listUsers = query({
  args: {
    status: v.optional(v.string()),
    roleId: v.optional(v.id("userRoles")),
    branchId: v.optional(v.id("branches")),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let users = await ctx.db.query("userManagement").collect();

    if (args.status) {
      users = users.filter((u) => u.status === args.status);
    }

    if (args.roleId) {
      users = users.filter((u) => u.roleId === args.roleId);
    }

    if (args.branchId) {
      users = users.filter((u) => u.branchId === args.branchId);
    }

    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.userId.toLowerCase().includes(term)
      );
    }

    return users.sort((a, b) => a.fullName.localeCompare(b.fullName));
  },
});

export const getUserById = query({
  args: { id: v.id("userManagement") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("userManagement").collect();
    return users.find((u) => u.email === args.email) || null;
  },
});

export const createUser = mutation({
  args: {
    userId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    password: v.string(),
    roleId: v.id("userRoles"),
    roleName: v.string(),
    branchId: v.optional(v.id("branches")),
    branchName: v.optional(v.string()),
    department: v.optional(v.string()),
    designation: v.optional(v.string()),
    isSuperAdmin: v.optional(v.boolean()),
    isAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    // Check if email already exists
    const existing = await ctx.db
      .query("userManagement")
      .collect()
      .then((u) => u.find((user) => user.email === args.email));

    if (existing) {
      throw new Error("ইমেইল ইতিমধ্যে ব্যবহৃত হয়েছে");
    }

    // Hash password (in production, use bcrypt)
    const hashedPassword = base64Encode(args.password);

    const id = await ctx.db.insert("userManagement", {
      userId: args.userId,
      firstName: args.firstName,
      lastName: args.lastName,
      fullName: `${args.firstName} ${args.lastName}`,
      email: args.email,
      phone: args.phone,
      password: hashedPassword,
      roleId: args.roleId,
      roleName: args.roleName,
      branchId: args.branchId,
      branchName: args.branchName,
      department: args.department,
      designation: args.designation,
      joinDate: Date.now(),
      status: "active",
      isSuperAdmin: args.isSuperAdmin || false,
      isAdmin: args.isAdmin || false,
      canManageUsers: args.isSuperAdmin || args.isAdmin || false,
      canManageRoles: args.isSuperAdmin || false,
      canAccessReports: true,
      canAccessSettings: args.isSuperAdmin || args.isAdmin || false,
      twoFactorEnabled: false,
      loginAttempts: 0,
      isLocked: false,
      createdByName: userId.email || "System",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 🔄 SYNC: Create HR Employee Record if branch is provided
    if (args.branchId && args.branchName) {
      // Check if HR employee already exists for this user
      const existingHREmployee = await ctx.db
        .query("hrEmployees")
        .collect()
        .then((e) => e.find((emp) => emp.email === args.email));

      if (!existingHREmployee) {
        const employeeId = `EMP-${Date.now().toString().slice(-5)}`;
        await ctx.db.insert("hrEmployees", {
          employeeId,
          firstName: args.firstName,
          lastName: args.lastName,
          fullName: `${args.firstName} ${args.lastName}`,
          email: args.email,
          phone: args.phone || "",
          dateOfBirth: 0,
          gender: "other",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          nationality: "",
          branchId: args.branchId,
          branchName: args.branchName,
          department: args.department || "Operations",
          designation: args.designation || "Staff",
          reportingManagerId: undefined,
          reportingManagerName: undefined,
          employmentType: "permanent",
          joinDate: Date.now(),
          confirmationDate: undefined,
          baseSalary: 0,
          grossSalary: 0,
          currency: "BDT",
          bankAccountNumber: undefined,
          bankName: undefined,
          ifscCode: undefined,
          emergencyContactName: "",
          emergencyContactPhone: "",
          emergencyContactRelation: "",
          panNumber: undefined,
          aadharNumber: undefined,
          epfNumber: undefined,
          esiNumber: undefined,
          status: "active",
          terminationDate: undefined,
          terminationReason: undefined,
        });
      }
    }

    // Log activity
    await ctx.db.insert("userActivityLog", {
      userId: id,
      userName: args.firstName + " " + args.lastName,
      action: "created",
      actionType: "user",
      details: `নতুন ব্যবহারকারী তৈরি: ${args.firstName} ${args.lastName}`,
      status: "success",
      timestamp: Date.now(),
    });

    return id;
  },
});

export const updateUser = mutation({
  args: {
    id: v.id("userManagement"),
    updates: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      phone: v.optional(v.string()),
      roleId: v.optional(v.id("userRoles")),
      roleName: v.optional(v.string()),
      department: v.optional(v.string()),
      designation: v.optional(v.string()),
      status: v.optional(v.string()),
      branchId: v.optional(v.id("branches")),
      branchName: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("ব্যবহারকারী খুঁজে পাওয়া যায়নি");

    const updates: any = { ...args.updates };
    if (args.updates.firstName || args.updates.lastName) {
      updates.fullName = `${args.updates.firstName || user.firstName} ${
        args.updates.lastName || user.lastName
      }`;
    }
    updates.updatedAt = Date.now();

    await ctx.db.patch(args.id, updates);

    // 🔄 SYNC: Update HR Employee Record if it exists
    const hrEmployee = await ctx.db
      .query("hrEmployees")
      .collect()
      .then((e) => e.find((emp) => emp.email === user.email));

    if (hrEmployee) {
      const hrUpdates: any = {};
      if (args.updates.firstName) hrUpdates.firstName = args.updates.firstName;
      if (args.updates.lastName) hrUpdates.lastName = args.updates.lastName;
      if (args.updates.firstName || args.updates.lastName) {
        hrUpdates.fullName = `${args.updates.firstName || hrEmployee.firstName} ${
          args.updates.lastName || hrEmployee.lastName
        }`;
      }
      if (args.updates.phone) hrUpdates.phone = args.updates.phone;
      if (args.updates.department) hrUpdates.department = args.updates.department;
      if (args.updates.designation) hrUpdates.designation = args.updates.designation;
      if (args.updates.status) hrUpdates.status = args.updates.status;

      if (Object.keys(hrUpdates).length > 0) {
        await ctx.db.patch(hrEmployee._id, hrUpdates);
      }
    }

    // Log audit trail
    if (args.updates.status) {
      await ctx.db.insert("userAuditTrail", {
        userId: args.id,
        userName: user.fullName,
        actionType: "updated",
        changedFields: {
          fieldName: "status",
          oldValue: user.status,
          newValue: args.updates.status,
        },
        changedByName: userId.email || "System",
        timestamp: Date.now(),
      });
    }

    return args.id;
  },
});

export const suspendUser = mutation({
  args: {
    id: v.id("userManagement"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("ব্যবহারকারী খুঁজে পাওয়া যায়নি");

    await ctx.db.patch(args.id, {
      status: "suspended",
      updatedAt: Date.now(),
    });

    // Log audit trail
    await ctx.db.insert("userAuditTrail", {
      userId: args.id,
      userName: user.fullName,
      actionType: "suspended",
      changedFields: {
        fieldName: "status",
        oldValue: user.status,
        newValue: "suspended",
      },
      changedByName: userId.email || "System",
      reason: args.reason,
      timestamp: Date.now(),
    });

    return args.id;
  },
});

export const resetUserPassword = mutation({
  args: {
    userId: v.id("userManagement"),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("ব্যবহারকারী খুঁজে পাওয়া যায়নি");

    const hashedPassword = base64Encode(args.newPassword);

    await ctx.db.patch(args.userId, {
      password: hashedPassword,
      lastPasswordChange: Date.now(),
      passwordExpiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
      updatedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("userActivityLog", {
      userId: args.userId,
      userName: user.fullName,
      action: "password_reset",
      actionType: "user",
      details: "পাসওয়ার্ড রিসেট করা হয়েছে",
      status: "success",
      timestamp: Date.now(),
    });

    return args.userId;
  },
});

export const deleteUser = mutation({
  args: { id: v.id("userManagement") },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("ব্যবহারকারী খুঁজে পাওয়া যায়নি");

    // Log audit trail before deletion
    await ctx.db.insert("userAuditTrail", {
      userId: args.id,
      userName: user.fullName,
      actionType: "deleted",
      changedFields: {
        fieldName: "status",
        oldValue: user.status,
        newValue: "deleted",
      },
      changedByName: userId.email || "System",
      timestamp: Date.now(),
    });

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const lockUser = mutation({
  args: {
    id: v.id("userManagement"),
    lockDurationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lockDuration = (args.lockDurationMinutes || 30) * 60 * 1000; // Default 30 minutes

    await ctx.db.patch(args.id, {
      isLocked: true,
      lockedUntil: Date.now() + lockDuration,
      loginAttempts: 0,
    });

    return args.id;
  },
});

export const unlockUser = mutation({
  args: { id: v.id("userManagement") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isLocked: false,
      lockedUntil: undefined,
      loginAttempts: 0,
    });

    return args.id;
  },
});

// ============================================
// USER ACTIVITY & LOGGING
// ============================================

export const logUserActivity = mutation({
  args: {
    userId: v.id("userManagement"),
    userName: v.string(),
    action: v.string(),
    actionType: v.string(),
    details: v.string(),
    status: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userActivityLog", {
      userId: args.userId,
      userName: args.userName,
      action: args.action,
      actionType: args.actionType,
      details: args.details,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      status: args.status || "success",
      timestamp: Date.now(),
    });
  },
});

export const getUserActivityLog = query({
  args: {
    userId: v.optional(v.id("userManagement")),
    action: v.optional(v.string()),
    fromDate: v.optional(v.number()),
    toDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db.query("userActivityLog").collect();

    if (args.userId) {
      logs = logs.filter((l) => l.userId === args.userId);
    }

    if (args.action) {
      logs = logs.filter((l) => l.action === args.action);
    }

    if (args.fromDate && args.toDate) {
      logs = logs.filter(
        (l) => l.timestamp >= args.fromDate! && l.timestamp <= args.toDate!
      );
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  },
});

// ============================================
// USER SESSIONS
// ============================================

export const createSession = mutation({
  args: {
    userId: v.id("userManagement"),
    userName: v.string(),
    sessionToken: v.string(),
    ipAddress: v.string(),
    userAgent: v.string(),
    deviceType: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("userSessions", {
      userId: args.userId,
      userName: args.userName,
      sessionToken: args.sessionToken,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      loginTime: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      isActive: true,
      deviceType: args.deviceType,
    });

    // Log login activity
    await ctx.db.insert("userActivityLog", {
      userId: args.userId,
      userName: args.userName,
      action: "login",
      actionType: "user",
      details: `${args.deviceType} থেকে লগইন`,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      status: "success",
      timestamp: Date.now(),
    });

    return sessionId;
  },
});

export const endSession = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db.query("userSessions").collect();
    const session = sessions.find((s) => s.sessionToken === args.sessionToken);

    if (session) {
      await ctx.db.patch(session._id, {
        isActive: false,
      });

      // Log logout activity
      await ctx.db.insert("userActivityLog", {
        userId: session.userId,
        userName: session.userName,
        action: "logout",
        actionType: "user",
        details: "লগ আউট",
        status: "success",
        timestamp: Date.now(),
      });

      return session._id;
    }

    throw new Error("সেশন খুঁজে পাওয়া যায়নি");
  },
});

export const getUserSessions = query({
  args: { userId: v.id("userManagement") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db.query("userSessions").collect();
    return sessions
      .filter((s) => s.userId === args.userId && s.isActive)
      .sort((a, b) => b.lastActivity - a.lastActivity);
  },
});

// ============================================
// USER PERMISSIONS
// ============================================

export const grantPermissionOverride = mutation({
  args: {
    userId: v.id("userManagement"),
    userName: v.string(),
    permission: v.string(),
    expiresAt: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.auth.getUserIdentity();
    if (!currentUser) throw new Error("Not authenticated");

    return await ctx.db.insert("userPermissionOverride", {
      userId: args.userId,
      userName: args.userName,
      permission: args.permission,
      grantedByName: currentUser.email || "System",
      grantedAt: Date.now(),
      expiresAt: args.expiresAt,
      reason: args.reason,
      isActive: true,
    });
  },
});

export const revokePermissionOverride = mutation({
  args: { id: v.id("userPermissionOverride") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: false,
    });
    return args.id;
  },
});

export const getUserPermissions = query({
  args: { userId: v.id("userManagement") },
  handler: async (ctx, args) => {
    const overrides = await ctx.db.query("userPermissionOverride").collect();
    return overrides
      .filter(
        (o) =>
          o.userId === args.userId &&
          o.isActive &&
          (!o.expiresAt || o.expiresAt > Date.now())
      )
      .map((o) => o.permission);
  },
});

// ============================================
// PASSWORD RESET
// ============================================

export const createPasswordResetToken = mutation({
  args: {
    userId: v.id("userManagement"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const token = base64Encode(`${args.email}-${Date.now()}`);

    return await ctx.db.insert("passwordResetTokens", {
      userId: args.userId,
      email: args.email,
      token,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
      isUsed: false,
      createdAt: Date.now(),
    });
  },
});

export const validatePasswordResetToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const tokens = await ctx.db.query("passwordResetTokens").collect();
    const resetToken = tokens.find((t) => t.token === args.token);

    if (!resetToken) {
      return { valid: false, message: "টোকেন খুঁজে পাওয়া যায়নি" };
    }

    if (resetToken.isUsed) {
      return { valid: false, message: "টোকেন ইতিমধ্যে ব্যবহৃত হয়েছে" };
    }

    if (resetToken.expiresAt < Date.now()) {
      return { valid: false, message: "টোকেন মেয়াদ উত্তীর্ণ হয়েছে" };
    }

    return { valid: true, userId: resetToken.userId, email: resetToken.email };
  },
});

export const resetPasswordWithToken = mutation({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const tokens = await ctx.db.query("passwordResetTokens").collect();
    const resetToken = tokens.find((t) => t.token === args.token);

    if (!resetToken) {
      throw new Error("টোকেন খুঁজে পাওয়া যায়নি");
    }

    if (resetToken.isUsed || resetToken.expiresAt < Date.now()) {
      throw new Error("টোকেন অবৈধ বা মেয়াদ উত্তীর্ণ");
    }

    const hashedPassword = base64Encode(args.newPassword);

    await ctx.db.patch(resetToken.userId, {
      password: hashedPassword,
      lastPasswordChange: Date.now(),
    });

    // Mark token as used
    await ctx.db.patch(resetToken._id, {
      isUsed: true,
      usedAt: Date.now(),
    });

    return resetToken.userId;
  },
});

// ============================================
// ANALYTICS & SUMMARY
// ============================================

export const getUserManagementSummary = query({
  args: { branchId: v.optional(v.id("branches")) },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("userManagement").collect();

    let filteredUsers = users;
    if (args.branchId) {
      filteredUsers = users.filter((u) => u.branchId === args.branchId);
    }

    const totalUsers = filteredUsers.length;
    const activeUsers = filteredUsers.filter((u) => u.status === "active").length;
    const inactiveUsers = filteredUsers.filter((u) => u.status === "inactive").length;
    const suspendedUsers = filteredUsers.filter((u) => u.status === "suspended").length;
    const superAdmins = filteredUsers.filter((u) => u.isSuperAdmin).length;
    const admins = filteredUsers.filter((u) => u.isAdmin).length;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      superAdmins,
      admins,
    };
  },
});
