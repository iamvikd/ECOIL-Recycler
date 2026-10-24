"use strict";
const { redis } = require("./_lib/store");

/* GET /api/health : deployment check, no data returned */
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const r = redis();
  let database = "not_configured";
  if (r) {
    try { await r.ping(); database = "ok"; } catch (e) { database = "error"; }
  }
  res.status(200).json({ ok: true, database, accessKey: Boolean(process.env.PORTAL_KEY) });
};
