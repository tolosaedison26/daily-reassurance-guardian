

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function uint8ToBase64Url(bytes: Uint8Array): Promise<string> {
  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlToUint8(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function signJWT(payload: object, privateKeyBytes: Uint8Array): Promise<string> {
  const header = await uint8ToBase64Url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = await uint8ToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const sigInput = `${header}.${body}`;

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(sigInput),
  );

  return `${sigInput}.${await uint8ToBase64Url(new Uint8Array(sig))}`;
}

async function sendWebPush(
  endpoint: string,
  p256dh: string,
  authSecret: string,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string,
): Promise<Response> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const now = Math.floor(Date.now() / 1000);

  const privateKeyBytes = base64UrlToUint8(vapidPrivateKey);

  const jwt = await signJWT(
    { aud: audience, exp: now + 43200, sub: vapidSubject },
    privateKeyBytes,
  );

  // Encrypt the payload using ECDH + AES-GCM (simplified - send as plaintext for now with VAPID auth only)
  // For production, proper content encryption (RFC 8291) would be needed
  const bodyBytes = new TextEncoder().encode(payload);

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
      'Content-Type': 'application/json',
      'TTL': '86400',
    },
    body: bodyBytes,
  });
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
      const { data: connections } = await supabase
        .from('senior_connections')
        .select('caregiver_id')
        .eq('senior_id', senior.senior_id)
        .eq('status', 'active');

      if (!connections?.length) continue;

      for (const conn of connections) {
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('caregiver_id', conn.caregiver_id);

        if (!subs?.length) continue;

        for (const sub of subs) {
          try {
            const notifPayload = JSON.stringify({
              title: '⚠️ Check-in Missed',
              body: `${senior.full_name} hasn't checked in yet today. Please check on them.`,
              tag: `missed-${senior.senior_id}`,
            });

            const resp = await sendWebPush(
              sub.endpoint,
              sub.p256dh,
              sub.auth,
              notifPayload,
              vapidPublicKey,
              vapidPrivateKey,
              vapidSubject,
            );

            if (resp.ok || resp.status === 201) sent++;
            else console.error('Push failed:', resp.status, await resp.text());
          } catch (err) {
            console.error('Push error:', err);
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
