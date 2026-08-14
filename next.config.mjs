/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    // Compatibility shim for the pre-mode-registry numeric play routes (§7.2).
    return [
      { source: "/play/5", destination: "/play/streak-5", permanent: false },
      { source: "/play/10", destination: "/play/streak-10", permanent: false },
      { source: "/play/15", destination: "/play/streak-15", permanent: false },
    ];
  },
};

export default nextConfig;
