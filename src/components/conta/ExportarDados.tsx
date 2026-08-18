import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  AREA_LABELS,
  buildAreaCSV,
  buildBackupJSON,
  downloadFile,
  fetchAccountData,
  today,
  type ExportArea,
} from "@/lib/exportData";

const AREAS = Object.keys(AREA_LABELS) as ExportArea[];

export default function ExportarDados() {
  const { user, isDemo } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (job: string, fn: (userId: string) => Promise<void>) => {
    if (!user) return;
    if (isDemo) {
      toast.error("Exportação indisponível no modo demonstração.");
      return;
    }
    setBusy(job);
    try {
      await fn(user.id);
      toast.success("Download iniciado!");
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível exportar seus dados.");
    } finally {
      setBusy(null);
    }
  };

  const exportJSON = () =>
    run("json", async (userId) => {
      const data = await fetchAccountData(userId);
      downloadFile(`finbeauty-backup-${today()}.json`, buildBackupJSON(data), "application/json");
    });

  const exportCSV = (area: ExportArea) =>
    run(area, async (userId) => {
      const data = await fetchAccountData(userId);
      downloadFile(`finbeauty-${area}-${today()}.csv`, buildAreaCSV(area, data), "text/csv");
    });

  return (
    <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-4">
      <div>
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" /> Exportar dados da conta
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Baixe uma cópia completa dos seus dados para guardar como backup ou migrar para outro
          aplicativo. Só são exportados os dados da sua conta. Fotos e anexos aparecem como links
          dentro dos arquivos.
        </p>
      </div>

      <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 space-y-2">
        <p className="text-xs font-medium text-foreground">Backup completo</p>
        <p className="text-xs text-muted-foreground">
          Um único arquivo com perfil, clientes, serviços, equipe, agendamentos, financeiro,
          estoque, fichas e bloqueios de agenda.
        </p>
        <Button
          size="sm"
          className="gradient-brand text-primary-foreground"
          onClick={exportJSON}
          disabled={busy !== null}
        >
          {busy === "json" ? (
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
          ) : (
            <FileJson className="w-3.5 h-3.5 mr-1" />
          )}
          Baixar tudo (JSON)
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">Planilhas por área (CSV)</p>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((area) => (
            <Button
              key={area}
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => exportCSV(area)}
              disabled={busy !== null}
            >
              {busy === area ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
              )}
              {AREA_LABELS[area]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
