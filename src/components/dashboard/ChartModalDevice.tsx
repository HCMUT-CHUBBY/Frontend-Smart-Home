// components/dashboard/ChartModalDevice.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import { DeviceLogDTO, ApiResponse, PageDTO, Device } from '@/lib/types';
import apiClient from '@/lib/apiClient';
import { Line } from 'react-chartjs-2';
import axios from 'axios'; // Đảm bảo axios đã được import
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
  TooltipItem
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Loader2, AlertTriangle, BarChartHorizontalBig } from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, TimeScale, Title, Tooltip, Legend, Filler
);

interface ChartModalDeviceProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string | null;
  device?: Device | null;
}

interface ProcessedLogData {
  dateTime: Date;
  numericValue: number;
  state?: string | null | undefined; // Giữ lại string | null | undefined từ type gốc
}

const ChartModalDevice: React.FC<ChartModalDeviceProps> = ({
  isOpen, onClose, deviceId, device
}) => {
  const [logs, setLogs] = useState<ProcessedLogData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h'); // Mặc định 24 giờ

  const fetchLogs = useCallback(async () => {
    if (!deviceId) return;

    setIsLoading(true);
    setError(null);
    // setLogs([]); // Không xóa logs ngay, chỉ xóa khi fetch thành công hoặc lỗi, để tránh chớp màn hình

    console.log(`[ChartModal] Fetching historical logs for device: ${deviceId} with range: ${timeRange}`); // Sửa typo "Workspaceing"
    const now = new Date();
    let startTimeDateObject: Date; 

    switch (timeRange) {
      case '1h': // <<< THÊM CASE MỚI CHO 1 GIỜ
        startTimeDateObject = new Date(now.getTime() - (1 * 60 * 60 * 1000)); // 1 giờ trước
        break;
      case '7d':
        startTimeDateObject = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        // Hoặc nếu muốn lấy từ 00:00 của 7 ngày trước:
        // const sevenDaysAgo = new Date(now);
        // sevenDaysAgo.setDate(now.getDate() - 7);
        // sevenDaysAgo.setHours(0,0,0,0);
        // startTimeDateObject = sevenDaysAgo;
        break;
      case '30d':
        startTimeDateObject = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        // Hoặc nếu muốn lấy từ 00:00 của 30 ngày trước:
        // const thirtyDaysAgo = new Date(now);
        // thirtyDaysAgo.setDate(now.getDate() - 30);
        // thirtyDaysAgo.setHours(0,0,0,0);
        // startTimeDateObject = thirtyDaysAgo;
        break;
      case '24h':
      default:
        startTimeDateObject = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 giờ trước
        break;
    }
    const startTimeISO = startTimeDateObject.toISOString();
    const endTimeISO = now.toISOString();

    try {
      const params: {
        startTime: string;
        endTime: string;
        page: number;
        size: number;
        sort?: string; 
      } = {
        startTime: startTimeISO,
        endTime: endTimeISO,
        page: 0,    
        size: 1000, 
        sort: 'dateTime,asc', // Giữ lại nếu backend hỗ trợ, nếu không thì bỏ và sort ở client
      };
      
      // Nếu backend không hỗ trợ sort, bạn có thể xóa dòng sort ở trên:
      // delete params.sort; 

      console.log('[ChartModal] API Request Params:', params);
      const response = await apiClient.get<ApiResponse<PageDTO<DeviceLogDTO>>>(`/devices/${deviceId}/logs`, { params });
      console.log('[ChartModal] API Response:', response);

      if (response.data?.data?.content) {
        const validRawLogs = response.data.data.content.filter(log => {
          const numericValue = parseFloat(log.value);
          return !isNaN(numericValue);
        });

        let processedHistoricalLogs: ProcessedLogData[] = validRawLogs
          .map((log): ProcessedLogData => {
            return {
              dateTime: new Date(log.dateTime),
              numericValue: parseFloat(log.value), 
              state: log.state
            };
          });
        
        // Sắp xếp ở client nếu API không sort hoặc để đảm bảo
        processedHistoricalLogs = processedHistoricalLogs.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
        
        console.log('[ChartModal] Processed historical logs for chart:', processedHistoricalLogs);
        setLogs(processedHistoricalLogs);
        if (processedHistoricalLogs.length === 0) {
            console.log('[ChartModal] No numeric data found for the selected range.');
        }
      } else {
        console.log('[ChartModal] No content in API response data.');
        setLogs([]);
      }
    } catch (err: unknown) {
      console.error(`[ChartModal] Error fetching historical logs for ${deviceId}:`, err);
      let errorMessage = "Failed to load device logs.";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || "Failed to load logs.";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
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
      setLogs([]);
      setError(null);
      // setTimeRange('24h'); // Cân nhắc reset timeRange khi đóng modal
    }
  }, [isOpen, deviceId, fetchLogs]);


  const deviceName = device?.feed || deviceId || 'Device';
  const yAxisLabel = `Value ${device?.type === 'TEMP' ? '(°C)' : device?.type === 'LIGHT' ? '(lux)' : ''}`;
  const chartTitle = `Log History: ${deviceName}`;
  const datasetLabel = `${deviceName} Value`;
  const pointColor = device?.type === 'TEMP' ? 'rgb(59, 130, 246)' : 'rgb(234, 179, 8)';
  const areaColor = device?.type === 'TEMP' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(234, 179, 8, 0.2)';

  const chartData = useMemo(() => ({
    datasets: [
      {
        label: datasetLabel,
        data: logs.map(log => ({ x: log.dateTime, y: log.numericValue })),
        borderColor: pointColor,
        backgroundColor: areaColor,
        tension: 0.2,
        pointRadius: logs.length > 150 ? 0 : logs.length > 75 ? 1 : 2, // Điều chỉnh pointRadius
        pointHoverRadius: 5,
        fill: true,
        borderWidth: 1.5,
      },
    ],
  }), [logs, datasetLabel, pointColor, areaColor]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 0, 
    },
    plugins: { 
        legend: { display: false }, 
        title: { display: true, text: chartTitle, font: { size: 16 } },
        tooltip: {
            mode: 'index' as const,
            intersect: false,
            callbacks: {
              label: function(context: TooltipItem<'line'>) {
                let label = context.dataset.label || '';
                if (label) { label += ': '; }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(device?.type === 'TEMP' ? 1 : 0); 
                  if (device?.type === 'TEMP') label += ' °C';
                  else if (device?.type === 'LIGHT') label += ' lux';
                }
                // Lấy thêm state nếu có
                const dataIndex = context.dataIndex;
                if (logs[dataIndex] && logs[dataIndex].state) {
                    label += ` (State: ${logs[dataIndex].state})`;
                }
                return label;
              }
            }
        }
    },
    scales: { 
        x: {
            type: 'time' as const,
            time: {
              unit: timeRange === '1h' ? 'minute' : timeRange === '24h' ? 'hour' : 'day' as 'minute' | 'hour' | 'day', // Điều chỉnh unit dựa trên timeRange
              tooltipFormat: 'MMM d, yyyy HH:mm:ss', 
              displayFormats: { 
                  millisecond: 'HH:mm:ss.SSS', 
                  second: 'HH:mm:ss', 
                  minute: 'HH:mm', 
                  hour: timeRange === '24h' || timeRange === '1h' ? 'HH:mm' : 'MMM d HH:mm', // Hiển thị khác nhau cho các range
                  day: 'MMM d', 
                  week: 'MMM d', 
                  month: 'MMM yyyy', 
                  quarter: 'QQQ yyyy', 
                  year: 'yyyy',
              }
            },
            title: { display: true, text: 'Time' },
            grid: { display: false }
        },
        y: {
            title: { display: true, text: yAxisLabel },
            beginAtZero: false, 
            grid: { color: '#e5e7eb' },
        }
    },
  }), [chartTitle, yAxisLabel, device, logs, timeRange]); // Thêm timeRange vào dependencies của chartOptions

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Device Logs: ${device?.feed || deviceId}`}>
      <div className="px-4 pt-4 pb-2 flex flex-col sm:flex-row justify-end items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <label htmlFor="timeRangeSelect" className="text-sm font-medium text-gray-600">View:</label>
        <select
            id="timeRangeSelect"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-auto p-1.5"
            disabled={isLoading}
        >
            {/* <<< THÊM OPTION 1 GIỜ >>> */}
            <option value="1h">Last 1 hour</option> 
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option> {/* <<< SỬA VALUE TỪ "1h" THÀNH "7d" >>> */}
            <option value="30d">Last 30 days</option>
        </select>
      </div>

      <div className="p-4 min-h-[400px] flex flex-col">
        {isLoading && logs.length === 0 && ( 
            <div className="flex-grow flex flex-col items-center justify-center text-gray-500">
                <Loader2 size={32} className="animate-spin mb-2" />
                <span>Loading historical logs...</span>
            </div>
        )}
        {error && !isLoading && (
            <div className="flex-grow flex flex-col items-center justify-center text-red-600">
                <AlertTriangle size={32} className="mb-2" />
                <span>{error}</span>
            </div>
        )}
        {!isLoading && !error && logs.length === 0 && (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-500 text-center px-4">
                <BarChartHorizontalBig size={32} className="mb-2 text-gray-400" />
                <span>No numeric log data available for the selected period.</span>
                <span className="text-xs mt-1">(Ensure device actions are performed via this system to generate logs, or adjust time range.)</span>
            </div>
        )}
        
        {(!error || logs.length > 0) && ( 
          <div className="relative flex-grow h-[350px] w-full">
            {(isLoading && logs.length > 0) && <div className="absolute top-2 right-2 text-xs text-gray-400 animate-pulse">Updating...</div>}
            <Line options={chartOptions} data={chartData} />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ChartModalDevice;