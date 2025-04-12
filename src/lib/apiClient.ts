// lib/apiClient.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';
import { CustomSession, WeatherInfo } from './types';
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    try {
      const session = await getSession() as CustomSession | null;
      if (config.baseURL) {
        if (session?.user?.accessToken) {
          config.headers.Authorization = `Bearer ${session.user.accessToken}`;
        }
      }
    } catch (error) {
      console.error("Error in request interceptor:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);
export default apiClient;

// --- HÀM fetchWeather ĐƯỢC CẬP NHẬT ---
// Hàm lấy thông tin thời tiết từ Open-Meteo
export const fetchWeather = async (
    latitude: number,
    longitude: number,
    cityName: string // Truyền tên thành phố để hiển thị
): Promise<WeatherInfo | null> => {
    try {
        console.log(`Workspaceing weather for lat=${latitude}, lon=${longitude}`);
        // Gọi API Open-Meteo Forecast
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: latitude,
                longitude: longitude,
                // Yêu cầu dữ liệu thời tiết hiện tại mong muốn
                current: 'temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,weather_code',
                temperature_unit: 'celsius', // Đơn vị nhiệt độ
                wind_speed_unit: 'ms',     // Đơn vị tốc độ gió (m/s)
                timezone: 'Asia/Ho_Chi_Minh' // Hoặc 'auto'
            }
        });

        const currentData = response.data?.current;

        // Kiểm tra xem có dữ liệu 'current' không
        if (!currentData) {
            console.error("Open-Meteo response missing 'current' data:", response.data);
            return null;
        }

        console.log("Open-Meteo current weather data:", currentData);

        // Map dữ liệu trả về vào interface WeatherInfo đã cập nhật
        return {
            city: cityName, // Sử dụng tên thành phố đã truyền vào
            temperature: Math.round(currentData.temperature_2m),
            weatherCode: currentData.weather_code, // Mã thời tiết WMO
            windSpeed: currentData.wind_speed_10m,
            pressure: Math.round(currentData.pressure_msl), // Áp suất mực nước biển trung bình
            humidity: Math.round(currentData.relative_humidity_2m),
        };
    } catch (error: unknown) {
        // Xử lý lỗi cụ thể từ axios nếu có
        if (axios.isAxiosError(error) && error.response) {
            console.error("Error fetching Open-Meteo weather data - Status:", error.response.status);
            console.error("Error fetching Open-Meteo weather data - Data:", error.response.data);
        } else if (axios.isAxiosError(error) && error.request) {
            console.error("Error fetching Open-Meteo weather data - No response:", error.request);
        } else {
            console.error("Error fetching Open-Meteo weather data - General error:", (error as Error).message);
        }
        return null;
    }
};