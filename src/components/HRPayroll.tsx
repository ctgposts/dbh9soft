import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import {
  Users,
  Calendar,
  Clock,
  DollarSign,
  Award,
  TrendingUp,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Filter,
  Search,
  Edit2,
} from "lucide-react";

interface Employee {
  _id: Id<"hrEmployees">;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  branchId: Id<"branches">;
  branchName: string;
  baseSalary: number;
  grossSalary: number;
  status: string;
  joinDate: number;
}

interface Attendance {
  _id: Id<"hrAttendance">;
  employeeId: Id<"hrEmployees">;
  employeeName: string;
  attendanceDate: number;
  status: string;
  checkInTime?: number;
  checkOutTime?: number;
  workingHours?: number;
}

interface Leave {
  _id: Id<"hrLeaves">;
  employeeId: Id<"hrEmployees">;
  employeeName: string;
  leaveType: string;
  startDate: number;
  endDate: number;
  totalDays: number;
  reason: string;
  status: string;
  approvedBy?: Id<"hrEmployees">;
  approvalDate?: number;
}

interface Payroll {
  _id: Id<"hrPayroll">;
  employeeId: Id<"hrEmployees">;
  employeeName: string;
  payrollMonthName: string;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  paidDate?: number;
}

interface Performance {
  _id: Id<"hrPerformance">;
  employeeId: Id<"hrEmployees">;
  employeeName: string;
  evaluationPeriodStart: number;
  evaluationPeriodEnd: number;
  overallScore: number;
  status: string;
}

