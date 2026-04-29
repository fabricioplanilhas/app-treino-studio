"use client";
import { useState, useEffect } from "react";
import { mockDb, Aluno, TVStatus, Treino } from "@/lib/mockData";
import { Dumbbell, MonitorPlay } from "lucide-react";

export default function AdminPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [session, setSession] = useState<TVStatus[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  const carregarDados = async () => {
    const [alunosData, sessionData] = await Promise.all([
      mockDb.getAlunos(),
      mockDb.getTvSession(),
    ]);
    setAlunos(alunosData);
    setSession(sessionData);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await carregarDados();
      setLoading(false);
    })();

    // Polling para sincronizar estado com TV
    const interval = setInterval(carregarDados, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAlunoContext = async (aluno: Aluno) => {
    const isAtivo = session.find(s => s.alunoId === aluno.id);

    // Se está ativo, remover
    if (isAtivo) {
      const treinoFeito = aluno.treinos.find(t => t.id === isAtivo.treinoAtivoId);
      if (treinoFeito) {
        const dataHoje = new Date().toLocaleDateString('pt-BR');
        if (confirm(`Deseja salvar o treino '${treinoFeito.nomeTreino}' realizado hoje (${dataHoje}) para ${aluno.nome}?`)) {
          const novoHistorico = [...(aluno.historico || []), { data: dataHoje, nomeTreino: treinoFeito.nomeTreino }];
          const updatedAluno = { ...aluno, historico: novoHistorico };
          await mockDb.saveAluno(updatedAluno);

          alert(`${aluno.nome} ${treinoFeito.nomeTreino} ${dataHoje} salvo.`);
        }
      }

      const newSession = session.filter(s => s.alunoId !== aluno.id);
      await mockDb.setTvSession(newSession);
      await carregarDados();
      return;
    }

    // Se NÃO está ativo, precisamos adicionar. 
    if (session.length >= 10) {
      alert("A tela da TV suporta apenas 10 alunos por vez.");
      return;
    }

    if (!aluno.treinos || aluno.treinos.length === 0) {
      alert("Este aluno não possui nenhum treino na sua ficha! Adicione treinos na aba de Planilhas.");
      return;
    }

    let idxRecomendado = 0;
    if (aluno.historico && aluno.historico.length > 0) {
      const ultimo = aluno.historico[aluno.historico.length - 1];
      const indexUltimo = aluno.treinos.findIndex(t => t.nomeTreino === ultimo.nomeTreino);
      if (indexUltimo >= 0) {
        idxRecomendado = (indexUltimo + 1) % aluno.treinos.length;
      }
    }
    const treinoRecomendadoId = aluno.treinos[idxRecomendado]?.id || aluno.treinos[0].id;

    const newSession = [...session, { alunoId: aluno.id, treinoAtivoId: treinoRecomendadoId }];
    await mockDb.setTvSession(newSession);
    await carregarDados();
  };

  const handleMudarTreino = async (alunoId: string, novoTreinoId: string) => {
    const newSession = session.map(s => {
      if (s.alunoId === alunoId) {
        return { ...s, treinoAtivoId: novoTreinoId };
      }
      return s;
    });
    await mockDb.setTvSession(newSession);
    setSession(newSession);
  };

  const handleLimparTV = async () => {
    if (session.length === 0) {
      alert("A TV já está vazia.");
      return;
    }
    if (confirm("Tem certeza que deseja limpar a TV?")) {
      if (confirm("Deseja também SALVAR NO HISTÓRICO os treinos de TODOS que estavam na TV agora?")) {
        const dataHoje = new Date().toLocaleDateString('pt-BR');
        const alunosCopy = await mockDb.getAlunos();

        for (const s of session) {
          const aluno = alunosCopy.find((a: Aluno) => a.id === s.alunoId);
          if (aluno && aluno.treinos) {
            const treinoFeito = aluno.treinos.find((t: Treino) => t.id === s.treinoAtivoId);
            if (treinoFeito) {
              aluno.historico = [...(aluno.historico || []), { data: dataHoje, nomeTreino: treinoFeito.nomeTreino }];
              await mockDb.saveAluno(aluno);
            }
          }
        }
        alert("Histórico de todos os alunos salvo com sucesso!");
      }
      await mockDb.setTvSession([]);
      await carregarDados();
    }
  };

  const alunosFiltrados = alunos
    .filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  if (loading) return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Carregando dados do Supabase...</p>
    </div>
  );

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Painel do Professor</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Controle quais alunos estão treinando agora. (Máximo: {session.length}/10 na TV)</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

          <input
            type="text"
            placeholder="🔎 Buscar aluno..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-medium)',
              outline: 'none', background: 'var(--bg-card)', color: 'var(--text-primary)', width: '200px'
            }}
          />

          <button className="premium-btn-outline" onClick={handleLimparTV} style={{ color: 'var(--cat-explosao)', borderColor: 'var(--cat-explosao)' }}>
            Limpar a TV
          </button>

          <button className="premium-btn" onClick={() => window.open('/tv', '_blank')}>
            <MonitorPlay size={20} />
            Abrir TV Extra
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {alunosFiltrados.map(aluno => {
          const pSession = session.find(s => s.alunoId === aluno.id);
          const isAtivoTV = !!pSession;

          let textHistorico = "Nenhum treino salvo.";
          let idRecomendado = aluno.treinos && aluno.treinos.length > 0 ? aluno.treinos[0].id : "";

          if (aluno.historico && aluno.historico.length > 0 && aluno.treinos && aluno.treinos.length > 0) {
            const ultimo = aluno.historico[aluno.historico.length - 1];
            textHistorico = `Último: ${ultimo.nomeTreino} (${ultimo.data})`;

            const indexUltimo = aluno.treinos.findIndex(t => t.nomeTreino === ultimo.nomeTreino);
            if (indexUltimo >= 0) {
              const idxRecomendado = (indexUltimo + 1) % aluno.treinos.length;
              idRecomendado = aluno.treinos[idxRecomendado]?.id || idRecomendado;
            }
          }

          return (
            <div key={aluno.id} style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              padding: '24px',
              border: isAtivoTV ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
              transition: 'all 0.3s ease'
            }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{aluno.nome}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {textHistorico}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleAlunoContext(aluno)}
                  className={isAtivoTV ? "premium-btn-outline" : "premium-btn"}
                  style={{
                    borderColor: isAtivoTV ? 'var(--cat-explosao)' : undefined,
                    color: isAtivoTV ? 'var(--cat-explosao)' : undefined,
                    padding: '6px 12px',
                    fontSize: '0.85rem'
                  }}
                >
                  {isAtivoTV ? 'Remover da TV' : 'Enviar para TV'}
                </button>
              </div>

              {isAtivoTV && aluno.treinos.length > 0 && (
                <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-panel)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 'bold' }}>Treino do dia na TV:</p>

                  <select
                    style={{
                      width: '100%', padding: '10px',
                      background: 'var(--bg-main)', color: 'var(--text-primary)',
                      border: '1px solid var(--border-medium)', borderRadius: '4px',
                      fontSize: '1rem', cursor: 'pointer', fontWeight: 600
                    }}
                    value={pSession.treinoAtivoId}
                    onChange={(e) => handleMudarTreino(aluno.id, e.target.value)}
                  >
                    {aluno.treinos.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.nomeTreino} {t.id === idRecomendado ? '(Recomendado)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!isAtivoTV && (!aluno.treinos || aluno.treinos.length === 0) && (
                <p style={{ fontSize: '0.85rem', color: 'var(--cat-explosao)', marginTop: '10px' }}>
                  Atenção: Aluno sem treinos cadastrados.
                </p>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
