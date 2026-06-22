import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClientes, useAgendamentos, useInvalidate } from "@/hooks/queries";
import {
  Search, Plus, Pencil, Trash2, MessageCircle, MoreHorizontal, Cake,
  CalendarPlus, Phone, Mail, History, DollarSign, StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { matchAllTokens } from "@/lib/searchUtils";
import { localDateStr, parseDateStr, formatBR } from "@/lib/dateUtils";

interface Cliente {
  id: string; nome: string; telefone: string | null; email: string | null;
  notas: string | null; status: string | null; foto_url: string | null;
  birthday: string | null; created_at: string; user_id: string;
}
interface AgRow {
  id: string; cliente_id: string | null; data: string; horario: string;
  status: string | null; forma_pagamento: string | null;
  servicos?: { nome: string | null; preco: number | null } | null;
  pagamentos_detalhe?: Array<{ metodo: string; valor: number }> | null;
}

const whatsappMessages = [
  { label: "Confirmação de agendamento", msg: "Olá {{nome}}! Seu agendamento está confirmado. Nos vemos em breve! 😊" },
  { label: "Lembrete de retorno", msg: "Oi {{nome}}! Estamos com saudades! Que tal agendar sua manutenção? 💕" },
  { label: "Reativação de cliente", msg: "Olá {{nome}}! Faz tempo que não nos vemos. Temos novidades incríveis, venha conferir! ✨" },
];

type SortKey = "az" | "recent" | "lastVisit" | "birthday";
type FilterKey = "todas" | "ativas" | "inativas" | "aniversariantes" | "semRetorno";

const initials = (n: string) => n.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

function birthdayMonth(b: string | null) {
  if (!b) return null;
  return parseDateStr(b).getMonth();
}
function birthdayDay(b: string | null) {
  if (!b) return null;
  return parseDateStr(b).getDate();
}

export default function ClientesTab() {
  const { user, isDemo } = useAuth();
  const nav = useNavigate();
  const [clients, setClients] = useState<Cliente[]>([]);
  const [appts, setAppts] = useState<AgRow[]>([]);
  const [followUpDays, setFollowUpDays] = useState<number>(30);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("todas");
  const [sort, setSort] = useState<SortKey>("az");

  const [selected, setSelected] = useState<Cliente | null>(null);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [whatsappClient, setWhatsappClient] = useState<Cliente | null>(null);
  const [customMsg, setCustomMsg] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ nome: "", telefone: "", email: "", notas: "", birthday: "" });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    if (isDemo) {
      setClients(demoClientes as Cliente[]);
      setAppts([]);
      setLoading(false);
      return;
    }
    if (!user) return;
    setLoading(true);
    const [cRes, aRes, pRes] = await Promise.all([
      supabase.from("clientes").select("*").eq("user_id", user.id),
      supabase.from("agendamentos").select("id, cliente_id, data, horario, status, forma_pagamento, pagamentos_detalhe, servicos(nome, preco)").eq("user_id", user.id),
      supabase.from("profiles").select("follow_up_days").eq("id", user.id).maybeSingle(),
    ]);
    if (cRes.error) toast.error("Erro ao carregar clientes");
    setClients(cRes.data || []);
    setAppts(((aRes.data as any[]) || []) as AgRow[]);
    if (pRes.data?.follow_up_days) setFollowUpDays(pRes.data.follow_up_days);
    setLoading(false);
  };
  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [user, isDemo]);

  const today = useMemo(() => new Date(), []);
  const todayStr = localDateStr(today);
  const currentMonth = today.getMonth();

  // Map cliente_id → última visita (passada concluída), próximo agendamento futuro, total gasto, n. atendimentos
  const stats = useMemo(() => {
    const m = new Map<string, { last?: string; next?: AgRow; totalGasto: number; count: number }>();
    for (const a of appts) {
      if (!a.cliente_id) continue;
      const s = m.get(a.cliente_id) || { totalGasto: 0, count: 0 };
      if (a.status === "concluido") {
        s.count += 1;
        const pag = (a.pagamentos_detalhe || []).reduce((acc, p) => acc + Number(p.valor || 0), 0);
        s.totalGasto += pag > 0 ? pag : Number(a.servicos?.preco || 0);
        if (a.data <= todayStr && (!s.last || a.data > s.last)) s.last = a.data;
      }
      if (a.data >= todayStr && a.status !== "cancelado" && a.status !== "no_show") {
        if (!s.next || a.data < s.next.data || (a.data === s.next.data && a.horario < s.next.horario)) {
          s.next = a;
        }
      }
      m.set(a.cliente_id, s);
    }
    return m;
  }, [appts, todayStr]);

  // Filtros + busca + ordenação
  const list = useMemo(() => {
    let arr = clients.filter(c => matchAllTokens(search, [c.nome, c.telefone, c.email]));
    if (filter === "ativas") arr = arr.filter(c => c.status === "ativa" || !c.status);
    if (filter === "inativas") arr = arr.filter(c => c.status === "inativa");
    if (filter === "aniversariantes") arr = arr.filter(c => birthdayMonth(c.birthday) === currentMonth);
    if (filter === "semRetorno") {
      arr = arr.filter(c => {
        const s = stats.get(c.id);
        if (!s?.last) return true; // nunca atendida
        const diff = Math.floor((today.getTime() - parseDateStr(s.last).getTime()) / 86400000);
        return diff >= followUpDays;
      });
    }
    if (sort === "az") arr = [...arr].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
    if (sort === "recent") arr = [...arr].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    if (sort === "lastVisit") arr = [...arr].sort((a, b) => (stats.get(b.id)?.last || "").localeCompare(stats.get(a.id)?.last || ""));
    if (sort === "birthday") arr = [...arr].sort((a, b) => {
      const am = birthdayMonth(a.birthday); const bm = birthdayMonth(b.birthday);
      if (am === null && bm === null) return 0;
      if (am === null) return 1; if (bm === null) return -1;
      const av = am * 100 + (birthdayDay(a.birthday) || 0);
      const bv = bm * 100 + (birthdayDay(b.birthday) || 0);
      return av - bv;
    });
    return arr;
  }, [clients, search, filter, sort, stats, currentMonth, followUpDays, today]);

  const counts = useMemo(() => {
    const base = clients.length;
    const aniv = clients.filter(c => birthdayMonth(c.birthday) === currentMonth).length;
    const ativas = clients.filter(c => c.status === "ativa" || !c.status).length;
    const inativas = clients.filter(c => c.status === "inativa").length;
    const semRetorno = clients.filter(c => {
      const s = stats.get(c.id);
      if (!s?.last) return true;
      const diff = Math.floor((today.getTime() - parseDateStr(s.last).getTime()) / 86400000);
      return diff >= followUpDays;
    }).length;
    return { todas: base, ativas, inativas, aniversariantes: aniv, semRetorno };
  }, [clients, stats, currentMonth, today, followUpDays]);

  const birthdayMonthList = useMemo(
    () => clients.filter(c => birthdayMonth(c.birthday) === currentMonth)
      .sort((a, b) => (birthdayDay(a.birthday) || 0) - (birthdayDay(b.birthday) || 0)),
    [clients, currentMonth]
  );

  const demoBlock = () => { if (isDemo) { toast.info("Modo Demo: alterações não são salvas."); return true; } return false; };

  const createClient = async () => {
    if (!newForm.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    if (demoBlock()) { setNewOpen(false); return; }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("clientes").insert({
      nome: newForm.nome, telefone: newForm.telefone || null, email: newForm.email || null,
      notas: newForm.notas || null, birthday: newForm.birthday || null, user_id: user.id,
    });
    setSaving(false);
    if (error) { toast.error("Erro ao criar cliente"); return; }
    toast.success("Cliente criado!");
    setNewOpen(false);
    setNewForm({ nome: "", telefone: "", email: "", notas: "", birthday: "" });
    fetchAll();
  };

  const updateClient = async () => {
    if (!editing) return;
    if (demoBlock()) { setEditing(null); return; }
    setSaving(true);
    const { error } = await supabase.from("clientes").update({
      nome: editing.nome, telefone: editing.telefone, email: editing.email,
      notas: editing.notas, status: editing.status, birthday: editing.birthday,
    }).eq("id", editing.id);
    setSaving(false);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success("Cliente atualizado!");
    setEditing(null);
    fetchAll();
  };

  const deleteClient = async (id: string) => {
    if (demoBlock()) return;
    if (!confirm("Excluir esta cliente? O histórico será mantido.")) return;
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Cliente excluído!");
    fetchAll();
  };

  const toggleStatus = async (c: Cliente) => {
    if (demoBlock()) return;
    const newStatus = c.status === "ativa" ? "inativa" : "ativa";
    const { error } = await supabase.from("clientes").update({ status: newStatus }).eq("id", c.id);
    if (error) toast.error("Erro ao alterar status");
    else fetchAll();
  };

  const openWhatsApp = (client: Cliente, message: string) => {
    const phone = (client.telefone || "").replace(/\D/g, "");
    const msg = message.replace("{{nome}}", client.nome.split(" ")[0]);
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const newAgendamento = (c: Cliente) => {
    nav(`/home_profissional?tab=Agendamentos&novo=1&cliente=${c.id}`);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando clientes...</p></div>;

  // ---- Renderização do card de cliente (linha)
  const renderRow = (c: Cliente) => {
    const s = stats.get(c.id);
    const lastDiff = s?.last ? Math.floor((today.getTime() - parseDateStr(s.last).getTime()) / 86400000) : null;
    const isInactive = c.status === "inativa";
    const overdue = !isInactive && lastDiff !== null && lastDiff >= followUpDays;
    const stripe = isInactive ? "bg-muted-foreground/40" : overdue ? "bg-warning" : "bg-success";
    const isBirthdayMonth = birthdayMonth(c.birthday) === currentMonth;

    return (
      <div
        key={c.id}
        onClick={() => setSelected(c)}
        className="relative flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:bg-secondary/40 cursor-pointer transition-colors"
      >
        <div className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-r", stripe)} />
        <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
          {initials(c.nome)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm truncate">{c.nome}</span>
            {isInactive && <Badge variant="secondary" className="text-[10px] h-5">Inativa</Badge>}
            {isBirthdayMonth && <Badge className="text-[10px] h-5 bg-primary/15 text-primary border-0 gap-1"><Cake className="w-3 h-3" />{birthdayDay(c.birthday)?.toString().padStart(2, "0")}/{(currentMonth + 1).toString().padStart(2, "0")}</Badge>}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            {c.telefone && <span className="flex items-center gap-1 truncate"><Phone className="w-3 h-3" />{c.telefone}</span>}
            {c.email && <span className="hidden sm:flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{c.email}</span>}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {s?.last
              ? <Badge variant="outline" className={cn("text-[10px] h-5", overdue && "border-warning text-warning")}>Última: {formatBR(s.last)} {lastDiff !== null && `· ${lastDiff}d`}</Badge>
              : <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">Sem visita registrada</Badge>}
            {s?.next && <Badge variant="outline" className="text-[10px] h-5 border-info/40 text-info">Próx: {formatBR(s.next.data)} {s.next.horario.slice(0, 5)}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Button size="icon" variant="ghost" className="h-9 w-9" title="Novo agendamento" onClick={() => newAgendamento(c)}>
            <CalendarPlus className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 hidden sm:inline-flex" title="WhatsApp" onClick={() => setWhatsappClient(c)}>
            <MessageCircle className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-9 w-9"><MoreHorizontal className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem onClick={() => setEditing({ ...c })} className="gap-2 text-xs"><Pencil className="w-3.5 h-3.5" /> Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setWhatsappClient(c)} className="gap-2 text-xs"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleStatus(c)} className="gap-2 text-xs">{c.status === "ativa" ? "Inativar" : "Ativar"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => deleteClient(c.id)} className="gap-2 text-xs text-destructive"><Trash2 className="w-3.5 h-3.5" /> Apagar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  // ---- Drawer/Dialog de detalhe
  const renderDetail = () => {
    if (!selected) return null;
    const s = stats.get(selected.id);
    const history = appts
      .filter(a => a.cliente_id === selected.id)
      .sort((a, b) => (b.data + b.horario).localeCompare(a.data + a.horario));
    const concluidos = history.filter(a => a.status === "concluido");
    const totalGasto = concluidos.reduce((acc, a) => {
      const pag = (a.pagamentos_detalhe || []).reduce((s2, p) => s2 + Number(p.valor || 0), 0);
      return acc + (pag > 0 ? pag : Number(a.servicos?.preco || 0));
    }, 0);
    const ticket = concluidos.length ? totalGasto / concluidos.length : 0;

    return (
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-xl bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center text-base font-bold text-primary-foreground">
                {initials(selected.nome)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">{selected.nome}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                  {selected.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selected.telefone}</span>}
                  {selected.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{selected.email}</span>}
                  {selected.birthday && <span className="flex items-center gap-1"><Cake className="w-3 h-3" />{formatBR(selected.birthday)}</span>}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 mt-2">
            <Button size="sm" className="gradient-brand text-primary-foreground h-8 text-xs" onClick={() => newAgendamento(selected)}>
              <CalendarPlus className="w-3.5 h-3.5 mr-1" /> Novo agendamento
            </Button>
            {selected.telefone && (
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setWhatsappClient(selected)}>
                <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditing({ ...selected })}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
            </Button>
          </div>

          <Tabs defaultValue="historico" className="mt-3">
            <TabsList className="bg-secondary h-8">
              <TabsTrigger value="historico" className="text-xs h-7 gap-1"><History className="w-3 h-3" />Histórico</TabsTrigger>
              <TabsTrigger value="financeiro" className="text-xs h-7 gap-1"><DollarSign className="w-3 h-3" />Financeiro</TabsTrigger>
              <TabsTrigger value="notas" className="text-xs h-7 gap-1"><StickyNote className="w-3 h-3" />Notas</TabsTrigger>
            </TabsList>

            <TabsContent value="historico" className="mt-3">
              <div className="max-h-72 overflow-y-auto space-y-2">
                {history.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem atendimentos.</p>}
                {history.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 border border-border/50">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{a.servicos?.nome || "Atendimento"}</p>
                      <p className="text-xs text-muted-foreground">{formatBR(a.data)} · {a.horario.slice(0, 5)}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] h-5 capitalize">{a.status || "—"}</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="financeiro" className="mt-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-lg bg-secondary/40 border border-border/50">
                  <p className="text-[10px] text-muted-foreground">Total gasto</p>
                  <p className="text-sm font-semibold text-foreground">R$ {totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/40 border border-border/50">
                  <p className="text-[10px] text-muted-foreground">Atendimentos</p>
                  <p className="text-sm font-semibold text-foreground">{concluidos.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/40 border border-border/50">
                  <p className="text-[10px] text-muted-foreground">Ticket médio</p>
                  <p className="text-sm font-semibold text-foreground">R$ {ticket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              {s?.last && <p className="text-xs text-muted-foreground mt-3">Última visita: <span className="text-foreground">{formatBR(s.last)}</span></p>}
              {s?.next && <p className="text-xs text-muted-foreground">Próximo: <span className="text-foreground">{formatBR(s.next.data)} {s.next.horario.slice(0, 5)}</span></p>}
            </TabsContent>

            <TabsContent value="notas" className="mt-3">
              <p className="text-sm text-foreground whitespace-pre-wrap">{selected.notas || <span className="text-muted-foreground">Sem observações.</span>}</p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Tabs defaultValue="lista">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Clientes</h2>
            <p className="text-muted-foreground text-xs sm:text-sm">{clients.length} cadastrados</p>
          </div>
          <div className="flex items-center gap-2">
            <TabsList className="bg-secondary h-8">
              <TabsTrigger value="lista" className="text-xs h-7">Lista</TabsTrigger>
              <TabsTrigger value="aniversarios" className="text-xs h-7">Aniversários</TabsTrigger>
            </TabsList>
            <Button size="sm" className="gradient-brand text-primary-foreground h-8 text-xs" onClick={() => setNewOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Novo
            </Button>
          </div>
        </div>

        <TabsContent value="lista" className="space-y-3 mt-3">
          {/* Busca + ordenação */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, telefone ou email…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary border-border h-9 text-sm" />
            </div>
            <Select value={sort} onValueChange={v => setSort(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-44 bg-secondary border-border h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="az">A–Z</SelectItem>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="lastVisit">Última visita</SelectItem>
                <SelectItem value="birthday">Aniversário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chips de filtro */}
          <div className="flex flex-wrap gap-1.5">
            {([
              ["todas", "Todas", counts.todas],
              ["ativas", "Ativas", counts.ativas],
              ["inativas", "Inativas", counts.inativas],
              ["aniversariantes", "Aniversariantes do mês", counts.aniversariantes],
              ["semRetorno", `Sem retorno ${followUpDays}d+`, counts.semRetorno],
            ] as Array<[FilterKey, string, number]>).map(([k, label, n]) => (
              <Button key={k} size="sm" variant={filter === k ? "default" : "outline"}
                onClick={() => setFilter(k)}
                className={cn("h-7 text-xs gap-1.5", filter === k && "gradient-brand text-primary-foreground")}>
                {label} <span className={cn("text-[10px] px-1.5 rounded-full", filter === k ? "bg-primary-foreground/20" : "bg-secondary text-muted-foreground")}>{n}</span>
              </Button>
            ))}
          </div>

          {/* Lista */}
          <div className="space-y-2">
            {list.length === 0
              ? <div className="p-8 text-center text-muted-foreground text-sm bg-card rounded-xl border border-border">Nenhum cliente encontrado.</div>
              : list.map(renderRow)}
          </div>
        </TabsContent>

        <TabsContent value="aniversarios" className="mt-3 space-y-3">
          <div className="bg-card rounded-xl p-4 border border-primary/20">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Cake className="w-4 h-4 text-primary" /> Aniversariantes deste mês
            </h3>
            {birthdayMonthList.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-4">Ninguém faz aniversário neste mês.</p>
              : <div className="space-y-2">
                {birthdayMonthList.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-primary/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {initials(c.nome)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{c.nome}</p>
                        <p className="text-[10px] text-muted-foreground">{birthdayDay(c.birthday)?.toString().padStart(2, "0")}/{(currentMonth + 1).toString().padStart(2, "0")}</p>
                      </div>
                    </div>
                    {c.telefone && (
                      <Button size="sm" variant="outline" className="text-xs h-7 border-primary/30 text-primary"
                        onClick={() => openWhatsApp(c, `Parabéns, ${c.nome.split(" ")[0]}! 🎂🎉 Desejamos um dia maravilhoso! 💕`)}>
                        <MessageCircle className="w-3 h-3 mr-1" /> Parabéns
                      </Button>
                    )}
                  </div>
                ))}
              </div>}
          </div>
        </TabsContent>
      </Tabs>

      {renderDetail()}

      {/* Editar */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          {editing && (
            <>
              <DialogHeader><p className="font-semibold text-foreground">Editar Cliente</p></DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="col-span-2"><Label className="text-muted-foreground text-xs">Nome</Label><Input value={editing.nome} onChange={e => setEditing({ ...editing, nome: e.target.value })} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Telefone</Label><Input value={editing.telefone || ""} onChange={e => setEditing({ ...editing, telefone: e.target.value })} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Email</Label><Input value={editing.email || ""} onChange={e => setEditing({ ...editing, email: e.target.value })} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Aniversário</Label><Input type="date" value={editing.birthday || ""} onChange={e => setEditing({ ...editing, birthday: e.target.value })} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Status</Label>
                  <Select value={editing.status || "ativa"} onValueChange={v => setEditing({ ...editing, status: v })}>
                    <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border"><SelectItem value="ativa">Ativa</SelectItem><SelectItem value="inativa">Inativa</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label className="text-muted-foreground text-xs">Observações</Label><Textarea value={editing.notas || ""} onChange={e => setEditing({ ...editing, notas: e.target.value })} className="bg-secondary border-border mt-1" /></div>
              </div>
              <Button onClick={updateClient} disabled={saving} className="w-full mt-3 gradient-brand text-primary-foreground">{saving ? "Salvando..." : "Salvar"}</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Novo */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
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
        <DialogContent className="sm:max-w-sm bg-card border-border overflow-hidden">
          {whatsappClient && (
            <>
              <DialogHeader>
                <p className="font-semibold text-foreground break-words pr-6">WhatsApp — {whatsappClient.nome.split(" ")[0]}</p>
              </DialogHeader>
              <div className="space-y-2 mt-2">
                {whatsappMessages.map(m => (
                  <button key={m.label} type="button"
                    className="w-full text-left py-3 px-3 rounded-md border border-border bg-background hover:bg-accent transition-colors"
                    onClick={() => openWhatsApp(whatsappClient, m.msg)}>
                    <p className="text-sm font-semibold text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 break-words line-clamp-2">
                      {m.msg.replace("{{nome}}", whatsappClient.nome.split(" ")[0])}
                    </p>
                  </button>
                ))}
                <div className="pt-3 border-t border-border">
                  <Label className="text-xs">Mensagem personalizada</Label>
                  <Textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)} placeholder="Digite sua mensagem..." className="bg-secondary border-border mt-1 min-h-[72px]" />
                  <Button size="sm" className="w-full mt-2 gradient-brand text-primary-foreground h-10"
                    onClick={() => { if (customMsg) openWhatsApp(whatsappClient, customMsg); }}>
                    Enviar
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
