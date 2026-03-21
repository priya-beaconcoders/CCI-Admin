import axios from "axios";

const api = axios.create({
  baseURL: "https://vediclok.org/cci_backend/public/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// 🔥 INTERCEPTOR (THIS IS THE KEY)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
