import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import ThemeToggle from "./ThemeToggle";

export default function MainLayout() {
  return (
    <div className="min-h-screen w-full bg-background">
      {/* Desktop: Sidebar */}
      <div className="hidden lg:block">
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <main className="flex-1">
              <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-pink flex items-center justify-center">
                    <span className="text-primary-foreground text-xs font-bold">LB</span>
                  </div>
                  <h1 className="text-sm font-bold text-foreground tracking-tight">LASH BOOK</h1>
                </div>
                <ThemeToggle />
              </header>
              <div className="pb-2">
                <Outlet />
              </div>
            </main>
          </div>
        </SidebarProvider>
      </div>

      {/* Mobile/Tablet: Bottom Navbar */}
      <div className="lg:hidden">
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-pink flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">LB</span>
            </div>
            <h1 className="text-sm font-bold text-foreground tracking-tight">LASH BOOK</h1>
          </div>
          <ThemeToggle />
        </header>
        <main className="pb-20">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
