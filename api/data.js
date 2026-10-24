"use strict";
const { KEYS, handler, all, ensureSeed } = require("./_lib/store");

/* GET /api/data : directory, lots and quotes in one call */
module.exports = handler(["GET"], async (req, res, r) => {
  await ensureSeed(r);
  const [recyclers, lots, quotes] = await Promise.all([
    all(r, KEYS.recyclers),
    all(r, KEYS.lots),
    all(r, KEYS.quotes),
  ]);
  res.status(200).json({ recyclers, lots, quotes });
});
