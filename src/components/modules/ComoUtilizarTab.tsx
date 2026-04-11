import { HelpCircle, BookOpen, Users, Calendar, DollarSign, Package, Scissors, FileText, Sparkles } from "lucide-react";

const sections = [
  { icon: BookOpen, title: "Dashboard", desc: "Visão geral com cards de resumo, gráficos de desempenho, agenda do dia e alertas inteligentes." },
  { icon: Users, title: "Clientes", desc: "Cadastre e gerencie suas clientes com ficha completa, histórico de atendimentos, fotos e follow-up automático." },
  { icon: Calendar, title: "Agendamentos", desc: "Visualize sua agenda em formato diário, semanal ou mensal. Crie agendamentos com serviços, pagamentos e lembretes." },
  { icon: DollarSign, title: "Financeiro", desc: "Controle receitas e despesas, veja gráficos de desempenho e acompanhe seu ticket médio." },
  { icon: Sparkles, title: "ConsultProLash", desc: "Diagnóstico técnico inteligente: informe as características dos cílios naturais e receba recomendações de técnica, fio e curvatura." },
  { icon: Package, title: "Estoque", desc: "Gerencie seus produtos com controle de quantidade mínima, reposição sugerida, validade e movimentações." },
  { icon: Scissors, title: "Serviços", desc: "Cadastre seus serviços com preço, duração, categoria e controle de disponibilidade para agendamento online." },
  { icon: FileText, title: "Fichas Técnicas", desc: "Registre detalhes técnicos de cada atendimento: fio, curvatura, comprimento, cola, fotos antes/depois." },
];

export default function ComoUtilizarTab() {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><HelpCircle className="w-6 h-6 text-primary" /> Como Utilizar</h2>
        <p className="text-muted-foreground text-sm mt-1">Guia rápido de cada módulo do LASH BOOK</p>
      </div>
      <div className="space-y-3">
        {sections.map(s => (
          <div key={s.title} className="gradient-card rounded-xl p-5 border border-border hover:border-primary/20 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary flex-shrink-0"><s.icon className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
