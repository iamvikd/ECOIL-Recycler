"use strict";
const S = require("./_lib/store");

/* POST /api/quotes          log a quote against a lot
   DELETE /api/quotes?id=... remove a quote */
module.exports = S.handler(["POST", "DELETE"], async (req, res, r) => {
  if (req.method === "DELETE") {
    const id = S.queryId(req);
    await r.hdel(S.KEYS.quotes, id);
    return res.status(200).json({ ok: true });
  }

  const b = S.body(req);
  const lotId = S.str(b.lotId, 80);
  const recycler = S.str(b.recycler, 160);
  const rate = S.num(b.rate);
  if (!lotId || !(await r.hexists(S.KEYS.lots, lotId))) throw S.notFound("Lot not found");
  if (!recycler) throw S.bad("Recycler name is required");
  if (rate === null || rate < -100000 || rate > 5000000) throw S.bad("Rate per tonne is out of range");

  const id = S.newId();
  const quote = { id, lotId, recycler, rate, terms: S.str(b.terms, 300), createdAt: new Date().toISOString() };
  await r.hset(S.KEYS.quotes, { [id]: quote });
  res.status(201).json(quote);
});
