# Alia Al Khalidiya Leads Backend

The landing posts to `/api/lead` (Cloudflare Pages Function). The function forwards server-to-server to a Google Apps Script Web App stored in the `LEADS_ENDPOINT` environment variable.

## Google-side one-time deployment
1. Open the Apps Script project `Alia Al Khalidiya Leads API`.
2. Paste `google-apps-script/Code.gs` into Code.gs and use the included `appsscript.json`.
3. Deploy > New deployment > Web app.
4. Execute as: **Me**. Access: **Anyone**.
5. Copy the `/exec` URL.
6. Add it in Cloudflare Pages as environment variable/secret `LEADS_ENDPOINT` for Production (and Preview while testing).

Do not put the Apps Script URL or personal data into GTM/dataLayer.
