import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "InvoiceLens — AI Invoice Scanner",
    short_name: "InvoiceLens",
    description: "Scan and manage invoices with AI. Track expenses, view reports, and export data.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0c14",
    theme_color: "#7c6ef7",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["finance", "productivity", "business"],
    screenshots: [],
    shortcuts: [
      {
        name: "Invoice History",
        url: "/history",
        description: "View all scanned invoices",
      },
      {
        name: "Reports",
        url: "/reports",
        description: "View financial reports",
      },
    ],
  };
}
