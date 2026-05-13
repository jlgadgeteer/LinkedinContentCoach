import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config. No providers, no DB calls, no bcrypt.
 * Used by middleware.ts to gate routes without dragging Node-only
 * code into the edge bundle. The full config (lib/auth.ts) extends
 * this with the Credentials provider and runs only on Node.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/login")) return true;
      if (pathname.startsWith("/api/auth")) return true;
      return !!auth?.user;
    },
  },
};
