// app/(protected)/manage-devices/page.tsx
"use client";
import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';
// Icons: Thêm Loader2, Filter, Search, DownloadCloud
import { Plus, Edit, Trash2, RefreshCw, ChevronLeft, ChevronRight, Loader2, Filter, Search, DownloadCloud } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Animation
import { motion, AnimatePresence } from 'framer-motion';

import apiClient from '@/lib/apiClient';
import {
  DeviceFromAPI, // Kiểu dữ liệu gốc từ API
  Device,        // Kiểu dữ liệu đã xử lý (có type, isSensor)
  DeviceDTO,
  ApiResponse
} from '@/lib/types';
// Giả sử các component này nằm trong thư mục components/Management
import { processDeviceList, processDeviceData } from '@/lib/deviceUtils'; // Import hàm xử lý
import AddEditDeviceModal from '@/components/management/AddEditDeviceModal'; // <<< Sửa đường dẫn nếu cần
//import DeleteConfirmationModal from '@/components/ui/ConformModal'; 
import DeleteConfirmationModal from '@/components/management/DeleteConfirmationModal';

// --- Helper Functions ---
const getDefaultAdaCredentials = () => ({
  username: process.env.NEXT_PUBLIC_ADA_USERNAME || '',
  apiKey: process.env.NEXT_PUBLIC_ADA_API_KEY || '',
});

