import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ── Compression ───────────────────────────────────────────────
  // Next.js built-in gzip/brotli compression enable karo
  compress: true,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // ── Images ────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '*.r2.dev' },
    ],
    // Image optimization caching — 60 days
    minimumCacheTTL: 60 * 60 * 24 * 60,
  },

  // ── SECURITY: OPENROUTER_API_KEY yahan NAHI dena chahiye ──────
  // Server-side env vars Next.js API routes mein automatically
  // process.env se milti hain — yahan expose karne ki zaroorat nahi
  // env: { OPENROUTER_API_KEY: ... }  ← HATAYA GAYA (security fix)

  transpilePackages: ['motion'],

  // ── HTTP Headers ─────────────────────────────────────────────
  async headers() {
    return [
      // Static assets — 1 year cache (immutable, hashed filenames)
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Public folder assets — 7 days cache
      {
        source: '/lohia-logo.webp',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
      {
        source: '/founder.png',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
      {
        source: '/topper.jpg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
      {
        source: '/lottie-animation.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
      // API routes — no cache (dynamic data)
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      // Security headers — all pages
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection',         value: '1; mode=block' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(self), geolocation=()' },
        ],
      },
    ];
  },

  webpack: (config, {dev}) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = { ignored: /.*/ };
    }
    return config;
  },
};

export default nextConfig;
