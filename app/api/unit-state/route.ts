import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { getDb } from "@/lib/firestore-admin";
import { COOKIE_NAME, readSessionToken } from "@/lib/session-security";

type UnitStatePayload = {
  unitId?: string;
  unitName?: string;
  commercialInputs?: unknown;
  gameProgress?: unknown;
  selfManagement?: unknown;
  fillingHistory?: unknown;
};

function cleanUnitId(value: string | null | undefined) {
  return value?.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

function canAccessUnit(unitId: string) {
  const session = readSessionToken(cookies().get(COOKIE_NAME)?.value);
  return session?.role === "master" || (session?.role === "franchisee" && session.cnpj === unitId);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unitId = cleanUnitId(searchParams.get("unitId"));

  if (!unitId) {
    return NextResponse.json({ error: "unitId obrigatório" }, { status: 400 });
  }

  if (!canAccessUnit(unitId)) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const snapshot = await getDb().collection("units").doc(unitId).get();

  if (!snapshot.exists) {
    return NextResponse.json({ exists: false, unitId });
  }

  return NextResponse.json({ exists: true, unitId, data: snapshot.data() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as UnitStatePayload;
  const unitId = cleanUnitId(body.unitId);

  if (!unitId) {
    return NextResponse.json({ error: "unitId obrigatório" }, { status: 400 });
  }

  if (!canAccessUnit(unitId)) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const payload: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp()
  };
  const nextUnitName = typeof body.unitName === "string" ? body.unitName.trim() : "";

  if (nextUnitName && nextUnitName !== "Sua Unidade") {
    payload.unitName = nextUnitName;
  }

  if (Object.prototype.hasOwnProperty.call(body, "commercialInputs")) {
    payload.commercialInputs = body.commercialInputs;
  }

  if (Object.prototype.hasOwnProperty.call(body, "gameProgress")) {
    payload.gameProgress = body.gameProgress;
  }

  if (Object.prototype.hasOwnProperty.call(body, "selfManagement")) {
    payload.selfManagement = body.selfManagement;
  }

  if (Object.prototype.hasOwnProperty.call(body, "fillingHistory")) {
    payload.fillingHistory = body.fillingHistory;
  }

  await getDb().collection("units").doc(unitId).set(payload, { merge: true });

  return NextResponse.json({ ok: true, unitId });
}
