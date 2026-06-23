import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "finbeauty.tour.completed";

const steps: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Bem-vindo ao FinBeauty 💙",
    content:
      "Vou te mostrar rapidinho como usar o app. Você pode pular a qualquer momento e refazer este tour depois em Minha Conta.",
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-inicio"]',
    title: "Início",
    content: "Aqui você vê o resumo do dia: agenda, receita e atalhos rápidos.",
  },
  {
    target: '[data-tour="nav-agendamentos"]',
    title: "Agendamentos",
    content:
      "Crie, edite e bloqueie horários. Visualize por dia, semana ou mês.",
  },
  {
    target: '[data-tour="nav-clientes"]',
    title: "Clientes",
    content:
      "Cadastro completo, histórico de atendimentos e follow-ups por WhatsApp.",
  },
  {
    target: '[data-tour="nav-financeiro"]',
    title: "Financeiro",
    content:
      "Receitas, despesas, lucro e ticket médio. Os valores são gerados automaticamente quando um atendimento é concluído.",
  },
  {
    target: '[data-tour="nav-estoque"]',
    title: "Estoque",
    content:
      "Controle produtos, baixas automáticas por serviço e alertas de reposição.",
  },
  {
    target: '[data-tour="nav-servicos"]',
    title: "Serviços",
    content:
      "Cadastre seus serviços com preço e duração. Isso alimenta agenda, link da bio e financeiro.",
  },
  {
    target: '[data-tour="nav-fichas"]',
    title: "Fichas",
    content:
      "Crie fichas de anamnese personalizadas e registre fotos de antes/depois.",
  },
  {
    target: '[data-tour="nav-conta"]',
    title: "Minha Conta",
    content:
      "Personalize seu link da bio, configure cobrança de sinal por PIX e refaça este tour quando quiser.",
  },
];

export default function AppTour() {
  const { user, profile, refreshProfile } = useAuth();
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    const localDone = localStorage.getItem(LS_KEY) === "1";
    const remoteDone = (profile as any).onboarding_completed === true;
    if (localDone || remoteDone) return;
    // pequeno atraso pra DOM montar
    const t = setTimeout(() => setRun(true), 800);
    return () => clearTimeout(t);
  }, [user, profile]);

  const markDone = async () => {
    localStorage.setItem(LS_KEY, "1");
    if (user) {
      try {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true } as any)
          .eq("id", user.id);
        await refreshProfile?.();
      } catch {
        /* noop */
      }
    }
  };

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      markDone();
    }
  };

  // Listener pra refazer o tour pelo menu da conta
  useEffect(() => {
    const handler = () => {
      localStorage.removeItem(LS_KEY);
      setRun(true);
    };
    window.addEventListener("finbeauty:restart-tour", handler);
    return () => window.removeEventListener("finbeauty:restart-tour", handler);
  }, []);

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      disableScrolling={false}
      scrollToFirstStep
      callback={handleCallback}
      locale={{
        back: "Voltar",
        close: "Fechar",
        last: "Concluir",
        next: "Próximo",
        skip: "Pular tour",
      }}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          zIndex: 10000,
          arrowColor: "hsl(var(--card))",
          backgroundColor: "hsl(var(--card))",
          textColor: "hsl(var(--foreground))",
          overlayColor: "rgba(0,0,0,0.55)",
        },
        tooltipContainer: { textAlign: "left" },
        buttonNext: { borderRadius: 8 },
        buttonBack: { color: "hsl(var(--muted-foreground))" },
      }}
    />
  );
}

export function triggerRestartTour() {
  window.dispatchEvent(new Event("finbeauty:restart-tour"));
}
