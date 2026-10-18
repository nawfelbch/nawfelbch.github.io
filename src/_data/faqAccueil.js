// FAQ de la page d'accueil : la même source alimente le texte visible et les
// données structurées FAQPage. Les prix viennent du barème réel de l'app.
import prix from "./prix.js";

const L = prix.libelles;

export default [
  {
    q: "Quand est-ce que je paie ?",
    r: "Seulement à l’arrivée du véhicule. À la réservation, 0 € est prélevé : votre carte bancaire est seulement enregistrée, en garantie. Une fois le véhicule livré, vous réglez au choix par carte, en plusieurs fois avec Klarna (sous réserve d’acceptation), par virement ou en espèces au transporteur (jusqu’à 1 000 €).",
  },
  {
    q: "Quelle différence entre convoyage et transport sur plateau ?",
    r: "En convoyage, un conducteur professionnel prend le volant : c’est la solution la plus économique, réservée aux véhicules roulants, assurés et en état de circuler. Sur plateau, le véhicule est chargé et sanglé sur un camion : il ne parcourt aucun kilomètre par lui-même. Le plateau s’impose pour une moto, un scooter, un véhicule non roulant, sans contrôle technique ou de valeur.",
  },
  {
    q: "Mon véhicule ne roule pas : peut-il être transporté ?",
    r: `Oui. Véhicule en panne, accidenté, sans batterie, sans contrôle technique ou non assuré : le transport se fait sur plateau, avec un supplément de ${L.nonRoulant}. Indiquez « non roulant » dans le simulateur, puis précisez dans l’application si le véhicule peut être poussé ou s’il faut un treuil.`,
  },
  {
    q: "Quels sont les tarifs ?",
    r: `Convoyage par chauffeur : ${L.convoyageKm}/km, à partir de ${L.convoyageMin}, carburant et péages inclus. Transport sur plateau : voiture ${L.plateauVoitureKm}/km, utilitaire et caravane ${L.plateauUtilitaireKm}/km, moto ${L.plateauMotoKm}/km${L.plafondMoto ? ` plafonné à ${L.plafondMoto}` : ""}, minimum ${L.plateauMin}, supplément de ${L.nonRoulant} pour un véhicule non roulant. Le simulateur affiche votre prix immédiatement, sans inscription.`,
  },
  {
    q: "Quelles zones sont couvertes ?",
    r: "Toute la France métropolitaine, avec une présence particulièrement forte en Île-de-France et sur la Côte d’Azur. Pour un trajet vers ou depuis l’étranger, le prix se calcule dans l’application ou sur demande.",
  },
  {
    q: "Peut-on transporter plusieurs véhicules en même temps ?",
    r: "Oui. Plusieurs motos, scooters ou voitures peuvent partir sur le même plateau quand le trajet est commun : chaque véhicule en plus bénéficie d’un tarif réduit, calculé automatiquement dans l’application. Les professionnels qui ont des besoins réguliers disposent d’un compte entreprise.",
  },
  {
    q: "Comment le véhicule est-il couvert pendant le transport ?",
    r: "Le transport est exécuté par un transporteur professionnel indépendant, qui dispose de sa propre assurance professionnelle (responsabilité civile et marchandises transportées), vérifiée par SECOTO. Un état des lieux photo est réalisé au départ et à l’arrivée : en cas de dommage, il sert de référence.",
  },
  {
    q: "Combien de temps pour trouver un transporteur ?",
    r: "Le prix s’affiche immédiatement. Dès la réservation (0 € prélevé), la demande part aux transporteurs vérifiés compatibles, qui ont jusqu’à 48 h pour l’accepter. Si aucun ne se rend disponible, rien n’est prélevé et la demande est annulée.",
  },
  {
    q: "Comment les transporteurs sont-ils vérifiés ?",
    r: "Avant de pouvoir accepter une mission, chaque transporteur fournit son immatriculation (Kbis ou avis de situation), son inscription au registre des transporteurs et son attestation d’assurance responsabilité civile et marchandises transportées. SECOTO contrôle ces documents avant d’ouvrir le compte.",
  },
  {
    q: "Puis-je suivre ma commande ?",
    r: "Oui, dans l’application : vous voyez l’avancement de votre commande, les coordonnées du transporteur une fois la mission acceptée, et vous êtes prévenu aux étapes clés jusqu’à la livraison.",
  },
];
