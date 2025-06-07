"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';
import { Device, DeviceLogDTO, Page, ApiResponse } from '@/lib/types'; 
import ChartModalDevice from '@/components/dashboard/ChartModalDevice';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
    ChevronLeft, 
    ChevronRight, 
    BarChartHorizontalBig, 
    Loader2, 
    LineChart,
    Filter,
    Search,
    Calendar,
    Activity,
    Download,
    RefreshCw,
    Eye,
    Clock,
    Database,
    TrendingUp
} from 'lucide-react';

// --- Constants ---
const DEFAULT_PAGE_SIZE = 15;
const DEFAULT_SORT = 'dateTime,desc';

interface HistoryFilters {
    startTime: string | null;
    endTime: string | null;
    page: number;
    size: number;
    sort: string;
    deviceIdFilter: string | null;
    searchTerm: string;
}

export default function HistoryPage() {
    const { status } = useSession();
    const [logsData, setLogsData] = useState<Page<DeviceLogDTO> | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [filters, setFilters] = useState<HistoryFilters>({
        startTime: null,
        endTime: null,
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        sort: DEFAULT_SORT,
        deviceIdFilter: null,
        searchTerm: '',
    });

    // State cho Chart Modal
    const [selectedDeviceForChart, setSelectedDeviceForChart] = useState<Device | null>(null);
    const [isChartModalOpen, setIsChartModalOpen] = useState(false);

    // Quick filter presets
    const quickFilters = useMemo(() => [
        { label: 'Last 24 hours', hours: 24 },
        { label: 'Last 7 days', hours: 24 * 7 },
        { label: 'Last 30 days', hours: 24 * 30 },
    ], []);

    const fetchDeviceList = useCallback(async () => {
        try {
            const response = await apiClient.get<ApiResponse<Device[]>>('/devices');
            if (response.data?.data) {
                setDevices(response.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch device list for history page:", err);
            toast.error("Could not load device list.");
        }
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchDeviceList();
        }
    }, [status, fetchDeviceList]);

    useEffect(() => {
        if (status !== 'authenticated') return;

        const controller = new AbortController();
        const fetchLogs = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const params: Record<string, string | number | null> = {
                    page: filters.page,
                    size: filters.size,
                    sort: filters.sort,
                };
                if (filters.startTime) params.startTime = filters.startTime;
                if (filters.endTime) params.endTime = filters.endTime;
                if (filters.deviceIdFilter) params.deviceId = filters.deviceIdFilter;
                if (filters.searchTerm) params.search = filters.searchTerm;

                const response = await apiClient.get<ApiResponse<Page<DeviceLogDTO>>>('/devices/logs', {
                    params,
                    signal: controller.signal
                });

                if (response.data?.data) {
                    setLogsData(response.data.data);
                } else {
                    setLogsData(null);
                }
            } catch (err: unknown) {
                if ((err as Error).name === 'CanceledError') {
                    console.log('Request aborted');
                    return;
                }
                const errorMessage = "Failed to load logs. Please try again.";
                setError(errorMessage);
                setLogsData(null);
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();

        return () => {
            controller.abort();
        };
    }, [filters, status]);

    const handleFilterChange = (filterName: keyof HistoryFilters, value: string | number | null) => {
        setFilters(prev => ({ ...prev, [filterName]: value, page: 0 }));
    };
    
    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && (!logsData || newPage < logsData.totalPages)) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleQuickFilter = (hours: number) => {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
        
        setFilters(prev => ({
            ...prev,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            page: 0
        }));
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchDeviceList();
        // Trigger logs refetch by updating filters slightly
        setFilters(prev => ({ ...prev, page: prev.page }));
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const handleClearFilters = () => {
        setFilters({
            startTime: null,
            endTime: null,
            page: 0,
            size: DEFAULT_PAGE_SIZE,
            sort: DEFAULT_SORT,
            deviceIdFilter: null,
            searchTerm: '',
        });
    };

    const handleOpenChartModal = (logEntry: DeviceLogDTO) => {
        const deviceDetail = devices.find(d => d.id === logEntry.deviceId);
        setSelectedDeviceForChart(deviceDetail || null);
        setIsChartModalOpen(true);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
    };

    const getDeviceName = (deviceId: string) => {
        const device = devices.find(d => d.id === deviceId);
        return device ? device.feed : deviceId;
    };

    // Statistics
    const stats = useMemo(() => {
        if (!logsData) return null;
        
        const onCount = logsData.content.filter(log => log.state === 'ON').length;
        const offCount = logsData.content.filter(log => log.state === 'OFF').length;
        const uniqueDevices = new Set(logsData.content.map(log => log.deviceId)).size;
        
        return {
            total: logsData.totalElements,
            onCount,
            offCount,
            uniqueDevices,
            currentPage: logsData.content.length
        };
    }, [logsData]);

    if (status === 'loading' && isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen font-sans">
            <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
            
            {/* Header with animations */}
            <header className="mb-8 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Device Activity History
                        </h1>
                        <p className="text-gray-600 flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Review and analyze historical data from all your devices
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                </div>
            </header>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-slide-up">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Total Records</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
                            </div>
                            <Database className="h-8 w-8 text-indigo-500" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Active States</p>
                                <p className="text-2xl font-bold text-green-600">{stats.onCount}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Inactive States</p>
                                <p className="text-2xl font-bold text-red-600">{stats.offCount}</p>
                            </div>
                            <Activity className="h-8 w-8 text-red-500" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Unique Devices</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.uniqueDevices}</p>
                            </div>
                            <Eye className="h-8 w-8 text-purple-500" />
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in-up">
                {/* Enhanced Filter Section */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters & Search
                        </h3>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                            {showFilters ? 'Hide' : 'Show'} Advanced
                        </button>
                    </div>

                    {/* Quick Filters */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {quickFilters.map((filter, index) => (
                            <button
                                key={index}
                                onClick={() => handleQuickFilter(filter.hours)}
                                className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-all duration-200 transform hover:scale-105"
                            >
                                {filter.label}
                            </button>
                        ))}
                        <button
                            onClick={handleClearFilters}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-all duration-200"
                        >
                            Clear All
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                            value={filters.searchTerm}
                            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        />
                    </div>

                    {/* Advanced Filters */}
                    <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Database className="h-4 w-4" />
                                    Device
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-all duration-200"
                                    value={filters.deviceIdFilter || ''}
                                    onChange={(e) => handleFilterChange('deviceIdFilter', e.target.value || null)}
                                >
                                    <option value="">All Devices</option>
                                    {devices.map(device => (
                                        <option key={device.id} value={device.id}>
                                            {device.feed} ({device.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Start Time
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    value={filters.startTime ? filters.startTime.substring(0, 16) : ''}
                                    onChange={e => handleFilterChange('startTime', e.target.value ? new Date(e.target.value).toISOString() : null)}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    End Time
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    value={filters.endTime ? filters.endTime.substring(0, 16) : ''}
                                    onChange={e => handleFilterChange('endTime', e.target.value ? new Date(e.target.value).toISOString() : null)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Logs Table */}
                <div className="overflow-x-auto">
                    {isLoading && (
                        <div className="flex justify-center items-center py-16">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
                                <p className="text-gray-600">Loading history data...</p>
                            </div>
                        </div>
                    )}
                    
                    {error && (
                        <div className="m-6 p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Activity className="h-5 w-5 mr-2" />
                                Error Loading Data
                            </div>
                            <p>{error}</p>
                        </div>
                    )}
                    
                    {!isLoading && !error && (!logsData || logsData.content.length === 0) && (
                        <div className="py-20 text-center text-gray-500">
                            <BarChartHorizontalBig size={64} className="mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">No logs found</h3>
                            <p className="text-gray-400">Try adjusting your filters or search terms.</p>
                        </div>
                    )}
                    
                    {logsData && logsData.content.length > 0 && (
                        <div className="animate-fade-in">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        {[
                                            { label: 'Timestamp', icon: Clock },
                                            { label: 'Device', icon: Database },
                                            { label: 'User', icon: Eye },
                                            { label: 'Value', icon: Activity },
                                            { label: 'State', icon: TrendingUp },
                                            { label: 'Actions', icon: LineChart }
                                        ].map(({ label, icon: Icon }) => (
                                            <th key={label} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                <div className="flex items-center gap-2">
                                                    <Icon className="h-4 w-4" />
                                                    {label}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {logsData.content.map((log: DeviceLogDTO, index: number) => (
                                        <tr 
                                            key={`${log.deviceId}-${log.dateTime}-${index}`} 
                                            className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 transform hover:scale-[1.01] group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-mono">
                                                {formatDate(log.dateTime)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900">{getDeviceName(log.deviceId)}</span>
                                                    <span className="text-xs text-gray-500">{log.deviceId}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {log.user ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                                                            <span className="text-xs font-semibold text-indigo-600">
                                                                {log.user.email.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        {log.user.email}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">System</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <code className="bg-gray-100 group-hover:bg-indigo-100 px-3 py-1 rounded-full text-xs transition-colors duration-200">
                                                    {log.value}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-all duration-200 ${
                                                    log.state === 'ON' 
                                                        ? 'bg-green-100 text-green-800 group-hover:bg-green-200' 
                                                        : 'bg-red-100 text-red-800 group-hover:bg-red-200'
                                                }`}>
                                                    {log.state}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button 
                                                    onClick={() => handleOpenChartModal(log)} 
                                                    className="text-indigo-600 hover:text-indigo-900 transition-all duration-200 transform hover:scale-110 p-2 rounded-full hover:bg-indigo-50" 
                                                    title="View Chart"
                                                >
                                                    <LineChart size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                
                {/* Enhanced Pagination */}
                {logsData && logsData.totalPages > 1 && (
                    <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => handlePageChange(filters.page - 1)} 
                                    disabled={filters.page === 0 || isLoading}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 hover:shadow-md"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: Math.min(5, logsData.totalPages) }, (_, i) => {
                                        const pageNum = filters.page < 3 ? i : filters.page - 2 + i;
                                        if (pageNum >= logsData.totalPages) return null;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
                                                    pageNum === filters.page
                                                        ? 'bg-indigo-600 text-white shadow-md'
                                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                                }`}
                                            >
                                                {pageNum + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button 
                                    onClick={() => handlePageChange(filters.page + 1)} 
                                    disabled={logsData.last || isLoading}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 hover:shadow-md"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                            <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200">
                                Showing <strong>{(filters.page * filters.size) + 1}</strong> to{' '}
                                <strong>{Math.min((filters.page + 1) * filters.size, logsData.totalElements)}</strong> of{' '}
                                <strong>{logsData.totalElements.toLocaleString()}</strong> results
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Chart Modal */}
            {isChartModalOpen && (
                <ChartModalDevice
                    isOpen={isChartModalOpen}
                    onClose={() => setIsChartModalOpen(false)}
                    deviceId={selectedDeviceForChart?.id || null}
                    device={selectedDeviceForChart}
                />
            )}

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
                
                .animate-slide-up {
                    animation: slide-up 0.6s ease-out;
                }
                
                .animate-fade-in-up {
                    animation: fade-in-up 0.7s ease-out;
                }
            `}</style>
        </div>
    );
}