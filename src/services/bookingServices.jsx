import api from "../services/api";
import { getCache, setCache, clearCache, getPendingRequest, setPendingRequest } from "./cacheUtils";

export const getBookings = async (options = {}) => {
  const { forceRefresh = false } = options;
  const cacheKey = "bookings_all";

  if (!forceRefresh) {
    const cachedData = getCache(cacheKey);
    if (cachedData) return { data: cachedData };

    const pending = getPendingRequest(cacheKey);
    if (pending) return pending;
  }

  const promise = (async () => {
    try {
      const response = await api.get("/bookings");
      // Only cache successful responses (usually axios throws on 4xx/5xx)
      setCache(cacheKey, response.data);
      return response;
    } catch (error) {
      console.error("[CACHE ERROR] Failed to fetch bookings:", error);
      throw error;
    }
  })();

  setPendingRequest(cacheKey, promise);
  return promise;
};


export const getBookingById = (id) => api.get(`/bookings/${id}`);

export const createBooking = async (data) => {
  const res = await api.post("/bookings", data);
  clearCache("bookings_");
  return res;
};

export const updateBooking = async (id, data, options = {}) => {
  const res = await api.post(`/bookings/${id}`, { ...data, _method: "PUT" }, options);
  clearCache("bookings_");
  return res;
};

// Try multiple methods for delete — server may block DELETE
export const deleteBooking = async (id) => {
  try {
    // First, try to delete any associated payments (might be causing FK constraint)

    const paymentsRes = await api.get(`/bookings/${id}/payments`);
    const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data?.data || []);
    

    
    // Delete all payments first to avoid foreign key constraints
    for (const payment of payments) {

      await api.delete(`/payments/${payment.id}`);
    }
    
    // Now try to delete the booking
    const res = await api.delete(`/bookings/${id}`);
    clearCache("bookings_");
    return res;
  } catch (err1) {
    try {
      // Some Laravel servers expect POST with _method for deletes
      const res = await api.post(`/bookings/${id}`, { _method: "DELETE" });
      clearCache("bookings_");
      return res;
    } catch (err2) {
      // Throw the original error with more context
      throw err1;
    }
  }
};

export const checkIn = async (id, options = {}) => {
  const res = await api.post(`/bookings/${id}/check-in`, undefined, options);
  clearCache("bookings_");
  return res;
};

export const checkOut = async (id, options = {}) => {
  const res = await api.post(`/bookings/${id}/check-out`, undefined, options);
  clearCache("bookings_");
  return res;
};

export const getPayments = (bookingId) => api.get(`/bookings/${bookingId}/payments`);

export const addPayment = async (bookingId, data) => {
  const res = await api.post(`/bookings/${bookingId}/payments`, data);
  clearCache("bookings_");
  return res;
};

export const deletePayment = async (paymentId) => {
  const res = await api.delete(`/payments/${paymentId}`);
  clearCache("bookings_");
  return res;
};
