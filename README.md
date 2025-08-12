# Runesse — Next.js 14 Site (Landing + Demo + Legal + Analytics)

## Develop
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Deploy to Vercel
1. Push this folder to a new GitHub repo.
2. In Vercel: New Project → Import → Framework: Next.js
3. Add env var (Project Settings → Environment Variables):
   - `SUBSCRIBE_WEBHOOK` = (your Google Apps Script / Airtable / Make.com webhook URL)
4. Deploy.

## Custom Domain (e.g., runesse.in)
- Add Domain in Vercel → `runesse.in`
- If your domain is on GoDaddy/Namecheap etc.:
  - Set `A` record to Vercel IPs or add CNAME as Vercel instructs.
  - Or use Vercel’s nameservers.
- Wait for DNS to propagate (usually < 30 min).

## Email capture webhook
- Create a Google Sheet → Extensions → Apps Script → new web app:
```javascript
function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.openById('YOUR_SHEET_ID');
  const sh = ss.getSheetByName('Sheet1');
  sh.appendRow([new Date(), payload.email, payload.source]);
  return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
}
```
- Deploy → copy the Web App URL → set it as `SUBSCRIBE_WEBHOOK` in Vercel.

## Analytics
- Vercel Analytics: already included. Enable in Vercel project settings if needed.
- Google Analytics: edit `app/layout.tsx` and replace `G-XXXX` with your Measurement ID.
- Plausible: uncomment the script in `app/layout.tsx` and set `data-domain` to your domain.

## Routes
- `/` — Landing
- `/demo` — MVP-style demo
- `/privacy` — Privacy policy
- `/terms` — Terms of service
