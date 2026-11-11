export async function GET() {
  const id = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const enabled =
    process.env.ADS_ENABLED === "true" && process.env.CMP_READY === "true";
  return new Response(
    enabled && /^ca-pub-\d{16}$/.test(id || "")
      ? `google.com, ${id!.replace("ca-", "")}, DIRECT, f08c47fec0942fa0\n`
      : "# Advertising is currently disabled.\n",
    { headers: { "Content-Type": "text/plain" } },
  );
}