// Định nghĩa các loại thiết bị và trạng thái với các màu sắc tương ứng (Thêm icon và hỗ trợ nhiều loại hơn)
const deviceTypeStyles: { [key: string]: { bgColor: string; textColor: string; icon: string } } = {
  'TEMP': { bgColor: 'bg-blue-100', textColor: 'text-blue-800', icon: '🌡️' },
  
  'LIGHT': { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', icon: '💡' },
  
  'default': { bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: '⚙️' },
};

const deviceStateStyles: { [key: string]: { bgColor: string; textColor: string; pulseClass: string; icon: string } } = {
  'ON': { bgColor: 'bg-green-100', textColor: 'text-green-800', pulseClass: 'animate-pulse', icon: '🟢' }, // Icon sáng
  'OFF': { bgColor: 'bg-red-100', textColor: 'text-red-800', pulseClass: '', icon: '🔴' }, // Icon tối
  'default': { bgColor: 'bg-gray-100', textColor: 'text-gray-800', pulseClass: '', icon: '⚪' }, // Icon mặc định
};


export default function ManageDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State cho Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);


  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterState, setFilterState] = useState<string>('');

  const { username: defaultAdaUsername, apiKey: defaultAdaApiKey } = getDefaultAdaCredentials();

  
  const fetchDevices = useCallback(async (showToast = false) => { // Thêm tham số để kiểm soát toast khi refresh
    setIsLoading(true);
    setError(null);
    console.log("Fetching devices...");
    try {
      const response = await apiClient.get<ApiResponse<DeviceFromAPI[]>>('/devices');
        if (response.data?.data) {
            console.log("Raw devices fetched:", response.data.data);
            // <<< THÊM BƯỚC XỬ LÝ >>>
            const processedDevices: Device[] = processDeviceList(response.data.data);
            console.log("Processed devices data:", processedDevices);

            setDevices(processedDevices); // <<< Lưu dữ liệu ĐÃ XỬ LÝ
            // Apply filter dựa trên dữ liệu đã xử lý
        // Gọi hàm applyFiltersAndSearch ở đây để đảm bảo state devices đã cập nhật
        applyFiltersAndSearch(processedDevices, searchTerm, filterType, filterState);
        if (showToast) {
          toast.info("Device list refreshed!");
        }
      } else {
        console.warn("No data received from /devices endpoint");
        setDevices([]);
        setFilteredDevices([]);
        // Không cần apply filter nữa vì không có data
      }
    } catch (err: unknown) {
      console.error('Error fetching devices:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err instanceof Error ? err.message : "Unknown error occurred.");
      setError(`Failed to load devices: ${errorMessage}`);
      setDevices([]);
      setFilteredDevices([]);
      toast.error(`Failed to load devices: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false); // Luôn tắt cờ refresh ở đây
    }
  
  }, [searchTerm, filterType, filterState]); // Thêm dependencies cho useCallback

  // Fetch data lần đầu khi component mount
  useEffect(() => {
    fetchDevices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần

  // Áp dụng bộ lọc và tìm kiếm (Client-side)
  const applyFiltersAndSearch = useCallback((baseDevices: Device[], search: string, type: string, state: string) => {
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

    // Áp dụng lọc theo loại thiết bị
    if (type) {
      result = result.filter(device => device.type === type);
    }

    // Áp dụng lọc theo trạng thái
    if (state) {
      result = result.filter(device => device.state === state);
    }

    setFilteredDevices(result);
    setTotalPages(Math.max(1, Math.ceil(result.length / itemsPerPage)));
    // Chỉ reset về trang 1 nếu trang hiện tại lớn hơn tổng số trang mới
    if (currentPage > Math.max(1, Math.ceil(result.length / itemsPerPage))) {
        setCurrentPage(1);
    }
  }, [itemsPerPage, currentPage]); // Thêm currentPage vào dependencies

  // Chạy lại bộ lọc khi dữ liệu gốc hoặc các điều kiện lọc thay đổi
  useEffect(() => {
    applyFiltersAndSearch(devices, searchTerm, filterType, filterState);
  }, [devices, searchTerm, filterType, filterState, applyFiltersAndSearch]);

  // Chạy lại tính toán totalPages khi itemsPerPage thay đổi
  useEffect(() => {
      setTotalPages(Math.max(1, Math.ceil(filteredDevices.length / itemsPerPage)));
      // Đảm bảo trang hiện tại không vượt quá tổng số trang mới
      if (currentPage > Math.max(1, Math.ceil(filteredDevices.length / itemsPerPage))) {
          setCurrentPage(Math.max(1, Math.ceil(filteredDevices.length / itemsPerPage)));
      }
  }, [itemsPerPage, filteredDevices.length, currentPage]);

  // Xử lý refresh dữ liệu
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDevices(true); // Gọi fetch và hiển thị toast
  };

  // Xử lý xuất dữ liệu thành CSV
  const handleExportCSV = () => {
    if (filteredDevices.length === 0) {
      toast.warn("No devices to export.");
      return;
    }
    try {
      // Tạo header cho CSV
      const headers = ['ID', 'Feed', 'Type', 'State', 'Username', 'API Key']; // Thêm API Key nếu cần

      // Tạo dữ liệu CSV từ filteredDevices
      const csvData = filteredDevices.map(device => [
        `"${device.id}"`, // Bọc trong dấu nháy kép để xử lý ID có thể chứa ký tự đặc biệt
        `"${device.feed}"`,
        `"${device.type}"`,
        `"${device.state}"`,
        `"${device.adaUsername || ''}"`,
        `"${device.adaApikey || ''}"` // Thêm API Key
      ]);

      // Ghép header và dữ liệu
      // Sử dụng dấu chấm phẩy (;) làm dấu phân cách nếu Excel ở một số vùng gặp vấn đề với dấu phẩy (,)
      const csvContent = [headers.join(';'), ...csvData.map(row => row.join(';'))].join('\n');

      // Tạo blob và link tải xuống (thêm BOM để hỗ trợ UTF-8 tốt hơn trong Excel)
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `devices_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Giải phóng bộ nhớ

      toast.success('Exported devices data successfully!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export devices data.');
    }
  };

  // --- Event Handlers ---
  const handleAddClick = () => {
    setEditingDevice(null);
    setIsModalOpen(true);
  };

  const handleEditClick = useCallback(async (deviceInput: Device) => { // Nhận Device đã xử lý từ bảng
    console.log(`Opening edit modal for device: ${deviceInput.id}`);
    setIsLoading(true); // Có thể dùng loading riêng
    try {
        // Fetch lại dữ liệu mới nhất từ API (trả về DeviceFromAPI)
        const response = await apiClient.get<ApiResponse<DeviceFromAPI>>(`/devices/${deviceInput.id}`);
        console.log("<<< Response from GET /devices/{id} for Edit:", response.data);
        if (response.data?.data) {
            // <<< XỬ LÝ DỮ LIỆU API TRẢ VỀ >>>
            const processedDevice = processDeviceData(response.data.data);

            // Kiểm tra lại sau khi xử lý
            if (processedDevice.type === undefined || processedDevice.isSensor === undefined) {
                console.error(`Processed device ${processedDevice.id} is still missing 'type' or 'isSensor'! Check deviceUtils.`);
                toast.error("Failed to process device data for editing.");
                setIsLoading(false);
                return;
            }
            console.log("<<< Data being set to editingDevice:", processedDevice);
            setEditingDevice(processedDevice); // <<< Lưu Device ĐÃ XỬ LÝ vào state
            setIsModalOpen(true); // Mở modal sau khi đã có dữ liệu
        } else {
            toast.error("Could not load device details (no data).");
        }
    } catch (error: unknown) {
         console.error(`Error fetching details for ${deviceInput.id}:`, error);
         // ... xử lý lỗi toast ...
         if (axios.isAxiosError(error)) {
             toast.error(`Failed to load details: ${error.response?.data?.message || error.message}`);
         } else if (error instanceof Error) {
             toast.error(`Failed to load details: ${error.message}`);
         } else {
            toast.error("Failed to load details: Unknown error.");
        }
    } finally {
      setIsLoading(false);
    }
}, []); // Không cần dependencies nếu chỉ dựa vào deviceInput

  const handleDeleteClick = (deviceId: string) => {
    setDeletingDeviceId(deviceId);
    setShowDeleteConfirm(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDevice(null);
  };

  const handleDeleteModalClose = () => {
    setShowDeleteConfirm(false);
    setDeletingDeviceId(null);
  };

  const handleModalSubmit = useCallback(async (deviceData: DeviceDTO /* Bỏ mode đi nếu AddEditModal không truyền về */) => {
    // Xác định mode dựa trên state editingDevice
    const mode = editingDevice ? 'edit' : 'add'; // <<< Xác định mode ở đây
    

    console.log(`Saving device in mode: ${mode}`, deviceData);
    // setIsLoading(true); // Modal nên tự quản lý loading

    try {
        let response;
        let successMessage = "";

        if (mode === 'add') {
            response = await apiClient.post<ApiResponse<Device>>("/devices", deviceData);
            successMessage = response.data?.message || "Device added successfully!";
            toast.success(successMessage);
            handleModalClose(); // <<< Dùng hàm đóng modal của trang này
            await fetchDevices(); // <<< Tải lại danh sách
        } else if (mode === 'edit') {
             // <<< Dùng editingDevice thay vì selectedDevice >>>
             if (!editingDevice?.id) {
                  throw new Error("Cannot update device: No device selected or missing ID.");
             }

             // Chỉ lấy các trường được phép cập nhật từ deviceData (dữ liệu từ form)
             // <<< TẠO PUT PAYLOAD ĐÚNG >>>
            const putPayload: DeviceDTO = {
              // id: editingDevice.id, // Thường không cần id trong body PUT

              // Lấy từ form modal gửi về (deviceData)
              feed: deviceData.feed,
              adaUsername: deviceData.adaUsername,
              deviceConfig: deviceData.deviceConfig ?? {},
              adaApikey: deviceData.adaApikey, // Lấy từ form

              // Lấy từ state editingDevice gốc (ĐÃ ĐƯỢC XỬ LÝ)
              type: editingDevice.type,       // <<< Lấy từ editingDevice
              isSensor: editingDevice.isSensor, // <<< Lấy từ editingDevice
              state: editingDevice.state,     // <<< Lấy từ editingDevice
          };

          // Xử lý api key nếu form trống và backend yêu cầu NotBlank
          if (!putPayload.adaApikey && editingDevice.adaApikey) {
              // putPayload.adaApikey = editingDevice.adaApikey;
          }
           // Xóa ID nếu không cần trong body
           // delete putPayload.id;

          console.log("Payload for PUT:", JSON.stringify(putPayload, null, 2));
          const response = await apiClient.put<ApiResponse<unknown>>(`/devices/${editingDevice.id}`, putPayload);
          // ... xử lý success ...
          toast.success(response.data?.message || "Device updated successfully!");
          handleModalClose();
          await fetchDevices(); // Load lại
         } else {
             throw new Error("Invalid mode specified.");
         }
    } catch (err) { // Không cần kiểu 'any' hoặc 'unknown' tường minh ở đây
        console.error(`Error ${mode}ing device:`, err);
        let userErrorMessage = `Failed to ${mode} device.`;
        // Sử dụng type guard của axios
        if (axios.isAxiosError(err) && err.response) {
            const responseData = err.response?.data as { message?: string; detail?: string }; // Define a specific type for response data
            userErrorMessage = `${userErrorMessage} ${responseData?.message || responseData?.detail || err.message}`;
        } else if (err instanceof Error) {
            userErrorMessage = `${userErrorMessage} ${err.message}`;
        }
        toast.error(userErrorMessage);
        // Không cần ném lỗi lại ở đây vì không có logic nào bên ngoài cần bắt nó nữa
        // throw err;
    } finally {
       // setIsLoading(false); // Modal nên tự quản lý
    }
// Khai báo dependencies cho useCallback
}, [editingDevice, handleModalClose, fetchDevices]); // <<< Dependencies cần thiết


  // Xử lý xác nhận xóa
  const confirmDelete = async () => {
    if (!deletingDeviceId) return;

    setIsDeleting(true);
    try {
      const response = await apiClient.delete(`/devices/${deletingDeviceId}`);
      toast.success(response.data?.message || `Device deleted successfully!`);
      handleDeleteModalClose();
      // Thay vì fetch lại toàn bộ, có thể cập nhật state local nhanh hơn
      // setDevices(prev => prev.filter(d => d.id !== deletingDeviceId));
      // Tuy nhiên, fetch lại đảm bảo dữ liệu nhất quán nếu có thay đổi khác từ server
      await fetchDevices();
    } catch (err: unknown) {
      console.error('Error deleting device:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err instanceof Error ? err.message : "Unknown error occurred.");
      toast.error(`Failed to delete device: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Lấy danh sách thiết bị hiện tại để hiển thị dựa trên trang hiện tại
  const getCurrentDevices = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDevices.slice(startIndex, endIndex);
  };

  // Xử lý phân trang
  const handlePageChange = (page: number) => {
    // Đảm bảo trang nằm trong khoảng hợp lệ
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
  };


  // --- Render Logic ---
  return (
    // Gradient background và padding
    <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <ToastContainer position="bottom-right" autoClose={3000} theme="colored" newestOnTop />

      {/* Header with gradient text và animation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">
          Quản lý Thiết bị IoT
        </h1>
        <p className="text-gray-600 mt-2">Theo dõi và quản lý tất cả thiết bị IoT của bạn từ một nơi duy nhất.</p>
      </motion.div>

      {/* Action Bar: Thanh tìm kiếm, lọc, và các nút chức năng */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
          {/* Phần tìm kiếm và lọc */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto flex-wrap">
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
            {/* Dropdown lọc */}
            <div className="flex space-x-2 flex-wrap">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                aria-label="Filter by device type"
              >
                <option value="">Tất cả loại</option>
                {/* Lấy key từ deviceTypeStyles để tạo options */}
                {Object.keys(deviceTypeStyles).filter(key => key !== 'default').map(typeKey => (
                  <option key={typeKey} value={typeKey}>{deviceTypeStyles[typeKey].icon} {typeKey}</option>
                ))}
              </select>

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
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50"
              disabled={isRefreshing || isLoading} // Disable khi đang loading hoặc refresh
              aria-label="Refresh device list"
            >
              {isRefreshing ? <Loader2 size={18} className="mr-2 animate-spin" /> : <RefreshCw size={18} className="mr-2" />}
              Làm mới
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              aria-label="Export devices to CSV"
            >
              <DownloadCloud size={18} className="mr-2" />
              Xuất CSV
            </button>

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

      {/* Thông tin số lượng và items per page */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 text-sm text-gray-600 space-y-2 sm:space-y-0">
        <span>Hiển thị {getCurrentDevices().length} trên tổng số {filteredDevices.length} thiết bị được lọc</span>
        <div className="flex items-center space-x-2">
          <span>Số mục/trang:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset về trang đầu khi thay đổi số mục
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

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-md">
          <div className="flex">
            <div className="flex-shrink-0">
              {/* Icon Alert */}
              <svg className="h-6 w-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099a.75.75 0 01.942 0l6.25 5.5a.75.75 0 01-.017 1.113l-6.25 5.5a.75.75 0 01-1.114-.958L14.243 10 7.028 4.244a.75.75 0 011.114-.958zM10 18a8 8 0 100-16 8 8 0 000 16zm0-1.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Lỗi tải dữ liệu</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Device Table Container with smooth transition */}
      {!isLoading && !error && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white overflow-hidden shadow-md rounded-lg"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                {/* --- SỬA Ở ĐÂY: Viết <tr> ngay sau <thead> --- */}
        <thead className="bg-gray-50 sticky top-0 z-10"><tr>
            {/* Header Cells */}
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feed</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
        {/* --- SỬA Ở ĐÂY: Viết </thead> ngay sau </tr> --- */}
        </tr></thead>
        <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence initial={false}>
                  {getCurrentDevices().length === 0 ? (
                    // Display when no devices match filters/search
                    <motion.tr
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <Filter size={40} className="text-gray-400 mb-3" />
                          <p className="text-base font-medium">Không tìm thấy thiết bị nào</p>
                          <p className="text-sm text-gray-400 mt-1">Hãy thử điều chỉnh bộ lọc hoặc thêm thiết bị mới.</p>
                        </div>
                      </td>
                    </motion.tr>
                  ) : (
                    // Map through devices for the current page
                    getCurrentDevices().map((device:Device, index) => {
                      // Get styles based on type and state
                      const typeStyle = deviceTypeStyles[device.type as keyof typeof deviceTypeStyles] || deviceTypeStyles.default;
                      const stateStyle = deviceStateStyles[device.state as keyof typeof deviceStateStyles] || deviceStateStyles.default;
                      if (device.type === undefined || device.isSensor === undefined) {
                        return <tr key={device.id || index}><td colSpan={6}>Error loading device data.</td></tr>;
                    }
                      return (
                        // Animate each row
                        <motion.tr
                          key={device.id} // Important for AnimatePresence
                          layout // Enable layout animation
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, transition: { duration: 0.2 } }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          {/* ID Cell */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 max-w-xs" title={device.id}>
                            <div className="truncate">{device.id}</div>
                          </td>
                           {/* Feed Cell */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{device.feed}</td>
                           {/* Type Cell */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex items-center text-xs leading-4 font-semibold rounded-full ${typeStyle.bgColor} ${typeStyle.textColor} transition-all duration-200 ease-in-out`}>
                              <span className="mr-1.5">{typeStyle.icon}</span>
                              {device.type || 'N/A'}
                            </span>
                          </td>
                           {/* State Cell */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-2.5 py-1 inline-flex items-center text-xs leading-4 font-semibold rounded-full ${stateStyle.bgColor} ${stateStyle.textColor} ${device.state === 'ON' ? stateStyle.pulseClass : ''} transition-all duration-200 ease-in-out`}>
                              <span className="mr-1.5">{stateStyle.icon}</span>
                              {device.state || 'N/A'}
                            </span>
                          </td>
                          {/* Username Cell */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.adaUsername || '-'}</td>
                           {/* Actions Cell */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              {/* Edit Button */}
                              <button
                                onClick={() => handleEditClick(device)}
                                className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 hover:text-indigo-800 transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                aria-label={`Edit device ${device.feed}`}
                              >
                                <Edit size={16} />
                              </button>
                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteClick(device.id)}
                                className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 hover:text-red-800 transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400"
                                aria-label={`Delete device ${device.feed}`}
                              >
                                <Trash2 size={16} />
                              </button>
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

          {/* Pagination Controls - Chỉ hiển thị nếu có nhiều hơn 1 trang */}
          {totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 bg-white">
              {/* Mobile Pagination */}
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Trước
                </button>
                <span className="text-sm text-gray-700">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Sau
                </button>
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
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}`}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {/* Page Numbers Logic */}
                    {Array.from({ length: totalPages }).map((_, index) => {
                      const pageNumber = index + 1;
                      const isCurrent = pageNumber === currentPage;
                      // Logic to show only relevant page numbers (first, last, current, adjacent, ellipses)
                      const showPage = pageNumber === 1 ||
                                        pageNumber === totalPages ||
                                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);
                      const showEllipsisBefore = pageNumber === currentPage - 2 && currentPage > 3;
                      const showEllipsisAfter = pageNumber === currentPage + 2 && currentPage < totalPages - 2;

                      if (showEllipsisBefore || showEllipsisAfter) {
                        return (
                          <span key={`ellipsis-${pageNumber}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        );
                      }

                      if (showPage) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              isCurrent
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                            aria-current={isCurrent ? 'page' : undefined}
                          >
                            {pageNumber}
                          </button>
                        );
                      }
                      return null; // Don't render other page numbers
                    })}

                     {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${currentPage === totalPages ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}`}
                       aria-label="Next page"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )} {/* End Pagination */}
        </motion.div>
      )} {/* End Table Container */}


      {/* Modals Rendered Here */}
      <AddEditDeviceModal
     isOpen={isModalOpen}
     onClose={handleModalClose}
     mode={editingDevice ? 'edit' : 'add'} // <<< Xác định mode
     initialData={editingDevice}         // <<< Truyền initialData
     onSave={handleModalSubmit}          // <<< Đổi tên hàm này thành handleSaveDevice cho nhất quán?
     onDelete={handleDeleteClick}      // <<< Truyền hàm yêu cầu xóa
     defaultAdaUsername={defaultAdaUsername}
     defaultAdaApiKey={defaultAdaApiKey}
 />

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