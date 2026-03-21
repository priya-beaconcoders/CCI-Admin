
import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, differenceInDays } from 'date-fns';
import {
  DollarSign,
  CreditCard,
  Hotel,
  Percent,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Home,
  Users
} from "lucide-react";
import { Pagination } from "./UIComponents";

/* ================= COLLECTION REPORT ================= */
export function CollectionReport({ data = {}, dateRange, revenueTrends = [], loading }) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm p-12 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading collection report...</p>
        </div>
      </div>
    );
  }

  const collectionData = data || {};
  const totalRevenue = collectionData.total_collected || collectionData.total_revenue || collectionData.totalUsage || 0;
  
  let totalBookings = 0;
  try {
    const daysInRange = dateRange.startDate && dateRange.endDate ? 
      Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24)) + 1 : 30;
    const avgBookingsPerDay = 12;
    totalBookings = daysInRange * avgBookingsPerDay;
  } catch (err) {
    totalBookings = 0;
  }
  
  const occupancyRate = collectionData.occupancy_rate || collectionData.occupancyRate || 0;
  const averageDailyRate = collectionData.average_daily_rate || collectionData.averageDailyRate || 0;
  
  const revenueBySource = collectionData.revenue_by_source || collectionData.revenueBySource || 
    (collectionData.summary && Array.isArray(collectionData.summary) ? 
      collectionData.summary.map(item => ({
        source: item.payment_mode,
        amount: parseFloat(item.total_amount) || 0,
        transactions: parseInt(item.total_transactions) || 0
      })) : []);
  
  // Use revenueTrends as fallback for dailyRevenue if dailyRevenue is empty
  let dailyRevenue = collectionData.daily_revenue || collectionData.dailyRevenue || [];
  if (dailyRevenue.length === 0 && revenueTrends.length > 0) {
    // Map monthly trends to something renderable if daily is missing
    dailyRevenue = revenueTrends.map(t => ({
      date: t.month || t.date || new Date().toISOString(),
      revenue: t.revenue || 0
    }));
  }

  const totalRooms = 50;
  const totalDays = dateRange.startDate && dateRange.endDate ? 
    differenceInDays(new Date(dateRange.endDate), new Date(dateRange.startDate)) + 1 : 1;
  const revPAR = totalRooms > 0 && totalDays > 0 ?
    totalRevenue / (totalRooms * totalDays) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: <DollarSign className="w-5 h-5" />, color: "from-green-500 to-emerald-500" },
          { title: "Avg. Daily Rate", value: `₹${averageDailyRate.toLocaleString()}`, icon: <CreditCard className="w-5 h-5" />, color: "from-blue-500 to-cyan-500" },
          { title: "RevPAR", value: `₹${revPAR.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: <Hotel className="w-5 h-5" />, color: "from-purple-500 to-violet-500" },
          { title: "Occupancy Rate", value: `${occupancyRate}%`, icon: <Percent className="w-5 h-5" />, color: "from-orange-500 to-amber-500" }
        ].map((card, idx) => (
          <div key={idx} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`text-white bg-gradient-to-br ${card.color} p-2 rounded-lg`}>{card.icon}</div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
            <p className="text-sm text-gray-600">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-72 min-h-[280px]">
            {dailyRevenue && dailyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(v) => {
                      try { return format(new Date(v), 'MMM dd'); } catch(e) { return v; }
                    }} 
                  />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#FF9500" fill="#FF9500" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">No revenue data for this period</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Revenue by Source</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-72 min-h-[280px]">
            {revenueBySource && revenueBySource.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RechartsPieChart>
                  <Pie data={revenueBySource} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="amount" nameKey="source">
                    {revenueBySource.map((_, i) => <Cell key={i} fill={['#FF9500', '#34C759', '#5856D6', '#FF3B30'][i % 4]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Amount']} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                <PieChart className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">No source data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= DAILY SUMMARY ================= */
export function DailySummary({ data = {}, date, loading }) {
  if (loading) return null;
  const revenueByHour = data.revenue_by_hour || data.revenueByHour || [];
  const roomStatus = data.room_status || data.roomStatus || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Hourly Revenue</h3>
        <div className="h-72 min-h-[280px]">
          {revenueByHour && revenueByHour.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" fontSize={12} />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} fontSize={12} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#F97316" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">No hourly revenue data</p>
              </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Room Status</h3>
        <div className="h-48 min-h-[200px]">
          <ResponsiveContainer width="100%" height={180}>
            <RechartsPieChart>
              <Pie data={roomStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="count" nameKey="status">
                {roomStatus.map((e, i) => <Cell key={i} fill={e.color || ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'][i % 4]} />)}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ================= REVENUE TRENDS ================= */
export function RevenueTrends({ data = [], dateRange, loading }) {
  if (loading) return null;
  const trendsData = Array.isArray(data) ? data : [];
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-8">Revenue Analysis</h2>
      <div className="h-96 min-h-[350px]">
        {trendsData && trendsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={trendsData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, '']} />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
            <TrendingUp className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm">No trend data available for this range</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= OCCUPANCY REPORT ================= */
export function OccupancyReport({ data = [], dateRange, loading, currentPage: propsPage, onPageChange: propsOnChange }) {
  const [localPage, setLocalPage] = React.useState(1);
  const currentPage = propsPage || localPage;
  const onPageChange = (page) => {
    if (propsOnChange) propsOnChange(page + 1);
    else setLocalPage(page + 1);
  };

  if (loading) return null;
  const occupancyData = Array.isArray(data) ? data : [];
  const itemsPerPage = 10;
  const totalPages = Math.ceil(occupancyData.length / itemsPerPage);
  const currentData = occupancyData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="overflow-x-auto mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase">Room Type</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase">Occupancy Rate</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase">Revenue Estim.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-gray-900">{item.type || 'Unknown'}</td>
                <td className="py-4 px-6 font-bold">{item.occupancy_rate || 0}%</td>
                <td className="py-4 px-6 font-medium">₹{((item.occupied || 0) * 4500).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={currentPage - 1}
        totalPages={totalPages}
        totalItems={occupancyData.length}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        themeColor="purple"
      />
    </div>
  );
}

/* ================= BOOKING SUMMARY ================= */
export function BookingSummary({ data = [], loading }) {
  if (loading) return null;
  const bookingData = Array.isArray(data) ? data : [];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Booking Status</h3>
        <div className="h-64 min-h-[250px]">
          {bookingData && bookingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <RechartsPieChart>
                <Pie data={bookingData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" nameKey="status">
                  {bookingData.map((_, i) => <Cell key={i} fill={['#3b82f6', '#22c55e', '#64748b', '#ef4444'][i % 4]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
              <PieChart className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">No booking status data</p>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue by Status</h3>
        <div className="h-64 min-h-[250px]">
          {bookingData && bookingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={bookingData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="status" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">No status revenue data</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
