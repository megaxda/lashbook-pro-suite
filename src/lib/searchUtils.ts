/**
 * Utilitários compartilhados de busca/ordenação de strings em pt-BR.
 * - Remove acentos
 * - Case insensitive
 * - Match multi-token (cada palavra do termo deve aparecer em qualquer lugar)
 */

export function normalize(s: string | null | undefined): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function tokens(q: string): string[] {
  return normalize(q).split(/\s+/).filter(Boolean);
}

/** Retorna true se todos os tokens de `q` aparecem em algum dos `fields`. */
export function matchAllTokens(q: string, fields: Array<string | null | undefined>): boolean {
  const ts = tokens(q);
  if (ts.length === 0) return true;
  const haystack = fields.map(normalize).join(" ");
  return ts.every(t => haystack.includes(t));
}

export function sortByName<T extends { nome: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
}
