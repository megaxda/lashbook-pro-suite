import { useState } from "react";
import { Shield, Users, CreditCard, BarChart3, Activity, MoreHorizontal, Eye, Pencil, PauseCircle, PlayCircle, ArrowUpDown, Link2, Copy } from "lucide-react";
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
import { toast } from "sonner";

type DialogMode = "plan" | "edit" | "details" | "magic-link" | null;

interface UserRow {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  plano?: string;
  status_conta?: string;
  created_at?: string;
  last_login?: string;
}

export default function AdminPage() {
  const { users, isLoading, updateUser } = useAdminUsers();
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [newPlan, setNewPlan] = useState("");
  const [editForm, setEditForm] = useState({ nome: "", email: "", telefone: "" });
  const [magicLink, setMagicLink] = useState("");

  const typedUsers = users as UserRow[];

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);

  const totalUsers = typedUsers.length;
  const activeToday = typedUsers.filter(u => u.last_login?.slice(0, 10) === today).length;
  const newThisMonth = typedUsers.filter(u => u.created_at?.slice(0, 7) === thisMonth).length;
  const planCounts = typedUsers.reduce((acc, u) => {
    const p = u.plano || "basico";
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const openDialog = (mode: DialogMode, user: UserRow) => {
    setSelectedUser(user);
    setDialogMode(mode);
    if (mode === "plan") setNewPlan(user.plano || "basico");
    if (mode === "edit") setEditForm({ nome: user.nome || "", email: user.email || "", telefone: user.telefone || "" });
    if (mode === "magic-link") setMagicLink(`https://finbeauty.com.br/auth?token=${btoa(user.id).slice(0, 20)}`);
  };

  const handleUpdatePlan = () => {
    if (!selectedUser) return;
    updateUser.mutate({ id: selectedUser.id, updates: { plano: newPlan } });
    setDialogMode(null);
  };

  const handleToggleStatus = (user: UserRow) => {
    const currentStatus = user.status_conta || "ativo";
    const next = currentStatus === "ativo" ? "pausado" : "ativo";
    updateUser.mutate({ id: user.id, updates: { status_conta: next } });
  };

  const handleEditSave = () => {
    if (!selectedUser) return;
    updateUser.mutate({ id: selectedUser.id, updates: editForm });
    setDialogMode(null);
  };

  const copyMagicLink = () => {
    navigator.clipboard.writeText(magicLink);
    toast.success("Link copiado!");
  };

  const planBadge = (plan: string) => {
    const styles: Record<string, string> = {
      enterprise: "bg-amber-500/15 text-amber-400 border-0",
      pro: "bg-primary/15 text-primary border-0",
      basico: "bg-muted text-muted-foreground border-0",
    };
    return styles[plan] || styles.basico;
  };

  const statusBadge = (status: string) =>
    status === "ativo"
      ? "bg-emerald-500/15 text-emerald-400 border-0"
      : "bg-destructive/15 text-destructive border-0";

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in pb-20 lg:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg gradient-brand">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Painel Admin</h2>
          <p className="text-sm text-muted-foreground">Gestão da plataforma FinBeauty</p>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="analytics" className="gap-2"><BarChart3 className="w-4 h-4" /> Analítica</TabsTrigger>
          <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" /> Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard icon={Users} title="Total de Usuários" value={totalUsers} />
                <StatCard icon={Activity} title="Ativos Hoje" value={activeToday} trend={activeToday > 0 ? { value: "online", positive: true } : undefined} />
                <StatCard icon={CreditCard} title="Assinantes Pro" value={planCounts.pro || 0} />
                <StatCard icon={Users} title="Novos (mês)" value={newThisMonth} trend={newThisMonth > 0 ? { value: `+${newThisMonth}`, positive: true } : undefined} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["basico", "pro", "enterprise"].map(plan => (
                  <Card key={plan} className="bg-card border-border">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground capitalize">Plano {plan}</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold text-foreground">{planCounts[plan] || 0}</p><p className="text-xs text-muted-foreground mt-1">usuários</p></CardContent>
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
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Telefone</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                    <TableHead className="hidden lg:table-cell">Último Acesso</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typedUsers.map(u => (
                    <TableRow key={u.id} className="border-border/50">
                      <TableCell className="font-medium text-foreground">{u.nome || u.email?.split("@")[0] || "—"}</TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell">{u.email || "—"}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{u.telefone || "—"}</TableCell>
                      <TableCell><Badge className={planBadge(u.plano || "basico")}>{u.plano || "basico"}</Badge></TableCell>
                      <TableCell><Badge className={statusBadge(u.status_conta || "ativo")}>{u.status_conta || "ativo"}</Badge></TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell">{u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell">{u.last_login ? new Date(u.last_login).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem onClick={() => openDialog("plan", u)} className="gap-2"><ArrowUpDown className="w-4 h-4" /> Alterar Plano</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(u)} className="gap-2">
                              {(u.status_conta || "ativo") === "ativo" ? <><PauseCircle className="w-4 h-4" /> Pausar Conta</> : <><PlayCircle className="w-4 h-4" /> Ativar Conta</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDialog("edit", u)} className="gap-2"><Pencil className="w-4 h-4" /> Editar Dados</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDialog("details", u)} className="gap-2"><Eye className="w-4 h-4" /> Ver Detalhes</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDialog("magic-link", u)} className="gap-2"><Link2 className="w-4 h-4" /> Gerar Link Mágico</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {typedUsers.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">Nenhum usuário encontrado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogMode === "plan"} onOpenChange={open => !open && setDialogMode(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Alterar Plano</DialogTitle><DialogDescription>Selecione o novo plano para {selectedUser?.nome || selectedUser?.email}</DialogDescription></DialogHeader>
          <Select value={newPlan} onValueChange={setNewPlan}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-popover border-border"><SelectItem value="basico">Básico</SelectItem><SelectItem value="pro">Pro</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent>
          </Select>
          <DialogFooter><Button variant="outline" onClick={() => setDialogMode(null)}>Cancelar</Button><Button onClick={handleUpdatePlan}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === "edit"} onOpenChange={open => !open && setDialogMode(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Editar Dados</DialogTitle><DialogDescription>Atualize as informações de {selectedUser?.nome || selectedUser?.email}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={editForm.nome} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={editForm.telefone} onChange={e => setEditForm(f => ({ ...f, telefone: e.target.value }))} className="bg-secondary border-border" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogMode(null)}>Cancelar</Button><Button onClick={handleEditSave}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === "details"} onOpenChange={open => !open && setDialogMode(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Detalhes do Usuário</DialogTitle><DialogDescription>Informações completas</DialogDescription></DialogHeader>
          {selectedUser && (
            <div className="space-y-3 text-sm">
              {[
                ["Nome", selectedUser.nome || selectedUser.email?.split("@")[0]],
                ["Email", selectedUser.email],
                ["Telefone", selectedUser.telefone],
                ["Plano", selectedUser.plano],
                ["Status", selectedUser.status_conta || "ativo"],
                ["Cadastro", selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString("pt-BR") : "—"],
                ["Último Acesso", selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString("pt-BR") : "—"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{val || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === "magic-link"} onOpenChange={open => !open && setDialogMode(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Link Mágico</DialogTitle><DialogDescription>Link de acesso para {selectedUser?.nome || selectedUser?.email}</DialogDescription></DialogHeader>
          <div className="flex gap-2">
            <Input value={magicLink} readOnly className="bg-secondary border-border" />
            <Button onClick={copyMagicLink} variant="outline"><Copy className="w-4 h-4" /></Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
