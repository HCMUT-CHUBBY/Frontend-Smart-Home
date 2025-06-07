import React from 'react';
import { 
  Sun, Moon, Cloud, CloudSun, CloudMoon, CloudFog, CloudDrizzle, 
  CloudRain, CloudLightning, Snowflake, Wind, Gauge, Droplet,
  MapPin, RefreshCw, AlertCircle
} from 'lucide-react';
import { WeatherInfo } from '@/lib/types';

// --- CÁC HÀM HELPER CHO VIỆC HIỂN THỊ (GIỮ NGUYÊN) ---

const getWeatherIcon = (iconCode: string | undefined): React.ElementType => {
  if (!iconCode) return CloudFog;
  switch (iconCode) {
    case '01d': return Sun;       case '01n': return Moon;
    case '02d': return CloudSun;  case '02n': return CloudMoon;
    case '03d': case '03n': return Cloud;
    case '04d': case '04n': return Cloud;
    case '09d': case '09n': return CloudDrizzle;
    case '10d': case '10n': return CloudRain;
    case '11d': case '11n': return CloudLightning;
    case '13d': case '13n': return Snowflake;
    case '50d': case '50n': return CloudFog;
    default: return CloudFog;
  }
};

const getWeatherGradient = (iconCode: string | undefined): string => {
  if (!iconCode) return 'from-slate-400 to-slate-600';
  const isDayTime = iconCode.endsWith('d');
  switch (iconCode.substring(0, 2)) {
    case '01': return isDayTime ? 'from-amber-300 via-orange-400 to-pink-500' : 'from-indigo-800 via-purple-900 to-pink-900';
    case '02': return isDayTime ? 'from-sky-400 to-cyan-400' : 'from-slate-700 to-indigo-900';
    case '03': case '04': return 'from-slate-500 to-slate-700';
    case '09': case '10': return 'from-blue-600 to-gray-800';
    case '11': return 'from-purple-800 to-black';
    case '13': return 'from-sky-200 to-blue-200';
    case '50': return 'from-slate-400 to-slate-600';
    default: return 'from-cyan-500 to-blue-500';
  }
};



// --- COMPONENT CHÍNH ---

// 1. Props của Widget giờ sẽ nhận state từ cha
interface WeatherWidgetProps {
  weather: WeatherInfo | null;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ 
  weather, 
  isLoading, 
  error, 
  onRefresh 
}) => {
  
  // 2. Component không còn state nội bộ hay logic gọi API nữa.
  // Mọi thứ đều được điều khiển bởi props từ DashboardPage.
  
  // --- Giao diện (JSX) ---

  // Trạng thái Đang tải...
  if (isLoading) {
    return (
      <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 to-slate-300 rounded-3xl shadow-lg p-8 h-full min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw size={32} className="text-slate-500 mx-auto animate-spin" />
          <p className="text-slate-600 font-semibold">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Trạng thái Lỗi
  if (error) {
    return (
      <div className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-red-100 to-red-300 rounded-3xl shadow-lg p-8 h-full min-h-[400px]">
        <AlertCircle size={40} className="text-red-500 mb-4" />
        <p className="text-red-700 font-semibold text-center">{error}</p>
        {onRefresh && (
          <button onClick={onRefresh} className="mt-4 flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
            <RefreshCw size={16} /> Thử lại
          </button>
        )}
      </div>
    );
  }

  // Trạng thái không có dữ liệu
  if (!weather) {
    return (
      <div className="flex items-center justify-center text-slate-500 h-full min-h-[400px] bg-slate-100 rounded-3xl">
        Không có dữ liệu thời tiết.
      </div>
    );
  }

  // Giao diện chính khi có dữ liệu
  const WeatherIcon = getWeatherIcon(weather.iconCode);
  const gradientClasses = getWeatherGradient(weather.iconCode);
  const formattedDescription = weather.description.charAt(0).toUpperCase() + weather.description.slice(1);

  return (
    <div className={`relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br ${gradientClasses} min-h-[400px] p-8 text-white hover:shadow-3xl transition-all duration-500 group`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm"></div>
      
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm"><MapPin size={20} /></div>
          <div>
            <h2 className="text-2xl font-bold">{weather.city}</h2>
            <p className="text-white/70 text-sm">{weather.iconCode.endsWith('d') ? 'Ban ngày' : 'Ban đêm'}</p>
          </div>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} className="p-2 bg-white/20 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-colors" title="Làm mới">
            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
        )}
      </div>

      <div className="relative z-10 text-center mb-8">
        <div className="flex items-center justify-center mb-6">
          <div className="relative group-hover:scale-110 transition-transform duration-300">
            <WeatherIcon size={100} className="text-white drop-shadow-2xl" />
            <div className="absolute inset-0 blur-2xl opacity-40 bg-white rounded-full scale-150 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-7xl font-bold drop-shadow-lg tracking-tight">{weather.temperature}°</div>
          <p className="text-xl text-white/90 font-medium">{formattedDescription}</p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-4">
        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-center hover:bg-white/30 transition-all duration-300">
          <Droplet size={24} className="mx-auto mb-2 text-blue-200" />
          <div className="text-2xl font-bold">{weather.humidity}%</div>
          <div className="text-xs text-white/70 font-medium uppercase">Độ ẩm</div>
        </div>
        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-center hover:bg-white/30 transition-all duration-300">
          <Wind size={24} className="mx-auto mb-2 text-cyan-200" />
          <div className="text-2xl font-bold">{weather.windSpeed}</div>
          <div className="text-xs text-white/70 font-medium uppercase">m/s</div>
        </div>
        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-center hover:bg-white/30 transition-all duration-300">
          <Gauge size={24} className="mx-auto mb-2 text-amber-200" />
          <div className="text-2xl font-bold">{weather.pressure}</div>
          <div className="text-xs text-white/70 font-medium uppercase">hPa</div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;