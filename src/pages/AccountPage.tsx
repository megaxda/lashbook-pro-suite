import { useState } from "react";
import { User, Building, CreditCard, Link2, Globe, GripVertical, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export default function AccountPage() {
  const [sinalAtivo, setSinalAtivo] = useState(false);
  const [bioLinks, setBioLinks] = useState([
    { id: "1", label: "Instagram", url: "https://instagram.com/estudiomaria" },
    { id: "2", label: "WhatsApp", url: "https://wa.me/5511999999999" },
    { id: "3", label: "Meu Site", url: "https://estudiomaria.com" },
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground mb-6">Configurações</h2>

      <Tabs defaultValue="conta">
        <TabsList className="bg-secondary flex-wrap h-auto gap-1">
          <TabsTrigger value="conta">Minha Conta</TabsTrigger>
          <TabsTrigger value="studio">Meu Studio</TabsTrigger>
          <TabsTrigger value="plano">Assinatura</TabsTrigger>
          <TabsTrigger value="linkbio">Link Bio</TabsTrigger>
        </TabsList>

        <TabsContent value="conta" className="mt-6">
          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full gradient-pink flex items-center justify-center text-xl font-bold text-primary-foreground">JS</div>
              <Button size="sm" variant="outline" className="border-border text-muted-foreground">Alterar Foto</Button>
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
            <Button className="gradient-pink text-primary-foreground">Salvar</Button>
          </div>
        </TabsContent>

        <TabsContent value="studio" className="mt-6 space-y-6">
          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="font-semibold text-foreground">Dados do Estúdio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-muted-foreground text-xs">Nome</Label><Input defaultValue="Studio Julia Lashes" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">CNPJ</Label><Input defaultValue="12.345.678/0001-90" className="bg-secondary border-border mt-1" /></div>
              <div className="col-span-full"><Label className="text-muted-foreground text-xs">Endereço</Label><Input defaultValue="Rua das Flores, 123 - Jardins, SP" className="bg-secondary border-border mt-1" /></div>
            </div>
          </div>
          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="font-semibold text-foreground">Horários</h3>
            <div className="space-y-2">
              {days.map(d => (
                <div key={d} className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-muted-foreground w-20">{d}</span>
                  <Input defaultValue={d === "Domingo" ? "" : "09:00"} placeholder="Fechado" className="bg-secondary border-border w-20 text-sm" />
                  <span className="text-muted-foreground">-</span>
                  <Input defaultValue={d === "Domingo" ? "" : "18:00"} placeholder="Fechado" className="bg-secondary border-border w-20 text-sm" />
                  <Switch defaultChecked={d !== "Domingo"} />
                </div>
              ))}
            </div>
          </div>
          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="font-semibold text-foreground">Follow-up</h3>
            <div className="flex items-center justify-between"><Label>Ativar follow-up</Label><Switch defaultChecked /></div>
            <div><Label className="text-xs text-muted-foreground">Dias sem retorno</Label><Input type="number" defaultValue="21" className="bg-secondary border-border mt-1 w-24" /></div>
            <div><Label className="text-xs text-muted-foreground">Template WhatsApp</Label><Textarea defaultValue="Olá {{nome_cliente}}! Estamos com saudades! Agende sua manutenção: {{link_agendamento}}" className="bg-secondary border-border mt-1" /></div>
          </div>
          <Button className="gradient-pink text-primary-foreground">Salvar</Button>
        </TabsContent>

        <TabsContent value="plano" className="mt-6">
          <div className="gradient-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10"><CreditCard className="w-5 h-5 text-primary" /></div>
              <div><h3 className="font-semibold text-foreground">Plano Pro</h3><p className="text-sm text-muted-foreground">Ativo até 11/05/2026</p></div>
            </div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 mb-4">
              <p className="text-2xl font-bold text-foreground">R$ 49,90<span className="text-sm text-muted-foreground font-normal">/mês</span></p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✅ Clientes ilimitados</li>
              <li>✅ Agendamento online</li>
              <li>✅ Link Bio personalizado</li>
              <li>✅ Relatórios financeiros</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="linkbio" className="mt-6 space-y-6">
          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Link Bio / Agendamento Online</h3>
              <Switch defaultChecked />
            </div>
            <div><Label className="text-xs text-muted-foreground">Slug (URL)</Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-muted-foreground">lashbook.com.br/u/</span>
                <Input defaultValue="estudiomaria" className="bg-secondary border-border" />
              </div>
            </div>
            <div><Label className="text-xs text-muted-foreground">Título</Label><Input defaultValue="Studio Julia Lashes ✨" className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-xs text-muted-foreground">Descrição</Label><Textarea defaultValue="Extensão de cílios no coração dos Jardins. Agende seu horário!" className="bg-secondary border-border mt-1" /></div>
          </div>

          {/* Sinal / PIX */}
          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Exigir Sinal para Agendamento</h3>
              <Switch checked={sinalAtivo} onCheckedChange={setSinalAtivo} />
            </div>
            {sinalAtivo && (
              <div className="space-y-3">
                <div><Label className="text-xs text-muted-foreground">Valor do sinal (R$)</Label><Input type="number" defaultValue="50" className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-xs text-muted-foreground">Chave PIX</Label><Input defaultValue="julia@lashbook.com" className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-xs text-muted-foreground">Banco</Label><Input defaultValue="Nubank" className="bg-secondary border-border mt-1" /></div>
                <p className="text-xs text-muted-foreground">O cliente precisará anexar comprovante de pagamento ao agendar online.</p>
              </div>
            )}
          </div>

          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Botões / Links</h3>
              <Button size="sm" variant="outline" className="border-border text-muted-foreground"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
            </div>
            <div className="space-y-2">
              {bioLinks.map(link => (
                <div key={link.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
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
