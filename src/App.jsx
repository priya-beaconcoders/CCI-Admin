// 📁 App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense, lazy } from "react";

// ✅ Lazy load screens
const Login = lazy(() => import("./screens/Login"));
const Dashboard = lazy(() => import("./screens/Dashboard"));
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
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={isLoggedIn ? <AdminLayout /> : <Navigate to="/login" />}
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="bookings/:id" element={<BookingDetail />} />
            <Route path="masters" element={<Masters />} />
            <Route path="reports" element={<Reports />} />
            <Route path="staff" element={<Staff />} /> {/* New route */}
            <Route path="settings" element={<Settings />} /> {/* New route */}
            <Route index element={<Navigate to="/dashboard" />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
