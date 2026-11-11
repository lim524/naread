export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return;

  const url = new URL(req.url);
  if (origin === url.origin) return;

  // Next's development server can use its bind address (0.0.0.0) in
  // req.url. Host preserves the address and port used by the browser.
  const host = req.headers.get("host");
  if (host) {
    try {
      const publicUrl = new URL(`${url.protocol}//${host}`);
      if (
        publicUrl.host === host &&
        !publicUrl.username &&
        !publicUrl.password &&
        origin === publicUrl.origin
      )
        return;
    } catch {
      // Malformed hosts must not bypass the origin check.
    }
  }
  throw new Error("허용되지 않은 요청입니다.");
}
