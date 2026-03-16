// import { useEffect, useState } from "react";
// import { Calendar, User, Users, Home, X, CheckCircle, AlertCircle, Edit2, Trash2, Eye, Search, Filter, CreditCard, DollarSign, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
// import {
//   getBookings,
//   createBooking,
//   updateBooking,
//   deleteBooking,
//   checkIn,
//   checkOut,
//   getPayments,
//   addPayment,
//   deletePayment,
// } from "../services/bookingServices";
// import { getRooms } from "../services/roomServices";

// export default function Bookings() {
//   /* ================= STATE ================= */
//   const [bookings, setBookings] = useState([]);
//   const [rooms, setRooms] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");

//   // Pagination State
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   const [showForm, setShowForm] = useState(false);
//   const [editing, setEditing] = useState(null);
//   const [errorMessage, setErrorMessage] = useState("");

//   const [form, setForm] = useState({
//     room_ids: [], // Changed to array for multi-room support
//     guest_name: "",
//     total_guest: 1,
//     childrens: 0,
//     check_in: "",
//     check_out: "",
//   });

//   const [availableRooms, setAvailableRooms] = useState([]);

//   // Payment State
//   const [showPaymentModal, setShowPaymentModal] = useState(false);
//   const [payments, setPayments] = useState([]);
//   const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
//   const [paymentLoading, setPaymentLoading] = useState(false);
//   const [paymentSearchTerm, setPaymentSearchTerm] = useState("");
//   const [paymentForm, setPaymentForm] = useState({
//     amount: "",
//     payment_mode: "Cash",
//     remarks: ""
//   });

//   /* ================= NORMALIZE ================= */
//   const normalizeBooking = (b) => {
//     const room =
//       Array.isArray(b.rooms) && b.rooms.length > 0
//         ? b.rooms[0]
//         : null;

//     return {
//       id: b.id,
//       guest_name: b.guest_name,
//       room_ids: Array.isArray(b.rooms) ? b.rooms.map(r => r.id) : [],
//       room_no: Array.isArray(b.rooms) ? b.rooms.map(r => r.room_no).join(", ") : "-",
//       room_type: Array.isArray(b.rooms) ? [...new Set(b.rooms.map(r => r.type))].join(", ") : "-",
//       check_in: b.check_in?.slice(0, 10),
//       check_out: b.check_out?.slice(0, 10),
//       status: b.status,
//       total_amt: b.total_amt,
//       total_guest: b.total_guest || 1,
//       childrens: b.childrens || 0,
//     };
//   };

//   /* ================= FETCH ================= */
//   useEffect(() => {
//     fetchAll();
//   }, []);

//   const fetchAll = async () => {
//     try {
//       setLoading(true);
//       setErrorMessage("");

//       const [bookingRes, roomRes] = await Promise.all([
//         getBookings(),
//         getRooms(),
//       ]);

//       console.log("📦 RAW BOOKINGS RESPONSE 👉", bookingRes.data);
//       console.log("🏨 RAW ROOMS RESPONSE 👉", roomRes.data);

//       const normalizedBookings = Array.isArray(bookingRes.data.data)
//         ? bookingRes.data.data.map(normalizeBooking)
//         : [];
      
//       setBookings(normalizedBookings);

//       const roomsData = Array.isArray(roomRes.data) ? roomRes.data : (roomRes.data?.data || []);
//       console.log("🏨 PROCESSED ROOMS DATA 👉", roomsData);
//       setRooms(roomsData);

//       // Initially show all rooms
//       setAvailableRooms(roomsData);

//     } catch (e) {
//       console.error("❌ FETCH ERROR 👉", e);
//       setErrorMessage("Data load failed. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= CHECK ROOM AVAILABILITY ================= */
//   useEffect(() => {
//     if (form.check_in && form.check_out) {
//       checkAvailability();
//     }
//   }, [form.check_in, form.check_out, bookings, editing]);

//   const checkAvailability = () => {
//     console.log("🔍 CHECKING AVAILABILITY...");
//     console.log("📅 Form Dates:", form.check_in, "to", form.check_out);
//     console.log("🏨 Total Rooms:", rooms.length);

//     if (!form.check_in || !form.check_out || form.check_out <= form.check_in) {
//       console.log("⚠️ Dates invalid or missing, showing all rooms");
//       setAvailableRooms(rooms);
//       return;
//     }

//     // Find conflicting bookings
//     const conflictingBookingIds = bookings
//       .filter(booking => {
//         // Skip if booking is checked-out/cancelled
//         if (booking.status === "Checked-out" || booking.status === "Cancelled") {
//           return false;
//         }

//         const bookingCheckIn = new Date(booking.check_in);
//         const bookingCheckOut = new Date(booking.check_out);
//         const selectedCheckIn = new Date(form.check_in);
//         const selectedCheckOut = new Date(form.check_out);

//         // Check for date overlap
//         const isOverlap = (
//           (selectedCheckIn >= bookingCheckIn && selectedCheckIn < bookingCheckOut) ||
//           (selectedCheckOut > bookingCheckIn && selectedCheckOut <= bookingCheckOut) ||
//           (selectedCheckIn <= bookingCheckIn && selectedCheckOut >= bookingCheckOut)
//         );

//         // Skip if it's the same booking we are editing
//         if (editing && Number(booking.id) === Number(editing.id)) {
//           return false;
//         }

//         return isOverlap;
//       })
//       .flatMap(booking => booking.room_ids || []); // Handle multiple rooms per booking

//     console.log("🚫 Conflicting Room IDs:", conflictingBookingIds);

//     // Filter available rooms and restrict types to Single Suite and Double Suite
//     // BUT! Allow the currently selected room even if it has an old type, to prevent it from disappearing
//     const available = rooms.filter(room => {
//       const isNotConflict = !conflictingBookingIds.includes(room.id);
//       const isCorrectType = room.type === "Single Suite" || room.type === "Double Suite";
      
