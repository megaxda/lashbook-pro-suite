import { Outlet } from "react-router-dom";
import BottomNav from "../BottomNav";
import { AppSidebar } from "./AppSidebar";
import ThemeToggle from "../ThemeToggle";

export default function MainLayout() {
  return (
    <div className="min-h-screen w-full bg-background">
      {/* Desktop: Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <AppSidebar />
      </div>
      
      {/* Main Content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-pink flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">LB</span>
            </div>
            <h1 className="text-sm font-bold text-foreground tracking-tight">LASH BOOK</h1>
          </div>
          <ThemeToggle />
        </header>
        
        <main className="pb-2">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile: Bottom Nav */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
