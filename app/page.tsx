"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  CalendarCheck,
  Flame,
  Map,
  Medal,
  NotepadText,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trophy,
  TrendingUp,
  Trash2,
  Zap
} from "lucide-react";
import { BottomNavigation } from "@/components/bottom-navigation";
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
  medals,
  missions,
  problems,
  processNodes,
  sellerTraining
} from "@/data/game-data";
import type { BlockId, CaptureChannel, FunnelStep } from "@/data/game-data";
import { calculateInputMetrics, useCommercialInputs } from "@/hooks/use-commercial-inputs";
import type { ChannelInput, CommercialInputs } from "@/hooks/use-commercial-inputs";
import { useGameProgress } from "@/hooks/use-game-progress";
import { useSelfManagement } from "@/hooks/use-self-management";
import type { WeeklyPlan } from "@/hooks/use-self-management";

const navItems = [
  { id: "journey", label: "Jornada", icon: Map },
  { id: "missions", label: "Metas", icon: ClipboardCheck },
  { id: "score", label: "Metricas", icon: BarChart3 },
  { id: "problems", label: "Acoes", icon: ShieldAlert },
  { id: "management", label: "Gestao", icon: CalendarCheck }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("journey");
  const [openProblemId, setOpenProblemId] = useState(problems[0].id);
  const game = useGameProgress();
  const commercial = useCommercialInputs();
  const selfManagement = useSelfManagement();

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

  function openMissions(blockId: BlockId) {
    game.selectBlock(blockId);
    setActiveTab("missions");
  }

  return (
    <main className="min-h-screen pb-28 text-ink">
      <Header xp={game.totalXp} level={game.currentLevel} unitName={unitName} />

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <DesktopNavigation active={activeTab} onChange={setActiveTab} />
        <div>
          {activeTab === "journey" ? (
            <Screen key="journey">
              <LevelCard level={game.currentLevel} xp={game.totalXp} progress={game.levelProgress} nextLevelName={game.nextLevel?.name} />

              <section className="mt-5 rounded-[28px] border border-white/70 bg-white p-5 shadow-soft">
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
                  <ProgressBar value={game.executionPercent} color={game.currentLevel.color} label="Evolucao da unidade" />
                </div>
              </section>

              <section className="mt-6">
                <div className="mb-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Mapa da jornada</p>
                  <h1 className="text-2xl font-black text-ink">Organograma comercial gamificado</h1>
                </div>

                <div className="rounded-[32px] border border-slate-200 bg-white/85 p-4 shadow-soft">
                  <div className="grid gap-3">
                    {processNodes.map((node, index) => {
                      const Icon = node.icon;
                      return (
                        <div
                          key={node.id}
                          className="mx-auto flex w-full max-w-md items-center gap-3 rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-4"
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
                    <StageColumn title="Pilar 1" subtitle="Estrategia">
                      <JourneyMiniCard blockId="icp" onStart={openMissions} progress={game.blockProgress} />
                    </StageColumn>

                    <StageColumn title="Pilar 2" subtitle="Canais de Captacao">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {captureChannels.map((channel) => (
                          <JourneyMiniCard key={channel.id} blockId={channel.id} onStart={openMissions} progress={game.blockProgress} />
                        ))}
                      </div>
                    </StageColumn>

                    <StageColumn title="Pilar 3" subtitle="Execucao">
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
              <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-soft">
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
                  <ScoreCard label="Status" value={selectedBlockProgress?.status === "done" ? "Concluido" : selectedBlockProgress?.status === "locked" ? "Bloqueado" : "Em jogo"} icon={Trophy} color="#FFC800" />
                </div>

                {(selectedBlockProgress?.percent ?? 0) === 100 ? (
                  <div className="mt-4 flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amberpop text-white">
                      <Medal className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="font-black text-amber-800">Parabens, fase completa!</p>
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
                <ChannelPlaybook
                  channel={selectedChannel}
                  input={commercial.inputs[selectedChannel.id]}
                  onUpdate={commercial.updateChannel}
                  onClear={commercial.clearChannel}
                />
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
              <section className="overflow-hidden rounded-[28px] border border-white/70 bg-ink p-5 text-white shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-white/50">Metricas da operacao</p>
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
                    <p className="text-xs font-black uppercase text-white/50">Execucao</p>
                    <p className="mt-1 text-2xl font-black">{game.executionPercent}%</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4 sm:col-span-2">
                    <p className="text-xs font-black uppercase text-white/50">Maturidade comercial</p>
                    <p className="mt-1 text-xl font-black">{game.currentLevel.name}</p>
                  </div>
                </div>
              </section>

              <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-xl font-black text-ink">Metricas por blocos</h2>
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
                onClear={commercial.clearChannel}
              />

              <section className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
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

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-1 text-xl font-black text-ink">Posicao da unidade</h2>
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
                      <ProgressBar value={game.executionPercent} color={game.currentLevel.color} label="Execucao da unidade" />
                    </div>
                  </div>
                </div>
              </section>
            </Screen>
          ) : null}

          {activeTab === "problems" ? (
            <Screen key="problems">
              <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-soft">
                <div className="flex items-start gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-3xl bg-coral text-white">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Guia de decisao</p>
                    <h1 className="text-2xl font-black text-ink">Problema → diagnostico → acao → XP</h1>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      Escolha o gargalo, veja causas provaveis, aplique uma acao corretiva e acompanhe a metrica que precisa melhorar.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-5 grid gap-3 md:grid-cols-3">
                <GuidanceCard
                  title="1. Ache a etapa"
                  text="Olhe se o problema esta em lead, resposta, agenda, comparecimento, venda, indicacao ou rotina."
                  icon={BarChart3}
                />
                <GuidanceCard
                  title="2. Escolha uma acao"
                  text="Nao tente corrigir tudo ao mesmo tempo. Aplique uma acao por semana e acompanhe a metrica."
                  icon={ShieldAlert}
                />
                <GuidanceCard
                  title="3. Rode o ciclo"
                  text="Meça o resultado em 7 dias. Se melhorou, padronize. Se nao melhorou, teste a proxima acao."
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

                <div key={openProblem.id} className="sticky top-20 h-fit rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-3xl bg-skyjoy text-white">
                      <OpenProblemIcon className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Diagnostico provavel</p>
                      <h2 className="text-xl font-black text-ink">{openProblem.title}</h2>
                      <p className="mt-1 text-xs font-black text-emerald-600">{openProblem.metric}</p>
                    </div>
                  </div>

                  <div className="mb-4 rounded-3xl bg-slate-50 p-4">
                    <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Causas provaveis</p>
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
                        onToggle={() => game.toggleSolution(openProblem.id, action)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            </Screen>
          ) : null}

          {activeTab === "management" ? (
            <Screen key="management">
              <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-soft">
                <div className="flex items-start gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-3xl bg-meadow text-white">
                    <CalendarCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Auto gestao comercial</p>
                    <h1 className="text-2xl font-black text-ink">Plano da semana e proximo movimento</h1>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      Transforme metricas em rotina: escolha foco, execute o dia, registre aprendizado e avance.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-5 grid gap-4 xl:grid-cols-[1fr_1.1fr]">
                <NextMoveCard nextMove={nextMove} />
                <WeeklyPlanCard plan={selfManagement.weeklyPlan} onUpdate={selfManagement.updatePlan} />
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
                  bottleneck={weakestBlock?.label ?? "Sem gargalo"}
                  action={nextMove.action}
                  onCloseWeek={selfManagement.closeWeek}
                />
              </section>
            </Screen>
          ) : null}
        </div>
      </div>

      <BottomNavigation items={navItems} active={activeTab} onChange={setActiveTab} />
    </main>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="animate-[fadeIn_160ms_ease-out]">{children}</div>;
}

function DesktopNavigation({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <nav className="mb-5 hidden rounded-[28px] border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur md:block">
      <div className="grid grid-cols-4 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border text-sm font-black transition ${
                isActive
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-press"
                  : "border-transparent bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function GuidanceCard({ title, text, icon: Icon }: { title: string; text: string; icon: typeof BarChart3 }) {
  return (
    <article className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
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
      title: "Ativar captacao",
      reason: "Ainda nao existe volume de leads registrado. Sem topo de funil, a unidade nao consegue avaliar o resto.",
      action: "Escolha um canal foco e registre uma meta simples de leads para esta semana.",
      measure: "Leads gerados por canal"
    };
  }

  if (totals.agendamentos === 0 || totals.agendamentos / Math.max(totals.interacoes, 1) < 0.25) {
    return {
      title: "Melhorar abordagem",
      reason: "O gargalo parece estar entre conversa e agenda.",
      action: "Revise script, reduza atrito e ofereca uma chamada/diagnostico mais claro.",
      measure: "Taxa de agendamento"
    };
  }

  if (totals.comparecimentos === 0 || totals.comparecimentos / Math.max(totals.agendamentos, 1) < 0.55) {
    return {
      title: "Aumentar comparecimento",
      reason: "As pessoas agendam, mas nao aparecem em volume suficiente.",
      action: "Confirme presenca, envie lembrete e reforce o valor da reuniao.",
      measure: "Taxa de comparecimento"
    };
  }

  if (totals.vendas === 0 || totals.vendas / Math.max(totals.comparecimentos, 1) < 0.35) {
    return {
      title: "Revisar fechamento",
      reason: "O gargalo parece estar depois do comparecimento.",
      action: "Revise diagnostico, objecoes, proposta e motivo de perda.",
      measure: "Taxa de venda"
    };
  }

  if (totals.indicacoes < 5 || weakestBlockId === "ativo-quente") {
    return {
      title: "Ativar indicacao e recompra",
      reason: "A unidade pode crescer com clientes atuais, antigos e satisfeitos.",
      action: "Crie rotina de pedido de indicacao, reativacao e renovacao.",
      measure: "Indicacoes e recompras no mes"
    };
  }

  return {
    title: "Padronizar o que funcionou",
    reason: fallbackDiagnosis,
    action: "Transforme a melhor acao da semana em rotina e acompanhe por 7 dias.",
    measure: "Score, XP e metrica foco"
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
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Proximo movimento</p>
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
  onUpdate
}: {
  plan: WeeklyPlan;
  onUpdate: <K extends keyof WeeklyPlan>(field: K, value: WeeklyPlan[K]) => void;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-skyjoy text-white">
          <NotepadText className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Plano da semana</p>
          <h2 className="text-xl font-black text-ink">Foco de execucao</h2>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Prioridade" value={plan.priority} placeholder="Ex: melhorar agendamento" onChange={(value) => onUpdate("priority", value)} />
        <SelectField label="Canal foco" value={plan.focusChannel} onChange={(value) => onUpdate("focusChannel", value)} />
        <TextField label="Meta principal" value={plan.mainGoal} placeholder="Ex: 20 agendamentos" onChange={(value) => onUpdate("mainGoal", value)} />
        <TextField label="Acao corretiva" value={plan.correctiveAction} placeholder="Ex: revisar script" onChange={(value) => onUpdate("correctiveAction", value)} />
        <TextField label="Responsavel" value={plan.owner} placeholder="Ex: Vendedor / Franqueado" onChange={(value) => onUpdate("owner", value)} />
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
            <option>Concluido</option>
          </select>
        </label>
      </div>
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
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Checklist diario</p>
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
  bottleneck,
  action,
  onCloseWeek
}: {
  history: Array<{ id: string; date: string; score: number; xp: number; bottleneck: string; action: string }>;
  score: number;
  xp: number;
  bottleneck: string;
  action: string;
  onCloseWeek: (entry: { score: number; xp: number; bottleneck: string; action: string }) => void;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Historico simples</p>
          <h2 className="text-xl font-black text-ink">Fechamento semanal</h2>
        </div>
        <button
          type="button"
          onClick={() => onCloseWeek({ score, xp, bottleneck, action })}
          className="rounded-2xl border-2 border-b-4 border-emerald-600 bg-meadow px-4 py-2 text-xs font-black uppercase text-white transition active:translate-y-1 active:border-b-2"
        >
          Fechar semana
        </button>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <MiniMetric label="Metrica" value={`${score}%`} />
        <MiniMetric label="XP" value={`${xp}`} />
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
              <p className="mt-1 text-sm font-bold text-slate-600">Acao: {entry.action}</p>
            </div>
          ))
        ) : (
          <div className="rounded-3xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
            Nenhuma semana fechada ainda. Quando fechar, o historico mostra score, XP, gargalo e acao escolhida.
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
          <p className="text-xs font-bold text-slate-500">{locked ? "Desbloqueie concluindo ICP" : `${block.percent}% concluido`}</p>
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar value={block.percent} color={block.accent} compact />
      </div>
    </button>
  );
}

function ChannelPlaybook({
  channel,
  input,
  onUpdate,
  onClear
}: {
  channel: CaptureChannel;
  input: ChannelInput;
  onUpdate: <K extends keyof ChannelInput>(channelId: BlockId, field: K, value: ChannelInput[K]) => void;
  onClear: (channelId: BlockId) => void;
}) {
  const ChannelIcon = channel.icon;

  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ backgroundColor: channel.accent }}>
            <ChannelIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">{channel.subtitle}</p>
            <h2 className="text-xl font-black text-ink">Exemplo de funil do metodo</h2>
            <p className="text-xs font-bold text-slate-500">Referencia visual, nao dado real da unidade.</p>
          </div>
        </div>
        <FunnelPyramid steps={channel.funnel} color={channel.accent} />
      </div>

      <div className="space-y-4">
        <RoasCalculator
          title="Calculadora de ROAS"
          subtitle={`${channel.name} - ${channel.subtitle}`}
          channel={channel}
          input={input}
          compact
          onUpdate={onUpdate}
          onClear={onClear}
        />

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-xl font-black text-ink">Metas sugeridas e indicadores de referencia</h2>
          <p className="mb-3 text-xs font-bold text-slate-500">Use como guia do metodo. Os numeros reais ficam na aba Metricas, em Dados da unidade.</p>
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
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-xl font-black text-ink">Formulas do metodo</h2>
          <p className="mb-3 text-xs font-bold text-slate-500">As formulas calculam os dados reais preenchidos na area Dados da unidade.</p>
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
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-xl font-black text-ink">Canais possiveis</h2>
          <p className="mb-3 text-xs font-bold text-slate-500">Lista de opcoes do metodo, nao canais ja executados pela unidade.</p>
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
            <h2 className="mb-3 text-xl font-black text-sky-900">Notas praticas</h2>
            <div className="space-y-2">
              {channel.notes.map((note) => (
                <p key={note} className="text-sm font-bold text-sky-800">{note}</p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-xl font-black text-ink">Intervencoes recomendadas</h2>
          <p className="mb-3 text-xs font-bold text-slate-500">Acoes sugeridas quando a metrica real indicar gargalo.</p>
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
  onUpdate,
  onClear
}: {
  unitName: string;
  inputs: CommercialInputs;
  onUnitNameChange: (unitName: string) => void;
  onUpdate: <K extends keyof ChannelInput>(channelId: BlockId, field: K, value: ChannelInput[K]) => void;
  onClear: (channelId: BlockId) => void;
}) {
  return (
    <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Dados da unidade</p>
          <h2 className="text-xl font-black text-ink">Onde o cliente insere os numeros reais</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Esta e a area oficial de dados reais da unidade. Preencha funil, investimento e receita por canal; o navegador salva sozinho.
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
          Esse nome aparece no topo e na posicao da unidade.
        </span>
      </label>

      <div className="grid gap-4 xl:grid-cols-2">
        {captureChannels.map((channel) => {
          const input = inputs[channel.id];

          return (
            <RoasCalculator
              key={channel.id}
              title="Calculadora de ROAS"
              subtitle={`${channel.name} - ${channel.subtitle}`}
              channel={channel}
              input={input}
              onUpdate={onUpdate}
              onClear={onClear}
            />
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

const campaignChannelOptions = ["Meta Ads", "Google Ads", "TikTok Ads", "Indicacao patrocinada", "Outro"] as const;

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
      label: "Critico",
      message: "A campanha ainda nao esta retornando o investimento.",
      xp: -50,
      color: "#EF4444",
      bg: "bg-red-50 border-red-200"
    };
  }

  if (roas < 2) {
    return {
      label: "Atencao",
      message: "A campanha esta proxima do empate, mas ainda precisa melhorar.",
      xp: 20,
      color: "#F97316",
      bg: "bg-orange-50 border-orange-200"
    };
  }

  if (roas < 4) {
    return {
      label: "Saudavel",
      message: "A campanha ja gera retorno, mas ainda pode ser otimizada.",
      xp: 80,
      color: "#1CB0F6",
      bg: "bg-sky-50 border-sky-200"
    };
  }

  if (roas < 6) {
    return {
      label: "Forte",
      message: "A campanha esta performando bem e pode ser acompanhada para escala.",
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
    return ["revisar publico", "revisar criativo", "revisar promessa", "validar ICP", "testar nova campanha"];
  }

  if (lowRoas && manyLeadsFewSchedules) {
    return ["revisar abordagem comercial", "revisar qualificacao", "melhorar script", "reduzir atrito para agendar"];
  }

  if (lowRoas && manySchedulesFewShows) {
    return ["criar lembrete automatico", "confirmar presenca", "reduzir intervalo entre contato e reuniao", "reforcar valor da reuniao"];
  }

  if (lowRoas && manyShowsFewSales) {
    return ["revisar diagnostico comercial", "revisar proposta", "treinar fechamento", "mapear objecoes", "melhorar oferta"];
  }

  return ["preencher dados reais da campanha", "validar investimento e receita", "acompanhar leads, agenda, comparecimento e vendas"];
}

function RoasCalculator({
  title,
  subtitle,
  channel,
  input,
  compact,
  onUpdate,
  onClear
}: {
  title: string;
  subtitle: string;
  channel: CaptureChannel;
  input: ChannelInput;
  compact?: boolean;
  onUpdate: <K extends keyof ChannelInput>(channelId: BlockId, field: K, value: ChannelInput[K]) => void;
  onClear: (channelId: BlockId) => void;
}) {
  const [recalculatedAt, setRecalculatedAt] = useState(0);
  const metrics = calculateInputMetrics(input);
  const status = getRoasStatus(metrics.roas);
  const diagnosis = getRoasDiagnosis(input, metrics);
  const Icon = channel.icon;
  const progress = metrics.roas === null ? 0 : Math.min(100, Math.round((metrics.roas / 6) * 100));

  return (
    <article className={`rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm ${compact ? "" : "h-full"}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white" style={{ backgroundColor: channel.accent }}>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Nome da campanha"
          value={input.nomeCampanha}
          placeholder="Ex: Captação maio"
          onChange={(value) => onUpdate(channel.id, "nomeCampanha", value)}
        />
        <CampaignChannelField value={input.canalCampanha} onChange={(value) => onUpdate(channel.id, "canalCampanha", value)} />
        <NumberField fieldKey={`${channel.id}-investimento`} label="Investimento em midia" value={input.investimento} onChange={(value) => onUpdate(channel.id, "investimento", value)} />
        <NumberField fieldKey={`${channel.id}-leads`} label="Leads gerados" value={input.leads} onChange={(value) => onUpdate(channel.id, "leads", value)} />
        <NumberField fieldKey={`${channel.id}-agendamentos`} label="Agendamentos" value={input.agendamentos} onChange={(value) => onUpdate(channel.id, "agendamentos", value)} />
        <NumberField fieldKey={`${channel.id}-comparecimentos`} label="Comparecimentos" value={input.comparecimentos} onChange={(value) => onUpdate(channel.id, "comparecimentos", value)} />
        <NumberField fieldKey={`${channel.id}-vendas`} label="Vendas" value={input.vendas} onChange={(value) => onUpdate(channel.id, "vendas", value)} />
        <NumberField fieldKey={`${channel.id}-ticketMedio`} label="Ticket medio" value={input.ticketMedio} onChange={(value) => onUpdate(channel.id, "ticketMedio", value)} />
        <div className="sm:col-span-2">
          <NumberField fieldKey={`${channel.id}-receita`} label="Receita total gerada" value={input.receita} onChange={(value) => onUpdate(channel.id, "receita", value)} />
          <p className="mt-1 text-xs font-bold text-slate-500">
            Receita manual tem prioridade. Sem ela, o app calcula vendas x ticket medio.
          </p>
        </div>
      </div>

      <div className={`mt-4 rounded-3xl border p-4 ${status.bg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">ROAS</p>
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
          <ProgressBar value={progress} color={status.color} label="Progresso ate ROAS 6x" compact />
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
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Acoes corretivas</p>
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
          onClick={() => onClear(channel.id)}
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
          <div key={training.title} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
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
