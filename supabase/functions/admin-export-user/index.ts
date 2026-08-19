import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({ userId: z.string().uuid() });

const TABLES = [
  "clientes",
  "servicos",
  "profissionais",
  "agendamentos",
  "financeiro",
  "financeiro_pessoal",
  "estoque",
  "fichas",
  "bloqueios_agenda",
] as const;

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
    const { data: userData, error: uErr } = await userClient.auth.getUser(token);
    if (uErr || !userData?.user?.id) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: requester } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (requester?.role !== "admin") return json({ error: "Forbidden" }, 403);

    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Dados inválidos" }, 400);
    const { userId } = parsed.data;

    const { data: perfil, error: pErr } = await admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (pErr) return json({ error: pErr.message }, 400);
    if (!perfil) return json({ error: "Usuário não encontrado" }, 404);

    const results = await Promise.all(
      TABLES.map(async (t) => {
        const { data, error } = await admin.from(t).select("*").eq("user_id", userId);
        if (error) throw new Error(`${t}: ${error.message}`);
        return [t, data ?? []] as const;
      }),
    );

    const dados: Record<string, unknown> = { perfil };
    for (const [t, rows] of results) dados[t] = rows;

    return json({ ok: true, data: dados });
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
