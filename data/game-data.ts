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
  parent: "estrategico" | "marketing" | "captacao" | "execucao";
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
  { id: "messy", name: "Operacao Desorganizada", minPercent: 0, minXp: 0, color: "#EF4444" },
  { id: "building", name: "Operacao em Construcao", minPercent: 26, minXp: 260, color: "#F97316" },
  { id: "evolving", name: "Operacao em Evolucao", minPercent: 51, minXp: 620, color: "#1CB0F6" },
  { id: "strong", name: "Operacao Forte", minPercent: 76, minXp: 980, color: "#58CC02" },
  { id: "champion", name: "Unidade Campea", minPercent: 91, minXp: 1320, color: "#FFC800" }
];

export const processNodes = [
  { id: "processo", title: "Processo Comercial", subtitle: "Jogo da evolucao da unidade", icon: MapPinned, color: "#172033" },
  { id: "diretoria", title: "Diretoria Estrategica", subtitle: "Define prioridade, ICP e meta", icon: Crown, color: "#58CC02" },
  { id: "marketing", title: "Marketing Tatico", subtitle: "Ativa canais e mede funil", icon: Megaphone, color: "#1CB0F6" }
];

export const journeyBlocks: JourneyBlock[] = [
  {
    id: "icp",
    name: "Pilar 1: Definicao de ICP",
    type: "pillar",
    parent: "estrategico",
    icon: Target,
    xp: 245,
    accent: "#58CC02",
    short: "Base do processo comercial",
    explanation:
      "ICP e a base do processo comercial. Antes de investir em midia ou vendedor, a unidade precisa saber quem e o cliente ideal."
  },
  {
    id: "passivo-frio",
    name: "Passivo Frio",
    type: "channel",
    parent: "captacao",
    icon: Megaphone,
    xp: 280,
    accent: "#1CB0F6",
    short: "Trafego pago",
    explanation: "Campanhas que geram leads frios e precisam ser qualificadas por funil, custo e qualidade."
  },
  {
    id: "passivo-quente",
    name: "Passivo Quente",
    type: "channel",
    parent: "captacao",
    icon: MessageCircle,
    xp: 270,
    accent: "#FFB000",
    short: "Social selling",
    explanation: "Relacionamento com pessoas que ja seguem, interagem ou conhecem a marca."
  },
  {
    id: "ativo-frio",
    name: "Ativo Frio",
    type: "channel",
    parent: "captacao",
    icon: Radio,
    xp: 240,
    accent: "#8B5CF6",
    short: "Lista fria e midias frias",
    explanation: "Acoes locais e prospeccao ativa para testar canais antes de investir alto."
  },
  {
    id: "ativo-quente",
    name: "Ativo Quente",
    type: "channel",
    parent: "captacao",
    icon: HeartHandshake,
    xp: 300,
    accent: "#FF6B6B",
    short: "Indicacao, renovacao e recompra",
    explanation: "Rotinas com clientes, recepcao, SDR e especialista para gerar recompra e indicacoes."
  },
  {
    id: "vendedor",
    name: "Pilar 3: Vendedor",
    type: "pillar",
    parent: "execucao",
    icon: UserRoundCheck,
    xp: 300,
    accent: "#14B8A6",
    short: "Execucao comercial",
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
    explanation: "Sem indicador, a unidade nao sabe se o problema esta em lead, agenda, comparecimento ou venda."
  },
  {
    id: "intervencoes",
    name: "Intervencoes",
    type: "support",
    parent: "execucao",
    icon: ShieldAlert,
    xp: 180,
    accent: "#EF4444",
    short: "Acoes corretivas",
    explanation: "Quando um numero cai, o jogo mostra a causa provavel e a acao corretiva da semana."
  }
];

