/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: '/api/backend/:path*',
                destination: 'http://localhost:3001/api/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
