import "server-only";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { verifyPassword } from "./password";
import { checkRateLimit, clearFailures, recordFailure } from "./rate-limit";

class RateLimitedError extends CredentialsSignin {
  code = "rate-limited";
}

class WrongPasswordError extends CredentialsSignin {
  code = "wrong-password";
}

function getRateKey(request: Request | undefined): string {
  if (!request) return "local";
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "local";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const key = getRateKey(request as Request | undefined);
        const limit = checkRateLimit(key);
        if (!limit.allowed) throw new RateLimitedError();

        const password = typeof credentials?.password === "string" ? credentials.password : "";
        const ok = await verifyPassword(password);
        if (!ok) {
          recordFailure(key);
          throw new WrongPasswordError();
        }
        clearFailures(key);
        return { id: "owner", name: "Owner" };
      },
    }),
  ],
});
