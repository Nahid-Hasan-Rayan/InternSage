import type { NextConfig } from "next";

/**
 * InternSage — Next.js config
 *
 * Security headers here are defense-in-depth for the frontend only —
 * the real security boundary is the backend (auth guards, CORS
 * allowlist, cookie flags). These stop the frontend itself from
 * being trivially framed/sniffed/leaked-via-referrer.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Removes the X-Powered-By header — no reason to advertise the
  // framework/version to every request for free.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Never let this app be embedded in another site's iframe —
          // stops clickjacking against login/apply/scorecard actions.
          { key: "X-Frame-Options", value: "DENY" },
          // Stops browsers from MIME-sniffing a response into an
          // unintended content type.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Don't leak the full URL (which can contain no secrets
          // here, but is good hygiene) to third-party destinations.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Explicitly deny access to sensitive browser APIs this
          // app never uses — camera/mic/geolocation.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
