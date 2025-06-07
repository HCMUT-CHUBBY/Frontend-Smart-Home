import { useState, useEffect } from 'react';

/**
 * Một custom hook để "trì hoãn" (debounce) một giá trị.
 * Nó chỉ trả về giá trị mới nhất sau khi một khoảng thời gian (delay) đã trôi qua
 * mà không có sự thay đổi nào.
 * @param value Giá trị cần debounce.
 * @param delay Thời gian trì hoãn (miliseconds).
 * @returns Giá trị đã được debounce.
 */
export function useDebounce<T>(value: T, delay: number): T {
  // State để lưu trữ giá trị đã debounce
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(
    () => {
      // Thiết lập một timer để cập nhật giá trị debounce sau khoảng thời gian delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Trả về một hàm cleanup để dọn dẹp timer
      // Hàm này sẽ được gọi nếu:
      // 1. Component unmount.
      // 2. `value` hoặc `delay` thay đổi trước khi timer kết thúc.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Chỉ chạy lại effect này nếu `value` hoặc `delay` thay đổi
  );

  return debouncedValue;
}