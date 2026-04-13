import { useState } from "react";
import { Plus, FileText, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mockClients } from "@/data/mockData";

interface Ficha {
  id: string;
  client: string;
  date: string;
  service: string;
  tecnica: string;
  fio: string;
  curvatura: string;
  comprimento: string;
  cola: string;
  olhoEsq: string;
  olhoDir: string;
  retorno: string;
  obs: string;
}

const mockFichas: Ficha[] = [
  { id: "1", client: "Maria Silva", date: "2026-04-10", service: "Manutenção Clássico", tecnica: "Fio a Fio", fio: "0.15mm", curvatura: "C", comprimento: "10-12mm", cola: "Cola Premium Black", olhoEsq: "Normal", olhoDir: "Normal", retorno: "2026-05-01", obs: "" },
  { id: "2", client: "Camila Pereira", date: "2026-04-09", service: "Volume Russo", tecnica: "Volume 3D", fio: "0.07mm", curvatura: "D", comprimento: "11-13mm", cola: "Cola Premium Black", olhoEsq: "Poucas naturais no canto", olhoDir: "Normal", retorno: "2026-04-30", obs: "Cliente sensível" },
  { id: "3", client: "Beatriz Lima", date: "2026-04-08", service: "Mega Volume", tecnica: "Mega Volume 6D", fio: "0.05mm", curvatura: "D", comprimento: "12-14mm", cola: "Cola Premium Black", olhoEsq: "Normal", olhoDir: "Leve irritação", retorno: "2026-04-29", obs: "" },
];

export default function FichasTab() {
  const [fichas] = useState(mockFichas);
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  const [customFields, setCustomFields] = useState<{ label: string; value: string }[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Fichas Técnicas</h2>
          <p className="text-muted-foreground text-sm">Registro de atendimentos e procedimentos</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-brand text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Nova Ficha</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="text-foreground">Nova Ficha Técnica</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="col-span-2"><Label className="text-muted-foreground text-xs">Cliente</Label>
                <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{mockClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-muted-foreground text-xs">Técnica</Label>
                <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-card border-border"><SelectItem value="fiofio">Fio a Fio</SelectItem><SelectItem value="vol3d">Volume 3D</SelectItem><SelectItem value="vol5d">Volume 5D</SelectItem><SelectItem value="mega">Mega Volume</SelectItem><SelectItem value="hibrido">Híbrido</SelectItem></SelectContent></Select></div>
              <div><Label className="text-muted-foreground text-xs">Fio</Label>
                <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-card border-border"><SelectItem value="005">0.05mm</SelectItem><SelectItem value="007">0.07mm</SelectItem><SelectItem value="010">0.10mm</SelectItem><SelectItem value="015">0.15mm</SelectItem><SelectItem value="020">0.20mm</SelectItem></SelectContent></Select></div>
              <div><Label className="text-muted-foreground text-xs">Curvatura</Label>
                <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-card border-border"><SelectItem value="J">J</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem><SelectItem value="D">D</SelectItem><SelectItem value="L">L</SelectItem><SelectItem value="M">M</SelectItem></SelectContent></Select></div>
              <div><Label className="text-muted-foreground text-xs">Comprimento</Label><Input placeholder="10-12mm" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Cola</Label><Input placeholder="Cola utilizada" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Data retorno prevista</Label><Input type="date" className="bg-secondary border-border mt-1" /></div>
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">Olho Esquerdo - obs.</Label><Input className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Olho Direito - obs.</Label><Input className="bg-secondary border-border mt-1" /></div>
              </div>
              {/* Custom fields */}
              {customFields.map((cf, i) => (
                <div key={i} className="col-span-2"><Label className="text-muted-foreground text-xs">{cf.label}</Label><Input value={cf.value} onChange={e => { const nf = [...customFields]; nf[i].value = e.target.value; setCustomFields(nf); }} className="bg-secondary border-border mt-1" /></div>
              ))}
              <div className="col-span-2 flex gap-2">
                <Input value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} placeholder="Nome do campo personalizado" className="bg-secondary border-border flex-1" />
                <Button variant="outline" size="sm" onClick={() => { if (newFieldLabel) { setCustomFields([...customFields, { label: newFieldLabel, value: "" }]); setNewFieldLabel(""); } }}>+ Campo</Button>
              </div>
              <div className="col-span-2 flex gap-2">
                <Button variant="outline" className="flex-1 border-border text-muted-foreground"><Camera className="w-4 h-4 mr-1" /> Foto Antes</Button>
                <Button variant="outline" className="flex-1 border-border text-muted-foreground"><Camera className="w-4 h-4 mr-1" /> Foto Depois</Button>
              </div>
            </div>
            <Button className="w-full mt-4 gradient-brand text-primary-foreground">Salvar Ficha (descontar estoque)</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {fichas.map(f => (
          <div key={f.id} className="gradient-card rounded-xl p-5 border border-border hover:border-primary/20 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><FileText className="w-4 h-4 text-primary" /></div>
                <div>
                  <p className="font-semibold text-foreground">{f.client}</p>
                  <p className="text-xs text-muted-foreground">{f.service} · {new Date(f.date).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-border text-muted-foreground" onClick={() => setSelectedFicha(f)}>Ver Detalhes</Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: "Técnica", value: f.tecnica },
                { label: "Fio", value: f.fio },
                { label: "Curvatura", value: f.curvatura },
                { label: "Comprimento", value: f.comprimento },
                { label: "Cola", value: f.cola },
              ].map(d => (
                <div key={d.label} className="p-2 rounded-lg bg-secondary/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{d.label}</p>
                  <p className="text-sm font-medium text-foreground">{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selectedFicha} onOpenChange={() => setSelectedFicha(null)}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[80vh] overflow-y-auto">
          {selectedFicha && (
            <>
              <DialogHeader><DialogTitle className="text-foreground">Ficha - {selectedFicha.client}</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Serviço", value: selectedFicha.service },
                    { label: "Data", value: new Date(selectedFicha.date).toLocaleDateString("pt-BR") },
                    { label: "Técnica", value: selectedFicha.tecnica },
                    { label: "Fio", value: selectedFicha.fio },
                    { label: "Curvatura", value: selectedFicha.curvatura },
                    { label: "Comprimento", value: selectedFicha.comprimento },
                    { label: "Cola", value: selectedFicha.cola },
                    { label: "Retorno Previsto", value: selectedFicha.retorno ? new Date(selectedFicha.retorno).toLocaleDateString("pt-BR") : "—" },
                  ].map(d => (
                    <div key={d.label} className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">{d.label}</p>
                      <p className="text-sm font-medium text-foreground">{d.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Olho Esquerdo</p>
                    <p className="text-sm text-foreground">{selectedFicha.olhoEsq || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Olho Direito</p>
                    <p className="text-sm text-foreground">{selectedFicha.olhoDir || "—"}</p>
                  </div>
                </div>
                {selectedFicha.obs && (
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Observações</p>
                    <p className="text-sm text-foreground">{selectedFicha.obs}</p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-secondary/50 text-center text-muted-foreground text-xs">
                  📷 Fotos antes/depois não disponíveis no modo demonstração
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
