import api from "../services/api";

export const getBookings = () => api.get("/bookings");


export const getBookingById = (id) => api.get(`/bookings/${id}`);
export const createBooking = (data) => api.post("/bookings", data);
export const updateBooking = (id, data, options = {}) => api.post(`/bookings/${id}`, { ...data, _method: "PUT" }, options);

// Try multiple methods for delete — server may block DELETE
export const deleteBooking = async (id) => {
  try {
    // First, try to delete any associated payments (might be causing FK constraint)
    console.log("💳 Fetching payments for booking", id);
    const paymentsRes = await api.get(`/bookings/${id}/payments`);
    const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data?.data || []);
    
    console.log(`💰 Found ${payments.length} payments to delete first`);
    
    // Delete all payments first to avoid foreign key constraints
    for (const payment of payments) {
      console.log(`🗑️ Deleting payment ${payment.id}...`);
      await api.delete(`/payments/${payment.id}`);
    }
    
    // Now try to delete the booking
    console.log("🗑️ Now deleting booking...", id);
    return await api.delete(`/bookings/${id}`);
  } catch (err1) {
    console.warn("⚠️ DELETE failed, trying POST with _method...", err1.response?.status);
    try {
      // Some Laravel servers expect POST with _method for deletes
      return await api.post(`/bookings/${id}`, { _method: "DELETE" });
    } catch (err2) {
      console.warn("⚠️ POST with _method also failed...", err2.response?.status);
      // Throw the original error with more context
      throw err1;
    }
  }
};

export const checkIn = (id, options = {}) =>
  api.post(`/bookings/${id}/check-in`, undefined, options);

export const checkOut = (id, options = {}) =>
  api.post(`/bookings/${id}/check-out`, undefined, options);

export const getPayments = (bookingId) => api.get(`/bookings/${bookingId}/payments`);

export const addPayment = (bookingId, data) => api.post(`/bookings/${bookingId}/payments`, data);

export const deletePayment = (paymentId) => api.delete(`/payments/${paymentId}`);
