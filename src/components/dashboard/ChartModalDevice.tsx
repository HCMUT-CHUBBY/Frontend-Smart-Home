// components/dashboard/ChartModalDevice.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Modal from '@/components/ui/Modal'; // Đảm bảo đường dẫn đúng
import { DeviceLogDTO, ApiResponse, PageDTO, Device } from '@/lib/types'; // Import các kiểu cần thiết
import apiClient from '@/lib/apiClient';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale, // Import TimeScale
  Filler, // Import Filler nếu dùng fill: true
  TooltipItem
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Import adapter cho date/time
import { Loader2, AlertTriangle, BarChartHorizontalBig } from 'lucide-react'; // Import icons

// Đăng ký các thành phần cần thiết cho Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale, // Đăng ký TimeScale
  Title,
  Tooltip,
  Legend,
  Filler // Đăng ký Filler
);

// Interface cho props của Modal này
interface ChartModalDeviceProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string | null;
  device?: Device | null; // Optional: Truyền thông tin device để hiển thị tên/đơn vị
}

// Interface cho dữ liệu đã xử lý để vẽ chart
interface ProcessedLogData {
    dateTime: Date;          // Kiểu Date cho trục thời gian
    numericValue: number;    // Kiểu number cho giá trị trục Y
    state: string | null | undefined; // Giữ lại state nếu muốn hiển thị trong tooltip
}

