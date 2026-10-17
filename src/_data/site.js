// Données communes du site. Les codes de vérification (Search Console, Bing)
// se renseignent ici quand Nawfal les fournit : vides = aucune balise.
export default {
  nom: "SECOTO",
  url: "https://secoto-transport.fr",
  appUrl: "https://app.secoto-transport.fr/",
  telephone: "07 83 27 82 31",
  telephoneIntl: "+33783278231",
  email: "contact.secoto@gmail.com",
  adresse: { rue: "70 Avenue du Maréchal Foch", codePostal: "92260", ville: "Fontenay-aux-Roses", pays: "FR" },
  // Profils officiels (sameAs) : à compléter avec les vraies adresses.
  profils: [],
  verification: {
    google: "",
    bing: "",
  },
  // Clé IndexNow (fichier /<clé>.txt publié à la racine).
  indexnow: "6f3c2a9e8b1d4c7fa0e5b2d9c4a1f3e8",
  // Mention obligatoire sur chaque page (règle juridique) :
  mentionRole: "SECOTO agit en tant qu’intermédiaire de mise en relation : un transporteur professionnel indépendant et vérifié exécute le transport.",
};
