/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents duplicate double-invoking of useEffect and double API calls in dev
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
