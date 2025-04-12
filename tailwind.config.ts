// tailwind.config.ts
import type { Config } from 'tailwindcss'; // Import kiểu Config

const config: Config = { // Khai báo biến config với kiểu Config
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Bạn có thể mở rộng theme ở đây nếu cần
      // Ví dụ:
      // colors: {
      //   'custom-blue': '#1fb6ff',
      // }
    },
  },
  plugins: [],
};

export default config; // Sử dụng export default thay vì module.exports