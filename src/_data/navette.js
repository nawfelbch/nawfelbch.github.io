// 146 : Navette Pro — exemples de trajets de la page Professionnels, calculés
// avec le barème réel de l'app (bareme.json), jamais recopiés à la main.
// Un exemple n'est affiché que si la Navette Pro y est proposée, c'est-à-dire
// moins chère que le Standard (même règle que l'app).
import bareme from "./bareme.json" with { type: "json" };
import "../assets/js/tarif.js";

const T = globalThis.SecotoTarif;
const V3 = bareme.v3;
const N = V3.navette_pro;
const DETOUR = 1.2; // comme le simulateur : vol d'oiseau + 20 %

const LIEUX = {
  Paris: { la: 48.853, lo: 2.349, d: "75", pays: "FR" },
  Lyon: { la: 45.749, lo: 4.848, d: "69", pays: "FR" },
  Marseille: { la: 43.297, lo: 5.381, d: "13", pays: "FR" },
  Toulon: { la: 43.124, lo: 5.928, d: "83", pays: "FR" },
  Cannes: { la: 43.551, lo: 7.013, d: "06", pays: "FR" },
  Nice: { la: 43.703, lo: 7.266, d: "06", pays: "FR" },
  Monaco: { la: 43.738, lo: 7.424, d: "MC", pays: "MC" },
  Lille: { la: 50.634, lo: 3.055, d: "59", pays: "FR" },
  Bruxelles: { la: 50.847, lo: 4.357, pays: "BE" },
  Anvers: { la: 51.22, lo: 4.402, pays: "BE" },
  Cologne: { la: 50.938, lo: 6.96, pays: "DE" },
  "Düsseldorf": { la: 51.227, lo: 6.774, pays: "DE" },
  Francfort: { la: 50.11, lo: 8.682, pays: "DE" },
  Stuttgart: { la: 48.776, lo: 9.183, pays: "DE" },
  Munich: { la: 48.137, lo: 11.575, pays: "DE" },
};
const TRAJETS = [
  ["Paris", "Nice"], ["Paris", "Cannes"], ["Paris", "Monaco"], ["Paris", "Marseille"], ["Paris", "Toulon"],
  ["Paris", "Lyon"], ["Lyon", "Nice"],
  ["Paris", "Bruxelles"], ["Paris", "Anvers"], ["Paris", "Cologne"], ["Paris", "Düsseldorf"], ["Paris", "Francfort"],
  ["Paris", "Stuttgart"], ["Paris", "Munich"], ["Lille", "Cologne"],
];

function km(a, b) {
  const R = 6371, rad = (x) => (x * Math.PI) / 180;
  const h = Math.sin(rad(b.la - a.la) / 2) ** 2 + Math.cos(rad(a.la)) * Math.cos(rad(b.la)) * Math.sin(rad(b.lo - a.lo) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * DETOUR);
}
const euros = (n) => `${Math.round(n).toLocaleString("fr-FR")} €`;

function exemple([de, vers]) {
  const a = LIEUX[de], b = LIEUX[vers], d = km(a, b);
  const axe = T.axeNavette(V3, a, b, d);
  if (!axe) return null;
  const un = T.prixNavette(axe, "berline", 1);
  const parVoiture = T.prixNavette(axe, "berline", 2) / 2;
  const france = a.pays !== "BE" && a.pays !== "DE" && b.pays !== "BE" && b.pays !== "DE";
  // Prix public Standard (berline) : la Navette n'est proposée que si elle est
  // moins chère ; l'économie n'est affichée que sur les trajets en France.
  const dep = (l) => (l.d === "MC" ? "06" : l.d || "");
  const prixStd = T.prixStandard(V3, "berline", d, true, dep(a), dep(b));
  if (prixStd != null && un >= prixStd) return null;
  const standard = france ? prixStd : null;
  return {
    de, vers, km: d, france, axe: axe.nom,
    un: euros(un), parVoiture: euros(parVoiture), quatre: euros(4 * parVoiture),
    standard: standard != null ? euros(standard) : null,
    economie: standard != null ? `−${Math.round((1 - un / standard) * 100)} %` : null,
  };
}

const exemples = N && N.actif ? TRAJETS.map(exemple).filter(Boolean) : [];
const prixMin = N && N.actif ? Math.min(...N.axes.map((a) => a.voiture_par_vehicule_2_plus)) : null;

export default {
  actif: Boolean(N && N.actif && exemples.length),
  libelle: N?.libelle || "Navette Pro",
  delai: N ? `${Math.round(N.fenetre_h / 24)} jours` : "7 jours",
  axes: N?.axes || [],
  prixMin: prixMin ? euros(prixMin) : null,
  france: exemples.filter((e) => e.france),
  international: exemples.filter((e) => !e.france),
};
