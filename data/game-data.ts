import {
  Award,
  BarChart3,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Crown,
  Flame,
  Handshake,
  HeartHandshake,
  Lightbulb,
  MapPinned,
  Megaphone,
  MessageCircle,
  PhoneCall,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
  UserRoundCheck,
  UsersRound,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PillarStatus = "locked" | "active" | "done";
export type BlockId =
  | "icp"
  | "passivo-frio"
  | "passivo-quente"
  | "ativo-frio"
  | "ativo-quente"
  | "vendedor"
  | "indicadores"
  | "intervencoes";

export type Level = {
  id: string;
  name: string;
  minPercent: number;
  minXp: number;
  color: string;
};

export type JourneyBlock = {
  id: BlockId;
  name: string;
  type: "pillar" | "channel" | "support";
  parent: "estrategico" | "marketing" | "captação" | "execucao";
  icon: LucideIcon;
  xp: number;
  accent: string;
  short: string;
  explanation: string;
};

export type Mission = {
  id: string;
  blockId: BlockId;
  title: string;
  xp: number;
};

export type FunnelStep = {
  label: string;
  value: number;
};

export type Metric = {
  label: string;
  value: string;
  trend: string;
};

export type Formula = {
  label: string;
  expression: string;
};

export type CaptureChannel = {
  id: Exclude<BlockId, "icp" | "vendedor" | "indicadores" | "intervencoes">;
  name: string;
  subtitle: string;
  icon: LucideIcon;
  accent: string;
  funnel: FunnelStep[];
  goals: string[];
  indicators: Metric[];
  formulas?: Formula[];
  channels?: string[];
  notes?: string[];
  interventions: {
    trigger: string;
    actions: string[];
  }[];
};

export type Problem = {
  id: string;
  title: string;
  symptom: string;
  icon: LucideIcon;
  metric: string;
  xp: number;
  causes: string[];
  actions: string[];
};

export type Medal = {
  id: string;
  title: string;
  blockId: BlockId;
  icon: LucideIcon;
};

export const levels: Level[] = [
  { id: "messy", name: "Operação Desorganizada", minPercent: 0, minXp: 0, color: "#EF4444" },
  { id: "building", name: "Operação em Construção", minPercent: 26, minXp: 260, color: "#F97316" },
  { id: "evolving", name: "Operação em Evolução", minPercent: 51, minXp: 620, color: "#1CB0F6" },
  { id: "strong", name: "Operação Forte", minPercent: 76, minXp: 980, color: "#58CC02" },
  { id: "champion", name: "Unidade Campeã", minPercent: 91, minXp: 1320, color: "#FFC800" }
];

export const processNodes = [
  { id: "processo", title: "Processo Comercial", subtitle: "Jogo da evolução da unidade", icon: MapPinned, color: "#172033" },
  { id: "diretoria", title: "Diretoria Estratégica", subtitle: "Define prioridade, ICP e meta", icon: Crown, color: "#58CC02" },
  { id: "marketing", title: "Marketing Tático", subtitle: "Ativa canais e mede funil", icon: Megaphone, color: "#1CB0F6" }
];

export const journeyBlocks: JourneyBlock[] = [
  {
    id: "icp",
    name: "Pilar 1: Definição de ICP",
    type: "pillar",
    parent: "estrategico",
    icon: Target,
    xp: 245,
    accent: "#58CC02",
    short: "Base do processo comercial",
    explanation:
      "ICP é a base do processo comercial. Antes de investir em mídia ou vendedor, a unidade precisa saber quem é o cliente ideal."
  },
  {
    id: "passivo-frio",
    name: "Passivo Frio",
    type: "channel",
    parent: "captação",
    icon: Megaphone,
    xp: 280,
    accent: "#1CB0F6",
    short: "Tráfego pago",
    explanation: "Campanhas que geram leads frios e precisam ser qualificadas por funil, custo e qualidade."
  },
  {
    id: "passivo-quente",
    name: "Passivo Quente",
    type: "channel",
    parent: "captação",
    icon: MessageCircle,
    xp: 270,
    accent: "#FFB000",
    short: "Social selling",
    explanation: "Relacionamento com pessoas que já seguem, interagem ou conhecem a marca."
  },
  {
    id: "ativo-frio",
    name: "Ativo Frio",
    type: "channel",
    parent: "captação",
    icon: Radio,
    xp: 240,
    accent: "#8B5CF6",
    short: "Lista fria e mídias frias",
    explanation: "Ações locais e prospecção ativa para testar canais antes de investir alto."
  },
  {
    id: "ativo-quente",
    name: "Ativo Quente",
    type: "channel",
    parent: "captação",
    icon: HeartHandshake,
    xp: 300,
    accent: "#FF6B6B",
    short: "Indicação, renovação e recompra",
    explanation: "Rotinas com clientes, recepção, SDR e especialista para gerar recompra e indicações."
  },
  {
    id: "vendedor",
    name: "Pilar 3: Vendedor",
    type: "pillar",
    parent: "execucao",
    icon: UserRoundCheck,
    xp: 300,
    accent: "#14B8A6",
    short: "Execução comercial",
    explanation: "O vendedor transforma canal em venda com rotina, script, CRM, emocional e acompanhamento."
  },
  {
    id: "indicadores",
    name: "Indicadores",
    type: "support",
    parent: "marketing",
    icon: BarChart3,
    xp: 160,
    accent: "#F97316",
    short: "Leitura do funil",
    explanation: "Sem indicador, a unidade não sabe se o problema esta em lead, agenda, comparecimento ou venda."
  },
  {
    id: "intervencoes",
    name: "Intervenções",
    type: "support",
    parent: "execucao",
    icon: ShieldAlert,
    xp: 180,
    accent: "#EF4444",
    short: "Ações corretivas",
    explanation: "Quando um número cai, o jogo mostra a causa provavel e a ação corretiva da semana."
  }
];

export const missions: Mission[] = [
  { id: "icp-1", blockId: "icp", title: "Baixar planilha de ICP", xp: 35 },
  { id: "icp-2", blockId: "icp", title: "Selecionar os últimos clientes/fichas", xp: 35 },
  { id: "icp-3", blockId: "icp", title: "Analisar os clientes com maior ticket", xp: 35 },
  { id: "icp-4", blockId: "icp", title: "Analisar os clientes que mais recompram", xp: 35 },
  { id: "icp-5", blockId: "icp", title: "Identificar clientes mais rentáveis", xp: 35 },
  { id: "icp-6", blockId: "icp", title: "Identificar padrão dos melhores clientes", xp: 35 },
  { id: "icp-7", blockId: "icp", title: "Preencher ICP final", xp: 35 },

  { id: "pf-1", blockId: "passivo-frio", title: "Verificar histórico de leads", xp: 35 },
  { id: "pf-2", blockId: "passivo-frio", title: "Calcular CPA por agenda", xp: 35 },
  { id: "pf-3", blockId: "passivo-frio", title: "Calcular CPA por comparecimento", xp: 35 },
  { id: "pf-4", blockId: "passivo-frio", title: "Calcular CPV por venda", xp: 35 },
  { id: "pf-5", blockId: "passivo-frio", title: "Validar se o lead está qualificado", xp: 35 },
  { id: "pf-6", blockId: "passivo-frio", title: "Avaliar se campanha gera leads bons", xp: 35 },
  { id: "pf-7", blockId: "passivo-frio", title: "Identificar gargalo da campanha", xp: 35 },
  { id: "pf-8", blockId: "passivo-frio", title: "Criar intervenção", xp: 35 },

  { id: "pq-1", blockId: "passivo-quente", title: "Selecionar mídias sociais", xp: 30 },
  { id: "pq-2", blockId: "passivo-quente", title: "Definir lista de pessoas para abordar", xp: 30 },
  { id: "pq-3", blockId: "passivo-quente", title: "Enviar mensagens para seguidores", xp: 30 },
  { id: "pq-4", blockId: "passivo-quente", title: "Abordar leads que interagiram", xp: 30 },
  { id: "pq-5", blockId: "passivo-quente", title: "Criar rotina diária de contatos", xp: 30 },
  { id: "pq-6", blockId: "passivo-quente", title: "Medir respostas", xp: 30 },
  { id: "pq-7", blockId: "passivo-quente", title: "Medir agendamentos", xp: 30 },
  { id: "pq-8", blockId: "passivo-quente", title: "Medir comparecimentos", xp: 30 },
  { id: "pq-9", blockId: "passivo-quente", title: "Medir vendas", xp: 30 },

  { id: "af-1", blockId: "ativo-frio", title: "Selecionar mídia fria", xp: 30 },
  { id: "af-2", blockId: "ativo-frio", title: "Testar canal antes de investir alto", xp: 30 },
  { id: "af-3", blockId: "ativo-frio", title: "Criar lista fria", xp: 30 },
  { id: "af-4", blockId: "ativo-frio", title: "Fazer abordagem inicial", xp: 30 },
  { id: "af-5", blockId: "ativo-frio", title: "Medir retorno", xp: 30 },
  { id: "af-6", blockId: "ativo-frio", title: "Medir agendamento", xp: 30 },
  { id: "af-7", blockId: "ativo-frio", title: "Medir venda", xp: 30 },
  { id: "af-8", blockId: "ativo-frio", title: "Validar se o canal vale continuidade", xp: 30 },

  { id: "aq-1", blockId: "ativo-quente", title: "Solicitar indicação aos clientes", xp: 30 },
  { id: "aq-2", blockId: "ativo-quente", title: "Enviar link de indicação", xp: 30 },
  { id: "aq-3", blockId: "ativo-quente", title: "Registrar quem indicou e quem foi indicado", xp: 30 },
  { id: "aq-4", blockId: "ativo-quente", title: "Ligar para cliente antigo", xp: 30 },
  { id: "aq-5", blockId: "ativo-quente", title: "Agendar revisão", xp: 30 },
  { id: "aq-6", blockId: "ativo-quente", title: "Reativar clientes", xp: 30 },
  { id: "aq-7", blockId: "ativo-quente", title: "Trabalhar recompra/renovação", xp: 30 },
  { id: "aq-8", blockId: "ativo-quente", title: "Identificar queixa e indicar solução", xp: 30 },
  { id: "aq-9", blockId: "ativo-quente", title: "Trabalhar manutenção ou extensão mensal", xp: 30 },
  { id: "aq-10", blockId: "ativo-quente", title: "Solicitar indicação de cliente satisfeito", xp: 30 },

  { id: "vd-1", blockId: "vendedor", title: "Fazer ligações diárias", xp: 35 },
  { id: "vd-2", blockId: "vendedor", title: "Preencher CRM", xp: 35 },
  { id: "vd-3", blockId: "vendedor", title: "Registrar motivo de perda", xp: 35 },
  { id: "vd-4", blockId: "vendedor", title: "Seguir script", xp: 35 },
  { id: "vd-5", blockId: "vendedor", title: "Fazer follow-up", xp: 35 },
  { id: "vd-6", blockId: "vendedor", title: "Enviar resumo diário", xp: 35 },
  { id: "vd-7", blockId: "vendedor", title: "Participar de treinamento", xp: 35 },
  { id: "vd-8", blockId: "vendedor", title: "Treinar objeções e fechamento", xp: 35 },

  { id: "ind-1", blockId: "indicadores", title: "Registrar funil por canal", xp: 40 },
  { id: "ind-2", blockId: "indicadores", title: "Atualizar CPL, CPA, CPV e ROAS", xp: 40 },
  { id: "ind-3", blockId: "indicadores", title: "Ler gargalos semanalmente", xp: 40 },
  { id: "ind-4", blockId: "indicadores", title: "Definir meta por etapa", xp: 40 },

  { id: "int-1", blockId: "intervencoes", title: "Escolher problema principal da semana", xp: 45 },
  { id: "int-2", blockId: "intervencoes", title: "Aplicar ação corretiva", xp: 45 },
  { id: "int-3", blockId: "intervencoes", title: "Medir impacto em 7 dias", xp: 45 },
  { id: "int-4", blockId: "intervencoes", title: "Treinar o vendedor no gargalo", xp: 45 }
];

export const captureChannels: CaptureChannel[] = [
  {
    id: "passivo-frio",
    name: "Passivo Frio",
    subtitle: "Tráfego Pago",
    icon: Megaphone,
    accent: "#1CB0F6",
    funnel: [
      { label: "Leads", value: 350 },
      { label: "Interações", value: 120 },
      { label: "Agendamentos", value: 60 },
      { label: "Comparecimentos", value: 30 },
      { label: "Vendas", value: 15 }
    ],
    goals: ["350 leads", "60 agendamentos", "30 comparecimentos", "15 vendas"],
    indicators: [
      { label: "CPL", value: "R$ 18", trend: "-11%" },
      { label: "CPA", value: "R$ 105", trend: "-8%" },
      { label: "CPC", value: "R$ 1,42", trend: "-6%" },
      { label: "CPV", value: "R$ 420", trend: "-5%" },
      { label: "ROAS", value: "4.6x", trend: "+0.8x" },
      { label: "Taxa agendamento", value: "50%", trend: "+4%" },
      { label: "Taxa comparecimento", value: "50%", trend: "+6%" },
      { label: "Taxa venda", value: "50%", trend: "+3%" }
    ],
    formulas: [
      { label: "CPA", expression: "investimento / número de agendamentos" },
      { label: "CPA comparecimento", expression: "investimento / número de comparecimentos" },
      { label: "CPV", expression: "investimento / número de vendas" },
      { label: "ROAS", expression: "receita / investimento" }
    ],
    interventions: [
      { trigger: "CPA alto", actions: ["Revisar criativo", "Revisar público", "Revisar oferta", "Revisar ICP", "Trocar campanha"] },
      { trigger: "Lead ruim", actions: ["Revisar promêssa", "Revisar segmentação", "Revisar canal", "Alinhar marketing com comercial"] }
    ]
  },
  {
    id: "passivo-quente",
    name: "Passivo Quente",
    subtitle: "Social Selling",
    icon: MessageCircle,
    accent: "#FFB000",
    funnel: [
      { label: "Abordagens", value: 50 },
      { label: "Respostas", value: 10 },
      { label: "Conversas", value: 8 },
      { label: "Agendamentos", value: 5 },
      { label: "Vendas", value: 2 }
    ],
    goals: ["50 abordagens", "10 respostas", "5 agendamentos", "2 vendas"],
    indicators: [
      { label: "Resposta", value: "20%", trend: "+5%" },
      { label: "Agenda", value: "50%", trend: "+8%" },
      { label: "Venda", value: "40%", trend: "+2%" },
      { label: "Conversas", value: "8", trend: "+3" }
    ],
    channels: ["Instagram", "WhatsApp", "Redes sociais", "Relacionamento", "Base quente"],
    interventions: [
      { trigger: "Baixa resposta", actions: ["Mudar abordagem", "Personalizar mensagem", "Melhorar perfil", "Revisar oferta"] },
      { trigger: "Baixo agendamento", actions: ["Melhorar script", "Reduzir atrito", "Oferecer diagnóstico", "Criar chamada mais clara"] }
    ]
  },
  {
    id: "ativo-frio",
    name: "Ativo Frio",
    subtitle: "Lista Fria / Mídias Frias",
    icon: Radio,
    accent: "#8B5CF6",
    funnel: [
      { label: "Pessoas impactadas", value: 1200 },
      { label: "Leads", value: 80 },
      { label: "Interações", value: 32 },
      { label: "Agendamentos", value: 14 },
      { label: "Comparecimentos", value: 9 },
      { label: "Vendas", value: 4 }
    ],
    goals: ["Testar com baixo custo", "Validar lead quente", "Decidir continuidade"],
    indicators: [
      { label: "Retorno", value: "6.6%", trend: "+1.2%" },
      { label: "Agenda", value: "44%", trend: "+5%" },
      { label: "Venda", value: "44%", trend: "+2%" },
      { label: "Custo teste", value: "R$ 480", trend: "controlado" }
    ],
    channels: ["Radio", "Outdoor", "Redes sociais", "Blitz", "Panfletagem", "Lista fria", "Ligação ativa", "Campanha local"],
    notes: ["Antes de investir muito, teste o canal com baixo custo e valide se gera lead quente."],
    interventions: [
      { trigger: "Não gerar lead", actions: ["Trocar mídia", "Ajustar mensagem", "Ajustar região", "Revisar ICP"] },
      { trigger: "Gerar lead ruim", actions: ["Revisar canal", "Revisar promêssa", "Melhorar qualificação"] }
    ]
  },
  {
    id: "ativo-quente",
    name: "Ativo Quente",
    subtitle: "Indicação, Renovação e Recompra",
    icon: HeartHandshake,
    accent: "#FF6B6B",
    funnel: [
      { label: "Ligações", value: 50 },
      { label: "Agendamentos", value: 10 },
      { label: "Comparecimentos", value: 5 },
      { label: "Vendas", value: 2 }
    ],
    goals: ["25 indicações/mês", "5 ligações por dia", "20 agendamentos no mês", "10 comparecimentos", "5 vendas"],
    indicators: [
      { label: "Indicações", value: "25/mês", trend: "+9" },
      { label: "Ligações", value: "5/dia", trend: "meta" },
      { label: "Agenda", value: "20/mês", trend: "+4" },
      { label: "Venda", value: "5/mês", trend: "+1" }
    ],
    notes: [
      "Secretaria/recepção: pedir indicação, enviar link e registrar indicado.",
      "SDR/vendedor: ligar para cliente antigo, agendar revisão e trabalhar renovação.",
      "Especialista: identificar queixa, indicar solução e orientar próximos passos.",
      "Paciente com remissão: oferecer manutenção por 6 mêses.",
      "Paciente sem remissão: extensão mensal conforme indicador técnico.",
      "Cliente satisfeito: solicitar indicação."
    ],
    interventions: [
      { trigger: "Pouca indicação", actions: ["Criar mensagem padrão", "Treinar secretaria", "Pedir no momento certo", "Oferecer incentivo", "Acompanhar meta semanal"] },
      { trigger: "Pouca renovação", actions: ["Revisar lista de clientes antigos", "Criar script de reativação", "Aumentar cadência", "Acompanhar vendedor"] }
    ]
  }
];

export const sellerTraining = [
  {
    title: "Treinamento Técnico",
    icon: ClipboardList,
    items: ["Domínio do produto", "Domínio do script", "Domínio das objeções", "Domínio do CRM", "Preenchimento correto dos dados", "Follow-up", "Fechamento"]
  },
  {
    title: "Treinamento Emocional",
    icon: Flame,
    items: ["Constância", "Rotina", "Disciplina", "Lidar com rejeição", "Comunicação", "Confiança", "Energia comercial"]
  }
];

export const medals: Medal[] = [
  { id: "medal-icp", title: "Mestre do ICP", blockId: "icp", icon: Target },
  { id: "medal-captação", title: "Gestor de Captação", blockId: "passivo-frio", icon: Megaphone },
  { id: "medal-agenda", title: "Máquina de Agendamento", blockId: "passivo-quente", icon: BellRing },
  { id: "medal-comparecimento", title: "Especialista em Comparecimento", blockId: "ativo-frio", icon: UsersRound },
  { id: "medal-vendas", title: "Campeão de Vendas", blockId: "vendedor", icon: Trophy },
  { id: "medal-indicacoes", title: "Rei das Indicações", blockId: "ativo-quente", icon: HeartHandshake },
  { id: "medal-disciplina", title: "Vendedor Disciplinado", blockId: "indicadores", icon: CheckCircle2 }
];

export const problems: Problem[] = [
  {
    id: "cpa-alto",
    title: "CPA alto",
    symptom: "Agenda ou venda está custando caro demais.",
    icon: Flame,
    metric: "CPA deve cair",
    xp: 25,
    causes: ["Criativo fraco", "Público desalinhado", "Oferta pouco clara", "ICP mal definido"],
    actions: ["Revisar criativo", "Revisar público", "Revisar oferta", "Revisar ICP", "Trocar campanha"]
  },
  {
    id: "cpl-alto",
    title: "CPL alto",
    symptom: "O lead entra caro antes mêsmo da qualificação.",
    icon: Zap,
    metric: "CPL deve cair",
    xp: 25,
    causes: ["Promêssa pouco atrativa", "Canal caro", "Segmentação ampla", "Criativo cansado"],
    actions: ["Ajustar promêssa", "Testar criativo", "Separar campanhas por público", "Comparar canais"]
  },
  {
    id: "poucos-leads",
    title: "Poucos leads",
    symptom: "O topo do funil não gera volume suficiente.",
    icon: Search,
    metric: "Volume de leads deve subir",
    xp: 25,
    causes: ["Baixa frequência", "Canal pouco ativo", "Oferta escondida", "Público pequeno"],
    actions: ["Revisar canal", "Aumentar frequência", "Testar nova mídia", "Ajustar promêssa", "Validar público"]
  },
  {
    id: "lead-desqualificado",
    title: "Lead desqualificado",
    symptom: "Chega lead, mas não tem perfil de compra.",
    icon: Target,
    metric: "Qualidade do lead deve subir",
    xp: 25,
    causes: ["ICP errado", "Promêssa atrai curiosos", "Segmentação ruim", "Canal desalinhado"],
    actions: ["Revisar ICP", "Revisar promêssa", "Revisar segmentação", "Alinhar marketing com comercial"]
  },
  {
    id: "baixa-resposta",
    title: "Baixa resposta",
    symptom: "O lead não responde à abordagem.",
    icon: MessageCircle,
    metric: "Taxa de resposta deve subir",
    xp: 25,
    causes: ["Mensagem genérica", "Timing ruim", "Perfil sem autoridade", "Oferta confusa"],
    actions: ["Mudar abordagem", "Personalizar mensagem", "Melhorar perfil", "Revisar oferta"]
  },
  {
    id: "baixo-agendamento",
    title: "Baixo agendamento",
    symptom: "Existe conversa, mas pouca agenda marcada.",
    icon: BellRing,
    metric: "Taxa de agendamento deve subir",
    xp: 25,
    causes: ["Script fraco", "Muito atrito", "Lead pouco qualificado", "Chamada sem valor"],
    actions: ["Melhorar script", "Reduzir atrito", "Oferecer diagnóstico", "Criar chamada mais clara"]
  },
  {
    id: "baixo-comparecimento",
    title: "Baixo comparecimento",
    symptom: "A pessoa agenda, mas não aparece.",
    icon: UsersRound,
    metric: "Comparecimento deve subir",
    xp: 25,
    causes: ["Agenda distante", "Sem lembrete", "Valor da reunião fraco", "Baixo compromisso"],
    actions: ["Confirmar presença", "Enviar lembrete", "Reforçar valor da reunião", "Reduzir intervalo até a agenda"]
  },
  {
    id: "baixa-venda",
    title: "Baixa venda",
    symptom: "Comparece, mas não fecha.",
    icon: Handshake,
    metric: "Taxa de venda deve subir",
    xp: 25,
    causes: ["Diagnóstico fraco", "Objeções sem resposta", "Proposta mal percebida", "Fechamento inseguro"],
    actions: ["Revisar diagnóstico", "Treinar objeções", "Treinar fechamento", "Acompanhar motivo de perda"]
  },
  {
    id: "baixa-recompra",
    title: "Baixa recompra",
    symptom: "Cliente antigo não volta.",
    icon: RefreshCw,
    metric: "Recompra e renovação devem subir",
    xp: 25,
    causes: ["Sem lista ativa", "Sem script", "Sem cadência", "Sem oferta de retorno"],
    actions: ["Revisar lista de clientes antigos", "Criar script de reativação", "Aumentar cadência", "Acompanhar vendedor"]
  },
  {
    id: "pouca-indicação",
    title: "Pouca indicação",
    symptom: "Cliente satisfeito não indica.",
    icon: HeartHandshake,
    metric: "Indicações por mês devem subir",
    xp: 25,
    causes: ["Não pede", "Pede no momento errado", "Secretaria sem script", "Meta invisível"],
    actions: ["Criar mensagem padrão", "Treinar secretaria", "Pedir no momento certo", "Oferecer incentivo", "Acompanhar meta semanal"]
  },
  {
    id: "sem-rotina",
    title: "Vendedor sem rotina",
    symptom: "Comercial depende de improviso.",
    icon: UserRoundCheck,
    metric: "Execução diária deve subir",
    xp: 25,
    causes: ["Meta confusa", "Sem acompanhamento", "Script ignorado", "Baixa disciplina"],
    actions: ["Revisar rotina", "Acompanhar diáriamente", "Definir meta simples", "Treinar script", "Escutar ligações", "Corrigir comportamento"]
  },
  {
    id: "franqueado-não-executa",
    title: "Franqueado não executa",
    symptom: "Plano existe, mas não vira ação.",
    icon: Lightbulb,
    metric: "Execução semanal deve subir",
    xp: 25,
    causes: ["Plano grande demais", "Sem dono", "Sem ritual", "Sem indicador visível"],
    actions: ["Reduzir para 3 prioridades", "Criar ritual semanal", "Definir responsável", "Medir execução visível"]
  }
];

export const diagnosisRules = [
  { blockId: "icp", text: "Antes de investir em captação, defina melhor o cliente ideal." },
  { blockId: "passivo-frio", text: "A unidade precisa ativar canais de aquisição." },
  { blockId: "passivo-quente", text: "O gargalo está na abordagem ou qualificação." },
  { blockId: "ativo-frio", text: "Valide canais frios com baixo custo antes de escalar." },
  { blockId: "ativo-quente", text: "Ative rotina de recompra, renovação e indicação." },
  { blockId: "vendedor", text: "Revise diagnóstico, objeções, fechamento e rotina do vendedor." }
] satisfies Array<{ blockId: BlockId; text: string }>;
