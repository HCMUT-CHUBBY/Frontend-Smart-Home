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
    console.log('[Interceptor] Original Request URL:', config.url);
    console.log('[Interceptor] Original Request BaseURL:', config.baseURL);

    // Chỉ thêm token cho các request đến API backend của bạn, không phải OpenWeatherMap
    const isApiRequest = config.baseURL && config.url &&
                         process.env.NEXT_PUBLIC_API_BASE_URL &&
                         config.baseURL.startsWith(process.env.NEXT_PUBLIC_API_BASE_URL) &&
                         !config.url.startsWith('https://api.openweathermap.org');

    if (isApiRequest) {
      console.log('[Interceptor] Attempting to get session for API call to:', config.url);
      try {
        const session = await getSession() as CustomSession | null;
        console.log('[Interceptor] Session retrieved:', session);

        if (session?.user?.accessToken) {
          console.log('[Interceptor] Attaching token:', session.user.accessToken.substring(0, 20) + "..."); // Log một phần token
          config.headers.Authorization = `Bearer ${session.user.accessToken}`;
        } else {
          console.warn('[Interceptor] No access token found in session for API call. Session user:', session?.user);
        }
      } catch (error) {
        console.error('[Interceptor] Error getting session or attaching token:', error);
      }
    } else {
      console.log('[Interceptor] Skipping token attachment for non-API/external URL:', config.url);
    }

    console.log('[Interceptor] Final Request Headers:', JSON.stringify(config.headers, null, 2));
    return config;
  },
  (error) => {
    console.error('[Interceptor] Request error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;

// --- HÀM fetchWeather giữ nguyên ---
export const fetchWeather = async (
    cityName: string
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
    // console.log(`Fetching weather for city: ${cityName} using OpenWeatherMap`);
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: `${cityName},VN`,
        appid: apiKey,
        units: 'metric',
        lang: 'vi'
      }
    });
    const data = response.data;
    if (!data || data.cod !== 200) {
      console.error("OpenWeatherMap API Error:", data?.message || "Unknown error");
      return null;
    }
    // console.log("OpenWeatherMap weather data:", data);
    if (!data.weather || data.weather.length === 0) {
        console.error("OpenWeatherMap response missing 'weather' data:", data);
        return null;
    }
    return {
      city: data.name,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      tempMin: data.main.temp_min ? Math.round(data.main.temp_min) : undefined,
      tempMax: data.main.temp_max ? Math.round(data.main.temp_max) : undefined,
      description: data.weather[0].description,
      iconCode: data.weather[0].icon,
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