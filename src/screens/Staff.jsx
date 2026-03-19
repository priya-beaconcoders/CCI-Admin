import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Pencil, X, User, Search, CheckCircle, AlertCircle, Shield, Key, Mail, Phone, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye } from "lucide-react";
import * as userService from "../services/userServices";


/* ================= PAGINATION COMPONENT ================= */
function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) {
  if (totalItems === 0) return null;

  const options = [8, 10, 50, 100];

  return (
    <div className="mt-auto shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-b-2xl border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
      <div className="flex items-center gap-6 order-2 sm:order-1">
        <p className="text-xs text-gray-400 font-bold tracking-tight">
          Showing <span className="text-gray-900">{Math.min((currentPage * itemsPerPage) + 1, totalItems)}</span> - <span className="text-gray-900">{Math.min((currentPage + 1) * itemsPerPage, totalItems)}</span> of <span className="text-gray-900">{totalItems}</span>
        </p>
        
        <div className="flex items-center gap-2 border-l border-gray-100 pl-6">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rows:</span>
          <select 
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="bg-transparent border-none text-xs font-bold text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500/20 py-1 cursor-pointer"
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className={`p-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${currentPage === 0
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-800 hover:bg-blue-50 hover:text-blue-600'
            }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        <div className="flex gap-1 mx-2">
          {[...Array(totalPages)].map((_, i) => (
              <button
                  key={i}
                  onClick={() => onPageChange(i)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${currentPage === i ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                  {i+1}
              </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1 || totalPages === 0}
          className={`p-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${currentPage === totalPages - 1 || totalPages === 0
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-800 hover:bg-blue-50 hover:text-blue-600'
            }`}
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StaffSkeleton() {
  return (
    <div className="flex-1 w-full flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Skeleton Header — matches the real "Staff Directory" header card */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl w-12 h-12 animate-shimmer" />
               <div className="space-y-2.5">
                  <div className="h-5 w-36 bg-gray-100 rounded animate-shimmer" />
                  <div className="h-2.5 w-44 bg-gray-50 rounded animate-shimmer" />
               </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
               <div className="h-[42px] w-full md:w-64 bg-gray-50 rounded-xl animate-shimmer" />
               <div className="h-[42px] w-full md:w-32 bg-blue-50/50 rounded-xl animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Skeleton Table — uses real <table> to match column widths */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="overflow-hidden flex-1">
            <table className="w-full text-left border-separate border-spacing-0 min-w-[700px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50/95 backdrop-blur-sm border-b border-gray-100">
                  <th className="py-4 px-6"><div className="h-3 w-28 bg-gray-200 rounded animate-shimmer" /></th>
                  <th className="py-4 px-6"><div className="h-3 w-36 bg-gray-200 rounded animate-shimmer" /></th>
                  <th className="py-4 px-6"><div className="h-3 w-24 bg-gray-200 rounded animate-shimmer" /></th>
                  <th className="py-4 px-6 text-center"><div className="h-3 w-28 bg-gray-200 rounded animate-shimmer mx-auto" /></th>
                  <th className="py-4 px-6 text-right"><div className="h-3 w-16 bg-gray-200 rounded animate-shimmer ml-auto" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {/* Staff Member */}
                    <td className="py-3 px-6">
                      <div className="space-y-2">
                        <div className="h-4 w-28 bg-gray-100 rounded animate-shimmer" />
                        <div className="h-2 w-20 bg-gray-50 rounded animate-shimmer" />
                      </div>
                    </td>
                    {/* Contact Information */}
                    <td className="py-3 px-6">
                      <div className="space-y-2">
                        <div className="h-3 w-36 bg-gray-50 rounded animate-shimmer" />
                        <div className="h-2 w-28 bg-gray-50/50 rounded animate-shimmer" />
                      </div>
                    </td>
                    {/* Security Role */}
                    <td className="py-3 px-6">
                      <div className="h-6 w-24 bg-gray-50 rounded-lg animate-shimmer" />
                    </td>
                    {/* Account Status */}
                    <td className="py-3 px-6 text-center">
                      <div className="h-6 w-20 bg-gray-50 rounded-lg animate-shimmer mx-auto" />
                    </td>
                    {/* Actions */}
                    <td className="py-3 px-6">
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="h-8 w-8 bg-gray-50/50 rounded-xl animate-shimmer" />
                        <div className="h-8 w-8 bg-gray-50/50 rounded-xl animate-shimmer" />
                        <div className="h-8 w-8 bg-gray-50/50 rounded-xl animate-shimmer" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Skeleton Pagination */}
          <div className="mt-auto shrink-0 flex items-center justify-between bg-white/50 p-4 border-t border-gray-100 h-[68px]">
            <div className="flex items-center gap-6">
               <div className="h-3 w-32 bg-gray-100 rounded animate-shimmer" />
               <div className="h-6 w-24 bg-gray-50 rounded animate-shimmer hidden sm:block" />
            </div>
            <div className="flex items-center gap-2">
               <div className="h-6 w-16 bg-gray-50 rounded-lg animate-shimmer" />
               <div className="flex gap-1">
                  <div className="h-7 w-7 bg-gray-100 rounded-lg animate-shimmer" />
                  <div className="h-7 w-7 bg-gray-50 rounded-lg animate-shimmer" />
                  <div className="h-7 w-7 bg-gray-50 rounded-lg animate-shimmer" />
               </div>
               <div className="h-6 w-16 bg-gray-50 rounded-lg animate-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const navigate = useNavigate();
  // Pagination state – 8 items per page default
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "Reception",
    is_active: true,
    email: "",
    phone: ""
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const roles = ["Admin", "Reception"];

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      setStaff(response.data || []);
      setError("");
    } catch (err) {
      console.error("❌ STAFF FETCH ERROR:", err);
      setError("Failed to load staff. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const validateForm = () => {
    const errors = {};
    if (!form.name?.trim()) errors.name = "Full Name is required.";
    if (!form.username?.trim()) errors.username = "Username is required.";
    if (!editingStaff && !form.password?.trim()) {
      errors.password = "Password is required.";
    } else if (!editingStaff && form.password.trim().length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
    if (!form.phone?.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!/^[0-9]{10}$/.test(form.phone.trim())) {
      errors.phone = "Phone number must be exactly 10 digits.";
    }
    if (form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please fill in all required fields correctly.");
      return;
    }
    setFieldErrors({});

    try {
      setFormError("");
      setLoading(true);
      
      const payload = { ...form };
      if (editingStaff) {
        delete payload.password;
        await userService.updateUser(editingStaff.id, payload);
      } else {
        await userService.createUser(payload);
      }
      
      await fetchStaff();
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error("❌ STAFF SAVE ERROR:", err.response?.data || err);
      if (err.response?.data?.errors) {
        const serverErrors = {};
        Object.entries(err.response.data.errors).forEach(([key, val]) => {
          serverErrors[key] = Array.isArray(val) ? val[0] : val;
        });
        setFieldErrors(serverErrors);
        setFormError("Please correct the highlighted fields.");
      } else {
        setFormError(err.response?.data?.message || err.message || "Failed to save staff. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    
    try {
      setLoading(true);
      await userService.deleteUser(id);
      await fetchStaff();
    } catch (err) {
      console.error("❌ STAFF DELETE ERROR:", err);
      setError("Failed to delete staff. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      username: "",
      password: "",
      role: "Reception",
      is_active: true,
      email: "",
      phone: ""
    });
    setEditingStaff(null);
    setFormError("");
    setFieldErrors({});
  };

  const openEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFieldErrors({});
    setFormError("");
    setForm({
      name: staffMember.name || "",
      username: staffMember.username || "",
      password: "",
      role: staffMember.role || "Reception",
      is_active: staffMember.is_active !== false,
      email: staffMember.email || "",
      phone: staffMember.phone || ""
    });
    setShowForm(true);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const filteredStaff = useMemo(() => {
    return staff.filter(staffMember =>
      staffMember.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staff, searchTerm]);

  // Paginated staff
  const paginatedStaff = useMemo(() => {
    return filteredStaff.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  }, [filteredStaff, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const getRoleColor = (role) => {
    switch (role) {
      case "Admin": return "bg-red-100 text-red-800";
      case "Manager": return "bg-purple-100 text-purple-800";
      case "Reception": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "Admin": return <Shield className="w-4 h-4" />;
      case "Manager": return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  if (loading && staff.length === 0) {
    return <StaffSkeleton />;
  }

  return (
    <div className="flex-1 w-full flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError("")} className="ml-auto">
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {/* Header with Actions */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Staff Directory</h2>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Manage system access</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
                />
              </div>
              <button
                onClick={openAdd}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Staff
              </button>
            </div>
          </div>
        </div>


        {/* Staff Table */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* ===== MOBILE CARD VIEW (< lg) ===== */}
          <div className="lg:hidden overflow-auto flex-1 custom-scrollbar scroll-smooth overscroll-contain">
            {paginatedStaff.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {paginatedStaff.map((staffMember) => (
                  <div key={staffMember.id} className="p-4 hover:bg-blue-50/40 transition-all duration-200 cursor-pointer">
                    {/* Row 1: Name + Role + Status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{staffMember.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Key className="w-3 h-3 text-gray-400" />
                          <span className="text-[11px] text-gray-400 font-medium">{staffMember.username}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${getRoleColor(staffMember.role)}`}>
                          {getRoleIcon(staffMember.role)}
                          {staffMember.role}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${
                          staffMember.is_active 
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                            : "bg-rose-100 text-rose-800 border-rose-200"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${staffMember.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {staffMember.is_active ? "Active" : "Locked"}
                        </span>
                      </div>
                    </div>
                    {/* Row 2: Contact + Actions */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col gap-0.5 text-xs text-gray-500 min-w-0">
                        {staffMember.email && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                            <span className="font-medium truncate">{staffMember.email}</span>
                          </div>
                        )}
                        {staffMember.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-gray-300 shrink-0" />
                            <span className="font-bold tabular-nums">{staffMember.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => openEdit(staffMember)}
                          className="p-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg transition-all shadow-sm" title="Edit Staff">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => navigate(`/staff/${staffMember.id}`)}
                          className="p-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg transition-all shadow-sm" title="View Staff">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(staffMember.id)}
                          className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg transition-all shadow-sm" title="Delete Staff">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500 font-medium">No staff members found</div>
            )}
          </div>

          {/* ===== DESKTOP TABLE VIEW (lg+) ===== */}
          <div className="hidden lg:block overflow-auto flex-1 custom-scrollbar scroll-smooth overscroll-contain">
            <table className="w-full text-left border-separate border-spacing-0 min-w-[700px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50/95 backdrop-blur-sm border-b border-gray-100">
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Staff Member</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Information</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Security Role</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Account Status</th>
                  <th className="py-4 px-6 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedStaff.length > 0 ? (
                  paginatedStaff.map((staffMember) => (
                    <tr key={staffMember.id} className="hover:bg-blue-50/40 transition-all duration-200 group cursor-pointer border-l-4 border-transparent hover:border-blue-600">
                      <td className="py-3 px-6">
                        <div className="flex flex-col gap-1.5">
                          <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors tracking-tight leading-relaxed">{staffMember.name}</p>
                          <div className="flex items-center gap-2">
                            <Key className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{staffMember.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex flex-col gap-1.5">
                          {staffMember.email && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-xs font-bold tracking-tight">{staffMember.email}</span>
                            </div>
                          )}
                          {staffMember.phone && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Phone className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold tabular-nums">{staffMember.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border transition-all ${getRoleColor(staffMember.role)}`}>
                          {getRoleIcon(staffMember.role)}
                          {staffMember.role}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border transition-all ${
                          staffMember.is_active 
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                            : "bg-rose-100 text-rose-800 border-rose-200"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${staffMember.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                          {staffMember.is_active ? "Active" : "Locked"}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => openEdit(staffMember)}
                              className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
                              title="Edit Staff"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/staff/${staffMember.id}`)}
                              className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"
                              title="View Staff"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(staffMember.id)}
                              className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90"
                              title="Delete Staff"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-500 font-medium">
                      No staff members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="shrink-0 border-t border-gray-100">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredStaff.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </div>

        {/* Staff Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <User className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {editingStaff ? "Edit Staff" : "Add New Staff"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {editingStaff ? "Update staff details" : "Create new staff account"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Error Message Section inside Popup */}
              {formError && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 flex-1">{formError}</p>
                  <button onClick={() => setFormError("")}>
                    <X className="w-4 h-4 text-red-400 hover:text-red-600" />
                  </button>
                </div>
              )}

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter staff name"
                    autoComplete="off"
                    value={form.name}
                    onChange={(e) => { setForm({ ...form, name: e.target.value }); setFieldErrors(p => ({...p, name: ""})); }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Login username"
                    autoComplete="off"
                    name={`user_${Math.random().toString(36).substr(2, 9)}`}
                    value={form.username}
                    onChange={(e) => { setForm({ ...form, username: e.target.value }); setFieldErrors(p => ({...p, username: ""})); }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.username ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {fieldErrors.username && <p className="text-xs text-red-600 mt-1">{fieldErrors.username}</p>}
                </div>

                {!editingStaff && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => { setForm({ ...form, password: e.target.value }); setFieldErrors(p => ({...p, password: ""})); }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    />
                    {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => { setForm({ ...form, phone: e.target.value }); setFieldErrors(p => ({...p, phone: ""})); }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="staff@example.com"
                    autoComplete="off"
                    value={form.email}
                    onChange={(e) => { setForm({ ...form, email: e.target.value }); setFieldErrors(p => ({...p, email: ""})); }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="rounded text-blue-500 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Active Account</span>
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {editingStaff ? "Update Staff" : "Create Staff"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700">Processing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}