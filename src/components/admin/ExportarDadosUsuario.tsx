import { useState } from "react";
import { FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AREA_LABELS,
  buildAreaCSV,
  buildBackupJSON,
  downloadFile,
  today,
  type AccountData,
  type ExportArea,
} from "@/lib/exportData";

const AREAS = Object.keys(AREA_LABELS) as ExportArea[];

function slugify(v: string) {
  return (v || "usuario")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

async function fetchUserData(userId: string): Promise<AccountData> {
  const { data, error } = await supabase.functions.invoke("admin-export-user", {
    body: { userId },
  });
  const serverError = (data as any)?.error;
  if (error || serverError) throw new Error(serverError || error?.message || "Falha ao exportar");
  const d = (data as any).data ?? {};
  return {
    perfil: d.perfil ?? null,
    clientes: d.clientes ?? [],
    servicos: d.servicos ?? [],
    profissionais: d.profissionais ?? [],
    agendamentos: d.agendamentos ?? [],
    financeiro: d.financeiro ?? [],
    financeiro_pessoal: d.financeiro_pessoal ?? [],
    estoque: d.estoque ?? [],
    fichas: d.fichas ?? [],
    bloqueios_agenda: d.bloqueios_agenda ?? [],
  };
}

interface Props {
  userId: string;
  userLabel: string;
}

export default function ExportarDadosUsuario({ userId, userLabel }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const base = slugify(userLabel);

  const run = async (job: string, fn: (d: AccountData) => void) => {
    setBusy(job);
    try {
      const d = await fetchUserData(userId);
      fn(d);
      toast.success("Download iniciado!");
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível exportar os dados.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 space-y-2">
        <p className="text-xs font-medium text-foreground">Backup completo</p>
        <p className="text-xs text-muted-foreground">
          Perfil, clientes, serviços, equipe, agendamentos, financeiro, estoque, fichas e bloqueios.
        </p>
        <Button
          size="sm"
          className="gradient-brand text-primary-foreground"
          disabled={busy !== null}
          onClick={() =>
            run("json", (d) =>
              downloadFile(
                `finbeauty-${base}-backup-${today()}.json`,
                buildBackupJSON(d),
                "application/json",
              ),
            )
          }
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
              disabled={busy !== null}
              onClick={() =>
                run(area, (d) =>
                  downloadFile(
                    `finbeauty-${base}-${area}-${today()}.csv`,
                    buildAreaCSV(area, d),
                    "text/csv",
                  ),
                )
              }
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