//       // If we are editing, always keep the rooms that were already booked for this booking
//       const isCurrentBookingRoom = editing && editing.room_ids?.includes(room.id);

//       if (isCurrentBookingRoom) {
//         return true;
//       }

//       return isNotConflict && isCorrectType;
//     });

//     setAvailableRooms(available);

//     // Filter out selected rooms that are no longer available
//     const stillAvailable = form.room_ids.filter(id => 
//       available.some(r => Number(r.id) === Number(id))
//     );
    
//     if (stillAvailable.length !== form.room_ids.length) {
//       console.log("❌ Some selected rooms are no longer available, updating form");
//       setForm(prev => ({ ...prev, room_ids: stillAvailable }));
//     }
//   };

//   /* ================= FORM ================= */
//   const resetForm = () => {
//     console.log("♻️ RESET FORM");
//     setForm({
//       room_ids: [],
//       guest_name: "",
//       total_guest: 1,
//       childrens: 0,
//       check_in: "",
//       check_out: "",
//     });
//     setEditing(null);
//     setErrorMessage("");
//     setAvailableRooms(rooms);
//   };

//   const submitForm = async () => {
//     console.log("📝 SUBMITTING FORM...");
//     console.log("📦 Selected Room IDs:", form.room_ids);

//     // Validation
//     if (form.room_ids.length === 0 || !form.guest_name || !form.check_in || !form.check_out) {
//       setErrorMessage("All fields are required, including at least one room");
//       return;
//     }

//     if (form.check_out <= form.check_in) {
//       setErrorMessage("Check-out must be after check-in");
//       return;
//     }

//     // Check guest limit (Sum limits for multiple rooms)
//     const selectedRoomsData = rooms.filter(r => form.room_ids.includes(Number(r.id)));
//     const totalLimit = selectedRoomsData.reduce((sum, r) => sum + (r.guest_limit || 0), 0);
    
//     if (form.total_guest > totalLimit) {
//       setErrorMessage(`Guest limit exceeded. Total capacity for selected rooms: ${totalLimit}`);
//       return;
//     }

//     // 🔥 EXACT PAYLOAD AS PER API IMAGE
//     const payload = {
//       guest_name: form.guest_name,
//       total_guest: Number(form.total_guest),
//       childrens: Number(form.childrens),
//       check_in: form.check_in,
//       check_out: form.check_out,
//     };

//     // If one room, use room_id, if multiple use rooms array
//     if (form.room_ids.length === 1) {
//       payload.room_id = Number(form.room_ids[0]);
//     } else {
//       payload.rooms = form.room_ids.map(id => Number(id));
//     }

//     console.log("🚀 FINAL PAYLOAD 👉", payload);

//     try {
//       setErrorMessage("");
//       if (editing) {
//         await updateBooking(editing.id, payload);
//       } else {
//         await createBooking(payload);
//       }

//       setShowForm(false);
//       resetForm();
//       fetchAll();
//     } catch (err) {
//       console.error("❌ BACKEND ERROR 👉", err.response?.data);
//       const errorMsg = err.response?.data?.error || err.response?.data?.message || "Booking failed. Please try again.";
//       setErrorMessage(errorMsg);
//     }
//   };

//   /* ================= DELETE ================= */
//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this booking?")) return;

//     try {
//       console.log("🗑 DELETE BOOKING 👉", id);
//       setErrorMessage("");
//       setLoading(true);
      
//       const response = await deleteBooking(id);
//       console.log("✅ DELETE RESPONSE 👉", response.data);
      
//       // Remove from local state
//       setBookings((prev) => prev.filter((b) => b.id !== id));
      
//       // Also refresh all data to ensure consistency
//       await fetchAll();
//     } catch (err) {
//       console.error("❌ DELETE ERROR FULL OBJECT 👉", err);
//       console.error("❌ DELETE ERROR RESPONSE 👉", err.response);
//       console.error("❌ DELETE ERROR DATA 👉", err.response?.data);
//       console.error("❌ DELETE STATUS 👉", err.response?.status);
      
//       let errorMsg = "Delete failed. Please try again.";
      
//       // Check for specific error messages
//       if (err.response?.status === 500) {
//         errorMsg = "Server error occurred. The backend might have an issue with deleting this booking. Please contact support.";
//         console.error("🔥 SERVER ERROR DETAILS:", err.response?.data);
//       } else if (err.response?.data?.message) {
//         errorMsg = err.response.data.message;
//       } else if (err.response?.data?.error) {
//         errorMsg = err.response.data.error;
//       }
      
//       setErrorMessage(errorMsg);
//       alert(errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= STATUS ================= */
//   const handleStatusChange = async (b, status) => {
//     try {
//       console.log("🔁 STATUS CHANGE 👉", b.id, status);
//       setErrorMessage("");
//       setLoading(true);

//       if (status === "Checked-in") {
//         await checkIn(b.id);
//       } else if (status === "Checked-out") {
//         await checkOut(b.id);
//       } else {
//         await updateBooking(b.id, { status });
//       }

//       // Update local state immediately for UI responsiveness
//       setBookings((prev) =>
//         prev.map((x) => (x.id === b.id ? { ...x, status } : x))
//       );
      
//       // Refresh all data to ensure stats are accurate
//       await fetchAll();
//     } catch (err) {
//       console.error("❌ STATUS UPDATE ERROR 👉", err.response?.data);
      
//       // Show specific error message from backend
//       let errorMsg = "Status update failed. Please try again.";
//       if (err.response?.data?.message) {
//         errorMsg = err.response.data.message;
//       }
      
//       setErrorMessage(errorMsg);
//       alert(errorMsg);
      
//       // Don't refresh on error - keep current state
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= FILTER BOOKINGS ================= */
//   const filteredBookings = bookings.filter(booking => {
//     const matchesSearch =
//       booking.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       booking.room_no.toLowerCase().includes(searchTerm.toLowerCase());

//     // Always show all statuses by default unless user selects a specific filter
//     const matchesStatus =
//       statusFilter === "all" ||
//       statusFilter === "" ||
//       booking.status === statusFilter;

