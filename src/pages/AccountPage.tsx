import { useState, useRef, useEffect } from "react";
import { Camera, Plus, Trash2, GripVertical, Copy, ExternalLink, Check, Loader2, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function sanitizeSlug(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

type SlugState = "idle" | "checking" | "available" | "taken" | "invalid" | "current";

export default function AccountPage() {
  const { user, profile, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Account form
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [bio, setBio] = useState("");

  // Studio form
  const [studioName, setStudioName] = useState("");
  const [followUpDays, setFollowUpDays] = useState(21);

  // Link Bio
  const [slug, setSlug] = useState("");
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [slugState, setSlugState] = useState<SlugState>("idle");
  const [bioLinks, setBioLinks] = useState<{ id: string; label: string; url: string }[]>([]);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [cobrarSinal, setCobrarSinal] = useState(false);
  const [valorSinal, setValorSinal] = useState(0);
  const [pixKeyType, setPixKeyType] = useState("");
  const [pixKey, setPixKey] = useState("");

  useEffect(() => {
    if (profile) {
      setNome(profile.nome || "");
      setEmail(profile.email || "");
      setTelefone(profile.telefone || "");
      setInstagram(profile.instagram || "");
      setBio(profile.bio || "");
      setStudioName(profile.studio_name || "");
      setFollowUpDays(profile.follow_up_days || 21);
      setSlug(profile.slug || "");
      setSavedSlug(profile.slug || null);
      setSlugState(profile.slug ? "current" : "idle");
      setBioLinks(Array.isArray(profile.outros_links) ? (profile.outros_links as any[]) : []);
      setCobrarSinal(profile.cobrar_sinal || false);
      setValorSinal(profile.valor_sinal || 0);
      setPixKeyType(profile.pix_key_type || "");
      setPixKey(profile.pix_key || "");
    }
  }, [profile]);

  // Debounced slug check
  useEffect(() => {
    if (!slug) { setSlugState("idle"); return; }
    if (slug === savedSlug) { setSlugState("current"); return; }
    if (!/^[a-z0-9-]{3,40}$/.test(slug)) { setSlugState("invalid"); return; }
    setSlugState("checking");
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc("check_slug_available", { _slug: slug });
      if (error) { setSlugState("idle"); return; }
      setSlugState(data ? "available" : "taken");
    }, 400);
    return () => clearTimeout(t);
  }, [slug, savedSlug]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatar(URL.createObjectURL(file));
  };

  const saveAccount = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ nome, telefone, instagram, bio }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar");
    else { toast.success("Dados salvos!"); refreshProfile(); }
  };

  const saveStudio = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ studio_name: studioName, follow_up_days: followUpDays }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar");
    else { toast.success("Configurações salvas!"); refreshProfile(); }
  };

  const saveLinkBio = async () => {
    if (!user) return;
    if (slug && slug !== savedSlug && (slugState === "invalid" || slugState === "taken" || slugState === "checking")) {
      toast.error("Corrija o link antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      // 1) save slug via RPC (handles validation + uniqueness)
      if (slug !== (savedSlug || "")) {
        const { data: slugRes, error: slugErr } = await supabase.rpc("set_my_slug", { _slug: slug || null });
        if (slugErr) throw slugErr;
        const res = slugRes as { ok: boolean; error?: string; slug?: string };
        if (!res?.ok) throw new Error(res?.error || "Erro ao salvar link");
        setSavedSlug(res.slug || null);
      }
      // 2) other link bio fields
      const { error } = await supabase.from("profiles").update({
        outros_links: bioLinks,
        cobrar_sinal: cobrarSinal,
        valor_sinal: valorSinal,
        pix_key_type: pixKeyType,
        pix_key: pixKey,
      }).eq("id", user.id);
      if (error) throw error;
      toast.success("Link Bio salvo!");
      refreshProfile();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar Link Bio");
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    if (!newLinkLabel || !newLinkUrl) return;
    setBioLinks(prev => [...prev, { id: String(Date.now()), label: newLinkLabel, url: newLinkUrl }]);
    setNewLinkLabel(""); setNewLinkUrl("");
  };

  const removeLink = (id: string) => setBioLinks(prev => prev.filter(l => l.id !== id));

  const initials = profile?.nome?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "FB";

  const publicUrl = savedSlug ? `${window.location.origin}/u/${savedSlug}` : "";

  const slugMessage = () => {
    switch (slugState) {
      case "checking": return { text: "Verificando...", className: "text-muted-foreground", icon: <Loader2 className="w-3 h-3 animate-spin" /> };
      case "available": return { text: "Disponível!", className: "text-success", icon: <Check className="w-3 h-3" /> };
      case "taken": return { text: "Já está em uso", className: "text-destructive", icon: <AlertCircle className="w-3 h-3" /> };
      case "invalid": return { text: "3 a 40 caracteres: a-z, 0-9 e -", className: "text-destructive", icon: <AlertCircle className="w-3 h-3" /> };
      case "current": return { text: "Link atual", className: "text-muted-foreground", icon: <Check className="w-3 h-3" /> };
      default: return null;
    }
  };
  const msg = slugMessage();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl animate-fade-in pb-24 lg:pb-8">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Configurações</h2>

      <Tabs defaultValue="conta">
        <TabsList className="bg-secondary flex-wrap h-auto gap-1">
          <TabsTrigger value="conta" className="text-xs">Minha Conta</TabsTrigger>
          <TabsTrigger value="studio" className="text-xs">Meu Studio</TabsTrigger>
          <TabsTrigger value="linkbio" className="text-xs">Link Bio</TabsTrigger>
        </TabsList>

        <TabsContent value="conta" className="mt-4 sm:mt-6">
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-4">
            <div className="flex items-center gap-3 mb-3 min-w-0">
              <div className="relative flex-shrink-0">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full gradient-brand flex items-center justify-center text-lg font-bold text-primary-foreground">{initials}</div>
                )}
                <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleAvatarChange} />
                <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary text-primary-foreground">
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{profile?.nome || "Profissional"}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0"><Label className="text-muted-foreground text-xs">Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} className="bg-secondary border-border mt-1" /></div>
              <div className="min-w-0"><Label className="text-muted-foreground text-xs">Email</Label><Input value={email} disabled className="bg-secondary border-border mt-1 opacity-60" /></div>
              <div className="min-w-0"><Label className="text-muted-foreground text-xs">Telefone</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} className="bg-secondary border-border mt-1" /></div>
              <div className="min-w-0"><Label className="text-muted-foreground text-xs">Instagram</Label><Input value={instagram} onChange={e => setInstagram(e.target.value)} className="bg-secondary border-border mt-1" /></div>
              <div className="col-span-full min-w-0"><Label className="text-muted-foreground text-xs">Bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} className="bg-secondary border-border mt-1 min-h-[60px]" /></div>
            </div>
            <Button onClick={saveAccount} disabled={saving} className="gradient-brand text-primary-foreground w-full sm:w-auto">{saving ? "Salvando..." : "Salvar Alterações"}</Button>
          </div>
        </TabsContent>

        <TabsContent value="studio" className="mt-4 sm:mt-6 space-y-4">
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Dados do Estúdio</h3>
            <div className="min-w-0"><Label className="text-muted-foreground text-xs">Nome do Estúdio</Label><Input value={studioName} onChange={e => setStudioName(e.target.value)} className="bg-secondary border-border mt-1" /></div>
          </div>
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">⚡ Follow-up</h3>
            <div className="min-w-0"><Label className="text-muted-foreground text-xs">Dias sem retorno para alerta</Label><Input type="number" value={followUpDays} onChange={e => setFollowUpDays(Number(e.target.value))} className="bg-secondary border-border mt-1 w-24 h-9" /></div>
          </div>
          <Button onClick={saveStudio} disabled={saving} className="gradient-brand text-primary-foreground w-full sm:w-auto">{saving ? "Salvando..." : "Salvar Configurações"}</Button>
        </TabsContent>

        <TabsContent value="linkbio" className="mt-4 sm:mt-6 space-y-4">
          {/* Slug card */}
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-3">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Seu link público</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Esse é o endereço que vai na sua bio. Use apenas letras minúsculas, números e hífen.</p>
            </div>

            <div className="min-w-0">
              <Label className="text-muted-foreground text-xs">Personalize seu link</Label>
              <div className="flex items-center gap-1 mt-1 min-w-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">/u/</span>
                <Input
                  value={slug}
                  onChange={e => setSlug(sanitizeSlug(e.target.value))}
                  className="bg-secondary border-border min-w-0 flex-1"
                  placeholder="meu-studio"
                  maxLength={40}
                />
              </div>
              {msg && (
                <p className={cn("text-xs mt-1 flex items-center gap-1", msg.className)}>
                  {msg.icon} {msg.text}
                </p>
              )}
            </div>

            {savedSlug && (
              <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 space-y-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Link ativo</p>
                  <p className="text-sm font-medium text-primary break-all">{publicUrl}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("Link copiado!"); }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copiar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    asChild
                  >
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Abrir
                    </a>
                  </Button>
                </div>
                <div className="flex justify-center pt-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(publicUrl)}`}
                    alt="QR Code do seu link"
                    className="rounded-md border border-border bg-white p-2"
                    width={160}
                    height={160}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Extra links */}
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Links extras</h3>
            <div className="space-y-2">
              {bioLinks.map(link => (
                <div key={link.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 min-w-0">
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <Input value={link.label} onChange={e => setBioLinks(prev => prev.map(l => l.id === link.id ? { ...l, label: e.target.value } : l))} className="bg-transparent border-none p-0 h-auto text-sm font-medium text-foreground" placeholder="Nome" />
                    <Input value={link.url} onChange={e => setBioLinks(prev => prev.map(l => l.id === link.id ? { ...l, url: e.target.value } : l))} className="bg-transparent border-none p-0 h-auto text-xs text-muted-foreground" placeholder="https://..." />
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => removeLink(link.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
              <Input value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)} placeholder="Nome" className="bg-secondary border-border" />
              <Input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="URL" className="bg-secondary border-border" />
              <Button size="sm" variant="outline" onClick={addLink} className="text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar</Button>
            </div>
          </div>

          {/* PIX */}
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Configuração de Sinal</h3>
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10 min-w-0">
              <Label className="text-foreground text-sm min-w-0">Cobrar sinal no agendamento</Label>
              <Switch checked={cobrarSinal} onCheckedChange={setCobrarSinal} />
            </div>
            {cobrarSinal && (
              <div className="space-y-3">
                <div className="min-w-0"><Label className="text-muted-foreground text-xs">Valor do sinal (R$)</Label><Input type="number" value={valorSinal} onChange={e => setValorSinal(Number(e.target.value))} className="bg-secondary border-border mt-1 w-32" /></div>
                <div className="min-w-0">
                  <Label className="text-muted-foreground text-xs">Tipo de chave Pix</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {["E-mail", "CPF", "Aleatória"].map(t => (
                      <Button key={t} size="sm" variant={pixKeyType === t ? "default" : "outline"} onClick={() => setPixKeyType(t)} className={cn("text-xs h-8", pixKeyType === t && "gradient-brand text-primary-foreground")}>{t}</Button>
                    ))}
                  </div>
                </div>
                <div className="min-w-0"><Label className="text-muted-foreground text-xs">Chave Pix</Label><Input value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="Sua chave Pix" className="bg-secondary border-border mt-1" /></div>
              </div>
            )}
          </div>

          <Button
            onClick={saveLinkBio}
            disabled={saving || slugState === "checking" || slugState === "invalid" || slugState === "taken"}
            className="gradient-brand text-primary-foreground w-full sm:w-auto"
          >
            {saving ? "Salvando..." : "Salvar Link Bio"}
          </Button>
        </TabsContent>
      </Tabs>
      <PushNotificationsCard />
    </div>
  );
}

function PushNotificationsCard() {
  const { supported, permission, subscribed, loading, subscribe } = usePushSubscription();
  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6 space-y-3">
      <div className="flex items-center gap-2">
        <span className="t-card-title text-foreground">Notificações push</span>
      </div>
      {!supported ? (
        <p className="t-aux text-muted-foreground">Seu navegador não suporta notificações push.</p>
      ) : subscribed && permission === "granted" ? (
        <p className="t-aux text-success">Notificações ativadas neste dispositivo.</p>
      ) : (
        <>
          <p className="t-aux text-muted-foreground">Receba avisos importantes mesmo com o app fechado.</p>
          <button
            onClick={subscribe}
            disabled={loading}
            className="t-button px-4 py-2 rounded-lg gradient-brand text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Ativando..." : "Ativar notificações"}
          </button>
        </>
      )}
    </div>
  );
}