export const missions: Mission[] = [
  { id: "icp-1", blockId: "icp", title: "Baixar planilha de ICP", xp: 35 },
  { id: "icp-2", blockId: "icp", title: "Selecionar os ultimos clientes/fichas", xp: 35 },
  { id: "icp-3", blockId: "icp", title: "Analisar os clientes com maior ticket", xp: 35 },
  { id: "icp-4", blockId: "icp", title: "Analisar os clientes que mais recompram", xp: 35 },
  { id: "icp-5", blockId: "icp", title: "Identificar clientes mais rentaveis", xp: 35 },
  { id: "icp-6", blockId: "icp", title: "Identificar padrao dos melhores clientes", xp: 35 },
  { id: "icp-7", blockId: "icp", title: "Preencher ICP final", xp: 35 },

  { id: "pf-1", blockId: "passivo-frio", title: "Verificar historico de leads", xp: 35 },
  { id: "pf-2", blockId: "passivo-frio", title: "Calcular CPA por agenda", xp: 35 },
  { id: "pf-3", blockId: "passivo-frio", title: "Calcular CPA por comparecimento", xp: 35 },
  { id: "pf-4", blockId: "passivo-frio", title: "Calcular CPV por venda", xp: 35 },
  { id: "pf-5", blockId: "passivo-frio", title: "Validar se o lead esta qualificado", xp: 35 },
  { id: "pf-6", blockId: "passivo-frio", title: "Avaliar se campanha gera leads bons", xp: 35 },
  { id: "pf-7", blockId: "passivo-frio", title: "Identificar gargalo da campanha", xp: 35 },
  { id: "pf-8", blockId: "passivo-frio", title: "Criar intervencao", xp: 35 },

  { id: "pq-1", blockId: "passivo-quente", title: "Selecionar midias sociais", xp: 30 },
  { id: "pq-2", blockId: "passivo-quente", title: "Definir lista de pessoas para abordar", xp: 30 },
  { id: "pq-3", blockId: "passivo-quente", title: "Enviar mensagens para seguidores", xp: 30 },
  { id: "pq-4", blockId: "passivo-quente", title: "Abordar leads que interagiram", xp: 30 },
  { id: "pq-5", blockId: "passivo-quente", title: "Criar rotina diaria de contatos", xp: 30 },
  { id: "pq-6", blockId: "passivo-quente", title: "Medir respostas", xp: 30 },
  { id: "pq-7", blockId: "passivo-quente", title: "Medir agendamentos", xp: 30 },
  { id: "pq-8", blockId: "passivo-quente", title: "Medir comparecimentos", xp: 30 },
  { id: "pq-9", blockId: "passivo-quente", title: "Medir vendas", xp: 30 },

  { id: "af-1", blockId: "ativo-frio", title: "Selecionar midia fria", xp: 30 },
  { id: "af-2", blockId: "ativo-frio", title: "Testar canal antes de investir alto", xp: 30 },
  { id: "af-3", blockId: "ativo-frio", title: "Criar lista fria", xp: 30 },
  { id: "af-4", blockId: "ativo-frio", title: "Fazer abordagem inicial", xp: 30 },
  { id: "af-5", blockId: "ativo-frio", title: "Medir retorno", xp: 30 },
  { id: "af-6", blockId: "ativo-frio", title: "Medir agendamento", xp: 30 },
  { id: "af-7", blockId: "ativo-frio", title: "Medir venda", xp: 30 },
  { id: "af-8", blockId: "ativo-frio", title: "Validar se o canal vale continuidade", xp: 30 },

  { id: "aq-1", blockId: "ativo-quente", title: "Solicitar indicacao aos clientes", xp: 30 },
  { id: "aq-2", blockId: "ativo-quente", title: "Enviar link de indicacao", xp: 30 },
  { id: "aq-3", blockId: "ativo-quente", title: "Registrar quem indicou e quem foi indicado", xp: 30 },
  { id: "aq-4", blockId: "ativo-quente", title: "Ligar para cliente antigo", xp: 30 },
  { id: "aq-5", blockId: "ativo-quente", title: "Agendar revisao", xp: 30 },
  { id: "aq-6", blockId: "ativo-quente", title: "Reativar clientes", xp: 30 },
  { id: "aq-7", blockId: "ativo-quente", title: "Trabalhar recompra/renovacao", xp: 30 },
  { id: "aq-8", blockId: "ativo-quente", title: "Identificar queixa e indicar solucao", xp: 30 },
  { id: "aq-9", blockId: "ativo-quente", title: "Trabalhar manutencao ou extensao mensal", xp: 30 },
  { id: "aq-10", blockId: "ativo-quente", title: "Solicitar indicacao de cliente satisfeito", xp: 30 },

  { id: "vd-1", blockId: "vendedor", title: "Fazer ligacoes diarias", xp: 35 },
  { id: "vd-2", blockId: "vendedor", title: "Preencher CRM", xp: 35 },
  { id: "vd-3", blockId: "vendedor", title: "Registrar motivo de perda", xp: 35 },
  { id: "vd-4", blockId: "vendedor", title: "Seguir script", xp: 35 },
  { id: "vd-5", blockId: "vendedor", title: "Fazer follow-up", xp: 35 },
  { id: "vd-6", blockId: "vendedor", title: "Enviar resumo diario", xp: 35 },
  { id: "vd-7", blockId: "vendedor", title: "Participar de treinamento", xp: 35 },
  { id: "vd-8", blockId: "vendedor", title: "Treinar objecoes e fechamento", xp: 35 },

  { id: "ind-1", blockId: "indicadores", title: "Registrar funil por canal", xp: 40 },
  { id: "ind-2", blockId: "indicadores", title: "Atualizar CPL, CPA, CPV e ROAS", xp: 40 },
  { id: "ind-3", blockId: "indicadores", title: "Ler gargalos semanalmente", xp: 40 },
  { id: "ind-4", blockId: "indicadores", title: "Definir meta por etapa", xp: 40 },

  { id: "int-1", blockId: "intervencoes", title: "Escolher problema principal da semana", xp: 45 },
  { id: "int-2", blockId: "intervencoes", title: "Aplicar acao corretiva", xp: 45 },
  { id: "int-3", blockId: "intervencoes", title: "Medir impacto em 7 dias", xp: 45 },
  { id: "int-4", blockId: "intervencoes", title: "Treinar o vendedor no gargalo", xp: 45 }
];

