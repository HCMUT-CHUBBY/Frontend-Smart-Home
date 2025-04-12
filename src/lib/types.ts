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
    city: string;
    temperature: number; // từ temperature_2m
    weatherCode: number; // WMO Weather code từ Open-Meteo
    windSpeed: number; // từ wind_speed_10m
    pressure: number; // từ pressure_msl hoặc surface_pressure
    humidity: number; // từ relative_humidity_2m
  }
  

// Cập nhật State của thiết bị từ WebSocket
export interface DeviceRealtimeState {
    [deviceId: string]: {
        state?: "ON" | "OFF";
        value?: string | number; // Có thể nhận thêm giá trị (như nhiệt độ)
        // Thêm các thuộc tính khác nếu WebSocket gửi về
    }
}