// Prix « à partir de » calculés avec le barème réel de l'app (bareme.json).
// Jamais de chiffre recopié à la main : si le barème change, tout suit.
import bareme from "./bareme.json" with { type: "json" };

const P = bareme.plateau;
const C = bareme.convoyage;

function prixPlateau(classe, km, roulant = true) {
  let p = km * P.eur_per_km[classe];
  if (P.plafond?.[classe]) p = Math.min(p, P.plafond[classe]);
  p = Math.max(P.minimum, p);
  if (!roulant) p += P.non_roulant;
  return Math.round(p);
}

function prixConvoyage(classe, km) {
  return Math.round(Math.max(C.minimum, km * C.eur_per_km[classe]));
}

const euros = (n, decimales = 0) => `${Number(n).toLocaleString("fr-FR", { minimumFractionDigits: decimales, maximumFractionDigits: 2 })} €`;

export default {
  bareme,
  euros,
  prixPlateau,
  prixConvoyage,
  // Libellés prêts à afficher.
  libelles: {
    convoyageKm: euros(C.eur_per_km.voiture, 2),
    convoyageMin: euros(C.minimum),
    plateauVoitureKm: euros(P.eur_per_km.voiture, 2),
    plateauMotoKm: euros(P.eur_per_km.moto, 2),
    plateauUtilitaireKm: euros(P.eur_per_km.utilitaire, 2),
    plateauMin: euros(P.minimum),
    nonRoulant: euros(P.non_roulant),
    plafondMoto: P.plafond?.moto ? euros(P.plafond.moto) : null,
  },
};
