import jsPDF from "jspdf";
import { TcleBlock, declaracaoFinal } from "./anamneseConfig";

export interface FichaPdfData {
  cliente: string;
  profissional: string;
  data: string;
  area: string;
  procedimento: string;
  saudeRespostas: { secao: string; perguntas: { label: string; resposta: string; detalhe?: string }[] }[];
  especificas: { label: string; resposta: string; detalhe?: string }[];
  expectativas: { texto: string; primeiraVez: string; experiencia?: string };
  emergencia: { nome: string; parentesco: string; telefone: string };
  consentimentos: { label: string; aceito: boolean }[];
  tcle: TcleBlock | null;
  assinaturaDataUrl: string | null;
  meta: { timestamp: string; ip?: string; geo?: string };
}

const PAGE_W = 210;
const MARGIN = 14;
const LINE_H = 4.6;

export function generateFichaPdf(d: FichaPdfData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  const ensureSpace = (need: number) => {
    if (y + need > 285) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const writeWrapped = (text: string, opts?: { bold?: boolean; size?: number; indent?: number }) => {
    const size = opts?.size ?? 10;
    const indent = opts?.indent ?? 0;
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, PAGE_W - MARGIN * 2 - indent);
    lines.forEach((line: string) => {
      ensureSpace(LINE_H);
      doc.text(line, MARGIN + indent, y);
      y += LINE_H;
    });
  };

  const sectionTitle = (t: string) => {
    ensureSpace(10);
    y += 2;
    doc.setFillColor(245, 245, 245);
    doc.rect(MARGIN, y - 4, PAGE_W - MARGIN * 2, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(t, MARGIN + 2, y);
    y += 4;
  };

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Ficha de Anamnese — FinBeauty", MARGIN, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${d.cliente}`, MARGIN, y); y += LINE_H;
  doc.text(`Profissional: ${d.profissional}`, MARGIN, y); y += LINE_H;
  doc.text(`Data: ${d.data}`, MARGIN, y); y += LINE_H;
  doc.text(`Área: ${d.area} — Procedimento: ${d.procedimento}`, MARGIN, y); y += LINE_H + 2;

  // Saúde geral
  sectionTitle("Saúde Geral");
  d.saudeRespostas.forEach(sec => {
    writeWrapped(sec.secao, { bold: true, size: 10 });
    sec.perguntas.forEach(p => {
      writeWrapped(`• ${p.label}: ${p.resposta}${p.detalhe ? ` — ${p.detalhe}` : ""}`, { size: 9, indent: 2 });
    });
    y += 1;
  });

  // Específicas
  sectionTitle(`Perguntas Específicas — ${d.area}`);
  d.especificas.forEach(p => {
    writeWrapped(`• ${p.label}: ${p.resposta}${p.detalhe ? ` — ${p.detalhe}` : ""}`, { size: 9, indent: 2 });
  });

  // Expectativas
  sectionTitle("Expectativas");
  writeWrapped(`Expectativa: ${d.expectativas.texto || "—"}`, { size: 9 });
  writeWrapped(`Primeira vez: ${d.expectativas.primeiraVez}`, { size: 9 });
  if (d.expectativas.experiencia) writeWrapped(`Experiência anterior: ${d.expectativas.experiencia}`, { size: 9 });

  // Emergência
  sectionTitle("Contato de Emergência");
  writeWrapped(`Nome: ${d.emergencia.nome || "—"}`, { size: 9 });
  writeWrapped(`Parentesco: ${d.emergencia.parentesco || "—"}`, { size: 9 });
  writeWrapped(`Telefone: ${d.emergencia.telefone || "—"}`, { size: 9 });

  // Consentimentos
  sectionTitle("Consentimentos LGPD");
  d.consentimentos.forEach(c => writeWrapped(`${c.aceito ? "[X]" : "[ ]"} ${c.label}`, { size: 9, indent: 2 }));

  // TCLE
  if (d.tcle) {
    sectionTitle(d.tcle.titulo);
    writeWrapped("Estou ciente de que este procedimento pode causar:", { bold: true, size: 9 });
    d.tcle.ciencia.forEach(t => writeWrapped(`• ${t}`, { size: 9, indent: 3 }));
    if (d.tcle.confirmacoes?.length) {
      y += 1;
      writeWrapped("Confirmo que:", { bold: true, size: 9 });
      d.tcle.confirmacoes.forEach(t => writeWrapped(`• ${t}`, { size: 9, indent: 3 }));
    }
    if (d.tcle.compromissos?.length) {
      y += 1;
      writeWrapped("Me comprometo a:", { bold: true, size: 9 });
      d.tcle.compromissos.forEach(t => writeWrapped(`• ${t}`, { size: 9, indent: 3 }));
    }
    if (d.tcle.rodape) {
      y += 1;
      writeWrapped(d.tcle.rodape, { size: 9 });
    }
  }

  // Declaração e assinatura
  sectionTitle("Declaração e Assinatura");
  writeWrapped(declaracaoFinal, { size: 9 });
  y += 4;

  if (d.assinaturaDataUrl) {
    ensureSpace(35);
    try {
      doc.addImage(d.assinaturaDataUrl, "PNG", MARGIN, y, 70, 25);
    } catch {}
    y += 27;
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y, MARGIN + 70, y);
    y += 4;
    doc.setFontSize(8);
    doc.text(`Assinatura do(a) cliente — ${d.cliente}`, MARGIN, y);
    y += 5;
  } else {
    writeWrapped("[Assinatura não capturada]", { size: 9 });
  }

  ensureSpace(10);
  doc.setFontSize(8);
  doc.setTextColor(110);
  doc.text(`Registrado em: ${d.meta.timestamp}`, MARGIN, y); y += 4;
  if (d.meta.ip) { doc.text(`IP: ${d.meta.ip}`, MARGIN, y); y += 4; }
  if (d.meta.geo) { doc.text(`Geolocalização: ${d.meta.geo}`, MARGIN, y); y += 4; }
  doc.text(`Profissional responsável: ${d.profissional}`, MARGIN, y);

  return doc;
}
