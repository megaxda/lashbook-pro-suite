import { useState } from "react";
import { useParams } from "react-router-dom";
import { Sparkles, Calendar, Instagram, MessageCircle, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockServices } from "@/data/mockData";

const studioData = {
  name: "Studio Julia Lashes",
  title: "Studio Julia Lashes ✨",
  description: "Extensão de cílios no coração dos Jardins, São Paulo. Agende seu horário e transforme seu olhar!",
  links: [
    { label: "Instagram", url: "#", icon: Instagram },
    { label: "WhatsApp", url: "#", icon: MessageCircle },
    { label: "Meu Site", url: "#", icon: Globe },
  ],
};

export default function LinkBioPage() {
  const { slug } = useParams();
  const [step, setStep] = useState<"home" | "services" | "booking" | "confirm">("home");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const onlineServices = mockServices.filter(s => s.onlineBooking);

  if (step === "services") {
    return (
      <div className="min-h-screen bg-background flex items-start justify-center p-4 pt-8">
        <div className="w-full max-w-md space-y-4 animate-fade-in">
          <button onClick={() => setStep("home")} className="text-sm text-muted-foreground hover:text-primary">← Voltar</button>
          <h2 className="text-xl font-bold text-foreground">Escolha o Serviço</h2>
          {onlineServices.map(s => (
            <button key={s.id} onClick={() => { setSelectedService(s.id); setStep("booking"); }}
              className="w-full text-left gradient-card rounded-xl p-4 border border-border hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.duration}min · {s.category}</p>
                </div>
                <p className="text-lg font-bold text-primary">R$ {s.discountPrice || s.price}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "booking") {
    return (
      <div className="min-h-screen bg-background flex items-start justify-center p-4 pt-8">
        <div className="w-full max-w-md space-y-4 animate-fade-in">
          <button onClick={() => setStep("services")} className="text-sm text-muted-foreground hover:text-primary">← Voltar</button>
          <h2 className="text-xl font-bold text-foreground">Agendar</h2>
          <div className="gradient-card rounded-xl p-6 border border-border space-y-4">
            <div><Label className="text-muted-foreground text-xs">Data</Label><Input type="date" className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Horário</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map(t => (
                  <button key={t} className="p-2 rounded-lg bg-secondary text-sm text-foreground hover:bg-primary/20 hover:text-primary transition-colors">{t}</button>
                ))}
              </div>
            </div>
            <div><Label className="text-muted-foreground text-xs">Seu Nome</Label><Input placeholder="Nome completo" className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Telefone / WhatsApp</Label><Input placeholder="(00) 00000-0000" className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Email</Label><Input placeholder="email@email.com" className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Observações</Label><Input placeholder="Alguma informação importante?" className="bg-secondary border-border mt-1" /></div>
            <Button onClick={() => setStep("confirm")} className="w-full gradient-pink text-primary-foreground">Confirmar Agendamento</Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full gradient-pink flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Agendamento Enviado! 🎉</h2>
          <p className="text-muted-foreground">Você receberá a confirmação em breve.</p>
          <Button onClick={() => setStep("home")} variant="outline" className="border-primary/30 text-primary">Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 pt-12">
      <div className="w-full max-w-md text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full gradient-pink flex items-center justify-center mx-auto text-2xl font-bold text-primary-foreground">
          JS
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{studioData.title}</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{studioData.description}</p>
        </div>

        <Button onClick={() => setStep("services")} className="w-full gradient-pink text-primary-foreground py-6 text-base glow-pink animate-pulse-pink">
          <Calendar className="w-5 h-5 mr-2" /> Agendar Atendimento
        </Button>

        <div className="space-y-3">
          {studioData.links.map(l => (
            <a key={l.label} href={l.url} className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-border bg-card hover:border-primary/30 text-foreground hover:text-primary transition-colors font-medium">
              <l.icon className="w-5 h-5" />
              {l.label}
              <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
            </a>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/50 pt-4">Feito com LASH BOOK ✨</p>
      </div>
    </div>
  );
}
