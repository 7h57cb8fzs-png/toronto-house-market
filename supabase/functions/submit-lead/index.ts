import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://toronto-house-market.7h57cb8fzs.workers.dev",
  "https://torontohousemarket.com",
  "https://www.torontohousemarket.com",
]);

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function corsHeaders(origin: string | null) {
  const allowedOrigin = origin && allowedOrigins.has(origin)
    ? origin
    : "https://toronto-house-market.7h57cb8fzs.workers.dev";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    if (origin && !allowedOrigins.has(origin)) return json({ error: "Origin not allowed" }, 403, origin);
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (origin && !allowedOrigins.has(origin)) return json({ error: "Origin not allowed" }, 403, origin);

  const auth = req.headers.get("authorization") || "";
  const apiKey = req.headers.get("apikey") || "";
  if (auth !== `Bearer ${anonKey}` || apiKey !== anonKey) {
    return json({ error: "Unauthorized" }, 401, origin);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400, origin);
  }

  if (typeof payload.website === "string" && payload.website.trim() !== "") {
    return json({ ok: true }, 200, origin);
  }

  const propertyInput = typeof payload.property_input === "string" ? payload.property_input.trim() : "";
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const mobile = typeof payload.mobile === "string" ? payload.mobile.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const conversionIntent = typeof payload.conversion_intent === "string" ? payload.conversion_intent : "";

  if (!propertyInput || propertyInput.length > 1000) return json({ error: "Property is required" }, 400, origin);
  if (!name || name.length > 160) return json({ error: "Name is required" }, 400, origin);
  if (!mobile || mobile.length > 50) return json({ error: "Mobile number is required" }, 400, origin);
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return json({ error: "Email is invalid" }, 400, origin);
  }
  if (!new Set(["showing_request", "full_brief"]).has(conversionIntent)) {
    return json({ error: "Invalid conversion intent" }, 400, origin);
  }

  const { data: analysis, error: analysisError } = await admin
    .from("analysis_sessions")
    .insert({ property_input: propertyInput, status: "submitted" })
    .select("id")
    .single();

  if (analysisError || !analysis) {
    console.error("analysis insert failed", analysisError);
    return json({ error: "Unable to save request" }, 500, origin);
  }

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .insert({
      analysis_session_id: analysis.id,
      name,
      mobile,
      email: email || null,
      conversion_intent: conversionIntent,
      status: "new",
      source: "website",
      utm: {
        page_url: typeof payload.page_url === "string" ? payload.page_url.slice(0, 1000) : null,
        referrer: typeof payload.referrer === "string" ? payload.referrer.slice(0, 1000) : null,
      },
    })
    .select("id")
    .single();

  if (leadError || !lead) {
    console.error("lead insert failed", leadError);
    await admin.from("analysis_sessions").delete().eq("id", analysis.id);
    return json({ error: "Unable to save request" }, 500, origin);
  }

  await admin.from("lead_events").insert({
    lead_id: lead.id,
    event_type: "lead_captured",
    actor_type: "system",
    payload: { conversion_intent: conversionIntent },
  });

  return json({ ok: true, lead_id: lead.id }, 201, origin);
});
