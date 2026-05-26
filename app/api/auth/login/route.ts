import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firestore-admin";
import { hashPassword, verifyPassword } from "@/lib/password-security";
import { COOKIE_NAME, createSessionToken, getSessionCookieOptions } from "@/lib/session-security";

export const runtime = "nodejs";

type LoginPayload = {
  identifier?: string;
  password?: string;
};

function normalizeCnpj(value: string) {
  return value.replace(/\D/g, "").slice(0, 14);
}

function sanitizeUnit(id: string, data: Record<string, unknown>) {
  return {
    cnpj: typeof data.cnpj === "string" ? data.cnpj : id,
    unitName: data.unitName,
    responsibleName: data.responsibleName,
    email: data.email,
    phone: data.phone,
    city: data.city,
    state: data.state,
    status: data.status
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as LoginPayload;
  const identifier = (body.identifier ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!identifier || !password) {
    return NextResponse.json({ error: "Informe CNPJ/e-mail e senha." }, { status: 400 });
  }

  const db = getDb();
  const cnpj = normalizeCnpj(identifier);
  let snapshot = cnpj.length === 14 ? await db.collection("units").doc(cnpj).get() : null;

  if (!snapshot?.exists) {
    const byEmail = await db.collection("units").where("email", "==", identifier).limit(1).get();
    snapshot = byEmail.docs[0] ?? null;
  }

  if (!snapshot?.exists) {
    return NextResponse.json({ error: "CNPJ, e-mail ou senha incorretos." }, { status: 401 });
  }

  const data = snapshot.data() ?? {};
  const hasSecurePassword = verifyPassword(password, data.passwordHash, data.passwordSalt);
  const hasLegacyPassword = !hasSecurePassword && typeof data.password === "string" && data.password === password;

  if (!hasSecurePassword && !hasLegacyPassword) {
    return NextResponse.json({ error: "CNPJ, e-mail ou senha incorretos." }, { status: 401 });
  }

  if (data.status === "pending") {
    return NextResponse.json({ error: "Cadastro recebido. A unidade ainda precisa ser aprovada pela franqueadora." }, { status: 403 });
  }

  if (data.status === "blocked") {
    return NextResponse.json({ error: "Esta unidade esta bloqueada. Fale com a franqueadora para reativar o acesso." }, { status: 403 });
  }

  if (hasLegacyPassword) {
    const nextPassword = hashPassword(password);
    await snapshot.ref.set({
      password: FieldValue.delete(),
      passwordHash: nextPassword.hash,
      passwordSalt: nextPassword.salt,
      passwordUpdatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  }

  const response = NextResponse.json({ ok: true, unit: sanitizeUnit(snapshot.id, data) });
  response.cookies.set(COOKIE_NAME, createSessionToken({ role: "franchisee", cnpj: snapshot.id }), getSessionCookieOptions());

  return response;
}
