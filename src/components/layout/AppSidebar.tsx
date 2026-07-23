import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  Home, Users, Calendar, DollarSign, Package, Scissors,
  FileText, HelpCircle, User, Shield, LogOut, ChevronLeft, ChevronRight, MoreHorizontal,
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

// 5 destinos fixos no mobile: Início, Clientes, Agenda, Financeiro, Mais
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
      <div className={cn("flex items-center gap-3 px-4 pt-6 pb-4", collapsed && "justify-center px-2")}>
        <div className="w-10 h-10 rounded-card gradient-brand flex items-center justify-center flex-shrink-0 shadow-ios-1">
          <DollarSign className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="ios-headline text-foreground">FinBeauty</h1>
            <p className="ios-caption text-muted-foreground uppercase tracking-widest">v6.0.0</p>
          </div>
        )}
      </div>

      <div className={cn("mx-3 mb-4 p-3 rounded-card bg-secondary/60", collapsed && "mx-2 p-2")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-9 h-9 rounded-pill gradient-brand flex items-center justify-center flex-shrink-0 ios-footnote font-bold text-primary-foreground">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="ios-callout text-foreground truncate">{profile?.nome || "Profissional"}</p>
              <p className="ios-footnote text-muted-foreground truncate">Profissional</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {allNavItems.map((item: any) => {
          const active = isActive(item);
          return (
            <NavLink
              key={item.label}
              to={getLink(item)}
              data-tour={item.tour}
              className={cn(
                "flex items-center gap-3 px-3 h-11 rounded-control ios-callout transition-colors",
                collapsed && "justify-center px-2",
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-sidebar-foreground hover:bg-secondary/70 hover:text-foreground",
              )}
            >
              <item.icon className="w-[20px] h-[20px] flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-2 pt-4">
        <button
          onClick={() => signOut()}
          className={cn(
            "flex items-center gap-3 w-full px-3 h-11 rounded-control ios-callout text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="w-[20px] h-[20px]" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        className="hidden lg:flex items-center justify-center h-9 w-9 mx-auto mb-3 rounded-pill text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-dvh sticky top-0 bg-sidebar border-r border-sidebar-border transition-[width] duration-300",
          collapsed ? "w-[68px]" : "w-64",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Bottom Tab Bar mobile — 5 destinos, safe area, mínimo 44×44 */}
      <nav
        aria-label="Navegação principal"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/60 shadow-ios-nav flex justify-around items-stretch px-1 pb-[env(safe-area-inset-bottom)]"
      >
        {mobileBottomNav.map((item: any) => {
          const active = isActive(item);
          return (
            <NavLink
              key={item.label}
              to={getLink(item)}
              data-tour={item.tour}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] min-w-[44px]",
                "text-[11px] leading-none font-medium transition-colors press-scale",
                active ? "text-primary font-semibold" : "text-muted-foreground",
              )}
            >
              <item.icon className={cn("w-[22px] h-[22px]", active && "text-primary")} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          aria-label="Mais opções"
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] min-w-[44px]",
            "text-[11px] leading-none font-medium transition-colors press-scale",
            isMoreActive() ? "text-primary font-semibold" : "text-muted-foreground",
          )}
        >
          <MoreHorizontal className="w-[22px] h-[22px]" />
          <span>Mais</span>
        </button>
      </nav>

      {/* Sheet "Mais" */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="lg:hidden bg-card border-border rounded-t-card pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader>
            <SheetTitle className="ios-headline text-foreground text-left">Mais opções</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {allMoreItems.map(item => {
              const active = isActive(item);
              return (
                <NavLink
                  key={item.label}
                  to={getLink(item)}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-3 rounded-card border min-h-[88px] ios-footnote font-medium transition-all press-scale",
                    active
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border/70 bg-secondary/40 text-foreground hover:bg-secondary",
                  )}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-center leading-tight">{item.label}</span>
                </NavLink>
              );
            })}
            <button
              onClick={() => { setMoreOpen(false); signOut(); }}
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-card border border-destructive/30 bg-destructive/5 text-destructive min-h-[88px] ios-footnote font-medium hover:bg-destructive/10 transition-all press-scale"
            >
              <LogOut className="w-6 h-6" />
              <span>Sair</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
