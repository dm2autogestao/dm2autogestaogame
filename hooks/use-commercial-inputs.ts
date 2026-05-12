"use client";

import { useEffect, useState } from "react";
import type { BlockId } from "@/data/game-data";

export type ChannelInput = {
  investimento: number;
  receita: number;
  leads: number;
  interacoes: number;
  agendamentos: number;
  comparecimentos: number;
  vendas: number;
  indicacoes: number;
};

export type CommercialInputs = Record<"passivo-frio" | "passivo-quente" | "ativo-frio" | "ativo-quente", ChannelInput>;

export type CommercialProfile = {
  unitName: string;
  channels: CommercialInputs;
};

const STORAGE_KEY = "jornada-comercial-inputs-v2";

export const defaultCommercialInputs: CommercialInputs = {
  "passivo-frio": {
    investimento: 0,
    receita: 0,
    leads: 0,
    interacoes: 0,
    agendamentos: 0,
    comparecimentos: 0,
    vendas: 0,
    indicacoes: 0
  },
  "passivo-quente": {
    investimento: 0,
    receita: 0,
    leads: 0,
    interacoes: 0,
    agendamentos: 0,
    comparecimentos: 0,
    vendas: 0,
    indicacoes: 0
  },
  "ativo-frio": {
    investimento: 0,
    receita: 0,
    leads: 0,
    interacoes: 0,
    agendamentos: 0,
    comparecimentos: 0,
    vendas: 0,
    indicacoes: 0
  },
  "ativo-quente": {
    investimento: 0,
    receita: 0,
    leads: 0,
    interacoes: 0,
    agendamentos: 0,
    comparecimentos: 0,
    vendas: 0,
    indicacoes: 0
  }
};

const defaultProfile: CommercialProfile = {
  unitName: "Sua Unidade",
  channels: defaultCommercialInputs
};

function readProfile(): CommercialProfile {
  if (typeof window === "undefined") {
    return defaultProfile;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultProfile;
    }

    const parsed = JSON.parse(stored);
    if (parsed.channels) {
      return {
        unitName: typeof parsed.unitName === "string" && parsed.unitName.trim() ? parsed.unitName : "Sua Unidade",
        channels: { ...defaultCommercialInputs, ...parsed.channels }
      };
    }

    return {
      unitName: "Sua Unidade",
      channels: { ...defaultCommercialInputs, ...parsed }
    };
  } catch {
    return defaultProfile;
  }
}

export function useCommercialInputs() {
  const [profile, setProfile] = useState<CommercialProfile>(defaultProfile);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setProfile(readProfile());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
  }, [profile, isReady]);

  function updateUnitName(unitName: string) {
    setProfile((current) => ({ ...current, unitName }));
  }

  function updateChannel(channelId: BlockId, field: keyof ChannelInput, value: number) {
    if (!["passivo-frio", "passivo-quente", "ativo-frio", "ativo-quente"].includes(channelId)) {
      return;
    }

    setProfile((current) => ({
      ...current,
      channels: {
        ...current.channels,
        [channelId]: {
          ...current.channels[channelId as keyof CommercialInputs],
          [field]: Number.isFinite(value) ? value : 0
        }
      }
    }));
  }

  return { unitName: profile.unitName, inputs: profile.channels, updateUnitName, updateChannel };
}

export function calculateInputMetrics(input: ChannelInput) {
  const investimento = Number(input.investimento) || 0;
  const receita = Number(input.receita) || 0;
  const leads = Number(input.leads) || 0;
  const interacoes = Number(input.interacoes) || 0;
  const agendamentos = Number(input.agendamentos) || 0;
  const comparecimentos = Number(input.comparecimentos) || 0;
  const vendas = Number(input.vendas) || 0;

  const cpl = leads ? investimento / leads : 0;
  const cpa = agendamentos ? investimento / agendamentos : 0;
  const cpaComparecimento = comparecimentos ? investimento / comparecimentos : 0;
  const cpv = vendas ? investimento / vendas : 0;
  const roas = investimento > 0 ? receita / investimento : 0;
  const taxaAgendamento = interacoes ? (agendamentos / interacoes) * 100 : 0;
  const taxaComparecimento = agendamentos ? (comparecimentos / agendamentos) * 100 : 0;
  const taxaVenda = comparecimentos ? (vendas / comparecimentos) * 100 : 0;

  return {
    cpl,
    cpa,
    cpaComparecimento,
    cpv,
    roas,
    taxaAgendamento,
    taxaComparecimento,
    taxaVenda
  };
}
