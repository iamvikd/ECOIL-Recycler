"use strict";
const S = require("./_lib/store");

/* POST /api/recyclers : add a recycler the team has confirmed */
module.exports = S.handler(["POST"], async (req, res, r) => {
  const b = S.body(req);
  const name = S.str(b.name, 160);
  const city = S.str(b.city, 120);
  const lat = S.num(b.lat);
  const lng = S.num(b.lng);
  const categories = S.strList(b.categories, 4, 20).filter((c) => S.CATEGORIES.includes(c));
  if (!name) throw S.bad("Company name is required");
  if (!city) throw S.bad("City is required");
  if (lat === null || lng === null || lat < 6 || lat > 38 || lng < 68 || lng > 98) throw S.bad("Coordinates must be inside India");
  if (!categories.length) throw S.bad("Pick at least one waste stream");

  const id = "team-" + S.newId();
  const rec = {
    id, name, city,
    state: S.str(b.state, 60) || (city.split(",")[1] || "").trim(),
    kind: "facility",
    lat, lng, categories,
    phones: S.strList(b.phones),
    emails: S.strList(b.emails),
    materials: S.str(b.materials, 400),
    verification: "Verified",
    checkedOn: "Added by team " + new Date().toISOString().slice(0, 10),
    sources: [],
  };
  await r.hset(S.KEYS.recyclers, { [id]: rec });
  res.status(201).json(rec);
});
