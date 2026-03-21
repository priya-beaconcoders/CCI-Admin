import api from "./api";
import { getCache, setCache, clearCache, getPendingRequest, setPendingRequest } from "./cacheUtils";

export const getRooms = async (options = {}) => {
  const { forceRefresh = false } = options;
  const cacheKey = "rooms_all";

  if (!forceRefresh) {
    const cachedData = getCache(cacheKey);
    if (cachedData) return { data: cachedData };

    const pending = getPendingRequest(cacheKey);
    if (pending) return pending;
  }

  const promise = (async () => {
    try {
      const response = await api.get("/rooms");
      setCache(cacheKey, response.data);
      return response;
    } catch (error) {
      console.error("[CACHE ERROR] Failed to fetch rooms:", error);
      throw error;
    }
  })();

  setPendingRequest(cacheKey, promise);
  return promise;
};
export const getRoomById = (id) => api.get(`/rooms/${id}`);

export const createRoom = async (data) => {
  const res = await api.post("/rooms", data);
  clearCache("rooms_");
  return res;
};

// Try multiple methods for update — server may block PUT
export const updateRoom = async (id, data) => {
  try {
    // Try PATCH first
    const res = await api.patch(`/rooms/${id}`, data);
    clearCache("rooms_");
    return res;
  } catch (err1) {
    try {
      const res = await api.put(`/rooms/${id}`, data);
      clearCache("rooms_");
      return res;
    } catch (err2) {
      try {
        const res = await api.post(`/rooms/${id}`, { ...data, _method: "PUT" });
        clearCache("rooms_");
        return res;
      } catch (err3) {
        throw err1;
      }
    }
  }
};

export const deleteRoom = async (id) => {
  const res = await api.delete(`/rooms/${id}`);
  clearCache("rooms_");
  return res;
};