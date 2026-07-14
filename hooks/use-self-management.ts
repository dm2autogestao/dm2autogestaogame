"use client";

import { useEffect, useState } from "react";
import { getUnitState, scheduleUnitStateUpdate } from "@/lib/unit-state-client";
import { getLocalUnitStorageKey } from "@/lib/unit-storage";

export type WeeklyPlan = {
  priority: string;
  focusChannel: string;
  mainGoal: string;
  correctiveAction: string;
  alertProblemId: string;
  alertAction: string;
  owner: string;
  dueDate: string;
  status: "A fazer" | "Em andamento" | "Concluído";
};

export type HistoryEntry = {
  id: string;
  date: string;
  score: number;
  xp: number;
  planXp?: number;
  bottleneck: string;
  action: string;
};

export type SavedWeeklyPlan = WeeklyPlan & {
  id: string;
  savedAt: string;
};

const STORAGE_VERSION = "v1";
const LEGACY_STORAGE_KEY = "jornada-comercial-self-management-v1";

const dailyChecklist = [
  "Fazer contatos do dia",
  "Preencher CRM",
  "Fazer follow-up",
  "Registrar motivos de perda",
  "Enviar resumo diário",
  "Pedir indicação",
  "Reativar cliente antigo"
];

const defaultPlan: WeeklyPlan = {
  priority: "",
  focusChannel: "Passivo Frio",
  mainGoal: "",
  correctiveAction: "",
  alertProblemId: "",
  alertAction: "",
  owner: "",
  dueDate: "",
  status: "A fazer"
};

type SelfManagementState = {
  weeklyPlan: WeeklyPlan;
  savedPlans: SavedWeeklyPlan[];
  completedDaily: string[];
  history: HistoryEntry[];
};

const defaultState: SelfManagementState = {
  weeklyPlan: defaultPlan,
  savedPlans: [],
  completedDaily: [],
  history: []
};

function readState(storageKey: string): SelfManagementState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const stored = window.localStorage.getItem(storageKey) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) {
      return defaultState;
    }

    const parsed = JSON.parse(stored) as Partial<SelfManagementState>;
    return {
      weeklyPlan: { ...defaultPlan, ...parsed.weeklyPlan },
      savedPlans: Array.isArray(parsed.savedPlans) ? parsed.savedPlans : [],
      completedDaily: Array.isArray(parsed.completedDaily) ? parsed.completedDaily : [],
      history: Array.isArray(parsed.history) ? parsed.history : []
    };
  } catch {
    return defaultState;
  }
}

export function useSelfManagement(unitId?: string) {
  const [state, setState] = useState<SelfManagementState>(defaultState);
  const [isReady, setIsReady] = useState(false);
  const [loadedStorageKey, setLoadedStorageKey] = useState("");
  const storageKey = getLocalUnitStorageKey(unitId, "selfManagement", STORAGE_VERSION);

  useEffect(() => {
    let isMounted = true;

    async function loadState() {
      const localState = readState(storageKey);

      if (!unitId) {
        if (isMounted) {
          setState(localState);
          setIsReady(true);
          setLoadedStorageKey(storageKey);
        }
        return;
      }

      try {
        const result = await getUnitState(unitId);
        const remoteState = result?.data?.selfManagement as Partial<SelfManagementState> | undefined;

        if (isMounted) {
          setState(remoteState ? {
            weeklyPlan: { ...defaultPlan, ...remoteState.weeklyPlan },
            savedPlans: Array.isArray(remoteState.savedPlans) ? remoteState.savedPlans : [],
            completedDaily: Array.isArray(remoteState.completedDaily) ? remoteState.completedDaily : [],
            history: Array.isArray(remoteState.history) ? remoteState.history : []
          } : localState);
          setIsReady(true);
          setLoadedStorageKey(storageKey);
        }
      } catch {
        if (isMounted) {
          setState(localState);
          setIsReady(true);
          setLoadedStorageKey(storageKey);
        }
      }
    }

    setIsReady(false);
    void loadState();

    return () => {
      isMounted = false;
    };
  }, [storageKey, unitId]);

  useEffect(() => {
    if (isReady && loadedStorageKey === storageKey) {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
      if (unitId) {
        scheduleUnitStateUpdate(unitId, { selfManagement: state });
      }
    }
  }, [isReady, loadedStorageKey, state, storageKey, unitId]);

  function updatePlan<K extends keyof WeeklyPlan>(field: K, value: WeeklyPlan[K]) {
    setState((current) => ({
      ...current,
      weeklyPlan: {
        ...current.weeklyPlan,
        [field]: value
      }
    }));
  }

  function savePlan() {
    setState((current) => ({
      ...current,
      savedPlans: [
        {
          ...current.weeklyPlan,
          id: `${Date.now()}`,
          savedAt: new Date().toLocaleDateString("pt-BR")
        },
        ...current.savedPlans
      ].slice(0, 12)
    }));
  }

  function loadSavedPlan(plan: SavedWeeklyPlan) {
    const { id: _id, savedAt: _savedAt, ...weeklyPlan } = plan;
    setState((current) => ({
      ...current,
      weeklyPlan
    }));
  }

  function toggleDaily(item: string) {
    setState((current) => {
      const exists = current.completedDaily.includes(item);
      return {
        ...current,
        completedDaily: exists
          ? current.completedDaily.filter((currentItem) => currentItem !== item)
          : [...current.completedDaily, item]
      };
    });
  }

  function closeWeek(entry: Omit<HistoryEntry, "id" | "date">) {
    const date = new Date().toLocaleDateString("pt-BR");
    setState((current) => ({
      ...current,
      history: [
        {
          ...entry,
          id: `${Date.now()}`,
          date
        },
        ...current.history
      ].slice(0, 8),
      completedDaily: [],
      weeklyPlan: defaultPlan
    }));
  }

  const planFields = [
    state.weeklyPlan.priority,
    state.weeklyPlan.focusChannel,
    state.weeklyPlan.mainGoal,
    state.weeklyPlan.correctiveAction,
    state.weeklyPlan.alertProblemId,
    state.weeklyPlan.alertAction,
    state.weeklyPlan.owner,
    state.weeklyPlan.dueDate
  ];
  const filledPlanFields = planFields.filter((field) => field.trim()).length;
  const planProgress = Math.round((filledPlanFields / planFields.length) * 100);
  const dailyProgress = Math.round((state.completedDaily.length / dailyChecklist.length) * 100);
  const statusBonus = state.weeklyPlan.status === "Concluído" ? 40 : state.weeklyPlan.status === "Em andamento" ? 20 : 0;
  const weeklyPlanXp = filledPlanFields * 15 + state.completedDaily.length * 5 + statusBonus;
  const planAlert =
    filledPlanFields === 0
      ? "Plano da semana pendente: defina prioridade, meta, ação e responsável."
      : filledPlanFields < planFields.length
        ? "Plano da semana incompleto: finalize os campos para ganhar mais XP."
        : "";

  return {
    isReady,
    ...state,
    dailyChecklist,
    dailyProgress,
    planProgress,
    weeklyPlanXp,
    planAlert,
    updatePlan,
    savePlan,
    loadSavedPlan,
    toggleDaily,
    closeWeek
  };
}
