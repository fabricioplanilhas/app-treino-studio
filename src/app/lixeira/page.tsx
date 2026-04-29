"use client";
import { useState, useEffect } from "react";
import { mockDb, Aluno } from "@/lib/mockData";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";

export default function LixeiraPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarLixeira = async () => {
    setLoading(true);
    const todosDeletados = await mockDb.getAlunosLixeira();
    
    // Auto-purge: verificar se algum passou de 60 dias
    const hoje = new Date();
    const alunosFiltrados = [];
    
    for (const aluno of todosDeletados) {
      if (aluno.deletedAt) {
        const deletedDate = new Date(aluno.deletedAt);
        const diffTime = Math.abs(hoje.getTime() - deletedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 60) {
          // Passou de 60 dias, deletar definitivamente
          await mockDb.deleteAluno(aluno.id);
          continue; // Não adiciona à lista para exibir
        }
      }
      alunosFiltrados.push(aluno);
    }
    
    setAlunos(alunosFiltrados);
    setLoading(false);
  };

  useEffect(() => {
    carregarLixeira();
  }, []);

  const handleRestaurar = async (aluno: Aluno) => {
    if (confirm(`Deseja restaurar o aluno ${aluno.nome}? Ele voltará a aparecer nas planilhas e no painel.`)) {
      await mockDb.restaurarAluno(aluno.id);
      await carregarLixeira();
    }
  };

  const handleDeletarDefinitivo = async (id: string, nome: string) => {
    if (confirm(`CUIDADO: Tem certeza que deseja excluir ${nome} DEFINITIVAMENTE? Esta ação não pode ser desfeita.`)) {
      await mockDb.deleteAluno(id);
      await carregarLixeira();
    }
  };

  const calcularDiasRestantes = (deletedAt?: string) => {
    if (!deletedAt) return 60;
    const hoje = new Date();
    const deletedDate = new Date(deletedAt);
    const diffTime = Math.abs(hoje.getTime() - deletedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 60 - diffDays);
  };

  if (loading) return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Carregando lixeira...</p>
    </div>
  );

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <Link href="/admin" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Voltar ao Painel
        </Link>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Trash2 size={32} color="var(--cat-explosao)" />
          Lixeira de Alunos
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Alunos excluídos ficam aqui por 60 dias antes de serem permanentemente apagados do banco de dados.
        </p>
      </header>

      {alunos.length === 0 ? (
        <div style={{ padding: '40px', background: 'var(--bg-card)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
          <Trash2 size={48} color="var(--border-medium)" style={{ marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Lixeira Vazia</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Nenhum aluno foi excluído recentemente.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {alunos.map(aluno => {
            const diasRestantes = calcularDiasRestantes(aluno.deletedAt);
            const dataExclusao = aluno.deletedAt ? new Date(aluno.deletedAt).toLocaleDateString('pt-BR') : 'Data desconhecida';

            return (
              <div key={aluno.id} style={{
                background: 'var(--bg-card)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{aluno.nome}</h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Excluído em: {dataExclusao}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: diasRestantes < 10 ? 'var(--cat-explosao)' : '#f59e0b', marginTop: '8px', fontWeight: 'bold' }}>
                    ⚠️ {diasRestantes} dias restantes para exclusão definitiva
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => handleRestaurar(aluno)} className="premium-btn-outline" style={{ color: '#10b981', borderColor: '#10b981' }}>
                    <RefreshCw size={18} /> Restaurar
                  </button>
                  <button onClick={() => handleDeletarDefinitivo(aluno.id, aluno.nome)} className="premium-btn" style={{ background: 'var(--cat-explosao)' }}>
                    <Trash2 size={18} /> Deletar Definitivamente
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