export default function HRPayroll() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Employees
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "male",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    nationality: "",
    branchId: "",
    branchName: "",
    department: "",
    designation: "",
    employmentType: "permanent",
    joinDate: "",
    baseSalary: 0,
    grossSalary: 0,
    currency: "BDT",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
  });
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);

  // Attendance
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceData, setAttendanceData] = useState({
    employeeId: "",
    status: "present",
    checkInTime: "",
    checkOutTime: "",
    notes: "",
  });

  // Leave
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveData, setLeaveData] = useState({
    employeeId: "",
    leaveType: "annual",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Payroll
  const [showPayrollForm, setShowPayrollForm] = useState(false);
  const [payrollDate, setPayrollDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState(new Date().getMonth() + 1);
  const [selectedPayrollYear, setSelectedPayrollYear] = useState(new Date().getFullYear());
  const [selectedPayrollForDetail, setSelectedPayrollForDetail] = useState<Payroll | null>(null);

  // Performance
  const [showPerformanceForm, setShowPerformanceForm] = useState(false);
  const [performanceData, setPerformanceData] = useState({
    employeeId: "",
    reportingManagerId: "",
    evaluationPeriodStart: "",
    evaluationPeriodEnd: "",
    technicalSkills: 5,
    communicationSkills: 5,
    teamworkSkills: 5,
    leadershipSkills: 5,
    strengths: "",
    areasForImprovement: "",
  });
  const [isSubmittingPerformance, setIsSubmittingPerformance] = useState(false);

  // Leave approval
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [approvalComment, setApprovalComment] = useState("");

  // Performance detail
  const [selectedPerformance, setSelectedPerformance] = useState<Performance | null>(null);

  // Attendance history
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [selectedAttendanceDateRange, setSelectedAttendanceDateRange] = useState({
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
  });

  // Queries
  const employees = useQuery(api.hr.listEmployees, {});
  const branches = useQuery(api.branches.list, {});
  const categories = useQuery(api.categories.list, {});
  const payrolls = useQuery(api.hr.getPayrollByMonth, {
    payrollMonth: selectedPayrollMonth,
  });
  const leaves = useQuery(api.hr.getLeaveRequests, {});
  const hrSummary = useQuery(api.hr.getHRSummary, {});
  const performances = useQuery(api.hr.getPerformanceReviews, {});
  
  // Attendance query with date range
  const attendanceQuery = useQuery(api.hr.getEmployeeAttendance, {
    employeeId: selectedEmployee?._id || ("" as Id<"hrEmployees">),
    fromDate: selectedAttendanceDateRange.fromDate ? new Date(selectedAttendanceDateRange.fromDate).getTime() : 0,
    toDate: selectedAttendanceDateRange.toDate ? new Date(selectedAttendanceDateRange.toDate).getTime() : Date.now(),
  });

  // UseEffect to populate attendance records when query updates
  useEffect(() => {
    if (attendanceQuery) {
      setAttendanceRecords(attendanceQuery);
    }
  }, [attendanceQuery]);

  // Mutations
  const createEmployee = useMutation(api.hr.createEmployee);
  const markAttendance = useMutation(api.hr.markAttendance);
  const requestLeave = useMutation(api.hr.requestLeave);
  const approveLeave = useMutation(api.hr.approveLeave);
  const rejectLeave = useMutation(api.hr.rejectLeave);
  const generatePayroll = useMutation(api.hr.generatePayroll);
  const approvePayroll = useMutation(api.hr.approvePayroll);
  const createPerformanceReview = useMutation(api.hr.createPerformanceReview);
  const updateEmployee = useMutation(api.hr.updateEmployee);
  const processPayrollPayment = useMutation(api.hr.processPayrollPayment);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.firstName || !newEmployee.email || !newEmployee.branchId) {
      toast.error("অনুগ্রহ করে সব প্রয়োজনীয় ফিল্ড পূরণ করুন");
      return;
    }

    setIsSubmittingEmployee(true);
    try {
      const branch = branches?.find((b) => b._id === newEmployee.branchId);
      await createEmployee({
        employeeId: newEmployee.employeeId,
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        email: newEmployee.email,
        phone: newEmployee.phone,
        dateOfBirth: new Date(newEmployee.dateOfBirth).getTime(),
        gender: newEmployee.gender,
        address: newEmployee.address,
        city: newEmployee.city,
        state: newEmployee.state,
        zipCode: newEmployee.zipCode,
        nationality: newEmployee.nationality,
        branchId: newEmployee.branchId as Id<"branches">,
        branchName: branch?.name || "",
        department: newEmployee.department,
        designation: newEmployee.designation,
        employmentType: newEmployee.employmentType,
        joinDate: new Date(newEmployee.joinDate).getTime(),
        baseSalary: newEmployee.baseSalary,
        grossSalary: newEmployee.grossSalary,
        currency: newEmployee.currency,
        emergencyContactName: newEmployee.emergencyContactName,
        emergencyContactPhone: newEmployee.emergencyContactPhone,
        emergencyContactRelation: newEmployee.emergencyContactRelation,
      });

      toast.success("কর্মচারী সফলভাবে যুক্ত হয়েছে!");
      setShowAddEmployee(false);
      setNewEmployee({
        employeeId: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "male",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        nationality: "",
        branchId: "",
        branchName: "",
        department: "",
        designation: "",
        employmentType: "permanent",
        joinDate: "",
        baseSalary: 0,
        grossSalary: 0,
        currency: "BDT",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelation: "",
      });
    } catch (error) {
      toast.error("কর্মচারী যুক্ত করতে ব্যর্থ");
      console.error(error);
    } finally {
      setIsSubmittingEmployee(false);
    }
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceData.employeeId) {
      toast.error("কর্মচারী নির্বাচন করুন");
      return;
    }

    try {
      const employee = employees?.find(
        (e) => e._id === attendanceData.employeeId
      );

      const checkInTime = attendanceData.checkInTime
        ? new Date(`${selectedDate}T${attendanceData.checkInTime}`).getTime()
        : undefined;
      const checkOutTime = attendanceData.checkOutTime
        ? new Date(`${selectedDate}T${attendanceData.checkOutTime}`).getTime()
        : undefined;

      await markAttendance({
        employeeId: attendanceData.employeeId as Id<"hrEmployees">,
        employeeName: employee?.fullName || "",
        branchId: employee?.branchId || ("" as Id<"branches">),
        branchName: employee?.branchName || "",
        attendanceDate: new Date(selectedDate).getTime(),
        status: attendanceData.status,
        checkInTime,
        checkOutTime,
        notes: attendanceData.notes,
      });

      toast.success("উপস্থিতি রেকর্ড করা হয়েছে!");
      setShowAttendanceForm(false);
      setAttendanceData({
        employeeId: "",
        status: "present",
        checkInTime: "",
        checkOutTime: "",
        notes: "",
      });
    } catch (error) {
      toast.error("উপস্থিতি রেকর্ড করতে ব্যর্থ");
      console.error(error);
    }
  };

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !leaveData.employeeId ||
      !leaveData.startDate ||
      !leaveData.endDate ||
      !leaveData.reason
    ) {
      toast.error("অনুগ্রহ করে সব প্রয়োজনীয় ফিল্ড পূরণ করুন");
      return;
    }

    setIsSubmittingLeave(true);
    try {
      const employee = employees?.find((e) => e._id === leaveData.employeeId);
      const startDate = new Date(leaveData.startDate).getTime();
      const endDate = new Date(leaveData.endDate).getTime();
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      await requestLeave({
        employeeId: leaveData.employeeId as Id<"hrEmployees">,
        employeeName: employee?.fullName || "",
        branchId: employee?.branchId || ("" as Id<"branches">),
        branchName: employee?.branchName || "",
        leaveType: leaveData.leaveType,
        startDate,
        endDate,
        totalDays,
        reason: leaveData.reason,
      });

      toast.success("ছুটির অনুরোধ জমা দেওয়া হয়েছে!");
      setShowLeaveForm(false);
      setLeaveData({
        employeeId: "",
        leaveType: "annual",
        startDate: "",
        endDate: "",
        reason: "",
      });
    } catch (error) {
      toast.error("ছুটির অনুরোধ জমা দিতে ব্যর্থ");
      console.error(error);
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const handleApproveLeave = async (leaveId: Id<"hrLeaves">) => {
    try {
      // Use the first HR manager or a default manager ID
      const manager = employees?.find((e) => e.department === "HR") || employees?.[0];
      if (!manager) {
        toast.error("কোনো ম্যানেজার পাওয়া যায়নি");
        return;
      }
      await approveLeave({
        leaveId,
        approvedBy: manager._id,
        approvedByName: manager.fullName,
        comments: approvalComment,
      });
      toast.success("ছুটি অনুমোদিত হয়েছে!");
      setSelectedLeave(null);
      setApprovalComment("");
    } catch (error) {
      toast.error("ছুটি অনুমোদন করতে ব্যর্থ");
      console.error(error);
    }
  };

  const handleRejectLeave = async (leaveId: Id<"hrLeaves">) => {
    try {
      await rejectLeave({
        leaveId,
        rejectionReason: approvalComment || "প্রশাসকীয় কারণে প্রত্যাখ্যাত",
      });
      toast.success("ছুটি প্রত্যাখ্যাত হয়েছে!");
      setSelectedLeave(null);
      setApprovalComment("");
    } catch (error) {
      toast.error("ছুটি প্রত্যাখ্যান করতে ব্যর্থ");
      console.error(error);
    }
  };

  const handleCreatePerformanceReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!performanceData.employeeId || !performanceData.reportingManagerId) {
      toast.error("কর্মচারী এবং ম্যানেজার নির্বাচন করুন");
      return;
    }

    setIsSubmittingPerformance(true);
    try {
      const employee = employees?.find((e) => e._id === performanceData.employeeId);
      const manager = employees?.find((e) => e._id === performanceData.reportingManagerId);

      await createPerformanceReview({
        employeeId: performanceData.employeeId as Id<"hrEmployees">,
        employeeName: employee?.fullName || "",
        reportingManagerId: performanceData.reportingManagerId as Id<"hrEmployees">,
        reportingManagerName: manager?.fullName || "",
        branchId: employee?.branchId || ("" as Id<"branches">),
        branchName: employee?.branchName || "",
        evaluationPeriodStart: new Date(performanceData.evaluationPeriodStart).getTime(),
        evaluationPeriodEnd: new Date(performanceData.evaluationPeriodEnd).getTime(),
        technicalSkills: performanceData.technicalSkills,
        communicationSkills: performanceData.communicationSkills,
        teamworkSkills: performanceData.teamworkSkills,
        leadershipSkills: performanceData.leadershipSkills,
        strengths: performanceData.strengths,
        areasForImprovement: performanceData.areasForImprovement,
      });

      toast.success("পারফরম্যান্স রিভিউ তৈরি হয়েছে!");
      setShowPerformanceForm(false);
      setPerformanceData({
        employeeId: "",
        reportingManagerId: "",
        evaluationPeriodStart: "",
        evaluationPeriodEnd: "",
        technicalSkills: 5,
        communicationSkills: 5,
        teamworkSkills: 5,
        leadershipSkills: 5,
        strengths: "",
        areasForImprovement: "",
      });
    } catch (error) {
      toast.error("পারফরম্যান্স রিভিউ তৈরি করতে ব্যর্থ");
      console.error(error);
    } finally {
      setIsSubmittingPerformance(false);
    }
  };

  const handleApprovePayroll = async (payrollId: Id<"hrPayroll">) => {
    try {
      // Use a default admin user ID - in production, get this from auth context
      const adminUserId = "admin" as Id<"users">;
      await approvePayroll({
        payrollId,
        approvedBy: adminUserId,
        approvedByName: "Admin",
      });
      toast.success("বেতন অনুমোদিত হয়েছে!");
    } catch (error) {
      toast.error("বেতন অনুমোদন করতে ব্যর্থ");
      console.error(error);
    }
  };

  const handleProcessPayrollPayment = async (payrollId: Id<"hrPayroll">) => {
    try {
      await processPayrollPayment({
        payrollId,
        paymentMethod: "bank_transfer",
        notes: "বেতন পেমেন্ট প্রক্রিয়া করা হয়েছে",
      });
      toast.success("বেতন পেমেন্ট সম্পন্ন হয়েছে!");
    } catch (error) {
      toast.error("বেতন পেমেন্ট প্রক্রিয়া করতে ব্যর্থ");
      console.error(error);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!selectedBranch) {
      toast.error("শাখা নির্বাচন করুন");
      return;
    }

    try {
      const now = new Date();
      const monthName = now.toLocaleDateString("bn-BD", { month: "long", year: "numeric" });

      await generatePayroll({
        payrollMonth: now.getMonth() + 1,
        payrollYear: now.getFullYear(),
        payrollMonthName: monthName,
        branchId: selectedBranch as Id<"branches">,
      });

      toast.success("বেতন তালিকা তৈরি করা হয়েছে!");
      setShowPayrollForm(false);
      setSelectedBranch("");
    } catch (error) {
      toast.error("বেতন তালিকা তৈরি করতে ব্যর্থ");
      console.error(error);
    }
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    let result = employees;

    if (departmentFilter) {
      result = result.filter((e) => e.department === departmentFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((e) => e.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.fullName.toLowerCase().includes(term) ||
          e.employeeId.toLowerCase().includes(term) ||
          e.email.toLowerCase().includes(term)
      );
    }

    return result;
  }, [employees, departmentFilter, statusFilter, searchTerm]);

  const departments = useMemo(
    () => [...new Set(employees?.map((e) => e.department) || [])],
    [employees]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">এইচআর এবং বেতন ব্যবস্থাপনা</h1>
        {activeTab === "employees" && (
          <button
            onClick={() => setShowAddEmployee(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} /> নতুন কর্মচারী
          </button>
        )}
      </div>

      {/* Dashboard Summary */}
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">মোট কর্মচারী</p>
                <p className="text-3xl font-bold">{hrSummary?.totalEmployees || 0}</p>
              </div>
              <Users size={40} className="opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">মোট বেতন (এই মাস)</p>
                <p className="text-2xl font-bold">
                  ৳{(hrSummary?.totalPayroll || 0).toLocaleString()}
                </p>
              </div>
              <DollarSign size={40} className="opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">সক্রিয় ছুটি</p>
                <p className="text-3xl font-bold">{hrSummary?.activeLeaves || 0}</p>
              </div>
              <Calendar size={40} className="opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">অনুমোদনের অপেক্ষায়</p>
                <p className="text-3xl font-bold">{hrSummary?.pendingApprovals || 0}</p>
              </div>
              <Clock size={40} className="opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">বিভাগ</p>
                <p className="text-3xl font-bold">{hrSummary?.departmentCount || 0}</p>
              </div>
              <TrendingUp size={40} className="opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: "dashboard", label: "ড্যাশবোর্ড", icon: TrendingUp },
          { id: "employees", label: "কর্মচারী", icon: Users },
          { id: "attendance", label: "উপস্থিতি", icon: Calendar },
          { id: "leaves", label: "ছুটি", icon: Clock },
          { id: "payroll", label: "বেতন", icon: DollarSign },
          { id: "performance", label: "পারফরম্যান্স", icon: Award },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setActiveTab(id);
              setSelectedEmployee(null);
            }}
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

      {/* Employees Tab */}
      {activeTab === "employees" && !selectedEmployee && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-4">
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
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 bg-gray-100 rounded outline-none"
            >
              <option value="">সব বিভাগ</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-100 rounded outline-none"
            >
              <option value="all">সব স্ট্যাটাস</option>
              <option value="active">সক্রিয়</option>
              <option value="inactive">নিষ্ক্রিয়</option>
              <option value="on_leave">ছুটিতে</option>
              <option value="terminated">শেষ</option>
            </select>
          </div>

          {/* Employees Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">কর্মচারীর নাম</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">আইডি</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">বিভাগ</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">পদ</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">বেতন</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">স্ট্যাটাস</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{emp.fullName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{emp.employeeId}</td>
                    <td className="px-6 py-4 text-sm">{emp.department}</td>
                    <td className="px-6 py-4 text-sm">{emp.designation}</td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      ৳{emp.grossSalary?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          emp.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {emp.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedEmployee(emp)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Eye size={16} /> বিস্তারিত
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Detail View */}
      {activeTab === "employees" && selectedEmployee && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">{selectedEmployee.fullName}</h2>
              <p className="text-gray-600">{selectedEmployee.designation}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                ফিরে যান
              </button>
              <button
                onClick={() => {
                  // Handle edit functionality
                  toast.info("সম্পাদনা বৈশিষ্ট্য শীঘ্রই উপলব্ধ হবে");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Edit2 size={16} /> সম্পাদনা করুন
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4 text-lg">ব্যক্তিগত তথ্য</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">কর্মচারী আইডি</p>
                  <p className="font-semibold">{selectedEmployee.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ইমেইল</p>
                  <p className="font-semibold">{selectedEmployee.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ফোন</p>
                  <p className="font-semibold">{selectedEmployee.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">শাখা</p>
                  <p className="font-semibold">{selectedEmployee.branchName}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-lg">কর্মসংক্রান্ত তথ্য</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">বিভাগ</p>
                  <p className="font-semibold">{selectedEmployee.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">পদ</p>
                  <p className="font-semibold">{selectedEmployee.designation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">যোগদানের তারিখ</p>
                  <p className="font-semibold">
                    {new Date(selectedEmployee.joinDate).toLocaleDateString("bn-BD")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">স্ট্যাটাস</p>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedEmployee.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {selectedEmployee.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-lg">বেতন তথ্য</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">ভিত্তি বেতন</p>
                  <p className="font-semibold text-lg">৳{selectedEmployee.baseSalary?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">মোট বেতন</p>
                  <p className="font-semibold text-lg">৳{selectedEmployee.grossSalary?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <button
            onClick={() => setShowAttendanceForm(!showAttendanceForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} /> উপস্থিতি মার্ক করুন
          </button>

          {showAttendanceForm && (
            <form
              onSubmit={handleMarkAttendance}
              className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-semibold mb-2">কর্মচারী</label>
                <select
                  value={attendanceData.employeeId}
                  onChange={(e) => setAttendanceData({ ...attendanceData, employeeId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">নির্বাচন করুন</option>
                  {employees?.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">তারিখ</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">স্ট্যাটাস</label>
                <select
                  value={attendanceData.status}
                  onChange={(e) => setAttendanceData({ ...attendanceData, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="present">উপস্থিত</option>
                  <option value="absent">অনুপস্থিত</option>
                  <option value="half_day">আধা দিন</option>
                  <option value="leave">ছুটি</option>
                  <option value="sick_leave">অসুস্থ ছুটি</option>
                  <option value="on_duty">ডিউটিতে</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">চেক-ইন সময়</label>
                <input
                  type="time"
                  value={attendanceData.checkInTime}
                  onChange={(e) => setAttendanceData({ ...attendanceData, checkInTime: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">চেক-আউট সময়</label>
                <input
                  type="time"
                  value={attendanceData.checkOutTime}
                  onChange={(e) => setAttendanceData({ ...attendanceData, checkOutTime: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">নোট</label>
                <textarea
                  value={attendanceData.notes}
                  onChange={(e) => setAttendanceData({ ...attendanceData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                ></textarea>
              </div>

              <div className="md:col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  রেকর্ড করুন
                </button>
                <button
                  type="button"
                  onClick={() => setShowAttendanceForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  বাতিল করুন
                </button>
              </div>
            </form>
          )}

          {/* Attendance History */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">উপস্থিতি ইতিহাস</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-2">শুরুর তারিখ</label>
                <input
                  type="date"
                  value={selectedAttendanceDateRange.fromDate}
                  onChange={(e) =>
                    setSelectedAttendanceDateRange({ ...selectedAttendanceDateRange, fromDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">শেষ তারিখ</label>
                <input
                  type="date"
                  value={selectedAttendanceDateRange.toDate}
                  onChange={(e) =>
                    setSelectedAttendanceDateRange({ ...selectedAttendanceDateRange, toDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">কর্মচারী</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">তারিখ</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">স্ট্যাটাস</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">চেক-ইন</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">চেক-আউট</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">কাজের ঘণ্টা</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords?.length > 0 ? (
                    attendanceRecords.map((att) => (
                      <tr key={att._id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{att.employeeName}</td>
                        <td className="px-6 py-4 text-sm">
                          {new Date(att.attendanceDate).toLocaleDateString("bn-BD")}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              att.status === "present"
                                ? "bg-green-100 text-green-700"
                                : att.status === "absent"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {att.status === "present"
                              ? "উপস্থিত"
                              : att.status === "absent"
                              ? "অনুপস্থিত"
                              : "অন্যান্য"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString("bn-BD") : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString("bn-BD") : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold">
                          {att.workingHours ? att.workingHours.toFixed(2) : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        কোনো উপস্থিতি রেকর্ড পাওয়া যায়নি
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Leave Tab */}
      {activeTab === "leaves" && (
        <div className="space-y-4">
          <button
            onClick={() => setShowLeaveForm(!showLeaveForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} /> ছুটির অনুরোধ
          </button>

          {showLeaveForm && (
            <form
              onSubmit={handleRequestLeave}
              className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-semibold mb-2">কর্মচারী</label>
                <select
                  value={leaveData.employeeId}
                  onChange={(e) => setLeaveData({ ...leaveData, employeeId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">নির্বাচন করুন</option>
                  {employees?.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">ছুটির ধরন</label>
                <select
                  value={leaveData.leaveType}
                  onChange={(e) => setLeaveData({ ...leaveData, leaveType: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="annual">বার্ষিক</option>
                  <option value="sick">অসুস্থ ছুটি</option>
                  <option value="casual">নিয়মিত ছুটি</option>
                  <option value="maternity">মাতৃত্ব ছুটি</option>
                  <option value="paternity">পিতৃত্ব ছুটি</option>
                  <option value="bereavement">শোকাহত ছুটি</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">শুরুর তারিখ</label>
                <input
                  type="date"
                  value={leaveData.startDate}
                  onChange={(e) => setLeaveData({ ...leaveData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">শেষের তারিখ</label>
                <input
                  type="date"
                  value={leaveData.endDate}
                  onChange={(e) => setLeaveData({ ...leaveData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">কারণ</label>
                <textarea
                  value={leaveData.reason}
                  onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                  required
                ></textarea>
              </div>

              <div className="md:col-span-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingLeave}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmittingLeave ? "জমা দিচ্ছে..." : "জমা দিন"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLeaveForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  বাতিল করুন
                </button>
              </div>
            </form>
          )}

          {/* Leave Requests */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">ছুটির অনুরোধ</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">কর্মচারী</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">ধরন</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">শুরু</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">শেষ</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">দিন</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">কারণ</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">স্ট্যাটাস</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {leaves?.map((leave) => (
                  <tr key={leave._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{leave.employeeName}</td>
                    <td className="px-6 py-4 text-sm">{leave.leaveType}</td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(leave.startDate).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(leave.endDate).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">{leave.totalDays}</td>
                    <td className="px-6 py-4 text-sm max-w-xs truncate" title={leave.reason}>
                      {leave.reason}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          leave.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : leave.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {leave.status === "approved" ? "অনুমোদিত" : leave.status === "pending" ? "অপেক্ষমান" : "প্রত্যাখ্যাত"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {leave.status === "pending" && (
                        <button
                          onClick={() => setSelectedLeave(leave)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          পর্যালোচনা
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Leave Approval Modal */}
          {selectedLeave && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h2 className="text-2xl font-bold mb-4">ছুটি অনুমোদন পর্যালোচনা</h2>
                
                <div className="space-y-3 mb-4 pb-4 border-b">
                  <div>
                    <p className="text-sm text-gray-600">কর্মচারী</p>
                    <p className="font-semibold">{selectedLeave.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ধরন</p>
                    <p className="font-semibold">{selectedLeave.leaveType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">মোট দিন</p>
                    <p className="font-semibold">{selectedLeave.totalDays}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">কারণ</p>
                    <p className="font-semibold">{selectedLeave.reason}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">মন্তব্য (ঐচ্ছিক)</label>
                  <textarea
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                  ></textarea>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveLeave(selectedLeave._id)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium"
                  >
                    অনুমোদন করুন
                  </button>
                  <button
                    onClick={() => handleRejectLeave(selectedLeave._id)}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-medium"
                  >
                    প্রত্যাখ্যান করুন
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLeave(null);
                      setApprovalComment("");
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 font-medium"
                  >
                    বাতিল করুন
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payroll Tab */}
      {activeTab === "payroll" && (
        <div className="space-y-4">
          <button
            onClick={() => setShowPayrollForm(!showPayrollForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} /> বেতন তৈরি করুন
          </button>

          {showPayrollForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGeneratePayroll();
              }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">শাখা</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">নির্বাচন করুন</option>
                  {branches?.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  তৈরি করুন
                </button>
                <button
                  type="button"
                  onClick={() => setShowPayrollForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  বাতিল করুন
                </button>
              </div>
            </form>
          )}

          {/* Month & Year Filter */}
          <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">মাস নির্বাচন করুন</label>
              <select
                value={selectedPayrollMonth}
                onChange={(e) => setSelectedPayrollMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value={1}>জানুয়ারি</option>
                <option value={2}>ফেব্রুয়ারি</option>
                <option value={3}>মার্চ</option>
                <option value={4}>এপ্রিল</option>
                <option value={5}>মে</option>
                <option value={6}>জুন</option>
                <option value={7}>জুলাই</option>
                <option value={8}>আগস্ট</option>
                <option value={9}>সেপ্টেম্বর</option>
                <option value={10}>অক্টোবর</option>
                <option value={11}>নভেম্বর</option>
                <option value={12}>ডিসেম্বর</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">বছর নির্বাচন করুন</label>
              <select
                value={selectedPayrollYear}
                onChange={(e) => setSelectedPayrollYear(parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {[2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  const now = new Date();
                  setSelectedPayrollMonth(now.getMonth() + 1);
                  setSelectedPayrollYear(now.getFullYear());
                }}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                এই মাস
              </button>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">বেতন তালিকা</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">কর্মচারী</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">মাস</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">মোট উপার্জন</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">কাটছাঁট</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">নিট বেতন</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">স্ট্যাটাস</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {payrolls?.map((payroll) => (
                  <tr key={payroll._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{payroll.employeeName}</td>
                    <td className="px-6 py-4 text-sm">{payroll.payrollMonthName}</td>
                    <td className="px-6 py-4 font-semibold">
                      ৳{payroll.grossSalary?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      -৳{payroll.totalDeductions?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 font-semibold text-green-600">
                      ৳{payroll.netSalary?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          payroll.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : payroll.status === "approved"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {payroll.status === "paid"
                          ? "প্রদত্ত"
                          : payroll.status === "approved"
                          ? "অনুমোদিত"
                          : "গণনা করা"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => setSelectedPayrollForDetail(payroll)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        বিস্তারিত
                      </button>
                      {payroll.status === "calculated" && (
                        <button
                          onClick={() => handleApprovePayroll(payroll._id)}
                          className="text-green-600 hover:text-green-800 font-medium ml-2"
                        >
                          অনুমোদন
                        </button>
                      )}
                      {payroll.status === "approved" && (
                        <button
                          onClick={() => handleProcessPayrollPayment(payroll._id)}
                          className="text-blue-600 hover:text-blue-800 font-medium ml-2"
                        >
                          পেমেন্ট করুন
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payrolls && payrolls.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                এই মাসের জন্য কোনো বেতন রেকর্ড নেই। প্রথমে বেতন তৈরি করুন।
              </div>
            )}
          </div>

          {/* Payroll Detail Modal */}
          {selectedPayrollForDetail && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">বেতন বিবরণী</h2>
                  <button
                    onClick={() => setSelectedPayrollForDetail(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-lg border-b pb-2">কর্মচারী তথ্য</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">নাম</p>
                        <p className="font-semibold">{selectedPayrollForDetail.employeeName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">মাস</p>
                        <p className="font-semibold">{selectedPayrollForDetail.payrollMonthName}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-lg border-b pb-2">বেতন সংক্ষিপ্ত</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>মোট উপার্জন:</span>
                        <span className="font-semibold">৳{selectedPayrollForDetail.grossSalary?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>মোট কাটছাঁট:</span>
                        <span className="font-semibold">-৳{selectedPayrollForDetail.totalDeductions?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between text-green-600 border-t-2 pt-2">
                        <span className="font-bold">নিট বেতন:</span>
                        <span className="font-bold text-lg">৳{selectedPayrollForDetail.netSalary?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold mb-3">অতিরিক্ত তথ্য</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">অবস্থা</p>
                      <p className="font-semibold">
                        {selectedPayrollForDetail.status === "paid"
                          ? "প্রদত্ত"
                          : selectedPayrollForDetail.status === "approved"
                          ? "অনুমোদিত"
                          : "গণনা করা"}
                      </p>
                    </div>
                    {selectedPayrollForDetail.paidDate && (
                      <div>
                        <p className="text-sm text-gray-600">পেমেন্টের তারিখ</p>
                        <p className="font-semibold">
                          {new Date(selectedPayrollForDetail.paidDate).toLocaleDateString("bn-BD")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {selectedPayrollForDetail.status === "calculated" && (
                    <button
                      onClick={() => {
                        handleApprovePayroll(selectedPayrollForDetail._id);
                        setSelectedPayrollForDetail(null);
                      }}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium"
                    >
                      অনুমোদন করুন
                    </button>
                  )}
                  {selectedPayrollForDetail.status === "approved" && (
                    <button
                      onClick={() => {
                        handleProcessPayrollPayment(selectedPayrollForDetail._id);
                        setSelectedPayrollForDetail(null);
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                    >
                      পেমেন্ট করুন
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedPayrollForDetail(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 font-medium"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === "performance" && (
        <div className="space-y-4">
          <button
            onClick={() => setShowPerformanceForm(!showPerformanceForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 mb-6"
          >
            <Plus size={20} /> পারফরম্যান্স রিভিউ
          </button>

          {showPerformanceForm && (
            <form
              onSubmit={handleCreatePerformanceReview}
              className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
            >
              <div>
                <label className="block text-sm font-semibold mb-2">কর্মচারী</label>
                <select
                  value={performanceData.employeeId}
                  onChange={(e) => setPerformanceData({ ...performanceData, employeeId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">নির্বাচন করুন</option>
                  {employees?.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">রিপোর্টিং ম্যানেজার</label>
                <select
                  value={performanceData.reportingManagerId}
                  onChange={(e) => setPerformanceData({ ...performanceData, reportingManagerId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">নির্বাচন করুন</option>
                  {employees?.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">মূল্যায়ন শুরু</label>
                <input
                  type="date"
                  value={performanceData.evaluationPeriodStart}
                  onChange={(e) => setPerformanceData({ ...performanceData, evaluationPeriodStart: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">মূল্যায়ন শেষ</label>
                <input
                  type="date"
                  value={performanceData.evaluationPeriodEnd}
                  onChange={(e) => setPerformanceData({ ...performanceData, evaluationPeriodEnd: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">প্রযুক্তিগত দক্ষতা (১-১০)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={performanceData.technicalSkills}
                  onChange={(e) => setPerformanceData({ ...performanceData, technicalSkills: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">যোগাযোগ দক্ষতা (১-১০)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={performanceData.communicationSkills}
                  onChange={(e) => setPerformanceData({ ...performanceData, communicationSkills: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">টিমওয়ার্ক দক্ষতা (১-১০)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={performanceData.teamworkSkills}
                  onChange={(e) => setPerformanceData({ ...performanceData, teamworkSkills: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">নেতৃত্ব দক্ষতা (১-১০)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={performanceData.leadershipSkills}
                  onChange={(e) => setPerformanceData({ ...performanceData, leadershipSkills: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">শক্তি</label>
                <textarea
                  value={performanceData.strengths}
                  onChange={(e) => setPerformanceData({ ...performanceData, strengths: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                  required
                ></textarea>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">উন্নতির ক্ষেত্র</label>
                <textarea
                  value={performanceData.areasForImprovement}
                  onChange={(e) => setPerformanceData({ ...performanceData, areasForImprovement: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                  required
                ></textarea>
              </div>

              <div className="md:col-span-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingPerformance}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmittingPerformance ? "তৈরি করছে..." : "তৈরি করুন"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPerformanceForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  বাতিল করুন
                </button>
              </div>
            </form>
          )}

          {/* Performance Reviews List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">পারফরম্যান্স রিভিউ</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">কর্মচারী</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">মূল্যায়ন শুরু</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">মূল্যায়ন শেষ</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">সামগ্রিক স্কোর</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">স্ট্যাটাস</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {performances && performances.length > 0 ? (
                  performances.map((perf) => (
                    <tr key={perf._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{perf.employeeName}</td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(perf.evaluationPeriodStart).toLocaleDateString("bn-BD")}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(perf.evaluationPeriodEnd).toLocaleDateString("bn-BD")}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">{perf.overallScore?.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          perf.status === "submitted"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {perf.status === "submitted" ? "জমা দেওয়া হয়েছে" : "খসড়া"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedPerformance(perf)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          বিস্তারিত
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      কোনো পারফরম্যান্স রিভিউ পাওয়া যায়নি
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Performance Detail Modal */}
          {selectedPerformance && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">পারফরম্যান্স বিবরণী</h2>
                  <button
                    onClick={() => setSelectedPerformance(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 text-lg">বেসিক তথ্য</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">কর্মচারী নাম</p>
                        <p className="font-semibold">{selectedPerformance.employeeName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">মূল্যায়ন সময়কাল</p>
                        <p className="font-semibold">
                          {new Date(selectedPerformance.evaluationPeriodStart).toLocaleDateString("bn-BD")} - {new Date(selectedPerformance.evaluationPeriodEnd).toLocaleDateString("bn-BD")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">সামগ্রিক স্কোর</p>
                        <p className="font-bold text-2xl text-blue-600">{selectedPerformance.overallScore?.toFixed(2)}/10</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">স্ট্যাটাস</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedPerformance.status === "submitted"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {selectedPerformance.status === "submitted" ? "জমা দেওয়া হয়েছে" : "খসড়া"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <h3 className="font-semibold mb-2">পারফরম্যান্স মূল্যায়ন সারসংক্ষেপ</h3>
                    <p className="text-sm text-gray-700">
                      এই নিযুক্তি সময়কালে কর্মীর সামগ্রিক কর্মক্ষমতা মূল্যায়ন করা হয়েছে এবং {selectedPerformance.overallScore?.toFixed(2)} স্কোর প্রাপ্ত হয়েছে।
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setSelectedPerformance(null)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto max-w-2xl w-full">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">নতুন কর্মচারী যুক্ত করুন</h2>
              <button
                onClick={() => setShowAddEmployee(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">কর্মচারী আইডি</label>
                  <input
                    type="text"
                    placeholder="EMP-001"
                    value={newEmployee.employeeId}
                    onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">শাখা</label>
                  <select
                    value={newEmployee.branchId}
                    onChange={(e) => {
                      const branch = branches?.find((b) => b._id === e.target.value);
                      setNewEmployee({
                        ...newEmployee,
                        branchId: e.target.value,
                        branchName: branch?.name || "",
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
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
                  <label className="block text-sm font-semibold mb-1">প্রথম নাম</label>
                  <input
                    type="text"
                    value={newEmployee.firstName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">শেষ নাম</label>
                  <input
                    type="text"
                    value={newEmployee.lastName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">ইমেইল</label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">ফোন</label>
                  <input
                    type="tel"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">জন্মতারিখ</label>
                  <input
                    type="date"
                    value={newEmployee.dateOfBirth}
                    onChange={(e) => setNewEmployee({ ...newEmployee, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">লিঙ্গ</label>
                  <select
                    value={newEmployee.gender}
                    onChange={(e) => setNewEmployee({ ...newEmployee, gender: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="male">পুরুষ</option>
                    <option value="female">নারী</option>
                    <option value="other">অন্যান্য</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">বিভাগ</label>
                  <select
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  >
                    <option value="">নির্বাচন করুন</option>
                    <option value="Sales">বিক্রয়</option>
                    <option value="Operations">পরিচালনা</option>
                    <option value="HR">এইচআর</option>
                    <option value="Finance">আর্থিক</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">পদ</label>
                  <input
                    type="text"
                    value={newEmployee.designation}
                    onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">নিয়োগের ধরন</label>
                  <select
                    value={newEmployee.employmentType}
                    onChange={(e) => setNewEmployee({ ...newEmployee, employmentType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="permanent">স্থায়ী</option>
                    <option value="contract">চুক্তি</option>
                    <option value="temporary">অস্থায়ী</option>
                    <option value="internship">ইন্টার্নশিপ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">যোগদানের তারিখ</label>
                  <input
                    type="date"
                    value={newEmployee.joinDate}
                    onChange={(e) => setNewEmployee({ ...newEmployee, joinDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">ভিত্তি বেতন</label>
                  <input
                    type="number"
                    value={newEmployee.baseSalary}
                    onChange={(e) => setNewEmployee({ ...newEmployee, baseSalary: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">মোট বেতন</label>
                  <input
                    type="number"
                    value={newEmployee.grossSalary}
                    onChange={(e) => setNewEmployee({ ...newEmployee, grossSalary: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">ঠিকানা</label>
                  <input
                    type="text"
                    value={newEmployee.address}
                    onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">শহর</label>
                  <input
                    type="text"
                    value={newEmployee.city}
                    onChange={(e) => setNewEmployee({ ...newEmployee, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">রাজ্য</label>
                  <input
                    type="text"
                    value={newEmployee.state}
                    onChange={(e) => setNewEmployee({ ...newEmployee, state: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">জিপ কোড</label>
                  <input
                    type="text"
                    value={newEmployee.zipCode}
                    onChange={(e) => setNewEmployee({ ...newEmployee, zipCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">জাতীয়তা</label>
                  <input
                    type="text"
                    value={newEmployee.nationality}
                    onChange={(e) => setNewEmployee({ ...newEmployee, nationality: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">জরুরী যোগাযোগের নাম</label>
                  <input
                    type="text"
                    value={newEmployee.emergencyContactName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, emergencyContactName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">জরুরী যোগাযোগের ফোন</label>
                  <input
                    type="tel"
                    value={newEmployee.emergencyContactPhone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, emergencyContactPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">সম্পর্ক</label>
                  <input
                    type="text"
                    value={newEmployee.emergencyContactRelation}
                    onChange={(e) => setNewEmployee({ ...newEmployee, emergencyContactRelation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmittingEmployee}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmittingEmployee ? "যুক্ত করছে..." : "যুক্ত করুন"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddEmployee(false)}
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
