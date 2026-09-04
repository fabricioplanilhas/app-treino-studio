"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { mockDb, Aluno, FichaAvaliativa, ExercicioAvaliativo } from "@/lib/mockData";
import { ArrowLeft, Save, Printer, Dumbbell, FileText, Search, Trash2, CheckCircle2, UserCheck, Plus, Sparkles, ChevronDown, ChevronUp, BookOpen, AlertTriangle, HelpCircle, X, Download, RotateCcw, Copy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RUMPEL_BG_BASE64 } from "@/lib/pdfTemplateBase64";

// Interface para Guia do FMS
export interface FMSGuideData {
  nome: string;
  nomeOficial: string;
  padraoNome: string;
  imagemUrl?: string;
  imagemLegenda?: string;
  criterios: {
    nota0: string;
    nota1: string[];
    nota2: string[];
    nota3: string[];
  };
  instrucoes: {
    fala: string[];
    dicas: string[];
  };
  implicacoes: {
    objetivo: string;
    fatores: { titulo: string; desc: string; cor: string }[];
  };
  clearingTest?: {
    nome: string;
    instrucao: string;
    criterioDor: string;
    imagemUrl?: string;
    imagemLegenda?: string;
  };
}

export const FMS_GUIDES: Record<string, FMSGuideData> = {
  "Agachamento Overhead": {
    nome: "Agachamento Overhead",
    nomeOficial: "Deep Squat (Agachamento Profundo)",
    padraoNome: "Deep Squat Movement Pattern",
    imagemUrl: "/fms-deep-squat-official.png",
    imagemLegenda: "Fotografias Oficiais FMS: Vista Frontal e Lateral para as Notas 1 (Compensações), 2 (Prancha) e 3 (Solo)",
    criterios: {
      nota0: "Presença de qualquer dor associada a qualquer parte do teste (Stop imediato).",
      nota1: [
        "Tíbia e tronco NÃO estão paralelos (tronco cai à frente).",
        "Fêmur NÃO fica abaixo da horizontal.",
        "Joelhos NÃO estão alinhados sobre os pés (colapso em valgo).",
        "O bastão NÃO está alinhado verticalmente sobre os pés.",
        "Incapacidade de atingir os critérios mesmo com a prancha sob os calcanhares."
      ],
      nota2: [
        "Tronco paralelo à tíbia ou em direção vertical.",
        "Fêmur abaixo da horizontal (agachamento profundo completo).",
        "Joelhos alinhados sobre os pés.",
        "Bastão alinhado sobre os pés.",
        "Executado com os calcanhares sobre a prancha/tábua FMS."
      ],
      nota3: [
        "Tronco paralelo à tíbia ou em direção vertical.",
        "Fêmur abaixo da horizontal (agachamento profundo completo).",
        "Joelhos alinhados sobre os pés (sem colapso em valgo).",
        "Bastão alinhado verticalmente sobre os pés.",
        "Calcanhares apoiados totalmente no solo plano."
      ]
    },
    instrucoes: {
      fala: [
        "\"Por favor, informe se há dor enquanto executa o movimento.\"",
        "\"Fique em pé com os pés separados aproximadamente na largura dos ombros e com os dedos do pé apontados para frente.\"",
        "\"Segure o bastão com ambas as mãos horizontalmente sobre a cabeça, mantendo os ombros e cotovelos em um ângulo de 90 graus.\"",
        "\"Levante o bastão de forma que ele fique diretamente acima da sua cabeça.\"",
        "\"Inicie o agachamento e desça o mais baixo possível, mas mantenha a coluna ereta, calcanhares no chão e bastão sobre a cabeça.\"",
        "\"Mantenha a posição descendente por um segundo, e então retorne à posição inicial.\""
      ],
      dicas: [
        "O aluno pode executar o movimento até 3 vezes se necessário.",
        "Se uma pontuação de 3 não for alcançada no solo, repita o teste com a plataforma sob os calcanhares.",
        "Observe o aluno de frente e de perfil (lado).",
        "O alinhamento dos pés deve permanecer inalterado quando os calcanhares estiverem elevados."
      ]
    },
    implicacoes: {
      objetivo: "Demonstra mobilidade e estabilidade extrema completamente coordenadas com quadris e ombros em posições simétricas. Avalia mobilidade funcional bilateral dos quadris, joelhos, tornozelos, ombros e coluna torácica.",
      fatores: [
        { titulo: "🦴 Membros Superiores & Coluna", desc: "Limitação nos membros superiores decorre de mobilidade glenoumeral reduzida ou falta de extensão torácica.", cor: "#3b82f6" },
        { titulo: "🦵 Membros Inferiores & Tornozelo", desc: "Limitação inclui dorsiflexão deficiente de cadeia fechada no tornozelo ou flexão limitada de joelhos e quadris.", cor: "#8b5cf6" }
      ]
    }
  },
  "Passo sobre a Barreira": {
    nome: "Passo sobre a Barreira",
    nomeOficial: "Hurdle Step (Passo sobre a Barreira)",
    padraoNome: "Hurdle Step Movement Pattern",
    imagemUrl: "/fms-hurdle-step.png",
    imagemLegenda: "Fotografias Oficiais FMS: Vistas Frontal e Lateral para as Notas 1 (Contato/Compensação Severa), 2 (Alinhamento Parcial) e 3 (Alinhamento Perfeito)",
    criterios: {
      nota0: "Presença de qualquer dor associada a qualquer parte do teste.",
      nota1: [
        "Ocorre contato entre o pé/canela e a barreira ou corda elástica.",
        "Perda considerável de equilíbrio ou incapacidade de completar a passada."
      ],
      nota2: [
        "Perda de alinhamento entre quadril, joelho e tornozelo no plano sagital.",
        "Movimento compensatório ou inclinação na coluna lombar.",
        "O bastão não permanece paralelo à barreira/solo."
      ],
      nota3: [
        "Quadris, joelhos e tornozelos mantêm alinhamento contínuo no plano sagital.",
        "Mínimo ou nenhum movimento compensatório na coluna lombar.",
        "O bastão permanece perfeitamente paralelo ao solo durante todo o movimento."
      ]
    },
    instrucoes: {
      fala: [
        "\"Coloque o bastão sobre os ombros, atrás do pescoço, segurando com ambas as mãos.\"",
        "\"Fique em pé ereto com os pés juntos e os dedos tocando a base da barreira (ajustada na altura da tuberosidade da tíbia).\"",
        "\"Mantendo o tronco ereto e o bastão alinhado, passe uma perna sobre a barreira tocando levemente o calcanhar no solo do outro lado sem descarregar peso.\"",
        "\"Retorne a perna à posição inicial sem tocar na barreira ou na fita.\"",
        "\"Repita o teste para o outro lado.\""
      ],
      dicas: [
        "Pontue cada perna separadamente (ESQ e DIR). A nota final do teste é a MENOR entre os dois lados.",
        "A perna que passa por cima da barreira é o membro sendo avaliado.",
        "Permita até 3 tentativas por perna se necessário."
      ]
    },
    implicacoes: {
      objetivo: "Avalia a mecânica de passada, coordenação, estabilidade do quadril/joelho/tornozelo em apoio unipedal e mobilidade de flexão do quadril oposto.",
      fatores: [
        { titulo: "⚖️ Estabilidade Unipodal", desc: "Exige estabilidade dinâmica do glúteo médio e propriocepção de tornozelo/pé no membro de apoio.", cor: "#3b82f6" },
        { titulo: "🏃 Mobilidade & Coordenação", desc: "Exige amplitude de flexão e abdução do quadril em movimento sem compensações pélvicas.", cor: "#8b5cf6" }
      ]
    }
  },
  "Avanço em Linha": {
    nome: "Avanço em Linha",
    nomeOficial: "Inline Lunge (Avanço em Linha)",
    padraoNome: "Inline Lunge Movement Pattern",
    imagemUrl: "/fms-inline-lunge.png",
    imagemLegenda: "Fotografias Oficiais FMS: Vistas Frontal e Lateral para as Notas 1 (Perda de Equilíbrio/Alinhamento), 2 (Compensação de Tronco) e 3 (Alinhamento Perfeito e Contato no Bastão)",
    criterios: {
      nota0: "Presença de dor durante o teste ou no teste de exclusão (Ankle Clearing Test).",
      nota1: [
        "Perda de equilíbrio ou incapacidade de manter a postura na linha.",
        "Incapacidade de descer até o joelho tocar a prancha/solo."
      ],
      nota2: [
        "O bastão perde contato com a cabeça, coluna torácica ou sacro.",
        "Tronco inclina para frente ou roda para compensar.",
        "O joelho de trás não toca a linha central diretamente atrás do calcanhar."
      ],
      nota3: [
        "O bastão permanece em contato contínuo com a cabeça, coluna torácica e sacro.",
        "Tronco permanece vertical e estável.",
        "O joelho de trás toca a tábua/linha diretamente atrás do calcanhar dianteiro."
      ]
    },
    instrucoes: {
      fala: [
        "\"Posicione o pé dianteiro na marca zero da tábua e o calcanhar de trás na distância correspondente ao comprimento da sua tíbia.\"",
        "\"Segure o bastão verticalmente nas costas: a mão oposta à perna dianteira segura na curva cervical e a outra mão na curva lombar.\"",
        "\"Desça o corpo em linha reta até o joelho de trás tocar a tábua logo atrás do calcanhar dianteiro.\"",
        "\"Retorne à posição ereta inicial mantendo os 3 pontos de contato do bastão.\"",
        "\"Repita para o outro lado invertendo as mãos e pernas.\""
      ],
      dicas: [
        "A perna da frente define o lado testado (ESQ ou DIR).",
        "Ambos os pés devem apontar rigorosamente para frente sobre a mesma linha.",
        "A nota final é a MENOR entre esquerda e direita.",
        "Realize obrigatoriamente o Teste de Exclusão do Tornozelo (Ankle Clearing Test) em ambos os lados."
      ]
    },
    implicacoes: {
      objetivo: "Avalia a estabilidade do tronco e pelve em base estreita, desaceleração, mobilidade do tornozelo dianteiro e flexibilidade dos flexores do quadril traseiro.",
      fatores: [
        { titulo: "🛡️ Estabilidade Antirotacional", desc: "Desafia os estabilizadores do core e abdômen oblíquo a resistirem ao torque rotacional.", cor: "#3b82f6" },
        { titulo: "🦵 Cadeia Cruzada", desc: "Depende da flexibilidade do reto femoral e psoas da perna de trás e dorsiflexão do tornozelo da frente.", cor: "#8b5cf6" }
      ]
    },
    clearingTest: {
      nome: "Teste de Exclusão do Tornozelo (Ankle Clearing Test)",
      instrucao: "Em posição meio-ajoelhada (half-kneeling), alinhe o joelho e o pé dianteiro. Projete o joelho para a frente sem descolar o calcanhar do solo (avaliando a dorsiflexão máxima em cadeia cinética fechada). Avalie bilateralmente (ESQ e DIR).",
      criterioDor: "Se o aluno relatar qualquer dor no tornozelo ou no tendão calcâneo durante a dorsiflexão, a pontuação do membro avaliado é automaticamente 0 (ZERO)."
    }
  },
  "Mobilidade de Ombro": {
    nome: "Mobilidade de Ombro",
    nomeOficial: "Shoulder Mobility (Mobilidade de Ombro)",
    padraoNome: "Shoulder Mobility Movement Pattern",
    imagemUrl: "/fms-shoulder-mobility.png",
    imagemLegenda: "Fotografias Oficiais FMS: Medição Posterior para as Notas 1 (> 1,5 Mão), 2 (≤ 1,5 Mão) e 3 (≤ 1 Mão)",
    criterios: {
      nota0: "Presença de dor no teste ou no teste de exclusão (Shoulder Clearing Test).",
      nota1: [
        "A distância entre os punhos fechados é MAIOR que 1,5 comprimento da mão do aluno."
      ],
      nota2: [
        "A distância entre os punhos fechados fica ENTRE 1 e 1,5 comprimento da mão."
      ],
      nota3: [
        "A distância entre os punhos fechados é MENOR OU IGUAL a 1 comprimento da mão."
      ]
    },
    instrucoes: {
      fala: [
        "\"Primeiro meça o comprimento da sua mão dominante (da prega do punho até a ponta do dedo médio).\"",
        "\"Feche as mãos fazendo punhos com os polegares guardados dentro dos dedos.\"",
        "\"Em um movimento contínuo e suave, leve um braço por cima da cabeça e o outro por baixo das costas, aproximando os punhos ao máximo.\"",
        "\"Mantenha a posição para medir a distância entre os pontos mais próximos dos punhos.\"",
        "\"Repita invertendo os braços.\""
      ],
      dicas: [
        "O braço superior determina o lado testado (ESQ ou DIR).",
        "Não permita que o aluno 'caminhe' ou ajuste as mãos após o contato inicial.",
        "Realize obrigatoriamente o Teste de Exclusão de Ombro."
      ]
    },
    implicacoes: {
      objetivo: "Avalia a mobilidade combinada bilateral da cintura escapular: flexão/abdução/rotação externa do braço superior e extensão/adução/rotação interna do braço inferior.",
      fatores: [
        { titulo: "🔄 Ritmo Escapulotorácico", desc: "Depende da mobilidade da escápula sobre a caixa torácica e comprimento do peitoral menor e grande dorsal.", cor: "#3b82f6" },
        { titulo: "🦴 Extensão Torácica", desc: "Rigidez na coluna torácica ou postura hipercifótica limita diretamente o alcance dos membros superiores.", cor: "#8b5cf6" }
      ]
    },
    clearingTest: {
      nome: "Teste de Exclusão do Ombro (Shoulder Clearing Test)",
      instrucao: "Coloque a mão sobre o ombro oposto e aponte o cotovelo para cima em direção ao teto. Repita para o outro ombro.",
      criterioDor: "Se o aluno relatar qualquer dor durante a manobra de impacto, a pontuação do teste é automaticamente 0 (ZERO).",
      imagemUrl: "/fms-shoulder-clearing.png",
      imagemLegenda: "Guia Oficial FMS: Teste Eliminador Shoulder Clearing Test (Avaliação bilateral de impacto subacromial)"
    }
  },
  "Elevação da Perna Estendida Ativa": {
    nome: "Elevação da Perna Estendida Ativa",
    nomeOficial: "Active Straight-Leg Raise (ASLR)",
    padraoNome: "Active Straight-Leg Raise Movement Pattern",
    imagemUrl: "/fms-aslr.png",
    imagemLegenda: "Fotografias Oficiais FMS: Vistas Laterais para as Notas 1 (Abaixo do Joelho), 2 (Entre Coxa e Joelho) e 3 (Ultrapassa Ponto Médio da Coxa)",
    criterios: {
      nota0: "Presença de dor durante qualquer parte do teste.",
      nota1: [
        "O maléolo da perna elevada fica ABAIXO da linha da patela (não atinge a linha do joelho da perna de apoio)."
      ],
      nota2: [
        "O maléolo da perna elevada fica ENTRE o ponto médio da coxa e a linha da patela."
      ],
      nota3: [
        "O maléolo da perna elevada ULTRAPASSA verticalmente o ponto médio entre a EIAS (espinha ilíaca) e o centro da patela."
      ]
    },
    instrucoes: {
      fala: [
        "\"Deite-se de costas no solo com a prancha sob os joelhos e os braços ao lado do corpo com as palmas para cima.\"",
        "\"Mantenha ambas as pernas estendidas e os tornozelos a 90 graus (dedos apontados para o teto).\"",
        "\"Mantendo a perna de apoio totalmente estável no chão, eleve lentamente uma perna o mais alto possível sem dobrar nenhum dos dois joelhos.\"",
        "\"Retorne lentamente à posição inicial e repita para o outro lado.\""
      ],
      dicas: [
        "A perna elevada define o lado testado (ESQ e DIR).",
        "A perna de apoio NÃO pode rodar externamente ou levantar o joelho do chão.",
        "A nota final é a MENOR entre os dois lados."
      ]
    },
    implicacoes: {
      objetivo: "Avalia a flexibilidade ativa dos isquiotibiais e panturrilha, a dissociação do quadril e a estabilidade pélvica e do core anterior.",
      fatores: [
        { titulo: "🦵 Flexibilidade Isquiotibiais", desc: "Capacidade de alongamento dinâmico da cadeia posterior do membro elevado.", cor: "#3b82f6" },
        { titulo: "🔗 Dissociação e Extensão", desc: "Manter a extensão ativa e estabilidade da perna contralateral através de glúteos e iliopsoas.", cor: "#8b5cf6" }
      ]
    }
  },
  "Flexão com Estabilidade de Tronco": {
    nome: "Flexão com Estabilidade de Tronco",
    nomeOficial: "Trunk Stability Push-Up (Flexão com Estabilidade de Tronco)",
    padraoNome: "Trunk Stability Push-Up Movement Pattern",
    imagemUrl: "/fms-push-up.png",
    imagemLegenda: "Fotografias Oficiais FMS: Vistas Laterais para as Notas 1 (Arqueamento/Incapacidade), 2 (Alinhamento Queixo/Clavículas) e 3 (Alinhamento Testa/Queixo em Bloco Único)",
    criterios: {
      nota0: "Presença de dor no teste ou no teste de exclusão (Extensão Lombar).",
      nota1: [
        "Incapaz de realizar a flexão com as mãos na posição da nota 2, ou ocorre arqueamento/colapso lombar evidente."
      ],
      nota2: [
        "Homens: 1 repetição com polegares alinhados ao queixo.",
        "Mulheres: 1 repetição com polegares alinhados às clavículas.",
        "O tronco sobe como uma unidade estável sem extensão compensatória lombar."
      ],
      nota3: [
        "Homens: 1 repetição com polegares alinhados ao topo da cabeça.",
        "Mulheres: 1 repetição com polegares alinhados ao queixo.",
        "Corpo sobe em bloco único perfeitamente rígido e unificado."
      ]
    },
    instrucoes: {
      fala: [
        "\"Deite-se de bruços com os pés apoiados nos dedos e as pernas estendidas.\"",
        "\"Posicione as mãos na largura dos ombros com os polegares na altura de referência (topo da cabeça ou queixo).\"",
        "\"Levante os joelhos e cotovelos do solo mantendo o corpo rígido.\"",
        "\"Em um único esforço, empurre o chão subindo todo o corpo em bloco sólido até estender os braços, sem deixar a coluna arquear.\""
      ],
      dicas: [
        "O teste é bilateral (nota única de 0 a 3).",
        "Não permita atraso na subida do quadril em relação aos ombros.",
        "Realize obrigatoriamente o Teste de Exclusão de Extensão de Coluna."
      ]
    },
    implicacoes: {
      objetivo: "Avalia a estabilidade reflexa do tronco e pelve no plano sagital sob esforço em cadeia cinética fechada de empurrar simétrico.",
      fatores: [
        { titulo: "🛡️ Core Anterior Reflexo", desc: "Ativação simultânea do reto abdominal, transverso e oblíquos para evitar hiperextensão lombar.", cor: "#3b82f6" },
        { titulo: "💪 Estabilidade Escapular", desc: "Transmissão eficiente de força da cintura escapular para o tronco e membros inferiores.", cor: "#8b5cf6" }
      ]
    },
    clearingTest: {
      nome: "Teste de Exclusão de Extensão de Coluna (Spinal Extension Test)",
      instrucao: "Deitado de bruços, empurre o chão estendendo os braços e arqueando as costas para trás mantendo a pelve no chão (Posição da Cobra).",
      criterioDor: "Se o aluno relatar qualquer dor na coluna lombar durante a extensão, a pontuação é automaticamente 0 (ZERO)."
    }
  },
  "Estabilidade Rotatória": {
    nome: "Estabilidade Rotatória",
    nomeOficial: "Rotary Stability (Estabilidade Rotatória)",
    padraoNome: "Rotary Stability Movement Pattern",
    imagemUrl: "/fms-rotary-stability.png",
    imagemLegenda: "Fotografias Oficiais FMS: Vistas Frontais e Sagital para as Notas 1 (Instabilidade/Incapacidade), 2 (Diagonal Cruzada) e 3 (Unilateral Ipsilateral)",
    criterios: {
      nota0: "Presença de dor no teste ou no teste de exclusão (Flexão Lombar).",
      nota1: [
        "Incapaz de realizar a repetição contralateral ou perda de equilíbrio / rotação excessiva do tronco."
      ],
      nota2: [
        "Executa 1 repetição diagonal/cruzada (braço direito e perna esquerda) mantendo o tronco paralelo ao solo e tocando o cotovelo no joelho sobre a tábua."
      ],
      nota3: [
        "Executa 1 repetição unilateral ipsilateral (mesmo lado: braço direito e perna direita) mantendo tronco perfeitamente paralelo e tocando cotovelo no joelho."
      ]
    },
    instrucoes: {
      fala: [
        "\"Fique em quatro apoios sobre a prancha FMS com mãos sob os ombros e joelhos sob os quadris.\"",
        "\"Estenda o braço e a perna do mesmo lado paralelamente ao solo, depois dobre-os até o cotovelo tocar o joelho do mesmo lado e retorne sem encostar no chão.\"",
        "\"Se não conseguir no mesmo lado, execute o movimento cruzado em diagonal (braço direito e perna esquerda).\"",
        "\"Repita para o outro lado.\""
      ],
      dicas: [
        "Avalie ambos os lados (ESQ e DIR). A nota final é a MENOR entre os dois lados.",
        "O tronco deve permanecer paralelo à prancha sem balançar ou girar.",
        "Realize obrigatoriamente o Teste de Exclusão de Flexão de Coluna."
      ]
    },
    implicacoes: {
      objetivo: "Avalia a estabilidade neuromuscular multiplanar do core e a transferência de força pelo complexo pélvico e escapular durante movimentos assimétricos.",
      fatores: [
        { titulo: "🌪️ Controle Antirotacional", desc: "Capacidade dos oblíquos, multífidos e transverso de resistir ao torque rotacional de membros opostos.", cor: "#3b82f6" },
        { titulo: "⚡ Padrão Cruzado", desc: "Coordenação cruzada fundamental para marcha, corrida, chutes e arremessos.", cor: "#8b5cf6" }
      ]
    },
    clearingTest: {
      nome: "Teste de Exclusão de Flexão de Coluna (Spinal Flexion Test)",
      instrucao: "Em quatro apoios, balance os quadris para trás sentando sobre os calcanhares e estenda os braços à frente no chão (Posição da Criança).",
      criterioDor: "Se o aluno relatar qualquer dor na coluna lombar durante a flexão, a pontuação é automaticamente 0 (ZERO)."
    }
  }
};

