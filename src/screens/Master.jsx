import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Pencil, X, Users, Home, User, Mail, Phone, CheckCircle, AlertCircle, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye } from "lucide-react";

// Import services
import * as roomService from "../services/roomServices";
import * as memberService from "../services/memberServices";

export default function Masters() {
  const [activeTab, setActiveTab] = useState("rooms");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="flex-1 w-full flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 space-y-4">
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
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 flex items-center gap-3 shadow-2xl">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700 font-bold">Processing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= SHARED HEADER ================= */
function SharedMasterHeader({ activeTab, setActiveTab, searchTerm, setSearchTerm, onAdd, addLabel, themeColor, icons }) {
  const isOrange = themeColor === 'orange';
  const themeHex = isOrange ? 'orange-500' : 'green-600';
  const ringHex = isOrange ? 'orange-500/20' : 'green-500/20';
  const borderFocus = isOrange ? 'border-orange-500' : 'border-green-500';

  return (
    <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/20 shadow-sm mb-4">
      <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
        {/* Tabs inside the card */}
        <div className="bg-gray-100/50 p-1 rounded-xl inline-flex w-full md:w-auto">
          <button
            onClick={() => setActiveTab("rooms")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === "rooms" 
                ? "bg-white text-orange-600 shadow-sm" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            Rooms
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === "members" 
                ? "bg-white text-green-600 shadow-sm" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Members
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80 group">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-${themeHex}`} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`} 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-${ringHex} focus:${borderFocus} outline-none transition-all placeholder:text-gray-400 font-medium`}
          />
        </div>
      </div>

      <button 
        onClick={onAdd} 
        className={`w-full lg:w-auto px-6 py-2.5 bg-${isOrange ? 'orange-500' : 'green-600'} text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-${isOrange ? 'orange-100' : 'green-100'} hover:scale-[1.02] transition-all active:scale-95`}
      >
        <Plus className="w-5 h-5" />
        {addLabel}
      </button>
    </div>
  );
}

/* ================= PAGINATION COMPONENT ================= */
function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) {
  if (!totalItems || totalItems === 0) return null;

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
            className="bg-transparent border-none text-xs font-bold text-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500/20 py-1 cursor-pointer"
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
              : 'text-gray-800 hover:bg-orange-50 hover:text-orange-600'
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
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${currentPage === i ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
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
              : 'text-gray-800 hover:bg-orange-50 hover:text-orange-600'
            }`}
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ================= ROOMS MASTER ================= */
function RoomsMaster({ setError, setLoading, activeTab, setActiveTab }) {
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
  const roomStatuses = ["Available", "Booked", "Maintenance", "Cleaning"];

  const fetchRooms = async () => {
    try {
      setDataLoading(true);
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
      console.log("🗑️ Deleting room ID:", id);
      await roomService.deleteRoom(id);
      await fetchRooms();
    } catch (err) {
      console.error("❌ DELETE ERROR FULL OBJECT:", err);
      let errorMsg = "Failed to delete room.";
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
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

  if (dataLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-0 space-y-4 w-full">
        {/* Skeleton Header — matches SharedMasterHeader: tabs + search + add button */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/20 shadow-sm mb-4">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
            {/* Tab placeholders */}
            <div className="bg-gray-100/50 p-1 rounded-xl inline-flex gap-1">
              <div className="h-9 w-24 bg-white rounded-lg animate-shimmer shadow-sm" />
              <div className="h-9 w-28 bg-gray-50 rounded-lg animate-shimmer" />
            </div>
            {/* Search placeholder */}
            <div className="h-[42px] w-full md:w-80 bg-gray-50 rounded-xl animate-shimmer" />
          </div>
          {/* Add button placeholder */}
          <div className="h-[42px] w-full lg:w-32 bg-orange-100/50 rounded-xl animate-shimmer" />
        </div>

        {/* Skeleton Table — uses real <table> to match 4-column Rooms layout */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md min-h-0 flex-1 flex flex-col overflow-hidden">
          <div className="overflow-hidden flex-1">
            <table className="w-full text-left border-separate border-spacing-0 min-w-[700px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50/95 backdrop-blur-sm border-b border-gray-100">
                  <th className="py-4 px-6"><div className="h-3 w-32 bg-gray-200 rounded animate-shimmer" /></th>
                  <th className="py-4 px-6"><div className="h-3 w-28 bg-gray-200 rounded animate-shimmer" /></th>
                  <th className="py-4 px-6 text-center"><div className="h-3 w-16 bg-gray-200 rounded animate-shimmer mx-auto" /></th>
                  <th className="py-4 px-6 text-right"><div className="h-3 w-16 bg-gray-200 rounded animate-shimmer ml-auto" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {/* Room Information */}
                    <td className="py-3 px-6">
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-100 rounded animate-shimmer" />
                        <div className="h-2 w-40 bg-gray-50 rounded animate-shimmer" />
                      </div>
                    </td>
                    {/* Pricing Structure */}
                    <td className="py-3 px-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-10 bg-gray-50/50 rounded animate-shimmer" />
                          <div className="h-3 w-16 bg-gray-100 rounded animate-shimmer" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-10 bg-gray-50/50 rounded animate-shimmer" />
                          <div className="h-3 w-16 bg-gray-100 rounded animate-shimmer" />
                        </div>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="py-3 px-6 text-center">
                      <div className="h-6 w-20 bg-gray-50 rounded-lg animate-shimmer mx-auto" />
                    </td>
                    {/* Actions */}
                    <td className="py-3 px-6">
                      <div className="flex justify-end gap-2.5">
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
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 w-full">
      <SharedMasterHeader 
        activeTab="rooms" 
        setActiveTab={setActiveTab} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onAdd={() => { resetForm(); setShowForm(true); }} 
        addLabel="Add Room" 
        themeColor="orange" 
      />

      <div className="bg-white border border-gray-100 rounded-2xl shadow-md min-h-0 flex-1 flex flex-col overflow-hidden">
        {/* ===== MOBILE CARD VIEW (< lg) ===== */}
        <div className="lg:hidden overflow-auto flex-1 custom-scrollbar scroll-smooth overscroll-contain">
          {paginatedRooms.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {paginatedRooms.map(room => (
                <div key={room.id} className="p-4 hover:bg-orange-50/40 transition-all duration-200 cursor-pointer">
                  {/* Row 1: Room Info + Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900">Room {room.room_no}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-gray-400 font-medium italic">{room.type}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="text-[11px] text-gray-400 font-medium">Limit: {room.guest_limit}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${
                      room.status === 'Available' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>{room.status}</span>
                  </div>
                  {/* Row 2: Pricing + Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="font-bold tabular-nums">3D: ₹{room.price_3day}</span>
                      <span className="text-gray-300">•</span>
                      <span className="font-bold tabular-nums">7D: ₹{room.price_7day}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(room); }}
                        className="p-1.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg transition-all shadow-sm" title="Edit Room">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/masters/rooms/${room.id}`); }}
                        className="p-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg transition-all shadow-sm" title="View Room">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(room.id); }}
                        className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg transition-all shadow-sm" title="Delete Room">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 font-medium italic">No rooms found.</div>
          )}
        </div>

        {/* ===== DESKTOP TABLE VIEW (lg+) ===== */}
        <div className="hidden lg:block overflow-auto flex-1 custom-scrollbar scroll-smooth overscroll-contain">
          <table className="w-full text-left border-separate border-spacing-0 min-w-[700px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50/95 backdrop-blur-sm border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Room Information</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Pricing Structure</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="py-4 px-6 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedRooms.length > 0 ? (
                paginatedRooms.map(room => (
                  <tr key={room.id} className="hover:bg-orange-50/40 transition-all duration-200 group cursor-pointer border-l-4 border-transparent hover:border-orange-600">
                    <td className="py-3 px-6">
                      <div className="flex flex-col gap-1.5">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-orange-700 transition-colors tracking-tight leading-relaxed">Room {room.room_no}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-gray-400 font-medium tracking-tight italic">{room.type}</span>
                           <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Limit: {room.guest_limit} Guests</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                       <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] text-gray-400 font-bold uppercase w-12 text-gray-300">3 Day:</span>
                             <span className="text-xs font-bold text-gray-900 tabular-nums">₹{room.price_3day}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] text-gray-400 font-bold uppercase w-12 text-gray-300">7 Day:</span>
                             <span className="text-xs font-bold text-gray-900 tabular-nums">₹{room.price_7day}</span>
                          </div>
                       </div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${
                        room.status === 'Available' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>{room.status}</span>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex justify-end gap-2.5">
                         <button 
                          onClick={(e) => { e.stopPropagation(); openEdit(room); }} 
                          className="p-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm active:scale-90"
                          title="Edit Room"
                         >
                          <Pencil className="w-4 h-4" />
                         </button>
                         <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/masters/rooms/${room.id}`); }} 
                          className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
                          title="View Room"
                         >
                          <Eye className="w-4 h-4" />
                         </button>
                         <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(room.id); }} 
                          className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90"
                          title="Delete Room"
                         >
                          <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan="4" className="py-12 text-center text-gray-500 font-medium italic">No rooms found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="shrink-0 border-t border-gray-100">
          <Pagination 
            currentPage={currentPage} totalPages={totalPages} 
            totalItems={filteredRooms.length} itemsPerPage={itemsPerPage} 
            onPageChange={setCurrentPage} 
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      </div>

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
function MembersMaster({ setError, setLoading, activeTab, setActiveTab }) {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formError, setFormError] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [form, setForm] = useState({ 
    name: "", 
    membership_no: "", 
    mobile_no: "", 
    email: "", 
    address: "",
    is_active: true 
  });

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

  if (dataLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-0 space-y-4 w-full">
        {/* Skeleton Header — matches SharedMasterHeader: tabs + search + add button */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/20 shadow-sm mb-4">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
            {/* Tab placeholders */}
            <div className="bg-gray-100/50 p-1 rounded-xl inline-flex gap-1">
              <div className="h-9 w-24 bg-gray-50 rounded-lg animate-shimmer" />
              <div className="h-9 w-28 bg-white rounded-lg animate-shimmer shadow-sm" />
            </div>
            {/* Search placeholder */}
            <div className="h-[42px] w-full md:w-80 bg-gray-50 rounded-xl animate-shimmer" />
          </div>
          {/* Add button placeholder */}
          <div className="h-[42px] w-full lg:w-36 bg-green-100/50 rounded-xl animate-shimmer" />
        </div>

        {/* Skeleton Table — uses real <table> to match 4-column Members layout */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md min-h-0 flex-1 flex flex-col overflow-hidden">
          <div className="overflow-hidden flex-1">
            <table className="w-full text-left border-separate border-spacing-0 min-w-[700px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50/95 backdrop-blur-sm border-b border-gray-100">
                  <th className="py-4 px-6"><div className="h-3 w-28 bg-gray-200 rounded animate-shimmer" /></th>
                  <th className="py-4 px-6"><div className="h-3 w-36 bg-gray-200 rounded animate-shimmer" /></th>
                  <th className="py-4 px-6 text-center"><div className="h-3 w-16 bg-gray-200 rounded animate-shimmer mx-auto" /></th>
                  <th className="py-4 px-6 text-right"><div className="h-3 w-16 bg-gray-200 rounded animate-shimmer ml-auto" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {/* Member Details */}
                    <td className="py-3 px-6">
                      <div className="space-y-2">
                        <div className="h-4 w-28 bg-gray-100 rounded animate-shimmer" />
                        <div className="h-2 w-36 bg-gray-50 rounded animate-shimmer" />
                      </div>
                    </td>
                    {/* Contact Information */}
                    <td className="py-3 px-6">
                      <div className="space-y-2">
                        <div className="h-3 w-36 bg-gray-50 rounded animate-shimmer" />
                        <div className="h-2 w-28 bg-gray-50/50 rounded animate-shimmer" />
                      </div>
                    </td>
                    {/* Status */}
                    <td className="py-3 px-6 text-center">
                      <div className="h-6 w-16 bg-gray-50 rounded-lg animate-shimmer mx-auto" />
                    </td>
                    {/* Actions */}
                    <td className="py-3 px-6">
                      <div className="flex justify-end gap-2.5">
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
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 w-full">
      <SharedMasterHeader 
        activeTab="members" 
        setActiveTab={setActiveTab} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onAdd={() => { resetForm(); setShowForm(true); }} 
        addLabel="Add Member" 
        themeColor="green" 
      />

      <div className="bg-white border border-gray-100 rounded-2xl shadow-md min-h-0 flex-1 flex flex-col overflow-hidden">
        {/* ===== MOBILE CARD VIEW (< lg) ===== */}
        <div className="lg:hidden overflow-auto flex-1 custom-scrollbar scroll-smooth overscroll-contain">
          {paginatedMembers.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {paginatedMembers.map(m => (
                <div key={m.id} className="p-4 hover:bg-green-50/40 transition-all duration-200 cursor-pointer">
                  {/* Row 1: Name + Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{m.name}</p>
                      <span className="text-[11px] text-gray-400 font-medium">ID: {m.membership_no}</span>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${
                      m.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'
                    }`}>{m.is_active ? 'Active' : 'Locked'}</span>
                  </div>
                  {/* Row 2: Contact + Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5 text-xs text-gray-500 min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-green-500 shrink-0" />
                        <span className="font-medium truncate">{m.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-gray-300 shrink-0" />
                        <span className="font-bold tabular-nums">{m.mobile_no}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={(e) => { 
                        e.stopPropagation();
                        setEditingMember(m); 
                        setForm({ name: m.name || "", membership_no: m.membership_no || "", mobile_no: m.mobile_no || "", email: m.email || "", address: m.address || "", is_active: m.is_active === null ? true : !!m.is_active }); 
                        setShowForm(true); 
                      }} className="p-1.5 bg-green-50 text-green-600 border border-green-100 rounded-lg transition-all shadow-sm" title="Edit Member">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/masters/members/${m.id}`); }}
                        className="p-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg transition-all shadow-sm" title="View Member">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 font-medium italic">No members found.</div>
          )}
        </div>

        {/* ===== DESKTOP TABLE VIEW (lg+) ===== */}
        <div className="hidden lg:block overflow-auto flex-1 custom-scrollbar scroll-smooth overscroll-contain">
          <table className="w-full text-left border-separate border-spacing-0 min-w-[700px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50/95 backdrop-blur-sm border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Member Details</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Information</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="py-4 px-6 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedMembers.length > 0 ? (
                paginatedMembers.map(m => (
                  <tr key={m.id} className="hover:bg-green-50/40 transition-all duration-200 group cursor-pointer border-l-4 border-transparent hover:border-green-600">
                    <td className="py-3 px-6">
                      <div className="flex flex-col gap-1.5">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-green-700 transition-colors tracking-tight leading-relaxed">{m.name}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Member ID: {m.membership_no}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex flex-col gap-1.5">
                         <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-3 h-3 text-green-500" />
                            <span className="text-xs font-bold tracking-tight">{m.email}</span>
                         </div>
                         <div className="flex items-center gap-2 text-gray-400">
                            <Phone className="w-3 h-3 text-gray-300" />
                            <span className="text-xs font-bold tabular-nums">{m.mobile_no}</span>
                         </div>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${
                        m.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'
                      }`}>
                        {m.is_active ? 'Active' : 'Locked'}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex justify-end gap-2.5">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation();
                            setEditingMember(m); 
                            setForm({
                              name: m.name || "",
                              membership_no: m.membership_no || "",
                              mobile_no: m.mobile_no || "",
                              email: m.email || "",
                              address: m.address || "",
                              is_active: m.is_active === null ? true : !!m.is_active
                            }); 
                            setShowForm(true); 
                          }} 
                          className="p-2 bg-green-50 text-green-600 border border-green-100 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-90"
                          title="Edit Member"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/masters/members/${m.id}`); }} 
                          className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
                          title="View Member"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan="4" className="py-12 text-center text-gray-500 font-medium italic">No members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="shrink-0 border-t border-gray-100">
          <Pagination 
            currentPage={currentPage} totalPages={totalPages} 
            totalItems={filteredMembers.length} itemsPerPage={itemsPerPage} 
            onPageChange={setCurrentPage} 
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      </div>

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