// components/dashboard/WeatherWidget.tsx
import React from 'react';
import { WeatherInfo } from '@/lib/types'; // Đảm bảo import WeatherInfo đã cập nhật
// Import thêm các icon cần thiết từ Lucide
import { Sun, Moon, Cloud, CloudSun, CloudMoon, CloudFog, CloudDrizzle, CloudRain, CloudLightning, Snowflake, Wind, Gauge, Droplet, Thermometer } from 'lucide-react';
import styles from '@/styles/Weather.module.scss'; // Import SCSS module (Sẽ tạo ở bước sau)

interface WeatherWidgetProps {
  weather: WeatherInfo | null;
}

// --- HÀM MỚI: Map mã icon OpenWeatherMap sang Lucide Icon ---
const getWeatherIcon = (iconCode: string | undefined): React.ElementType => {
  if (!iconCode) return CloudFog; // Icon mặc định nếu không có mã

  // Tham khảo mã icon: https://openweathermap.org/weather-conditions#Icon-list
  switch (iconCode) {
    case '01d': return Sun;          // clear sky day
    case '01n': return Moon;         // clear sky night
    case '02d': return CloudSun;     // few clouds day
    case '02n': return CloudMoon;    // few clouds night
    case '03d':
    case '03n': return Cloud;        // scattered clouds
    case '04d':
    case '04n': return Cloud;        // broken clouds (dùng chung icon Cloud)
    case '09d':
    case '09n': return CloudDrizzle; // shower rain (có thể dùng CloudRain)
    case '10d':
    case '10n': return CloudRain;    // rain
    case '11d':
    case '11n': return CloudLightning; // thunderstorm
    case '13d':
    case '13n': return Snowflake;    // snow
    case '50d':
    case '50n': return CloudFog;     // mist
    default: return CloudFog;       // Mặc định
  }
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather }) => {
  if (!weather) {
    // Giao diện khi không có dữ liệu hoặc đang tải
    return (
      <div className={styles.weatherWidget}>
        <div className={styles.loading}>
          <p>Loading weather data...</p>
          {/* Có thể thêm spinner ở đây */}
        </div>
      </div>
    );
  }

  const WeatherIcon = getWeatherIcon(weather.iconCode);
  const formattedDescription = weather.description.charAt(0).toUpperCase() + weather.description.slice(1); // Viết hoa chữ cái đầu

  return (
    // Sử dụng class từ SCSS module
    <div className={styles.weatherWidget}>
      {/* Phần thông tin chính */}
      <div className={styles.mainInfo}>
        <div className={styles.location}>
          <span className={styles.city}>{weather.city}</span>
          {/* Có thể thêm tên quốc gia nếu cần */}
        </div>
        <div className={styles.tempAndIcon}>
          <WeatherIcon className={styles.weatherIcon} />
          <span className={styles.temperature}>{weather.temperature}°C</span>
        </div>
        <p className={styles.description}>{formattedDescription}</p>
        {/* <p className={styles.feelsLike}>Cảm giác như: {weather.feelsLike}°C</p> */}
      </div>

      {/* Phần chi tiết */}
      <div className={styles.details}>
        <div className={styles.detailItem}>
          <Droplet size={16} className={styles.detailIcon} />
          <span>{weather.humidity}%</span>
          <span className={styles.detailLabel}>Độ ẩm</span>
        </div>
        <div className={styles.detailItem}>
          <Wind size={16} className={styles.detailIcon} />
          <span>{weather.windSpeed} m/s</span>
           <span className={styles.detailLabel}>Gió</span>
        </div>
        <div className={styles.detailItem}>
          <Gauge size={16} className={styles.detailIcon} />
          <span>{weather.pressure} hPa</span>
           <span className={styles.detailLabel}>Áp suất</span>
        </div>
         {/* <div className={styles.detailItem}>
          <Thermometer size={16} className={styles.detailIcon} />
          <span>{weather.feelsLike}°C</span>
          <span className={styles.detailLabel}>Cảm nhận</span>
        </div> */}
      </div>
    </div>
  );
};

export default WeatherWidget;