import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Pencil, X, User, Search, CheckCircle, AlertCircle, Shield, Key, Mail, Phone, ChevronLeft, ChevronRight, ChevronDown, Eye } from "lucide-react";
import * as userService from "../services/userServices";
import { PageLayout, ActionIcon, EmptyState, MobileCardSkeleton, HeaderSkeleton, ContentCard, Pagination } from "../components/UIComponents";




function StaffSkeleton() {
  return (
    <PageLayout>
      <HeaderSkeleton />
      <ContentCard className="flex-1">
        <div className="lg:hidden flex-1 overflow-auto p-4 space-y-2">
          {[...Array(6)].map((_, i) => (
            <MobileCardSkeleton key={i} />
          ))}
        </div>
        <div className="hidden lg:block flex-1 overflow-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50/95 backdrop-blur-sm border-b border-gray-100">
                <th className="py-4 px-6"><div className="h-2 w-24 bg-gray-200 rounded animate-pulse" /></th>
                <th className="py-4 px-6"><div className="h-2 w-32 bg-gray-200 rounded animate-pulse" /></th>
                <th className="py-4 px-6"><div className="h-2 w-20 bg-gray-200 rounded animate-pulse" /></th>
                <th className="py-4 px-6 text-center"><div className="h-2 w-24 bg-gray-200 rounded animate-pulse mx-auto" /></th>
                <th className="py-4 px-6 text-right"><div className="h-2 w-16 bg-gray-200 rounded animate-pulse ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...Array(8)].map((_, i) => (
                <tr key={i}>
                  <td className="py-3 px-6"><div className="h-4 w-28 bg-gray-100 rounded animate-pulse" /></td>
                  <td className="py-3 px-6"><div className="h-3 w-36 bg-gray-50 rounded animate-pulse" /></td>
                  <td className="py-3 px-6"><div className="h-6 w-24 bg-gray-50 rounded-lg animate-pulse" /></td>
                  <td className="py-3 px-6 text-center"><div className="h-6 w-20 bg-gray-50 rounded-lg animate-pulse mx-auto" /></td>
                  <td className="py-3 px-6 text-right"><div className="h-8 w-20 bg-gray-50 rounded-lg animate-pulse ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </PageLayout>
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

  const paginatedStaff = useMemo(() => {
    return filteredStaff.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  }, [filteredStaff, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const getRoleColor = (role) => {
    switch (role) {
      case "Admin": return "bg-red-100 text-red-800 border-red-200";
      case "Reception": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "Admin": return <Shield className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  if (loading && staff.length === 0) {
    return <StaffSkeleton />;
  }

  return (
    <PageLayout>
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-medium text-sm">{error}</p>
          <ActionIcon onClick={() => setError("")} className="ml-auto">
            <X className="w-4 h-4 text-red-500" />
          </ActionIcon>
        </div>
      )}

      {/* Header with Actions - Compact Sticky */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border border-gray-100 px-3 py-2 h-14 flex items-center justify-between gap-2 rounded-2xl shadow-md mb-4 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg shrink-0">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0 hidden sm:block">
            <h2 className="text-sm font-bold text-gray-900 truncate leading-tight">Staff Directory</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">Manage accounts</p>
          </div>
          {/* Search Input - Compact */}
          <div className="relative flex-1 min-w-0 max-w-[180px] group ml-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-8 pr-3 bg-gray-50/50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400 font-medium"
            />
          </div>
        </div>
        
        <button
          onClick={openAdd}
          className="h-10 px-4 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Staff</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Staff Content Area */}
      <ContentCard className="flex-1">
        {/* ===== MOBILE CARD VIEW (< lg) ===== */}
        <div className="lg:hidden overflow-auto flex-1 custom-scrollbar scroll-smooth overscroll-contain">
          {paginatedStaff.length > 0 ? (
            <div className="p-4 space-y-2">
              {paginatedStaff.map((staffMember) => (
                <div key={staffMember.id} className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-blue-50/40 transition-all duration-200 cursor-pointer shadow-sm group">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate leading-tight">{staffMember.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                        <Key className="w-3 h-3 text-gray-300 shrink-0" />
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{staffMember.username}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide border leading-tight ${getRoleColor(staffMember.role)}`}>
                        {staffMember.role}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide border leading-tight ${
                        staffMember.is_active ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-rose-100 text-rose-800 border-rose-200"
                      }`}>
                        {staffMember.is_active ? "Active" : "Locked"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5 text-[11px] text-gray-400 min-w-0 flex-1 leading-tight">
                      {staffMember.email && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="font-medium truncate">{staffMember.email}</span>
                        </div>
                      )}
                      {staffMember.phone && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Phone className="w-3 h-3 text-gray-300 shrink-0" />
                          <span className="font-bold tabular-nums truncate">{staffMember.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <ActionIcon onClick={() => openEdit(staffMember)} title="Edit Staff" ringColor="blue-500" className="bg-blue-50 text-blue-600 border border-blue-100">
                        <Pencil className="w-3.5 h-3.5" />
                      </ActionIcon>
                      <ActionIcon onClick={() => navigate(`/staff/${staffMember.id}`)} title="View Staff" ringColor="indigo-500" className="bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <Eye className="w-3.5 h-3.5" />
                      </ActionIcon>
                      <ActionIcon onClick={() => handleDelete(staffMember.id)} title="Delete Staff" ringColor="rose-500" className="bg-rose-50 text-rose-600 border border-rose-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </ActionIcon>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={User} title="No staff members found" message="No records match your search criteria." actionText="Add Staff" onAction={openAdd} />
          )}
        </div>

        {/* ===== DESKTOP TABLE VIEW (lg+) ===== */}
        <div className="hidden lg:block overflow-auto flex-1 custom-scrollbar scroll-smooth overscroll-contain">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50/95 backdrop-blur-sm border-b border-gray-100">
                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Staff Member</th>
                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Contact Information</th>
                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Security Role</th>
                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none text-center">Account Status</th>
                <th className="py-4 px-6 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedStaff.length > 0 ? (
                paginatedStaff.map((staffMember) => (
                  <tr key={staffMember.id} className="hover:bg-blue-50/40 transition-all duration-200 group cursor-pointer border-l-4 border-transparent hover:border-blue-600">
                    <td className="py-3 px-6">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors tracking-tight leading-relaxed truncate">{staffMember.name}</p>
                        <div className="flex items-center gap-2 min-w-0">
                          <Key className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{staffMember.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex flex-col gap-1.5 min-w-0 font-medium">
                        {staffMember.email && (
                          <div className="flex items-center gap-2 text-gray-600 min-w-0">
                            <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="text-xs font-bold tracking-tight truncate">{staffMember.email}</span>
                          </div>
                        )}
                        {staffMember.phone && (
                          <div className="flex items-center gap-2 text-gray-400 min-w-0">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs font-bold tabular-nums truncate">{staffMember.phone}</span>
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
                        staffMember.is_active ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-rose-100 text-rose-800 border-rose-200"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${staffMember.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                        {staffMember.is_active ? "Active" : "Locked"}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                        <div className="flex items-center justify-end gap-2.5 shrink-0">
                          <ActionIcon onClick={() => openEdit(staffMember)} title="Edit Staff" ringColor="blue-500" className="bg-blue-50 text-blue-600 border border-blue-100">
                            <Pencil className="w-4 h-4" />
                          </ActionIcon>
                          <ActionIcon onClick={() => navigate(`/staff/${staffMember.id}`)} title="View Staff" ringColor="indigo-500" className="bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <Eye className="w-4 h-4" />
                          </ActionIcon>
                          <ActionIcon onClick={() => handleDelete(staffMember.id)} title="Delete Staff" ringColor="rose-500" className="bg-rose-50 text-rose-600 border border-rose-100">
                            <Trash2 className="w-4 h-4" />
                          </ActionIcon>
                        </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">
                    <EmptyState icon={User} title="No staff members found" message="No records match your search criteria." actionText="Add Staff" onAction={openAdd} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Section */}
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredStaff.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          themeColor="blue"
        />
      </ContentCard>

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
                    <h3 className="text-lg font-bold text-gray-900">{editingStaff ? "Edit Staff" : "Add New Staff"}</h3>
                    <p className="text-sm text-gray-600">{editingStaff ? "Update staff details" : "Create new staff account"}</p>
                  </div>
                </div>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 flex-1">{formError}</p>
                <button onClick={() => setFormError("")}><X className="w-4 h-4 text-red-400 hover:text-red-600" /></button>
              </div>
            )}

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Enter staff name" autoComplete="off" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setFieldErrors(p => ({...p, name: ""})); }} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Login username" autoComplete="off" value={form.username} onChange={(e) => { setForm({ ...form, username: e.target.value }); setFieldErrors(p => ({...p, username: ""})); }} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.username ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                {fieldErrors.username && <p className="text-xs text-red-600 mt-1">{fieldErrors.username}</p>}
              </div>
              {!editingStaff && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                  <input type="password" placeholder="Min 6 chars" autoComplete="new-password" value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); setFieldErrors(p => ({...p, password: ""})); }} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                  {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                <input type="tel" placeholder="10-digit mobile" maxLength={10} value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); setFieldErrors(p => ({...p, phone: ""})); }} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 text-xs">(Optional)</span></label>
                <input type="email" placeholder="staff@example.com" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setFieldErrors(p => ({...p, email: ""})); }} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded text-blue-500 focus:ring-blue-500 w-4 h-4" />
                <span className="text-sm text-gray-700">Active Account</span>
              </label>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {editingStaff ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700 font-bold">Processing...</span>
          </div>
        </div>
      )}
    </PageLayout>
  );
}