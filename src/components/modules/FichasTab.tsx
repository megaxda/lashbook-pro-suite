import { useState } from "react";
import { Plus, FileText, Camera, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockClients } from "@/data/mockData";

interface AnamneseField {
  id: string;
  label: string;
  type: "text" | "boolean" | "select";
  options?: string[];
  enabled: boolean;
}

const defaultFields: AnamneseField[] = [
  { id: "1", label: "Possui alergias?", type: "boolean", enabled: true },
  { id: "2", label: "Descreva as alergias", type: "text", enabled: true },
  { id: "3", label: "Sensibilidade ocular?", type: "boolean", enabled: true },
  { id: "4", label: "Usa medicamentos?", type: "boolean", enabled: true },
  { id: "5", label: "Quais medicamentos?", type: "text", enabled: true },
  { id: "6", label: "Tipo de pele na região dos olhos", type: "select", options: ["Normal", "Oleosa", "Seca", "Mista"], enabled: true },
  { id: "7", label: "Já fez extensão antes?", type: "boolean", enabled: true },
  { id: "8", label: "Teve reação alérgica anterior?", type: "boolean", enabled: true },
  { id: "9", label: "Usa lentes de contato?", type: "boolean", enabled: true },
  { id: "10", label: "Está grávida ou amamentando?", type: "boolean", enabled: true },
  { id: "11", label: "Fez cirurgia ocular recente?", type: "boolean", enabled: true },
  { id: "12", label: "Tipo de cílios naturais", type: "select", options: ["Curtos e finos", "Curtos e grossos", "Médios", "Longos e finos", "Longos e grossos"], enabled: true },
  { id: "13", label: "Observações adicionais", type: "text", enabled: true },
];

const mockFichas = [
  { id: "1", client: "Maria Silva", date: "2026-04-10", service: "Manutenção Clássico", tecnica: "Fio a Fio", fio: "0.15mm", curvatura: "C", comprimento: "10-12mm", cola: "Cola Premium Black" },
  { id: "2", client: "Camila Pereira", date: "2026-04-09", service: "Volume Russo", tecnica: "Volume 3D", fio: "0.07mm", curvatura: "D", comprimento: "11-13mm", cola: "Cola Premium Black" },
  { id: "3", client: "Beatriz Lima", date: "2026-04-08", service: "Mega Volume", tecnica: "Mega Volume 6D", fio: "0.05mm", curvatura: "D", comprimento: "12-14mm", cola: "Cola Premium Black" },
];

export default function FichasTab() {
  const [fields, setFields] = useState(defaultFields);
  const [configOpen, setConfigOpen] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");

  const toggleField = (id: string) => setFields(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));

  const addField = () => {
    if (!newFieldLabel.trim()) return;
    setFields(prev => [...prev, { id: String(Date.now()), label: newFieldLabel, type: "text", enabled: true }]);
    setNewFieldLabel("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="fichas">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Fichas / Anamnese</h2>
            <p className="text-muted-foreground text-sm">Registro e configuração de fichas</p>
          </div>
          <div className="flex items-center gap-2">
            <TabsList className="bg-secondary">
              <TabsTrigger value="fichas">Fichas</TabsTrigger>
              <TabsTrigger value="anamnese">Modelo Anamnese</TabsTrigger>
            </TabsList>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-pink text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Nova Ficha</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-card border-border max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Nova Ficha Técnica</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="col-span-2"><Label className="text-xs text-muted-foreground">Cliente</Label>
                    <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-card border-border">{mockClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-xs text-muted-foreground">Técnica</Label>
                    <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-card border-border"><SelectItem value="fiofio">Fio a Fio</SelectItem><SelectItem value="vol3d">Volume 3D</SelectItem><SelectItem value="vol5d">Volume 5D</SelectItem><SelectItem value="mega">Mega Volume</SelectItem><SelectItem value="hibrido">Híbrido</SelectItem></SelectContent></Select></div>
                  <div><Label className="text-xs text-muted-foreground">Fio</Label>
                    <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-card border-border"><SelectItem value="005">0.05mm</SelectItem><SelectItem value="007">0.07mm</SelectItem><SelectItem value="010">0.10mm</SelectItem><SelectItem value="015">0.15mm</SelectItem></SelectContent></Select></div>
                  <div><Label className="text-xs text-muted-foreground">Curvatura</Label>
                    <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-card border-border"><SelectItem value="J">J</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem><SelectItem value="D">D</SelectItem><SelectItem value="L">L</SelectItem></SelectContent></Select></div>
                  <div><Label className="text-xs text-muted-foreground">Comprimento</Label><Input placeholder="10-12mm" className="bg-secondary border-border mt-1" /></div>
                  <div><Label className="text-xs text-muted-foreground">Cola</Label><Input className="bg-secondary border-border mt-1" /></div>
                  <div><Label className="text-xs text-muted-foreground">Retorno previsto</Label><Input type="date" className="bg-secondary border-border mt-1" /></div>

                  {/* Anamnese fields */}
                  <div className="col-span-2 mt-2">
                    <p className="text-sm font-semibold text-foreground mb-2">Anamnese</p>
                    {fields.filter(f => f.enabled).map(f => (
                      <div key={f.id} className="mb-2">
                        <Label className="text-xs text-muted-foreground">{f.label}</Label>
                        {f.type === "boolean" ? (
                          <div className="flex items-center gap-2 mt-1"><Switch /><span className="text-xs text-muted-foreground">Sim/Não</span></div>
                        ) : f.type === "select" ? (
                          <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent className="bg-card border-border">{f.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
                        ) : (
                          <Input className="bg-secondary border-border mt-1" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="col-span-2 flex gap-2">
                    <Button variant="outline" className="flex-1 border-border text-muted-foreground"><Camera className="w-4 h-4 mr-1" /> Antes</Button>
                    <Button variant="outline" className="flex-1 border-border text-muted-foreground"><Camera className="w-4 h-4 mr-1" /> Depois</Button>
                  </div>
                </div>
                <Button className="w-full mt-4 gradient-pink text-primary-foreground">Salvar Ficha</Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="fichas">
          <div className="space-y-3">
            {mockFichas.map(f => (
              <div key={f.id} className="gradient-card rounded-xl p-5 border border-border hover:border-primary/20 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10"><FileText className="w-4 h-4 text-primary" /></div>
                    <div>
                      <p className="font-semibold text-foreground">{f.client}</p>
                      <p className="text-xs text-muted-foreground">{f.service} · {new Date(f.date).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: "Técnica", value: f.tecnica },
                    { label: "Fio", value: f.fio },
                    { label: "Curvatura", value: f.curvatura },
                    { label: "Comprimento", value: f.comprimento },
                    { label: "Cola", value: f.cola },
                  ].map(d => (
                    <div key={d.label} className="p-2 rounded-lg bg-secondary">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{d.label}</p>
                      <p className="text-sm font-medium text-foreground">{d.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="anamnese">
          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> Campos da Anamnese</h3>
            </div>
            <p className="text-sm text-muted-foreground">Ative/desative os campos que deseja usar nas fichas de anamnese.</p>
            <div className="space-y-2">
              {fields.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div>
                    <p className="text-sm font-medium text-foreground">{f.label}</p>
                    <p className="text-xs text-muted-foreground">Tipo: {f.type === "boolean" ? "Sim/Não" : f.type === "select" ? "Seleção" : "Texto"}</p>
                  </div>
                  <Switch checked={f.enabled} onCheckedChange={() => toggleField(f.id)} />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} placeholder="Nome do novo campo..." className="bg-secondary border-border" />
              <Button onClick={addField} size="sm" variant="outline">Adicionar</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
