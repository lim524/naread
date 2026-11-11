"use client";
import Script from "next/script";
import { useState, useRef } from "react";
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}
export default function AdClient({
  publisher,
  slot,
  cmp,
}: {
  publisher: string;
  slot: string;
  cmp: string;
}) {
  const [cmpLoaded, setCmpLoaded] = useState(false);
  const requested = useRef(false);
  return (
    <aside className="ad-container" aria-label="광고">
      <span>광고</span>
      <Script
        id="nailgi-certified-cmp"
        src={cmp}
        strategy="afterInteractive"
        onReady={() => setCmpLoaded(true)}
      />
      {cmpLoaded && (
        <>
          <Script
            id="nailgi-adsense"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisher}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
            onReady={() => {
              if (!requested.current) {
                requested.current = true;
                try {
                  (window.adsbygoogle = window.adsbygoogle || []).push({});
                } catch {
                  /* Ad blockers may prevent requests. */
                }
              }
            }}
          />
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={publisher}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </>
      )}
    </aside>
  );
}
