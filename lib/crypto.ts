import "server-only";
import crypto from "node:crypto";

/**
 * Per ADR-008: the user's LLM API key is encrypted at rest with a key
 * derived from AUTH_PASSWORD via PBKDF2-SHA256. Rotating AUTH_PASSWORD
 * makes existing ciphertext undecryptable; the user is re-prompted for
 * their API key after rotation. That tradeoff is documented in the
 * deploy guide.
 */
const ALGO = "aes-256-gcm";
const ITERATIONS = 100_000;
const KEY_LEN = 32;
const SALT = "content-coach.v1.api-key";

function deriveKey(password: string): Buffer {
  return crypto.pbkdf2Sync(password, SALT, ITERATIONS, KEY_LEN, "sha256");
}

function getPassword(): string {
  const p = process.env.AUTH_PASSWORD;
  if (!p) throw new Error("AUTH_PASSWORD is not set; cannot encrypt or decrypt");
  return p;
}

export function encryptApiKey(plain: string): string {
  const key = deriveKey(getPassword());
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    enc.toString("base64"),
  ].join(".");
}

export function decryptApiKey(payload: string): string | null {
  try {
    const key = deriveKey(getPassword());
    const [ivB64, tagB64, dataB64] = payload.split(".");
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}
