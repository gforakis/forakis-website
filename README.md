# Forakis Refrigeration & Air Conditioning — Website

**Live at https://forakisrefrigeration.com** (deployed July 2026).

Production build of the approved design (see `../design_handoff_forakis_website/`).
Plain HTML + CSS + vanilla JS — no build step, no dependencies.

## Hosting & deployment

- **Host:** GitHub Pages, repo `gforakis/forakis-website` (public), branch `main`, root.
- **Deploying changes:** commit to `main` and push — Pages redeploys automatically
  (`git add -A && git commit -m "..." && git push` from this folder).
- **Domain:** forakisrefrigeration.com, registered at Squarespace (expires Apr 2027,
  account gforakis@gmail.com). DNS on Squarespace nameservers: 4 × A records `@` →
  GitHub Pages IPs (185.199.108–111.153), CNAME `www` → `gforakis.github.io`.
  The old Bluehost nameservers were discarded July 2026.
- **Note:** old Google Workspace MX/SPF/DKIM records exist in Squarespace DNS
  (inherited from Google Domains). No email is active on the domain; clean these up
  if email @forakisrefrigeration.com is ever set up.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole site (single page) |
| `styles.css` | All styling; mobile layout kicks in below 900px |
| `main.js` | Form behavior, validation, delivery, analytics hooks |
| `images/` | Web-compressed photos (400w + 800w responsive pairs, OG image) |
| `assets/` | Logo marks (light + dark) |
| `favicon.svg`, `apple-touch-icon.png` | Icons generated from the logo mark |

## ⚠️ Before launch — required

1. ~~Form delivery~~ **DONE & VERIFIED (July 2026)**: wired to Formspree
   (`FORM_ENDPOINT = 'https://formspree.io/f/xkoldorj'` in `main.js`), which
   emails **vgfhvac@gmail.com**. Verified end-to-end: test submission returned
   HTTP 200 `{"ok": true}`. Uses Formspree's vanilla-AJAX integration (JSON
   POST with `Accept: application/json`); the existing custom form UI handles
   all state, validation, and the success/error cards.
   The payload includes: request type (Install/Service), name, phone, email,
   address, property type, details, preferred date, preferred time slot, a
   `_subject` line ("Website request: Install — Name"), and `_replyto` set to
   the customer's email. Spam protection: client-side honeypot is built in;
   Formspree adds its own filtering. Free tier = 50 submissions/month —
   monitor in the Formspree dashboard and upgrade if lead volume grows.

2. **Analytics**: `main.js` fires `generate_lead` (form success) and
   `phone_call_click` (any tel: link) through `gtag()` if present. Add your
   Google Analytics / Google Ads tag to `index.html` and map those events to
   conversions.

3. **Domain-absolute URLs**: once the domain is known, change `og:image`,
   JSON-LD `image`/`logo` to absolute URLs and add `<link rel="canonical">` +
   `og:url`.

## Open items from the design handoff (confirm with Bill)

- ~~Years don't reconcile~~ **Resolved (July 2026)**: 38 years owned / 42 in the
  trade are correct, so the footer year was corrected to "since 1988"
  (2026 − 38). Note the "38 years" mentions will need bumping on the
  anniversary each year; the footer year is now permanent.
- **License number** for the "Licensed & insured · MD HVAC" footer line.
- **Form destination** (see above).

## Local preview

```
python3 -m http.server 8737 --directory site
```
Then open http://localhost:8737

## Notes

- Photo grid shows 8 photos on desktop, 6 on mobile (two are hidden below
  900px, matching the approved mobile design). `IMG_4513.JPG` from the handoff
  is an unused spare.
- Date field disallows past dates; time slot and date are optional (the
  business confirms by phone either way).
- Validation requires name, phone (7–15 digits), and details; email is
  optional but format-checked. A delivery failure shows an inline error with
  the phone number as fallback.
