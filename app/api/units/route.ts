import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firestore-admin";

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

function serializeDate(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value) {
    const date = (value as TimestampLike).toDate?.();
    return date instanceof Date ? date.toISOString() : undefined;
  }

  return typeof value === "string" ? value : undefined;
}

function serializeUnit(id: string, data: Record<string, unknown>) {
  return {
    ...data,
    cnpj: typeof data.cnpj === "string" ? data.cnpj : id,
    createdAt: serializeDate(data.createdAt) ?? new Date().toISOString(),
    updatedAt: serializeDate(data.updatedAt)
  };
}

export async function GET() {
  const snapshot = await getDb().collection("units").orderBy("createdAt", "desc").get();
  const units = snapshot.docs.map((doc) => serializeUnit(doc.id, doc.data()));

  return NextResponse.json({ units });
}

export async function POST(request: Request) {
  const body = (await request.json()) as UnitPayload;
  const unit = normalizeUnitPayload(body);

  if (!unit.cnpj || !unit.unitName || !unit.email || !unit.password) {
    return NextResponse.json({ error: "Dados obrigatorios ausentes." }, { status: 400 });
  }

  await getDb().collection("units").doc(unit.cnpj).set({
    ...unit,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  return NextResponse.json({ ok: true, unit });
}

export async function PATCH(request: Request) {
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
  if (body.password !== undefined || body.resetPassword) nextData.password = body.resetPassword ? "123456" : unit.password;

  if (unit.cnpj && unit.cnpj !== originalCnpj) {
    await getDb().collection("units").doc(unit.cnpj).set(nextData, { merge: true });
    await getDb().collection("units").doc(originalCnpj).delete();
  } else {
    await getDb().collection("units").doc(originalCnpj).set(nextData, { merge: true });
  }

  return NextResponse.json({ ok: true, unit: nextData });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const unitId = cleanUnitId(searchParams.get("unitId"));

  if (!unitId) {
    return NextResponse.json({ error: "unitId obrigatorio." }, { status: 400 });
  }

  await getDb().collection("units").doc(unitId).delete();

  return NextResponse.json({ ok: true, unitId });
}
