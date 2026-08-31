import { supabase } from './supabaseClient';

export type CategoriaExercicio = 'Core' | 'Potencia' | 'Forca' | 'Isometria';

export type RegistroCarga = {
  data: string;
  carga: string;
};

export type Exercicio = {
  id: string;
  nome: string;
  categoria: CategoriaExercicio | string;
  series: string;
  reps: string;
  carga: string;
  limitesBlocos?: number[];
  historicoCargas?: RegistroCarga[];
};

export function registrarEvolucaoCargas(ex: Exercicio, novaCarga: string, dataStr?: string, dataFichaStr?: string) {
  const cargaAntiga = (ex.carga || '').trim();
  ex.carga = novaCarga;

  const cargaClean = (novaCarga || '').trim();
  if (!cargaClean || cargaClean === '-') return;

  const hoje = dataStr || new Date().toLocaleDateString('pt-BR');

  if (!ex.historicoCargas) {
    ex.historicoCargas = [];
  }

  if (ex.historicoCargas.length === 0) {
    if (cargaAntiga && cargaAntiga !== '-' && cargaAntiga !== cargaClean) {
      const dataInicial = dataFichaStr || 'Ficha Inicial';
      ex.historicoCargas.push({
        data: dataInicial,
        carga: cargaAntiga
      });
    }
  }

  const ultimoRegistro = ex.historicoCargas[ex.historicoCargas.length - 1];

  if (!ultimoRegistro) {
    ex.historicoCargas.push({
      data: hoje,
      carga: cargaClean
    });
  } else if (ultimoRegistro.data === hoje) {
    ultimoRegistro.carga = cargaClean;
  } else if (ultimoRegistro.carga.trim() !== cargaClean) {
    ex.historicoCargas.push({
      data: hoje,
      carga: cargaClean
    });
  }
}

export function garantirHistoricoCargasAluno(aluno: Aluno) {
  if (!aluno || !aluno.treinos) return;
  const dataFicha = aluno.dataFichaAtual || new Date().toLocaleDateString('pt-BR');

  aluno.treinos.forEach(t => {
    t.exercicios.forEach(ex => {
      const cargaClean = (ex.carga || '').trim();
      if (!cargaClean || cargaClean === '-') return;

      if (!ex.historicoCargas || ex.historicoCargas.length === 0) {
        ex.historicoCargas = [{
          data: dataFicha,
          carga: cargaClean
        }];
      }
    });
  });
}

export type ProtocoloBike = {
  ativo: boolean;
  data?: string;
  teste?: string;
  tempo?: string;
  avg?: string;
  resultados?: string;
};

export type Treino = {
  id: string;
  nomeTreino: string; // 'A', 'B', 'C'
  exercicios: Exercicio[];
  ordenadoManualmente?: boolean;
  protocoloBike?: ProtocoloBike;
  bloco2Desativado?: boolean;
  limiteBloco1?: number;
  bloco3Desativado?: boolean;
  limiteBloco2?: number;
  limitesBlocos?: number[];
};

export type Historico = {
  data: string;
  nomeTreino: string;
};

export type VersaoTreino = {
  id: string; // ID da versão para iterar ou buscar
  dataInicio: string;
  dataTermino: string;
  faseTreinamento: string;
  treinos: Treino[]; // Cópia estática da ficha anterior
};

export type Aluno = {
  id: string;
  nome: string;
  foto?: string;
  treinos: Treino[];
  historico?: Historico[];
  versoesAnteriores?: VersaoTreino[]; // O histórico de versões
  observacoes?: string;
  faseTreinamento?: string;
  dataFichaAtual?: string;
  status?: string;
  deletedAt?: string;
  alturaCmj?: string;
  semanasConcluidas?: number;
  isIntrodutorio?: boolean;
};

export type BaseTreino = {
  id: string;
  nome: string;
  exercicios: Exercicio[];
  limitesBlocos?: number[];
  created_at?: string;
};

export type TVStatus = {
  alunoId: string;
  treinoAtivoId: string; // Qual o ID do treino que ele está fazendo hoje
};

// ── Static Templates (kept local, not in DB) ──────────────────────

