import { useState } from "react";
import { useClientes } from "@/hooks/useSupabaseData";
import type { Client } from "@/data/mockData";import { Search, Plus, Phone, Mail, Eye, Pencil, Trash2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Client } from "@/data/mockData";

export default function ClientesTab() {
  const { clientes, isLoading: isLoadingClientes } = useClientes();  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todas");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [whatsappClient, setWhatsappClient] = useState<Client | null>(null);
  const [paymentModal, setPaymentModal] = useState<Client | null>(null);
  const [customMsg, setCustomMsg] = useState("");
  const [freeMsg, setFreeMsg] = useState("");

  const today = "2026-04-13";
  const todayDate = new Date(today);
  const in7 = new Date(todayDate); in7.setDate(in7.getDate() + 7);
  const in30 = new Date(todayDate); in30.setDate(in30.getDate() + 30);

  const filtered = clients.filter(c => {
    const match = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchS = statusFilter === "Todas" || c.status === statusFilter;
    return match && matchS;
  });

  const handleDelete = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const handleEditSave = () => {
    if (!editClient) return;
    setClients(prev => prev.map(c => c.id === editClient.id ? editClient : c));
    setEditClient(null);
  };

  // Follow-up sections
  const todayClients = clients.filter(c => c.lastVisit === today);
  const appointmentsToday = mockAppointments.filter(a => a.date === today);
  const scheduledToday = clients.filter(c => appointmentsToday.some(a => a.clientId === c.id));
  
  const next7Appts = mockAppointments.filter(a => {
    const d = new Date(a.date);
    return d > todayDate && d <= in7;
  });
  const next7Clients = clients.filter(c => next7Appts.some(a => a.clientId === c.id));

  const next30Appts = mockAppointments.filter(a => {
    const d = new Date(a.date);
    return d > in7 && d <= in30;
  });
  const next30Clients = clients.filter(c => next30Appts.some(a => a.clientId === c.id));

  const hasScheduled = (cId: string) => mockAppointments.some(a => new Date(a.date) >= todayDate && a.clientId === cId);
  const neverReturned = clients.filter(c => !hasScheduled(c.id) && c.lastVisit < today);

  const sendWhatsApp = (phone: string, msg: string) => {
    const clean = phone.replace(/\D/g, "");
    window.open(`https://wa.me/55${clean}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const FollowUpSection = ({ title, list, color }: { title: string; list: Client[]; color: string }) => (
    list.length > 0 ? (
      <div className="space-y-2">
        <h4 className={cn("text-sm font-semibold flex items-center gap-2", color)}>{title} <Badge variant="secondary" className="text-xs">{list.length}</Badge></h4>
        {list.map(c => (
          <div key={c.id} className="gradient-card rounded-lg p-3 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-medium text-foreground text-sm">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.phone} · Último: {new Date(c.lastVisit).toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => setWhatsappClient(c)} className="text-xs border-success/30 text-success hover:bg-success/10 gap-1">
                <MessageCircle className="w-3 h-3" /> WhatsApp
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPaymentModal(c)} className="text-xs">Fechamento</Button>
            </div>
          </div>
        ))}
      </div>
    ) : null
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="lista">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Clientes</h2>
            <p className="text-muted-foreground text-sm">{clients.length} clientes cadastrados</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <TabsList className="bg-secondary">
              <TabsTrigger value="lista">Lista</TabsTrigger>
              <TabsTrigger value="followup">Follow-Up</TabsTrigger>
            </TabsList>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-pink text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Criar Cliente</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-card border-border">
                <DialogHeader><DialogTitle className="text-foreground">Novo Cliente</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="col-span-2"><Label className="text-muted-foreground text-xs">Nome</Label><Input className="bg-secondary border-border mt-1" /></div>
                  <div><Label className="text-muted-foreground text-xs">Telefone</Label><Input className="bg-secondary border-border mt-1" /></div>
                  <div><Label className="text-muted-foreground text-xs">Email</Label><Input className="bg-secondary border-border mt-1" /></div>
                  <div><Label className="text-muted-foreground text-xs">Data Nascimento</Label><Input type="date" className="bg-secondary border-border mt-1" /></div>
                  <div><Label className="text-muted-foreground text-xs">Instagram</Label><Input className="bg-secondary border-border mt-1" /></div>
                  <div className="col-span-2"><Label className="text-muted-foreground text-xs">Endereço</Label><Input className="bg-secondary border-border mt-1" /></div>
                  <div className="col-span-2"><Label className="text-muted-foreground text-xs">Observações</Label><Input className="bg-secondary border-border mt-1" /></div>
                </div>
                <Button className="w-full mt-4 gradient-pink text-primary-foreground">Salvar Cliente</Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="lista">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
            </div>
            <div className="flex gap-2">
              {["Todas", "Ativa", "Inativa"].map(s => (
                <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}
                  className={cn(statusFilter === s && "gradient-pink text-primary-foreground")}>{s}</Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map(c => (
              <div key={c.id} className="gradient-card rounded-xl p-4 border border-border hover:border-primary/20 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full gradient-pink flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
                      {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge variant={c.status === "Ativa" ? "default" : "secondary"} className={cn("text-[10px]", c.status === "Ativa" ? "bg-success/15 text-success border-0" : "bg-muted text-muted-foreground border-0")}>{c.status}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => setSelectedClient(c)} className="h-8 w-8 text-muted-foreground"><Eye className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditClient({...c})} className="h-8 w-8 text-muted-foreground"><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="followup" className="space-y-6">
          <FollowUpSection title="Clientes de Hoje" list={todayClients} color="text-success" />
          <FollowUpSection title="Agendados Hoje" list={scheduledToday} color="text-info" />
          <FollowUpSection title="Próximos 7 dias" list={next7Clients} color="text-primary" />
          <FollowUpSection title="Próximos 30 dias" list={next30Clients} color="text-warning" />
          <FollowUpSection title="Não Voltaram Mais" list={neverReturned} color="text-destructive" />
          {todayClients.length === 0 && scheduledToday.length === 0 && neverReturned.length === 0 && next7Clients.length === 0 && next30Clients.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum follow-up pendente.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* View Client */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-lg bg-card border-border">
          {selectedClient && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full gradient-pink flex items-center justify-center text-lg font-bold text-primary-foreground">
                    {selectedClient.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <DialogTitle className="text-foreground">{selectedClient.name}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-lg bg-secondary"><p className="text-xs text-muted-foreground">Total Gasto</p><p className="text-lg font-bold text-foreground">R$ {selectedClient.totalSpent.toLocaleString("pt-BR")}</p></div>
                <div className="p-3 rounded-lg bg-secondary"><p className="text-xs text-muted-foreground">Último Atend.</p><p className="text-lg font-bold text-foreground">{new Date(selectedClient.lastVisit).toLocaleDateString("pt-BR")}</p></div>
                <div className="p-3 rounded-lg bg-secondary"><p className="text-xs text-muted-foreground">Telefone</p><p className="text-sm font-medium text-foreground">{selectedClient.phone}</p></div>
                <div className="p-3 rounded-lg bg-secondary"><p className="text-xs text-muted-foreground">Status</p><Badge className={cn(selectedClient.status === "Ativa" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground", "border-0 mt-1")}>{selectedClient.status}</Badge></div>
              </div>
              {selectedClient.notes && <div className="p-3 rounded-lg bg-secondary mt-2"><p className="text-xs text-muted-foreground mb-1">Obs</p><p className="text-sm text-foreground">{selectedClient.notes}</p></div>}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Client */}
      <Dialog open={!!editClient} onOpenChange={() => setEditClient(null)}>
        <DialogContent className="max-w-lg bg-card border-border">
          {editClient && (
            <>
              <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="col-span-2"><Label className="text-xs text-muted-foreground">Nome</Label><Input value={editClient.name} onChange={e => setEditClient({...editClient, name: e.target.value})} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-xs text-muted-foreground">Telefone</Label><Input value={editClient.phone} onChange={e => setEditClient({...editClient, phone: e.target.value})} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-xs text-muted-foreground">Email</Label><Input value={editClient.email} onChange={e => setEditClient({...editClient, email: e.target.value})} className="bg-secondary border-border mt-1" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditClient(null)}>Cancelar</Button>
                <Button onClick={handleEditSave} className="gradient-pink text-primary-foreground">Salvar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* WhatsApp Modal */}
      <Dialog open={!!whatsappClient} onOpenChange={() => setWhatsappClient(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          {whatsappClient && (
            <>
              <DialogHeader><DialogTitle className="text-foreground">Enviar WhatsApp - {whatsappClient.name}</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <Button variant="outline" className="w-full justify-start text-left h-auto py-3 text-sm" onClick={() => {
                  const appt = mockAppointments.find(a => a.clientId === whatsappClient.id && a.date >= today);
                  sendWhatsApp(whatsappClient.phone, `Oi ${whatsappClient.name.split(" ")[0]}, seu agendamento está marcado para ${appt?.time || "seu horário"}. Posso confirmar?`);
                }}>
                  <MessageCircle className="w-4 h-4 mr-2 text-success flex-shrink-0" />
                  <span>Confirmação de agendamento</span>
                </Button>
                <div>
                  <Label className="text-xs text-muted-foreground">Mensagem customizável</Label>
                  <Textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)} placeholder="Digite sua mensagem padrão..." className="bg-secondary border-border mt-1 text-sm" rows={2} />
                  <Button size="sm" variant="outline" className="mt-1 text-xs" onClick={() => sendWhatsApp(whatsappClient.phone, customMsg)} disabled={!customMsg}>Enviar</Button>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Mensagem livre</Label>
                  <Textarea value={freeMsg} onChange={e => setFreeMsg(e.target.value)} placeholder="Digite livremente..." className="bg-secondary border-border mt-1 text-sm" rows={2} />
                  <Button size="sm" variant="outline" className="mt-1 text-xs" onClick={() => sendWhatsApp(whatsappClient.phone, freeMsg)} disabled={!freeMsg}>Enviar</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment/Fechamento Modal */}
      <Dialog open={!!paymentModal} onOpenChange={() => setPaymentModal(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          {paymentModal && (
            <>
              <DialogHeader><DialogTitle>Fechamento - {paymentModal.name}</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div><Label className="text-xs text-muted-foreground">Serviço extra (opcional)</Label><Input placeholder="Nome do serviço extra" className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-xs text-muted-foreground">Valor extra (R$)</Label><Input type="number" placeholder="0" className="bg-secondary border-border mt-1" /></div>
                <hr className="border-border" />
                <p className="text-sm font-medium text-foreground">Forma de Pagamento</p>
                <div className="grid grid-cols-3 gap-2">
                  <div><Label className="text-[10px] text-muted-foreground">PIX (R$)</Label><Input type="number" placeholder="0" className="bg-secondary border-border mt-1 text-sm" /></div>
                  <div><Label className="text-[10px] text-muted-foreground">Dinheiro (R$)</Label><Input type="number" placeholder="0" className="bg-secondary border-border mt-1 text-sm" /></div>
                  <div><Label className="text-[10px] text-muted-foreground">Cartão (R$)</Label><Input type="number" placeholder="0" className="bg-secondary border-border mt-1 text-sm" /></div>
                </div>
                <div><Label className="text-[10px] text-muted-foreground">Sinal/Adiantamento (R$)</Label><Input type="number" placeholder="0" className="bg-secondary border-border mt-1 text-sm" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPaymentModal(null)}>Cancelar</Button>
                <Button className="gradient-pink text-primary-foreground" onClick={() => setPaymentModal(null)}>Salvar Fechamento</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
