import { useMemo } from "react";
import { Ban, Plus, Check, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { localDateStr, parseDateStr } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface AgendaAppt {
  id: string;
  data: string;
  horario: string;
  status: string | null;
  forma_pagamento?: string | null;
  gratuito?: boolean | null;
  duracao_min?: number | null;
  clientes?: { nome: string } | null;
  servicos?: { nome: string; preco?: number | null; duracao?: number | null } | null;
}
export interface AgendaBloqueio {
  id: string;
  data: string;
  dia_todo: boolean;
  hora_inicio: string | null;
  hora_fim: string | null;
  motivo: string | null;
}

export type AgendaView = "Diário" | "Semanal" | "Mensal";

interface Props {
  view: AgendaView;
  cursor: Date;
  appointments: AgendaAppt[];
  bloqueios: AgendaBloqueio[];
  onSelectAppt: (a: AgendaAppt) => void;
  onSelectDay: (date: Date) => void;
  onNewAtDate: (ds: string) => void;
  onSelectBloqueio?: (b: AgendaBloqueio) => void;
}

const WEEK_LABELS_LONG = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const WEEK_LABELS_SHORT = ["S", "T", "Q", "Q", "S", "S", "D"];

function getWeekDates(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return x;
  });
}
function getDaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (Date | null)[] = [];
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  return days;
}
const toMin = (h: string) => {
  const [hh, mm] = (h || "00:00").split(":").map(Number);
  return hh * 60 + (mm || 0);
};
const fmtMin = (m: number) =>
  `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function statusToken(status: string | null | undefined): {
  cssVar: string;
  label: string;
} {
  switch (status) {
    case "confirmado":
      return { cssVar: "--status-confirmed", label: "Confirmado" };
    case "pendente":
      return { cssVar: "--status-pending", label: "Pendente" };
    case "em_atendimento":
      return { cssVar: "--status-inprogress", label: "Em atendimento" };
    case "concluido":
      return { cssVar: "--status-done", label: "Concluído" };
    case "cancelado":
      return { cssVar: "--status-canceled", label: "Cancelado" };
    case "no_show":
      return { cssVar: "--status-canceled", label: "Não veio" };
    case "procedimento_a_confirmar":
      return { cssVar: "--status-confirmar", label: "Proc. a confirmar" };
    default:
      return { cssVar: "--status-pending", label: status || "pendente" };
  }
}

/** Compute dynamic [startHour, endHour] window covering all activity for given dates. Defaults 7-22, expands to fit. */
function computeHourRange(
  appts: AgendaAppt[],
  bloqs: AgendaBloqueio[],
  dates: string[]
): { startHour: number; endHour: number } {
  let minM = 7 * 60;
  let maxM = 22 * 60;
  const setOfDates = new Set(dates);
  appts.forEach((a) => {
    if (!setOfDates.has(a.data)) return;
    const s = toMin((a.horario || "").slice(0, 5));
    const dur = a.servicos?.duracao || 60;
    if (s < minM) minM = s;
    if (s + dur > maxM) maxM = s + dur;
  });
  bloqs.forEach((b) => {
    if (!setOfDates.has(b.data) || b.dia_todo) return;
    if (!b.hora_inicio || !b.hora_fim) return;
    const s = toMin(b.hora_inicio.slice(0, 5));
    const e = toMin(b.hora_fim.slice(0, 5));
    if (s < minM) minM = s;
    if (e > maxM) maxM = e;
  });
  const startHour = Math.max(0, Math.min(7, Math.floor(minM / 60)));
  const endHour = Math.min(24, Math.max(22, Math.ceil(maxM / 60)));
  return { startHour, endHour };
}

function ApptCard({
  a,
  onClick,
  compact = false,
  height,
}: {
  a: AgendaAppt;
  onClick: () => void;
  compact?: boolean;
  height?: number;
}) {
  const tok = statusToken(a.status);
  const color = `hsl(var(${tok.cssVar}))`;
  const isDone = a.status === "concluido";
  const isCanceled = a.status === "cancelado" || a.status === "no_show";
  const startMin = toMin(a.horario);
  const dur = a.servicos?.duracao || 60;
  const endStr = fmtMin(startMin + dur);
  const cliente = a.clientes?.nome || "Sem cliente";
  const serv = a.servicos?.nome || "";
  const showService = height === undefined || height >= 40;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "w-full h-full text-left rounded px-1.5 py-1 overflow-hidden hover:opacity-90 transition leading-tight",
        isCanceled && "line-through opacity-60"
      )}
      style={{
        background: isDone ? color : `${color}66`,
        borderLeft: `4px solid ${color}`,
        color: isDone ? "hsl(var(--status-done-foreground, 0 0% 100%))" : "hsl(var(--foreground))",
      }}
      title={`${a.horario?.slice(0, 5)}–${endStr} · ${cliente}${serv ? ` · ${serv}` : ""}${
        a.forma_pagamento ? ` · ${a.forma_pagamento}` : ""
      }`}
    >
      <div className="flex items-center gap-1">
        {isDone && <Check className="w-2.5 h-2.5 shrink-0" style={{ color: "white" }} />}
        <p
          className={cn("text-[11px] font-semibold truncate flex-1", isDone && "text-white")}
        >
          {cliente}
        </p>
      </div>
      <p
        className={cn(
          "text-[10px] truncate",
          isDone ? "text-white/90" : "text-muted-foreground"
        )}
      >
        {a.horario?.slice(0, 5)}–{endStr}
      </p>
      {showService && serv && (
        <p
          className={cn(
            "text-[10px] truncate italic",
            isDone ? "text-white/85" : "text-foreground/70"
          )}
        >
          {serv}
        </p>
      )}
      {isDone && a.forma_pagamento && (
        <div className="flex items-center gap-0.5 mt-0.5">
          <CreditCard className="w-2.5 h-2.5 text-white/90" />
          <span className="text-[9px] text-white/90 truncate">{a.forma_pagamento}</span>
        </div>
      )}
      {a.gratuito && (
        <span className="text-[8px] font-semibold rounded px-1 mt-0.5 inline-block bg-emerald-500/80 text-white">
          Cortesia
        </span>
      )}
    </button>
  );
}

function BlockBar({
  b,
  onClick,
  variant = "bar",
}: {
  b: AgendaBloqueio;
  onClick?: () => void;
  variant?: "bar" | "chip";
}) {
  const label = b.motivo || (b.dia_todo ? "Bloqueado" : "Indisponível");
  const time = b.dia_todo ? "Dia inteiro" : `${b.hora_inicio?.slice(0, 5)}–${b.hora_fim?.slice(0, 5)}`;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "w-full text-left rounded px-1.5 py-1 overflow-hidden hover:opacity-90 transition leading-tight",
        variant === "chip" && "text-[9px]"
      )}
      style={{
        background: "hsl(var(--block) / 0.18)",
        borderLeft: "3px solid hsl(var(--block))",
        color: "hsl(var(--foreground))",
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent 0 6px, hsl(var(--block) / 0.12) 6px 12px)",
      }}
      title={`${label} · ${time}`}
    >
      <div className="flex items-center gap-1">
        <Ban className="w-2.5 h-2.5 shrink-0" style={{ color: "hsl(var(--block))" }} />
        <span className="text-[10px] font-semibold truncate flex-1" style={{ color: "hsl(var(--block))" }}>
          {label}
        </span>
      </div>
      <p className="text-[9px] truncate" style={{ color: "hsl(var(--block) / 0.85)" }}>
        {time}
      </p>
    </button>
  );
}

export default function AgendaGrid(props: Props) {
  const { view, cursor, appointments, bloqueios, onSelectAppt, onSelectDay, onNewAtDate, onSelectBloqueio } = props;
  const todayStr = localDateStr();

  if (view === "Diário") {
    const ds = localDateStr(cursor);
    const dayBloqs = bloqueios.filter((b) => b.data === ds);
    const dayAppts = appointments
      .filter((a) => a.data === ds)
      .sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));
    return (
      <div className="space-y-1.5">
        {dayBloqs.map((b) => (
          <BlockBar key={b.id} b={b} onClick={onSelectBloqueio ? () => onSelectBloqueio(b) : undefined} />
        ))}
        {dayAppts.length === 0 && dayBloqs.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm mb-3">Nenhum agendamento neste dia.</p>
            <Button
              size="sm"
              className="gradient-brand text-primary-foreground text-xs h-9"
              onClick={() => onNewAtDate(ds)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Novo agendamento
            </Button>
          </div>
        ) : (
          dayAppts.map((a) => <ApptCard key={a.id} a={a} onClick={() => onSelectAppt(a)} />)
        )}
      </div>
    );
  }

  if (view === "Semanal") {
    const weekDates = getWeekDates(cursor);
    const dateStrs = weekDates.map((d) => localDateStr(d));
    return <WeeklyGrid {...props} weekDates={weekDates} dateStrs={dateStrs} todayStr={todayStr} />;
  }

  // Mensal
  const monthDays = getDaysInMonth(cursor);
  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEK_LABELS_SHORT.map((d, i) => (
        <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">
          {d}
        </div>
      ))}
      {monthDays.map((date, i) => {
        if (!date) return <div key={i} className="min-h-[96px] rounded-md bg-secondary/20" />;
        const ds = localDateStr(date);
        const appts = appointments
          .filter((a) => a.data === ds)
          .sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));
        const dayBloqs = bloqueios.filter((b) => b.data === ds);
        const isToday = ds === todayStr;
        const maxVisible = 2;
        const totalItems = dayBloqs.length + appts.length;
        const extra = totalItems - maxVisible;
        return (
          <button
            key={i}
            onClick={() => onSelectDay(date)}
            className={cn(
              "min-h-[96px] max-h-[120px] rounded-md border border-border p-1 text-left transition-colors flex flex-col relative overflow-hidden",
              isToday ? "border-primary/50 bg-primary/5" : "hover:bg-secondary/50"
            )}
          >
            <span
              className={cn(
                "text-[11px] font-semibold mb-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full self-start shrink-0",
                isToday ? "bg-primary text-primary-foreground" : "text-foreground"
              )}
            >
              {date.getDate()}
            </span>
            <div className="flex-1 flex flex-col gap-0.5 overflow-hidden min-h-0 w-full">
              {dayBloqs.slice(0, maxVisible).map((b) => (
                <div key={b.id} className="w-full overflow-hidden">
                  <div
                    className="w-full rounded px-1 py-0.5 text-[9px] font-semibold truncate"
                    style={{
                      background: "hsl(var(--block) / 0.25)",
                      borderLeft: "2px solid hsl(var(--block))",
                      color: "hsl(var(--block))",
                    }}
                  >
                    {b.dia_todo ? "Dia inteiro" : `${b.hora_inicio?.slice(0,5)} ${b.motivo || "Bloq."}`}
                  </div>
                </div>
              ))}
              {appts.slice(0, Math.max(0, maxVisible - dayBloqs.slice(0, maxVisible).length)).map((a) => {
                const tok = statusToken(a.status);
                const color = `hsl(var(${tok.cssVar}))`;
                const isDone = a.status === "concluido";
                return (
                  <div
                    key={a.id}
                    onClick={(e) => { e.stopPropagation(); onSelectAppt(a); }}
                    className="w-full rounded px-1 py-0.5 text-[9px] truncate cursor-pointer hover:opacity-90"
                    style={{
                      background: isDone ? color : `${color}55`,
                      borderLeft: `2px solid ${color}`,
                      color: isDone ? "white" : "hsl(var(--foreground))",
                    }}
                    title={`${a.horario?.slice(0,5)} · ${a.clientes?.nome || ""}`}
                  >
                    <span className="font-semibold">{a.horario?.slice(0, 5)}</span>{" "}
                    <span className="opacity-90">{a.clientes?.nome || "—"}</span>
                  </div>
                );
              })}
              {extra > 0 && (
                <p className="text-[9px] text-muted-foreground px-1 shrink-0">+{extra} mais</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function WeeklyGrid({
  appointments,
  bloqueios,
  weekDates,
  dateStrs,
  todayStr,
  onSelectAppt,
  onSelectDay,
  onSelectBloqueio,
}: Props & { weekDates: Date[]; dateStrs: string[]; todayStr: string }) {
  const { startHour, endHour } = useMemo(
    () => computeHourRange(appointments, bloqueios, dateStrs),
    [appointments, bloqueios, dateStrs]
  );
  const hourHeight = 56;
  const hoursCount = endHour - startHour;
  const totalHeight = hoursCount * hourHeight;
  const hours = Array.from({ length: hoursCount }, (_, i) => startHour + i);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[680px]">
        {/* Header */}
        <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))] border-b border-border">
          <div />
          {weekDates.map((date, i) => {
            const isToday = localDateStr(date) === todayStr;
            return (
              <div key={i} className="text-center py-2 border-l border-border">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                  {WEEK_LABELS_LONG[i]}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full",
                    isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                  )}
                >
                  {date.getDate()}
                </p>
              </div>
            );
          })}
        </div>
        {/* Body */}
        <div
          className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))]"
          style={{ height: totalHeight }}
        >
          {/* Hours column - labels rendered at TOP of each slot (aligned with horizontal grid line) */}
          <div className="relative" style={{ height: totalHeight }}>
            {hours.map((h, idx) => (
              <div
                key={h}
                className="absolute right-1 left-0 text-[10px] text-muted-foreground leading-none text-right pr-1"
                style={{ top: idx * hourHeight + 2, height: hourHeight }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {/* Day columns */}
          {weekDates.map((date, di) => {
            const ds = localDateStr(date);
            const dayAppts = appointments.filter((a) => a.data === ds);
            const dayBloqs = bloqueios.filter((b) => b.data === ds);
            return (
              <div
                key={di}
                onClick={() => onSelectDay(date)}
                className="relative border-l border-border cursor-pointer hover:bg-secondary/20"
                style={{ height: totalHeight }}
              >
                {/* hour gridlines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{ height: hourHeight }}
                    className="border-b border-border/50"
                  />
                ))}
                {/* Blocks */}
                {dayBloqs.map((b) => {
                  const label = b.motivo || "Bloqueado";
                  if (b.dia_todo) {
                    return (
                      <div
                        key={b.id}
                        className="absolute inset-0 flex items-start justify-center pt-1 pointer-events-none"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(45deg, transparent 0 6px, hsl(var(--block) / 0.22) 6px 12px)",
                        }}
                        title={label}
                      >
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: "hsl(var(--block))", color: "white" }}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  }
                  if (!b.hora_inicio || !b.hora_fim) return null;
                  const si = toMin(b.hora_inicio.slice(0, 5));
                  const sf = toMin(b.hora_fim.slice(0, 5));
                  const top = ((si - startHour * 60) / 60) * hourHeight;
                  const height = Math.max(18, ((sf - si) / 60) * hourHeight);
                  return (
                    <div
                      key={b.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBloqueio?.(b);
                      }}
                      className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 overflow-hidden cursor-pointer"
                      style={{
                        top,
                        height,
                        background: "hsl(var(--block) / 0.18)",
                        borderLeft: "3px solid hsl(var(--block))",
                        backgroundImage:
                          "repeating-linear-gradient(45deg, transparent 0 6px, hsl(var(--block) / 0.12) 6px 12px)",
                      }}
                      title={`${label} · ${b.hora_inicio.slice(0, 5)}–${b.hora_fim.slice(0, 5)}`}
                    >
                      <div className="flex items-center gap-1">
                        <Ban className="w-2.5 h-2.5 shrink-0" style={{ color: "hsl(var(--block))" }} />
                        <span
                          className="text-[10px] font-semibold truncate"
                          style={{ color: "hsl(var(--block))" }}
                        >
                          {label}
                        </span>
                      </div>
                      <p className="text-[9px]" style={{ color: "hsl(var(--block) / 0.85)" }}>
                        {b.hora_inicio.slice(0, 5)}–{b.hora_fim.slice(0, 5)}
                      </p>
                    </div>
                  );
                })}
                {/* Appointments with collision detection: lay out overlapping items side-by-side */}
                {(() => {
                  const sorted = [...dayAppts].sort(
                    (x, y) => (x.horario || "").localeCompare(y.horario || "")
                  );
                  type Laid = { a: AgendaAppt; top: number; height: number; col: number; cols: number };
                  const laid: Laid[] = [];
                  // Group overlapping appointments into clusters
                  const clusters: AgendaAppt[][] = [];
                  for (const a of sorted) {
                    const s = toMin(a.horario);
                    const e = s + (a.servicos?.duracao || 60);
                    const last = clusters[clusters.length - 1];
                    if (last) {
                      const overlapsLast = last.some((x) => {
                        const xs = toMin(x.horario);
                        const xe = xs + (x.servicos?.duracao || 60);
                        return s < xe && e > xs;
                      });
                      if (overlapsLast) { last.push(a); continue; }
                    }
                    clusters.push([a]);
                  }
                  for (const cluster of clusters) {
                    // Greedy column assignment
                    const cols: { end: number }[] = [];
                    const assigned: { a: AgendaAppt; col: number }[] = [];
                    for (const a of cluster) {
                      const s = toMin(a.horario);
                      const e = s + (a.servicos?.duracao || 60);
                      let placed = -1;
                      for (let i = 0; i < cols.length; i++) {
                        if (cols[i].end <= s) { cols[i] = { end: e }; placed = i; break; }
                      }
                      if (placed === -1) { cols.push({ end: e }); placed = cols.length - 1; }
                      assigned.push({ a, col: placed });
                    }
                    const total = cols.length;
                    for (const { a, col } of assigned) {
                      const startMin = toMin(a.horario);
                      const dur = a.servicos?.duracao || 60;
                      const top = ((startMin - startHour * 60) / 60) * hourHeight;
                      const height = Math.max(22, (dur / 60) * hourHeight - 2);
                      laid.push({ a, top, height, col, cols: total });
                    }
                  }
                  return laid.map(({ a, top, height, col, cols }) => {
                    if (top + height < 0 || top > totalHeight) return null;
                    const widthPct = 100 / cols;
                    const leftPct = col * widthPct;
                    return (
                      <div
                        key={a.id}
                        className="absolute z-10"
                        style={{
                          top,
                          height,
                          left: `calc(${leftPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                        }}
                      >
                        <ApptCard a={a} onClick={() => onSelectAppt(a)} height={height} />
                      </div>
                    );
                  });
                })()}

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Compact legend used above the grid */
export function StatusLegend() {
  const items = [
    { label: "Confirmado", v: "--status-confirmed" },
    { label: "Pendente", v: "--status-pending" },
    { label: "Em atend.", v: "--status-inprogress" },
    { label: "Concluído", v: "--status-done" },
    { label: "Cancelado", v: "--status-canceled" },
    { label: "A confirmar", v: "--status-confirmar" },
    { label: "Bloqueio", v: "--block" },
  ];
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      {items.map((l) => (
        <div key={l.label} className="flex items-center gap-1">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: `hsl(var(${l.v}))` }}
          />
          {l.label}
        </div>
      ))}
    </div>
  );
}

/** Small status badge for list rows */
export function StatusBadge({ status, gratuito }: { status: string | null; gratuito?: boolean | null }) {
  const tok = statusToken(status);
  return (
    <Badge
      className="border-0 text-[10px] px-1.5 py-0"
      style={{ background: `hsl(var(${tok.cssVar}) / 0.18)`, color: `hsl(var(${tok.cssVar}))` }}
    >
      {tok.label}{gratuito ? " · Cortesia" : ""}
    </Badge>
  );
}