export const MOCK_TEMPLATES: Treino[] = [
  {
    id: 'global_A',
    nomeTreino: 'Treino A',
    limitesBlocos: [2],
    exercicios: [
      { id: 'ga_1', nome: 'PRANCHA FRONTAL', categoria: 'Core', series: '3', reps: '30"', carga: '-' },
      { id: 'ga_2', nome: 'AGACHA E SALTA', categoria: 'Potencia', series: '3', reps: '5', carga: '-' },
      { id: 'ga_3', nome: 'AGACHA GB', categoria: 'Forca', series: '4', reps: '10', carga: '50kg' }
    ]
  },
  {
    id: 'global_B',
    nomeTreino: 'Treino B',
    limitesBlocos: [2],
    exercicios: [
      { id: 'gb_1', nome: 'ROOL OUT NA BOLA', categoria: 'Core', series: '3', reps: '10', carga: '-' },
      { id: 'gb_2', nome: 'SALTO 1P CXT', categoria: 'Potencia', series: '3', reps: '5/5', carga: '-' },
      { id: 'gb_3', nome: '2DB SUPINO INC', categoria: 'Forca', series: '3', reps: '12', carga: '24kg' }
    ]
  },
  {
    id: 'global_C',
    nomeTreino: 'Treino C',
    limitesBlocos: [2],
    exercicios: [
      { id: 'gc_1', nome: 'LIFT BAND', categoria: 'Core', series: '3', reps: '10/10', carga: '-' },
      { id: 'gc_2', nome: 'ARRANQUE', categoria: 'Potencia', series: '3', reps: '6', carga: '30kg' },
      { id: 'gc_3', nome: 'TERRA KT', categoria: 'Forca', series: '4', reps: '8', carga: '80kg' }
    ]
  }
];

