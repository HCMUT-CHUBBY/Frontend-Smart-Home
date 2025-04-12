// app/(protected)/dashboard/page.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { StompSubscription } from '@stomp/stompjs';

import apiClient, { fetchWeather } from '@/lib/apiClient';
import {
  Device,
  DeviceDTO,
  ApiResponse,
  CustomSession,
  WeatherInfo,
  DeviceSubscriptions,
  DeviceRealtimeState,
  DeviceCommand,
} from '@/lib/types';
import {
  connectWebSocket,
  subscribeToDevice,
  publishToDevice,
  unsubscribeFromDevice,
  disconnectWebSocket,
} from '@/lib/websocket';

import DeviceCard from '@/components/dashboard/DeviceCard';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import AddDeviceModal from '@/components/dashboard/AddDeviceModal';
import DeviceDetailsModal from '@/components/dashboard/DeviceDetailModal';
import { toast, ToastContainer } from 'react-toastify'; // Ví dụ dùng react-toastify
import 'react-toastify/dist/ReactToastify.css';

// Cài đặt: npm install react-toastify

export default function DashboardPage() {
  const { data: session, status } = useSession() as { data: CustomSession | null; status: 'loading' | 'authenticated' | 'unauthenticated' };
  const router = useRouter();

  const [devices, setDevices] = useState<Device[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [realtimeStates, setRealtimeStates] = useState<DeviceRealtimeState>({});

  // Dùng useRef để lưu subscriptions mà không làm re-render khi thay đổi
  const subscriptionsRef = useRef<DeviceSubscriptions>({});

  // --- Fetching Data ---

  const loadDevices = useCallback(async () => {
    if (status !== 'authenticated') return;
    setIsLoading(true);
    try {
      const response = await apiClient.get<ApiResponse<Device[]>>('/devices');
      if (response.data && response.data.data) {
        setDevices(response.data.data);
        if (response.data.data.length === 0) {
          // Không có thiết bị nào, hiện modal thêm mới
          setShowAddDeviceModal(true);
        } else {
           // Khởi tạo trạng thái realtime ban đầu từ dữ liệu fetch
           const initialStates: DeviceRealtimeState = {};
           response.data.data.forEach(dev => {
               initialStates[dev.id] = { state: dev.state };
           });
           setRealtimeStates(initialStates);
        }
      } else {
        setDevices([]); // Đặt là mảng rỗng nếu API trả về cấu trúc không mong đợi
      }
    } catch (error: unknown) {
      console.error('Error fetching devices:', error);
      if (error instanceof Error) {
        const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || error.message;
        toast.error(`Failed to load devices: ${errorMessage}`);
      } else {
        toast.error('Failed to load devices: Unknown error occurred.');
      }
      setDevices([]); // Đặt là mảng rỗng khi có lỗi
    } finally {
      setIsLoading(false);
    }
  }, [status]); // Chỉ phụ thuộc vào status

    const loadWeather = useCallback(async () => {
    // Đọc lat/lon từ .env.local
    const latString = process.env.NEXT_PUBLIC_WEATHER_LATITUDE;
    const lonString = process.env.NEXT_PUBLIC_WEATHER_LONGITUDE;
    const city = process.env.NEXT_PUBLIC_WEATHER_CITY || "Ho Chi Minh City";

    // Chuyển đổi sang số, kiểm tra tính hợp lệ
    const lat = latString ? parseFloat(latString) : NaN;
    const lon = lonString ? parseFloat(lonString) : NaN;

    if (isNaN(lat) || isNaN(lon)) {
         console.warn("Weather latitude/longitude not configured correctly in .env.local");
         return;
    }

    try {
      // Gọi hàm fetchWeather đã cập nhật
      const weatherData = await fetchWeather(lat, lon, city);
      setWeather(weatherData);
    } catch (error) {
      console.error('Error fetching weather:', error);
      // Cân nhắc hiển thị lỗi cho người dùng nếu cần
    }
  }, []); 

  // --- WebSocket Handling ---

  const handleWebSocketMessage = useCallback((deviceId: string, messageBody: string) => {
    console.log(`[WS] Received message for ${deviceId}:`, messageBody);
    try {
        // Backend trả về giá trị cuối cùng từ Adafruit qua @SendTo khi subscribe
        // Và có thể trả về object JSON khi có cập nhật trạng thái thực sự?
        // -> Cần xác định rõ định dạng message từ WebSocket để xử lý chính xác
        let newState: "ON" | "OFF" | undefined = undefined;
        let newValue: string | number | undefined = undefined;

        // Cố gắng parse JSON trước
        try {
            const parsedData = JSON.parse(messageBody);
            if (parsedData && typeof parsedData === 'object') {
                if (parsedData.state && (parsedData.state === "ON" || parsedData.state === "OFF")) {
                   newState = parsedData.state;
                }
                // Xử lý thêm các trường khác nếu có (ví dụ: value cho sensor)
                if (parsedData.value !== undefined) {
                    newValue = parsedData.value;
                }
            }
        } catch {
            // Nếu không phải JSON, giả sử nó là trạng thái ON/OFF hoặc giá trị sensor đơn giản
            if (messageBody === "ON" || messageBody === "OFF") {
                newState = messageBody;
            } else {
                 // Có thể là giá trị sensor (số hoặc chuỗi)
                 newValue = isNaN(Number(messageBody)) ? messageBody : Number(messageBody);
            }
        }

        // Cập nhật state
        setRealtimeStates(prevStates => ({
            ...prevStates,
            [deviceId]: {
                ...prevStates[deviceId], // Giữ lại state cũ nếu có
                ...(newState !== undefined && { state: newState }), // Cập nhật state nếu có
                ...(newValue !== undefined && { value: newValue }), // Cập nhật value nếu có
            }
        }));

    } catch (error) {
        console.error(`[WS] Error processing message for ${deviceId}:`, error);
    }
  }, []); // Không có dependency ngoài

  const setupWebSocket = useCallback(() => {
    if (status === 'authenticated' && session?.user?.accessToken && devices && devices.length > 0) {
        console.log("[WS] Attempting to connect...");
        connectWebSocket(
            session.user.accessToken,
            () => { // onConnected
                console.log("[WS] Connection successful. Subscribing to devices...");
                toast.info("Connected to real-time server.");
                devices.forEach(device => {
                    // Hủy subscription cũ nếu tồn tại trước khi subscribe lại
                    if (subscriptionsRef.current[device.id]) {
                        unsubscribeFromDevice(subscriptionsRef.current[device.id]);
                        console.log(`[WS] Unsubscribed from old ${device.id}`);
                    }
                    const subscription = subscribeToDevice(
                        device.id,
                        (messageBody) => handleWebSocketMessage(device.id, messageBody)
                    );
                    // Lưu subscription mới vào ref
                     subscriptionsRef.current = { ...subscriptionsRef.current, [device.id]: subscription };
                     if(subscription) {
                         console.log(`[WS] Successfully subscribed to ${device.id}`);
                     } else {
                          console.error(`[WS] Failed to subscribe to ${device.id}`);
                     }
                });
            },
            (error) => { // onError
                console.error("[WS] Connection error:", error);
                toast.error(`Real-time connection error: ${error}`);
                // Logic retry đã có trong lib/websocket.ts
            }
        ).catch(err => {
             console.error("[WS] Failed to initiate connection:", err);
             toast.error("Could not initiate real-time connection.");
        });

    } else {
        console.log("[WS] Skipping connection: Not authenticated, no token, or no devices.");
    }
  }, [status, session, devices, handleWebSocketMessage]); // Phụ thuộc vào các yếu tố này

  // --- Effects ---

  useEffect(() => {
    // Load dữ liệu ban đầu
    loadDevices();
    loadWeather();
  }, [loadDevices, loadWeather]); // Chạy một lần khi component mount

  useEffect(() => {
    // Thiết lập WebSocket SAU KHI có danh sách devices
    if (devices) { // Chỉ setup khi devices đã được load (không phải null)
        setupWebSocket();
    }

    // Cleanup function: Ngắt kết nối và hủy subscriptions khi component unmount hoặc dependencies thay đổi
    return () => {
      console.log("[WS] Cleaning up WebSocket connections...");
      Object.values(subscriptionsRef.current).forEach(sub => {
        unsubscribeFromDevice(sub);
      });
      subscriptionsRef.current = {}; // Reset ref
      disconnectWebSocket();
      console.log("[WS] Cleanup complete.");
    };
  }, [devices, setupWebSocket]); // Chạy lại effect này khi `devices` hoặc `setupWebSocket` thay đổi


  // --- Event Handlers ---

  const handleAddDevice = async (newDeviceData: DeviceDTO) => {
    if (!session) return;
    // Thêm isSensor=true nếu backend yêu cầu cho POST
    const dataToSend = { ...newDeviceData, isSensor: true, deviceConfig: {} };
    console.log("Adding device:", dataToSend);
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/devices', dataToSend);
      toast.success(response.data.message || 'Device added successfully!');
      setShowAddDeviceModal(false);
      await loadDevices(); // Tải lại danh sách thiết bị
      // WebSocket sẽ tự động được thiết lập lại trong useEffect khi `devices` thay đổi
    } catch (error: unknown) {
      console.error('Error adding device:', error);
      if (error instanceof Error) {
        toast.error(`Failed to add device: ${(error as { response?: { data?: { message?: string } } })?.response?.data?.message || error.message}`);
      } else {
        toast.error('Failed to add device: Unknown error occurred.');
      }
    }
  };

  const handleToggleDevice = (device: Device) => {
    if (!session) return;

    const currentState = realtimeStates[device.id]?.state ?? device.state; // Lấy state mới nhất
    const newState = currentState === 'ON' ? 'OFF' : 'ON';

    // Dùng WebSocket để gửi lệnh (như trong lib/websocket.ts)
    const command: DeviceCommand = {
        action: "set_state", // Backend cần xử lý action này
        value: newState
    };
    console.log(`[WS] Publishing to ${device.id}:`, command);
    publishToDevice(device.id, command);

    // Cập nhật trạng thái UI ngay lập tức (Optimistic Update)
    // WebSocket message đến sẽ ghi đè lại nếu có khác biệt
    setRealtimeStates(prev => ({
        ...prev,
        [device.id]: { ...prev[device.id], state: newState }
    }));

    // === HOẶC: Dùng REST API PUT (ít real-time hơn) ===
    /*
    const updatedDeviceData: Partial<DeviceDTO> = {
      state: newState,
      // Giữ nguyên các trường khác nếu PUT yêu cầu gửi lại toàn bộ DTO
      feed: device.feed,
      type: device.type,
      adaUsername: device.adaUsername,
      adaApikey: device.adaApikey,
      deviceConfig: device.deviceConfig
    };
    apiClient.put(`/devices/${device.id}`, updatedDeviceData)
      .then(response => {
        toast.success(`Device ${device.feed} turned ${newState}`);
        // Cập nhật state từ response hoặc giữ optimistic update
         setRealtimeStates(prev => ({
            ...prev,
            [device.id]: { ...prev[device.id], state: newState }
        }));
      })
      .catch(error => {
        console.error(`Error toggling device ${device.id}:`, error);
        toast.error(`Failed to toggle device: ${error.response?.data?.message || error.message}`);
        // Rollback optimistic update nếu cần
        setRealtimeStates(prev => ({
            ...prev,
            [device.id]: { ...prev[device.id], state: currentState } // Khôi phục state cũ
        }));
      });
    */
  };

  const handleDeviceClick = (device: Device) => {
    // Lấy thông tin chi tiết nhất (có thể fetch lại hoặc dùng data hiện có)
    // Ví dụ: fetch lại để đảm bảo data mới nhất
    apiClient.get<ApiResponse<Device>>(`/devices/${device.id}`)
        .then(response => {
             if(response.data?.data){
                // Kết hợp state realtime vào dữ liệu chi tiết trước khi mở modal
                 const detailedDevice = {
                     ...response.data.data,
                     state: realtimeStates[device.id]?.state ?? response.data.data.state // Ưu tiên state realtime
                 };
                setSelectedDevice(detailedDevice);
             } else {
                 toast.error("Could not load device details.");
             }
        })
        .catch(error => {
            console.error(`Error fetching details for ${device.id}:`, error);
            toast.error(`Failed to load details: ${error.response?.data?.message || error.message}`);
        });
    // Hoặc đơn giản là hiển thị data đã có:
    // setSelectedDevice({ ...device, state: realtimeStates[device.id]?.state ?? device.state });
  };

  // --- Render Logic ---

  if (status === 'loading' || isLoading) {
    return (
        <div className="flex justify-center items-center h-full">
             <div className="text-xl text-gray-500">Loading Dashboard...</div>
             {/* Hoặc Spinner */}
        </div>
    );
  }

  if (!devices) {
     return (
        <div className="flex justify-center items-center h-full">
             <div className="text-xl text-red-500">Failed to load device data.</div>
        </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-6">
        <ToastContainer position="bottom-right" autoClose={3000} />

        {/* Phần trên: Thời tiết và Widget khác (nếu có) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-1">
                 <WeatherWidget weather={weather} />
            </div>
             {/* Placeholder cho widget nhạc hoặc widget khác */}
            {/* <div className="md:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-2 dark:text-white">Music Player (Placeholder)</h2>
                 Thêm nội dung widget nhạc ở đây nếu có
            </div> */}
        </div>

        {/* Phần dưới: Danh sách thiết bị */}
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">My Devices</h2>
        {devices.length === 0 && !showAddDeviceModal && (
             <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
                 <p className="mb-4 text-gray-500 dark:text-gray-400">You don't have any devices yet.</p>
                 <button
                    onClick={() => setShowAddDeviceModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                    Add Your First Device
                </button>
            </div>
        )}

        {devices.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((device) => (
                    <DeviceCard
                        key={device.id}
                        device={device}
                        // Truyền state và value từ realtimeStates
                        currentState={realtimeStates[device.id]?.state}
                        currentValue={realtimeStates[device.id]?.value}
                        onToggle={() => handleToggleDevice(device)}
                        onClick={() => handleDeviceClick(device)}
                    />
                ))}
            </div>
        )}

        {/* Modals */}
        <AddDeviceModal
            isOpen={showAddDeviceModal}
            onClose={() => setShowAddDeviceModal(false)}
            onSubmit={handleAddDevice}
            defaultAdaUsername="thanghoia" // Giá trị mặc định bạn cung cấp
            defaultAdaApiKey="aio_mLzM390pWwA0pNytdAJXFRFk8uA" // Giá trị mặc định bạn cung cấp
        />

        <DeviceDetailsModal
            isOpen={!!selectedDevice}
            onClose={() => setSelectedDevice(null)}
            device={selectedDevice}
        />
    </div>
  );
}