// 📁 services/reportServices.js
import api from "./api";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Collection Report - /api/reports/collections
 */
export const getCollectionReport = async (startDate, endDate) => {
  try {
    const response = await api.get("/reports/collections", {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });

    console.log("📊 Collection API Response:", response.data);
    return response;
  } catch (error) {
    console.error("❌ Collection API Error:", error);
    // Fallback to mock data if API fails
    return {
      data: getMockCollectionData(startDate, endDate)
    };
  }
};

/**
 * Daily Summary Report - /api/reports/daily
 */
export const getDailySummary = async (date) => {
  try {
    const response = await api.get("/reports/daily", {
      params: { date }
    });

    console.log("📅 Daily API Response:", response.data);
    return response;
  } catch (error) {
    console.error("❌ Daily API Error:", error);
    // Fallback to mock data
    return {
      data: getMockDailyData(date)
    };
  }
};

/**
 * Get Bookings by Date - /api/bookings (with date filter if supported)
 */
export const getBookingsByDate = async (date) => {
  try {
    // Try with date parameter first
    let response = await api.get("/bookings", {
      params: { date }
    });

    console.log("📅 Bookings by Date API Response (with date filter):", response.data);
    
    // If the API doesn't support date filtering, get all bookings and filter client-side
    if (!response.data?.data || response.data.data.length === 0) {
      console.log("🔄 No bookings with date filter, fetching all bookings...");
      response = await api.get("/bookings");
      console.log("📅 All Bookings API Response:", response.data);
      
      // Filter bookings by check-in date on client side
      if (response.data?.data) {
        const filteredBookings = response.data.data.filter(booking => {
          const bookingDate = booking.check_in_date || booking.check_in || booking.created_at;
          return bookingDate && bookingDate.includes(date);
        });
        console.log("🔍 FILTERED BOOKINGS FOR DATE", date, ":", filteredBookings);
        response.data.data = filteredBookings;
      }
    }

    return response;
  } catch (error) {
    console.error("❌ Bookings by Date API Error:", error);
    // Return empty array if API fails
    return {
      data: { data: [] }
    };
  }
};

/**
 * Revenue Trends Report
 */
export const getRevenueTrends = async (startDate, endDate) => {
  try {
    const response = await api.get("/reports/revenue-trends", {
      params: { start_date: startDate, end_date: endDate }
    });
    return response;
  } catch (error) {
    console.error("❌ Revenue Trends API Error:", error);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      data: months.map((month, index) => ({
        month,
        revenue: Math.floor(Math.random() * 500000) + 200000,
        bookings: Math.floor(Math.random() * 50) + 20,
        occupancy: Math.floor(Math.random() * 30) + 70,
        expenses: Math.floor(Math.random() * 150000) + 100000,
      }))
    };
  }
};

/**
 * Occupancy Report
 */
export const getOccupancyReport = async (startDate, endDate) => {
  try {
    const response = await api.get("/reports/occupancy", {
      params: { start_date: startDate, end_date: endDate }
    });
    return response;
  } catch (error) {
    console.error("❌ Occupancy API Error:", error);
    const roomTypes = ['Single Suite', 'Double Suite'];
    return {
      data: roomTypes.map((type, index) => ({
        type,
        total_rooms: Math.floor(Math.random() * 10) + 5,
        occupied: Math.floor(Math.random() * 8) + 1,
        available: Math.floor(Math.random() * 5) + 1,
        occupancy_rate: Math.floor(Math.random() * 30) + 70,
      }))
    };
  }
};

/**
 * Booking Summary Report
 */
export const getBookingSummary = async (startDate, endDate) => {
  try {
    const response = await api.get("/reports/bookings", {
      params: { start_date: startDate, end_date: endDate }
    });
    return response;
  } catch (error) {
    console.error("❌ Bookings API Error:", error);
    const statuses = ['Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'];
    return {
      data: statuses.map((status, index) => ({
        status,
        count: Math.floor(Math.random() * 30) + 10,
        revenue: Math.floor(Math.random() * 500000) + 100000,
      }))
    };
  }
};

/**
 * Export report in multiple formats with better error handling
 */
export const exportReport = async (reportType, filters, data = null) => {
  // Backwards compatibility
  return exportReportMultipleFormats(reportType, filters, data, 'excel');
};

/**
 * Multiple formats export
 */
