import api from "./api";
import { getCache, setCache, clearCache, getPendingRequest, setPendingRequest } from "./cacheUtils";

export const getMembers = async (options = {}) => {
  const { forceRefresh = false } = options;
  const cacheKey = "members_all";

  if (!forceRefresh) {
    const cachedData = getCache(cacheKey);
    if (cachedData) return { data: cachedData };

    const pending = getPendingRequest(cacheKey);
    if (pending) return pending;
  }

  const promise = (async () => {
    try {
      const response = await api.get("/members");
      setCache(cacheKey, response.data);
      return response;
    } catch (error) {
      console.error("[CACHE ERROR] Failed to fetch members:", error);
      throw error;
    }
  })();

  setPendingRequest(cacheKey, promise);
  return promise;
};
export const getMemberById = (id) => api.get(`/members/${id}`);

export const createMember = async (data) => {
  const res = await api.post("/members", data);
  clearCache("members_");
  return res;
};

export const updateMember = async (id, data) => {
  const res = await api.put(`/members/${id}`, data);
  clearCache("members_");
  return res;
};

export const deleteMember = async (id) => {
  const res = await api.delete(`/members/${id}`);
  clearCache("members_");
  return res;
};

export const lookupMember = (membershipNo) => api.get(`/members/lookup/${membershipNo}`);