import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    branchId: v.optional(v.id("branches")),
    position: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    let employees = await ctx.db.query("employees").collect();
    
    if (args.branchId) {
      employees = employees.filter(e => e.branchId === args.branchId);
    }
    
    if (args.position) {
      employees = employees.filter(e => e.position === args.position);
    }
    
    if (args.isActive !== undefined) {
      employees = employees.filter(e => e.isActive === args.isActive);
    }
    
    return employees;
  },
});

export const get = query({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    employeeId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    position: v.string(),
    branchId: v.id("branches"),
    salary: v.optional(v.number()),
    commissionRate: v.optional(v.number()),
    permissions: v.array(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(v.object({
      name: v.string(),
      phone: v.string(),
      relation: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // ✅ FIX #16: Validate permissions against allowed list
    const validPermissions = ["pos", "inventory", "reports", "customers", "settings"];
    const invalidPermissions = args.permissions.filter(p => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      throw new Error(`Invalid permissions: ${invalidPermissions.join(", ")}. Allowed: ${validPermissions.join(", ")}`);
    }

    // Check if employee ID already exists
    const existingEmployee = await ctx.db
      .query("employees")
      .withIndex("by_employee_id", (q) => q.eq("employeeId", args.employeeId))
      .first();

    if (existingEmployee) {
      throw new Error("Employee ID already exists");
    }

    // Get branch info
    const branch = await ctx.db.get(args.branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }

    const employeeId = await ctx.db.insert("employees", {
      employeeId: args.employeeId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      position: args.position,
      branchId: args.branchId,
      branchName: branch.name,
      salary: args.salary,
      commissionRate: args.commissionRate,
      permissions: args.permissions,
      isActive: true,
      hireDate: Date.now(),
      address: args.address,
      emergencyContact: args.emergencyContact,
    });

    return employeeId;
  },
});

export const update = mutation({
  args: {
    id: v.id("employees"),
    employeeId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    position: v.string(),
    branchId: v.id("branches"),
    salary: v.optional(v.number()),
    commissionRate: v.optional(v.number()),
    permissions: v.array(v.string()),
    isActive: v.boolean(),
    address: v.optional(v.string()),
    emergencyContact: v.optional(v.object({
      name: v.string(),
      phone: v.string(),
      relation: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // ✅ FIX #16: Validate permissions against allowed list
    const validPermissions = ["pos", "inventory", "reports", "customers", "settings"];
    const invalidPermissions = args.permissions.filter(p => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      throw new Error(`Invalid permissions: ${invalidPermissions.join(", ")}. Allowed: ${validPermissions.join(", ")}`);
    }

    const { id, ...updateData } = args;

    // Check if employee ID already exists (excluding current employee)
    const existingEmployee = await ctx.db
      .query("employees")
      .withIndex("by_employee_id", (q) => q.eq("employeeId", args.employeeId))
      .first();

    if (existingEmployee && existingEmployee._id !== id) {
      throw new Error("Employee ID already exists");
    }

    // Get branch info
    const branch = await ctx.db.get(args.branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }

    await ctx.db.patch(id, {
      ...updateData,
      branchName: branch.name,
    });

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if employee has any sales
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.id))
      .collect();

    if (sales.length > 0) {
      throw new Error("Cannot delete employee with existing sales records");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const getPerformance = query({
  args: {
    employeeId: v.id("employees"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new Error("Employee not found");

    let sales = await ctx.db
      .query("sales")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .collect();

    // Filter by date range if provided
    if (args.startDate && args.endDate) {
      sales = sales.filter(s => 
        s._creationTime >= args.startDate! && s._creationTime <= args.endDate!
      );
    }

    const completedSales = sales.filter(s => s.status === "completed");
    const totalSales = completedSales.length;
    const totalRevenue = completedSales.reduce((sum, s) => sum + s.total, 0);
    const totalCommission = employee.commissionRate 
      ? (totalRevenue * employee.commissionRate) / 100 
      : 0;

    // Calculate average sale value
    const averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Get top selling products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    completedSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.totalPrice;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      employee,
      totalSales,
      totalRevenue,
      totalCommission,
      averageSaleValue,
      topProducts,
      salesByMonth: completedSales.reduce((acc, sale) => {
        const month = new Date(sale._creationTime).toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + sale.total;
        return acc;
      }, {} as Record<string, number>),
    };
  },
});
