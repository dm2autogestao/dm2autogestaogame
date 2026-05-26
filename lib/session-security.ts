import { createHmac, timingSafeEqual } from "crypto";

export type AppSession = {
  role: "master" | "franchisee";
  cnpj?: string;
  exp: number;
};

const COOKIE_NAME = "dm2_session";
const SESSION_SECONDS = 60 * 60 * 8;

function getSecret() {
  return process.env.SESSION_SECRET ?? process.env.MASTER_PASSWORD ?? "dm2-local-session-secret";
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createSessionToken(session: Omit<AppSession, "exp">) {
  const payload = encode(JSON.stringify({ ...session, exp: Date.now() + SESSION_SECONDS * 1000 }));
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token?: string): AppSession | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);
  const valid =
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

  if (!valid) {
    return null;
  }

  try {
    const session = JSON.parse(decode(payload)) as AppSession;
    return session.exp > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(options?: { remember?: boolean }) {
  const cookieOptions: {
    httpOnly: true;
    sameSite: "lax";
    secure: boolean;
    path: string;
    maxAge?: number;
  } = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  };

  if (options?.remember) {
    cookieOptions.maxAge = SESSION_SECONDS;
  }

  return cookieOptions;
}

export { COOKIE_NAME };
