"use strict";
/* Validates public/data/recyclers.json before deploy. Exit code 1 on any error. */
const data = require("../public/data/recyclers.json");
const CATS = ["cardboard", "rigid", "qsr", "ewaste"];
const errors = [];
const ids = new Set();
for (const [i, r] of data.entries()) {
  const at = `#${i} ${r.name || "(no name)"}`;
  if (!r.id || !/^[A-Za-z0-9_-]+$/.test(r.id)) errors.push(`${at}: bad id`);
  if (ids.has(r.id)) errors.push(`${at}: duplicate id ${r.id}`);
  ids.add(r.id);
  if (!r.name) errors.push(`${at}: missing name`);
  if (!Array.isArray(r.categories) || !r.categories.length || r.categories.some((c) => !CATS.includes(c)))
    errors.push(`${at}: categories must be from ${CATS.join(", ")}`);
  if (r.kind !== "network") {
    if (typeof r.lat !== "number" || r.lat < 6 || r.lat > 38) errors.push(`${at}: lat out of range`);
    if (typeof r.lng !== "number" || r.lng < 68 || r.lng > 98) errors.push(`${at}: lng out of range`);
  }
  for (const e of r.emails || []) if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) errors.push(`${at}: odd email ${e}`);
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
const by = {};
for (const r of data) for (const c of r.categories) by[c] = (by[c] || 0) + 1;
console.log(`OK: ${data.length} recyclers`, by);