//     return matchesSearch && matchesStatus;
//   });

//   // Calculate pagination
//   const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
//   const paginatedBookings = filteredBookings.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   // Reset page when filter changes
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, statusFilter]);

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "Confirmed": return "bg-blue-100 text-blue-800";
//       case "Checked-in": return "bg-green-100 text-green-800";
//       case "Checked-out": return "bg-gray-100 text-gray-800";
//       case "Cancelled": return "bg-red-100 text-red-800";
//       default: return "bg-gray-100 text-gray-800";
//     }
//   };

//   /* ================= PAYMENT FILTER & PAGINATION ================= */
//   const filteredPayments = payments.filter(payment => {
//     const term = paymentSearchTerm.toLowerCase();
//     return (
//       (payment.payment_mode || "").toLowerCase().includes(term) ||
//       (payment.remarks || "").toLowerCase().includes(term) ||
//       (payment.paid_amt || payment.amount || "").toString().includes(term)
//     );
//   });

//   const paymentItemsPerPage = 4;
//   const [paymentCurrentPage, setPaymentCurrentPage] = useState(1);
//   const totalPaymentPages = Math.ceil(filteredPayments.length / paymentItemsPerPage) || 1;
//   const paginatedPayments = filteredPayments.slice(
//     (paymentCurrentPage - 1) * paymentItemsPerPage,
//     paymentCurrentPage * paymentItemsPerPage
//   );

//   // Reset page when search changes
//   useEffect(() => {
//     setPaymentCurrentPage(1);
//   }, [paymentSearchTerm]);

//   /* ================= PAYMENT HANDLERS ================= */
//   const openPaymentModal = async (booking) => {
//     setSelectedBookingForPayment(booking);
//     setPaymentForm({ amount: "", payment_mode: "Cash", remarks: "" });
//     setShowPaymentModal(true);
//     setPaymentLoading(true);
//     try {
//       console.log("💳 Fetching payments for booking:", booking.id);
//       const res = await getPayments(booking.id);
//       console.log("💰 PAYMENTS RESPONSE RAW:", res.data);
//       console.log("💰 Is res.data an array?", Array.isArray(res.data));
//       console.log("💰 Does res.data have data property?", res.data?.data);
      
//       // Try different response structures
//       let paymentsData = [];
//       if (Array.isArray(res.data)) {
//         paymentsData = res.data;
//       } else if (res.data?.data && Array.isArray(res.data.data)) {
//         paymentsData = res.data.data;
//       } else if (res.data?.payments && Array.isArray(res.data.payments)) {
//         paymentsData = res.data.payments;
//       } else {
//         console.warn("⚠️ Unexpected payments format:", res.data);
//         paymentsData = [];
//       }
      
//       console.log("💰 PROCESSED PAYMENTS:", paymentsData);
//       setPayments(paymentsData);
//     } catch (err) {
//       console.error("❌ Failed to fetch payments", err.response?.data || err);
//       setPayments([]);
//     } finally {
//       setPaymentLoading(false);
//     }
//   };

//   const handlePaymentSubmit = async () => {
//     if (!paymentForm.amount || isNaN(paymentForm.amount) || Number(paymentForm.amount) <= 0) {
//       alert("Please enter a valid amount");
//       return;
//     }

//     try {
//       setPaymentLoading(true);
//       // Backend expects 'paid_amt' not 'amount'
//       const payload = {
//         paid_amt: Number(paymentForm.amount),
//         payment_mode: paymentForm.payment_mode,
//         remarks: paymentForm.remarks || "Payment"
//       };

//       console.log("💸 ADDING PAYMENT", payload);
//       const response = await addPayment(selectedBookingForPayment.id, payload);
//       console.log("✅ PAYMENT ADDED SUCCESSFULLY", response.data);

//       // Refresh payments list
//       const res = await getPayments(selectedBookingForPayment.id);
//       console.log("📋 REFRESHED PAYMENTS RAW:", res.data);
      
//       // Try different response structures
//       let paymentsData = [];
//       if (Array.isArray(res.data)) {
//         paymentsData = res.data;
//       } else if (res.data?.data && Array.isArray(res.data.data)) {
//         paymentsData = res.data.data;
//       } else if (res.data?.payments && Array.isArray(res.data.payments)) {
//         paymentsData = res.data.payments;
//       } else {
//         console.warn("⚠️ Unexpected payments format:", res.data);
//         paymentsData = [];
//       }
      
//       console.log("📋 PROCESSED PAYMENTS AFTER ADD:", paymentsData);
//       setPayments(paymentsData);

//       // Reset form
//       setPaymentForm({ amount: "", payment_mode: "Cash", remarks: "" });
      
//       // Show success message
//       alert("Payment added successfully!");
//     } catch (err) {
//       console.error("❌ PAYMENT ERROR FULL OBJECT", err);
//       console.error("❌ PAYMENT ERROR RESPONSE", err.response);
//       console.error("❌ PAYMENT ERROR DATA", err.response?.data);
      
//       let errorMsg = "Failed to add payment. Please try again.";
//       if (err.response?.data?.message) {
//         errorMsg = err.response.data.message;
//       } else if (err.response?.data?.errors) {
//         // Show validation errors
//         const errors = Object.values(err.response.data.errors).flat().join("\n");
//         errorMsg = errors;
//       }
      
//       console.error("❌ PAYMENT ERROR MESSAGE", errorMsg);
//       alert(errorMsg);
//     } finally {
//       setPaymentLoading(false);
//     }
//   };

//   const handleDeletePayment = async (paymentId) => {
//     if (!window.confirm("Are you sure you want to delete this payment transaction?")) return;

//     try {
//       setPaymentLoading(true);
//       console.log("🗑️ Deleting payment:", paymentId);
//       await deletePayment(paymentId);

//       // Refresh payments list with proper data handling
//       const res = await getPayments(selectedBookingForPayment.id);
//       console.log("📋 PAYMENTS AFTER DELETE RAW:", res.data);
      
