const ALLOWED_HOSTS = new Set([
  'alia.aqar1.com',
  'aqar1-alia-al-khalidiya.pages.dev',
  'cro-google-ads-v1.aqar1-alia-al-khalidiya.pages.dev'
]);

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

const scalar = (v, max = 500) => String(v ?? '').trim().slice(0, max);
const normalizeDigits = (phoneText) => phoneText
  .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
  .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
const normalizePhone = (phoneText) => {
  const westernPhone = normalizeDigits(phoneText).replace(/[()\s.-]/g, '');
  return westernPhone.startsWith('00') ? `+${westernPhone.slice(2)}` : westernPhone;
};
const isCompletePhone = (phoneText) => {
  const normalizedPhone = normalizePhone(phoneText);
  const phoneDigits = normalizedPhone.startsWith('+') ? normalizedPhone.slice(1) : normalizedPhone;
  return /^\d{8,15}$/.test(phoneDigits) && !/^0+$/.test(phoneDigits);
};

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin');
  if (origin) {
    try { if (!ALLOWED_HOSTS.has(new URL(origin).hostname)) return json({ ok: false, error: 'origin_not_allowed' }, 403); }
    catch { return json({ ok: false, error: 'bad_origin' }, 403); }
  }
  if (!env.LEADS_ENDPOINT) return json({ ok: false, error: 'backend_not_configured' }, 503);

  let input;
  try { input = await request.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }
  if (scalar(input.company, 100)) return json({ ok: true, ignored: true });

  const name = scalar(input.name, 80);
  const phone = normalizePhone(scalar(input.phone, 25));
  const interest = scalar(input.interest, 80);
  if (!name || !isCompletePhone(phone) || !interest || input.consent !== true) {
    return json({ ok: false, error: 'validation_failed' }, 422);
  }

  const leadId = `AK-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
  const payload = {
    lead_id: leadId,
    submitted_at: new Date().toISOString(),
    name,
    phone,
    email: scalar(input.email, 120),
    interest,
    preferred_contact: scalar(input.preferred_contact, 40),
    message: scalar(input.message, 500),
    consent: true,
    source: scalar(input.source, 80), medium: scalar(input.medium, 80), campaign: scalar(input.campaign, 160),
    ad_group: scalar(input.ad_group, 160), keyword: scalar(input.keyword, 240), match_type: scalar(input.match_type, 30),
    device: scalar(input.device, 30), landing_intent: scalar(input.landing_intent, 60),
    gclid: scalar(input.gclid, 256), gbraid: scalar(input.gbraid, 256), wbraid: scalar(input.wbraid, 256),
    page_url: scalar(input.page_url, 1000), referrer: scalar(input.referrer, 1000)
  };

  const upstream = await fetch(env.LEADS_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'follow'
  });
  if (!upstream.ok) return json({ ok: false, error: 'crm_upstream_failed' }, 502);
  const result = await upstream.json().catch(() => ({ ok: true }));
  if (result.ok === false) return json({ ok: false, error: 'crm_rejected' }, 502);
  return json({ ok: true, lead_id: leadId });
}

export function onRequest() { return json({ ok: false, error: 'method_not_allowed' }, 405); }
