/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Tree-shake big barrel packages so a single `import { X } from 'lucide-react'`
  // does not force Turbopack/Webpack to walk the entire package. This is by far
  // the biggest compile-time win for this project: 48 files import icons from
  // lucide-react (~4000 icon files), and 30+ files import Firestore/Auth
  // helpers. Without this hint, dev compiles take many seconds per page.
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'firebase',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'chart.js',
      'react-chartjs-2',
      'next-themes',
    ],
  },

  // Skip type-check + lint during `next build` — they already run separately
  // via `tsc --noEmit` (tsconfig.check.json) and `next lint`. This shaves a
  // large chunk off production builds and stops one bad file from blocking
  // Cloudflare deploys.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