// Templates padrão para formulários
// Templates padrão para formulários (sem seleção por default)
const INITIAL_MOBILIDADE: ExercicioAvaliativo[] = [
  { nome: "Agachamento Overhead", reps: "8-10", obs: "" },
  { nome: "Passo sobre a Barreira", reps: "8-10", esq: "", dir: "", obs: "" },
  { nome: "Avanço em Linha", reps: "8-10", esq: "", dir: "", obs: "" },
  { nome: "Mobilidade de Ombro", reps: "8-10", esq: "", dir: "", obs: "" },
  { nome: "Elevação da Perna Estendida Ativa", reps: "8-10", esq: "", dir: "", obs: "" },
  { nome: "Flexão com Estabilidade de Tronco", reps: "8-10", obs: "" },
  { nome: "Estabilidade Rotatória", reps: "8-10", esq: "", dir: "", obs: "" },
];

const INITIAL_AQUECIMENTO: ExercicioAvaliativo[] = [
  { nome: "Skipp Frontal (Pista)", regressao: false, regressaoTexto: "Marcha na Pista", obs: "" },
  { nome: "Skipp Lateral (Pista)", regressao: false, regressaoTexto: "Marcha Lateral", obs: "" },
  { nome: "Joelho Alto (Pista)", regressao: false, regressaoTexto: "Corrida no lugar", obs: "" },
];

const INITIAL_POTENCIA: ExercicioAvaliativo[] = [
  { nome: "Agachamento com salto Stop", reps: "6-8", obs: "" },
  { nome: "Bola Lateral Semi Ajoelhado", reps: "5/5", obs: "" },
  { nome: "Impulso Lateral Stop", reps: "5/5", obs: "" },
];

const INITIAL_FORCA: ExercicioAvaliativo[] = [
  // Bloco 1: Agachamento, Apoio e Ponte
  { nome: "Agachamento GB", carga: "", reps: "8-10", obs: "" },
  { nome: "Apoio Solo", carga: "", reps: "8-10", regressao: false, regressaoTexto: "Apoio na barra", progressao: false, progressaoTexto: "Apoio pés elevados (step/caixa/banco)", obs: "" },
  { nome: "Ponte 1P Solo", carga: "", reps: "8-10", regressao: false, regressaoTexto: "Ponte 2 pés Solo", progressao: false, progressaoTexto: "Ponte 1P Banco", obs: "" },
  // Bloco 2: Puxada no TRX e Pressão Vertical
  { nome: "Puxada Neutra TRX", carga: "", reps: "8-10", obs: "" },
  { nome: "Pressão Vertical", carga: "", reps: "8-10", obs: "" },
];

export interface FMSPrescricaoData {
  nome: string;
  categoria: "mobilidade" | "core" | "funcional";
  prioridadeNum: number;
  prioridadeLabel: string;
  motivoBloqueio: string;
  bloqueados: string[];
  corretivos: string[];
}

export interface ItemBloqueioFMS {
  teste: string;
  motivoBadge: string;
  motivoDesc: string;
  exercicios: string[];
  isDor: boolean;
}

export interface ItemCorretivoFMS {
  teste: string;
  prioridadeLabel: string;
  prioridadeNum: number;
  exercicios: string[];
  isDor: boolean;
}

export interface RecomendacoesFMS {
  avaliado: boolean;
  totalAvaliados: number;
  temBloqueios: boolean;
  bloqueios: ItemBloqueioFMS[];
  corretivos: ItemCorretivoFMS[];
}

export const FMS_PRESCRICAO_MAP: Record<string, FMSPrescricaoData> = {
  "Agachamento Overhead": {
    nome: "Agachamento Overhead",
    categoria: "funcional",
    prioridadeNum: 3,
    prioridadeLabel: "Prioridade 3 • Padrão Funcional Global",
    motivoBloqueio: "Falta de mobilidade de tornozelo/quadril ou extensão torácica, gerando sobrecarga na coluna lombar.",
    bloqueados: [
      "Agachamento livre com barra nas costas com carga",
      "Agachamento frontal pesado com barra",
      "Saltos e pliometria de alta intensidade (caixa alta, drop jumps)",
      "Leg Press pesado com flexão lombar profunda"
    ],
    corretivos: [
      "Mobilidade de tornozelo em cadeia fechada na parede ou com elástico",
      "Agachamento Taça (Goblet Squat) com calcanhares elevados em anilha",
      "Agachamento assistido nas fitas do TRX (foco em amplitude com coluna ereta)",
      "Mobilidade torácica com rolo miofascial e extensão ativa"
    ]
  },
  "Passo sobre a Barreira": {
    nome: "Passo sobre a Barreira",
    categoria: "funcional",
    prioridadeNum: 3,
    prioridadeLabel: "Prioridade 3 • Padrão Funcional Unipodal",
    motivoBloqueio: "Instabilidade dinâmica em apoio unipodal e déficit nos estabilizadores pélvicos.",
    bloqueados: [
      "Passadas dinâmicas (lunges/afundos caminhando com carga)",
      "Saltos e aterrissagens unipedais com carga ou impacto",
      "Corridas com desacelerações e mudanças bruscas de direção"
    ],
    corretivos: [
      "Ponte de glúteo unipodal no solo com ativação do core",
      "Marcha estática com joelho a 90° e pausa de equilíbrio (3 a 5 seg)",
      "Passo sobre elástico baixo com suporte de bastão para controle",
      "Mobilização dinâmica de flexores de quadril em meio-ajoelhado"
    ]
  },
  "Avanço em Linha": {
    nome: "Avanço em Linha",
    categoria: "funcional",
    prioridadeNum: 3,
    prioridadeLabel: "Prioridade 3 • Padrão Funcional em Base Aberta",
    motivoBloqueio: "Perda de alinhamento no plano sagital e instabilidade toracolombar/pélvica.",
    bloqueados: [
      "Afundos/Lunges pesados com halteres ou barra livre",
      "Saltos em tesoura (Split Jumps) e aterrissagens em avanço",
      "Movimentos de rotação balística sob base dividida"
    ],
    corretivos: [
      "Split Squat isométrico meio-ajoelhado com bastão vertical",
      "Alongamento de flexores do quadril e reto femoral em meio-ajoelhado",
      "Afundo reverso assistido com as mãos no TRX",
      "Fortalecimento de abdutores/glúteo médio e estabilidade pélvica"
    ]
  },
  "Mobilidade de Ombro": {
    nome: "Mobilidade de Ombro",
    categoria: "mobilidade",
    prioridadeNum: 1,
    prioridadeLabel: "Prioridade 1 • Mobilidade Articular Pura (Ombro/Tórax)",
    motivoBloqueio: "Déficit escapulotorácico e glenoumeral, gerando alto risco de impacto subacromial.",
    bloqueados: [
      "Desenvolvimento acima da cabeça (Overhead Press) com halteres ou barra",
      "Puxadas ou barra fixa com pegada aberta atrás da nuca",
      "Movimentos de arremesso ou LPO (Snatches, Clean & Jerk)",
      "Supino com amplitude exagerada descendo os cotovelos abaixo do banco"
    ],
    corretivos: [
      "Liberação miofascial com bolinha no peitoral menor e latíssimo do dorso",
      "Rotação torácica em quatro apoios (Open Book / T-Spine Rotation)",
      "Deslize escapular na parede (Wall Slide com ativação do serrátil)",
      "Passagens suaves de ombro com bastão em amplitude controlada"
    ]
  },
  "Elevação da Perna Estendida Ativa": {
    nome: "Elevação da Perna Estendida Ativa",
    categoria: "mobilidade",
    prioridadeNum: 1,
    prioridadeLabel: "Prioridade 1 • Mobilidade Articular Pura (Cadeia Posterior/Quadril)",
    motivoBloqueio: "Encurtamento de isquiotibiais e falta de dissociação lombo-pélvica.",
    bloqueados: [
      "Levantamento Terra tradicional pesado partindo do solo",
      "Kettlebell Swings com carga alta e velocidade",
      "Sprints e tiros de corrida em velocidade máxima",
      "Abdominais com pernas estendidas suspensas na barra"
    ],
    corretivos: [
      "Alongamento ativo-assistido de isquiotibiais com elástico (perna oposta estendida no chão)",
      "Levantamento Terra Romeno (RDL) com amplitude reduzida partindo de blocos",
      "Ativação de glúteos com ponte e dissociação ativa de quadril em decúbito dorsal",
      "Exercício 90/90 de quadril na parede com respiração diafragmática"
    ]
  },
  "Flexão com Estabilidade de Tronco": {
    nome: "Flexão com Estabilidade de Tronco",
    categoria: "core",
    prioridadeNum: 2,
    prioridadeLabel: "Prioridade 2 • Controle Motor e Core (Anti-Extensão)",
    motivoBloqueio: "Incapacidade de estabilizar a coluna lombar contra a extensão (hiperlordose lombar compensatória).",
    bloqueados: [
      "Flexões de braço no solo sem apoio até a falha",
      "Pranchas ventrais longas com colapso lombar",
      "Supino muito pesado sem estabilidade sólida do core"
    ],
    corretivos: [
      "Flexão de braços inclinada (mãos apoiadas na barra guiada ou banco elevado)",
      "Prancha ventral isométrica curta (10 a 15s) com máxima contração de abdômen e glúteos",
      "Deadbug (inseto morto) com coluna lombar totalmente colada ao solo",
      "Rollout com bola suíça ou roda de abdômen com amplitude reduzida"
    ]
  },
  "Estabilidade Rotatória": {
    nome: "Estabilidade Rotatória",
    categoria: "core",
    prioridadeNum: 2,
    prioridadeLabel: "Prioridade 2 • Controle Motor e Core (Anti-Rotação)",
    motivoBloqueio: "Déficit de controle neuromuscular do tronco e estabilidade pélvica multiplanar.",
    bloqueados: [
      "Rotações balísticas de tronco sob alta carga (Woodchoppers pesados com cabo)",
      "Giros russos (Russian Twists) com carga pesada e pés soltos",
      "Movimentos de torção rápida combinados com flexão sob peso"
    ],
    corretivos: [
      "Perdigueiro (Bird-Dog) diagonal estático com controle respiratório e pausa de 3s no topo",
      "Pallof Press em posição meio-ajoelhada ou em pé (anti-rotação com elástico ou cabo)",
      "Prancha lateral isométrica com apoio nos joelhos e alinhamento neutro",
      "Caminhada do Fazendeiro unilateral (Suitcase Carry) com carga moderada"
    ]
  }
};

