import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firestore-admin";

type UnitStatePayload = {
  unitId?: string;
  unitName?: string;
  commercialInputs?: unknown;
  gameProgress?: unknown;
  selfManagement?: unknown;
};

function cleanUnitId(value: string | null | undefined) {
  return value?.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unitId = cleanUnitId(searchParams.get("unitId"));

  if (!unitId) {
    return NextResponse.json({ error: "unitId obrigatorio" }, { status: 400 });
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
    return NextResponse.json({ error: "unitId obrigatorio" }, { status: 400 });
  }

  const payload = {
    unitName: body.unitName ?? "Sua Unidade",
    commercialInputs: body.commercialInputs ?? null,
    gameProgress: body.gameProgress ?? null,
    selfManagement: body.selfManagement ?? null,
    updatedAt: FieldValue.serverTimestamp()
  };

  await getDb().collection("units").doc(unitId).set(payload, { merge: true });

  return NextResponse.json({ ok: true, unitId });
}
