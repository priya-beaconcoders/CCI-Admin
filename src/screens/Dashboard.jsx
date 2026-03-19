
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Users, Clock, Home, Hotel, Search, Plus, 
  LogOut, RefreshCw, AlertCircle,
  ChevronRight, ArrowRight, Bed, BarChart3,
  Calendar, Info
} from "lucide-react";
import { 
  isSameDay, startOfDay, parseISO, format, differenceInDays, 
  isAfter, subHours, differenceInHours,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval 
} from 'date-fns';
import { getBookings, checkIn, checkOut } from "../services/bookingServices";
import { getRooms } from "../services/roomServices";

/* ================= CONSTANTS ================= */
const STATUS = {
  PENDING: "Pending",
  CHECKED_IN: "Checked-in",
  CHECKED_OUT: "Checked-out",
  CANCELLED: "Cancelled",
};

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Data State
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionLoading, setActionLoading] = useState({}); // { bookingId: true }
  const [view, setView] = useState("today"); // today | week | month

  /* ================= FETCH DATA ================= */
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const [bookingsRes, roomsRes] = await Promise.all([
        getBookings(),
        getRooms()
      ]);
      
      const bookingsData = bookingsRes.data?.data || bookingsRes.data || [];
      const roomsData = roomsRes.data?.data || roomsRes.data || [];
      
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
    } catch (err) {
      console.error("❌ Dashboard Load Error:", err);
      setError("Failed to load dashboard data. Please check your connection.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ================= SEARCH DEBOUNCE ================= */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  /* ================= DERIVED STATS (MEMOIZED) ================= */
  const today = useMemo(() => startOfDay(new Date()), []);

  const isInRange = useCallback((date) => {
    if (!date) return false;
    if (view === "today") return isSameDay(date, today);
    
    if (view === "week") {
      return isWithinInterval(date, {
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      });
    }
    
    if (view === "month") {
      return isWithinInterval(date, {
        start: startOfMonth(today),
        end: endOfMonth(today),
      });
    }
    return false;
  }, [view, today]);

  const dashboardData = useMemo(() => {
    // 1. Source Data for Operational Table (Arrivals or Departures in range)
    const tableSourceBookings = bookings.filter(b => {
      if (b.status === STATUS.CANCELLED) return false;
      const ci = b.check_in ? parseISO(b.check_in) : null;
      const co = b.check_out ? parseISO(b.check_out) : null;
      return (ci && isInRange(ci)) || (co && isInRange(co));
    });

    // 2. Source Data for Revenue (Synced with Table Source - Arrivals or Departures in range)
    const revenueSourceBookings = bookings.filter(b => {
      if (b.status === STATUS.CANCELLED) return false;
      const ci = b.check_in ? parseISO(b.check_in) : null;
      const co = b.check_out ? parseISO(b.check_out) : null;
      return (ci && isInRange(ci)) || (co && isInRange(co));
    });

    // 3. Financial Metrics (Final Production Architecture)
    const num = (val) => Number(val || 0);

    const totalRevenue = revenueSourceBookings.reduce((sum, b) => {
      return sum + num(b.total_amount || b.total_amt);
    }, 0);

    const totalCollected = revenueSourceBookings.reduce((sum, b) => {
      const total = num(b.total_amount || b.total_amt);
      const paid = num(b.total_paid || b.paid_amount);
      // Clamping paid to total ensures overpayments don't cause negative pending
      return sum + Math.min(paid, total);
    }, 0);

    const totalPending = Math.max(totalRevenue - totalCollected, 0);

    // Debug logging as requested via verdict
    console.log("💰 Revenue Integrity Check:", {
      view,
      count: revenueSourceBookings.length,
      totalRevenue,
      totalCollected,
      totalPending
    });

    // 4. Operational Events (Individual check-ins/check-outs)
    const tableEvents = [];
    tableSourceBookings.forEach(b => {
      const ci = b.check_in ? parseISO(b.check_in) : null;
      const co = b.check_out ? parseISO(b.check_out) : null;
      
      if (ci && isInRange(ci)) {
        tableEvents.push({ ...b, opType: "check-in", sortDate: ci });
      }
      if (co && isInRange(co) && b.status !== STATUS.PENDING) {
        tableEvents.push({ ...b, opType: "check-out", sortDate: co });
      }
    });

    // 5. Counts (Always Today for Header Cards)
    const checkInsCount = bookings.filter(b => {
      const date = b.check_in ? parseISO(b.check_in) : null;
      return date && isSameDay(date, today) && b.status !== STATUS.CANCELLED;
    }).length;

    const checkOutsCount = bookings.filter(b => {
      const date = b.check_out ? parseISO(b.check_out) : null;
      return date && isSameDay(date, today) && b.status !== STATUS.CANCELLED;
    }).length;

    const occupiedCount = rooms.filter(r => r.status?.toLowerCase() === 'occupied' || r.status?.toLowerCase() === 'booked').length;
    const availableCount = rooms.length - occupiedCount;

    // 6. Sorting & Filtering Table
    const combinedList = tableEvents.sort((a, b) => {
      const diff = new Date(a.sortDate) - new Date(b.sortDate);
      if (diff !== 0) return diff;
      return a.opType === 'check-in' ? -1 : 1;
    });

    const filteredList = combinedList.filter(b => {
      const term = debouncedSearch.toLowerCase();
      return (
        b.guest_name?.toLowerCase().includes(term) ||
        b.id?.toString().includes(term) ||
        (b.rooms?.[0]?.room_no || "").toString().includes(term)
      );
    }).slice(0, 10);

    // Placeholder Fill (min 6 rows)
    const tableRows = [...filteredList];

    return {
      checkInsCount,
      checkOutsCount,
      occupiedCount,
      availableCount,
      filteredList: tableRows,
      totalCount: combinedList.length,
      totalRevenue,
      totalCollected,
      totalPending
    };
  }, [bookings, rooms, today, debouncedSearch, isInRange]);

  const handleAction = async (e, id, type) => {
    e.stopPropagation(); // Safe navigation guard
    if (actionLoading[id]) return;
    const confirmMsg = type === 'checkin' ? "Confirm Check-in?" : "Confirm Check-out?";
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(prev => ({ ...prev, [id]: true }));
    const toastId = toast.loading(`${type === 'checkin' ? 'Checking in' : 'Checking out'}...`);

    try {
      if (type === 'checkin') await checkIn(id);
      else await checkOut(id);
      toast.success("Action successful!", { id: toastId });
      await fetchData(true);
    } catch (err) {
      toast.error(`Failed to handle action.`, { id: toastId });
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  /* ================= HELPERS ================= */
  const formatDateSafe = (dateStr) => {
    try {
      if (!dateStr) return "—";
      return format(parseISO(dateStr), "dd MMM, hh:mm a");
    } catch (e) {
      return dateStr;
    }
  };

  const getNights = (start, end) => {
    try {
       if (!start || !end) return 1;
       const diff = differenceInDays(parseISO(end), parseISO(start));
       return diff <= 0 ? 1 : diff;
    } catch (e) { return 1; }
  };

  const getUrgency = (booking) => {
    if (booking.status !== STATUS.PENDING) return null;
    const checkInDate = booking.check_in ? parseISO(booking.check_in) : null;
    if (!checkInDate || !isSameDay(checkInDate, today)) return null;
    
    const now = new Date();
    if (isAfter(now, subHours(checkInDate, 2))) {
        const hours = differenceInHours(checkInDate, now);
        if (hours <= 0) return "Arriving now";
        return `Arriving in < ${hours + 1} hrs`;
    }
    return null;
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <>
      <div className="space-y-4 pb-2">
        {/* 1. TOP STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-0.5">
          <StatCard title="Check-ins Today" value={dashboardData.checkInsCount} icon={<Users className="w-5 h-5"/>} color="blue" />
          <StatCard title="Check-outs Today" value={dashboardData.checkOutsCount} icon={<LogOut className="w-5 h-5"/>} color="orange" />
          <StatCard title="Available Rooms" value={dashboardData.availableCount} icon={<Home className="w-5 h-5"/>} color="green" />
          <StatCard title="Occupied Rooms" value={dashboardData.occupiedCount} icon={<Hotel className="w-5 h-5"/>} color="purple" />
        </div>

        {/* 2. MAIN GRID (70/30) */}
        <div className="grid grid-cols-12 gap-4 items-stretch">
          
          {/* LEFT: OPERATIONS HUB */}
          <div className="col-span-12 lg:col-span-8 lg:relative order-2 lg:order-1">
          <div className="flex flex-col gap-4 h-[500px] lg:h-auto lg:absolute lg:inset-0 p-0.5">
            
            <div className="bg-white/90 backdrop-blur-sm border border-gray-100 shadow-lg rounded-2xl p-4 flex justify-between items-center ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                 </div>
                 <div className="flex-1">
                   <p className="text-sm text-gray-700 font-semibold tracking-tight">
                    <span className="tabular-nums">{dashboardData.totalCount}</span> operations scheduled for <span className="capitalize">{view}</span>
                   </p>
                 </div>
              </div>
              <button onClick={() => navigate(`/bookings?view=${view}`)} className="text-[11px] text-blue-600 font-bold uppercase tracking-wider hover:underline">
                View All
              </button>
            </div>

            <div className="shadow-lg rounded-2xl border border-gray-100 bg-white/90 backdrop-blur-sm ring-1 ring-black/5 flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 flex flex-col overflow-hidden rounded-2xl text-gray-900">
                <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">Operational Hub</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                            <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Live</p>
                        </div>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-xl w-fit shrink-0">
                      {["today", "week", "month"].map(v => (
                        <button
                          key={v}
                          onClick={() => setView(v)}
                          className={`w-16 sm:w-20 py-1 text-[10px] uppercase tracking-wider rounded-lg font-bold transition-all ${
                            view === v
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input 
                      type="text"
                      placeholder="Search name, ID, or room..."
                      className="w-full pl-10 pr-4 py-2 bg-white/60 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400 font-medium"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 border-t border-gray-100 transition-all duration-150 ease-out pb-8 flex flex-col" style={{ scrollbarGutter: 'stable' }}>
                  {dashboardData.filteredList.length > 0 ? (
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-[10px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-100">
                        <tr>
                          <th className="pl-8 pr-6 py-3.5">Guest & Details</th>
                          <th className="px-6 py-3.5">Room</th>
                          <th className="px-6 py-3.5 block sm:table-cell">Arrival / Departure</th>
                          <th className="px-6 py-3.5 hidden md:table-cell">Status</th>
                          <th className="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {dashboardData.filteredList.map((booking, index) => (
                          <tr 
                            key={`${booking.id}-${booking.opType}`} 
                            onClick={() => navigate(`/bookings/${booking.id}`)}
                            className="hover:bg-gray-50 transition-all cursor-pointer group border-l-4 border-transparent hover:border-blue-600 relative"
                          >
                            <td className="pl-8 pr-6 py-4">
                              <div className="flex items-center gap-2 mb-1">
                                 <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm tracking-tight">{booking.guest_name}</p>
                                 <div className="flex gap-1">
                                    {booking.opType === 'both' ? (
                                        <>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter bg-blue-50 text-blue-600">Arrival</span>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter bg-orange-50 text-orange-600">Departure</span>
                                        </>
                                    ) : (
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter ${
                                            booking.opType === 'check-in' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                                        }`}>
                                            {booking.opType === 'check-in' ? 'Arrival' : 'Departure'}
                                        </span>
                                    )}
                                 </div>
                                 {index === 0 && !debouncedSearch && view === 'today' && (
                                    <span className="text-[9px] text-green-600 font-bold bg-green-50 px-1 rounded animate-pulse">NEXT</span>
                                 )}
                              </div>
                              <div className="flex items-center gap-2">
                                 <p className="text-[10px] text-gray-400 font-medium tracking-tight">#{booking.id}</p>
                                 <span className="text-gray-300">•</span>
                                 <p className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
                                    {getNights(booking.check_in, booking.check_out)} Nights • ₹{booking.total_amount || booking.total_amt || "0"}
                                 </p>
                              </div>
                              {/* Payment Line - Final stabilized Logic */}
                              <div className="flex items-center gap-2 mt-0.5">
                                 <p className={`text-[10px] font-bold ${((Number(booking.total_amt ?? booking.total_amount ?? 0) - Math.min(Number(booking.total_paid ?? 0), Number(booking.total_amt ?? booking.total_amount ?? 0))) > 0) ? 'text-red-500' : 'text-green-600'}`}>
                                    {(Number(booking.total_amt ?? booking.total_amount ?? 0) - Math.min(Number(booking.total_paid ?? 0), Number(booking.total_amt ?? booking.total_amount ?? 0))) > 0 
                                      ? `Due ₹${Number(booking.total_amt ?? booking.total_amount ?? 0) - Math.min(Number(booking.total_paid ?? 0), Number(booking.total_amt ?? booking.total_amount ?? 0))}`
                                      : `Paid ₹${booking.total_amt ?? booking.total_amount ?? "0"}`}
                                 </p>
                                 {(Number(booking.total_amt ?? booking.total_amount ?? 0) - Math.min(Number(booking.total_paid ?? 0), Number(booking.total_amt ?? booking.total_amount ?? 0))) > 5000 && (
                                   <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-bold uppercase tracking-tight">
                                      HIGH PENDING
                                   </span>
                                 )}
                              </div>
                              {booking.status === STATUS.PENDING && (booking.opType === 'check-in' || booking.opType === 'both') && (
                                <p className="text-[10px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                                   <Clock className="w-2.5 h-2.5" /> Awaiting Check-in
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                                 {booking.rooms?.[0]?.room_no || "—"}
                              </span>
                            </td>
                            <td className="px-6 py-4 block sm:table-cell">
                              <div className="text-[10px] font-medium space-y-1">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <ArrowRight className={`w-2.5 h-2.5 ${(booking.opType === 'check-in' || booking.opType === 'both') ? 'text-blue-500 font-bold' : 'text-gray-300'}`} />
                                    <span className={(booking.opType === 'check-in' || booking.opType === 'both') ? 'font-bold' : ''}>{formatDateSafe(booking.check_in)}</span>
                                    {getUrgency(booking) && (
                                        <span className="text-red-500 font-bold ml-1 animate-pulse flex items-center gap-1">
                                          <AlertCircle className="w-2.5 h-2.5" /> {getUrgency(booking)}
                                        </span>
                                    )}
                                </div>
                                <p className="flex items-center gap-2 text-gray-400">
                                    <LogOut className={`w-2.5 h-2.5 ${(booking.opType === 'check-out' || booking.opType === 'both') ? 'text-orange-500 font-bold' : 'text-gray-300'}`} />
                                    <span className={(booking.opType === 'check-out' || booking.opType === 'both') ? 'font-bold' : ''}>{formatDateSafe(booking.check_out)}</span>
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                              <StatusBadge status={booking.status} />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {booking.status === STATUS.PENDING && (booking.opType === 'check-in' || booking.opType === 'both') && (
                                  <button 
                                    onClick={(e) => handleAction(e, booking.id, 'checkin')}
                                    disabled={actionLoading[booking.id]}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all hover:scale-[1.02] disabled:opacity-50"
                                  >
                                    {actionLoading[booking.id] ? "..." : "Check-in"}
                                  </button>
                                )}
                                {booking.status === STATUS.CHECKED_IN && (booking.opType === 'check-out' || booking.opType === 'both') && (
                                  <button 
                                    onClick={(e) => handleAction(e, booking.id, 'checkout')}
                                    disabled={actionLoading[booking.id]}
                                    className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 shadow-sm transition-all hover:scale-[1.02] disabled:opacity-50"
                                  >
                                    {actionLoading[booking.id] ? "..." : "Check-out"}
                                  </button>
                                )}
                                <button className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all hidden sm:block">
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <EmptyState searchTerm={searchTerm} />
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* RIGHT: QUICK PANEL */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 order-1 lg:order-2">
            
            {/* A. SUMMARY CARD - STABILIZED */}
            <div className="shadow-lg rounded-2xl border border-gray-100 bg-white/90 backdrop-blur-sm ring-1 ring-black/5">
              <div className="p-5 min-w-[280px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate w-32">{view} Summary</h3>
                  <p className="text-[10px] text-gray-400 italic font-medium">Daily Actions</p>
                </div>
                <div className="space-y-4">
                    <div className="flex items-baseline justify-between transition-all">
                        <p className="text-4xl font-bold text-gray-900 tracking-tighter tabular-nums">
                            {dashboardData.totalCount}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                        <div>
                            <p className="text-lg font-bold text-blue-600 tabular-nums">{dashboardData.checkInsCount}</p>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Check-ins</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-orange-600 tabular-nums">{dashboardData.checkOutsCount}</p>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Check-outs</p>
                        </div>
                    </div>

                    {/* Financial Insights - Zero Redesign */}
                    <div className="pt-4 border-t border-gray-50 space-y-3">
                        <div className="flex justify-between items-center h-5">
                            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-tight">Room Revenue</p>
                            <p className="text-base font-bold text-gray-900 tabular-nums">₹{dashboardData.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center h-5">
                            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-tight">Collected</p>
                            <p className="text-base font-bold text-green-600 tabular-nums">₹{dashboardData.totalCollected.toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center h-5">
                            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-tight">Pending</p>
                            <p className="text-base font-bold text-red-600 tabular-nums">₹{dashboardData.totalPending.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
              </div>
            </div>

            <div className="shadow-lg rounded-2xl border border-gray-100 bg-white/90 backdrop-blur-sm ring-1 ring-black/5">
              <div className="p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 tracking-tight">Quick Actions</h3>
                <div className="flex gap-3">
                  <ActionButton 
                    label="New Booking" 
                    icon={<Plus className="w-4 h-4" />} 
                    onClick={() => navigate('/bookings')}
                    color="blue"
                  />
                  <ActionButton 
                    label="Search" 
                    icon={<Search className="w-4 h-4" />} 
                    onClick={() => navigate('/bookings')}
                    color="gray"
                  />
                </div>
              </div>
            </div>

            <div className="shadow-lg rounded-2xl border border-gray-100 bg-white/90 backdrop-blur-sm ring-1 ring-black/5">
              <div className="p-5 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Room Availability</h3>
                    <Bed className="w-4 h-4 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <div>
                    <RoomStatusRow label="Available Now" count={dashboardData.availableCount} color="green" />
                    <RoomStatusRow label="Occupied" count={dashboardData.occupiedCount} color="purple" />
                  </div>
                  <div className="pt-2 border-t border-gray-50 mt-2">
                    <RoomStatusRow label="Total Units" count={rooms.length} color="gray" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ================= SUB-COMPONENTS ================= */

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    green: "bg-green-50 text-green-600 border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };
  
  return (
    <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-gray-100 shadow-lg hover:border-blue-200 transition-all flex items-center justify-between group">
      <div className="space-y-0.5">
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-bold text-gray-900 tracking-tighter tabular-nums">{value}</p>
      </div>
      <div className={`p-2.5 rounded-xl border ${colors[color]} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    [STATUS.PENDING]: "bg-yellow-50 text-yellow-700 border-yellow-200",
    [STATUS.CHECKED_IN]: "bg-green-50 text-green-700 border-green-200",
    [STATUS.CHECKED_OUT]: "bg-gray-50 text-gray-500 border-gray-200 shadow-inner",
    [STATUS.CANCELLED]: "bg-red-50 text-red-700 border-red-200",
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-bold border tracking-wider ${styles[status] || styles[STATUS.PENDING]}`}>
      {status}
    </span>
  );
}

function ActionButton({ label, icon, onClick, color }) {
    const bg = color === 'blue' ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200';
    return (
        <button 
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl transition-all font-semibold text-xs hover:scale-[1.02] ${bg}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

function RoomStatusRow({ label, count, color }) {
  const dots = { green: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]", purple: "bg-purple-500", gray: "bg-gray-400" };
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-blue-50 transition-colors">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-tighter">
        <div className={`w-1.5 h-1.5 rounded-full ${dots[color]}`} />
        <span>{label}</span>
      </div>
      <span className="text-sm font-bold text-gray-900 tracking-tight">{count}</span>
    </div>
  );
}

function EmptyState({ searchTerm }) {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/50 border-t border-gray-50">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-110">
        <Calendar className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 tracking-tight">
        {searchTerm ? "No matching operations found" : "No operations scheduled for today"}
      </h3>
      <p className="text-gray-500 text-sm mt-1 max-w-[280px] font-medium leading-relaxed">
        {searchTerm 
          ? "We couldn't find any results for your search. Try adjusting your filters." 
          : "New bookings will appear here once created."
        }
      </p>
      {!searchTerm && (
        <button 
          onClick={() => navigate('/bookings')}
          className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> New Booking
        </button>
      )}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="py-20 text-center bg-white rounded-3xl border border-red-50">
      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Connection Error</h3>
      <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto font-medium">{message}</p>
      <button onClick={() => onRetry()} className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all inline-flex items-center gap-2 text-sm uppercase">
        <RefreshCw className="w-4 h-4" /> Reconnect
      </button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 1. Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/90 p-5 rounded-2xl border border-gray-100 shadow-md flex justify-between items-center h-[108px]">
            <div className="space-y-3">
              <div className="h-2 w-16 bg-gray-100 rounded animate-shimmer" />
              <div className="h-8 w-12 bg-gray-100 rounded animate-shimmer" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-100 animate-shimmer" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6 items-stretch h-[540px]">
        {/* 2. Operational Hub Skeleton */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="h-[72px] bg-white/90 rounded-2xl border border-gray-100 shadow-md animate-shimmer opacity-50" />
          
          <div className="bg-white/90 rounded-2xl border border-gray-100 shadow-md flex-1 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-gray-100 rounded animate-shimmer" />
                <div className="h-2 w-20 bg-gray-100 rounded animate-shimmer" />
              </div>
              <div className="h-10 w-48 bg-gray-50 rounded-xl animate-shimmer" />
            </div>
            <div className="flex-1 p-0">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border-b border-gray-50 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-100 rounded animate-shimmer" />
                      <div className="h-2 w-24 bg-gray-50 rounded animate-shimmer" />
                    </div>
                  </div>
                  <div className="h-8 w-16 bg-gray-50 rounded-lg animate-shimmer" />
                  <div className="h-8 w-24 bg-gray-50 rounded-lg animate-shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Right Sidebar Skeleton */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 h-full">
          <div className="bg-white/90 rounded-2xl border border-gray-100 shadow-md p-5 h-[220px] space-y-6">
             <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-gray-100 rounded animate-shimmer" />
                <div className="h-2 w-16 bg-gray-50 rounded animate-shimmer" />
             </div>
             <div className="h-12 w-full bg-gray-50 rounded-xl animate-shimmer" />
             <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <div className="h-2 w-20 bg-gray-50 rounded animate-shimmer" />
                    <div className="h-2 w-12 bg-gray-100 rounded animate-shimmer" />
                  </div>
                ))}
             </div>
          </div>
          <div className="bg-white/90 rounded-2xl border border-gray-100 shadow-md p-5 h-[120px] flex gap-3">
             <div className="flex-1 bg-gray-50/50 rounded-xl animate-shimmer" />
             <div className="flex-1 bg-gray-50/50 rounded-xl animate-shimmer" />
          </div>
          <div className="bg-white/90 rounded-2xl border border-gray-100 shadow-md p-5 flex-1 flex flex-col space-y-4">
             <div className="flex justify-between items-center mb-2">
                <div className="h-4 w-32 bg-gray-100 rounded animate-shimmer" />
                <div className="h-4 w-4 bg-gray-50 rounded animate-shimmer" />
             </div>
             <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                   {[...Array(2)].map((_, l) => (
                     <div key={l} className="h-8 w-full bg-gray-50/50 rounded-lg animate-shimmer" />
                   ))}
                </div>
                <div className="pt-2 border-t border-gray-50 mt-2">
                   <div className="h-8 w-full bg-gray-50/50 rounded-lg animate-shimmer" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}