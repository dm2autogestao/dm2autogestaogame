import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getDb } from "@/lib/firestore-admin";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

type RecoverPayload = {
  identifier?: string;
};

function normalizeCnpj(value: string) {
  return value.replace(/\D/g, "").slice(0, 14);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecoverPayload;
    const identifier = (body.identifier ?? "").trim().toLowerCase();

    if (!identifier) {
      return NextResponse.json({ error: "Informe o CNPJ ou e-mail cadastrado." }, { status: 400 });
    }

    const db = getDb();
    const cnpj = normalizeCnpj(identifier);
    let unitEmail = identifier.includes("@") ? identifier : "";

    if (!unitEmail && cnpj.length === 14) {
      const snapshot = await db.collection("units").doc(cnpj).get();
      const email = snapshot.data()?.email;
      unitEmail = typeof email === "string" ? email : "";
    }

    if (!unitEmail) {
      return NextResponse.json({ error: "Não encontramos uma unidade com esse CNPJ ou e-mail." }, { status: 404 });
    }

    try {
      await getAuth().getUserByEmail(unitEmail);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

      if (code !== "auth/user-not-found") {
        throw error;
      }

      await getAuth().createUser({
        email: unitEmail,
        password: randomBytes(18).toString("base64url")
      });
    }

    await getAuth().generatePasswordResetLink(unitEmail);

    return NextResponse.json({
      ok: true,
      message: "Enviamos um link de redefinição para o e-mail cadastrado."
    });
  } catch (error) {
    console.error("Password recovery failed", error);
    return NextResponse.json({ error: "Não foi possível enviar o e-mail de recuperação agora." }, { status: 500 });
  }
}