//       // Try different response structures
//       let paymentsData = [];
//       if (Array.isArray(res.data)) {
//         paymentsData = res.data;
//       } else if (res.data?.data && Array.isArray(res.data.data)) {
//         paymentsData = res.data.data;
//       } else if (res.data?.payments && Array.isArray(res.data.payments)) {
//         paymentsData = res.data.payments;
//       } else {
//         console.warn("⚠️ Unexpected payments format:", res.data);
//         paymentsData = [];
//       }
      
//       console.log("📋 PAYMENTS AFTER DELETE:", paymentsData);
//       setPayments(paymentsData);
      
//       // Reset pagination to first page if needed
//       if (paymentCurrentPage > 1 && paymentsData.length <= (paymentCurrentPage - 1) * paymentItemsPerPage) {
//         setPaymentCurrentPage(1);
//       }
      
//       // Reset search term
//       setPaymentSearchTerm("");
//     } catch (err) {
//       console.error("❌ DELETE PAYMENT ERROR:", err.response?.data || err);
//       alert("Failed to delete payment.");
//     } finally {
//       setPaymentLoading(false);
//     }
//   };


//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-gray-600 font-medium">Loading bookings...</p>
//         </div>
//       </div>
//     );
//   }

//   /* ================= UI ================= */
//   return (
//     <div className="min-h-screen bg-gray-50 p-4 md:p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Bookings Management</h1>
//           <p className="text-gray-600 mt-1">Manage all hotel bookings and room assignments</p>
//         </div>

//         {/* Error Message */}
//         {errorMessage && (
//           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
//             <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
//             <p className="text-red-700">{errorMessage}</p>
//             <button onClick={() => setErrorMessage("")} className="ml-auto">
//               <X className="w-4 h-4 text-red-500" />
//             </button>
//           </div>
//         )}

//         {/* Controls */}
//         <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
//           <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
//             <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
//               <div className="relative flex-1">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search by guest or room..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                 />
//               </div>

//               <div className="flex items-center gap-2">
//                 <Filter className="w-4 h-4 text-gray-400" />
//                 <select
//                   value={statusFilter}
//                   onChange={(e) => setStatusFilter(e.target.value)}
//                   className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                 >
//                   <option value="all">All Status</option>
//                   <option value="Confirmed">Confirmed</option>
//                   <option value="Checked-in">Checked-in</option>
//                   <option value="Checked-out">Checked-out</option>
//                   <option value="Cancelled">Cancelled</option>
//                 </select>
//               </div>
//             </div>

//             {/* Add Booking button removed */}
//           </div>
//         </div>

//         {/* Stats Summary */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//           <div className="bg-white rounded-xl shadow-sm p-4">
//             <p className="text-sm text-gray-600">Total Bookings</p>
//             <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
//           </div>
//           <div className="bg-white rounded-xl shadow-sm p-4">
//             <p className="text-sm text-gray-600">Active Guests</p>
//             <p className="text-2xl font-bold text-gray-900">
//               {bookings.filter(b => b.status === "Checked-in").length}
//             </p>
//           </div>
//           <div className="bg-white rounded-xl shadow-sm p-4">
//             <p className="text-sm text-gray-600">Today's Check-ins</p>
//             <p className="text-2xl font-bold text-gray-900">
//               {(() => {
//                 const today = new Date().toISOString().slice(0, 10);
//                 return bookings.filter(b => b.check_in === today && b.status === "Confirmed").length;
//               })()}
//             </p>
//           </div>
//           <div className="bg-white rounded-xl shadow-sm p-4">
//             <p className="text-sm text-gray-600">Available Rooms</p>
//             <p className="text-2xl font-bold text-gray-900">
//               {rooms.filter(r => r.status === "Available").length}
//             </p>
//           </div>
//         </div>

//         {/* Bookings Table */}
//         <div className="bg-white rounded-xl shadow-sm overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-gray-50 border-b border-gray-200">
//                   <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
//                     Guest Details
//                   </th>
//                   <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
//                     Room Details
//                   </th>
//                   <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
//                     Dates
//                   </th>
//                   <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 {paginatedBookings.length > 0 ? (
//                   paginatedBookings.map((b) => (
//                     <tr key={`${b.id}-${b.status}`} className="hover:bg-gray-50 transition-colors">
//                       <td className="py-4 px-6">
//                         <div>
//                           <p className="font-medium text-gray-900">{b.guest_name}</p>
//                           <div className="flex items-center gap-2 mt-1">
//                             <Users className="w-3 h-3 text-gray-400" />
//                             <span className="text-sm text-gray-600">{b.total_guest} guests</span>
//                           </div>
//                           <div className="flex items-center gap-2 mt-1">
//                             <Users className="w-3 h-3 text-gray-400" />
//                             <span className="text-sm text-gray-600">{b.childrens} children</span>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="py-4 px-6">
//                         <div>
//                           <p className="font-medium text-gray-900">Room {b.room_no}</p>
//                           <p className="text-sm text-gray-600">{b.room_type}</p>
//                         </div>
//                       </td>
//                       <td className="py-4 px-6">
//                         <div className="space-y-1">
//                           <div className="flex items-center gap-2">
//                             <Calendar className="w-3 h-3 text-gray-400" />
//                             <span className="text-sm">{b.check_in}</span>
//                           </div>
//                           <div className="flex items-center gap-2">
//                             <Calendar className="w-3 h-3 text-gray-400" />
//                             <span className="text-sm">{b.check_out}</span>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="py-4 px-6">
//                         <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(b.status)}`}>
//                           {b.status}
//                         </span>
//                       </td>
//                       <td className="py-4 px-6">
//                         <div className="flex items-center gap-2">
//                           <select
//                             value={b.status}
//                             onChange={(e) => handleStatusChange(b, e.target.value)}
//                             className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                           >
//                             <option value="Confirmed">Confirmed</option>
//                             <option value="Checked-in">Checked-in</option>
//                             <option value="Checked-out">Checked-out</option>
//                             <option value="Cancelled">Cancelled</option>
//                           </select>

