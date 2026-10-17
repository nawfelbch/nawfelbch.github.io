// Contrôle qualité du site construit (_site) : bloque la mise en ligne si une
// règle SEO ou un lien interne est cassé.
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

const RACINE = "_site";
const SITE = "https://secoto-transport.fr";
const APP = "https://app.secoto-transport.fr/";
const INTERDITS = [/SECOTO transporte/i, /organise (la|votre) mission/i, /nous convoyons/i, /z[ée]ro dommage/i, /assurance incluse/i, /951\s?857\s?531/, /AggregateRating/];

async function fichiers(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await fichiers(p)));
    else out.push(p);
  }
  return out;
}
const existe = async (p) => { try { return (await stat(p)).isFile(); } catch { return false; } };
const versFichier = (url) => {
  let f = decodeURIComponent(url.split("#")[0].split("?")[0]);
  if (f.endsWith("/")) f += "index.html";
  return path.join(RACINE, f);
};

const erreurs = [];
const err = (page, msg) => erreurs.push(`${page} : ${msg}`);
const pages = (await fichiers(RACINE)).filter((f) => f.endsWith(".html"));
const titres = new Map(), descriptions = new Map(), ids = new Map(), docs = new Map();
const tableau = [];

for (const f of pages) {
  const html = await readFile(f, "utf8");
  const $ = cheerio.load(html);
  docs.set(f, $);
  ids.set(f, new Set($("[id]").map((_, el) => $(el).attr("id")).get()));
}

for (const [f, $] of docs) {
  const page = "/" + path.relative(RACINE, f).replace(/index\.html$/, "");
  const est404 = f.endsWith("404.html");
  const titre = $("title").text().trim();
  const desc = $('meta[name="description"]').attr("content") || "";
  const h1 = $("h1").length;
  const canon = $('link[rel="canonical"]').attr("href") || "";
  if (!titre) err(page, "title absent");
  if (titre.length > 60) err(page, `title trop long (${titre.length})`);
  if (!/SECOTO$/.test(titre)) err(page, "title doit finir par SECOTO");
  if (!desc) err(page, "description absente");
  if (desc.length > 155) err(page, `description trop longue (${desc.length})`);
  if (h1 !== 1) err(page, `${h1} H1`);
  if (!est404 && canon !== SITE + page) err(page, `canonical ${canon}`);
  if (!est404) {
    if (titres.has(titre)) err(page, `title en double avec ${titres.get(titre)}`);
    if (descriptions.has(desc)) err(page, `description en double avec ${descriptions.get(desc)}`);
    titres.set(titre, page); descriptions.set(desc, page);
  }
  for (const p of ["og:title", "og:description", "og:image", "og:url"]) if (!$(`meta[property="${p}"]`).attr("content")) err(page, `${p} absent`);
  $("img").each((_, el) => { if ($(el).attr("alt") === undefined) err(page, `image sans alt ${$(el).attr("src")}`); });
  $('script[type="application/ld+json"]').each((_, el) => { try { JSON.parse($(el).text()); } catch { err(page, "JSON-LD invalide"); } });
  const texte = $("body").text() + $('script[type="application/ld+json"]').text();
  for (const r of INTERDITS) if (r.test(texte)) err(page, `formulation interdite ${r}`);

  for (const el of $("a[href], link[href], script[src], img[src]").get()) {
    const url = $(el).attr("href") || $(el).attr("src");
    if (url.startsWith(APP)) {
      const u = new URL(url);
      const legal = /\.html$/.test(u.pathname);
      if (!legal && u.searchParams.get("utm_source") !== "site") err(page, `lien app sans UTM ${url}`);
      continue;
    }
    if (url.startsWith("#")) {
      if (url.length > 1 && !ids.get(f).has(url.slice(1))) err(page, `ancre absente ${url}`);
      continue;
    }
    if (!url.startsWith("/") || url.startsWith("//")) continue;
    const cible = versFichier(url);
    if (!(await existe(cible))) { err(page, `lien cassé ${url}`); continue; }
    const ancre = url.split("#")[1];
    if (ancre && ids.has(cible) && !ids.get(cible).has(ancre)) err(page, `ancre absente ${url}`);
  }
  tableau.push({ page, titre, t: titre.length, d: desc.length, mots: $("main").text().split(/\s+/).filter(Boolean).length });
}

const sitemap = await readFile(path.join(RACINE, "sitemap.xml"), "utf8");
for (const loc of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  if (!(await existe(versFichier(loc[1].replace(SITE, ""))))) err("sitemap", `URL sans page ${loc[1]}`);
}

console.table(tableau);
if (erreurs.length) { console.error(erreurs.join("\n")); process.exit(1); }
console.log(`OK : ${pages.length} pages, aucun lien cassé.`);
