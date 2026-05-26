import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getDb } from "@/lib/firestore-admin";
import { COOKIE_NAME, createSessionToken, getSessionCookieOptions } from "@/lib/session-security";

export const runtime = "nodejs";

type GoogleLoginPayload = {
  idToken?: string;
  role?: "franchisee" | "master";
  remember?: boolean;
};

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
  try {
    const body = (await request.json()) as GoogleLoginPayload;
    const idToken = body.idToken ?? "";
    const role = body.role ?? "franchisee";
    const remember = body.remember === true;

    if (!idToken) {
      return NextResponse.json({ error: "Token do Google ausente." }, { status: 400 });
    }

    const db = getDb();
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const email = (decodedToken.email ?? "").trim().toLowerCase();

    if (!email || decodedToken.email_verified === false) {
      return NextResponse.json({ error: "Use uma conta Google com e-mail verificado." }, { status: 401 });
    }

    if (role === "master") {
      const masterEmail = (process.env.MASTER_EMAIL ?? "master@franquia.local").toLowerCase();

      if (email !== masterEmail) {
        return NextResponse.json({ error: "Esta conta Google nao esta liberada como franqueadora." }, { status: 401 });
      }

      const response = NextResponse.json({
        ok: true,
        session: {
          role: "master",
          unitName: "Franqueadora"
        }
      });
      response.cookies.set(COOKIE_NAME, createSessionToken({ role: "master" }), getSessionCookieOptions({ remember }));

      return response;
    }

    const snapshot = await db.collection("units").where("email", "==", email).limit(1).get();
    const unitDoc = snapshot.docs[0];

    if (!unitDoc) {
      return NextResponse.json({ error: "Nao encontramos unidade ativa com esse e-mail Google." }, { status: 401 });
    }

    const data = unitDoc.data() ?? {};

    if (data.status === "pending") {
      return NextResponse.json({ error: "Cadastro recebido. A unidade ainda precisa ser aprovada pela franqueadora." }, { status: 403 });
    }

    if (data.status === "blocked") {
      return NextResponse.json({ error: "Esta unidade esta bloqueada. Fale com a franqueadora para reativar o acesso." }, { status: 403 });
    }

    await unitDoc.ref.set({ lastLoginAt: FieldValue.serverTimestamp() }, { merge: true });

    const response = NextResponse.json({ ok: true, unit: sanitizeUnit(unitDoc.id, data) });
    response.cookies.set(COOKIE_NAME, createSessionToken({ role: "franchisee", cnpj: unitDoc.id }), getSessionCookieOptions({ remember }));

    return response;
  } catch (error) {
    console.error("Google login failed", error);
    return NextResponse.json({ error: "Nao foi possivel validar o login com Google agora." }, { status: 500 });
  }
}
