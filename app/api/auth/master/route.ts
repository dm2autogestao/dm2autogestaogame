import { NextResponse } from "next/server";

export const runtime = "nodejs";

type MasterPayload = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as MasterPayload;
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const masterEmail = (process.env.MASTER_EMAIL ?? "master@franquia.local").toLowerCase();
  const masterPassword = process.env.MASTER_PASSWORD ?? "master123";

  if (email !== masterEmail || password !== masterPassword) {
    return NextResponse.json({ error: "Acesso master nao encontrado." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    session: {
      role: "master",
      unitName: "Franqueadora"
    }
  });
}
