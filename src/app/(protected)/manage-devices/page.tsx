// app/(protected)/manage-devices/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
// Icons
import { Plus, Edit, Trash2, RefreshCw, ChevronLeft, ChevronRight, Loader2, Filter, Search, DownloadCloud } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Animation
import { motion, AnimatePresence } from 'framer-motion';

import apiClient from '@/lib/apiClient';
import { DeviceDTO,Device, ApiResponse } from '@/lib/types';
// Components
import AddEditDeviceModal from '@/components/management/AddEditDeviceModal'; // Đã cập nhật ở bước trước
import DeleteConfirmationModal from '@/components/management/DeleteConfirmationModal';

// --- Helper Functions ---
const getDefaultAdaCredentials = () => ({
  username: process.env.NEXT_PUBLIC_ADA_USERNAME || '',
  apiKey: process.env.NEXT_PUBLIC_ADA_API_KEY || '',
});

// Định nghĩa styles (Giữ nguyên)
const deviceTypeStyles: { [key: string]: { bgColor: string; textColor: string; icon: string } } = {
  'TEMP': { bgColor: 'bg-blue-100', textColor: 'text-blue-800', icon: '🌡️' },
  'HUMID': { bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', icon: '💧' },
  'LIGHT': { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', icon: '💡' },
  'MOTION': { bgColor: 'bg-orange-100', textColor: 'text-orange-800', icon: '👁️' },
  'DOOR': { bgColor: 'bg-teal-100', textColor: 'text-teal-800', icon: '🚪' },
  'FAN': { bgColor: 'bg-indigo-100', textColor: 'text-indigo-800', icon: '🌬️' },
  'default': { bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: '⚙️' },
};

const deviceStateStyles: { [key: string]: { bgColor: string; textColor: string; pulseClass: string; icon: string } } = {
  'ON': { bgColor: 'bg-green-100', textColor: 'text-green-800', pulseClass: 'animate-pulse', icon: '🟢' },
  'OFF': { bgColor: 'bg-red-100', textColor: 'text-red-800', pulseClass: '', icon: '🔴' },
  'default': { bgColor: 'bg-gray-100', textColor: 'text-gray-800', pulseClass: '', icon: '⚪' },
};


export default function ManageDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Lỗi fetch danh sách
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State cho Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  // const [filterType, setFilterType] = useState<string>(''); // <<< XÓA BỘ LỌC TYPE
  const [filterState, setFilterState] = useState<string>(''); // Giữ lại lọc state

  const { username: defaultAdaUsername, apiKey: defaultAdaApiKey } = getDefaultAdaCredentials();

  // --- Data Fetching ---
  const fetchDevices = useCallback(async (showToast = false) => {
    setIsLoading(true);
    setError(null); // Reset lỗi trước khi fetch
    console.log("Fetching devices...");
    try {
      const response = await apiClient.get<ApiResponse<Device[]>>('/devices');
      if (response.data?.data) {
        console.log("Devices fetched:", response.data.data.length);
        const fetchedDevices = response.data.data;
        setDevices(fetchedDevices);
        // Áp dụng bộ lọc hiện tại ngay sau khi fetch
        // <<< Bỏ filterType khỏi đây
        applyFiltersAndSearch(fetchedDevices, searchTerm, filterState);
        if (showToast) {
          toast.info("Device list refreshed!");
        }
      } else {
        console.warn("No data received from /devices endpoint");
        setDevices([]);
        setFilteredDevices([]);
      }
    } catch (err: unknown) {
      console.error('Error fetching devices:', err);
      // Cố gắng lấy lỗi cụ thể từ response backend nếu có
      const errorMessage = (err as { response?: { data?: { message?: string, errorMessage?: string } } })?.response?.data?.errorMessage
                         || (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                         || (err instanceof Error ? err.message : "Unknown error occurred.");
      setError(`Failed to load devices: ${errorMessage}`); // Hiển thị lỗi fetch
      setDevices([]);
      setFilteredDevices([]);
      // Không cần toast lỗi ở đây vì đã có component hiển thị lỗi `error` state
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  // <<< Bỏ filterType khỏi dependencies
  }, [searchTerm, filterState]); // Chỉ phụ thuộc vào search và state filter

  // Fetch data lần đầu
  useEffect(() => {
    fetchDevices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần khi mount

  // --- Filtering & Searching ---
  // <<< Bỏ tham số type
  const applyFiltersAndSearch = useCallback((baseDevices: Device[], search: string, state: string) => {
    console.log(`Applying filters: Search='${search}', State='${state}'`);
    let result = [...baseDevices];

    // Áp dụng tìm kiếm (ID, Feed, Username)
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(device =>
        device.id.toLowerCase().includes(searchLower) ||
        device.feed.toLowerCase().includes(searchLower) ||
        (device.adaUsername && device.adaUsername.toLowerCase().includes(searchLower))
      );
    }

    // <<< Bỏ logic lọc theo type
    // if (type) {
    //   result = result.filter(device => device.type === type);
    // }

    // Áp dụng lọc theo trạng thái
    if (state) {
      result = result.filter(device => device.state === state);
    }

    console.log("Filtered devices count:", result.length);
    setFilteredDevices(result);

    // Tính toán lại totalPages và reset trang nếu cần
    const newTotalPages = Math.max(1, Math.ceil(result.length / itemsPerPage));
    setTotalPages(newTotalPages);
    if (currentPage > newTotalPages) {
      setCurrentPage(1); // Reset về trang 1 nếu trang hiện tại không còn hợp lệ
    }
  // Phụ thuộc vào itemsPerPage và currentPage để tính toán lại đúng khi chúng thay đổi
  }, [itemsPerPage, currentPage]);

  // Chạy lại bộ lọc khi dữ liệu gốc hoặc các điều kiện lọc (search, state) thay đổi
  // <<< Bỏ filterType
  useEffect(() => {
    // Gọi applyFiltersAndSearch với các state hiện tại
    applyFiltersAndSearch(devices, searchTerm, filterState);
  }, [devices, searchTerm, filterState, applyFiltersAndSearch]); // Phụ thuộc vào các state lọc và hàm lọc

  // Chạy lại tính toán totalPages khi itemsPerPage hoặc số lượng filteredDevices thay đổi
  useEffect(() => {
      const newTotalPages = Math.max(1, Math.ceil(filteredDevices.length / itemsPerPage));
      setTotalPages(newTotalPages);
      // Đảm bảo trang hiện tại không vượt quá tổng số trang mới
      if (currentPage > newTotalPages) {
          setCurrentPage(newTotalPages); // Đặt về trang cuối cùng hợp lệ
      } else if (currentPage < 1 && newTotalPages >= 1) {
          setCurrentPage(1); // Đảm bảo không nhỏ hơn 1
      }
  }, [itemsPerPage, filteredDevices.length, currentPage]);

  // --- Event Handlers ---

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDevices(true); // Gọi fetch và hiển thị toast khi làm mới thủ công
  };

  // Handler xuất CSV (Giữ nguyên)
  const handleExportCSV = () => {
    if (filteredDevices.length === 0) {
      toast.warn("No devices to export.");
      return;
    }
    try {
        const headers = ['ID', 'Feed', 'Type', 'State', 'Username', 'API Key', 'Config']; // Thêm cột Config
        const csvData = filteredDevices.map(device => [
            `"${device.id}"`,
            `"${device.feed}"`,
            `"${device.type}"`,
            `"${device.state}"`,
            `"${device.adaUsername || ''}"`,
            `"${device.adaApikey || ''}"`,
            `"${JSON.stringify(device.deviceConfig || {}).replace(/"/g, '""')}"` // Stringify JSON và escape dấu nháy kép
        ]);
        const csvContent = [headers.join(';'), ...csvData.map(row => row.join(';'))].join('\n');
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `devices_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Exported devices data successfully!');
    } catch (err) {
        console.error('Export error:', err);
        toast.error('Failed to export devices data.');
    }
  };

  // Mở modal Add
  const handleAddClick = () => {
    setEditingDevice(null);
    setIsModalOpen(true);
  };

  // Mở modal Edit
  const handleEditClick = (device: Device) => {
    setEditingDevice(device);
    setIsModalOpen(true);
  };

  // Mở modal Delete
  const handleDeleteClick = (deviceId: string) => {
    setDeletingDeviceId(deviceId);
    setShowDeleteConfirm(true);
  };

  // Đóng modal Add/Edit
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDevice(null); // Reset editing state khi đóng
  };

  // Đóng modal Delete
  const handleDeleteModalClose = () => {
    setShowDeleteConfirm(false);
    setDeletingDeviceId(null);
  };

  // <<< HÀM NÀY THAY THẾ handleModalSubmit CŨ >>>
  // Được gọi từ AddEditDeviceModal khi thêm/sửa thành công
  const handleModalSuccess = useCallback(async (action: 'added' | 'updated') => {
    handleModalClose();
    await fetchDevices(false); // Tải lại danh sách thiết bị không cần toast từ fetchDevices
    toast.success(`Device ${action} successfully!`);
  }, [fetchDevices]); // Thêm fetchDevices vào dependency


  // <<< XÓA HÀM handleModalSubmit cũ ở đây >>>
  // const handleModalSubmit = async (deviceData: DeviceDTO) => { ... }

  // Xác nhận xóa (Giữ nguyên)
  const confirmDelete = async () => {
    if (!deletingDeviceId) return;
    setIsDeleting(true);
    try {
      const response = await apiClient.delete(`/devices/${deletingDeviceId}`);
      toast.success(response.data?.message || `Device deleted successfully!`);
      handleDeleteModalClose();
      await fetchDevices(); // Fetch lại danh sách sau khi xóa
    } catch (err: unknown) {
      console.error('Error deleting device:', err);
      const errorMessage = (err as { response?: { data?: { message?: string, errorMessage?: string } } })?.response?.data?.errorMessage
                         || (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                         || (err instanceof Error ? err.message : "Unknown error occurred.");
      toast.error(`Failed to delete device: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };
  const handleSaveDeviceSubmit = useCallback(async (deviceData: DeviceDTO, mode: 'add' | 'edit') => {
    // setIsSubmittingModal(true); // Bật loading cho modal (nếu AddEditDeviceModal không tự quản lý)
    // Hoặc AddEditDeviceModal tự quản lý isLoading của nó, bạn chỉ cần chờ Promise
    try {
      if (mode === 'add') {
        console.log("[ManageDevicesPage] Adding new device:", deviceData);
        await apiClient.post<ApiResponse<Device>>('/devices', deviceData);
        // Gọi handleModalSuccess sau khi API thành công
        await handleModalSuccess('added');
      } else if (mode === 'edit' && editingDevice?.id) {
        console.log(`[ManageDevicesPage] Updating device ${editingDevice.id}:`, deviceData);
        await apiClient.put<ApiResponse<Device | unknown>>(`/devices/${editingDevice.id}`, deviceData);
        // Gọi handleModalSuccess sau khi API thành công
        await handleModalSuccess('updated');
      } else {
        throw new Error("Invalid mode or missing device ID for edit.");
      }
      // Không cần toast ở đây vì handleModalSuccess đã làm
    } catch (err: unknown) {
      console.error(`[ManageDevicesPage] Error ${mode} device:`, err);
      // Xử lý lỗi và hiển thị toast (bạn có thể dùng lại logic error message đã có)
      const errorMessage = (err as { response?: { data?: { message?: string, errorMessage?: string, detail?: string } } })?.response?.data?.errorMessage
                         || (err as { response?: { data?: { message?: string, detail?: string } } })?.response?.data?.message
                         || (err as { response?: { data?: { message?: string, detail?: string } } })?.response?.data?.detail
                         || (err instanceof Error ? err.message : "Unknown error occurred during save.");
      toast.error(`Failed to ${mode} device: ${errorMessage}`);
      throw err; // Ném lại lỗi để AddEditDeviceModal có thể bắt và không tự đóng
    } finally {
      // setIsSubmittingModal(false); // Tắt loading cho modal
    }
  }, [editingDevice, handleModalSuccess]); // Thêm các dependencies cần thiết


  // Lấy danh sách thiết bị cho trang hiện tại (Giữ nguyên)
  const getCurrentDevices = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDevices.slice(startIndex, endIndex);
  };

  // Xử lý chuyển trang (Giữ nguyên)
  const handlePageChange = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
  };


  // --- Render Logic ---
  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <ToastContainer position="bottom-right" autoClose={4000} theme="colored" newestOnTop />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">
          Quản lý Thiết bị IoT
        </h1>
        <p className="text-gray-600 mt-2">Theo dõi và quản lý tất cả thiết bị IoT của bạn.</p>
      </motion.div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
          {/* Phần tìm kiếm và lọc */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto flex-wrap">
            {/* --- Search Input --- */}
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              <input
                type="text"
                placeholder="Tìm ID, Feed, Username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
              />
            </div>
            {/* --- Filter Dropdowns --- */}
            <div className="flex space-x-2 flex-wrap">
              {/* <<< XÓA Dropdown lọc theo Type ở đây >>> */}
              {/*
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                aria-label="Filter by device type"
              >
                <option value="">Tất cả loại</option>
                {Object.keys(deviceTypeStyles).filter(key => key !== 'default').map(typeKey => (
                  <option key={typeKey} value={typeKey}>{deviceTypeStyles[typeKey].icon} {typeKey}</option>
                ))}
              </select>
              */}

              {/* --- Dropdown lọc theo State (Giữ lại) --- */}
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                aria-label="Filter by device state"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ON">Hoạt động (ON)</option>
                <option value="OFF">Ngừng (OFF)</option>
              </select>
            </div>
          </div>

          {/* Các nút chức năng */}
          <div className="flex space-x-2 w-full md:w-auto justify-end flex-wrap">
             {/* Refresh Button */}
             <button
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50"
                disabled={isRefreshing || isLoading}
                aria-label="Refresh device list"
              >
                {isRefreshing ? <Loader2 size={18} className="mr-2 animate-spin" /> : <RefreshCw size={18} className="mr-2" />}
                Làm mới
              </button>
            {/* Export Button */}
             <button
                onClick={handleExportCSV}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                aria-label="Export devices to CSV"
              >
                <DownloadCloud size={18} className="mr-2" />
                Xuất CSV
              </button>
            {/* Add Button */}
            <button
              onClick={handleAddClick}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105"
              aria-label="Add new device"
            >
              <Plus size={18} className="mr-2" />
              Thêm thiết bị
            </button>
          </div>
        </div>
      </div>

      {/* Info Bar: Items count & Items per page */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 text-sm text-gray-600 space-y-2 sm:space-y-0">
        <span>
          Hiển thị {getCurrentDevices().length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredDevices.length)} trên tổng số {filteredDevices.length} thiết bị được lọc
        </span>
        <div className="flex items-center space-x-2">
          <span>Số mục/trang:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              // Không cần reset page ở đây vì useEffect [itemsPerPage, filteredDevices.length, currentPage] sẽ xử lý
            }}
            className="border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="Items per page"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !isRefreshing && (
         <div className="bg-white rounded-lg shadow-md p-8 flex flex-col items-center justify-center text-center h-64">
           <Loader2 size={40} className="text-indigo-600 animate-spin mb-4" />
           <p className="text-gray-600 text-lg font-medium">Đang tải danh sách thiết bị...</p>
           <p className="text-gray-500 text-sm">Vui lòng đợi trong giây lát.</p>
         </div>
      )}

      {/* Error State (for fetching list) */}
      {error && !isLoading && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-md mb-6"> {/* Thêm margin bottom */}
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-1.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm.707 4.707a1 1 0 01-1.414-1.414L9.586 11l-.293-.293a1 1 0 011.414-1.414l.293.293 1.293-1.293a1 1 0 111.414 1.414L11.414 11l.293.293a1 1 0 01-1.414 1.414l-.293-.293-1.293 1.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Lỗi tải dữ liệu</h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="break-words">{error}</p>
              </div>
               <button
                  onClick={() => fetchDevices(false)} // Nút thử lại gọi fetchDevices
                  className="mt-2 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Thử lại
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Table Container */}
      {!isLoading && !error && ( // Chỉ hiển thị bảng khi không loading và không có lỗi fetch list
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white overflow-hidden shadow-md rounded-lg"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feed</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence initial={false}>
                  {getCurrentDevices().length === 0 ? (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                      <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                           {/* Icon thay đổi tùy theo có filter hay không */}
                           {(searchTerm || filterState) ? <Filter size={40} className="text-gray-400 mb-3" /> : <Search size={40} className="text-gray-400 mb-3" />}
                          <p className="text-base font-medium">Không tìm thấy thiết bị nào</p>
                           {(searchTerm || filterState)
                              ? <p className="text-sm text-gray-400 mt-1">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                              : <p className="text-sm text-gray-400 mt-1">Hiện chưa có thiết bị nào. Hãy thêm thiết bị mới.</p>
                            }
                        </div>
                      </td>
                    </motion.tr>
                  ) : (
                    getCurrentDevices().map((device, index) => {
                      const typeStyle = deviceTypeStyles[device.type as keyof typeof deviceTypeStyles] || deviceTypeStyles.default;
                      const stateStyle = deviceStateStyles[device.state as keyof typeof deviceStateStyles] || deviceStateStyles.default;
                      return (
                        <motion.tr
                          key={device.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, transition: { duration: 0.2 } }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          {/* --- Table Cells --- */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 max-w-xs" title={device.id}><div className="truncate">{device.id}</div></td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{device.feed}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 inline-flex items-center text-xs leading-4 font-semibold rounded-full ${typeStyle.bgColor} ${typeStyle.textColor}`}>
                                <span className="mr-1.5">{typeStyle.icon}</span>
                                {device.type || 'N/A'}
                              </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`px-2.5 py-1 inline-flex items-center text-xs leading-4 font-semibold rounded-full ${stateStyle.bgColor} ${stateStyle.textColor} ${device.state === 'ON' ? stateStyle.pulseClass : ''}`}>
                                <span className="mr-1.5">{stateStyle.icon}</span>
                                {device.state || 'N/A'}
                              </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.adaUsername || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                  <button onClick={() => handleEditClick(device)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 hover:text-indigo-800 transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-400" aria-label={`Edit device ${device.feed}`}><Edit size={16} /></button>
                                  <button onClick={() => handleDeleteClick(device.id)} className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 hover:text-red-800 transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400" aria-label={`Delete device ${device.feed}`}><Trash2 size={16} /></button>
                              </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 bg-white">
              {/* Mobile Pagination */}
               <div className="flex-1 flex justify-between sm:hidden">
                 <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Trước</button>
                 <span className="text-sm text-gray-700">Trang {currentPage} / {totalPages}</span>
                 <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Sau</button>
               </div>
               {/* Desktop Pagination */}
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                   <p className="text-sm text-gray-700">
                      Hiển thị <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> đến{' '}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredDevices.length)}</span> của{' '}
                      <span className="font-medium">{filteredDevices.length}</span> thiết bị
                    </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}`} aria-label="Previous page"><ChevronLeft className="h-5 w-5" aria-hidden="true" /></button>
                    {/* Page Numbers Logic (Giữ nguyên) */}
                     {Array.from({ length: totalPages }).map((_, index) => {
                        const pageNumber = index + 1;
                        const isCurrent = pageNumber === currentPage;
                        const showPage = pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);
                        const showEllipsisBefore = pageNumber === currentPage - 2 && currentPage > 3;
                        const showEllipsisAfter = pageNumber === currentPage + 2 && currentPage < totalPages - 2;

                        if (showEllipsisBefore || showEllipsisAfter) {
                           return <span key={`ellipsis-${pageNumber}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                        }
                        if (showPage) {
                           return <button key={pageNumber} onClick={() => handlePageChange(pageNumber)} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${isCurrent ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`} aria-current={isCurrent ? 'page' : undefined}>{pageNumber}</button>;
                         }
                        return null;
                      })}
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${currentPage === totalPages ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}`} aria-label="Next page"><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )} {/* End Table Container */}


      {/* --- Modals --- */}
      {isModalOpen && ( // Render modal chỉ khi isModalOpen là true để đảm bảo useEffect trong modal chạy đúng lúc
         <AddEditDeviceModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          mode={editingDevice ? 'edit' : 'add'} // <<< Xác định mode dựa trên editingDevice
          initialData={editingDevice}
          onSave={handleSaveDeviceSubmit}   // <<< THAY ĐỔI Ở ĐÂY: Dùng onSave và truyền hàm mới
          // onDelete prop có thể vẫn giữ nguyên nếu bạn có chức năng xóa từ trong modal
          defaultAdaUsername={defaultAdaUsername}
          defaultAdaApiKey={defaultAdaApiKey}
        />
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={handleDeleteModalClose}
        onConfirm={confirmDelete}
        deviceName={devices.find(d => d.id === deletingDeviceId)?.feed || deletingDeviceId || 'this device'}
        isLoading={isDeleting}
      />

    </div> // End main container div
  );
}