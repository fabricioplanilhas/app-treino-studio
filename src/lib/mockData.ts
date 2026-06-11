import { supabase } from './supabaseClient';

export type CategoriaExercicio = 'Core' | 'Potencia' | 'Forca' | 'Outros';

export type Exercicio = {
  id: string;
  nome: string;
  categoria: CategoriaExercicio;
  series: string;
  reps: string;
  carga: string;
};

export type Treino = {
  id: string;
  nomeTreino: string; // 'A', 'B', 'C'
  exercicios: Exercicio[];
  ordenadoManualmente?: boolean;
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
};

export type BaseTreino = {
  id: string;
  nome: string;
  exercicios: Exercicio[];
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
    exercicios: [
      { id: 'ga_1', nome: 'PRANCHA FRONTAL', categoria: 'Core', series: '3', reps: '30"', carga: '-' },
      { id: 'ga_2', nome: 'AGACHA E SALTA', categoria: 'Potencia', series: '3', reps: '5', carga: '-' },
      { id: 'ga_3', nome: 'AGACHA GB', categoria: 'Forca', series: '4', reps: '10', carga: '50kg' }
    ]
  },
  {
    id: 'global_B',
    nomeTreino: 'Treino B',
    exercicios: [
      { id: 'gb_1', nome: 'ROOL OUT NA BOLA', categoria: 'Core', series: '3', reps: '10', carga: '-' },
      { id: 'gb_2', nome: 'SALTO 1P CXT', categoria: 'Potencia', series: '3', reps: '5/5', carga: '-' },
      { id: 'gb_3', nome: '2DB SUPINO INC', categoria: 'Forca', series: '3', reps: '12', carga: '24kg' }
    ]
  },
  {
    id: 'global_C',
    nomeTreino: 'Treino C',
    exercicios: [
      { id: 'gc_1', nome: 'LIFT BAND', categoria: 'Core', series: '3', reps: '10/10', carga: '-' },
      { id: 'gc_2', nome: 'ARRANQUE', categoria: 'Potencia', series: '3', reps: '6', carga: '30kg' },
      { id: 'gc_3', nome: 'TERRA KT', categoria: 'Forca', series: '4', reps: '8', carga: '80kg' }
    ]
  }
];

export const MODELOS_ESTUDIO: Record<string, Exercicio[]> = {
  "Introdutório Adulto A": [
    { id: 'mod_iaa_1', nome: 'AGACHA G.B', categoria: 'Forca', carga: '', reps: '8', series: '2' },
    { id: 'mod_iaa_2', nome: 'APOIO', categoria: 'Forca', carga: '', reps: '8', series: '2' },
    { id: 'mod_iaa_3', nome: 'PONTE UNI SOLO', categoria: 'Forca', carga: 'P.C', reps: '8/8', series: '2' },
    { id: 'mod_iaa_4', nome: 'PUXADA N. TRX', categoria: 'Forca', carga: 'P.C', reps: '8', series: '2' },
    { id: 'mod_iaa_5', nome: '1DB PRESSÃO VERTICAL', categoria: 'Forca', carga: '', reps: '8/8', series: '2' }
  ],
  "Introdutório Adulto B": [],
  "Introdutório Adulto C": [],
  "Introdutório Atleta A": [],
  "Introdutório Atleta B": [],
  "Introdutório Atleta C": [],
  "Fase 2 Atleta A": [],
  "Fase 2 Atleta B": [],
  "Fase 2 Atleta C": [],
  "Complex": [
    { id: 'mod_cx_1', nome: 'CORE', categoria: 'Core', carga: '', reps: '', series: '' },
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

// ── Helper: convert DB row → Aluno object ──────────────────────

function rowToAluno(row: Record<string, unknown>): Aluno {
  return {
    id: row.id as string,
    nome: row.nome as string,
    foto: row.foto as string | undefined,
    treinos: (row.treinos as Treino[]) || [],
    historico: (row.historico as Historico[]) || [],
    versoesAnteriores: (row.versoes_anteriores as VersaoTreino[]) || [],
    observacoes: (row.observacoes as string) || '',
    faseTreinamento: (row.fase_treinamento as string) || '',
    dataFichaAtual: (row.data_ficha_atual as string) || '',
    status: (row.status as string) || 'ativo',
    deletedAt: (row.deleted_at as string) || undefined,
    alturaCmj: (row.altura_cmj as string) || '',
    semanasConcluidas: typeof row.semanas_concluidas === 'number' ? row.semanas_concluidas : 0,
  };
}

// ── Helper: convert Aluno object → DB row for upsert ──────────

function alunoToRow(aluno: Aluno) {
  return {
    id: aluno.id,
    nome: aluno.nome,
    foto: aluno.foto || null,
    treinos: aluno.treinos || [],
    historico: aluno.historico || [],
    versoes_anteriores: aluno.versoesAnteriores || [],
    observacoes: aluno.observacoes || '',
    fase_treinamento: aluno.faseTreinamento || '',
    data_ficha_atual: aluno.dataFichaAtual || '',
    status: aluno.status || 'ativo',
    deleted_at: aluno.deletedAt || null,
    altura_cmj: aluno.alturaCmj || '',
    semanas_concluidas: aluno.semanasConcluidas || 0,
  };
}

// ── Database Service ──────────────────────────────────────────

export const mockDb = {
  // ─── ALUNOS ─────────────────────────────────────────────────

  getAlunos: async (): Promise<Aluno[]> => {
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
    const { error } = await supabase
      .from('alunos')
      .upsert(alunoToRow(aluno), { onConflict: 'id' });
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
      .order('nome');
    if (error) {
      console.error('Erro ao buscar bases:', error);
      return [];
    }
    return (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      nome: row.nome as string,
      exercicios: (row.exercicios as Exercicio[]) || [],
      created_at: row.created_at as string,
    }));
  },

  saveBase: async (base: BaseTreino): Promise<void> => {
    const { error } = await supabase
      .from('bases_treino')
      .upsert({
        id: base.id,
        nome: base.nome,
        exercicios: base.exercicios,
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

    ex[campo] = valor;

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
};
