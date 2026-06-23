import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home, Users, Calendar, DollarSign, Package, Scissors,
  FileText, HelpCircle, User, Shield, LogOut, ChevronLeft, ChevronRight, Menu, X, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const navItems = [
  { label: "Início", icon: Home, path: "/home_profissional", tab: undefined, tour: "nav-inicio" },
  { label: "Clientes", icon: Users, path: "/home_profissional", tab: "Clientes", tour: "nav-clientes" },
  { label: "Agendamentos", icon: Calendar, path: "/home_profissional", tab: "Agendamentos", tour: "nav-agendamentos" },
  { label: "Financeiro", icon: DollarSign, path: "/home_profissional", tab: "Financeiro", tour: "nav-financeiro" },
  { label: "Estoque", icon: Package, path: "/home_profissional", tab: "Estoque", tour: "nav-estoque" },
  { label: "Serviços", icon: Scissors, path: "/home_profissional", tab: "Servicos", tour: "nav-servicos" },
  { label: "Fichas", icon: FileText, path: "/home_profissional", tab: "Fichas", tour: "nav-fichas" },
  { label: "Como Utilizar", icon: HelpCircle, path: "/home_profissional", tab: "ComoUtilizar" },
  { label: "Minha Conta", icon: User, path: "/account", tour: "nav-conta" },
];

// Bottom nav: 4 principais + "Mais" abre sheet com o restante
const mobileBottomNav = [
  { label: "Início", icon: Home, path: "/home_profissional", tab: undefined, tour: "nav-inicio" },
  { label: "Clientes", icon: Users, path: "/home_profissional", tab: "Clientes", tour: "nav-clientes" },
  { label: "Agenda", icon: Calendar, path: "/home_profissional", tab: "Agendamentos", tour: "nav-agendamentos" },
  { label: "Financeiro", icon: DollarSign, path: "/home_profissional", tab: "Financeiro", tour: "nav-financeiro" },
];

const mobileMoreItems = [
  { label: "Estoque", icon: Package, path: "/home_profissional", tab: "Estoque", tour: "nav-estoque" },
  { label: "Serviços", icon: Scissors, path: "/home_profissional", tab: "Servicos", tour: "nav-servicos" },
  { label: "Fichas", icon: FileText, path: "/home_profissional", tab: "Fichas", tour: "nav-fichas" },
  { label: "Minha Conta", icon: User, path: "/account", tour: "nav-conta" },
  { label: "Como Utilizar", icon: HelpCircle, path: "/home_profissional", tab: "ComoUtilizar" },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get("tab");
  const { signOut, profile } = useAuth();

  const isAdmin = profile?.role === "admin";
  const allNavItems = isAdmin ? [...navItems, { label: "Admin", icon: Shield, path: "/admin", tab: undefined }] : navItems;
  const allMoreItems = isAdmin ? [...mobileMoreItems, { label: "Admin", icon: Shield, path: "/admin", tab: undefined }] : mobileMoreItems;

  const isActive = (item: { path: string; tab?: string }) => {
    if (item.path === "/home_profissional" && location.pathname === "/home_profissional") {
      if (!item.tab && !currentTab) return true;
      if (item.tab && currentTab === item.tab) return true;
    }
    if (item.path !== "/home_profissional" && location.pathname === item.path) return true;
    return false;
  };

  const isMoreActive = () => allMoreItems.some(i => isActive(i));

  const getLink = (item: { path: string; tab?: string }) =>
    item.tab ? `${item.path}?tab=${item.tab}` : item.path;

  const initials = profile?.nome?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "FB";

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={cn("flex items-center gap-3 px-4 pt-5 pb-3", collapsed && "justify-center px-2")}>
        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
          <DollarSign className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight">FinBeauty</h1>
            <p className="text-[9px] text-muted-foreground tracking-widest uppercase">v6.0.0</p>
          </div>
        )}
      </div>

      <div className={cn("mx-3 mb-3 p-2.5 rounded-xl bg-secondary/50", collapsed && "mx-1 p-2")}>
        <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-foreground">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{profile?.nome || "Profissional"}</p>
              <p className="text-xs text-muted-foreground truncate">Profissional</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {allNavItems.map((item: any) => (
          <NavLink
            key={item.label}
            to={getLink(item)}
            data-tour={item.tour}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              collapsed && "justify-center px-2",
              isActive(item)
                ? "gradient-brand text-primary-foreground shadow-lg glow-brand"
                : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 space-y-0.5">
        <button onClick={() => signOut()} className={cn(
          "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
          collapsed && "justify-center px-2"
        )}>
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center p-2 mx-3 mb-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-[68px]" : "w-60"
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile bottom nav (5 items: 4 principais + Mais) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex justify-around items-stretch px-1 pb-[env(safe-area-inset-bottom)]">
        {mobileBottomNav.map(item => (
          <NavLink
            key={item.label}
            to={getLink(item)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-xs font-medium transition-colors",
              isActive(item) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-xs font-medium transition-colors",
            isMoreActive() ? "text-primary" : "text-muted-foreground"
          )}
        >
          <MoreHorizontal className="w-5 h-5" />
          Mais
        </button>
      </nav>

      {/* Mobile "Mais" sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="lg:hidden bg-card border-border rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <SheetTitle className="text-foreground text-left">Mais opções</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {allMoreItems.map(item => (
              <NavLink
                key={item.label}
                to={getLink(item)}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border min-h-[80px] text-xs font-medium transition-all",
                  isActive(item)
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-secondary/40 text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-center leading-tight">{item.label}</span>
              </NavLink>
            ))}
            <button
              onClick={() => { setMoreOpen(false); signOut(); }}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive min-h-[80px] text-xs font-medium hover:bg-destructive/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
