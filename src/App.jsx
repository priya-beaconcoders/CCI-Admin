

// 📁 App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./screens/Login";
import Dashboard from "./screens/Dashboard";
import Bookings from "./screens/Booking";
import Masters from "./screens/Master";
import Reports from "./screens/Report";
import Staff from "./screens/Staff"; // New Staff screen
import Settings from "./screens/Settings"; // New Settings screen
import BookingDetail from "./screens/BookingDetail"; // New Booking Detail screen
import AdminLayout from "./layout/AdminLayout";

export default function App() {
  const isLoggedIn = true;

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}