// Prix « à partir de » calculés avec le barème réel de l'app (bareme.json).
// Jamais de chiffre recopié à la main : si le barème change, tout suit.
import bareme from "./bareme.json" with { type: "json" };
import "../assets/js/tarif.js";

const T = globalThis.SecotoTarif;
const C = bareme.convoyage;
const V = bareme.v3;

function prixConvoyage(classe, km) {
  return Math.round(Math.max(C.minimum, km * C.eur_per_km[classe]));
}

// Prix Standard sur plateau, trajet sans majoration ni remise.
function prixPlateau(gabarit, km, roulant = true, depA = "", depB = "") {
  return T.prixStandard(V, gabarit, km, roulant, depA, depB);
}

const euros = (n, decimales = 0) => `${Number(n).toLocaleString("fr-FR", { minimumFractionDigits: decimales, maximumFractionDigits: 2 })} €`;
const jours = (h) => `${Math.round(h / 24)} jours`;
const M = V.minimums;
const ecoPlace2 = Math.round(2 * V.eco.prix_place_france_eur);

export default {
  bareme,
  euros,
  prixPlateau,
  prixConvoyage,
  // Libellés prêts à afficher.
  libelles: {
    convoyageKm: euros(C.eur_per_km.voiture, 2),
    convoyageMin: euros(C.minimum),
    plateauMin: euros(Math.min(...Object.values(M))),
    voitureMin: euros(Math.min(M.citadine, M.berline, M.grand)),
    citadineMin: euros(M.citadine),
    berlineMin: euros(M.berline),
    grandMin: euros(M.grand),
    utilitaireMin: euros(M.utilitaire),
    motoMin: euros(M.moto),
    caravaneMin: euros(Math.min(M.caravane, M.camping_car)),
    plafondMoto: euros(V.moto_couloir.plafond_eur),
    expressPct: `${Math.round((V.express.coef - 1) * 100)} %`,
    expressDelai: `${V.express.delai_h} h`,
    standardDelai: jours(V.standard.delai_h),
    ecoDelai: jours(V.eco.delai_h),
    ecoCourt: euros(V.eco.prix_court_eur),
    ecoCourtKm: `${V.eco.court_max_km} km`,
    ecoFrance: euros(V.eco.prix_france_eur),
    ecoInternational: euros(V.eco.prix_international_eur),
    ecoDeuxPlaces: euros(ecoPlace2),
    ecoVilles: V.eco.villes.map((v) => v.nom).join(", "),
    caravanePoids: `${(V.caravane.poids_majore_kg / 1000).toLocaleString("fr-FR")} t`,
    caravanePoidsPct: `${V.caravane.poids_majoration_pct} %`,
    caravaneLongueur: `${V.caravane.longueur_majoree_m.toLocaleString("fr-FR")} m`,
    caravaneLongueurPct: `${V.caravane.longueur_majoration_pct} %`,
    caravanePoidsMax: `${(V.caravane.poids_max_kg / 1000).toLocaleString("fr-FR")} t`,
  },
};
