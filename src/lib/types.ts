import { Session } from "next-auth";
import { StompSubscription } from "@stomp/stompjs";

// --- CÁC TYPE ĐỊNH NGHĨA DỮ LIỆU TỪ API ---

// Cấu trúc cho một trang dữ liệu được trả về từ API
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// Cấu trúc của một Device khi NHẬN từ API
export interface Device {
  id: string;
  feed: string;
  state: "ON" | "OFF";
  type: "TEMP" | "LIGHT";
  isSensor: boolean;
  adaUsername: string;
  adaApikey: string | null;
  deviceConfig: Record<string, unknown>;
}

// Cấu trúc của một User
export interface UserDTO {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

// Cấu trúc của một Log Entry
export interface DeviceLogDTO {
  dateTime: string;
  deviceId: string;
  user: UserDTO | null;
  value: string;
  state: string;
}

// Cấu trúc response API chung
export interface ApiResponse<T> {
  message: string;
  data: T;
}

// --- CÁC TYPE DÙNG ĐỂ GỬI DỮ LIỆU LÊN SERVER (DATA TRANSFER OBJECT) ---

// DTO để tạo/cập nhật Device
export interface DeviceDTO {
  id?: string;
  isSensor: boolean;
  type: "TEMP" | "LIGHT" | string;
  feed: string;
  state: "ON" | "OFF";
  adaUsername: string;
  adaApikey?: string;
  deviceConfig: Record<string, unknown>;
}

// DTO để đổi mật khẩu
export interface PasswordDTO {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// --- CÁC TYPE DÙNG CHO LOGIC PHÍA FRONTEND ---

// Mở rộng kiểu Session của NextAuth
export interface CustomSession extends Session {
  user: {
    id: string;
    accessToken: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

// Thông tin thời tiết
export interface WeatherInfo {
  city: string;
  temperature: number;
  feelsLike: number;
  tempMin?: number;
  tempMax?: number;
  description: string;
  iconCode: string;
  humidity: number;
  pressure: number;
  windSpeed: number;
  sunrise?: number;
  sunset?: number;
  timezone?: number;
}

// --- CÁC TYPE DÙNG CHO REAL-TIME (WEBSOCKET) ---

export interface DeviceCommand {
    action: string;
    value: string;
}

export interface DeviceSubscriptions {
    [deviceId: string]: StompSubscription | null;
}

export interface DeviceRealtimeState {
    [deviceId: string]: {
        state?: "ON" | "OFF";
        value?: string | number;
    }
}

// --- CÁC TYPE DÙNG CHO PROPS CỦA COMPONENT ---

export interface AddEditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit" | null;
  initialData: Device | null;
  onSave: (deviceData: DeviceDTO, mode: "add" | "edit") => Promise<void>;
  defaultAdaUsername: string;
  defaultAdaApiKey: string;
}

export interface ChartModalDeviceProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string | null;
}