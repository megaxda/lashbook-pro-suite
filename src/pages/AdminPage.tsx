import { useState } from "react";
import { Shield, Users, CreditCard, BarChart3, Activity, MoreHorizontal, Eye, Pencil, PauseCircle, PlayCircle, ArrowUpDown, Mail, Bell, Clock } from "lucide-react";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import StatCard from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type DialogMode = "plan" | "edit" | "details" | "magic-link" | null;

interface UserRow {
  id: string; nome: string; email: string; telefone?: string; plano?: string; status_conta?: string; created_at?: string; last_login?: string;
}

export default function AdminPage() {
  const { users, isLoading, updateUser } = useAdminUsers();
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [newPlan, setNewPlan] = useState("");
  const [editForm, setEditForm] = useState({ nome: "", email: "", telefone: "" });
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [notifMsg, setNotifMsg] = useState("");
  const [notifInterval, setNotifInterval] = useState("1h");

  const typedUsers = users as UserRow[];
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const totalUsers = typedUsers.length;
  const activeToday = typedUsers.filter(u => u.last_login?.slice(0, 10) === today).length;
  const newThisMonth = typedUsers.filter(u => u.created_at?.slice(0, 7) === thisMonth).length;
  const planCounts = typedUsers.reduce((acc, u) => { const p = u.plano || "basico"; acc[p] = (acc[p] || 0) + 1; return acc; }, {} as Record<string, number>);

  const openDialog = (mode: DialogMode, user: UserRow) => {
    setSelectedUser(user);
    setDialogMode(mode);
    if (mode === "plan") setNewPlan(user.plano || "basico");
    if (mode === "edit") setEditForm({ nome: user.nome || "", email: user.email || "", telefone: user.telefone || "" });
    if (mode === "magic-link") setMagicLinkEmail(user.email || "");
  };

  const handleUpdatePlan = () => { if (!selectedUser) return; updateUser.mutate({ id: selectedUser.id, updates: { plano: newPlan } }); setDialogMode(null); };
  const handleToggleStatus = (user: UserRow) => { updateUser.mutate({ id: user.id, updates: { status_conta: user.status_conta === "ativo" ? "pausado" : "ativo" } }); };
  const handleEditSave = () => { if (!selectedUser) return; updateUser.mutate({ id: selectedUser.id, updates: editForm }); setDialogMode(null); };

  const planBadge = (plan: string) => ({ enterprise: "bg-amber-500/15 text-amber-400 border-0", pro: "bg-primary/15 text-primary border-0", basico: "bg-muted text-muted-foreground border-0" }[plan] || "bg-muted text-muted-foreground border-0");
  const statusBadge = (status: string) => status === "ativo" ? "bg-emerald-500/15 text-emerald-400 border-0" : "bg-destructive/15 text-destructive border-0";

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg gradient-pink"><Shield className="w-5 h-5 text-primary-foreground" /></div>
        <div><h2 className="text-2xl font-bold text-foreground">Painel Admin</h2><p className="text-sm text-muted-foreground">Gestão da plataforma</p></div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="bg-secondary flex-wrap h-auto gap-1">
          <TabsTrigger value="analytics">Analítica</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard icon={Users} title="Total" value={totalUsers} />
                <StatCard icon={Activity} title="Ativos Hoje" value={activeToday} />
                <StatCard icon={CreditCard} title="Pro" value={planCounts.pro || 0} />
                <StatCard icon={Users} title="Novos (mês)" value={newThisMonth} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {["basico", "pro", "enterprise"].map(plan => (
                  <Card key={plan} className="bg-card border-border">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground capitalize">Plano {plan}</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold text-foreground">{planCounts[plan] || 0}</p></CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="users">
          <div className="gradient-card rounded-xl border border-border overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border"><TableHead>Nome</TableHead><TableHead className="hidden sm:table-cell">Email</TableHead><TableHead>Plano</TableHead><TableHead>Status</TableHead><TableHead className="w-10" /></TableRow>
                  </TableHeader>
                  <TableBody>
                    {typedUsers.map(u => (
                      <TableRow key={u.id} className="border-border/50">
                        <TableCell className="font-medium text-foreground">{u.nome || "—"}</TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">{u.email || "—"}</TableCell>
                        <TableCell><Badge className={planBadge(u.plano || "basico")}>{u.plano || "basico"}</Badge></TableCell>
                        <TableCell><Badge className={statusBadge(u.status_conta || "ativo")}>{u.status_conta || "ativo"}</Badge></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem onClick={() => openDialog("plan", u)} className="gap-2"><ArrowUpDown className="w-4 h-4" /> Alterar Plano</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(u)} className="gap-2">{u.status_conta === "ativo" ? <><PauseCircle className="w-4 h-4" /> Pausar</> : <><PlayCircle className="w-4 h-4" /> Ativar</>}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openDialog("edit", u)} className="gap-2"><Pencil className="w-4 h-4" /> Editar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDialog("details", u)} className="gap-2"><Eye className="w-4 h-4" /> Detalhes</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDialog("magic-link", u)} className="gap-2"><Mail className="w-4 h-4" /> Magic Link</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {typedUsers.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">Nenhum usuário.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Notificação Push Manual</h3>
            <div><Label className="text-xs text-muted-foreground">Mensagem</Label><Textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)} placeholder="Digite a notificação..." className="bg-secondary border-border mt-1" /></div>
            <Button className="gradient-pink text-primary-foreground" disabled={!notifMsg}>Enviar para Todos</Button>
          </div>

          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Notificação Automática Pré-Agendamento</h3>
            <p className="text-sm text-muted-foreground">Lembrete automático antes dos agendamentos.</p>
            <div><Label className="text-xs text-muted-foreground">Intervalo antes</Label>
              <Select value={notifInterval} onValueChange={setNotifInterval}>
                <SelectTrigger className="bg-secondary border-border mt-1 w-40"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border"><SelectItem value="1h">1 hora antes</SelectItem><SelectItem value="2h">2 horas antes</SelectItem><SelectItem value="24h">24 horas antes</SelectItem></SelectContent>
              </Select></div>
            <div className="p-3 rounded-lg bg-secondary">
              <p className="text-sm text-foreground">Mensagem: "Seu próximo agendamento é às <span className="text-primary">[hora]</span> com <span className="text-primary">[cliente]</span>. Prepare-se!"</p>
            </div>
            <div className="flex items-center justify-between"><Label>Ativar</Label><Switch defaultChecked /></div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={dialogMode === "plan"} onOpenChange={open => !open && setDialogMode(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Alterar Plano</DialogTitle><DialogDescription>Plano de {selectedUser?.nome}</DialogDescription></DialogHeader>
          <Select value={newPlan} onValueChange={setNewPlan}><SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger><SelectContent className="bg-popover border-border"><SelectItem value="basico">Básico</SelectItem><SelectItem value="pro">Pro</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent></Select>
          <DialogFooter><Button variant="outline" onClick={() => setDialogMode(null)}>Cancelar</Button><Button onClick={handleUpdatePlan}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === "edit"} onOpenChange={open => !open && setDialogMode(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Editar Dados</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={editForm.nome} onChange={e => setEditForm(f => ({...f, nome: e.target.value}))} className="bg-secondary border-border" /></div>
            <div><Label>Email</Label><Input value={editForm.email} onChange={e => setEditForm(f => ({...f, email: e.target.value}))} className="bg-secondary border-border" /></div>
            <div><Label>Telefone</Label><Input value={editForm.telefone} onChange={e => setEditForm(f => ({...f, telefone: e.target.value}))} className="bg-secondary border-border" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogMode(null)}>Cancelar</Button><Button onClick={handleEditSave}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === "details"} onOpenChange={open => !open && setDialogMode(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Detalhes</DialogTitle></DialogHeader>
          {selectedUser && <div className="space-y-2 text-sm">{[["Nome", selectedUser.nome], ["Email", selectedUser.email], ["Telefone", selectedUser.telefone], ["Plano", selectedUser.plano], ["Status", selectedUser.status_conta], ["Cadastro", selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString("pt-BR") : "—"], ["Último Acesso", selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString("pt-BR") : "—"]].map(([l, v]) => (<div key={l} className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">{l}</span><span className="text-foreground font-medium">{v || "—"}</span></div>))}</div>}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === "magic-link"} onOpenChange={open => !open && setDialogMode(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Enviar Magic Link</DialogTitle><DialogDescription>Envia um link de redefinição de senha para o email do usuário.</DialogDescription></DialogHeader>
          <div><Label>Email</Label><Input value={magicLinkEmail} onChange={e => setMagicLinkEmail(e.target.value)} className="bg-secondary border-border" /></div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogMode(null)}>Cancelar</Button><Button className="gradient-pink text-primary-foreground" onClick={() => setDialogMode(null)}><Mail className="w-4 h-4 mr-1" /> Enviar Link</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
