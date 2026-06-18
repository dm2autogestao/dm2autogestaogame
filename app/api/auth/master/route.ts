import { NextResponse } from "next/server";
import { getDb } from "@/lib/firestore-admin";
import { verifyPassword } from "@/lib/password-security";
import { COOKIE_NAME, createSessionToken, getSessionCookieOptions } from "@/lib/session-security";

export const runtime = "nodejs";

const MASTER_TEAM_DOMAIN = "@doutordm2franquias.com.br";

type MasterPayload = {
  email?: string;
  password?: string;
  remember?: boolean;
};

type MasterTeamData = {
  name?: string;
  email?: string;
  accessRole?: "admin" | "field_manager" | "operations";
  status?: "active" | "blocked";
  passwordHash?: string;
  passwordSalt?: string;
};

function isCorporateMasterEmail(email: string) {
  return email.endsWith(MASTER_TEAM_DOMAIN);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MasterPayload;
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const remember = body.remember === true;
    const masterEmail = (process.env.MASTER_EMAIL ?? "").trim().toLowerCase();
    const masterPassword = process.env.MASTER_PASSWORD ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
    }

    const configuredMasterLogin = Boolean(masterEmail && masterPassword) && email === masterEmail && password === masterPassword;
    let sessionName = "Franqueadora";
    let sessionAccessRole: "admin" | "field_manager" | "operations" = "admin";

    if (!configuredMasterLogin) {
      if (!isCorporateMasterEmail(email)) {
        return NextResponse.json({ error: `Use um e-mail corporativo ${MASTER_TEAM_DOMAIN}.` }, { status: 403 });
      }

      const snapshot = await getDb().collection("masterTeam").doc(email).get();
      if (!snapshot.exists) {
        return NextResponse.json({ error: "Acesso master não encontrado." }, { status: 401 });
      }

      const data = (snapshot.data() ?? {}) as MasterTeamData;
      if (data.status === "blocked") {
        return NextResponse.json({ error: "Este acesso master está bloqueado." }, { status: 403 });
      }

      if (!verifyPassword(password, data.passwordHash, data.passwordSalt)) {
        return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
      }

      sessionName = data.name?.trim() || "Equipe franqueadora";
      sessionAccessRole = data.accessRole ?? "operations";
      await snapshot.ref.set({ lastLoginAt: new Date().toISOString() }, { merge: true });
    }

    const response = NextResponse.json({
      ok: true,
      session: {
        role: "master",
        unitName: sessionName,
        masterEmail: email,
        masterAccessRole: sessionAccessRole
      }
    });
    response.cookies.set(
      COOKIE_NAME,
      createSessionToken({ role: "master", masterEmail: email, masterAccessRole: sessionAccessRole }),
      getSessionCookieOptions({ remember })
    );

    return response;
  } catch (error) {
    console.error("Master login failed", error);
    return NextResponse.json({ error: "Não foi possível validar o acesso agora. Tente novamente em alguns segundos." }, { status: 500 });
  }
}
