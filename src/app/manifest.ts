import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TrackHour",
    short_name: "TrackHour",
    description: "Suivi du temps pour freelances et agences",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F2F2F2",
    theme_color: "#3333FF",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["productivity", "business"],
    lang: "fr",
  };
}
