import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

type DemoRole = "customer" | "staff";
type DemoIdentity = {
  username: string;
  role: DemoRole;
  expiresAt: number;
};

const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

function isProduction() {
  return process.env["NODE_ENV"] === "production";
}

function sessionCookieName() {
  return isProduction() ? "__Host-ppc-demo-session" : "ppc-demo-session";
}

function sessionCookie(token: string, maxAge: number) {
  return [
    `${sessionCookieName()}=${token}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${maxAge}`,
    ...(isProduction() ? ["Secure"] : []),
  ].join("; ");
}

function readCookie(name: string) {
  const cookies = getRequestHeader("cookie");
  if (!cookies) return null;
  for (const part of cookies.split(/;\s*/)) {
    const equalsIndex = part.indexOf("=");
    if (equalsIndex > 0 && part.slice(0, equalsIndex) === name) {
      return part.slice(equalsIndex + 1);
    }
  }
  return null;
}

function encodeBase64Url(value: Uint8Array) {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function passwordsMatch(supplied: string, configured: string | undefined) {
  if (!configured) return false;
  const suppliedBytes = encoder.encode(supplied);
  const configuredBytes = encoder.encode(configured);
  let difference = suppliedBytes.length ^ configuredBytes.length;
  for (let index = 0; index < 256; index += 1) {
    difference |= (suppliedBytes[index] ?? 0) ^ (configuredBytes[index] ?? 0);
  }
  return difference === 0;
}

async function sessionKey() {
  const secret = process.env["PPC_DEMO_SESSION_SECRET"];
  if (!secret || secret.length < 32) return null;
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function issueSession(username: string, role: DemoRole) {
  const key = await sessionKey();
  if (!key) return null;
  const payload: DemoIdentity = {
    username,
    role,
    expiresAt: Date.now() + SESSION_LIFETIME_SECONDS * 1000,
  };
  const encodedPayload = encodeBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(encodedPayload));
  return `${encodedPayload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

async function verifySession(token: string | null): Promise<DemoIdentity | null> {
  if (!token) return null;
  const [encodedPayload, encodedSignature, ...extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra.length) return null;
  const key = await sessionKey();
  if (!key) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(encodedSignature),
      encoder.encode(encodedPayload),
    );
    if (!valid) return null;
    const parsed: unknown = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload)));
    if (!parsed || typeof parsed !== "object") return null;
    const identity = parsed as Partial<DemoIdentity>;
    if (
      typeof identity.username !== "string" ||
      (identity.role !== "customer" && identity.role !== "staff") ||
      typeof identity.expiresAt !== "number" ||
      identity.expiresAt <= Date.now()
    ) {
      return null;
    }
    if (
      (identity.role === "staff" && identity.username !== "sales@ppc.co.zw") ||
      (identity.role === "customer" &&
        identity.username !== "customer1@gmail.com" &&
        identity.username !== "vespers.makado")
    ) {
      return null;
    }
    return identity as DemoIdentity;
  } catch {
    return null;
  }
}

function credentialsConfigured() {
  return Boolean(
    process.env["PPC_DEMO_SESSION_SECRET"] &&
    process.env["PPC_DEMO_SESSION_SECRET"].length >= 32 &&
    process.env["PPC_DEMO_CUSTOMER_PASSWORD"] &&
    process.env["PPC_DEMO_STAFF_PASSWORD"] &&
    process.env["PPC_DEMO_VESPERS_PASSWORD"],
  );
}

export const authenticateDemoAccount = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (
      !input ||
      typeof input !== "object" ||
      !("username" in input) ||
      typeof input.username !== "string" ||
      !("password" in input) ||
      typeof input.password !== "string" ||
      input.username.length > 254 ||
      input.password.length > 256
    ) {
      throw new Error("Invalid sign-in request.");
    }
    return { username: input.username.trim().toLowerCase(), password: input.password };
  })
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");
    if (!credentialsConfigured()) {
      return { result: "disabled" as const, username: "", role: null };
    }

    const users: Record<string, { role: DemoRole; password: string | undefined }> = {
      "customer1@gmail.com": {
        role: "customer",
        password: process.env["PPC_DEMO_CUSTOMER_PASSWORD"],
      },
      "sales@ppc.co.zw": { role: "staff", password: process.env["PPC_DEMO_STAFF_PASSWORD"] },
      "vespers.makado": { role: "customer", password: process.env["PPC_DEMO_VESPERS_PASSWORD"] },
    };
    const user = users[data.username];
    if (!user || !passwordsMatch(data.password, user.password)) {
      return { result: "invalid" as const, username: "", role: null };
    }

    const token = await issueSession(data.username, user.role);
    if (!token) return { result: "disabled" as const, username: "", role: null };
    setResponseHeader("Set-Cookie", sessionCookie(token, SESSION_LIFETIME_SECONDS));
    return {
      result: user.role === "staff" ? ("staff-authenticated" as const) : ("authenticated" as const),
      username: data.username,
      role: user.role,
    };
  });

export const getDemoAccountSession = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeader("Cache-Control", "no-store");
  const token = readCookie(sessionCookieName());
  const identity = await verifySession(token);
  return identity
    ? { username: identity.username, role: identity.role }
    : { username: "", role: null };
});

export const logoutDemoAccount = createServerFn({ method: "POST" }).handler(() => {
  setResponseHeader("Cache-Control", "no-store");
  setResponseHeader("Set-Cookie", sessionCookie("", 0));
  return { ok: true };
});