//                           <button
//                             onClick={() => openPaymentModal(b)}
//                             className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
//                             title="Payments"
//                           >
//                             <CreditCard className="w-4 h-4" />
//                           </button>

//                           <button
//                             onClick={() => {
//                               console.log("✏️ EDIT BOOKING 👉", b);
//                               setEditing(b);
//                               setForm({
//                                 room_ids: b.room_ids,
//                                 guest_name: b.guest_name,
//                                 total_guest: b.total_guest || 1,
//                                 childrens: b.childrens || 0,
//                                 check_in: b.check_in,
//                                 check_out: b.check_out,
//                               });
//                               setShowForm(true);
//                             }}
//                             className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                             title="Edit"
//                           >
//                             <Edit2 className="w-4 h-4" />
//                           </button>

//                           {/* Delete button removed - bookings cannot be deleted */}
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="5" className="py-12 text-center">
//                       <div className="flex flex-col items-center justify-center">
//                         <Calendar className="w-12 h-12 text-gray-300 mb-4" />
//                         <p className="text-gray-500">No bookings found</p>
//                         {searchTerm && (
//                           <button
//                             onClick={() => setSearchTerm("")}
//                             className="mt-2 text-orange-600 hover:text-orange-700 text-sm font-medium"
//                           >
//                             Clear search
//                           </button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Pagination Controls */}
//         {filteredBookings.length > 0 && (
//           <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
//             <p className="text-sm text-gray-600 font-medium order-2 sm:order-1">
//               Showing <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredBookings.length)}</span> of <span className="font-bold text-gray-900">{filteredBookings.length}</span> records
//             </p>
            
//             <div className="flex items-center gap-1 order-1 sm:order-2">
//               <button
//                 onClick={() => setCurrentPage(1)}
//                 disabled={currentPage === 1}
//                 className={`p-2 rounded-lg transition-all ${
//                   currentPage === 1 
//                     ? 'text-gray-300 cursor-not-allowed' 
//                     : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600 active:scale-90'
//                 }`}
//                 title="First Page"
//               >
//                 <ChevronsLeft className="w-5 h-5" />
//               </button>
              
//               <button
//                 onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
//                 disabled={currentPage === 1}
//                 className={`p-2 rounded-lg transition-all mr-2 ${
//                   currentPage === 1 
//                     ? 'text-gray-300 cursor-not-allowed' 
//                     : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600 active:scale-90'
//                 }`}
//                 title="Previous Page"
//               >
//                 <ChevronLeft className="w-5 h-5" />
//               </button>

//               <div className="flex items-center gap-1 mx-2">
//                 {[...Array(totalPages)].map((_, i) => {
//                   const pageNum = i + 1;
//                   // Show current page, one before, one after, and first/last if many pages
//                   if (
//                     totalPages <= 7 ||
//                     pageNum === 1 ||
//                     pageNum === totalPages ||
//                     (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
//                   ) {
//                     return (
//                       <button
//                         key={pageNum}
//                         onClick={() => setCurrentPage(pageNum)}
//                         className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
//                           currentPage === pageNum
//                             ? 'bg-orange-500 text-white shadow-md shadow-orange-200 transform scale-105'
//                             : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
//                         }`}
//                       >
//                         {pageNum}
//                       </button>
//                     );
//                   } else if (
//                     (pageNum === 2 && currentPage > 4) ||
//                     (pageNum === totalPages - 1 && currentPage < totalPages - 3)
//                   ) {
//                     return <span key={pageNum} className="px-1 text-gray-400">...</span>;
//                   }
//                   return null;
//                 })}
//               </div>

//               <button
//                 onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
//                 disabled={currentPage === totalPages}
//                 className={`p-2 rounded-lg transition-all ml-2 ${
//                   currentPage === totalPages 
//                     ? 'text-gray-300 cursor-not-allowed' 
//                     : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600 active:scale-90'
//                 }`}
//                 title="Next Page"
//               >
//                 <ChevronRight className="w-5 h-5" />
//               </button>

//               <button
//                 onClick={() => setCurrentPage(totalPages)}
//                 disabled={currentPage === totalPages}
//                 className={`p-2 rounded-lg transition-all ${
//                   currentPage === totalPages 
//                     ? 'text-gray-300 cursor-not-allowed' 
//                     : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600 active:scale-90'
//                 }`}
//                 title="Last Page"
//               >
//                 <ChevronsRight className="w-5 h-5" />
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Booking Form Modal */}
//         {showForm && (
//           <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
//               <div className="p-6 border-b border-gray-200">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <div className="p-2 bg-orange-50 rounded-lg">
//                       <Calendar className="w-5 h-5 text-orange-500" />
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-bold text-gray-900">
//                         {editing ? "Edit Booking" : "New Booking"}
//                       </h3>
//                       <p className="text-sm text-gray-600">
//                         {editing ? "Update booking details" : "Create a new room booking"}
//                       </p>
//                     </div>
//                   </div>
//                   <button
//                     onClick={() => {
//                       setShowForm(false);
//                       resetForm();
//                     }}
//                     className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                   >
//                     <X className="w-5 h-5 text-gray-500" />
//                   </button>
//                 </div>
//               </div>

//               <div className="p-6 space-y-4">
//                 {/* Guest Name */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     <User className="w-4 h-4 inline mr-2" />
//                     Guest Name
//                   </label>
//                   <input
//                     type="text"
//                     placeholder="Enter guest name"
//                     value={form.guest_name}
//                     onChange={(e) =>
//                       setForm({
//                         ...form,
//                         guest_name: e.target.value,
//                       })
//                     }
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                   />
//                 </div>

