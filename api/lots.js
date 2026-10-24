"use strict";
const S = require("./_lib/store");

/* POST /api/lots          create a lot
   PATCH /api/lots?id=...  change its status */
module.exports = S.handler(["POST", "PATCH"], async (req, res, r) => {
  const b = S.body(req);

  if (req.method === "PATCH") {
    const id = S.queryId(req);
    const lot = await r.hget(S.KEYS.lots, id);
    if (!lot) throw S.notFound("Lot not found");
    if (!S.STATUSES.includes(b.status)) throw S.bad("Status must be one of " + S.STATUSES.join(", "));
    const next = { ...lot, status: b.status, updatedAt: new Date().toISOString() };
    await r.hset(S.KEYS.lots, { [id]: next });
    return res.status(200).json(next);
  }

  const category = S.str(b.category, 20);
  const grade = S.str(b.grade, 20);
  const tonnes = S.num(b.tonnes);
  const lat = S.num(b.lat);
  const lng = S.num(b.lng);
  if (!S.CATEGORIES.includes(category)) throw S.bad("Unknown waste stream");
  if (!S.GRADES.includes(grade)) throw S.bad("Unknown grade");
  if (tonnes === null || tonnes <= 0 || tonnes > 10000) throw S.bad("Quantity must be between 0 and 10,000 t");
  if (lat === null || lng === null || lat < 6 || lat > 38 || lng < 68 || lng > 98) throw S.bad("Location must be inside India");

  const id = S.newId();
  const lot = {
    id,
    locName: S.str(b.locName, 120) || "Storage point",
    lat, lng, category, grade, tonnes,
    radius: S.num(b.radius) || 300,
    notes: S.str(b.notes, 600),
    rateLo: S.num(b.rateLo),
    rateHi: S.num(b.rateHi),
    status: "Open",
    createdAt: new Date().toISOString(),
  };
  await r.hset(S.KEYS.lots, { [id]: lot });
  res.status(201).json(lot);
});
