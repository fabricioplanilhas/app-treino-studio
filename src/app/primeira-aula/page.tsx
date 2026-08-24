"use client";

import { useState, useEffect } from "react";
import { mockDb, Aluno, FichaAvaliativa, ExercicioAvaliativo } from "@/lib/mockData";
import { ArrowLeft, Save, Printer, Dumbbell, FileText, Search, Trash2, CheckCircle2, UserCheck, Plus, Sparkles, ChevronDown, ChevronUp, BookOpen, AlertTriangle, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RUMPEL_LOGO_BASE64 } from "@/lib/logoBase64";

// Templates padrão para formulários
const INITIAL_MOBILIDADE: ExercicioAvaliativo[] = [
  { nome: "Agachamento Overhead", score: 0, reps: "6-8", obs: "" },
  { nome: "Terra Unilateral", score: 0, scoreEsq: 0, scoreDir: 0, reps: "6-8", esq: "", dir: "", regressao: false, regressaoTexto: "Terra Unilateral Assistido (TRX/HACK/PAREDE)", obs: "" },
  { nome: "Split Squat", score: 0, scoreEsq: 0, scoreDir: 0, reps: "6-8", esq: "", dir: "", regressao: false, regressaoTexto: "Split Squat Assistido (TRX/HACK/PAREDE)", obs: "" },
  { nome: "Toca os Pés", score: 0, reps: "3-5", obs: "" },
  { nome: "Prancha Frontal (35seg.)", score: 0, reps: "35seg", obs: "" },
  { nome: "Leg Lower", score: 0, scoreEsq: 0, scoreDir: 0, reps: "6-10", esq: "", dir: "", regressao: false, regressaoTexto: "Leg Lower Assistido (Super Band/ Hack/ Barede)", obs: "" },
  { nome: "Ombro Desliza Solo", score: 0, reps: "5-8", progressao: false, progressaoTexto: "Ombro Desliza Parede", obs: "" },
];

const INITIAL_AQUECIMENTO: ExercicioAvaliativo[] = [
  { nome: "Skipp Frontal (Pista)", score: 0, regressao: false, regressaoTexto: "Marcha na Pista", obs: "" },
  { nome: "Skipp Lateral (Pista)", score: 0, regressao: false, regressaoTexto: "Marcha Lateral", obs: "" },
  { nome: "Joelho Alto (Pista)", score: 0, regressao: false, regressaoTexto: "Corrida no lugar", obs: "" },
];

const INITIAL_POTENCIA: ExercicioAvaliativo[] = [
  { nome: "Agachamento com salto Stop", score: 0, reps: "6-8", obs: "" },
  { nome: "Bola Lateral Semi Ajoelhado", score: 0, reps: "5/5", obs: "" },
  { nome: "Impulso Lateral Stop", score: 0, reps: "5/5", obs: "" },
];

const INITIAL_FORCA: ExercicioAvaliativo[] = [
  { nome: "Agachamento GB", score: 0, carga: "", reps: "8-10", obs: "" },
  { nome: "Apoio Solo", score: 0, carga: "", reps: "8-10", regressao: false, regressaoTexto: "Apoio na barra", progressao: false, progressaoTexto: "Apoio pés elevados (step/caixa/banco)", obs: "" },
  { nome: "Ponte 1P Solo", score: 0, carga: "", reps: "8-10", regressao: false, regressaoTexto: "Ponte 2 pés Solo", progressao: false, progressaoTexto: "Ponte 1P Banco", obs: "" },
  { nome: "Puxada Neutra TRX", score: 0, carga: "", reps: "8-10", regressao: false, regressaoTexto: "Ponte 2 pés Solo", progressao: false, progressaoTexto: "Ponte 1P Banco", obs: "" },
];

