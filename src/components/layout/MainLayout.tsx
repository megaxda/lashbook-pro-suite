import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import ThemeToggle from "./ThemeToggle";
import AppSidebar from "./AppSidebar";

export default function MainLayout() {
  return (
    <>
      {/* Desktop: AppSidebar (handles its own responsive logic) */}
      <AppSidebar />
      
      {/* Main content area */}
      <div className="min-h-screen w-full bg-background lg:ml-64">
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-end">
          <ThemeToggle />
        </header>
        
        <main className="pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile/Tablet: Bottom Navigation */}
      <BottomNav />
    </>
  );
}
