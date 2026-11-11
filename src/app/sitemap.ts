import type { MetadataRoute } from "next";
export const dynamic = "force-dynamic";
import { policies } from "@/lib/policies";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return [
    "",
    "/sample",
    "/contact",
    ...Object.keys(policies).map((k) => "/" + k),
  ].map((p) => ({
    url: base + p,
    lastModified: new Date("2026-11-10T00:00:00+09:00"),
    changeFrequency: "monthly",
    priority: p === "" ? 1 : 0.6,
  }));
}
