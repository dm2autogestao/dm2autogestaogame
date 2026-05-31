"use client";

import { useEffect, useMemo, useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import {
  AlertTriangle,
  Ban,
  BarChart3,
  BellRing,
  Building2,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  CalendarCheck,
  Flame,
  KeyRound,
  Eye,
  LogIn,
  LogOut,
  Map as MapIcon,
  MapPin,
  Medal,
  Mail,
  NotepadText,
  Phone,
  PieChart,
  Pencil,
  PlusCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Trophy,
  TrendingUp,
  Trash2,
  X,
  UserRound,
  Zap
} from "lucide-react";
import { Header } from "@/components/header";
import { JourneyNode } from "@/components/journey-node";
import { LevelCard } from "@/components/level-card";
import { MissionCard } from "@/components/mission-card";
import { ProblemCard } from "@/components/problem-card";
import { ProgressBar } from "@/components/progress-bar";
import { ScoreCard } from "@/components/score-card";
import { SolutionCard } from "@/components/solution-card";
import { XPBadge } from "@/components/xp-badge";
import {
  captureChannels,
  diagnosisRules,
  journeyBlocks,
  levels,
  medals,
  missions,
  problems,
  processNodes,
  sellerTraining
} from "@/data/game-data";
import type { BlockId, CaptureChannel, FunnelStep } from "@/data/game-data";
import { calculateInputMetrics, useCommercialInputs } from "@/hooks/use-commercial-inputs";
import type { CampaignRecord, ChannelInput, CommercialInputs } from "@/hooks/use-commercial-inputs";
import { useGameProgress } from "@/hooks/use-game-progress";
import { useSelfManagement } from "@/hooks/use-self-management";
import type { SavedWeeklyPlan, WeeklyPlan } from "@/hooks/use-self-management";
import {
  getFirebaseUnitPath,
  getLocalUnitStorageKey
} from "@/lib/unit-storage";
import { maskCnpj, maskEmail } from "@/lib/data-masking";
import { firebaseAuth, googleProvider } from "@/lib/firebase-client";

type AuthRole = "franchisee" | "master";
type AuthView = "login" | "register" | "recover";

type AuthSession = {
  role: AuthRole;
  cnpj?: string;
  unitName?: string;
  responsibleName?: string;
  city?: string;
  state?: string;
};

type RegisteredUnit = {
  unitName: string;
  responsibleName: string;
  cnpj: string;
  email: string;
  phone: string;
  cnpjMasked?: string;
  emailMasked?: string;
  phoneMasked?: string;
  city?: string;
  state?: string;
  password?: string;
  status: "pending" | "active" | "blocked";
  createdAt: string;
  updatedAt?: string;
  commercialInputs?: CommercialProfileSnapshot;
  gameProgress?: ProgressSnapshot;
  selfManagement?: SelfManagementSnapshot;
};

type GoogleLoginResult =
  | AuthSession
  | RegisteredUnit
  | {
      pending: true;
      message: string;
    }
  | {
      profileRequired: true;
      idToken: string;
      email: string;
      displayName: string;
      message: string;
    };

type GoogleProfileState = {
  idToken: string;
  email: string;
  displayName: string;
};

type MasterUnitForm = {
  unitName: string;
  responsibleName: string;
  cnpj: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  password: string;
};

type MasterUnitSummary = {
  unit: RegisteredUnit;
  score: number;
  xp: number;
  roi: number | null;
  levelName: string;
  completedMissions: number;
  totalMissions: number;
  blockProgress: Array<{ id: BlockId; label: string; percent: number; color: string }>;
  channels?: CommercialInputs;
  campaignRoi: ChannelInput;
  campaignRecords: CampaignRecord[];
  weeklyPlan?: WeeklyPlan;
  savedPlans?: SavedWeeklyPlan[];
  history: Array<{ id?: string; date: string; score: number; xp: number; bottleneck: string; action: string }>;
  lastActivity: string;
  firebasePaths: string[];
};

const AUTH_SESSION_KEY = "dm2-auth-session-v1";
const AUTH_REMEMBER_KEY = "dm2-auth-remember-v1";
const REGISTERED_UNITS_KEY = "dm2-registered-units-v1";

const navItems = [
  { id: "journey", label: "Jornada", icon: MapIcon, group: "Operação" },
  { id: "missions", label: "Metas", icon: ClipboardCheck, group: "Operação" },
  { id: "score", label: "Métricas", icon: BarChart3, group: "Indicadores" },
  { id: "problems", label: "Ações", icon: ShieldAlert, group: "Indicadores" },
  { id: "management", label: "Gestão", icon: CalendarCheck, group: "Rotina" }
  ,{ id: "campaign-log", label: "Campanhas", icon: Calculator, group: "Indicadores" }
];

const masterNavItems = [
  { id: "overview", label: "Geral", icon: BarChart3, group: "Rede" },
  { id: "analytics", label: "Analytics", icon: PieChart, group: "Rede" },
  { id: "units", label: "Unidades", icon: Building2, group: "Rede" },
  { id: "register", label: "Cadastrar", icon: PlusCircle, group: "Controle" },
  { id: "approvals", label: "Aprovações", icon: ShieldCheck, group: "Controle" },
  { id: "correctives", label: "Ações", icon: ShieldAlert, group: "Controle" },
  { id: "campaigns", label: "Campanhas", icon: Calculator, group: "Performance" },
  { id: "rankings", label: "Rankings", icon: Trophy, group: "Performance" }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("journey");
  const [openProblemId, setOpenProblemId] = useState(problems[0].id);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const activeUnitId = authSession?.role === "franchisee" ? authSession.cnpj : undefined;
  const game = useGameProgress(activeUnitId);
  const commercial = useCommercialInputs(activeUnitId);
  const selfManagement = useSelfManagement(activeUnitId);

  const selectedBlock = journeyBlocks.find((block) => block.id === game.selectedBlockId) ?? journeyBlocks[0];
  const SelectedBlockIcon = selectedBlock.icon;
  const selectedBlockProgress = game.blockProgress.find((block) => block.id === selectedBlock.id);
  const selectedMissions = missions.filter((mission) => mission.blockId === selectedBlock.id);
  const selectedMissionXp = selectedMissions.filter((mission) => game.completedSet.has(mission.id)).reduce((sum, mission) => sum + mission.xp, 0);
  const selectedChannel = captureChannels.find((channel) => channel.id === selectedBlock.id);
  const openProblem = problems.find((problem) => problem.id === openProblemId) ?? problems[0];
  const OpenProblemIcon = openProblem.icon;

  const scoreBlocks = game.blockProgress.map((block) => ({
    label: block.name.replace("Pilar 1: ", "").replace("Pilar 3: ", ""),
    score: block.percent,
    color: block.accent,
    id: block.id
  }));
  const score = Math.round(scoreBlocks.reduce((sum, block) => sum + block.score, 0) / scoreBlocks.length);
  const weakestBlock = [...scoreBlocks].sort((a, b) => a.score - b.score)[0];
  const diagnosis = diagnosisRules.find((rule) => rule.blockId === weakestBlock?.id)?.text ?? "Continue executando metas e corrigindo gargalos semanalmente.";

  const unitName = commercial.unitName.trim() || "Sua Unidade";
  const nextMove = getNextMove(commercial.inputs, weakestBlock?.id, diagnosis);
  const weeklyActionKey = selfManagement.weeklyPlan.alertProblemId && selfManagement.weeklyPlan.alertAction
    ? `${selfManagement.weeklyPlan.alertProblemId}:${selfManagement.weeklyPlan.alertAction}`
    : "";
  const weeklyActionDone = weeklyActionKey ? game.solutionsSet.has(weeklyActionKey) : false;
  const weeklyProblem = problems.find((problem) => problem.id === selfManagement.weeklyPlan.alertProblemId);
  const weeklyMetricAlert = weeklyActionKey && !weeklyActionDone
    ? {
        title: weeklyProblem?.title ?? "Plano semanal",
        action: selfManagement.weeklyPlan.alertAction,
        metric: weeklyProblem?.metric ?? "Ação corretiva pendente",
        problemId: selfManagement.weeklyPlan.alertProblemId
      }
    : null;

  function openMissions(blockId: BlockId) {
    game.selectBlock(blockId);
    setActiveTab("missions");
  }

  useEffect(() => {
    setAuthSession(readAuthSession());
  }, []);

  useEffect(() => {
    if (authSession?.role === "franchisee" && authSession.unitName) {
      commercial.updateUnitName(authSession.unitName);
    }
  }, [authSession?.role, authSession?.unitName]);

  function startSession(session: AuthSession, remember = false) {
    setAuthSession(session);
    if (typeof window !== "undefined") {
      if (remember) {
        window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
        window.localStorage.setItem(AUTH_REMEMBER_KEY, "true");
      } else {
        window.localStorage.removeItem(AUTH_SESSION_KEY);
        window.localStorage.removeItem(AUTH_REMEMBER_KEY);
      }
    }
  }

  function logout() {
    void fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include"
    }).catch(() => undefined);
    if (firebaseAuth) {
      void signOut(firebaseAuth).catch(() => undefined);
    }
    setAuthSession(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
      window.localStorage.removeItem(AUTH_REMEMBER_KEY);
    }
  }

  if (!authSession) {
    return <AuthScreen onAuthenticated={startSession} />;
  }

  if (authSession.role === "master") {
    return <MasterDashboard session={authSession} onLogout={logout} />;
  }

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-5 sm:px-6 md:flex-row lg:px-8">
        <SideNavigation
          title="Franqueado"
          subtitle={`${authSession.unitName ?? unitName} - ${maskCnpj(authSession.cnpj ?? "")}`}
          items={navItems}
          active={activeTab}
          onChange={setActiveTab}
          onLogout={logout}
        />

        <div className="min-w-0 flex-1 pb-10">
          <Header xp={game.totalXp} level={game.currentLevel} unitName={unitName} />
          <div className="mt-5">
          {activeTab === "journey" ? (
            <Screen key="journey">
              <LevelCard level={game.currentLevel} xp={game.totalXp} progress={game.levelProgress} nextLevelName={game.nextLevel?.name} />

              <section className="mt-5 rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Como jogar</p>
                    <h2 className="text-xl font-black text-ink">Veja a fase, conclua metas, ganhe XP e corrija gargalos.</h2>
                  </div>
                  <div className="hidden h-14 w-14 place-items-center rounded-3xl bg-limepop text-emerald-700 sm:grid">
                    <Zap className="h-7 w-7 fill-current" />
                  </div>
                </div>
                <div className="mt-4">
                  <ProgressBar value={game.executionPercent} color={game.currentLevel.color} label="Evolução da unidade" />
                </div>
              </section>

              <section className="mt-6">
                <div className="mb-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Mapa da jornada</p>
                  <h1 className="text-2xl font-black text-ink">Organograma comercial gamificado</h1>
                </div>

                <div className="rounded-[32px] border border-white/80 bg-white/85 p-4 shadow-soft backdrop-blur">
                  <div className="grid gap-3">
                    {processNodes.map((node, index) => {
                      const Icon = node.icon;
                      return (
                        <div
                          key={node.id}
                          className="mx-auto flex w-full max-w-md items-center gap-3 rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm"
                        >
                          <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ backgroundColor: node.color }}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-black text-ink">{node.title}</h3>
                            <p className="text-xs font-bold text-slate-500">{node.subtitle}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1.5fr_1fr]">
                    <StageColumn title="Pilar 1" subtitle="Estratégia">
                      <JourneyMiniCard blockId="icp" onStart={openMissions} progress={game.blockProgress} />
                    </StageColumn>

                    <StageColumn title="Pilar 2" subtitle="Canais de Captação">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {captureChannels.map((channel) => (
                          <JourneyMiniCard key={channel.id} blockId={channel.id} onStart={openMissions} progress={game.blockProgress} />
                        ))}
                      </div>
                    </StageColumn>

                    <StageColumn title="Pilar 3" subtitle="Execução">
                      <JourneyMiniCard blockId="vendedor" onStart={openMissions} progress={game.blockProgress} />
                      <div className="mt-3 grid gap-3">
                        <JourneyMiniCard blockId="indicadores" onStart={openMissions} progress={game.blockProgress} compact />
                        <JourneyMiniCard blockId="intervencoes" onStart={openMissions} progress={game.blockProgress} compact />
                      </div>
                    </StageColumn>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  {game.blockProgress.map((block, index) => (
                    <JourneyNode
                      key={block.id}
                      name={block.name}
                      short={block.short}
                      icon={block.icon}
                      accent={block.accent}
                      xp={block.xp}
                      progress={block.percent}
                      status={block.status}
                      index={index}
                      onStart={() => openMissions(block.id)}
                    />
                  ))}
                </div>
              </section>
            </Screen>
          ) : null}

          {activeTab === "missions" ? (
            <Screen key="missions">
              <section className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
                <div className="flex items-start gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-3xl text-white" style={{ backgroundColor: selectedBlock.accent }}>
                    <SelectedBlockIcon className="h-8 w-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Fase ativa</p>
                    <h1 className="text-2xl font-black text-ink">{selectedBlock.name}</h1>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{selectedBlock.explanation}</p>
                  </div>
                </div>
                <div className="mt-5">
                  <ProgressBar value={selectedBlockProgress?.percent ?? 0} color={selectedBlock.accent} label="Progresso da fase" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <ScoreCard label="XP ganho" value={`${selectedMissionXp}`} icon={Sparkles} color={selectedBlock.accent} />
                  <ScoreCard label="Metas" value={`${selectedBlockProgress?.completed ?? 0}/${selectedBlockProgress?.total ?? 0}`} icon={CheckCircle2} color="#58CC02" />
                  <ScoreCard label="Streak exemplo" value="7 dias" icon={Flame} color="#F97316" />
                  <ScoreCard label="Status" value={selectedBlockProgress?.status === "done" ? "Concluído" : selectedBlockProgress?.status === "locked" ? "Bloqueado" : "Em jogo"} icon={Trophy} color="#FFC800" />
                </div>

                {(selectedBlockProgress?.percent ?? 0) === 100 ? (
                  <div className="mt-4 flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amberpop text-white">
                      <Medal className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="font-black text-amber-800">Parabéns, fase completa!</p>
                      <p className="text-xs font-bold text-amber-700">{medals.find((medal) => medal.blockId === selectedBlock.id)?.title ?? "Medalha desbloqueada"}</p>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="mt-5">
                <div className="mb-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {journeyBlocks.map((block) => {
                    const Icon = block.icon;
                    const active = block.id === selectedBlock.id;
                    return (
                      <button
                        key={block.id}
                        type="button"
                        onClick={() => game.selectBlock(block.id)}
                        className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black ${
                          active ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {block.name.replace("Pilar 1: ", "").replace("Pilar 3: ", "")}
                      </button>
                    );
                  })}
                </div>
              </section>

              {selectedChannel ? (
                <ChannelPlaybook channel={selectedChannel} />
              ) : null}
              {selectedBlock.id === "vendedor" ? <SellerPlaybook /> : null}

              <section className="mt-5">
                <h2 className="mb-3 text-xl font-black text-ink">Metas da fase</h2>
                <div className="space-y-3">
                  {selectedMissions.map((mission) => (
                    <MissionCard
                      key={mission.id}
                      title={mission.title}
                      xp={mission.xp}
                      done={game.completedSet.has(mission.id)}
                      onToggle={() => game.toggleMission(mission.id)}
                    />
                  ))}
                </div>
              </section>
            </Screen>
          ) : null}

          {activeTab === "score" ? (
            <Screen key="score">
              <section className="overflow-hidden rounded-[32px] border border-emerald-900/10 bg-gradient-to-br from-ink to-emerald-900 p-5 text-white shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-white/50">Métricas da operação</p>
                    <h1 className="mt-1 text-5xl font-black">{score}%</h1>
                    <p className="mt-2 text-sm font-bold text-white/75">{diagnosis}</p>
                  </div>
                  <div className="grid h-16 w-16 place-items-center rounded-3xl bg-meadow text-white">
                    <Trophy className="h-8 w-8 fill-current" />
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-3xl bg-white/10 p-4">
                    <p className="text-xs font-black uppercase text-white/50">XP total</p>
                    <p className="mt-1 text-2xl font-black">{game.totalXp}</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4">
                    <p className="text-xs font-black uppercase text-white/50">Execução</p>
                    <p className="mt-1 text-2xl font-black">{game.executionPercent}%</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4 sm:col-span-2">
                    <p className="text-xs font-black uppercase text-white/50">Maturidade comercial</p>
                    <p className="mt-1 text-xl font-black">{game.currentLevel.name}</p>
                  </div>
                </div>
              </section>

              {weeklyMetricAlert ? (
                <section className="mt-5 rounded-[32px] border border-amber-200 bg-amber-50 p-5 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <BellRing className="mt-1 h-6 w-6 text-amber-600" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-amber-700">Alerta vinculado ao plano semanal</p>
                        <h2 className="mt-1 text-xl font-black text-ink">{weeklyMetricAlert.title}</h2>
                        <p className="mt-1 text-sm font-bold text-amber-900">Ação pendente: {weeklyMetricAlert.action}</p>
                        <p className="mt-1 text-xs font-bold text-amber-800">{weeklyMetricAlert.metric}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenProblemId(weeklyMetricAlert.problemId);
                        setActiveTab("problems");
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl border-2 border-b-4 border-amber-600 bg-amber-500 px-4 py-2 text-xs font-black uppercase text-white transition active:translate-y-1 active:border-b-2"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Resolver em ações
                    </button>
                  </div>
                </section>
              ) : null}

              <section className="mt-5 rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
                <h2 className="mb-4 text-xl font-black text-ink">Métricas por blocos</h2>
                <div className="space-y-3">
                  {scoreBlocks.map((area) => (
                    <ProgressBar key={area.id} value={area.score} color={area.color} label={area.label} />
                  ))}
                </div>
              </section>

              <CommercialDataPanel
                unitName={commercial.unitName}
                inputs={commercial.inputs}
                onUnitNameChange={commercial.updateUnitName}
                onUpdate={commercial.updateChannel}
              />

              <RoasCalculator
                title="ROI de Campanha"
                subtitle="Campanha realizada ou nova análise"
                fieldPrefix="campaign-roi"
                accent="#14B8A6"
                icon={Calculator}
                input={commercial.campaignRoi}
                onUpdate={commercial.updateCampaignRoi}
                onClear={commercial.clearCampaignRoi}
              />

              <section className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
                  <h2 className="mb-3 text-xl font-black text-ink">Medalhas</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {medals.map((medal) => {
                      const Icon = medal.icon;
                      const earned = game.completedMedalBlockIds.includes(medal.blockId);
                      return (
                        <div key={medal.id} className={`rounded-3xl border p-4 ${earned ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
                          <Icon className={`h-7 w-7 ${earned ? "text-amber-500" : "text-slate-300"}`} />
                          <p className="mt-2 text-sm font-black text-ink">{medal.title}</p>
                          <p className="text-xs font-bold text-slate-500">{earned ? "Desbloqueada" : "Complete a fase"}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
                  <h2 className="mb-1 text-xl font-black text-ink">Posição da unidade</h2>
                  <p className="mb-3 text-xs font-bold text-slate-500">Sem unidades mockadas. Este card mostra apenas o desempenho registrado neste navegador.</p>
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-sm font-black text-emerald-700">1</div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-ink">{unitName}</p>
                        <p className="text-xs font-bold text-slate-500">{game.currentLevel.name}</p>
                      </div>
                      <XPBadge xp={game.totalXp} />
                    </div>
                    <div className="mt-4">
                      <ProgressBar value={game.executionPercent} color={game.currentLevel.color} label="Execução da unidade" />
                    </div>
                  </div>
                </div>
              </section>
            </Screen>
          ) : null}

          {activeTab === "problems" ? (
            <Screen key="problems">
              <section className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
                <div className="flex items-start gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-3xl bg-coral text-white">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Guia de decisão</p>
                    <h1 className="text-2xl font-black text-ink">Problema → diagnóstico → ação → XP</h1>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      Escolha o gargalo, veja causas prováveis, aplique uma ação corretiva e acompanhe a métrica que precisa melhorar.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-5 grid gap-3 md:grid-cols-3">
                <GuidanceCard
                  title="1. Ache a etapa"
                  text="Olhe se o problema está em lead, resposta, agenda, comparecimento, venda, indicação ou rotina."
                  icon={BarChart3}
                />
                <GuidanceCard
                  title="2. Escolha uma ação"
                  text="Não tente corrigir tudo ao mesmo tempo. Aplique uma ação por semana e acompanhe a métrica."
                  icon={ShieldAlert}
                />
                <GuidanceCard
                  title="3. Rode o ciclo"
                  text="Meça o resultado em 7 dias. Se melhorou, padronize. Se não melhorou, teste a próxima ação."
                  icon={Sparkles}
                />
              </section>

              <section className="mt-5 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-3">
                  {problems.map((problem) => (
                    <ProblemCard
                      key={problem.id}
                      title={problem.title}
                      symptom={problem.symptom}
                      icon={problem.icon}
                      open={openProblem.id === problem.id}
                      onClick={() => setOpenProblemId(problem.id)}
                    />
                  ))}
                </div>

                <div key={openProblem.id} className="sticky top-24 h-fit rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-3xl bg-skyjoy text-white">
                      <OpenProblemIcon className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Diagnóstico provável</p>
                      <h2 className="text-xl font-black text-ink">{openProblem.title}</h2>
                      <p className="mt-1 text-xs font-black text-emerald-600">{openProblem.metric}</p>
                    </div>
                  </div>

                  <div className="mb-4 rounded-3xl bg-slate-50 p-4">
                    <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Causas prováveis</p>
                    <div className="flex flex-wrap gap-2">
                      {openProblem.causes.map((cause) => (
                        <span key={cause} className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
                          {cause}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {openProblem.actions.map((action) => (
                      <SolutionCard
                        key={action}
                        title={action}
                        xp={openProblem.xp}
                        applied={game.solutionsSet.has(`${openProblem.id}:${action}`)}
                        planned={weeklyActionKey === `${openProblem.id}:${action}`}
                        onToggle={() => game.toggleSolution(openProblem.id, action)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            </Screen>
          ) : null}

          {activeTab === "campaign-log" ? (
            <Screen key="campaign-log">
              <CampaignLog
                unitCity={authSession.city ?? ""}
                records={commercial.campaignRecords}
                onAdd={commercial.addCampaignRecord}
                onRemove={commercial.removeCampaignRecord}
              />
            </Screen>
          ) : null}

          {activeTab === "management" ? (
            <Screen key="management">
              <section className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
                <div className="flex items-start gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-3xl bg-meadow text-white">
                    <CalendarCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Autogestão comercial</p>
                    <h1 className="text-2xl font-black text-ink">Plano da semana e próximo movimento</h1>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      Transforme métricas em rotina: escolha foco, execute o dia, registre aprendizado e avance.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-5 grid gap-4 xl:grid-cols-[1fr_1.1fr]">
                <NextMoveCard nextMove={nextMove} />
                <WeeklyPlanCard
                  plan={selfManagement.weeklyPlan}
                  planProgress={selfManagement.planProgress}
                  weeklyPlanXp={selfManagement.weeklyPlanXp}
                  planAlert={selfManagement.planAlert}
                  savedPlans={selfManagement.savedPlans}
                  actionDone={weeklyActionDone}
                  onUpdate={selfManagement.updatePlan}
                  onSave={selfManagement.savePlan}
                  onLoad={selfManagement.loadSavedPlan}
                />
              </section>

              <section className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <DailyChecklistCard
                  items={selfManagement.dailyChecklist}
                  completed={selfManagement.completedDaily}
                  progress={selfManagement.dailyProgress}
                  onToggle={selfManagement.toggleDaily}
                />
                <HistoryCard
                  history={selfManagement.history}
                  score={score}
                  xp={game.totalXp}
                  planXp={selfManagement.weeklyPlanXp}
                  bottleneck={weakestBlock?.label ?? "Sem gargalo"}
                  action={nextMove.action}
                  onCloseWeek={selfManagement.closeWeek}
                />
              </section>
            </Screen>
          ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

type NavigationItem = {
  id: string;
  label: string;
  icon: typeof BarChart3;
  group: string;
};

function SideNavigation({
  title,
  subtitle,
  items,
  active,
  onChange,
  onLogout,
  badges
}: {
  title: string;
  subtitle: string;
  items: NavigationItem[];
  active: string;
  onChange: (id: string) => void;
  onLogout: () => void;
  badges?: Record<string, number | string>;
}) {
  const groups = Array.from(new Set(items.map((item) => item.group)));

  return (
    <>
      <aside className="sticky top-5 hidden w-64 shrink-0 rounded-[32px] border border-white/80 bg-white/88 p-4 shadow-soft backdrop-blur-xl md:block">
        <div className="rounded-[26px] bg-gradient-to-br from-ink to-emerald-900 p-4 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/12 text-emerald-200">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wide text-emerald-300">{title}</p>
              <p className="mt-1 truncate text-sm font-black">{subtitle}</p>
            </div>
          </div>
        </div>

        <nav className="mt-4 space-y-4">
          {groups.map((group) => (
            <div key={group}>
              <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-wide text-slate-400">{group}</p>
              <div className="space-y-2">
                {items.filter((item) => item.group === group).map((item) => {
                  const Icon = item.icon;
                  const isActive = active === item.id;
                  const badge = badges?.[item.id];

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onChange(item.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-black transition ${
                        isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                          : "border-transparent bg-transparent text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <span className="inline-flex min-w-0 items-center gap-3">
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {badge ? (
                        <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-black text-white">{badge}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-5 rounded-[26px] border border-slate-100 bg-slate-50/80 p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-ink">{subtitle}</p>
              <p className="text-[11px] font-bold text-slate-500">{title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-emerald-700 bg-emerald-600 px-3 py-2 text-xs font-black uppercase text-white transition active:translate-y-1 active:border-b-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <div className="mb-4 w-full rounded-[28px] border border-white/80 bg-white/90 p-3 shadow-soft backdrop-blur md:hidden">
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-ink px-3 py-3 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/12 text-emerald-200">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wide text-emerald-300">{title}</p>
              <p className="truncate text-xs font-black">{subtitle}</p>
            </div>
          </div>
          <button type="button" onClick={onLogout} className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            const badge = badges?.[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-2 text-xs font-black transition ${
                  isActive ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-100 bg-slate-50 text-slate-500"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
                {badge ? <span className="rounded-full bg-coral px-1.5 py-0.5 text-[9px] text-white">{badge}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    if (window.localStorage.getItem(AUTH_REMEMBER_KEY) !== "true") {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }

    const stored = window.localStorage.getItem(AUTH_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function readRegisteredUnits(): RegisteredUnit[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(REGISTERED_UNITS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUnits(units: RegisteredUnit[]) {
  if (typeof window !== "undefined") {
    const safeUnits = units.map(({ password, ...unit }) => unit);
    window.localStorage.setItem(REGISTERED_UNITS_KEY, JSON.stringify(safeUnits));
  }
}

async function fetchRegisteredUnitsFromDb() {
  const response = await fetch("/api/units", {
    cache: "no-store",
    credentials: "include"
  });
  if (!response.ok) {
    throw new Error("Não foi possível carregar unidades.");
  }

  const result = await response.json();
  return Array.isArray(result.units) ? result.units as RegisteredUnit[] : [];
}

async function loadRegisteredUnits(allowLocalFallback = true) {
  try {
    const units = await fetchRegisteredUnitsFromDb();
    saveRegisteredUnits(units);
    return units;
  } catch {
    if (!allowLocalFallback) {
      throw new Error("Sessao master expirada ou sem permissao para carregar unidades.");
    }

    return readRegisteredUnits();
  }
}

async function saveUnitToDb(unit: RegisteredUnit) {
  await fetch("/api/units", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(unit)
  });
}

async function updateUnitInDb(originalCnpj: string, data: Partial<RegisteredUnit> & { resetPassword?: boolean }) {
  await fetch("/api/units", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originalCnpj, ...data })
  });
}

async function deleteUnitFromDb(cnpj: string) {
  await fetch(`/api/units?unitId=${encodeURIComponent(cnpj)}`, {
    method: "DELETE",
    credentials: "include"
  });
}

async function readJsonResponse(response: Response, fallbackMessage: string) {
  const text = await response.text();

  if (!text.trim()) {
    return { error: fallbackMessage };
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: fallbackMessage };
  }
}

async function loginUnitOnServer(identifier: string, password: string, remember: boolean) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password, remember })
  });
  const result = await readJsonResponse(response, "Não foi possível validar o login agora. Tente novamente em alguns segundos.");

  if (!response.ok) {
    throw new Error(result.error ?? "CNPJ, e-mail ou senha incorretos.");
  }

  return result.unit as RegisteredUnit;
}

async function loginMasterOnServer(email: string, password: string, remember: boolean) {
  const response = await fetch("/api/auth/master", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, remember })
  });
  const result = await readJsonResponse(response, "Não foi possível validar o acesso master agora. Tente novamente em alguns segundos.");

  if (!response.ok) {
    throw new Error(result.error ?? "Acesso master não encontrado.");
  }

  return result.session as AuthSession;
}

async function loginWithGoogleOnServer(role: AuthRole, remember: boolean): Promise<GoogleLoginResult> {
  if (!firebaseAuth) {
    throw new Error("Firebase não está configurado para login com Google.");
  }

  const credential = await signInWithPopup(firebaseAuth, googleProvider);
  const idToken = await credential.user.getIdToken();
  const response = await fetch("/api/auth/google", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, role, remember })
  });
  const result = await readJsonResponse(response, "Não foi possível validar o login com Google agora.");

  if (!response.ok) {
    await signOut(firebaseAuth).catch(() => undefined);
    throw new Error(result.error ?? "Não foi possível validar o login com Google agora.");
  }

  if (result.profileRequired) {
    await signOut(firebaseAuth).catch(() => undefined);
    return {
      profileRequired: true,
      idToken,
      email: result.email ?? credential.user.email ?? "",
      displayName: result.displayName ?? credential.user.displayName ?? "",
      message: result.message ?? "Complete os dados da unidade para enviar o cadastro Google para aprovação."
    };
  }

  if (result.pending) {
    await signOut(firebaseAuth).catch(() => undefined);
    return {
      pending: true,
      message: result.message ?? "Cadastro enviado para aprovação. A franqueadora precisa liberar sua unidade antes do primeiro acesso."
    };
  }

  return role === "master" ? (result.session as AuthSession) : (result.unit as RegisteredUnit);
}

async function sendGoogleProfileForApproval(idToken: string, profile: typeof initialRegisterState, remember: boolean) {
  const response = await fetch("/api/auth/google", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken,
      role: "franchisee",
      remember,
      unitName: profile.unitName.trim(),
      responsibleName: profile.responsibleName.trim(),
      cnpj: profile.cnpj,
      phone: profile.phone.trim(),
      city: profile.city.trim(),
      state: profile.state.trim().toUpperCase()
    })
  });
  const result = await readJsonResponse(response, "Não foi possível enviar o cadastro Google agora.");

  if (!response.ok) {
    throw new Error(result.error ?? "Não foi possível enviar o cadastro Google agora.");
  }

  return result as { pending?: boolean; message?: string };
}

async function recoverFranchiseePassword(identifier: string) {
  const response = await fetch("/api/auth/recover", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier })
  });
  const result = await readJsonResponse(response, "Não foi possível enviar o e-mail de recuperação agora.");

  if (!response.ok) {
    throw new Error(result.error ?? "Não foi possível enviar o e-mail de recuperação agora.");
  }

  return result.message as string;
}

function normalizeCnpj(value: string) {
  return value.replace(/\D/g, "").slice(0, 14);
}

function formatCnpj(value: string) {
  const digits = normalizeCnpj(value);
  if (digits.length !== 14) {
    return digits || "CNPJ não informado";
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function protectedCnpj(unit: RegisteredUnit) {
  return unit.cnpjMasked ?? maskCnpj(unit.cnpj);
}

function protectedEmail(unit: RegisteredUnit) {
  return unit.emailMasked ?? maskEmail(unit.email);
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function unitMatchesSearch(summary: MasterUnitSummary, search: string) {
  const term = normalizeSearch(search);
  if (!term) {
    return true;
  }

  const haystack = [
    summary.unit.unitName,
    summary.unit.responsibleName,
    summary.unit.email,
    summary.unit.phone,
    summary.unit.city,
    summary.unit.state,
    summary.unit.cnpj,
    formatCnpj(summary.unit.cnpj)
  ]
    .filter(Boolean)
    .join(" ");

  return normalizeSearch(haystack).includes(term);
}

const initialRegisterState = {
  unitName: "",
  responsibleName: "",
  cnpj: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  password: "",
  confirmPassword: ""
};

function AuthScreen({ onAuthenticated }: { onAuthenticated: (session: AuthSession, remember?: boolean) => void }) {
  const [role, setRole] = useState<AuthRole>("franchisee");
  const [view, setView] = useState<AuthView>("login");
  const [message, setMessage] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleProfile, setGoogleProfile] = useState<GoogleProfileState | null>(null);
  const [rememberLogin, setRememberLogin] = useState(false);
  const [login, setLogin] = useState({ cnpj: "", email: "", password: "" });
  const [register, setRegister] = useState(initialRegisterState);
  const [recover, setRecover] = useState({ identifier: "" });

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (role === "master") {
      try {
        onAuthenticated(await loginMasterOnServer(login.email, login.password, rememberLogin), rememberLogin);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Acesso master não encontrado.");
      }
      return;
    }

    let unit: RegisteredUnit;
    try {
      unit = await loginUnitOnServer(login.cnpj.trim(), login.password, rememberLogin);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "CNPJ, e-mail ou senha incorretos. Cadastre a unidade ou recupere a senha.");
      return;
    }

    if (unit.status === "blocked") {
      setMessage("Esta unidade está bloqueada. Fale com a franqueadora para reativar o acesso.");
      return;
    }

    onAuthenticated(
      {
        role: "franchisee",
        cnpj: unit.cnpj,
        unitName: unit.unitName,
        responsibleName: unit.responsibleName,
        city: unit.city,
        state: unit.state
      },
      rememberLogin
    );
  }

  async function submitGoogleLogin() {
    setMessage("");
    setGoogleLoading(true);

    try {
      const result = await loginWithGoogleOnServer(role, rememberLogin);

      if ("profileRequired" in result && result.profileRequired) {
        setGoogleProfile({
          idToken: result.idToken,
          email: result.email,
          displayName: result.displayName
        });
        setRegister((current) => ({
          ...current,
          email: result.email,
          responsibleName: current.responsibleName || result.displayName,
          password: "",
          confirmPassword: ""
        }));
        setView("register");
        setMessage(result.message);
        return;
      }

      if ("pending" in result && result.pending) {
        setMessage(result.message);
        setView("login");
        return;
      }

      if (role === "master") {
        onAuthenticated(result as AuthSession, rememberLogin);
        return;
      }

      const unit = result as RegisteredUnit;
      onAuthenticated(
        {
          role: "franchisee",
          cnpj: unit.cnpj,
          unitName: unit.unitName,
          responsibleName: unit.responsibleName,
          city: unit.city,
          state: unit.state
        },
        rememberLogin
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível entrar com Google agora.");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function submitRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const cnpj = normalizeCnpj(register.cnpj);
    if (!register.unitName.trim() || !register.responsibleName.trim() || cnpj.length !== 14 || !register.email.trim() || !register.city.trim() || !register.state.trim()) {
      setMessage("Preencha unidade, responsável, CNPJ válido, e-mail, cidade e estado.");
      return;
    }

    if (googleProfile) {
      try {
        const result = await sendGoogleProfileForApproval(googleProfile.idToken, { ...register, cnpj }, rememberLogin);
        setGoogleProfile(null);
        setRegister(initialRegisterState);
        setView("login");
        setMessage(result.message ?? "Cadastro enviado para aprovação. A franqueadora precisa liberar sua unidade antes do primeiro acesso.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Não foi possível enviar o cadastro Google agora.");
      }
      return;
    }

    if (register.password.length < 6 || register.password !== register.confirmPassword) {
      setMessage("A senha precisa ter pelo menos 6 caracteres e a confirmação deve ser igual.");
      return;
    }

    const units = await loadRegisteredUnits();
    if (units.some((unit) => unit.cnpj === cnpj)) {
      setMessage("Este CNPJ já possui cadastro. Use login ou recuperação de senha.");
      return;
    }

    const unit: RegisteredUnit = {
      unitName: register.unitName.trim(),
      responsibleName: register.responsibleName.trim(),
      cnpj,
      email: register.email.trim().toLowerCase(),
      phone: register.phone.trim(),
      city: register.city.trim(),
      state: register.state.trim().toUpperCase(),
      password: register.password,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const nextUnits = [...units, unit];
    saveRegisteredUnits(nextUnits);
    await saveUnitToDb(unit);
    setView("login");
    setMessage("Cadastro enviado. A franqueadora precisa aprovar a unidade para liberar o acesso.");
  }

  async function submitRecover(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (role === "master") {
      setMessage("A recuperação da conta master deve ser solicitada ao administrador.");
      return;
    }

    try {
      const recoveryMessage = await recoverFranchiseePassword(recover.identifier);
      setView("login");
      setMessage(recoveryMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar o e-mail de recuperação agora.");
    }
  }

    /*
    const units = await loadRegisteredUnits();
    if (units.some((unit) => unit.cnpj === cnpj)) {
      setMessage("Este CNPJ já possui cadastro. Use login ou recuperação de senha.");
      return;
    }

    const unit: RegisteredUnit = {
      unitName: register.unitName.trim(),
      responsibleName: register.responsibleName.trim(),
      cnpj,
      email: register.email.trim().toLowerCase(),
      phone: register.phone.trim(),
      city: register.city.trim(),
      state: register.state.trim().toUpperCase(),
      password: register.password,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const nextUnits = [...units, unit];
    saveRegisteredUnits(nextUnits);
    await saveUnitToDb(unit);
    setView("login");
    setMessage("Cadastro enviado. A franqueadora precisa aprovar a unidade para liberar o acesso.");
  }

  async function submitRecover(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (role === "master") {
      setMessage("Recuperação master solicitada. Nesta etapa, a conta master continua sem cadastro público.");
      return;
    }

    const units = await loadRegisteredUnits();
    const identifier = normalizeCnpj(recover.identifier);
    const unitIndex = units.findIndex(
      (unit) => unit.cnpj === identifier || unit.email === recover.identifier.trim().toLowerCase()
    );

    if (unitIndex === -1) {
      setMessage("Não encontramos uma unidade com esse CNPJ ou e-mail.");
      return;
    }

    if (recover.password.length < 6 || recover.password !== recover.confirmPassword) {
      setMessage("Informe e confirme uma nova senha com pelo menos 6 caracteres.");
      return;
    }

    const nextUnits = [...units];
    nextUnits[unitIndex] = { ...nextUnits[unitIndex], password: recover.password };
    saveRegisteredUnits(nextUnits);
    await updateUnitInDb(nextUnits[unitIndex].cnpj, { password: recover.password });
    setView("login");
    setMessage("Senha atualizada. Entre com CNPJ ou e-mail e a nova senha.");
    */
  // Bloco antigo de recuperação mantido comentado.

  function switchRole(nextRole: AuthRole) {
    setRole(nextRole);
    setView("login");
    setMessage("");
    setGoogleProfile(null);
  }

  function returnToLogin() {
    setGoogleProfile(null);
    setRegister(initialRegisterState);
    setView("login");
    setMessage("");
  }

  return (
    <main className="grid min-h-screen bg-white text-ink lg:grid-cols-[1.05fr_0.95fr]">
      <section
        className="relative hidden min-h-screen overflow-hidden bg-emerald-950 lg:block"
        style={{
          backgroundImage: "linear-gradient(90deg, rgba(3, 48, 39, 0.12), rgba(3, 48, 39, 0.04)), url('/login-clinic.jpeg')",
          backgroundPosition: "center",
          backgroundSize: "cover"
        }}
      >
      </section>

      <section className="flex min-h-screen items-center justify-center bg-[#F5F8F6] px-4 py-8 sm:px-8">
        <div className="w-full max-w-lg rounded-[34px] border border-white bg-white/90 p-5 shadow-soft backdrop-blur">
          <div className="mb-5 flex items-center justify-center">
            <img src="/login-logo.webp" alt="Logo" className="h-12 w-auto object-contain" />
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2 rounded-[22px] bg-slate-100 p-2">
            <button
              type="button"
              onClick={() => switchRole("franchisee")}
              className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-black transition ${
                role === "franchisee" ? "bg-emerald-600 text-white" : "text-slate-500"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Sou franqueado
            </button>
            <button
              type="button"
              onClick={() => switchRole("master")}
              className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-black transition ${
                role === "master" ? "bg-ink text-white" : "text-slate-500"
              }`}
            >
              <Trophy className="h-4 w-4" />
              Sou franqueadora
            </button>
          </div>

          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
              {view === "login" ? "Acesso seguro" : view === "register" ? (googleProfile ? "Cadastro com Google" : "Novo cadastro") : "Recuperação de senha"}
            </p>
            <h2 className="mt-1 text-2xl font-black text-ink">
              {view === "login" ? (role === "franchisee" ? "Acesse sua unidade" : "Acesse a visão master") : view === "register" ? (googleProfile ? "Complete seu cadastro" : "Cadastre-se") : "Esqueceu sua senha?"}
            </h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              {view === "login"
                ? role === "franchisee" ? "Use CNPJ ou e-mail para entrar." : "Acesso exclusivo da franqueadora."
                : view === "register" ? (googleProfile ? "Confirme os dados da unidade para análise da franqueadora." : "Preencha os dados da unidade para solicitar acesso.") : "Informe os dados para criar uma nova senha."}
            </p>
          </div>

            {message ? (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                {message}
              </div>
            ) : null}

            {view === "login" ? (
              <form onSubmit={submitLogin} className="grid gap-3">
                {role === "franchisee" ? (
                  <AuthInput icon={Building2} label="CNPJ ou e-mail" value={login.cnpj} onChange={(value) => setLogin((current) => ({ ...current, cnpj: value }))} placeholder="00.000.000/0000-00 ou unidade@email.com" />
                ) : (
                  <AuthInput icon={Mail} label="E-mail master" value={login.email} onChange={(value) => setLogin((current) => ({ ...current, email: value }))} placeholder="master@franquia.com" />
                )}
                <AuthInput icon={KeyRound} label="Senha" type="password" value={login.password} onChange={(value) => setLogin((current) => ({ ...current, password: value }))} placeholder="Digite sua senha" />
                <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberLogin}
                    onChange={(event) => setRememberLogin(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                  />
                  Permanecer conectado
                </label>
                <button type="submit" className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-emerald-700 bg-emerald-600 text-sm font-black uppercase text-white transition active:translate-y-1 active:border-b-2">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={submitGoogleLogin}
                  disabled={googleLoading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-slate-200 bg-white text-sm font-black uppercase text-slate-700 transition hover:border-slate-300 active:translate-y-1 active:border-b-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-base font-black text-[#4285F4]">G</span>
                  {googleLoading ? "Conectando..." : "Entrar com Google"}
                </button>
                <div className="mt-2 grid gap-2 text-center text-sm font-black">
                  {role === "franchisee" ? (
                    <button type="button" onClick={() => { setGoogleProfile(null); setView("register"); }} className="text-emerald-700 transition hover:text-emerald-900">
                      Cadastre-se
                    </button>
                  ) : null}
                  <button type="button" onClick={() => setView("recover")} className="text-slate-500 transition hover:text-ink">
                    Esqueceu sua senha?
                  </button>
                </div>
              </form>
            ) : null}

            {view === "register" && role === "franchisee" ? (
              <form onSubmit={submitRegister} className="grid gap-3 sm:grid-cols-2">
                {googleProfile ? (
                  <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 sm:col-span-2">
                    Conta Google validada: {googleProfile.email}
                  </div>
                ) : null}
                <AuthInput icon={Building2} label="Nome da unidade" value={register.unitName} onChange={(value) => setRegister((current) => ({ ...current, unitName: value }))} placeholder="Unidade Centro" />
                <AuthInput icon={UserRound} label="Responsável" value={register.responsibleName} onChange={(value) => setRegister((current) => ({ ...current, responsibleName: value }))} placeholder="Nome do franqueado" />
                <AuthInput icon={Building2} label="CNPJ" value={register.cnpj} onChange={(value) => setRegister((current) => ({ ...current, cnpj: value }))} placeholder="00.000.000/0000-00" />
                {googleProfile ? null : (
                  <AuthInput icon={Mail} label="E-mail" value={register.email} onChange={(value) => setRegister((current) => ({ ...current, email: value }))} placeholder="unidade@email.com" />
                )}
                <AuthInput icon={Phone} label="Telefone" value={register.phone} onChange={(value) => setRegister((current) => ({ ...current, phone: value }))} placeholder="(00) 00000-0000" />
                <AuthInput icon={MapPin} label="Cidade" value={register.city} onChange={(value) => setRegister((current) => ({ ...current, city: value }))} placeholder="São Paulo" />
                <AuthInput icon={MapPin} label="Estado" value={register.state} onChange={(value) => setRegister((current) => ({ ...current, state: value }))} placeholder="SP" />
                {googleProfile ? null : (
                  <>
                    <AuthInput icon={KeyRound} label="Criar senha" type="password" value={register.password} onChange={(value) => setRegister((current) => ({ ...current, password: value }))} placeholder="Mínimo 6 caracteres" />
                    <AuthInput icon={KeyRound} label="Confirmar senha" type="password" value={register.confirmPassword} onChange={(value) => setRegister((current) => ({ ...current, confirmPassword: value }))} placeholder="Repita a senha" />
                  </>
                )}
                <button type="submit" className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-emerald-700 bg-emerald-600 text-sm font-black uppercase text-white transition active:translate-y-1 active:border-b-2 sm:col-span-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {googleProfile ? "Enviar para aprovação" : "Cadastre-se"}
                </button>
                <button type="button" onClick={returnToLogin} className="text-center text-sm font-black text-slate-500 transition hover:text-ink sm:col-span-2">
                  {googleProfile ? "Cancelar cadastro Google" : "Já tenho cadastro"}
                </button>
              </form>
            ) : null}

            {view === "recover" ? (
              <form onSubmit={submitRecover} className="grid gap-3">
                <AuthInput icon={role === "franchisee" ? Building2 : Mail} label={role === "franchisee" ? "CNPJ ou e-mail" : "E-mail master"} value={recover.identifier} onChange={(value) => setRecover((current) => ({ ...current, identifier: value }))} placeholder={role === "franchisee" ? "CNPJ ou e-mail cadastrado" : "master@franquia.com"} />
                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
                  Enviaremos um link de redefinição para o e-mail cadastrado da unidade.
                </p>
                <button type="submit" className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-emerald-700 bg-emerald-600 text-sm font-black uppercase text-white transition active:translate-y-1 active:border-b-2">
                  <KeyRound className="h-4 w-4" />
                  Recuperar senha
                </button>
                <button type="button" onClick={() => setView("login")} className="text-center text-sm font-black text-slate-500 transition hover:text-ink">
                  Voltar para o login
                </button>
              </form>
            ) : null}
        </div>
      </section>
    </main>
  );
}

function AuthTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-xs font-black uppercase transition ${
        active ? "bg-limepop/50 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {label}
    </button>
  );
}

function AuthInput({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</span>
      <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
        <Icon className="h-4 w-4 shrink-0 text-emerald-600" />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-black text-ink outline-none placeholder:text-slate-300"
        />
      </div>
    </label>
  );
}

function MasterDashboard({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  const [units, setUnits] = useState<RegisteredUnit[]>([]);
  const [selectedUnitCnpj, setSelectedUnitCnpj] = useState("");
  const [masterNotice, setMasterNotice] = useState("");
  const [masterTab, setMasterTab] = useState("overview");
  const [detailUnitCnpj, setDetailUnitCnpj] = useState<string | null>(null);
  const [editUnitCnpj, setEditUnitCnpj] = useState<string | null>(null);

  useEffect(() => {
    void loadRegisteredUnits(false)
      .then((nextUnits) => {
        setUnits(nextUnits);
        setMasterNotice("");
      })
      .catch(() => {
        setUnits([]);
        setMasterNotice("Sua sessão master precisa ser renovada. Clique em sair e entre novamente como franqueadora para carregar as unidades.");
      });
  }, []);

  function persistUnits(nextUnits: RegisteredUnit[]) {
    setUnits(nextUnits);
    saveRegisteredUnits(nextUnits);
  }

  function updateUnitStatus(cnpj: string, status: RegisteredUnit["status"]) {
    const nextUnits = units.map((unit) => (
      unit.cnpj === cnpj ? { ...unit, status, updatedAt: new Date().toISOString() } : unit
    ));
    persistUnits(nextUnits);
    void updateUnitInDb(cnpj, { status }).catch(() => setMasterNotice("Status atualizado localmente, mas o banco não confirmou a alteração."));
    setMasterNotice(status === "active" ? "Unidade aprovada e liberada para login." : status === "blocked" ? "Unidade bloqueada." : "Unidade voltou para pendente.");
  }

  function createUnitFromMaster(form: MasterUnitForm) {
    const cnpj = normalizeCnpj(form.cnpj);

    if (!form.unitName.trim() || !form.responsibleName.trim() || cnpj.length !== 14 || !form.email.trim() || !form.city.trim() || !form.state.trim()) {
      return "Preencha unidade, responsável, CNPJ válido, e-mail, cidade e estado.";
    }

    if (form.password && form.password.length < 6) {
      return "A senha precisa ter pelo menos 6 caracteres.";
    }

    if (units.some((unit) => unit.cnpj === cnpj)) {
      return "Este CNPJ já está cadastrado.";
    }

    const nextUnit: RegisteredUnit = {
      unitName: form.unitName.trim(),
      responsibleName: form.responsibleName.trim(),
      cnpj,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      password: form.password,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    persistUnits([...units, nextUnit]);
    void saveUnitToDb(nextUnit).catch(() => setMasterNotice("Unidade salva localmente, mas o banco não confirmou o cadastro."));
    setSelectedUnitCnpj(cnpj);
    setMasterNotice("Unidade cadastrada e liberada para login.");
    return "";
  }

  function updateUnitFromMaster(originalCnpj: string, form: MasterUnitForm) {
    const cnpj = normalizeCnpj(form.cnpj);

    if (!form.unitName.trim() || !form.responsibleName.trim() || cnpj.length !== 14 || !form.email.trim() || !form.city.trim() || !form.state.trim()) {
      return "Preencha unidade, responsável, CNPJ válido, e-mail, cidade e estado.";
    }

    if (form.password && form.password.length < 6) {
      return "A senha precisa ter pelo menos 6 caracteres.";
    }

    if (units.some((unit) => unit.cnpj !== originalCnpj && unit.cnpj === cnpj)) {
      return "Este CNPJ já está cadastrado em outra unidade.";
    }

    const nextUnits = units.map((unit) => unit.cnpj === originalCnpj ? {
      ...unit,
      unitName: form.unitName.trim(),
      responsibleName: form.responsibleName.trim(),
      cnpj,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      ...(form.password ? { password: form.password } : {}),
      updatedAt: new Date().toISOString()
    } : unit);

    persistUnits(nextUnits);
    void updateUnitInDb(originalCnpj, nextUnits.find((unit) => unit.cnpj === cnpj) ?? {
      unitName: form.unitName.trim(),
      responsibleName: form.responsibleName.trim(),
      cnpj,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      ...(form.password ? { password: form.password } : {})
    }).catch(() => setMasterNotice("Dados atualizados localmente, mas o banco não confirmou a alteração."));
    setSelectedUnitCnpj(cnpj);
    setEditUnitCnpj(null);
    setMasterNotice("Dados do franqueado atualizados.");
    return "";
  }

  function resetUnitPassword(cnpj: string) {
    const nextUnits = units.map((unit) => unit.cnpj === cnpj ? { ...unit, updatedAt: new Date().toISOString() } : unit);
    persistUnits(nextUnits);
    void updateUnitInDb(cnpj, { resetPassword: true }).catch(() => setMasterNotice("Senha resetada localmente, mas o banco não confirmou a alteração."));
    setMasterNotice("Senha resetada para 123456.");
  }

  function deleteUnit(cnpj: string) {
    const unit = units.find((item) => item.cnpj === cnpj);
    const confirmed = typeof window === "undefined" || window.confirm(`Excluir ${unit?.unitName ?? "esta unidade"}?`);

    if (!confirmed) {
      return;
    }

    persistUnits(units.filter((item) => item.cnpj !== cnpj));
    void deleteUnitFromDb(cnpj).catch(() => setMasterNotice("Franqueado removido localmente, mas o banco não confirmou a exclusão."));
    setSelectedUnitCnpj("");
    setDetailUnitCnpj(null);
    setEditUnitCnpj(null);
    setMasterNotice("Franqueado excluído da visão master.");
  }

  const summaries = units.map(readMasterUnitSummary);
  const selectedSummary = summaries.find((summary) => summary.unit.cnpj === selectedUnitCnpj) ?? summaries[0];
  const activeUnits = units.filter((unit) => unit.status === "active");
  const averageScore = summaries.length ? Math.round(summaries.reduce((sum, item) => sum + item.score, 0) / summaries.length) : 0;
  const rois = summaries.map((item) => item.roi).filter((roi): roi is number => roi !== null);
  const averageRoi = rois.length ? rois.reduce((sum, roi) => sum + roi, 0) / rois.length : null;
  const criticalUnits = summaries.filter((item) => item.score < 40 || (item.roi !== null && item.roi < 1));
  const pendingSummaries = summaries.filter((item) => item.unit.status === "pending");
  const strongestUnit = [...summaries].sort((a, b) => b.score - a.score)[0];
  const bestRoiUnit = [...summaries].filter((item) => item.roi !== null).sort((a, b) => (b.roi ?? 0) - (a.roi ?? 0))[0];
  const detailSummary = detailUnitCnpj ? summaries.find((summary) => summary.unit.cnpj === detailUnitCnpj) : undefined;
  const editSummary = editUnitCnpj ? summaries.find((summary) => summary.unit.cnpj === editUnitCnpj) : undefined;

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-5 sm:px-6 md:flex-row lg:px-8">
        <SideNavigation
          title="Franqueadora"
          subtitle={session.unitName ?? "Visão master"}
          items={masterNavItems}
          active={masterTab}
          onChange={setMasterTab}
          onLogout={onLogout}
          badges={{ approvals: pendingSummaries.length }}
        />

        <div className="min-w-0 flex-1 pb-10">
          <section className="overflow-hidden rounded-[34px] border border-white/80 bg-white/90 shadow-soft backdrop-blur">
            <div className="grid gap-4 p-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Visão master</p>
                <h1 className="mt-1 text-2xl font-black text-ink">Progresso, campanhas e suporte da rede.</h1>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  Acompanhe as unidades por área e abra detalhes sem misturar os controles.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <MiniMetric label="Pendentes" value={`${pendingSummaries.length}`} />
                <MiniMetric label="Bloqueadas" value={`${units.filter((unit) => unit.status === "blocked").length}`} />
                <MiniMetric label="Ativas" value={`${activeUnits.length}`} />
                <MiniMetric label="Alertas" value={`${criticalUnits.length}`} />
              </div>
            </div>
          </section>

          {masterNotice ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
              {masterNotice}
            </div>
          ) : null}

          {masterTab === "overview" ? (
            <Screen key="master-overview">
              <section className="mt-5 grid gap-3 md:grid-cols-4">
                <MasterMetricTile label="Unidades" value={`${units.length}`} helper={`${activeUnits.length} ativas`} icon={Building2} color="#14B8A6" />
                <MasterMetricTile label="Score médio" value={`${averageScore}%`} helper={strongestUnit ? `Melhor: ${strongestUnit.unit.unitName}` : "Sem unidades"} icon={Trophy} color="#FFC800" />
                <MasterMetricTile label="ROI médio" value={formatMultiplier(averageRoi)} helper={bestRoiUnit ? `Melhor: ${bestRoiUnit.unit.unitName}` : "Sem campanhas"} icon={BarChart3} color="#1CB0F6" />
                <MasterMetricTile label="Alertas" value={`${criticalUnits.length}`} helper="Score baixo ou ROI crítico" icon={ShieldAlert} color="#EF4444" />
              </section>

              <section className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
                <MasterCampaigns summaries={summaries} />
                <MasterRankings summaries={summaries} />
              </section>
            </Screen>
          ) : null}

          {masterTab === "approvals" ? (
            <Screen key="master-approvals">
              <MasterPendingApprovals
                summaries={pendingSummaries}
                onApprove={(cnpj) => updateUnitStatus(cnpj, "active")}
                onBlock={(cnpj) => updateUnitStatus(cnpj, "blocked")}
              />
            </Screen>
          ) : null}

          {masterTab === "analytics" ? (
            <Screen key="master-analytics">
              <MasterAnalytics summaries={summaries} onOpenDetails={(cnpj) => setDetailUnitCnpj(cnpj)} />
            </Screen>
          ) : null}

          {masterTab === "units" ? (
            <Screen key="master-units">
              <MasterUnitsSection
                summaries={summaries}
                selectedSummary={selectedSummary}
                onSelect={setSelectedUnitCnpj}
                onOpenDetails={(cnpj) => setDetailUnitCnpj(cnpj)}
                onEdit={(cnpj) => setEditUnitCnpj(cnpj)}
                onResetPassword={resetUnitPassword}
                onDelete={deleteUnit}
              />
            </Screen>
          ) : null}

          {masterTab === "register" ? (
            <Screen key="master-register">
              <MasterRegisterUnit onCreate={createUnitFromMaster} />
            </Screen>
          ) : null}

          {masterTab === "campaigns" ? (
            <Screen key="master-campaigns">
              <section className="mt-5">
                <MasterCampaigns summaries={summaries} />
              </section>
            </Screen>
          ) : null}

          {masterTab === "correctives" ? (
            <Screen key="master-correctives">
              <MasterCorrectiveActions summaries={summaries} onOpenDetails={(cnpj) => setDetailUnitCnpj(cnpj)} />
            </Screen>
          ) : null}

          {masterTab === "rankings" ? (
            <Screen key="master-rankings">
              <section className="mt-5">
                <MasterRankings summaries={summaries} />
              </section>
            </Screen>
          ) : null}
        </div>
      </div>

      {detailSummary ? <UnitDetailModal summary={detailSummary} onClose={() => setDetailUnitCnpj(null)} /> : null}
      {editSummary ? <EditUnitModal summary={editSummary} onClose={() => setEditUnitCnpj(null)} onSave={updateUnitFromMaster} /> : null}
    </main>
  );
}

function MasterMetricTile({ label, value, helper, icon: Icon, color }: { label: string; value: string; helper: string; icon: typeof BarChart3; color: string }) {
  return (
    <article className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-ink">{value}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: color }}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 truncate text-xs font-bold text-slate-500">{helper}</p>
    </article>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">Buscar</span>
      <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
        <Search className="h-4 w-4 shrink-0 text-emerald-600" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-black text-ink outline-none placeholder:text-slate-300"
        />
      </div>
    </label>
  );
}

function MasterRegisterUnit({ onCreate }: { onCreate: (form: MasterUnitForm) => string }) {
  const [form, setForm] = useState<MasterUnitForm>({
    unitName: "",
    responsibleName: "",
    cnpj: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    password: "123456"
  });
  const [message, setMessage] = useState("");

  function update<K extends keyof MasterUnitForm>(field: K, value: MasterUnitForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = onCreate(form);

    if (error) {
      setMessage(error);
      return;
    }

    setMessage("Unidade cadastrada e liberada para login.");
    setForm({
      unitName: "",
      responsibleName: "",
      cnpj: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      password: "123456"
    });
  }

  return (
    <section className="mt-5 rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Cadastro master</p>
          <h2 className="text-xl font-black text-ink">Cadastrar franqueado</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">Inclua uma unidade já liberada para acesso por CNPJ ou e-mail.</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
          <PlusCircle className="h-6 w-6" />
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {message}
        </div>
      ) : null}

      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <AuthInput icon={Building2} label="Nome da unidade" value={form.unitName} onChange={(value) => update("unitName", value)} placeholder="Unidade Centro" />
        <AuthInput icon={UserRound} label="Responsável" value={form.responsibleName} onChange={(value) => update("responsibleName", value)} placeholder="Nome do franqueado" />
        <AuthInput icon={Building2} label="CNPJ" value={form.cnpj} onChange={(value) => update("cnpj", value)} placeholder="00.000.000/0000-00" />
        <AuthInput icon={Mail} label="E-mail" value={form.email} onChange={(value) => update("email", value)} placeholder="unidade@email.com" />
        <AuthInput icon={Phone} label="Telefone" value={form.phone} onChange={(value) => update("phone", value)} placeholder="(00) 00000-0000" />
        <AuthInput icon={MapPin} label="Cidade" value={form.city} onChange={(value) => update("city", value)} placeholder="São Paulo" />
        <AuthInput icon={MapPin} label="Estado" value={form.state} onChange={(value) => update("state", value)} placeholder="SP" />
        <AuthInput icon={KeyRound} label="Senha inicial" type="password" value={form.password} onChange={(value) => update("password", value)} placeholder="Mínimo 6 caracteres" />
        <button type="submit" className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-emerald-700 bg-emerald-600 text-sm font-black uppercase text-white transition active:translate-y-1 active:border-b-2 sm:col-span-2">
          <CheckCircle2 className="h-4 w-4" />
          Cadastrar franqueado
        </button>
      </form>
    </section>
  );
}

function MasterAnalytics({ summaries, onOpenDetails }: { summaries: MasterUnitSummary[]; onOpenDetails: (cnpj: string) => void }) {
  const analytics = getMasterAnalytics(summaries);
  const [search, setSearch] = useState("");
  const filteredRows = analytics.unitRows.filter((row) => unitMatchesSearch(row.summary, search));

  return (
    <section className="mt-5 space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <MasterMetricTile
          label="Melhor unidade"
          value={analytics.bestUnit?.unit.unitName ?? "Sem dados"}
          helper={analytics.bestUnit ? `${analytics.bestUnit.score}% no game` : "Cadastre unidades"}
          icon={Trophy}
          color="#FFC800"
        />
        <MasterMetricTile
          label="Estado destaque"
          value={analytics.bestState?.label ?? "Sem estado"}
          helper={analytics.bestState ? `${analytics.bestState.average}% de score médio` : "Preencha estado"}
          icon={MapPin}
          color="#14B8A6"
        />
        <MasterMetricTile
          label="Cidade destaque"
          value={analytics.bestCity?.label ?? "Sem cidade"}
          helper={analytics.bestCity ? `${analytics.bestCity.average}% de score médio` : "Preencha cidade"}
          icon={Building2}
          color="#1CB0F6"
        />
        <MasterMetricTile
          label="Melhor plataforma"
          value={analytics.bestPlatform?.label ?? "Sem campanhas"}
          helper={analytics.bestPlatform ? `${formatMultiplier(analytics.bestPlatform.averageRoi)} de ROI médio` : "Preencha ROI"}
          icon={PieChart}
          color="#8B5CF6"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
          <div className="grid gap-3 lg:grid-cols-[1fr_300px] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Performance por unidade</p>
              <h2 className="text-xl font-black text-ink">Quem está performando melhor</h2>
            </div>
            <SearchBox value={search} onChange={setSearch} placeholder="Buscar franqueado..." />
          </div>
          <div className="mt-4 grid gap-3">
            {filteredRows.length ? (
              filteredRows.map((row, index) => (
                <button
                  key={row.summary.unit.cnpj}
                  type="button"
                  onClick={() => onOpenDetails(row.summary.unit.cnpj)}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-emerald-700">#{index + 1}</p>
                      <p className="truncate font-black text-ink">{row.summary.unit.unitName}</p>
                      <p className="truncate text-xs font-bold text-slate-500">{formatLocation(row.summary.unit)}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">{row.performance}%</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <MiniMetric label="Score" value={`${row.summary.score}%`} />
                    <MiniMetric label="ROI" value={formatMultiplier(row.summary.roi)} />
                    <MiniMetric label="XP" value={`${row.summary.xp}`} />
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-3xl bg-slate-50 p-5 text-sm font-bold text-slate-500">Nenhuma unidade cadastrada ainda.</div>
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Plataformas de campanha</p>
          <h2 className="text-xl font-black text-ink">ROI médio por plataforma</h2>
          <div className="mt-4 grid gap-3">
            {analytics.platformRows.length ? (
              analytics.platformRows.map((platform) => (
                <div key={platform.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-ink">{platform.label}</p>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">{formatMultiplier(platform.averageRoi)}</span>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={Math.min(100, Math.round((platform.averageRoi / 6) * 100))} color="#14B8A6" label={`${platform.count} campanha(s)`} compact />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl bg-slate-50 p-5 text-sm font-bold text-slate-500">Nenhuma campanha com ROI preenchido ainda.</div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function MasterCorrectiveActions({ summaries, onOpenDetails }: { summaries: MasterUnitSummary[]; onOpenDetails: (cnpj: string) => void }) {
  const [search, setSearch] = useState("");
  const filteredSummaries = summaries.filter((summary) => unitMatchesSearch(summary, search));
  const criticalSummaries = summaries.filter((summary) => summary.score < 50 || (summary.roi !== null && summary.roi < 2));
  const mainActions = getNetworkCorrectiveActions(summaries);

  return (
    <section className="mt-5 space-y-5">
      <section className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Ações corretivas</p>
            <h2 className="text-xl font-black text-ink">Plano geral da rede</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">Prioridades calculadas a partir do progresso, ROI e funil das unidades.</p>
          </div>
          <XPBadge xp={criticalSummaries.length} label="alertas" tone="gold" />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {mainActions.map((action) => (
            <article key={action.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-ink">{action.title}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{action.reason}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {action.steps.map((step) => (
                  <span key={step} className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">{step}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
        <div className="grid gap-3 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Busca individual</p>
            <h2 className="text-xl font-black text-ink">Ação corretiva por franqueado</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">Pesquise a unidade e veja o próximo movimento recomendado.</p>
          </div>
          <SearchBox value={search} onChange={setSearch} placeholder="Buscar franqueado, cidade, CNPJ..." />
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {filteredSummaries.length ? (
            filteredSummaries.map((summary) => {
              const actions = getUnitCorrectiveActions(summary);
              return (
                <article key={summary.unit.cnpj} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-ink">{summary.unit.unitName}</p>
                      <p className="text-xs font-bold text-slate-500">{formatLocation(summary.unit)} - {protectedCnpj(summary.unit)}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">{summary.score}%</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <MiniMetric label="Score" value={`${summary.score}%`} />
                    <MiniMetric label="ROI" value={formatMultiplier(summary.roi)} />
                    <MiniMetric label="XP" value={`${summary.xp}`} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {actions.map((action) => (
                      <span key={action} className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">{action}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenDetails(summary.unit.cnpj)}
                    className="mt-3 inline-flex items-center gap-2 rounded-2xl border-2 border-b-4 border-emerald-700 bg-emerald-600 px-3 py-2 text-xs font-black uppercase text-white transition active:translate-y-1 active:border-b-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver detalhes
                  </button>
                </article>
              );
            })
          ) : (
            <div className="rounded-3xl bg-slate-50 p-5 text-sm font-bold text-slate-500">Nenhum franqueado encontrado.</div>
          )}
        </div>
      </section>
    </section>
  );
}

function MasterUnitsSection({
  summaries,
  selectedSummary,
  onSelect,
  onOpenDetails,
  onEdit,
  onResetPassword,
  onDelete
}: {
  summaries: MasterUnitSummary[];
  selectedSummary?: MasterUnitSummary;
  onSelect: (cnpj: string) => void;
  onOpenDetails: (cnpj: string) => void;
  onEdit: (cnpj: string) => void;
  onResetPassword: (cnpj: string) => void;
  onDelete: (cnpj: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filteredSummaries = summaries.filter((summary) => unitMatchesSearch(summary, search));

  return (
    <section className="mt-5">
      <div className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Controle da rede</p>
            <h2 className="text-xl font-black text-ink">Unidades da franquia</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">Busque, edite, resete senha, exclua ou abra os detalhes do franqueado.</p>
          </div>
          <SearchBox value={search} onChange={setSearch} placeholder="Buscar por nome, CNPJ, cidade..." />
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          {filteredSummaries.length ? (
            filteredSummaries.map((summary) => {
              const selected = selectedSummary?.unit.cnpj === summary.unit.cnpj;

              return (
                <article
                  key={summary.unit.cnpj}
                  className={`rounded-3xl border p-4 text-left transition ${
                    selected ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-slate-200 bg-slate-50 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-ink">{summary.unit.unitName}</p>
                      <p className="truncate text-xs font-bold text-slate-500">{summary.unit.responsibleName} - {protectedCnpj(summary.unit)}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {formatLocation(summary.unit)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${getUnitStatusClass(summary.unit.status)}`}>
                      {getUnitStatusLabel(summary.unit.status)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <MiniMetric label="Score" value={`${summary.score}%`} />
                    <MiniMetric label="XP" value={`${summary.xp}`} />
                    <MiniMetric label="ROI" value={formatMultiplier(summary.roi)} />
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={summary.score} color="#14B8A6" label="Progresso no game" compact />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onSelect(summary.unit.cnpj)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Selecionar
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenDetails(summary.unit.cnpj)}
                      className="inline-flex items-center gap-2 rounded-2xl border-2 border-b-4 border-emerald-700 bg-emerald-600 px-3 py-2 text-xs font-black uppercase text-white transition active:translate-y-1 active:border-b-2"
                    >
                      <Eye className="h-4 w-4" />
                      Ver detalhes
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(summary.unit.cnpj)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onResetPassword(summary.unit.cnpj)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Resetar senha
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(summary.unit.cnpj)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-3xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
              Nenhuma unidade encontrada.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MasterPendingApprovals({
  summaries,
  onApprove,
  onBlock
}: {
  summaries: MasterUnitSummary[];
  onApprove: (cnpj: string) => void;
  onBlock: (cnpj: string) => void;
}) {
  return (
    <section className="mt-5 rounded-[32px] border border-amber-100 bg-amber-50/90 p-5 shadow-soft backdrop-blur">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-amber-700">Cadastros pendentes</p>
          <h2 className="text-xl font-black text-ink">Aprovar novas unidades</h2>
          <p className="mt-1 text-sm font-bold text-amber-900">Unidades cadastradas pelo acesso de franqueado aguardam liberação da franqueadora.</p>
        </div>
        <XPBadge xp={summaries.length} label="pendentes" tone="gold" />
      </div>

      <div className="grid gap-3">
        {summaries.length ? (
          summaries.map((summary) => (
            <div key={summary.unit.cnpj} className="grid gap-3 rounded-3xl border border-amber-200 bg-white p-4 lg:grid-cols-[1.1fr_0.8fr_0.9fr]">
              <div>
                <p className="font-black text-ink">{summary.unit.unitName}</p>
                <p className="text-xs font-bold text-slate-500">{summary.unit.responsibleName}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">CNPJ</p>
                <p className="text-sm font-black text-slate-700">{protectedCnpj(summary.unit)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <button type="button" onClick={() => onApprove(summary.unit.cnpj)} className="inline-flex items-center gap-2 rounded-2xl border-2 border-b-4 border-emerald-600 bg-emerald-600 px-3 py-2 text-xs font-black uppercase text-white transition active:translate-y-1 active:border-b-2">
                  <ShieldCheck className="h-4 w-4" />
                  Aprovar
                </button>
                <button type="button" onClick={() => onBlock(summary.unit.cnpj)} className="inline-flex items-center gap-2 rounded-2xl border-2 border-b-4 border-red-600 bg-red-500 px-3 py-2 text-xs font-black uppercase text-white transition active:translate-y-1 active:border-b-2">
                  <Ban className="h-4 w-4" />
                  Bloquear
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl bg-white p-4 text-sm font-bold text-slate-500">Nenhum cadastro pendente no momento.</div>
        )}
      </div>
    </section>
  );
}

function MasterRankings({ summaries }: { summaries: MasterUnitSummary[] }) {
  const byScore = [...summaries].sort((a, b) => b.score - a.score).slice(0, 4);
  const byRoi = [...summaries].filter((summary) => summary.roi !== null).sort((a, b) => (b.roi ?? 0) - (a.roi ?? 0)).slice(0, 4);

  return (
    <section className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Comparativos</p>
      <h2 className="text-xl font-black text-ink">Ranking da rede</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <RankingList title="Melhor progresso no game" items={byScore} value={(item) => `${item.score}%`} empty="Sem unidades cadastradas" />
        <RankingList title="Melhor ROI de campanha" items={byRoi} value={(item) => formatMultiplier(item.roi)} empty="Sem campanhas preenchidas" />
      </div>
    </section>
  );
}

function RankingList({ title, items, value, empty }: { title: string; items: MasterUnitSummary[]; value: (item: MasterUnitSummary) => string; empty: string }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <h3 className="text-sm font-black text-ink">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.length ? (
          items.map((item, index) => (
            <div key={item.unit.cnpj} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-xs font-black text-emerald-700">{index + 1}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-ink">{item.unit.unitName}</p>
                <p className="text-xs font-bold text-slate-500">{item.levelName}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{value(item)}</span>
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-white p-3 text-xs font-bold text-slate-500">{empty}</p>
        )}
      </div>
    </div>
  );
}

function getUnitStatusLabel(status: RegisteredUnit["status"]) {
  if (status === "active") {
    return "Ativa";
  }

  if (status === "blocked") {
    return "Bloqueada";
  }

  return "Pendente";
}

function getUnitStatusClass(status: RegisteredUnit["status"]) {
  if (status === "active") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "blocked") {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-700";
}

function MasterCampaigns({ summaries }: { summaries: MasterUnitSummary[] }) {
  const [search, setSearch] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignRecord | null>(null);
  const rows = summaries
    .flatMap((summary) => {
      const records = summary.campaignRecords.length ? summary.campaignRecords : [{
        ...summary.campaignRoi,
        id: `${summary.unit.cnpj}-roi`,
        cidade: summary.unit.city ?? "",
        createdAt: new Date().toISOString()
      }];

      return records.map((campaign) => {
        const metrics = calculateInputMetrics(campaign);
        const hasCampaignData =
          campaign.investimento > 0 ||
          campaign.receita > 0 ||
          campaign.leads > 0 ||
          campaign.vendas > 0 ||
          campaign.nomeCampanha.trim().length > 0;

        return { summary, campaign, metrics, hasCampaignData, status: getRoasStatus(metrics.roas) };
      });
    })
    .filter((row) => row.hasCampaignData)
    .filter((row) => {
      const term = normalizeSearch(search);
      if (!term) {
        return true;
      }

      return normalizeSearch([
        row.summary.unit.unitName,
        row.summary.unit.responsibleName,
        row.campaign.nomeCampanha,
        row.campaign.canalCampanha,
        row.campaign.cidade,
        row.summary.unit.city,
        row.summary.unit.state
      ].filter(Boolean).join(" ")).includes(term);
    });

  return (
    <section className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
      <div className="grid gap-3 lg:grid-cols-[1fr_320px] lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Campanhas mês a mês</p>
          <h2 className="text-xl font-black text-ink">Retorno por franqueado</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">Mostra apenas campanhas preenchidas pelos franqueados.</p>
        </div>
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar campanha, plataforma..." />
      </div>

      <div className="mt-4 grid gap-3">
        {rows.length ? (
          rows.map((row) => (
            <div key={`${row.summary.unit.cnpj}-${row.campaign.id}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-ink">{row.campaign.nomeCampanha.trim() || "Campanha sem nome"}</p>
                  <p className="text-xs font-bold text-slate-500">{row.summary.unit.unitName} - {row.campaign.canalCampanha} - {row.campaign.cidade || formatLocation(row.summary.unit)}</p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: row.status.color }}>
                  {row.status.label}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MiniMetric label="Invest." value={formatCurrency(row.campaign.investimento)} />
                <MiniMetric label="Receita" value={formatCurrency(row.metrics.receita)} />
                <MiniMetric label="ROI" value={formatMultiplier(row.metrics.roas)} />
                <MiniMetric label="CPV" value={formatCurrency(row.metrics.cpv)} />
              </div>
              <button
                type="button"
                onClick={() => setSelectedCampaign(row.campaign)}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-700"
              >
                <Eye className="h-4 w-4" />
                Ver detalhes
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-3xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
            Nenhuma campanha encontrada.
          </div>
        )}
      </div>
      {selectedCampaign ? (
        <CampaignDetailsModal record={selectedCampaign} onClose={() => setSelectedCampaign(null)} />
      ) : null}
    </section>
  );
}

function MasterUnitDetail({ summary }: { summary: MasterUnitSummary }) {
  const campaignMetrics = calculateInputMetrics(summary.campaignRoi);
  const campaignStatus = getRoasStatus(campaignMetrics.roas);
  const actions = getRoasDiagnosis(summary.campaignRoi, campaignMetrics);

  return (
    <section className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Detalhe da unidade</p>
          <h2 className="text-2xl font-black text-ink">{summary.unit.unitName}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">{summary.unit.responsibleName} - {protectedCnpj(summary.unit)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${getUnitStatusClass(summary.unit.status)}`}>
            {getUnitStatusLabel(summary.unit.status)}
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase text-emerald-700">{summary.levelName}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniMetric label="Score" value={`${summary.score}%`} />
        <MiniMetric label="XP" value={`${summary.xp}`} />
        <MiniMetric label="Metas" value={`${summary.completedMissions}/${summary.totalMissions}`} />
        <MiniMetric label="ROI" value={formatMultiplier(summary.roi)} />
      </div>

      <div className="mt-5 rounded-3xl bg-slate-50 p-4">
        <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Progresso no game</p>
        <div className="space-y-3">
          {summary.blockProgress.map((block) => (
            <ProgressBar key={block.id} value={block.percent} color={block.color} label={block.label} compact />
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">ROI de campanha</p>
            <h3 className="text-lg font-black text-ink">{summary.campaignRoi.nomeCampanha.trim() || "Campanha não preenchida"}</h3>
            <p className="text-xs font-bold text-slate-500">{summary.campaignRoi.canalCampanha}</p>
          </div>
          <span className="rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: campaignStatus.color }}>
            {campaignStatus.label}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniMetric label="ROI" value={formatMultiplier(campaignMetrics.roas)} />
          <MiniMetric label="CPL" value={formatCurrency(campaignMetrics.cpl)} />
          <MiniMetric label="CPA agenda" value={formatCurrency(campaignMetrics.cpa)} />
          <MiniMetric label="Taxa venda" value={formatPercent(campaignMetrics.taxaVenda)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((action) => (
            <span key={action} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{action}</span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Canais comerciais</p>
          <div className="grid gap-2">
            {captureChannels.map((channel) => {
              const input = summary.channels?.[channel.id];
              const metrics = input ? calculateInputMetrics(input) : null;
              return (
                <div key={channel.id} className="rounded-2xl bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-ink">{channel.name}</p>
                    <span className="text-xs font-black text-slate-500">{metrics ? formatMultiplier(metrics.roas) : "dados insuficientes"}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <MiniMetric label="Leads" value={`${input?.leads ?? 0}`} />
                    <MiniMetric label="Agendas" value={`${input?.agendamentos ?? 0}`} />
                    <MiniMetric label="Vendas" value={`${input?.vendas ?? 0}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Plano e histórico</p>
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Prioridade atual</p>
            <p className="mt-1 text-sm font-black text-ink">{summary.weeklyPlan?.priority || "Sem prioridade preenchida"}</p>
            <p className="mt-2 text-xs font-bold text-slate-500">{summary.weeklyPlan?.alertAction || summary.weeklyPlan?.correctiveAction || "Sem ação corretiva registrada"}</p>
          </div>
          <div className="mt-3 grid gap-2">
            {summary.savedPlans?.length ? (
              summary.savedPlans.slice(0, 3).map((plan) => (
                <div key={plan.id} className="rounded-2xl bg-white p-3 text-xs font-bold text-slate-600 shadow-sm">
                  <span className="font-black text-ink">{plan.savedAt}</span> - {plan.priority || plan.alertAction || "Plano salvo"}
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-white p-3 text-xs font-bold text-slate-500 shadow-sm">Sem planos salvos para consulta.</div>
            )}
          </div>
          <div className="mt-3 grid gap-2">
            {summary.history.length ? (
              summary.history.slice(0, 3).map((entry) => (
                <div key={entry.id ?? entry.date} className="rounded-2xl bg-white p-3 text-xs font-bold text-slate-600 shadow-sm">
                  <span className="font-black text-ink">{entry.date}</span> - {entry.bottleneck} / {entry.action}
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-white p-3 text-xs font-bold text-slate-500 shadow-sm">Sem fechamento semanal ainda.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function UnitDetailModal({ summary, onClose }: { summary: MasterUnitSummary; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/55 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-5xl">
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white text-slate-700 shadow-soft"
            aria-label="Fechar detalhes"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <MasterUnitDetail summary={summary} />
      </div>
    </div>
  );
}

function EditUnitModal({
  summary,
  onClose,
  onSave
}: {
  summary: MasterUnitSummary;
  onClose: () => void;
  onSave: (originalCnpj: string, form: MasterUnitForm) => string;
}) {
  const [form, setForm] = useState<MasterUnitForm>({
    unitName: summary.unit.unitName,
    responsibleName: summary.unit.responsibleName,
    cnpj: summary.unit.cnpj,
    email: summary.unit.email,
    phone: summary.unit.phone,
    city: summary.unit.city ?? "",
    state: summary.unit.state ?? "",
    password: ""
  });
  const [message, setMessage] = useState("");

  function update<K extends keyof MasterUnitForm>(field: K, value: MasterUnitForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = onSave(summary.unit.cnpj, form);
    if (error) {
      setMessage(error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/55 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[30px] border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Editar franqueado</p>
            <h2 className="text-xl font-black text-ink">{summary.unit.unitName}</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">Atualize os dados usados no login e na visão master.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {message ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            {message}
          </div>
        ) : null}

        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <AuthInput icon={Building2} label="Nome da unidade" value={form.unitName} onChange={(value) => update("unitName", value)} placeholder="Unidade Centro" />
          <AuthInput icon={UserRound} label="Responsável" value={form.responsibleName} onChange={(value) => update("responsibleName", value)} placeholder="Nome do franqueado" />
          <AuthInput icon={Building2} label="CNPJ" value={form.cnpj} onChange={(value) => update("cnpj", value)} placeholder="00.000.000/0000-00" />
          <AuthInput icon={Mail} label="E-mail" value={form.email} onChange={(value) => update("email", value)} placeholder="unidade@email.com" />
          <AuthInput icon={Phone} label="Telefone" value={form.phone} onChange={(value) => update("phone", value)} placeholder="(00) 00000-0000" />
          <AuthInput icon={MapPin} label="Cidade" value={form.city} onChange={(value) => update("city", value)} placeholder="São Paulo" />
          <AuthInput icon={MapPin} label="Estado" value={form.state} onChange={(value) => update("state", value)} placeholder="SP" />
          <AuthInput icon={KeyRound} label="Senha" type="password" value={form.password} onChange={(value) => update("password", value)} placeholder="Mínimo 6 caracteres" />
          <button type="submit" className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-emerald-700 bg-emerald-600 text-sm font-black uppercase text-white transition active:translate-y-1 active:border-b-2 sm:col-span-2">
            <CheckCircle2 className="h-4 w-4" />
            Salvar alterações
          </button>
        </form>
      </div>
    </div>
  );
}

function formatLocation(unit: RegisteredUnit) {
  const city = unit.city?.trim();
  const state = unit.state?.trim();

  if (city && state) {
    return `${city} - ${state}`;
  }

  return city || state || "Localização não informada";
}

function getMasterAnalytics(summaries: MasterUnitSummary[]) {
  const unitRows = summaries
    .map((summary) => {
      const roiScore = summary.roi !== null ? Math.min(100, Math.round((summary.roi / 6) * 100)) : 0;
      const performance = Math.round(summary.score * 0.65 + roiScore * 0.35);

      return { summary, performance };
    })
    .sort((a, b) => b.performance - a.performance);

  const bestUnit = unitRows[0]?.summary;
  const bestState = getBestLocationGroup(summaries, (summary) => summary.unit.state?.trim().toUpperCase());
  const bestCity = getBestLocationGroup(summaries, (summary) => {
    const city = summary.unit.city?.trim();
    const state = summary.unit.state?.trim().toUpperCase();
    return city && state ? `${city} - ${state}` : city;
  });
  const platformRows = getPlatformRows(summaries);
  const bestPlatform = platformRows[0];

  return { unitRows, bestUnit, bestState, bestCity, platformRows, bestPlatform };
}

function getBestLocationGroup(summaries: MasterUnitSummary[], getLabel: (summary: MasterUnitSummary) => string | undefined) {
  const groups = new Map<string, { label: string; total: number; count: number }>();

  summaries.forEach((summary) => {
    const label = getLabel(summary);
    if (!label) {
      return;
    }

    const current = groups.get(label) ?? { label, total: 0, count: 0 };
    current.total += summary.score;
    current.count += 1;
    groups.set(label, current);
  });

  return Array.from(groups.values())
    .map((group) => ({ ...group, average: Math.round(group.total / group.count) }))
    .sort((a, b) => b.average - a.average)[0];
}

function getPlatformRows(summaries: MasterUnitSummary[]) {
  const groups = new Map<string, { label: string; totalRoi: number; count: number }>();

  summaries.forEach((summary) => {
    const campaigns = summary.campaignRecords.length ? summary.campaignRecords : [summary.campaignRoi];
    campaigns.forEach((campaign) => {
      const metrics = calculateInputMetrics(campaign);
      if (metrics.roas === null) {
        return;
      }

      const label = campaign.canalCampanha || "Outro";
      const current = groups.get(label) ?? { label, totalRoi: 0, count: 0 };
      current.totalRoi += metrics.roas;
      current.count += 1;
      groups.set(label, current);
    });
  });

  return Array.from(groups.values())
    .map((group) => ({ ...group, averageRoi: group.totalRoi / group.count }))
    .sort((a, b) => b.averageRoi - a.averageRoi);
}

function getUnitCorrectiveActions(summary: MasterUnitSummary) {
  const metrics = calculateInputMetrics(summary.campaignRoi);

  if (metrics.roas !== null && metrics.roas < 2) {
    return getRoasDiagnosis(summary.campaignRoi, metrics).slice(0, 5);
  }

  const weakestBlock = [...summary.blockProgress].sort((a, b) => a.percent - b.percent)[0];

  if (!weakestBlock || weakestBlock.percent >= 70) {
    return ["manter acompanhamento", "aumentar investimento com cuidado", "monitorar qualidade dos leads", "manter rotina comercial"];
  }

  if (weakestBlock.id === "passivo-frio") {
    return ["revisar campanhas", "testar criativos", "validar público", "acompanhar CPL", "melhorar qualificação"];
  }

  if (weakestBlock.id === "passivo-quente") {
    return ["melhorar nutrição", "criar lembretes", "reativar contatos", "reduzir tempo de resposta"];
  }

  if (weakestBlock.id === "ativo-frio") {
    return ["organizar prospecção", "definir lista foco", "melhorar abordagem", "medir respostas"];
  }

  if (weakestBlock.id === "ativo-quente") {
    return ["treinar fechamento", "mapear objeções", "melhorar proposta", "acompanhar follow-up"];
  }

  return ["revisar indicadores", "definir prioridade da semana", "acompanhar execução", "fechar ciclo semanal"];
}

function getNetworkCorrectiveActions(summaries: MasterUnitSummary[]) {
  const lowRoiCount = summaries.filter((summary) => summary.roi !== null && summary.roi < 2).length;
  const lowScoreCount = summaries.filter((summary) => summary.score < 50).length;
  const noCampaignCount = summaries.filter((summary) => summary.roi === null).length;
  const platformRows = getPlatformRows(summaries);
  const weakestPlatform = [...platformRows].reverse()[0];

  return [
    {
      title: "Campanhas com ROI baixo",
      reason: lowRoiCount ? `${lowRoiCount} unidade(s) precisam revisar retorno de campanha.` : "ROI da rede sem alerta crítico no momento.",
      steps: ["revisar público", "revisar criativo", "validar promessa", "monitorar CPV"]
    },
    {
      title: "Unidades com pouco progresso",
      reason: lowScoreCount ? `${lowScoreCount} unidade(s) abaixo de 50% no game.` : "Progresso geral dentro do esperado.",
      steps: ["definir meta semanal", "acompanhar rotina", "priorizar gargalo", "fechar ciclo"]
    },
    {
      title: "Dados de campanha pendentes",
      reason: noCampaignCount ? `${noCampaignCount} unidade(s) ainda sem ROI preenchido.` : "Todas as unidades com ROI preenchido.",
      steps: ["cobrar preenchimento", "validar investimento", "registrar receita", "comparar canais"]
    },
    {
      title: "Plataforma com menor retorno",
      reason: weakestPlatform ? `${weakestPlatform.label} está com ${formatMultiplier(weakestPlatform.averageRoi)} de ROI médio.` : "Sem campanhas suficientes para comparar plataformas.",
      steps: ["comparar plataforma", "revisar segmentação", "testar nova campanha", "acompanhar qualidade"]
    }
  ];
}

function readMasterUnitSummary(unit: RegisteredUnit): MasterUnitSummary {
  const progressKey = getLocalUnitStorageKey(unit.cnpj, "gameProgress", "v2");
  const commercialKey = getLocalUnitStorageKey(unit.cnpj, "commercialInputs", "v2");
  const selfManagementKey = getLocalUnitStorageKey(unit.cnpj, "selfManagement", "v1");
  const progress = unit.gameProgress ?? readJson<ProgressSnapshot>(progressKey);
  const commercial = unit.commercialInputs ?? readJson<CommercialProfileSnapshot>(commercialKey);
  const selfManagement = unit.selfManagement ?? readJson<SelfManagementSnapshot>(selfManagementKey);
  const completedMissions = Array.isArray(progress?.completedMissions) ? progress.completedMissions : [];
  const appliedSolutions = Array.isArray(progress?.appliedSolutions) ? progress.appliedSolutions : [];
  const completedSet = new Set(completedMissions);

  const blockProgress = journeyBlocks.map((block) => {
    const blockMissions = missions.filter((mission) => mission.blockId === block.id);
    const completed = blockMissions.filter((mission) => completedSet.has(mission.id)).length;
    return {
      id: block.id,
      label: block.name.replace("Pilar 1: ", "").replace("Pilar 3: ", ""),
      percent: blockMissions.length ? Math.round((completed / blockMissions.length) * 100) : 0,
      color: block.accent
    };
  });
  const score = blockProgress.length ? Math.round(blockProgress.reduce((sum, block) => sum + block.percent, 0) / blockProgress.length) : 0;
  const missionXp = missions.filter((mission) => completedSet.has(mission.id)).reduce((sum, mission) => sum + mission.xp, 0);
  const solutionXp = problems.reduce((sum, problem) => {
    const appliedCount = problem.actions.filter((action) => appliedSolutions.includes(`${problem.id}:${action}`)).length;
    return sum + appliedCount * problem.xp;
  }, 0);
  const roiInput = commercial?.campaignRoi ?? defaultCampaignRoiSnapshot();
  const roi = calculateInputMetrics(roiInput).roas;
  const levelName = ([...levels].reverse().find((level) => score >= level.minPercent) ?? levels[0]).name;
  const history = Array.isArray(selfManagement?.history) ? selfManagement.history : [];

  return {
    unit,
    score,
    xp: missionXp + solutionXp,
    roi,
    levelName,
    completedMissions: completedMissions.length,
    totalMissions: missions.length,
    blockProgress,
    channels: commercial?.channels,
    campaignRoi: roiInput,
    campaignRecords: Array.isArray(commercial?.campaignRecords) ? commercial.campaignRecords : [],
    weeklyPlan: selfManagement?.weeklyPlan,
    savedPlans: Array.isArray(selfManagement?.savedPlans) ? selfManagement.savedPlans : [],
    history,
    lastActivity: history[0]?.date ?? new Date(unit.createdAt).toLocaleDateString("pt-BR"),
    firebasePaths: [
      getFirebaseUnitPath(unit.cnpj, "gameProgress"),
      getFirebaseUnitPath(unit.cnpj, "commercialInputs"),
      getFirebaseUnitPath(unit.cnpj, "selfManagement")
    ]
  };
}

type CommercialProfileSnapshot = {
  channels?: CommercialInputs;
  campaignRoi?: ChannelInput;
  campaignRecords?: CampaignRecord[];
};

type ProgressSnapshot = {
  completedMissions?: string[];
  appliedSolutions?: string[];
  selectedBlockId?: BlockId;
};

type SelfManagementSnapshot = {
  completedDaily?: string[];
  weeklyPlan?: WeeklyPlan;
  savedPlans?: SavedWeeklyPlan[];
  history?: Array<{ id?: string; date: string; score: number; xp: number; bottleneck: string; action: string }>;
};

function defaultCampaignRoiSnapshot(): ChannelInput {
  return {
    nomeCampanha: "",
    canalCampanha: "Meta Ads",
    responsavelCampanha: "",
    observacaoCampanha: "",
    investimento: 0,
    receita: 0,
    ticketMedio: 0,
    leads: 0,
    interacoes: 0,
    agendamentos: 0,
    comparecimentos: 0,
    vendas: 0,
    indicacoes: 0
  };
}

function readJson<T>(storageKey: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="animate-[fadeIn_160ms_ease-out]">{children}</div>;
}

function GuidanceCard({ title, text, icon: Icon }: { title: string; text: string; icon: typeof BarChart3 }) {
  return (
    <article className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-limepop text-emerald-700">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-black text-ink">{title}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-500">{text}</p>
    </article>
  );
}

type NextMove = {
  title: string;
  reason: string;
  action: string;
  measure: string;
};

function getNextMove(inputs: CommercialInputs, weakestBlockId: string | undefined, fallbackDiagnosis: string): NextMove {
  const totals = Object.values(inputs).reduce(
    (sum, input) => ({
      leads: sum.leads + input.leads,
      interacoes: sum.interacoes + input.interacoes,
      agendamentos: sum.agendamentos + input.agendamentos,
      comparecimentos: sum.comparecimentos + input.comparecimentos,
      vendas: sum.vendas + input.vendas,
      indicacoes: sum.indicacoes + input.indicacoes
    }),
    { leads: 0, interacoes: 0, agendamentos: 0, comparecimentos: 0, vendas: 0, indicacoes: 0 }
  );

  if (totals.leads === 0) {
    return {
      title: "Ativar captação",
      reason: "Ainda não existe volume de leads registrado. Sem topo de funil, a unidade não consegue avaliar o resto.",
      action: "Escolha um canal foco e registre uma meta simples de leads para esta semana.",
      measure: "Leads gerados por canal"
    };
  }

  if (totals.agendamentos === 0 || totals.agendamentos / Math.max(totals.interacoes, 1) < 0.25) {
    return {
      title: "Melhorar abordagem",
      reason: "O gargalo parece estar entre conversa e agenda.",
      action: "Revise script, reduza atrito e ofereça uma chamada/diagnóstico mais claro.",
      measure: "Taxa de agendamento"
    };
  }

  if (totals.comparecimentos === 0 || totals.comparecimentos / Math.max(totals.agendamentos, 1) < 0.55) {
    return {
      title: "Aumentar comparecimento",
      reason: "As pessoas agendam, mas não aparecem em volume suficiente.",
      action: "Confirme presença, envie lembrete e reforce o valor da reunião.",
      measure: "Taxa de comparecimento"
    };
  }

  if (totals.vendas === 0 || totals.vendas / Math.max(totals.comparecimentos, 1) < 0.35) {
    return {
      title: "Revisar fechamento",
      reason: "O gargalo parece estar depois do comparecimento.",
      action: "Revise diagnóstico, objeções, proposta e motivo de perda.",
      measure: "Taxa de venda"
    };
  }

  if (totals.indicacoes < 5 || weakestBlockId === "ativo-quente") {
    return {
      title: "Ativar indicação e recompra",
      reason: "A unidade pode crescer com clientes atuais, antigos e satisfeitos.",
      action: "Crie rotina de pedido de indicação, reativação e renovação.",
      measure: "Indicações e recompras no mês"
    };
  }

  return {
    title: "Padronizar o que funcionou",
    reason: fallbackDiagnosis,
    action: "Transforme a melhor ação da semana em rotina e acompanhe por 7 dias.",
    measure: "Score, XP e métrica foco"
  };
}

function NextMoveCard({ nextMove }: { nextMove: NextMove }) {
  return (
    <article className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-meadow text-white">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Próximo movimento</p>
          <h2 className="text-xl font-black text-ink">{nextMove.title}</h2>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <MiniAdvice title="Por que" text={nextMove.reason} />
        <MiniAdvice title="O que fazer" text={nextMove.action} />
        <MiniAdvice title="Como medir" text={nextMove.measure} />
      </div>
    </article>
  );
}

function MiniAdvice({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-1 text-sm font-bold text-slate-700">{text}</p>
    </div>
  );
}

function WeeklyPlanCard({
  plan,
  planProgress,
  weeklyPlanXp,
  planAlert,
  savedPlans,
  actionDone,
  onUpdate
  ,onSave,
  onLoad
}: {
  plan: WeeklyPlan;
  planProgress: number;
  weeklyPlanXp: number;
  planAlert: string;
  savedPlans: SavedWeeklyPlan[];
  actionDone: boolean;
  onUpdate: <K extends keyof WeeklyPlan>(field: K, value: WeeklyPlan[K]) => void;
  onSave: () => void;
  onLoad: (plan: SavedWeeklyPlan) => void;
}) {
  const selectedProblem = problems.find((problem) => problem.id === plan.alertProblemId) ?? problems[0];

  function updateProblem(problemId: string) {
    const problem = problems.find((item) => item.id === problemId) ?? problems[0];
    const action = problem.actions[0] ?? "";
    onUpdate("alertProblemId", problem.id);
    onUpdate("alertAction", action);
    onUpdate("correctiveAction", action);
  }

  function updateAction(action: string) {
    onUpdate("alertAction", action);
    onUpdate("correctiveAction", action);
  }

  return (
    <article className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-skyjoy text-white">
            <NotepadText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Plano da semana</p>
            <h2 className="text-xl font-black text-ink">Foco de execução</h2>
          </div>
        </div>
        <XPBadge xp={weeklyPlanXp} label="XP do plano" tone="gold" />
      </div>
      {plan.alertAction ? (
        <div className={`mb-4 rounded-3xl border p-4 ${actionDone ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <div className="flex gap-3">
            {actionDone ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /> : <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600" />}
            <div>
              <p className={`text-sm font-black ${actionDone ? "text-emerald-900" : "text-amber-900"}`}>
                {actionDone ? "Ação concluída" : "Ação ainda aberta"}
              </p>
              <p className={`mt-1 text-xs font-bold ${actionDone ? "text-emerald-800" : "text-amber-800"}`}>
                {plan.alertAction}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      {planAlert ? (
        <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <BellRing className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-black text-amber-900">Alerta do plano</p>
              <p className="mt-1 text-xs font-bold text-amber-800">{planAlert}</p>
            </div>
          </div>
        </div>
      ) : null}
      <div className="mb-4 rounded-3xl bg-emerald-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Progresso do plano</p>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">{planProgress}%</span>
        </div>
        <div className="mt-3">
          <ProgressBar value={planProgress} color="#58CC02" label="Campos preenchidos" compact />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Prioridade" value={plan.priority} placeholder="Ex: melhorar agendamento" onChange={(value) => onUpdate("priority", value)} />
        <SelectField label="Canal foco" value={plan.focusChannel} onChange={(value) => onUpdate("focusChannel", value)} />
        <TextField label="Meta principal" value={plan.mainGoal} placeholder="Ex: 20 agendamentos" onChange={(value) => onUpdate("mainGoal", value)} />
        <label className="block">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">Alerta que o plano resolve</span>
          <select
            value={plan.alertProblemId}
            onChange={(event) => updateProblem(event.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-ink outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">Selecionar alerta</option>
            {problems.map((problem) => (
              <option key={problem.id} value={problem.id}>{problem.title}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">Ação que sana o alerta</span>
          <select
            value={plan.alertAction}
            onChange={(event) => updateAction(event.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-ink outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">Selecionar ação</option>
            {selectedProblem.actions.map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </label>
        <TextField label="Responsável" value={plan.owner} placeholder="Ex: Vendedor / Franqueado" onChange={(value) => onUpdate("owner", value)} />
        <label className="block">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">Prazo</span>
          <input
            type="date"
            value={plan.dueDate}
            onChange={(event) => onUpdate("dueDate", event.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-ink outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">Status</span>
          <select
            value={plan.status}
            onChange={(event) => onUpdate("status", event.target.value as WeeklyPlan["status"])}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-ink outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          >
            <option>A fazer</option>
            <option>Em andamento</option>
            <option>Concluído</option>
          </select>
        </label>
      </div>
      <button
        type="button"
        onClick={onSave}
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-emerald-700 bg-emerald-600 text-sm font-black uppercase text-white transition active:translate-y-1 active:border-b-2"
      >
        <CheckCircle2 className="h-4 w-4" />
        Salvar plano semanal
      </button>
      {savedPlans.length ? (
        <div className="mt-4 rounded-3xl bg-slate-50 p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Planos salvos</p>
          <div className="grid gap-2">
            {savedPlans.slice(0, 4).map((savedPlan) => (
              <button
                key={savedPlan.id}
                type="button"
                onClick={() => onLoad(savedPlan)}
                className="rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-300"
              >
                <p className="text-sm font-black text-ink">{savedPlan.priority || savedPlan.alertAction || "Plano sem título"}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{savedPlan.savedAt} - {savedPlan.status}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function TextField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-ink outline-none transition placeholder:text-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function TextAreaField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-ink outline-none transition placeholder:text-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function SelectField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-ink outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      >
        <option>Passivo Frio</option>
        <option>Passivo Quente</option>
        <option>Ativo Frio</option>
        <option>Ativo Quente</option>
        <option>Vendedor</option>
        <option>Indicadores</option>
      </select>
    </label>
  );
}

function DailyChecklistCard({
  items,
  completed,
  progress,
  onToggle
}: {
  items: string[];
  completed: string[];
  progress: number;
  onToggle: (item: string) => void;
}) {
  return (
    <article className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Checklist diário</p>
          <h2 className="text-xl font-black text-ink">Rotina do vendedor</h2>
        </div>
        <XPBadge xp={progress} label="%" tone="green" />
      </div>
      <ProgressBar value={progress} color="#58CC02" label="Streak real do dia" />
      <div className="mt-4 space-y-2">
        {items.map((item) => {
          const done = completed.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
              }`}
            >
              <CheckCircle2 className={`h-5 w-5 ${done ? "fill-current text-emerald-500" : "text-slate-300"}`} />
              <span className="text-sm font-black text-ink">{item}</span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

function HistoryCard({
  history,
  score,
  xp,
  planXp,
  bottleneck,
  action,
  onCloseWeek
}: {
  history: Array<{ id: string; date: string; score: number; xp: number; bottleneck: string; action: string }>;
  score: number;
  xp: number;
  planXp: number;
  bottleneck: string;
  action: string;
  onCloseWeek: (entry: { score: number; xp: number; bottleneck: string; action: string }) => void;
}) {
  return (
    <article className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Histórico simples</p>
          <h2 className="text-xl font-black text-ink">Fechamento semanal</h2>
        </div>
        <button
          type="button"
          onClick={() => onCloseWeek({ score, xp: xp + planXp, bottleneck, action })}
          className="rounded-2xl border-2 border-b-4 border-emerald-600 bg-meadow px-4 py-2 text-xs font-black uppercase text-white transition active:translate-y-1 active:border-b-2"
        >
          Fechar semana
        </button>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <MiniMetric label="Métrica" value={`${score}%`} />
        <MiniMetric label="XP" value={`${xp + planXp}`} />
        <MiniMetric label="Gargalo" value={bottleneck} />
      </div>
      <div className="space-y-3">
        {history.length ? (
          history.map((entry) => (
            <div key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-ink">{entry.date}</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">{entry.score}%</span>
              </div>
              <p className="mt-2 text-sm font-bold text-slate-600">Gargalo: {entry.bottleneck}</p>
              <p className="mt-1 text-sm font-bold text-slate-600">Ação: {entry.action}</p>
            </div>
          ))
        ) : (
          <div className="rounded-3xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
            Nenhuma semana fechada ainda. Quando fechar, o histórico mostra score, XP, gargalo e ação escolhida.
          </div>
        )}
      </div>
    </article>
  );
}

function StageColumn({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">{title}</p>
      <h3 className="mb-3 text-lg font-black text-ink">{subtitle}</h3>
      {children}
    </div>
  );
}

function JourneyMiniCard({
  blockId,
  progress,
  onStart,
  compact
}: {
  blockId: BlockId;
  progress: ReturnType<typeof useGameProgress>["blockProgress"];
  onStart: (blockId: BlockId) => void;
  compact?: boolean;
}) {
  const block = progress.find((item) => item.id === blockId) ?? progress[0];
  const Icon = block.icon;
  const locked = block.status === "locked";

  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => onStart(block.id)}
      className={`w-full rounded-3xl border-2 border-b-4 bg-white p-3 text-left transition active:translate-y-1 active:border-b-2 disabled:opacity-60 ${
        locked ? "border-slate-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`${compact ? "h-10 w-10" : "h-12 w-12"} grid shrink-0 place-items-center rounded-2xl text-white`} style={{ backgroundColor: locked ? "#94A3B8" : block.accent }}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-ink">{block.name.replace("Pilar 1: ", "").replace("Pilar 3: ", "")}</p>
          <p className="text-xs font-bold text-slate-500">{locked ? "Desbloqueie concluindo ICP" : `${block.percent}% concluído`}</p>
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar value={block.percent} color={block.accent} compact />
      </div>
    </button>
  );
}

function ChannelPlaybook({ channel }: { channel: CaptureChannel }) {
  const ChannelIcon = channel.icon;

  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ backgroundColor: channel.accent }}>
            <ChannelIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">{channel.subtitle}</p>
            <h2 className="text-xl font-black text-ink">Exemplo de funil do método</h2>
            <p className="text-xs font-bold text-slate-500">Referência visual, não ? dado real da unidade.</p>
          </div>
        </div>
        <FunnelPyramid steps={channel.funnel} color={channel.accent} />
      </div>

      <div className="space-y-4">
        <div className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
          <h2 className="mb-1 text-xl font-black text-ink">Metas sugeridas e indicadores de referência</h2>
          <p className="mb-3 text-xs font-bold text-slate-500">Use como guia do método. Os números reais ficam na aba Métricas, em Dados da unidade.</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {channel.goals.map((goal) => (
              <span key={goal} className="rounded-full bg-limepop/40 px-3 py-1 text-xs font-black text-emerald-700">
                Meta sugerida: {goal}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {channel.indicators.map((metric) => (
              <ScoreCard key={metric.label} label={metric.label} value={metric.value} trend={metric.trend} />
            ))}
          </div>
        </div>

        {channel.formulas ? (
          <div className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
          <h2 className="mb-1 text-xl font-black text-ink">Fórmulas do método</h2>
          <p className="mb-3 text-xs font-bold text-slate-500">As fórmulas calculam os dados reais preenchidos na área Dados da unidade.</p>
            <div className="space-y-2">
              {channel.formulas.map((formula) => (
                <div key={formula.label} className="rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-700">
                  {formula.label} = <span className="text-slate-500">{formula.expression}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {channel.channels ? (
          <div className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
          <h2 className="mb-1 text-xl font-black text-ink">Canais possíveis</h2>
          <p className="mb-3 text-xs font-bold text-slate-500">Lista de opções do método, não canais já executados pela unidade.</p>
            <div className="flex flex-wrap gap-2">
              {channel.channels.map((item) => (
                <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {channel.notes ? (
          <div className="rounded-[28px] border border-sky-200 bg-sky-50 p-5 shadow-sm">
            <h2 className="mb-3 text-xl font-black text-sky-900">Notas pr?ticas</h2>
            <div className="space-y-2">
              {channel.notes.map((note) => (
                <p key={note} className="text-sm font-bold text-sky-800">{note}</p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
          <h2 className="mb-1 text-xl font-black text-ink">Intervenções recomendadas</h2>
          <p className="mb-3 text-xs font-bold text-slate-500">Ações sugeridas quando a métrica real indicar gargalo.</p>
          <div className="space-y-3">
            {channel.interventions.map((intervention) => (
              <div key={intervention.trigger} className="rounded-3xl bg-slate-50 p-4">
                <p className="font-black text-ink">Se {intervention.trigger}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {intervention.actions.map((action) => (
                    <span key={action} className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FunnelPyramid({ steps, color }: { steps: FunnelStep[]; color: string }) {
  const max = Math.max(...steps.map((step) => step.value));

  return (
    <div className="space-y-2">
      {steps.map((step, index) => {
        const width = Math.max(42, Math.round((step.value / max) * 100));
        return (
          <div key={step.label} className="mx-auto rounded-2xl px-4 py-3 text-white shadow-sm" style={{ width: `${width}%`, backgroundColor: color, opacity: 1 - index * 0.08 }}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-black">{step.label}</span>
              <span className="rounded-full bg-white/20 px-2 py-1 text-xs font-black">ex: {step.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CommercialDataPanel({
  unitName,
  inputs,
  onUnitNameChange,
  onUpdate
}: {
  unitName: string;
  inputs: CommercialInputs;
  onUnitNameChange: (unitName: string) => void;
  onUpdate: <K extends keyof ChannelInput>(channelId: BlockId, field: K, value: ChannelInput[K]) => void;
}) {
  return (
    <section className="mt-5 rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Dados da unidade</p>
          <h2 className="text-xl font-black text-ink">Onde o cliente insere os números reais</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Esta é a área oficial de dados reais da unidade. Preencha funil, investimento e receita por canal; o navegador salva sozinho.
          </p>
        </div>
        <div className="hidden rounded-2xl bg-limepop/50 px-3 py-2 text-xs font-black text-emerald-700 sm:block">
          Dados reais
        </div>
      </div>

      <label className="mb-5 block rounded-[26px] border-2 border-b-4 border-emerald-200 bg-emerald-50 p-4">
        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-emerald-700">Nome da unidade no game</span>
        <input
          type="text"
          value={unitName}
          onChange={(event) => onUnitNameChange(event.target.value)}
          placeholder="Ex: Unidade Centro"
          className="h-12 w-full rounded-2xl border border-emerald-200 bg-white px-4 text-base font-black text-ink outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
        <span className="mt-2 block text-xs font-bold text-emerald-800">
          Esse nome aparece no topo e na posição da unidade.
        </span>
      </label>

      <div className="grid gap-4 xl:grid-cols-2">
        {captureChannels.map((channel) => {
          const input = inputs[channel.id];
          const metrics = calculateInputMetrics(input);
          const Icon = channel.icon;

          return (
            <div key={channel.id} className="rounded-[26px] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ backgroundColor: channel.accent }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-ink">{channel.name}</h3>
                  <p className="text-xs font-bold text-slate-500">{channel.subtitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <NumberField fieldKey={`${channel.id}-investimento`} label="Invest." value={input.investimento} onChange={(value) => onUpdate(channel.id, "investimento", value)} />
                <NumberField fieldKey={`${channel.id}-receita`} label="Receita" value={input.receita} onChange={(value) => onUpdate(channel.id, "receita", value)} />
                <NumberField fieldKey={`${channel.id}-leads`} label="Leads" value={input.leads} onChange={(value) => onUpdate(channel.id, "leads", value)} />
                <NumberField fieldKey={`${channel.id}-interacoes`} label="Interações" value={input.interacoes} onChange={(value) => onUpdate(channel.id, "interacoes", value)} />
                <NumberField fieldKey={`${channel.id}-agendamentos`} label="Agendas" value={input.agendamentos} onChange={(value) => onUpdate(channel.id, "agendamentos", value)} />
                <NumberField fieldKey={`${channel.id}-comparecimentos`} label="Comparec." value={input.comparecimentos} onChange={(value) => onUpdate(channel.id, "comparecimentos", value)} />
                <NumberField fieldKey={`${channel.id}-vendas`} label="Vendas" value={input.vendas} onChange={(value) => onUpdate(channel.id, "vendas", value)} />
                <NumberField fieldKey={`${channel.id}-indicacoes`} label="Indicações" value={input.indicacoes} onChange={(value) => onUpdate(channel.id, "indicacoes", value)} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MiniMetric label="CPL" value={formatCurrency(metrics.cpl)} />
                <MiniMetric label="CPA" value={formatCurrency(metrics.cpa)} />
                <MiniMetric label="CPV" value={formatCurrency(metrics.cpv)} />
                <MiniMetric label="ROAS" value={formatMultiplier(metrics.roas)} />
                <MiniMetric label="Agenda" value={formatPercent(metrics.taxaAgendamento)} />
                <MiniMetric label="Comparec." value={formatPercent(metrics.taxaComparecimento)} />
                <MiniMetric label="Venda" value={formatPercent(metrics.taxaVenda)} />
                <MiniMetric label="CPA comp." value={formatCurrency(metrics.cpaComparecimento)} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type RoasStatus = {
  label: string;
  message: string;
  xp: number;
  color: string;
  bg: string;
};

const campaignChannelOptions = ["Meta Ads", "Google Ads", "TikTok Ads", "Indicação patrocinada", "Outro"] as const;

function getRoasStatus(roas: number | null): RoasStatus {
  if (roas === null) {
    return {
      label: "Dados insuficientes",
      message: "Preencha investimento e receita para calcular o retorno da campanha.",
      xp: 0,
      color: "#64748B",
      bg: "bg-slate-50 border-slate-200"
    };
  }

  if (roas < 1) {
    return {
      label: "Crítico",
      message: "A campanha ainda não está retornando o investimento.",
      xp: -50,
      color: "#EF4444",
      bg: "bg-red-50 border-red-200"
    };
  }

  if (roas < 2) {
    return {
      label: "Atenção",
      message: "A campanha está próxima do empate, mas ainda precisa melhorar.",
      xp: 20,
      color: "#F97316",
      bg: "bg-orange-50 border-orange-200"
    };
  }

  if (roas < 4) {
    return {
      label: "Saudável",
      message: "A campanha já gera retorno, mas ainda pode ser otimizada.",
      xp: 80,
      color: "#1CB0F6",
      bg: "bg-sky-50 border-sky-200"
    };
  }

  if (roas < 6) {
    return {
      label: "Forte",
      message: "A campanha está performando bem e pode ser acompanhada para escala.",
      xp: 150,
      color: "#58CC02",
      bg: "bg-emerald-50 border-emerald-200"
    };
  }

  return {
    label: "Excelente",
    message: "Campanha muito eficiente. Avaliar aumento gradual de investimento.",
    xp: 250,
    color: "#FFC800",
    bg: "bg-amber-50 border-amber-200"
  };
}

function getRoasDiagnosis(input: ChannelInput, metrics: ReturnType<typeof calculateInputMetrics>) {
  const roas = metrics.roas;
  const lowRoas = roas !== null && roas < 2;
  const cplHigh = metrics.cpl !== null && (metrics.cpl >= 80 || (input.ticketMedio > 0 && metrics.cpl > input.ticketMedio * 0.08));
  const manyLeadsFewSchedules = input.leads >= 10 && (metrics.taxaAgendamento === null || metrics.taxaAgendamento < 20);
  const manySchedulesFewShows = input.agendamentos >= 5 && (metrics.taxaComparecimento === null || metrics.taxaComparecimento < 50);
  const manyShowsFewSales = input.comparecimentos >= 3 && (metrics.taxaVenda === null || metrics.taxaVenda < 30);

  if (!lowRoas && roas !== null) {
    return ["manter acompanhamento", "aumentar investimento de forma gradual", "monitorar CPV", "acompanhar qualidade dos leads", "manter rotina comercial"];
  }

  if (lowRoas && cplHigh) {
    return ["revisar público", "revisar criativo", "revisar promessa", "validar ICP", "testar nova campanha"];
  }

  if (lowRoas && manyLeadsFewSchedules) {
    return ["revisar abordagem comercial", "revisar qualificação", "melhorar script", "reduzir atrito para agendar"];
  }

  if (lowRoas && manySchedulesFewShows) {
    return ["criar lembrete automático", "confirmar presença", "reduzir intervalo entre contato e reunião", "reforçar valor da reunião"];
  }

  if (lowRoas && manyShowsFewSales) {
    return ["revisar diagnóstico comercial", "revisar proposta", "treinar fechamento", "mapear objeções", "melhorar oferta"];
  }

  return ["preencher dados reais da campanha", "validar investimento e receita", "acompanhar leads, agenda, comparecimento e vendas"];
}

function createEmptyCampaignRecord(city = ""): Omit<CampaignRecord, "id" | "createdAt"> {
  return {
    ...defaultCampaignRoiSnapshot(),
    cidade: city,
    responsavelCampanha: "",
    observacaoCampanha: ""
  };
}

function getCampaignXp(input: ChannelInput) {
  const metrics = calculateInputMetrics(input);
  const filledFields = [
    input.nomeCampanha.trim(),
    input.canalCampanha,
    input.responsavelCampanha.trim(),
    input.observacaoCampanha.trim(),
    input.investimento,
    input.leads,
    input.agendamentos,
    input.comparecimentos,
    input.vendas,
    input.ticketMedio || input.receita
  ].filter(Boolean).length;
  const baseXp = Math.min(80, filledFields * 10);
  const roasXp = metrics.roas === null ? 0 : getRoasStatus(metrics.roas).xp;

  return baseXp + Math.max(0, roasXp);
}

function CampaignLog({
  unitCity,
  records,
  onAdd,
  onRemove
}: {
  unitCity: string;
  records: CampaignRecord[];
  onAdd: (record: Omit<CampaignRecord, "id" | "createdAt">) => void;
  onRemove: (id: string) => void;
}) {
  const [form, setForm] = useState<Omit<CampaignRecord, "id" | "createdAt">>(() => createEmptyCampaignRecord(unitCity));
  const [selectedRecord, setSelectedRecord] = useState<CampaignRecord | null>(null);
  const metrics = calculateInputMetrics(form);
  const status = getRoasStatus(metrics.roas);
  const campaignXp = getCampaignXp(form);

  function update<K extends keyof Omit<CampaignRecord, "id" | "createdAt">>(field: K, value: Omit<CampaignRecord, "id" | "createdAt">[K]) {
    setForm((current) => ({
      ...current,
      [field]: typeof value === "number" ? (Number.isFinite(value) ? value : 0) : value
    }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd(form);
    setForm(createEmptyCampaignRecord(unitCity));
  }

  return (
    <section className="space-y-5">
      <section className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-emerald-600 text-white shadow-sm">
              <Calculator className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Missão de campanhas</p>
              <h1 className="text-2xl font-black text-ink">Registre campanhas reais e ganhe XP.</h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Informe plataforma, cidade e resultado para alimentar a visão master da franqueadora.
              </p>
            </div>
          </div>
          <XPBadge xp={campaignXp} label="XP possível" tone="gold" />
        </div>
      </section>

      <form onSubmit={submit} className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Nome da campanha" value={form.nomeCampanha} placeholder="Ex: Captação Meta Ads" onChange={(value) => update("nomeCampanha", value)} />
          <CampaignChannelField value={form.canalCampanha} onChange={(value) => update("canalCampanha", value)} />
          <TextField label="Responsável pela campanha" value={form.responsavelCampanha} placeholder="Ex: Ana / Gestor local" onChange={(value) => update("responsavelCampanha", value)} />
          <TextField label="Cidade da campanha" value={form.cidade} placeholder="Ex: São Paulo" onChange={(value) => update("cidade", value)} />
          <NumberField fieldKey="campaign-log-investimento" label="Investimento em mídia" value={form.investimento} onChange={(value) => update("investimento", value)} />
          <NumberField fieldKey="campaign-log-leads" label="Leads gerados" value={form.leads} onChange={(value) => update("leads", value)} />
          <NumberField fieldKey="campaign-log-agendamentos" label="Agendamentos" value={form.agendamentos} onChange={(value) => update("agendamentos", value)} />
          <NumberField fieldKey="campaign-log-comparecimentos" label="Comparecimentos" value={form.comparecimentos} onChange={(value) => update("comparecimentos", value)} />
          <NumberField fieldKey="campaign-log-vendas" label="Vendas" value={form.vendas} onChange={(value) => update("vendas", value)} />
          <NumberField fieldKey="campaign-log-ticket" label="Ticket médio" value={form.ticketMedio} onChange={(value) => update("ticketMedio", value)} />
          <NumberField fieldKey="campaign-log-receita" label="Receita total gerada" value={form.receita} onChange={(value) => update("receita", value)} />
          <div className="sm:col-span-2">
            <TextAreaField label="Observação da campanha" value={form.observacaoCampanha} placeholder="Descreva como foi realizada: público, oferta, criativo, ação local, aprendizados." onChange={(value) => update("observacaoCampanha", value)} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 rounded-[28px] border border-emerald-100 bg-emerald-50/80 p-4 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Resultado previsto</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-4xl font-black text-ink">{formatMultiplier(metrics.roas)}</span>
              <span className="rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: status.color }}>{status.label}</span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">+{campaignXp} XP</span>
            </div>
            <p className="mt-2 text-sm font-bold text-slate-600">{status.message}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MiniMetric label="Receita" value={formatCurrency(metrics.receita)} />
            <MiniMetric label="CPV" value={formatCurrency(metrics.cpv)} />
            <MiniMetric label="Taxa agenda" value={formatPercent(metrics.taxaAgendamento)} />
            <MiniMetric label="Taxa venda" value={formatPercent(metrics.taxaVenda)} />
          </div>
        </div>

        <button type="submit" className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-emerald-700 bg-emerald-600 text-sm font-black uppercase text-white transition active:translate-y-1 active:border-b-2">
          <CheckCircle2 className="h-4 w-4" />
          Registrar campanha e ganhar XP
        </button>
      </form>

      <section className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Histórico</p>
            <h2 className="text-xl font-black text-ink">Campanhas registradas</h2>
          </div>
          <XPBadge xp={records.reduce((sum, record) => sum + getCampaignXp(record), 0)} label="XP em campanhas" tone="green" />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {records.length ? records.map((record) => {
            const recordMetrics = calculateInputMetrics(record);
            const recordStatus = getRoasStatus(recordMetrics.roas);
            return (
              <article key={record.id} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-black text-ink">{record.nomeCampanha || "Campanha sem nome"}</p>
                    <p className="text-xs font-bold text-slate-500">{record.canalCampanha} - {record.cidade || "Cidade não informada"}</p>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: recordStatus.color }}>{recordStatus.label}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MiniMetric label="ROAS" value={formatMultiplier(recordMetrics.roas)} />
                  <MiniMetric label="Leads" value={`${record.leads}`} />
                  <MiniMetric label="Vendas" value={`${record.vendas}`} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setSelectedRecord(record)} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-700">
                    <Eye className="h-4 w-4" />
                    Ver detalhes
                  </button>
                  <button type="button" onClick={() => onRemove(record.id)} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700">
                    <Trash2 className="h-4 w-4" />
                    Excluir campanha
                  </button>
                </div>
              </article>
            );
          }) : (
            <div className="rounded-3xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
              Nenhuma campanha registrada ainda. Cadastre a primeira para pontuar e aparecer na visão master.
            </div>
          )}
        </div>
      </section>
      {selectedRecord ? (
        <CampaignDetailsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      ) : null}
    </section>
  );
}

function CampaignDetailsModal({ record, onClose }: { record: CampaignRecord; onClose: () => void }) {
  const metrics = calculateInputMetrics(record);
  const status = getRoasStatus(metrics.roas);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm">
      <article className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Detalhes da campanha</p>
            <h2 className="text-2xl font-black text-ink">{record.nomeCampanha || "Campanha sem nome"}</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">{record.canalCampanha} - {record.cidade || "Cidade não informada"}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <MiniMetric label="ROAS" value={formatMultiplier(metrics.roas)} />
          <MiniMetric label="Receita" value={formatCurrency(metrics.receita)} />
          <MiniMetric label="XP" value={`${getCampaignXp(record)}`} />
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Execução</p>
          <p className="mt-2 text-sm font-black text-ink">Responsável: {record.responsavelCampanha || "Não informado"}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm font-bold text-slate-600">{record.observacaoCampanha || "Sem observação registrada."}</p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <MiniMetric label="Leads" value={`${record.leads}`} />
          <MiniMetric label="Agend." value={`${record.agendamentos}`} />
          <MiniMetric label="Comparec." value={`${record.comparecimentos}`} />
          <MiniMetric label="Vendas" value={`${record.vendas}`} />
        </div>

        <div className="mt-4 rounded-3xl p-4" style={{ backgroundColor: status.bg.includes("emerald") ? "#ECFDF5" : status.bg.includes("amber") ? "#FFFBEB" : "#FEF2F2" }}>
          <p className="text-sm font-black text-ink">{status.label}</p>
          <p className="mt-1 text-sm font-bold text-slate-600">{status.message}</p>
        </div>
      </article>
    </div>
  );
}

function RoasCalculator({
  title,
  subtitle,
  fieldPrefix,
  accent,
  icon: Icon,
  input,
  onUpdate,
  onClear
}: {
  title: string;
  subtitle: string;
  fieldPrefix: string;
  accent: string;
  icon: typeof BarChart3;
  input: ChannelInput;
  onUpdate: <K extends keyof ChannelInput>(field: K, value: ChannelInput[K]) => void;
  onClear: () => void;
}) {
  const [recalculatedAt, setRecalculatedAt] = useState(0);
  const metrics = calculateInputMetrics(input);
  const status = getRoasStatus(metrics.roas);
  const diagnosis = getRoasDiagnosis(input, metrics);
  const progress = metrics.roas === null ? 0 : Math.min(100, Math.round((metrics.roas / 6) * 100));

  return (
    <article className="mt-5 rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white" style={{ backgroundColor: accent }}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">{subtitle}</p>
            <h2 className="text-xl font-black text-ink">{title}</h2>
          </div>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-limepop/60 text-emerald-700">
          <Calculator className="h-5 w-5" />
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-[26px] border border-dashed border-slate-300 bg-slate-50 p-4 sm:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Campanhas salvas</p>
          <h3 className="text-base font-black text-ink">Preparado para banco de dados</h3>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Quando houver backend, este ponto pode listar campanhas realizadas e carregar os mesmos campos, resultado e ações corretivas.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            disabled
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-400 outline-none"
          >
            <option>Selecionar campanha realizada</option>
          </select>
          <button
            type="button"
            disabled
            className="rounded-2xl border-2 border-b-4 border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase text-slate-400"
          >
            Criar nova campanha
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Nome da campanha"
          value={input.nomeCampanha}
          placeholder="Ex: Captação maio"
          onChange={(value) => onUpdate("nomeCampanha", value)}
        />
        <CampaignChannelField value={input.canalCampanha} onChange={(value) => onUpdate("canalCampanha", value)} />
        <NumberField fieldKey={`${fieldPrefix}-investimento`} label="Investimento em mídia" value={input.investimento} onChange={(value) => onUpdate("investimento", value)} />
        <NumberField fieldKey={`${fieldPrefix}-leads`} label="Leads gerados" value={input.leads} onChange={(value) => onUpdate("leads", value)} />
        <NumberField fieldKey={`${fieldPrefix}-agendamentos`} label="Agendamentos" value={input.agendamentos} onChange={(value) => onUpdate("agendamentos", value)} />
        <NumberField fieldKey={`${fieldPrefix}-comparecimentos`} label="Comparecimentos" value={input.comparecimentos} onChange={(value) => onUpdate("comparecimentos", value)} />
        <NumberField fieldKey={`${fieldPrefix}-vendas`} label="Vendas" value={input.vendas} onChange={(value) => onUpdate("vendas", value)} />
        <NumberField fieldKey={`${fieldPrefix}-ticketMedio`} label="Ticket médio" value={input.ticketMedio} onChange={(value) => onUpdate("ticketMedio", value)} />
        <div className="sm:col-span-2">
          <NumberField fieldKey={`${fieldPrefix}-receita`} label="Receita total gerada" value={input.receita} onChange={(value) => onUpdate("receita", value)} />
          <p className="mt-1 text-xs font-bold text-slate-500">
            Receita manual tem prioridade. Sem ela, o app calcula vendas x ticket médio.
          </p>
        </div>
      </div>

      <div className={`mt-4 rounded-3xl border p-4 ${status.bg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Retorno da campanha</p>
            <p className="text-4xl font-black text-ink">{formatMultiplier(metrics.roas)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: status.color }}>
              {status.label}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${status.xp < 0 ? "bg-red-100 text-red-700" : "bg-white text-emerald-700"}`}>
              XP {status.xp > 0 ? "+" : ""}{status.xp}
            </span>
          </div>
        </div>
        <p className="mt-2 text-sm font-bold text-slate-700">{status.message}</p>
        <div className="mt-3">
          <ProgressBar value={progress} color={status.color} label="Progresso até ROAS 6x" compact />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MiniMetric label="Receita total" value={formatCurrency(metrics.receita)} />
        <MiniMetric label="Investimento" value={formatCurrency(input.investimento)} />
        <MiniMetric label="CPL" value={formatCurrency(metrics.cpl)} />
        <MiniMetric label="CPA agenda" value={formatCurrency(metrics.cpa)} />
        <MiniMetric label="CPA comparec." value={formatCurrency(metrics.cpaComparecimento)} />
        <MiniMetric label="CPV" value={formatCurrency(metrics.cpv)} />
        <MiniMetric label="Taxa agenda" value={formatPercent(metrics.taxaAgendamento)} />
        <MiniMetric label="Taxa comparec." value={formatPercent(metrics.taxaComparecimento)} />
        <MiniMetric label="Taxa venda" value={formatPercent(metrics.taxaVenda)} />
      </div>

      <div className="mt-4 rounded-3xl bg-slate-50 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Ações corretivas</p>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-slate-500">
            {metrics.receitaOrigem === "manual" ? "receita manual" : metrics.receitaOrigem === "calculada" ? "receita calculada" : "dados insuficientes"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {diagnosis.map((action) => (
            <span key={action} className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
              {action}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRecalculatedAt(Date.now())}
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-b-4 border-emerald-600 bg-meadow px-4 py-2 text-xs font-black uppercase text-white transition active:translate-y-1 active:border-b-2"
        >
          <RotateCcw className="h-4 w-4" />
          Recalcular
        </button>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-b-4 border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase text-slate-600 transition active:translate-y-1 active:border-b-2"
        >
          <Trash2 className="h-4 w-4" />
          Limpar dados da campanha
        </button>
        {recalculatedAt ? <span className="self-center text-xs font-black text-emerald-700">Calculado agora</span> : null}
      </div>
    </article>
  );
}

function CampaignChannelField({ value, onChange }: { value: ChannelInput["canalCampanha"]; onChange: (value: ChannelInput["canalCampanha"]) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">Canal da campanha</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as ChannelInput["canalCampanha"])}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-ink outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      >
        {campaignChannelOptions.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function parseNumberInput(value: string) {
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function NumberField({ fieldKey, label, value, onChange }: { fieldKey: string; label: string; value: number; onChange: (value: number) => void }) {
  const [displayValue, setDisplayValue] = useState(value ? String(value) : "");

  useEffect(() => {
    setDisplayValue(value ? String(value) : "");
  }, [fieldKey, value]);

  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        placeholder="0"
        onChange={(event) => {
          const nextValue = event.target.value.replace(/[^\d.,]/g, "");
          setDisplayValue(nextValue);
          onChange(parseNumberInput(nextValue));
        }}
        onBlur={() => setDisplayValue(value ? String(value) : "")}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-ink outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-ink">{value}</p>
    </div>
  );
}

function formatCurrency(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "dados insuficientes";
  }

  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  });
}

function formatMultiplier(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "dados insuficientes";
  }

  return `${value.toFixed(1)}x`;
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "dados insuficientes";
  }

  return `${value.toFixed(0)}%`;
}

function SellerPlaybook() {
  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-2">
      {sellerTraining.map((training) => {
        const Icon = training.icon;
        return (
          <div key={training.title} className="rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-500 text-white">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-ink">{training.title}</h2>
            </div>
            <div className="grid gap-2">
              {training.items.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-700">
                  <BellRing className="h-4 w-4 text-teal-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
