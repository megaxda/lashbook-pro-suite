import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@finbeauty.com.br";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const requesterId = claimsData.claims.sub;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: prof } = await admin.from("profiles").select("role").eq("id", requesterId).maybeSingle();
    if (prof?.role !== "admin") {
      return json({ error: "Forbidden" }, 403);
    }

    const PushSchema = z.object({
      title: z.string().trim().min(1).max(120),
      body: z.string().trim().min(1).max(500),
      url: z.string().trim().max(500).optional().nullable(),
      target: z.enum(["all", "user"]).optional().nullable(),
      user_id: z.string().uuid().optional().nullable(),
    });
    const rawBody = await req.json().catch(() => null);
    const parsed = PushSchema.safeParse(rawBody);
    if (!parsed.success) {
      return json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, 400);
    }
    const { title, body: text, url, target, user_id } = parsed.data;

    let query = admin.from("push_subscriptions").select("id, endpoint, p256dh, auth, user_id");
    if (target === "user" && user_id) {
      query = query.eq("user_id", user_id);
    }
    const { data: subs, error: subsErr } = await query;
    if (subsErr) return json({ error: subsErr.message }, 500);


    const payload = JSON.stringify({ title, body: text, url: url || "/" });
    let sent = 0;
    let failed = 0;
    const toDelete: string[] = [];

    await Promise.all((subs || []).map(async (s: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (e: any) {
        failed++;
        if (e?.statusCode === 404 || e?.statusCode === 410) toDelete.push(s.id);
      }
    }));

    if (toDelete.length) {
      await admin.from("push_subscriptions").delete().in("id", toDelete);
    }

    return json({ sent, failed, total: subs?.length || 0 });
  } catch (e: any) {
    return json({ error: e.message || "Erro interno" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
