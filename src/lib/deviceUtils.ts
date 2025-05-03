// lib/deviceUtils.ts
import { DeviceFromAPI, Device } from './types'; // Đảm bảo import đúng interface DeviceFromAPI và Device
// Định nghĩa kiểu trả về cho hàm suy luận
interface DeviceTypeInfo {
    type: 'TEMP' | 'LIGHT';
    isSensor: boolean;
}

// Hàm suy luận type và isSensor từ ID
export function getDeviceTypeInfo(deviceId: string | undefined | null): DeviceTypeInfo {
    // Giá trị mặc định nếu không có ID hoặc không khớp mẫu
    const defaultInfo: DeviceTypeInfo = { type: 'LIGHT', isSensor: false }; // Hoặc chọn default khác

    if (!deviceId) {
        return defaultInfo;
    }

    const idUpper = deviceId.toUpperCase();

    // Quy tắc suy luận (DỰA TRÊN VÍ DỤ ID CỦA BẠN)
    // Cần điều chỉnh các chuỗi này cho chính xác với quy tắc ID thực tế
    if (idUpper.startsWith('SENSOR_TEMP_')) {
        return { type: 'TEMP', isSensor: true };
    } else if (idUpper.startsWith('SENSOR_LIGHT_')) {
        return { type: 'LIGHT', isSensor: true };
    } else if (idUpper.startsWith('DEVICE_LIGHT_') || idUpper.startsWith('ACTUATOR_LIGHT_')) {
        return { type: 'LIGHT', isSensor: false };
    } else if (idUpper.startsWith('DEVICE_TEMP_') || idUpper.startsWith('ACTUATOR_TEMP_')) {
        return { type: 'TEMP', isSensor: false };
    }
    // Thêm các quy tắc khác nếu cần

    // Nếu không khớp quy tắc nào, trả về mặc định hoặc ném lỗi
    console.warn(`Could not determine device type/sensor status from ID: ${deviceId}. Returning default.`);
    return defaultInfo;
}

// Hàm xử lý dữ liệu API trả về để thêm type/isSensor
export function processDeviceData(deviceData: DeviceFromAPI): Device {
    const { type, isSensor } = getDeviceTypeInfo(deviceData.id);
    return {
        ...deviceData,
        type,
        isSensor,
    };
}

export function processDeviceList(deviceList: DeviceFromAPI[]): Device[] {
    if (!deviceList) return [];
    return deviceList.map(processDeviceData);
}

// Hàm suy luận DeviceCategory từ type và isSensor (dùng cho modal)
export function getDeviceCategory(type: 'TEMP' | 'LIGHT', isSensor: boolean): DeviceCategory {
     if (type === 'TEMP') {
        return isSensor ? 'TEMP_SENSOR' : 'TEMP_ACTUATOR';
     } else { // type === 'LIGHT'
        return isSensor ? 'LIGHT_SENSOR' : 'LIGHT_ACTUATOR';
     }
}

// Kiểu DeviceCategory (có thể đặt ở types.ts hoặc ở đây nếu chỉ dùng cho modal)
export type DeviceCategory = 'LIGHT_SENSOR' | 'TEMP_SENSOR' | 'LIGHT_ACTUATOR' | 'TEMP_ACTUATOR';