export const obterRecomendacoesFMS = (itens: ExercicioAvaliativo[]): RecomendacoesFMS => {
  const bloqueios: ItemBloqueioFMS[] = [];
  const corretivosMap = new Map<string, ItemCorretivoFMS>();
  let totalAvaliados = 0;

  itens.forEach((item) => {
    const info = FMS_PRESCRICAO_MAP[item.nome];
    if (!info) return;

    const isUnilateral = item.scoreEsq !== undefined || item.scoreDir !== undefined || item.esq !== undefined;
    let temDor = false;
    let temAssimetria = false;
    let temDisfuncao = false;
    let motivoBadge = "";
    let motivoDesc = "";

    if (isUnilateral) {
      const sE = item.scoreEsq;
      const sD = item.scoreDir;
      if (sE !== undefined || sD !== undefined) {
        totalAvaliados++;
      }

      if (sE === 0 || sD === 0) {
        temDor = true;
        motivoBadge = "⛔ DOR (NOTA 0)";
        motivoDesc = `Presença de dor relatada no teste ${sE === 0 ? "(Lado Esquerdo)" : ""} ${sD === 0 ? "(Lado Direito)" : ""}. Encaminhar para avaliação clínica.`;
      } else if (sE !== undefined && sD !== undefined && sE !== sD) {
        temAssimetria = true;
        motivoBadge = `⚠️ ASSIMETRIA (ESQ: ${sE} vs DIR: ${sD})`;
        motivoDesc = `Diferença entre os lados. Menor pontuação: ${Math.min(sE, sD)}. Corrigir a assimetria antes de sobrecarregar o padrão.`;
      } else if (sE === 1 && sD === 1) {
        temDisfuncao = true;
        motivoBadge = "⚠️ DISFUNÇÃO (NOTA 1)";
        motivoDesc = "Padrão de movimento incompleto ou compensatório em ambos os lados.";
      }
    } else {
      if (item.score !== undefined) {
        totalAvaliados++;
      }
      if (item.score === 0) {
        temDor = true;
        motivoBadge = "⛔ DOR (NOTA 0)";
        motivoDesc = "Presença de dor relatada durante o teste. Encaminhar para avaliação clínica.";
      } else if (item.score === 1) {
        temDisfuncao = true;
        motivoBadge = "⚠️ DISFUNÇÃO (NOTA 1)";
        motivoDesc = "Padrão de movimento com disfunção ou incapacidade de execução do critério ideal.";
      }
    }

    if (temDor || temAssimetria || temDisfuncao) {
      bloqueios.push({
        teste: info.nome,
        motivoBadge,
        motivoDesc: temDor ? motivoDesc : `${motivoDesc} ${info.motivoBloqueio}`,
        exercicios: temDor ? ["Qualquer exercício ou movimento que reproduza a dor naquele segmento", ...info.bloqueados] : info.bloqueados,
        isDor: temDor
      });

      corretivosMap.set(info.nome, {
        teste: info.nome,
        prioridadeLabel: temDor ? "🚨 URGENTE • Avaliação Clínica / Descarregamento" : info.prioridadeLabel,
        prioridadeNum: temDor ? 0 : info.prioridadeNum,
        exercicios: temDor ? ["Encaminhamento médico/fisioterapêutico (SFMA)", "Descarregar peso e evitar movimentos na zona de dor"] : info.corretivos,
        isDor: temDor
      });
    }
  });

  const corretivos = Array.from(corretivosMap.values()).sort((a, b) => a.prioridadeNum - b.prioridadeNum);
  bloqueios.sort((a, b) => (b.isDor ? 1 : 0) - (a.isDor ? 1 : 0));

  return {
    avaliado: totalAvaliados > 0,
    totalAvaliados,
    temBloqueios: bloqueios.length > 0,
    bloqueios,
    corretivos
  };
};

export interface ClassificacaoFMS {
  total: number;
  max: number;
  nivel: "excelente" | "adequado" | "alto_risco" | "dor" | "aberto";
  titulo: string;
  descricao: string;
  cor: string;
  bgCor: string;
  badge: string;
  temDor: boolean;
  assimetrias: { exercicio: string; esq: number; dir: number }[];
}

export const calcularClassificacaoFMS = (itens: ExercicioAvaliativo[]): ClassificacaoFMS => {
  let temDor = false;
  const assimetrias: { exercicio: string; esq: number; dir: number }[] = [];
  let total = 0;
  let itensAvaliados = 0;

  itens.forEach((item) => {
    const isUnilateral = item.scoreEsq !== undefined || item.scoreDir !== undefined || item.esq !== undefined;
    if (isUnilateral) {
      const sE = item.scoreEsq;
      const sD = item.scoreDir;
      if (sE === 0 || sD === 0) {
        temDor = true;
      }
      if (sE !== undefined && sD !== undefined && sE !== sD && sE >= 0 && sD >= 0) {
        assimetrias.push({ exercicio: item.nome, esq: sE, dir: sD });
      }
      if (sE !== undefined && sD !== undefined) {
        total += Math.min(sE, sD);
        itensAvaliados++;
      } else if (sE !== undefined) {
        total += sE;
        itensAvaliados++;
      } else if (sD !== undefined) {
        total += sD;
        itensAvaliados++;
      }
    } else {
      if (item.score === 0) {
        temDor = true;
      }
      if (item.score !== undefined) {
        total += item.score;
        itensAvaliados++;
      }
    }
  });

  if (temDor) {
    return {
      total,
      max: 21,
      nivel: "dor",
      titulo: "Presença de Dor (Alerta Clínico / Stop)",
      descricao: "O aluno relatou dor durante a execução do teste ou nos testes de exclusão (Clearing Tests). Nota 0 aplicada. Encaminhamento para avaliação médica/fisioterapêutica recomendado.",
      cor: "#dc2626",
      bgCor: "rgba(220, 38, 38, 0.12)",
      badge: "⛔ Presença de Dor (Nota 0)",
      temDor: true,
      assimetrias,
    };
  }

  if (itensAvaliados === 0) {
    return {
      total: 0,
      max: 21,
      nivel: "aberto",
      titulo: "Aguardando Avaliação dos Testes",
      descricao: "Selecione as pontuações de cada padrão de movimento para gerar o diagnóstico e classificação funcional oficial do FMS.",
      cor: "#64748b",
      bgCor: "rgba(100, 116, 139, 0.08)",
      badge: "⚪ Não Avaliado",
      temDor: false,
      assimetrias: [],
    };
  }

  if (total >= 18) {
    return {
      total,
      max: 21,
      nivel: "excelente",
      titulo: "Excelente / Funcionalidade Ótima",
      descricao: "Padrões de movimento simétricos e de alta qualidade (18 a 21 pontos). Liberado para progressões de força máxima, potência e alto desempenho.",
      cor: "#10b981",
      bgCor: "rgba(16, 185, 129, 0.12)",
      badge: "🟢 Excelente (18 a 21 pts) - Baixo Risco",
      temDor: false,
      assimetrias,
    };
  }

  if (total >= 15) {
    return {
      total,
      max: 21,
      nivel: "adequado",
      titulo: "Adequado / Risco Moderado",
      descricao: "Movimento funcional aceitável para o treinamento diário (15 a 17 pontos). Recomendado incluir exercícios corretivos para pequenos desequilíbrios.",
      cor: "#f59e0b",
      bgCor: "rgba(245, 158, 11, 0.12)",
      badge: "🟡 Adequado (15 a 17 pts) - Risco Moderado",
      temDor: false,
      assimetrias,
    };
  }

  return {
    total,
    max: 21,
    nivel: "alto_risco",
    titulo: "Disfuncional / Alto Risco de Lesão (Ponto de Corte FMS)",
    descricao: "Pontuação igual ou inferior a 14 pontos (Ponto de Corte Científico do FMS). Prioridade total em exercícios corretivos, mobilidade e estabilidade antes de sobrecargas elevadas.",
    cor: "#ef4444",
    bgCor: "rgba(239, 68, 68, 0.12)",
    badge: "🔴 Alto Risco de Lesão (<= 14 pts)",
    temDor: false,
    assimetrias,
  };
};

export interface FichaFormState {
  fichaId: string;
  nomeAluno: string;
  clube: string;
  posicao: string;
  responsavel: string;
  dataNascimento: string;
  dataAvaliacao: string;
  alunoSelecionadoId: string;
  seriesMobilidade: string;
  mobilidade: ExercicioAvaliativo[];
  seriesAquecimento: string;
  aquecimento: ExercicioAvaliativo[];
  potencia: ExercicioAvaliativo[];
  seriesForca: string;
  forcaFuncional: ExercicioAvaliativo[];
  recomendacaoSemana: string;
  recomendacaoMinimo: string;
  recomendacaoForaTreino: string;
  aporteNutricional: string;
}

const DRAFT_KEY_ADULTO = "ficha_rascunho_adulto_v2";
const DRAFT_KEY_ATLETA = "ficha_rascunho_atleta_v2";
const LAST_TAB_KEY = "ficha_last_tab_v2";

const createDefaultFichaState = (tipo: "Adulto" | "Atleta"): FichaFormState => ({
  fichaId: "",
  nomeAluno: "",
  clube: "",
  posicao: "",
  responsavel: "",
  dataNascimento: "",
  dataAvaliacao: new Date().toLocaleDateString("pt-BR"),
  alunoSelecionadoId: "",
  seriesMobilidade: "1",
  mobilidade: JSON.parse(JSON.stringify(INITIAL_MOBILIDADE)),
  seriesAquecimento: "1",
  aquecimento: JSON.parse(JSON.stringify(INITIAL_AQUECIMENTO)),
  potencia: JSON.parse(JSON.stringify(INITIAL_POTENCIA)),
  seriesForca: "2",
  forcaFuncional: JSON.parse(JSON.stringify(INITIAL_FORCA)),
  recomendacaoSemana: "2x",
  recomendacaoMinimo: "3 meses",
  recomendacaoForaTreino: "",
  aporteNutricional: "Sim, conforme objetivo",
});

