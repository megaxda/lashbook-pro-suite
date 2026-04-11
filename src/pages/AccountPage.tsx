import { useState } from "react";
import { User, Building, CreditCard, Link2, Globe, Instagram, MessageCircle, GripVertical, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export default function AccountPage() {
  const [bioLinks, setBioLinks] = useState([
    { id: "1", label: "Instagram", url: "https://instagram.com/estudiomaria", icon: "instagram" },
    { id: "2", label: "WhatsApp", url: "https://wa.me/5511999999999", icon: "whatsapp" },
    { id: "3", label: "Meu Site", url: "https://estudiomaria.com", icon: "globe" },
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground mb-6">Configurações</h2>

      <Tabs defaultValue="conta">
        <TabsList className="bg-secondary flex-wrap h-auto gap-1">
          <TabsTrigger value="conta">Minha Conta</TabsTrigger>
          <TabsTrigger value="studio">Meu Studio</TabsTrigger>
          <TabsTrigger value="plano">Assinatura</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
          <TabsTrigger value="linkbio">Link Bio</TabsTrigger>
        </TabsList>

        <TabsContent value="conta" className="mt-6">
          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full gradient-pink flex items-center justify-center text-xl font-bold text-primary-foreground">JS</div>
              <div>
                <Button size="sm" variant="outline" className="border-border text-muted-foreground">Alterar Foto</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-muted-foreground text-xs">Nome</Label><Input defaultValue="Julia Soares" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Email</Label><Input defaultValue="julia@lashbook.com" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Telefone</Label><Input defaultValue="(11) 99999-0000" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Instagram</Label><Input defaultValue="@julialashes" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Cidade</Label><Input defaultValue="São Paulo" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Estado</Label><Input defaultValue="SP" className="bg-secondary border-border mt-1" /></div>
              <div className="col-span-full"><Label className="text-muted-foreground text-xs">Bio</Label><Textarea defaultValue="Lash Designer apaixonada por transformar olhares ✨" className="bg-secondary border-border mt-1" /></div>
            </div>
            <Button className="gradient-pink text-primary-foreground">Salvar Alterações</Button>
          </div>
        </TabsContent>

        <TabsContent value="studio" className="mt-6 space-y-6">
          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="font-semibold text-foreground">Dados do Estúdio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-muted-foreground text-xs">Nome do Estúdio</Label><Input defaultValue="Studio Julia Lashes" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">CNPJ</Label><Input defaultValue="12.345.678/0001-90" className="bg-secondary border-border mt-1" /></div>
              <div className="col-span-full"><Label className="text-muted-foreground text-xs">Endereço</Label><Input defaultValue="Rua das Flores, 123 - Jardins, São Paulo/SP" className="bg-secondary border-border mt-1" /></div>
            </div>
          </div>
          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="font-semibold text-foreground">Horário de Funcionamento</h3>
            <div className="space-y-2">
              {days.map(d => (
                <div key={d} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-20">{d}</span>
                  <Input defaultValue={d === "Domingo" ? "" : "09:00"} placeholder="Fechado" className="bg-secondary border-border w-24 text-sm" />
                  <span className="text-muted-foreground">-</span>
                  <Input defaultValue={d === "Domingo" ? "" : "18:00"} placeholder="Fechado" className="bg-secondary border-border w-24 text-sm" />
                  <Switch defaultChecked={d !== "Domingo"} />
                </div>
              ))}
            </div>
          </div>
          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="font-semibold text-foreground">Configurações de Follow-up</h3>
            <div className="flex items-center justify-between"><Label className="text-foreground">Ativar follow-up automático</Label><Switch defaultChecked /></div>
            <div><Label className="text-muted-foreground text-xs">Dias sem retorno para alerta</Label><Input type="number" defaultValue="21" className="bg-secondary border-border mt-1 w-24" /></div>
            <div><Label className="text-muted-foreground text-xs">Template WhatsApp</Label>
              <Textarea defaultValue="Olá {{nome_cliente}}! 😊 Estamos com saudades! Que tal agendar sua manutenção no {{nome_studio}}? Acesse: {{link_agendamento}}" className="bg-secondary border-border mt-1" /></div>
          </div>
          <Button className="gradient-pink text-primary-foreground">Salvar Configurações</Button>
        </TabsContent>

        <TabsContent value="plano" className="mt-6">
          <div className="gradient-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10"><CreditCard className="w-5 h-5 text-primary" /></div>
              <div>
                <h3 className="font-semibold text-foreground">Plano Pro</h3>
                <p className="text-sm text-muted-foreground">Ativo até 11/05/2026</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 mb-4">
              <p className="text-2xl font-bold text-foreground">R$ 49,90<span className="text-sm text-muted-foreground font-normal">/mês</span></p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✅ Clientes ilimitados</li>
              <li>✅ Agendamento online</li>
              <li>✅ Link Bio personalizado</li>
              <li>✅ ConsultProLash</li>
              <li>✅ Relatórios financeiros</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="integracoes" className="mt-6">
          <div className="space-y-3">
            {[
              { name: "WhatsApp Business API", icon: MessageCircle, connected: false, desc: "Envie lembretes e confirmações automáticas" },
              { name: "Google Calendar", icon: Calendar, connected: false, desc: "Sincronize sua agenda com o Google" },
              { name: "Instagram", icon: Instagram, connected: true, desc: "Conecte seu perfil profissional" },
              { name: "PIX / Pagamentos", icon: DollarSign, connected: false, desc: "Receba pagamentos online" },
            ].map(i => (
              <div key={i.name} className="gradient-card rounded-xl p-5 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><i.icon className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="font-medium text-foreground">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.desc}</p>
                  </div>
                </div>
                <Button size="sm" variant={i.connected ? "outline" : "default"} className={i.connected ? "border-success/30 text-success" : "gradient-pink text-primary-foreground"}>
                  {i.connected ? "Conectado" : "Conectar"}
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="linkbio" className="mt-6 space-y-6">
          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Link Bio</h3>
              <Switch defaultChecked />
            </div>
            <div><Label className="text-muted-foreground text-xs">Slug (URL)</Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-muted-foreground">lashbook.com.br/u/</span>
                <Input defaultValue="estudiomaria" className="bg-secondary border-border" />
              </div>
            </div>
            <div><Label className="text-muted-foreground text-xs">Título</Label><Input defaultValue="Studio Julia Lashes ✨" className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Descrição</Label><Textarea defaultValue="Extensão de cílios no coração dos Jardins. Agende seu horário!" className="bg-secondary border-border mt-1" /></div>
          </div>
          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Botões / Links</h3>
              <Button size="sm" variant="outline" className="border-border text-muted-foreground"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
            </div>
            <div className="space-y-2">
              {bioLinks.map(link => (
                <div key={link.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{link.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </div>
          <Button className="gradient-pink text-primary-foreground">Salvar Link Bio</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Need these imports for the integrations section icons
import { Calendar, DollarSign } from "lucide-react";
