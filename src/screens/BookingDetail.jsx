import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Home, 
  CreditCard, 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Users,
  Building2,
  Receipt,
  History
} from "lucide-react";
import { getBookingById, getPayments } from "../services/bookingServices";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  "Confirmed": "bg-blue-50 text-blue-600 border-blue-200",
  "Checked-in": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "Checked-out": "bg-gray-50 text-gray-600 border-gray-200",
  "Cancelled": "bg-rose-50 text-rose-600 border-rose-200",
};

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const [bookingRes, paymentRes] = await Promise.all([
        getBookingById(id),
        getPayments(id)
      ]);
      
      const bookingRaw = bookingRes.data?.data || bookingRes.data;
      const paymentRaw = paymentRes.data?.data || (Array.isArray(paymentRes.data) ? paymentRes.data : []);

      if (bookingRaw && typeof bookingRaw === 'object' && !Array.isArray(bookingRaw)) {
        setBooking(bookingRaw);
      } else if (Array.isArray(bookingRaw) && bookingRaw.length > 0) {
        setBooking(bookingRaw[0]);
      } else {
        setBooking(null);
      }
      
      setPayments(paymentRaw);
    } catch (error) {
      console.error("Fetch detail error:", error);
      toast.error("Failed to load booking details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!booking) return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-500">
      <AlertCircle className="w-12 h-12 text-rose-500" />
      <p className="font-bold text-lg">Booking Not Found</p>
      <button 
        onClick={() => navigate('/bookings')}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-500/20"
      >
        <ArrowLeft className="w-4 h-4" /> Back to List
      </button>
    </div>
  );

  return (
    <div className="h-full flex flex-col min-h-0 bg-gray-50/30 print:bg-white print-container">
      {/* Detail Header - Sticky */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl p-4 mb-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/bookings')}
            className="no-print w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all group border border-gray-100"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-0.5">
              <h2 className="text-xl font-black text-gray-900 tracking-tight truncate">{booking.guest_name}</h2>
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[booking.status] || "bg-gray-50 text-gray-600"}`}>
                {booking.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-tighter">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> ID: #{booking.id}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Booked: {new Date(booking.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 no-print">
          {/* <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all text-sm font-bold text-gray-600 shadow-sm"
          >
            <Receipt className="w-4.5 h-4.5" /> Print Summary
          </button> */}
        </div>
      </div>

      {/* Detail Grid - No Global Scroll */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          {/* Guest & Room Details */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-5 flex items-center gap-2.5">
              <Building2 className="w-4 h-4" /> Comprehensive Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <DetailSection 
                icon={User} 
                label="Guest Identity" 
                value={booking.guest_name || "Anonymous Guest"}
                subValue={`Accompanied by ${Math.max(0, (booking.total_guest || 1) - 1)} adults and ${booking.childrens || 0} children`}
              />
              <DetailSection 
                icon={Home} 
                label="Assigned Accommodation" 
                value={booking.rooms?.length > 0 ? `Room ${booking.rooms.map(r => r.room_no).join(", ")}` : "Room Not Assigned"}
                subValue={booking.rooms?.length > 0 ? booking.rooms.map(r => r.type).join(" • ") : "No type specified"}
              />
              <DetailSection 
                icon={Calendar} 
                label="Check-In Period" 
                value={booking.check_in ? new Date(booking.check_in).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : "Not Set"}
                subValue="Standard Arrival: 12:00 PM"
              />
              <DetailSection 
                icon={Calendar} 
                label="Check-Out Period" 
                value={booking.check_out ? new Date(booking.check_out).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : "Not Set"}
                subValue="Standard Departure: 11:00 AM"
              />
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-50">
              <div className="flex items-center gap-4 p-4 bg-blue-50/40 rounded-2xl border border-blue-100/30">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h4 className="text-sm font-black text-blue-900 mb-0.5">Duration of Stay</h4>
                    <p className="text-xs font-bold text-blue-600 tracking-tight">
                        {Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24))} Nights in total
                    </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex-1 flex flex-col min-h-0">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2.5">
                <History className="w-4 h-4" /> Transaction Registry
              </h3>
              <span className="text-xs font-bold text-gray-400">Total {payments.length} Records</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((p, i) => (
                    <div key={p.id} className="group p-4 bg-gray-50/50 hover:bg-emerald-50/50 rounded-2xl border border-transparent hover:border-emerald-100 transition-all flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                             <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-sm font-black text-gray-900">₹{p.amount.toLocaleString()}</p>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{p.payment_mode} • {new Date(p.created_at).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-gray-300 transition-transform group-hover:translate-x-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                   <AlertCircle className="w-8 h-8 mb-3 opacity-20" />
                   <p className="text-sm font-bold opacity-60">No transactions recorded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Financial Summary */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-3xl p-6 text-gray-900 border border-gray-100 shadow-sm relative overflow-hidden">
            {/* Visual Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl no-print"></div>
            
            <h3 className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-6 relative">
                Financial Summary
            </h3>
            
            <div className="space-y-6 relative">
              <div className="flex justify-between items-end border-b border-gray-50 pb-5">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Gross Amount</span>
                <span className="text-2xl font-black tabular-nums text-gray-900">₹{(Number(booking.total_amt) || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-emerald-600 text-[11px] font-bold uppercase tracking-[0.15em] flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Total Collected
                </span>
                <span className="text-emerald-600 text-lg font-black tabular-nums">
                    ₹{payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString()}
                </span>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-50 flex justify-between items-center">
                <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Balance Arrears</span>
                <div className="text-right">
                    <span className={`text-xl font-black tabular-nums ${(Number(booking.total_amt) || 0) - payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) > 0 ? "text-rose-600" : "text-blue-600"}`}>
                        ₹{Math.max(0, (Number(booking.total_amt) || 0) - payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)).toLocaleString()}
                    </span>
                    <p className="text-[10px] text-gray-500 font-bold mt-1 tracking-tight">PAYABLE UPON CHECK-OUT</p>
                </div>
              </div>
            </div>
            
            <button className="no-print w-full mt-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20">
                Collect Remaining
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex-1">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-5">Internal Reservations</h3>
             <div className="space-y-4">
                <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-black text-gray-900">Occupancy Detail</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                        This booking is allocated for {booking.total_guest} adults and {booking.childrens} minors.
                    </p>
                </div>
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <div className="flex items-center gap-3 mb-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-black text-gray-900">Communication Pref</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                        Automated invoice will be generated upon balance settlement.
                    </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailSection({ icon: Icon, label, value, subValue }) {
  return (
    <div className="flex gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">{label}</p>
        <p className="text-sm font-black text-gray-900 truncate leading-tight">{value}</p>
        <p className="text-[11px] font-bold text-gray-400 truncate tracking-tight">{subValue}</p>
      </div>
    </div>
  );
}
