// app/(protected)/dashboard/page.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';


import axios from 'axios';
import YouTube, { YouTubePlayer, YouTubeProps } from 'react-youtube'; 
import { SkipBack, SkipForward, Play, Pause, Volume2, VolumeX } from 'lucide-react'; 

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
 

  const [devices, setDevices] = useState<Device[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [realtimeStates, setRealtimeStates] = useState<DeviceRealtimeState>({});


  const subscriptionsRef = useRef<DeviceSubscriptions>({});

 

  const loadDevices = useCallback(async () => {
    if (status !== 'authenticated') return;
    setIsLoading(true);
    try {
      const response = await apiClient.get<ApiResponse<Device[]>>('/devices');
      if (response.data && response.data.data) {
        setDevices(response.data.data);
        if (response.data.data.length === 0) {
          
          setShowAddDeviceModal(true);
        } else {
           
           const initialStates: DeviceRealtimeState = {};
           response.data.data.forEach(dev => {
               initialStates[dev.id] = { state: dev.state };
           });
           setRealtimeStates(initialStates);
        }
      } else {
        setDevices([]); 
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
    
    const city = process.env.NEXT_PUBLIC_WEATHER_CITY || "Ho Chi Minh City";

    if (!city) {
       console.warn("Weather city not configured correctly in .env.local (NEXT_PUBLIC_WEATHER_CITY)");
       return;
    }

    try {
       
       const weatherData = await fetchWeather(city);
       setWeather(weatherData);
    } catch (error) {
       console.error('Error fetching weather:', error);
    }
}, []);

 

  const handleWebSocketMessage = useCallback((deviceId: string, messageBody: string) => {
    console.log(`[WS] Received message for ${deviceId}:`, messageBody);
    try {
        let newState: "ON" | "OFF" | undefined = undefined;
        let newValue: string | number | undefined = undefined;
        let isErrorMessage = false;

        
        if (messageBody.startsWith("Error:")) {
            console.error(`[WS] Backend Error for ${deviceId}: ${messageBody}`);
            isErrorMessage = true;
            
            newValue = messageBody; // Ví dụ: hiển thị lỗi trong phần giá trị
            newState = undefined; // Hoặc đặt state về trạng thái không xác định
            
        }
        
        else { 
            try {
                const parsedData = JSON.parse(messageBody);
                // ... (phần parse JSON và xử lý ON/OFF/value như cũ) ...
                 if (parsedData && typeof parsedData === 'object') {
                     if (parsedData.state && (parsedData.state === "ON" || parsedData.state === "OFF")) {
                         newState = parsedData.state;
                     }
                     if (parsedData.value !== undefined) {
                         newValue = parsedData.value;
                     }
                 }
            } catch {
                if (messageBody === "ON" || messageBody === "OFF") {
                    newState = messageBody;
                } else {
                    newValue = isNaN(Number(messageBody)) ? messageBody : Number(messageBody);
                }
            }
        }

        // Cập nhật state
        setRealtimeStates(prevStates => ({
            ...prevStates,
            [deviceId]: {
                ...prevStates[deviceId],
                ...(newState !== undefined && { state: newState }),
                ...(newValue !== undefined && { value: newValue }), // Cập nhật cả state và value
                // Nếu là lỗi, có thể muốn ghi đè state cũ
                 ...(isErrorMessage && { state: undefined }) // Ví dụ: Xóa state nếu có lỗi
            }
        }));

    } catch (error) {
        console.error(`[WS] Error processing message for ${deviceId}:`, error);
    }
}, []);

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
    if (!session) {
       toast.warn("Authentication required.");
       return;
    }
    // Giả sử isSensor và deviceConfig được xử lý ở backend hoặc không cần thiết khi POST
    const dataToSend: DeviceDTO = { ...newDeviceData };
    console.log("Adding device:", dataToSend);
 
    try {
      const response = await apiClient.post<ApiResponse<unknown>>('/devices', dataToSend);
      toast.success(response.data?.message || 'Device added successfully!');
      setShowAddDeviceModal(false); // <<< Đóng modal KHI THÀNH CÔNG
      await loadDevices();
 
    } catch (error: unknown) {
      console.error('Error adding device:', error);
      let userErrorMessage = 'Failed to add device: Unknown error occurred.'; // Lỗi mặc định
 
      // --- KIỂM TRA LỖI FEED NOT FOUND ---
      if (axios.isAxiosError(error) && error.response) {
        const responseData = error.response.data;
        // Chuỗi message này cần khớp với message thực tế backend trả về
        const responseMessage = responseData?.message || JSON.stringify(responseData);
        const feedName = dataToSend.feed || 'provided'; // Lấy tên feed đã nhập
 
        if (error.response.status === 400 && responseMessage?.toLowerCase().includes("feed not found")) { // <<< Điều chỉnh chuỗi kiểm tra nếu cần
           userErrorMessage = `Lỗi: Feed '${feedName}' không tồn tại trên Adafruit IO. Vui lòng tạo Feed thủ công trên io.adafruit.com trước khi thêm.`;
        } else if (error.response.status === 400 && responseMessage?.toLowerCase().includes("already exists")) { // Ví dụ lỗi khác
            userErrorMessage = `Lỗi: Thiết bị với Feed '${feedName}' (hoặc ID tương tự) đã tồn tại.`;
        }
        else {
           userErrorMessage = `Failed to add device: ${responseMessage}`;
        }
      } else if (error instanceof Error) {
        userErrorMessage = `Failed to add device: ${error.message}`;
      }
      // --- KẾT THÚC KIỂM TRA LỖI ---
 
      toast.error(userErrorMessage);
      // *** Quan trọng: KHÔNG đóng modal khi lỗi ***
      // setShowAddDeviceModal(false);
    }
    // Không cần setIsLoading ở đây nếu modal tự quản lý loading state
  };
  // Bên trong component DashboardPage

  const handleToggleDevice = (device: Device) => { // Bỏ async nếu chỉ dùng WS
    if (!session) {
      toast.warn("Authentication required.");
      return;
    }
  
    const currentState = realtimeStates[device.id]?.state ?? device.state;
    const newState = currentState === 'ON' ? 'OFF' : 'ON';
  
    // --- Bước 1: Optimistic Update ---
    setRealtimeStates(prev => ({
      ...prev,
      [device.id]: { ...(prev[device.id] || {}), state: newState } // Cập nhật UI ngay
    }));
  
    // --- Bước 2: Gửi lệnh qua WebSocket ---
    const command: DeviceCommand = { action: "set_state", value: newState };
    console.log(`[WS] Sending command to ${device.id}:`, command);
    try {
        publishToDevice(device.id, command); // <<< Gọi hàm gửi WS
        // Không cần toast success ở đây, UI đã cập nhật, trạng thái cuối cùng sẽ được xác nhận khi nhận lại message WS
    } catch (wsError) {
         console.error(`[WS] Error publishing command for ${device.id}:`, wsError);
         toast.error(`Failed to send command to device ${device.feed}. Check connection.`);
         // --- Rollback Optimistic Update nếu gửi WS thất bại ---
         setRealtimeStates(prev => ({
             ...prev,
             [device.id]: { ...(prev[device.id] || {}), state: currentState } // Quay lại trạng thái cũ
         }));
    }
  
 

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


//============== VIDEO PLAYER ==================================================================================

  const videoIds = [
    'RgKAFK5djSk', 
    'jfKfPfyJRdk', 
    '5qap5aO4i9A', 
  ];
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const playerRef = useRef<YouTubePlayer | null>(null); // Ref để lưu đối tượng player
  const [isPlaying, setIsPlaying] = useState(false); // Trạng thái đang phát hay dừng
  const [currentTime, setCurrentTime] = useState(0); // Thời gian hiện tại (giây)
  const [duration, setDuration] = useState(0); // Tổng thời gian video (giây)
  const [isMuted, setIsMuted] = useState(false); // Trạng thái mute
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null); // Ref cho interval cập nhật thời gian

  // Hàm lấy Player instance khi sẵn sàng
  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    console.log("Player Ready");
    playerRef.current = event.target; // Lưu player instance
    setDuration(playerRef.current?.getDuration() || 0); // Lấy tổng thời gian
  };

  // Hàm xử lý thay đổi trạng thái player (Play, Pause, End...)
  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    const playerStatus = event.data;
    console.log("Player State Change:", playerStatus);
    if (playerStatus === YouTube.PlayerState.PLAYING) {
      setIsPlaying(true);
      setDuration(playerRef.current?.getDuration() || 0); // Cập nhật durationเผื่อ thay đổi
      // Bắt đầu cập nhật thời gian hiện tại
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); // Xóa interval cũ
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
   const onPlayerError: YouTubeProps['onError'] = (error) => {
      console.error('YouTube Player Error:', error);
      setIsPlaying(false);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
   }

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
    const prevIndex = (currentVideoIndex - 1 + videoIds.length) % videoIds.length;
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
  }

  // Format thời gian từ giây sang MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
         <div className={`${styles.widgetColSpan2} ${styles.videoWidgetContainer}`}>
          {/* Không cần videoHeader riêng nữa, tích hợp vào đây */}
          <div className={styles.videoWrapper}>
            <YouTube
              key={videoIds[currentVideoIndex]} // Thêm key để đảm bảo player load lại đúng khi ID thay đổi
              videoId={videoIds[currentVideoIndex]}
              opts={{
                height: '100%',
                width: '100%',
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
             <span className={styles.timeDisplay}>{formatTime(currentTime)}</span>
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
                 <button onClick={handlePreviousVideo} className={styles.controlButton} aria-label="Previous Video">
                    <SkipBack size={20} />
                 </button>
                 <button onClick={togglePlay} className={styles.controlButton} aria-label={isPlaying ? "Pause" : "Play"}>
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                 </button>
                 <button onClick={handleNextVideo} className={styles.controlButton} aria-label="Next Video">
                    <SkipForward size={20} />
                 </button>
                  <button onClick={toggleMute} className={styles.controlButton} aria-label={isMuted ? "Unmute" : "Mute"}>
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