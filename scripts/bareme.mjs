// Récupère le barème client ACTIF de l'app (une seule source de vérité :
// app.secoto-transport.fr) et l'écrit dans src/_data/bareme.json pour les
// pages et le simulateur :
//   · convoyage : grille au km (secoto_bareme_public) ;
//   · plateau   : barème v3 par type de véhicule, Express et Éco
//                 (secoto_bareme_v3_public, table de prix client calculée
//                 par l'app elle-même).
// En cas d'échec, la construction s'arrête : le site déjà en ligne reste en
// place, jamais un site publié avec des prix devinés.
import { writeFile } from "node:fs/promises";

const URL_SUPABASE = "https://znnigxmzacukpfueqfrh.supabase.co";
// Clé « anon » : publique par conception (déjà présente dans le navigateur).
const CLE_PUBLIQUE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubmlneG16YWN1a3BmdWVxZnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyODQ2NzgsImV4cCI6MjA5MTg2MDY3OH0.YNnKgsxm5AoorOsk-FVRWBgP2AVFI6rZKSmlbUSsfXo";

const nombre = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;
export const GABARITS_V3 = ["citadine", "berline", "grand", "utilitaire", "moto", "caravane", "camping_car"];
const VOITURES = ["citadine", "berline", "grand"];

export function verifierBareme(b) {
  const ok = b && b.convoyage && nombre(b.convoyage.minimum)
    && ["voiture", "moto", "utilitaire"].every((c) => nombre(b.convoyage.eur_per_km?.[c]));
  if (!ok) throw new Error("Barème convoyage reçu incomplet : construction arrêtée.");
  return b;
}

export function verifierBaremeV3(v) {
  const serie = (t) => Array.isArray(t) && t.length === v.km.length && t.every(nombre);
  const ok = v && v.actif === true && Array.isArray(v.km) && v.km.length > 10 && v.km[0] === 0
    && GABARITS_V3.every((g) => nombre(v.minimums?.[g]) && serie(v.prix?.[g]?.normal) && serie(v.prix?.[g]?.normal_non_roulant))
    && VOITURES.every((g) => ["axe", "hors_zone", "axe_non_roulant", "hors_zone_non_roulant"].every((c) => serie(v.prix[g][c])))
    && nombre(v.express?.coef) && v.express.coef > 1 && nombre(v.express?.delai_h) && nombre(v.standard?.delai_h)
    && ["prix_court_eur", "court_max_km", "prix_france_eur", "prix_international_eur", "prix_place_france_eur", "delai_h"].every((k) => nombre(v.eco?.[k]))
    && Array.isArray(v.eco?.villes) && v.eco.villes.length > 1 && v.eco.places
    && Array.isArray(v.axe_departements) && Array.isArray(v.grandes_zones)
    && nombre(v.moto_couloir?.plafond_eur) && Array.isArray(v.moto_couloir?.zone_a) && Array.isArray(v.moto_couloir?.zone_b)
    && nombre(v.caravane?.poids_max_kg);
  if (!ok) throw new Error("Barème v3 reçu incomplet ou désactivé : construction arrêtée.");
  return v;
}

async function lire(rpc) {
  const r = await fetch(`${URL_SUPABASE}/rest/v1/rpc/${rpc}`, {
    method: "POST",
    headers: { apikey: CLE_PUBLIQUE, Authorization: `Bearer ${CLE_PUBLIQUE}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!r.ok) throw new Error(`Barème indisponible (${rpc} : ${r.status}) : construction arrêtée.`);
  return r.json();
}

async function principal() {
  const [ancien, v3] = await Promise.all([lire("secoto_bareme_public"), lire("secoto_bareme_v3_public")]);
  verifierBareme(ancien);
  verifierBaremeV3(v3);
  const bareme = { convoyage: ancien.convoyage, versions: { convoyage: ancien.versions?.convoyage }, v3, lu_le: new Date().toISOString() };
  await writeFile(new URL("../src/_data/bareme.json", import.meta.url), `${JSON.stringify(bareme)}\n`);
  console.log(`Barème lu : convoyage v${ancien.versions?.convoyage}, plateau v3 (calculé le ${v3.calcule_le || "?"})`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  principal().catch((e) => { console.error(e.message); process.exit(1); });
}
