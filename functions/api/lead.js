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


const tallyField = (fields, label) => (Array.isArray(fields) ? fields : []).find((field) => field?.label === label);
const tallyFieldText = (fields, label, max = 500) => {
  const field = tallyField(fields, label);
  if (!field) return '';
  const value = field.value;
  if (Array.isArray(value)) {
    const options = Array.isArray(field.options) ? field.options : [];
    return scalar(value.map((item) => options.find((option) => option?.id === item)?.text || item).join(', '), max);
  }
  if (value && typeof value === 'object') {
    if (Object.prototype.hasOwnProperty.call(value, label)) return scalar(value[label], max);
    return scalar('', max);
  }
  return scalar(value, max);
};

const base64FromBytes = (bytes) => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const safeEqual = (left, right) => {
  const a = String(left || '');
  const b = String(right || '');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

async function verifyTallySignature(body, signature, secret) {
  if (!secret || !signature) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(JSON.stringify(body)));
  return safeEqual(base64FromBytes(new Uint8Array(signed)), signature);
}

export async function onTallyWebhookPost({ request, env }) {
  if (!env.LEADS_ENDPOINT || !env.TALLY_WEBHOOK_SECRET) return json({ ok: false, error: 'backend_not_configured' }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }

  const signature = request.headers.get('tally-signature');
  if (!(await verifyTallySignature(body, signature, env.TALLY_WEBHOOK_SECRET))) {
    return json({ ok: false, error: 'invalid_signature' }, 401);
  }

  if (body?.eventType !== 'FORM_RESPONSE' || body?.data?.formId !== 'ja4eJ4') {
    return json({ ok: true, ignored: true });
  }

  const data = body.data || {};
  const fields = Array.isArray(data.fields) ? data.fields : [];
  const name = tallyFieldText(fields, 'الاسم الكامل', 80);
  const phone = normalizePhone(tallyFieldText(fields, 'رقم الجوال', 25));
  const interest = tallyFieldText(fields, 'نوع الاهتمام', 80);
  if (!name || !isCompletePhone(phone) || !interest) return json({ ok: false, error: 'validation_failed' }, 422);

  const submissionId = scalar(data.submissionId || data.responseId, 80);
  const payload = {
    lead_id: `TALLY-${submissionId || crypto.randomUUID().slice(0, 12)}`,
    submitted_at: scalar(data.createdAt || body.createdAt, 60) || new Date().toISOString(),
    name,
    phone,
    email: tallyFieldText(fields, 'البريد الإلكتروني', 120),
    interest,
    preferred_contact: 'أي طريقة',
    message: '',
    consent: true,
    source: tallyFieldText(fields, 'utm_source', 80),
    medium: tallyFieldText(fields, 'utm_medium', 80),
    campaign: tallyFieldText(fields, 'utm_campaign', 160),
    ad_group: tallyFieldText(fields, 'utm_adgroup', 160) || tallyFieldText(fields, 'adgroupid', 160),
    keyword: tallyFieldText(fields, 'utm_term', 240),
    match_type: tallyFieldText(fields, 'matchtype', 30),
    device: tallyFieldText(fields, 'device', 30),
    landing_intent: tallyFieldText(fields, 'intent', 60) || 'default',
    gclid: tallyFieldText(fields, 'gclid', 256),
    gbraid: tallyFieldText(fields, 'gbraid', 256),
    wbraid: tallyFieldText(fields, 'wbraid', 256),
    page_url: tallyFieldText(fields, 'originPage', 1000),
    referrer: ''
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
  return json({ ok: true, lead_id: payload.lead_id });
}