export const MODELOS_ESTUDIO: Record<string, Exercicio[]> = {
  "Introdutório Adulto A": [
    { id: 'mod_iaa_1', nome: 'AGACHA G.B', categoria: 'Forca', carga: '', reps: '8', series: '2', limitesBlocos: [3] },
    { id: 'mod_iaa_2', nome: 'APOIO', categoria: 'Forca', carga: '', reps: '8', series: '2' },
    { id: 'mod_iaa_3', nome: 'PONTE UNI SOLO', categoria: 'Forca', carga: 'P.C', reps: '8/8', series: '2' },
    { id: 'mod_iaa_4', nome: 'PUXADA N. TRX', categoria: 'Forca', carga: 'P.C', reps: '8', series: '2' },
    { id: 'mod_iaa_5', nome: '1DB PRESSÃO VERTICAL', categoria: 'Forca', carga: '', reps: '8/8', series: '2' }
  ],
  "Introdutório Adulto B": [
    { id: 'mod_iab_1', nome: 'AFUNDO', categoria: 'Forca', carga: '', reps: '8', series: '2', limitesBlocos: [3] },
    { id: 'mod_iab_2', nome: '2DB SUPINO RETO', categoria: 'Forca', carga: '', reps: '8', series: '2' },
    { id: 'mod_iab_3', nome: 'TERRA K.T', categoria: 'Forca', carga: '', reps: '8', series: '2' },
    { id: 'mod_iab_4', nome: 'PUXADA NA POLIA ALTA', categoria: 'Forca', carga: '', reps: '8', series: '2' },
    { id: 'mod_iab_5', nome: 'AGACHA LATERAL', categoria: 'Forca', carga: '', reps: '8/8', series: '2' }
  ],
  "Introdutório Adulto C": [
    { id: 'mod_iac_1', nome: 'CANOA ISO', categoria: 'Core', carga: '', reps: '30"', series: '2', limitesBlocos: [5] },
    { id: 'mod_iac_2', nome: 'CHOP BAND SMJ', categoria: 'Potencia', carga: '', reps: '8/8', series: '2' },
    { id: 'mod_iac_3', nome: 'RECUO', categoria: 'Forca', carga: '', reps: '8/8', series: '2' },
    { id: 'mod_iac_4', nome: '2DB SUPINO RETO', categoria: 'Forca', carga: '', reps: '8', series: '2' },
    { id: 'mod_iac_5', nome: 'AGACHA ROT GB', categoria: 'Forca', carga: '', reps: '8/8', series: '2' },
    { id: 'mod_iac_6', nome: '1 D.B SERROTE', categoria: 'Forca', carga: '', reps: '8/8', series: '2' },
    { id: 'mod_iac_7', nome: 'AVANÇA G.B', categoria: 'Forca', carga: '', reps: '8/8', series: '2' }
  ],
  "Introdutório Atleta A": [
    { id: 'mod_ita_1', nome: 'PRANCHA FRONTAL', categoria: 'Core', series: '2', reps: '35"', carga: '-', limitesBlocos: [5, 8] },
    { id: 'mod_ita_2', nome: 'PRANCHA LAT', categoria: 'Core', series: '2', reps: '35"', carga: '-' },
    { id: 'mod_ita_3', nome: 'AGACHA SALTA STOP', categoria: 'Potencia', series: '2', reps: '10', carga: '-' },
    { id: 'mod_ita_4', nome: 'BOLA LAT SMJ', categoria: 'Potencia', series: '2', reps: '5/5', carga: '-' },
    { id: 'mod_ita_5', nome: 'SALTO 2P', categoria: 'Potencia', series: '2', reps: '10', carga: '-' },
    { id: 'mod_ita_6', nome: 'AGACHA GB', categoria: 'Forca', series: '2', reps: '8', carga: '-' },
    { id: 'mod_ita_7', nome: 'APOIO BARRA', categoria: 'Forca', series: '2', reps: '8', carga: '-' },
    { id: 'mod_ita_8', nome: 'PONTE UNI SOLO', categoria: 'Forca', series: '2', reps: '8', carga: '-' },
    { id: 'mod_ita_9', nome: 'PUXADA N TRX', categoria: 'Forca', series: '2', reps: '8', carga: '-' },
    { id: 'mod_ita_10', nome: '1DB PRESSÃO VERT SMJ', categoria: 'Forca', series: '2', reps: '8', carga: '-' }
  ],
  "Introdutório Atleta B": [
    { id: 'mod_itb_1', nome: 'MATA MOSQUITO', categoria: 'Core', series: '2', reps: '8/8', carga: '-', limitesBlocos: [5, 8] },
    { id: 'mod_itb_2', nome: 'LIFT BAND SMJ', categoria: 'Core', series: '2', reps: '8/8', carga: '-' },
    { id: 'mod_itb_3', nome: 'IMPULSO LATERAL', categoria: 'Potencia', series: '2', reps: '5/5', carga: '-' },
    { id: 'mod_itb_4', nome: 'BOLA BAND SMJ', categoria: 'Potencia', series: '2', reps: '5/5', carga: '-' },
    { id: 'mod_itb_5', nome: 'SALTO 1P CXT/STEP', categoria: 'Potencia', series: '2', reps: '5/5', carga: '-' },
    { id: 'mod_itb_6', nome: 'AFUNDO GB', categoria: 'Forca', series: '2', reps: '8', carga: '-' },
    { id: 'mod_itb_7', nome: '2DB SUPINO INC', categoria: 'Forca', series: '2', reps: '8', carga: '-' },
    { id: 'mod_itb_8', nome: 'TERRA KT', categoria: 'Forca', series: '2', reps: '8', carga: '-' },
    { id: 'mod_itb_9', nome: 'PUXADA POLIA ALTA TRIÂNGULO', categoria: 'Forca', series: '2', reps: '8', carga: '-' },
    { id: 'mod_itb_10', nome: 'AGACHA LAT GB', categoria: 'Forca', series: '2', reps: '8/8', carga: '-' }
  ],
  "Introdutório Atleta C": [],
  "Fase 2 Atleta A": [
    { id: 'mod_f2a_1', nome: 'ROOL OUT BOLA', categoria: 'Core', series: '2', reps: '10', carga: '-', limitesBlocos: [5, 8] },
    { id: 'mod_f2a_2', nome: 'PRANCHA LATERAL ELEVADA', categoria: 'Core', series: '2', reps: '10', carga: '-' },
    { id: 'mod_f2a_3', nome: 'AGACHA E SALTO STOP COM PESO', categoria: 'Potencia', series: '2', reps: '8', carga: '-' },
    { id: 'mod_f2a_4', nome: 'BOLA LATERAL EM PÉ', categoria: 'Potencia', series: '2', reps: '5/5', carga: '-' },
    { id: 'mod_f2a_5', nome: 'SALTO SALTINHO 2P BARREIRINHA', categoria: 'Potencia', series: '2', reps: '5/5', carga: '-' },
    { id: 'mod_f2a_6', nome: 'AGACHA G.B', categoria: 'Forca', series: '2-3', reps: '5', carga: '-' },
    { id: 'mod_f2a_7', nome: 'APOIO ELEVADO', categoria: 'Forca', series: '2-3', reps: '3-4', carga: '-' },
    { id: 'mod_f2a_8', nome: 'PONTE BANCO 1P', categoria: 'Forca', series: '2-3', reps: '5/5', carga: '-' },
    { id: 'mod_f2a_9', nome: 'PUXADA N. TRX PÉ BAIXO', categoria: 'Forca', series: '2', reps: '3-4', carga: '-' },
    { id: 'mod_f2a_10', nome: '1DB PRESSÃO VERTICAL', categoria: 'Forca', series: '2', reps: '3-4', carga: '-' }
  ],
  "Fase 2 Atleta B": [
    { id: 'mod_f2b_1', nome: 'MATA BARATA', categoria: 'Core', series: '2', reps: '10/10', carga: '-', limitesBlocos: [5, 8] },
    { id: 'mod_f2b_2', nome: 'LIFT BAND EM PÉ', categoria: 'Core', series: '2', reps: '10/10', carga: '-' },
    { id: 'mod_f2b_3', nome: 'ARRANQUE DB', categoria: 'Potencia', series: '2', reps: '5/5', carga: '-' },
    { id: 'mod_f2b_4', nome: 'BOLA BANDEJA EM PÉ', categoria: 'Potencia', series: '2', reps: '5/5', carga: '-' },
    { id: 'mod_f2b_5', nome: 'SALTO 1P BARREIRINHA', categoria: 'Potencia', series: '2', reps: '5/5', carga: '-' },
    { id: 'mod_f2b_6', nome: 'AFUNDO GB', categoria: 'Forca', series: '2-3', reps: '5/5', carga: '-' },
    { id: 'mod_f2b_7', nome: '2DB SUPINO INC', categoria: 'Forca', series: '2-3', reps: '3-4', carga: '-' },
    { id: 'mod_f2b_8', nome: 'TERRA 2KT', categoria: 'Forca', series: '2-3', reps: '5', carga: '-' },
    { id: 'mod_f2b_9', nome: 'PUXADA POLIA ALTA TRIÂNGULO', categoria: 'Forca', series: '2-3', reps: '3/4', carga: '-' },
    { id: 'mod_f2b_10', nome: 'AGACHA LATERAL GB', categoria: 'Forca', series: '2-3', reps: '5/5', carga: '-' }
  ],
  "Fase 2 Atleta C": [],
  "Complex": [
    { id: 'mod_cx_1', nome: 'CORE', categoria: 'Core', carga: '', reps: '', series: '', limitesBlocos: [2, 4, 6, 8] },
    { id: 'mod_cx_2', nome: 'CORE', categoria: 'Core', carga: '', reps: '', series: '' },
    { id: 'mod_cx_3', nome: 'FRONT SQUAT', categoria: 'Forca', carga: '', reps: '', series: '' },
    { id: 'mod_cx_4', nome: 'ARRANQUE', categoria: 'Potencia', carga: '', reps: '', series: '' },
    { id: 'mod_cx_7', nome: 'TERRA TPBR', categoria: 'Forca', carga: '', reps: '', series: '' },
    { id: 'mod_cx_8', nome: 'PULO 1P DIRETO ROSA', categoria: 'Potencia', carga: '', reps: '', series: '' },
    { id: 'mod_cx_5', nome: 'SUPINO BARRA', categoria: 'Forca', carga: '', reps: '', series: '' },
    { id: 'mod_cx_6', nome: 'BOLA LATERAL COM PASSO', categoria: 'Potencia', carga: '', reps: '', series: '' },
    { id: 'mod_cx_9', nome: 'SERROTE', categoria: 'Forca', carga: '', reps: '', series: '' },
    { id: 'mod_cx_10', nome: '1DB PRESSÃO V 1P', categoria: 'Forca', carga: '', reps: '', series: '' }
  ]
};

