import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

/**
 * Route gate. Redirects unauthenticated requests to /login with a
 * ?from= hint. The `authorized` callback in authConfig handles the
 * allow-list for /login and /api/auth/*; this middleware just
 * formats the redirect target.
 */
export default auth((req) => {
  if (req.auth?.user) return;

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) return;

  const from = pathname + (req.nextUrl.search || "");
  const url = new URL("/login", req.url);
  if (from && from !== "/") url.searchParams.set("from", from);
  return Response.redirect(url);
});

export const config = {
  matcher: [
    // Match everything except: Next internals, static files, and the
    // favicon. The function body handles /login + /api/auth pass-through.
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff|woff2|ttf|otf)).*)",
  ],
};
