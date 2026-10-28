import type { NextConfig } from 'next';
const config: NextConfig = { transpilePackages: ['@st/api-client', '@st/ui'], poweredByHeader: false, async rewrites() { return [{ source: '/api/:path*', destination: `${process.env.API_ORIGIN ?? 'http://127.0.0.1:3001'}/:path*` }]; }, async headers() { return [{ source: '/:path*', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }] }, { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] }]; } };
export default config;
