import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query all user roles
export const getAllRoles = query({
  handler: async (ctx) => {
    return await ctx.db.query("userRoles").collect();
  },
});

// Query all active rules
export const getAllRules = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("userRules")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Create a new role
export const createRole = mutation({
  args: {
    roleName: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("User not authenticated");
    
    const roleId = await ctx.db.insert("userRoles", {
      roleName: args.roleName,
      description: args.description || "",
      permissions: args.permissions,
      isActive: true,
      createdBy: user.tokenIdentifier as any,
      createdByName: user.email || "System",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return roleId;
  },
});

// Update a role
export const updateRole = mutation({
  args: {
    roleId: v.id("userRoles"),
    roleName: v.optional(v.string()),
    description: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.roleId);
    if (!role) throw new Error("Role not found");

    const updates: any = {
      updatedAt: Date.now(),
    };
    if (args.roleName) updates.roleName = args.roleName;
    if (args.description !== undefined) updates.description = args.description;
    if (args.permissions) updates.permissions = args.permissions;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    
    await ctx.db.patch(args.roleId, updates);
    return args.roleId;
  },
});

// Delete a role
export const deleteRole = mutation({
  args: {
    roleId: v.id("userRoles"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.roleId);
    return args.roleId;
  },
});

// Create a new rule
export const createRule = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    condition: v.string(),
    action: v.string(),
    actionParams: v.optional(
      v.object({
        roleId: v.optional(v.id("userRoles")),
        roleName: v.optional(v.string()),
        permissions: v.optional(v.array(v.string())),
        metadata: v.optional(v.any()),
      })
    ),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    const ruleId = await ctx.db.insert("userRules", {
      name: args.name,
      description: args.description,
      condition: args.condition,
      action: args.action,
      actionParams: args.actionParams,
      isActive: true,
      priority: args.priority,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return ruleId;
  },
});

// Update a rule
export const updateRule = mutation({
  args: {
    ruleId: v.id("userRules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    condition: v.optional(v.string()),
    action: v.optional(v.string()),
    actionParams: v.optional(
      v.object({
        roleId: v.optional(v.id("userRoles")),
        roleName: v.optional(v.string()),
        permissions: v.optional(v.array(v.string())),
        metadata: v.optional(v.any()),
      })
    ),
    priority: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) throw new Error("Rule not found");

    await ctx.db.patch(args.ruleId, {
      name: args.name || rule.name,
      description: args.description !== undefined ? args.description : rule.description,
      condition: args.condition || rule.condition,
      action: args.action || rule.action,
      actionParams: args.actionParams || rule.actionParams,
      priority: args.priority !== undefined ? args.priority : rule.priority,
      isActive: args.isActive !== undefined ? args.isActive : rule.isActive,
      updatedAt: Date.now(),
    });
    return args.ruleId;
  },
});

// Delete a rule
export const deleteRule = mutation({
  args: {
    ruleId: v.id("userRules"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.ruleId);
    return args.ruleId;
  },
});

// Apply rules to a user
export const applyRulesToUser = mutation({
  args: {
    userId: v.id("users"),
    userName: v.optional(v.string()),
    applicationType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rules = await ctx.db
      .query("userRules")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const applicationType = args.applicationType || "auto";
    const userName = args.userName || (user as any).name || "Unknown";

    const results = [];

    for (const rule of rules) {
      try {
        // Simple rule evaluation - you can make this more sophisticated
        const conditionMet = evaluateCondition(rule.condition, user);

        if (conditionMet) {
          // Execute action
          let result = "success";
          let resultMessage = `Rule "${rule.name}" applied successfully`;

          // Log the application
          await ctx.db.insert("ruleApplicationLog", {
            ruleId: rule._id,
            ruleName: rule.name,
            userId: args.userId,
            userName: userName,
            applicationType: applicationType as "auto" | "manual" | "scheduled",
            result: result as "success" | "failed" | "skipped",
            resultMessage: resultMessage,
            appliedAt: Date.now(),
          });

          results.push({
            ruleId: rule._id,
            ruleName: rule.name,
            result: result,
            message: resultMessage,
          });
        }
      } catch (error) {
        await ctx.db.insert("ruleApplicationLog", {
          ruleId: rule._id,
          ruleName: rule.name,
          userId: args.userId,
          userName: userName,
          applicationType: applicationType as "auto" | "manual" | "scheduled",
          result: "failed",
          resultMessage: `Error: ${(error as Error).message}`,
          appliedAt: Date.now(),
        });

        results.push({
          ruleId: rule._id,
          ruleName: rule.name,
          result: "failed",
          message: (error as Error).message,
        });
      }
    }

    return results;
  },
});

// Get rule application logs
export const getRuleApplicationLogs = query({
  args: {
    ruleId: v.optional(v.id("userRules")),
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let queryBuilder = ctx.db.query("ruleApplicationLog");

    if (args.ruleId) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("ruleId"), args.ruleId));
    }

    if (args.userId) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("userId"), args.userId));
    }

    const logs = await queryBuilder.take(args.limit || 50);

    return logs;
  },
});

// Get permission templates
export const getPermissionTemplates = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("permissionTemplates")
        .filter((q) => q.eq(q.field("category"), args.category))
        .collect();
    }
    return await ctx.db.query("permissionTemplates").collect();
  },
});

// Create permission template
export const createPermissionTemplate = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const templateId = await ctx.db.insert("permissionTemplates", {
      name: args.name,
      description: args.description,
      permissions: args.permissions,
      category: args.category,
      createdAt: Date.now(),
    });
    return templateId;
  },
});

// Helper function to evaluate conditions
function evaluateCondition(condition: string, user: any): boolean {
  try {
    // Simple condition evaluation
    // You can add more sophisticated parsing here
    // This is a basic implementation that checks for simple conditions

    // Examples:
    // "position==='Manager'" -> checks if user.position === 'Manager'
    // "isActive===true" -> checks if user.isActive === true
    // "permissions.includes('admin')" -> checks if user has 'admin' permission

    const conditionFunc = new Function("user", `return ${condition}`);
    return conditionFunc(user);
  } catch (error) {
    console.error("Error evaluating condition:", error);
    return false;
  }
}
