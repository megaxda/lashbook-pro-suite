import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { demoClientes } from "@/data/demoData";
import { Search, Plus, Eye, Pencil, Trash2, MessageCircle, MoreHorizontal, Cake } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Cliente {
  id: string; nome: string; telefone: string | null; email: string | null;
  notas: string | null; status: string | null; foto_url: string | null;
  birthday: string | null; created_at: string; user_id: string;
}

const whatsappMessages = [
  { label: "Confirmação de agendamento", msg: "Olá {{nome}}! Seu agendamento está confirmado. Nos vemos em breve! 😊" },
  { label: "Lembrete de retorno", msg: "Oi {{nome}}! Estamos com saudades! Que tal agendar sua manutenção? 💕" },
  { label: "Reativação de cliente", msg: "Olá {{nome}}! Faz tempo que não nos vemos. Temos novidades incríveis, venha conferir! ✨" },
];

export default function ClientesTab() {
  const { user, isDemo } = useAuth();
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todas");
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [whatsappClient, setWhatsappClient] = useState<Cliente | null>(null);
  const [customMsg, setCustomMsg] = useState("");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newForm, setNewForm] = useState({ nome: "", telefone: "", email: "", notas: "", birthday: "" });
  const [saving, setSaving] = useState(false);

  const fetchClients = async () => {
    if (isDemo) {
      setClients(demoClientes as Cliente[]);
      setLoading(false);
      return;
    }
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("clientes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar clientes");
    else setClients(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, [user, isDemo]);

  const filtered = clients.filter(c => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase()) || (c.telefone || "").includes(search) || (c.email || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todas" || c.status === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  // Birthday check
  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth() + 1;
  const birthdayClients = clients.filter(c => {
    if (!c.birthday) return false;
    const d = new Date(c.birthday + "T12:00");
    return d.getDate() === todayDay && (d.getMonth() + 1) === todayMonth;
  });

  const demoBlock = () => { if (isDemo) { toast.info("Modo Demo: alterações não são salvas."); return true; } return false; };

  const createClient = async () => {
    if (!newForm.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    if (demoBlock()) { setNewDialogOpen(false); return; }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("clientes").insert({
      nome: newForm.nome, telefone: newForm.telefone || null, email: newForm.email || null,
      notas: newForm.notas || null, birthday: newForm.birthday || null, user_id: user.id
    });
    setSaving(false);
    if (error) { toast.error("Erro ao criar cliente"); return; }
    toast.success("Cliente criado!");
    setNewDialogOpen(false);
    setNewForm({ nome: "", telefone: "", email: "", notas: "", birthday: "" });
    fetchClients();
  };

  const updateClient = async () => {
    if (!editingClient) return;
    if (demoBlock()) { setEditingClient(null); return; }
    setSaving(true);
    const { error } = await supabase.from("clientes").update({
      nome: editingClient.nome, telefone: editingClient.telefone, email: editingClient.email,
      notas: editingClient.notas, status: editingClient.status, birthday: editingClient.birthday
    }).eq("id", editingClient.id);
    setSaving(false);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success("Cliente atualizado!");
    setEditingClient(null);
    fetchClients();
  };

  const deleteClient = async (id: string) => {
    if (demoBlock()) return;
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Cliente excluído!");
    fetchClients();
  };

  const toggleStatus = async (c: Cliente) => {
    if (demoBlock()) return;
    const newStatus = c.status === "ativa" ? "inativa" : "ativa";
    const { error } = await supabase.from("clientes").update({ status: newStatus }).eq("id", c.id);
    if (error) toast.error("Erro ao alterar status");
    else fetchClients();
  };

  const openWhatsApp = (client: Cliente, message: string) => {
    const phone = (client.telefone || "").replace(/\D/g, "");
    const msg = message.replace("{{nome}}", client.nome.split(" ")[0]);
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando clientes...</p></div>;

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
            <Button size="sm" className="gradient-brand text-primary-foreground h-8 text-xs" onClick={() => setNewDialogOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Novo</Button>
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
                  <th className="text-left p-2.5 text-muted-foreground font-medium text-xs hidden md:table-cell">Email</th>
                  <th className="text-left p-2.5 text-muted-foreground font-medium text-xs">Status</th>
                  <th className="text-right p-2.5 text-muted-foreground font-medium text-xs w-10"></th>
                </tr></thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} onClick={() => setSelectedClient(c)} className="border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer">
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-primary-foreground flex-shrink-0">
                            {c.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground text-sm truncate">{c.nome}</span>
                        </div>
                      </td>
                      <td className="p-2.5 text-muted-foreground text-xs hidden sm:table-cell">{c.telefone || "—"}</td>
                      <td className="p-2.5 text-muted-foreground text-xs hidden md:table-cell truncate max-w-[160px]">{c.email || "—"}</td>
                      <td className="p-2.5">
                        <Badge variant={c.status === "ativa" ? "default" : "secondary"} className={cn("text-[10px] border-0", c.status === "ativa" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>{c.status === "ativa" ? "Ativa" : "Inativa"}</Badge>
                      </td>
                      <td className="p-2.5 text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-muted-foreground h-9 w-9 min-h-[36px] p-0"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem onClick={() => setSelectedClient(c)} className="gap-2 text-xs"><Eye className="w-3.5 h-3.5" /> Ver</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingClient({ ...c })} className="gap-2 text-xs"><Pencil className="w-3.5 h-3.5" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setWhatsappClient(c)} className="gap-2 text-xs"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatus(c)} className="gap-2 text-xs">{c.status === "ativa" ? "Inativar" : "Ativar"}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteClient(c.id)} className="gap-2 text-xs text-destructive"><Trash2 className="w-3.5 h-3.5" /> Apagar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground text-sm">Nenhum cliente encontrado.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="followup">
          <div className="space-y-4">
            {/* Birthday section */}
            {birthdayClients.length > 0 && (
              <div className="bg-card rounded-xl p-4 border border-primary/20">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Cake className="w-4 h-4 text-primary" /> Aniversariantes de Hoje 🎂</h3>
                <div className="space-y-2">
                  {birthdayClients.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-primary/5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                          {c.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-foreground">{c.nome}</span>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs h-7 border-primary/30 text-primary" onClick={() => openWhatsApp(c, `Parabéns, ${c.nome.split(" ")[0]}! 🎂🎉 Desejamos um dia maravilhoso! Com carinho, sua profissional de estética favorita! 💕`)}>
                        <MessageCircle className="w-3 h-3 mr-1" /> Parabéns
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-muted-foreground text-sm text-center py-4">Follow-ups serão calculados com base nos agendamentos reais.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Client */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          {selectedClient && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center text-base font-bold text-primary-foreground">
                    {selectedClient.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedClient.nome}</p>
                    <p className="text-xs text-muted-foreground">{selectedClient.email || "Sem email"}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Telefone</p><p className="text-sm text-foreground">{selectedClient.telefone || "—"}</p></div>
                <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Status</p><Badge className={cn(selectedClient.status === "ativa" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground", "border-0 mt-1 text-[10px]")}>{selectedClient.status === "ativa" ? "Ativa" : "Inativa"}</Badge></div>
                {selectedClient.birthday && <div className="p-2.5 rounded-lg bg-secondary/50 col-span-2"><p className="text-[10px] text-muted-foreground">Aniversário</p><p className="text-sm text-foreground">{new Date(selectedClient.birthday + "T12:00").toLocaleDateString("pt-BR")}</p></div>}
              </div>
              {selectedClient.notas && <div className="p-2.5 rounded-lg bg-secondary/50 mt-2"><p className="text-[10px] text-muted-foreground mb-1">Observações</p><p className="text-sm text-foreground">{selectedClient.notas}</p></div>}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Client */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          {editingClient && (
            <>
              <DialogHeader><p className="font-semibold text-foreground">Editar Cliente</p></DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="col-span-2"><Label className="text-muted-foreground text-xs">Nome</Label><Input value={editingClient.nome} onChange={e => setEditingClient({ ...editingClient, nome: e.target.value })} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Telefone</Label><Input value={editingClient.telefone || ""} onChange={e => setEditingClient({ ...editingClient, telefone: e.target.value })} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Email</Label><Input value={editingClient.email || ""} onChange={e => setEditingClient({ ...editingClient, email: e.target.value })} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Aniversário</Label><Input type="date" value={editingClient.birthday || ""} onChange={e => setEditingClient({ ...editingClient, birthday: e.target.value })} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Status</Label>
                  <Select value={editingClient.status || "ativa"} onValueChange={v => setEditingClient({ ...editingClient, status: v })}>
                    <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border"><SelectItem value="ativa">Ativa</SelectItem><SelectItem value="inativa">Inativa</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label className="text-muted-foreground text-xs">Observações</Label><Textarea value={editingClient.notas || ""} onChange={e => setEditingClient({ ...editingClient, notas: e.target.value })} className="bg-secondary border-border mt-1" /></div>
              </div>
              <Button onClick={updateClient} disabled={saving} className="w-full mt-3 gradient-brand text-primary-foreground">{saving ? "Salvando..." : "Salvar"}</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Client */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader><p className="font-semibold text-foreground">Novo Cliente</p></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Nome completo</Label><Input value={newForm.nome} onChange={e => setNewForm({ ...newForm, nome: e.target.value })} placeholder="Nome da cliente" className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Telefone</Label><Input value={newForm.telefone} onChange={e => setNewForm({ ...newForm, telefone: e.target.value })} placeholder="(00) 00000-0000" className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Email</Label><Input value={newForm.email} onChange={e => setNewForm({ ...newForm, email: e.target.value })} placeholder="email@email.com" className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Data de Aniversário</Label><Input type="date" value={newForm.birthday} onChange={e => setNewForm({ ...newForm, birthday: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Observações</Label><Textarea value={newForm.notas} onChange={e => setNewForm({ ...newForm, notas: e.target.value })} placeholder="Alergias, sensibilidades..." className="bg-secondary border-border mt-1" /></div>
          </div>
          <Button onClick={createClient} disabled={saving} className="w-full mt-4 gradient-brand text-primary-foreground">{saving ? "Salvando..." : "Salvar Cliente"}</Button>
        </DialogContent>
      </Dialog>

      {/* WhatsApp */}
      <Dialog open={!!whatsappClient} onOpenChange={() => setWhatsappClient(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm bg-card border-border">
          {whatsappClient && (
            <>
              <DialogHeader><p className="font-semibold text-foreground text-base break-words">WhatsApp — {whatsappClient.nome.split(" ")[0]}</p></DialogHeader>
              <div className="space-y-2 mt-2">
                {whatsappMessages.map(m => (
                  <Button key={m.label} variant="outline" className="w-full justify-start text-left h-auto py-2.5 border-border text-foreground" onClick={() => openWhatsApp(whatsappClient, m.msg)}>
                    <div className="min-w-0"><p className="text-xs font-medium break-words">{m.label}</p><p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 break-words">{m.msg.replace("{{nome}}", whatsappClient.nome.split(" ")[0])}</p></div>
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
