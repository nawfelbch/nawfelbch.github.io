# Site secoto-transport.fr

Eleventy (pages HTML pré-rendues) publié sur GitHub Pages par `.github/workflows/pages.yml`.

- `src/` : pages (`*.njk`), gabarits (`_includes/`), données (`_data/`), CSS/JS/images (`assets/`).
- `src/_data/bareme.json` : barème client lu dans l'app (`npm run bareme`) : convoyage (`secoto_bareme_public`) et plateau v3 par type de véhicule, Express et Éco (`secoto_bareme_v3_public`). Ne pas le modifier à la main.
- `src/assets/js/tarif.js` : lecture du barème v3 pour un trajet, partagée par le simulateur et `prix.js`.
- `npm run build` : lit le barème puis construit `_site/`. `npm run check` : contrôle SEO et liens.
- Prix affichés : toujours « à partir de », calculés depuis le barème (`src/_data/prix.js`).
- Vocabulaire : SECOTO vous met en relation avec un transporteur professionnel indépendant et vérifié, qui exécute le transport.
- L'ancien `index.html` à la racine reste tant que GitHub Pages n'est pas passé sur « GitHub Actions ».