const ChartModalDevice: React.FC<ChartModalDeviceProps> = ({
    isOpen, onClose, deviceId, device
}) => {
  const [logs, setLogs] = useState<ProcessedLogData[]>([]); // State lưu log đã xử lý
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h'); // State cho bộ lọc thời gian

  // Hàm fetch dữ liệu log
  const fetchLogs = useCallback(async () => {
    if (!deviceId) return;

    setIsLoading(true);
    setError(null);
    setLogs([]); // Xóa log cũ

    console.log(`Workspaceing logs for device: ${deviceId} with range: ${timeRange}`);

    let startTimeISO: string | undefined = undefined;
    const now = new Date();
    switch (timeRange) {
        case '7d':
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(now.getDate() - 7);
            startTimeISO = sevenDaysAgo.toISOString();
            break;
        case '30d':
             const thirtyDaysAgo = new Date(now);
             thirtyDaysAgo.setDate(now.getDate() - 30);
            startTimeISO = thirtyDaysAgo.toISOString();
            break;
        case '24h':
        default:
             const yesterday = new Date(now);
             yesterday.setDate(now.getDate() - 1);
            startTimeISO = yesterday.toISOString();
            break;
    }

    try {
      // API trả về PageDTO<DeviceLogDTO>
      const response = await apiClient.get<ApiResponse<PageDTO<DeviceLogDTO>>>(`/devices/${deviceId}/logs`, {
         params: {
             startTime: startTimeISO,
             size: 1000, // Lấy nhiều dữ liệu cho chart, có thể điều chỉnh hoặc thêm phân trang
             // Thêm sort nếu cần, ví dụ sort=dateTime,asc
         }
      });

       if (response.data?.data?.content) {
         // Xử lý dữ liệu trả về
         const processedLogs: ProcessedLogData[] = response.data.data.content
           .map(log => {
                const numericValue = parseFloat(log.value);
                if (!isNaN(numericValue)) { // Chỉ lấy nếu value là số
                    return {
                        dateTime: new Date(log.dateTime), // Chuyển thành Date object
                        numericValue: numericValue,
                        state: log.state
                    } as ProcessedLogData;
                }
                return null;
           })
           .filter((log): log is ProcessedLogData => log !== null) // Lọc bỏ null
           .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()); // Sắp xếp

         setLogs(processedLogs);
       } else {
         setLogs([]);
       }
    } catch (err: unknown) {
        console.error(`Error fetching logs for ${deviceId}:`, err);
        setError("Failed to load device logs. Please try again later.");
        setLogs([]);
    } finally {
        setIsLoading(false);
    }
  }, [deviceId, timeRange]); // Phụ thuộc deviceId và timeRange

  // Fetch logs khi modal mở, deviceId hoặc timeRange thay đổi
  useEffect(() => {
    if (isOpen && deviceId) {
      fetchLogs();
    } else {
      // Reset khi modal đóng hoặc không có deviceId
      setLogs([]);
      setError(null);
      // Có thể reset timeRange về mặc định nếu muốn
      // setTimeRange('24h');
    }
  }, [isOpen, deviceId, fetchLogs]);

  // Lấy tên và đơn vị dựa trên thông tin device (nếu có)
  const deviceName = device?.feed || deviceId || 'Device';
  const yAxisLabel = `Value ${device?.type === 'TEMP' ? '(°C)' : device?.type === 'LIGHT' ? '(lux)' : ''}`;
  const chartTitle = `Log History: ${deviceName}`;
  const datasetLabel = `${deviceName} Value`;
  const pointColor = device?.type === 'TEMP' ? 'rgb(59, 130, 246)' : 'rgb(234, 179, 8)'; // blue-600 or amber-500
  const areaColor = device?.type === 'TEMP' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(234, 179, 8, 0.2)';

  // Chuẩn bị dữ liệu cho Chart.js (dùng useMemo để tối ưu)
  const chartData = useMemo(() => ({
    // labels không cần thiết khi dùng time scale và truyền data dạng {x, y}
    datasets: [
      {
        label: datasetLabel,
        data: logs.map(log => ({ x: log.dateTime, y: log.numericValue })), // Dữ liệu {x: Date, y: number}
        borderColor: pointColor,
        backgroundColor: areaColor,
        tension: 0.2,
        pointRadius: logs.length > 150 ? 0 : 2, // Ẩn điểm nếu quá nhiều
        pointHoverRadius: 5,
        fill: true, // Tô màu vùng dưới
        borderWidth: 1.5,
      },
    ],
  }), [logs, datasetLabel, pointColor, areaColor]);

  // Cấu hình cho Chart.js (dùng useMemo để tối ưu)
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
          display: false // Ẩn legend nếu chỉ có 1 dataset
      },
      title: {
          display: true,
          text: chartTitle,
          font: { size: 16 }
      },
      tooltip: {
          mode: 'index' as const, // Hiển thị tooltip cho tất cả dataset tại điểm index đó
          intersect: false, // Hiển thị tooltip khi hover gần điểm
          callbacks: {
              label: function(context: TooltipItem<'line'>) { // Dùng TooltipItem
                  let label = context.dataset.label || '';
                  if (label) { label += ': '; }
                  if (context.parsed.y !== null) {
                      label += context.parsed.y.toFixed(1); // Làm tròn 1 chữ số thập phân
                      // Thêm đơn vị nếu cần
                      if (device?.type === 'TEMP') label += ' °C';
                      else if (device?.type === 'LIGHT') label += ' lux';
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
          unit: 'hour' as const, // Điều chỉnh unit tự động tốt hơn
          tooltipFormat: 'MMM d, yyyy HH:mm:ss', // Format chi tiết cho tooltip
          displayFormats: {
             // Các format hiển thị trên trục X
             millisecond: 'HH:mm:ss.SSS',
             second: 'HH:mm:ss',
             minute: 'HH:mm',
             hour: 'HH:mm', // Chỉ hiển thị giờ:phút
             day: 'MMM d',
             week: 'MMM d',
             month: 'MMM yyyy',
             quarter: 'qqq yyyy',
             year: 'yyyy',
          }
        },
        title: { display: true, text: 'Time' },
        grid: { display: false }
      },
      y: {
        title: { display: true, text: yAxisLabel },
        beginAtZero: false, // Cho phép trục Y không bắt đầu từ 0
        grid: { color: '#e5e7eb' }, // Màu lưới trục Y (gray-200)
        ticks: {
             // Format số trên trục Y nếu cần
            // callback: function(value) { return value + ' đơn vị'; }
        }
      }
    },
  }), [chartTitle, yAxisLabel, device]); // Phụ thuộc vào các giá trị này


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Device Logs: ${device?.feed || deviceId}`}>
      {/* Thanh điều khiển (Ví dụ: Bộ lọc thời gian) */}
      <div className="px-4 pt-4 pb-2 flex flex-col sm:flex-row justify-end items-center space-y-2 sm:space-y-0 sm:space-x-2">
         <label htmlFor="timeRangeSelect" className="text-sm font-medium text-gray-600">View:</label>
         <select
             id="timeRangeSelect"
             value={timeRange}
             onChange={(e) => setTimeRange(e.target.value)}
             className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-auto p-1.5"
             disabled={isLoading}
         >
             <option value="24h">Last 24 hours</option>
             <option value="7d">Last 7 days</option>
             <option value="30d">Last 30 days</option>
             {/* <option value="custom">Custom Range</option> */}
         </select>
         {/* Thêm Date Pickers cho Custom Range ở đây nếu cần */}
      </div>

      {/* Phần thân modal */}
      <div className="p-4 min-h-[400px] flex flex-col"> {/* Tailwind: Padding, chiều cao tối thiểu, layout cột */}
        {isLoading && (
          <div className="flex-grow flex flex-col items-center justify-center text-gray-500">
             <Loader2 size={32} className="animate-spin mb-2" /> {/* Tailwind: Icon xoay */}
             <span>Loading logs...</span>
          </div>
        )}
        {error && !isLoading && (
           <div className="flex-grow flex flex-col items-center justify-center text-red-600">
               <AlertTriangle size={32} className="mb-2" /> {/* Tailwind: Icon cảnh báo */}
               <span>{error}</span>
            </div>
        )}
        {!isLoading && !error && logs.length === 0 && (
          <div className="flex-grow flex flex-col items-center justify-center text-gray-500 text-center px-4">
             <BarChartHorizontalBig size={32} className="mb-2 text-gray-400" /> {/* Tailwind: Icon chart */}
             <span>No numeric log data available for the selected period.</span>
             <span className="text-xs mt-1">(Logs like ON/OFF state changes are not shown in the chart)</span>
          </div>
        )}
        {/* Container cho chart */}
        {!isLoading && !error && logs.length > 0 && (
          // Tailwind: Relative positioning, cho phép chart fill, chiều cao cố định, chiều rộng full
          <div className="relative flex-grow h-[350px] w-full">
            {/* Chart component */}
            <Line options={chartOptions} data={chartData} />
          </div>
        )}
        {/* Pagination controls (nếu có) */}
         {/* <div className="flex justify-center mt-4"> ... </div> */}
      </div>
    </Modal>
  );
};

export default ChartModalDevice;