export const exportReportMultipleFormats = async (reportType, filters, data, format = 'excel') => {
  try {
    console.log(`📤 Exporting ${reportType} report as ${format}`, filters);
    console.log("📤 Original data for export:", data);

    // If data not provided, fetch it
    if (!data) {
      switch (reportType) {
        case 'collection':
          const collectionRes = await getCollectionReport(filters.start_date, filters.end_date);
          data = collectionRes.data;
          break;
        case 'daily':
          const dailyRes = await getDailySummary(filters.date);
          data = dailyRes.data;
          break;
        case 'revenue':
          const trendsRes = await getRevenueTrends(filters.start_date, filters.end_date);
          data = trendsRes.data;
          break;
        case 'occupancy':
          const occupancyRes = await getOccupancyReport(filters.start_date, filters.end_date);
          data = occupancyRes.data;
          break;
        case 'bookings':
          const bookingsRes = await getBookingSummary(filters.start_date, filters.end_date);
          data = bookingsRes.data;
          break;
      }
    }

    // Normalize Data (Handle {data: ...} wrapper)
    const normalizedData = (data && data.data) ? data.data : data;
    console.log("📤 Normalized data for export:", normalizedData);

    // Validate data
    if (!normalizedData || Object.keys(normalizedData).length === 0) {
      // Try to see if data itself is the array (for list endpoints)
      if (!Array.isArray(data) && !Array.isArray(normalizedData)) {
        console.error("❌ No data available for export");
        throw new Error('No data available for export');
      }
    }

    // Final check on normalized data being useful
    const dataToUse = normalizedData || data;
    console.log("📤 Final data to use for export:", dataToUse);

    // Call appropriate export function based on format
    switch (format) {
      case 'excel':
        return await exportAsExcel(reportType, dataToUse, filters);
      case 'csv':
        return await exportAsCSV(reportType, dataToUse, filters);
      case 'pdf':
        return await exportAsPDF(reportType, dataToUse, filters);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

  } catch (error) {
    console.error('❌ Enhanced export error:', error);
    throw error;
  }
};

/**
 * Excel Export Implementation
 */
const exportAsExcel = async (reportType, data, filters) => {
  try {
    let exportData = [];
    let fileName = '';
    let sheetName = '';

    // Prepare data
    switch (reportType) {
      case 'collection':
        exportData = formatCollectionDataForExport(data);
        fileName = `collection_report_${filters.start_date}_to_${filters.end_date}.xlsx`;
        sheetName = 'Collection Report';
        break;
      case 'daily':
        exportData = formatDailyDataForExport(data);
        fileName = `daily_summary_${filters.date}.xlsx`;
        sheetName = 'Daily Summary';
        break;
      case 'revenue':
        exportData = formatRevenueDataForExport(data);
        fileName = `revenue_trends_${filters.start_date}_to_${filters.end_date}.xlsx`;
        sheetName = 'Revenue Trends';
        break;
      case 'occupancy':
        exportData = formatOccupancyDataForExport(data);
        fileName = `occupancy_report_${filters.start_date}_to_${filters.end_date}.xlsx`;
        sheetName = 'Occupancy Report';
        break;
      case 'bookings':
        exportData = formatBookingDataForExport(data);
        fileName = `booking_summary_${filters.start_date}_to_${filters.end_date}.xlsx`;
        sheetName = 'Booking Summary';
        break;
      default:
        exportData = [{ 'Message': 'No data available for export' }];
        fileName = `report_${new Date().getTime()}.xlsx`;
        sheetName = 'Report';
    }

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Adjust column widths
    const wscols = [];
    if (exportData.length > 0) {
      Object.keys(exportData[0]).forEach(key => {
        wscols.push({ wch: Math.max(key.length, 20) });
      });
      ws['!cols'] = wscols;
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate and download
    XLSX.writeFile(wb, fileName);

    return { success: true, message: `Report exported successfully: ${fileName}` };
  } catch (error) {
    throw new Error(`Excel Export failed: ${error.message}`);
  }
};

/**
 * CSV Export Implementation
 */
const exportAsCSV = async (reportType, data, filters) => {
  try {
    let exportData = [];
    let fileName = '';

    // Reuse the formatting logic from Excel
    switch (reportType) {
      case 'collection':
        exportData = formatCollectionDataForExport(data);
        fileName = `collection_report_${filters.start_date}_to_${filters.end_date}.csv`;
        break;
      case 'daily':
        exportData = formatDailyDataForExport(data);
        fileName = `daily_summary_${filters.date}.csv`;
        break;
      case 'revenue':
        exportData = formatRevenueDataForExport(data);
        fileName = `revenue_trends_${filters.start_date}_to_${filters.end_date}.csv`;
        break;
      case 'occupancy':
        exportData = formatOccupancyDataForExport(data);
        fileName = `occupancy_report_${filters.start_date}_to_${filters.end_date}.csv`;
        break;
      case 'bookings':
        exportData = formatBookingDataForExport(data);
        fileName = `booking_summary_${filters.start_date}_to_${filters.end_date}.csv`;
        break;
      default:
        throw new Error('Unknown report type');
    }

    if (!exportData || exportData.length === 0) {
      throw new Error('No data to export');
    }

    // Convert to CSV
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, message: 'CSV exported successfully' };

  } catch (error) {
    throw new Error(`CSV Export failed: ${error.message}`);
  }
};

/**
 * PDF Export Implementation
 */
const exportAsPDF = async (reportType, data, filters) => {
  try {
    const doc = new jsPDF();
    let title = '';
    let exportData = [];
    let fileName = '';

    // Prepare data
    switch (reportType) {
      case 'collection':
        exportData = formatCollectionDataForExport(data);
        title = 'Collection Report';
        fileName = `collection_report_${filters.start_date}_to_${filters.end_date}.pdf`;
        break;
      case 'daily':
        exportData = formatDailyDataForExport(data);
        title = `Daily Summary (${filters.date})`;
        fileName = `daily_summary_${filters.date}.pdf`;
        break;
      case 'revenue':
        exportData = formatRevenueDataForExport(data);
        title = 'Revenue Trends';
        fileName = `revenue_trends_${filters.start_date}_to_${filters.end_date}.pdf`;
        break;
      case 'occupancy':
        exportData = formatOccupancyDataForExport(data);
        title = 'Occupancy Report';
        fileName = `occupancy_report_${filters.start_date}_to_${filters.end_date}.pdf`;
        break;
      case 'bookings':
        exportData = formatBookingDataForExport(data);
        title = 'Booking Summary';
        fileName = `booking_summary_${filters.start_date}_to_${filters.end_date}.pdf`;
        break;
    }

    // Add Title
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    const subtitle = filters.date ? `Date: ${filters.date}` : `Period: ${filters.start_date} to ${filters.end_date}`;
    doc.text(subtitle, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

    // Create Table
    if (exportData.length > 0) {
      const columns = Object.keys(exportData[0]).map(key => ({ header: key, dataKey: key }));

      autoTable(doc, {
        head: [Object.keys(exportData[0])],
        body: exportData.map(obj => Object.values(obj)),
        startY: 44,
        theme: 'grid',
        headStyles: { fillColor: [255, 149, 0] }, // Orange-ish to match theme
        styles: { fontSize: 9, cellPadding: 3 },
      });
    } else {
      doc.text('No data available.', 14, 50);
    }

    // Save
    doc.save(fileName);
    return { success: true, message: 'PDF exported successfully' };

  } catch (error) {
    console.error("PDF Export Error: ", error);
    throw new Error(`PDF Export failed: ${error.message}`);
  }
};

// --- Helper Functions for Data Formatting ---

const formatCollectionDataForExport = (data) => {
  // Check for different data structures
  const summary = data.summary || data.daily_revenue || data.dailyRevenue || (Array.isArray(data) ? data : []);

  if (!summary || !Array.isArray(summary) || summary.length === 0) {
    console.log("🔍 COLLECTION DATA FOR EXPORT:", data);
    return [];
  }

  return summary.map(item => ({
    'Payment Mode': item.payment_mode || 'N/A',
    'Total Amount': item.total_amount || 0,
    'Transactions': item.total_transactions || 0
  }));
};

const formatDailyDataForExport = (data) => {
  const revenueByHour = data.revenue_by_hour || data.revenueByHour || [];
  const bookings = data.bookings || [];

  if ((!revenueByHour || revenueByHour.length === 0) && (!bookings || bookings.length === 0)) {
    console.log("🔍 DAILY DATA FOR EXPORT:", data);
    return [{
      'Date': data.date || new Date().toISOString().split('T')[0],
      'Total Bookings': data.summary?.total_bookings || data.total_bookings || 0,
      'Total Revenue': data.summary?.total_revenue || data.total_revenue || 0,
      'Cancelled Bookings': data.summary?.cancelled_bookings || data.cancelled_bookings || 0,
      'Total Paid': data.summary?.total_paid || data.total_paid || 0,
      'Balance Amount': data.summary?.balance_amt || data.balance_amt || 0
    }];
  }

  // If we have hourly revenue data
  if (revenueByHour.length > 0) {
    return revenueByHour.map(item => ({
      'Hour': item.hour || 'N/A',
      'Revenue': item.revenue || 0,
      'Bookings': item.bookings || 0
    }));
  }

  // If we have bookings data
  if (bookings.length > 0) {
    return bookings.map(item => ({
      'Booking ID': item.id || 'N/A',
      'Guest Name': item.guest_name || 'N/A',
      'Room': item.room_no || 'N/A',
      'Status': item.status || 'N/A',
      'Amount': item.total_amt || 0
    }));
  }

  return [];
};

const formatRevenueDataForExport = (data) => {
  const items = Array.isArray(data) ? data : [];
  return items.map(item => ({
    'Month': item.month || 'N/A',
    'Revenue': item.revenue || 0,
    'Bookings': item.bookings || 0,
    'Occupancy (%)': item.occupancy || 0,
    'Expenses': item.expenses || 0
  }));
};

const formatOccupancyDataForExport = (data) => {
  const items = Array.isArray(data) ? data : [];
  return items.map(item => ({
    'Room Type': item.type || 'N/A',
    'Total Rooms': item.total_rooms || 0,
    'Occupied': item.occupied || 0,
    'Available': item.available || 0,
    'Occupancy (%)': item.occupancy_rate || 0
  }));
};

const formatBookingDataForExport = (data) => {
  const items = Array.isArray(data) ? data : [];
  return items.map(item => ({
    'Status': item.status || 'N/A',
    'Count': item.count || 0,
    'Revenue': item.revenue || 0
  }));
};

/**
 * Get all reports at once
 */
export const getAllReports = async (filters) => {
  try {
    const [collection, daily, revenue, occupancy, bookings] = await Promise.all([
      getCollectionReport(filters.startDate, filters.endDate),
      getDailySummary(filters.date || new Date().toISOString().split('T')[0]),
      getRevenueTrends(filters.startDate, filters.endDate),
      getOccupancyReport(filters.startDate, filters.endDate),
      getBookingSummary(filters.startDate, filters.endDate)
    ]);

    return {
      collection: collection.data,
      daily: daily.data,
      revenue: revenue.data,
      occupancy: occupancy.data,
      bookings: bookings.data
    };

  } catch (error) {
    console.error('❌ GetAllReports error:', error);
    throw error;
  }
};

// Mock Data Generators (Restored)
const getMockCollectionData = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const dailyRevenue = [];
  let totalRevenue = 0;
  for (let i = 0; i < Math.min(daysDiff, 30); i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const revenue = Math.floor(Math.random() * 100000) + 20000;
    totalRevenue += revenue;
    dailyRevenue.push({
      date: date.toISOString().split('T')[0],
      revenue: revenue,
      bookings: Math.floor(Math.random() * 15) + 5,
      avg_rate: Math.floor(Math.random() * 2000) + 3500,
      occupancy: Math.floor(Math.random() * 30) + 70
    });
  }
  return {
    total_revenue: totalRevenue,
    total_bookings: Math.floor(Math.random() * 100) + 50,
    occupancy_rate: Math.floor(Math.random() * 30) + 70,
    average_daily_rate: Math.floor(Math.random() * 2000) + 3500,
    revenue_by_source: [
      { source: "Room Rent", amount: Math.floor(totalRevenue * 0.68), percentage: 68 },
      { source: "Food & Beverage", amount: Math.floor(totalRevenue * 0.20), percentage: 20 },
      { source: "Other Services", amount: Math.floor(totalRevenue * 0.12), percentage: 12 },
    ],
    daily_revenue: dailyRevenue
  };
};

const getMockDailyData = (date) => {
  return {
    date: date,
    total_revenue: Math.floor(Math.random() * 200000) + 50000,
    total_bookings: Math.floor(Math.random() * 30) + 10,
    check_ins: Math.floor(Math.random() * 15) + 5,
    check_outs: Math.floor(Math.random() * 10) + 3,
    occupancy_rate: Math.floor(Math.random() * 30) + 70,
    revenue_by_hour: [
      { hour: "00-04", revenue: Math.floor(Math.random() * 10000) + 2000 },
      { hour: "04-08", revenue: Math.floor(Math.random() * 15000) + 3000 },
      { hour: "08-12", revenue: Math.floor(Math.random() * 25000) + 5000 },
      { hour: "12-16", revenue: Math.floor(Math.random() * 30000) + 8000 },
      { hour: "16-20", revenue: Math.floor(Math.random() * 35000) + 10000 },
      { hour: "20-24", revenue: Math.floor(Math.random() * 20000) + 7000 },
    ],
    room_status: [
      { status: "Occupied", count: Math.floor(Math.random() * 20) + 10, color: "#FF9500" },
      { status: "Available", count: Math.floor(Math.random() * 15) + 5, color: "#34C759" },
      { status: "Maintenance", count: Math.floor(Math.random() * 5) + 1, color: "#FF3B30" },
      { status: "Cleaning", count: Math.floor(Math.random() * 4) + 1, color: "#5856D6" },
    ]
  };
};