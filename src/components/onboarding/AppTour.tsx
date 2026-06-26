import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { TourTooltip, TourStepMeta } from "./TourTooltip";
import {
  Sparkles, Home, CalendarDays, Users, Wallet, Package, Scissors, ClipboardList, Settings,
} from "lucide-react";

const LS_KEY = "finbeauty.tour.completed";

type TourStep = Step & { meta: TourStepMeta };

const steps: TourStep[] = [
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    content: "",
    meta: {
      icon: Sparkles,
      title: "Bem-vinda ao FinBeauty 💙",
      body: "Em menos de 1 minuto eu te mostro o que dá para fazer aqui. Você pode pular quando quiser e refazer este tour depois em Minha Conta.",
      hero: true,
    },
  },
  {
    target: '[data-tour="nav-inicio"]',
    disableBeacon: true,
    content: "",
    meta: {
      icon: Home,
      title: "Início",
      body: "Seu resumo do dia: próximos atendimentos, faturamento e atalhos rápidos.",
    },
  },
  {
    target: '[data-tour="nav-agendamentos"]',
    disableBeacon: true,
    content: "",
    meta: {
      icon: CalendarDays,
      title: "Agendamentos",
      body: "Crie, edite e bloqueie horários. Alterne entre visão diária, semanal e mensal — como na Agenda do Google.",
    },
  },
  {
    target: '[data-tour="nav-clientes"]',
    disableBeacon: true,
    content: "",
    meta: {
      icon: Users,
      title: "Clientes",
      body: "Histórico completo, aniversariantes e quem está sem voltar há tempos. Tudo a um clique do WhatsApp.",
    },
  },
  {
    target: '[data-tour="nav-financeiro"]',
    disableBeacon: true,
    content: "",
    meta: {
      icon: Wallet,
      title: "Financeiro",
      body: "Receitas e despesas com lucro calculado automaticamente. Atendimento concluído já vira receita sozinho.",
    },
  },
  {
    target: '[data-tour="nav-estoque"]',
    disableBeacon: true,
    content: "",
    meta: {
      icon: Package,
      title: "Estoque",
      body: "Controle seus produtos com alertas de reposição e baixa automática quando usar nas fichas.",
    },
  },
  {
    target: '[data-tour="nav-servicos"]',
    disableBeacon: true,
    content: "",
    meta: {
      icon: Scissors,
      title: "Serviços",
      body: "Defina nome, duração e preço. Esses dados alimentam a agenda, o link da bio e o financeiro.",
    },
  },
  {
    target: '[data-tour="nav-fichas"]',
    disableBeacon: true,
    content: "",
    meta: {
      icon: ClipboardList,
      title: "Fichas",
      body: "Anamneses personalizadas e fotos de antes/depois organizadas por cliente.",
    },
  },
  {
    target: '[data-tour="nav-conta"]',
    disableBeacon: true,
    content: "",
    meta: {
      icon: Settings,
      title: "Minha Conta",
      body: "Personalize seu link público, ative cobrança de sinal por PIX, gerencie equipe e refaça este tour quando quiser.",
    },
  },
];

export default function AppTour() {
  const { user, profile, refreshProfile } = useAuth() as any;
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    const localDone = localStorage.getItem(LS_KEY) === "1";
    const remoteDone = profile?.onboarding_completed === true;
    if (localDone || remoteDone) return;
    const t = setTimeout(() => setRun(true), 800);
    return () => clearTimeout(t);
  }, [user, profile]);

  const markDone = async () => {
    localStorage.setItem(LS_KEY, "1");
    if (user) {
      try {
        await supabase.from("profiles").update({ onboarding_completed: true } as any).eq("id", user.id);
        await refreshProfile?.();
      } catch { /* noop */ }
    }
  };

  const handleCallback = (data: CallBackProps) => {
    const finished: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finished.includes(data.status)) {
      setRun(false);
      markDone();
    }
  };

  useEffect(() => {
    const handler = () => {
      localStorage.removeItem(LS_KEY);
      setRun(false);
      setTimeout(() => setRun(true), 100);
    };
    window.addEventListener("finbeauty:restart-tour", handler);
    return () => window.removeEventListener("finbeauty:restart-tour", handler);
  }, []);

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      scrollToFirstStep
      disableScrollParentFix
      callback={handleCallback}
      tooltipComponent={TourTooltip}
      floaterProps={{ disableAnimation: false }}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          zIndex: 10000,
          arrowColor: "hsl(var(--card))",
          overlayColor: "rgba(15, 23, 42, 0.65)",
        },
        spotlight: { borderRadius: 12 },
      }}
    />
  );
}

export function triggerRestartTour() {
  window.dispatchEvent(new Event("finbeauty:restart-tour"));
}
