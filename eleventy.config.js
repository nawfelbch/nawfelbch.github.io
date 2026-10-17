// Site vitrine SECOTO — Eleventy (HTML pré-rendu, aucun contenu affiché
// uniquement en JavaScript). Sortie : _site/, publiée sur GitHub Pages.
import path from "node:path";
import site from "./src/_data/site.js";

const APERCU = process.env.PREVIEW === "1";

// Lien vers l'app, toujours marqué pour le tableau Acquisition.
export function lienApp(slug, params = {}) {
  const q = new URLSearchParams({
    ...params,
    utm_source: "site",
    utm_medium: "organic_page",
    utm_campaign: slug || "accueil",
  });
  return `${site.appUrl}?${q.toString()}`;
}

// Aperçu (fichiers ouverts sans serveur) : liens internes rendus relatifs.
export function relatif(html, outputPath, racine) {
  const dossier = path.dirname(path.relative(racine, outputPath));
  const vers = (cible) => {
    const [chemin, ancre = ""] = cible.split("#");
    let fichier = chemin.replace(/^\//, "");
    if (fichier === "" || fichier.endsWith("/")) fichier += "index.html";
    let rel = path.relative(dossier, fichier) || "index.html";
    if (!rel.startsWith(".")) rel = `./${rel}`;
    return ancre ? `${rel}#${ancre}` : rel;
  };
  return html.replace(/(\s(?:href|src)=")(\/(?!\/)[^"]*)"/g, (_, attr, cible) => `${attr}${vers(cible)}"`);
}

export default function (config) {
  config.addPassthroughCopy({ "src/assets": "assets" });
  config.addPassthroughCopy({ "logo.png": "logo.png" });
  config.addPassthroughCopy({ "src/static": "." });

  config.addFilter("lienApp", lienApp);
  config.addFilter("absolu", (chemin) => new URL(chemin || "/", site.url).toString());
  config.addFilter("json", (v) => { if (v === undefined) throw new Error("json : valeur absente"); return JSON.stringify(v).replace(/</g, "\\u003c"); });
  config.addFilter("dateIso", (d) => new Date(d).toISOString().slice(0, 10));
  // Données structurées : fil d'Ariane (toutes les pages) et FAQ visible.
  config.addFilter("schemaFil", (fil = []) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ nom: "Accueil", url: "/" }, ...(fil || [])].map((e, i) => ({
      "@type": "ListItem", position: i + 1, name: e.nom, item: new URL(e.url, site.url).toString(),
    })),
  }));
  config.addFilter("schemaFaq", (faq = []) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.r } })),
  }));

  if (APERCU) {
    config.addTransform("apercu-relatif", function (contenu) {
      const sortie = this.page.outputPath;
      if (!sortie || !sortie.endsWith(".html")) return contenu;
      return relatif(contenu, sortie, "_site");
    });
  }

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "md", "11ty.js"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
