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
// EMPLOYEE QUERIES
// ============================================

export const listEmployees = query({
  args: {
    branchId: v.optional(v.id("branches")),
    department: v.optional(v.string()),
    status: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let employees = await ctx.db.query("hrEmployees").collect();

    if (args.branchId) {
      employees = employees.filter((e) => e.branchId === args.branchId);
    }

    if (args.department) {
      employees = employees.filter((e) => e.department === args.department);
    }

    if (args.status) {
      employees = employees.filter((e) => e.status === args.status);
    }

    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      employees = employees.filter(
        (e) =>
          e.fullName.toLowerCase().includes(term) ||
          e.employeeId.toLowerCase().includes(term) ||
          e.email?.toLowerCase().includes(term)
      );
    }

    return employees.sort((a, b) => a.fullName.localeCompare(b.fullName));
  },
});

export const getEmployeeById = query({
  args: { id: v.id("hrEmployees") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ============================================
// EMPLOYEE MUTATIONS
// ============================================

export const createEmployee = mutation({
  args: {
    employeeId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    dateOfBirth: v.number(),
    gender: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    nationality: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    department: v.string(),
    designation: v.string(),
    employmentType: v.string(),
    joinDate: v.number(),
    baseSalary: v.number(),
    grossSalary: v.number(),
    currency: v.string(),
    emergencyContactName: v.string(),
    emergencyContactPhone: v.string(),
    emergencyContactRelation: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("hrEmployees", {
      employeeId: args.employeeId,
      firstName: args.firstName,
      lastName: args.lastName,
      fullName: `${args.firstName} ${args.lastName}`,
      email: args.email,
      phone: args.phone,
      dateOfBirth: args.dateOfBirth,
      gender: args.gender,
      address: args.address,
      city: args.city,
      state: args.state,
      zipCode: args.zipCode,
      nationality: args.nationality,
      branchId: args.branchId,
      branchName: args.branchName,
      department: args.department,
      designation: args.designation,
      employmentType: args.employmentType,
      joinDate: args.joinDate,
      baseSalary: args.baseSalary,
      grossSalary: args.grossSalary,
      currency: args.currency,
      emergencyContactName: args.emergencyContactName,
      emergencyContactPhone: args.emergencyContactPhone,
      emergencyContactRelation: args.emergencyContactRelation,
      status: "active",
    });

    // Initialize leave balance for the year
    const now = new Date();
    await ctx.db.insert("hrLeaveBalance", {
      employeeId: id,
      employeeName: args.firstName + " " + args.lastName,
      year: now.getFullYear(),
      annualLeaveBalance: 12,
      annualLeaveUsed: 0,
      sickLeaveBalance: 6,
      sickLeaveUsed: 0,
      casualLeaveBalance: 5,
      casualLeaveUsed: 0,
      maternityLeaveBalance: 6,
      maternityLeaveUsed: 0,
      paternityLeaveBalance: 5,
      paternityLeaveUsed: 0,
      bereavementLeaveBalance: 3,
      bereavementLeaveUsed: 0,
    });

    // Initialize salary structure
    await ctx.db.insert("hrSalaryStructure", {
      employeeId: id,
      employeeName: args.firstName + " " + args.lastName,
      effectiveDate: args.joinDate,
      baseSalary: args.baseSalary,
      grossSalary: args.grossSalary,
      netSalary: args.grossSalary * 0.85, // Assuming 15% deductions
      status: "active",
    });

    // 🔄 SYNC: Create User Account for this employee if not exists
    const existingUser = await ctx.db
      .query("userManagement")
      .collect()
      .then((u) => u.find((user) => user.email === args.email));

    if (!existingUser) {
      try {
        const roleDefault = await ctx.db
          .query("userRoles")
          .collect()
          .then((r) => r.find((role) => role.roleName && role.roleName.includes("Staff")));

        if (roleDefault) {
          await ctx.db.insert("userManagement", {
            userId: `USER-${Date.now()}`,
            firstName: args.firstName,
            lastName: args.lastName,
            fullName: `${args.firstName} ${args.lastName}`,
            email: args.email,
            phone: args.phone,
            password: base64Encode("temp-" + args.email),
            roleId: roleDefault._id,
            roleName: roleDefault.roleName,
            branchId: args.branchId,
            branchName: args.branchName,
            department: args.department,
            designation: args.designation,
            joinDate: args.joinDate,
            status: "active",
            isSuperAdmin: false,
            isAdmin: false,
            canManageUsers: false,
            canManageRoles: false,
            canAccessReports: true,
            canAccessSettings: false,
            twoFactorEnabled: false,
            loginAttempts: 0,
            isLocked: false,
            createdByName: userId.email || "System",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      } catch (error) {
        // If user creation fails, continue with employee creation
        console.log("Could not create user account:", error);
      }
    }

    return id;
  },
});

export const updateEmployee = mutation({
  args: {
    id: v.id("hrEmployees"),
    updates: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      department: v.optional(v.string()),
      designation: v.optional(v.string()),
      baseSalary: v.optional(v.number()),
      grossSalary: v.optional(v.number()),
      status: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.id);
    if (!employee) throw new Error("Employee not found");

    const updates: any = { ...args.updates };
    if (args.updates.firstName || args.updates.lastName) {
      updates.fullName = `${args.updates.firstName || employee.firstName} ${
        args.updates.lastName || employee.lastName
      }`;
    }

    await ctx.db.patch(args.id, updates);

    // 🔄 SYNC: Update corresponding User Account
    const user = await ctx.db
      .query("userManagement")
      .collect()
      .then((u) => u.find((usr) => usr.email === employee.email));

    if (user) {
      const userUpdates: any = {};
      if (args.updates.firstName) userUpdates.firstName = args.updates.firstName;
      if (args.updates.lastName) userUpdates.lastName = args.updates.lastName;
      if (args.updates.firstName || args.updates.lastName) {
        userUpdates.fullName = `${args.updates.firstName || user.firstName} ${
          args.updates.lastName || user.lastName
        }`;
      }
      if (args.updates.phone) userUpdates.phone = args.updates.phone;
      if (args.updates.department) userUpdates.department = args.updates.department;
      if (args.updates.designation) userUpdates.designation = args.updates.designation;
      if (args.updates.status) userUpdates.status = args.updates.status;
      userUpdates.updatedAt = Date.now();

      if (Object.keys(userUpdates).length > 0) {
        await ctx.db.patch(user._id, userUpdates);
      }
    }

    return args.id;
  },
});

// ============================================
// ATTENDANCE QUERIES & MUTATIONS
// ============================================

export const getAttendanceByDate = query({
  args: {
    attendanceDate: v.number(),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    let attendance = await ctx.db.query("hrAttendance").collect();

    attendance = attendance.filter((a) => a.attendanceDate === args.attendanceDate);

    if (args.branchId) {
      attendance = attendance.filter((a) => a.branchId === args.branchId);
    }

    return attendance;
  },
});

export const getEmployeeAttendance = query({
  args: {
    employeeId: v.id("hrEmployees"),
    fromDate: v.number(),
    toDate: v.number(),
  },
  handler: async (ctx, args) => {
    const attendance = await ctx.db.query("hrAttendance").collect();
    return attendance.filter(
      (a) =>
        a.employeeId === args.employeeId &&
        a.attendanceDate >= args.fromDate &&
        a.attendanceDate <= args.toDate
    );
  },
});

export const markAttendance = mutation({
  args: {
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    attendanceDate: v.number(),
    status: v.string(),
    checkInTime: v.optional(v.number()),
    checkOutTime: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if attendance already marked for this day
    const existing = await ctx.db
      .query("hrAttendance")
      .collect()
      .then((a) =>
        a.find(
          (att) =>
            att.employeeId === args.employeeId &&
            att.attendanceDate === args.attendanceDate
        )
      );

    if (existing) {
      // Update existing
      const workingHours = args.checkInTime && args.checkOutTime 
        ? (args.checkOutTime - args.checkInTime) / (1000 * 60 * 60)
        : undefined;

      await ctx.db.patch(existing._id, {
        status: args.status,
        checkInTime: args.checkInTime,
        checkOutTime: args.checkOutTime,
        workingHours,
        notes: args.notes,
      });
      return existing._id;
    } else {
      // Create new
      const workingHours = args.checkInTime && args.checkOutTime 
        ? (args.checkOutTime - args.checkInTime) / (1000 * 60 * 60)
        : undefined;

      return await ctx.db.insert("hrAttendance", {
        employeeId: args.employeeId,
        employeeName: args.employeeName,
        branchId: args.branchId,
        branchName: args.branchName,
        attendanceDate: args.attendanceDate,
        status: args.status,
        checkInTime: args.checkInTime,
        checkOutTime: args.checkOutTime,
        workingHours,
        notes: args.notes,
      });
    }
  },
});

// ============================================
// LEAVE MANAGEMENT QUERIES & MUTATIONS
// ============================================

export const getLeaveRequests = query({
  args: {
    employeeId: v.optional(v.id("hrEmployees")),
    status: v.optional(v.string()),
    fromDate: v.optional(v.number()),
    toDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let leaves = await ctx.db.query("hrLeaves").collect();

    if (args.employeeId) {
      leaves = leaves.filter((l) => l.employeeId === args.employeeId);
    }

    if (args.status) {
      leaves = leaves.filter((l) => l.status === args.status);
    }

    if (args.fromDate && args.toDate) {
      leaves = leaves.filter(
        (l) => l.startDate >= args.fromDate! && l.endDate <= args.toDate!
      );
    }

    return leaves.sort((a, b) => b.startDate - a.startDate);
  },
});

export const requestLeave = mutation({
  args: {
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    leaveType: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    totalDays: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const leaveRequestId = `LR-${Date.now()}`;

    // Check leave balance
    const now = new Date();
    const balance = await ctx.db
      .query("hrLeaveBalance")
      .collect()
      .then((b) =>
        b.find(
          (x) => x.employeeId === args.employeeId && x.year === now.getFullYear()
        )
      );

    if (!balance) throw new Error("Leave balance not found");

    const balanceKey = `${args.leaveType}LeaveBalance` as keyof typeof balance;
    if (balance[balanceKey] && (balance[balanceKey] as number) < args.totalDays) {
      throw new Error(`Insufficient ${args.leaveType} leave balance`);
    }

    return await ctx.db.insert("hrLeaves", {
      leaveRequestId,
      employeeId: args.employeeId,
      employeeName: args.employeeName,
      branchId: args.branchId,
      branchName: args.branchName,
      leaveType: args.leaveType,
      startDate: args.startDate,
      endDate: args.endDate,
      totalDays: args.totalDays,
      reason: args.reason,
      status: "pending",
      requestedAt: Date.now(),
    });
  },
});

export const approveLeave = mutation({
  args: {
    leaveId: v.id("hrLeaves"),
    approvedBy: v.id("hrEmployees"),
    approvedByName: v.string(),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const leave = await ctx.db.get(args.leaveId);
    if (!leave) throw new Error("Leave request not found");

    // Update leave status
    await ctx.db.patch(args.leaveId, {
      status: "approved",
      approvedBy: args.approvedBy,
      approvedByName: args.approvedByName,
      approvalDate: Date.now(),
      comments: args.comments,
    });

    // Update leave balance
    const now = new Date();
    const balance = await ctx.db
      .query("hrLeaveBalance")
      .collect()
      .then((b) =>
        b.find(
          (x) => x.employeeId === leave.employeeId && x.year === now.getFullYear()
        )
      );

    if (balance) {
      const usedKey = `${leave.leaveType}LeaveUsed` as keyof typeof balance;
      const currentUsed = (balance[usedKey] as number) || 0;
      await ctx.db.patch(balance._id, {
        [usedKey]: currentUsed + leave.totalDays,
      });
    }

    return args.leaveId;
  },
});

export const rejectLeave = mutation({
  args: {
    leaveId: v.id("hrLeaves"),
    rejectionReason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.leaveId, {
      status: "rejected",
      rejectionReason: args.rejectionReason,
    });
    return args.leaveId;
  },
});

// ============================================
// OVERTIME MANAGEMENT
// ============================================

export const getOvertimeRecords = query({
  args: {
    employeeId: v.optional(v.id("hrEmployees")),
    status: v.optional(v.string()),
    fromDate: v.optional(v.number()),
    toDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let overtime = await ctx.db.query("hrOvertime").collect();

    if (args.employeeId) {
      overtime = overtime.filter((o) => o.employeeId === args.employeeId);
    }

    if (args.status) {
      overtime = overtime.filter((o) => o.status === args.status);
    }

    if (args.fromDate && args.toDate) {
      overtime = overtime.filter(
        (o) => o.overtimeDate >= args.fromDate! && o.overtimeDate <= args.toDate!
      );
    }

    return overtime.sort((a, b) => b.overtimeDate - a.overtimeDate);
  },
});

export const addOvertimeRecord = mutation({
  args: {
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    overtimeDate: v.number(),
    overtimeHours: v.number(),
    overtimeRate: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const totalAmount = args.overtimeHours * args.overtimeRate * 100; // Assuming hourly rate

    return await ctx.db.insert("hrOvertime", {
      employeeId: args.employeeId,
      employeeName: args.employeeName,
      branchId: args.branchId,
      branchName: args.branchName,
      overtimeDate: args.overtimeDate,
      overtimeHours: args.overtimeHours,
      overtimeRate: args.overtimeRate,
      totalAmount,
      reason: args.reason,
      status: "pending",
    });
  },
});

export const approveOvertime = mutation({
  args: {
    overtimeId: v.id("hrOvertime"),
    approvedBy: v.id("hrEmployees"),
    approvedByName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.overtimeId, {
      status: "approved",
      approvedBy: args.approvedBy,
      approvedByName: args.approvedByName,
    });
    return args.overtimeId;
  },
});

// ============================================
// PAYROLL MANAGEMENT
// ============================================

export const getPayrollByMonth = query({
  args: {
    payrollMonth: v.number(),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    let payroll = await ctx.db.query("hrPayroll").collect();

    payroll = payroll.filter((p) => p.payrollMonth === args.payrollMonth);

    if (args.branchId) {
      payroll = payroll.filter((p) => p.branchId === args.branchId);
    }

    return payroll;
  },
});

export const generatePayroll = mutation({
  args: {
    payrollMonth: v.number(),
    payrollYear: v.number(),
    payrollMonthName: v.string(),
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    // Get all active employees of the branch
    const employees = await ctx.db
      .query("hrEmployees")
      .collect()
      .then((e) =>
        e.filter((emp) => emp.branchId === args.branchId && emp.status === "active")
      );

    const createdPayrolls = [];

    for (const employee of employees) {
      const payrollId = `PAYROLL-${args.payrollYear}-${String(args.payrollMonth).padStart(2, "0")}`;

      // Get salary structure
      const salaryStructure = await ctx.db
        .query("hrSalaryStructure")
        .collect()
        .then((s) => s.filter((x) => x.employeeId === employee._id).pop());

      // Get approved overtime for the month
      const overtimeRecords = await ctx.db
        .query("hrOvertime")
        .collect()
        .then((o) =>
          o.filter(
            (x) =>
              x.employeeId === employee._id &&
              new Date(x.overtimeDate).getMonth() === args.payrollMonth - 1 &&
              x.status === "approved"
          )
        );

      const overtimeAmount = overtimeRecords.reduce((sum, o) => sum + o.totalAmount, 0);

      // 🔄 SYNC: Get approved bonuses for the month
      const bonusRecords = await ctx.db
        .query("hrBonusIncentive")
        .collect()
        .then((b) =>
          b.filter(
            (x) =>
              x.employeeId === employee._id &&
              x.status === "approved" &&
              (!x._creationTime || new Date(x._creationTime).getMonth() === args.payrollMonth - 1)
          )
        );

      const bonusAmount = bonusRecords.reduce((sum, b) => sum + b.amount, 0);
      const incentiveAmount = bonusRecords
        .filter((b) => b.bonusType === "performance" || b.bonusType === "sales")
        .reduce((sum, b) => sum + b.amount, 0);

      const grossSalary = salaryStructure?.grossSalary || employee.grossSalary;
      const epfDeduction = grossSalary * 0.12; // 12% EPF
      const esiDeduction = grossSalary * 0.0175; // 1.75% ESI
      const professionalTax = 200; // Fixed
      const incomeTaxDeduction = grossSalary * 0.1; // 10% income tax

      const totalDeductions =
        epfDeduction + esiDeduction + professionalTax + incomeTaxDeduction;
      const totalEarnings = grossSalary + overtimeAmount + bonusAmount + incentiveAmount;
      const netSalary = totalEarnings - totalDeductions;

      createdPayrolls.push(
        await ctx.db.insert("hrPayroll", {
          payrollId,
          payrollMonth: args.payrollMonth,
          payrollYear: args.payrollYear,
          payrollMonthName: args.payrollMonthName,
          employeeId: employee._id,
          employeeName: employee.fullName,
          branchId: args.branchId,
          branchName: employee.branchName,
          baseSalary: employee.baseSalary,
          allowances: 0,
          grossSalary,
          overtimeAmount,
          bonusAmount,
          incentiveAmount,
          totalEarnings,
          epfDeduction,
          esiDeduction,
          professionalTax,
          incomeTaxDeduction,
          otherDeductions: 0,
          totalDeductions,
          netSalary,
          status: "calculated",
        })
      );
    }

    return createdPayrolls;
  },
});

export const approvePayroll = mutation({
  args: {
    payrollId: v.id("hrPayroll"),
    approvedBy: v.id("users"),
    approvedByName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.payrollId, {
      status: "approved",
      approvedBy: args.approvedBy,
      approvedByName: args.approvedByName,
      approvalDate: Date.now(),
    });
    return args.payrollId;
  },
});

export const processPayrollPayment = mutation({
  args: {
    payrollId: v.id("hrPayroll"),
    paymentMethod: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.payrollId, {
      status: "paid",
      paidDate: Date.now(),
      paymentMethod: args.paymentMethod,
      notes: args.notes,
    });
    return args.payrollId;
  },
});

// ============================================
// BONUS & INCENTIVE MANAGEMENT
// ============================================

export const addBonus = mutation({
  args: {
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    bonusType: v.string(),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const bonusId = `BONUS-${Date.now()}`;

    return await ctx.db.insert("hrBonusIncentive", {
      bonusId,
      employeeId: args.employeeId,
      employeeName: args.employeeName,
      branchId: args.branchId,
      branchName: args.branchName,
      bonusType: args.bonusType,
      amount: args.amount,
      basedOn: args.reason,
      reason: args.reason,
      status: "pending",
    });
  },
});

export const getBonusRecords = query({
  args: {
    employeeId: v.optional(v.id("hrEmployees")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let bonuses = await ctx.db.query("hrBonusIncentive").collect();

    if (args.employeeId) {
      bonuses = bonuses.filter((b) => b.employeeId === args.employeeId);
    }

    if (args.status) {
      bonuses = bonuses.filter((b) => b.status === args.status);
    }

    return bonuses.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const approveBonus = mutation({
  args: {
    bonusId: v.id("hrBonusIncentive"),
    approvedBy: v.id("hrEmployees"),
    approvedByName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bonusId, {
      status: "approved",
      approvedBy: args.approvedBy,
      approvedByName: args.approvedByName,
      approvalDate: Date.now(),
    });
    return args.bonusId;
  },
});

// ============================================
// PERFORMANCE MANAGEMENT
// ============================================

export const createPerformanceReview = mutation({
  args: {
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    reportingManagerId: v.id("hrEmployees"),
    reportingManagerName: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    evaluationPeriodStart: v.number(),
    evaluationPeriodEnd: v.number(),
    technicalSkills: v.optional(v.number()),
    communicationSkills: v.optional(v.number()),
    teamworkSkills: v.optional(v.number()),
    leadershipSkills: v.optional(v.number()),
    strengths: v.string(),
    areasForImprovement: v.string(),
  },
  handler: async (ctx, args) => {
    const performanceId = `PERF-${Date.now()}`;

    // Calculate overall score
    const skills = [
      args.technicalSkills || 0,
      args.communicationSkills || 0,
      args.teamworkSkills || 0,
      args.leadershipSkills || 0,
    ].filter((s) => s > 0);
    const overallScore = skills.length > 0 ? skills.reduce((a, b) => a + b, 0) / skills.length : 0;

    return await ctx.db.insert("hrPerformance", {
      performanceId,
      employeeId: args.employeeId,
      employeeName: args.employeeName,
      reportingManagerId: args.reportingManagerId,
      reportingManagerName: args.reportingManagerName,
      branchId: args.branchId,
      branchName: args.branchName,
      evaluationPeriodStart: args.evaluationPeriodStart,
      evaluationPeriodEnd: args.evaluationPeriodEnd,
      kpis: [],
      overallScore,
      technicalSkills: args.technicalSkills,
      communicationSkills: args.communicationSkills,
      teamworkSkills: args.teamworkSkills,
      leadershipSkills: args.leadershipSkills,
      strengths: args.strengths,
      areasForImprovement: args.areasForImprovement,
      status: "draft",
    });
  },
});

export const getPerformanceReviews = query({
  args: {
    employeeId: v.optional(v.id("hrEmployees")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let reviews = await ctx.db.query("hrPerformance").collect();

    if (args.employeeId) {
      reviews = reviews.filter((r) => r.employeeId === args.employeeId);
    }

    if (args.status) {
      reviews = reviews.filter((r) => r.status === args.status);
    }

    return reviews.sort((a, b) => b.evaluationPeriodEnd - a.evaluationPeriodEnd);
  },
});

export const submitPerformanceReview = mutation({
  args: {
    performanceId: v.id("hrPerformance"),
    reviewer: v.id("users"),
    reviewerName: v.string(),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.performanceId, {
      status: "submitted",
      reviewer: args.reviewer,
      reviewerName: args.reviewerName,
      reviewDate: Date.now(),
      comments: args.comments,
    });
    return args.performanceId;
  },
});

// ============================================
// SALARY REVISION
// ============================================

export const createSalaryRevision = mutation({
  args: {
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    effectiveDate: v.number(),
    oldSalary: v.number(),
    newSalary: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const revisionId = `SALREV-${Date.now()}`;
    const percentageIncrease = ((args.newSalary - args.oldSalary) / args.oldSalary) * 100;

    return await ctx.db.insert("hrSalaryRevision", {
      revisionId,
      employeeId: args.employeeId,
      employeeName: args.employeeName,
      effectiveDate: args.effectiveDate,
      oldSalary: args.oldSalary,
      newSalary: args.newSalary,
      percentageIncrease,
      reason: args.reason,
      status: "pending",
    });
  },
});

export const getSalaryRevisions = query({
  args: {
    employeeId: v.optional(v.id("hrEmployees")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let revisions = await ctx.db.query("hrSalaryRevision").collect();

    if (args.employeeId) {
      revisions = revisions.filter((r) => r.employeeId === args.employeeId);
    }

    if (args.status) {
      revisions = revisions.filter((r) => r.status === args.status);
    }

    return revisions.sort((a, b) => b.effectiveDate - a.effectiveDate);
  },
});

export const approveSalaryRevision = mutation({
  args: {
    revisionId: v.id("hrSalaryRevision"),
    approvedBy: v.id("hrEmployees"),
    approvedByName: v.string(),
  },
  handler: async (ctx, args) => {
    const revision = await ctx.db.get(args.revisionId);
    if (!revision) throw new Error("Revision not found");

    // Update employee salary
    await ctx.db.patch(revision.employeeId, {
      baseSalary: revision.newSalary,
      grossSalary: revision.newSalary,
    });

    // Update revision status
    await ctx.db.patch(args.revisionId, {
      status: "approved",
      approvedBy: args.approvedBy,
      approvedByName: args.approvedByName,
      approvalDate: Date.now(),
    });

    return args.revisionId;
  },
});

// ============================================
// SUMMARY & ANALYTICS
// ============================================

export const getHRSummary = query({
  args: { branchId: v.optional(v.id("branches")) },
  handler: async (ctx, args) => {
    const employees = await ctx.db.query("hrEmployees").collect();
    const payrolls = await ctx.db.query("hrPayroll").collect();
    const leaves = await ctx.db.query("hrLeaves").collect();

    let filteredEmployees = employees;
    let filteredPayrolls = payrolls;
    let filteredLeaves = leaves;

    if (args.branchId) {
      filteredEmployees = employees.filter((e) => e.branchId === args.branchId);
      filteredPayrolls = payrolls.filter((p) => p.branchId === args.branchId);
      filteredLeaves = leaves.filter((l) => l.branchId === args.branchId);
    }

    const totalEmployees = filteredEmployees.filter((e) => e.status === "active").length;
    const totalPayroll = filteredPayrolls
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.netSalary, 0);
    const activeLeaves = filteredLeaves.filter((l) => l.status === "approved").length;
    const pendingApprovals = filteredLeaves.filter((l) => l.status === "pending").length;

    return {
      totalEmployees,
      totalPayroll,
      activeLeaves,
      pendingApprovals,
      departmentCount: [...new Set(filteredEmployees.map((e) => e.department))].length,
    };
  },
});
