import { useEffect, useState } from "react";
import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export const IMPERSONATION_KEY = "finbeauty_impersonating";

export function startImpersonation(target: { nome?: string | null; email?: string | null }) {
  localStorage.setItem(IMPERSONATION_KEY, JSON.stringify({ nome: target.nome, email: target.email }));
}

export default function ImpersonationBanner() {
  const { signOut, user } = useAuth();
  const [target, setTarget] = useState<{ nome?: string | null; email?: string | null } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(IMPERSONATION_KEY);
      setTarget(raw ? JSON.parse(raw) : null);
    } catch {
      setTarget(null);
    }
  }, [user?.id]);

  if (!target) return null;

  const handleExit = async () => {
    localStorage.removeItem(IMPERSONATION_KEY);
    setTarget(null);
    await signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm">
      <span className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        Modo auditoria — visualizando como{" "}
        <strong className="font-semibold">{target.nome || target.email}</strong>
      </span>
      <Button size="sm" variant="outline" className="gap-2" onClick={handleExit}>
        <LogOut className="h-4 w-4" /> Sair da auditoria
      </Button>
    </div>
  );
}
