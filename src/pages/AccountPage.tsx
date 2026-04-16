import { useState, useRef, useEffect } from "react";
import { Camera, Plus, Trash2, GripVertical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

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
  const [slugError, setSlugError] = useState("");
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
      setBioLinks(Array.isArray(profile.outros_links) ? (profile.outros_links as any[]) : []);
      setCobrarSinal(profile.cobrar_sinal || false);
      setValorSinal(profile.valor_sinal || 0);
      setPixKeyType(profile.pix_key_type || "");
      setPixKey(profile.pix_key || "");
    }
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatar(URL.createObjectURL(file));
  };

  const checkSlug = async (value: string) => {
    if (!value.trim()) { setSlugError(""); return; }
    const { data } = await supabase.from("profiles").select("id").eq("slug", value).neq("id", user?.id || "").limit(1);
    setSlugError(data && data.length > 0 ? "Este slug já está em uso" : "");
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
    if (slugError) { toast.error("Corrija o slug antes de salvar"); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      slug: slug || null, outros_links: bioLinks, cobrar_sinal: cobrarSinal,
      valor_sinal: valorSinal, pix_key_type: pixKeyType, pix_key: pixKey,
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar");
    else { toast.success("Link Bio salvo!"); refreshProfile(); }
  };

  const addLink = () => {
    if (!newLinkLabel || !newLinkUrl) return;
    setBioLinks(prev => [...prev, { id: String(Date.now()), label: newLinkLabel, url: newLinkUrl }]);
    setNewLinkLabel(""); setNewLinkUrl("");
  };

  const removeLink = (id: string) => setBioLinks(prev => prev.filter(l => l.id !== id));

  const initials = profile?.nome?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "FB";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl animate-fade-in pb-20 lg:pb-8">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Configurações</h2>

      <Tabs defaultValue="conta">
        <TabsList className="bg-secondary flex-wrap h-auto gap-1">
          <TabsTrigger value="conta" className="text-xs">Minha Conta</TabsTrigger>
          <TabsTrigger value="studio" className="text-xs">Meu Studio</TabsTrigger>
          <TabsTrigger value="linkbio" className="text-xs">Link Bio</TabsTrigger>
        </TabsList>

        <TabsContent value="conta" className="mt-4 sm:mt-6">
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
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
              <div>
                <p className="font-semibold text-foreground">{profile?.nome || "Profissional"}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground text-xs">Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Email</Label><Input value={email} disabled className="bg-secondary border-border mt-1 opacity-60" /></div>
              <div><Label className="text-muted-foreground text-xs">Telefone</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Instagram</Label><Input value={instagram} onChange={e => setInstagram(e.target.value)} className="bg-secondary border-border mt-1" /></div>
              <div className="col-span-full"><Label className="text-muted-foreground text-xs">Bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} className="bg-secondary border-border mt-1 min-h-[50px]" /></div>
            </div>
            <Button onClick={saveAccount} disabled={saving} className="gradient-brand text-primary-foreground">{saving ? "Salvando..." : "Salvar Alterações"}</Button>
          </div>
        </TabsContent>

        <TabsContent value="studio" className="mt-4 sm:mt-6 space-y-4">
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Dados do Estúdio</h3>
            <div><Label className="text-muted-foreground text-xs">Nome do Estúdio</Label><Input value={studioName} onChange={e => setStudioName(e.target.value)} className="bg-secondary border-border mt-1" /></div>
          </div>
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">⚡ Follow-up</h3>
            <div><Label className="text-muted-foreground text-xs">Dias sem retorno para alerta</Label><Input type="number" value={followUpDays} onChange={e => setFollowUpDays(Number(e.target.value))} className="bg-secondary border-border mt-1 w-20 h-8" /></div>
          </div>
          <Button onClick={saveStudio} disabled={saving} className="gradient-brand text-primary-foreground">{saving ? "Salvando..." : "Salvar Configurações"}</Button>
        </TabsContent>

        <TabsContent value="linkbio" className="mt-4 sm:mt-6 space-y-4">
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Link Bio</h3>
            <div><Label className="text-muted-foreground text-xs">Slug (URL)</Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">/u/</span>
                <Input value={slug} onChange={e => { setSlug(e.target.value); checkSlug(e.target.value); }} className="bg-secondary border-border" placeholder="meu-studio" />
              </div>
              {slugError && <p className="text-destructive text-xs mt-1">{slugError}</p>}
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Links</h3>
            <div className="space-y-2">
              {bioLinks.map(link => (
                <div key={link.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50">
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Input value={link.label} onChange={e => setBioLinks(prev => prev.map(l => l.id === link.id ? { ...l, label: e.target.value } : l))} className="bg-transparent border-none p-0 h-auto text-sm font-medium text-foreground" />
                    <Input value={link.url} onChange={e => setBioLinks(prev => prev.map(l => l.id === link.id ? { ...l, url: e.target.value } : l))} className="bg-transparent border-none p-0 h-auto text-xs text-muted-foreground" />
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => removeLink(link.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)} placeholder="Nome" className="bg-secondary border-border flex-1" />
              <Input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="URL" className="bg-secondary border-border flex-1" />
              <Button size="sm" variant="outline" onClick={addLink} className="text-xs"><Plus className="w-3.5 h-3.5" /></Button>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Configuração de Sinal</h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Label className="text-foreground text-sm">Cobrar sinal no agendamento</Label>
              <Switch checked={cobrarSinal} onCheckedChange={setCobrarSinal} />
            </div>
            {cobrarSinal && (
              <div className="space-y-3">
                <div><Label className="text-muted-foreground text-xs">Valor do sinal (R$)</Label><Input type="number" value={valorSinal} onChange={e => setValorSinal(Number(e.target.value))} className="bg-secondary border-border mt-1 w-24" /></div>
                <div><Label className="text-muted-foreground text-xs">Tipo de chave Pix</Label>
                  <div className="flex gap-2 mt-1">
                    {["E-mail", "CPF", "Aleatória"].map(t => (
                      <Button key={t} size="sm" variant={pixKeyType === t ? "default" : "outline"} onClick={() => setPixKeyType(t)} className={cn("text-xs h-7", pixKeyType === t && "gradient-brand text-primary-foreground")}>{t}</Button>
                    ))}
                  </div>
                </div>
                <div><Label className="text-muted-foreground text-xs">Chave Pix</Label><Input value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="Sua chave Pix" className="bg-secondary border-border mt-1" /></div>
              </div>
            )}
          </div>

          <Button onClick={saveLinkBio} disabled={saving || !!slugError} className="gradient-brand text-primary-foreground">{saving ? "Salvando..." : "Salvar Link Bio"}</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) { return classes.filter(Boolean).join(" "); }
