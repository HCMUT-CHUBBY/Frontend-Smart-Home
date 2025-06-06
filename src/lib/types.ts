// lib/types.ts
import { Session } from "next-auth";
import { StompSubscription } from "@stomp/stompjs";

// --- SỬA INTERFACE Device ---
// Interface này đại diện cho dữ liệu NHẬN ĐƯỢC từ API GET
export interface Device {
  id: string;
  feed: string;
  state: "ON" | "OFF";
  type: "TEMP" | "LIGHT"; // <<< Bỏ đi
  isSensor: boolean;      // <<< Bỏ đi
  adaUsername: string;
  adaApikey: string | null;
  deviceConfig: Record<string, unknown>;
}
export interface PasswordDTO {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
// Interface Device sử dụng trong Frontend (SAU KHI ĐÃ SUY LUẬN)
// Chúng ta sẽ thêm type và isSensor vào sau khi nhận từ API

export interface UserDTO {
  id: number; // Hoặc Long nếu backend dùng Long
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface DeviceLogDTO {
  dateTime: string; // API trả về string dạng ISO 8601 OffsetDateTime
  deviceId: string;
  user: UserDTO | null; // User có thể null
  value: string;        // Value dạng string
  state: string;        // State dạng string ("ON"/"OFF")
  // Thêm các trường khác nếu có từ backend DTO
}
export interface PageDTO<T> {
  content: T[];          // Mảng chứa dữ liệu của trang hiện tại
  pageable: {
      pageNumber: number;
      pageSize: number;
      sort: {
          sorted: boolean;
          unsorted: boolean;
          empty: boolean;
      };
      offset: number;
      paged: boolean;
      unpaged: boolean;
  };
  totalPages: number;    // Tổng số trang
  totalElements: number; // Tổng số phần tử
  last: boolean;         // Trang cuối cùng?
  size: number;          // Kích thước trang
  number: number;        // Số trang hiện tại (bắt đầu từ 0)
  sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
  };
  numberOfElements: number; // Số phần tử trong trang hiện tại
  first: boolean;        // Trang đầu tiên?
  empty: boolean;        // Trang có rỗng không?
}
export interface ChartModalDeviceProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string | null;
  device?: Device | null; // Optional: Truyền device để lấy tên/loại cho chart
}
// --- Giữ nguyên DeviceDTO ---
// Interface này đại diện cho dữ liệu GỬI ĐI (POST/PUT) đến backend
export interface DeviceDTO {
  id?: string;
  isSensor: boolean; // <<< Giữ nguyên vì backend Java DTO có trường này khi NHẬN request
  type: "TEMP" | "LIGHT" | string;
  feed: string;
  state: "ON" | "OFF";
  adaUsername: string;
  adaApikey?: string; // <<< CÓ THỂ ĐỔI thành optional nếu backend cho phép không gửi khi update
  deviceConfig: Record<string, unknown>;
}
// --- KẾT THÚC Giữ nguyên DeviceDTO ---


// --- Các interface khác giữ nguyên ---
export interface ApiResponse<T> {
  message: string;
  data: T; // Data bây giờ sẽ là Device[] hoặc Device (đã được sửa)
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
    action: string;
    value: string;
}

export interface DeviceSubscriptions {
    [deviceId: string]: StompSubscription | null;
}

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

export interface DeviceRealtimeState {
    [deviceId: string]: {
        state?: "ON" | "OFF";
        value?: string | number;
    }
}

export interface AddEditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit" | null; // Add the mode property
  initialData: Device | null;
  onSave: (deviceData: DeviceDTO, mode: "add" | "edit") => Promise<void>;
  defaultAdaUsername: string;
  defaultAdaApiKey: string;
}