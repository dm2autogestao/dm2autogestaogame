"use client";

import { useEffect, useState } from "react";
import type { BlockId } from "@/data/game-data";
import { getLocalUnitStorageKey } from "@/lib/unit-storage";

export type ChannelInput = {
  nomeCampanha: string;
  canalCampanha: CampaignAdChannel;
  investimento: number;
  receita: number;
  ticketMedio: number;
  leads: number;
  interacoes: number;
  agendamentos: number;
  comparecimentos: number;
  vendas: number;
  indicacoes: number;
};

export type CampaignAdChannel = "Meta Ads" | "Google Ads" | "TikTok Ads" | "Indicacao patrocinada" | "Outro";

export type CommercialInputs = Record<"passivo-frio" | "passivo-quente" | "ativo-frio" | "ativo-quente", ChannelInput>;

export type CampaignRecord = ChannelInput & {
  id: string;
  cidade: string;
  createdAt: string;
};

export type CommercialProfile = {
  unitName: string;
  channels: CommercialInputs;
  campaignRoi: ChannelInput;
  campaignRecords: CampaignRecord[];
};

const STORAGE_VERSION = "v2";
const LEGACY_STORAGE_KEY = "jornada-comercial-inputs-v2";

export const defaultCommercialInputs: CommercialInputs = {
  "passivo-frio": {
    nomeCampanha: "",
    canalCampanha: "Meta Ads",
    investimento: 0,
    receita: 0,
    ticketMedio: 0,
    leads: 0,
    interacoes: 0,
    agendamentos: 0,
    comparecimentos: 0,
    vendas: 0,
    indicacoes: 0
  },
  "passivo-quente": {
    nomeCampanha: "",
    canalCampanha: "Meta Ads",
    investimento: 0,
    receita: 0,
    ticketMedio: 0,
    leads: 0,
    interacoes: 0,
    agendamentos: 0,
    comparecimentos: 0,
    vendas: 0,
    indicacoes: 0
  },
  "ativo-frio": {
    nomeCampanha: "",
    canalCampanha: "Meta Ads",
    investimento: 0,
    receita: 0,
    ticketMedio: 0,
    leads: 0,
    interacoes: 0,
    agendamentos: 0,
    comparecimentos: 0,
    vendas: 0,
    indicacoes: 0
  },
  "ativo-quente": {
    nomeCampanha: "",
    canalCampanha: "Meta Ads",
    investimento: 0,
    receita: 0,
    ticketMedio: 0,
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
  channels: defaultCommercialInputs,
  campaignRoi: defaultCommercialInputs["passivo-frio"],
  campaignRecords: []
};

function mergeCommercialInputs(stored: Partial<CommercialInputs>): CommercialInputs {
  return {
    "passivo-frio": { ...defaultCommercialInputs["passivo-frio"], ...stored["passivo-frio"] },
    "passivo-quente": { ...defaultCommercialInputs["passivo-quente"], ...stored["passivo-quente"] },
    "ativo-frio": { ...defaultCommercialInputs["ativo-frio"], ...stored["ativo-frio"] },
    "ativo-quente": { ...defaultCommercialInputs["ativo-quente"], ...stored["ativo-quente"] }
  };
}

function readProfile(storageKey: string): CommercialProfile {
  if (typeof window === "undefined") {
    return defaultProfile;
  }

  try {
    const stored = window.localStorage.getItem(storageKey) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) {
      return defaultProfile;
    }

    const parsed = JSON.parse(stored);
    if (parsed.channels) {
      return {
        unitName: typeof parsed.unitName === "string" && parsed.unitName.trim() ? parsed.unitName : "Sua Unidade",
        channels: mergeCommercialInputs(parsed.channels),
        campaignRoi: { ...defaultCommercialInputs["passivo-frio"], ...parsed.campaignRoi },
        campaignRecords: Array.isArray(parsed.campaignRecords) ? parsed.campaignRecords.map((record: Partial<CampaignRecord>) => ({
          ...defaultCommercialInputs["passivo-frio"],
          ...record,
          id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
          cidade: typeof record.cidade === "string" ? record.cidade : "",
          createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString()
        })) : []
      };
    }

    return {
      unitName: "Sua Unidade",
      channels: mergeCommercialInputs(parsed),
      campaignRoi: defaultCommercialInputs["passivo-frio"],
      campaignRecords: []
    };
  } catch {
    return defaultProfile;
  }
}

