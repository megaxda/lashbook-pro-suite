import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ConsultProLashTab() {
  const [result, setResult] = useState<null | { tecnica: string; fio: string; curvatura: string; cola: string; obs: string }>(null);

  const diagnose = () => {
    setResult({
      tecnica: "Volume Russo (3D-5D)",
      fio: "Mink 0.07mm",
      curvatura: "D",
      cola: "Cola Premium Black (secagem 1-2s)",
      obs: "Cílios naturais finos e curtos. Recomenda-se leques de 3-4 fios para manter a saúde capilar. Evitar comprimentos acima de 12mm. Priorizar curvatura D para efeito olho de boneca.",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Sparkles className="w-6 h-6 text-primary" /> ConsultProLash</h2>
        <p className="text-muted-foreground text-sm mt-1">Diagnóstico técnico inteligente para extensão de cílios</p>
      </div>

      <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
        <h3 className="font-semibold text-foreground">Características dos Cílios Naturais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label className="text-muted-foreground text-xs">Espessura dos cílios naturais</Label>
            <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="bg-card border-border"><SelectItem value="fino">Fino</SelectItem><SelectItem value="medio">Médio</SelectItem><SelectItem value="grosso">Grosso</SelectItem></SelectContent></Select></div>
          <div><Label className="text-muted-foreground text-xs">Comprimento natural</Label>
            <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="bg-card border-border"><SelectItem value="curto">Curto (5-7mm)</SelectItem><SelectItem value="medio">Médio (8-10mm)</SelectItem><SelectItem value="longo">Longo (11mm+)</SelectItem></SelectContent></Select></div>
          <div><Label className="text-muted-foreground text-xs">Curvatura natural</Label>
            <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="bg-card border-border"><SelectItem value="reto">Reto</SelectItem><SelectItem value="levecurva">Leve curva</SelectItem><SelectItem value="curvado">Curvado</SelectItem></SelectContent></Select></div>
          <div><Label className="text-muted-foreground text-xs">Densidade</Label>
            <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="bg-card border-border"><SelectItem value="rala">Rala</SelectItem><SelectItem value="media">Média</SelectItem><SelectItem value="densa">Densa</SelectItem></SelectContent></Select></div>
          <div><Label className="text-muted-foreground text-xs">Formato do olho</Label>
            <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="bg-card border-border"><SelectItem value="amendoado">Amendoado</SelectItem><SelectItem value="redondo">Redondo</SelectItem><SelectItem value="caido">Caído</SelectItem><SelectItem value="encapuzado">Encapuzado</SelectItem></SelectContent></Select></div>
          <div><Label className="text-muted-foreground text-xs">Efeito desejado</Label>
            <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="bg-card border-border"><SelectItem value="natural">Natural</SelectItem><SelectItem value="boneca">Olho de boneca</SelectItem><SelectItem value="gatinho">Gatinho</SelectItem><SelectItem value="esquilo">Esquilo</SelectItem></SelectContent></Select></div>
        </div>
        <Button onClick={diagnose} className="w-full gradient-pink text-primary-foreground mt-4"><Sparkles className="w-4 h-4 mr-2" /> Gerar Diagnóstico</Button>
      </div>

      {result && (
        <div className="gradient-card rounded-xl p-6 border border-primary/20 glow-pink space-y-4 animate-fade-in">
          <h3 className="font-semibold text-foreground text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Resultado do Diagnóstico</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Técnica Recomendada", value: result.tecnica },
              { label: "Fio Recomendado", value: result.fio },
              { label: "Curvatura", value: result.curvatura },
              { label: "Cola Recomendada", value: result.cola },
            ].map(r => (
              <div key={r.label} className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">{r.label}</p>
                <p className="text-sm font-semibold text-foreground mt-1">{r.value}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Observações</p>
            <p className="text-sm text-foreground mt-1">{result.obs}</p>
          </div>
        </div>
      )}
    </div>
  );
}