//                 {/* Room Selection */}
//                 {/* Room Selection (Multi) */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     <Home className="w-4 h-4 inline mr-2" />
//                     Select Available Rooms (Multiple allowed)
//                   </label>
//                   <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
//                     {availableRooms.map((r) => (
//                       <label key={r.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
//                         <input
//                           type="checkbox"
//                           checked={form.room_ids.includes(Number(r.id))}
//                           onChange={(e) => {
//                             const id = Number(r.id);
//                             if (e.target.checked) {
//                               setForm({ ...form, room_ids: [...form.room_ids, id] });
//                             } else {
//                               setForm({ ...form, room_ids: form.room_ids.filter(rid => rid !== id) });
//                             }
//                           }}
//                           className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
//                         />
//                         <span className="text-sm font-medium text-gray-700">
//                           ROOM {r.room_no} — {r.type}
//                         </span>
//                       </label>
//                     ))}
//                     {availableRooms.length === 0 && (
//                       <p className="text-sm text-red-500 text-center py-2">No rooms available for these dates</p>
//                     )}
//                   </div>
//                   <p className="mt-2 text-xs text-gray-500">
//                     {form.room_ids.length} room(s) selected
//                   </p>
//                 </div>

//                 {/* Guest Count */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     <Users className="w-4 h-4 inline mr-2" />
//                     Number of Guests
//                   </label>
//                   <input
//                     type="number"
//                     min="1"
//                     max={rooms.find(r => r.id == form.room_id)?.guest_limit || 10}
//                     value={form.total_guest}
//                     onChange={(e) =>
//                       setForm({
//                         ...form,
//                         total_guest: parseInt(e.target.value) || 1,
//                       })
//                     }
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                   />
//                 </div>

//                 {/* Children Count */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     <Users className="w-4 h-4 inline mr-2" />
//                     Number of Children
//                   </label>
//                   <input
//                     type="number"
//                     min="0"
//                     value={form.childrens}
//                     onChange={(e) =>
//                       setForm({
//                         ...form,
//                         childrens: parseInt(e.target.value) || 0,
//                       })
//                     }
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                   />
//                 </div>

//                 {/* Dates */}
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Check-in Date
//                     </label>
//                     <input
//                       type="date"
//                       min={new Date().toISOString().split('T')[0]}
//                       value={form.check_in}
//                       onChange={(e) =>
//                         setForm({
//                           ...form,
//                           check_in: e.target.value,
//                           check_out: e.target.value >= form.check_out ? "" : form.check_out,
//                         })
//                       }
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Check-out Date
//                     </label>
//                     <input
//                       type="date"
//                       min={form.check_in || new Date().toISOString().split('T')[0]}
//                       value={form.check_out}
//                       onChange={(e) =>
//                         setForm({
//                           ...form,
//                           check_out: e.target.value,
//                         })
//                       }
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                     />
//                   </div>
//                 </div>

//                 {/* Date Range Info */}
//                 {form.check_in && form.check_out && (
//                   <div className="p-3 bg-blue-50 rounded-lg">
//                     <p className="text-sm text-blue-700">
//                       {Math.ceil((new Date(form.check_out) - new Date(form.check_in)) / (1000 * 60 * 60 * 24))} nights
//                     </p>
//                   </div>
//                 )}

//                 {/* Error Display */}
//                 {errorMessage && (
//                   <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//                     <p className="text-sm text-red-700">{errorMessage}</p>
//                   </div>
//                 )}
//               </div>

//               <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
//                 <button
//                   onClick={() => {
//                     setShowForm(false);
//                     resetForm();
//                   }}
//                   className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={submitForm}
//                   disabled={availableRooms.length === 0 && !editing}
//                   className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${availableRooms.length === 0 && !editing
//                     ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                     : 'bg-orange-500 text-white hover:bg-orange-600'
//                     }`}
//                 >
//                   <CheckCircle className="w-4 h-4" />
//                   {editing ? "Update Booking" : "Create Booking"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Payment Management Modal */}
//         {showPaymentModal && selectedBookingForPayment && (
//           <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
//               {/* Modal Header */}
//               <div className="p-6 border-b border-gray-200 flex justify-between items-center rounded-t-2xl bg-gray-50">
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 bg-green-100 rounded-lg">
//                     <DollarSign className="w-6 h-6 text-green-600" />
//                   </div>
//                   <div>
//                     <h3 className="text-xl font-bold text-gray-900">Payment & Billing</h3>
//                     <p className="text-sm text-gray-600">
//                       Guest: <span className="font-semibold text-gray-800">{selectedBookingForPayment.guest_name}</span> •
//                       Room: <span className="font-semibold text-gray-800">{selectedBookingForPayment.room_no}</span>
//                     </p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => setShowPaymentModal(false)}
//                   className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-gray-700 hover:shadow-sm"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>

//               <div className="flex-1 overflow-y-auto p-6">
                
//                 {/* Search Bar - Full Width at Top */}
//                 <div className="mb-6">
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//                     <input
//                       type="text"
//                       placeholder="Search payments by mode, remarks, amount..."
//                       value={paymentSearchTerm}
//                       onChange={(e) => setPaymentSearchTerm(e.target.value)}
//                       className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
//                     />
//                   </div>
//                 </div>

//                 {/* Financial Overview Cards */}
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
//                   <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
//                     <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Total Amount</p>
//                     <p className="text-2xl font-bold text-gray-900 mt-1">
//                       ₹{selectedBookingForPayment.total_amt ? Number(selectedBookingForPayment.total_amt).toLocaleString() : '0'}
//                     </p>
//                   </div>
//                   <div className="bg-green-50 p-4 rounded-xl border border-green-100">
//                     <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Total Paid</p>
//                     <p className="text-2xl font-bold text-gray-900 mt-1">
//                       ₹{payments.reduce((sum, p) => sum + Number(p.paid_amt || p.amount || 0), 0).toLocaleString()}
//                     </p>
//                   </div>
//                   <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
//                     <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Balance Due</p>
//                     <p className="text-2xl font-bold text-gray-900 mt-1">
//                       ₹{Math.max(0, (selectedBookingForPayment.total_amt || 0) - payments.reduce((sum, p) => sum + Number(p.paid_amt || p.amount || 0), 0)).toLocaleString()}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

