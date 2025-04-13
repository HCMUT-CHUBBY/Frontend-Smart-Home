// lib/types.ts
import { Session } from "next-auth";
import { StompSubscription } from "@stomp/stompjs";

// Dựa trên API response của bạn
export interface Device {
  id: string;
  feed: string;
  state: "ON" | "OFF";
  type: "TEMP" | "LIGHT"; 
  adaUsername: string;
  adaApikey: string;
  deviceConfig: Record<string, string | number | boolean>; 
}


export interface DeviceDTO {
  isSensor?: boolean; 
  type: "TEMP" | "LIGHT";
  feed: string;
  state: "ON" | "OFF";
  adaUsername?: string;
  adaApikey?: string;
  deviceConfig?: Record<string, string | number | boolean>;
}


export interface ApiResponse<T> {
  message: string;
  data: T;
}


export interface CustomSession extends Session {
  user: {
    id: string; 
    accessToken: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}


export interface DeviceCommand {
    action: string; // Ví dụ: "set_state"
    value: string; // Ví dụ: "ON" hoặc "OFF"
}

// Lưu trữ các subscription WebSocket
export interface DeviceSubscriptions {
    [deviceId: string]: StompSubscription | null;
}

// Dữ liệu thời tiết (ví dụ từ OpenWeatherMap)
export interface WeatherInfo {
    city: string;           // Tên thành phố (từ response.data.name)
    temperature: number;    // Nhiệt độ hiện tại (từ response.data.main.temp)
    feelsLike: number;      // Nhiệt độ cảm nhận (từ response.data.main.feels_like)
    tempMin?: number;       // Nhiệt độ thấp nhất (tùy chọn, từ response.data.main.temp_min)
    tempMax?: number;       // Nhiệt độ cao nhất (tùy chọn, từ response.data.main.temp_max)
    description: string;    // Mô tả thời tiết (từ response.data.weather[0].description)
    iconCode: string;       // Mã icon thời tiết (từ response.data.weather[0].icon) - vd: "01d", "10n"
    humidity: number;       // Độ ẩm (từ response.data.main.humidity)
    pressure: number;       // Áp suất (từ response.data.main.pressure)
    windSpeed: number;      // Tốc độ gió (từ response.data.wind.speed)
    sunrise?: number;       // Thời gian mặt trời mọc (Unix timestamp, tùy chọn)
    sunset?: number;        // Thời gian mặt trời lặn (Unix timestamp, tùy chọn)
    timezone?: number;      // Độ lệch múi giờ so với UTC (giây)
  }
  

// Cập nhật State của thiết bị từ WebSocket
export interface DeviceRealtimeState {
    [deviceId: string]: {
        state?: "ON" | "OFF";
        value?: string | number; // Có thể nhận thêm giá trị (như nhiệt độ)
        // Thêm các thuộc tính khác nếu WebSocket gửi về
    }
}