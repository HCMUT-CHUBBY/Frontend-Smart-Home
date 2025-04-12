// postcss.config.mjs

const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // <<< SỬA Ở ĐÂY: Dùng package mới theo yêu cầu lỗi
    'autoprefixer': {},         // Giữ lại autoprefixer
  },
};

export default config;