// Récupère le barème client ACTIF de l'app (une seule source de vérité :
// les grilles de prix de app.secoto-transport.fr) et l'écrit dans
// src/_data/bareme.json pour les pages et le simulateur.
// En cas d'échec, la construction s'arrête : le site déjà en ligne reste en
// place, jamais un site publié avec des prix devinés.
import { writeFile } from "node:fs/promises";

const URL_SUPABASE = "https://znnigxmzacukpfueqfrh.supabase.co";
// Clé « anon » : publique par conception (déjà présente dans le navigateur).
const CLE_PUBLIQUE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubmlneG16YWN1a3BmdWVxZnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyODQ2NzgsImV4cCI6MjA5MTg2MDY3OH0.YNnKgsxm5AoorOsk-FVRWBgP2AVFI6rZKSmlbUSsfXo";

export function verifierBareme(b) {
  const nombre = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;
  const ok = b && b.convoyage && b.plateau
    && nombre(b.convoyage.minimum) && nombre(b.plateau.minimum) && nombre(b.plateau.non_roulant)
    && ["voiture", "moto", "utilitaire"].every((c) => nombre(b.plateau.eur_per_km?.[c]) && nombre(b.convoyage.eur_per_km?.[c]));
  if (!ok) throw new Error("Barème reçu incomplet : construction arrêtée.");
  return b;
}

async function principal() {
  const r = await fetch(`${URL_SUPABASE}/rest/v1/rpc/secoto_bareme_public`, {
    method: "POST",
    headers: { apikey: CLE_PUBLIQUE, Authorization: `Bearer ${CLE_PUBLIQUE}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!r.ok) throw new Error(`Barème indisponible (${r.status}) : construction arrêtée.`);
  const bareme = verifierBareme(await r.json());
  await writeFile(new URL("../src/_data/bareme.json", import.meta.url), `${JSON.stringify({ ...bareme, lu_le: new Date().toISOString() }, null, 2)}\n`);
  console.log(`Barème lu : plateau v${bareme.versions?.plateau}, convoyage v${bareme.versions?.convoyage}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  principal().catch((e) => { console.error(e.message); process.exit(1); });
}
