import type { NextConfig } from "next";

const SUPABASE_DATABASE_URL =
  "postgresql://postgres.zksmzotvrdqphrtperbk:CapsuleDB2026SecureKey@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres";

const nextConfig: NextConfig = {
  env: {
    DATABASE_URL:
      process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "" && !process.env.DATABASE_URL.startsWith("file:")
        ? process.env.DATABASE_URL
        : SUPABASE_DATABASE_URL,
    JWT_SECRET:
      process.env.JWT_SECRET || "capsule_interiors_jwt_super_secret_2026_production_key",
    NEXT_PUBLIC_APP_NAME:
      process.env.NEXT_PUBLIC_APP_NAME || "CAPSULE COMPANY",
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zksmzotvrdqphrtperbk.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprc216b3R2cmRxcGhydHBlcmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MTM4MTUsImV4cCI6MjEwNTk4OTgxNX0.vDmppKXlDBGJyyez-MHfxIhCWvt_dipq9D2a5ydwyd0",
  },
};

export default nextConfig;
