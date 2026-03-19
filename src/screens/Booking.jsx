import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Calendar, User, Users, Home, X, CheckCircle, AlertCircle, Edit2, Pencil, Trash2, Eye, Search, Filter, CreditCard, DollarSign, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react";

/* ================= STATUS CONSTANTS ================= */
const STATUS = {
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked-in",
  CHECKED_OUT: "Checked-out",
  CANCELLED: "Cancelled",
};

const STATUS_TRANSITIONS = {
  [STATUS.CONFIRMED]:   [STATUS.CONFIRMED, STATUS.CHECKED_IN, STATUS.CANCELLED],
  [STATUS.CHECKED_IN]:  [STATUS.CHECKED_IN, STATUS.CHECKED_OUT],
  [STATUS.CHECKED_OUT]: [STATUS.CHECKED_OUT],
  [STATUS.CANCELLED]:   [STATUS.CANCELLED],
};

const getAllowedStatuses = (status) => STATUS_TRANSITIONS[status] || [status];

const getConfirmationMessage = (newStatus) => {
  switch (newStatus) {
    case STATUS.CHECKED_IN:  return "Confirm check-in for this booking?";
    case STATUS.CHECKED_OUT: return "Confirm check-out for this booking?";
    case STATUS.CANCELLED:   return "Are you sure you want to cancel this booking?";
    default: return `Change status to ${newStatus}?`;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case STATUS.CONFIRMED:   return "bg-blue-100 text-blue-800 border-blue-200 shadow-sm";
    case STATUS.CHECKED_IN:  return "bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm";
    case STATUS.CHECKED_OUT: return "bg-gray-100 text-gray-700 border-gray-200 shadow-inner";
    case STATUS.CANCELLED:   return "bg-rose-100 text-rose-700 border-rose-200 shadow-sm";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
};
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  checkIn,
  checkOut,
  getPayments,
  addPayment,
  deletePayment,
} from "../services/bookingServices";
import { getRooms } from "../services/roomServices";

