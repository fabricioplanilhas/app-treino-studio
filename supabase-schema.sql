-- =============================================================
-- Supabase Schema for tv-studio-app
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- 1. Tabela de Alunos
-- Armazena tudo do aluno como JSON para manter compatibilidade
-- com a estrutura existente do app (treinos, exercícios, histórico, versões)
CREATE TABLE IF NOT EXISTS alunos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  foto TEXT,
  treinos JSONB DEFAULT '[]'::jsonb,
  historico JSONB DEFAULT '[]'::jsonb,
  versoes_anteriores JSONB DEFAULT '[]'::jsonb,
  observacoes TEXT DEFAULT '',
  fase_treinamento TEXT DEFAULT '',
  data_ficha_atual TEXT DEFAULT '',
  status TEXT DEFAULT 'ativo',
  deleted_at TEXT,
  altura_cmj TEXT DEFAULT '',
  semanas_concluidas INTEGER DEFAULT 0,
  is_introdutorio BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- SCRIPT DE ATUALIZAÇÃO PARA BASES EXISTENTES
-- Se você já rodou o script acima anteriormente, rode apenas isto:
-- ALTER TABLE alunos ADD COLUMN status TEXT DEFAULT 'ativo';
-- ALTER TABLE alunos ADD COLUMN deleted_at TEXT;
-- ALTER TABLE alunos ADD COLUMN is_introdutorio BOOLEAN DEFAULT false;
-- =============================================================

-- 2. Tabela de Sessão da TV
-- Armazena quais alunos estão ativos na TV agora
CREATE TABLE IF NOT EXISTS tv_session (
  id SERIAL PRIMARY KEY,
  aluno_id TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  treino_ativo_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(aluno_id)
);

-- 3. Tabela de Bases de Treino Customizadas
-- Armazena bases reutilizáveis que podem ser importadas para qualquer aluno
CREATE TABLE IF NOT EXISTS bases_treino (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  exercicios JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_alunos_nome ON alunos(nome);
CREATE INDEX IF NOT EXISTS idx_bases_treino_nome ON bases_treino(nome);
CREATE INDEX IF NOT EXISTS idx_tv_session_aluno ON tv_session(aluno_id);

-- 4. Trigger para auto-update de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_alunos_updated_at ON alunos;
CREATE TRIGGER update_alunos_updated_at
  BEFORE UPDATE ON alunos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Desabilitar RLS para simplicidade (estúdio local, sem auth)
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE bases_treino ENABLE ROW LEVEL SECURITY;

-- Políticas abertas (sem autenticação necessária)
CREATE POLICY "Allow all on alunos" ON alunos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tv_session" ON tv_session FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bases_treino" ON bases_treino FOR ALL USING (true) WITH CHECK (true);
