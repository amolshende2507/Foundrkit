/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // This sends all requests starting with these paths to your Python Backend
        source: '/:path(emails|clients|proposals|tasks|chat|generate-email|generate-proposal|dashboard/stats|branding|tools)/:slug*',
        destination: 'http://127.0.0.1:8000/:path/:slug*',
      },
    ];
  },
};

export default nextConfig;