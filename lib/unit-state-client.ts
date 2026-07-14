"use client";

type UnitStateResponse = {
  exists?: boolean;
  unitId?: string;
  data?: Record<string, unknown>;
};

type UnitStatePatch = {
  unitName?: string;
  commercialInputs?: unknown;
  gameProgress?: unknown;
  selfManagement?: unknown;
  fillingHistory?: unknown;
};

const CACHE_TTL_MS = 3000;
const unitStateRequests = new Map<string, { expiresAt: number; promise: Promise<UnitStateResponse> }>();
const pendingUpdates = new Map<string, { patch: UnitStatePatch; timeout: ReturnType<typeof setTimeout> }>();
const lastSyncedPayloads = new Map<string, string>();

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

export function scheduleUnitStateUpdate(unitId: string, patch: UnitStatePatch, delayMs = 1500) {
  const pending = pendingUpdates.get(unitId);
  const nextPatch = {
    ...(pending?.patch ?? {}),
    ...patch
  };

  if (pending) {
    clearTimeout(pending.timeout);
  }

  const timeout = setTimeout(() => {
    pendingUpdates.delete(unitId);

    const payload = JSON.stringify({
      unitId,
      ...nextPatch
    });

    if (payload === lastSyncedPayloads.get(unitId)) {
      return;
    }

    lastSyncedPayloads.set(unitId, payload);

    void fetch("/api/unit-state", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: payload
    })
      .then(() => clearUnitStateCache(unitId))
      .catch(() => {
        lastSyncedPayloads.delete(unitId);
      });
  }, delayMs);

  pendingUpdates.set(unitId, {
    patch: nextPatch,
    timeout
  });
}
