import { NavLink, useLocation } from "react-router-dom";
import { Home, Users, DollarSign, User, MoreHorizontal, Calendar, Package, Scissors, FileText, HelpCircle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const mainItems = [
  { label: "Início", icon: Home, path: "/home_profissional" },
  { label: "Clientes", icon: Users, path: "/home_profissional?tab=Clientes" },
  { label: "Financeiro", icon: DollarSign, path: "/home_profissional?tab=Financeiro" },
  { label: "Conta", icon: User, path: "/account" },
];

const moreItems = [
  { label: "Agendamentos", icon: Calendar, path: "/home_profissional?tab=Agendamentos" },
  { label: "Estoque", icon: Package, path: "/home_profissional?tab=Estoque" },
  { label: "Serviços", icon: Scissors, path: "/home_profissional?tab=Servicos" },
  { label: "Fichas", icon: FileText, path: "/home_profissional?tab=Fichas" },
  { label: "Como Utilizar", icon: HelpCircle, path: "/home_profissional?tab=ComoUtilizar" },
  { label: "Admin", icon: Shield, path: "/admin" },
];

export default function BottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const fullPath = location.pathname + location.search;

  const isActive = (path: string) => {
    if (path === "/home_profissional") {
      return location.pathname === "/home_profissional" && !location.search;
    }
    return fullPath === path || (path === "/account" && location.pathname === "/account");
  };

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {mainItems.map(item => (
            <NavLink
              key={item.label}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 text-[10px] font-medium transition-colors",
                isActive(item.path) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive(item.path) && "drop-shadow-sm")} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 text-[10px] font-medium text-muted-foreground">
                <MoreHorizontal className="w-5 h-5" />
                <span>Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl pb-8">
              <SheetHeader>
                <SheetTitle className="text-foreground">Mais opções</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {moreItems.map(item => (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl transition-colors",
                      isActive(item.path) ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16" />
    </>
  );
}
