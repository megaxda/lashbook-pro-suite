import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, FileCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  areas, findArea, perguntasSaudeGeral, consentimentosLgpd,
  consentimentosImagem, tcleByArea, declaracaoFinal, Pergunta,
} from "./anamneseConfig";
import SignaturePad from "./SignaturePad";
import { generateFichaPdf, FichaPdfData } from "./fichaPdf";

interface ClientOption { id: string; nome: string; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clients: ClientOption[];
  onSaved?: () => void;
}

type RespostaSimples = { v: string; detalhe?: string };

const STEPS = [
  "Atendimento", "Saúde Geral", "Específicas", "Expectativas",
  "Emergência", "Consentimentos", "TCLE & Assinatura",
];

export default function NovaFichaWizard({ open, onOpenChange, clients, onSaved }: Props) {
  const { user, profile, isDemo } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Sec 1
  const [clienteId, setClienteId] = useState("");
  const [areaKey, setAreaKey] = useState("");
  const [procedimento, setProcedimento] = useState("");
  // Sec 2 / 3
  const [respostas, setRespostas] = useState<Record<string, RespostaSimples>>({});
  // Sec 4
  const [expectativa, setExpectativa] = useState("");
  const [primeiraVez, setPrimeiraVez] = useState("");
  const [experienciaNeg, setExperienciaNeg] = useState("");
  // Sec 5
  const [emerNome, setEmerNome] = useState("");
  const [emerParente, setEmerParente] = useState("");
  const [emerTel, setEmerTel] = useState("");
  // Sec 6
  const [consentMap, setConsentMap] = useState<Record<string, boolean>>({});
  // Sec 7
  const [signature, setSignature] = useState<string | null>(null);
  const [tcleAceito, setTcleAceito] = useState(false);
  const [meta, setMeta] = useState<{ ip?: string; geo?: string }>({});

  const area = useMemo(() => findArea(areaKey), [areaKey]);
  const tcle = useMemo(() => (areaKey ? tcleByArea[areaKey] || null : null), [areaKey]);

  // Captura silenciosa de geolocalização e IP
  useEffect(() => {
    if (!open) return;
    // IP
    fetch("https://api.ipify.org?format=json").then(r => r.json()).then(d => {
      setMeta(m => ({ ...m, ip: d?.ip }));
    }).catch(() => {});
    // Geolocalização
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setMeta(m => ({ ...m, geo: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}` })),
        () => {},
        { timeout: 4000 }
      );
    }
  }, [open]);

  const reset = () => {
    setStep(0); setClienteId(""); setAreaKey(""); setProcedimento("");
    setRespostas({}); setExpectativa(""); setPrimeiraVez(""); setExperienciaNeg("");
    setEmerNome(""); setEmerParente(""); setEmerTel(""); setConsentMap({});
    setSignature(null); setTcleAceito(false);
  };

  const setResp = (id: string, v: string, detalhe?: string) => {
    setRespostas(r => ({ ...r, [id]: { v, detalhe: detalhe ?? r[id]?.detalhe } }));
  };
  const setDetalhe = (id: string, detalhe: string) => {
    setRespostas(r => ({ ...r, [id]: { v: r[id]?.v ?? "", detalhe } }));
  };

  const canNext = () => {
    if (step === 0) return clienteId && areaKey && procedimento;
    if (step === 6) return tcleAceito && !!signature;
    return true;
  };

  const buildPdfData = (): FichaPdfData => {
    const cliente = clients.find(c => c.id === clienteId)?.nome || "—";
    const allConsents = [...consentimentosLgpd, ...consentimentosImagem];
    return {
      cliente, profissional: profile?.nome || "—",
      data: new Date().toLocaleString("pt-BR"),
      area: area?.nome || "—", procedimento,
      saudeRespostas: perguntasSaudeGeral.map(s => ({
        secao: s.titulo,
        perguntas: s.perguntas.map(p => ({
          label: p.label,
          resposta: respostas[p.id]?.v || "—",
          detalhe: respostas[p.id]?.detalhe,
        })),
      })),
      especificas: (area?.perguntas || []).map(p => ({
        label: p.label,
        resposta: respostas[p.id]?.v || "—",
        detalhe: respostas[p.id]?.detalhe,
      })),
      expectativas: { texto: expectativa, primeiraVez, experiencia: experienciaNeg },
      emergencia: { nome: emerNome, parentesco: emerParente, telefone: emerTel },
      consentimentos: allConsents.map(c => ({ label: c.label, aceito: !!consentMap[c.id] })),
      tcle, assinaturaDataUrl: signature,
      meta: { timestamp: new Date().toISOString(), ip: meta.ip, geo: meta.geo },
    };
  };

  const finalizar = async () => {
    if (!signature) { toast.error("Capture a assinatura do cliente"); return; }
    if (!tcleAceito) { toast.error("Confirme a leitura do TCLE"); return; }

    setSaving(true);
    const pdfData = buildPdfData();
    const doc = generateFichaPdf(pdfData);
    const fileName = `ficha-${pdfData.cliente.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`;

    // Sempre baixa para o profissional
    doc.save(fileName);

    if (isDemo) {
      toast.info("Modo Demo: PDF gerado, mas não foi arquivado.");
      setSaving(false);
      onOpenChange(false);
      reset();
      return;
    }

    if (!user) { setSaving(false); return; }

    // Upload do PDF para storage
    let pdfUrl: string | null = null;
    try {
      const blob = doc.output("blob");
      const path = `${user.id}/${fileName}`;
      const { error: upErr } = await supabase.storage.from("anexos").upload(path, blob, {
        contentType: "application/pdf", upsert: false,
      });
      if (!upErr) {
        const { data } = supabase.storage.from("anexos").getPublicUrl(path);
        pdfUrl = data.publicUrl;
      }
    } catch (e) { /* segue mesmo sem upload */ }

    // Salvar registro na tabela fichas
    const consentSignedAt = new Date().toISOString();
    const dados_cliente = {
      area: area?.nome, area_key: areaKey, expectativa,
      primeira_vez: primeiraVez, experiencia_negativa: experienciaNeg,
      emergencia: { nome: emerNome, parentesco: emerParente, telefone: emerTel },
      meta: { ip: meta.ip, geo: meta.geo, signed_at: consentSignedAt },
      pdf_url: pdfUrl,
    };

    const consentimentos = {
      assinado: true,
      lgpd: consentimentosLgpd.map(c => ({ id: c.id, label: c.label, aceito: !!consentMap[c.id] })),
      imagem: consentimentosImagem.map(c => ({ id: c.id, label: c.label, aceito: !!consentMap[c.id] })),
      tcle: { area: areaKey, aceito: tcleAceito },
      assinatura_data_url: signature,
      declaracao: declaracaoFinal,
    };

    const procedimentos = [{ nome: procedimento, area: area?.nome, area_key: areaKey }];

    const respostasJson = Object.entries(respostas).map(([id, r]) => ({ id, ...r }));

    const { error } = await supabase.from("fichas").insert({
      user_id: user.id,
      cliente_id: clienteId,
      historico: JSON.stringify(respostasJson),
      observacoes: expectativa || null,
      procedimentos,
      consentimentos,
      dados_cliente,
      consent_signed_at: consentSignedAt,
      anexos_urls: pdfUrl ? [pdfUrl] : [],
    });

    setSaving(false);
    if (error) { toast.error("Erro ao salvar ficha: " + error.message); return; }
    toast.success("Ficha salva e PDF arquivado!");
    onOpenChange(false);
    reset();
    onSaved?.();
  };

  // ====== Renderers ======
  const renderPergunta = (p: Pergunta) => {
    const r = respostas[p.id];
    const tipo = p.tipo || "sim_nao";

    if (tipo === "texto") {
      return (
        <div key={p.id} className="space-y-1">
          <Label className="text-xs text-foreground">{p.label}</Label>
          <Input value={r?.v || ""} onChange={e => setResp(p.id, e.target.value)} className="bg-secondary border-border h-8 text-xs" />
        </div>
      );
    }
    if (tipo === "select" && p.opcoes) {
      return (
        <div key={p.id} className="space-y-1">
          <Label className="text-xs text-foreground">{p.label}</Label>
          <Select value={r?.v || ""} onValueChange={v => setResp(p.id, v)}>
            <SelectTrigger className="bg-secondary border-border h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent className="bg-card border-border">{p.opcoes.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      );
    }

    // sim_nao_nao_sei
    const opts = ["Sim", "Não", "Não sei"];
    return (
      <div key={p.id} className="space-y-1">
        <Label className="text-xs text-foreground">{p.label}</Label>
        <div className="flex gap-1.5">
          {opts.map(o => (
            <button
              key={o}
              type="button"
              onClick={() => setResp(p.id, o)}
              className={`flex-1 text-[11px] px-2 py-1 rounded-md border transition-colors ${
                r?.v === o ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
        {p.detalheNoSim && r?.v === "Sim" && (
          <Input
            placeholder="Detalhe"
            value={r?.detalhe || ""}
            onChange={e => setDetalhe(p.id, e.target.value)}
            className="bg-secondary border-border h-7 text-xs mt-1"
          />
        )}
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent className="bg-card border-border max-h-[200px]">
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Área do procedimento</Label>
              <Select value={areaKey} onValueChange={v => { setAreaKey(v); setProcedimento(""); }}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione a área" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {areas.map(a => <SelectItem key={a.key} value={a.key}>{a.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {area && (
              <div>
                <Label className="text-xs text-muted-foreground">Procedimento específico</Label>
                <Select value={procedimento} onValueChange={setProcedimento}>
                  <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione o procedimento" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {area.procedimentos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="text-[11px] text-muted-foreground p-2 rounded bg-secondary/40">
              Profissional: <span className="text-foreground">{profile?.nome || "—"}</span><br />
              Data: <span className="text-foreground">{new Date().toLocaleString("pt-BR")}</span>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            {perguntasSaudeGeral.map(sec => (
              <div key={sec.titulo} className="space-y-2">
                <p className="text-xs font-semibold text-primary">{sec.titulo}</p>
                <div className="space-y-2.5">{sec.perguntas.map(renderPergunta)}</div>
              </div>
            ))}
          </div>
        );
      case 2:
        if (!area) return <p className="text-muted-foreground text-sm">Selecione a área primeiro.</p>;
        return (
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-primary">Específicas — {area.nome}</p>
            {area.perguntas.map(renderPergunta)}
          </div>
        );
      case 3:
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">O que você espera deste procedimento? (máx. 300 caracteres)</Label>
              <Textarea maxLength={300} value={expectativa} onChange={e => setExpectativa(e.target.value)} className="bg-secondary border-border mt-1 min-h-[70px]" />
              <p className="text-[10px] text-muted-foreground text-right mt-0.5">{expectativa.length}/300</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">É a primeira vez que realiza este procedimento?</Label>
              <Select value={primeiraVez} onValueChange={setPrimeiraVez}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border"><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Não">Não</SelectItem></SelectContent>
              </Select>
            </div>
            {primeiraVez === "Não" && (
              <div>
                <Label className="text-xs text-muted-foreground">Teve alguma experiência negativa anterior?</Label>
                <Textarea value={experienciaNeg} onChange={e => setExperienciaNeg(e.target.value)} className="bg-secondary border-border mt-1 min-h-[60px]" />
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-3">
            <div><Label className="text-xs text-muted-foreground">Nome</Label><Input value={emerNome} onChange={e => setEmerNome(e.target.value)} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-xs text-muted-foreground">Parentesco / relação</Label><Input value={emerParente} onChange={e => setEmerParente(e.target.value)} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-xs text-muted-foreground">Telefone</Label><Input value={emerTel} onChange={e => setEmerTel(e.target.value)} className="bg-secondary border-border mt-1" /></div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-primary">Comunicação</p>
              {consentimentosLgpd.map(c => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50 gap-2">
                  <Label className="text-xs text-foreground flex-1">{c.label}</Label>
                  <Switch checked={!!consentMap[c.id]} onCheckedChange={v => setConsentMap(m => ({ ...m, [c.id]: v }))} />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-primary">Uso de Imagem</p>
              {consentimentosImagem.map(c => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50 gap-2">
                  <Label className="text-xs text-foreground flex-1">{c.label}</Label>
                  <Switch checked={!!consentMap[c.id]} onCheckedChange={v => setConsentMap(m => ({ ...m, [c.id]: v }))} />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              Você pode revogar qualquer uma destas autorizações a qualquer momento, entrando em contato com o estabelecimento.
            </p>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            {tcle ? (
              <div className="rounded-lg border border-border p-3 bg-secondary/30 space-y-2 max-h-[260px] overflow-y-auto">
                <p className="text-sm font-bold text-foreground">{tcle.titulo}</p>
                <p className="text-[10px] text-muted-foreground">
                  Cliente: {clients.find(c => c.id === clienteId)?.nome || "—"} • Procedimento: {procedimento} • Data: {new Date().toLocaleDateString("pt-BR")} • Profissional: {profile?.nome || "—"}
                </p>
                <div>
                  <p className="text-xs font-semibold text-foreground mt-2">Estou ciente de que este procedimento pode causar:</p>
                  <ul className="text-[11px] text-muted-foreground list-disc pl-4 mt-1 space-y-0.5">{tcle.ciencia.map(t => <li key={t}>{t}</li>)}</ul>
                </div>
                {tcle.confirmacoes && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mt-2">Confirmo que:</p>
                    <ul className="text-[11px] text-muted-foreground list-disc pl-4 mt-1 space-y-0.5">{tcle.confirmacoes.map(t => <li key={t}>{t}</li>)}</ul>
                  </div>
                )}
                {tcle.compromissos && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mt-2">Me comprometo a:</p>
                    <ul className="text-[11px] text-muted-foreground list-disc pl-4 mt-1 space-y-0.5">{tcle.compromissos.map(t => <li key={t}>{t}</li>)}</ul>
                  </div>
                )}
                {tcle.rodape && <p className="text-[11px] text-muted-foreground italic mt-2">{tcle.rodape}</p>}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">TCLE não disponível para esta área.</p>
            )}

            <div className="rounded-lg p-2.5 bg-primary/5 border border-primary/15 space-y-2">
              <p className="text-[11px] text-foreground">{declaracaoFinal}</p>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-foreground">Li e estou de acordo com o TCLE</Label>
                <Switch checked={tcleAceito} onCheckedChange={setTcleAceito} />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Assinatura do cliente</Label>
              <SignaturePad value={signature} onChange={setSignature} />
            </div>

            <p className="text-[10px] text-muted-foreground">
              Registro: {new Date().toLocaleString("pt-BR")}{meta.ip ? ` • IP: ${meta.ip}` : ""}{meta.geo ? ` • Geo: ${meta.geo}` : ""}
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-xl bg-card border-border max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-primary" /> Nova Ficha de Anamnese
          </DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`text-[10px] px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-secondary text-foreground" : "bg-secondary/40 text-muted-foreground"
              }`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-1">{renderStep()}</div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="gradient-brand text-primary-foreground">
              Próximo <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={finalizar} disabled={saving || !canNext()} className="gradient-brand text-primary-foreground">
              {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Salvando…</> : "Finalizar e gerar PDF"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
