import { handlers } from "@/lib/auth";

// Auth.js v5 handler. Node runtime (ADR-006) for bcrypt compatibility.
export const runtime = "nodejs";
export const { GET, POST } = handlers;
