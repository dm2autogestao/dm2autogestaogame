import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { getDb } from "@/lib/firestore-admin";
import { maskCnpj, maskEmail, maskPhone } from "@/lib/data-masking";
import { hashPassword } from "@/lib/password-security";
import { COOKIE_NAME, readSessionToken } from "@/lib/session-security";

export const runtime = "nodejs";

type UnitPayload = {
  unitName?: string;
  responsibleName?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  password?: string;
  status?: "pending" | "active" | "blocked";
};

type TimestampLike = {
  toDate?: () => Date;
};

function cleanUnitId(value: string | null | undefined) {
  return value?.replace(/\D/g, "").slice(0, 14);
}

function normalizeUnitPayload(body: UnitPayload) {
  return {
    unitName: body.unitName ?? "",
    responsibleName: body.responsibleName ?? "",
    cnpj: cleanUnitId(body.cnpj) ?? "",
    email: (body.email ?? "").trim().toLowerCase(),
    phone: body.phone ?? "",
    city: body.city ?? "",
    state: (body.state ?? "").trim().toUpperCase(),
    password: body.password ?? "",
    status: body.status ?? "pending"
  };
}

function readRequestSession() {
  return readSessionToken(cookies().get(COOKIE_NAME)?.value);
}

function requireMaster() {
  return readRequestSession()?.role === "master";
}

function serializeDate(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value) {
    const date = (value as TimestampLike).toDate?.();
    return date instanceof Date ? date.toISOString() : undefined;
  }

  return typeof value === "string" ? value : undefined;
}

function serializeUnit(id: string, data: Record<string, unknown>) {
  return {
    cnpj: typeof data.cnpj === "string" ? data.cnpj : id,
    cnpjMasked: maskCnpj(typeof data.cnpj === "string" ? data.cnpj : id),
    unitName: data.unitName ?? "",
    responsibleName: data.responsibleName ?? "",
    email: data.email ?? "",
    emailMasked: maskEmail(typeof data.email === "string" ? data.email : ""),
    phone: data.phone ?? "",
    phoneMasked: maskPhone(typeof data.phone === "string" ? data.phone : ""),
    city: data.city ?? "",
    state: data.state ?? "",
    status: data.status ?? "pending",
    commercialInputs: data.commercialInputs,
    gameProgress: data.gameProgress,
    selfManagement: data.selfManagement,
    createdAt: serializeDate(data.createdAt) ?? new Date().toISOString(),
    updatedAt: serializeDate(data.updatedAt)
  };
}

export async function GET() {
  if (!requireMaster()) {
    return NextResponse.json({ error: "Acesso master necessario." }, { status: 401 });
  }

  const snapshot = await getDb().collection("units").orderBy("createdAt", "desc").get();
  const units = snapshot.docs.map((doc) => serializeUnit(doc.id, doc.data()));

  return NextResponse.json({ units });
}

export async function POST(request: Request) {
  const body = (await request.json()) as UnitPayload;
  const unit = normalizeUnitPayload(body);
  const isMaster = requireMaster();

  if (!unit.cnpj || !unit.unitName || !unit.email || !unit.password) {
    return NextResponse.json({ error: "Dados obrigatorios ausentes." }, { status: 400 });
  }

  const existing = await getDb().collection("units").doc(unit.cnpj).get();
  if (existing.exists && !isMaster) {
    return NextResponse.json({ error: "Este CNPJ ja possui cadastro." }, { status: 409 });
  }

  const password = hashPassword(unit.password);
  const status = isMaster ? unit.status : "pending";

  await getDb().collection("units").doc(unit.cnpj).set({
    ...unit,
    status,
    password: FieldValue.delete(),
    passwordHash: password.hash,
    passwordSalt: password.salt,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  return NextResponse.json({ ok: true, unit: { ...unit, status, password: undefined } });
}

export async function PATCH(request: Request) {
  if (!requireMaster()) {
    return NextResponse.json({ error: "Acesso master necessario." }, { status: 401 });
  }

  const body = (await request.json()) as UnitPayload & { originalCnpj?: string; resetPassword?: boolean };
  const originalCnpj = cleanUnitId(body.originalCnpj ?? body.cnpj);

  if (!originalCnpj) {
    return NextResponse.json({ error: "CNPJ obrigatorio." }, { status: 400 });
  }

  const unit = normalizeUnitPayload(body);
  const nextData: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp()
  };

  if (body.unitName !== undefined) nextData.unitName = unit.unitName;
  if (body.responsibleName !== undefined) nextData.responsibleName = unit.responsibleName;
  if (body.cnpj !== undefined) nextData.cnpj = unit.cnpj;
  if (body.email !== undefined) nextData.email = unit.email;
  if (body.phone !== undefined) nextData.phone = unit.phone;
  if (body.city !== undefined) nextData.city = unit.city;
  if (body.state !== undefined) nextData.state = unit.state;
  if (body.status !== undefined) nextData.status = unit.status;
  if (body.password !== undefined || body.resetPassword) {
    const password = hashPassword(body.resetPassword ? "123456" : unit.password);
    nextData.password = FieldValue.delete();
    nextData.passwordHash = password.hash;
    nextData.passwordSalt = password.salt;
    nextData.passwordUpdatedAt = FieldValue.serverTimestamp();
  }

  if (unit.cnpj && unit.cnpj !== originalCnpj) {
    await getDb().collection("units").doc(unit.cnpj).set(nextData, { merge: true });
    await getDb().collection("units").doc(originalCnpj).delete();
  } else {
    await getDb().collection("units").doc(originalCnpj).set(nextData, { merge: true });
  }

  return NextResponse.json({ ok: true, unit: nextData });
}

export async function DELETE(request: Request) {
  if (!requireMaster()) {
    return NextResponse.json({ error: "Acesso master necessario." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unitId = cleanUnitId(searchParams.get("unitId"));

  if (!unitId) {
    return NextResponse.json({ error: "unitId obrigatorio." }, { status: 400 });
  }

  await getDb().collection("units").doc(unitId).delete();

  return NextResponse.json({ ok: true, unitId });
}
