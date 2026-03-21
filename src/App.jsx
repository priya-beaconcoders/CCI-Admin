// 📁 App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense, lazy } from "react";

// ✅ Eager load Dashboard to prevent layout shifts on initial load
import Dashboard from "./screens/Dashboard";

// ✅ Lazy load screens
const Login = lazy(() => import("./screens/Login"));
const Bookings = lazy(() => import("./screens/Booking"));
const Masters = lazy(() => import("./screens/Master"));
const Reports = lazy(() => import("./screens/Report"));
const Staff = lazy(() => import("./screens/Staff"));
const Settings = lazy(() => import("./screens/Settings"));
const BookingDetail = lazy(() => import("./screens/BookingDetail"));

// ⚠️ Keep layout normal (important)
import AdminLayout from "./layout/AdminLayout";

export default function App() {
  const isLoggedIn = true;

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Login />
            </Suspense>
          } 
        />

        <Route
          path="/"
          element={isLoggedIn ? <AdminLayout /> : <Navigate to="/login" />}
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bookings" element={<Suspense fallback={<div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}><Bookings /></Suspense>} />
          <Route path="bookings/:id" element={<Suspense fallback={<div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}><BookingDetail /></Suspense>} />
          <Route path="masters" element={<Suspense fallback={<div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}><Masters /></Suspense>} />
          <Route path="reports" element={<Suspense fallback={<div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}><Reports /></Suspense>} />
          <Route path="staff" element={<Suspense fallback={<div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}><Staff /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}><Settings /></Suspense>} />
          <Route index element={<Navigate to="/dashboard" />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