// ── Helper: format student name to Title Case ──────────────────

export function formatNomeAluno(nome: string): string {
  if (!nome) return '';
  const preposicoes = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);
  return nome
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (!word) return '';
      if (index > 0 && preposicoes.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// ── Helper: convert DB row → Aluno object ──────────────────────

function rowToAluno(row: Record<string, unknown>): Aluno {
  const rawObs = (row.observacoes as string) || '';
  const isIntro = Boolean(row.is_introdutorio || row.isIntrodutorio || rawObs.includes('[INTRODUTORIO]'));
  const cleanObs = rawObs.replace(/\[INTRODUTORIO\]/g, '').trim();

  return {
    id: row.id as string,
    nome: formatNomeAluno((row.nome as string) || ''),
    foto: row.foto as string | undefined,
    treinos: (row.treinos as Treino[]) || [],
    historico: (row.historico as Historico[]) || [],
    versoesAnteriores: (row.versoes_anteriores as VersaoTreino[]) || [],
    observacoes: cleanObs,
    faseTreinamento: (row.fase_treinamento as string) || '',
    dataFichaAtual: (row.data_ficha_atual as string) || '',
    status: (row.status as string) || 'ativo',
    deletedAt: (row.deleted_at as string) || undefined,
    alturaCmj: (row.altura_cmj as string) || '',
    semanasConcluidas: typeof row.semanas_concluidas === 'number' ? row.semanas_concluidas : 0,
    isIntrodutorio: isIntro,
  };
}

// ── Helper: convert Aluno object → DB row for upsert ──────────

function alunoToRow(aluno: Aluno) {
  let obs = (aluno.observacoes || '').replace(/\[INTRODUTORIO\]/g, '').trim();
  if (aluno.isIntrodutorio) {
    obs = obs ? `${obs} [INTRODUTORIO]` : '[INTRODUTORIO]';
  }

  return {
    id: aluno.id,
    nome: formatNomeAluno(aluno.nome || ''),
    foto: aluno.foto || null,
    treinos: aluno.treinos || [],
    historico: aluno.historico || [],
    versoes_anteriores: aluno.versoesAnteriores || [],
    observacoes: obs,
    fase_treinamento: aluno.faseTreinamento || '',
    data_ficha_atual: aluno.dataFichaAtual || '',
    status: aluno.status || 'ativo',
    deleted_at: aluno.deletedAt || null,
    altura_cmj: aluno.alturaCmj || '',
    semanas_concluidas: aluno.semanasConcluidas || 0,
  };
}

// Purga automática de alunos na lixeira há mais de 60 dias para economizar espaço do Supabase Free Plan
const autoPurgeLixeira = async (): Promise<void> => {
  try {
    const hoje = new Date();
    const limiteDias = 60;
    const { data, error } = await supabase
      .from('alunos')
      .select('id, deleted_at')
      .eq('status', 'deletado');
      
    if (error || !data) return;
    
    const idsParaDeletar: string[] = [];
    for (const row of data) {
      if (row.deleted_at) {
        const deletedDate = new Date(row.deleted_at as string);
        const diffTime = Math.abs(hoje.getTime() - deletedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > limiteDias) {
          idsParaDeletar.push(row.id as string);
        }
      }
    }
    
    if (idsParaDeletar.length > 0) {
      await supabase
        .from('alunos')
        .delete()
        .in('id', idsParaDeletar);
    }
  } catch (err) {
    console.error('Erro ao executar autoPurgeLixeira:', err);
  }
};

// ── Database Service ──────────────────────────────────────────

export const mockDb = {
  // ─── ALUNOS ─────────────────────────────────────────────────

  getAlunos: async (): Promise<Aluno[]> => {
    // Executa a purga automática em segundo plano
    autoPurgeLixeira().catch(e => console.error('Erro na purga automática:', e));

    const { data, error } = await supabase
      .from('alunos')
      .select('id, nome, foto, treinos, historico, observacoes, fase_treinamento, data_ficha_atual, status, deleted_at, altura_cmj, semanas_concluidas')
      .order('nome');
    if (error) {
      console.error('Erro ao buscar alunos:', error);
      return [];
    }
    return (data || []).map(rowToAluno).filter(a => a.status !== 'deletado');
  },

  getAlunosLixeira: async (): Promise<Aluno[]> => {
    // Executa a purga automática em segundo plano
    autoPurgeLixeira().catch(e => console.error('Erro na purga automática:', e));

    const { data, error } = await supabase
      .from('alunos')
      .select('id, nome, foto, treinos, historico, observacoes, fase_treinamento, data_ficha_atual, status, deleted_at, altura_cmj, semanas_concluidas')
      .order('nome');
    if (error) {
      console.error('Erro ao buscar alunos da lixeira:', error);
      return [];
    }
    return (data || []).map(rowToAluno).filter(a => a.status === 'deletado');
  },

  getAlunoById: async (id: string): Promise<Aluno | null> => {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return rowToAluno(data);
  },

  getAlunosByIds: async (ids: string[]): Promise<Aluno[]> => {
    if (ids.length === 0) return [];
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .in('id', ids);
    if (error) {
      console.error('Erro ao buscar alunos por IDs:', error);
      return [];
    }
    return (data || []).map(rowToAluno);
  },

  saveAluno: async (aluno: Aluno): Promise<void> => {
    // Limita arrays para evitar estourar o limite de 500MB do Supabase Free
    const optimized = { ...aluno };
    
    // Mantém no máximo as últimas 150 entradas de histórico de treinos
    if (optimized.historico && optimized.historico.length > 150) {
      optimized.historico = optimized.historico.slice(-150);
    }
    
    // Mantém no máximo as últimas 8 versões de fichas de treino
    if (optimized.versoesAnteriores && optimized.versoesAnteriores.length > 8) {
      optimized.versoesAnteriores = optimized.versoesAnteriores.slice(-8);
    }

    // Limita o histórico de cargas por exercício a no máximo 20 registros para otimizar o banco Supabase Free
    if (optimized.treinos) {
      optimized.treinos.forEach(t => {
        t.exercicios.forEach(ex => {
          if (ex.historicoCargas && ex.historicoCargas.length > 20) {
            const inicial = ex.historicoCargas[0];
            const recentes = ex.historicoCargas.slice(-19);
            ex.historicoCargas = [inicial, ...recentes];
          }
        });
      });
    }

    const { error } = await supabase
      .from('alunos')
      .upsert(alunoToRow(optimized), { onConflict: 'id' });
    if (error) {
      console.error('Erro ao salvar aluno:', error);
      throw error;
    }
  },

  deleteAluno: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('alunos')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Erro ao deletar aluno:', error);
      throw error;
    }
  },

  moverParaLixeira: async (id: string): Promise<void> => {
    const aluno = await mockDb.getAlunoById(id);
    if (!aluno) return;
    aluno.status = 'deletado';
    aluno.deletedAt = new Date().toISOString();
    await mockDb.saveAluno(aluno);
  },

  restaurarAluno: async (id: string): Promise<void> => {
    const aluno = await mockDb.getAlunoById(id);
    if (!aluno) return;
    aluno.status = 'ativo';
    aluno.deletedAt = undefined;
    await mockDb.saveAluno(aluno);
  },

  // ─── TEMPLATES (local only — não salva no Supabase) ─────────

  getTemplates: (): Treino[] => {
    return JSON.parse(JSON.stringify(MOCK_TEMPLATES));
  },

  // ─── BASES CUSTOMIZADAS (Supabase) ──────────────────────────

  getBases: async (): Promise<BaseTreino[]> => {
    const { data, error } = await supabase
      .from('bases_treino')
      .select('*')
      .not('id', 'like', 'ficha_%')
      .order('nome');
    if (error) {
      console.error('Erro ao buscar bases:', error);
      return [];
    }
    return (data || []).map((row: Record<string, unknown>) => {
      const exArr = (row.exercicios as Exercicio[]) || [];
      const limitesBlocos = (row.limites_blocos || row.limitesBlocos || (exArr.length > 0 ? exArr[0].limitesBlocos : undefined)) as number[] | undefined;
      return {
        id: row.id as string,
        nome: row.nome as string,
        exercicios: exArr,
        limitesBlocos: limitesBlocos ? [...limitesBlocos] : undefined,
        created_at: row.created_at as string,
      };
    });
  },

  saveBase: async (base: BaseTreino): Promise<void> => {
    const exerciciosCopiados = JSON.parse(JSON.stringify(base.exercicios || []));
    if (base.limitesBlocos && exerciciosCopiados.length > 0) {
      exerciciosCopiados[0].limitesBlocos = base.limitesBlocos;
    }
    const { error } = await supabase
      .from('bases_treino')
      .upsert({
        id: base.id,
        nome: base.nome,
        exercicios: exerciciosCopiados,
      }, { onConflict: 'id' });
    if (error) {
      console.error('Erro ao salvar base:', error);
      throw error;
    }
  },

  deleteBase: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('bases_treino')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Erro ao deletar base:', error);
      throw error;
    }
  },

  // ─── TV SESSION ─────────────────────────────────────────────

  getTvSession: async (): Promise<TVStatus[]> => {
    const { data, error } = await supabase
      .from('tv_session')
      .select('*');
    if (error) {
      console.error('Erro ao buscar sessão TV:', error);
      return [];
    }
    return (data || []).map((row: Record<string, unknown>) => ({
      alunoId: row.aluno_id as string,
      treinoAtivoId: row.treino_ativo_id as string,
    }));
  },

  setTvSession: async (newSession: TVStatus[]): Promise<void> => {
    // Limpa a sessão inteira e insere a nova
    const { error: delError } = await supabase
      .from('tv_session')
      .delete()
      .neq('id', 0); // delete all rows
    if (delError) console.error('Erro ao limpar sessão TV:', delError);

    if (newSession.length > 0) {
      const rows = newSession.map(s => ({
        aluno_id: s.alunoId,
        treino_ativo_id: s.treinoAtivoId,
      }));
      const { error: insError } = await supabase
        .from('tv_session')
        .insert(rows);
      if (insError) console.error('Erro ao inserir sessão TV:', insError);
    }
  },

  // ─── UPDATE CAMPO EXERCÍCIO (via Supabase) ──────────────────

  updateCampoExercicio: async (
    alunoId: string,
    treinoId: string,
    exercicioId: string,
    campo: 'carga' | 'reps' | 'series' | 'nome',
    valor: string
  ): Promise<boolean> => {
    const aluno = await mockDb.getAlunoById(alunoId);
    if (!aluno) return false;

    const treino = aluno.treinos.find((t: Treino) => t.id === treinoId);
    if (!treino) return false;

    const ex = treino.exercicios.find((e: Exercicio) => e.id === exercicioId);
    if (!ex) return false;

    if (campo === 'carga') {
      registrarEvolucaoCargas(ex, valor);
    } else {
      ex[campo] = valor;
    }

    await mockDb.saveAluno(aluno);
    return true;
  },

  updateAlturaCmj: async (alunoId: string, valor: string): Promise<boolean> => {
    const aluno = await mockDb.getAlunoById(alunoId);
    if (!aluno) return false;

    aluno.alturaCmj = valor;

    await mockDb.saveAluno(aluno);
    return true;
  },

  updateNomeAluno: async (alunoId: string, valor: string): Promise<boolean> => {
    const aluno = await mockDb.getAlunoById(alunoId);
    if (!aluno) return false;

    aluno.nome = formatNomeAluno(valor);

    await mockDb.saveAluno(aluno);
    return true;
  },

  updateIntrodutorioAluno: async (alunoId: string, valor: boolean): Promise<boolean> => {
    const aluno = await mockDb.getAlunoById(alunoId);
    if (!aluno) return false;

    aluno.isIntrodutorio = valor;

    await mockDb.saveAluno(aluno);
    return true;
  },

  // ─── FICHAS AVALIATIVAS (Supabase Cloud + Local Cache) ─────

  getFichasAvaliativas: async (): Promise<FichaAvaliativa[]> => {
    let fichasCloud: FichaAvaliativa[] = [];
    try {
      const { data, error } = await supabase
        .from('bases_treino')
        .select('*')
        .like('id', 'ficha_%')
        .order('created_at', { ascending: false });

      if (!error && data) {
        fichasCloud = data
          .map((row: Record<string, unknown>) => row.exercicios as FichaAvaliativa)
          .filter(Boolean);
      }
    } catch (err) {
      console.error('Erro ao buscar fichas no Supabase:', err);
    }

    let fichasLocal: FichaAvaliativa[] = [];
    if (typeof window !== 'undefined') {
      try {
        const localData = localStorage.getItem('fichas_avaliativas_v1');
        if (localData) fichasLocal = JSON.parse(localData);
      } catch {}
    }

    const map = new Map<string, FichaAvaliativa>();
    fichasCloud.forEach(f => {
      if (f && f.id) map.set(f.id, f);
    });
    fichasLocal.forEach(f => {
      if (f && f.id && !map.has(f.id)) map.set(f.id, f);
    });

    const listaFinal = Array.from(map.values()).sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('fichas_avaliativas_v1', JSON.stringify(listaFinal));
      } catch {}
    }

    return listaFinal;
  },

  salvarFichaAvaliativa: async (ficha: FichaAvaliativa): Promise<void> => {
    const fichaId = ficha.id.startsWith('ficha_') ? ficha.id : `ficha_${ficha.id}`;
    ficha.id = fichaId;

    // 1. Salva no localStorage local
    if (typeof window !== 'undefined') {
      try {
        const localData = localStorage.getItem('fichas_avaliativas_v1');
        const fichas: FichaAvaliativa[] = localData ? JSON.parse(localData) : [];
        const idx = fichas.findIndex(f => f.id === ficha.id);
        if (idx >= 0) {
          fichas[idx] = ficha;
        } else {
          fichas.unshift(ficha);
        }
        localStorage.setItem('fichas_avaliativas_v1', JSON.stringify(fichas));
      } catch (err) {
        console.error('Erro ao salvar ficha no localStorage:', err);
      }
    }

    // 2. Salva no Supabase (Nuvem em tempo real)
    try {
      await supabase.from('bases_treino').upsert({
        id: fichaId,
        nome: `[FICHA] ${ficha.nomeAluno} - ${ficha.data}`,
        exercicios: ficha,
      }, { onConflict: 'id' });
    } catch (err) {
      console.error('Erro ao salvar ficha no Supabase:', err);
    }
  },

  deletarFichaAvaliativa: async (id: string): Promise<void> => {
    const fichaId = id.startsWith('ficha_') ? id : `ficha_${id}`;

    if (typeof window !== 'undefined') {
      try {
        const localData = localStorage.getItem('fichas_avaliativas_v1');
        if (localData) {
          const fichas: FichaAvaliativa[] = JSON.parse(localData);
          const filtrado = fichas.filter(f => f.id !== id && f.id !== fichaId);
          localStorage.setItem('fichas_avaliativas_v1', JSON.stringify(filtrado));
        }
      } catch {}
    }

    try {
      await supabase.from('bases_treino').delete().eq('id', fichaId);
    } catch (err) {
      console.error('Erro ao deletar ficha no Supabase:', err);
    }
  },

  salvarEGerarTreinoA: async (ficha: FichaAvaliativa): Promise<Aluno> => {
    // 1. Salva a ficha avaliativa no histórico
    await mockDb.salvarFichaAvaliativa(ficha);

    // 2. Busca ou cria o aluno
    const alunos = await mockDb.getAlunos();
    const nomeFormatado = formatNomeAluno(ficha.nomeAluno);
    
    let aluno = alunos.find(a => a.nome.toLowerCase() === nomeFormatado.toLowerCase());

    if (!aluno) {
      aluno = {
        id: 'aluno_' + Date.now(),
        nome: nomeFormatado,
        treinos: [],
        historico: [],
        versoesAnteriores: [],
        observacoes: `Ficha Avaliativa (${ficha.tipo}) realizada em ${ficha.data}`,
        faseTreinamento: `1ª Aula ${ficha.tipo}`,
        dataFichaAtual: ficha.data,
        status: 'ativo'
      };
    } else {
      aluno.dataFichaAtual = ficha.data;
      aluno.faseTreinamento = `1ª Aula ${ficha.tipo}`;
    }

    // 3. Extrai cargas dos exercícios de força da ficha
    const exForcaMap = new Map<string, string>();
    (ficha.forcaFuncional || []).forEach(item => {
      exForcaMap.set(item.nome.trim().toUpperCase(), (item.carga || '').trim());
    });

    const cargaAgachaGB = exForcaMap.get('AGACHAMENTO GB') || exForcaMap.get('AGACHA GB') || exForcaMap.get('AGACHAMENTO') || '-';
    const cargaApoio = exForcaMap.get('APOIO SOLO') || exForcaMap.get('APOIO') || '-';
    const cargaPonte = exForcaMap.get('PONTE 1P SOLO') || exForcaMap.get('PONTE') || '-';
    const cargaPuxada = exForcaMap.get('PUXADA NEUTRA TRX') || exForcaMap.get('PUXADA TRX') || exForcaMap.get('PUXADA NO TRX') || '-';
    const cargaPressao = exForcaMap.get('PRESSÃO VERTICAL') || exForcaMap.get('PRESSAO VERTICAL') || exForcaMap.get('1DB PRESSÃO VERTICAL') || '-';

    // 4. Monta os exercícios para o Treino A
    const exerciciosTreinoA: Exercicio[] = [];

    if (ficha.tipo === 'Atleta') {
      exerciciosTreinoA.push(
        {
          id: 'ex_ta_' + Date.now() + '_1',
          nome: 'PRANCHA FRONTAL',
          categoria: 'Core',
          series: '2',
          reps: '35"',
          carga: '-'
        },
        {
          id: 'ex_ta_' + Date.now() + '_2',
          nome: 'AGACHA SALTA STOP',
          categoria: 'Potencia',
          series: '2',
          reps: '6-8',
          carga: '-'
        },
        {
          id: 'ex_ta_' + Date.now() + '_3',
          nome: 'BOLA LAT SMJ',
          categoria: 'Potencia',
          series: '2',
          reps: '5/5',
          carga: '-'
        }
      );
    }

    // Bloco 1 de Força (Agachamento, Apoio, Ponte)
    exerciciosTreinoA.push(
      {
        id: 'ex_ta_' + Date.now() + '_4',
        nome: 'AGACHA G.B',
        categoria: 'Forca',
        series: ficha.seriesForca || '2',
        reps: '8-10',
        carga: cargaAgachaGB !== '' ? cargaAgachaGB : '-'
      },
      {
        id: 'ex_ta_' + Date.now() + '_5',
        nome: 'APOIO',
        categoria: 'Forca',
        series: ficha.seriesForca || '2',
        reps: '8-10',
        carga: cargaApoio !== '' ? cargaApoio : '-'
      },
      {
        id: 'ex_ta_' + Date.now() + '_6',
        nome: 'PONTE UNI SOLO',
        categoria: 'Forca',
        series: ficha.seriesForca || '2',
        reps: '8-10',
        carga: cargaPonte !== '' ? cargaPonte : '-'
      }
    );

    // Bloco 2 de Força (Puxada no TRX, Pressão Vertical)
    exerciciosTreinoA.push(
      {
        id: 'ex_ta_' + Date.now() + '_7',
        nome: 'PUXADA N. TRX',
        categoria: 'Forca',
        series: ficha.seriesForca || '2',
        reps: '8-10',
        carga: cargaPuxada !== '' ? cargaPuxada : '-'
      },
      {
        id: 'ex_ta_' + Date.now() + '_8',
        nome: '1DB PRESSÃO VERTICAL',
        categoria: 'Forca',
        series: ficha.seriesForca || '2',
        reps: '8-10',
        carga: cargaPressao !== '' ? cargaPressao : '-'
      }
    );

    // Registra evolução de cargas inicial se houver carga definida
    exerciciosTreinoA.forEach(ex => {
      if (ex.carga && ex.carga !== '-') {
        registrarEvolucaoCargas(ex, ex.carga, ficha.data, ficha.data);
      }
    });

    // 5. Atualiza o Treino A do aluno
    const limitesBlocos = ficha.tipo === 'Atleta' ? [3, 6] : [3];

    const novoTreinoA: Treino = {
      id: 'treino_A_' + Date.now(),
      nomeTreino: 'Treino A',
      exercicios: exerciciosTreinoA,
      limitesBlocos: limitesBlocos
    };

    const indexA = aluno.treinos.findIndex(t => t.nomeTreino === 'Treino A');
    if (indexA >= 0) {
      aluno.treinos[indexA] = novoTreinoA;
    } else {
      aluno.treinos.unshift(novoTreinoA);
    }

    garantirHistoricoCargasAluno(aluno);

    // 6. Salva no banco de dados / Supabase
    await mockDb.saveAluno(aluno);

    return aluno;
  }
};

