# Site secoto-transport.fr

Eleventy (pages HTML pré-rendues) publié sur GitHub Pages par `.github/workflows/pages.yml`.

- `src/` : pages (`*.njk`), gabarits (`_includes/`), données (`_data/`), CSS/JS/images (`assets/`).
- `src/_data/bareme.json` : barème client lu dans l'app (`npm run bareme`) : convoyage (`secoto_bareme_public`) et plateau v3 par type de véhicule, Express et Éco (`secoto_bareme_v3_public`). Ne pas le modifier à la main.
- `src/assets/js/tarif.js` : lecture du barème v3 pour un trajet, partagée par le simulateur et `prix.js`.
- `npm run build` : lit le barème puis construit `_site/`. `npm run check` : contrôle SEO et liens.
- Prix affichés : toujours « à partir de », calculés depuis le barème (`src/_data/prix.js`).
- Vocabulaire : SECOTO vous met en relation avec un transporteur professionnel indépendant et vérifié, qui exécute le transport.
- L'ancien `index.html` à la racine reste tant que GitHub Pages n'est pas passé sur « GitHub Actions ».

## Mise à jour du 14/11/2026

- **Barème « lourds » (migration 144 de l'app)** : utilitaire, caravane, camping-car dès 505 €, Express + 20 % (`v3.lourds.express_coef`), pas d'Éco (`tarif.js` : `estLourd`, `prixExpress(v3, standard, gabarit)`).
- **Klarna (CCD2)** : simple mention « Klarna » parmi les moyens de paiement, jamais « en plusieurs fois » ni « 3 × … ».
- **Page `/professionnels/` (Navette Pro)** : prix client pro lus dans `bareme.json` → `v3.navette_pro` (migration 146 de l'app), exemples calculés au build par `src/_data/navette.js` (affichés seulement si la Navette est moins chère que le Standard). Sans ce bloc, la page reste valide, sans prix.
- **Simulateur pro** `src/assets/js/pro.js` : SIREN = 9 chiffres (espaces, points, tirets acceptés), aucun autre contrôle, ni envoyé ni enregistré ; France + grandes villes de Belgique et d'Allemagne ; même règle d'axe que l'app (`tarif.js` : `axeNavette`, `prixNavette`). Bouton → app `?compte=pro` (inscription pro directe).
- **Accueil** : sélecteur « Particulier | Professionnel · Tarif dédié » en tête du hero, lien « Professionnels » dans le menu, carte tarifs « Navette Pro ». **Aucun prix pro sur l'accueil** (anti-friction : les particuliers gardent le parcours classique).
