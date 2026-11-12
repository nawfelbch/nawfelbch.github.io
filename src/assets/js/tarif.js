// Barème plateau SECOTO (v3) — partagé par le simulateur (navigateur) et la
// construction du site (src/_data/prix.js). Aucun prix n'est écrit ici : la
// table de prix client vient de l'app (RPC secoto_bareme_v3_public), ce
// module ne fait que la lire pour un trajet donné.
(function (racine) {
  'use strict';

  const VOITURES = ['citadine', 'berline', 'grand'];

  // Département d'un lieu : { d } (liste des villes) ou code postal.
  function departement(lieu) {
    if (!lieu) return '';
    if (lieu.d) return String(lieu.d);
    const cp = String(lieu.cp || lieu.postcode || '').trim();
    return /^\d{5}$/.test(cp) ? cp.slice(0, 2) : '';
  }

  // Voitures : axe Paris ↔ Lyon ↔ Marseille ↔ Côte d'Azur moins cher,
  // trajet vers / depuis une zone peu desservie plus cher.
  function casTrajet(v3, gabarit, depA, depB) {
    if (!VOITURES.includes(gabarit) || !depA || !depB) return 'normal';
    const axe = v3.axe_departements, zones = v3.grandes_zones;
    if (axe.includes(depA) && axe.includes(depB)) return 'axe';
    if (!zones.includes(depA) || !zones.includes(depB)) return 'hors_zone';
    return 'normal';
  }

  function couloirMoto(v3, depA, depB) {
    const z = v3.moto_couloir;
    return (z.zone_a.includes(depA) && z.zone_b.includes(depB)) || (z.zone_b.includes(depA) && z.zone_a.includes(depB));
  }

  // Lecture de la table (prix tous les 10 km, puis tous les 50 km).
  function lireTable(km, serie, distance) {
    const d = Math.max(0, Number(distance) || 0);
    let i = 0;
    while (i < km.length - 2 && km[i + 1] < d) i++;
    const pente = (serie[i + 1] - serie[i]) / (km[i + 1] - km[i]);
    return Math.round(serie[i] + pente * (d - km[i]));
  }

  // Prix Standard d'un transport sur plateau.
  function prixStandard(v3, gabarit, distance, roulant, depA, depB) {
    const series = v3.prix[gabarit];
    if (!series) return null;
    const cas = casTrajet(v3, gabarit, depA, depB);
    let p = lireTable(v3.km, series[cas + (roulant ? '' : '_non_roulant')] || series.normal, distance);
    if (gabarit === 'moto' && couloirMoto(v3, depA, depB)) p = Math.min(p, v3.moto_couloir.plafond_eur);
    return p;
  }

  function prixExpress(v3, standard) { return Math.round(standard * v3.express.coef); }

  // Places occupées sur le porte-voitures (dimensions inconnues : cas le plus prudent).
  function placesEco(v3, gabarit) {
    const p = v3.eco.places;
    if (gabarit === 'citadine' || gabarit === 'berline' || gabarit === 'moto') return 1;
    if (gabarit === 'grand') return p.grand;
    if (gabarit === 'utilitaire') return p.utilitaire_long;
    if (gabarit === 'caravane' || gabarit === 'camping_car') return p[gabarit];
    return null;
  }

  function villeEco(v3, lieu) {
    let best = null, dmin = Infinity;
    for (const v of v3.eco.villes) {
      const d = (v.lat - lieu.la) ** 2 + ((v.lng - lieu.lo) * Math.cos(lieu.la * Math.PI / 180)) ** 2;
      if (d < dmin) { dmin = d; best = v.nom; }
    }
    return best;
  }

  // Offre Éco (de ville à ville), ou null quand elle n'existe pas ou n'est pas moins chère.
  function offreEco(v3, gabarit, distance, roulant, a, b, standard) {
    if (!roulant || !a || !b) return null;
    const depA = departement(a), depB = departement(b);
    if (depA === 'MC' || depB === 'MC') return null;
    if (gabarit === 'moto' && !couloirMoto(v3, depA, depB)) return null;
    const places = placesEco(v3, gabarit);
    if (!places) return null;
    const depot = villeEco(v3, a), retrait = villeEco(v3, b);
    if (!depot || !retrait || depot === retrait) return null;
    const e = v3.eco;
    const prix = places === 1
      ? (distance > 0 && distance <= e.court_max_km ? e.prix_court_eur : e.prix_france_eur)
      : Math.round(places * e.prix_place_france_eur);
    if (standard != null && prix >= standard) return null;
    return { prix, depot, retrait, places };
  }

  const T = { VOITURES, departement, casTrajet, couloirMoto, lireTable, prixStandard, prixExpress, placesEco, villeEco, offreEco };
  racine.SecotoTarif = T;
})(typeof globalThis !== 'undefined' ? globalThis : window);
