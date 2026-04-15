import { useState, useRef } from "react";
import { User, Building, Link2, Globe, Instagram, MessageCircle, GripVertical, Plus, Trash2, Calendar, DollarSign, Camera } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export default function AccountPage() {
  const { profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [bioLinks, setBioLinks] = useState([
    { id: "1", label: "Instagram", url: "https://instagram.com/estudiomaria", icon: "instagram" },
    { id: "2", label: "WhatsApp", url: "https://wa.me/5511999999999", icon: "whatsapp" },
    { id: "3", label: "Meu Site", url: "https://estudiomaria.com", icon: "globe" },
  ]);
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatar(URL.createObjectURL(file));
  };

  const addLink = () => {
    if (!newLinkLabel || !newLinkUrl) return;
    setBioLinks(prev => [...prev, { id: String(Date.now()), label: newLinkLabel, url: newLinkUrl, icon: "globe" }]);
    setNewLinkLabel(""); setNewLinkUrl("");
  };

  const removeLink = (id: string) => setBioLinks(prev => prev.filter(l => l.id !== id));

  const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "FB";

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
                <p className="font-semibold text-foreground">{profile?.full_name || "Profissional"}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground text-xs">Nome</Label><Input defaultValue={profile?.full_name || ""} className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Email</Label><Input defaultValue={profile?.email || ""} className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Telefone</Label><Input defaultValue={profile?.phone || "(11) 99999-0000"} className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Instagram</Label><Input defaultValue="@julialashes" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Cidade</Label><Input defaultValue="São Paulo" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Estado</Label><Input defaultValue="SP" className="bg-secondary border-border mt-1" /></div>
              <div className="col-span-full"><Label className="text-muted-foreground text-xs">Bio</Label><Textarea defaultValue={profile?.bio || "Profissional apaixonada por transformar olhares ✨"} className="bg-secondary border-border mt-1 min-h-[50px]" /></div>
            </div>
            <Button className="gradient-brand text-primary-foreground">Salvar Alterações</Button>
          </div>
        </TabsContent>

        <TabsContent value="studio" className="mt-4 sm:mt-6 space-y-4">
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Dados do Estúdio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground text-xs">Nome do Estúdio</Label><Input defaultValue="Studio Julia Lashes" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">CNPJ</Label><Input defaultValue="12.345.678/0001-90" className="bg-secondary border-border mt-1" /></div>
              <div className="col-span-full"><Label className="text-muted-foreground text-xs">Endereço</Label><Input defaultValue="Rua das Flores, 123 - Jardins, SP" className="bg-secondary border-border mt-1" /></div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Horário de Funcionamento</h3>
            <div className="space-y-2">
              {days.map(d => (
                <div key={d} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs text-muted-foreground w-16 sm:w-20 flex-shrink-0">{d}</span>
                  <Input defaultValue={d === "Domingo" ? "" : "09:00"} placeholder="—" className="bg-secondary border-border w-16 sm:w-20 text-xs h-8" />
                  <span className="text-muted-foreground text-xs">—</span>
                  <Input defaultValue={d === "Domingo" ? "" : "18:00"} placeholder="—" className="bg-secondary border-border w-16 sm:w-20 text-xs h-8" />
                  <Switch defaultChecked={d !== "Domingo"} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">⚡ Follow-up</h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Label className="text-foreground text-sm font-medium">Ativar follow-up automático</Label>
              <Switch defaultChecked />
            </div>
            <div><Label className="text-muted-foreground text-xs">Dias sem retorno para alerta</Label><Input type="number" defaultValue="21" className="bg-secondary border-border mt-1 w-20 h-8" /></div>
            <div><Label className="text-muted-foreground text-xs">Template WhatsApp</Label>
              <Textarea defaultValue="Olá {{nome_cliente}}! 😊 Estamos com saudades! Que tal agendar sua manutenção no {{nome_studio}}? Acesse: {{link_agendamento}}" className="bg-secondary border-border mt-1 min-h-[50px] text-sm" /></div>
          </div>
          <Button className="gradient-brand text-primary-foreground">Salvar Configurações</Button>
        </TabsContent>

        <TabsContent value="linkbio" className="mt-4 sm:mt-6 space-y-4">
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm">Link Bio</h3>
              <Switch defaultChecked />
            </div>
            <div><Label className="text-muted-foreground text-xs">Slug (URL)</Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">finbeauty.com.br/u/</span>
                <Input defaultValue="estudiomaria" className="bg-secondary border-border" />
              </div>
            </div>
            <div><Label className="text-muted-foreground text-xs">Título</Label><Input defaultValue="Studio Julia Lashes ✨" className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Descrição</Label><Textarea defaultValue="Extensão de cílios no coração dos Jardins. Agende seu horário!" className="bg-secondary border-border mt-1 min-h-[50px]" /></div>
          </div>

          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Links</h3>
            <div className="space-y-2">
              {bioLinks.map(link => (
                <div key={link.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50">
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Input value={link.label} onChange={e => setBioLinks(prev => prev.map(l => l.id === link.id ? { ...l, label: e.target.value } : l))} className="bg-transparent border-none p-0 h-auto text-sm font-medium text-foreground" />
                    <Input value={link.url} onChange={e => setBioLinks(prev => prev.map(l => l.id === link.id ? { ...l, url: e.target.value } : l))} className="bg-transparent border-none p-0 h-auto text-xs text-muted-foreground" />
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => removeLink(link.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)} placeholder="Label" className="bg-secondary border-border flex-1" />
              <Input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="URL" className="bg-secondary border-border flex-1" />
              <Button size="sm" variant="outline" onClick={addLink} className="text-xs"><Plus className="w-3.5 h-3.5" /></Button>
            </div>
          </div>

          {/* Sinal/Deposit config */}
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Configuração de Sinal</h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Label className="text-foreground text-sm">Cobrar sinal no agendamento</Label>
              <Switch checked={requireDeposit} onCheckedChange={setRequireDeposit} />
            </div>
            {requireDeposit && (
              <div className="space-y-3">
                <div><Label className="text-muted-foreground text-xs">Valor do sinal (R$)</Label><Input type="number" defaultValue="50" className="bg-secondary border-border mt-1 w-24" /></div>
                <div><Label className="text-muted-foreground text-xs">Tipo de chave Pix</Label>
                  <div className="flex gap-2 mt-1">
                    {["E-mail", "CPF", "Aleatória"].map(t => (
                      <Button key={t} size="sm" variant="outline" className="text-xs h-7">{t}</Button>
                    ))}
                  </div>
                </div>
                <div><Label className="text-muted-foreground text-xs">Chave Pix</Label><Input defaultValue="" placeholder="Sua chave Pix" className="bg-secondary border-border mt-1" /></div>
              </div>
            )}
          </div>

          <Button className="gradient-brand text-primary-foreground">Salvar Link Bio</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
