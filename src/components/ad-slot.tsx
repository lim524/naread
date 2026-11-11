import AdClient from "./ad-client";
export default function AdSlot() {
  const publisher = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT;
  const cmp = process.env.CMP_SCRIPT_URL;
  const enabled =
    process.env.ADS_ENABLED === "true" && process.env.CMP_READY === "true";
  if (
    !enabled ||
    !/^ca-pub-\d{16}$/.test(publisher || "") ||
    !/^\d{10}$/.test(slot || "") ||
    !cmp?.startsWith("https://fundingchoicesmessages.google.com/")
  )
    return null;
  return <AdClient publisher={publisher!} slot={slot!} cmp={cmp} />;
}
