
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Users, Clock, Home, Hotel, Search, Plus, 
  LogOut, RefreshCw, AlertCircle, Eye,
  ChevronRight, ArrowRight, Bed, BarChart3,
  Calendar, Info, Activity, Zap, Target, IndianRupee
} from "lucide-react";
import { 
  isSameDay, startOfDay, parseISO, format, differenceInDays, 
  isAfter, subHours, differenceInHours,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval 
} from 'date-fns';
import { getBookings, checkIn, checkOut } from "../services/bookingServices";
import { getRooms } from "../services/roomServices";
import { PageLayout, ContentCard, Pagination, ActionIcon } from "../components/UIComponents";

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
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [revenueTab, setRevenueTab] = useState("today");

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

  const revenueData = useMemo(() => {
    if (!bookings) return { totalRevenue: 0 };

    const isRevInRange = (date) => {
      if (!date) return false;
      if (revenueTab === 'today') return isSameDay(date, today);
      if (revenueTab === 'week') return isWithinInterval(date, { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) });
      if (revenueTab === 'month') return isWithinInterval(date, { start: startOfMonth(today), end: endOfMonth(today) });
      return false;
    };

    const revBookings = bookings.filter(b => {
      if (b.status === STATUS.CANCELLED) return false;
      const ci = b.check_in ? parseISO(b.check_in) : null;
      const co = b.check_out ? parseISO(b.check_out) : null;
      return (ci && isRevInRange(ci)) || (co && isRevInRange(co));
    });

    const totalRevenue = revBookings.reduce((sum, b) => {
      return sum + Number(b.total_amount || b.total_amt || 0);
    }, 0);

    const collected = revBookings.reduce((sum, b) => {
      const total = Number(b.total_amount || b.total_amt || 0);
      const paid = Number(b.total_paid || b.paid_amount || 0);
      return sum + Math.min(paid, total);
    }, 0);

    const pending = Math.max(totalRevenue - collected, 0);

    return { totalRevenue, collected, pending };
  }, [bookings, revenueTab, today]);

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
    });

    // 7. Pagination
    const totalCount = filteredList.length;
    const paginatedList = filteredList.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    return {
      checkInsCount,
      checkOutsCount,
      occupiedCount,
      availableCount,
      filteredList: paginatedList,
      totalCount,
      totalRevenue,
      totalCollected,
      totalPending
    };
  }, [bookings, rooms, today, debouncedSearch, isInRange, currentPage, itemsPerPage]);

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
    <PageLayout className="p-0 h-full overflow-hidden">
      <div className="lg:flex-1 flex flex-col lg:min-h-0">
        <div className="lg:flex-1 flex flex-col gap-4 lg:min-h-0">
          
          {/* 1. TOP STATS ROW - Always visible on Mobile & Desktop */}
          <div className="order-3 lg:order-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-0 mb-4">
            <StatCard title="Check-ins Today" value={dashboardData.checkInsCount} icon={<Users className="w-5 h-5"/>} color="blue" />
            <StatCard title="Check-outs Today" value={dashboardData.checkOutsCount} icon={<LogOut className="w-5 h-5"/>} color="orange" />
            <StatCard title="Available Rooms" value={dashboardData.availableCount} icon={<Home className="w-5 h-5"/>} color="green" />
            <StatCard title="Occupied Rooms" value={dashboardData.occupiedCount} icon={<Hotel className="w-5 h-5"/>} color="purple" />
          </div>

          {/* 2. MAIN GRID (Operational Hub + Quick Panel) */}
          <div className="lg:flex-1 order-1 lg:order-none grid grid-cols-1 lg:grid-cols-[7.5fr_2.5fr] gap-6 items-start lg:min-h-0">
            
            {/* LEFT: OPERATIONS HUB - Priority 1 on Mobile */}
            <div className="lg:relative order-2 lg:order-none flex flex-col">
              <div className="lg:flex-1 flex flex-col gap-4 p-0 lg:min-h-0">
                
                <div className="bg-white/90 backdrop-blur-sm border border-gray-100 shadow-[0_6px_20px_rgba(0,0,0,0.06)] rounded-2xl px-4 py-4 sm:px-5 sm:py-5 flex justify-between items-center ring-1 ring-black/5 min-h-[56px]">
                  <div className="flex items-center gap-3 min-w-0">
                     <div className="w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-[13px] sm:text-sm text-gray-700 font-semibold tracking-tight truncate">
                        <span className="tabular-nums">{dashboardData.totalCount}</span> operations scheduled for <span className="capitalize">{view}</span>
                       </p>
                     </div>
                  </div>
                  <button onClick={() => navigate(`/bookings?view=${view}`)} className="shrink-0 text-[10px] sm:text-[11px] text-blue-600 font-bold uppercase tracking-wider hover:underline ml-2">
                    View All
                  </button>
                </div>

                <ContentCard className="flex flex-col h-[560px] lg:h-[600px] lg:hover:-translate-y-0.5 lg:hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] transition-all">
                  <div className="lg:flex-1 flex flex-col lg:overflow-hidden text-gray-900 pb-2">
                    <div className="px-4 py-4 sm:p-5 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-lg">
                          <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg font-semibold text-gray-900 tracking-tight leading-none">Operational Hub</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest leading-none">Live</p>
                            </div>
                        </div>

                        <div className="flex bg-gray-100 p-1 rounded-xl w-fit shrink-0">
                          {["today", "week", "month"].map(v => (
                            <button
                              key={v}
                              onClick={() => { setView(v); setCurrentPage(0); }}
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
                          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-thin" style={{ touchAction: 'pan-y' }}>
                      {dashboardData.filteredList.length > 0 ? (
                        <table className="w-full text-left border-separate border-spacing-0 min-w-[800px]">
                          <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-gray-100">
                            <tr>
                              <th className="pl-8 pr-6 py-4 leading-none text-gray-600">Guest & Details</th>
                              <th className="px-6 py-4 leading-none text-gray-600">Room</th>
                              <th className="px-6 py-4 block sm:table-cell leading-none text-gray-600">Arrival / Departure</th>
                              <th className="px-6 py-4 hidden md:table-cell leading-none text-gray-600">Status</th>
                              <th className="px-6 py-4 text-right leading-none text-gray-600">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {dashboardData.filteredList.map((booking, index) => (
                              <tr 
                                key={`${booking.id}-${booking.opType}`} 
                                onClick={() => navigate(`/bookings/${booking.id}`)}
                                className="hover:bg-gray-50 transition-all cursor-pointer group border-l-4 border-transparent hover:border-blue-600 relative active:scale-[0.98] transition-transform"
                              >
                                <td className="pl-8 pr-6 py-4">
                                  <div className="flex items-center gap-2 mb-1">
                                      <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors text-sm tracking-tight leading-relaxed">{booking.guest_name}</p>
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
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <p className="text-[10px] text-gray-400 font-bold tracking-tight">#{booking.id}</p>
                                      <span className="text-gray-300">•</span>
                                      <p className="text-[10px] text-gray-500 font-bold whitespace-nowrap">
                                          {getNights(booking.check_in, booking.check_out)} Nights • ₹{booking.total_amount || booking.total_amt || "0"}
                                      </p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold text-gray-600 uppercase">
                                      {booking.rooms?.[0]?.room_no || "—"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 block sm:table-cell">
                                  <div className="text-[10px] font-bold space-y-1">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <ArrowRight className={`w-2.5 h-2.5 ${(booking.opType === 'check-in') ? 'text-blue-500' : 'text-gray-300'}`} />
                                        <span className={(booking.opType === 'check-in') ? 'text-gray-900' : 'text-gray-400 font-medium'}>{formatDateSafe(booking.check_in)}</span>
                                    </div>
                                    <p className="flex items-center gap-2">
                                        <LogOut className={`w-2.5 h-2.5 ${(booking.opType === 'check-out') ? 'text-orange-500' : 'text-gray-300'}`} />
                                        <span className={(booking.opType === 'check-out') ? 'text-gray-900' : 'text-gray-400 font-medium'}>{formatDateSafe(booking.check_out)}</span>
                                    </p>
                                  </div>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                  <StatusBadge status={booking.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2.5">
                                    <ActionIcon 
                                      onClick={(e) => { e.stopPropagation(); navigate(`/bookings/${booking.id}`); }}
                                      title="View Details"
                                      ringColor="blue-500"
                                      className="bg-blue-50 text-blue-600 border border-blue-100"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </ActionIcon>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                           <EmptyState searchTerm={searchTerm} />
                        </div>
                      )}
                    </div>
                    <Pagination 
                      currentPage={currentPage}
                      totalPages={Math.ceil(dashboardData.totalCount / itemsPerPage) || 1}
                      totalItems={dashboardData.totalCount}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                      themeColor="blue"
                    />
                  </div>
                </ContentCard>
              </div>
            </div>

            {/* RIGHT: QUICK PANEL - Priority 3 on Mobile */}
            <div className="flex flex-col gap-4 order-1 lg:order-none h-full">
              <ContentCard className="flex flex-col flex-1 order-5 lg:hover:-translate-y-0.5 lg:hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] transition-all">
                <div className="px-4 py-4 sm:px-5 sm:py-5 border-b border-gray-50 flex items-start justify-between gap-3">
                   <div className="flex items-center gap-3 min-w-0">
                     <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-orange-50 rounded-lg shrink-0">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                     </div>
                     <div className="min-w-0">
                        <h2 className="text-base font-semibold text-gray-900 leading-none truncate capitalize">{view} Summary</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 leading-none">Quick Stats</p>
                     </div>
                   </div>
                   <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums shrink-0 mt-0.5">
                     {dashboardData.totalCount}
                   </p>
                </div>
                <div className="px-4 py-4 sm:px-5 sm:py-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-lg font-bold text-blue-600 tabular-nums">{dashboardData.checkInsCount}</p>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Check-ins</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-orange-600 tabular-nums">{dashboardData.checkOutsCount}</p>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Check-outs</p>
                        </div>
                    </div>
                </div>
              </ContentCard>

              <ContentCard className="p-0 order-1 lg:hover:-translate-y-0.5 lg:hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] transition-all flex flex-col flex-1">
                <div className="px-4 py-4 sm:px-5 sm:py-5 border-b border-gray-50 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                     <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-blue-50 rounded-lg shrink-0">
                        <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                     </div>
                     <div className="min-w-0">
                        <h2 className="text-base font-semibold text-gray-900 leading-none truncate">Revenue</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 leading-none">Overview</p>
                     </div>
                  </div>
                  <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                    {['today', 'week', 'month'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setRevenueTab(tab)}
                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                          revenueTab === tab 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 px-4 py-4 flex flex-col justify-center items-center">
                  <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
                    ₹ {revenueData.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  
                  <div className="mt-3 w-full grid grid-cols-2 gap-2">
                    {/* Collected */}
                    <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100/50 group hover:bg-emerald-100/50 transition-colors">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1.5 leading-none">Collected</p>
                      <p className="text-sm font-semibold text-emerald-700 tabular-nums leading-none">
                        ₹ {revenueData.collected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    {/* Pending */}
                    <div className="bg-orange-50 rounded-xl p-2.5 text-center border border-orange-100/50 group hover:bg-orange-100/50 transition-colors">
                      <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mb-1.5 leading-none">Pending</p>
                      <p className="text-sm font-semibold text-orange-700 tabular-nums leading-none">
                        ₹ {revenueData.pending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </ContentCard>

              <ContentCard className="flex flex-col flex-1 order-2 lg:hover:-translate-y-0.5 lg:hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] transition-all">
                <div className="px-4 py-4 sm:px-5 sm:py-5 border-b border-gray-50 flex items-center justify-between gap-2">
                   <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-purple-50 rounded-lg shrink-0">
                         <Bed className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                         <h2 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight leading-none truncate">Room Availability</h2>
                         <div className="flex items-center gap-2 mt-1">
                             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)] shrink-0"></span>
                             <p className="text-[10px] sm:text-[11px] text-green-600 font-bold uppercase tracking-widest leading-none truncate">Live Status</p>
                         </div>
                      </div>
                   </div>
                   <button onClick={() => navigate('/masters')} className="shrink-0 text-[10px] sm:text-[11px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors flex items-center gap-0.5 group">
                      Manage <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                   </button>
                </div>
                <div className="flex-1 px-4 py-5 sm:px-5 sm:py-6 flex flex-col justify-center space-y-4">
                  <RoomStatusRow label="Available Now" count={dashboardData.availableCount} color="green" />
                  <RoomStatusRow label="Occupied" count={dashboardData.occupiedCount} color="purple" />
                </div>
              </ContentCard>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
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
    <div className="bg-white border border-gray-200 p-3 sm:p-4 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] lg:hover:-translate-y-1 lg:hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] transition-all flex items-center justify-between group active:scale-[0.98]">
      <div className="space-y-1">
        <p className="text-xs sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">
           {title}
        </p>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tighter tabular-nums">{value}</p>
      </div>
      <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg border ${colors[color]} lg:group-hover:scale-110 lg:transition-transform`}>
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
            className={`flex-1 flex items-center justify-center gap-2 h-10 sm:h-12 rounded-xl transition-all font-semibold text-[11px] sm:text-xs hover:scale-[1.02] ${bg}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

function RoomStatusRow({ label, count, color }) {
  const dots = { green: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]", purple: "bg-purple-500", gray: "bg-gray-400" };
  return (
    <div className="flex items-center justify-between py-1 sm:py-1.5 px-2 rounded-lg hover:bg-blue-50 transition-colors">
      <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-tighter">
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
    <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-10 text-center bg-white/50 border-t border-gray-100 space-y-3 sm:space-y-4">
      <div className="w-10 h-10 sm:w-16 sm:h-16 bg-blue-50 rounded-2xl flex items-center justify-center transition-transform hover:scale-110">
        <Calendar className="w-5 h-5 sm:w-8 sm:h-8 text-blue-600" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">
          {searchTerm ? "No matching operations found" : "No operations scheduled for today"}
        </h3>
        <p className="text-gray-500 text-sm mt-1 max-w-[280px] font-medium leading-relaxed">
          {searchTerm 
            ? "We couldn't find any results for your search. Try adjusting your filters." 
            : "New bookings will appear here once created."
          }
        </p>
      </div>
      {!searchTerm && (
        <button 
          onClick={() => navigate('/bookings')}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2 transition-all hover:-translate-y-0.5"
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
    <PageLayout className="p-0 animate-in fade-in duration-500">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
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

          <div className="grid grid-cols-12 gap-4 sm:gap-5 lg:gap-3 items-stretch h-[540px]">
            {/* 2. Operational Hub Skeleton */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-4 sm:gap-5 lg:gap-3">
              <div className="h-[72px] bg-white rounded-2xl border border-gray-100 shadow-md flex justify-between items-center px-6 animate-pulse">
                <div className="h-4 w-48 bg-gray-100 rounded" />
                <div className="h-4 w-16 bg-gray-100 rounded" />
              </div>
              
              <ContentCard className="flex-1">
                <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
                    <div className="h-2 w-20 bg-gray-50 rounded animate-pulse" />
                  </div>
                  <div className="h-10 w-48 bg-gray-50 rounded-xl animate-pulse" />
                </div>
                <div className="flex-1 p-0 overflow-hidden divide-y divide-gray-50">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                          <div className="h-2 w-24 bg-gray-50 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="h-8 w-16 bg-gray-50 rounded-lg animate-pulse" />
                      <div className="h-8 w-24 bg-gray-50 rounded-lg animate-pulse" />
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-50 flex justify-between items-center">
                  <div className="h-4 w-24 bg-gray-50 rounded animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-gray-50 rounded animate-pulse" />
                    <div className="h-8 w-20 bg-gray-50 rounded animate-pulse" />
                  </div>
                </div>
              </ContentCard>
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
      </div>
    </PageLayout>
  );
}
