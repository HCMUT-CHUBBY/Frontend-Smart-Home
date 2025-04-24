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
  deviceConfig: Record<string, string[]>;
}

export interface DeviceDTO {
  // Thêm id là optional vì khi POST (tạo mới) sẽ không có id
  id?: string; 

  // Các trường bắt buộc gửi lên khi POST/PUT theo backend DTO
  isSensor: boolean;             // <<< BẮT BUỘC
  type: "TEMP" | "LIGHT" | string; // <<< Có thể giữ enum HOẶC đổi thành string để khớp backend
                                  // Giữ enum giúp frontend kiểm soát tốt hơn, 
                                  // khi gửi đi giá trị vẫn là string ("TEMP" hoặc "LIGHT")
  feed: string;                  // <<< BẮT BUỘC (Vốn đã vậy)
  state: "ON" | "OFF";           // <<< BẮT BUỘC (Vốn đã vậy, string "ON"/"OFF" là hợp lệ)
  adaUsername: string;           // <<< BẮT BUỘC
  adaApikey: string;             // <<< BẮT BUỘC
  deviceConfig: Record<string, string >;  // <<< Đổi thành 'any' hoặc 'unknown' nếu có thể lưu object phức tạp, 
                                       // hoặc giữ nguyên nếu chỉ lưu giá trị đơn giản. Vẫn để optional.
}

// Interface Device và các interface khác giữ nguyên



export interface ApiResponse<T> {
  message: string;
  data: T;
}
export interface PasswordDTO {
  oldPassword: string;     // <<< Đổi tên từ currentPassword
  newPassword: string;
  confirmPassword: string; // <<< Thêm trường này
}


// Interface cho dữ liệu gửi lên khi cập nhật profile (ví dụ)
export interface ProfileUpdateDTO {
    name: string;
    // Thêm các trường khác nếu API cho phép cập nhật (vd: avatar)
}

// Interface cho dữ liệu gửi lên khi lưu tùy chọn (ví dụ)
export interface PreferencesUpdateDTO {
    theme: 'light' | 'dark';
    emailNotifications: boolean;
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
export interface DeviceLogDTO {
  dateTime: string; // Nhận về dưới dạng chuỗi ISO 8601
  deviceId: string;
  userId: number | null; // Kiểu Long trong Java có thể là null
  value: string; // Giá trị log (luôn là string từ backend DTO)
  state: string | null; // Trạng thái lúc log (String trong Java, có thể null)
}

// Interface cho dữ liệu phân trang nhận về từ API
// Dựa trên cấu trúc Page của Spring Boot và cách PageDTO có thể được tạo ra
export interface PageDTO<T> {
  content: T[]; // Mảng chứa dữ liệu của trang hiện tại (ví dụ: DeviceLogDTO[])
  pageNo: number; // Số trang hiện tại (thường bắt đầu từ 0)
  pageSize: number; // Kích thước trang
  totalElements: number; // Tổng số phần tử khớp điều kiện
  totalPages: number; // Tổng số trang
  last: boolean; // true nếu là trang cuối cùng
  // Có thể thêm các trường khác nếu backend PageDTO trả về:
  // first?: boolean;
  // sort?: any;
  // numberOfElements?: number;
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
  


export interface DeviceRealtimeState {
    [deviceId: string]: {
        state?: "ON" | "OFF";
        value?: string | number; // Có thể nhận thêm giá trị (như nhiệt độ)
        // Thêm các thuộc tính khác nếu WebSocket gửi về
    }
}