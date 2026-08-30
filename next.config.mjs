/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/contacto",
        has: [
          { type: "query", key: "origen", value: "demo" },
          { type: "query", key: "marca", value: "(?<marca>.+)" },
        ],
        destination: "/auth/sign-up?marca=:marca",
        permanent: false,
      },
    ]
  },
}

export default nextConfig
