import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

function toHex(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function parseStripeSig(header: string) {
  const parts = header.split(",").map((p) => p.trim());
  const t = parts.find((p) => p.startsWith("t="))?.slice(2) ?? null;
  const v1 = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  return { t, v1 };
}

async function verifyStripeSignature(rawBody: string, sigHeader: string, webhookSecret: string) {
  const { t, v1 } = parseStripeSig(sigHeader);
  if (!t || v1.length === 0) return false;

  const signedPayload = `${t}.${rawBody}`;
  const enc = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(signedPayload));
  const expected = toHex(new Uint8Array(mac));

  return v1.some((s) => timingSafeEqual(s, expected));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PROJECT_URL");
    const serviceKey =
      Deno.env.get("SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!supabaseUrl || !serviceKey || !webhookSecret) {
      console.error("Missing env:", {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!serviceKey,
        hasWebhookSecret: !!webhookSecret,
      });
      return new Response("Missing env", { status: 500, headers: corsHeaders });
    }

    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new Response("Missing stripe-signature", { status: 400, headers: corsHeaders });
    }

    const rawBody = await req.text();

    const ok = await verifyStripeSignature(rawBody, sig, webhookSecret);
    if (!ok) {
      console.error("Bad signature");
      return new Response("Bad signature", { status: 400, headers: corsHeaders });
    }

    const event = JSON.parse(rawBody);

    console.log("Stripe event:", event?.type);

    if (event?.type === "checkout.session.completed") {
      const session = event?.data?.object ?? {};
      const meta = (session.metadata ?? {}) as Record<string, string>;

      const boostId = meta.boost_id;
      const userId = meta.user_id;
      const postId = meta.post_id;

      console.log("metadata:", meta);

      if (!boostId || !userId || !postId) {
        console.error("Missing metadata fields", { boostId, userId, postId });
        return new Response("Missing metadata (boost_id/user_id/post_id)", {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (!isUuid(boostId) || !isUuid(userId) || !isUuid(postId)) {
        console.error("Invalid UUID in metadata", { boostId, userId, postId });
        return new Response("Invalid UUID metadata", { status: 400, headers: corsHeaders });
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      const payload = {
        id: boostId,
        user_id: userId,
        post_id: postId,
        status: "paid",
        amount_total: session.amount_total ?? null,
        currency: session.currency ?? null,
        stripe_checkout_session_id: session.id ?? null,
        stripe_payment_intent_id: paymentIntentId,
      };

      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
      });

      const { error } = await supabase.from("boosts").upsert(payload, { onConflict: "id" });

      if (error) {
        console.error("DB upsert error:", error);
        return new Response("DB error", { status: 500, headers: corsHeaders });
      }

      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    return new Response("ignored", { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error("Webhook handler crashed:", e);
    return new Response("Server error", { status: 500, headers: corsHeaders });
  }
});
