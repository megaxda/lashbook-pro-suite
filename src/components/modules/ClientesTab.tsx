import { useState } from "react";
import { mockClients, Client } from "@/data/mockData";
import { Search, Plus, Phone, Mail, Eye, Pencil, Trash2, MessageCircle, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

const whatsappMessages = [
  { label: "Confirmação de agendamento", msg: "Olá {{nome}}! Seu agendamento está confirmado. Nos vemos em breve! 😊" },
  { label: "Lembrete de retorno", msg: "Oi {{nome}}! Estamos com saudades! Que tal agendar sua manutenção? 💕" },
  { label: "Reativação de cliente", msg: "Olá {{nome}}! Faz tempo que não nos vemos. Temos novidades incríveis, venha conferir! ✨" },
];

export default function ClientesTab() {
  const [clients, setClients] = useState<Client[]>([...mockClients]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todas");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [whatsappClient, setWhatsappClient] = useState<Client | null>(null);
  const [customMsg, setCustomMsg] = useState("");

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todas" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const today = new Date("2026-04-13");
  const followUpClients = clients.filter(c => {
    const daysSince = Math.floor((today.getTime() - new Date(c.lastVisit).getTime()) / 86400000);
    return daysSince > 21;
  });

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const toggleStatus = (id: string) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, status: c.status === "Ativa" ? "Inativa" : "Ativa" } : c));
  };

  const openWhatsApp = (client: Client, message: string) => {
    const phone = client.phone.replace(/\D/g, "");
    const msg = message.replace("{{nome}}", client.name.split(" ")[0]);
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="lista">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Clientes</h2>
            <p className="text-muted-foreground text-sm">{clients.length} clientes cadastrados</p>
          </div>
          <div className="flex items-center gap-2">
            <TabsList className="bg-secondary">
              <TabsTrigger value="lista">Lista</TabsTrigger>
              <TabsTrigger value="followup">Follow-Up</TabsTrigger>
            </TabsList>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-brand text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Criar Cliente</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-card border-border">
                <DialogHeader><DialogTitle className="text-foreground">Novo Cliente</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="col-span-2"><Label className="text-muted-foreground text-xs">Nome completo</Label><Input placeholder="Nome da cliente" className="bg-secondary border-border mt-1" /></div>
                  <div><Label className="text-muted-foreground text-xs">Telefone</Label><Input placeholder="(00) 00000-0000" className="bg-secondary border-border mt-1" /></div>
                  <div><Label className="text-muted-foreground text-xs">Email</Label><Input placeholder="email@email.com" className="bg-secondary border-border mt-1" /></div>
                  <div><Label className="text-muted-foreground text-xs">Data de Nascimento</Label><Input type="date" className="bg-secondary border-border mt-1" /></div>
                  <div><Label className="text-muted-foreground text-xs">Instagram</Label><Input placeholder="@perfil" className="bg-secondary border-border mt-1" /></div>
                  <div className="col-span-2"><Label className="text-muted-foreground text-xs">Endereço</Label><Input placeholder="Endereço completo" className="bg-secondary border-border mt-1" /></div>
                  <div className="col-span-2"><Label className="text-muted-foreground text-xs">Observações de saúde/estética</Label><Input placeholder="Alergias, sensibilidades..." className="bg-secondary border-border mt-1" /></div>
                </div>
                <Button className="w-full mt-4 gradient-brand text-primary-foreground">Salvar Cliente</Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="lista">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, telefone ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
            </div>
            <div className="flex gap-2">
              {["Todas", "Ativa", "Inativa"].map(s => (
                <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}
                  className={cn(statusFilter === s && "gradient-brand text-primary-foreground")}>{s}</Button>
              ))}
            </div>
          </div>

          <div className="gradient-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium">Cliente</th>
                  <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Telefone</th>
                  <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Email</th>
                  <th className="text-left p-3 text-muted-foreground font-medium hidden lg:table-cell">Último Atend.</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Ações</th>
                </tr></thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
                            {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <span className="font-medium text-foreground">{c.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell"><Phone className="w-3 h-3 inline mr-1" />{c.phone}</td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell"><Mail className="w-3 h-3 inline mr-1" />{c.email}</td>
                      <td className="p-3 text-muted-foreground hidden lg:table-cell">{new Date(c.lastVisit).toLocaleDateString("pt-BR")}</td>
                      <td className="p-3">
                        <Badge variant={c.status === "Ativa" ? "default" : "secondary"} className={cn(c.status === "Ativa" ? "bg-success/15 text-success border-0" : "bg-muted text-muted-foreground border-0")}>{c.status}</Badge>
                      </td>
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem onClick={() => setSelectedClient(c)} className="gap-2"><Eye className="w-4 h-4" /> Ver Detalhes</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingClient({ ...c })} className="gap-2"><Pencil className="w-4 h-4" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setWhatsappClient(c)} className="gap-2"><MessageCircle className="w-4 h-4" /> WhatsApp</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatus(c.id)} className="gap-2">{c.status === "Ativa" ? "Inativar" : "Ativar"}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteClient(c.id)} className="gap-2 text-destructive"><Trash2 className="w-4 h-4" /> Apagar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="followup">
          <div className="gradient-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium">Cliente</th>
                  <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Telefone</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Último Atend.</th>
                  <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Total Gasto</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Ações</th>
                </tr></thead>
                <tbody>
                  {followUpClients.map(c => {
                    const daysSince = Math.floor((today.getTime() - new Date(c.lastVisit).getTime()) / 86400000);
                    return (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/50">
                        <td className="p-3 font-medium text-foreground">{c.name}</td>
                        <td className="p-3 text-muted-foreground hidden sm:table-cell">{c.phone}</td>
                        <td className="p-3 text-muted-foreground">{new Date(c.lastVisit).toLocaleDateString("pt-BR")} <span className="text-xs text-warning">({daysSince}d)</span></td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">R$ {c.totalSpent.toLocaleString("pt-BR")}</td>
                        <td className="p-3"><Badge variant="outline" className="border-warning/30 text-warning">Pendente</Badge></td>
                        <td className="p-3 text-right flex gap-1 justify-end">
                          <Button size="sm" variant="outline" className="text-xs border-success/30 text-success hover:bg-success/10"
                            onClick={() => setWhatsappClient(c)}>
                            <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">Ignorar</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Client Profile Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-lg bg-card border-border">
          {selectedClient && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full gradient-brand flex items-center justify-center text-lg font-bold text-primary-foreground">
                    {selectedClient.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <DialogTitle className="text-foreground">{selectedClient.name}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 rounded-lg bg-secondary/50"><p className="text-xs text-muted-foreground">Total Gasto</p><p className="text-lg font-bold text-foreground">R$ {selectedClient.totalSpent.toLocaleString("pt-BR")}</p></div>
                <div className="p-3 rounded-lg bg-secondary/50"><p className="text-xs text-muted-foreground">Último Atendimento</p><p className="text-lg font-bold text-foreground">{new Date(selectedClient.lastVisit).toLocaleDateString("pt-BR")}</p></div>
                <div className="p-3 rounded-lg bg-secondary/50"><p className="text-xs text-muted-foreground">Telefone</p><p className="text-sm font-medium text-foreground">{selectedClient.phone}</p></div>
                <div className="p-3 rounded-lg bg-secondary/50"><p className="text-xs text-muted-foreground">Status</p><Badge className={cn(selectedClient.status === "Ativa" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground", "border-0 mt-1")}>{selectedClient.status}</Badge></div>
              </div>
              {selectedClient.notes && (
                <div className="p-3 rounded-lg bg-secondary/50 mt-2"><p className="text-xs text-muted-foreground mb-1">Observações</p><p className="text-sm text-foreground">{selectedClient.notes}</p></div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="max-w-lg bg-card border-border">
          {editingClient && (
            <>
              <DialogHeader><DialogTitle className="text-foreground">Editar Cliente</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="col-span-2"><Label className="text-muted-foreground text-xs">Nome</Label><Input value={editingClient.name} onChange={e => setEditingClient({ ...editingClient, name: e.target.value })} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Telefone</Label><Input value={editingClient.phone} onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Email</Label><Input value={editingClient.email} onChange={e => setEditingClient({ ...editingClient, email: e.target.value })} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Status</Label>
                  <Select value={editingClient.status} onValueChange={v => setEditingClient({ ...editingClient, status: v as any })}>
                    <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border"><SelectItem value="Ativa">Ativa</SelectItem><SelectItem value="Inativa">Inativa</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label className="text-muted-foreground text-xs">Observações</Label><Textarea value={editingClient.notes} onChange={e => setEditingClient({ ...editingClient, notes: e.target.value })} className="bg-secondary border-border mt-1" /></div>
              </div>
              <Button onClick={() => { setClients(prev => prev.map(c => c.id === editingClient.id ? editingClient : c)); setEditingClient(null); }} className="w-full mt-4 gradient-brand text-primary-foreground">Salvar</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={!!whatsappClient} onOpenChange={() => setWhatsappClient(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          {whatsappClient && (
            <>
              <DialogHeader><DialogTitle className="text-foreground">Enviar WhatsApp para {whatsappClient.name}</DialogTitle></DialogHeader>
              <div className="space-y-2 mt-2">
                {whatsappMessages.map(m => (
                  <Button key={m.label} variant="outline" className="w-full justify-start text-left h-auto py-3 border-border text-foreground" onClick={() => openWhatsApp(whatsappClient, m.msg)}>
                    <div><p className="text-sm font-medium">{m.label}</p><p className="text-xs text-muted-foreground mt-0.5">{m.msg.replace("{{nome}}", whatsappClient.name.split(" ")[0])}</p></div>
                  </Button>
                ))}
                <div className="pt-2 border-t border-border">
                  <Label className="text-muted-foreground text-xs">Mensagem personalizada</Label>
                  <Textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)} placeholder="Digite sua mensagem..." className="bg-secondary border-border mt-1" />
                  <Button onClick={() => { if (customMsg) openWhatsApp(whatsappClient, customMsg); }} disabled={!customMsg} className="w-full mt-2 gradient-brand text-primary-foreground" size="sm">
                    <MessageCircle className="w-4 h-4 mr-1" /> Enviar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
