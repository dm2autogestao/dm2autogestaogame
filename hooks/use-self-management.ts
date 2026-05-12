"use client";

import { useEffect, useState } from "react";

export type WeeklyPlan = {
  priority: string;
  focusChannel: string;
  mainGoal: string;
  correctiveAction: string;
  owner: string;
  dueDate: string;
  status: "A fazer" | "Em andamento" | "Concluido";
};

export type HistoryEntry = {
  id: string;
  date: string;
  score: number;
  xp: number;
  bottleneck: string;
  action: string;
};

const STORAGE_KEY = "jornada-comercial-self-management-v1";

const dailyChecklist = [
  "Fazer contatos do dia",
  "Preencher CRM",
  "Fazer follow-up",
  "Registrar motivos de perda",
  "Enviar resumo diario",
  "Pedir indicacao",
  "Reativar cliente antigo"
];

const defaultPlan: WeeklyPlan = {
  priority: "",
  focusChannel: "Passivo Frio",
  mainGoal: "",
  correctiveAction: "",
  owner: "",
  dueDate: "",
  status: "A fazer"
};

type SelfManagementState = {
  weeklyPlan: WeeklyPlan;
  completedDaily: string[];
  history: HistoryEntry[];
};

const defaultState: SelfManagementState = {
  weeklyPlan: defaultPlan,
  completedDaily: [],
  history: []
};

function readState(): SelfManagementState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultState;
    }

    const parsed = JSON.parse(stored) as Partial<SelfManagementState>;
    return {
      weeklyPlan: { ...defaultPlan, ...parsed.weeklyPlan },
      completedDaily: Array.isArray(parsed.completedDaily) ? parsed.completedDaily : [],
      history: Array.isArray(parsed.history) ? parsed.history : []
    };
  } catch {
    return defaultState;
  }
}

export function useSelfManagement() {
  const [state, setState] = useState<SelfManagementState>(defaultState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setState(readState());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [isReady, state]);

  function updatePlan<K extends keyof WeeklyPlan>(field: K, value: WeeklyPlan[K]) {
    setState((current) => ({
      ...current,
      weeklyPlan: {
        ...current.weeklyPlan,
        [field]: value
      }
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

  return {
    ...state,
    dailyChecklist,
    dailyProgress: Math.round((state.completedDaily.length / dailyChecklist.length) * 100),
    updatePlan,
    toggleDaily,
    closeWeek
  };
}