export default function PrimeiraAulaPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"Menu" | "Adulto" | "Atleta" | "Historico">("Menu");
  const [alunosList, setAlunosList] = useState<Aluno[]>([]);
  const [historicoFichas, setHistoricoFichas] = useState<FichaAvaliativa[]>([]);
  const [buscaHistorico, setBuscaHistorico] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedGuideIndex, setExpandedGuideIndex] = useState<number | null>(null);
  const [guideTab, setGuideTab] = useState<"criterios" | "instrucoes" | "implicacoes">("criterios");

  // Modal de Limpar e Exportar
  const [showModalLimpar, setShowModalLimpar] = useState(false);
  const [limpandoSaving, setLimpandoSaving] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Estados independentes e persistentes para Adulto e Atleta
  const [formAdulto, setFormAdulto] = useState<FichaFormState>(() => createDefaultFichaState("Adulto"));
  const [formAtleta, setFormAtleta] = useState<FichaFormState>(() => createDefaultFichaState("Atleta"));

  // Carregar rascunhos do localStorage no mount
  useEffect(() => {
    (async () => {
      const dataAlunos = await mockDb.getAlunos();
      setAlunosList(dataAlunos.filter(a => a.status !== "deletado"));
      await carregarHistorico();

      if (typeof window !== "undefined") {
        try {
          const rawAdulto = localStorage.getItem(DRAFT_KEY_ADULTO);
          if (rawAdulto) {
            const parsed = JSON.parse(rawAdulto);
            if (parsed && typeof parsed === "object") {
              setFormAdulto(prev => ({ ...prev, ...parsed }));
            }
          }
          const rawAtleta = localStorage.getItem(DRAFT_KEY_ATLETA);
          if (rawAtleta) {
            const parsed = JSON.parse(rawAtleta);
            if (parsed && typeof parsed === "object") {
              setFormAtleta(prev => ({ ...prev, ...parsed }));
            }
          }
        } catch (e) {
          console.error("Erro ao carregar rascunhos do localStorage:", e);
        }
      }
      setIsHydrated(true);
    })();
  }, []);

  // Salva no localStorage sempre que formAdulto mudar
  useEffect(() => {
    if (!isHydrated) return;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(DRAFT_KEY_ADULTO, JSON.stringify(formAdulto));
      } catch (e) {
        console.error("Erro ao salvar rascunho adulto:", e);
      }
    }
  }, [formAdulto, isHydrated]);

  // Salva no localStorage sempre que formAtleta mudar
  useEffect(() => {
    if (!isHydrated) return;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(DRAFT_KEY_ATLETA, JSON.stringify(formAtleta));
      } catch (e) {
        console.error("Erro ao salvar rascunho atleta:", e);
      }
    }
  }, [formAtleta, isHydrated]);

  const carregarHistorico = async () => {
    const list = await mockDb.getFichasAvaliativas();
    setHistoricoFichas(list);
  };

  const handleMudarAba = (novaAba: "Menu" | "Adulto" | "Atleta" | "Historico") => {
    setActiveTab(novaAba);
    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_TAB_KEY, novaAba);
    }
  };

  const formAtual = activeTab === "Atleta" ? formAtleta : formAdulto;

  const updateField = <K extends keyof FichaFormState>(field: K, value: FichaFormState[K]) => {
    if (activeTab === "Atleta") {
      setFormAtleta(prev => ({ ...prev, [field]: value }));
    } else {
      setFormAdulto(prev => ({ ...prev, [field]: value }));
    }
  };

  const {
    fichaId,
    nomeAluno,
    clube,
    posicao,
    responsavel,
    dataNascimento,
    dataAvaliacao,
    alunoSelecionadoId,
    seriesMobilidade,
    mobilidade,
    seriesAquecimento,
    aquecimento,
    potencia,
    seriesForca,
    forcaFuncional,
    recomendacaoSemana,
    recomendacaoMinimo,
    recomendacaoForaTreino,
    aporteNutricional,
  } = formAtual;

  const setFichaId = (val: string) => updateField("fichaId", val);
  const setNomeAluno = (val: string) => updateField("nomeAluno", val);
  const setClube = (val: string) => updateField("clube", val);
  const setPosicao = (val: string) => updateField("posicao", val);
  const setResponsavel = (val: string) => updateField("responsavel", val);
  const setDataNascimento = (val: string) => updateField("dataNascimento", val);
  const setDataAvaliacao = (val: string) => updateField("dataAvaliacao", val);
  const setAlunoSelecionadoId = (val: string) => updateField("alunoSelecionadoId", val);
  const setSeriesMobilidade = (val: string) => updateField("seriesMobilidade", val);
  const setMobilidade: React.Dispatch<React.SetStateAction<ExercicioAvaliativo[]>> = (updater) => {
    if (activeTab === "Atleta") {
      setFormAtleta(prev => ({
        ...prev,
        mobilidade: typeof updater === "function" ? updater(prev.mobilidade) : updater,
      }));
    } else {
      setFormAdulto(prev => ({
        ...prev,
        mobilidade: typeof updater === "function" ? updater(prev.mobilidade) : updater,
      }));
    }
  };
  const setSeriesAquecimento = (val: string) => updateField("seriesAquecimento", val);
  const setAquecimento: React.Dispatch<React.SetStateAction<ExercicioAvaliativo[]>> = (updater) => {
    setFormAtleta(prev => ({
      ...prev,
      aquecimento: typeof updater === "function" ? updater(prev.aquecimento) : updater,
    }));
  };
  const setPotencia: React.Dispatch<React.SetStateAction<ExercicioAvaliativo[]>> = (updater) => {
    setFormAtleta(prev => ({
      ...prev,
      potencia: typeof updater === "function" ? updater(prev.potencia) : updater,
    }));
  };
  const setSeriesForca = (val: string) => updateField("seriesForca", val);
  const setForcaFuncional: React.Dispatch<React.SetStateAction<ExercicioAvaliativo[]>> = (updater) => {
    if (activeTab === "Atleta") {
      setFormAtleta(prev => ({
        ...prev,
        forcaFuncional: typeof updater === "function" ? updater(prev.forcaFuncional) : updater,
      }));
    } else {
      setFormAdulto(prev => ({
        ...prev,
        forcaFuncional: typeof updater === "function" ? updater(prev.forcaFuncional) : updater,
      }));
    }
  };
  const setRecomendacaoSemana = (val: string) => updateField("recomendacaoSemana", val);
  const setRecomendacaoMinimo = (val: string) => updateField("recomendacaoMinimo", val);
  const setRecomendacaoForaTreino = (val: string) => updateField("recomendacaoForaTreino", val);
  const setAporteNutricional = (val: string) => updateField("aporteNutricional", val);

  const resetForm = (tipo: "Adulto" | "Atleta" = "Adulto") => {
    const defaultState = createDefaultFichaState(tipo);
    if (tipo === "Atleta") {
      setFormAtleta(defaultState);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(DRAFT_KEY_ATLETA);
        } catch {}
      }
    } else {
      setFormAdulto(defaultState);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(DRAFT_KEY_ADULTO);
        } catch {}
      }
    }
  };

  const calcSoma = (items: ExercicioAvaliativo[]) => {
    return items.reduce((acc, curr) => {
      if (curr.scoreEsq !== undefined && curr.scoreDir !== undefined) {
        return acc + Math.min(curr.scoreEsq, curr.scoreDir);
      }
      if (curr.scoreEsq !== undefined) return acc + curr.scoreEsq;
      if (curr.scoreDir !== undefined) return acc + curr.scoreDir;
      return acc + (curr.score || 0);
    }, 0);
  };

  const handleSelectAluno = (alunoId: string) => {
    setAlunoSelecionadoId(alunoId);
    if (!alunoId) return;
    const found = alunosList.find(a => a.id === alunoId);
    if (found) {
      setNomeAluno(found.nome);
    }
  };

  const carregarFichaParaEdicao = (ficha: FichaAvaliativa) => {
    const mobCopy: ExercicioAvaliativo[] = JSON.parse(JSON.stringify(INITIAL_MOBILIDADE));
    if (ficha.mobilidade && ficha.mobilidade.length > 0) {
      mobCopy.forEach((initItem) => {
        const found = ficha.mobilidade.find((m) =>
          m.nome.toLowerCase().includes(initItem.nome.toLowerCase().slice(0, 8)) ||
          initItem.nome.toLowerCase().includes(m.nome.toLowerCase().slice(0, 8))
        );
        if (found) {
          initItem.score = found.score;
          if (initItem.scoreEsq !== undefined || found.scoreEsq !== undefined) initItem.scoreEsq = found.scoreEsq;
          if (initItem.scoreDir !== undefined || found.scoreDir !== undefined) initItem.scoreDir = found.scoreDir;
          initItem.esq = found.esq || "";
          initItem.dir = found.dir || "";
          initItem.obs = found.obs || "";
        }
      });
    }

    let forcaCopy: ExercicioAvaliativo[] = JSON.parse(JSON.stringify(INITIAL_FORCA));
    if (ficha.forcaFuncional) {
      forcaCopy = JSON.parse(JSON.stringify(ficha.forcaFuncional));
      if (!forcaCopy.some((e) => e.nome.toLowerCase().includes("pressão") || e.nome.toLowerCase().includes("pressao"))) {
        forcaCopy.push({ nome: "Pressão Vertical", carga: "", reps: "8-10", obs: "" });
      }
    }

    const stateObj: FichaFormState = {
      fichaId: ficha.id,
      nomeAluno: ficha.nomeAluno,
      clube: ficha.clube || "",
      posicao: ficha.posicao || "",
      responsavel: ficha.responsavel || "",
      dataNascimento: ficha.dataNascimento || "",
      dataAvaliacao: ficha.data,
      alunoSelecionadoId: ficha.alunoId || "",
      seriesMobilidade: ficha.seriesMobilidade || "1",
      mobilidade: mobCopy,
      seriesAquecimento: ficha.seriesAquecimento || "1",
      aquecimento: ficha.aquecimento ? JSON.parse(JSON.stringify(ficha.aquecimento)) : JSON.parse(JSON.stringify(INITIAL_AQUECIMENTO)),
      potencia: ficha.potencia ? JSON.parse(JSON.stringify(ficha.potencia)) : JSON.parse(JSON.stringify(INITIAL_POTENCIA)),
      seriesForca: ficha.seriesForca || "2",
      forcaFuncional: forcaCopy,
      recomendacaoSemana: ficha.recomendacaoSemana || "2x",
      recomendacaoMinimo: ficha.recomendacaoMinimo || "3 meses",
      recomendacaoForaTreino: ficha.recomendacaoForaTreino || "",
      aporteNutricional: ficha.aporteNutricional || "Sim, conforme objetivo",
    };

    if (ficha.tipo === "Atleta") {
      setFormAtleta(stateObj);
    } else {
      setFormAdulto(stateObj);
    }

    setActiveTab(ficha.tipo);
    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_TAB_KEY, ficha.tipo);
    }
  };

  const construirObjetoFicha = (tipo: "Adulto" | "Atleta"): FichaAvaliativa => {
    const f = tipo === "Atleta" ? formAtleta : formAdulto;
    return {
      id: f.fichaId || `ficha_${Date.now()}`,
      alunoId: f.alunoSelecionadoId,
      nomeAluno: f.nomeAluno.trim() || "Aluno sem nome",
      data: f.dataAvaliacao || new Date().toLocaleDateString("pt-BR"),
      tipo,
      clube: tipo === "Atleta" ? f.clube.trim() : undefined,
      posicao: tipo === "Atleta" ? f.posicao.trim() : undefined,
      responsavel: tipo === "Atleta" ? f.responsavel.trim() : undefined,
      dataNascimento: tipo === "Atleta" ? f.dataNascimento.trim() : undefined,
      seriesMobilidade: f.seriesMobilidade,
      mobilidade: f.mobilidade,
      somaMobilidade: calcSoma(f.mobilidade),
      seriesAquecimento: tipo === "Atleta" ? f.seriesAquecimento : undefined,
      aquecimento: tipo === "Atleta" ? f.aquecimento : undefined,
      somaAquecimento: tipo === "Atleta" ? calcSoma(f.aquecimento || []) : undefined,
      potencia: tipo === "Atleta" ? f.potencia : undefined,
      somaPotencia: tipo === "Atleta" ? calcSoma(f.potencia || []) : undefined,
      seriesForca: f.seriesForca,
      forcaFuncional: f.forcaFuncional,
      somaForca: calcSoma(f.forcaFuncional),
      recomendacaoSemana: f.recomendacaoSemana,
      recomendacaoMinimo: f.recomendacaoMinimo,
      recomendacaoForaTreino: f.recomendacaoForaTreino,
      aporteNutricional: f.aporteNutricional,
      createdAt: new Date().toISOString(),
    };
  };

  const handleSalvarFicha = async () => {
    const tipo = activeTab === "Atleta" ? "Atleta" : "Adulto";
    const currentNome = (tipo === "Atleta" ? formAtleta : formAdulto).nomeAluno;
    if (!currentNome.trim()) {
      alert("Por favor, preencha o Nome e Sobrenome do aluno.");
      return;
    }
    const ficha = construirObjetoFicha(tipo);
    await mockDb.salvarFichaAvaliativa(ficha);
    setFichaId(ficha.id);
    await carregarHistorico();
    alert("Ficha Avaliativa salva no histórico com sucesso!");
  };

  const handleSalvarExportarELimpar = async () => {
    const tipo = activeTab === "Atleta" ? "Atleta" : "Adulto";
    const currentNome = (tipo === "Atleta" ? formAtleta : formAdulto).nomeAluno;
    if (!currentNome.trim()) {
      alert("Por favor, preencha o Nome do aluno antes de salvar e exportar a ficha.");
      return;
    }
    setLimpandoSaving(true);
    try {
      const ficha = construirObjetoFicha(tipo);
      await mockDb.salvarFichaAvaliativa(ficha);
      await carregarHistorico();
      handleGerarPDF(ficha);
      
      // Limpa os campos e o rascunho
      resetForm(tipo);
      setShowModalLimpar(false);
      alert(`Ficha de ${ficha.nomeAluno} salva no histórico, PDF exportado e formulário reiniciado com sucesso!`);
    } catch (err) {
      console.error("Erro ao salvar e exportar ficha:", err);
      alert("Ocorreu um erro ao salvar a ficha ou exportar o PDF.");
    } finally {
      setLimpandoSaving(false);
    }
  };

  const handleApenasLimpar = () => {
    const tipo = activeTab === "Atleta" ? "Atleta" : "Adulto";
    resetForm(tipo);
    setShowModalLimpar(false);
  };

  const handleSalvarECriarTreinoA = async (fichaParaUsar?: FichaAvaliativa) => {
    const tipo = activeTab === "Atleta" ? "Atleta" : "Adulto";
    const ficha = fichaParaUsar || construirObjetoFicha(tipo);

    if (!ficha.nomeAluno || ficha.nomeAluno === "Aluno sem nome") {
      alert("Por favor, informe o nome do aluno antes de criar o treino.");
      return;
    }

    setSaving(true);
    try {
      const alunoAtualizado = await mockDb.salvarEGerarTreinoA(ficha);
      setFichaId(ficha.id);
      await carregarHistorico();
      const dataAlunos = await mockDb.getAlunos();
      setAlunosList(dataAlunos.filter(a => a.status !== "deletado"));
      alert(`Ficha avaliativa salva e Treino A criado com sucesso para o aluno ${alunoAtualizado.nome}!`);
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao criar o Treino A.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletarFicha = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta ficha avaliativa do histórico?")) return;
    await mockDb.deletarFichaAvaliativa(id);
    await carregarHistorico();
  };

  const handleGerarPDF = (fichaParaPdf?: FichaAvaliativa) => {
    const tipo = activeTab === "Atleta" ? "Atleta" : "Adulto";
    const ficha = fichaParaPdf || construirObjetoFicha(tipo);

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // ──────────────── PAGE 1 ────────────────
    try {
      doc.addImage(RUMPEL_BG_BASE64, "JPEG", 0, 0, 210, 297);
    } catch (e) {
      console.error("Logo PDF error", e);
    }

    // Título Principal
    doc.setFillColor(34, 139, 34);
    doc.roundedRect(14, 40, 182, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    const tipoStr = `1ª AULA ${ficha.tipo.toUpperCase()} - TREINAMENTO`;
    doc.text(tipoStr, 105, 45.5, { align: "center" });

    let currentY = 52;

    if (ficha.tipo === "Atleta") {
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8.5);

      // Box de identificação do Atleta
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 50, 182, 16, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.text("ATLETA:", 18, 55);
      doc.setFont("helvetica", "normal");
      doc.text(`${ficha.nomeAluno.toUpperCase()}`, 34, 55);

      doc.setFont("helvetica", "bold");
      doc.text("DATA AVALIAÇÃO:", 130, 55);
      doc.setFont("helvetica", "normal");
      doc.text(`${ficha.data}`, 162, 55);

      doc.setFont("helvetica", "bold");
      doc.text("CLUBE:", 18, 60);
      doc.setFont("helvetica", "normal");
      doc.text(`${(ficha.clube || "-").toUpperCase()}`, 32, 60);

      doc.setFont("helvetica", "bold");
      doc.text("POSIÇÃO:", 90, 60);
      doc.setFont("helvetica", "normal");
      doc.text(`${(ficha.posicao || "-").toUpperCase()}`, 107, 60);

      doc.setFont("helvetica", "bold");
      doc.text("NASCIMENTO:", 140, 60);
      doc.setFont("helvetica", "normal");
      doc.text(`${ficha.dataNascimento || "-"}`, 165, 60);

      currentY = 70;
    } else {
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);

      // Box de identificação Adulto
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 50, 182, 10, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.text("NOME E SOBRENOME:", 18, 56.5);
      doc.setFont("helvetica", "normal");
      doc.text(`${ficha.nomeAluno.toUpperCase()}`, 58, 56.5);

      doc.setFont("helvetica", "bold");
      doc.text("DATA:", 145, 56.5);
      doc.setFont("helvetica", "normal");
      doc.text(`${ficha.data}`, 157, 56.5);

      currentY = 64;
    }

    // Seção 1: MOBILIDADE AVALIATIVA (FMS)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(20, 83, 45);
    doc.text(`MOBILIDADE AVALIATIVA (FMS) - Séries: 1 (${ficha.seriesMobilidade === "1" ? "X" : " "}) - 2 (${ficha.seriesMobilidade === "2" ? "X" : " "})`, 14, currentY);
    currentY += 3;

    const bodyMobilidade = ficha.mobilidade.map((item, idx) => {
      let extra = "";
      if (item.esq || item.dir) extra += ` (ESQ: ${item.esq || "-"} | DIR: ${item.dir || "-"})`;
      if (item.regressao && item.regressaoTexto) extra += ` [Reg: ${item.regressaoTexto}]`;
      if (item.progressao && item.progressaoTexto) extra += ` [Prog: ${item.progressaoTexto}]`;
      if (item.obs) extra += ` - ${item.obs}`;

      const isUnilateral = item.scoreEsq !== undefined || item.scoreDir !== undefined || item.esq !== undefined || [1, 2, 3, 4, 6].includes(idx);
      let notaText = "";
      if (isUnilateral) {
        const sE = item.scoreEsq !== undefined ? item.scoreEsq : -1;
        const sD = item.scoreDir !== undefined ? item.scoreDir : -1;
        notaText = `E: 0(${sE === 0 ? "X" : " "}) 1(${sE === 1 ? "X" : " "}) 2(${sE === 2 ? "X" : " "}) 3(${sE === 3 ? "X" : " "})\nD: 0(${sD === 0 ? "X" : " "}) 1(${sD === 1 ? "X" : " "}) 2(${sD === 2 ? "X" : " "}) 3(${sD === 3 ? "X" : " "})`;
      } else {
        const s = item.score !== undefined ? item.score : -1;
        notaText = `0(${s === 0 ? "X" : " "}) 1(${s === 1 ? "X" : " "}) 2(${s === 2 ? "X" : " "}) 3(${s === 3 ? "X" : " "})`;
      }

      return [
        `${idx + 1}. ${item.nome}${extra}`,
        notaText,
        `REP: ${item.reps || ""}`,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [["Teste FMS / Observações", "Nota FMS", "Tentativas / Medição"]],
      body: bodyMobilidade,
      theme: "grid",
      headStyles: { fillColor: [46, 125, 50], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
      columnStyles: { 0: { cellWidth: 112 }, 1: { cellWidth: 43 }, 2: { cellWidth: 27 } },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 3;

    const diagFMS = calcularClassificacaoFMS(ficha.mobilidade || []);
    
    // Clean badge and text from emojis and special symbols for PDF Helvetica compatibility
    const cleanBadge = diagFMS.badge
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|≤/gu, "")
      .replace(/<=/g, "<=")
      .trim();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const diagFullText = `Diagnóstico: ${diagFMS.titulo} - ${diagFMS.descricao}`;
    const descLines: string[] = doc.splitTextToSize(diagFullText, 172);

    let assimLines: string[] = [];
    if (diagFMS.assimetrias.length > 0) {
      const assimetriasStr = `Assimetrias Detectadas: ` + diagFMS.assimetrias.map(a => `${a.exercicio} (E:${a.esq} vs D:${a.dir})`).join(" | ");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      assimLines = doc.splitTextToSize(assimetriasStr, 172);
    }

    const boxHeight = 5 + (descLines.length * 3.4) + (assimLines.length > 0 ? (assimLines.length * 3.4 + 1.5) : 0) + 3;

    // Cores de fundo e borda baseadas na classificação
    if (diagFMS.temDor) {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(248, 113, 113);
    } else if (diagFMS.total >= 18) {
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(74, 222, 128);
    } else if (diagFMS.total >= 15) {
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(252, 211, 77);
    } else if (diagFMS.nivel === "aberto") {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
    } else {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(248, 113, 113);
    }

    doc.roundedRect(14, currentY, 182, boxHeight, 2, 2, "FD");

    let textY = currentY + 4.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    if (diagFMS.temDor || (diagFMS.total <= 14 && diagFMS.nivel !== "aberto")) {
      doc.setTextColor(185, 28, 28);
    } else if (diagFMS.total >= 18) {
      doc.setTextColor(21, 128, 61);
    } else if (diagFMS.total >= 15) {
      doc.setTextColor(180, 83, 9);
    } else {
      doc.setTextColor(71, 85, 105);
    }
    doc.text(`Soma Mobilidade FMS: ${ficha.somaMobilidade} / 21   |   Classificação: ${cleanBadge}`, 18, textY);

    textY += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    descLines.forEach((line) => {
      doc.text(line, 18, textY);
      textY += 3.4;
    });

    if (assimLines.length > 0) {
      textY += 0.5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(180, 83, 9);
      assimLines.forEach((line) => {
        doc.text(line, 18, textY);
        textY += 3.4;
      });
      doc.setTextColor(0, 0, 0);
    }

    currentY += boxHeight + 4;

    // Seção para Atleta: AQUECIMENTO
    if (ficha.tipo === "Atleta" && ficha.aquecimento) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(20, 83, 45);
      doc.text(`AQUECIMENTO AVALIATIVO - Séries: 1 (${ficha.seriesAquecimento === "1" ? "X" : " "}) - 2 (${ficha.seriesAquecimento === "2" ? "X" : " "})`, 14, currentY);
      currentY += 3;

      const bodyAquecimento = ficha.aquecimento.map((item, idx) => {
        let extra = item.regressao ? ` [Reg: ${item.regressaoTexto}]` : "";
        if (item.obs) extra += ` - ${item.obs}`;
        return [
          `${idx + 1}. ${item.nome}${extra}`,
          `1(${item.score === 1 ? "X" : " "})  2(${item.score === 2 ? "X" : " "})  3(${item.score === 3 ? "X" : " "})`,
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [["Exercício / Regressão", "Nota"]],
        body: bodyAquecimento,
        theme: "grid",
        headStyles: { fillColor: [46, 125, 50], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(20, 83, 45);
      doc.text(`Soma Aquecimento: ( ${ficha.somaAquecimento || 0} )`, 150, currentY + 2);
    }

    // ──────────────── PAGE 2 ────────────────
    doc.addPage();
    try {
      doc.addImage(RUMPEL_BG_BASE64, "JPEG", 0, 0, 210, 297);
    } catch (e) {
      console.error("Logo PDF error", e);
    }

    let yPage2 = 42;

    if (ficha.tipo === "Atleta" && ficha.potencia) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(20, 83, 45);
      doc.text("POTÊNCIA COORDENATIVA AVALIATIVA", 14, yPage2);
      yPage2 += 3;

      const bodyPotencia = ficha.potencia.map((item, idx) => [
        `${idx + 1}. ${item.nome}${item.obs ? ` - ${item.obs}` : ""}`,
        `1(${item.score === 1 ? "X" : " "})  2(${item.score === 2 ? "X" : " "})  3(${item.score === 3 ? "X" : " "})`,
        `REP: ${item.reps || ""}`,
      ]);

      autoTable(doc, {
        startY: yPage2,
        head: [["Exercício", "Nota", "Repetições"]],
        body: bodyPotencia,
        theme: "grid",
        headStyles: { fillColor: [46, 125, 50], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
        margin: { left: 14, right: 14 },
      });

      yPage2 = (doc as any).lastAutoTable.finalY + 3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(20, 83, 45);
      doc.text(`Soma Potência Coordenativa: ( ${ficha.somaPotencia || 0} )`, 140, yPage2 + 2);
      yPage2 += 7;
    }

    // Seção FORÇA FUNCIONAL AVALIATIVA (2 Blocos)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(20, 83, 45);
    doc.text(`FORÇA FUNCIONAL AVALIATIVA - Séries: 2 (${ficha.seriesForca === "2" ? "X" : " "}) - 3 (${ficha.seriesForca === "3" ? "X" : " "})`, 14, yPage2);
    yPage2 += 3;

    const bodyForca: any[] = [];

    // Header Bloco 1
    bodyForca.push([
      {
        content: "BLOCO 1: Agachamento, Apoio e Ponte",
        colSpan: 3,
        styles: { fillColor: [240, 253, 244], fontStyle: "bold", textColor: [22, 101, 52] },
      },
    ]);

    const bloco1Items = (ficha.forcaFuncional || []).slice(0, 3);
    bloco1Items.forEach((item, idx) => {
      let extra = "";
      if (item.regressao) extra += ` [Reg: ${item.regressaoTexto}]`;
      if (item.progressao) extra += ` [Prog: ${item.progressaoTexto}]`;
      if (item.obs) extra += ` - ${item.obs}`;
      bodyForca.push([
        `${idx + 1}. ${item.nome}${extra}`,
        `1(${item.score === 1 ? "X" : " "}) 2(${item.score === 2 ? "X" : " "}) 3(${item.score === 3 ? "X" : " "})`,
        `Carga: ${item.carga || "-"} | REP: ${item.reps || "8-10"}`,
      ]);
    });

    if ((ficha.forcaFuncional || []).length > 3) {
      // Header Bloco 2
      bodyForca.push([
        {
          content: "BLOCO 2: Puxada no TRX e Pressão Vertical",
          colSpan: 3,
          styles: { fillColor: [240, 253, 244], fontStyle: "bold", textColor: [22, 101, 52] },
        },
      ]);

      const bloco2Items = (ficha.forcaFuncional || []).slice(3);
      bloco2Items.forEach((item, idx) => {
        let extra = "";
        if (item.regressao) extra += ` [Reg: ${item.regressaoTexto}]`;
        if (item.progressao) extra += ` [Prog: ${item.progressaoTexto}]`;
        if (item.obs) extra += ` - ${item.obs}`;
        bodyForca.push([
          `${idx + 4}. ${item.nome}${extra}`,
          `1(${item.score === 1 ? "X" : " "}) 2(${item.score === 2 ? "X" : " "}) 3(${item.score === 3 ? "X" : " "})`,
          `Carga: ${item.carga || "-"} | REP: ${item.reps || "8-10"}`,
        ]);
      });
    }

    autoTable(doc, {
      startY: yPage2,
      head: [["Exercício", "Nota", "Carga & Repetições"]],
      body: bodyForca,
      theme: "grid",
      headStyles: { fillColor: [46, 125, 50], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
      margin: { left: 14, right: 14 },
    });

    yPage2 = (doc as any).lastAutoTable.finalY + 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(20, 83, 45);
    doc.text(`Soma Força Funcional: ( ${ficha.somaForca} )`, 145, yPage2 + 2);
    yPage2 += 8;

    // Box de Recomendações & Diretrizes
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, yPage2, 182, 28, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(20, 83, 45);
    doc.text("RECOMENDAÇÕES & DIRETRIZES DO TREINAMENTO", 18, yPage2 + 5.5);

    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text("• Frequência Semanal:", 18, yPage2 + 11);
    doc.setFont("helvetica", "normal");
    doc.text(`${ficha.recomendacaoSemana || "___"} na semana | Tempo de treino: ${ficha.recomendacaoMinimo || "___"}`, 55, yPage2 + 11);

    doc.setFont("helvetica", "bold");
    doc.text("• Recomendações fora do Treino:", 18, yPage2 + 16.5);
    doc.setFont("helvetica", "normal");
    doc.text(`${ficha.recomendacaoForaTreino || "Nenhuma"}`, 68, yPage2 + 16.5);

    doc.setFont("helvetica", "bold");
    doc.text("• Aporte Nutricional:", 18, yPage2 + 22);
    doc.setFont("helvetica", "normal");
    doc.text(`${ficha.aporteNutricional || "Não informado"}`, 48, yPage2 + 22);

    doc.save(`Ficha_Avaliativa_${ficha.tipo}_${ficha.nomeAluno.replace(/\s+/g, "_")}.pdf`);
  };

  const renderScoreButtons = (
    list: ExercicioAvaliativo[],
    setList: React.Dispatch<React.SetStateAction<ExercicioAvaliativo[]>>,
    index: number
  ) => {
    const item = list[index];
    const isUnilateral = item.scoreEsq !== undefined || item.scoreDir !== undefined || item.esq !== undefined || ["Passo sobre a Barreira", "Avanço em Linha", "Mobilidade de Ombro", "Elevação da Perna Estendida Ativa", "Estabilidade Rotatória"].includes(item.nome);

    if (isUnilateral) {
      const scoreEsq = item.scoreEsq;
      const scoreDir = item.scoreDir;

      const handleScoreChange = (side: "esq" | "dir", val: number) => {
        const next = [...list];
        const target = next[index];
        if (side === "esq") {
          target.scoreEsq = target.scoreEsq === val ? undefined : val;
        } else {
          target.scoreDir = target.scoreDir === val ? undefined : val;
        }

        const sE = target.scoreEsq;
        const sD = target.scoreDir;
        if (sE !== undefined && sD !== undefined) {
          target.score = Math.min(sE, sD);
        } else if (sE !== undefined) {
          target.score = sE;
        } else if (sD !== undefined) {
          target.score = sD;
        } else {
          target.score = undefined;
        }
        setList(next);
      };

      const renderSideRow = (label: string, side: "esq" | "dir", currentVal: number | undefined) => (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, width: "32px", minWidth: "32px", display: "inline-block", color: "var(--text-secondary)" }}>
            {label}:
          </span>
          {[0, 1, 2, 3].map((val) => {
            const isSelected = currentVal === val;
            let bg = "var(--bg-hover)";
            let color = "var(--text-primary)";
            let border = "1px solid var(--border-medium)";
            let title = "";
            if (val === 0) {
              title = "0: Presença de Dor / Alerta Clínico";
              if (isSelected) { bg = "#dc2626"; color = "#fff"; border = "1px solid #b91c1c"; }
            } else if (val === 1) {
              title = "1: Padrão Incompleto / Incapaz";
              if (isSelected) { bg = "#ef4444"; color = "#fff"; border = "none"; }
            } else if (val === 2) {
              title = "2: Padrão com Compensação / Variação";
              if (isSelected) { bg = "#f59e0b"; color = "#fff"; border = "none"; }
            } else if (val === 3) {
              title = "3: Padrão Ideal FMS";
              if (isSelected) { bg = "#10b981"; color = "#fff"; border = "none"; }
            }
            return (
              <button
                key={`${side}-${val}`}
                type="button"
                title={title}
                onClick={() => handleScoreChange(side, val)}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  border,
                  background: bg,
                  color,
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {val}
              </button>
            );
          })}
        </div>
      );

      const hasBoth = scoreEsq !== undefined && scoreDir !== undefined;
      const isAsymmetric = hasBoth && scoreEsq !== scoreDir;

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {renderSideRow("ESQ", "esq", scoreEsq)}
          {renderSideRow("DIR", "dir", scoreDir)}
          {(scoreEsq !== undefined || scoreDir !== undefined) && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", marginTop: "2px" }}>
              <span style={{ color: "var(--text-secondary)" }}>
                Nota FMS: <strong style={{ color: item.score === 0 ? "#dc2626" : item.score === 3 ? "#10b981" : item.score === 2 ? "#f59e0b" : "#ef4444" }}>{item.score}</strong>
              </span>
              {isAsymmetric && (
                <span style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", padding: "1px 5px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>
                  Assimetria!
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    const currentScore = list[index].score;
    const isFMS = ["Agachamento Overhead", "Flexão com Estabilidade de Tronco"].includes(item.nome);
    const scoreOptions = isFMS ? [0, 1, 2, 3] : [1, 2, 3];

    return (
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        {isFMS && (
          <span style={{ width: "32px", minWidth: "32px", display: "inline-block" }} />
        )}
        {scoreOptions.map((val) => {
          const isSelected = currentScore === val;
          let bg = "var(--bg-hover)";
          let color = "var(--text-primary)";
          let border = "1px solid var(--border-medium)";
          let title = "";
          if (val === 0) {
            title = "0: Presença de Dor / Alerta Clínico";
            if (isSelected) { bg = "#dc2626"; color = "#fff"; border = "1px solid #b91c1c"; }
          } else if (val === 1) {
            title = "1: Padrão Incompleto";
            if (isSelected) { bg = "#ef4444"; color = "#fff"; border = "none"; }
          } else if (val === 2) {
            title = "2: Padrão com Modificação / Prancha";
            if (isSelected) { bg = "#f59e0b"; color = "#fff"; border = "none"; }
          } else if (val === 3) {
            title = "3: Padrão Ideal";
            if (isSelected) { bg = "#10b981"; color = "#fff"; border = "none"; }
          }
          return (
            <button
              key={val}
              type="button"
              title={title}
              onClick={() => {
                const next = [...list];
                next[index].score = isSelected ? undefined : val;
                setList(next);
              }}
              style={{
                width: isFMS ? "28px" : "30px",
                height: isFMS ? "28px" : "30px",
                borderRadius: "6px",
                border,
                background: bg,
                color,
                fontWeight: 800,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {val}
            </button>
          );
        })}
      </div>
    );
  };

  const historicoFiltrado = historicoFichas.filter((f) =>
    f.nomeAluno.toLowerCase().includes(buscaHistorico.toLowerCase()) ||
    f.data.includes(buscaHistorico) ||
    (f.clube && f.clube.toLowerCase().includes(buscaHistorico.toLowerCase())) ||
    (f.posicao && f.posicao.toLowerCase().includes(buscaHistorico.toLowerCase())) ||
    (f.responsavel && f.responsavel.toLowerCase().includes(buscaHistorico.toLowerCase()))
  );

  return (
    <div style={{ padding: "30px 40px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            {activeTab !== "Menu" ? (
              <button
                className="premium-btn-outline"
                onClick={() => handleMudarAba("Menu")}
                style={{ marginBottom: "12px", fontSize: "0.9rem" }}
              >
                <ArrowLeft size={16} /> Voltar ao Menu de Escolha
              </button>
            ) : (
              <Link
                href="/"
                style={{
                  color: "var(--text-secondary)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                  textDecoration: "none",
                }}
              >
                <ArrowLeft size={16} /> Voltar ao Início
              </Link>
            )}
            <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)" }}>
              1º Aula - Ficha Avaliativa
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              {activeTab === "Menu"
                ? "Selecione o tipo de avaliação ou consulte o histórico"
                : `Avaliação de 1ª Aula (${activeTab.toUpperCase()})`}
            </p>
          </div>

        </div>
      </header>

      {/* TELA DE MENU INICIAL (ESCOLHA OBRIGATÓRIA) */}
      {activeTab === "Menu" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginTop: "20px" }}>
          {/* Card 1: Adulto */}
          <div
            onClick={() => handleMudarAba("Adulto")}
            style={{
              background: "var(--bg-panel)",
              padding: "40px 30px",
              borderRadius: "16px",
              border: "2px solid var(--accent-primary)",
              cursor: "pointer",
              textAlign: "center",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <div
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                background: "rgba(76, 175, 80, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px auto",
              }}
            >
              <Dumbbell size={36} color="var(--accent-primary)" />
            </div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "8px" }}>1º Aula Adulto</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.4" }}>
              Ficha avaliativa com testes de mobilidade física e força funcional para alunos adultos.
            </p>
            {formAdulto.nomeAluno.trim() ? (
              <div style={{ marginTop: "14px", display: "inline-block", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "4px 12px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 700 }}>
                ● Rascunho salvo ({formAdulto.nomeAluno})
              </div>
            ) : null}
            <button className="premium-btn" style={{ marginTop: "20px", width: "100%", justifyContent: "center" }}>
              {formAdulto.nomeAluno.trim() ? "Continuar Ficha Adulto" : "Abrir Ficha Adulto"}
            </button>
          </div>

          {/* Card 2: Atleta */}
          <div
            onClick={() => handleMudarAba("Atleta")}
            style={{
              background: "var(--bg-panel)",
              padding: "40px 30px",
              borderRadius: "16px",
              border: "2px solid #3b82f6",
              cursor: "pointer",
              textAlign: "center",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <div
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                background: "rgba(59, 130, 246, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px auto",
              }}
            >
              <Sparkles size={36} color="#3b82f6" />
            </div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "8px" }}>1º Aula Atleta</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.4" }}>
              Ficha completa com testes de mobilidade, aquecimento de pista, potência e força funcional.
            </p>
            {formAtleta.nomeAluno.trim() ? (
              <div style={{ marginTop: "14px", display: "inline-block", background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", padding: "4px 12px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 700 }}>
                ● Rascunho salvo ({formAtleta.nomeAluno})
              </div>
            ) : null}
            <button className="premium-btn" style={{ marginTop: "20px", width: "100%", justifyContent: "center", background: "#3b82f6" }}>
              {formAtleta.nomeAluno.trim() ? "Continuar Ficha Atleta" : "Abrir Ficha Atleta"}
            </button>
          </div>

          {/* Card 3: Histórico */}
          <div
            onClick={() => handleMudarAba("Historico")}
            style={{
              background: "var(--bg-panel)",
              padding: "40px 30px",
              borderRadius: "16px",
              border: "2px solid #8b5cf6",
              cursor: "pointer",
              textAlign: "center",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <div
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                background: "rgba(139, 92, 246, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px auto",
              }}
            >
              <FileText size={36} color="#8b5cf6" />
            </div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "8px" }}>Histórico de Fichas</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.4" }}>
              Consulte avaliações realizadas ({historicoFichas.length}), reimprima PDFs ou crie o Treino A.
            </p>
            <button className="premium-btn" style={{ marginTop: "24px", width: "100%", justifyContent: "center", background: "#8b5cf6" }}>
              Ver Histórico ({historicoFichas.length})
            </button>
          </div>
        </div>
      )}

      {/* ABA 3: HISTÓRICO DE FICHAS */}
      {activeTab === "Historico" && (
        <div style={{ background: "var(--bg-panel)", borderRadius: "12px", padding: "24px", border: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Histórico de Avaliações Realizadas</h2>
            <div style={{ position: "relative", width: "300px" }}>
              <input
                type="text"
                placeholder="🔎 Buscar por aluno ou data..."
                value={buscaHistorico}
                onChange={(e) => setBuscaHistorico(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-medium)",
                  background: "var(--bg-card)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {historicoFiltrado.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
              Nenhuma ficha avaliativa encontrada no histórico.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {historicoFiltrado.map((ficha) => (
                <div
                  key={ficha.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 20px",
                    background: "var(--bg-card)",
                    borderRadius: "8px",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        style={{
                          background: ficha.tipo === "Atleta" ? "#dbeafe" : "#dcfce7",
                          color: ficha.tipo === "Atleta" ? "#1e40af" : "#166534",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                        }}
                      >
                        1º AULA {ficha.tipo.toUpperCase()}
                      </span>
                      <strong style={{ fontSize: "1.1rem" }}>{ficha.nomeAluno}</strong>
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                      Data: {ficha.data}
                      {ficha.clube && <span> | Clube: <strong>{ficha.clube}</strong></span>}
                      {ficha.posicao && <span> | Posição: <strong>{ficha.posicao}</strong></span>}
                      {ficha.responsavel && <span> | Responsável: <strong>{ficha.responsavel}</strong></span>}
                      {ficha.dataNascimento && <span> | Nasc.: <strong>{ficha.dataNascimento}</strong></span>}
                      <span> | Soma Mobilidade: <strong>{ficha.somaMobilidade}</strong> | Soma Força: <strong>{ficha.somaForca}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="premium-btn-outline"
                      onClick={() => carregarFichaParaEdicao(ficha)}
                      style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                    >
                      Visualizar / Editar
                    </button>
                    <button
                      className="premium-btn-outline"
                      onClick={() => handleGerarPDF(ficha)}
                      style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                    >
                      <Printer size={16} /> PDF
                    </button>
                    <button
                      className="premium-btn"
                      onClick={() => handleSalvarECriarTreinoA(ficha)}
                      style={{ padding: "6px 12px", fontSize: "0.85rem", background: "#3b82f6" }}
                    >
                      ⚡ Criar Treino A
                    </button>
                    <button
                      className="premium-btn-outline"
                      onClick={() => handleDeletarFicha(ficha.id)}
                      style={{ padding: "6px 10px", color: "#dc2626", borderColor: "#fca5a5" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABAS DE PREENCHIMENTO: ADULTO OU ATLETA */}
      {(activeTab === "Adulto" || activeTab === "Atleta") && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Header Card do Aluno */}
          <div
            style={{
              background: "var(--bg-panel)",
              padding: "20px 24px",
              borderRadius: "12px",
              border: "1px solid var(--border-light)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr auto",
                gap: "16px",
                alignItems: "end",
              }}
            >
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  {activeTab === "Atleta" ? "NOME E SOBRENOME DO ATLETA" : "NOME E SOBRENOME DO ALUNO"}
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder={activeTab === "Atleta" ? "Digite ou selecione o atleta..." : "Digite ou selecione o aluno..."}
                    value={nomeAluno}
                    onChange={(e) => {
                      setNomeAluno(e.target.value);
                      setAlunoSelecionadoId("");
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-medium)",
                      fontSize: "1rem",
                      outline: "none",
                    }}
                  />
                  {alunosList.length > 0 && (
                    <select
                      value={alunoSelecionadoId}
                      onChange={(e) => handleSelectAluno(e.target.value)}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-medium)",
                        background: "var(--bg-card)",
                      }}
                    >
                      <option value="">-- Selecionar Existente --</option>
                      {alunosList.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nome}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  DATA DA AVALIAÇÃO
                </label>
                <input
                  type="text"
                  value={dataAvaliacao}
                  onChange={(e) => setDataAvaliacao(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-medium)",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div style={{ textAlign: "right" }}>
                <button
                  type="button"
                  className="premium-btn-outline"
                  onClick={() => setShowModalLimpar(true)}
                  style={{
                    fontSize: "0.85rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--text-secondary)",
                    borderColor: "var(--border-medium)",
                  }}
                  title="Limpar formulário com opção de salvar e exportar PDF"
                >
                  <Trash2 size={15} /> Limpar Formulário
                </button>
              </div>
            </div>

            {/* Campos exclusivos do Cabeçalho da Ficha Avaliativa do Atleta */}
            {activeTab === "Atleta" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    CLUBE
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Grêmio, Internacional, etc."
                    value={clube}
                    onChange={(e) => setClube(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-medium)",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    POSIÇÃO
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Meia, Atacante, Zagueiro..."
                    value={posicao}
                    onChange={(e) => setPosicao(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-medium)",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    RESPONSÁVEL
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pai, Mãe ou Agente..."
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-medium)",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    DATA DE NASCIMENTO
                  </label>
                  <input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-medium)",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 1: MOBILIDADE AVALIATIVA (FMS - 7 TESTES) */}
          <div style={{ background: "var(--bg-panel)", borderRadius: "12px", padding: "24px", border: "1px solid var(--border-light)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent-primary)", margin: 0 }}>
                  MOBILIDADE AVALIATIVA (FMS)
                </h2>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Functional Movement Screen — Bateria Oficial de 7 Testes (Máx: 21 Pontos)
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                <span>Séries:</span>
                {["1", "2"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeriesMobilidade(s)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-medium)",
                      background: seriesMobilidade === s ? "var(--accent-primary)" : "transparent",
                      color: seriesMobilidade === s ? "#fff" : "var(--text-primary)",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {mobilidade.map((item, idx) => {
                const guide = FMS_GUIDES[item.nome];
                const isExpanded = expandedGuideIndex === idx;

                return (
                  <div
                    key={idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.8fr 1.2fr 1.6fr 1.8fr",
                      gap: "12px",
                      alignItems: "center",
                      padding: "12px",
                      background: "var(--bg-card)",
                      borderRadius: "8px",
                      border: isExpanded ? "1px solid var(--accent-primary)" : "1px solid var(--border-light)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                      <strong style={{ fontSize: "0.95rem" }}>
                        {idx + 1}. {item.nome}
                      </strong>
                      {guide?.padraoNome && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic", lineHeight: "1.2" }}>
                          {guide.padraoNome}
                        </span>
                      )}
                      {guide?.clearingTest && (
                        <div style={{ marginTop: "2px" }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#f59e0b", background: "rgba(245, 158, 11, 0.12)", padding: "2px 6px", borderRadius: "4px", display: "inline-block" }}>
                            ⚠️ Possui Teste de Exclusão de Dor
                          </span>
                        </div>
                      )}

                      {guide && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedGuideIndex(null);
                            } else {
                              setExpandedGuideIndex(idx);
                            }
                          }}
                          style={{
                            marginTop: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: isExpanded ? "var(--accent-primary)" : "var(--bg-panel)",
                            color: isExpanded ? "#fff" : "var(--text-secondary)",
                            border: "1px solid var(--border-medium)",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? "Ocultar Guia FMS" : "Guia de Pontuação FMS"}
                        </button>
                      )}
                    </div>

                    {/* Rating 1 2 3 ou ESQ / DIR */}
                    {renderScoreButtons(mobilidade, setMobilidade, idx)}

                    {/* Reps (8 ou 10 ou custom) + Quadrante ESQ / DIR */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {/* Repetições */}
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                          REP:
                        </span>
                        {["8", "10"].map((r) => {
                          const isSelected = item.reps === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                const next = [...mobilidade];
                                next[idx].reps = isSelected ? "" : r;
                                setMobilidade(next);
                              }}
                              style={{
                                padding: "2px 7px",
                                borderRadius: "4px",
                                border: isSelected ? "1.5px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                                background: isSelected ? "var(--accent-primary)" : "var(--bg-panel)",
                                color: isSelected ? "#fff" : "var(--text-primary)",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {r}
                            </button>
                          );
                        })}
                        <input
                          type="text"
                          placeholder="ex: 8-10"
                          value={item.reps || ""}
                          onChange={(e) => {
                            const next = [...mobilidade];
                            next[idx].reps = e.target.value;
                            setMobilidade(next);
                          }}
                          style={{
                            width: "58px",
                            padding: "2px 6px",
                            fontSize: "0.78rem",
                            borderRadius: "4px",
                            border: "1px solid var(--border-medium)",
                            background: "var(--bg-card)",
                            color: "var(--text-primary)",
                          }}
                        />
                      </div>

                      {/* Quadrante Esquerdo e Direita para testes unilaterais (ex: Mobilidade de Ombro, Avanço, etc) */}
                      {item.esq !== undefined && (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                              {item.nome === "Mobilidade de Ombro" ? "ESQ (cm)" : "ESQ"}
                            </span>
                            <input
                              type="text"
                              placeholder={item.nome === "Mobilidade de Ombro" ? "cm" : "ESQ"}
                              value={item.esq || ""}
                              onChange={(e) => {
                                const next = [...mobilidade];
                                next[idx].esq = e.target.value;
                                setMobilidade(next);
                              }}
                              style={{
                                width: item.nome === "Mobilidade de Ombro" ? "65px" : "52px",
                                padding: "3px 6px",
                                fontSize: "0.8rem",
                                borderRadius: "4px",
                                border: "1px solid var(--border-medium)",
                                background: "var(--bg-card)",
                                color: "var(--text-primary)",
                              }}
                            />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                              {item.nome === "Mobilidade de Ombro" ? "DIR (cm)" : "DIR"}
                            </span>
                            <input
                              type="text"
                              placeholder={item.nome === "Mobilidade de Ombro" ? "cm" : "DIR"}
                              value={item.dir || ""}
                              onChange={(e) => {
                                const next = [...mobilidade];
                                next[idx].dir = e.target.value;
                                setMobilidade(next);
                              }}
                              style={{
                                width: item.nome === "Mobilidade de Ombro" ? "65px" : "52px",
                                padding: "3px 6px",
                                fontSize: "0.8rem",
                                borderRadius: "4px",
                                border: "1px solid var(--border-medium)",
                                background: "var(--bg-card)",
                                color: "var(--text-primary)",
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Anotações */}
                    <input
                      type="text"
                      placeholder={item.nome === "Mobilidade de Ombro" ? "Tamanho da mão (cm) / Observações..." : "Observações / Clearing Test..."}
                      value={item.obs || ""}
                      onChange={(e) => {
                        const next = [...mobilidade];
                        next[idx].obs = e.target.value;
                        setMobilidade(next);
                      }}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid var(--border-medium)",
                        fontSize: "0.85rem",
                      }}
                    />

                    {/* Guia Oficial FMS Específico do Exercício (Collapsible) */}
                    {guide && isExpanded && (
                      <div
                        style={{
                          gridColumn: "1 / -1",
                          marginTop: "10px",
                          padding: "20px",
                          background: "var(--bg-panel)",
                          borderRadius: "12px",
                          border: "1px solid var(--border-medium)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                        }}
                      >
                        {/* Header do Guia */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800 }}>
                              MANUAL OFICIAL FMS
                            </span>
                            <strong style={{ fontSize: "1.05rem", color: "var(--text-primary)" }}>
                              {guide.nomeOficial}
                            </strong>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpandedGuideIndex(null)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--text-secondary)",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontWeight: 600,
                            }}
                          >
                            <ChevronUp size={16} /> Fechar Guia
                          </button>
                        </div>

                        {/* Sub-abas de Navegação do Guia */}
                        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-light)", paddingBottom: "8px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => setGuideTab("criterios")}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              border: guideTab === "criterios" ? "1px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                              background: guideTab === "criterios" ? "var(--accent-primary)" : "var(--bg-card)",
                              color: guideTab === "criterios" ? "#fff" : "var(--text-secondary)",
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <BookOpen size={14} /> Critérios de Pontuação (3, 2, 1, 0)
                          </button>
                          <button
                            type="button"
                            onClick={() => setGuideTab("instrucoes")}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              border: guideTab === "instrucoes" ? "1px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                              background: guideTab === "instrucoes" ? "var(--accent-primary)" : "var(--bg-card)",
                              color: guideTab === "instrucoes" ? "#fff" : "var(--text-secondary)",
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <HelpCircle size={14} /> Instruções Verbais & Roteiro
                          </button>
                          <button
                            type="button"
                            onClick={() => setGuideTab("implicacoes")}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              border: guideTab === "implicacoes" ? "1px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                              background: guideTab === "implicacoes" ? "var(--accent-primary)" : "var(--bg-card)",
                              color: guideTab === "implicacoes" ? "#fff" : "var(--text-secondary)",
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <AlertTriangle size={14} /> Implicações Biomecânicas {guide.clearingTest ? "& Exclusão" : ""}
                          </button>
                        </div>

                        {/* ABA 1: CRITÉRIOS DE PONTUAÇÃO */}
                        {guideTab === "criterios" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {guide.imagemUrl && (
                              <div style={{ textAlign: "center", background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-medium)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                                <img
                                  src={guide.imagemUrl}
                                  alt={guide.nomeOficial}
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: "450px",
                                    borderRadius: "6px",
                                    objectFit: "contain",
                                  }}
                                />
                                {guide.imagemLegenda && (
                                  <div style={{ fontSize: "0.75rem", color: "#52525b", marginTop: "8px", fontWeight: 600 }}>
                                    {guide.imagemLegenda}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Grid dos Critérios Oficiais FMS (0, 1, 2, 3) */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
                              {/* NOTA 0 */}
                              <div style={{ background: "rgba(107, 114, 128, 0.08)", padding: "14px", borderRadius: "8px", borderTop: "4px solid #6b7280" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                  <span style={{ background: "#6b7280", color: "#fff", width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>
                                    0
                                  </span>
                                  <strong style={{ color: "#6b7280", fontSize: "0.95rem" }}>Presença de Dor (Stop)</strong>
                                </div>
                                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                  {guide.criterios.nota0}
                                </p>
                              </div>

                              {/* NOTA 1 */}
                              <div style={{ background: "rgba(239, 68, 68, 0.08)", padding: "14px", borderRadius: "8px", borderTop: "4px solid #ef4444" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                  <span style={{ background: "#ef4444", color: "#fff", width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>
                                    1
                                  </span>
                                  <strong style={{ color: "#ef4444", fontSize: "0.95rem" }}>Disfunção / Compensações</strong>
                                </div>
                                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                  {guide.criterios.nota1.map((c, i) => (
                                    <li key={i}>{c}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* NOTA 2 */}
                              <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: "14px", borderRadius: "8px", borderTop: "4px solid #f59e0b" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                  <span style={{ background: "#f59e0b", color: "#fff", width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>
                                    2
                                  </span>
                                  <strong style={{ color: "#f59e0b", fontSize: "0.95rem" }}>Padrão com Variação/Compensação</strong>
                                </div>
                                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                  {guide.criterios.nota2.map((c, i) => (
                                    <li key={i}>{c}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* NOTA 3 */}
                              <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "14px", borderRadius: "8px", borderTop: "4px solid #10b981" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                  <span style={{ background: "#10b981", color: "#fff", width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>
                                    3
                                  </span>
                                  <strong style={{ color: "#10b981", fontSize: "0.95rem" }}>Padrão Ideal FMS</strong>
                                </div>
                                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                  {guide.criterios.nota3.map((c, i) => (
                                    <li key={i}>{c}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ABA 2: INSTRUÇÕES VERBAIS & DICAS */}
                        {guideTab === "instrucoes" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.85rem" }}>
                            <div style={{ background: "var(--bg-card)", padding: "14px", borderRadius: "8px", borderLeft: "4px solid var(--accent-primary)" }}>
                              <strong style={{ display: "block", color: "var(--text-primary)", marginBottom: "6px" }}>
                                🗣️ Roteiro de Instruções Verbais (O que falar para o aluno):
                              </strong>
                              <ol style={{ margin: 0, paddingLeft: "20px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                                {guide.instrucoes.fala.map((f, i) => (
                                  <li key={i} style={{ marginBottom: "4px" }}>
                                    <strong>{f}</strong>
                                  </li>
                                ))}
                              </ol>
                            </div>

                            <div style={{ background: "var(--bg-card)", padding: "14px", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                              <strong style={{ display: "block", color: "var(--text-primary)", marginBottom: "6px" }}>
                                💡 Dicas Oficiais para o Avaliador:
                              </strong>
                              <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                                {guide.instrucoes.dicas.map((d, i) => (
                                  <li key={i}>{d}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* ABA 3: IMPLICAÇÕES BIOMECÂNICAS & CLEARING TEST */}
                        {guideTab === "implicacoes" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.85rem" }}>
                            <div style={{ background: "var(--bg-card)", padding: "14px", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                              <strong style={{ display: "block", color: "var(--text-primary)", marginBottom: "6px" }}>
                                🎯 Objetivo do Teste:
                              </strong>
                              <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                {guide.implicacoes.objetivo}
                              </p>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                              {guide.implicacoes.fatores.map((fat, i) => (
                                <div key={i} style={{ background: "var(--bg-card)", padding: "14px", borderRadius: "8px", borderLeft: `4px solid ${fat.cor}` }}>
                                  <strong style={{ color: fat.cor, display: "block", marginBottom: "6px" }}>
                                    {fat.titulo}
                                  </strong>
                                  <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                    {fat.desc}
                                  </p>
                                </div>
                              ))}
                            </div>

                            {guide.clearingTest && (
                              <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(245, 158, 11, 0.3)", marginTop: "4px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                <strong style={{ color: "#f59e0b", display: "block", fontSize: "0.95rem" }}>
                                  ⚠️ {guide.clearingTest.nome}
                                </strong>

                                {guide.clearingTest.imagemUrl && (
                                  <div style={{ textAlign: "center", background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-medium)", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
                                    <img
                                      src={guide.clearingTest.imagemUrl}
                                      alt={guide.clearingTest.nome}
                                      style={{
                                        maxWidth: "100%",
                                        maxHeight: "360px",
                                        borderRadius: "6px",
                                        objectFit: "contain",
                                      }}
                                    />
                                    {guide.clearingTest.imagemLegenda && (
                                      <div style={{ fontSize: "0.75rem", color: "#52525b", marginTop: "6px", fontWeight: 600 }}>
                                        {guide.clearingTest.imagemLegenda}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <p style={{ margin: 0, color: "var(--text-primary)", lineHeight: "1.5" }}>
                                  <strong>Instrução:</strong> {guide.clearingTest.instrucao}
                                </p>
                                <p style={{ margin: 0, color: "#ef4444", fontWeight: 700, lineHeight: "1.5" }}>
                                  Regra de Dor: {guide.clearingTest.criterioDor}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CARD DE DIAGNÓSTICO E CLASSIFICAÇÃO OFICIAL FMS */}
            {(() => {
              const diag = calcularClassificacaoFMS(mobilidade);
              return (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "18px 20px",
                    background: diag.bgCor,
                    borderRadius: "12px",
                    border: `1.5px solid ${diag.cor}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, color: "var(--text-secondary)" }}>
                        Diagnóstico Oficial FMS (Functional Movement Screen)
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                        <span style={{ fontSize: "1.5rem", fontWeight: 900, color: diag.cor }}>
                          {diag.total} / 21
                        </span>
                        <span
                          style={{
                            background: diag.cor,
                            color: "#fff",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "0.82rem",
                            fontWeight: 800,
                          }}
                        >
                          {diag.badge}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {diag.titulo}
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: "1.5" }}>
                    {diag.descricao}
                  </p>

                  {/* Assimetrias Bilaterais */}
                  {diag.assimetrias.length > 0 ? (
                    <div style={{ background: "var(--bg-card)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(245, 158, 11, 0.4)" }}>
                      <strong style={{ color: "#f59e0b", fontSize: "0.82rem", display: "block", marginBottom: "4px" }}>
                        ⚠️ Assimetrias Bilaterais Detectadas ({diag.assimetrias.length}):
                      </strong>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {diag.assimetrias.map((a, i) => (
                          <span
                            key={i}
                            style={{
                              background: "rgba(245, 158, 11, 0.12)",
                              border: "1px solid #f59e0b",
                              color: "var(--text-primary)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                            }}
                          >
                            {a.exercicio}: ESQ ({a.esq}) vs DIR ({a.dir})
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>
                      ✓ Nenhuma assimetria bilateral detectada nos testes unilaterais.
                    </div>
                  )}

                  {/* Legenda de Pontuação FMS */}
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "0.75rem", color: "var(--text-secondary)", borderTop: "1px solid var(--border-light)", paddingTop: "10px" }}>
                    <span><strong>0:</strong> Dor / Stop</span>
                    <span><strong>1:</strong> Disfunção</span>
                    <span><strong>2:</strong> Compensação / Prancha</span>
                    <span><strong>3:</strong> Padrão Ideal</span>
                    <span style={{ marginLeft: "auto" }}><strong>Ponto de Corte:</strong> ≤ 14 pontos (Alto Risco)</span>
                  </div>

                  {/* QUADRANTE DINÂMICO DE RECOMENDAÇÕES FMS: BLOQUEADOS & CORRETIVOS */}
                  {(() => {
                    const rec = obterRecomendacoesFMS(mobilidade);
                    return (
                      <div
                        style={{
                          marginTop: "6px",
                          borderTop: "1px solid var(--border-light)",
                          paddingTop: "14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                          <div>
                            <span style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                              <Sparkles size={16} color="var(--accent-primary)" /> Conduta Corretiva & Restrições Baseadas no FMS
                            </span>
                            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                              Prescrição clínica automática gerada em tempo real a partir das notas preenchidas nos testes acima.
                            </span>
                          </div>
                          {rec.temBloqueios && (
                            <button
                              type="button"
                              onClick={() => {
                                const textoCorretivos = rec.corretivos.map(c => `${c.teste}: ${c.exercicios.slice(0, 2).join(", ")}`).join(" | ");
                                const atual = recomendacaoForaTreino ? `${recomendacaoForaTreino} + Corretivos FMS (${textoCorretivos})` : `Corretivos FMS: ${textoCorretivos}`;
                                setRecomendacaoForaTreino(atual);
                                alert("Corretivos FMS adicionados com sucesso ao campo 'Recomendações Fora do Treino'!");
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "1px solid var(--border-medium)",
                                background: "var(--bg-card)",
                                color: "var(--text-primary)",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                              }}
                              title="Adicionar resumo dos corretivos prioritários ao campo Recomendações Fora do Treino"
                            >
                              <Copy size={14} /> Copiar Corretivos para Recomendações
                            </button>
                          )}
                        </div>

                        {!rec.avaliado ? (
                          <div style={{ padding: "16px", background: "var(--bg-card)", borderRadius: "8px", border: "1px dashed var(--border-medium)", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                            ⚪ Preencha as pontuações dos testes acima para que o sistema analise em tempo real os exercícios a evitar e as recomendações corretivas prioritárias.
                          </div>
                        ) : (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px" }}>
                            {/* QUADRANTE 1: BLOQUEADOS / A EVITAR */}
                            <div
                              style={{
                                background: "var(--bg-card)",
                                borderRadius: "10px",
                                border: "1.5px solid rgba(239, 68, 68, 0.45)",
                                padding: "14px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                                boxShadow: "0 2px 6px rgba(239, 68, 68, 0.04)"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(239, 68, 68, 0.2)", paddingBottom: "8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                  <span style={{ background: "#ef4444", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 800 }}>
                                    NÃO CARREGAR DISFUNÇÃO
                                  </span>
                                  <strong style={{ fontSize: "0.9rem", color: "#b91c1c" }}>
                                    Exercícios Bloqueados / A Evitar
                                  </strong>
                                </div>
                              </div>
                              <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                                Pela regra do FMS, evite sobrecarga máxima, velocidade ou repetições até a fadiga nestes movimentos até que o padrão atinja Nota 2 simétrica.
                              </p>

                              {!rec.temBloqueios ? (
                                <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
                                  <div style={{ color: "#15803d", fontWeight: 800, fontSize: "0.9rem", marginBottom: "4px" }}>
                                    🟢 Nenhum Exercício Bloqueado!
                                  </div>
                                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                                    O aluno não apresentou notas 0, notas 1 ou assimetrias nos testes avaliados. Padrões liberados para progressão normal de carga.
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                  {rec.bloqueios.map((b, bIdx) => (
                                    <div
                                      key={bIdx}
                                      style={{
                                        background: b.isDor ? "rgba(220, 38, 38, 0.08)" : "rgba(239, 68, 68, 0.04)",
                                        border: `1px solid ${b.isDor ? "#ef4444" : "rgba(239, 68, 68, 0.25)"}`,
                                        borderRadius: "8px",
                                        padding: "10px 12px",
                                      }}
                                    >
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
                                        <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
                                          {b.teste}
                                        </strong>
                                        <span style={{ fontSize: "0.68rem", fontWeight: 800, background: b.isDor ? "#dc2626" : "rgba(239, 68, 68, 0.15)", color: b.isDor ? "#fff" : "#b91c1c", padding: "1px 6px", borderRadius: "4px" }}>
                                          {b.motivoBadge}
                                        </span>
                                      </div>
                                      <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "6px", fontStyle: "italic" }}>
                                        {b.motivoDesc}
                                      </div>
                                      <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.8rem", color: "#991b1b", lineHeight: "1.45" }}>
                                        {b.exercicios.map((ex, exI) => (
                                          <li key={exI}>
                                            <strong>{ex}</strong>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* QUADRANTE 2: CORRETIVOS RECOMENDADOS */}
                            <div
                              style={{
                                background: "var(--bg-card)",
                                borderRadius: "10px",
                                border: "1.5px solid rgba(59, 130, 246, 0.45)",
                                padding: "14px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                                boxShadow: "0 2px 6px rgba(59, 130, 246, 0.04)"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(59, 130, 246, 0.2)", paddingBottom: "8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                  <span style={{ background: "#2563eb", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 800 }}>
                                    HIERARQUIA OFICIAL FMS
                                  </span>
                                  <strong style={{ fontSize: "0.9rem", color: "#1d4ed8" }}>
                                    Exercícios Corretivos Prioritários
                                  </strong>
                                </div>
                              </div>
                              <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                                Ordem de prescrição do FMS: Mobilidade Pura (1º) → Controle Motor e Core (2º) → Padrões Funcionais Globais (3º).
                              </p>

                              {rec.corretivos.length === 0 ? (
                                <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
                                  <div style={{ color: "#15803d", fontWeight: 800, fontSize: "0.9rem", marginBottom: "4px" }}>
                                    ✨ Padrões Funcionais Preservados!
                                  </div>
                                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                                    Todos os testes avaliados estão funcionais. Mantenha a rotina de aquecimento dinâmico e mobilidade geral de manutenção.
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                  {rec.corretivos.map((c, cIdx) => (
                                    <div
                                      key={cIdx}
                                      style={{
                                        background: "rgba(59, 130, 246, 0.04)",
                                        border: "1px solid rgba(59, 130, 246, 0.25)",
                                        borderRadius: "8px",
                                        padding: "10px 12px",
                                      }}
                                    >
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                                        <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
                                          {c.teste}
                                        </strong>
                                        <span style={{ fontSize: "0.68rem", fontWeight: 800, background: c.isDor ? "rgba(220, 38, 38, 0.15)" : "rgba(37, 99, 235, 0.12)", color: c.isDor ? "#b91c1c" : "#1d4ed8", padding: "1px 6px", borderRadius: "4px" }}>
                                          {c.prioridadeLabel}
                                        </span>
                                      </div>
                                      <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.8rem", color: "#1e3a8a", lineHeight: "1.45" }}>
                                        {c.exercicios.map((ex, exI) => (
                                          <li key={exI}>
                                            <span style={{ color: "var(--text-primary)" }}>{ex}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", textAlign: "center", fontStyle: "italic", marginTop: "2px" }}>
                          💡 Dica FMS: Quando o aluno for reavaliado e alcançar Nota 2 simétrica, o movimento é desbloqueado e liberado para receber carga no treino.
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
          </div>

          {/* SEÇÕES ADICIONAIS DO ATLETA (AQUECIMENTO & POTÊNCIA) */}
          {activeTab === "Atleta" && (
            <>
              {/* Aquecimento Avaliativo */}
              <div style={{ background: "var(--bg-panel)", borderRadius: "12px", padding: "24px", border: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#3b82f6" }}>
                    AQUECIMENTO AVALIATIVO
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                    <span>Séries:</span>
                    {["1", "2"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSeriesAquecimento(s)}
                        style={{
                          padding: "4px 12px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-medium)",
                          background: seriesAquecimento === s ? "#3b82f6" : "transparent",
                          color: seriesAquecimento === s ? "#fff" : "var(--text-primary)",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {aquecimento.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "3fr 1fr 2fr",
                        gap: "12px",
                        alignItems: "center",
                        padding: "12px",
                        background: "var(--bg-card)",
                        borderRadius: "8px",
                        border: "1px solid var(--border-light)",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "0.95rem" }}>
                          {idx + 1}. {item.nome}
                        </strong>
                        {item.regressaoTexto && (
                          <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                            <input
                              type="checkbox"
                              checked={item.regressao || false}
                              onChange={(e) => {
                                const next = [...aquecimento];
                                next[idx].regressao = e.target.checked;
                                setAquecimento(next);
                              }}
                            />{" "}
                            Regressão: {item.regressaoTexto}
                          </label>
                        )}
                      </div>

                      {renderScoreButtons(aquecimento, setAquecimento, idx)}

                      <input
                        type="text"
                        placeholder="Observações..."
                        value={item.obs || ""}
                        onChange={(e) => {
                          const next = [...aquecimento];
                          next[idx].obs = e.target.value;
                          setAquecimento(next);
                        }}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-medium)",
                          fontSize: "0.85rem",
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: "right", marginTop: "14px", fontSize: "1.05rem", fontWeight: 700 }}>
                  Soma Aquecimento: <span style={{ color: "#3b82f6" }}>{calcSoma(aquecimento)}</span>
                </div>
              </div>

              {/* Potência Coordenativa Avaliativa */}
              <div style={{ background: "var(--bg-panel)", borderRadius: "12px", padding: "24px", border: "1px solid var(--border-light)" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#8b5cf6", marginBottom: "16px" }}>
                  POTÊNCIA COORDENATIVA AVALIATIVA
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {potencia.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2.5fr 1fr 1fr 2fr",
                        gap: "12px",
                        alignItems: "center",
                        padding: "12px",
                        background: "var(--bg-card)",
                        borderRadius: "8px",
                        border: "1px solid var(--border-light)",
                      }}
                    >
                      <strong style={{ fontSize: "0.95rem" }}>
                        {idx + 1}. {item.nome}
                      </strong>

                      {renderScoreButtons(potencia, setPotencia, idx)}

                      <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        REP: {item.reps}
                      </span>

                      <input
                        type="text"
                        placeholder="Observações..."
                        value={item.obs || ""}
                        onChange={(e) => {
                          const next = [...potencia];
                          next[idx].obs = e.target.value;
                          setPotencia(next);
                        }}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-medium)",
                          fontSize: "0.85rem",
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: "right", marginTop: "14px", fontSize: "1.05rem", fontWeight: 700 }}>
                  Soma Potência Coordenativa: <span style={{ color: "#8b5cf6" }}>{calcSoma(potencia)}</span>
                </div>
              </div>
            </>
          )}

          {/* SEÇÃO FORÇA FUNCIONAL AVALIATIVA (2 BLOCOS) */}
          <div style={{ background: "var(--bg-panel)", borderRadius: "12px", padding: "24px", border: "1px solid var(--border-light)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--cat-forca)" }}>
                FORÇA FUNCIONAL AVALIATIVA
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                <span>Séries:</span>
                {["2", "3"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeriesForca(s)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-medium)",
                      background: seriesForca === s ? "var(--cat-forca)" : "transparent",
                      color: seriesForca === s ? "#fff" : "var(--text-primary)",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* BLOCO 1 */}
              <div
                style={{
                  background: "var(--bg-card)",
                  padding: "16px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-light)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "8px", borderBottom: "1px solid var(--border-light)" }}>
                  <span style={{ background: "var(--cat-forca)", color: "#fff", padding: "3px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.5px" }}>
                    BLOCO 1
                  </span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                    Agachamento, Apoio e Ponte
                  </strong>
                </div>

                {forcaFuncional.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2.5fr 1fr 1fr 2fr",
                      gap: "12px",
                      alignItems: "center",
                      padding: "10px 12px",
                      background: "var(--bg-panel)",
                      borderRadius: "8px",
                      border: "1px solid var(--border-light)",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>
                        {idx + 1}. {item.nome}
                      </strong>
                      {item.regressaoTexto && (
                        <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                          <input
                            type="checkbox"
                            checked={item.regressao || false}
                            onChange={(e) => {
                              const next = [...forcaFuncional];
                              next[idx].regressao = e.target.checked;
                              setForcaFuncional(next);
                            }}
                          />{" "}
                          Reg: {item.regressaoTexto}
                        </label>
                      )}
                      {item.progressaoTexto && (
                        <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                          <input
                            type="checkbox"
                            checked={item.progressao || false}
                            onChange={(e) => {
                              const next = [...forcaFuncional];
                              next[idx].progressao = e.target.checked;
                              setForcaFuncional(next);
                            }}
                          />{" "}
                          Prog: {item.progressaoTexto}
                        </label>
                      )}
                    </div>

                    {/* Score 1 2 3 */}
                    {renderScoreButtons(forcaFuncional, setForcaFuncional, idx)}

                    {/* Carga & Reps */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>Carga:</span>
                        <input
                          type="text"
                          placeholder="ex: 12kg"
                          value={item.carga || ""}
                          onChange={(e) => {
                            const next = [...forcaFuncional];
                            next[idx].carga = e.target.value;
                            setForcaFuncional(next);
                          }}
                          style={{
                            width: "75px",
                            padding: "4px",
                            fontSize: "0.85rem",
                            borderRadius: "4px",
                            border: "1px solid var(--border-medium)",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        REP: {item.reps}
                      </span>
                    </div>

                    {/* Observações */}
                    <input
                      type="text"
                      placeholder="Observações..."
                      value={item.obs || ""}
                      onChange={(e) => {
                        const next = [...forcaFuncional];
                        next[idx].obs = e.target.value;
                        setForcaFuncional(next);
                      }}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid var(--border-medium)",
                        fontSize: "0.85rem",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* BLOCO 2 */}
              {forcaFuncional.length > 3 && (
                <div
                  style={{
                    background: "var(--bg-card)",
                    padding: "16px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-light)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "8px", borderBottom: "1px solid var(--border-light)" }}>
                    <span style={{ background: "var(--cat-forca)", color: "#fff", padding: "3px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.5px" }}>
                      BLOCO 2
                    </span>
                    <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                      Puxada no TRX e Pressão Vertical
                    </strong>
                  </div>

                  {forcaFuncional.slice(3).map((item, localIdx) => {
                    const idx = localIdx + 3;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2.5fr 1fr 1fr 2fr",
                          gap: "12px",
                          alignItems: "center",
                          padding: "10px 12px",
                          background: "var(--bg-panel)",
                          borderRadius: "8px",
                          border: "1px solid var(--border-light)",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: "0.95rem" }}>
                            {idx + 1}. {item.nome}
                          </strong>
                          {item.regressaoTexto && (
                            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                              <input
                                type="checkbox"
                                checked={item.regressao || false}
                                onChange={(e) => {
                                  const next = [...forcaFuncional];
                                  next[idx].regressao = e.target.checked;
                                  setForcaFuncional(next);
                                }}
                              />{" "}
                              Reg: {item.regressaoTexto}
                            </label>
                          )}
                          {item.progressaoTexto && (
                            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                              <input
                                type="checkbox"
                                checked={item.progressao || false}
                                onChange={(e) => {
                                  const next = [...forcaFuncional];
                                  next[idx].progressao = e.target.checked;
                                  setForcaFuncional(next);
                                }}
                              />{" "}
                              Prog: {item.progressaoTexto}
                            </label>
                          )}
                        </div>

                        {/* Score 1 2 3 */}
                        {renderScoreButtons(forcaFuncional, setForcaFuncional, idx)}

                        {/* Carga & Reps */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>Carga:</span>
                            <input
                              type="text"
                              placeholder="ex: 12kg"
                              value={item.carga || ""}
                              onChange={(e) => {
                                const next = [...forcaFuncional];
                                next[idx].carga = e.target.value;
                                setForcaFuncional(next);
                              }}
                              style={{
                                width: "75px",
                                padding: "4px",
                                fontSize: "0.85rem",
                                borderRadius: "4px",
                                border: "1px solid var(--border-medium)",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                            REP: {item.reps}
                          </span>
                        </div>

                        {/* Observações */}
                        <input
                          type="text"
                          placeholder="Observações..."
                          value={item.obs || ""}
                          onChange={(e) => {
                            const next = [...forcaFuncional];
                            next[idx].obs = e.target.value;
                            setForcaFuncional(next);
                          }}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-medium)",
                            fontSize: "0.85rem",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ textAlign: "right", marginTop: "14px", fontSize: "1.05rem", fontWeight: 700 }}>
              Soma Força Funcional: <span style={{ color: "var(--cat-forca)" }}>{calcSoma(forcaFuncional)}</span>
            </div>
          </div>

          {/* RECOMENDAÇÕES FINAIS */}
          <div style={{ background: "var(--bg-panel)", borderRadius: "12px", padding: "24px", border: "1px solid var(--border-light)" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>Recomendações e Orientações</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Frequência Semanal Recomendada
                </label>
                <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                  {["2x", "2x a 3x", "3x", "4x"].map((opt) => {
                    const isSelected = recomendacaoSemana === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setRecomendacaoSemana(opt)}
                        style={{
                          flex: 1,
                          padding: "6px 4px",
                          borderRadius: "6px",
                          border: isSelected ? "1.5px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                          background: isSelected ? "var(--accent-primary)" : "var(--bg-card)",
                          color: isSelected ? "#fff" : "var(--text-primary)",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="ex: 2x a 3x"
                  value={recomendacaoSemana}
                  onChange={(e) => setRecomendacaoSemana(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-medium)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Tempo de treino
                </label>
                <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                  {["3 meses", "6 meses", "1 ano"].map((opt) => {
                    const isSelected = recomendacaoMinimo === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setRecomendacaoMinimo(opt)}
                        style={{
                          flex: 1,
                          padding: "6px 8px",
                          borderRadius: "6px",
                          border: isSelected ? "1.5px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                          background: isSelected ? "var(--accent-primary)" : "var(--bg-card)",
                          color: isSelected ? "#fff" : "var(--text-primary)",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="ex: 3 meses, 6 meses, 1 ano..."
                  value={recomendacaoMinimo}
                  onChange={(e) => setRecomendacaoMinimo(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-medium)" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                Recomendações fora do Treinamento
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <select
                  value={
                    ["Alongamento Diário", "Caminhada Diária", "Nutricionista", "Alongamento Diário + Caminhada Diária", "Alongamento Diário + Nutricionista", "Caminhada Diária + Nutricionista", "Alongamento Diário + Caminhada Diária + Nutricionista"].includes(recomendacaoForaTreino)
                      ? recomendacaoForaTreino
                      : recomendacaoForaTreino ? "outro" : ""
                  }
                  onChange={(e) => {
                    if (e.target.value !== "outro") {
                      setRecomendacaoForaTreino(e.target.value);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-medium)",
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Selecione uma recomendação...</option>
                  <option value="Alongamento Diário">Alongamento Diário</option>
                  <option value="Caminhada Diária">Caminhada Diária</option>
                  <option value="Nutricionista">Nutricionista</option>
                  <option value="Alongamento Diário + Caminhada Diária">Alongamento Diário + Caminhada Diária</option>
                  <option value="Alongamento Diário + Nutricionista">Alongamento Diário + Nutricionista</option>
                  <option value="Caminhada Diária + Nutricionista">Caminhada Diária + Nutricionista</option>
                  <option value="Alongamento Diário + Caminhada Diária + Nutricionista">Alongamento Diário + Caminhada Diária + Nutricionista</option>
                  <option value="outro">Outro (Personalizado)...</option>
                </select>

                {/* Chips de seleção rápida */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Opções rápidas:</span>
                  {["Alongamento Diário", "Caminhada Diária", "Nutricionista"].map((op) => {
                    const selected = recomendacaoForaTreino.includes(op);
                    return (
                      <button
                        key={op}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            const parts = recomendacaoForaTreino.split(" + ").filter(p => p !== op);
                            setRecomendacaoForaTreino(parts.join(" + "));
                          } else {
                            const current = recomendacaoForaTreino ? recomendacaoForaTreino.split(" + ").filter(Boolean) : [];
                            if (!current.includes(op)) current.push(op);
                            setRecomendacaoForaTreino(current.join(" + "));
                          }
                        }}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "16px",
                          border: selected ? "1px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                          background: selected ? "rgba(16, 185, 129, 0.15)" : "transparent",
                          color: selected ? "var(--accent-primary)" : "var(--text-secondary)",
                          fontSize: "0.78rem",
                          fontWeight: selected ? 700 : 500,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {selected ? "✓ " : "+ "}{op}
                      </button>
                    );
                  })}
                </div>

                {/* Input de texto personalizado */}
                <input
                  type="text"
                  placeholder="Texto da recomendação (ou digite personalizado)..."
                  value={recomendacaoForaTreino}
                  onChange={(e) => setRecomendacaoForaTreino(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-medium)",
                    fontSize: "0.85rem",
                    color: "var(--text-primary)",
                    background: "var(--bg-card)",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                Requer aporte nutricional conforme objetivo?
              </label>
              <div style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                {["Sim, conforme objetivo", "Não necessário", "Encaminhar ao nutricionista"].map((opt) => {
                  const isSelected = aporteNutricional === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAporteNutricional(opt)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: isSelected ? "1.5px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                        background: isSelected ? "var(--accent-primary)" : "var(--bg-card)",
                        color: isSelected ? "#fff" : "var(--text-primary)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                placeholder="ex: Sim / Não / Encaminhar ao nutricionista"
                value={aporteNutricional}
                onChange={(e) => setAporteNutricional(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-medium)" }}
              />
            </div>
          </div>

          {/* BARRA DE AÇÕES (BOTTOM) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 24px",
              background: "var(--bg-panel)",
              borderRadius: "12px",
              border: "1px solid var(--border-light)",
              position: "sticky",
              bottom: "20px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", gap: "12px" }}>
              <button className="premium-btn-outline" onClick={handleSalvarFicha}>
                <Save size={18} /> Salvar Ficha
              </button>
              <button className="premium-btn-outline" onClick={() => handleGerarPDF()}>
                <Printer size={18} /> Imprimir / PDF
              </button>
            </div>

            <button
              className="premium-btn"
              onClick={() => handleSalvarECriarTreinoA()}
              disabled={saving}
              style={{ background: "#10b981", fontSize: "1rem", padding: "12px 24px" }}
            >
              <Sparkles size={20} />
              {saving ? "Gerando..." : "Salvar e Criar Treino A"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO PARA LIMPAR FORMULÁRIO */}
      {showModalLimpar && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px",
          }}
          onClick={() => setShowModalLimpar(false)}
        >
          <div
            style={{
              background: "var(--bg-panel, #1e293b)",
              color: "var(--text-primary, #ffffff)",
              borderRadius: "16px",
              border: "1px solid var(--border-medium, #334155)",
              maxWidth: "520px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "rgba(245, 158, 11, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={24} color="#f59e0b" />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                    Limpar Ficha Avaliativa
                  </h3>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Ficha de {activeTab} {nomeAluno ? `• ${nomeAluno}` : ""}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModalLimpar(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                background: "var(--bg-card, rgba(255,255,255,0.03))",
                borderRadius: "10px",
                padding: "14px 16px",
                marginBottom: "20px",
                border: "1px solid var(--border-light, rgba(255,255,255,0.08))",
              }}
            >
              <p style={{ margin: "0 0 8px 0", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Deseja salvar e exportar o PDF antes de limpar?
              </p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                Você pode salvar esta avaliação no histórico e baixar o relatório oficial em PDF antes de reiniciar os campos em branco, ou pode limpar diretamente sem salvar.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Opção 1: Salvar, Exportar PDF e Limpar */}
              <button
                type="button"
                onClick={handleSalvarExportarELimpar}
                disabled={limpandoSaving}
                className="premium-btn"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "14px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  background: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Download size={18} />
                {limpandoSaving ? "Salvando e Exportando..." : "Salvar, Exportar PDF e Limpar"}
              </button>

              {/* Opção 2: Apenas Limpar */}
              <button
                type="button"
                onClick={handleApenasLimpar}
                disabled={limpandoSaving}
                className="premium-btn-outline"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "12px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "#ef4444",
                  borderColor: "rgba(239, 68, 68, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Trash2 size={16} />
                Apenas Limpar (Sem Salvar)
              </button>

              {/* Opção 3: Cancelar */}
              <button
                type="button"
                onClick={() => setShowModalLimpar(false)}
                disabled={limpandoSaving}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  textAlign: "center",
                  marginTop: "4px",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
