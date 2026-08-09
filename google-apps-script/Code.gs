const SPREADSHEET_ID = '16PsDCjBm-OsSnBO1fN_b8jCZ-UunSJfDvW4MlW5JBv4';
const SHEET_NAME = 'Leads';

function safeCell(value, maxLen) {
  let s = String(value == null ? '' : value).trim().slice(0, maxLen || 1000);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // prevent spreadsheet formula injection
  return s;
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'alia-leads' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const p = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!p.lead_id || !p.name || !p.phone || !p.interest || p.consent !== true) return out({ ok:false, error:'validation_failed' });

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) return out({ ok:false, error:'sheet_not_found' });

    const submitted = p.submitted_at ? new Date(p.submitted_at) : new Date();
    const row = sheet.getLastRow() + 1;
    const values = [[
      safeCell(p.lead_id,80), submitted, safeCell(p.name,80), safeCell(p.phone,20), safeCell(p.email,120),
      safeCell(p.interest,80), safeCell(p.preferred_contact,40), safeCell(p.message,500), 'جديد', '', '', '', '', '', 0,
      '', '', '', safeCell(p.source,80), safeCell(p.medium,80), safeCell(p.campaign,160), safeCell(p.ad_group,160),
      safeCell(p.keyword,240), safeCell(p.match_type,30), safeCell(p.device,30), safeCell(p.landing_intent,60),
      safeCell(p.gclid,256), safeCell(p.gbraid,256), safeCell(p.wbraid,256), safeCell(p.page_url,1000), safeCell(p.referrer,1000), 'نعم'
    ]];
    sheet.getRange(row, 1, 1, 32).setValues(values);
    sheet.getRange(row, 2).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.getRange(row, 10).setFormula('=40+IF(F'+row+'="تجاري",20,IF(F'+row+'="استثماري / متعدد الاستخدامات",20,10))+IF(W'+row+'<>"",15,0)+IF(H'+row+'<>"",5,0)+IF(D'+row+'<>"",10,0)');
    sheet.getRange(row, 11).setFormula('=IF(J'+row+'>=80,"Hot",IF(J'+row+'>=60,"Warm","Cold"))');
    SpreadsheetApp.flush();
    return out({ ok:true, lead_id:p.lead_id });
  } catch (err) {
    console.error(err);
    return out({ ok:false, error:'server_error' });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