export default function PrimeiraAulaPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"Menu" | "Adulto" | "Atleta" | "Historico">("Menu");
  const [alunosList, setAlunosList] = useState<Aluno[]>([]);
  const [historicoFichas, setHistoricoFichas] = useState<FichaAvaliativa[]>([]);
  const [buscaHistorico, setBuscaHistorico] = useState("");
  const [saving, setSaving] = useState(false);
  const [showOverheadGuide, setShowOverheadGuide] = useState(false);
  const [overheadGuideTab, setOverheadGuideTab] = useState<"criterios" | "instrucoes" | "implicacoes">("criterios");

  // Form State
  const [fichaId, setFichaId] = useState<string>("");
  const [nomeAluno, setNomeAluno] = useState("");
  const [clube, setClube] = useState("");
  const [posicao, setPosicao] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [dataAvaliacao, setDataAvaliacao] = useState(new Date().toLocaleDateString("pt-BR"));
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState<string>("");

  const [seriesMobilidade, setSeriesMobilidade] = useState("1");
  const [mobilidade, setMobilidade] = useState<ExercicioAvaliativo[]>(JSON.parse(JSON.stringify(INITIAL_MOBILIDADE)));

  const [seriesAquecimento, setSeriesAquecimento] = useState("1");
  const [aquecimento, setAquecimento] = useState<ExercicioAvaliativo[]>(JSON.parse(JSON.stringify(INITIAL_AQUECIMENTO)));

  const [potencia, setPotencia] = useState<ExercicioAvaliativo[]>(JSON.parse(JSON.stringify(INITIAL_POTENCIA)));

  const [seriesForca, setSeriesForca] = useState("2");
  const [forcaFuncional, setForcaFuncional] = useState<ExercicioAvaliativo[]>(JSON.parse(JSON.stringify(INITIAL_FORCA)));

  // Recommendations
  const [recomendacaoSemana, setRecomendacaoSemana] = useState("2x");
  const [recomendacaoMinimo, setRecomendacaoMinimo] = useState("3 meses");
  const [recomendacaoForaTreino, setRecomendacaoForaTreino] = useState("");
  const [aporteNutricional, setAporteNutricional] = useState("Sim, conforme objetivo");

  useEffect(() => {
    (async () => {
      const dataAlunos = await mockDb.getAlunos();
      setAlunosList(dataAlunos.filter(a => a.status !== "deletado"));
      carregarHistorico();
    })();
  }, []);

  const carregarHistorico = () => {
    const list = mockDb.getFichasAvaliativas();
    setHistoricoFichas(list);
  };

  const resetForm = (tipo: "Adulto" | "Atleta" = "Adulto") => {
    setFichaId("");
    setNomeAluno("");
    setClube("");
    setPosicao("");
    setResponsavel("");
    setDataNascimento("");
    setAlunoSelecionadoId("");
    setDataAvaliacao(new Date().toLocaleDateString("pt-BR"));
    setSeriesMobilidade("1");
    setMobilidade(JSON.parse(JSON.stringify(INITIAL_MOBILIDADE)));
    setSeriesAquecimento("1");
    setAquecimento(JSON.parse(JSON.stringify(INITIAL_AQUECIMENTO)));
    setPotencia(JSON.parse(JSON.stringify(INITIAL_POTENCIA)));
    setSeriesForca("2");
    setForcaFuncional(JSON.parse(JSON.stringify(INITIAL_FORCA)));
    setRecomendacaoSemana("2x");
    setRecomendacaoMinimo("3 meses");
    setRecomendacaoForaTreino("");
    setAporteNutricional("Sim, conforme objetivo");
  };

  const calcSoma = (items: ExercicioAvaliativo[]) => {
    return items.reduce((acc, curr) => acc + (curr.score || 0), 0);
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
    setFichaId(ficha.id);
    setNomeAluno(ficha.nomeAluno);
    setClube(ficha.clube || "");
    setPosicao(ficha.posicao || "");
    setResponsavel(ficha.responsavel || "");
    setDataNascimento(ficha.dataNascimento || "");
    setDataAvaliacao(ficha.data);
    setSeriesMobilidade(ficha.seriesMobilidade || "1");
    if (ficha.mobilidade) {
      const mobCopy = JSON.parse(JSON.stringify(ficha.mobilidade));
      mobCopy.forEach((item: ExercicioAvaliativo) => {
        if (item.nome === "Terra Unilateral" || item.nome === "Split Squat" || item.nome === "Leg Lower" || item.esq !== undefined) {
          if (item.scoreEsq === undefined) item.scoreEsq = item.score || 0;
          if (item.scoreDir === undefined) item.scoreDir = item.score || 0;
        }
      });
      setMobilidade(mobCopy);
    } else {
      setMobilidade(JSON.parse(JSON.stringify(INITIAL_MOBILIDADE)));
    }
    
    if (ficha.tipo === "Atleta") {
      setSeriesAquecimento(ficha.seriesAquecimento || "1");
      setAquecimento(ficha.aquecimento ? JSON.parse(JSON.stringify(ficha.aquecimento)) : JSON.parse(JSON.stringify(INITIAL_AQUECIMENTO)));
      setPotencia(ficha.potencia ? JSON.parse(JSON.stringify(ficha.potencia)) : JSON.parse(JSON.stringify(INITIAL_POTENCIA)));
    }
    
    setSeriesForca(ficha.seriesForca || "2");
    setForcaFuncional(ficha.forcaFuncional ? JSON.parse(JSON.stringify(ficha.forcaFuncional)) : JSON.parse(JSON.stringify(INITIAL_FORCA)));
    
    setRecomendacaoSemana(ficha.recomendacaoSemana || "2x");
    setRecomendacaoMinimo(ficha.recomendacaoMinimo || "3 meses");
    setRecomendacaoForaTreino(ficha.recomendacaoForaTreino || "");
    setAporteNutricional(ficha.aporteNutricional || "Sim, conforme objetivo");
    
    setActiveTab(ficha.tipo);
  };

  const construirObjetoFicha = (tipo: "Adulto" | "Atleta"): FichaAvaliativa => {
    return {
      id: fichaId || `ficha_${Date.now()}`,
      alunoId: alunoSelecionadoId,
      nomeAluno: nomeAluno.trim() || "Aluno sem nome",
      data: dataAvaliacao || new Date().toLocaleDateString("pt-BR"),
      tipo,
      clube: tipo === "Atleta" ? clube.trim() : undefined,
      posicao: tipo === "Atleta" ? posicao.trim() : undefined,
      responsavel: tipo === "Atleta" ? responsavel.trim() : undefined,
      dataNascimento: tipo === "Atleta" ? dataNascimento.trim() : undefined,
      seriesMobilidade,
      mobilidade,
      somaMobilidade: calcSoma(mobilidade),
      seriesAquecimento: tipo === "Atleta" ? seriesAquecimento : undefined,
      aquecimento: tipo === "Atleta" ? aquecimento : undefined,
      somaAquecimento: tipo === "Atleta" ? calcSoma(aquecimento) : undefined,
      potencia: tipo === "Atleta" ? potencia : undefined,
      somaPotencia: tipo === "Atleta" ? calcSoma(potencia) : undefined,
      seriesForca,
      forcaFuncional,
      somaForca: calcSoma(forcaFuncional),
      recomendacaoSemana,
      recomendacaoMinimo,
      recomendacaoForaTreino,
      aporteNutricional,
      createdAt: new Date().toISOString(),
    };
  };

  const handleSalvarFicha = () => {
    if (!nomeAluno.trim()) {
      alert("Por favor, preencha o Nome e Sobrenome do aluno.");
      return;
    }
    const tipo = activeTab === "Atleta" ? "Atleta" : "Adulto";
    const ficha = construirObjetoFicha(tipo);
    mockDb.salvarFichaAvaliativa(ficha);
    setFichaId(ficha.id);
    carregarHistorico();
    alert("Ficha Avaliativa salva no histórico com sucesso!");
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
      carregarHistorico();
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

  const handleDeletarFicha = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta ficha avaliativa do histórico?")) return;
    const atual = mockDb.getFichasAvaliativas();
    const filtrado = atual.filter(f => f.id !== id);
    localStorage.setItem("fichas_avaliativas_v1", JSON.stringify(filtrado));
    carregarHistorico();
  };

  const handleGerarPDF = (fichaParaPdf?: FichaAvaliativa) => {
    const tipo = activeTab === "Atleta" ? "Atleta" : "Adulto";
    const ficha = fichaParaPdf || construirObjetoFicha(tipo);

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const greenBg = [76, 175, 80];

    // Página 1: Cabeçalho com Logo
    doc.setFillColor(greenBg[0], greenBg[1], greenBg[2]);
    doc.rect(0, 0, 210, 30, "F");

    try {
      doc.addImage(RUMPEL_LOGO_BASE64, "JPEG", 80, 2, 50, 24);
    } catch (e) {
      console.error("Logo PDF error", e);
    }

    // Título Principal
    doc.setFillColor(0, 166, 80);
    doc.rect(14, 34, 182, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`1º AULA ${ficha.tipo.toUpperCase()} - TREINAMENTO`, 105, 39.5, { align: "center" });

    let currentY = 56;

    if (ficha.tipo === "Atleta") {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);

      // Linha 1: Nome do Atleta e Data da Avaliação
      doc.setFont("helvetica", "bold");
      doc.text(`ATLETA:`, 14, 46);
      doc.setFont("helvetica", "normal");
      doc.text(`${ficha.nomeAluno.toUpperCase()}`, 31, 46);

      doc.setFont("helvetica", "bold");
      doc.text(`DATA AVALIAÇÃO:`, 140, 46);
      doc.setFont("helvetica", "normal");
      doc.text(`${ficha.data}`, 174, 46);

      // Linha 2: Clube e Posição
      doc.setFont("helvetica", "bold");
      doc.text(`CLUBE:`, 14, 51.5);
      doc.setFont("helvetica", "normal");
      doc.text(`${(ficha.clube || "-").toUpperCase()}`, 29, 51.5);

      doc.setFont("helvetica", "bold");
      doc.text(`POSIÇÃO:`, 110, 51.5);
      doc.setFont("helvetica", "normal");
      doc.text(`${(ficha.posicao || "-").toUpperCase()}`, 129, 51.5);

      // Linha 3: Responsável e Data de Nascimento
      doc.setFont("helvetica", "bold");
      doc.text(`RESPONSÁVEL:`, 14, 57);
      doc.setFont("helvetica", "normal");
      doc.text(`${(ficha.responsavel || "-").toUpperCase()}`, 41, 57);

      doc.setFont("helvetica", "bold");
      doc.text(`DATA DE NASCIMENTO:`, 110, 57);
      doc.setFont("helvetica", "normal");
      doc.text(`${ficha.dataNascimento || "-"}`, 154, 57);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 60, 196, 60);

      currentY = 66;
    } else {
      // Nome e Data Adulto
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`NOME E SOBRENOME: ${ficha.nomeAluno.toUpperCase()}`, 14, 48);
      doc.text(`Data: ${ficha.data}`, 150, 48);
      doc.line(14, 50, 196, 50);

      currentY = 56;
    }

    // Seção 1: MOBILIDADE AVALIATIVA
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`MOBILIDADE AVALIATIVA - Séries: 1 (${ficha.seriesMobilidade === "1" ? "X" : " "}) - 2 (${ficha.seriesMobilidade === "2" ? "X" : " "})`, 14, currentY);
    currentY += 4;

    const bodyMobilidade = ficha.mobilidade.map((item, idx) => {
      let extra = "";
      if (item.esq || item.dir) extra += ` (ESQ: ${item.esq || "-"} | DIR: ${item.dir || "-"})`;
      if (item.regressao) extra += ` [Regressão: ${item.regressaoTexto}]`;
      if (item.progressao) extra += ` [Progressão: ${item.progressaoTexto}]`;
      if (item.obs) extra += ` - Obs: ${item.obs}`;

      let notaText = `1(${item.score === 1 ? "X" : " "})  2(${item.score === 2 ? "X" : " "})  3(${item.score === 3 ? "X" : " "})`;
      if (item.scoreEsq !== undefined || item.scoreDir !== undefined) {
        const sE = item.scoreEsq || 0;
        const sD = item.scoreDir || 0;
        notaText = `E: 1(${sE === 1 ? "X" : " "}) 2(${sE === 2 ? "X" : " "}) 3(${sE === 3 ? "X" : " "})\nD: 1(${sD === 1 ? "X" : " "}) 2(${sD === 2 ? "X" : " "}) 3(${sD === 3 ? "X" : " "})`;
      }

      return [
        `${idx + 1}. ${item.nome}${extra}`,
        notaText,
        `REP: ${item.reps || ""}`,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [["Exercício / Observações", "Nota", "Repetições"]],
      body: bodyMobilidade,
      theme: "grid",
      headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 35 }, 2: { cellWidth: 27 } },
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;
    doc.setFont("helvetica", "bold");
    doc.text(`Soma Mobilidade: ( ${ficha.somaMobilidade} )`, 140, currentY);
    currentY += 8;

    // Seção para Atleta: AQUECIMENTO & POTÊNCIA
    if (ficha.tipo === "Atleta" && ficha.aquecimento) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`AQUECIMENTO AVALIATIVO - Séries: 1 (${ficha.seriesAquecimento === "1" ? "X" : " "}) - 2 (${ficha.seriesAquecimento === "2" ? "X" : " "})`, 14, currentY);
      currentY += 4;

      const bodyAquecimento = ficha.aquecimento.map((item, idx) => {
        let extra = item.regressao ? ` [Regressão: ${item.regressaoTexto}]` : "";
        if (item.obs) extra += ` - Obs: ${item.obs}`;
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
        headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255] },
        styles: { fontSize: 9, cellPadding: 2 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 4;
      doc.text(`Soma Aquecimento: ( ${ficha.somaAquecimento || 0} )`, 140, currentY);
      currentY += 8;
    }

    // Segunda Página para Força Funcional / Potência
    doc.addPage();
    let yPage2 = 20;

    if (ficha.tipo === "Atleta" && ficha.potencia) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("POTÊNCIA AVALIATIVA", 14, yPage2);
      yPage2 += 4;

      const bodyPotencia = ficha.potencia.map((item, idx) => [
        `${idx + 1}. ${item.nome}${item.obs ? ` - Obs: ${item.obs}` : ""}`,
        `1(${item.score === 1 ? "X" : " "})  2(${item.score === 2 ? "X" : " "})  3(${item.score === 3 ? "X" : " "})`,
        `REP: ${item.reps || ""}`,
      ]);

      autoTable(doc, {
        startY: yPage2,
        head: [["Exercício", "Nota", "Repetições"]],
        body: bodyPotencia,
        theme: "grid",
        headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255] },
        styles: { fontSize: 9, cellPadding: 2 },
      });

      yPage2 = (doc as any).lastAutoTable.finalY + 4;
      doc.text(`Soma Potência: ( ${ficha.somaPotencia || 0} )`, 140, yPage2);
      yPage2 += 8;
    }

    // Seção FORÇA FUNCIONAL AVALIATIVA
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`FORÇA FUNCIONAL AVALIATIVA - Séries: 2 (${ficha.seriesForca === "2" ? "X" : " "}) - 3 (${ficha.seriesForca === "3" ? "X" : " "})`, 14, yPage2);
    yPage2 += 4;

    const bodyForca = ficha.forcaFuncional.map((item, idx) => {
      let extra = "";
      if (item.regressao) extra += ` [Reg: ${item.regressaoTexto}]`;
      if (item.progressao) extra += ` [Prog: ${item.progressaoTexto}]`;
      if (item.obs) extra += ` - ${item.obs}`;
      return [
        `${idx + 1}. ${item.nome}${extra}`,
        `1(${item.score === 1 ? "X" : " "}) 2(${item.score === 2 ? "X" : " "}) 3(${item.score === 3 ? "X" : " "})`,
        `Carga: ${item.carga || "-"} | REP: ${item.reps || "8-10"}`,
      ];
    });

    autoTable(doc, {
      startY: yPage2,
      head: [["Exercício", "Nota", "Carga & Repetições"]],
      body: bodyForca,
      theme: "grid",
      headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 2 },
    });

    yPage2 = (doc as any).lastAutoTable.finalY + 6;
    doc.text(`Soma Força Funcional: ( ${ficha.somaForca} )`, 140, yPage2);
    yPage2 += 12;

    // Recomendações Finais
    doc.setFontSize(10);
    doc.text(`Recomendação Inicial de Treinamento: ${ficha.recomendacaoSemana || "___"} na semana por no mínimo ${ficha.recomendacaoMinimo || "___"}`, 14, yPage2);
    yPage2 += 6;
    doc.text(`Recomendações fora do Treinamento: ${ficha.recomendacaoForaTreino || "Nenhuma"}`, 14, yPage2);
    yPage2 += 6;
    doc.text(`Requer aporte nutricional conforme objetivo?: ${ficha.aporteNutricional || "Não informado"}`, 14, yPage2);

    doc.save(`Ficha_Avaliativa_${ficha.tipo}_${ficha.nomeAluno.replace(/\s+/g, "_")}.pdf`);
  };

  const renderScoreButtons = (
    list: ExercicioAvaliativo[],
    setList: React.Dispatch<React.SetStateAction<ExercicioAvaliativo[]>>,
    index: number
  ) => {
    const item = list[index];
    const isUnilateral = item.scoreEsq !== undefined || item.scoreDir !== undefined;

    if (isUnilateral) {
      const scoreEsq = item.scoreEsq || 0;
      const scoreDir = item.scoreDir || 0;

      const handleScoreChange = (side: "esq" | "dir", val: number) => {
        const next = [...list];
        const target = next[index];
        if (side === "esq") {
          target.scoreEsq = target.scoreEsq === val ? 0 : val;
        } else {
          target.scoreDir = target.scoreDir === val ? 0 : val;
        }

        const sE = target.scoreEsq || 0;
        const sD = target.scoreDir || 0;
        if (sE > 0 && sD > 0) {
          target.score = Math.min(sE, sD);
        } else {
          target.score = sE || sD || 0;
        }
        setList(next);
      };

      const renderSideRow = (label: string, side: "esq" | "dir", currentVal: number) => (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, width: "32px", color: "var(--text-secondary)" }}>
            {label}:
          </span>
          {[1, 2, 3].map((val) => {
            const isSelected = currentVal === val;
            let bg = "var(--bg-hover)";
            let color = "var(--text-primary)";
            if (isSelected) {
              if (val === 1) { bg = "#ef4444"; color = "#fff"; }
              else if (val === 2) { bg = "#f59e0b"; color = "#fff"; }
              else if (val === 3) { bg = "#10b981"; color = "#fff"; }
            }
            return (
              <button
                key={`${side}-${val}`}
                type="button"
                onClick={() => handleScoreChange(side, val)}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  border: isSelected ? "none" : "1px solid var(--border-medium)",
                  background: bg,
                  color: color,
                  fontWeight: 700,
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

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {renderSideRow("ESQ", "esq", scoreEsq)}
          {renderSideRow("DIR", "dir", scoreDir)}
          {item.score > 0 && (
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Nota final: <strong style={{ color: "var(--accent-primary)" }}>{item.score}</strong>
            </div>
          )}
        </div>
      );
    }

    const currentScore = list[index].score;
    return (
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        {[1, 2, 3].map((val) => {
          const isSelected = currentScore === val;
          let bg = "var(--bg-hover)";
          let color = "var(--text-primary)";
          if (isSelected) {
            if (val === 1) { bg = "#ef4444"; color = "#fff"; }
            else if (val === 2) { bg = "#f59e0b"; color = "#fff"; }
            else if (val === 3) { bg = "#10b981"; color = "#fff"; }
          }
          return (
            <button
              key={val}
              type="button"
              onClick={() => {
                const next = [...list];
                next[index].score = isSelected ? 0 : val;
                setList(next);
              }}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: isSelected ? "none" : "1px solid var(--border-medium)",
                background: bg,
                color: color,
                fontWeight: 700,
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
                onClick={() => setActiveTab("Menu")}
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
            onClick={() => {
              resetForm("Adulto");
              setActiveTab("Adulto");
            }}
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
            <button className="premium-btn" style={{ marginTop: "24px", width: "100%", justifyContent: "center" }}>
              Abrir Ficha Adulto
            </button>
          </div>

          {/* Card 2: Atleta */}
          <div
            onClick={() => {
              resetForm("Atleta");
              setActiveTab("Atleta");
            }}
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
            <button className="premium-btn" style={{ marginTop: "24px", width: "100%", justifyContent: "center", background: "#3b82f6" }}>
              Abrir Ficha Atleta
            </button>
          </div>

          {/* Card 3: Histórico */}
          <div
            onClick={() => setActiveTab("Historico")}
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
                <button className="premium-btn-outline" onClick={() => resetForm(activeTab)} style={{ fontSize: "0.85rem" }}>
                  Limpar Formulário
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

          {/* SEÇÃO 1: MOBILIDADE AVALIATIVA */}
          <div style={{ background: "var(--bg-panel)", borderRadius: "12px", padding: "24px", border: "1px solid var(--border-light)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent-primary)" }}>
                MOBILIDADE AVALIATIVA
              </h2>
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
              {mobilidade.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2.2fr 1.3fr 1fr 2fr",
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
                            const next = [...mobilidade];
                            next[idx].regressao = e.target.checked;
                            setMobilidade(next);
                          }}
                        />{" "}
                        Regressão: {item.regressaoTexto}
                      </label>
                    )}
                    {item.progressaoTexto && (
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                        <input
                          type="checkbox"
                          checked={item.progressao || false}
                          onChange={(e) => {
                            const next = [...mobilidade];
                            next[idx].progressao = e.target.checked;
                            setMobilidade(next);
                          }}
                        />{" "}
                        Progressão: {item.progressaoTexto}
                      </label>
                    )}

                    {item.nome === "Agachamento Overhead" && (
                      <button
                        type="button"
                        onClick={() => setShowOverheadGuide(!showOverheadGuide)}
                        style={{
                          marginTop: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: showOverheadGuide ? "var(--accent-primary)" : "var(--bg-panel)",
                          color: showOverheadGuide ? "#fff" : "var(--text-secondary)",
                          border: "1px solid var(--border-medium)",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {showOverheadGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {showOverheadGuide ? "Ocultar Guia Visual" : "Guia de Pontuação (1, 2, 3)"}
                      </button>
                    )}
                  </div>

                  {/* Rating 1 2 3 */}
                  {renderScoreButtons(mobilidade, setMobilidade, idx)}

                  {/* Reps ou Lados ESQ / DIR */}
                  <div>
                    {item.esq !== undefined ? (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input
                          type="text"
                          placeholder="ESQ"
                          value={item.esq || ""}
                          onChange={(e) => {
                            const next = [...mobilidade];
                            next[idx].esq = e.target.value;
                            setMobilidade(next);
                          }}
                          style={{ width: "50px", padding: "4px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--border-medium)" }}
                        />
                        <input
                          type="text"
                          placeholder="DIR"
                          value={item.dir || ""}
                          onChange={(e) => {
                            const next = [...mobilidade];
                            next[idx].dir = e.target.value;
                            setMobilidade(next);
                          }}
                          style={{ width: "50px", padding: "4px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--border-medium)" }}
                        />
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        REP: {item.reps}
                      </span>
                    )}
                  </div>

                  {/* Anotações */}
                  <input
                    type="text"
                    placeholder="Observações..."
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

                  {/* Guia Oficial FMS - Agachamento Overhead / Deep Squat (Collapsible) */}
                  {item.nome === "Agachamento Overhead" && showOverheadGuide && (
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
                            Deep Squat Movement Pattern (Agachamento Profundo)
                          </strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowOverheadGuide(false)}
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
                      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-light)", paddingBottom: "8px" }}>
                        <button
                          type="button"
                          onClick={() => setOverheadGuideTab("criterios")}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "6px",
                            border: overheadGuideTab === "criterios" ? "1px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                            background: overheadGuideTab === "criterios" ? "var(--accent-primary)" : "var(--bg-card)",
                            color: overheadGuideTab === "criterios" ? "#fff" : "var(--text-secondary)",
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
                          onClick={() => setOverheadGuideTab("instrucoes")}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "6px",
                            border: overheadGuideTab === "instrucoes" ? "1px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                            background: overheadGuideTab === "instrucoes" ? "var(--accent-primary)" : "var(--bg-card)",
                            color: overheadGuideTab === "instrucoes" ? "#fff" : "var(--text-secondary)",
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
                          onClick={() => setOverheadGuideTab("implicacoes")}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "6px",
                            border: overheadGuideTab === "implicacoes" ? "1px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                            background: overheadGuideTab === "implicacoes" ? "var(--accent-primary)" : "var(--bg-card)",
                            color: overheadGuideTab === "implicacoes" ? "#fff" : "var(--text-secondary)",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <AlertTriangle size={14} /> Implicações Biomecânicas
                        </button>
                      </div>

                      {/* ABA 1: CRITÉRIOS DE PONTUAÇÃO & DIAGRAMA */}
                      {overheadGuideTab === "criterios" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          {/* Imagem Oficial Extraída do Manual FMS */}
                          <div style={{ textAlign: "center", background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-medium)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                            <img
                              src="/fms-deep-squat-official.png"
                              alt="Pontuação do Deep Squat (Manual Oficial FMS)"
                              style={{
                                maxWidth: "100%",
                                maxHeight: "480px",
                                borderRadius: "6px",
                                objectFit: "contain",
                              }}
                            />
                            <div style={{ fontSize: "0.75rem", color: "#52525b", marginTop: "8px", fontWeight: 600 }}>
                              Fotografias Oficiais FMS: Vista Frontal e Lateral para as Notas 1 (Compensações), 2 (Prancha) e 3 (Solo)
                            </div>
                          </div>

                          {/* Grid dos Critérios Oficiais FMS (0, 1, 2, 3 da esquerda para a direita) */}
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
                                Um indivíduo recebe <strong>pontuação zero (0)</strong> se <strong>qualquer dor</strong> estiver associada a qualquer parte desse teste. Um profissional médico/clínico deve realizar uma avaliação aprofundada da área dolorosa.
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
                                <li>Tíbia e tronco <strong>NÃO estão paralelos</strong> (tronco cai à frente).</li>
                                <li>Fêmur <strong>NÃO fica abaixo da horizontal</strong>.</li>
                                <li>Joelhos <strong>NÃO estão alinhados</strong> sobre os pés (valgo).</li>
                                <li>O bastão <strong>NÃO está alinhado</strong> sobre os pés.</li>
                                <li>Incapacidade de atingir os critérios mesmo com a prancha.</li>
                              </ul>
                            </div>

                            {/* NOTA 2 */}
                            <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: "14px", borderRadius: "8px", borderTop: "4px solid #f59e0b" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                <span style={{ background: "#f59e0b", color: "#fff", width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>
                                  2
                                </span>
                                <strong style={{ color: "#f59e0b", fontSize: "0.95rem" }}>Com Calcanhares Elevados</strong>
                              </div>
                              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                <li><strong>Tronco paralelo à tíbia</strong> ou em direção vertical.</li>
                                <li><strong>Fêmur abaixo da horizontal</strong>.</li>
                                <li><strong>Joelhos alinhados</strong> sobre os pés.</li>
                                <li><strong>Bastão alinhado</strong> sobre os pés.</li>
                                <li><strong>Executado com os calcanhares sobre a prancha/tábua FMS</strong>.</li>
                              </ul>
                            </div>

                            {/* NOTA 3 */}
                            <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "14px", borderRadius: "8px", borderTop: "4px solid #10b981" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                <span style={{ background: "#10b981", color: "#fff", width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>
                                  3
                                </span>
                                <strong style={{ color: "#10b981", fontSize: "0.95rem" }}>Padrão Ideal (No Solo)</strong>
                              </div>
                              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                <li><strong>Tronco paralelo à tíbia</strong> ou em direção vertical.</li>
                                <li><strong>Fêmur abaixo da horizontal</strong> (agachamento profundo completo).</li>
                                <li><strong>Joelhos alinhados</strong> sobre os pés (sem colapso em valgo).</li>
                                <li><strong>Bastão alinhado</strong> verticalmente sobre os pés.</li>
                                <li>Calcanhares apoiados totalmente no solo.</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ABA 2: INSTRUÇÕES VERBAIS & DICAS */}
                      {overheadGuideTab === "instrucoes" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.85rem" }}>
                          <div style={{ background: "var(--bg-card)", padding: "14px", borderRadius: "8px", borderLeft: "4px solid var(--accent-primary)" }}>
                            <strong style={{ display: "block", color: "var(--text-primary)", marginBottom: "6px" }}>
                              🗣️ Roteiro de Instruções Verbais (O que falar para o aluno):
                            </strong>
                            <p style={{ fontStyle: "italic", color: "var(--text-secondary)", margin: "0 0 8px 0" }}>
                              "Por favor, informe se há dor enquanto executa o movimento."
                            </p>
                            <ol style={{ margin: 0, paddingLeft: "20px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                              <li><strong>"Fique em pé com os pés separados aproximadamente na largura dos ombros e com os dedos do pé apontados para frente."</strong></li>
                              <li><strong>"Segure o bastão com ambas as mãos horizontalmente sobre a cabeça, mantendo os ombros e cotovelos em um ângulo de 90 graus."</strong></li>
                              <li><strong>"Levante o bastão de forma que ele fique diretamente acima da sua cabeça."</strong></li>
                              <li><strong>"Inicie o agachamento e desça o mais baixo possível, mas mantenha a coluna vertebral ereta e mantenha o bastão sobre a cabeça e os calcanhares no chão."</strong></li>
                              <li><strong>"Mantenha a posição descendente e conte até um, e então retorne à posição inicial."</strong></li>
                              <li><strong>"Você compreendeu as instruções?"</strong></li>
                            </ol>
                          </div>

                          <div style={{ background: "var(--bg-card)", padding: "14px", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                            <strong style={{ display: "block", color: "var(--text-primary)", marginBottom: "6px" }}>
                              💡 Dicas Oficiais para o Avaliador:
                            </strong>
                            <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                              <li>O cliente pode executar o movimento <strong>até 3 vezes</strong> se necessário.</li>
                              <li>Se uma pontuação de 3 não for alcançada no solo, repita as instruções usando a <strong>plataforma sob os calcanhares</strong> do cliente.</li>
                              <li>Observe o cliente de <strong>frente</strong> e de <strong>perfil (lado)</strong>.</li>
                              <li>Todas as posições, incluindo o alinhamento dos pés, deverão permanecer inalteradas quando os calcanhares estiverem elevados.</li>
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* ABA 3: IMPLICAÇÕES BIOMECÂNICAS */}
                      {overheadGuideTab === "implicacoes" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.85rem" }}>
                          <div style={{ background: "var(--bg-card)", padding: "14px", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                            <strong style={{ display: "block", color: "var(--text-primary)", marginBottom: "6px" }}>
                              🎯 Objetivo do Teste:
                            </strong>
                            <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: "1.5" }}>
                              O agachamento profundo demonstra mobilidade e estabilidade extrema completamente coordenadas com quadris e ombros em posições simétricas. Avalia mobilidade e estabilidade funcional bilateral dos quadris, joelhos, tornozelos, ombros, região escapular e coluna torácica.
                            </p>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div style={{ background: "var(--bg-card)", padding: "14px", borderRadius: "8px", borderLeft: "4px solid #3b82f6" }}>
                              <strong style={{ color: "#3b82f6", display: "block", marginBottom: "6px" }}>
                                🦴 Membros Superiores & Coluna:
                              </strong>
                              <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                Limitação nos membros superiores pode ser atribuída à mobilidade deficiente pela articulação glenoumeral, pela coluna torácica (falta de extensão torácica) ou ambas.
                              </p>
                            </div>

                            <div style={{ background: "var(--bg-card)", padding: "14px", borderRadius: "8px", borderLeft: "4px solid #8b5cf6" }}>
                              <strong style={{ color: "#8b5cf6", display: "block", marginBottom: "6px" }}>
                                🦵 Membros Inferiores & Tornozelo:
                              </strong>
                              <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                Limitação nas extremidades inferiores inclui dorsiflexão de cadeia cinética fechada deficiente pelo tornozelo, ou flexão limitada pelos joelhos e quadris.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ textAlign: "right", marginTop: "14px", fontSize: "1.05rem", fontWeight: 700 }}>
              Soma Mobilidade: <span style={{ color: "var(--accent-primary)" }}>{calcSoma(mobilidade)}</span>
            </div>
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

              {/* Potência Avaliativa */}
              <div style={{ background: "var(--bg-panel)", borderRadius: "12px", padding: "24px", border: "1px solid var(--border-light)" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#8b5cf6", marginBottom: "16px" }}>
                  POTÊNCIA AVALIATIVA
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
                  Soma Potência: <span style={{ color: "#8b5cf6" }}>{calcSoma(potencia)}</span>
                </div>
              </div>
            </>
          )}

          {/* SEÇÃO FORÇA FUNCIONAL AVALIATIVA */}
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

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {forcaFuncional.map((item, idx) => (
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
                  Tempo Mínimo na Semana
                </label>
                <input
                  type="text"
                  placeholder="ex: 3 meses"
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
              <input
                type="text"
                placeholder="ex: Alongamentos diários, caminhadas..."
                value={recomendacaoForaTreino}
                onChange={(e) => setRecomendacaoForaTreino(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-medium)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                Requer aporte nutricional conforme objetivo?
              </label>
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
    </div>
  );
}
