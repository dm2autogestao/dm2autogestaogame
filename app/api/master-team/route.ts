import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { getDb } from "@/lib/firestore-admin";
import { hashPassword } from "@/lib/password-security";
import { clearServerCache, getServerCache, setServerCache } from "@/lib/server-response-cache";
import { COOKIE_NAME, readSessionToken } from "@/lib/session-security";

export const runtime = "nodejs";

const MASTER_TEAM_DOMAIN = "@doutordm2franquias.com.br";
const TEMPORARY_PASSWORD = "DM2@123456";

type MasterTeamRole = "admin" | "field_manager" | "operations";
type MasterTeamStatus = "active" | "blocked";

type MasterTeamPayload = {
  name?: string;
  email?: string;
  accessRole?: MasterTeamRole;
  status?: MasterTeamStatus;
  password?: string;
  resetPassword?: boolean;
};

type TimestampLike = {
  toDate?: () => Date;
};

function normalizeEmail(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function isCorporateMasterEmail(email: string) {
  return email.endsWith(MASTER_TEAM_DOMAIN);
}

function normalizeAccessRole(value?: string): MasterTeamRole {
  return value === "admin" || value === "field_manager" || value === "operations" ? value : "operations";
}

function normalizeStatus(value?: string): MasterTeamStatus {
  return value === "blocked" ? "blocked" : "active";
}

function serializeDate(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value) {
    const date = (value as TimestampLike).toDate?.();
    return date instanceof Date ? date.toISOString() : undefined;
  }

  return typeof value === "string" ? value : undefined;
}

function readRequestSession() {
  return readSessionToken(cookies().get(COOKIE_NAME)?.value);
}

function requireMaster() {
  return readRequestSession()?.role === "master";
}

function requireMasterAdmin() {
  const session = readRequestSession();
  return session?.role === "master" && (session.masterAccessRole === "admin" || !session.masterAccessRole);
}

function serializeMember(id: string, data: Record<string, unknown>) {
  return {
    id,
    name: typeof data.name === "string" ? data.name : "",
    email: typeof data.email === "string" ? data.email : id,
    accessRole: normalizeAccessRole(typeof data.accessRole === "string" ? data.accessRole : undefined),
    status: normalizeStatus(typeof data.status === "string" ? data.status : undefined),
    createdAt: serializeDate(data.createdAt) ?? new Date().toISOString(),
    updatedAt: serializeDate(data.updatedAt),
    lastLoginAt: serializeDate(data.lastLoginAt),
    passwordUpdatedAt: serializeDate(data.passwordUpdatedAt)
  };
}

export async function GET() {
  if (!requireMaster()) {
    return NextResponse.json({ error: "Acesso master necessário." }, { status: 401 });
  }

  const cached = getServerCache<{ members: ReturnType<typeof serializeMember>[] }>("master-team:list");
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "private, max-age=30" }
    });
  }

  const snapshot = await getDb().collection("masterTeam").orderBy("createdAt", "desc").get();
  const members = snapshot.docs.map((doc) => serializeMember(doc.id, doc.data()));
  const response = { members };
  setServerCache("master-team:list", response, 30000);

  return NextResponse.json(response, {
    headers: { "Cache-Control": "private, max-age=30" }
  });
}

export async function POST(request: Request) {
  if (!requireMasterAdmin()) {
    return NextResponse.json({ error: "Somente administradores master podem cadastrar equipe." }, { status: 403 });
  }

  const body = (await request.json()) as MasterTeamPayload;
  const email = normalizeEmail(body.email);
  const name = (body.name ?? "").trim();
  const password = body.password ?? "";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Informe nome, e-mail e senha inicial." }, { status: 400 });
  }

  if (!isCorporateMasterEmail(email)) {
    return NextResponse.json({ error: `Use somente e-mails ${MASTER_TEAM_DOMAIN}.` }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "A senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
  }

  const existing = await getDb().collection("masterTeam").doc(email).get();
  if (existing.exists) {
    return NextResponse.json({ error: "Este e-mail já possui acesso master." }, { status: 409 });
  }

  const nextPassword = hashPassword(password);
  const member = {
    name,
    email,
    accessRole: normalizeAccessRole(body.accessRole),
    status: normalizeStatus(body.status),
    passwordHash: nextPassword.hash,
    passwordSalt: nextPassword.salt,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    passwordUpdatedAt: FieldValue.serverTimestamp()
  };

  await getDb().collection("masterTeam").doc(email).set(member);
  clearServerCache("master-team:");

  return NextResponse.json({ ok: true, member: serializeMember(email, { ...member, createdAt: new Date().toISOString() }) });
}

export async function PATCH(request: Request) {
  if (!requireMasterAdmin()) {
    return NextResponse.json({ error: "Somente administradores master podem alterar equipe." }, { status: 403 });
  }

  const body = (await request.json()) as MasterTeamPayload & { originalEmail?: string };
  const originalEmail = normalizeEmail(body.originalEmail ?? body.email);

  if (!originalEmail) {
    return NextResponse.json({ error: "E-mail obrigatório." }, { status: 400 });
  }

  const current = await getDb().collection("masterTeam").doc(originalEmail).get();
  if (!current.exists) {
    return NextResponse.json({ error: "Acesso master não encontrado." }, { status: 404 });
  }

  const nextEmail = body.email === undefined ? originalEmail : normalizeEmail(body.email);
  if (!isCorporateMasterEmail(nextEmail)) {
    return NextResponse.json({ error: `Use somente e-mails ${MASTER_TEAM_DOMAIN}.` }, { status: 400 });
  }

  const nextData: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp()
  };

  if (body.name !== undefined) nextData.name = body.name.trim();
  if (body.email !== undefined) nextData.email = nextEmail;
  if (body.accessRole !== undefined) nextData.accessRole = normalizeAccessRole(body.accessRole);
  if (body.status !== undefined) nextData.status = normalizeStatus(body.status);

  if (body.password !== undefined || body.resetPassword) {
    const plainPassword = body.resetPassword ? TEMPORARY_PASSWORD : body.password ?? "";
    if (plainPassword.length < 6) {
      return NextResponse.json({ error: "A senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const nextPassword = hashPassword(plainPassword);
    nextData.passwordHash = nextPassword.hash;
    nextData.passwordSalt = nextPassword.salt;
    nextData.passwordUpdatedAt = FieldValue.serverTimestamp();
  }

  if (nextEmail !== originalEmail) {
    const existing = await getDb().collection("masterTeam").doc(nextEmail).get();
    if (existing.exists) {
      return NextResponse.json({ error: "Este e-mail já possui acesso master." }, { status: 409 });
    }

    await getDb().collection("masterTeam").doc(nextEmail).set({
      ...current.data(),
      ...nextData,
      email: nextEmail
    }, { merge: true });
    await current.ref.delete();
  } else {
    await current.ref.set(nextData, { merge: true });
  }
  clearServerCache("master-team:");

  return NextResponse.json({
    ok: true,
    temporaryPassword: body.resetPassword ? TEMPORARY_PASSWORD : undefined
  });
}

export async function DELETE(request: Request) {
  if (!requireMasterAdmin()) {
    return NextResponse.json({ error: "Somente administradores master podem remover equipe." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const email = normalizeEmail(searchParams.get("email") ?? "");

  if (!email) {
    return NextResponse.json({ error: "E-mail obrigatório." }, { status: 400 });
  }

  await getDb().collection("masterTeam").doc(email).delete();
  clearServerCache("master-team:");

  return NextResponse.json({ ok: true, email });
}
