import { useState, useRef } from "react";
import { Plus, FileText, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { mockClients } from "@/data/mockData";

interface Ficha {
  id: string;
  client: string;
  date: string;
  area: string;
  procedure: string;
  healthHistory: string;
  allergies: string;
  medications: string;
  skinType: string;
  restrictions: string;
  productsUsed: string;
  observations: string;
  consent: boolean;
  returnDate: string;
  photoBefore: string | null;
  photoAfter: string | null;
  customFields: { label: string; value: string }[];
}

const mockFichas: Ficha[] = [
  { id: "1", client: "Maria Silva", date: "2026-04-10", area: "Cílios", procedure: "Volume Russo 3D", healthHistory: "Sem histórico relevante", allergies: "Nenhuma", medications: "Nenhuma", skinType: "Normal", restrictions: "", productsUsed: "Fio 0.07 D, Cola Premium Black", observations: "", consent: true, returnDate: "2026-05-01", photoBefore: null, photoAfter: null, customFields: [] },
  { id: "2", client: "Camila Pereira", date: "2026-04-09", area: "Cílios", procedure: "Manutenção Volume", healthHistory: "Rinite alérgica", allergies: "Sensibilidade a cola", medications: "Anti-alérgico eventual", skinType: "Sensível", restrictions: "Evitar cola com formol", productsUsed: "Fio 0.07 C, Cola Sensitive", observations: "Cliente sensível, usar proteção extra", consent: true, returnDate: "2026-04-30", photoBefore: null, photoAfter: null, customFields: [] },
  { id: "3", client: "Beatriz Lima", date: "2026-04-08", area: "Sobrancelha", procedure: "Design + Henna", healthHistory: "", allergies: "Nenhuma", medications: "", skinType: "Oleosa", restrictions: "", productsUsed: "Henna Castanho Médio", observations: "", consent: true, returnDate: "2026-04-22", photoBefore: null, photoAfter: null, customFields: [] },
];

const areaOptions = ["Cílios", "Sobrancelha", "Unhas", "Estética Facial", "Estética Corporal", "Cabelo", "Maquiagem", "Depilação", "Outro"];
const skinTypes = ["Normal", "Seca", "Oleosa", "Mista", "Sensível"];

export default function FichasTab() {
  const [fichas, setFichas] = useState(mockFichas);
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<Partial<Ficha>>({});
  const [customFields, setCustomFields] = useState<{ label: string; value: string }[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const fileBeforeRef = useRef<HTMLInputElement>(null);
  const fileAfterRef = useRef<HTMLInputElement>(null);

  const openNew = () => {
    setIsCreating(true);
    setForm({ client: "", date: new Date().toISOString().slice(0, 10), area: "", procedure: "", healthHistory: "", allergies: "", medications: "", skinType: "", restrictions: "", productsUsed: "", observations: "", consent: false, returnDate: "", photoBefore: null, photoAfter: null });
    setCustomFields([]);
  };

  const saveFicha = () => {
    if (!form.client || !form.procedure) return;
    const ficha: Ficha = { id: String(Date.now()), ...form, customFields } as Ficha;
    setFichas(prev => [ficha, ...prev]);
    setIsCreating(false);
    setForm({});
    setCustomFields([]);
  };

  const handleFileSelect = (type: "before" | "after") => {
    const input = type === "before" ? fileBeforeRef.current : fileAfterRef.current;
    if (input) input.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setForm(prev => ({ ...prev, [type === "before" ? "photoBefore" : "photoAfter"]: url }));
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Fichas de Anamnese</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">Registro universal de procedimentos estéticos</p>
        </div>
        <Button size="sm" className="gradient-brand text-primary-foreground h-8 text-xs" onClick={openNew}><Plus className="w-3.5 h-3.5 mr-1" /> Nova Ficha</Button>
      </div>

      <div className="space-y-2">
        {fichas.map(f => (
          <div key={f.id} onClick={() => setSelectedFicha(f)} className="bg-card rounded-xl p-3 sm:p-4 border border-border hover:border-primary/20 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 rounded-md bg-primary/10"><FileText className="w-3.5 h-3.5 text-primary" /></div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{f.client}</p>
                  <p className="text-[10px] text-muted-foreground">{f.area} · {f.procedure} · {new Date(f.date).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">{f.area}</Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selectedFicha} onOpenChange={() => setSelectedFicha(null)}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[85vh] overflow-y-auto">
          {selectedFicha && (
            <>
              <DialogHeader><DialogTitle className="text-foreground">Ficha — {selectedFicha.client}</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Área", selectedFicha.area],
                    ["Procedimento", selectedFicha.procedure],
                    ["Data", new Date(selectedFicha.date).toLocaleDateString("pt-BR")],
                    ["Retorno", selectedFicha.returnDate ? new Date(selectedFicha.returnDate).toLocaleDateString("pt-BR") : "—"],
                    ["Tipo de Pele", selectedFicha.skinType || "—"],
                    ["Alergias", selectedFicha.allergies || "Nenhuma"],
                  ].map(([label, val]) => (
                    <div key={label} className="p-2.5 rounded-lg bg-secondary/50">
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium text-foreground">{val}</p>
                    </div>
                  ))}
                </div>
                {selectedFicha.healthHistory && <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Histórico de Saúde</p><p className="text-sm text-foreground">{selectedFicha.healthHistory}</p></div>}
                {selectedFicha.productsUsed && <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Produtos/Materiais</p><p className="text-sm text-foreground">{selectedFicha.productsUsed}</p></div>}
                {selectedFicha.observations && <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Observações</p><p className="text-sm text-foreground">{selectedFicha.observations}</p></div>}
                {selectedFicha.restrictions && <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Restrições</p><p className="text-sm text-foreground">{selectedFicha.restrictions}</p></div>}
                <div className="p-2.5 rounded-lg bg-secondary/50 flex items-center gap-2"><p className="text-[10px] text-muted-foreground">Consentimento:</p><Badge className={selectedFicha.consent ? "bg-success/15 text-success border-0 text-[10px]" : "bg-destructive/15 text-destructive border-0 text-[10px]"}>{selectedFicha.consent ? "Assinado" : "Pendente"}</Badge></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">Antes</p>
                    {selectedFicha.photoBefore ? <img src={selectedFicha.photoBefore} alt="Antes" className="w-full rounded-md" /> : <p className="text-xs text-muted-foreground">📷 Sem foto</p>}
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">Depois</p>
                    {selectedFicha.photoAfter ? <img src={selectedFicha.photoAfter} alt="Depois" className="w-full rounded-md" /> : <p className="text-xs text-muted-foreground">📷 Sem foto</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create modal */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-foreground">Nova Ficha de Anamnese</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Cliente</Label>
              <Select value={form.client} onValueChange={v => setForm({ ...form, client: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">{mockClients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-muted-foreground text-xs">Área</Label>
              <Select value={form.area} onValueChange={v => setForm({ ...form, area: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">{areaOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-muted-foreground text-xs">Data</Label><Input type="date" value={form.date || ""} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Procedimento</Label><Input value={form.procedure || ""} onChange={e => setForm({ ...form, procedure: e.target.value })} placeholder="Ex: Volume Russo 3D, Design de Sobrancelha..." className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Histórico de Saúde</Label><Textarea value={form.healthHistory || ""} onChange={e => setForm({ ...form, healthHistory: e.target.value })} placeholder="Doenças, cirurgias, tratamentos..." className="bg-secondary border-border mt-1 min-h-[50px]" /></div>
            <div><Label className="text-muted-foreground text-xs">Alergias</Label><Input value={form.allergies || ""} onChange={e => setForm({ ...form, allergies: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Medicamentos</Label><Input value={form.medications || ""} onChange={e => setForm({ ...form, medications: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Tipo de Pele</Label>
              <Select value={form.skinType} onValueChange={v => setForm({ ...form, skinType: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">{skinTypes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-muted-foreground text-xs">Data retorno</Label><Input type="date" value={form.returnDate || ""} onChange={e => setForm({ ...form, returnDate: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Restrições</Label><Input value={form.restrictions || ""} onChange={e => setForm({ ...form, restrictions: e.target.value })} placeholder="Restrições do procedimento" className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Produtos/Materiais Utilizados</Label><Input value={form.productsUsed || ""} onChange={e => setForm({ ...form, productsUsed: e.target.value })} placeholder="Materiais usados no procedimento" className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Observações</Label><Textarea value={form.observations || ""} onChange={e => setForm({ ...form, observations: e.target.value })} className="bg-secondary border-border mt-1 min-h-[50px]" /></div>

            {/* Custom fields */}
            {customFields.map((cf, i) => (
              <div key={i} className="col-span-2"><Label className="text-muted-foreground text-xs">{cf.label}</Label><Input value={cf.value} onChange={e => { const nf = [...customFields]; nf[i].value = e.target.value; setCustomFields(nf); }} className="bg-secondary border-border mt-1" /></div>
            ))}
            <div className="col-span-2 flex gap-2">
              <Input value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} placeholder="Campo personalizado" className="bg-secondary border-border flex-1" />
              <Button variant="outline" size="sm" onClick={() => { if (newFieldLabel) { setCustomFields([...customFields, { label: newFieldLabel, value: "" }]); setNewFieldLabel(""); } }} className="text-xs">+ Campo</Button>
            </div>

            {/* Photos */}
            <div className="col-span-2 grid grid-cols-2 gap-2">
              <div>
                <input type="file" accept="image/*" ref={fileBeforeRef} className="hidden" onChange={e => handleFileChange(e, "before")} />
                <Button variant="outline" className="w-full border-border text-muted-foreground text-xs h-8" onClick={() => handleFileSelect("before")}>
                  <Camera className="w-3.5 h-3.5 mr-1" /> {form.photoBefore ? "✓ Antes" : "Foto Antes"}
                </Button>
                {form.photoBefore && <img src={form.photoBefore} alt="Antes" className="mt-1 rounded-md w-full h-20 object-cover" />}
              </div>
              <div>
                <input type="file" accept="image/*" ref={fileAfterRef} className="hidden" onChange={e => handleFileChange(e, "after")} />
                <Button variant="outline" className="w-full border-border text-muted-foreground text-xs h-8" onClick={() => handleFileSelect("after")}>
                  <Camera className="w-3.5 h-3.5 mr-1" /> {form.photoAfter ? "✓ Depois" : "Foto Depois"}
                </Button>
                {form.photoAfter && <img src={form.photoAfter} alt="Depois" className="mt-1 rounded-md w-full h-20 object-cover" />}
              </div>
            </div>

            {/* Consent */}
            <div className="col-span-2 flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
              <Label className="text-sm text-foreground">Consentimento assinado</Label>
              <Switch checked={form.consent ?? false} onCheckedChange={v => setForm({ ...form, consent: v })} />
            </div>
          </div>
          <Button onClick={saveFicha} className="w-full mt-3 gradient-brand text-primary-foreground">Salvar Ficha</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
