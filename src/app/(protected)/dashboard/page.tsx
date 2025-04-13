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
import styles from '@/styles/DashBoard.module.scss'; // CSS module cho dashboard
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
    // Đọc city từ .env.local hoặc dùng giá trị mặc định
    const city = process.env.NEXT_PUBLIC_WEATHER_CITY || "Ho Chi Minh City";

    if (!city) {
       console.warn("Weather city not configured correctly in .env.local (NEXT_PUBLIC_WEATHER_CITY)");
       return;
    }

    try {
       // Gọi hàm fetchWeather đã cập nhật với cityName
       const weatherData = await fetchWeather(city); // Chỉ cần truyền city
       setWeather(weatherData);
    } catch (error) {
       console.error('Error fetching weather:', error);
    }
}, []); // Bỏ dependency lat/lon nếu không dùng nữa

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

  // Bên trong component DashboardPage

const handleToggleDevice = async (device: Device) => { // Thêm async
  if (!session) {
    toast.warn("Authentication required."); // Thông báo nếu chưa đăng nhập
    return;
  }

  const currentState = realtimeStates[device.id]?.state ?? device.state; // Lấy state hiện tại (ưu tiên realtime)
  const newState = currentState === 'ON' ? 'OFF' : 'ON';

  // --- Bước 1: Cập nhật giao diện ngay lập tức (Optimistic Update) ---
  setRealtimeStates(prev => ({
    ...prev,
    [device.id]: { ...(prev[device.id] || {}), state: newState } // Cập nhật state mới
  }));

  // --- Bước 2: Chuẩn bị dữ liệu để gửi lên API ---
  // Lấy các trường cần thiết từ object 'device' và chỉ cập nhật 'state'
  // Đảm bảo object 'device' của bạn có đủ các trường này!
  const payload = {
    feed: device.feed,
    state: newState, // Trạng thái mới cần đặt
    adaUsername: device.adaUsername,
    adaApikey: device.adaApikey,
    deviceConfig: device.deviceConfig || {}, // Đảm bảo deviceConfig là object, ít nhất là rỗng
    // Thêm các trường khác nếu API PUT của bạn yêu cầu đầy đủ
    // type: device.type, // Bỏ 'type' nếu API không yêu cầu như ví dụ JSON của bạn
  };

  // --- Bước 3: Gọi API PUT ---
  try {
    console.log(`[API] Sending PUT to /devices/${device.id} with payload:`, payload);
    await apiClient.put(`/devices/${device.id}`, payload); // Thêm await

    // Nếu thành công, có thể hiện thông báo (không cần cập nhật lại state vì đã làm ở optimistic update)
    toast.success(`Device '${device.feed}' turned ${newState}`);

    // >>> TÙY CHỌN: Có nên giữ lại publish qua WebSocket không? <<<
    // Nếu backend của bạn *chỉ* cập nhật qua PUT và *không* tự động gửi thông báo WebSocket sau đó,
    // bạn có thể vẫn muốn publish qua WS ở đây để các client khác cập nhật UI ngay.
    // Nếu backend *đã* tự gửi WS sau khi PUT thành công, thì dòng publishToDevice ở đây là không cần thiết.
    // const command: DeviceCommand = { action: "set_state", value: newState };
    // publishToDevice(device.id, command); // Cân nhắc có cần dòng này không

  } catch (error: unknown) {
    console.error(`[API] Error toggling device ${device.id}:`, error);

    // Nếu gọi API thất bại, hiển thị lỗi
    if (error instanceof Error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || error.message;
      toast.error(`Failed to toggle device: ${errorMessage}`);
    } else {
      toast.error('Failed to toggle device: Unknown error occurred.');
    }

    // --- Bước 4: Khôi phục lại trạng thái UI (Rollback Optimistic Update) ---
    setRealtimeStates(prev => ({
      ...prev,
      [device.id]: { ...(prev[device.id] || {}), state: currentState } // Quay lại trạng thái ban đầu
    }));
  }
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
    <div className={styles.dashboardContainer}> {/* Container chính của trang */}
      <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />

      {/* Phần Widgets */}
      <div className={styles.widgetsGrid}> {/* Lưới widgets */}
         <div className={styles.widgetColSpan1}> {/* Ví dụ widget chiếm 1 cột */}
             <WeatherWidget weather={weather} /> {/* Cần style WeatherWidget.module.scss */}
         </div>
         {/* Thêm các widget khác nếu cần, ví dụ: */}
         {/* <div className={styles.widgetColSpan2}> // Widget chiếm 2 cột
             <YourOtherWidget />
         </div> */}
      </div>

      {/* Phần danh sách thiết bị */}
      <h2 className={styles.deviceListTitle}>Thiết bị của tôi</h2>

      {/* Lưới thiết bị hoặc thông báo khi không có thiết bị */}
      <div className={styles.deviceGrid}> {/* Lưới thiết bị */}
        {devices.length === 0 && !showAddDeviceModal && (
           <div className={styles.noDevices}> {/* Box thông báo */}
               <p>Bạn chưa có thiết bị nào.</p>
               {/* Áp class riêng cho nút để style */}
               <button
                  onClick={() => setShowAddDeviceModal(true)}
                  className={styles.addButton}
                >
                  Thêm thiết bị đầu tiên
               </button>
           </div>
        )}

        {devices.length > 0 &&
           devices.map((device) => (
              <DeviceCard
                 key={device.id}
                 device={device}
                 currentState={realtimeStates[device.id]?.state}
                 currentValue={realtimeStates[device.id]?.value}
                 onToggle={() => handleToggleDevice(device)}
                 onClick={() => handleDeviceClick(device)}
                 // Component DeviceCard cần import và sử dụng deviceCard.module.scss
              />
           ))}
      </div>

      {/* Modals (Giữ nguyên) */}
      <AddDeviceModal
         isOpen={showAddDeviceModal}
         onClose={() => setShowAddDeviceModal(false)}
         onSubmit={handleAddDevice}
         defaultAdaUsername={process.env.NEXT_PUBLIC_ADA_USERNAME || ''}
         defaultAdaApiKey={process.env.NEXT_PUBLIC_ADA_API_KEY || ''}
         // Component AddDeviceModal cần style riêng (ví dụ modal.module.scss)
      />

      <DeviceDetailsModal
         isOpen={!!selectedDevice}
         onClose={() => setSelectedDevice(null)}
         device={selectedDevice}
         // Component DeviceDetailsModal cần style riêng (ví dụ modal.module.scss)
      />
    </div>
  );
}