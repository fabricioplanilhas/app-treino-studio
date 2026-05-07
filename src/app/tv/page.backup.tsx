"use client";
import React, { useState, useEffect } from "react";
import { mockDb, Aluno, Exercicio } from "@/lib/mockData";
import { Dumbbell } from "lucide-react";

export default function TVPage() {
  const [alunosAtivos, setAlunosAtivos] = useState<(Aluno & { treinoAtualId: string })[]>([]);

  const carregarDados = async () => {
    const [session, todosAlunos] = await Promise.all([
      mockDb.getTvSession(),
      mockDb.getAlunos(),
    ]);
    
    const ativos = session.map(s => {
      const dbAluno = todosAlunos.find(a => a.id === s.alunoId);
      if(dbAluno) {
        return { ...dbAluno, treinoAtualId: s.treinoAtivoId };
      }
      return null;
    }).filter(Boolean) as (Aluno & { treinoAtualId: string })[];

    setAlunosAtivos(ativos);
  };

  useEffect(() => {
    carregarDados();
    // Polling contínuo p/ buscar se o professor ligou um aluno novo
    const interval = setInterval(carregarDados, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCampoChange = async (alunoId: string, treinoId: string, exercicioId: string, campo: 'carga'|'reps'|'series'|'nome', valor: string) => {
    await mockDb.updateCampoExercicio(alunoId, treinoId, exercicioId, campo, valor);
    await carregarDados();
  };

  // Se não tem ninguém
  if (alunosAtivos.length === 0) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <Dumbbell size={80} color="var(--border-medium)" />
        <h1 style={{ color: 'var(--text-secondary)', marginTop: '20px' }}>Rumpel Training</h1>
        <p style={{ color: 'var(--text-muted)' }}>Aguardando o professor enviar os treinos...</p>
      </div>
    );
  }

  // Dinâmica de Grid para TV
  const cols = alunosAtivos.length > 5 ? 5 : alunosAtivos.length;

  const renderExercicioRow = (aluno: Aluno & { treinoAtualId: string }, treino: { id: string; nomeTreino: string; exercicios: Exercicio[] }, ex: Exercicio, badgeColor: string, isLast: boolean) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '2px 0',
      borderBottom: isLast ? 'none' : '1px solid var(--border-light)',
    }}>
      <div style={{ flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ marginBottom: '1px' }}>
          <span style={{
            fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 700,
            color: badgeColor, border: `1px solid ${badgeColor}`,
            padding: '0px 3px', borderRadius: '3px'
          }}>
            {ex.categoria.toUpperCase() === 'FORCA' ? 'FORÇA' : ex.categoria.toUpperCase() === 'POTENCIA' ? 'POTÊNCIA' : ex.categoria}
          </span>
        </div>
        <input
          value={ex.nome}
          onChange={(e) => handleCampoChange(aluno.id, treino.id, ex.id, 'nome', e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            fontWeight: 600,
            lineHeight: 1.2,
            textTransform: 'uppercase',
            letterSpacing: '-0.5px',
            outline: 'none',
            width: '100%',
            padding: 0
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '190px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '1px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Séries</span>
          <input
            value={ex.series}
            onChange={(e) => handleCampoChange(aluno.id, treino.id, ex.id, 'series', e.target.value)}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-primary)',
              fontSize: '0.95rem', fontWeight: 700, width: '30px', textAlign: 'right', outline: 'none'
            }}
          />
        </div>
        <div style={{
          display: 'flex',
          background: '#f3f4f6',
          border: '1px solid #e5e7eb',
          padding: '1px 3px',
          borderRadius: '5px',
          width: '100%',
          justifyContent: 'space-around',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>CARGA</span>
            <input
              value={ex.carga}
              onChange={(e) => handleCampoChange(aluno.id, treino.id, ex.id, 'carga', e.target.value)}
              style={{
                background: 'transparent', border: 'none', color: 'var(--accent-primary)',
                fontSize: '1.1rem', fontWeight: 700, textAlign: 'center',
                width: '110px', outline: 'none'
              }}
              placeholder="-"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>REPS</span>
            <input
              value={ex.reps}
              onChange={(e) => handleCampoChange(aluno.id, treino.id, ex.id, 'reps', e.target.value)}
              style={{
                background: 'transparent', border: 'none', color: 'var(--accent-primary)',
                fontSize: '1.1rem', fontWeight: 700, textAlign: 'center',
                width: '70px', outline: 'none'
              }}
              placeholder="-"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderExercicios = (aluno: Aluno & { treinoAtualId: string }, treino: { id: string; nomeTreino: string; exercicios: Exercicio[] }) => {
    const isComplex = treino.exercicios.some((ex, i, arr) => {
      const isPot = (ex.categoria || '').toUpperCase().includes('POTENCIA') || (ex.categoria || '').toUpperCase().includes('POTÊNCIA');
      if (!isPot) return false;
      return arr.slice(0, i).some(prev => (prev.categoria || '').toUpperCase().includes('FORC') || (prev.categoria || '').toUpperCase().includes('FORÇ'));
    });

    const groups: { label: string | null, exercises: Exercicio[] }[] = [];
    let currentGroup: { label: string | null, exercises: Exercicio[] } = { label: null, exercises: [] };
    
    let forcaCounter = 0;
    let complexBlockCounter = 0;

    treino.exercicios.forEach((ex, exIdx, arr) => {
      const upperCat = (ex.categoria || '').toUpperCase();
      const isForca = upperCat.includes('FORC') || upperCat.includes('FORÇ');
      const prevEx = exIdx > 0 ? arr[exIdx - 1] : null;
      const prevCat = prevEx ? (prevEx.categoria || '').toUpperCase() : '';
      const prevIsForca = prevCat.includes('FORC') || prevCat.includes('FORÇ');

      let startNewBlock = false;
      let newBlockLabel = '';

      if (isForca) {
        forcaCounter++;
        if (isComplex) {
          if (forcaCounter === 1 || !prevIsForca) {
            complexBlockCounter++;
            startNewBlock = true;
            newBlockLabel = `BLOCO ${complexBlockCounter}`;
          }
        } else {
          if (forcaCounter === 1) {
            startNewBlock = true;
            newBlockLabel = 'BLOCO 1';
          } else if (forcaCounter === 4) {
            startNewBlock = true;
            newBlockLabel = 'BLOCO 2';
          }
        }
      }

      if (startNewBlock) {
        if (currentGroup.exercises.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = { label: newBlockLabel, exercises: [ex] };
      } else {
        currentGroup.exercises.push(ex);
      }
    });

    if (currentGroup.exercises.length > 0) {
      groups.push(currentGroup);
    }

    return (
      <>
        {groups.map((group, gIdx) => {
          if (!group.label) {
            return group.exercises.map(ex => {
              const catUpper = (ex.categoria || '').toUpperCase();
              let badgeColor = 'var(--text-secondary)';
              if (catUpper.includes('CORE')) badgeColor = 'var(--cat-core)';
              if (catUpper.includes('POTEN') || catUpper.includes('POTÊNCIA')) badgeColor = 'var(--cat-explosao)';
              if (catUpper.includes('FORC') || catUpper.includes('FORÇ')) badgeColor = 'var(--cat-forca)';
              
              return (
                <div key={ex.id}>
                  {renderExercicioRow(aluno, treino, ex, badgeColor, false)}
                </div>
              );
            });
          }

          return (
            <div key={`group-${gIdx}`} style={{ border: '1.5px solid var(--accent-primary)', borderRadius: '8px', padding: '4px 6px', marginTop: '4px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
                {group.label}
              </div>
              {group.exercises.map((ex, i) => {
                const catUpper = (ex.categoria || '').toUpperCase();
                let badgeColor = 'var(--text-secondary)';
                if (catUpper.includes('CORE')) badgeColor = 'var(--cat-core)';
                if (catUpper.includes('POTEN') || catUpper.includes('POTÊNCIA')) badgeColor = 'var(--cat-explosao)';
                if (catUpper.includes('FORC') || catUpper.includes('FORÇ')) badgeColor = 'var(--cat-forca)';

                return (
                  <div key={ex.id}>
                    {renderExercicioRow(aluno, treino, ex, badgeColor, i === group.exercises.length - 1)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '20px',
      background: 'var(--bg-main)',
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: '20px',
      alignItems: 'stretch'
    }}>
      {alunosAtivos.map(aluno => {
        const treino = aluno.treinos.find(t => t.id === aluno.treinoAtualId) || aluno.treinos[0];
        if (!treino) return null;

        return (
          <div key={aluno.id} style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-light)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header do Card */}
            <div style={{
              background: '#ffffff',
              padding: '6px',
              borderBottom: '3px solid var(--accent-primary)',
              textAlign: 'center',
              position: 'relative'
            }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {aluno.nome}
              </h2>
              <div style={{
                display: 'inline-block', background: 'var(--accent-primary)',
                color: 'white', padding: '1px 6px', borderRadius: '4px',
                fontSize: '0.7rem', fontWeight: 600, marginTop: '3px'
              }}>
                {treino.nomeTreino}
              </div>
              {aluno.alturaCmj && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  right: '6px',
                  transform: 'translateY(-50%)',
                  background: 'var(--cat-explosao)',
                  color: 'white',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 700
                }}>
                  CMJ: {aluno.alturaCmj}cm
                </div>
              )}
            </div>

            {/* Lista de Exercicios */}
            <div style={{ padding: '4px 8px', flex: 1, overflowY: 'auto' }}>
              {renderExercicios(aluno, treino)}
            </div>
          </div>
        );
      })}

      {/* Rumpel Training Watermark */}
      <div style={{ position: 'fixed', bottom: '15px', right: '20px', color: 'var(--text-secondary)', opacity: 0.15, fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none', zIndex: 100 }}>
        <Dumbbell size={24} color="var(--accent-primary)" />
        <span>RUMPEL <span style={{ color: 'var(--accent-primary)' }}>TRAINING</span></span>
      </div>
    </div>
  );
}
