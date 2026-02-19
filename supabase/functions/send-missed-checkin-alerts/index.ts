import Deno from "https://deno.land/x/deno@v2.1.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Web Push implementation using VAPID
async function generateVapidAuthHeaders(
  audience: string,
  subject: string,
  publicKey: string,
  privateKeyBase64: string,
): Promise<{ Authorization: string; 'Crypto-Key': string }> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 12 * 3600;

  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payload = btoa(JSON.stringify({ aud: audience, exp: expiry, sub: subject })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signingInput = `${header}.${payload}`;

  // Import VAPID private key
  const rawKey = Uint8Array.from(atob(privateKeyBase64.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    rawKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const signatureBytes = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${signingInput}.${signature}`;

  return {
    Authorization: `vapid t=${jwt}, k=${publicKey}`,
    'Crypto-Key': `p256ecdh=${publicKey}`,
  };
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string,
): Promise<boolean> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const vapidHeaders = await generateVapidAuthHeaders(audience, vapidSubject, vapidPublicKey, vapidPrivateKey);

  const body = JSON.stringify(payload);

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      ...vapidHeaders,
      'Content-Type': 'application/json',
      'TTL': '86400',
    },
    body,
  });

  return response.ok || response.status === 201;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const vapidSubject = Deno.env.get('VAPID_SUBJECT')!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find seniors who have missed their check-in window
    // A senior has missed if: now > reminder_time + grace_period_hours AND no check-in today
    const { data: missedSeniors, error: seniorError } = await supabase.rpc('get_missed_checkin_seniors');

    if (seniorError) {
      console.error('Error fetching missed seniors:', seniorError);
      return new Response(JSON.stringify({ error: seniorError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!missedSeniors || missedSeniors.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No missed check-ins' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;

    for (const senior of missedSeniors) {
      // Get all caregivers connected to this senior
      const { data: connections } = await supabase
        .from('senior_connections')
        .select('caregiver_id')
        .eq('senior_id', senior.senior_id)
        .eq('status', 'active');

      if (!connections?.length) continue;

      for (const conn of connections) {
        // Get their push subscriptions
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('caregiver_id', conn.caregiver_id);

        if (!subs?.length) continue;

        for (const sub of subs) {
          try {
            const ok = await sendPushNotification(
              sub,
              {
                title: '⚠️ Check-in Missed',
                body: `${senior.full_name} hasn't checked in yet today. Please check on them.`,
                tag: `missed-${senior.senior_id}`,
                url: '/',
              },
              vapidPublicKey,
              vapidPrivateKey,
              vapidSubject,
            );
            if (ok) sent++;
          } catch (err) {
            console.error('Push send error:', err);
          }
        }
      }
    }

    return new Response(JSON.stringify({ sent, missedCount: missedSeniors.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Function error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
