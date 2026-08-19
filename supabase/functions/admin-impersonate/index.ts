import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  userId: z.string().uuid(),
  redirectTo: z.string().url().max(500).optional(),
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
    const { data: userData, error: uErr } = await userClient.auth.getUser(token);
    if (uErr || !userData?.user?.id) return json({ error: "Unauthorized" }, 401);
    const adminId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: requester } = await admin
      .from("profiles")
      .select("role")
      .eq("id", adminId)
      .maybeSingle();
    if (requester?.role !== "admin") return json({ error: "Forbidden" }, 403);

    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Dados inválidos" }, 400);
    const { userId, redirectTo } = parsed.data;

    if (userId === adminId) return json({ error: "Você já está nesta conta" }, 400);

    const { data: target } = await admin
      .from("profiles")
      .select("id, email, nome, role")
      .eq("id", userId)
      .maybeSingle();

    if (!target?.email) return json({ error: "Usuário não encontrado" }, 404);
    if (target.role === "admin") return json({ error: "Não é possível auditar outro administrador" }, 403);

    const { data: link, error: lErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: target.email,
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (lErr) return json({ error: lErr.message }, 400);

    const actionLink = (link as any)?.properties?.action_link;
    if (!actionLink) return json({ error: "Não foi possível gerar o acesso" }, 500);

    await admin.from("admin_audit_log").insert({
      admin_id: adminId,
      target_user_id: userId,
      action: "impersonate",
    });

    return json({
      ok: true,
      action_link: actionLink,
      target: { id: target.id, nome: target.nome, email: target.email },
    });
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
