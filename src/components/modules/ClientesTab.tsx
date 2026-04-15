import { useState } from "react";
import { mockClients, Client } from "@/data/mockData";
import { Search, Plus, Phone, Mail, Eye, Pencil, Trash2, MessageCircle, MoreHorizontal, Clock } from "lucide-react";
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

  const deleteClient = (id: string) => setClients(prev => prev.filter(c => c.id !== id));
  const toggleStatus = (id: string) => setClients(prev => prev.map(c => c.id === id ? { ...c, status: c.status === "Ativa" ? "Inativa" : "Ativa" } : c));

  const openWhatsApp = (client: Client, message: string) => {
    const phone = client.phone.replace(/\D/g, "");
    const msg = message.replace("{{nome}}", client.name.split(" ")[0]);
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <Tabs defaultValue="lista">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Clientes</h2>
            <p className="text-muted-foreground text-xs sm:text-sm">{clients.length} cadastrados</p>
          </div>
          <div className="flex items-center gap-2">
            <TabsList className="bg-secondary h-8">
              <TabsTrigger value="lista" className="text-xs h-7">Lista</TabsTrigger>
              <TabsTrigger value="followup" className="text-xs h-7">Follow-Up</TabsTrigger>
            </TabsList>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-brand text-primary-foreground h-8 text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Novo</Button>
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
                  <div className="col-span-2"><Label className="text-muted-foreground text-xs">Observações</Label><Input placeholder="Alergias, sensibilidades..." className="bg-secondary border-border mt-1" /></div>
                </div>
                <Button className="w-full mt-4 gradient-brand text-primary-foreground">Salvar Cliente</Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="lista">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary border-border h-9 text-sm" />
            </div>
            <div className="flex gap-1.5">
              {["Todas", "Ativa", "Inativa"].map(s => (
                <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}
                  className={cn("h-8 text-xs", statusFilter === s && "gradient-brand text-primary-foreground")}>{s}</Button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="text-left p-2.5 text-muted-foreground font-medium text-xs">Cliente</th>
                  <th className="text-left p-2.5 text-muted-foreground font-medium text-xs hidden sm:table-cell">Telefone</th>
                  <th className="text-left p-2.5 text-muted-foreground font-medium text-xs hidden lg:table-cell">Último Atend.</th>
                  <th className="text-left p-2.5 text-muted-foreground font-medium text-xs">Status</th>
                  <th className="text-right p-2.5 text-muted-foreground font-medium text-xs w-10"></th>
                </tr></thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-primary-foreground flex-shrink-0">
                            {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <span className="font-medium text-foreground text-sm truncate">{c.name}</span>
                        </div>
                      </td>
                      <td className="p-2.5 text-muted-foreground text-xs hidden sm:table-cell">{c.phone}</td>
                      <td className="p-2.5 text-muted-foreground text-xs hidden lg:table-cell">{new Date(c.lastVisit).toLocaleDateString("pt-BR")}</td>
                      <td className="p-2.5">
                        <Badge variant={c.status === "Ativa" ? "default" : "secondary"} className={cn("text-[10px] border-0", c.status === "Ativa" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>{c.status}</Badge>
                      </td>
                      <td className="p-2.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-muted-foreground h-7 w-7 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem onClick={() => setSelectedClient(c)} className="gap-2 text-xs"><Eye className="w-3.5 h-3.5" /> Ver</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingClient({ ...c })} className="gap-2 text-xs"><Pencil className="w-3.5 h-3.5" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setWhatsappClient(c)} className="gap-2 text-xs"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatus(c.id)} className="gap-2 text-xs">{c.status === "Ativa" ? "Inativar" : "Ativar"}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteClient(c.id)} className="gap-2 text-xs text-destructive"><Trash2 className="w-3.5 h-3.5" /> Apagar</DropdownMenuItem>
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
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="text-left p-2.5 text-muted-foreground font-medium text-xs">Cliente</th>
                  <th className="text-left p-2.5 text-muted-foreground font-medium text-xs">Último</th>
                  <th className="text-left p-2.5 text-muted-foreground font-medium text-xs hidden sm:table-cell">Dias</th>
                  <th className="text-center p-2.5 text-muted-foreground font-medium text-xs">Status</th>
                  <th className="text-right p-2.5 text-muted-foreground font-medium text-xs w-10"></th>
                </tr></thead>
                <tbody>
                  {followUpClients.map(c => {
                    const daysSince = Math.floor((today.getTime() - new Date(c.lastVisit).getTime()) / 86400000);
                    return (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/50">
                        <td className="p-2.5 font-medium text-foreground text-sm">{c.name.split(" ")[0]}</td>
                        <td className="p-2.5 text-muted-foreground text-xs">{new Date(c.lastVisit).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</td>
                        <td className="p-2.5 text-warning text-xs hidden sm:table-cell">{daysSince}d</td>
                        <td className="p-2.5 text-center"><Clock className="w-4 h-4 text-warning inline" /></td>
                        <td className="p-2.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem onClick={() => setWhatsappClient(c)} className="gap-2 text-xs"><MessageCircle className="w-3.5 h-3.5" /> Enviar notificação</DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-xs text-muted-foreground">Ignorar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
        <DialogContent className="max-w-md bg-card border-border">
          {selectedClient && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center text-base font-bold text-primary-foreground">
                    {selectedClient.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <DialogTitle className="text-foreground">{selectedClient.name}</DialogTitle>
                    <p className="text-xs text-muted-foreground">{selectedClient.email}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Total Gasto</p><p className="text-base font-bold text-foreground">R$ {selectedClient.totalSpent.toLocaleString("pt-BR")}</p></div>
                <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Último Atend.</p><p className="text-base font-bold text-foreground">{new Date(selectedClient.lastVisit).toLocaleDateString("pt-BR")}</p></div>
                <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Telefone</p><p className="text-sm text-foreground">{selectedClient.phone}</p></div>
                <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Status</p><Badge className={cn(selectedClient.status === "Ativa" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground", "border-0 mt-1 text-[10px]")}>{selectedClient.status}</Badge></div>
              </div>
              {selectedClient.notes && (
                <div className="p-2.5 rounded-lg bg-secondary/50 mt-2"><p className="text-[10px] text-muted-foreground mb-1">Observações</p><p className="text-sm text-foreground">{selectedClient.notes}</p></div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="max-w-md bg-card border-border">
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
              <Button onClick={() => { setClients(prev => prev.map(c => c.id === editingClient.id ? editingClient : c)); setEditingClient(null); }} className="w-full mt-3 gradient-brand text-primary-foreground">Salvar</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={!!whatsappClient} onOpenChange={() => setWhatsappClient(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          {whatsappClient && (
            <>
              <DialogHeader><DialogTitle className="text-foreground text-base">WhatsApp — {whatsappClient.name.split(" ")[0]}</DialogTitle></DialogHeader>
              <div className="space-y-2 mt-2">
                {whatsappMessages.map(m => (
                  <Button key={m.label} variant="outline" className="w-full justify-start text-left h-auto py-2.5 border-border text-foreground" onClick={() => openWhatsApp(whatsappClient, m.msg)}>
                    <div><p className="text-xs font-medium">{m.label}</p><p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{m.msg.replace("{{nome}}", whatsappClient.name.split(" ")[0])}</p></div>
                  </Button>
                ))}
                <div className="pt-2 border-t border-border">
                  <Label className="text-muted-foreground text-xs">Mensagem personalizada</Label>
                  <Textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)} placeholder="Digite sua mensagem..." className="bg-secondary border-border mt-1 text-sm min-h-[60px]" />
                  <Button size="sm" className="w-full mt-2 gradient-brand text-primary-foreground" onClick={() => { if (customMsg) openWhatsApp(whatsappClient, customMsg); }}>Enviar</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
