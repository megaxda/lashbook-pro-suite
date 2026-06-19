// Daily cleanup: deletes comprovantes older than 90 days
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require shared secret to prevent unauthenticated destructive calls
  const expected = Deno.env.get("CLEANUP_SECRET");
  const provided = req.headers.get("x-cleanup-secret");
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  let totalDeleted = 0;
  const errors: string[] = [];

  // List top-level folders (slugs)
  const { data: folders, error: fErr } = await supabase.storage.from("comprovantes").list("", { limit: 1000 });
  if (fErr) {
    return new Response(JSON.stringify({ error: fErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  for (const folder of folders || []) {
    if (!folder.name) continue;
    const { data: files } = await supabase.storage.from("comprovantes").list(folder.name, { limit: 1000 });
    if (!files) continue;
    const oldPaths = files
      .filter((f) => f.created_at && f.created_at < cutoff)
      .map((f) => `${folder.name}/${f.name}`);
    if (oldPaths.length === 0) continue;
    const { error: dErr } = await supabase.storage.from("comprovantes").remove(oldPaths);
    if (dErr) errors.push(dErr.message);
    else totalDeleted += oldPaths.length;
  }

  return new Response(JSON.stringify({ deleted: totalDeleted, errors }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
