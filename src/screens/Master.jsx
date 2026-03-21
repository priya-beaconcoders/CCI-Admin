import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Pencil, X, Users, Home, User, Mail, Phone, CheckCircle, AlertCircle, Search, ChevronLeft, ChevronRight, ChevronDown, Eye, Shield } from "lucide-react";
import { PageLayout, ActionIcon, EmptyState, MobileCardSkeleton, HeaderSkeleton, ContentCard, Pagination } from "../components/UIComponents";

// Import services
import * as roomService from "../services/roomServices";
import * as memberService from "../services/memberServices";

export default function Masters() {
  const [activeTab, setActiveTab] = useState("rooms");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      {activeTab === "rooms" && (
        <RoomsMaster 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          setError={setError} 
          setLoading={setLoading} 
        />
      )}
      {activeTab === "members" && (
        <MembersMaster 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          setError={setError} 
          setLoading={setLoading} 
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 flex items-center gap-3 shadow-2xl">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700 font-bold">Processing...</span>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

/* ================= SHARED HEADER ================= */
function SharedMasterHeader({ activeTab, setActiveTab, searchTerm, setSearchTerm, onAdd, addLabel, themeColor }) {
  const isOrange = themeColor === 'orange';

  return (
    <div className="sticky top-0 z-10 w-full bg-white/95 backdrop-blur-sm border border-gray-100 px-3 py-2 h-14 flex items-center justify-between gap-2 rounded-2xl shadow-md mb-4 flex-shrink-0 font-medium">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Tabs */}
        <div className="bg-gray-100/70 p-1 rounded-lg inline-flex shrink-0 h-10 border border-gray-100">
          <button
            onClick={() => setActiveTab("rooms")}
            className={`px-3 py-0 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 ${
              activeTab === "rooms"
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rooms</span>
            <span className="sm:hidden">R</span>
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`px-3 py-0 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 ${
              activeTab === "members"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Members</span>
            <span className="sm:hidden">M</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 min-w-0 max-w-[180px] group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 transition-colors group-focus-within:text-gray-600" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full h-10 pl-8 pr-3 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none transition-all placeholder:text-gray-400 font-medium ${
              isOrange
                ? "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                : "focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            }`}
          />
        </div>
      </div>

      <button
        onClick={onAdd}
        className={`h-10 px-4 shrink-0 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all outline-none focus:ring-2 ${
          isOrange
            ? "bg-orange-500 shadow-lg shadow-orange-100 hover:bg-orange-600 focus:ring-orange-500/20"
            : "bg-emerald-600 shadow-lg shadow-emerald-100 hover:bg-emerald-700 focus:ring-emerald-500/20"
        }`}
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">{addLabel}</span>
        <span className="sm:hidden">Add</span>
      </button>
    </div>
  );
}



/* ================= ROOMS MASTER ================= */
function RoomsMaster({ setError, setLoading, setActiveTab }) {
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formError, setFormError] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [form, setForm] = useState({
    room_no: "",
    type: "Single Suite",
    guest_limit: 2,
    status: "Available",
    price_3day: "",
    price_7day: "",
    price_8day: ""
  });

  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const roomTypes = ["Single Suite", "Double Suite"];

  const fetchRooms = async () => {
    try {
      setDataLoading(true);
      const response = await roomService.getRooms();
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setRooms(data);
      setCurrentPage(0);
      setError("");
    } catch (err) {
      console.error("❌ ROOMS FETCH ERROR:", err);
      setError("Failed to load rooms. Please try again.");
    } finally {
      setDataLoading(false);
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
  }, [filteredRooms, currentPage, itemsPerPage]);

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
      await roomService.deleteRoom(id);
      await fetchRooms();
    } catch (err) {
      console.error("❌ DELETE ERROR:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to delete room.");
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
    <div className="flex-1 flex flex-col min-h-0 space-y-3 w-full">
      {dataLoading ? (
        <>
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
                    <th className="py-4 px-6 text-center"><div className="h-2 w-24 bg-gray-200 rounded animate-pulse mx-auto" /></th>
                    <th className="py-4 px-6 text-right"><div className="h-2 w-16 bg-gray-200 rounded animate-pulse ml-auto" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...Array(8)].map((_, i) => (
                    <tr key={i}>
                      <td className="py-3 px-6"><div className="h-4 w-28 bg-gray-100 rounded animate-pulse" /></td>
                      <td className="py-3 px-6"><div className="h-3 w-36 bg-gray-50 rounded animate-pulse" /></td>
                      <td className="py-3 px-6 text-center"><div className="h-6 w-20 bg-gray-50 rounded-lg animate-pulse mx-auto" /></td>
                      <td className="py-3 px-6 text-right"><div className="h-8 w-20 bg-gray-50 rounded-lg animate-pulse ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentCard>
        </>
      ) : (
        <>
          <SharedMasterHeader 
            activeTab="rooms" 
            setActiveTab={setActiveTab} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            onAdd={() => { resetForm(); setShowForm(true); }} 
            addLabel="Add Room" 
            themeColor="orange" 
          />

          <ContentCard className="flex-1">
            {/* MOBILE CARD VIEW (< lg) */}
            <div className="lg:hidden overflow-auto flex-1 custom-scrollbar scroll-smooth overscroll-contain">
              {paginatedRooms.length > 0 ? (
                <div className="p-4 space-y-2">
                  {paginatedRooms.map(room => (
                    <div key={room.id} className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-orange-50/40 transition-all duration-200 cursor-pointer shadow-sm group">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 leading-tight truncate">Room {room.room_no}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                            <span className="text-[10px] text-gray-400 font-medium italic truncate">{room.type}</span>
                            <span className="w-0.5 h-0.5 bg-gray-300 rounded-full shrink-0"></span>
                            <span className="text-[10px] text-gray-400 font-medium shrink-0">Limit: {room.guest_limit}</span>
                          </div>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide border leading-tight ${
                          room.status === 'Available' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}>{room.status}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 leading-tight min-w-0 flex-1">
                          <span className="font-bold tabular-nums truncate">3D: ₹{room.price_3day}</span>
                          <span className="text-gray-300 shrink-0">•</span>
                          <span className="font-bold tabular-nums truncate">7D: ₹{room.price_7day}</span>
                          <span className="text-gray-300 shrink-0">•</span>
                          <span className="font-bold tabular-nums truncate">8D+: ₹{room.price_8day}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <ActionIcon onClick={(e) => { e.stopPropagation(); openEdit(room); }} title="Edit Room" ringColor="orange-500" className="bg-orange-50 text-orange-600 border border-orange-100">
                            <Pencil className="w-3.5 h-3.5" />
                          </ActionIcon>
                          <ActionIcon onClick={(e) => { e.stopPropagation(); navigate(`/masters/rooms/${room.id}`); }} title="View Room" ringColor="blue-500" className="bg-blue-50 text-blue-600 border border-blue-100">
                            <Eye className="w-3.5 h-3.5" />
                          </ActionIcon>
                          <ActionIcon onClick={(e) => { e.stopPropagation(); handleDelete(room.id); }} title="Delete Room" ringColor="rose-500" className="bg-rose-50 text-rose-600 border border-rose-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </ActionIcon>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Home} title="No rooms found" message="No records match your search criteria." actionText="Add Room" onAction={() => { resetForm(); setShowForm(true); }} themeColor="orange" />
              )}
            </div>

            {/* DESKTOP TABLE VIEW (lg+) */}
            <div className="hidden lg:block overflow-auto flex-1 custom-scrollbar scroll-smooth overscroll-contain">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50/95 backdrop-blur-sm border-b border-gray-100">
                      <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Room Information</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Pricing Structure</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none text-center">Status</th>
                      <th className="py-4 px-6 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedRooms.length > 0 ? (
                      paginatedRooms.map(room => (
                        <tr key={room.id} className="hover:bg-orange-50/40 transition-all duration-200 group cursor-pointer border-l-4 border-transparent hover:border-orange-600">
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1.5 min-w-0">
                              <p className="text-sm font-bold text-gray-900 group-hover:text-orange-700 transition-colors tracking-tight leading-relaxed truncate">Room {room.room_no}</p>
                              <div className="flex items-center gap-2 min-w-0">
                                 <span className="text-xs text-gray-400 font-medium tracking-tight italic truncate">{room.type}</span>
                                 <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0"></span>
                                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest shrink-0">Limit: {room.guest_limit} Guests</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm">
                             <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                                <div className="flex items-baseline gap-1.5">
                                   <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">3 Day:</span>
                                   <span className="font-bold text-gray-900 tabular-nums">₹{room.price_3day}</span>
                                </div>
                                <span className="text-gray-300 shrink-0 text-xs hidden xl:block">•</span>
                                <div className="flex items-baseline gap-1.5">
                                   <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">7 Day:</span>
                                   <span className="font-bold text-gray-900 tabular-nums">₹{room.price_7day}</span>
                                </div>
                                <span className="text-gray-300 shrink-0 text-xs hidden xl:block">•</span>
                                <div className="flex items-baseline gap-1.5">
                                   <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">8+ Day:</span>
                                   <span className="font-bold text-gray-900 tabular-nums">₹{room.price_8day}</span>
                                </div>
                             </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${
                              room.status === 'Available' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                            }`}>{room.status}</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-end gap-2.5 shrink-0">
                               <ActionIcon onClick={(e) => { e.stopPropagation(); openEdit(room); }} title="Edit Room" ringColor="orange-500" className="bg-orange-50 text-orange-600 border border-orange-100">
                                <Pencil className="w-4 h-4" />
                               </ActionIcon>
                               <ActionIcon onClick={(e) => { e.stopPropagation(); navigate(`/masters/rooms/${room.id}`); }} title="View Room" ringColor="blue-500" className="bg-blue-50 text-blue-600 border border-blue-100">
                                <Eye className="w-4 h-4" />
                               </ActionIcon>
                               <ActionIcon onClick={(e) => { e.stopPropagation(); handleDelete(room.id); }} title="Delete Room" ringColor="rose-500" className="bg-rose-50 text-rose-600 border border-rose-100">
                                <Trash2 className="w-4 h-4" />
                               </ActionIcon>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4">
                          <EmptyState icon={Home} title="No rooms found" message="No records match your search criteria." actionText="Add Room" onAction={() => { resetForm(); setShowForm(true); }} themeColor="orange" />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredRooms.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} themeColor="orange" />
          </ContentCard>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">{editingRoom ? "Edit Room" : "Add Room"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="m-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {formError}</div>}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div><label className="block text-sm font-medium mb-1">Room Number *</label><input type="text" value={form.room_no} onChange={e => setForm({...form, room_no: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Type *</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full p-2 border rounded-lg outline-none">{roomTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Guest Limit</label><input type="number" value={form.guest_limit} onChange={e => setForm({...form, guest_limit: e.target.value})} className="w-full p-2 border rounded-lg outline-none" /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="block text-xs font-medium mb-1">3 Day</label><input type="number" value={form.price_3day} onChange={e => setForm({...form, price_3day: e.target.value})} className="w-full p-2 border rounded-lg outline-none" /></div>
                <div><label className="block text-xs font-medium mb-1">7 Day</label><input type="number" value={form.price_7day} onChange={e => setForm({...form, price_7day: e.target.value})} className="w-full p-2 border rounded-lg outline-none" /></div>
                <div><label className="block text-xs font-medium mb-1">8+ Day</label><input type="number" value={form.price_8day} onChange={e => setForm({...form, price_8day: e.target.value})} className="w-full p-2 border rounded-lg outline-none" /></div>
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
function MembersMaster({ setError, setLoading, setActiveTab }) {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formError, setFormError] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [form, setForm] = useState({ name: "", membership_no: "", mobile_no: "", email: "", address: "", is_active: true });
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const navigate = useNavigate();

  const fetchMembers = async () => {
    try {
      setDataLoading(true);
      const response = await memberService.getMembers();
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setMembers(data);
      setCurrentPage(0);
    } catch (err) {
      setError("Failed to load members.");
    } finally {
      setDataLoading(false);
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
  }, [filteredMembers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;

  const validateForm = () => {
    const errors = {};
    if (!form.name?.trim()) errors.name = "Full Name is required.";
    if (!form.membership_no?.trim()) errors.membership_no = "Member ID is required.";
    if (!form.mobile_no?.trim()) {
      errors.mobile_no = "Mobile number is required.";
    } else if (!/^[0-9]{10}$/.test(form.mobile_no.trim())) {
      errors.mobile_no = "Mobile number must be 10 digits.";
    }
    if (!form.email?.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Invalid email format.";
    }
    if (!form.address?.trim()) errors.address = "Address is required.";
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please correct the form fields.");
      return;
    }
    try {
      setFormError("");
      setLoading(true);
      if (editingMember) await memberService.updateMember(editingMember.id, form);
      else await memberService.createMember(form);
      await fetchMembers();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save member.");
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

  if (dataLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-0 space-y-4 w-full">
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
                  <th className="py-4 px-6 text-center"><div className="h-2 w-24 bg-gray-200 rounded animate-pulse mx-auto" /></th>
                  <th className="py-4 px-6 text-right"><div className="h-2 w-16 bg-gray-200 rounded animate-pulse ml-auto" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...Array(8)].map((_, i) => (
                  <tr key={i}>
                    <td className="py-3 px-6"><div className="h-4 w-28 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-3 px-6"><div className="h-3 w-36 bg-gray-50 rounded animate-pulse" /></td>
                    <td className="py-3 px-6 text-center"><div className="h-6 w-20 bg-gray-50 rounded-lg animate-pulse mx-auto" /></td>
                    <td className="py-3 px-6 text-right"><div className="h-8 w-20 bg-gray-50 rounded-lg animate-pulse ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentCard>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 w-full">
      <SharedMasterHeader activeTab="members" setActiveTab={setActiveTab} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onAdd={() => { resetForm(); setShowForm(true); }} addLabel="Add Member" themeColor="emerald" />
      <ContentCard className="flex-1">
        {/* ===== MOBILE CARD VIEW (< lg) ===== */}
        <div className="lg:hidden overflow-auto flex-1 custom-scrollbar scroll-smooth overscroll-contain">
          {paginatedMembers.length > 0 ? (
            <div className="p-4 space-y-2">
              {paginatedMembers.map(m => (
                <div key={m.id} className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-emerald-50/40 transition-all duration-200 cursor-pointer shadow-sm group">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate leading-tight">{m.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                        <User className="w-3 h-3 text-gray-300 shrink-0" />
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">ID: {m.membership_no}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide border leading-tight ${m.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>{m.is_active ? 'Active' : 'Locked'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5 text-[10px] text-gray-400 min-w-0 flex-1 leading-tight">
                      <div className="flex items-center gap-1.5 min-w-0"><Mail className="w-3 h-3 text-emerald-500 shrink-0" /><span className="font-medium truncate tracking-tight">{m.email}</span></div>
                      <div className="flex items-center gap-1.5 min-w-0"><Phone className="w-3 h-3 text-gray-300 shrink-0" /><span className="font-bold tabular-nums tracking-tight">{m.mobile_no}</span></div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <ActionIcon onClick={(e) => { e.stopPropagation(); setEditingMember(m); setForm({ name: m.name || "", membership_no: m.membership_no || "", mobile_no: m.mobile_no || "", email: m.email || "", address: m.address || "", is_active: m.is_active === null ? true : !!m.is_active }); setShowForm(true); }} title="Edit Member" ringColor="emerald-500" className="bg-emerald-50 text-emerald-600 border border-emerald-100"><Pencil className="w-3.5 h-3.5" /></ActionIcon>
                      <ActionIcon onClick={(e) => { e.stopPropagation(); navigate(`/masters/members/${m.id}`); }} title="View Member" ringColor="blue-500" className="bg-blue-50 text-blue-600 border border-blue-100"><Eye className="w-3.5 h-3.5" /></ActionIcon>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="No members found" message="No records match your search criteria." actionText="Add Member" onAction={() => { resetForm(); setShowForm(true); }} themeColor="emerald" />
          )}
        </div>

        {/* ===== DESKTOP TABLE VIEW (lg+) ===== */}
        <div className="hidden lg:block overflow-auto flex-1 custom-scrollbar scroll-smooth overscroll-contain">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50/95 backdrop-blur-sm border-b border-gray-100">
                      <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Member Details</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Contact Information</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none text-center">Status</th>
                      <th className="py-4 px-6 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedMembers.length > 0 ? (
                      paginatedMembers.map(m => (
                        <tr key={m.id} className="hover:bg-emerald-50/40 transition-all duration-200 group cursor-pointer border-l-4 border-transparent hover:border-emerald-600">
                          <td className="py-4 px-6"><div className="flex flex-col gap-1.5 min-w-0"><p className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors tracking-tight leading-relaxed truncate">{m.name}</p><div className="flex items-center gap-2 min-w-0"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">Member ID: {m.membership_no}</span></div></div></td>
                          <td className="py-4 px-6 text-sm font-medium"><div className="flex flex-col gap-1.5 min-w-0"><div className="flex items-center gap-2 min-w-0"><Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span className="font-bold tracking-tight truncate">{m.email}</span></div><div className="flex items-center gap-2 min-w-0"><Phone className="w-3.5 h-3.5 shrink-0" /><span className="font-bold tabular-nums truncate">{m.mobile_no}</span></div></div></td>
                          <td className="py-4 px-6 text-center"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${m.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>{m.is_active ? 'Active' : 'Locked'}</span></td>
                          <td className="py-4 px-6"><div className="flex justify-end gap-2.5 shrink-0"><ActionIcon onClick={(e) => { e.stopPropagation(); setEditingMember(m); setForm({ name: m.name || "", membership_no: m.membership_no || "", mobile_no: m.mobile_no || "", email: m.email || "", address: m.address || "", is_active: m.is_active === null ? true : !!m.is_active }); setShowForm(true); }} title="Edit Member" ringColor="emerald-500" className="bg-emerald-50 text-emerald-600 border border-emerald-100"><Pencil className="w-4 h-4" /></ActionIcon><ActionIcon onClick={(e) => { e.stopPropagation(); navigate(`/masters/members/${m.id}`); }} title="View Member" ringColor="blue-500" className="bg-blue-50 text-blue-600 border border-blue-100"><Eye className="w-4 h-4" /></ActionIcon></div></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4">
                          <EmptyState icon={Users} title="No members found" message="No records match your search criteria." actionText="Add Member" onAction={() => { resetForm(); setShowForm(true); }} themeColor="emerald" />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredMembers.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} themeColor="emerald" />
      </ContentCard>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">{editingMember ? "Edit Member" : "Add Member"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="m-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {formError}</div>}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div><label className="block text-sm font-medium mb-1">Full Name *</label><input type="text" value={form.name} onChange={e => { setForm({...form, name: e.target.value}); setFieldErrors(p => ({...p, name: ""})); }} className={`w-full p-2 border rounded-lg outline-none ${fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />{fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}</div>
              <div><label className="block text-sm font-medium mb-1">Member ID *</label><input type="text" value={form.membership_no} onChange={e => { setForm({...form, membership_no: e.target.value}); setFieldErrors(p => ({...p, membership_no: ""})); }} className={`w-full p-2 border rounded-lg outline-none ${fieldErrors.membership_no ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />{fieldErrors.membership_no && <p className="text-xs text-red-600 mt-1">{fieldErrors.membership_no}</p>}</div>
              <div><label className="block text-sm font-medium mb-1">Mobile No *</label><input type="tel" maxLength={10} value={form.mobile_no} onChange={e => { setForm({...form, mobile_no: e.target.value}); setFieldErrors(p => ({...p, mobile_no: ""})); }} className={`w-full p-2 border rounded-lg outline-none ${fieldErrors.mobile_no ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />{fieldErrors.mobile_no && <p className="text-xs text-red-600 mt-1">{fieldErrors.mobile_no}</p>}</div>
              <div><label className="block text-sm font-medium mb-1">Email *</label><input type="email" value={form.email || ""} onChange={e => { setForm({...form, email: e.target.value}); setFieldErrors(p => ({...p, email: ""})); }} className={`w-full p-2 border rounded-lg outline-none ${fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />{fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}</div>
              <div><label className="block text-sm font-medium mb-1">Address *</label><textarea value={form.address || ""} onChange={e => { setForm({...form, address: e.target.value}); setFieldErrors(p => ({...p, address: ""})); }} className={`w-full p-2 border rounded-lg outline-none ${fieldErrors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} rows="3" />{fieldErrors.address && <p className="text-xs text-red-600 mt-1">{fieldErrors.address}</p>}</div>
              <div className="flex items-center gap-2 pt-2"><input type="checkbox" id="member_active" checked={!!form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /><label htmlFor="member_active" className="text-sm font-medium text-gray-700 cursor-pointer">Active Member</label></div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3 bg-gray-50"><button onClick={() => setShowForm(false)} className="px-4 py-2 font-medium text-gray-600">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}