export type ExercicioAvaliativo = {
  nome: string;
  score?: number; // 0 (Dor), 1, 2, 3 or undefined (unselected)
  scoreEsq?: number; // 0, 1, 2, 3 or undefined
  scoreDir?: number; // 0, 1, 2, 3 or undefined
  esq?: string;
  dir?: string;
  regressao?: boolean;
  regressaoTexto?: string;
  progressao?: boolean;
  progressaoTexto?: string;
  carga?: string;
  reps?: string;
  obs?: string;
};

export type FichaAvaliativa = {
  id: string;
  alunoId?: string;
  nomeAluno: string;
  data: string;
  tipo: 'Adulto' | 'Atleta';
  clube?: string;
  posicao?: string;
  responsavel?: string;
  dataNascimento?: string;
  seriesMobilidade: string;
  mobilidade: ExercicioAvaliativo[];
  somaMobilidade: number;
  seriesAquecimento?: string;
  aquecimento?: ExercicioAvaliativo[];
  somaAquecimento?: number;
  potencia?: ExercicioAvaliativo[];
  somaPotencia?: number;
  seriesForca: string;
  forcaFuncional: ExercicioAvaliativo[];
  somaForca: number;
  recomendacaoSemana?: string;
  recomendacaoMinimo?: string;
  recomendacaoForaTreino?: string;
  aporteNutricional?: string;
  createdAt: string;
};