export const captureChannels: CaptureChannel[] = [
  {
    id: "passivo-frio",
    name: "Passivo Frio",
    subtitle: "Trafego Pago",
    icon: Megaphone,
    accent: "#1CB0F6",
    funnel: [
      { label: "Leads", value: 350 },
      { label: "Interacoes", value: 120 },
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
      { label: "CPA", expression: "investimento / numero de agendamentos" },
      { label: "CPA comparecimento", expression: "investimento / numero de comparecimentos" },
      { label: "CPV", expression: "investimento / numero de vendas" },
      { label: "ROAS", expression: "receita / investimento" }
    ],
    interventions: [
      { trigger: "CPA alto", actions: ["Revisar criativo", "Revisar publico", "Revisar oferta", "Revisar ICP", "Trocar campanha"] },
      { trigger: "Lead ruim", actions: ["Revisar promessa", "Revisar segmentacao", "Revisar canal", "Alinhar marketing com comercial"] }
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
      { trigger: "Baixo agendamento", actions: ["Melhorar script", "Reduzir atrito", "Oferecer diagnostico", "Criar chamada mais clara"] }
    ]
  },
  {
    id: "ativo-frio",
    name: "Ativo Frio",
    subtitle: "Lista Fria / Midias Frias",
    icon: Radio,
    accent: "#8B5CF6",
    funnel: [
      { label: "Pessoas impactadas", value: 1200 },
      { label: "Leads", value: 80 },
      { label: "Interacoes", value: 32 },
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
    channels: ["Radio", "Outdoor", "Redes sociais", "Blitz", "Panfletagem", "Lista fria", "Ligacao ativa", "Campanha local"],
    notes: ["Antes de investir muito, teste o canal com baixo custo e valide se gera lead quente."],
    interventions: [
      { trigger: "Nao gerar lead", actions: ["Trocar midia", "Ajustar mensagem", "Ajustar regiao", "Revisar ICP"] },
      { trigger: "Gerar lead ruim", actions: ["Revisar canal", "Revisar promessa", "Melhorar qualificacao"] }
    ]
  },
  {
    id: "ativo-quente",
    name: "Ativo Quente",
    subtitle: "Indicacao, Renovacao e Recompra",
    icon: HeartHandshake,
    accent: "#FF6B6B",
    funnel: [
      { label: "Ligacoes", value: 50 },
      { label: "Agendamentos", value: 10 },
      { label: "Comparecimentos", value: 5 },
      { label: "Vendas", value: 2 }
    ],
    goals: ["25 indicacoes/mes", "5 ligacoes por dia", "20 agendamentos no mes", "10 comparecimentos", "5 vendas"],
    indicators: [
      { label: "Indicacoes", value: "25/mes", trend: "+9" },
      { label: "Ligacoes", value: "5/dia", trend: "meta" },
      { label: "Agenda", value: "20/mes", trend: "+4" },
      { label: "Venda", value: "5/mes", trend: "+1" }
    ],
    notes: [
      "Secretaria/recepcao: pedir indicacao, enviar link e registrar indicado.",
      "SDR/vendedor: ligar para cliente antigo, agendar revisao e trabalhar renovacao.",
      "Especialista: identificar queixa, indicar solucao e orientar proximos passos.",
      "Paciente com remissao: oferecer manutencao por 6 meses.",
      "Paciente sem remissao: extensao mensal conforme indicador tecnico.",
      "Cliente satisfeito: solicitar indicacao."
    ],
    interventions: [
      { trigger: "Pouca indicacao", actions: ["Criar mensagem padrao", "Treinar secretaria", "Pedir no momento certo", "Oferecer incentivo", "Acompanhar meta semanal"] },
      { trigger: "Pouca renovacao", actions: ["Revisar lista de clientes antigos", "Criar script de reativacao", "Aumentar cadencia", "Acompanhar vendedor"] }
    ]
  }
];

export const sellerTraining = [
  {
    title: "Treinamento Tecnico",
    icon: ClipboardList,
    items: ["Dominio do produto", "Dominio do script", "Dominio das objecoes", "Dominio do CRM", "Preenchimento correto dos dados", "Follow-up", "Fechamento"]
  },
  {
    title: "Treinamento Emocional",
    icon: Flame,
    items: ["Constancia", "Rotina", "Disciplina", "Lidar com rejeicao", "Comunicacao", "Confianca", "Energia comercial"]
  }
];

export const medals: Medal[] = [
  { id: "medal-icp", title: "Mestre do ICP", blockId: "icp", icon: Target },
  { id: "medal-captacao", title: "Gestor de Captacao", blockId: "passivo-frio", icon: Megaphone },
  { id: "medal-agenda", title: "Maquina de Agendamento", blockId: "passivo-quente", icon: BellRing },
  { id: "medal-comparecimento", title: "Especialista em Comparecimento", blockId: "ativo-frio", icon: UsersRound },
  { id: "medal-vendas", title: "Campeao de Vendas", blockId: "vendedor", icon: Trophy },
  { id: "medal-indicacoes", title: "Rei das Indicacoes", blockId: "ativo-quente", icon: HeartHandshake },
  { id: "medal-disciplina", title: "Vendedor Disciplinado", blockId: "indicadores", icon: CheckCircle2 }
];

export const ranking = [
  { unit: "Unidade Jardins", xp: 1480, badge: "Unidade Campea" },
  { unit: "Unidade Vila Nova", xp: 1210, badge: "Operacao Forte" },
  { unit: "Sua Unidade", xp: 0, badge: "Em jogo" }
];

export const problems: Problem[] = [
  {
    id: "cpa-alto",
    title: "CPA alto",
    symptom: "Agenda ou venda esta custando caro demais.",
    icon: Flame,
    metric: "CPA deve cair",
    xp: 25,
    causes: ["Criativo fraco", "Publico desalinhado", "Oferta pouco clara", "ICP mal definido"],
    actions: ["Revisar criativo", "Revisar publico", "Revisar oferta", "Revisar ICP", "Trocar campanha"]
  },
  {
    id: "cpl-alto",
    title: "CPL alto",
    symptom: "O lead entra caro antes mesmo da qualificacao.",
    icon: Zap,
    metric: "CPL deve cair",
    xp: 25,
    causes: ["Promessa pouco atrativa", "Canal caro", "Segmentacao ampla", "Criativo cansado"],
    actions: ["Ajustar promessa", "Testar criativo", "Separar campanhas por publico", "Comparar canais"]
  },
  {
    id: "poucos-leads",
    title: "Poucos leads",
    symptom: "O topo do funil nao gera volume suficiente.",
    icon: Search,
    metric: "Volume de leads deve subir",
    xp: 25,
    causes: ["Baixa frequencia", "Canal pouco ativo", "Oferta escondida", "Publico pequeno"],
    actions: ["Revisar canal", "Aumentar frequencia", "Testar nova midia", "Ajustar promessa", "Validar publico"]
  },
  {
    id: "lead-desqualificado",
    title: "Lead desqualificado",
    symptom: "Chega lead, mas nao tem perfil de compra.",
    icon: Target,
    metric: "Qualidade do lead deve subir",
    xp: 25,
    causes: ["ICP errado", "Promessa atrai curiosos", "Segmentacao ruim", "Canal desalinhado"],
    actions: ["Revisar ICP", "Revisar promessa", "Revisar segmentacao", "Alinhar marketing com comercial"]
  },
  {
    id: "baixa-resposta",
    title: "Baixa resposta",
    symptom: "O lead nao responde a abordagem.",
    icon: MessageCircle,
    metric: "Taxa de resposta deve subir",
    xp: 25,
    causes: ["Mensagem generica", "Timing ruim", "Perfil sem autoridade", "Oferta confusa"],
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
    actions: ["Melhorar script", "Reduzir atrito", "Oferecer diagnostico", "Criar chamada mais clara"]
  },
  {
    id: "baixo-comparecimento",
    title: "Baixo comparecimento",
    symptom: "A pessoa agenda, mas nao aparece.",
    icon: UsersRound,
    metric: "Comparecimento deve subir",
    xp: 25,
    causes: ["Agenda distante", "Sem lembrete", "Valor da reuniao fraco", "Baixo compromisso"],
    actions: ["Confirmar presenca", "Enviar lembrete", "Reforcar valor da reuniao", "Reduzir intervalo ate a agenda"]
  },
  {
    id: "baixa-venda",
    title: "Baixa venda",
    symptom: "Comparece, mas nao fecha.",
    icon: Handshake,
    metric: "Taxa de venda deve subir",
    xp: 25,
    causes: ["Diagnostico fraco", "Objecoes sem resposta", "Proposta mal percebida", "Fechamento inseguro"],
    actions: ["Revisar diagnostico", "Treinar objecoes", "Treinar fechamento", "Acompanhar motivo de perda"]
  },
  {
    id: "baixa-recompra",
    title: "Baixa recompra",
    symptom: "Cliente antigo nao volta.",
    icon: RefreshCw,
    metric: "Recompra e renovacao devem subir",
    xp: 25,
    causes: ["Sem lista ativa", "Sem script", "Sem cadencia", "Sem oferta de retorno"],
    actions: ["Revisar lista de clientes antigos", "Criar script de reativacao", "Aumentar cadencia", "Acompanhar vendedor"]
  },
  {
    id: "pouca-indicacao",
    title: "Pouca indicacao",
    symptom: "Cliente satisfeito nao indica.",
    icon: HeartHandshake,
    metric: "Indicacoes por mes devem subir",
    xp: 25,
    causes: ["Nao pede", "Pede no momento errado", "Secretaria sem script", "Meta invisivel"],
    actions: ["Criar mensagem padrao", "Treinar secretaria", "Pedir no momento certo", "Oferecer incentivo", "Acompanhar meta semanal"]
  },
  {
    id: "sem-rotina",
    title: "Vendedor sem rotina",
    symptom: "Comercial depende de improviso.",
    icon: UserRoundCheck,
    metric: "Execucao diaria deve subir",
    xp: 25,
    causes: ["Meta confusa", "Sem acompanhamento", "Script ignorado", "Baixa disciplina"],
    actions: ["Revisar rotina", "Acompanhar diariamente", "Definir meta simples", "Treinar script", "Escutar ligacoes", "Corrigir comportamento"]
  },
  {
    id: "franqueado-nao-executa",
    title: "Franqueado nao executa",
    symptom: "Plano existe, mas nao vira acao.",
    icon: Lightbulb,
    metric: "Execucao semanal deve subir",
    xp: 25,
    causes: ["Plano grande demais", "Sem dono", "Sem ritual", "Sem indicador visivel"],
    actions: ["Reduzir para 3 prioridades", "Criar ritual semanal", "Definir responsavel", "Medir execucao visivel"]
  }
];

export const diagnosisRules = [
  { blockId: "icp", text: "Antes de investir em captacao, defina melhor o cliente ideal." },
  { blockId: "passivo-frio", text: "A unidade precisa ativar canais de aquisicao." },
  { blockId: "passivo-quente", text: "O gargalo esta na abordagem ou qualificacao." },
  { blockId: "ativo-frio", text: "Valide canais frios com baixo custo antes de escalar." },
  { blockId: "ativo-quente", text: "Ative rotina de recompra, renovacao e indicacao." },
  { blockId: "vendedor", text: "Revise diagnostico, objecoes, fechamento e rotina do vendedor." }
] satisfies Array<{ blockId: BlockId; text: string }>;
