import { isFrontendPeer } from "@/lib/frontend/peer";

/**
 * Cookie-authenticated route handlers that change data accept only same-origin browser requests (or the
 * split-hosting frontend, which checks the browser's origin itself before forwarding).
 */
export function isSameOriginRequest(request: Request) {
  if (isFrontendPeer(request.headers)) return true;
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") === "same-origin";
  const allowed = new Set([new URL(request.url).origin]);
  for (const value of [process.env.NEXT_PUBLIC_BASE_URL, process.env.AUTH_URL]) {
    try {
      if (value) allowed.add(new URL(value).origin);
    } catch {
      // An unparsable setting adds nothing.
    }
  }
  return allowed.has(origin);
}
