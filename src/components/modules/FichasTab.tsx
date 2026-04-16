import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, FileText, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Ficha {
  id: string; cliente_id: string | null; historico: string | null; restricoes: string | null;
  observacoes: string | null; procedimentos: any; consentimentos: any; dados_cliente: any;
  fotos_urls: any; consent_signed_at: string | null; created_at: string;
  clientes?: { nome: string; telefone?: string | null } | null;
}

interface ClienteOption { id: string; nome: string; telefone: string | null; }

const areaOptions = ["Cílios", "Sobrancelha", "Unhas", "Estética Facial", "Estética Corporal", "Cabelo", "Maquiagem", "Depilação", "Outro"];

export default function FichasTab() {
  const { user } = useAuth();
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [clients, setClients] = useState<ClienteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  const fetchFichas = async () => {
    if (!user) return;
    setLoading(true);
    const [fRes, cRes] = await Promise.all([
      supabase.from("fichas").select("*, clientes(nome, telefone)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("clientes").select("id, nome, telefone").eq("user_id", user.id),
    ]);
    if (fRes.error) toast.error("Erro ao carregar fichas");
    setFichas((fRes.data as Ficha[]) || []);
    setClients(cRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFichas(); }, [user]);

  const openNew = () => {
    setIsCreating(true);
    setForm({ cliente_id: "", area: "", procedimento: "", historico: "", restricoes: "", observacoes: "", consent: false });
  };

  const saveFicha = async () => {
    if (!user || !form.cliente_id) { toast.error("Selecione um cliente"); return; }
    setSaving(true);
    const consentData: any = { assinado: form.consent || false };
    const consentSignedAt = form.consent ? new Date().toISOString() : null;

    const { error } = await supabase.from("fichas").insert({
      user_id: user.id, cliente_id: form.cliente_id,
      historico: form.historico || null, restricoes: form.restricoes || null, observacoes: form.observacoes || null,
      procedimentos: form.procedimento ? [{ nome: form.procedimento, area: form.area }] : [],
      consentimentos: consentData, dados_cliente: { area: form.area },
      consent_signed_at: consentSignedAt,
    });
    setSaving(false);
    if (error) { toast.error("Erro ao salvar ficha"); return; }
    toast.success("Ficha criada!");
    setIsCreating(false);
    setForm({});
    fetchFichas();
  };

  const toggleConsentOnExisting = async (ficha: Ficha, newVal: boolean) => {
    const consentSignedAt = newVal ? new Date().toISOString() : null;
    const { error } = await supabase.from("fichas").update({
      consentimentos: { assinado: newVal },
      consent_signed_at: consentSignedAt,
    }).eq("id", ficha.id);
    if (error) { toast.error("Erro ao atualizar consentimento"); return; }
    toast.success(newVal ? "Consentimento assinado!" : "Consentimento removido");
    fetchFichas();
    setSelectedFicha({ ...ficha, consentimentos: { assinado: newVal }, consent_signed_at: consentSignedAt });
  };

  const sendFichaWhatsApp = (ficha: Ficha) => {
    const phone = (ficha.clientes?.telefone || "").replace(/\D/g, "");
    if (!phone) { toast.error("Cliente sem telefone cadastrado"); return; }
    const procs = Array.isArray(ficha.procedimentos) ? ficha.procedimentos : [];
    const area = ficha.dados_cliente?.area || procs[0]?.area || "—";
    const proc = procs[0]?.nome || "—";
    const msg = `*Ficha de Anamnese - FinBeauty*\n\n👤 Cliente: ${ficha.clientes?.nome || "—"}\n📋 Área: ${area}\n💅 Procedimento: ${proc}\n${ficha.historico ? `\n📝 Histórico: ${ficha.historico}` : ""}${ficha.restricoes ? `\n⚠️ Restrições: ${ficha.restricoes}` : ""}${ficha.observacoes ? `\n💬 Observações: ${ficha.observacoes}` : ""}\n\n✅ Consentimento: ${ficha.consentimentos?.assinado ? "Assinado" : "Pendente"}${ficha.consent_signed_at ? ` em ${new Date(ficha.consent_signed_at).toLocaleString("pt-BR")}` : ""}`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando fichas...</p></div>;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Fichas de Anamnese</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">{fichas.length} fichas</p>
        </div>
        <Button size="sm" className="gradient-brand text-primary-foreground h-8 text-xs" onClick={openNew}><Plus className="w-3.5 h-3.5 mr-1" /> Nova Ficha</Button>
      </div>

      <div className="space-y-2">
        {fichas.map(f => {
          const procs = Array.isArray(f.procedimentos) ? f.procedimentos : [];
          const area = f.dados_cliente?.area || procs[0]?.area || "—";
          const proc = procs[0]?.nome || "—";
          return (
            <div key={f.id} onClick={() => setSelectedFicha(f)} className="bg-card rounded-xl p-3 sm:p-4 border border-border hover:border-primary/20 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 rounded-md bg-primary/10"><FileText className="w-3.5 h-3.5 text-primary" /></div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{f.clientes?.nome || "Sem cliente"}</p>
                    <p className="text-[10px] text-muted-foreground">{area} · {proc} · {new Date(f.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">{area}</Badge>
              </div>
            </div>
          );
        })}
        {fichas.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">Nenhuma ficha cadastrada.</p>}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selectedFicha} onOpenChange={() => setSelectedFicha(null)}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[85vh] overflow-y-auto">
          {selectedFicha && (
            <>
              <DialogHeader><DialogTitle className="text-foreground">Ficha — {selectedFicha.clientes?.nome || "—"}</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                {selectedFicha.historico && <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Histórico</p><p className="text-sm text-foreground">{selectedFicha.historico}</p></div>}
                {selectedFicha.restricoes && <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Restrições</p><p className="text-sm text-foreground">{selectedFicha.restricoes}</p></div>}
                {selectedFicha.observacoes && <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Observações</p><p className="text-sm text-foreground">{selectedFicha.observacoes}</p></div>}
                <div className="p-2.5 rounded-lg bg-secondary/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-muted-foreground">Consentimento:</p>
                      <Badge className={selectedFicha.consentimentos?.assinado ? "bg-success/15 text-success border-0 text-[10px]" : "bg-destructive/15 text-destructive border-0 text-[10px]"}>{selectedFicha.consentimentos?.assinado ? "Assinado" : "Pendente"}</Badge>
                    </div>
                    <Switch checked={selectedFicha.consentimentos?.assinado || false} onCheckedChange={v => toggleConsentOnExisting(selectedFicha, v)} />
                  </div>
                  {selectedFicha.consent_signed_at && (
                    <p className="text-[10px] text-muted-foreground">Assinado em {new Date(selectedFicha.consent_signed_at).toLocaleDateString("pt-BR")} às {new Date(selectedFicha.consent_signed_at).toLocaleTimeString("pt-BR")}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs border-border" onClick={() => sendFichaWhatsApp(selectedFicha)}>
                  <MessageCircle className="w-3.5 h-3.5 mr-1" /> Enviar Resumo via WhatsApp
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create modal */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-foreground">Nova Ficha de Anamnese</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Cliente</Label>
              <Select value={form.cliente_id} onValueChange={v => setForm({ ...form, cliente_id: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-muted-foreground text-xs">Área</Label>
              <Select value={form.area} onValueChange={v => setForm({ ...form, area: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">{areaOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Procedimento</Label><Input value={form.procedimento || ""} onChange={e => setForm({ ...form, procedimento: e.target.value })} placeholder="Ex: Volume Russo 3D" className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Histórico de Saúde</Label><Textarea value={form.historico || ""} onChange={e => setForm({ ...form, historico: e.target.value })} className="bg-secondary border-border mt-1 min-h-[50px]" /></div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Restrições</Label><Input value={form.restricoes || ""} onChange={e => setForm({ ...form, restricoes: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Observações</Label><Textarea value={form.observacoes || ""} onChange={e => setForm({ ...form, observacoes: e.target.value })} className="bg-secondary border-border mt-1 min-h-[50px]" /></div>
            <div className="col-span-2 flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
              <Label className="text-sm text-foreground">Consentimento assinado</Label>
              <Switch checked={form.consent ?? false} onCheckedChange={v => setForm({ ...form, consent: v })} />
            </div>
            {form.consent && (
              <div className="col-span-2">
                <p className="text-[10px] text-muted-foreground">Será registrado como assinado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}</p>
              </div>
            )}
          </div>
          <Button onClick={saveFicha} disabled={saving} className="w-full mt-3 gradient-brand text-primary-foreground">{saving ? "Salvando..." : "Salvar Ficha"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
