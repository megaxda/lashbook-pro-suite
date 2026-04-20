/**
 * Date utilities — sempre usam horário LOCAL do navegador.
 * NUNCA usar `toISOString().slice(0, 10)` para datas de calendário,
 * porque o método converte para UTC e em UTC-3 (Brasil) após 21h
 * o dia retornado é o seguinte, quebrando comparações com `data` (date) do Postgres.
 */

export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return localDateStr(new Date());
}

export function monthBounds(d: Date = new Date()): { start: string; end: string } {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: localDateStr(start), end: localDateStr(end) };
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function getLast7Days(): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) out.push(localDateStr(addDays(today, -i)));
  return out;
}

export function parseDateStr(s: string): Date {
  // s = "YYYY-MM-DD" → cria como local meio-dia para evitar timezone slip
  return new Date(s + "T12:00:00");
}

export function formatBR(s: string): string {
  return parseDateStr(s).toLocaleDateString("pt-BR");
}
