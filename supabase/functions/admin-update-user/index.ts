import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UpdatesSchema = z.object({
  nome: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().max(255).optional(),
  telefone: z.string().trim().max(30).optional().nullable(),
  plano: z.enum(["basico", "premium", "pro", "enterprise"]).optional(),
  status_conta: z.enum(["ativo", "pausado", "bloqueado"]).optional(),
  access_expires_at: z.string().datetime().nullable().optional(),
}).strict();

const BodySchema = z.object({
  userId: z.string().uuid(),
  updates: UpdatesSchema,
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await userClient.auth.getClaims(token);
    if (cErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: prof } = await admin
      .from("profiles")
      .select("role")
      .eq("id", claims.claims.sub)
      .maybeSingle();

    if (prof?.role !== "admin") return json({ error: "Forbidden" }, 403);

    const rawBody = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, 400);
    }
    const { userId, updates } = parsed.data;

    if (Object.keys(updates).length === 0) {
      return json({ error: "Nenhum campo para atualizar" }, 400);
    }

    const { data: updated, error: updErr } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .maybeSingle();

    if (updErr) return json({ error: updErr.message }, 400);
    if (!updated) return json({ error: "Usuário não encontrado" }, 404);

    return json({ ok: true, user: updated });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
