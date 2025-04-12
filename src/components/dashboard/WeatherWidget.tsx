// components/dashboard/WeatherWidget.tsx
import React from 'react';
import { WeatherInfo } from '@/lib/types';
// Cập nhật danh sách icon có thể cần dùng
import { Sun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudLightning, Snowflake, Wind, Gauge, Droplet } from 'lucide-react';

interface WeatherWidgetProps {
  weather: WeatherInfo | null;
}

// --- HÀM MỚI: Diễn giải mã thời tiết WMO và chọn Icon ---
const getWeatherDetails = (code: number): { description: string; Icon: React.ElementType } => {
  // Tham khảo mã WMO tại: https://open-meteo.com/en/docs#weathervariables
  switch (code) {
    case 0: return { description: 'Trời quang', Icon: Sun };
    case 1: return { description: 'Trời quang đãng', Icon: Sun };
    case 2: return { description: 'Ít mây', Icon: Cloud };
    case 3: return { description: 'Nhiều mây, u ám', Icon: Cloud };
    case 45: return { description: 'Sương mù', Icon: CloudFog };
    case 48: return { description: 'Sương mù đọng', Icon: CloudFog };
    case 51: return { description: 'Mưa phùn nhẹ', Icon: CloudDrizzle };
    case 53: return { description: 'Mưa phùn vừa', Icon: CloudDrizzle };
    case 55: return { description: 'Mưa phùn dày', Icon: CloudDrizzle };
    case 56: return { description: 'Mưa phùn đông nhẹ', Icon: CloudDrizzle }; // Cân nhắc thêm Snowflake
    case 57: return { description: 'Mưa phùn đông dày', Icon: CloudDrizzle }; // Cân nhắc thêm Snowflake
    case 61: return { description: 'Mưa nhỏ', Icon: CloudRain };
    case 63: return { description: 'Mưa vừa', Icon: CloudRain };
    case 65: return { description: 'Mưa to', Icon: CloudRain };
    case 66: return { description: 'Mưa đông nhẹ', Icon: CloudRain }; // Cân nhắc thêm Snowflake
    case 67: return { description: 'Mưa đông nặng', Icon: CloudRain }; // Cân nhắc thêm Snowflake
    case 71: return { description: 'Tuyết rơi nhẹ', Icon: Snowflake };
    case 73: return { description: 'Tuyết rơi vừa', Icon: Snowflake };
    case 75: return { description: 'Tuyết rơi dày', Icon: Snowflake };
    case 77: return { description: 'Hạt tuyết', Icon: Snowflake };
    case 80: return { description: 'Mưa rào nhẹ', Icon: CloudRain };
    case 81: return { description: 'Mưa rào vừa', Icon: CloudRain };
    case 82: return { description: 'Mưa rào lớn', Icon: CloudRain };
    case 85: return { description: 'Tuyết rơi nhẹ', Icon: Snowflake };
    case 86: return { description: 'Tuyết rơi dày', Icon: Snowflake };
    case 95: // Giông, sấm sét
    case 96: // Giông với mưa đá nhẹ
    case 99: // Giông với mưa đá nặng
         return { description: 'Giông, sấm sét', Icon: CloudLightning };
    default: return { description: 'Không xác định', Icon: Sun }; // Icon mặc định
  }
};


const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather }) => {
  if (!weather) {
    return (
      // Giữ nguyên giao diện loading
      <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-5 rounded-lg shadow-lg flex items-center justify-center h-full min-h-[200px]">
        Loading weather...
      </div>
    );
  }

  // --- SỬ DỤNG HÀM MỚI ---
  // Lấy mô tả và Icon tương ứng từ weatherCode
  const { description, Icon: WeatherIcon } = getWeatherDetails(weather.weatherCode);

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-GB', { // Format dd-mm-yyyy
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const dayOfWeek = currentDate.toLocaleDateString('vi-VN', { weekday: 'long' }); // Hiển thị thứ bằng tiếng Việt

  return (
    // Giữ nguyên cấu trúc HTML/Tailwind
    <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-5 rounded-lg shadow-lg h-full flex flex-col justify-between min-h-[200px]">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-2xl font-bold">{weather.city}</h2>
            <p className="text-sm opacity-90">{dayOfWeek}, {formattedDate}</p>
          </div>
          {/* Sử dụng Icon đã được xác định */}
          <WeatherIcon className="w-12 h-12 opacity-90" />
        </div>
        <div className="text-center my-4">
          <span className="text-6xl font-thin">{weather.temperature}°C</span>
          {/* Sử dụng description đã được xác định */}
          <p className="text-lg capitalize opacity-90">{description}</p>
        </div>
      </div>

      {/* Giữ nguyên phần hiển thị chi tiết gió, áp suất, độ ẩm */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm mt-4 border-t border-white/30 pt-4">
        <div className="flex items-center space-x-2">
          <Wind className="w-4 h-4 opacity-80" />
          <span>{weather.windSpeed.toFixed(1)} m/s</span>
        </div>
        <div className="flex items-center space-x-2">
          <Gauge className="w-4 h-4 opacity-80" />
          <span>{weather.pressure} hPa</span>
        </div>
        <div className="flex items-center space-x-2">
          <Droplet className="w-4 h-4 opacity-80" />
          <span>{weather.humidity}%</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;