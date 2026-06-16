import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  nome: z.string().trim().min(2).max(100).optional().nullable(),
  telefone: z.string().trim().max(30).optional().nullable(),
  plano: z.enum(["basico", "premium", "pro"]).optional().nullable(),
  role: z.enum(["admin", "user"]).optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

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

    // Check requester is admin
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
    const { email, password, nome, telefone, plano, role } = parsed.data;

    const { data: created, error: cuErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: nome || "" },
    });
    if (cuErr) return json({ error: cuErr.message }, 400);

    const userId = created.user!.id;

    await admin
      .from("profiles")
      .update({
        nome: nome || null,
        telefone: telefone || null,
        plano: plano || "basico",
        role: role || "user",
      })
      .eq("id", userId);

    return json({ ok: true, user_id: userId, email });
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
