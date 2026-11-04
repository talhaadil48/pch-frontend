/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "gogreen11.s3.us-east-1.amazonaws.com",
      "gogreen11.s3.amazonaws.com"
    ],
  },
};

module.exports = nextConfig;
