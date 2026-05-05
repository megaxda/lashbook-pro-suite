import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { demoClientes, demoFichas } from "@/data/demoData";
import { Plus, FileText, MessageCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import NovaFichaWizard from "@/components/fichas/NovaFichaWizard";

interface Ficha {
  id: string;
  cliente_id: string | null;
  historico: string | null;
  restricoes: string | null;
  observacoes: string | null;
  procedimentos: any;
  consentimentos: any;
  dados_cliente: any;
  fotos_urls: any;
  anexos_urls: any;
  consent_signed_at: string | null;
  created_at: string;
  clientes?: { nome: string; telefone?: string | null } | null;
}

interface ClienteOption { id: string; nome: string; telefone: string | null; }

export default function FichasTab() {
  const { user, isDemo } = useAuth();
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [clients, setClients] = useState<ClienteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchFichas = async () => {
    if (isDemo) {
      setFichas(demoFichas as Ficha[]);
      setClients(demoClientes.map(c => ({ id: c.id, nome: c.nome, telefone: c.telefone })));
      setLoading(false);
      return;
    }
    if (!user) return;
    setLoading(true);
    const [fRes, cRes] = await Promise.all([
      supabase.from("fichas").select("*, clientes(nome, telefone)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("clientes").select("id, nome, telefone").eq("user_id", user.id).order("nome"),
    ]);
    if (fRes.error) toast.error("Erro ao carregar fichas");
    setFichas((fRes.data as Ficha[]) || []);
    setClients(cRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFichas(); }, [user, isDemo]);

  const sendFichaWhatsApp = (ficha: Ficha) => {
    const phone = (ficha.clientes?.telefone || "").replace(/\D/g, "");
    if (!phone) { toast.error("Cliente sem telefone cadastrado"); return; }
    const procs = Array.isArray(ficha.procedimentos) ? ficha.procedimentos : [];
    const area = ficha.dados_cliente?.area || procs[0]?.area || "—";
    const proc = procs[0]?.nome || "—";
    const msg = `*Ficha de Anamnese - FinBeauty*\n\n👤 Cliente: ${ficha.clientes?.nome || "—"}\n📋 Área: ${area}\n💅 Procedimento: ${proc}\n\n✅ Consentimento: ${ficha.consentimentos?.assinado ? "Assinado" : "Pendente"}${ficha.consent_signed_at ? ` em ${new Date(ficha.consent_signed_at).toLocaleString("pt-BR")}` : ""}`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const downloadPdf = (ficha: Ficha) => {
    const urls = Array.isArray(ficha.anexos_urls) ? ficha.anexos_urls : [];
    const pdfUrl = urls[0] || ficha.dados_cliente?.pdf_url;
    if (!pdfUrl) { toast.error("PDF não disponível para esta ficha"); return; }
    window.open(pdfUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando fichas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Fichas de Anamnese</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">{fichas.length} fichas</p>
        </div>
        <Button
          size="sm"
          className="gradient-brand text-primary-foreground h-9 text-xs"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Nova Ficha
        </Button>
      </div>

      <div className="space-y-2">
        {fichas.map(f => {
          const procs = Array.isArray(f.procedimentos) ? f.procedimentos : [];
          const area = f.dados_cliente?.area || procs[0]?.area || "—";
          const proc = procs[0]?.nome || "—";
          return (
            <div
              key={f.id}
              onClick={() => setSelectedFicha(f)}
              className="bg-card rounded-xl p-3 sm:p-4 border border-border hover:border-primary/20 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{f.clientes?.nome || "Sem cliente"}</p>
                    <p className="text-xs text-muted-foreground">
                      {area} · {proc} · {new Date(f.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                  {area}
                </Badge>
              </div>
            </div>
          );
        })}
        {fichas.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-6">Nenhuma ficha cadastrada.</p>
        )}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selectedFicha} onOpenChange={() => setSelectedFicha(null)}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[85vh] overflow-y-auto">
          {selectedFicha && (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Ficha — {selectedFicha.clientes?.nome || "—"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Criada em {new Date(selectedFicha.created_at).toLocaleString("pt-BR")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Área</p>
                    <p className="text-foreground font-medium">
                      {selectedFicha.dados_cliente?.area || "—"}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Procedimento</p>
                    <p className="text-foreground font-medium">
                      {(Array.isArray(selectedFicha.procedimentos) && selectedFicha.procedimentos[0]?.nome) || "—"}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-secondary/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Consentimento</p>
                    <Badge
                      className={
                        selectedFicha.consentimentos?.assinado
                          ? "bg-success/15 text-success border-0 text-xs"
                          : "bg-destructive/15 text-destructive border-0 text-xs"
                      }
                    >
                      {selectedFicha.consentimentos?.assinado ? "Assinado" : "Pendente"}
                    </Badge>
                  </div>
                  {selectedFicha.consent_signed_at && (
                    <p className="text-xs text-muted-foreground">
                      Assinado em {new Date(selectedFicha.consent_signed_at).toLocaleDateString("pt-BR")}
                      {" às "}
                      {new Date(selectedFicha.consent_signed_at).toLocaleTimeString("pt-BR")}
                    </p>
                  )}
                  {selectedFicha.consentimentos?.assinatura_data_url && (
                    <img
                      src={selectedFicha.consentimentos.assinatura_data_url}
                      alt="Assinatura"
                      className="mt-1 max-h-20 bg-white rounded border border-border p-1"
                    />
                  )}
                </div>

                {selectedFicha.observacoes && (
                  <div className="p-2.5 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Expectativas</p>
                    <p className="text-sm text-foreground">{selectedFicha.observacoes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-border"
                    onClick={() => downloadPdf(selectedFicha)}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-border"
                    onClick={() => sendFichaWhatsApp(selectedFicha)}
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Wizard de nova ficha */}
      <NovaFichaWizard
        open={isCreating}
        onOpenChange={setIsCreating}
        clients={clients.map(c => ({ id: c.id, nome: c.nome }))}
        onSaved={fetchFichas}
      />
    </div>
  );
}