//                   {/* Left Column: Transaction History */}
//                   <div className="space-y-4">
//                     <h4 className="font-bold text-gray-800 flex items-center gap-2">
//                       <CreditCard className="w-4 h-4" /> Transaction History
//                     </h4>

//                     {paymentLoading && filteredPayments.length === 0 ? (
//                       <div className="text-center py-8 text-gray-500">Loading payments...</div>
//                     ) : filteredPayments.length > 0 ? (
//                       <>
//                         <div className="bg-white border border-gray-100 rounded-xl shadow-sm divide-y divide-gray-100">
//                         {paginatedPayments.map((payment) => (
//                           <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors group">
//                             <div className="flex justify-between items-start">
//                               <div>
//                                 <p className="font-bold text-gray-900 text-lg">₹{Number(payment.paid_amt || payment.amount || 0).toLocaleString()}</p>
//                                 <p className="text-xs text-gray-500">{new Date(payment.created_at || Date.now()).toLocaleDateString()}</p>
//                               </div>
//                               <div className="text-right">
//                                 <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium mb-1">
//                                   {payment.payment_mode}
//                                 </span>
//                               </div>
//                             </div>
//                             <div className="flex justify-between items-center mt-2">
//                               <p className="text-sm text-gray-600 italic">
//                                 {payment.remarks || '-'}
//                               </p>
//                               <button
//                                 onClick={() => handleDeletePayment(payment.id)}
//                                 disabled={paymentLoading}
//                                 className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
//                                 title="Delete Transaction"
//                               >
//                                 <Trash2 className="w-4 h-4" />
//                               </button>
//                             </div>
//                           </div>
//                           ))}
//                         </div>
                        
//                         {/* Payment Pagination */}
//                         {totalPaymentPages > 1 && (
//                           <div className="flex items-center justify-between mt-4 px-2">
//                             <p className="text-sm text-gray-600">
//                               Showing {(paymentCurrentPage - 1) * paymentItemsPerPage + 1} to {Math.min(paymentCurrentPage * paymentItemsPerPage, filteredPayments.length)} of {filteredPayments.length} payments
//                             </p>
//                             <div className="flex items-center gap-1">
//                               <button onClick={() => setPaymentCurrentPage(1)} disabled={paymentCurrentPage === 1} className={`p-2 rounded-lg ${paymentCurrentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-green-50'}`}>
//                                 <ChevronsLeft className="w-4 h-4" />
//                               </button>
//                               <button onClick={() => setPaymentCurrentPage(p => Math.max(1, p - 1))} disabled={paymentCurrentPage === 1} className={`p-2 rounded-lg ${paymentCurrentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-green-50'}`}>
//                                 <ChevronLeft className="w-4 h-4" />
//                               </button>
//                               {[...Array(totalPaymentPages)].map((_, i) => (
//                                 <button key={i} onClick={() => setPaymentCurrentPage(i + 1)} className={`w-8 h-8 rounded-lg text-sm font-bold ${paymentCurrentPage === i + 1 ? 'bg-green-600 text-white shadow-md' : 'hover:bg-gray-100'}`}>
//                                   {i + 1}
//                                 </button>
//                               ))}
//                               <button onClick={() => setPaymentCurrentPage(p => Math.min(totalPaymentPages, p + 1))} disabled={paymentCurrentPage >= totalPaymentPages} className={`p-2 rounded-lg ${paymentCurrentPage >= totalPaymentPages ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-green-50'}`}>
//                                 <ChevronRight className="w-4 h-4" />
//                               </button>
//                               <button onClick={() => setPaymentCurrentPage(totalPaymentPages)} disabled={paymentCurrentPage >= totalPaymentPages} className={`p-2 rounded-lg ${paymentCurrentPage >= totalPaymentPages ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-green-50'}`}>
//                                 <ChevronsRight className="w-4 h-4" />
//                               </button>
//                             </div>
//                           </div>
//                         )}
//                       </>
//                     ) : (
//                       <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
//                         No payments recorded yet
//                       </div>
//                     )}
//                   </div>

//                   {/* Right Column: New Payment Form */}
//                   <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-fit">
//                     <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
//                       <Plus className="w-4 h-4" /> Record New Payment
//                     </h4>

//                     <div className="space-y-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
//                         <div className="relative">
//                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
//                           <input
//                             type="number"
//                             className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
//                             placeholder="0.00"
//                             value={paymentForm.amount}
//                             onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
//                           />
//                         </div>
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
//                         <select
//                           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
//                           value={paymentForm.payment_mode}
//                           onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
//                         >
//                           <option value="Cash">Cash</option>
//                           <option value="UPI">UPI</option>
//                           <option value="Card">Card</option>
//                           <option value="Bank Transfer">Bank Transfer</option>
//                         </select>
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
//                         <textarea
//                           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
//                           rows="3"
//                           placeholder="Advance, Full Settlement, etc."
//                           value={paymentForm.remarks}
//                           onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
//                         ></textarea>
//                       </div>

//                       <button
//                         onClick={handlePaymentSubmit}
//                         disabled={paymentLoading}
//                         className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//                       >
//                         {paymentLoading ? (
//                           <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
//                         ) : (
//                           <>
//                             <CheckCircle className="w-5 h-5" /> Record Payment
//                           </>
//                         )}
//                       </button>
//                     </div>
//                   </div>

