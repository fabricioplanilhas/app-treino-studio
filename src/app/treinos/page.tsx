"use client";
import { useState, useEffect } from "react";
import { mockDb, Aluno, Treino, Exercicio, MODELOS_ESTUDIO, BaseTreino } from "@/lib/mockData";
import { Save, Plus, Trash2, ArrowLeft, CopyCheck, Eraser, Upload, BookOpen, X, GripVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const getProgressoTreinos = (aluno: Aluno | null) => {
  if (!aluno) {
    return {
      semanasCompletas: 0,
      minContagem: 0,
      treinosRestantes: {} as Record<string, number>,
      totalTreinosRestantes: 0,
      contagemTreinos: {} as Record<string, number>,
      dataRefStr: "",
      treinosFaltandoDetalhado: [] as string[]
    };
  }

  const dataReferenciaStr = aluno.dataFichaAtual || (aluno.historico && aluno.historico.length > 0 ? aluno.historico[0].data : new Date().toLocaleDateString('pt-BR'));
  
  let dataRef: Date | null = null;
  if (dataReferenciaStr) {
    const refParts = dataReferenciaStr.split('/');
    if (refParts.length === 3) {
      dataRef = new Date(parseInt(refParts[2]), parseInt(refParts[1]) - 1, parseInt(refParts[0]));
    }
  }

  const contagemTreinos: Record<string, number> = {};
  if (aluno.treinos) {
    aluno.treinos.forEach(t => {
      contagemTreinos[t.nomeTreino] = 0;
    });
  }

  if (aluno.historico && dataRef) {
    aluno.historico.forEach(h => {
      const hParts = h.data.split('/');
      if (hParts.length !== 3) return;
      const hDate = new Date(parseInt(hParts[2]), parseInt(hParts[1]) - 1, parseInt(hParts[0]));
      if (hDate >= dataRef!) {
        if (contagemTreinos[h.nomeTreino] !== undefined) {
          contagemTreinos[h.nomeTreino]++;
        }
      }
    });
  }

  const contagens = Object.values(contagemTreinos);
  const minContagem = contagens.length > 0 ? Math.min(...contagens) : 0;
  const semanasCompletas = minContagem + (aluno.semanasConcluidas || 0);

  const treinosRestantes: Record<string, number> = {};
  let totalTreinosRestantes = 0;
  const treinosFaltandoDetalhado: string[] = [];

  if (aluno.treinos) {
    aluno.treinos.forEach(t => {
      const realizados = contagemTreinos[t.nomeTreino] || 0;
      const offset = aluno.semanasConcluidas || 0;
      const faltam = Math.max(0, 6 - (realizados + offset));
      treinosRestantes[t.nomeTreino] = faltam;
      totalTreinosRestantes += faltam;
      if (faltam > 0) {
        treinosFaltandoDetalhado.push(`${t.nomeTreino}: ${faltam} restante${faltam > 1 ? 's' : ''}`);
      }
    });
  }

  return {
    semanasCompletas,
    minContagem,
    treinosRestantes,
    totalTreinosRestantes,
    contagemTreinos,
    dataRefStr: dataReferenciaStr,
    treinosFaltandoDetalhado
  };
};

export default function TreinosPage() {
  const router = useRouter();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>("");
  const [alunoAtual, setAlunoAtual] = useState<Aluno | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [busca, setBusca] = useState("");
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [versaoComparacaoId, setVersaoComparacaoId] = useState<string>("");
  const [draggedTab, setDraggedTab] = useState<number | null>(null);
  const [draggedEx, setDraggedEx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [basesCustom, setBasesCustom] = useState<BaseTreino[]>([]);
  const [showBasesModal, setShowBasesModal] = useState(false);
  const [semanasInput, setSemanasInput] = useState<string>("");

  useEffect(() => {
    if (alunoAtual) {
      const prog = getProgressoTreinos(alunoAtual);
      setSemanasInput(prog.semanasCompletas.toString());
    } else {
      setSemanasInput("");
    }
  }, [alunoAtual?.id, alunoAtual?.dataFichaAtual, alunoAtual?.semanasConcluidas]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const todosAlunos = await mockDb.getAlunos();
      setAlunos(todosAlunos);
      const bases = await mockDb.getBases();
      setBasesCustom(bases);
      if(todosAlunos.length > 0) {
        selecionarAluno(todosAlunos[0].id, todosAlunos);
      }
      setLoading(false);
    })();
  }, []);

  // auto-seleciona o primeiro da lista filtrada se o atual sumir da busca
  useEffect(() => {
    const filt = alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()));
    if (filt.length > 0 && !filt.some(a => a.id === selectedAlunoId)) {
        selecionarAluno(filt[0].id, alunos);
    }
  }, [busca, alunos, selectedAlunoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selecionarAluno = async (id: string, listaAlunos: Aluno[] = alunos) => {
    setSelectedAlunoId(id);
    const aluno = listaAlunos.find(a => a.id === id);
    if (aluno) {
      // Busca o aluno completo do Supabase (para obter as versoes_anteriores que foram omitidas na listagem inicial)
      try {
        const fullAluno = await mockDb.getAlunoById(id);
        if (fullAluno) {
          setAlunoAtual(fullAluno);
        } else {
          setAlunoAtual(JSON.parse(JSON.stringify(aluno)));
        }
      } catch (err) {
        console.error("Erro ao buscar detalhes do aluno:", err);
        setAlunoAtual(JSON.parse(JSON.stringify(aluno)));
      }
      setActiveTab(0);
    } else {
      setAlunoAtual(null);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    selecionarAluno(e.target.value);
  };

  const handleUpdateProtocolo = (campo: string, valor: any) => {
    if (!alunoAtual) return;
    const newAluno = { ...alunoAtual };
    const currentTreino = newAluno.treinos[activeTab];
    if (!currentTreino.protocoloBike) {
      currentTreino.protocoloBike = { ativo: false, data: '', teste: '', tempo: '', avg: '', resultados: '' };
    }
    (currentTreino.protocoloBike as any)[campo] = valor;
    setAlunoAtual(newAluno);
  };

  const saveAluno = async () => {
    if(alunoAtual) {
      await mockDb.saveAluno(alunoAtual);
      // Atualiza a lista master
      const updated = await mockDb.getAlunos();
      setAlunos(updated);
      alert("Ficha do aluno salva com sucesso!");
    }
  };

  const aplicarFichaInicial = () => {
    if(!alunoAtual) return;
    if(alunoAtual.treinos.length > 0) {
      if(!confirm("Este aluno já tem treinos. Deseja substituir tudo pela Ficha Inicial?")) {
        return;
      }
    }
    const templates = mockDb.getTemplates();
    const novosTreinos = JSON.parse(JSON.stringify(templates)).map((t: Treino, idx: number) => {
        t.id = `t${alunoAtual.id}_${Date.now()}_${idx}`;
        t.exercicios.forEach(ex => ex.id = `ex_${Date.now()}_${Math.random()}`);
        t.ordenadoManualmente = false;
        return t;
    });

    setAlunoAtual({ ...alunoAtual, treinos: novosTreinos });
    setActiveTab(0);
  };

  const getPesoCategoria = (cat: string) => {
    const upper = (cat || '').toUpperCase();
    if (upper.includes('CORE')) return 1;
    // Força e Potência agrupados com mesmo peso para permitir intercalar no modelo Complex
    // O sort estável manterá a ordem manual definida pelo usuário.
    if (upper.includes('POTENCIA') || upper.includes('POTÊNCIA') || upper.includes('FORCA') || upper.includes('FORÇA')) return 2;
    return 3;
  };

  const handleExercicioChange = (treinoIndex: number, exIndex: number, field: keyof Exercicio, value: string) => {
    if(!alunoAtual) return;
    const newAluno = { ...alunoAtual };
    const treino = newAluno.treinos[treinoIndex];

    if (treino.limitesBlocos === undefined) {
      treino.limitesBlocos = getBlockLimits(treino);
      treino.bloco2Desativado = undefined;
      treino.bloco3Desativado = undefined;
      treino.limiteBloco1 = undefined;
      treino.limiteBloco2 = undefined;
    }

    treino.exercicios[exIndex] = {
      ...treino.exercicios[exIndex],
      [field]: value
    };
    
    setAlunoAtual(newAluno);
  };

  const adicionarExercicio = (treinoIndex: number) => {
    if(!alunoAtual) return;
    const newAluno = { ...alunoAtual };
    const newId = `ex_${Date.now()}_${Math.random()}`;
    const treino = newAluno.treinos[treinoIndex];

    if (treino.limitesBlocos === undefined) {
      treino.limitesBlocos = getBlockLimits(treino);
      treino.bloco2Desativado = undefined;
      treino.bloco3Desativado = undefined;
      treino.limiteBloco1 = undefined;
      treino.limiteBloco2 = undefined;
    }

    treino.exercicios.push({
      id: newId,
      nome: "",
      categoria: "Outros",
      series: "3",
      reps: "10",
      carga: "-"
    });
    setAlunoAtual(newAluno);
  };

  const getBlockLimits = (treino: any): number[] => {
    if (treino.limitesBlocos !== undefined) {
      return treino.limitesBlocos;
    }
    if (treino.bloco2Desativado) {
      return [];
    }
    
    const forcaIndices: number[] = [];
    treino.exercicios.forEach((ex: any, idx: number) => {
      const cat = (ex.categoria || '').toUpperCase();
      if (cat.includes('FORC') || cat.includes('FORÇ')) {
        forcaIndices.push(idx + 1);
      }
    });
    
    if (forcaIndices.length === 0) {
      return [];
    }
    
    const limit1Forca = treino.limiteBloco1 !== undefined ? treino.limiteBloco1 : 3;
    const bloco3Desativado = treino.bloco3Desativado !== false;
    
    const limit1Index = forcaIndices[Math.min(limit1Forca, forcaIndices.length) - 1];
    
    if (bloco3Desativado) {
      return [0, limit1Index];
    }
    
    const limit2Forca = treino.limiteBloco2 !== undefined ? treino.limiteBloco2 : (limit1Forca + 3);
    const limit2Index = forcaIndices[Math.min(limit2Forca, forcaIndices.length) - 1];
    
    return [0, limit1Index, limit2Index];
  };

  const adicionarBloco = (treinoIndex: number) => {
    if(!alunoAtual) return;
    const newAluno = { ...alunoAtual };
    const treino = newAluno.treinos[treinoIndex];
    const N = treino.exercicios.length;

    let limits = [...getBlockLimits(treino)];

    if (limits.length === 0) {
      limits = [0];
    }

    const lastLimit = limits[limits.length - 1];
    if (N < lastLimit) {
      limits[limits.length - 1] = N;
    } else {
      limits.push(N);
    }

    treino.exercicios.push({
      id: `ex_${Date.now()}_${Math.random()}`,
      nome: "",
      categoria: "Forca",
      series: "3",
      reps: "10",
      carga: "-"
    });

    treino.limitesBlocos = limits;
    treino.bloco2Desativado = undefined;
    treino.bloco3Desativado = undefined;
    treino.limiteBloco1 = undefined;
    treino.limiteBloco2 = undefined;

    setAlunoAtual(newAluno);
  };

  const removerBloco = (treinoIndex: number, limitIndex: number) => {
    if(!alunoAtual) return;
    const blockLabel = `BLOCO ${limitIndex + 1}`;
    const targetLabel = limitIndex === 0 ? 'exercícios acima do bloco' : `BLOCO ${limitIndex}`;
    if (confirm(`Deseja deletar a divisão do ${blockLabel}? Todos os exercícios passarão a fazer parte do ${targetLabel}.`)) {
      const newAluno = { ...alunoAtual };
      const treino = newAluno.treinos[treinoIndex];
      const limits = [...getBlockLimits(treino)];
      
      limits.splice(limitIndex, 1);
      
      treino.limitesBlocos = limits;
      treino.bloco2Desativado = undefined;
      treino.bloco3Desativado = undefined;
      treino.limiteBloco1 = undefined;
      treino.limiteBloco2 = undefined;
      
      setAlunoAtual(newAluno);
    }
  };

  const removerExercicio = (treinoIndex: number, exIndex: number) => {
    if (confirm("Remover este exercício?")) {
      if(!alunoAtual) return;
      const newAluno = { ...alunoAtual };
      const treino = newAluno.treinos[treinoIndex];

      const limits = [...getBlockLimits(treino)];

      treino.exercicios.splice(exIndex, 1);

      const newLimits = limits.map(limit => {
        if (limit > exIndex) {
          return limit - 1;
        }
        return limit;
      }).filter((limit, idx, arr) => {
        if (limit < 0) return false;
        if (limit >= treino.exercicios.length) return false;
        if (idx > 0 && limit <= arr[idx - 1]) return false;
        return true;
      });

      treino.limitesBlocos = newLimits;
      treino.bloco2Desativado = undefined;
      treino.bloco3Desativado = undefined;
      treino.limiteBloco1 = undefined;
      treino.limiteBloco2 = undefined;

      setAlunoAtual(newAluno);
    }
  };

  const adicionarNovoTreino = () => {
     if(!alunoAtual) return;
     const newAluno = { ...alunoAtual };
     const sigla = String.fromCharCode(65 + newAluno.treinos.length); // A, B, C...
     newAluno.treinos.push({
         id: `t_${Date.now()}`,
         nomeTreino: `Treino ${sigla}`,
         exercicios: []
     });
     setAlunoAtual(newAluno);
     setActiveTab(newAluno.treinos.length - 1);
  };

  const removerTreinoTodo = (treinoIndex: number) => {
      if(confirm("Tem certeza que deseja apagar a ficha inteira desse dia?")) {
         if(!alunoAtual) return;
         const newAluno = { ...alunoAtual };
         newAluno.treinos.splice(treinoIndex, 1);
         setAlunoAtual(newAluno);
         setActiveTab(Math.max(0, treinoIndex - 1));
      }
  }

  const limparTreinoEstrutura = (treinoIndex: number) => {
      if(confirm("Deseja apagar as cargas, repetições e nomes dos exercícios mantendo a estrutura (categorias)?")) {
         if(!alunoAtual) return;
         const newAluno = { ...alunoAtual };
         newAluno.treinos[treinoIndex].exercicios = newAluno.treinos[treinoIndex].exercicios.map((ex) => ({
             ...ex,
             nome: "",
             series: "",
             reps: "",
             carga: ""
         }));
         setAlunoAtual(newAluno);
      }
  };

  const handleDropTab = (dropIndex: number) => {
    if (draggedTab === null || draggedTab === dropIndex || !alunoAtual) return;
    const newAluno = { ...alunoAtual };
    const items = Array.from(newAluno.treinos);
    const [reorderedItem] = items.splice(draggedTab, 1);
    items.splice(dropIndex, 0, reorderedItem);
    newAluno.treinos = items;
    setAlunoAtual(newAluno);
    setActiveTab(dropIndex);
    setDraggedTab(null);
  };

  const handleDropExercicio = (treinoIndex: number, dropIndex: number) => {
    if (draggedEx === null || draggedEx === dropIndex || !alunoAtual) return;
    const newAluno = { ...alunoAtual };
    const treino = newAluno.treinos[treinoIndex];
    const items = Array.from(treino.exercicios);

    let limits = [...getBlockLimits(treino)];

    const srcIndex = draggedEx;
    const destIndex = dropIndex;

    const getBlockIndex = (index: number, isDrop: boolean) => {
      let blockIndex = -1; // -1 significa acima do BLOCO 1
      for (let i = 0; i < limits.length; i++) {
        if (isDrop && draggedEx > dropIndex && index === limits[i]) {
          break;
        }
        if (index >= limits[i]) {
          blockIndex = i;
        }
      }
      return blockIndex;
    };

    const srcBlockIndex = getBlockIndex(srcIndex, false);
    const destBlockIndex = getBlockIndex(destIndex, true);

    if (srcBlockIndex !== destBlockIndex) {
      if (srcBlockIndex < destBlockIndex) {
        for (let i = srcBlockIndex + 1; i <= destBlockIndex; i++) {
          limits[i]--;
        }
      } else if (srcBlockIndex > destBlockIndex) {
        for (let i = destBlockIndex + 1; i <= srcBlockIndex; i++) {
          limits[i]++;
        }
      }
    }

    const totalExercises = items.length;

    // Sanitize limits
    if (limits.length > 0) {
      limits[0] = Math.max(0, limits[0]);
      for (let i = 1; i < limits.length; i++) {
        limits[i] = Math.max(limits[i - 1] + 1, limits[i]);
      }
      
      let maxLimit = totalExercises - 1;
      for (let i = limits.length - 1; i >= 0; i--) {
        if (limits[i] > maxLimit) {
          limits[i] = maxLimit;
        }
        maxLimit = limits[i] - 1;
      }
      
      limits = limits.filter((val, idx) => {
        if (val < 0) return false;
        if (idx > 0 && val <= limits[idx - 1]) return false;
        return true;
      });
    }

    treino.limitesBlocos = limits;
    treino.bloco2Desativado = undefined;
    treino.bloco3Desativado = undefined;
    treino.limiteBloco1 = undefined;
    treino.limiteBloco2 = undefined;

    const [reorderedItem] = items.splice(draggedEx, 1);
    items.splice(dropIndex, 0, reorderedItem);
    treino.exercicios = items;
    treino.ordenadoManualmente = true;

    setAlunoAtual(newAluno);
    setDraggedEx(null);
  };

  const handleNovoAluno = async () => {
    const nome = window.prompt("Nome do novo aluno (ex: João Santos):");
    if (!nome) return;
    
    const newId = `a_${Date.now()}`;
    const novoAluno: Aluno = {
      id: newId,
      nome,
      treinos: [],
      dataFichaAtual: new Date().toLocaleDateString('pt-BR'),
      historico: [],
      observacoes: "",
      faseTreinamento: ""
    };
    
    await mockDb.saveAluno(novoAluno);
    const updatedAlunos = await mockDb.getAlunos();
    setAlunos(updatedAlunos);
    selecionarAluno(newId, updatedAlunos);
  };

  const alunosVencidos = (() => {
    return alunos.filter(a => {
      if (!a.historico || a.historico.length === 0 || !a.treinos || a.treinos.length === 0) return false;
      const dataReferenciaStr = a.dataFichaAtual || a.historico[0].data;
      const refParts = dataReferenciaStr.split('/');
      if(refParts.length !== 3) return false;
      const dataRef = new Date(parseInt(refParts[2]), parseInt(refParts[1]) - 1, parseInt(refParts[0]));
      
      const contagemTreinos: Record<string, number> = {};
      a.treinos.forEach(t => {
          contagemTreinos[t.nomeTreino] = 0;
      });

      a.historico.forEach(h => {
          const hParts = h.data.split('/');
          if(hParts.length !== 3) return;
          const hDate = new Date(parseInt(hParts[2]), parseInt(hParts[1]) - 1, parseInt(hParts[0]));
          if (hDate >= dataRef) {
              if (contagemTreinos[h.nomeTreino] !== undefined) {
                  contagemTreinos[h.nomeTreino]++;
              }
          }
      });
      
      const contagens = Object.values(contagemTreinos);
      const semanasCompletas = (contagens.length > 0 ? Math.min(...contagens) : 0) + (a.semanasConcluidas || 0);
      
      return semanasCompletas >= 6;
    });
  })();

  const handleLixeira = async () => {
    if (!alunoAtual) return;
    if (confirm(`Tem certeza que deseja mover ${alunoAtual.nome} para a lixeira? (Ele pode ser restaurado em até 60 dias)`)) {
      await mockDb.moverParaLixeira(alunoAtual.id);
      const updatedAlunos = await mockDb.getAlunos();
      setAlunos(updatedAlunos);
      if (updatedAlunos.length > 0) {
        selecionarAluno(updatedAlunos[0].id, updatedAlunos);
      } else {
        setAlunoAtual(null);
        setSelectedAlunoId("");
      }
      alert("Aluno movido para a lixeira.");
    }
  };

  if (loading) return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Carregando dados do Supabase...</p>
    </div>
  );

  if (alunos.length === 0) return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        <button onClick={handleNovoAluno} className="premium-btn">
          <Plus size={20} /> Cadastrar Primeiro Aluno
        </button>
    </div>
  );

  const alunosFiltrados = alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()));
  const progresso = getProgressoTreinos(alunoAtual);

  return (
    <div style={{ padding: '40px', maxWidth: isComparing && versaoComparacaoId ? '1600px' : '1000px', margin: '0 auto', transition: 'max-width 0.3s ease' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <Link href="/" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <ArrowLeft size={16} /> Voltar ao Início
          </Link>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Planilhas dos Alunos</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gerencie as planilhas de treinamento individuais para cada aluno do estúdio.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {alunoAtual && (
            <button onClick={handleLixeira} className="premium-btn-outline" style={{ color: 'var(--cat-explosao)', borderColor: 'var(--cat-explosao)' }}>
              <Trash2 size={20} /> Excluir Aluno
            </button>
          )}
          <button onClick={saveAluno} className="premium-btn">
            <Save size={20} /> Salvar Ficha do Aluno
          </button>
        </div>
      </header>

      {alunosVencidos.length > 0 && (
        <div style={{ background: '#FFEDD5', borderLeft: '5px solid #F97316', padding: '16px', borderRadius: '8px', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#9A3412', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
               ⚠️ Fichas Vencidas (6+ Semanas de Treino)
            </h3>
            <p style={{ margin: 0, color: '#C2410C', fontSize: '0.95rem', lineHeight: '1.5' }}>
               Baseado nas datas de presença, os seguintes alunos precisam de treino novo: <br/>
               <strong>{alunosVencidos.map(a => a.nome).join(', ')}</strong>
            </p>
        </div>
      )}

      {/* SELETOR DE ALUNO */}
      <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Selecionar Aluno:</h3>
        
        <input 
            type="text" 
            placeholder="🔎 Buscar..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ 
              padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-medium)', 
              outline: 'none', background: 'var(--bg-main)', color: 'var(--text-primary)', width: '200px', fontSize: '1rem'
            }}
        />

        <select 
            value={selectedAlunoId} 
            onChange={handleSelectChange}
            style={{ padding: '12px', fontSize: '1.1rem', borderRadius: '8px', border: '1px solid var(--border-medium)', outline: 'none', background: 'var(--bg-main)', flex: 1, maxWidth: '400px' }}
        >
            {alunosFiltrados.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            {alunosFiltrados.length === 0 && <option value="" disabled>Nenhum aluno encontrado</option>}
        </select>

        <button onClick={handleNovoAluno} className="premium-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <Plus size={18} /> Novo Aluno
        </button>
      </div>

      {alunoAtual && (
          <>
            {/* INFORMAÇÕES DO ALUNO */}
            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: '250px' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '8px' }}>
                    OBSERVAÇÕES MÉDICAS / LESÕES
                  </label>
                  <textarea 
                    value={alunoAtual.observacoes || ""} 
                    onChange={(e) => setAlunoAtual({...alunoAtual, observacoes: e.target.value})}
                    placeholder="Ex: Dor no joelho esquerdo, cirurgia no tornozelo recente..."
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-medium)', outline: 'none', background: 'var(--bg-main)', color: 'var(--text-primary)', resize: 'vertical', minHeight: '80px' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '8px' }}>
                    FASE DO TREINAMENTO
                  </label>
                  <input 
                    type="text"
                    value={alunoAtual.faseTreinamento || ""} 
                    onChange={(e) => setAlunoAtual({...alunoAtual, faseTreinamento: e.target.value})}
                    placeholder="Ex: Adaptação, Força..."
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-medium)', outline: 'none', background: 'var(--bg-main)', color: 'var(--text-primary)', marginBottom: '10px' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '4px' }}>
                        ALTURA CMJ (cm)
                      </label>
                      <input 
                        type="number"
                        value={alunoAtual.alturaCmj || ""} 
                        onChange={(e) => setAlunoAtual({...alunoAtual, alturaCmj: e.target.value})}
                        placeholder="Ex: 45.5"
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-medium)', outline: 'none', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div style={{ flex: '0 0 110px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title="SEMANAS CONCLUÍDAS">
                        SEM. CONCLUÍDAS
                      </label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input 
                          type="number"
                          value={semanasInput} 
                          onChange={(e) => {
                            const valStr = e.target.value;
                            setSemanasInput(valStr);
                            
                            const val = parseInt(valStr);
                            if (!isNaN(val) && alunoAtual) {
                              setAlunoAtual({
                                ...alunoAtual,
                                semanasConcluidas: val - progresso.minContagem
                              });
                            }
                          }}
                          onBlur={() => {
                            if (semanasInput === "") {
                              setSemanasInput(progresso.semanasCompletas.toString());
                            }
                          }}
                          placeholder="Ex: 3"
                          title="Alterar total de semanas concluídas"
                          style={{ flex: 1, padding: '12px 4px', borderRadius: '8px', border: '1px solid var(--border-medium)', outline: 'none', background: 'var(--bg-main)', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center', minWidth: '35px' }}
                        />
                        <div style={{
                          padding: '12px 8px', borderRadius: '8px', border: '1px solid var(--border-medium)',
                          background: 'var(--bg-hover)', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem'
                        }}>
                          / 6
                        </div>
                      </div>
                    </div>

                  </div>
                  <button 
                    onClick={() => {
                        if(confirm("Confirmar que este aluno está começando uma FICHA NOVA hoje? Isso irá salvar a ficha atual no histórico como versão passada e zerar a contagem de 6 semanas.")) {
                            const dataAtual = new Date().toLocaleDateString('pt-BR');
                            const novaVersao = {
                                id: `v_${Date.now()}`,
                                dataInicio: alunoAtual.dataFichaAtual || "Desconhecida",
                                dataTermino: dataAtual,
                                faseTreinamento: alunoAtual.faseTreinamento || "-",
                                treinos: JSON.parse(JSON.stringify(alunoAtual.treinos))
                            };
                            const versoes = alunoAtual.versoesAnteriores ? [...alunoAtual.versoesAnteriores] : [];
                            versoes.push(novaVersao);
                            setAlunoAtual({
                                ...alunoAtual,
                                dataFichaAtual: dataAtual,
                                versoesAnteriores: versoes,
                                semanasConcluidas: 0
                            });
                            alert("Cópia da ficha salva no histórico e contagem resetada para hoje!");
                        }
                    }}
                    className="premium-btn-outline" 
                    style={{ marginTop: 'auto', alignSelf: 'flex-start', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', fontSize: '0.9rem' }}
                  >
                    Renovar Ficha (Resetar Semanas)
                  </button>
                </div>
              </div>
            </div>

            {/* PROGRESSO E HISTÓRICO DE TREINOS */}
            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Lado Esquerdo: Progresso */}
                <div style={{ paddingRight: '10px' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    📊 Progresso para Mudança de Ficha (Meta: 6 Semanas)
                  </h3>
                  
                  {/* Progress Bar */}
                  <div style={{ background: 'var(--bg-main)', height: '24px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-medium)', marginBottom: '15px', position: 'relative' }}>
                    <div style={{
                      width: `${Math.min(100, (progresso.semanasCompletas / 6) * 100)}%`,
                      height: '100%',
                      background: progresso.semanasCompletas >= 6 ? '#22c55e' : '#3b82f6',
                      transition: 'width 0.4s ease'
                    }} />
                    <span style={{
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)', mixBlendMode: 'difference'
                    }}>
                      {progresso.semanasCompletas} de 6 semanas ({Math.round(Math.min(100, (progresso.semanasCompletas / 6) * 100))}%)
                    </span>
                  </div>

                  <p style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}>
                    {progresso.semanasCompletas >= 6 ? (
                      <strong style={{ color: '#22c55e' }}>🎉 Meta alcançada! Ficha pronta para renovação.</strong>
                    ) : (
                      <>
                        Faltam <strong>{Math.max(0, 6 - progresso.semanasCompletas)}</strong> semanas de treino.
                      </>
                    )}
                  </p>

                  {/* Faltam Treinos Detalhados */}
                  {progresso.semanasCompletas < 6 && (
                    <div style={{ background: 'var(--bg-main)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Treinos restantes para completar 6 semanas:</p>
                      {progresso.treinosFaltandoDetalhado.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem' }}>
                          {progresso.treinosFaltandoDetalhado.map((item, idx) => (
                            <li key={idx} style={{ color: 'var(--text-primary)' }}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Realize todos os dias recomendados.</p>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '15px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Data de início desta ficha: <strong>{progresso.dataRefStr}</strong>
                  </div>
                </div>

                {/* Lado Direito: Histórico */}
                <div>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    📅 Histórico de Treinos Realizados ({alunoAtual.historico ? alunoAtual.historico.length : 0})
                  </h3>
                  
                  <div style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    background: 'var(--bg-main)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    padding: '10px'
                  }}>
                    {alunoAtual.historico && alunoAtual.historico.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left' }}>
                            <th style={{ padding: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>DATA</th>
                            <th style={{ padding: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>TREINO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...alunoAtual.historico].reverse().map((h, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '6px', fontWeight: 500, color: 'var(--text-primary)' }}>{h.data}</td>
                              <td style={{ padding: '6px' }}>
                                <span style={{
                                  background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '4px',
                                  fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid var(--border-medium)',
                                  color: 'var(--text-primary)'
                                }}>
                                  {h.nomeTreino}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Nenhum treino registrado no histórico para esta ficha.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {alunoAtual.treinos.map((t, idx) => (
                <button
                    key={t.id}
                    draggable
                    onDragStart={() => setDraggedTab(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropTab(idx)}
                    onClick={() => setActiveTab(idx)}
                    className={activeTab === idx ? "premium-btn" : "premium-btn-outline"}
                    style={{ padding: '10px 30px', fontSize: '1.2rem', background: activeTab === idx ? '#3b82f6' : undefined, borderColor: activeTab === idx ? '#3b82f6' : undefined, cursor: 'grab' }}
                >
                    {t.nomeTreino}
                </button>
                ))}
                
                <button onClick={adicionarNovoTreino} className="premium-btn-outline" style={{ padding: '10px 20px', borderColor: 'var(--border-medium)', color: 'var(--text-secondary)' }}>
                    + Novo Dia
                </button>

                {alunoAtual.treinos.length === 0 && (
                     <button onClick={aplicarFichaInicial} className="premium-btn" style={{ marginLeft: 'auto', background: 'var(--cat-core)' }}>
                        <CopyCheck size={18} /> Iniciar com Ficha Padrão
                     </button>
                )}
            </div>

            {/* COMPARADOR CONTROLES */}
            {alunoAtual.versoesAnteriores && alunoAtual.versoesAnteriores.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Comparar com Versão Passada:</label>
                    <select 
                        value={versaoComparacaoId}
                        onChange={(e) => {
                            setVersaoComparacaoId(e.target.value);
                            setIsComparing(e.target.value !== "");
                        }}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-medium)', outline: 'none' }}
                    >
                        <option value="">Desligado (Somente Editor)</option>
                        {alunoAtual.versoesAnteriores.map((v) => (
                            <option key={v.id} value={v.id}>Versão: {v.dataInicio} até {v.dataTermino}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Editor Content */}
            {alunoAtual.treinos.length > 0 && activeTab < alunoAtual.treinos.length && (
            <div style={{ display: 'grid', gridTemplateColumns: isComparing && versaoComparacaoId ? '1fr 1fr' : '1fr', gap: '20px' }}>
                
                {/* COLUNA ESQUERDA: EDITOR */}
                <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>Novo: </h2>
                        <input 
                            value={alunoAtual.treinos[activeTab].nomeTreino}
                            onChange={(e) => {
                                const newAluno = {...alunoAtual};
                                newAluno.treinos[activeTab].nomeTreino = e.target.value;
                                setAlunoAtual(newAluno);
                            }}
                            style={{ fontSize: '1.5rem', fontWeight: 600, border: 'none', borderBottom: '2px solid var(--border-medium)', outline: 'none', background: 'transparent', width: '150px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select 
                            onChange={(e) => {
                                const modeloStr = e.target.value;
                                if (!modeloStr) return;
                                
                                // Check if it's a custom base (prefixed with 'custom:')
                                const isCustom = modeloStr.startsWith('custom:');
                                let exerciciosParaImportar: Exercicio[] = [];
                                let nomeModelo = modeloStr;
                                
                                if (isCustom) {
                                    const baseId = modeloStr.replace('custom:', '');
                                    const base = basesCustom.find(b => b.id === baseId);
                                    if (base) {
                                        exerciciosParaImportar = base.exercicios;
                                        nomeModelo = base.nome;
                                    }
                                } else {
                                    exerciciosParaImportar = MODELOS_ESTUDIO[modeloStr] || [];
                                    nomeModelo = modeloStr;
                                }
                                
                                if (confirm(`Deseja importar e substituir este dia pelo modelo ${nomeModelo}? Isso irá APAGAR os exercícios atuais deste dia.`)) {
                                    if (!alunoAtual) return;
                                    const newAluno = { ...alunoAtual };
                                    const copiados = JSON.parse(JSON.stringify(exerciciosParaImportar));
                                    copiados.forEach((ex: Exercicio) => ex.id = `ex_${Date.now()}_${Math.random()}`);
                                    newAluno.treinos[activeTab].exercicios = copiados;

                                    if (isCustom) {
                                        const baseId = modeloStr.replace('custom:', '');
                                        const base = basesCustom.find(b => b.id === baseId);
                                        if (base) {
                                            newAluno.treinos[activeTab].limitesBlocos = base.limitesBlocos ? [...base.limitesBlocos] : undefined;
                                        }
                                    } else {
                                        newAluno.treinos[activeTab].limitesBlocos = undefined;
                                    }

                                    newAluno.treinos[activeTab].bloco2Desativado = undefined;
                                    newAluno.treinos[activeTab].bloco3Desativado = undefined;
                                    newAluno.treinos[activeTab].limiteBloco1 = undefined;
                                    newAluno.treinos[activeTab].limiteBloco2 = undefined;
                                    newAluno.treinos[activeTab].ordenadoManualmente = true;

                                    setAlunoAtual(newAluno);
                                }
                                e.target.value = "";
                            }}
                            className="premium-btn-outline"
                            style={{ outline: 'none', background: 'var(--bg-main)', cursor: 'pointer', appearance: 'none', paddingRight: '20px' }}
                            title="Importar Modelo Pré-Pronto"
                        >
                            <option value="">📥 Importar Base</option>
                            {basesCustom.map(base => (
                                <option key={base.id} value={`custom:${base.id}`}>⭐ {base.nome}</option>
                            ))}
                        </select>
                        <button 
                            onClick={async () => {
                                if (!alunoAtual || alunoAtual.treinos.length === 0) return;
                                const treino = alunoAtual.treinos[activeTab];
                                if (treino.exercicios.length === 0) {
                                    alert('Este treino não possui exercícios para salvar como base.');
                                    return;
                                }
                                const nomeBase = window.prompt(
                                    'Nome para esta base de treino:',
                                    treino.nomeTreino
                                );
                                if (!nomeBase) return;
                                
                                // Check if a base with same name already exists
                                const existente = basesCustom.find(b => b.nome.toLowerCase() === nomeBase.toLowerCase());
                                if (existente) {
                                    if (!confirm(`Já existe uma base com o nome "${existente.nome}". Deseja substituí-la?`)) return;
                                    // Overwrite existing
                                    const baseAtualizada: BaseTreino = {
                                        id: existente.id,
                                        nome: nomeBase,
                                        exercicios: JSON.parse(JSON.stringify(treino.exercicios)),
                                        limitesBlocos: treino.limitesBlocos ? [...treino.limitesBlocos] : undefined,
                                    };
                                    await mockDb.saveBase(baseAtualizada);
                                } else {
                                    const novaBase: BaseTreino = {
                                        id: `base_${Date.now()}`,
                                        nome: nomeBase,
                                        exercicios: JSON.parse(JSON.stringify(treino.exercicios)),
                                        limitesBlocos: treino.limitesBlocos ? [...treino.limitesBlocos] : undefined,
                                    };
                                    await mockDb.saveBase(novaBase);
                                }
                                
                                const updated = await mockDb.getBases();
                                setBasesCustom(updated);
                                alert(`Base "${nomeBase}" salva com sucesso! Agora pode ser importada para qualquer aluno.`);
                            }}
                            className="premium-btn-outline"
                            style={{ color: '#8b5cf6', borderColor: '#8b5cf6' }}
                            title="Salvar este treino como base reutilizável"
                        >
                            <Upload size={18} /> Salvar como Base
                        </button>
                        {basesCustom.length > 0 && (
                            <button 
                                onClick={() => setShowBasesModal(true)}
                                className="premium-btn-outline"
                                style={{ color: '#6366f1', borderColor: '#6366f1' }}
                                title="Gerenciar bases salvas"
                            >
                                <BookOpen size={18} />
                            </button>
                        )}
                        <button onClick={() => removerTreinoTodo(activeTab)} className="premium-btn-outline" style={{ color: 'var(--cat-explosao)', borderColor: 'var(--cat-explosao)' }}>
                            <Trash2 size={18} /> Apagar
                        </button>
                        <button 
                            onClick={() => adicionarBloco(activeTab)} 
                            className="premium-btn-outline" 
                            style={{ color: '#8b5cf6', borderColor: '#8b5cf6' }} 
                            title="Adicionar um novo Bloco de Exercícios"
                        >
                            <Plus size={18} /> Bloco
                        </button>
                        <button onClick={() => adicionarExercicio(activeTab)} className="premium-btn-outline" style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>
                            <Plus size={18} /> Exercício
                        </button>
                    </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {(() => {
                        const limits = getBlockLimits(alunoAtual.treinos[activeTab]);
                        let exerciseCounter = 0;

                        return alunoAtual.treinos[activeTab].exercicios.map((ex, exIdx, arr) => {
                            exerciseCounter++;
                            let showBlock = false;
                            let blockLabel = '';
                            let limitIdx = -1;

                            const matchIdx = limits.indexOf(exerciseCounter - 1);
                            if (matchIdx !== -1) {
                                showBlock = true;
                                blockLabel = `BLOCO ${matchIdx + 1}`;
                                limitIdx = matchIdx;
                            }

                            return (
                                <div key={ex.id}>
                                    {showBlock && (
                                        <div style={{ 
                                            marginBottom: '10px', 
                                            padding: '5px 10px', 
                                            background: 'var(--bg-hover)', 
                                            borderRadius: '6px', 
                                            borderLeft: '4px solid var(--cat-forca)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{blockLabel}</span>
                                            {limitIdx !== -1 && (
                                                <button 
                                                    onClick={() => removerBloco(activeTab, limitIdx)}
                                                    style={{ 
                                                        background: 'transparent', 
                                                        border: 'none', 
                                                        color: 'var(--cat-explosao)', 
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontWeight: 'bold'
                                                    }}
                                                    title={`Deletar ${blockLabel} e mesclar`}
                                                >
                                                    <Trash2 size={14} /> Deletar Bloco
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <div 
                                      draggable
                                      onDragStart={() => setDraggedEx(exIdx)}
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={() => handleDropExercicio(activeTab, exIdx)}
                                      style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '15px', background: draggedEx === exIdx ? 'var(--bg-hover)' : 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-light)', cursor: 'grab', transition: 'all 0.2s' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', paddingRight: '5px', cursor: 'grab' }} title="Arraste para reposicionar">
                                            <GripVertical size={20} />
                                        </div>
                        
                        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>EXERCÍCIO</label>
                            <input 
                            value={ex.nome} 
                            onChange={(e) => handleExercicioChange(activeTab, exIdx, 'nome', e.target.value)}
                            placeholder="Nome do exercício"
                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', outline: 'none', background: 'var(--bg-card)' }}
                            />
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>CATEGORIA</label>
                            <select 
                            value={ex.categoria} 
                            onChange={(e) => handleExercicioChange(activeTab, exIdx, 'categoria', e.target.value)}
                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', outline: 'none', background: 'white' }}
                            >
                            <option value="Core">Core</option>
                            <option value="Potencia">Potência</option>
                            <option value="Forca">Força</option>
                            <option value="ACC">ACC</option>
                            <option value="DCC">DCC</option>
                            <option value="OSC">OSC</option>
                            <option value="AFSM">AFSM</option>
                            <option value="Outros">Outros</option>
                            </select>
                        </div>

                        <div style={{ width: '90px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>CARGA</label>
                            <input 
                            value={ex.carga} 
                            onChange={(e) => handleExercicioChange(activeTab, exIdx, 'carga', e.target.value)}
                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', outline: 'none', textAlign: 'center', background: 'var(--bg-card)' }}
                            />
                        </div>

                        <div style={{ width: '80px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>REPS</label>
                            <input 
                            value={ex.reps} 
                            onChange={(e) => handleExercicioChange(activeTab, exIdx, 'reps', e.target.value)}
                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', outline: 'none', textAlign: 'center', background: 'var(--bg-card)' }}
                            />
                        </div>

                        <div style={{ width: '80px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>SÉRIES</label>
                            <input 
                            value={ex.series} 
                            onChange={(e) => handleExercicioChange(activeTab, exIdx, 'series', e.target.value)}
                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', outline: 'none', textAlign: 'center', background: 'var(--bg-card)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '60px', paddingBottom: '2px' }}>
                            <button 
                            onClick={() => removerExercicio(activeTab, exIdx)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--cat-explosao)', cursor: 'pointer', padding: '10px' }}
                            title="Remover Exercício"
                            >
                            <Trash2 size={24} />
                            </button>
                        </div>

                        </div>
                    </div>
                                )
                            })
                        })()}
                    
                    {alunoAtual.treinos[activeTab].exercicios.length === 0 && (
                        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhum exercício neste treino. Seus alunos não terão o que fazer!
                        </div>
                    )}
                    </div>

                    {/* PROTOCOLO DE BIKE (Dias de Chuva) */}
                    {(() => {
                        const treinoAtivo = alunoAtual.treinos[activeTab];
                        const protocolo = treinoAtivo.protocoloBike || { ativo: false };
                        
                        // Cálculos das zonas de potência (110%, 115%, 120%)
                        const avgNum = parseFloat(protocolo.avg || '');
                        const avg110 = !isNaN(avgNum) ? Math.round(avgNum * 1.10) : null;
                        const avg115 = !isNaN(avgNum) ? Math.round(avgNum * 1.15) : null;
                        const avg120 = !isNaN(avgNum) ? Math.round(avgNum * 1.20) : null;

                        return (
                            <div style={{ 
                                marginTop: '30px', 
                                borderTop: '2px solid var(--border-light)', 
                                paddingTop: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                    <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                                        🚴 Protocolo de Bike (Condicionamento pós-treino / Chuva)
                                    </h3>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', userSelect: 'none' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={protocolo.ativo}
                                            onChange={(e) => handleUpdateProtocolo('ativo', e.target.checked)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                                        />
                                        <span>Ativar Protocolo</span>
                                    </label>
                                </div>

                                {protocolo.ativo && (
                                    <div style={{ 
                                        background: 'var(--bg-main)', 
                                        padding: '20px', 
                                        borderRadius: '10px', 
                                        border: '1px solid var(--border-medium)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '15px'
                                    }}>
                                        {/* Grid de Inputs */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '6px' }}>
                                                    DATA DO TESTE
                                                </label>
                                                <input 
                                                    type="date"
                                                    value={protocolo.data || ''}
                                                    onChange={(e) => handleUpdateProtocolo('data', e.target.value)}
                                                    style={{ 
                                                        width: '100%', 
                                                        padding: '10px', 
                                                        borderRadius: '6px', 
                                                        border: '1px solid var(--border-medium)', 
                                                        background: 'var(--bg-card)', 
                                                        color: 'var(--text-primary)',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '6px' }}>
                                                    TESTE APLICADO
                                                </label>
                                                <input 
                                                    type="text"
                                                    placeholder="Ex: 5 Minutos"
                                                    value={protocolo.teste || ''}
                                                    onChange={(e) => handleUpdateProtocolo('teste', e.target.value)}
                                                    style={{ 
                                                        width: '100%', 
                                                        padding: '10px', 
                                                        borderRadius: '6px', 
                                                        border: '1px solid var(--border-medium)', 
                                                        background: 'var(--bg-card)', 
                                                        color: 'var(--text-primary)',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '6px' }}>
                                                    TEMPO
                                                </label>
                                                <input 
                                                    type="text"
                                                    placeholder="Ex: 20 min"
                                                    value={protocolo.tempo || ''}
                                                    onChange={(e) => handleUpdateProtocolo('tempo', e.target.value)}
                                                    style={{ 
                                                        width: '100%', 
                                                        padding: '10px', 
                                                        borderRadius: '6px', 
                                                        border: '1px solid var(--border-medium)', 
                                                        background: 'var(--bg-card)', 
                                                        color: 'var(--text-primary)',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '6px' }}>
                                                    AVG (Watts / BPM)
                                                </label>
                                                <input 
                                                    type="number"
                                                    placeholder="Ex: 200"
                                                    value={protocolo.avg || ''}
                                                    onChange={(e) => handleUpdateProtocolo('avg', e.target.value)}
                                                    style={{ 
                                                        width: '100%', 
                                                        padding: '10px', 
                                                        borderRadius: '6px', 
                                                        border: '1px solid var(--border-medium)', 
                                                        background: 'var(--bg-card)', 
                                                        color: 'var(--text-primary)',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Cálculos das Zonas */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                                                Zonas Calculadas (% da AVG)
                                            </span>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                <div style={{ 
                                                    flex: 1, 
                                                    minWidth: '100px', 
                                                    background: 'rgba(59, 130, 246, 0.1)', 
                                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                                    padding: '8px 12px', 
                                                    borderRadius: '6px',
                                                    textAlign: 'center' 
                                                }}>
                                                    <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 'bold' }}>110%</div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                        {avg110 !== null ? `${avg110} W` : '-'}
                                                    </div>
                                                </div>
                                                <div style={{ 
                                                    flex: 1, 
                                                    minWidth: '100px', 
                                                    background: 'rgba(249, 115, 22, 0.1)', 
                                                    border: '1px solid rgba(249, 115, 22, 0.3)',
                                                    padding: '8px 12px', 
                                                    borderRadius: '6px',
                                                    textAlign: 'center' 
                                                }}>
                                                    <div style={{ fontSize: '0.75rem', color: '#f97316', fontWeight: 'bold' }}>115%</div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                        {avg115 !== null ? `${avg115} W` : '-'}
                                                    </div>
                                                </div>
                                                <div style={{ 
                                                    flex: 1, 
                                                    minWidth: '100px', 
                                                    background: 'rgba(239, 68, 68, 0.1)', 
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    padding: '8px 12px', 
                                                    borderRadius: '6px',
                                                    textAlign: 'center' 
                                                }}>
                                                    <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>120%</div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                        {avg120 !== null ? `${avg120} W` : '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Anotação de Resultados */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '6px' }}>
                                                RESULTADOS DO TESTE E ANOTAÇÕES
                                            </label>
                                            <textarea 
                                                rows={3}
                                                placeholder="Anote aqui os resultados (RPM, watts atingidos, fadiga, observações gerais do atleta...)"
                                                value={protocolo.resultados || ''}
                                                onChange={(e) => handleUpdateProtocolo('resultados', e.target.value)}
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '10px', 
                                                    borderRadius: '6px', 
                                                    border: '1px solid var(--border-medium)', 
                                                    background: 'var(--bg-card)', 
                                                    color: 'var(--text-primary)',
                                                    outline: 'none',
                                                    resize: 'vertical'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* COLUNA DIREITA: VISAO READONLY DA VERSAO ANTIGA */}
                {isComparing && versaoComparacaoId && (
                    <div style={{ background: '#f8fafc', padding: '30px', borderRadius: '12px', border: '1px dashed var(--border-medium)' }}>
                        {(() => {
                            const versaoAnterior = alunoAtual.versoesAnteriores?.find(v => v.id === versaoComparacaoId);
                            if (!versaoAnterior) return <div>Versão não encontrada.</div>;

                            // Tentar achar o mesmo treino pelo nome (Treino A == Treino A)
                            const treinoAtualNome = alunoAtual.treinos[activeTab].nomeTreino;
                            const treinoAnterior = versaoAnterior.treinos.find(t => t.nomeTreino === treinoAtualNome) || versaoAnterior.treinos[activeTab];

                            if(!treinoAnterior) return <div style={{ color: 'var(--text-muted)' }}>Não havia equivalente a este treino na versão passada.</div>;

                            const limits = getBlockLimits(treinoAnterior);
                            let exerciseCounter = 0;

                            return (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                        <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#64748b' }}>Antigo: <span style={{ fontWeight: 400 }}>{treinoAnterior.nomeTreino}</span></h2>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {treinoAnterior.exercicios.map((ex, exIdx, arr) => {
                                            exerciseCounter++;
                                            let showBlock = false;
                                            let blockLabel = '';

                                            const matchIdx = limits.indexOf(exerciseCounter - 1);
                                            if (matchIdx !== -1) {
                                                showBlock = true;
                                                blockLabel = `BLOCO ${matchIdx + 1}`;
                                            }

                                            return (
                                                <div key={ex.id}>
                                                    {showBlock && (
                                                        <div style={{ marginBottom: '10px', padding: '5px 10px', background: '#e2e8f0', borderRadius: '6px', borderLeft: '4px solid #94a3b8' }}>
                                                            <span style={{ fontWeight: 800, color: '#64748b', fontSize: '0.9rem' }}>{blockLabel}</span>
                                                        </div>
                                                    )}
                                                    
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #cbd5e1', opacity: 0.8 }}>
                                                        <div style={{ flex: 2 }}>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>EXERCÍCIO</div>
                                                            <div style={{ fontWeight: 500, color: '#334155' }}>{ex.nome || '-'}</div>
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>CATEGORIA</div>
                                                            <div style={{ color: '#475569' }}>{ex.categoria}</div>
                                                        </div>
                                                        <div style={{ width: '70px', textAlign: 'center' }}>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>CARGA</div>
                                                            <div style={{ color: '#475569', fontWeight: 'bold' }}>{ex.carga || '-'}</div>
                                                        </div>
                                                        <div style={{ width: '60px', textAlign: 'center' }}>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>REPS</div>
                                                            <div style={{ color: '#475569' }}>{ex.reps || '-'}</div>
                                                        </div>
                                                        <div style={{ width: '60px', textAlign: 'center' }}>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>SÉRIES</div>
                                                            <div style={{ color: '#475569' }}>{ex.series || '-'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {treinoAnterior.exercicios.length === 0 && (
                                            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                                                Nenhum exercício na ficha antiga.
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
            )}
          </>
      )}

      {/* MODAL GERENCIAR BASES */}
      {showBasesModal && (
          <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, backdropFilter: 'blur(4px)'
          }}>
              <div style={{
                  background: 'var(--bg-card)', borderRadius: '16px', padding: '30px',
                  width: '500px', maxWidth: '90vw', maxHeight: '70vh', overflow: 'auto',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: '1px solid var(--border-light)'
              }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <BookOpen size={22} /> Minhas Bases
                      </h2>
                      <button onClick={() => setShowBasesModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                          <X size={24} />
                      </button>
                  </div>
                  
                  {basesCustom.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Nenhuma base salva ainda.</p>
                  ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {basesCustom.map(base => (
                              <div key={base.id} style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  padding: '14px 16px', background: 'var(--bg-main)', borderRadius: '10px',
                                  border: '1px solid var(--border-light)', transition: 'all 0.2s'
                              }}>
                                  <div>
                                      <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>⭐ {base.nome}</div>
                                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                          {base.exercicios.length} exercício{base.exercicios.length !== 1 ? 's' : ''}
                                      </div>
                                  </div>
                                  <button 
                                      onClick={async () => {
                                          if (confirm(`Tem certeza que deseja excluir a base "${base.nome}"?`)) {
                                              await mockDb.deleteBase(base.id);
                                              const updated = await mockDb.getBases();
                                              setBasesCustom(updated);
                                              if (updated.length === 0) setShowBasesModal(false);
                                          }
                                      }}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cat-explosao)', padding: '8px' }}
                                      title="Excluir base"
                                  >
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
}
