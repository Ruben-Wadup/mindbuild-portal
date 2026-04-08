import { NextResponse } from "next/server";
import { fetchGa4, fetchSearchConsole } from "@/lib/google";
import sql from "@/lib/db";

export async function GET() {
  const hasGoogleEnv =
    process.env.GOOGLE_CLIENT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GA4_PROPERTY_ID;

  const [ga4, gsc, blogStats] = await Promise.allSettled([
    hasGoogleEnv ? fetchGa4(28) : Promise.reject(new Error("Google env not configured")),
    hasGoogleEnv ? fetchSearchConsole(28) : Promise.reject(new Error("Google env not configured")),
    sql`SELECT slug, title, views, last_viewed FROM blog_stats ORDER BY views DESC LIMIT 10`,
  ]);

  return NextResponse.json({
    ga4: ga4.status === "fulfilled" ? ga4.value : null,
    gsc: gsc.status === "fulfilled" ? gsc.value : null,
    blogStats: blogStats.status === "fulfilled" ? blogStats.value : [],
    errors: {
      ga4: ga4.status === "rejected" ? (ga4.reason as Error).message : null,
      gsc: gsc.status === "rejected" ? (gsc.reason as Error).message : null,
    },
  });
}
