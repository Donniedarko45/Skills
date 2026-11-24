import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Static HTML export: the site has no server-side data, so it can be hosted anywhere.
  output: 'export',
  images: { unoptimized: true },
}

export default nextConfig
