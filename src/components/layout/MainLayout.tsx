import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import ThemeToggle from "./ThemeToggle";

export default function MainLayout() {
  return (
    <div className="min-h-screen w-full bg-background">
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
      <BottomNav />
    </div>
  );
}
