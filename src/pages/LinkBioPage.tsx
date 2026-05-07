import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Calendar, Instagram, MessageCircle, Globe, ExternalLink, Check,
  ArrowLeft, Clock, Upload, Loader2, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PublicProfile = {
  id: string;
  nome: string | null;
  studio_name: string | null;
  bio: string | null;
  foto_url: string | null;
  instagram: string | null;
  whatsapp: string | null;
  site: string | null;
  outros_links: { id?: string; label: string; url: string }[] | null;
  studio_hours: any;
  cobrar_sinal: boolean | null;
  valor_sinal: number | null;
  pix_key: string | null;
  pix_key_type: string | null;
  slug: string | null;
};

type PublicService = {
  id: string;
  nome: string;
  descricao: string | null;
  duracao: number | null;
  preco: number | null;
};

const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

type Step = "home" | "service" | "datetime" | "form" | "payment" | "done";

export default function LinkBioPage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);

  const [step, setStep] = useState<Step>("home");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) || null,
    [serviceId, services]
  );

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const [{ data: prof, error: pErr }, { data: svcs }] = await Promise.all([
        supabase.rpc("get_public_profile_by_slug", { _slug: slug }),
        supabase.rpc("get_public_services_by_slug", { _slug: slug }),
      ]);
      if (pErr || !prof || (Array.isArray(prof) && prof.length === 0)) {
        setProfile(null);
      } else {
        setProfile(Array.isArray(prof) ? (prof[0] as PublicProfile) : (prof as PublicProfile));
      }
      setServices((svcs as PublicService[]) || []);
      setLoading(false);
    })();
  }, [slug]);

  const initials =
    (profile?.studio_name || profile?.nome || "FB")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const today = new Date().toISOString().split("T")[0];

  const submitBooking = async () => {
    if (!slug || !serviceId || !date || !time || !name || !phone) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSubmitting(true);
    try {
      let comprovanteUrl: string | null = null;
      if (profile?.cobrar_sinal && receiptFile) {
        const path = `${slug}/${Date.now()}-${receiptFile.name}`;
        const { error: upErr } = await supabase.storage
          .from("comprovantes")
          .upload(path, receiptFile);
        if (upErr) throw upErr;
        comprovanteUrl = path;
      }

      const { error } = await supabase.rpc("create_public_booking", {
        _slug: slug,
        _servico_id: serviceId,
        _data: date,
        _horario: time,
        _nome: name,
        _telefone: phone,
        _email: email,
        _notas: notes,
        _comprovante_url: comprovanteUrl,
      });
      if (error) throw error;
      toast.success("Agendamento marcado com sucesso!");
      setStep("done");
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar agendamento");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-foreground">Página não encontrada</h1>
          <p className="text-sm text-muted-foreground">
            Nenhum profissional encontrado para <span className="text-primary">/u/{slug}</span>
          </p>
        </div>
      </div>
    );
  }

  // ---------- STEP: SERVICE ----------
  if (step === "service") {
    return (
      <PublicShell title="Escolha o serviço" onBack={() => setStep("home")}>
        {services.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            Nenhum serviço disponível no momento.
          </div>
        ) : (
          <div className="space-y-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setServiceId(s.id);
                  setStep("datetime");
                }}
                className="w-full text-left rounded-xl p-4 border border-border bg-card hover:border-primary/40 transition-colors"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{s.nome}</p>
                    {s.descricao && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.descricao}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {s.duracao || 60} min
                    </p>
                  </div>
                  <p className="text-base font-bold text-primary whitespace-nowrap">
                    R$ {Number(s.preco || 0).toFixed(2)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </PublicShell>
    );
  }

  // ---------- STEP: DATE / TIME ----------
  if (step === "datetime") {
    return (
      <PublicShell title="Data e horário" onBack={() => setStep("service")}>
        <div className="rounded-xl p-4 border border-border bg-card space-y-4">
          {selectedService && (
            <div className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">{selectedService.nome}</span> ·{" "}
              R$ {Number(selectedService.preco || 0).toFixed(2)}
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Data</Label>
            <Input
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-secondary border-border mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Horário</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    time === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground hover:bg-primary/15"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={() => setStep("form")}
            disabled={!date || !time}
            className="w-full gradient-brand text-primary-foreground"
          >
            Continuar
          </Button>
        </div>
      </PublicShell>
    );
  }

  // ---------- STEP: FORM ----------
  if (step === "form") {
    const next = profile.cobrar_sinal ? () => setStep("payment") : submitBooking;
    return (
      <PublicShell title="Seus dados" onBack={() => setStep("datetime")}>
        <div className="rounded-xl p-4 border border-border bg-card space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Nome completo *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">WhatsApp *</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" className="bg-secondary border-border mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary border-border mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-secondary border-border mt-1 min-h-[60px]" />
          </div>
          <Button
            onClick={next}
            disabled={!name || !phone || submitting}
            className="w-full gradient-brand text-primary-foreground"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : profile.cobrar_sinal ? "Continuar para pagamento" : "Confirmar agendamento"}
          </Button>
        </div>
      </PublicShell>
    );
  }

  // ---------- STEP: PAYMENT (PIX) ----------
  if (step === "payment") {
    return (
      <PublicShell title="Pagamento do sinal" onBack={() => setStep("form")}>
        <div className="rounded-xl p-4 border border-border bg-card space-y-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Valor do sinal</p>
            <p className="text-2xl font-bold text-primary">R$ {Number(profile.valor_sinal || 0).toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-secondary p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Chave PIX ({profile.pix_key_type || "—"})</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground break-all">{profile.pix_key || "Não configurada"}</p>
              {profile.pix_key && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(profile.pix_key || "");
                    toast.success("Chave copiada");
                  }}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Comprovante (imagem)</Label>
            <label className="mt-1 flex items-center gap-2 p-3 rounded-lg border border-dashed border-border bg-secondary/50 cursor-pointer hover:border-primary/40 transition-colors">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground truncate">
                {receiptFile ? receiptFile.name : "Selecionar arquivo"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          <Button
            onClick={submitBooking}
            disabled={submitting}
            className="w-full gradient-brand text-primary-foreground"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar agendamento"}
          </Button>
        </div>
      </PublicShell>
    );
  }

  // ---------- STEP: DONE ----------
  if (step === "done") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 animate-fade-in max-w-sm">
          <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Agendamento enviado! 🎉</h2>
          <p className="text-sm text-muted-foreground">
            Você receberá uma confirmação em breve via WhatsApp.
          </p>
          <Button
            onClick={() => {
              setStep("home");
              setServiceId(null);
              setDate("");
              setTime("");
              setName("");
              setPhone("");
              setEmail("");
              setNotes("");
              setReceiptFile(null);
            }}
            variant="outline"
            className="border-primary/30 text-primary"
          >
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  // ---------- HOME ----------
  const links = [
    profile.instagram && { label: "Instagram", url: profile.instagram.startsWith("http") ? profile.instagram : `https://instagram.com/${profile.instagram.replace("@", "")}`, icon: Instagram },
    profile.whatsapp && { label: "WhatsApp", url: `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`, icon: MessageCircle },
    profile.site && { label: "Site", url: profile.site.startsWith("http") ? profile.site : `https://${profile.site}`, icon: Globe },
    ...((profile.outros_links || []).map((l) => ({ label: l.label, url: l.url, icon: ExternalLink }))),
  ].filter(Boolean) as { label: string; url: string; icon: any }[];

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 pt-10">
      <div className="w-full max-w-md text-center space-y-6 animate-fade-in">
        {profile.foto_url ? (
          <img
            src={profile.foto_url}
            alt={profile.studio_name || profile.nome || "Profissional"}
            className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-primary/20"
          />
        ) : (
          <div className="w-24 h-24 rounded-full gradient-brand flex items-center justify-center mx-auto text-2xl font-bold text-primary-foreground">
            {initials}
          </div>
        )}

        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground break-words">
            {profile.studio_name || profile.nome}
          </h1>
          {profile.bio && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-line break-words">
              {profile.bio}
            </p>
          )}
        </div>

        <Button
          onClick={() => setStep("service")}
          className="w-full gradient-brand text-primary-foreground py-6 text-base"
        >
          <Calendar className="w-5 h-5 mr-2" /> Agendar atendimento
        </Button>

        <div className="space-y-2.5">
          {links.map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-full p-3 rounded-xl border border-border bg-card hover:border-primary/40 text-foreground hover:text-primary transition-colors font-medium"
            >
              <l.icon className="w-5 h-5" />
              <span className="flex-1 text-left">{l.label}</span>
              <ExternalLink className="w-3 h-3 opacity-40" />
            </a>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/50 pt-4">Feito com FinBeauty ✨</p>
      </div>
    </div>
  );
}

function PublicShell({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 pt-8">
      <div className="w-full max-w-md space-y-4 animate-fade-in">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {children}
      </div>
    </div>
  );
}
