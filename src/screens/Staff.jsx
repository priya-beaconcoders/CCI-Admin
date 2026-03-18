import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Trash2, Pencil, X, User, Search, CheckCircle, AlertCircle, Shield, Key, Mail, Phone, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import * as userService from "../services/userServices";


/* ================= PAGINATION COMPONENT ================= */
function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) {
  if (totalItems === 0) return null;

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <p className="text-sm text-gray-600 font-medium order-2 sm:order-1">
        Showing <span className="font-bold text-gray-900">{Math.min((currentPage * itemsPerPage) + 1, totalItems)}</span> to <span className="font-bold text-gray-900">{Math.min((currentPage + 1) * itemsPerPage, totalItems)}</span> of <span className="font-bold text-gray-900">{totalItems}</span> records
      </p>
      
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(0)}
          disabled={currentPage === 0}
          className={`p-2 rounded-lg transition-all ${
            currentPage === 0 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600 active:scale-90'
          }`}
          title="First Page"
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className={`p-2 rounded-lg transition-all mr-2 ${
            currentPage === 0 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600 active:scale-90'
          }`}
          title="Previous Page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1 mx-2">
          {[...Array(totalPages)].map((_, i) => {
            if (
              totalPages <= 7 ||
              i === 0 ||
              i === totalPages - 1 ||
              (i >= currentPage - 1 && i <= currentPage + 1)
            ) {
              return (
                <button
                  key={i}
                  onClick={() => onPageChange(i)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                    currentPage === i
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200 transform scale-105'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {i + 1}
                </button>
              );
            } else if (
              (i === 1 && currentPage > 2) ||
              (i === totalPages - 2 && currentPage < totalPages - 3)
            ) {
              return <span key={i} className="px-1 text-gray-400">...</span>;
            }
            return null;
          })}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1}
          className={`p-2 rounded-lg transition-all ml-2 ${
            currentPage === totalPages - 1 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600 active:scale-90'
          }`}
          title="Next Page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={currentPage === totalPages - 1}
          className={`p-2 rounded-lg transition-all ${
            currentPage === totalPages - 1 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600 active:scale-90'
          }`}
          title="Last Page"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function StaffSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm p-4 h-20 flex justify-between items-center">
        <div className="flex gap-3">
           <div className="w-10 h-10 rounded-lg bg-gray-100 animate-shimmer" />
           <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-100 rounded animate-shimmer" />
              <div className="h-2.5 w-48 bg-gray-50 rounded animate-shimmer" />
           </div>
        </div>
        <div className="flex gap-3">
           <div className="h-10 w-48 bg-gray-50 rounded-lg animate-shimmer" />
           <div className="h-10 w-32 bg-blue-50/50 rounded-lg animate-shimmer" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/90 rounded-xl p-4 border border-gray-100 h-20 space-y-3">
             <div className="h-2 w-16 bg-gray-50 rounded animate-shimmer" />
             <div className="h-6 w-12 bg-gray-100 rounded animate-shimmer" />
          </div>
        ))}
      </div>

      <div className="bg-white/90 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-12 bg-gray-50/50 border-b border-gray-100 animate-shimmer" />
        <div className="p-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 px-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex gap-3 items-center">
                 <div className="w-10 h-10 rounded-full bg-gray-50 animate-shimmer" />
                 <div className="space-y-2">
                    <div className="h-4 w-40 bg-gray-100 rounded animate-shimmer" />
                    <div className="h-2 w-24 bg-gray-50 rounded animate-shimmer" />
                 </div>
              </div>
              <div className="hidden md:block space-y-2">
                 <div className="h-3 w-32 bg-gray-50 rounded animate-shimmer" />
                 <div className="h-2 w-24 bg-gray-50/50 rounded animate-shimmer" />
              </div>
              <div className="h-8 w-24 bg-gray-50 rounded-full animate-shimmer" />
              <div className="h-8 w-16 bg-gray-50/50 rounded-lg animate-shimmer" />
            </div>
          ))}
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

  // Pagination state – 10 items per page
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
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
    return (
      <div className="p-0 sm:p-2">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 space-y-2">
            <div className="h-8 w-48 bg-gray-200/50 rounded animate-shimmer" />
            <div className="h-4 w-64 bg-gray-100/50 rounded animate-shimmer" />
          </div>
          <StaffSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage all staff accounts and permissions</p>
        </div>

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
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Staff Accounts</h2>
                <p className="text-sm text-gray-600">Manage user access and permissions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={openAdd}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Staff
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Staff</p>
            <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {staff.filter(s => s.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Admins</p>
            <p className="text-2xl font-bold text-red-600">
              {staff.filter(s => s.role === "Admin").length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Reception</p>
            <p className="text-2xl font-bold text-blue-600">
              {staff.filter(s => s.role === "Reception").length}
            </p>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Staff Member</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Contact</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedStaff.length > 0 ? (
                  paginatedStaff.map((staffMember) => (
                    <tr key={staffMember.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{staffMember.name}</p>
                            <div className="flex items-center gap-2">
                              <Key className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-500 font-mono">{staffMember.username}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {staffMember.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-600">{staffMember.email}</span>
                            </div>
                          )}
                          {staffMember.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-600">{staffMember.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${getRoleColor(staffMember.role).split(' ')[0]}`}>
                            <div className={getRoleColor(staffMember.role).split(' ')[1]}>
                              {getRoleIcon(staffMember.role)}
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(staffMember.role)}`}>
                            {staffMember.role}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          staffMember.is_active 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${staffMember.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                          {staffMember.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(staffMember)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(staffMember.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <User className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-gray-500">No staff members found</p>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredStaff.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />

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