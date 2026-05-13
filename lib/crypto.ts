/**
 * AES-256-GCM helpers using Web Crypto so they run on both Node and edge.
 * Encryption only happens server-side during setup (Node); decryption runs
 * inside /api/generate (edge) on every action.
 *
 * Per ADR-008: the KEK is derived from AUTH_PASSWORD via PBKDF2-SHA256.
 * Rotating AUTH_PASSWORD invalidates existing ciphertext by design.
 */
const ITERATIONS = 100_000;
const SALT = new TextEncoder().encode("content-coach.v1.api-key");

function getPassword(): string {
  const p = process.env.AUTH_PASSWORD;
  if (!p) throw new Error("AUTH_PASSWORD is not set; cannot encrypt or decrypt");
  return p;
}

async function deriveKey(password: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: SALT,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function b64ToBuf(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const buf = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function encryptApiKey(plain: string): Promise<string> {
  const key = await deriveKey(getPassword());
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plain),
  );
  return [bufToB64(iv.buffer as ArrayBuffer), bufToB64(enc)].join(".");
}

export async function decryptApiKey(payload: string): Promise<string | null> {
  try {
    const [ivB64, dataB64] = payload.split(".");
    if (!ivB64 || !dataB64) return null;
    const key = await deriveKey(getPassword());
    const iv = b64ToBuf(ivB64);
    const data = b64ToBuf(dataB64);
    const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(dec);
  } catch {
    return null;
  }
}
