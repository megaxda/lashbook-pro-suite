import { z } from "zod";

// Reusable primitives
const trimmedName = z
  .string()
  .trim()
  .min(2, "Nome muito curto")
  .max(100, "Nome muito longo (máx 100)");

const emailSchema = z
  .string()
  .trim()
  .email("Email inválido")
  .max(255, "Email muito longo");

const optionalEmail = z
  .string()
  .trim()
  .max(255, "Email muito longo")
  .email("Email inválido")
  .optional()
  .or(z.literal(""));

// Brazilian phone: digits, spaces, parens, dashes, +; 8–20 chars
const phoneSchema = z
  .string()
  .trim()
  .min(8, "Telefone muito curto")
  .max(30, "Telefone muito longo")
  .regex(/^[0-9 ()+\-]+$/, "Telefone inválido");

const passwordSchema = z
  .string()
  .min(6, "Senha precisa ter no mínimo 6 caracteres")
  .max(72, "Senha muito longa");

// ---- Auth schemas ----
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha").max(72),
});

export const signUpSchema = z.object({
  nome: trimmedName,
  email: emailSchema,
  password: passwordSchema,
});

// ---- Public booking (LinkBioPage) ----
export const publicBookingSchema = z.object({
  name: trimmedName,
  phone: phoneSchema,
  email: optionalEmail,
  notes: z.string().trim().max(500, "Observações até 500 caracteres").optional().or(z.literal("")),
});

// File validation for booking receipt (PIX comprovante)
export const MAX_RECEIPT_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

export function validateReceiptFile(file: File | null): { ok: true } | { ok: false; error: string } {
  if (!file) return { ok: true };
  if (file.size > MAX_RECEIPT_SIZE) return { ok: false, error: "Arquivo muito grande (máx 5 MB)" };
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    return { ok: false, error: "Formato não suportado (use JPG, PNG, WEBP ou PDF)" };
  }
  return { ok: true };
}

// ---- Cliente ----
export const clienteSchema = z.object({
  nome: trimmedName,
  telefone: phoneSchema.optional().or(z.literal("")),
  email: optionalEmail,
  observacoes: z.string().trim().max(1000).optional().or(z.literal("")),
});

// ---- Financeiro ----
export const financeiroSchema = z.object({
  descricao: z.string().trim().min(1, "Descrição obrigatória").max(200),
  valor: z.coerce.number().positive("Valor deve ser positivo").max(10_000_000, "Valor muito alto"),
  categoria: z.string().trim().max(80).optional().or(z.literal("")),
  tipo: z.enum(["receita", "despesa"]),
});

// ---- Helpers ----
export function firstError<T>(result: z.SafeParseError<T>): string {
  const issues = result.error.issues;
  return issues[0]?.message || "Dados inválidos";
}
