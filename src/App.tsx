import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import HomeProfissional from "@/pages/HomeProfissional";
import AccountPage from "@/pages/AccountPage";
import AdminPage from "@/pages/AdminPage";
import LinkBioPage from "@/pages/LinkBioPage";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import CreateFinPage from "@/pages/CreateFinPage";
import AccountBlocked from "@/components/AccountBlocked";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isBlocked } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-primary">Carregando...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (isBlocked) return <AccountBlocked />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-primary">Carregando...</div></div>;
  if (profile?.role !== 'admin') return <Navigate to="/home_profissional" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/creatifin" element={<CreateFinPage />} />
            <Route path="/" element={<Navigate to="/home_profissional" replace />} />
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/home_profissional" element={<HomeProfissional />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            </Route>
            <Route path="/u/:slug" element={<LinkBioPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
