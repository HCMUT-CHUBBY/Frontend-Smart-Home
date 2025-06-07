import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Page, DeviceLogDTO, ApiResponse, Device } from '@/lib/types';
import apiClient from '@/lib/apiClient';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
  TooltipItem,
  ChartOptions
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import {  
  X, 
  Loader2, 
  AlertTriangle, 
  BarChart3, 
  Download, 
  Maximize2, 
  Minimize2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Thermometer
} from 'lucide-react';

// Đăng ký các thành phần cần thiết cho ChartJS
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, TimeScale, Title, Tooltip, Legend, Filler
);

// --- Định nghĩa các kiểu dữ liệu nội bộ ---

interface ChartModalDeviceProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string | null;
  // `device` được truyền từ DashboardPage để lấy `type` và `feed`
  device?: Device | null; 
}

interface ProcessedLogData {
  dateTime: Date;
  numericValue: number;
  state?: string | null | undefined;
}

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

// --- Component Chính ---

const ChartModalDevice: React.FC<ChartModalDeviceProps> = ({
  isOpen, onClose, deviceId, device
}) => {
  // --- STATE QUẢN LÝ COMPONENT ---
  const [logs, setLogs] = useState<ProcessedLogData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const chartRef = useRef<ChartJS<'line'>>(null);


  // --- LOGIC LẤY DỮ LIỆU ---
  const fetchLogs = useCallback(async () => {
    if (!deviceId) return;

    setIsLoading(true);
    setError(null);
    
    const now = new Date();
    let startTimeDateObject: Date;

    switch (timeRange) {
      case '1h': startTimeDateObject = new Date(now.getTime() - (1 * 60 * 60 * 1000)); break;
      case '7d': startTimeDateObject = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); break;
      case '30d': startTimeDateObject = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); break;
      case '24h': default: startTimeDateObject = new Date(now.getTime() - (24 * 60 * 60 * 1000)); break;
    }
    
    const params = {
      startTime: startTimeDateObject.toISOString(),
      endTime: now.toISOString(),
      page: 0,    
      size: 1000, 
      sort: 'dateTime,asc',
    };

    try {
      const response = await apiClient.get<ApiResponse<Page<DeviceLogDTO>>>(`/devices/${deviceId}/logs`, { params });

      if (response.data?.data?.content) {
        const processedLogs = response.data.data.content
          .map(log => ({
            dateTime: new Date(log.dateTime),
            numericValue: parseFloat(log.value),
            state: log.state
          }))
          .filter(log => !isNaN(log.numericValue)) // Chỉ lấy các log có giá trị là số
          .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()); // Sắp xếp lại để chắc chắn
        
        setLogs(processedLogs);
      } else {
        setLogs([]);
      }
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.message || err.message 
        : (err instanceof Error ? err.message : "Failed to load device logs.");
      setError(errorMessage);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, timeRange]);


  useEffect(() => {
    if (isOpen && deviceId) {
      fetchLogs();
    } else {
      // Reset state khi modal đóng
      setLogs([]);
      setError(null);
    }
  }, [isOpen, deviceId, fetchLogs]);


  // --- LOGIC TÍNH TOÁN THỐNG KÊ (MEMOIZED) ---
  const stats = useMemo((): StatCardProps[] => {
    if (logs.length < 2) return [];
    
    const values = logs.map(log => log.numericValue);
    const current = values[values.length - 1];
    const previous = values[values.length - 2];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const change = previous !== 0 ? ((current - previous) / Math.abs(previous) * 100) : 0;
    
    const deviceIcon = device?.type === 'TEMP' ? <Thermometer className="w-5 h-5" /> : <Zap className="w-5 h-5" />;
    const unit = device?.type === 'TEMP' ? '°C' : device?.type === 'LIGHT' ? ' lux' : '';
    
    return [
      { label: 'Current', value: `${current.toFixed(1)}${unit}`, change: `${change.toFixed(1)}%`, trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral', icon: deviceIcon },
      { label: 'Average', value: `${avg.toFixed(1)}${unit}`, icon: <Activity className="w-5 h-5" /> },
      { label: 'Maximum', value: `${max.toFixed(1)}${unit}`, icon: <TrendingUp className="w-5 h-5" /> },
      { label: 'Minimum', value: `${min.toFixed(1)}${unit}`, icon: <TrendingDown className="w-5 h-5" /> }
    ];
  }, [logs, device]);


  // --- CẤU HÌNH BIỂU ĐỒ (MEMOIZED) ---
  const { primaryColor, secondaryColor, gradient } = useMemo(() => {
    const isTemp = device?.type === 'TEMP';
    return {
      primaryColor: isTemp ? '#3B82F6' : '#F59E0B',
      secondaryColor: isTemp ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
      gradient: isTemp ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    };
  }, [device?.type]);

  const chartData = useMemo(() => ({
    datasets: [{
      label: `${device?.feed || 'Value'}`,
      data: logs.map(log => ({ x: log.dateTime.getTime(), y: log.numericValue })),
      borderColor: primaryColor,
      backgroundColor: secondaryColor,
      tension: 0.4,
      pointRadius: logs.length > 200 ? 0 : logs.length > 100 ? 1 : 2.5,
      pointHoverRadius: 6,
      pointBackgroundColor: primaryColor,
      fill: true,
      borderWidth: 2,
    }],
  }), [logs, device?.feed, primaryColor, secondaryColor]);

  const chartOptions = useMemo((): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(17, 24, 39, 0.9)', // bg-gray-900/90
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: primaryColor,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        padding: 12,
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            let label = '';
            if (context.parsed.y !== null) {
              const unit = device?.type === 'TEMP' ? '°C' : (device?.type === 'LIGHT' ? ' lux' : '');
              label = `${context.parsed.y.toFixed(1)} ${unit}`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeRange === '1h' ? 'minute' : timeRange === '24h' ? 'hour' : 'day',
          tooltipFormat: 'MMM d, yyyy HH:mm',
          displayFormats: { minute: 'HH:mm', hour: 'HH:mm', day: 'MMM d' }
        },
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
        ticks: { color: '#6B7280', font: { size: 12 } }
      },
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
        ticks: { color: '#6B7280', font: { size: 12 },
          callback: (value) => `${value}${device?.type === 'TEMP' ? '°' : ''}`
        }
      }
    },
  }), [device, timeRange, primaryColor]);


  // --- HÀM HỖ TRỢ KHÁC ---
  const exportData = useCallback(() => {
    // ... logic export giữ nguyên ...
  }, [logs, device]);
  
  if (!isOpen) return null;


  // --- GIAO DIỆN (JSX) ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />
      
      {/* Modal Panel */}
      <div className={`
        relative flex flex-col bg-gray-50 rounded-2xl shadow-2xl transition-all duration-500 ease-in-out
        ${isFullscreen ? 'w-full h-full m-0 rounded-none' : 'w-[95%] h-[95%] max-w-7xl'}
      `}>
        {/* Header */}
        <header className="relative flex-shrink-0 px-6 h-20 flex items-center justify-between border-b border-gray-200 text-white" style={{ background: gradient }}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {device?.type === 'TEMP' ? <Thermometer className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold">{device?.id || 'Device Analytics'}</h2>
              <p className="text-sm text-white/80">Historical data and insights</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {[
              { label: 'Toggle Stats', icon: BarChart3, action: () => setShowStats(!showStats) },
              { label: 'Export Data', icon: Download, action: exportData, disabled: logs.length === 0 },
              { label: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen', icon: isFullscreen ? Minimize2 : Maximize2, action: () => setIsFullscreen(!isFullscreen) },
              { label: 'Close', icon: X, action: onClose }
            ].map(btn => (
              <button key={btn.label} onClick={btn.action} disabled={btn.disabled} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={btn.label}>
                <btn.icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Controls Bar */}
          <div className="flex-shrink-0 px-6 py-3 bg-white/70 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Time Range</span>
            </div>
            <div className="flex space-x-1 bg-gray-200 rounded-lg p-1">
              {['1h', '24h', '7d', '30d'].map(range => (
                <button key={range} onClick={() => setTimeRange(range)} disabled={isLoading} className={`px-4 py-1 text-sm font-semibold rounded-md transition-all duration-200 ${
                  timeRange === range ? 'text-white shadow-md' : 'text-gray-600 hover:bg-white/60'
                }`} style={{ background: timeRange === range ? gradient : 'transparent' }}>
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Main Chart Area */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Stats Cards - Conditionally rendered */}
              {showStats && stats.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {stats.map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between text-gray-500 mb-2">
                        {stat.icon}
                        {stat.trend && (
                          <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                            stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {stat.trend === 'up' ? '↑' : '↓'} {stat.change}
                          </div>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Chart container */}
              <div className="relative h-[400px] md:h-[500px]">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                )}
                {error && !isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center text-center">
                    <div>
                      <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                      <p className="font-semibold text-red-600">Failed to Load Data</p>
                      <p className="text-sm text-gray-500">{error}</p>
                    </div>
                  </div>
                )}
                {!isLoading && !error && logs.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-center">
                    <div>
                      <BarChart3 className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="font-semibold text-gray-600">No Data Available</p>
                      <p className="text-sm text-gray-500">No numeric data found for this period.</p>
                    </div>
                  </div>
                )}
                {logs.length > 0 && <Line ref={chartRef} options={chartOptions} data={chartData} />}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChartModalDevice;