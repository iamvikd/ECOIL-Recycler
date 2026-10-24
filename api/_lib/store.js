"use strict";
const crypto = require("crypto");
const { Redis } = require("@upstash/redis");
const SEED = require("../../public/data/recyclers.json");

const KEYS = {
  recyclers: "ecoil:recyclers",
  lots: "ecoil:lots",
  quotes: "ecoil:quotes",
};
const CATEGORIES = ["cardboard", "rigid", "qsr", "ewaste"];
const GRADES = ["", "pet", "hdpe", "mixed", "ew_mixed", "ew_pcb", "ew_cable", "ew_casing"];
const STATUSES = ["Open", "Quoted", "Sold", "Cancelled"];

let client = null;
function redis() {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  client = new Redis({ url, token });
  return client;
}

/* Optional shared access key. When PORTAL_KEY is set, every API call must send it. */
function authorised(req) {
  const key = process.env.PORTAL_KEY;
  if (!key) return true;
  const got = Buffer.from(String(req.headers["x-portal-key"] || ""));
  const want = Buffer.from(key);
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code || "invalid";
  }
}
const bad = (msg) => new HttpError(400, msg, "invalid");
const notFound = (msg) => new HttpError(404, msg, "not_found");

function handler(methods, fn) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!methods.includes(req.method)) {
      res.setHeader("Allow", methods.join(", "));
      return res.status(405).json({ error: "Method not allowed", code: "method" });
    }
    if (!authorised(req)) {
      return res.status(401).json({ error: "Access key required", code: "unauthorized" });
    }
    const r = redis();
    if (!r) {
      return res.status(503).json({
        error: "Database not configured. Add Upstash Redis to this Vercel project.",
        code: "no_database",
      });
    }
    try {
      return await fn(req, res, r);
    } catch (e) {
      if (e instanceof HttpError) return res.status(e.status).json({ error: e.message, code: e.code });
      console.error(e);
      return res.status(500).json({ error: "Server error", code: "server" });
    }
  };
}

const str = (v, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v) => {
  const n = typeof v === "string" && v.trim() === "" ? NaN : Number(v);
  return Number.isFinite(n) ? n : null;
};
const strList = (v, max = 6, len = 120) =>
  (Array.isArray(v) ? v : []).map((x) => str(x, len)).filter(Boolean).slice(0, max);
const body = (req) => (req.body && typeof req.body === "object" ? req.body : {});
const queryId = (req) => {
  const id = str(req.query && req.query.id, 80);
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) throw bad("A valid id is required");
  return id;
};

async function all(r, key) {
  const h = await r.hgetall(key);
  return h ? Object.values(h) : [];
}

/* First run: load the verified directory shipped in public/data/recyclers.json */
async function ensureSeed(r) {
  const n = await r.hlen(KEYS.recyclers);
  if (n > 0) return false;
  const map = {};
  for (const x of SEED) map[x.id] = x;
  await r.hset(KEYS.recyclers, map);
  return true;
}

module.exports = {
  KEYS, CATEGORIES, GRADES, STATUSES, SEED,
  redis, handler, bad, notFound, str, num, strList, body, queryId, all, ensureSeed,
  newId: () => crypto.randomUUID(),
};
