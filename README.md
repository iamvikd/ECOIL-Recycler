# ECOIL Recycler Desk

Internal portal for ECOIL storage points. Post a segregated lot (location, waste stream, tonnes), get the nearest recyclers that handle that stream with their published phone numbers and emails, see an indicative ex-yard rate, send an RFQ, and log the quotes that come back.

Streams covered: cardboard (OCC), hard plastic bottles and containers (PET, HDPE/PP, mixed rigid), QSR mixed waste, and e-waste. The first release covers North India: Punjab, Haryana, Delhi NCR, Uttar Pradesh, Himachal Pradesh and Uttarakhand.

## How it works

```
public/                 static site served by Vercel
  index.html            page markup
  styles.css            styles (light and dark themes)
  app.js                UI logic, distance ranking, RFQ draft, rate benchmarks
  data/recyclers.json   verified recycler directory (seed data, 38 entries)
api/                    Vercel serverless functions (Node.js)
  data.js               GET    all recyclers, lots and quotes
  lots.js               POST   create lot      PATCH ?id=  change status
  quotes.js             POST   log quote       DELETE ?id= remove quote
  recyclers.js          POST   add a recycler confirmed by the team
  health.js             GET    deployment and database check
  _lib/store.js         Redis client, validation, access key
scripts/
  check.js              validates recyclers.json (runs in CI)
  seed.js               loads recyclers.json into Redis
```

Data lives in Upstash Redis as three hashes: `ecoil:recyclers`, `ecoil:lots`, `ecoil:quotes`. On the first API call the directory is loaded from `public/data/recyclers.json` automatically. If the database is not connected, the page still loads the directory from that file in read-only mode.

Distance is straight-line distance multiplied by 1.3 as an approximation of road distance. Recycler coordinates are approximate (town or industrial-area level); each entry says so in `coordNote`.

## Deploy on Vercel

1. Push this folder to a new GitHub repository.
2. In Vercel, choose **Add New > Project**, import the repository, keep Framework Preset as **Other**, and deploy. No build command is needed.
3. In the project, open **Storage**, add **Upstash for Redis** from the Marketplace and connect it to the project. This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
4. Optional but recommended: under **Settings > Environment Variables**, add `PORTAL_KEY` with a passphrase for the team. The page asks for it once per browser.
5. Redeploy so the new variables take effect, then open `/api/health`. It should return `"database": "ok"`.

The site sends `noindex` headers so it stays out of search results. The access key is a shared passphrase, not per-user login; for named users, put the project behind Vercel Authentication or add an auth provider later.

## Local development

```bash
npm install
npm i -g vercel
vercel link
vercel env pull .env.local
vercel dev
```

## Updating the directory

Edit `public/data/recyclers.json`, run `npm run check`, then either commit and redeploy (a fresh database seeds itself) or push the changes into the live database:

```bash
npm run seed     # upsert shipped entries, keep team-added recyclers
npm run reseed   # clear the directory first, then load the file
```

Lots and quotes are never touched by either command.

Each entry carries `verification` (Verified, Partial, Contact pending), `checkedOn` and `sources`. Keep those fields current when you change a contact.

## Rate benchmarks

Indicative ex-yard rates live in the `RATES` object at the top of `public/app.js`, with their sources in `SOURCES`. They come from published market listings and trade press as of October 2026, not from offers made to ECOIL. Replace them with ECOIL's own logged quotes once enough lots have sold.

## Data sources

Recycler contacts were taken from each company's website, the Punjab Pollution Control Board list of e-waste recyclers and refurbishers, the DPCC approved list of e-waste dismantlers and recyclers (published by NDMC), and the DST NSTMIS institution list. The pollution board lists are undated, so confirm each agency's current authorisation and CPCB EPR registration before a sale.
