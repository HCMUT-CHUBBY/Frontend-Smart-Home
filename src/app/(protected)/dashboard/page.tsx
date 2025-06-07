// app/(protected)/dashboard/page.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

import axios from "axios";
import YouTube, { YouTubePlayer, YouTubeProps } from "react-youtube";
import {
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";

import ChartModalDevice from "@/components/dashboard/ChartModalDevice"; // <<< THÊM: Import Modal Chart mới
import apiClient, { fetchWeather } from "@/lib/apiClient";
import {
  // <<< SỬA: Import cả DeviceFromAPI và Device >>>
  
  Device, // Đây là kiểu dữ liệu ĐÃ ĐƯỢC XỬ LÝ (có type, isSensor)
  DeviceDTO,
  ApiResponse,
  CustomSession,
  WeatherInfo,
  DeviceSubscriptions,
  DeviceRealtimeState,
  DeviceCommand,
} from "@/lib/types";
import {
  connectWebSocket,
  subscribeToDevice,
  publishToDevice,
  unsubscribeFromDevice,
  disconnectWebSocket,
} from "@/lib/websocket";

import DeviceCard from "@/components/dashboard/DeviceCard";
import WeatherWidget from "@/components/dashboard/WeatherWidget";
import AddEditDeviceModal from "@/components/management/AddEditDeviceModal"; // Giả sử file này ở dashboard
import ConfirmationModal from "@/components/ui/ConformModal";
import { toast, ToastContainer } from "react-toastify"; // Ví dụ dùng react-toastify
import "react-toastify/dist/ReactToastify.css";
import styles from "@/styles/DashBoard.module.scss"; // CSS module cho dashboard
// Cài đặt: npm install react-toastify

export default function DashboardPage() {
  const { data: session, status } = useSession() as {
    data: CustomSession | null;
    status: "loading" | "authenticated" | "unauthenticated";
  };

  // --- State ---
  // <<< State devices giờ lưu kiểu Device (dữ liệu gốc từ API) >>>
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // <<< State selectedDevice giờ lưu kiểu Device (dữ liệu gốc từ API) >>>
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [realtimeStates, setRealtimeStates] = useState<DeviceRealtimeState>({});
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [chartDeviceId, setChartDeviceId] = useState<string | null>(null);

   // --- Refs (giữ nguyên) ---
   const clickLockRef = useRef<{ [deviceId: string]: boolean }>({});
   const subscriptionsRef = useRef<DeviceSubscriptions>({});
   const isWebSocketConnectingRef = useRef(false);
   const firstConnectRef = useRef(false);
   const realtimeStatesRef = useRef(realtimeStates); // Ref cho realtimeStates
   useEffect(() => {
    realtimeStatesRef.current = realtimeStates;
  }, [realtimeStates]);

  const handleShowChart = useCallback((deviceId: string) => {
    console.log(`Opening chart for device: ${deviceId}`);
    setChartDeviceId(deviceId);
    setShowChartModal(true);
  }, []); // Dependency rỗng

  const loadDevices = useCallback(async () => {
    if (status !== "authenticated") return;
    setIsLoading(true);
    console.log("Fetching devices...");
    try {
      // <<< SỬA: API trả về Device[] trực tiếp >>>
      const response = await apiClient.get<ApiResponse<Device[]>>("/devices");
      console.log("API Response (/devices):", response.data);
      if (response.data && response.data.data) {
        const apiDevices = response.data.data;
        console.log("Devices data from API:", apiDevices);

        setDevices(apiDevices); // <<< Lưu dữ liệu GỐC TỪ API vào state

        const initialStates: DeviceRealtimeState = {};
        const currentRealtimeStates = realtimeStatesRef.current;
        apiDevices.forEach((dev) => {
          initialStates[dev.id] = { state: currentRealtimeStates[dev.id]?.state ?? dev.state };
        });
        setRealtimeStates(initialStates);
      } else {
        setDevices([]);
        setRealtimeStates({});
      }
    } catch (error: unknown) {
      console.error("Error fetching devices:", error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        toast.error(`Failed to load devices: ${errorMessage}`);
      } else if (error instanceof Error) {
        toast.error(`Failed to load devices: ${error.message}`);
      } else {
        toast.error("Failed to load devices: Unknown error occurred.");
      }
      setDevices([]);
      setRealtimeStates({});
    } finally {
      setIsLoading(false);
    }
  }, [status]);
  const loadWeather = useCallback(async () => {
    const city = process.env.NEXT_PUBLIC_WEATHER_CITY || "Ho Chi Minh City";

    if (!city) {
      console.warn(
        "Weather city not configured correctly in .env.local (NEXT_PUBLIC_WEATHER_CITY)"
      );
      return;
    }

    try {
      const weatherData = await fetchWeather(city);
      setWeather(weatherData);
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  }, []);

  // Thêm hàm này vào trong component DashboardPage
  // const handleModalSuccess = async () => {
  //   console.log("Add/Edit Modal reported success!");
  //   setShowAddDeviceModal(false); // Đóng modal thêm mới
  //   // Nếu bạn dùng chung state cho modal edit thì có thể cần handler đóng chung
  //   // handleCloseModal();
  //   await loadDevices(); // Tải lại danh sách devices
  //   // toast.success("Device saved successfully!"); // Có thể thêm toast nếu muốn
  // };

 // app/(protected)/dashboard/page.tsx

// app/(protected)/dashboard/page.tsx

// app/(protected)/dashboard/page.tsx

const handleWebSocketMessage = useCallback(
  (deviceId: string, messageBody: string) => {
    console.log(`[WS] Received message for ${deviceId}: "${messageBody}"`); // Log message thô

    let stateToSet: "ON" | "OFF" | undefined = undefined;
    let valueToSet: string | number | undefined = undefined;
    let isErrorFromServer = false; // Cờ để biết message có phải là lỗi từ server không

    if (messageBody.startsWith("Error:")) {
      console.error(`[WS] Explicit Backend Error for ${deviceId}: ${messageBody}`);
      isErrorFromServer = true;
      // toast.error(`Device Error: ${messageBody.substring(0, 70)}...`); // Hiển thị một phần lỗi
      // Khi là lỗi, chúng ta có thể muốn hiển thị lỗi đó hoặc reset giá trị
      valueToSet = messageBody; // Ví dụ: hiển thị lỗi này ở vị trí giá trị
      stateToSet = undefined; // Hoặc có thể set một state 'ERROR' nếu có
    } else {
      // 1. Cố gắng parse message như một JSON object hoàn chỉnh
      let jsonParsed = false;
      try {
        const parsedData = JSON.parse(messageBody);
        jsonParsed = true; // Đánh dấu đã parse thành công (dù kết quả có thể không phải object)

        if (typeof parsedData === 'object' && parsedData !== null) {
          // Server trả về dạng {"state": "ON", "value": 32}
          if (parsedData.state === "ON" || parsedData.state === "OFF") {
            stateToSet = parsedData.state;
          }
          if (parsedData.value !== undefined) {
            if (typeof parsedData.value === 'number' && !isNaN(parsedData.value)) {
              valueToSet = parsedData.value;
            } else if (typeof parsedData.value === 'string' && !isNaN(Number(parsedData.value))) {
              valueToSet = Number(parsedData.value);
            } else {
              valueToSet = String(parsedData.value); // Giữ là string nếu không phải số rõ ràng
            }
          }
        } else if (typeof parsedData === 'number' && !isNaN(parsedData)) {
          // Server trả về dạng số thuần túy sau khi parse JSON (ví dụ, messageBody là "32")
          valueToSet = parsedData;
        } else if (typeof parsedData === 'string') {
          // Server trả về dạng string thuần túy sau khi parse JSON (ví dụ, messageBody là "\"ON\"" hoặc "\"MyValue\"")
          if (parsedData === "ON" || parsedData === "OFF") {
            stateToSet = parsedData;
          } else if (!isNaN(Number(parsedData))) {
            valueToSet = Number(parsedData);
          } else {
            valueToSet = parsedData; // Là một string value khác
          }
        }
        // Nếu sau khi parse JSON mà stateToSet và valueToSet vẫn undefined,
        // nhưng parsedData lại là một string (ví dụ, messageBody là "\"some text\"")
        // thì đó có thể là một value dạng string.
        if (stateToSet === undefined && valueToSet === undefined && typeof parsedData === 'string') {
           valueToSet = parsedData;
        }

      } catch  {
        // JSON.parse thất bại -> messageBody không phải là JSON hợp lệ.
        jsonParsed = false; // Đảm bảo cờ này đúng
      }

      // 2. Nếu không parse được JSON hoặc parse JSON mà không ra state/value cụ thể,
      //    thì xử lý messageBody như text thuần.
      if (!jsonParsed || (stateToSet === undefined && valueToSet === undefined && !isErrorFromServer)) {
        if (messageBody === "ON" || messageBody === "OFF") {
          stateToSet = messageBody;
        } else if (!isNaN(Number(messageBody))) { // Kiểm tra messageBody có phải là chuỗi số không (ví dụ "32")
          valueToSet = Number(messageBody);
        } else {
          // Không phải ON/OFF, không phải số -> coi là một value dạng string không xác định
          // Hoặc có thể là một thông báo text từ server mà không phải lỗi
          console.warn(`[WS] Message for ${deviceId} is not standard state/value/JSON. Treating as string value: "${messageBody}"`);
          valueToSet = messageBody; 
        }
      }
    }

    // Chỉ cập nhật state nếu có gì đó thực sự thay đổi hoặc là thông báo lỗi
    if (stateToSet !== undefined || valueToSet !== undefined || isErrorFromServer) {
      console.log(`[WS] PRE-UPDATE CHECK for ${deviceId}: Current realtimeState.value is "${realtimeStatesRef.current[deviceId]?.value}", Current realtimeState.state is "${realtimeStatesRef.current[deviceId]?.state}"`);
      console.log(`[WS] ATTEMPTING UPDATE for ${deviceId}: Determined stateToSet="${stateToSet}", Determined valueToSet="${valueToSet}" (type: ${typeof valueToSet}), isErrorFromServer=${isErrorFromServer}`);
      
      setRealtimeStates((prevStates) => {
        const currentDeviceData = prevStates[deviceId] || {};
        const updatedDeviceData = { ...currentDeviceData };

        if (isErrorFromServer) {
          // Ghi đè với thông tin lỗi
          updatedDeviceData.value = valueToSet; // valueToSet lúc này là chuỗi lỗi
          // updatedDeviceData.state = 'ERROR'; // Hoặc một giá trị state báo lỗi nếu bạn có
        } else {
          // Cập nhật bình thường
          if (stateToSet !== undefined) {
            updatedDeviceData.state = stateToSet;
          }
          if (valueToSet !== undefined) {
            updatedDeviceData.value = valueToSet;
          }
        }
        
        console.log(`[WS] INSIDE setRealtimeStates for ${deviceId}. Prev device data:`, JSON.stringify(currentDeviceData), `New device data:`, JSON.stringify(updatedDeviceData));
        
        return {
          ...prevStates,
          [deviceId]: updatedDeviceData,
        };
      });
    } else {
      console.warn(`[WS] No actionable state/value determined for ${deviceId} from message: "${messageBody}"`);
    }
  },
  [] 
);



  const setupWebSocket = useCallback(() => {
    if (
      status === "authenticated" &&
      session?.user?.accessToken &&
      devices &&
      devices.length > 0 &&
      !firstConnectRef.current &&
      !isWebSocketConnectingRef.current
    ) {
      console.log("[WS] Attempting to connect...");
      isWebSocketConnectingRef.current = true; // Đánh dấu là đang kết nối
      connectWebSocket(
        session.user.accessToken,
        () => {
          // onConnected
          console.log("[WS] Connection successful. Subscribing to devices...");
          toast.info("Connected to real-time server.");

          firstConnectRef.current = true;
          isWebSocketConnectingRef.current = false;

          devices.forEach((device) => {
            // Hủy subscription cũ nếu tồn tại trước khi subscribe lại
            if (subscriptionsRef.current[device.id]) {
              unsubscribeFromDevice(subscriptionsRef.current[device.id]);
              console.log(`[WS] Unsubscribed from old ${device.id}`);
            }
            const subscription = subscribeToDevice(device.id, (messageBody) =>
              handleWebSocketMessage(device.id, messageBody)
            );
            // Lưu subscription mới vào ref
            subscriptionsRef.current = {
              ...subscriptionsRef.current,
              [device.id]: subscription,
            };
            if (subscription) {
              console.log(`[WS] Successfully subscribed to ${device.id}`);
            } else {
              console.error(`[WS] Failed to subscribe to ${device.id}`);
            }
          });
        },
        (error) => {
          // onError
          console.error("[WS] Connection error:", error);
          // toast.error(`Real-time connection error: ${error}`);
          // Logic retry đã có trong lib/websocket.ts
          isWebSocketConnectingRef.current = false;
        }
      ).catch((err) => {
        console.error("[WS] Failed to initiate connection:", err);
        toast.error("Could not initiate real-time connection.");
      });
    } else {
      console.log(
        "[WS] Skipping connection: Not authenticated, no token, or no devices."
      );
      isWebSocketConnectingRef.current = false;
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
    if (devices && !firstConnectRef.current) {
      // only setup lần đầu
      // Chỉ setup khi devices đã được load (không phải null)
      setupWebSocket();
      firstConnectRef.current = true;
    }

    // Cleanup function: Ngắt kết nối và hủy subscriptions khi component unmount hoặc dependencies thay đổi
    return () => {
      // console.log("[WS] Cleaning up WebSocket connections...");
      // Object.values(subscriptionsRef.current).forEach((sub) => {
      //   unsubscribeFromDevice(sub);
      // });
      // subscriptionsRef.current = {}; // Reset ref
      // disconnectWebSocket();
      // console.log("[WS] Cleanup complete.");
    };
  }, [devices, setupWebSocket]); // Chạy lại effect này khi `devices` hoặc `setupWebSocket` thay đổi

  useEffect(() => {
    return () => {
      console.log("[WS] Cleaning up WebSocket connections...");
      Object.values(subscriptionsRef.current).forEach((sub) => {
        unsubscribeFromDevice(sub);
      });
      subscriptionsRef.current = {};
      disconnectWebSocket();
      console.log("[WS] Cleanup complete.");
    };
  }, []); // Cleanup khi component unmount
  // --- Event Handlers ---
  const openEditModal = useCallback(async (device: Device) => { // Nhận Device đã xử lý từ map
    console.log(`Opening modal in 'edit' mode for device: ${device.id}`);
    setIsLoading(true);
    try {
      // <<< SỬA: API trả về Device trực tiếp >>>
      const response = await apiClient.get<ApiResponse<Device>>(`/devices/${device.id}`);
      console.log("<<< Response from GET /devices/{id} for Edit:", response.data);
      if (response.data?.data) {
        const deviceFromApi = response.data.data; // Đây là kiểu Device

        // Kiểm tra nếu API trả về thiếu trường (phòng trường hợp backend thay đổi mà frontend chưa biết)
        if (deviceFromApi.type === undefined || deviceFromApi.isSensor === undefined) {
            console.error(`Device ${deviceFromApi.id} from API is missing 'type' or 'isSensor'!`);
            toast.error("Failed to load device data for editing: incomplete data from server.");
            setIsLoading(false);
            return;
        }

        const detailedDevice = {
          ...deviceFromApi, // <<< Dùng dữ liệu GỐC TỪ API
          state: realtimeStatesRef.current[device.id]?.state ?? deviceFromApi.state,
        };
        console.log("<<< Data being set to selectedDevice for Edit:", detailedDevice);
        setSelectedDevice(detailedDevice);
        setModalMode('edit');
        setShowDeviceModal(true);
      } else {
        toast.error("Could not load device details (no data).");
      }
    }  catch (error: unknown) {
      console.error("An error occurred while fetching device details:", error);
    }
    finally { setIsLoading(false); }
  }, [realtimeStates]);

 // Đóng modal chung
 const closeDeviceModal = useCallback(() => {
  console.log("Closing device modal");
  setShowDeviceModal(false);
  setModalMode(null);
  setSelectedDevice(null);
}, []);
const handleDeviceUpdate = useCallback((updatedDeviceData: Device) => { // Nhận Device đầy đủ
  console.log("Updating device list state with:", updatedDeviceData);
  setDevices(prevDevices => {
    if (!prevDevices) return null;
     // Phải map lại vì updatedDeviceData có thể chỉ là Partial<Device> nếu PUT ko trả về hết
     // Cách an toàn nhất là đảm bảo object thay thế là Device đầy đủ
    return prevDevices.map(dev =>
      dev.id === updatedDeviceData.id ? { ...dev, ...updatedDeviceData } : dev
    );
  });
  // Cập nhật realtime state nếu cần
   if (updatedDeviceData.state) {
       setRealtimeStates(prev => ({...prev, [updatedDeviceData.id]: { ...prev[updatedDeviceData.id], state: updatedDeviceData.state }}));
   }
}, []);

   // Xử lý lưu (Thêm hoặc Sửa) - Được gọi từ AddEditDeviceModal
   const handleSaveDevice = useCallback(async (deviceData: DeviceDTO, mode: 'add' | 'edit') => {
    console.log(`Saving device in mode: ${mode}`, deviceData); // <<< Log này cho thấy deviceData từ modal có type/isSensor
    try {
        let response;
        let successMessage = "";

        if (mode === 'add') {
            // ... logic POST ...
        } else if (mode === 'edit') {
             if (!selectedDevice?.id) { // <<< Dùng selectedDevice
                  throw new Error("Cannot update device: No device selected or missing ID.");
             }

             // <<< QUAN TRỌNG: TẠO PAYLOAD ĐÚNG Ở ĐÂY >>>
             const putPayload: DeviceDTO = {
                 id: selectedDevice.id, // Có thể không cần id trong body, nhưng đưa vào cho đủ DTO
                 feed: deviceData.feed, // Lấy từ form
                 adaUsername: deviceData.adaUsername, // Lấy từ form
                 adaApikey: deviceData.adaApikey, // Lấy từ form (có thể undefined)
                 deviceConfig: deviceData.deviceConfig ?? {}, // Lấy từ form

                 // Lấy các trường bắt buộc, không đổi từ selectedDevice gốc (đã được xử lý)
                 type: selectedDevice.type,       // <<< PHẢI CÓ
                 isSensor: selectedDevice.isSensor, // <<< PHẢI CÓ
                 state: selectedDevice.state,     // <<< PHẢI CÓ (Theo DTO backend)
             };

             // Xử lý API Key nếu cần (ví dụ: gửi key cũ nếu form trống và backend yêu cầu)
             if (!putPayload.adaApikey && selectedDevice.adaApikey) {
                 // Nếu backend yêu cầu @NotBlank, phải gửi key cũ nếu form trống
                 // putPayload.adaApikey = selectedDevice.adaApikey;
                 // Nếu backend cho phép null/blank khi update thì không cần dòng trên
             }
             // Xóa ID khỏi payload nếu API chỉ nhận ID qua URL
             // delete putPayload.id;
             if (!putPayload.adaApikey) { // Kiểm tra xem người dùng có nhập key mới không
              console.log("[Save] API Key form input is blank/null. Using original key from selectedDevice.");
              // Nếu key trong form trống, LẤY LẠI KEY CŨ từ selectedDevice để gửi đi
              // (Vì backend yêu cầu @NotBlank, không thể gửi trống hoặc thiếu)
              putPayload.adaApikey = selectedDevice.adaApikey ?? ''; // Lấy key cũ, nếu cũ cũng null thì gửi chuỗi rỗng
          } else {
               console.log("[Save] API Key provided in form, using new key.");
          }
          
          // 4. Kiểm tra lần cuối trước khi gửi (DEBUG)
          if (!putPayload.adaApikey) {
               console.error("!!! CRITICAL: adaApikey is STILL empty/null before sending PUT request!", putPayload);
               // Có thể dừng ở đây hoặc báo lỗi cụ thể hơn
          }
          
             console.log("Payload for PUT (Actual Sent Data):", JSON.stringify(putPayload, null, 2)); // <<< Log payload cuối cùng
             response = await apiClient.put<ApiResponse<unknown>>(`/devices/${selectedDevice.id}`, putPayload); // <<< Gửi putPayload đã đầy đủ
             // ... xử lý success, update state local ...
             successMessage = response.data?.message || "Device updated successfully!";
             toast.success(successMessage);
             const updatedDeviceForState: Device = {
                 id: selectedDevice.id,
                 feed: selectedDevice.feed,
                 adaUsername: selectedDevice.adaUsername,
                 adaApikey: selectedDevice.adaApikey,
                 deviceConfig: selectedDevice.deviceConfig,
                 type: selectedDevice.type,
                 isSensor: selectedDevice.isSensor,
                 state: selectedDevice.state,
             };
             handleDeviceUpdate(updatedDeviceForState);
             closeDeviceModal();

        } else {
            throw new Error("Invalid mode.");
        }
    } catch (error: unknown) { /* ... Xử lý lỗi như cũ ... */
         console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} device:`, error);
         // ... (logic báo lỗi toast như cũ) ...
        // Quan trọng: Ném lỗi lại để modal biết và không tự đóng
        throw error; // <<< Ném lỗi lại
     } finally {
       //setIsLoading(false);
    }
  }, [loadDevices, handleDeviceUpdate, selectedDevice, closeDeviceModal]); // Thêm dependency
  // Xử lý xóa device
  const handleDeleteDevice = useCallback(async (deviceId: string, deviceFeed?: string) => {
    console.log(`Attempting to delete device: ${deviceId} (${deviceFeed})`);
    setShowConfirmDeleteModal(false); // Đóng modal xác nhận
    setDeviceToDelete(null);
    // setIsLoading(true); // Dùng loading riêng cho delete nếu muốn

    try {
        const response = await apiClient.delete<ApiResponse<unknown>>(`/devices/${deviceId}`);
        toast.success(response.data?.message || `Device ${deviceFeed || deviceId} deleted successfully!`);
        setDevices(prevDevices => prevDevices ? prevDevices.filter(dev => dev.id !== deviceId) : null);
        // Đóng modal edit nếu đang mở cho device này
        if (selectedDevice?.id === deviceId) {
            closeDeviceModal();
        }
    } catch (error: unknown) {
      console.error("An error occurred while deleting the device:", error);
      toast.error("Failed to delete the device. Please try again.");
    }
    finally { /* setIsLoading(false); */ }
  }, [selectedDevice, closeDeviceModal]);

  // Mở modal xác nhận xóa
  const openConfirmDeleteModal = (device: Device) => {
       setDeviceToDelete(device);
       setShowConfirmDeleteModal(true);
  };

  // Xác nhận xóa
  const confirmDelete = () => {
       if (deviceToDelete) {
           handleDeleteDevice(deviceToDelete.id, deviceToDelete.feed);
       }
  };

  const handleToggleDevice = (device: Device) => {
    // Bỏ async nếu chỉ dùng WS
    if (!session) {
      toast.warn("Authentication required.");
      return;
    }

    // Check lock
    if (clickLockRef.current[device.id]) {
      console.warn(`[WS] Click too fast for device ${device.id}, ignored.`);
      return;
    }

    clickLockRef.current[device.id] = true; // Lock ngay
    setTimeout(() => {
      clickLockRef.current[device.id] = false; // Unlock sau 500ms
    }, 500);

    const currentState = realtimeStates[device.id]?.state ?? device.state;
    const newState = currentState === "ON" ? "OFF" : "ON";

    // --- Bước 1: Optimistic Update ---
    setRealtimeStates((prev) => ({
      ...prev,
      [device.id]: { ...(prev[device.id] || {}), state: newState }, // Cập nhật UI ngay
    }));

    // --- Bước 2: Gửi lệnh qua WebSocket ---
    const command: DeviceCommand = { action: "TOGGLE", value: newState };
    console.log(`[WS] Sending command to ${device.id}:`, command);
    try {
      publishToDevice(device.id, command); // <<< Gọi hàm gửi WS
      // Không cần toast success ở đây, UI đã cập nhật, trạng thái cuối cùng sẽ được xác nhận khi nhận lại message WS
    } catch (wsError) {
      console.error(`[WS] Error publishing command for ${device.id}:`, wsError);
      toast.error(
        `Failed to send command to device ${device.feed}. Check connection.`
      );
      // --- Rollback Optimistic Update nếu gửi WS thất bại ---
      setRealtimeStates((prev) => ({
        ...prev,
        [device.id]: { ...(prev[device.id] || {}), state: currentState }, // Quay lại trạng thái cũ
      }));
    }
  };


  const handleSetSpeed = useCallback((device: Device, speed: number) => {
    if (!session) {
      toast.warn("Authentication required.");
      return;
    }
    const speedValue = String(Math.round(speed));
    const deviceId = device.id;

    console.log(`[handleSetSpeed] Device: ${deviceId}, Requested Speed: ${speedValue}`);
    console.log(`[handleSetSpeed] BEFORE optimistic update, realtimeStatesRef.current[${deviceId}]:`, JSON.stringify(realtimeStatesRef.current[deviceId]));

    const oldSpeed = realtimeStatesRef.current[deviceId]?.value; 

    setRealtimeStates((prevStates) => {
      const newStateForDevice = {
        // Giữ lại state ON/OFF hiện tại, hoặc state mặc định của device nếu chưa có
        state: prevStates[deviceId]?.state ?? device.state, 
        value: speedValue, // Cập nhật giá trị speed mới ngay lập tức
      };
      console.log(`[handleSetSpeed] INSIDE setRealtimeStates (Optimistic). Updating ${deviceId} to:`, JSON.stringify(newStateForDevice));
      return {
        ...prevStates,
        [deviceId]: newStateForDevice,
      };
    });

    const command: DeviceCommand = { action: "SET_SPEED", value: speedValue };
    console.log(`[handleSetSpeed] Publishing command for ${deviceId}:`, command);
    try {
      publishToDevice(deviceId, command);
    } catch (wsError) {
      console.error(`[handleSetSpeed] Error publishing SET_SPEED for ${deviceId}:`, wsError);
      toast.error(
        `Failed to send speed command to device ${device.feed}. Check connection.`
      );
      setRealtimeStates((prevStates) => {
        const revertedStateForDevice = {
          state: prevStates[deviceId]?.state ?? device.state,
          value: oldSpeed, 
        };
        console.log(`[handleSetSpeed] INSIDE setRealtimeStates (Rollback). Reverting ${deviceId} to:`, JSON.stringify(revertedStateForDevice));
        return {
          ...prevStates,
          [deviceId]: revertedStateForDevice,
        };
      });
    }
  }, [session, devices]); // `devices` có thể cần thiết nếu `device.state` thay đổi và bạn muốn giá trị mặc định mới nhất
  
  

  //============== VIDEO PLAYER ==================================================================================

  const videoIds = ["RgKAFK5djSk", "jfKfPfyJRdk", "5qap5aO4i9A"];
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const playerRef = useRef<YouTubePlayer | null>(null); // Ref để lưu đối tượng player
  const [isPlaying, setIsPlaying] = useState(false); // Trạng thái đang phát hay dừng
  const [currentTime, setCurrentTime] = useState(0); // Thời gian hiện tại (giây)
  const [duration, setDuration] = useState(0); // Tổng thời gian video (giây)
  const [isMuted, setIsMuted] = useState(false); // Trạng thái mute
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null); // Ref cho interval cập nhật thời gian

  // Hàm lấy Player instance khi sẵn sàng
  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    console.log("Player Ready");
    playerRef.current = event.target; // Lưu player instance
    setDuration(playerRef.current?.getDuration() || 0); // Lấy tổng thời gian
  };

  // Hàm xử lý thay đổi trạng thái player (Play, Pause, End...)
  const onPlayerStateChange: YouTubeProps["onStateChange"] = (event) => {
    const playerStatus = event.data;
    console.log("Player State Change:", playerStatus);
    if (playerStatus === YouTube.PlayerState.PLAYING) {
      setIsPlaying(true);
      setDuration(playerRef.current?.getDuration() || 0); // Cập nhật durationเผื่อ thay đổi
      // Bắt đầu cập nhật thời gian hiện tại
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current); // Xóa interval cũ
      progressIntervalRef.current = setInterval(() => {
        setCurrentTime(playerRef.current?.getCurrentTime() || 0);
      }, 500); // Cập nhật mỗi 500ms
    } else {
      setIsPlaying(false);
      // Dừng cập nhật thời gian khi Pause hoặc End
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // Tự động chuyển bài khi kết thúc (tùy chọn)
      // if (playerStatus === YouTube.PlayerState.ENDED) {
      //    handleNextVideo();
      // }
    }
  };

  // Hàm xử lý lỗi player
  const onPlayerError: YouTubeProps["onError"] = (error) => {
    console.error("YouTube Player Error:", error);
    setIsPlaying(false);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  // Chuyển video
  const handleNextVideo = useCallback(() => {
    const nextIndex = (currentVideoIndex + 1) % videoIds.length;
    setCurrentVideoIndex(nextIndex);
    // Reset trạng thái khi chuyển video
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  }, [currentVideoIndex, videoIds.length]);

  const handlePreviousVideo = useCallback(() => {
    const prevIndex =
      (currentVideoIndex - 1 + videoIds.length) % videoIds.length;
    setCurrentVideoIndex(prevIndex);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  }, [currentVideoIndex, videoIds.length]);

  // Play/Pause
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  // Tua video
  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current) return;
    const seekToTime = parseFloat(event.target.value);
    setCurrentTime(seekToTime); // Cập nhật UI ngay
    playerRef.current.seekTo(seekToTime, true); // Tua video
  };

  // Mute/Unmute
  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  // Format thời gian từ giây sang MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  // --- Cleanup Interval khi component unmount ---
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  //=================================================END VIDEO PLAYER===================================================

  // --- Render Logic ---

  if (status === "loading" || isLoading) {
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
    <div className={styles.dashboardContainer}>
      {" "}
      {/* Container chính của trang */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        theme="colored"
      />
      {/* Phần Widgets */}
      <div className={styles.widgetsGrid}>
        {" "}
        {/* Lưới widgets */}
       <div className={styles.widgetColSpan1}>
            <WeatherWidget 
              weather={weather}
              isLoading={isLoading} // Dùng chung trạng thái loading của trang
              onRefresh={loadWeather} // Cho phép widget gọi lại hàm loadWeather
            />
          </div>
        <div
          className={`${styles.widgetColSpan2} ${styles.videoWidgetContainer}`}
        >
          {/* Không cần videoHeader riêng nữa, tích hợp vào đây */}
          <div className={styles.videoWrapper}>
            <YouTube
              key={videoIds[currentVideoIndex]} // Thêm key để đảm bảo player load lại đúng khi ID thay đổi
              videoId={videoIds[currentVideoIndex]}
              opts={{
                height: "100%",
                width: "100%",
                playerVars: {
                  autoplay: 0,
                  controls: 0, // <<< QUAN TRỌNG: Ẩn controls mặc định
                  modestbranding: 1,
                  rel: 0,
                  iv_load_policy: 3, // Ẩn annotation
                  disablekb: 1, // Vô hiệu hóa điều khiển bằng bàn phím (tùy chọn)
                },
              }}
              className={styles.youtubePlayer}
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
              onError={onPlayerError}
            />
          </div>
          
          {/* === KHU VỰC ĐIỀU KHIỂN TÙY CHỈNH === */}
          <div className={styles.customControls}>
            {/* Thanh tiến trình */}
            <span className={styles.timeDisplay}>
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime || 0}
              onChange={handleSeek}
              className={styles.progressBar}
              disabled={!playerRef.current || duration === 0} // Disable nếu chưa sẵn sàng hoặc video không có thời lượng
            />
            <span className={styles.timeDisplay}>{formatTime(duration)}</span>

            {/* Các nút điều khiển */}
            <div className={styles.controlButtons}>
              <button
                onClick={handlePreviousVideo}
                className={styles.controlButton}
                aria-label="Previous Video"
              >
                <SkipBack size={20} />
              </button>
              <button
                onClick={togglePlay}
                className={styles.controlButton}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button
                onClick={handleNextVideo}
                className={styles.controlButton}
                aria-label="Next Video"
              >
                <SkipForward size={20} />
              </button>
              <button
                onClick={toggleMute}
                className={styles.controlButton}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              {/* Có thể thêm nút Fullscreen nếu muốn (cần thêm logic JS) */}
            </div>
          </div>
          {/* === KẾT THÚC KHU VỰC ĐIỀU KHIỂN === */}
        </div>
        {/* === KẾT THÚC WIDGET VIDEO === */}
      </div>
      {/* Phần danh sách thiết bị */}
      <h2 className={styles.deviceListTitle}>My devices</h2>
      {/* Lưới thiết bị hoặc thông báo khi không có thiết bị */}
      <div className={styles.deviceGrid}>
        {devices.length === 0 && (
          <div className="text-gray-500 text-center">
            No devices available. Please add a new device.
          </div>
        )}
        {devices.map((device) => {
            // <<< Logic xác định loại thiết bị DỰA TRÊN DỮ LIỆU TỪ API >>>
             // QUAN TRỌNG: Đảm bảo device.isSensor và device.type có giá trị hợp lệ
             if (device.isSensor === undefined || device.type === undefined) {
                  console.warn(`Device ${device.id} (${device.feed}) has invalid type/isSensor. Rendering potentially incorrect card.`);
                  // return null; // Hoặc render card lỗi
             }
            const isSensor = !!device.isSensor; // Ép kiểu boolean an toàn
            const isTempActuator = device.type === 'TEMP' && !isSensor;

            return (
              <DeviceCard
                key={device.id}
                device={device}
                isSensor={isSensor}
                currentState={realtimeStates[device.id]?.state}
                currentValue={realtimeStates[device.id]?.value}
                onToggle={!isSensor ? () => handleToggleDevice(device) : undefined}
                onClick={() => openEditModal(device)}
                onSetSpeed={isTempActuator ? (speed) => handleSetSpeed(device, speed) : undefined}
                onDeleteRequest={() => openConfirmDeleteModal(device)}
                onShowChart={() => handleShowChart(device.id)}
                //onShowChart={isSensor ? () => handleShowChart(device.id) : undefined} // <<< TRUYỀN PROP MỚI
                minSpeed={isTempActuator ? Number(device.deviceConfig?.['minSpeed'] ?? 0) : undefined}
                maxSpeed={isTempActuator ? Number(device.deviceConfig?.['maxSpeed'] ?? 100) : undefined}
              />
            );
          })}
      </div>

      {/* Modal Thêm/Sửa Chung */}
      <AddEditDeviceModal
          isOpen={showDeviceModal}
          onClose={closeDeviceModal}
          mode={modalMode}
          initialData={selectedDevice} // null cho 'add', device data cho 'edit'
          onSave={handleSaveDevice} // <<< Hàm xử lý lưu mới
          // Truyền các props khác nếu AddEditDeviceModal cần
           defaultAdaUsername={process.env.NEXT_PUBLIC_ADA_USERNAME || ""}
           defaultAdaApiKey={process.env.NEXT_PUBLIC_ADA_API_KEY || ""}
      />

       {/* Modal Xác nhận Xóa */}
       <ConfirmationModal
           isOpen={showConfirmDeleteModal}
           onClose={() => setShowConfirmDeleteModal(false)}
           onConfirm={confirmDelete} // <<< Hàm xác nhận xóa
           title="Confirm Deletion"
           // Sử dụng optional chaining và default value
           message={`Are you sure you want to delete the device "${deviceToDelete?.feed || 'N/A'}"? This action cannot be undone.`}
       />
        <ChartModalDevice
            isOpen={showChartModal}
            onClose={() => { setShowChartModal(false); setChartDeviceId(null); }}
            deviceId={chartDeviceId}
      />

    </div>
  );
}