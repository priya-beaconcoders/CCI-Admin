// // src/services/authServices.jsx
// import api from "../services/api";
// import { setAuth, clearAuth } from "../utils/authStorage";

// // 🔐 Login
// export const loginService = async (payload) => {
//   const res = await api.post("/login", payload);

  
//   console.log("🔐 FULL LOGIN RESPONSE 👉", res.data);
//   // assuming response: { token, user }
//   setAuth(res.data.token, res.data.user);

//   return res.data;
// };

// // 👤 Profile
// export const getProfileService = async () => {
//   const res = await api.get("/user");
//   return res.data;
// };

// // 🚪 Logout
// export const logoutService = async () => {
//   await api.post("/logout");
//   clearAuth();
// };
import api from "../services/api";
import { setAuth, clearAuth } from "../utils/authStorage";

// 🔐 Login
export const loginService = async (payload) => {
  const res = await api.post("/login", payload);



  // ✅ Laravel style response
  const token = res.data?.access_token;
  const user = res.data?.user;

  if (!token) {
    throw new Error("Token not received from server");
  }

  setAuth(token, user);
  return res.data;
};

// 👤 Profile
export const getProfileService = async () => {
  const res = await api.get("/user");
  return res.data;
};

// 🚪 Logout
export const logoutService = async () => {
  await api.post("/logout");
  clearAuth();
};
