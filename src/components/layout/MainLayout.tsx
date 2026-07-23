import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

export default function MainLayout() {
  return (
    <div className="flex min-h-dvh w-full bg-background">
      <AppSidebar />
      <main
        id="app-main"
        className="flex-1 min-w-0 overflow-x-hidden pt-3 lg:pt-0 pb-tabbar lg:pb-8"
      >
        <Outlet />
      </main>
    </div>
  );
}