export default function Bookings() {
  const navigate = useNavigate();
  /* ================= STATE ================= */
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    room_ids: [],
    guest_name: "",
    total_guest: 1,
    childrens: 0,
    check_in: "",
    check_out: "",
  });

  const [availableRooms, setAvailableRooms] = useState([]);

  // Status Loading Map (per-ID to support parallel updates)
  const [loadingMap, setLoadingMap] = useState({});
  // Which row is in dropdown-edit mode
  const [editingId, setEditingId] = useState(null);

  // Unified Booking Detail Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTab, setDetailTab] = useState("info"); // "info" | "payments"
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Refs for concurrency & memory safety
  const abortRef      = useRef({});  // AbortController per booking id
  const prevStatusRef = useRef({});  // Previous status per booking id for rollback
  const syncTimeoutRef = useRef({}); // Per-ID debounced sync timers
  const isMounted     = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      Object.values(abortRef.current).forEach(c => c?.abort?.());
      abortRef.current = {};
      Object.values(syncTimeoutRef.current).forEach(clearTimeout);
      syncTimeoutRef.current = {};
    };
  }, []);

  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payments, setPayments] = useState([]);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSearchTerm, setPaymentSearchTerm] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_mode: "Cash",
    remarks: ""
  });

  /* ================= NORMALIZE ================= */
  const normalizeStatus = (status) => {
    if (!status) return STATUS.CONFIRMED;
    const lower = status.toLowerCase();
    if (lower.includes("confirm")) return STATUS.CONFIRMED;
    if (lower.includes("check-in") || lower.includes("checked in")) return STATUS.CHECKED_IN;
    if (lower.includes("check-out") || lower.includes("checked out")) return STATUS.CHECKED_OUT;
    if (lower.includes("cancel")) return STATUS.CANCELLED;
    return status; // fallback
  };

  const normalizeBooking = (b) => {
    const room =
      Array.isArray(b.rooms) && b.rooms.length > 0
        ? b.rooms[0]
        : null;

    return {
      id: b.id,
      guest_name: b.guest_name,
      room_ids: Array.isArray(b.rooms) ? b.rooms.map(r => r.id) : [],
      room_no: Array.isArray(b.rooms) ? b.rooms.map(r => r.room_no).join(", ") : "-",
      room_type: Array.isArray(b.rooms) ? [...new Set(b.rooms.map(r => r.type))].join(", ") : "-",
      check_in: b.check_in?.slice(0, 10),
      check_out: b.check_out?.slice(0, 10),
      status: normalizeStatus(b.status),
      total_amt: b.total_amt,
      total_guest: b.total_guest || 1,
      childrens: b.childrens || 0,
    };
  };

  /* ================= FETCH ================= */
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [bookingRes, roomRes] = await Promise.all([
        getBookings(),
        getRooms(),
      ]);

      console.log("📦 RAW BOOKINGS RESPONSE 👉", bookingRes.data);
      console.log("🏨 RAW ROOMS RESPONSE 👉", roomRes.data);

      const normalizedBookings = Array.isArray(bookingRes.data.data)
        ? bookingRes.data.data.map(normalizeBooking)
        : [];

      setBookings(normalizedBookings);

      const roomsData = Array.isArray(roomRes.data) ? roomRes.data : (roomRes.data?.data || []);
      console.log("🏨 PROCESSED ROOMS DATA 👉", roomsData);
      setRooms(roomsData);

      // Initially show all rooms
      setAvailableRooms(roomsData);

    } catch (e) {
      console.error("❌ FETCH ERROR 👉", e);
      setErrorMessage("Data load failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= CHECK ROOM AVAILABILITY ================= */
  useEffect(() => {
    if (form.check_in && form.check_out) {
      checkAvailability();
    }
  }, [form.check_in, form.check_out, bookings, editing]);

  const checkAvailability = () => {
    console.log("🔍 CHECKING AVAILABILITY...");
    console.log("📅 Form Dates:", form.check_in, "to", form.check_out);
    console.log("🏨 Total Rooms:", rooms.length);

    if (!form.check_in || !form.check_out || form.check_out <= form.check_in) {
      console.log("⚠️ Dates invalid or missing, showing all rooms");
      setAvailableRooms(rooms);
      return;
    }

    // Find conflicting bookings
    const conflictingBookingIds = bookings
      .filter(booking => {
        // Skip if booking is checked-out/cancelled
        if (booking.status === "Checked-out" || booking.status === "Cancelled") {
          return false;
        }

        const bookingCheckIn = new Date(booking.check_in);
        const bookingCheckOut = new Date(booking.check_out);
        const selectedCheckIn = new Date(form.check_in);
        const selectedCheckOut = new Date(form.check_out);

        // Check for date overlap
        const isOverlap = (
          (selectedCheckIn >= bookingCheckIn && selectedCheckIn < bookingCheckOut) ||
          (selectedCheckOut > bookingCheckIn && selectedCheckOut <= bookingCheckOut) ||
          (selectedCheckIn <= bookingCheckIn && selectedCheckOut >= bookingCheckOut)
        );

        // Skip if it's the same booking we are editing
        if (editing && Number(booking.id) === Number(editing.id)) {
          return false;
        }

        return isOverlap;
      })
      .flatMap(booking => booking.room_ids || []); // Handle multiple rooms per booking

    console.log("🚫 Conflicting Room IDs:", conflictingBookingIds);

    // Filter available rooms and restrict types to Single Suite and Double Suite
    // BUT! Allow the currently selected room even if it has an old type, to prevent it from disappearing
    const available = rooms.filter(room => {
      const isNotConflict = !conflictingBookingIds.includes(room.id);
      const isCorrectType = room.type === "Single Suite" || room.type === "Double Suite";

      // If we are editing, always keep the rooms that were already booked for this booking
      const isCurrentBookingRoom = editing && editing.room_ids?.includes(room.id);

      if (isCurrentBookingRoom) {
        return true;
      }

      return isNotConflict && isCorrectType;
    });

    setAvailableRooms(available);

    // Filter out selected rooms that are no longer available
    const stillAvailable = form.room_ids.filter(id =>
      available.some(r => Number(r.id) === Number(id))
    );

    if (stillAvailable.length !== form.room_ids.length) {
      console.log("❌ Some selected rooms are no longer available, updating form");
      setForm(prev => ({ ...prev, room_ids: stillAvailable }));
    }
  };

  /* ================= FORM ================= */
  const resetForm = () => {
    console.log("♻️ RESET FORM");
    setForm({
      room_ids: [],
      guest_name: "",
      total_guest: 1,
      childrens: 0,
      check_in: "",
      check_out: "",
    });
    setEditing(null);
    setErrorMessage("");
    setAvailableRooms(rooms);
  };

  const submitForm = async () => {
    console.log("📝 SUBMITTING FORM...");
    console.log("📦 Selected Room IDs:", form.room_ids);

    // Validation
    if (form.room_ids.length === 0 || !form.guest_name || !form.check_in || !form.check_out) {
      setErrorMessage("All fields are required, including at least one room");
      return;
    }

    if (form.check_out <= form.check_in) {
      setErrorMessage("Check-out must be after check-in");
      return;
    }

    // Check guest limit (Sum limits for multiple rooms)
    const selectedRoomsData = rooms.filter(r => form.room_ids.includes(Number(r.id)));
    const totalLimit = selectedRoomsData.reduce((sum, r) => sum + (r.guest_limit || 0), 0);

    if (form.total_guest > totalLimit) {
      setErrorMessage(`Guest limit exceeded. Total capacity for selected rooms: ${totalLimit}`);
      return;
    }

    // 🔥 EXACT PAYLOAD AS PER API IMAGE
    const payload = {
      guest_name: form.guest_name,
      total_guest: Number(form.total_guest),
      childrens: Number(form.childrens),
      check_in: form.check_in,
      check_out: form.check_out,
    };

    // If one room, use room_id, if multiple use rooms array
    if (form.room_ids.length === 1) {
      payload.room_id = Number(form.room_ids[0]);
    } else {
      payload.rooms = form.room_ids.map(id => Number(id));
    }

    console.log("🚀 FINAL PAYLOAD 👉", payload);

    try {
      setErrorMessage("");
      if (editing) {
        await updateBooking(editing.id, payload);
      } else {
        await createBooking(payload);
      }

      setShowForm(false);
      resetForm();
      fetchAll();
    } catch (err) {
      console.error("❌ BACKEND ERROR 👉", err.response?.data);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "Booking failed. Please try again.";
      setErrorMessage(errorMsg);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;

    try {
      console.log("🗑 DELETE BOOKING 👉", id);
      setErrorMessage("");
      setLoading(true);

      const response = await deleteBooking(id);
      console.log("✅ DELETE RESPONSE 👉", response.data);

      // Remove from local state
      setBookings((prev) => prev.filter((b) => b.id !== id));

      // Also refresh all data to ensure consistency
      await fetchAll();

      const newTotalPages = Math.ceil((bookings.length - 1) / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      console.error("❌ DELETE ERROR FULL OBJECT 👉", err);
      console.error("❌ DELETE ERROR RESPONSE 👉", err.response);
      console.error("❌ DELETE ERROR DATA 👉", err.response?.data);
      console.error("❌ DELETE STATUS 👉", err.response?.status);

      let errorMsg = "Delete failed. Please try again.";

      // Check for specific error messages
      if (err.response?.status === 500) {
        errorMsg = "Server error occurred. The backend might have an issue with deleting this booking. Please contact support.";
        console.error("🔥 SERVER ERROR DETAILS:", err.response?.data);
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }

      setErrorMessage(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ================= STATUS ================= */
  const handleStatusChange = useCallback(async (booking, newStatus) => {
    const id = booking.id;

    // Guards: same value or already loading
    if (newStatus === booking.status) return;
    if (loadingMap[id]) return;

    // Cancel any in-flight request for this row
    abortRef.current[id]?.abort?.();
    const controller = new AbortController();
    abortRef.current[id] = controller;

    // Store previous status for rollback
    prevStatusRef.current[id] = booking.status;

    // Optimistic update
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    setLoadingMap(prev => ({ ...prev, [id]: true }));
    setEditingId(null);

    const toastId = toast.loading(`Updating booking #${id}...`);

    try {
      const normalizedStatus = normalizeStatus(newStatus);

      const requestOptions = { signal: controller.signal };

      if (normalizedStatus === STATUS.CHECKED_IN) {
        await checkIn(id, requestOptions);
      } else if (normalizedStatus === STATUS.CHECKED_OUT) {
        await checkOut(id, requestOptions);
      } else {
        await updateBooking(id, { status: normalizedStatus }, requestOptions);
      }

      if (!isMounted.current) return;

      toast.success(`Booking #${id} changed to ${newStatus}`, { id: toastId });

      // Debounced background sync for accuracy via getBookingById
      clearTimeout(syncTimeoutRef.current[id]);
      syncTimeoutRef.current[id] = setTimeout(async () => {
        if (!isMounted.current) return;
        try {
          const fresh = await getBookingById(id);
          if (!isMounted.current) return;
          const freshBookingData = fresh.data?.data || fresh.data;
          if (freshBookingData) {
            const freshStatus = normalizeStatus(freshBookingData.status);
            if (freshStatus !== newStatus) {
              toast(`Booking #${id} synced to "${freshStatus}" by server`, { icon: "🔄" });
              setBookings(prev => prev.map(b => b.id === id ? { ...b, status: freshStatus } : b));
            }
          }
        } catch { /* silent sync failure */ }
        delete syncTimeoutRef.current[id];
      }, 300);

    } catch (err) {
      if (err.name === "AbortError") return;
      if (!isMounted.current) return;

      console.error("❌ STATUS UPDATE ERROR 👉", err.response?.data);

      // Rollback to specific previous status
      const prev = prevStatusRef.current[id];
      if (prev !== undefined) {
        setBookings(prevList => prevList.map(b => b.id === id ? { ...b, status: prev } : b));
      }

      toast.error(`Booking #${id}: ${err.response?.data?.message || "Failed to update status"}`, { id: toastId });
    } finally {
      if (isMounted.current) {
        setLoadingMap(prev => { const n = { ...prev }; delete n[id]; return n; });
      }
      delete abortRef.current[id];
      delete prevStatusRef.current[id];
    }
  }, [loadingMap]);

  // Remove pagination hook
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.room_no.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      statusFilter === "" ||
      booking.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  /* ================= INLINE MODAL HANDLER ================= */
  const openDetailModal = useCallback(async (b) => {
    setSelectedBooking(b);
    setEditing(b);
    setForm({
      room_ids: b.room_ids,
      guest_name: b.guest_name,
      total_guest: b.total_guest || 1,
      childrens: b.childrens || 0,
      check_in: b.check_in,
      check_out: b.check_out,
    });
    setDetailTab("info");
    setShowDetailModal(true);
    // Preload payments
    setPaymentForm({ amount: "", payment_mode: "Cash", remarks: "" });
    setSelectedBookingForPayment(b);
    setPaymentLoading(true);
    try {
      const res = await getPayments(b.id);
      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (res.data?.data && Array.isArray(res.data.data)) data = res.data.data;
      else if (res.data?.payments && Array.isArray(res.data.payments)) data = res.data.payments;
      setPayments(data);
    } catch { setPayments([]); }
    finally { setPaymentLoading(false); }
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  /* ================= PAYMENT FILTER & PAGINATION ================= */
  const filteredPayments = payments.filter(payment => {
    const term = paymentSearchTerm.toLowerCase();
    return (
      (payment.payment_mode || "").toLowerCase().includes(term) ||
      (payment.remarks || "").toLowerCase().includes(term) ||
      (payment.paid_amt || payment.amount || "").toString().includes(term)
    );
  });

  const paymentItemsPerPage = 4;
  const [paymentCurrentPage, setPaymentCurrentPage] = useState(1);
  const totalPaymentPages = Math.ceil(filteredPayments.length / paymentItemsPerPage) || 1;
  const paginatedPayments = filteredPayments.slice(
    (paymentCurrentPage - 1) * paymentItemsPerPage,
    paymentCurrentPage * paymentItemsPerPage
  );

  // Reset page when search changes
  useEffect(() => {
    setPaymentCurrentPage(1);
  }, [paymentSearchTerm]);

  /* ================= PAYMENT HANDLERS ================= */
  const openPaymentModal = async (booking) => {
    setSelectedBookingForPayment(booking);
    setPaymentForm({ amount: "", payment_mode: "Cash", remarks: "" });
    setShowPaymentModal(true);
    setPaymentLoading(true);
    try {
      console.log("💳 Fetching payments for booking:", booking.id);
      const res = await getPayments(booking.id);
      console.log("💰 PAYMENTS RESPONSE RAW:", res.data);
      console.log("💰 Is res.data an array?", Array.isArray(res.data));
      console.log("💰 Does res.data have data property?", res.data?.data);

      // Try different response structures
      let paymentsData = [];
      if (Array.isArray(res.data)) {
        paymentsData = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        paymentsData = res.data.data;
      } else if (res.data?.payments && Array.isArray(res.data.payments)) {
        paymentsData = res.data.payments;
      } else {
        console.warn("⚠️ Unexpected payments format:", res.data);
        paymentsData = [];
      }

      console.log("💰 PROCESSED PAYMENTS:", paymentsData);
      setPayments(paymentsData);
    } catch (err) {
      console.error("❌ Failed to fetch payments", err.response?.data || err);
      setPayments([]);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentForm.amount || isNaN(paymentForm.amount) || Number(paymentForm.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // Calculate total paid amount and remaining balance
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.paid_amt || p.amount || 0), 0);
    const totalAmount = Number(selectedBookingForPayment.total_amt || 0);
    const newPaymentAmount = Number(paymentForm.amount);
    const remainingBalance = totalAmount - totalPaid;

    // Check if new payment exceeds the remaining balance
    if (newPaymentAmount > remainingBalance) {
      alert(`Payment amount exceeds remaining balance!\n\nTotal Amount: ₹${totalAmount.toLocaleString()}\nAlready Paid: ₹${totalPaid.toLocaleString()}\nRemaining Balance: ₹${remainingBalance.toLocaleString()}\n\nYou can only add up to ₹${remainingBalance.toLocaleString()}`);
      return;
    }

    try {
      setPaymentLoading(true);
      // Backend expects 'paid_amt' not 'amount'
      const payload = {
        paid_amt: newPaymentAmount,
        payment_mode: paymentForm.payment_mode,
        remarks: paymentForm.remarks || "Payment"
      };

      console.log("💸 ADDING PAYMENT", payload);
      const response = await addPayment(selectedBookingForPayment.id, payload);
      console.log("✅ PAYMENT ADDED SUCCESSFULLY", response.data);

      // Refresh payments list
      const res = await getPayments(selectedBookingForPayment.id);
      console.log("📋 REFRESHED PAYMENTS RAW:", res.data);

      // Try different response structures
      let paymentsData = [];
      if (Array.isArray(res.data)) {
        paymentsData = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        paymentsData = res.data.data;
      } else if (res.data?.payments && Array.isArray(res.data.payments)) {
        paymentsData = res.data.payments;
      } else {
        console.warn("⚠️ Unexpected payments format:", res.data);
        paymentsData = [];
      }

      console.log("📋 PROCESSED PAYMENTS AFTER ADD:", paymentsData);
      setPayments(paymentsData);

      // Reset form
      setPaymentForm({ amount: "", payment_mode: "Cash", remarks: "" });

      // Show success message
      toast.success("Payment added successfully!");
    } catch (err) {
      console.error("❌ PAYMENT ERROR FULL OBJECT", err);
      console.error("❌ PAYMENT ERROR RESPONSE", err.response);
      console.error("❌ PAYMENT ERROR DATA", err.response?.data);

      let errorMsg = "Failed to add payment. Please try again.";
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.errors) {
        // Show validation errors
        const errors = Object.values(err.response.data.errors).flat().join("\n");
        errorMsg = errors;
      }

      console.error("❌ PAYMENT ERROR MESSAGE", errorMsg);
      toast.error(errorMsg);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm("Are you sure you want to delete this payment transaction?")) return;

    try {
      setPaymentLoading(true);
      console.log("🗑️ Deleting payment:", paymentId);
      await deletePayment(paymentId);

      // Refresh payments list with proper data handling
      const res = await getPayments(selectedBookingForPayment.id);
      console.log("📋 PAYMENTS AFTER DELETE RAW:", res.data);

      // Try different response structures
      let paymentsData = [];
      if (Array.isArray(res.data)) {
        paymentsData = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        paymentsData = res.data.data;
      } else if (res.data?.payments && Array.isArray(res.data.payments)) {
        paymentsData = res.data.payments;
      } else {
        console.warn("⚠️ Unexpected payments format:", res.data);
        paymentsData = [];
      }

      console.log("📋 PAYMENTS AFTER DELETE:", paymentsData);
      setPayments(paymentsData);

      // Reset pagination to first page if needed
      if (paymentCurrentPage > 1 && paymentsData.length <= (paymentCurrentPage - 1) * paymentItemsPerPage) {
        setPaymentCurrentPage(1);
      }

      // Reset search term
      setPaymentSearchTerm("");
      toast.success("Payment deleted successfully!");
    } catch (err) {
      console.error("❌ DELETE PAYMENT ERROR:", err.response?.data || err);
      toast.error("Failed to delete payment.");
    } finally {
      setPaymentLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-w-0 min-h-0 p-0 overflow-hidden w-full">
        <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full overflow-hidden">
          {/* Skeleton Controls — matches search + filter + add button */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-md p-4 mb-6 flex-shrink-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="h-[46px] w-full sm:w-80 bg-gray-100 rounded-xl animate-shimmer" />
                <div className="h-[38px] w-28 bg-gray-100 rounded-lg animate-shimmer" />
              </div>
              <div className="h-[38px] w-full md:w-36 bg-orange-100/50 rounded-lg animate-shimmer" />
            </div>
          </div>
          
          {/* Skeleton Table — uses real <table> with table-fixed matching actual column widths */}
          <div className="flex-1 min-h-0 min-w-0 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="overflow-hidden flex-1">
              <table className="w-full table-fixed text-left border-separate border-spacing-0 min-w-[700px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
                    <th className="w-[25%] py-4 px-4 border-b border-gray-100"><div className="h-3 w-24 bg-gray-200 rounded animate-shimmer" /></th>
                    <th className="w-[15%] py-4 px-4 border-b border-gray-100"><div className="h-3 w-20 bg-gray-200 rounded animate-shimmer" /></th>
                    <th className="w-[20%] py-4 px-4 border-b border-gray-100"><div className="h-3 w-12 bg-gray-200 rounded animate-shimmer" /></th>
                    <th className="w-[20%] py-4 px-4 text-center border-b border-gray-100"><div className="h-3 w-14 bg-gray-200 rounded animate-shimmer mx-auto" /></th>
                    <th className="w-[20%] py-4 px-4 text-right border-b border-gray-100"><div className="h-3 w-14 bg-gray-200 rounded animate-shimmer ml-auto" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {/* Guest Details */}
                      <td className="py-3 px-4">
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-gray-100 rounded animate-shimmer" />
                          <div className="h-2 w-40 bg-gray-50 rounded animate-shimmer" />
                        </div>
                      </td>
                      {/* Room Details */}
                      <td className="py-3 px-4">
                        <div className="space-y-2">
                          <div className="h-3 w-20 bg-gray-100 rounded animate-shimmer" />
                          <div className="h-2 w-16 bg-gray-50 rounded animate-shimmer" />
                        </div>
                      </td>
                      {/* Dates */}
                      <td className="py-3 px-4">
                        <div className="space-y-2">
                          <div className="h-3 w-24 bg-gray-50 rounded animate-shimmer" />
                          <div className="h-3 w-24 bg-gray-50 rounded animate-shimmer" />
                        </div>
                      </td>
                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <div className="h-6 w-20 bg-gray-50 rounded-lg animate-shimmer mx-auto" />
                      </td>
                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
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

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 p-0 overflow-hidden w-full">
      <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full overflow-hidden">
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{errorMessage}</p>
            <button onClick={() => setErrorMessage("")} className="ml-auto">
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="sticky top-0 z-20 bg-white/95 supports-[backdrop-filter]:bg-white/95 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-md p-4 mb-6 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-start lg:justify-between gap-4 md:gap-8 lg:gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-1 sm:w-80 whitespace-nowrap">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by guest or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 border border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-medium transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked-in">Checked-in</option>
                  <option value="checked-out">Checked-out</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-sm font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Booking
            </button>
          </div>
        </div>

        {/* Bookings - Mobile Cards + Desktop Table */}
        <div className="flex-1 min-h-0 min-w-0 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          {/* ===== MOBILE CARD VIEW (< md) ===== */}
          <div className="lg:hidden overflow-auto flex-1 scroll-smooth overscroll-contain custom-scrollbar min-h-0">
            <div className="max-w-3xl mx-auto w-full">
            {paginatedBookings.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {paginatedBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 hover:bg-blue-50/40 transition-all duration-200 cursor-pointer active:bg-blue-50/60"
                    onClick={() => openDetailModal(b)}
                  >
                    {/* Row 1: Guest Name + Status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{b.guest_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-gray-400 font-medium">#{b.id}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span className="text-[11px] text-gray-500 font-medium">Room {b.room_no}</span>
                        </div>
                      </div>
                      {editingId === b.id ? (
                        <select
                          autoFocus
                          value={b.status}
                          aria-label="Booking status"
                          disabled={loading || !!loadingMap[b.id]}
                          onBlur={() => setEditingId(null)}
                          onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            if (newStatus !== b.status) {
                              if (window.confirm(getConfirmationMessage(newStatus))) {
                                handleStatusChange(b, newStatus);
                              } else {
                                setEditingId(null);
                              }
                            } else {
                              setEditingId(null);
                            }
                          }}
                          className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm shrink-0"
                        >
                          {getAllowedStatuses(b.status).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!loadingMap[b.id] && !loading && b.status !== STATUS.CHECKED_OUT && b.status !== STATUS.CANCELLED) {
                              setEditingId(b.id);
                            }
                          }}
                          disabled={loading || !!loadingMap[b.id]}
                          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border transition-all ${
                            getStatusColor(b.status)
                          } ${
                            loading || (b.status === STATUS.CHECKED_OUT || b.status === STATUS.CANCELLED)
                              ? "cursor-not-allowed opacity-80"
                              : "cursor-pointer"
                          }`}
                        >
                          {loadingMap[b.id] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            b.status
                          )}
                        </button>
                      )}
                    </div>

                    {/* Row 2: Dates + Actions */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-blue-500" />
                          <span className="font-bold tabular-nums">{b.check_in}</span>
                        </div>
                        <span className="text-gray-300">→</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="font-bold tabular-nums">{b.check_out}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(b);
                            setForm({
                              guest_name: b.guest_name,
                              room_ids: b.room_ids || [],
                              total_guest: b.total_guest,
                              childrens: b.childrens,
                              check_in: b.check_in,
                              check_out: b.check_out,
                            });
                            setShowForm(true);
                          }}
                          disabled={loading || b.status === STATUS.CHECKED_OUT || b.status === STATUS.CANCELLED}
                          className={`p-1.5 rounded-lg transition-all border shadow-sm ${
                            loading || b.status === STATUS.CHECKED_OUT || b.status === STATUS.CANCELLED
                              ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                              : 'bg-orange-50 text-orange-600 border-orange-100'
                          }`}
                          title="Edit Booking"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/bookings/${b.id}`);
                          }}
                          disabled={loading}
                          className={`p-1.5 rounded-lg transition-all border shadow-sm ${
                            loading
                              ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                              : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}
                          title="View Full Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="flex flex-col items-center">
                  <Calendar className="w-10 h-10 text-gray-100 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No bookings found</h3>
                  {searchTerm ? (
                    <button onClick={() => setSearchTerm("")} className="text-orange-600 text-sm font-bold hover:underline">Clear filters</button>
                  ) : (
                    <button
                      onClick={() => { resetForm(); setShowForm(true); }}
                      className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Booking
                    </button>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>

          {/* ===== DESKTOP TABLE VIEW (md+) ===== */}
          <div className="hidden lg:flex overflow-auto flex-1 scroll-smooth overscroll-contain custom-scrollbar min-h-0">
            <table className="w-full table-fixed text-left border-separate border-spacing-0 min-w-[700px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
                  <th className="w-[25%] py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    Guest Details
                  </th>
                  <th className="w-[15%] py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    Room Details
                  </th>
                  <th className="w-[20%] py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    Dates
                  </th>
                  <th className="w-[20%] py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center border-b border-gray-100">
                    Status
                  </th>
                  <th className="w-[20%] py-4 px-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedBookings.length > 0 ? (
                  paginatedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-blue-50/40 transition-all duration-200 group cursor-pointer border-l-4 border-transparent hover:border-blue-600" onClick={() => openDetailModal(b)}>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1.5">
                          <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors tracking-tight leading-relaxed">{b.guest_name}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-xs text-gray-400 font-medium tracking-tight">#{b.id}</span>
                             <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                             <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 rounded-md text-[10px] font-bold text-blue-600 uppercase tracking-tight">
                                  <Users className="w-3 h-3" />
                                  {b.total_guest} {b.total_guest > 1 ? 'Guests' : 'Guest'}
                                </div>
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 rounded-md text-[10px] font-bold text-indigo-600 uppercase tracking-tight">
                                  <Users className="w-3 h-3" />
                                  {b.childrens} {b.childrens > 1 ? 'Children' : 'Child'}
                                </div>
                             </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-bold text-gray-900 tracking-tight leading-relaxed">Room {b.room_no}</p>
                          <p className="text-xs text-gray-400 font-medium italic">{b.room_type}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-xs font-bold tabular-nums leading-none">{b.check_in}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold tabular-nums leading-none">{b.check_out}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {/* Badge + Dropdown Combo */}
                        {editingId === b.id ? (
                          <select
                            autoFocus
                            value={b.status}
                            aria-label="Booking status"
                            disabled={loading || !!loadingMap[b.id]}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              if (newStatus !== b.status) {
                                if (window.confirm(getConfirmationMessage(newStatus))) {
                                  handleStatusChange(b, newStatus);
                                } else {
                                  setEditingId(null);
                                }
                              } else {
                                setEditingId(null);
                              }
                            }}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                          >
                            {getAllowedStatuses(b.status).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!loadingMap[b.id] && !loading && b.status !== STATUS.CHECKED_OUT && b.status !== STATUS.CANCELLED) {
                                setEditingId(b.id);
                              }
                            }}
                            disabled={loading || !!loadingMap[b.id]}
                            title={loadingMap[b.id] ? "Updating..." : (b.status === STATUS.CHECKED_OUT || b.status === STATUS.CANCELLED) ? "Terminal status" : "Click to change status"}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border transition-all ${
                              getStatusColor(b.status)
                            } ${
                              loading || (b.status === STATUS.CHECKED_OUT || b.status === STATUS.CANCELLED)
                                ? "cursor-not-allowed opacity-80"
                                : "cursor-pointer hover:shadow-md hover:scale-105 active:scale-95"
                            }`}
                          >
                            {loadingMap[b.id] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              b.status
                            )}
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing(b);
                              setForm({
                                guest_name: b.guest_name,
                                room_ids: b.room_ids || [],
                                total_guest: b.total_guest,
                                childrens: b.childrens,
                                check_in: b.check_in,
                                check_out: b.check_out,
                              });
                              setShowForm(true);
                            }}
                            disabled={loading || b.status === STATUS.CHECKED_OUT || b.status === STATUS.CANCELLED}
                            className={`p-2 rounded-xl transition-all border shadow-sm ${
                              loading || b.status === STATUS.CHECKED_OUT || b.status === STATUS.CANCELLED 
                                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' 
                                : 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-600 hover:text-white hover:border-orange-600 hover:shadow-lg hover:shadow-orange-500/20 active:scale-90'
                            }`}
                            title="Edit Booking"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/bookings/${b.id}`);
                            }}
                            disabled={loading}
                            className={`p-2 rounded-xl transition-all border shadow-sm ${
                              loading 
                                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' 
                                : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/20 active:scale-90'
                            }`}
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">
                        <div className="flex flex-col items-center">
                            <Calendar className="w-10 h-10 text-gray-100 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 mb-1">No bookings found</h3>
                            {searchTerm ? (
                                <button onClick={() => setSearchTerm("")} className="text-orange-600 text-sm font-bold hover:underline">Clear filters</button>
                            ) : (
                                <button
                                    onClick={() => { resetForm(); setShowForm(true); }}
                                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add First Booking
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
        {filteredBookings.length > 0 && (
          <div className="mt-auto shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-b-2xl border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
            <div className="flex items-center gap-6 order-2 sm:order-1">
              <p className="text-xs text-gray-400 font-bold tracking-tight">
                Showing <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, filteredBookings.length)}</span> of <span className="text-gray-900">{filteredBookings.length}</span>
              </p>
              
              <div className="flex items-center gap-2 border-l border-gray-100 pl-6">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rows:</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent border-none text-xs font-bold text-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500/20 py-1 cursor-pointer"
                >
                  {[8, 10, 50, 100].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1 order-1 sm:order-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`p-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${currentPage === 1
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
                        key={i+1}
                        onClick={() => setCurrentPage(i+1)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${currentPage === i+1 ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        {i+1}
                    </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`p-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-800 hover:bg-orange-50 hover:text-orange-600'
                  }`}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Booking Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {editing ? "Edit Booking" : "New Booking"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {editing ? "Update booking details" : "Create a new room booking"}
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

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Guest Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Guest Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter guest name"
                    value={form.guest_name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        guest_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Room Selection — Premium Card Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <Home className="w-4 h-4 inline mr-1.5" />
                      Select Rooms
                      <span className="ml-2 text-xs font-normal text-gray-400">(Multiple allowed)</span>
                    </label>
                    {form.room_ids.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, room_ids: [] })}
                        className="text-xs text-orange-500 hover:text-orange-700 font-medium"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {availableRooms.length === 0 ? (
                    <div className="border border-dashed border-red-200 bg-red-50 rounded-xl p-4 text-center">
                      <Home className="w-6 h-6 text-red-300 mx-auto mb-1" />
                      <p className="text-sm text-red-500 font-medium">No rooms available for selected dates</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                      {availableRooms.map((r) => {
                        const isSelected = form.room_ids.includes(Number(r.id));
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              const id = Number(r.id);
                              setForm({
                                ...form,
                                room_ids: isSelected
                                  ? form.room_ids.filter(rid => rid !== id)
                                  : [...form.room_ids, id],
                              });
                            }}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                              isSelected
                                ? "border-orange-500 bg-orange-50 shadow-sm"
                                : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/40"
                            }`}
                          >
                            {/* Check indicator */}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected ? "border-orange-500 bg-orange-500" : "border-gray-300 bg-white"
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            {/* Room Info */}
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold truncate ${isSelected ? "text-orange-700" : "text-gray-800"}`}>
                                Room {r.room_no}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{r.type}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Count badge */}
                  <p className={`mt-2 text-xs font-medium ${form.room_ids.length > 0 ? "text-orange-600" : "text-gray-400"}`}>
                    {form.room_ids.length > 0
                      ? `✓ ${form.room_ids.length} room${form.room_ids.length > 1 ? "s" : ""} selected`
                      : "No rooms selected"}
                  </p>
                </div>

                {/* Guest Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Number of Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={rooms.find(r => r.id == form.room_id)?.guest_limit || 10}
                    value={form.total_guest}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        total_guest: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Children Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Number of Children
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.childrens}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        childrens: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={form.check_in}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          check_in: e.target.value,
                          check_out: e.target.value >= form.check_out ? "" : form.check_out,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      min={form.check_in || new Date().toISOString().split('T')[0]}
                      value={form.check_out}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          check_out: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Date Range Info */}
                {form.check_in && form.check_out && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      {Math.ceil((new Date(form.check_out) - new Date(form.check_in)) / (1000 * 60 * 60 * 24))} nights
                    </p>
                  </div>
                )}

                {/* Error Display */}
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </div>
                )}
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
                  onClick={submitForm}
                  disabled={availableRooms.length === 0 && !editing}
                  className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${availableRooms.length === 0 && !editing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {editing ? "Update Booking" : "Create Booking"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Management Modal */}
        {showPaymentModal && selectedBookingForPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex justify-between items-center rounded-t-2xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Payment & Billing</h3>
                    <p className="text-sm text-gray-600">
                      Guest: <span className="font-semibold text-gray-800">{selectedBookingForPayment.guest_name}</span> •
                      Room: <span className="font-semibold text-gray-800">{selectedBookingForPayment.room_no}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-gray-700 hover:shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 max-h-[70vh]">

                {/* Search Bar - Full Width at Top */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search payments by mode, remarks, amount..."
                      value={paymentSearchTerm}
                      onChange={(e) => setPaymentSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ₹{selectedBookingForPayment.total_amt ? Number(selectedBookingForPayment.total_amt).toLocaleString() : '0'}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Total Paid</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ₹{payments.reduce((sum, p) => sum + Number(p.paid_amt || p.amount || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Balance Due</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ₹{Math.max(0, (selectedBookingForPayment.total_amt || 0) - payments.reduce((sum, p) => sum + Number(p.paid_amt || p.amount || 0), 0)).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                  {/* Left Column: Transaction History */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Transaction History
                    </h4>

                    {paymentLoading && filteredPayments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">Loading payments...</div>
                    ) : filteredPayments.length > 0 ? (
                      <>
                        <div className="bg-white border border-gray-100 rounded-xl shadow-sm divide-y divide-gray-100">
                          {paginatedPayments.map((payment) => (
                            <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors group">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-bold text-gray-900 text-lg">₹{Number(payment.paid_amt || payment.amount || 0).toLocaleString()}</p>
                                  <p className="text-xs text-gray-500">{new Date(payment.created_at || Date.now()).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium mb-1">
                                    {payment.payment_mode}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <p className="text-sm text-gray-600 italic">
                                  {payment.remarks || '-'}
                                </p>
                                <button
                                  onClick={() => handleDeletePayment(payment.id)}
                                  disabled={paymentLoading}
                                  className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                  title="Delete Transaction"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Payment Pagination */}
                        {totalPaymentPages > 1 && (
                          <div className="flex items-center justify-between mt-4 px-2">
                            <p className="text-sm text-gray-600">
                              Showing {(paymentCurrentPage - 1) * paymentItemsPerPage + 1} to {Math.min(paymentCurrentPage * paymentItemsPerPage, filteredPayments.length)} of {filteredPayments.length} payments
                            </p>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setPaymentCurrentPage(1)} disabled={paymentCurrentPage === 1} className={`p-2 rounded-lg ${paymentCurrentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-green-50'}`}>
                                <ChevronsLeft className="w-4 h-4" />
                              </button>
                              <button onClick={() => setPaymentCurrentPage(p => Math.max(1, p - 1))} disabled={paymentCurrentPage === 1} className={`p-2 rounded-lg ${paymentCurrentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-green-50'}`}>
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              {[...Array(totalPaymentPages)].map((_, i) => (
                                <button key={i} onClick={() => setPaymentCurrentPage(i + 1)} className={`w-8 h-8 rounded-lg text-sm font-bold ${paymentCurrentPage === i + 1 ? 'bg-green-600 text-white shadow-md' : 'hover:bg-gray-100'}`}>
                                  {i + 1}
                                </button>
                              ))}
                              <button onClick={() => setPaymentCurrentPage(p => Math.min(totalPaymentPages, p + 1))} disabled={paymentCurrentPage >= totalPaymentPages} className={`p-2 rounded-lg ${paymentCurrentPage >= totalPaymentPages ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-green-50'}`}>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              <button onClick={() => setPaymentCurrentPage(totalPaymentPages)} disabled={paymentCurrentPage >= totalPaymentPages} className={`p-2 rounded-lg ${paymentCurrentPage >= totalPaymentPages ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-green-50'}`}>
                                <ChevronsRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                        No payments recorded yet
                      </div>
                    )}
                  </div>

                  {/* Right Column: New Payment Form */}
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-fit">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <Plus className="w-4 h-4" /> Record New Payment
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                          <input
                            type="number"
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                            placeholder="0.00"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                          />
                        </div>
                        {/* Remaining Balance Indicator */}
                        <div className="mt-2 text-xs">
                          {(() => {
                            const totalPaid = payments.reduce((sum, p) => sum + Number(p.paid_amt || p.amount || 0), 0);
                            const totalAmount = Number(selectedBookingForPayment.total_amt || 0);
                            const remainingBalance = totalAmount - totalPaid;
                            const newPaymentAmount = Number(paymentForm.amount) || 0;

                            if (newPaymentAmount > remainingBalance) {
                              return (
                                <p className="text-red-600 font-medium">
                                  ⚠️ Exceeds by ₹{(newPaymentAmount - remainingBalance).toLocaleString()}
                                </p>
                              );
                            } else if (newPaymentAmount > 0) {
                              return (
                                <p className="text-green-600">
                                  ✓ Remaining after payment: ₹{(remainingBalance - newPaymentAmount).toLocaleString()}
                                </p>
                              );
                            } else {
                              return (
                                <p className="text-gray-500">
                                  Remaining balance: ₹{remainingBalance.toLocaleString()}
                                </p>
                              );
                            }
                          })()}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                        <select
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                          value={paymentForm.payment_mode}
                          onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Card">Card</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                        <textarea
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                          rows="3"
                          placeholder="Advance, Full Settlement, etc."
                          value={paymentForm.remarks}
                          onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                        ></textarea>
                      </div>

                      <button
                        onClick={handlePaymentSubmit}
                        disabled={paymentLoading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {paymentLoading ? (
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" /> Record Payment
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}
        {/* ===== UNIFIED BOOKING DETAIL MODAL ===== */}
        {showDetailModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">

              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedBooking.guest_name}</h3>
                    <p className="text-sm text-gray-500">Room {selectedBooking.room_no} · Booking #{selectedBooking.id}</p>
                  </div>
                  {/* Status badge */}
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
                <button
                  onClick={() => { setShowDetailModal(false); resetForm(); setEditing(null); }}
                  className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-gray-700 hover:shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
                <button
                  onClick={() => setDetailTab("info")}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                    detailTab === "info"
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Edit2 className="w-4 h-4" /> Booking Info
                </button>
                <button
                  onClick={() => setDetailTab("payments")}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                    detailTab === "payments"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <DollarSign className="w-4 h-4" /> Payments & Billing
                  {/* Balance due indicator */}
                  {(() => {
                    const due = Math.max(0,
                      (selectedBooking.total_amt || 0) -
                      payments.reduce((s, p) => s + Number(p.paid_amt || p.amount || 0), 0)
                    );
                    return due > 0 ? (
                      <span className="ml-1 bg-red-100 text-red-600 text-xs px-1.5 rounded-full">₹{due.toLocaleString()} due</span>
                    ) : null;
                  })()}
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">

                {/* --- Booking Info Tab --- */}
                {detailTab === "info" && (
                  <div className="p-6 space-y-5">
                    {/* Error */}
                    {errorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-700">{errorMessage}</p>
                        <button onClick={() => setErrorMessage("")} className="ml-auto"><X className="w-4 h-4 text-red-400" /></button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Guest Name */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <User className="w-4 h-4 inline mr-1.5" /> Guest Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter guest name"
                          value={form.guest_name}
                          onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      {/* Room Selection */}
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            <Home className="w-4 h-4 inline mr-1.5" /> Select Rooms
                            <span className="ml-2 text-xs font-normal text-gray-400">(Multiple allowed)</span>
                          </label>
                          {form.room_ids.length > 0 && (
                            <button type="button" onClick={() => setForm({ ...form, room_ids: [] })} className="text-xs text-orange-500 hover:text-orange-700 font-medium">Clear all</button>
                          )}
                        </div>
                        {availableRooms.length === 0 ? (
                          <div className="border border-dashed border-red-200 bg-red-50 rounded-xl p-4 text-center">
                            <Home className="w-6 h-6 text-red-300 mx-auto mb-1" />
                            <p className="text-sm text-red-500 font-medium">No rooms available for selected dates</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                            {availableRooms.map((r) => {
                              const isSel = form.room_ids.includes(Number(r.id));
                              return (
                                <button key={r.id} type="button"
                                  onClick={() => { const id = Number(r.id); setForm({ ...form, room_ids: isSel ? form.room_ids.filter(rid => rid !== id) : [...form.room_ids, id] }); }}
                                  className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all ${isSel ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/40"}`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSel ? "border-orange-500 bg-orange-500" : "border-gray-300"}`}>
                                    {isSel && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`text-xs font-semibold truncate ${isSel ? "text-orange-700" : "text-gray-800"}`}>Room {r.room_no}</p>
                                    <p className="text-xs text-gray-400 truncate">{r.type}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <p className={`mt-1.5 text-xs font-medium ${form.room_ids.length > 0 ? "text-orange-600" : "text-gray-400"}`}>
                          {form.room_ids.length > 0 ? `✓ ${form.room_ids.length} room${form.room_ids.length > 1 ? "s" : ""} selected` : "No rooms selected"}
                        </p>
                      </div>

                      {/* Guests & Children */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1"><Users className="w-4 h-4 inline mr-1.5" /> Number of Guests</label>
                        <input type="number" min="1" value={form.total_guest}
                          onChange={(e) => setForm({ ...form, total_guest: parseInt(e.target.value) || 1 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1"><Users className="w-4 h-4 inline mr-1.5" /> Number of Children</label>
                        <input type="number" min="0" value={form.childrens}
                          onChange={(e) => setForm({ ...form, childrens: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                      </div>

                      {/* Dates */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1"><Calendar className="w-4 h-4 inline mr-1.5" /> Check-in Date</label>
                        <input type="date" value={form.check_in}
                          onChange={(e) => setForm({ ...form, check_in: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1"><Calendar className="w-4 h-4 inline mr-1.5" /> Check-out Date</label>
                        <input type="date" value={form.check_out}
                          onChange={(e) => setForm({ ...form, check_out: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                      </div>

                      {/* Nights info */}
                      {form.check_in && form.check_out && (
                        <div className="md:col-span-2">
                          <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <p className="text-sm text-blue-700 font-medium">
                              {Math.ceil((new Date(form.check_out) - new Date(form.check_in)) / (1000 * 60 * 60 * 24))} nights
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- Payments Tab --- */}
                {detailTab === "payments" && (
                  <div className="p-6">
                    {/* Financial Overview */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Total Amount</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">₹{Number(selectedBooking.total_amt || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Total Paid</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">₹{payments.reduce((s, p) => s + Number(p.paid_amt || p.amount || 0), 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                        <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Balance Due</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">₹{Math.max(0, (selectedBooking.total_amt || 0) - payments.reduce((s, p) => s + Number(p.paid_amt || p.amount || 0), 0)).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Transaction History */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" /> Transaction History
                        </h4>
                        {/* Search */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input type="text" placeholder="Search payments..." value={paymentSearchTerm}
                            onChange={(e) => setPaymentSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        {paymentLoading && filteredPayments.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
                        ) : filteredPayments.length > 0 ? (
                          <div className="bg-white border border-gray-100 rounded-xl shadow-sm divide-y divide-gray-100">
                            {paginatedPayments.map((payment) => (
                              <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors group">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-bold text-gray-900">₹{Number(payment.paid_amt || payment.amount || 0).toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">{new Date(payment.created_at || Date.now()).toLocaleDateString()}</p>
                                  </div>
                                  <div className="text-right flex items-center gap-2">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">{payment.payment_mode}</span>
                                    <button onClick={() => handleDeletePayment(payment.id)} disabled={paymentLoading}
                                      className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1" title="Delete">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                {payment.remarks && <p className="text-xs text-gray-500 italic mt-1">{payment.remarks}</p>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-sm">No payments recorded yet</div>
                        )}
                        {/* Pagination */}
                        {totalPaymentPages > 1 && (
                          <div className="flex justify-center gap-1 mt-2">
                            <button onClick={() => setPaymentCurrentPage(p => Math.max(1, p - 1))} disabled={paymentCurrentPage === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                            {[...Array(totalPaymentPages)].map((_, i) => (
                              <button key={i} onClick={() => setPaymentCurrentPage(i + 1)} className={`w-7 h-7 rounded text-xs font-bold ${paymentCurrentPage === i + 1 ? "bg-green-600 text-white" : "hover:bg-gray-100"}`}>{i + 1}</button>
                            ))}
                            <button onClick={() => setPaymentCurrentPage(p => Math.min(totalPaymentPages, p + 1))} disabled={paymentCurrentPage >= totalPaymentPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>

                      {/* New Payment Form */}
                      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 h-fit">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Plus className="w-4 h-4" /> Record New Payment</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                              <input type="number" value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="0.00" />
                            </div>
                            {/* Balance indicator */}
                            {(() => {
                              const totalPaid = payments.reduce((s, p) => s + Number(p.paid_amt || p.amount || 0), 0);
                              const remaining = (selectedBooking.total_amt || 0) - totalPaid;
                              const entered = Number(paymentForm.amount) || 0;
                              if (entered > remaining) return <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Exceeds by ₹{(entered - remaining).toLocaleString()}</p>;
                              if (entered > 0) return <p className="text-xs text-green-600 mt-1">✓ Remaining after: ₹{(remaining - entered).toLocaleString()}</p>;
                              return <p className="text-xs text-gray-500 mt-1">Remaining: ₹{remaining.toLocaleString()}</p>;
                            })()}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                            <select value={paymentForm.payment_mode}
                              onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                              <option value="Cash">Cash</option>
                              <option value="UPI">UPI</option>
                              <option value="Card">Card</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                            <textarea rows="2" value={paymentForm.remarks}
                              onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                              placeholder="Advance, Full Settlement, etc."
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm" />
                          </div>
                          <button onClick={handlePaymentSubmit} disabled={paymentLoading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                            {paymentLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Record Payment</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer — only shown on Booking Info tab */}
              {detailTab === "info" && (
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-2xl flex-shrink-0">
                  <button
                    onClick={() => { setDetailTab("payments"); }}
                    className="flex items-center gap-2 text-sm text-green-700 font-semibold hover:text-green-800 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <DollarSign className="w-4 h-4" /> View Payments
                  </button>
                  <div className="flex gap-3">
                    <button onClick={() => { setShowDetailModal(false); resetForm(); setEditing(null); }}
                      className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors">
                      Cancel
                    </button>
                    <button onClick={async () => { await submitForm(); setShowDetailModal(false); }}
                      disabled={form.room_ids.length === 0}
                      className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${
                        form.room_ids.length === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-orange-500 text-white hover:bg-orange-600"
                      }`}>
                      <CheckCircle className="w-4 h-4" /> Update Booking
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}