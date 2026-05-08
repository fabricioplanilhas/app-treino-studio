"use client";
import React, { useState, useEffect, useRef } from "react";
import { mockDb, Aluno, Exercicio } from "@/lib/mockData";
import { Dumbbell } from "lucide-react";

export default function TVPage() {
  const [alunosAtivos, setAlunosAtivos] = useState<(Aluno & { treinoAtualId: string })[]>([]);
  const isEditingRef = useRef(false);

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
    // Pausamos o polling se alguém estiver digitando (foco num input)
    const interval = setInterval(() => {
      if (!isEditingRef.current) {
        carregarDados();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleFocus = () => {
    isEditingRef.current = true;
  };

  const handleLocalChange = (alunoId: string, treinoId: string, exercicioId: string, campo: 'carga'|'reps'|'series'|'nome', valor: string) => {
    setAlunosAtivos(prev => prev.map(aluno => {
      if (aluno.id !== alunoId) return aluno;
      return {
        ...aluno,
        treinos: aluno.treinos.map(treino => {
          if (treino.id !== treinoId) return treino;
          return {
            ...treino,
            exercicios: treino.exercicios.map(ex => {
              if (ex.id !== exercicioId) return ex;
              return { ...ex, [campo]: valor };
            })
          };
        })
      };
    }));
  };

  const handleBlurSave = async (alunoId: string, treinoId: string, exercicioId: string, campo: 'carga'|'reps'|'series'|'nome', valor: string) => {
    isEditingRef.current = false;
    await mockDb.updateCampoExercicio(alunoId, treinoId, exercicioId, campo, valor);
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
  const numAlunos = alunosAtivos.length;
  const cols = numAlunos > 8 ? 8 : (numAlunos === 0 ? 1 : numAlunos);
  
  let scale = 1;
  if (cols <= 2) scale = 2.0;
  else if (cols === 3) scale = 1.7;
  else if (cols === 4) scale = 1.4;
  else if (cols <= 6) scale = 1.15;
  else scale = 1;

  const s = (val: number) => `${(val * scale).toFixed(2)}rem`;
  const px = (val: number) => `${Math.round(val * scale)}px`;

  const renderExercicioRow = (aluno: Aluno & { treinoAtualId: string }, treino: { id: string; nomeTreino: string; exercicios: Exercicio[] }, ex: Exercicio, badgeColor: string, isLast: boolean) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: `${px(6)} 0`,
      borderBottom: isLast ? 'none' : '1px solid var(--border-light)',
      gap: px(4)
    }}>
      {/* Nome e Categoria */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: px(2) }}>
          <span style={{
            fontSize: s(0.65), textTransform: 'uppercase', fontWeight: 700,
            color: badgeColor, border: `1px solid ${badgeColor}`,
            padding: `0 ${px(4)}`, borderRadius: px(3)
          }}>
            {ex.categoria.toUpperCase() === 'FORCA' ? 'FORÇA' : ex.categoria.toUpperCase() === 'POTENCIA' ? 'POTÊNCIA' : ex.categoria}
          </span>
        </div>
        <input
          value={ex.nome}
          onFocus={handleFocus}
          onChange={(e) => handleLocalChange(aluno.id, treino.id, ex.id, 'nome', e.target.value)}
          onBlur={(e) => handleBlurSave(aluno.id, treino.id, ex.id, 'nome', e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: s(0.95),
            fontWeight: 800,
            lineHeight: 1.1,
            textTransform: 'uppercase',
            letterSpacing: '-0.5px',
            outline: 'none',
            width: '100%',
            padding: 0
          }}
        />
      </div>

      {/* Controles (Séries, Carga, Reps) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: px(4), marginBottom: px(2), alignSelf: 'flex-end', paddingRight: px(8) }}>
          <span style={{ fontSize: s(0.7), fontWeight: 600, color: 'var(--text-secondary)' }}>Séries</span>
          <input
            value={ex.series}
            onFocus={handleFocus}
            onChange={(e) => handleLocalChange(aluno.id, treino.id, ex.id, 'series', e.target.value)}
            onBlur={(e) => handleBlurSave(aluno.id, treino.id, ex.id, 'series', e.target.value)}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-primary)',
              fontSize: s(0.85), fontWeight: 800, width: px(30), textAlign: 'right', outline: 'none'
            }}
          />
        </div>
        <div style={{
          display: 'flex',
          background: '#f3f4f6',
          border: '1px solid #e5e7eb',
          padding: `${px(2)} ${px(6)}`,
          borderRadius: px(6),
          width: '100%',
          justifyContent: 'space-around',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: s(0.55), color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>CARGA</span>
            <input
              value={ex.carga}
              onFocus={handleFocus}
              onChange={(e) => handleLocalChange(aluno.id, treino.id, ex.id, 'carga', e.target.value)}
              onBlur={(e) => handleBlurSave(aluno.id, treino.id, ex.id, 'carga', e.target.value)}
              style={{
                background: 'transparent', border: 'none', color: 'var(--accent-primary)',
                fontSize: s(1.0), fontWeight: 700, textAlign: 'center',
                width: px(50), outline: 'none'
              }}
              placeholder="-"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: s(0.55), color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>REPS</span>
            <input
              value={ex.reps}
              onFocus={handleFocus}
              onChange={(e) => handleLocalChange(aluno.id, treino.id, ex.id, 'reps', e.target.value)}
              onBlur={(e) => handleBlurSave(aluno.id, treino.id, ex.id, 'reps', e.target.value)}
              style={{
                background: 'transparent', border: 'none', color: 'var(--accent-primary)',
                fontSize: s(1.0), fontWeight: 700, textAlign: 'center',
                width: px(45), outline: 'none'
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
            <div key={`group-${gIdx}`} style={{ border: `${px(1.5)} solid var(--accent-primary)`, borderRadius: px(8), padding: `${px(4)} ${px(6)}`, marginTop: px(4) }}>
              <div style={{ fontSize: s(0.7), fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: px(2) }}>
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
      padding: px(4),
      background: 'var(--bg-main)',
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: px(4),
      alignItems: 'stretch'
    }}>
      {alunosAtivos.map(aluno => {
        const treino = aluno.treinos.find(t => t.id === aluno.treinoAtualId) || aluno.treinos[0];
        if (!treino) return null;

        return (
          <div key={aluno.id} style={{
            background: 'var(--bg-card)',
            borderRadius: px(16),
            border: '1px solid var(--border-light)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header do Card */}
            <div style={{
              background: '#ffffff',
              padding: px(4),
              borderBottom: `${px(3)} solid var(--accent-primary)`,
              textAlign: 'center',
              position: 'relative'
            }}>
              <h2 style={{ fontSize: s(0.9), margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {aluno.nome}
              </h2>
              <div style={{
                display: 'inline-block', background: 'var(--accent-primary)',
                color: 'white', padding: `${px(1)} ${px(4)}`, borderRadius: px(4),
                fontSize: s(0.6), fontWeight: 600, marginTop: px(2)
              }}>
                {treino.nomeTreino}
              </div>
            </div>

            {/* Lista de Exercicios */}
            <div style={{ padding: `${px(4)} ${px(8)}`, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {renderExercicios(aluno, treino)}

              {/* CMJ Highlight no final */}
              {aluno.alturaCmj && (
                <div style={{
                  marginTop: px(12),
                  marginBottom: px(8),
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    background: 'var(--cat-explosao)',
                    color: 'white',
                    padding: `${px(6)} ${px(16)}`,
                    borderRadius: px(8),
                    fontSize: s(0.95),
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    letterSpacing: '1px'
                  }}>
                    CMJ: {aluno.alturaCmj}cm
                  </div>
                </div>
              )}
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
