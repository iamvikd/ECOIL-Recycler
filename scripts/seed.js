"use strict";
/* Load public/data/recyclers.json into Redis.
   npm run seed     upserts the shipped directory, keeps recyclers the team added
   npm run reseed   clears the directory first (lots and quotes are untouched) */
const { KEYS, SEED, redis } = require("../api/_lib/store");

(async () => {
  const r = redis();
  if (!r) {
    console.error("Missing UPSTASH_REDIS_REST_URL / KV_REST_API_URL and token. Run `vercel env pull .env.local` first.");
    process.exit(1);
  }
  if (process.argv.includes("--replace")) {
    await r.del(KEYS.recyclers);
    console.log("Cleared directory");
  }
  const map = {};
  for (const x of SEED) map[x.id] = x;
  await r.hset(KEYS.recyclers, map);
  console.log(`Seeded ${SEED.length} recyclers`);
})().catch((e) => { console.error(e); process.exit(1); });
