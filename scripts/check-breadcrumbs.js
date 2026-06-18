#!/usr/bin/env node
/**
 * check-breadcrumbs.js
 *
 * Reads every service-page index.html and verifies that the breadcrumb
 * last segment matches both the page <title> (before the " — " separator)
 * and the page <h1>.
 *
 * Exits 0 when everything matches, non-zero when mismatches are found.
 *
 * Run manually:  node scripts/check-breadcrumbs.js
 *
 * Pre-publish hook: This script is configured as the deployment build command
 * in .replit ([deployment] build = ["node", "scripts/check-breadcrumbs.js"]).
 * A non-zero exit blocks publishing and prints the offending page(s).
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const SKIP_DIRS = new Set(["about", "contact", "service-area"]);

function stripHtml(str) {
  return str.replace(/<[^>]+>/g, "").trim();
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  if (!m) return null;
  const full = m[1].trim();
  const sepIdx = full.indexOf(" \u2014 ");
  return sepIdx !== -1 ? full.slice(0, sepIdx).trim() : full;
}

function extractBreadcrumbLast(html) {
  const m = html.match(/class="breadcrumb"[^>]*>([\s\S]*?)<\/div>/i);
  if (!m) return null;
  const inner = m[1];
  const parts = inner.split(/›|›/);
  const last = stripHtml(parts[parts.length - 1]);
  return last || null;
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return null;
  return stripHtml(m[1]);
}

const entries = fs.readdirSync(ROOT, { withFileTypes: true });
const serviceDirs = entries
  .filter((e) => e.isDirectory() && !SKIP_DIRS.has(e.name) && !e.name.startsWith("."))
  .map((e) => e.name);

let mismatches = 0;
let checked = 0;

for (const dir of serviceDirs.sort()) {
  const filePath = path.join(ROOT, dir, "index.html");
  if (!fs.existsSync(filePath)) continue;

  const html = fs.readFileSync(filePath, "utf8");

  const breadcrumb = extractBreadcrumbLast(html);
  if (!breadcrumb) continue;

  const title = extractTitle(html);
  const h1 = extractH1(html);

  checked++;
  const errors = [];

  if (title && title !== breadcrumb) {
    errors.push(`  title:      "${title}"\n  breadcrumb: "${breadcrumb}"`);
  }
  if (h1 && h1 !== breadcrumb) {
    errors.push(`  h1:         "${h1}"\n  breadcrumb: "${breadcrumb}"`);
  }

  if (errors.length) {
    mismatches++;
    console.error(`\nMISMATCH: ${dir}/index.html`);
    errors.forEach((e) => console.error(e));
  }
}

if (mismatches === 0) {
  console.log(`✓ All ${checked} service pages have matching breadcrumbs, titles, and h1s.`);
  process.exit(0);
} else {
  console.error(`\n✗ ${mismatches} page(s) have breadcrumb mismatches (${checked} checked).`);
  process.exit(1);
}
