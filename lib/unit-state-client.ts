"use client";

type UnitStateResponse = {
  exists?: boolean;
  unitId?: string;
  data?: Record<string, unknown>;
};

const CACHE_TTL_MS = 3000;
const unitStateRequests = new Map<string, { expiresAt: number; promise: Promise<UnitStateResponse> }>();

export function getUnitState(unitId: string) {
  const now = Date.now();
  const cached = unitStateRequests.get(unitId);

  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const promise = fetch(`/api/unit-state?unitId=${encodeURIComponent(unitId)}`, {
    credentials: "include"
  })
    .then((response) => response.json() as Promise<UnitStateResponse>)
    .catch((error) => {
      unitStateRequests.delete(unitId);
      throw error;
    });

  unitStateRequests.set(unitId, {
    expiresAt: now + CACHE_TTL_MS,
    promise
  });

  return promise;
}

export function clearUnitStateCache(unitId: string) {
  unitStateRequests.delete(unitId);
}