export function useCommercialInputs(unitId?: string) {
  const [profile, setProfile] = useState<CommercialProfile>(defaultProfile);
  const [isReady, setIsReady] = useState(false);
  const storageKey = getLocalUnitStorageKey(unitId, "commercialInputs", STORAGE_VERSION);

  useEffect(() => {
    setProfile(readProfile(storageKey));
    setIsReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (isReady) {
      window.localStorage.setItem(storageKey, JSON.stringify(profile));
    }
  }, [profile, isReady, storageKey]);

  function updateUnitName(unitName: string) {
    setProfile((current) => ({ ...current, unitName }));
  }

  function updateChannel<K extends keyof ChannelInput>(channelId: BlockId, field: K, value: ChannelInput[K]) {
    if (!["passivo-frio", "passivo-quente", "ativo-frio", "ativo-quente"].includes(channelId)) {
      return;
    }

    setProfile((current) => ({
      ...current,
      channels: {
        ...current.channels,
        [channelId]: {
          ...current.channels[channelId as keyof CommercialInputs],
          [field]: typeof value === "number" ? (Number.isFinite(value) ? value : 0) : value
        }
      }
    }));
  }

  function clearChannel(channelId: BlockId) {
    if (!["passivo-frio", "passivo-quente", "ativo-frio", "ativo-quente"].includes(channelId)) {
      return;
    }

    setProfile((current) => ({
      ...current,
      channels: {
        ...current.channels,
        [channelId]: defaultCommercialInputs[channelId as keyof CommercialInputs]
      }
    }));
  }

  function updateCampaignRoi<K extends keyof ChannelInput>(field: K, value: ChannelInput[K]) {
    setProfile((current) => ({
      ...current,
      campaignRoi: {
        ...current.campaignRoi,
        [field]: typeof value === "number" ? (Number.isFinite(value) ? value : 0) : value
      }
    }));
  }

  function clearCampaignRoi() {
    setProfile((current) => ({
      ...current,
      campaignRoi: defaultCommercialInputs["passivo-frio"]
    }));
  }

  function addCampaignRecord(record: Omit<CampaignRecord, "id" | "createdAt">) {
    setProfile((current) => ({
      ...current,
      campaignRecords: [
        {
          ...record,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString()
        },
        ...current.campaignRecords
      ]
    }));
  }

  function removeCampaignRecord(id: string) {
    setProfile((current) => ({
      ...current,
      campaignRecords: current.campaignRecords.filter((record) => record.id !== id)
    }));
  }

  return {
    unitName: profile.unitName,
    inputs: profile.channels,
    campaignRoi: profile.campaignRoi,
    campaignRecords: profile.campaignRecords,
    updateUnitName,
    updateChannel,
    clearChannel,
    updateCampaignRoi,
    clearCampaignRoi,
    addCampaignRecord,
    removeCampaignRecord
  };
}

export function calculateInputMetrics(input: ChannelInput) {
  const investimento = Number(input.investimento) || 0;
  const receitaManual = Number(input.receita) || 0;
  const ticketMedio = Number(input.ticketMedio) || 0;
  const leads = Number(input.leads) || 0;
  const agendamentos = Number(input.agendamentos) || 0;
  const comparecimentos = Number(input.comparecimentos) || 0;
  const vendas = Number(input.vendas) || 0;
  const receitaCalculada = vendas > 0 && ticketMedio > 0 ? vendas * ticketMedio : 0;
  const receita = receitaManual > 0 ? receitaManual : receitaCalculada;

  const cpl = investimento > 0 && leads > 0 ? investimento / leads : null;
  const cpa = investimento > 0 && agendamentos > 0 ? investimento / agendamentos : null;
  const cpaComparecimento = investimento > 0 && comparecimentos > 0 ? investimento / comparecimentos : null;
  const cpv = investimento > 0 && vendas > 0 ? investimento / vendas : null;
  const roas = investimento > 0 && receita > 0 ? receita / investimento : null;
  const taxaAgendamento = leads > 0 && agendamentos > 0 ? (agendamentos / leads) * 100 : null;
  const taxaComparecimento = agendamentos > 0 && comparecimentos > 0 ? (comparecimentos / agendamentos) * 100 : null;
  const taxaVenda = comparecimentos > 0 && vendas > 0 ? (vendas / comparecimentos) * 100 : null;

  return {
    receita,
    receitaOrigem: receitaManual > 0 ? "manual" : receitaCalculada > 0 ? "calculada" : "insuficiente",
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
