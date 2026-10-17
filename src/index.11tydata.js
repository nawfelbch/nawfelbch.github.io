// Accueil : la FAQ alimente à la fois le texte visible et le schéma FAQPage ;
// le schéma Service reprend le prix « à partir de » du barème réel.
import faqAccueil from "./_data/faqAccueil.js";
import prix from "./_data/prix.js";
import site from "./_data/site.js";

const service = (nom, type, minimum, description) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: nom,
  serviceType: type,
  description,
  provider: { "@id": `${site.url}/#organisation` },
  areaServed: { "@type": "Country", name: "France" },
  offers: {
    "@type": "Offer",
    priceCurrency: "EUR",
    priceSpecification: { "@type": "PriceSpecification", minPrice: minimum, priceCurrency: "EUR" },
    url: `${site.url}/#simulateur`,
  },
});

export default {
  faq: faqAccueil,
  faqPrefixe: "accueil",
  slugUtm: "accueil",
  schemaExtra: [
    service("Convoyage de véhicule par chauffeur", "Convoyage de véhicules", prix.bareme.convoyage.minimum,
      "Mise en relation avec un convoyeur professionnel indépendant et vérifié, qui conduit votre véhicule roulant jusqu’à destination."),
    service("Transport de véhicule sur plateau", "Transport de véhicules sur plateau", prix.bareme.plateau.minimum,
      "Mise en relation avec un transporteur professionnel indépendant et vérifié, qui charge votre voiture, moto, utilitaire ou véhicule non roulant sur plateau."),
  ],
};
