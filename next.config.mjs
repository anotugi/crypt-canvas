/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: 'export', // 静的エクスポートを有効化
  // リポジトリ名が https://<user>.github.io/<repo-name>/ の場合は basePath を設定
  basePath: '/crypt-canvas', 
  images: {
    unoptimized: true, // 静的エクスポート時は画像最適化をオフにする
  },
  allowedDevOrigins: [
    'localhost:3090',
    '192.168.188.193:3090', // ポート番号を含めて指定します
    '192.168.188.193',
  ],
};

export default nextConfig;
