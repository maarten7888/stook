import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Redirects zijn verwijderd - Vercel handelt dit af via domain settings
  // Dit voorkomt redirect loops tussen Vercel en Next.js configuratie
};

export default nextConfig;
