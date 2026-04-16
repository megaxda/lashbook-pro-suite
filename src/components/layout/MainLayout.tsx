import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden pt-12 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
