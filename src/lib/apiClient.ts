// lib/apiClient.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';
import { CustomSession, WeatherInfo } from './types'; // Đảm bảo WeatherInfo đã được cập nhật

// --- apiClient và interceptor giữ nguyên ---
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
      // Chỉ thêm token nếu gọi đến API backend của bạn, không phải OpenWeatherMap
      if (config.baseURL && config.url && !config.url.startsWith('https://api.openweathermap.org')) {
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


// --- HÀM fetchWeather ĐƯỢC CẬP NHẬT HOÀN TOÀN ---
export const fetchWeather = async (
    // Có thể không cần lat/lon nữa nếu dùng city name
    // latitude: number,
    // longitude: number,
    cityName: string // Sử dụng tên thành phố để gọi API
): Promise<WeatherInfo | null> => {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;

  if (!apiKey) {
    console.error("OpenWeatherMap API key is missing in .env.local (NEXT_PUBLIC_OPENWEATHERMAP_API_KEY)");
    return null;
  }

  if (!cityName) {
    console.error("City name is required for OpenWeatherMap API call");
    return null;
  }

  try {
    console.log(`Workspaceing weather for city: ${cityName} using OpenWeatherMap`);

    // Gọi API OpenWeatherMap Current Weather Data
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: `${cityName},VN`, // Thêm mã quốc gia (ví dụ VN) để chính xác hơn
        appid: apiKey,        // API Key của bạn
        units: 'metric',      // Lấy nhiệt độ Celsius, tốc độ gió m/s
        lang: 'vi'            // Lấy mô tả tiếng Việt (tùy chọn)
      }
    });

    const data = response.data;

    // Kiểm tra xem API có trả về lỗi không (cod === 200 là thành công)
    if (!data || data.cod !== 200) {
      console.error("OpenWeatherMap API Error:", data?.message || "Unknown error");
      return null;
    }

    console.log("OpenWeatherMap weather data:", data);

    // Kiểm tra xem có thông tin weather không (là một array)
    if (!data.weather || data.weather.length === 0) {
        console.error("OpenWeatherMap response missing 'weather' data:", data);
        return null;
    }

    // Map dữ liệu trả về vào interface WeatherInfo đã cập nhật
    return {
      city: data.name,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      tempMin: data.main.temp_min ? Math.round(data.main.temp_min) : undefined,
      tempMax: data.main.temp_max ? Math.round(data.main.temp_max) : undefined,
      description: data.weather[0].description, // Lấy mô tả từ phần tử đầu tiên
      iconCode: data.weather[0].icon,       // Lấy mã icon
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      sunrise: data.sys?.sunrise,
      sunset: data.sys?.sunset,
      timezone: data.timezone,
    };

  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(`Error fetching OpenWeatherMap data - Status: ${error.response.status}`, error.response.data);
    } else if (axios.isAxiosError(error) && error.request) {
      console.error("Error fetching OpenWeatherMap data - No response:", error.request);
    } else {
      console.error("Error fetching OpenWeatherMap data - General error:", (error as Error).message);
    }
    return null;
  }
};