import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Para importar la lista de precios en Excel
    serverActions: { bodySizeLimit: "5mb" },
  },
  serverExternalPackages: ["exceljs", "@react-pdf/renderer"],
};

export default nextConfig;
