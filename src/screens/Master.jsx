
import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Pencil, X, Users, Home, User, Mail, Phone, CheckCircle, AlertCircle, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

// Import services
import * as roomService from "../services/roomServices";
import * as memberService from "../services/memberServices";

export default function Masters() {
  const [activeTab, setActiveTab] = useState("rooms");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Master Data Management</h1>
          <p className="text-gray-600 mt-1">Manage rooms and members</p>
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

        {/* ===== Tabs ===== */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 inline-flex">
          <Tab 
            label="Rooms" 
            icon={<Home className="w-4 h-4" />}
            active={activeTab === "rooms"} 
            onClick={() => setActiveTab("rooms")} 
          />
          <Tab 
            label="Members" 
            icon={<Users className="w-4 h-4" />}
            active={activeTab === "members"} 
            onClick={() => setActiveTab("members")} 
          />
        </div>

        {activeTab === "rooms" && <RoomsMaster setError={setError} setLoading={setLoading} />}
        {activeTab === "members" && <MembersMaster setError={setError} setLoading={setLoading} />}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700">Processing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= TAB ================= */
function Tab({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
        active 
          ? "bg-orange-500 text-white shadow-sm" 
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ================= PAGINATION COMPONENT ================= */
function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) {
  if (!totalItems || totalItems === 0) return null;

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
              : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600 active:scale-90'
          }`}
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className={`p-2 rounded-lg transition-all mr-2 ${
            currentPage === 0 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600 active:scale-90'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage >= totalPages - 1}
          className={`p-2 rounded-lg transition-all ml-2 ${
            currentPage >= totalPages - 1 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600 active:scale-90'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={currentPage >= totalPages - 1}
          className={`p-2 rounded-lg transition-all ${
            currentPage >= totalPages - 1 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600 active:scale-90'
          }`}
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/* ================= ROOMS MASTER ================= */
function RoomsMaster({ setError, setLoading }) {
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    room_no: "",
    type: "Single Suite",
    guest_limit: 2,
    status: "Available",
    price_3day: "",
    price_7day: "",
    price_8day: ""
  });

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const roomTypes = ["Single Suite", "Double Suite"];
  const roomStatuses = ["Available", "Booked", "Maintenance", "Cleaning"];

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomService.getRooms();
      // Ensure we set an array
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setRooms(data);
      setCurrentPage(0);
      setError("");
    } catch (err) {
      console.error("❌ ROOMS FETCH ERROR:", err);
      setError("Failed to load rooms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const filteredRooms = useMemo(() => {
    if (!Array.isArray(rooms)) return [];
    return rooms.filter(room => {
      if (!room) return false;
      const term = searchTerm.toLowerCase();
      return (
        (room.room_no || "").toLowerCase().includes(term) ||
        (room.type || "").toLowerCase().includes(term) ||
        (room.status || "").toLowerCase().includes(term)
      );
    });
  }, [rooms, searchTerm]);

  const paginatedRooms = useMemo(() => {
    return filteredRooms.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  }, [filteredRooms, currentPage]);

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage) || 1;

  const handleSubmit = async () => {
    if (!form.room_no || !form.type || !form.guest_limit) {
      setFormError("Room number, type, and guest limit are required.");
      return;
    }
    if (!form.price_3day || !form.price_7day || !form.price_8day) {
      setFormError("All price fields are required.");
      return;
    }

    try {
      setFormError("");
      setLoading(true);
      const payload = {
        ...form,
        price_3day: parseFloat(form.price_3day),
        price_7day: parseFloat(form.price_7day),
        price_8day: parseFloat(form.price_8day)
      };
      
      if (editingRoom) {
        await roomService.updateRoom(editingRoom.id, payload);
      } else {
        await roomService.createRoom(payload);
      }
      
      await fetchRooms();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save room.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      setLoading(true);
      setError("");
      console.log("🗑️ Deleting room ID:", id);
      await roomService.deleteRoom(id);
      await fetchRooms();
    } catch (err) {
      console.error("❌ DELETE ERROR FULL OBJECT:", err);
      console.error("❌ DELETE ERROR RESPONSE:", err.response);
      console.error("❌ DELETE ERROR DATA:", err.response?.data);
      console.error("❌ DELETE STATUS:", err.response?.status);
      
      let errorMsg = "Failed to delete room.";
      
      // Check for specific error messages
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.status === 422) {
        errorMsg = "Cannot delete room. It may be linked to existing bookings or have validation errors.";
      } else if (err.response?.status === 403) {
        errorMsg = "You don't have permission to delete this room.";
      } else if (err.response?.status === 404) {
        errorMsg = "Room not found.";
      }
      
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      room_no: "",
      type: "Single Suite",
      guest_limit: 2,
      status: "Available",
      price_3day: "",
      price_7day: "",
      price_8day: ""
    });
    setEditingRoom(null);
    setFormError("");
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setForm({
      room_no: room.room_no || "",
      type: room.type || "Single Suite",
      guest_limit: room.guest_limit || 2,
      status: room.status || "Available",
      price_3day: room.price_3day || "",
      price_7day: room.price_7day || "",
      price_8day: room.price_8day || ""
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-lg"><Home className="w-5 h-5 text-orange-500" /></div>
          <div>
            <h2 className="text-lg font-bold">Room Management</h2>
            <p className="text-sm text-gray-600">Total: {rooms.length} rooms</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" placeholder="Search..." value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-orange-500 text-white rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Room
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-sm">Room No</th>
                <th className="p-4 font-semibold text-sm">Type</th>
                <th className="p-4 font-semibold text-sm">Status</th>
                <th className="p-4 font-semibold text-sm">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedRooms.map(room => (
                <tr key={room.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{room.room_no}</td>
                  <td className="p-4 text-sm">{room.type}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      room.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>{room.status}</span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => openEdit(room)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(room.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination 
        currentPage={currentPage} totalPages={totalPages} 
        totalItems={filteredRooms.length} itemsPerPage={itemsPerPage} 
        onPageChange={setCurrentPage} 
      />

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">{editingRoom ? "Edit Room" : "Add Room"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            {formError && (
              <div className="m-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
              </div>
            )}

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1">Room Number *</label>
                <input type="text" value={form.room_no} onChange={e => setForm({...form, room_no: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full p-2 border rounded-lg outline-none">
                  {roomTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Guest Limit</label>
                <input type="number" value={form.guest_limit} onChange={e => setForm({...form, guest_limit: e.target.value})} className="w-full p-2 border rounded-lg outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">3 Day Price</label>
                  <input type="number" value={form.price_3day} onChange={e => setForm({...form, price_3day: e.target.value})} className="w-full p-2 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">7 Day Price</label>
                  <input type="number" value={form.price_7day} onChange={e => setForm({...form, price_7day: e.target.value})} className="w-full p-2 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">8+ Day Price</label>
                  <input type="number" value={form.price_8day} onChange={e => setForm({...form, price_8day: e.target.value})} className="w-full p-2 border rounded-lg outline-none" />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 font-medium text-gray-600">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= MEMBERS MASTER ================= */
function MembersMaster({ setError, setLoading }) {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ 
    name: "", 
    membership_no: "", 
    mobile_no: "", 
    email: "", 
    address: "",
    is_active: true 
  });

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await memberService.getMembers();
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setMembers(data);
      setCurrentPage(0);
    } catch (err) {
      setError("Failed to load members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const filteredMembers = useMemo(() => {
    if (!Array.isArray(members)) return [];
    return members.filter(m => {
      if (!m) return false;
      const term = searchTerm.toLowerCase();
      return (
        (m.name || "").toLowerCase().includes(term) ||
        (m.membership_no || "").toLowerCase().includes(term) ||
        (m.mobile_no || "").includes(term)
      );
    });
  }, [members, searchTerm]);

  const paginatedMembers = useMemo(() => {
    return filteredMembers.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  }, [filteredMembers, currentPage]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;

  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!form.name?.trim()) {
      errors.name = "Full Name is required.";
    }
    if (!form.membership_no?.trim()) {
      errors.membership_no = "Member ID is required.";
    }
    if (!form.mobile_no?.trim()) {
      errors.mobile_no = "Mobile number is required.";
    } else if (!/^[0-9]{10}$/.test(form.mobile_no.trim())) {
      errors.mobile_no = "Mobile number must be exactly 10 digits.";
    }
    if (!form.email?.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    if (!form.address?.trim()) {
      errors.address = "Address is required.";
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
      if (editingMember) {
        await memberService.updateMember(editingMember.id, form);
      } else {
        await memberService.createMember(form);
      }
      await fetchMembers();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("❌ MEMBER SAVE ERROR:", err.response?.data || err);
      let msg = "Failed to save member.";
      
      if (err.response?.data?.errors) {
        // Collect all validation errors
        const serverErrors = {};
        Object.entries(err.response.data.errors).forEach(([key, val]) => {
          serverErrors[key] = Array.isArray(val) ? val[0] : val;
        });
        setFieldErrors(serverErrors);
        msg = "Please correct the highlighted fields.";
      } else {
        msg = err.response?.data?.message || err.response?.data?.error || msg;
      }
      
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", membership_no: "", mobile_no: "", email: "", address: "", is_active: true });
    setEditingMember(null);
    setFormError("");
    setFieldErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg"><Users className="w-5 h-5 text-green-500" /></div>
          <div>
            <h2 className="text-lg font-bold">Member Management</h2>
            <p className="text-sm text-gray-600">Total: {members.length} members</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" placeholder="Search..." value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg outline-none"
            />
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 font-semibold text-sm">Member Name</th>
                <th className="p-4 font-semibold text-sm">ID No</th>
                <th className="p-4 font-semibold text-sm">Mobile</th>
                <th className="p-4 font-semibold text-sm">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedMembers.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{m.name}</td>
                  <td className="p-4 text-sm">{m.membership_no}</td>
                  <td className="p-4 text-sm">{m.mobile_no}</td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => { 
                      setEditingMember(m);
                      setFieldErrors({});
                      setFormError("");
                      setForm({
                        name: m.name || "",
                        membership_no: m.membership_no || "",
                        mobile_no: m.mobile_no || "",
                        email: m.email || "",
                        address: m.address || "",
                        is_active: m.is_active === null ? true : !!m.is_active
                      }); 
                      setShowForm(true); 
                    }} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredMembers.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">{editingMember ? "Edit Member" : "Add Member"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            {formError && (
              <div className="m-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {formError}
              </div>
            )}

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" placeholder="Enter full name" value={form.name} 
                  onChange={e => { setForm({...form, name: e.target.value}); setFieldErrors(p => ({...p, name: ""})); }} 
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                />
                {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Member ID <span className="text-red-500">*</span></label>
                <input 
                  type="text" placeholder="Enter member ID" value={form.membership_no} 
                  onChange={e => { setForm({...form, membership_no: e.target.value}); setFieldErrors(p => ({...p, membership_no: ""})); }} 
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${fieldErrors.membership_no ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                />
                {fieldErrors.membership_no && <p className="text-xs text-red-600 mt-1">{fieldErrors.membership_no}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile No <span className="text-red-500">*</span></label>
                <input 
                  type="tel" placeholder="10-digit mobile number" value={form.mobile_no} 
                  maxLength={10}
                  onChange={e => { setForm({...form, mobile_no: e.target.value}); setFieldErrors(p => ({...p, mobile_no: ""})); }} 
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${fieldErrors.mobile_no ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                />
                {fieldErrors.mobile_no && <p className="text-xs text-red-600 mt-1">{fieldErrors.mobile_no}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
                <input 
                  type="email" placeholder="Enter email address" value={form.email || ""} 
                  onChange={e => { setForm({...form, email: e.target.value}); setFieldErrors(p => ({...p, email: ""})); }} 
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                />
                {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address <span className="text-red-500">*</span></label>
                <textarea 
                  placeholder="Enter full address" value={form.address || ""} 
                  onChange={e => { setForm({...form, address: e.target.value}); setFieldErrors(p => ({...p, address: ""})); }} 
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${fieldErrors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                  rows="3"
                />
                {fieldErrors.address && <p className="text-xs text-red-600 mt-1">{fieldErrors.address}</p>}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="member_active"
                  checked={!!form.is_active} 
                  onChange={e => setForm({...form, is_active: e.target.checked})} 
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500" 
                />
                <label htmlFor="member_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Active Member
                </label>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 font-medium text-gray-600">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Save Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}