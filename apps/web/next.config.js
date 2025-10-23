/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-leaflet", "leaflet"],
  images: {
    domains: ["lh3.googleusercontent.com"], 
  },
};

export default nextConfig;