//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import { Calendar, User, Users, Home, X, CheckCircle, AlertCircle, Edit2, Trash2, Eye, Search, Filter, CreditCard, DollarSign, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  getBookings,
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
  /* ================= STATE ================= */
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    room_ids: [], // Changed to array for multi-room support
    guest_name: "",
    total_guest: 1,
    childrens: 0,
    check_in: "",
    check_out: "",
  });

  const [availableRooms, setAvailableRooms] = useState([]);

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
    if (!status) return "Confirmed";
    const lower = status.toLowerCase();
    if (lower.includes("confirm")) return "Confirmed";
    if (lower.includes("check-in") || lower.includes("checked in")) return "Checked-in";
    if (lower.includes("check-out") || lower.includes("checked out")) return "Checked-out";
    if (lower.includes("cancel")) return "Cancelled";
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
  const handleStatusChange = async (b, status) => {
    try {
      console.log("🔁 STATUS CHANGE 👉", b.id, status);
      setErrorMessage("");
      setLoading(true);

      // Normalize the status again before sending (just in case)
      const normalizedStatus = normalizeStatus(status);

      if (normalizedStatus === "Checked-in") {
        await checkIn(b.id);
      } else if (normalizedStatus === "Checked-out") {
        await checkOut(b.id);
      } else {
        await updateBooking(b.id, { status: normalizedStatus });
      }

      // Update local state immediately for UI responsiveness
      setBookings((prev) =>
        prev.map((x) => (x.id === b.id ? { ...x, status: normalizedStatus } : x))
      );
      
      // Refresh all data to ensure stats are accurate
      await fetchAll();
    } catch (err) {
      console.error("❌ STATUS UPDATE ERROR 👉", err.response?.data);
      
      // Show specific error message from backend
      let errorMsg = "Status update failed. Please try again.";
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      setErrorMessage(errorMsg);
      alert(errorMsg);
      
      // Don't refresh on error - keep current state
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER BOOKINGS ================= */
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Confirmed": return "bg-blue-100 text-blue-800";
      case "Checked-in": return "bg-green-100 text-green-800";
      case "Checked-out": return "bg-gray-100 text-gray-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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
      alert("Payment added successfully!");
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
      alert(errorMsg);
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
    } catch (err) {
      console.error("❌ DELETE PAYMENT ERROR:", err.response?.data || err);
      alert("Failed to delete payment.");
    } finally {
      setPaymentLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading bookings...</p>
        </div>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Bookings Management</h1>
          <p className="text-gray-600 mt-1">Manage all hotel bookings and room assignments</p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{errorMessage}</p>
            <button onClick={() => setErrorMessage("")} className="ml-auto">
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by guest or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked-in">Checked-in</option>
                  <option value="checked-out">Checked-out</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Add Booking button removed */}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Active Guests</p>
            <p className="text-2xl font-bold text-gray-900">
              {bookings.filter(b => b.status === "Checked-in").length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Today's Check-ins</p>
            <p className="text-2xl font-bold text-gray-900">
              {(() => {
                const today = new Date().toISOString().slice(0, 10);
                return bookings.filter(b => b.check_in === today && b.status === "Confirmed").length;
              })()}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Available Rooms</p>
            <p className="text-2xl font-bold text-gray-900">
              {rooms.filter(r => r.status === "Available").length}
            </p>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Guest Details
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Room Details
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedBookings.length > 0 ? (
                  paginatedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{b.guest_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-600">{b.total_guest} guests</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-600">{b.childrens} children</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">Room {b.room_no}</p>
                          <p className="text-sm text-gray-600">{b.room_type}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{b.check_in}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{b.check_out}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(b.status)}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <select
                            value={b.status}
                            onChange={(e) => handleStatusChange(b, e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            <option value="Confirmed">Confirmed</option>
                            <option value="Checked-in">Checked-in</option>
                            <option value="Checked-out">Checked-out</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>

                          <button
                            onClick={() => openPaymentModal(b)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Payments"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              console.log("✏️ EDIT BOOKING 👉", b);
                              setEditing(b);
                              setForm({
                                room_ids: b.room_ids,
                                guest_name: b.guest_name,
                                total_guest: b.total_guest || 1,
                                childrens: b.childrens || 0,
                                check_in: b.check_in,
                                check_out: b.check_out,
                              });
                              setShowForm(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete button removed - bookings cannot be deleted */}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Calendar className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-gray-500">No bookings found</p>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="mt-2 text-orange-600 hover:text-orange-700 text-sm font-medium"
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
        {filteredBookings.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 font-medium order-2 sm:order-1">
              Showing <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredBookings.length)}</span> of <span className="font-bold text-gray-900">{filteredBookings.length}</span> records
            </p>
            
            <div className="flex items-center gap-1 order-1 sm:order-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-all ${
                  currentPage === 1 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600 active:scale-90'
                }`}
                title="First Page"
              >
                <ChevronsLeft className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-all mr-2 ${
                  currentPage === 1 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600 active:scale-90'
                }`}
                title="Previous Page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1 mx-2">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Show current page, one before, one after, and first/last if many pages
                  if (
                    totalPages <= 7 ||
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                          currentPage === pageNum
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-200 transform scale-105'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    (pageNum === 2 && currentPage > 4) ||
                    (pageNum === totalPages - 1 && currentPage < totalPages - 3)
                  ) {
                    return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-all ml-2 ${
                  currentPage === totalPages 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600 active:scale-90'
                }`}
                title="Next Page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-all ${
                  currentPage === totalPages 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600 active:scale-90'
                }`}
                title="Last Page"
              >
                <ChevronsRight className="w-5 h-5" />
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

              <div className="p-6 space-y-4">
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

                {/* Room Selection (Multi) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Home className="w-4 h-4 inline mr-2" />
                    Select Available Rooms (Multiple allowed)
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {availableRooms.map((r) => (
                      <label key={r.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.room_ids.includes(Number(r.id))}
                          onChange={(e) => {
                            const id = Number(r.id);
                            if (e.target.checked) {
                              setForm({ ...form, room_ids: [...form.room_ids, id] });
                            } else {
                              setForm({ ...form, room_ids: form.room_ids.filter(rid => rid !== id) });
                            }
                          }}
                          className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          ROOM {r.room_no} — {r.type}
                        </span>
                      </label>
                    ))}
                    {availableRooms.length === 0 && (
                      <p className="text-sm text-red-500 text-center py-2">No rooms available for these dates</p>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {form.room_ids.length} room(s) selected
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

              <div className="flex-1 overflow-y-auto p-6">
                
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
      </div>
    </div>
  );
}