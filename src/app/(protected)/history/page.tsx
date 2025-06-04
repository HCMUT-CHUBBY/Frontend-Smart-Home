// app/(protected)/history/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';
import { Device, DeviceLogDTO, PageDTO, ApiResponse } from '@/lib/types'; // Đảm bảo UserDTO được export từ types.ts
import ChartModalDevice from '@/components/dashboard/ChartModalDevice'; // Tái sử dụng modal chart
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ChevronLeft, ChevronRight, Filter,  BarChartHorizontalBig, Loader2,  LineChart } from 'lucide-react'; // Thêm icon

// Giả sử bạn có component DateRangePicker
// import DateRangePicker from '@/components/ui/DateRangePicker';

// --- Constants ---
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT = 'dateTime,desc'; // Mặc định mới nhất lên trước

interface HistoryFilters {
  startTime: string | null;
  endTime: string | null;
  page: number;
  size: number;
  sort: string;
  deviceIdFilter: string | null; // Lọc theo Device ID cụ thể trên bảng log tổng
}

export default function HistoryPage() {
  const { status } = useSession();
  const [logsData, setLogsData] = useState<PageDTO<DeviceLogDTO> | null>(null);
  const [devices, setDevices] = useState<Device[]>([]); // Để lấy tên feed cho Device ID
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<HistoryFilters>({
    startTime: null,
    endTime: null,
    page: 0,
    size: DEFAULT_PAGE_SIZE,
    sort: DEFAULT_SORT,
    deviceIdFilter: null,
  });

  // State cho Chart Modal
  const [selectedDeviceForChart, setSelectedDeviceForChart] = useState<Device | null>(null);
  const [selectedDeviceIdForChart, setSelectedDeviceIdForChart] = useState<string | null>(null);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

  // Fetch danh sách devices để có thể map deviceId với feed name (tùy chọn)
  const fetchDeviceList = useCallback(async () => {
    try {
      const response = await apiClient.get<ApiResponse<Device[]>>('/devices');
      if (response.data?.data) {
        setDevices(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch device list for history page:", err);
      // Không cần báo lỗi lớn ở đây, chỉ ảnh hưởng việc hiển thị tên feed
    }
  }, []);


  const fetchGlobalLogs = useCallback(async () => {
    if (status !== 'authenticated') return;
    setIsLoading(true);
    setError(null);
    console.log("Fetching global logs with filters:", filters);

    try {
      const params: Record<string, string | number | null> = {
        page: filters.page,
        size: filters.size,
        sort: filters.sort,
      };
      if (filters.startTime) params.startTime = filters.startTime;
      if (filters.endTime) params.endTime = filters.endTime;
      if (filters.deviceIdFilter) params.deviceId = filters.deviceIdFilter; // Backend dùng deviceId cho filter này

      // API endpoint là /api/v1/devices/logs
      const response = await apiClient.get<ApiResponse<PageDTO<DeviceLogDTO>>>('/devices/logs', { params });
      console.log("Global logs response:", response.data);
      if (response.data?.data) {
        setLogsData(response.data.data);
      } else {
        setLogsData(null);
        toast.info("No log data found for the current filters.");
      }
    } catch (err: unknown) {
      console.error("Error fetching global logs:", err);
      let errorMessage = "Failed to load logs.";
      if (typeof err === "object" && err !== null) {
        const errorObj = err as { response?: { data?: { message?: string; detail?: string } }; message?: string };
        errorMessage = errorObj.response?.data?.message || errorObj.response?.data?.detail || errorObj.message || errorMessage;
      }
      setError(errorMessage);
      setLogsData(null);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [status, filters]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchGlobalLogs();
      fetchDeviceList(); // Gọi để lấy danh sách device
    }
  }, [status, fetchGlobalLogs, fetchDeviceList]); // fetchGlobalLogs đã bao gồm filters

  const handleFilterChange = (
    filterName: keyof HistoryFilters,
    value: string | number | null
  ) => {
    setFilters(prev => ({ ...prev, [filterName]: value, page: 0 })); // Reset về trang 0 khi filter thay đổi
  };
  
  

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleOpenChartModal = (logEntry: DeviceLogDTO) => {
    const deviceDetail = devices.find(d => d.id === logEntry.deviceId);
    setSelectedDeviceForChart(deviceDetail || { id: logEntry.deviceId, feed: logEntry.deviceId } as Device); // Cung cấp fallback
    setSelectedDeviceIdForChart(logEntry.deviceId);
    setIsChartModalOpen(true);
  };

  const getDeviceFeed = (deviceId: string): string => {
  const device = devices.find(d => d.id === deviceId);
  return device?.feed || deviceId; // Nếu tìm thấy device và device.feed có giá trị, dùng nó. Nếu không, dùng deviceId.
};
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
        // Giả sử dateString là ISO 8601, ví dụ: "2025-06-04T05:00:08.129096Z"
        const date = new Date(dateString);
        // Format theo dd/MM/yyyy HH:mm:ss
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch {
        return dateString; // Trả về chuỗi gốc nếu không parse được
    }
  };


  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>;
  }
  if (status === 'unauthenticated') {
    // Nên có redirect hoặc thông báo rõ ràng hơn, ví dụ:
    // router.push('/auth/login'); return null;
    return <div className="text-center p-8">Please log in to view history.</div>;
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Device Activity Logs</h1>

      {/* --- Filter Section --- */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label htmlFor="deviceIdFilterInput" className="block text-sm font-medium text-gray-700 mb-1">Filter by Device ID</label>
          <input
            type="text"
            id="deviceIdFilterInput"
            placeholder="Enter Device ID..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={filters.deviceIdFilter || ''}
            onChange={(e) => handleFilterChange('deviceIdFilter', e.target.value || null)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
          {/* Thay thế bằng DateRangePicker component của bạn */}
          <div className="flex space-x-2">
            <input type="datetime-local" title="Start Time" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                   value={filters.startTime ? filters.startTime.substring(0, 16) : ''}
                   onChange={e => handleFilterChange('startTime', e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
            <input type="datetime-local" title="End Time" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                   value={filters.endTime ? filters.endTime.substring(0, 16) : ''}
                   onChange={e => handleFilterChange('endTime', e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">Sort By Time</label>
          <select
            id="sortOrder"
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="dateTime,desc">Newest First</option>
            <option value="dateTime,asc">Oldest First</option>
          </select>
        </div>
        <button 
            onClick={() => fetchGlobalLogs()} // Hoặc gọi tự động qua useEffect khi filter thay đổi
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 flex items-center justify-center"
            disabled={isLoading}
        >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Filter size={18} className="mr-2" />} Apply Filters
        </button>
      </div>


      {/* --- Logs Table --- */}
      {isLoading && !logsData && (
        <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      )}
      {error && (
        <div className="my-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded-md text-center">Error: {error}</div>
      )}
      {!isLoading && !error && logsData && logsData.content.length === 0 && (
        <div className="my-10 text-center text-gray-500">
          <BarChartHorizontalBig size={48} className="mx-auto mb-4 text-gray-400" />
          No logs found matching your criteria.
        </div>
      )}

      {logsData && logsData.content.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device Feed (ID)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logsData.content.map((log, index) => (
                <tr key={`${log.deviceId}-${log.dateTime}-${index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatDate(log.dateTime)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium" title={log.deviceId}>
        {log.deviceId} {/* Hiển thị trực tiếp ID đầy đủ của thiết bị từ log */}
      </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''} (${log.user.email})` : 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{log.value}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.state === 'ON' ? 'bg-green-100 text-green-800' : log.state === 'OFF' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {log.state || 'N/A'}
                     </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleOpenChartModal(log)}
                      className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-1 rounded-md transition-colors"
                      title={`View chart for ${getDeviceFeed(log.deviceId)}`}
                    >
                      <LineChart size={18} />
                    </button>
                    {/* Thêm nút xóa log nếu có API và quyền */}
                    {/* <button className="text-red-600 hover:text-red-800 ml-2"> <Trash2 size={18}/> </button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Pagination Controls --- */}
      {logsData && logsData.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page === 0 || isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <ChevronLeft size={16} className="mr-1" /> Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {filters.page + 1} of {logsData.totalPages} (Total: {logsData.totalElements} logs)
          </span>
          <button
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={filters.page >= logsData.totalPages - 1 || isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            Next <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      )}

      {/* Chart Modal */}
      {isChartModalOpen && selectedDeviceIdForChart && (
        <ChartModalDevice
          isOpen={isChartModalOpen}
          onClose={() => setIsChartModalOpen(false)}
          deviceId={selectedDeviceIdForChart}
          device={selectedDeviceForChart} // Truyền thông tin device nếu có
        />
      )}
    </div>
  );
}