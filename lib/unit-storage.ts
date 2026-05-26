"use client";

const FRANCHISE_ID = "dm2-franquia";
const LOCAL_PREFIX = "dm2-unit";

export type UnitDataArea = "profile" | "gameProgress" | "commercialInputs" | "selfManagement" | "campaigns";
export type UserRole = "franchise_admin" | "unit_user";

export function normalizeUnitId(unitId?: string) {
  const normalized = (unitId ?? "demo-unit").replace(/\D/g, "");
  return normalized || "demo-unit";
}

export function getFirebaseUnitPath(unitId: string, area: UnitDataArea) {
  const safeUnitId = normalizeUnitId(unitId);
  if (area === "campaigns") {
    return `franchises/${FRANCHISE_ID}/units/${safeUnitId}/campaigns/{campaignId}`;
  }

  return `franchises/${FRANCHISE_ID}/units/${safeUnitId}/${area}/main`;
}

export function getLocalUnitStorageKey(unitId: string | undefined, area: UnitDataArea, version: string) {
  return `${LOCAL_PREFIX}:${normalizeUnitId(unitId)}:${area}:${version}`;
}

export function getFirebaseUserPath(uid = "{uid}") {
  return `franchises/${FRANCHISE_ID}/users/${uid}`;
}

export function getFirebaseClaimsPreview(role: UserRole, unitId?: string) {
  if (role === "franchise_admin") {
    return {
      franchiseId: FRANCHISE_ID,
      role,
      canReadAllUnits: true
    };
  }

  return {
    franchiseId: FRANCHISE_ID,
    role,
    unitId: normalizeUnitId(unitId)
  };
}

export const firestoreRulesPreview = [
  "franchise_admin pode ler todas as units da franchiseId.",
  "unit_user so pode ler/escrever a propria unitId.",
  "status blocked nega login e escrita.",
  "cadastro de franqueadora nao existe no client.",
  "campanhas ficam em units/{unitId}/campaigns/{campaignId}."
];
