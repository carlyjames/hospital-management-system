/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@radix-ui'],
  experimental: {
    optimizeCss: false, 
  },
}
export default nextConfig;
