// Simulateur de prix SECOTO — calcul 100 % navigateur, sans compte.
(() => {
  'use strict';

  // Barème client lu dans la page (#secoto-bareme), lui-même issu de l'app au
  // moment de la construction du site : une seule source de vérité. Seul le
  // prix client figure ici. Plateau : barème v3 (tarif.js).
  const B = (() => { try { return JSON.parse(document.getElementById('secoto-bareme').textContent); } catch (e) { return null; } })();
  const T = window.SecotoTarif;
  if (!B || !B.convoyage || !B.v3 || !T) return;
  const V3 = B.v3;
  const CLASSE = { citadine: 'voiture', berline: 'voiture', grand: 'voiture', utilitaire: 'utilitaire', moto: 'moto', caravane: 'autre', camping_car: 'autre' };
  const DETOUR = 1.20; // distance à vol d'oiseau majorée de 20 %
  const APP_URL = 'https://app.secoto-transport.fr/';
  // Liens vers l'app : toujours marqués pour le tableau Acquisition
  // (site.js complète ensuite la provenance : Google naturel, campagne payante).
  const lienApp = params => {
    const q = new URLSearchParams({ ...params, utm_source: 'site', utm_medium: 'organic_page', utm_campaign: (document.getElementById('sim') || {}).dataset?.campagne || 'accueil' });
    const url = APP_URL + '?' + q.toString();
    return window.secotoProvenance ? window.secotoProvenance(url) : url;
  };

  // Villes de France métropolitaine (≥ 15 000 hab.) + stations de la Côte d'Azur et des Alpes : nom|lat|lon|département, par population décroissante.
  // Source : GeoNames (CC BY 4.0).
  const RAW = 'Paris|48.853|2.349|75;Marseille|43.297|5.381|13;Lyon|45.749|4.848|69;Toulouse|43.604|1.444|31;Nice|43.703|7.266|06;Nantes|47.217|-1.553|44;Strasbourg|48.584|7.746|67;Bordeaux|44.841|-0.580|33;Montpellier|43.611|3.876|34;Lille|50.634|3.055|59;Rennes|48.111|-1.674|35;Reims|49.265|4.029|51;Le Havre|49.493|0.108|76;Cergy-Pontoise|49.039|2.078|95;Saint-Étienne|45.434|4.390|42;Toulon|43.124|5.928|83;Angers|47.472|-0.552|49;Dijon|47.313|5.014|21;Grenoble|45.179|5.715|38;Nîmes|43.837|4.358|30;Clermont-Ferrand|45.780|3.087|63;Aix-en-Provence|43.528|5.450|13;Saint-Quentin-en-Yvelines|48.772|2.019|78;Brest|48.390|-4.486|29;Le Mans|48.002|0.203|72;Amiens|49.900|2.300|80;Tours|47.395|0.704|37;Limoges|45.834|1.248|87;Villeurbanne|45.766|4.880|69;Besançon|47.249|6.018|25;Metz|49.119|6.173|57;Orléans|47.902|1.904|45;Rouen|49.443|1.099|76;Mulhouse|47.752|7.329|68;Montreuil|48.864|2.443|93;Perpignan|42.698|2.895|66;Caen|49.186|-0.359|14;Boulogne-Billancourt|48.835|2.241|92;Nancy|48.684|6.185|54;Argenteuil|48.948|2.247|95;Roubaix|50.694|3.175|59;Tourcoing|50.724|3.161|59;Saint-Denis|48.936|2.354|93;Avignon|43.948|4.809|84;Asnières-sur-Seine|48.917|2.283|92;Nanterre|48.892|2.207|92;Dunkerque|51.034|2.377|59;Poitiers|46.583|0.343|86;Versailles|48.804|2.134|78;Courbevoie|48.897|2.257|92;Créteil|48.793|2.466|94;Pau|43.311|-0.356|64;Colombes|48.919|2.254|92;Vitry-sur-Seine|48.787|2.403|94;Aulnay-sous-Bois|48.938|2.494|93;La Rochelle|46.163|-1.152|17;Champigny-sur-Marne|48.816|2.494|94;Rueil-Malmaison|48.877|2.190|92;Antibes|43.581|7.125|06;Saint-Maur-des-Fossés|48.794|2.493|94;Cannes|43.551|7.013|06;Calais|50.952|1.856|62;Béziers|43.341|3.214|34;Aubervilliers|48.917|2.383|93;Mérignac|44.842|-0.645|33;Bourges|47.083|2.400|18;Saint-Nazaire|47.275|-2.218|44;Colmar|48.081|7.356|68;Valence|44.926|4.910|26;Quimper|47.996|-4.098|29;Drancy|48.926|2.445|93;Noisy-le-Grand|48.850|2.563|93;Villeneuve-d\'Ascq|50.617|3.167|59;La Seyne-sur-Mer|43.103|5.878|83;Levallois-Perret|48.894|2.289|92;Chambéry|45.566|5.921|73;Issy-les-Moulineaux|48.821|2.277|92;Neuilly-sur-Seine|48.885|2.270|92;Troyes|48.301|4.085|10;Juan-les-Pins|43.569|7.113|06;Antony|48.753|2.297|92;La Roche-sur-Yon|46.670|-1.428|85;Lorient|47.748|-3.372|56;Sarcelles|48.997|2.378|95;Pessac|44.806|-0.632|33;Ivry-sur-Seine|48.816|2.385|94;Évreux|49.024|1.151|27;Vénissieux|45.697|4.886|69;Cergy|49.036|2.076|95;Clichy|48.900|2.310|92;Saint-Quentin|49.849|3.288|02;Niort|46.323|-0.459|79;Belfort|47.642|6.854|90;Ajaccio|41.919|8.738|2A;Vannes|47.657|-2.762|56;Sartrouville|48.948|2.192|78;Maisons-Alfort|48.812|2.439|94;Meaux|48.960|2.879|77;Blois|47.594|1.329|41;Brive-la-Gaillarde|45.159|1.533|19;Arles|43.677|4.630|13;Beauvais|49.433|2.083|60;Châteauroux|46.812|1.694|36;Cholet|47.059|-0.880|49;Fréjus|43.433|6.736|83;Pantin|48.894|2.409|93;Saint-Brieuc|48.515|-2.768|22;Montauban|44.018|1.354|82;Charleville-Mézières|49.769|4.725|08;Albi|43.930|2.148|81;Tarbes|43.234|0.071|65;Fontenay-sous-Bois|48.854|2.483|94;Évry|48.633|2.440|89;Clamart|48.803|2.267|92;Châlons-en-Champagne|48.954|4.367|51;Narbonne|43.184|3.001|11;Saint-Malo|48.647|-2.009|35;Laval|48.072|-0.770|53;Hyères|43.120|6.129|83;Carcassonne|43.216|2.349|11;Angoulême|45.650|0.153|16;Annecy|45.909|6.126|74;Bondy|48.902|2.489|93;Le Blanc-Mesnil|48.939|2.461|93;Villejuif|48.794|2.360|94;Grasse|43.658|6.925|06;Sevran|48.945|2.527|93;Castres|43.605|2.241|81;Chalon-sur-Saône|46.781|4.854|71;Arras|50.293|2.782|62;Boulogne-sur-Mer|50.725|1.614|62;Chelles|48.881|2.593|77;Cagnes-sur-Mer|43.664|7.148|06;Saint-Herblain|47.212|-1.651|44;Douai|50.371|3.079|59;Épinay-sur-Seine|48.953|2.315|93;Vincennes|48.849|2.438|94;Martigues|43.407|5.055|13;Bourg-en-Bresse|46.206|5.226|01;Bobigny|48.910|2.450|93;Montluçon|46.340|2.603|03;Aubagne|43.293|5.571|13;Valenciennes|50.359|3.525|59;Suresnes|48.871|2.229|92;Meudon|48.814|2.235|92;Bayonne|43.493|-1.473|64;Istres|43.513|4.987|13;Thionville|49.360|6.160|57;Mantes-la-Jolie|48.990|1.717|78;Compiègne|49.418|2.826|60;Nevers|46.990|3.159|58;Chartres|48.447|1.489|28;Le Cannet|43.577|7.019|06;Wattrelos|50.701|3.218|59;Caluire-et-Cuire|45.795|4.846|69;Gap|44.559|6.079|05;Talence|44.808|-0.589|33;Alès|44.125|4.081|30;Gennevilliers|48.933|2.300|92;Saint-Priest|45.697|4.944|69;Rosny-sous-Bois|48.870|2.499|93;Auxerre|47.800|3.570|89;Salon-de-Provence|43.642|5.095|13;Saint-Germain-en-Laye|48.896|2.090|78;Bastia|42.702|9.451|2B;Sète|43.403|3.693|34;Anglet|43.489|-1.519|64;Puteaux|48.883|2.239|92;Corbeil-Essonnes|48.606|2.488|91;Garges-lès-Gonesse|48.968|2.398|95;Roanne|46.036|4.068|42;Savigny-sur-Orge|48.677|2.348|91;Livry-Gargan|48.919|2.543|93;Épinal|48.183|6.453|88;Saint-Ouen|48.907|2.333|93;Rezé|47.191|-1.569|44;Montigny-le-Bretonneux|48.766|2.034|78;Noisy-le-Sec|48.891|2.465|93;Melun|48.546|2.654|77;Bagneux|48.796|2.308|92;Massy|48.727|2.283|91;Haguenau|48.816|7.791|67;Montrouge|48.816|2.314|92;Marcq-en-Barœul|50.667|3.083|59;Vitrolles|43.460|5.249|13;Draguignan|43.537|6.465|83;Lens|50.433|2.828|62;Gagny|48.883|2.533|93;Saint-Chamond|45.476|4.513|42;Bron|45.739|4.913|69;Vaulx-en-Velin|45.787|4.925|69;Joué-lès-Tours|47.349|0.665|37;Alfortville|48.806|2.420|94;La Courneuve|48.928|2.396|93;Châtellerault|46.817|0.545|86;Villepinte|48.962|2.533|93;Cambrai|50.176|3.235|59;Poissy|48.929|2.050|78;Conflans-Sainte-Honorine|49.002|2.097|78;Mont-de-Marsan|43.890|-0.497|40;Plaisir|48.823|1.954|78;Marignane|43.417|5.215|13;Dieppe|49.922|1.078|76;Montélimar|44.555|4.755|26;Tremblay-en-France|48.950|2.568|93;Choisy-le-Roi|48.768|2.419|94;Saint-Martin-d\'Hères|45.179|5.763|38;Mâcon|46.314|4.828|71;Romans-sur-Isère|45.050|5.066|26;Saint-Raphaël|43.423|6.774|83;Pontault-Combault|48.798|2.607|77;Six-Fours-les-Plages|43.092|5.825|83;Périgueux|45.187|0.714|24;Aurillac|44.925|2.440|15;Neuilly-sur-Marne|48.854|2.549|93;Liévin|50.420|2.781|62;Agen|44.202|0.621|47;Franconville|48.983|2.233|95;Sainte-Geneviève-des-Bois|48.647|2.320|91;Maubeuge|50.279|3.973|59;Bagnolet|48.867|2.417|93;Saumur|47.259|-0.078|49;Biarritz|43.481|-1.557|64;La Ciotat|43.175|5.604|13;Échirolles|45.146|5.714|38;Villefranche-sur-Saône|45.990|4.720|69;Châtenay-Malabry|48.765|2.267|92;Stains|48.950|2.383|93;Châtillon|48.802|2.293|92;Vienne|45.526|4.875|38;Schiltigheim|48.607|7.749|67;Les Mureaux|48.992|1.910|78;Le Perreux-sur-Marne|48.850|2.500|94;Guyancourt|48.773|2.074|78;Palaiseau|48.718|2.250|91;Saint-Dizier|48.638|4.949|52;Creil|49.257|2.485|60;Vandœuvre-lès-Nancy|48.661|6.171|54;Thonon-les-Bains|46.370|6.480|74;Béthune|50.530|2.640|62;Colomiers|43.611|1.335|31;Nogent-sur-Marne|48.837|2.483|94;Athis-Mons|48.705|2.391|91;Viry-Châtillon|48.672|2.393|91;Houilles|48.922|2.193|78;Soissons|49.382|3.324|02;Dreux|48.736|1.366|28;Charenton-le-Pont|48.822|2.412|94;Villeneuve-Saint-Georges|48.732|2.449|94;Élancourt|48.784|1.955|78;Alençon|48.435|0.093|61;Sotteville-lès-Rouen|49.410|1.090|76;Orange|44.138|4.810|84;Villenave-d\'Ornon|44.779|-0.567|33;Pontoise|49.050|2.100|95;Villiers-sur-Marne|48.831|2.548|94;Chatou|48.890|2.159|78;Goussainville|49.014|2.466|95;Lomme|50.644|2.987|59;Vierzon|47.222|2.068|18;Saint-Médard-en-Jalles|44.895|-0.718|33;Thiais|48.765|2.396|94;Carpentras|44.055|5.048|84;L\'Haÿ-les-Roses|48.779|2.337|94;Menton|43.776|7.504|06;Saint-Laurent-du-Var|43.673|7.190|06;Saintes|45.747|-0.635|17;Rochefort|45.943|-0.968|17;Malakoff|48.820|2.300|92;Draveil|48.685|2.414|91;Saint-Sébastien-sur-Loire|47.208|-1.503|44;Le Chesnay|48.822|2.122|78;Tournefeuille|43.589|1.319|31;Clichy-sous-Bois|48.910|2.553|93;Chaumont|48.111|5.141|52;Saint-Étienne-du-Rouvray|49.378|1.105|76;Meyzieu|45.766|5.003|69;Yerres|48.718|2.493|91;Montbéliard|47.510|6.798|25;Saint-Cloud|48.846|2.203|92;Sens|48.197|3.283|89;Laon|49.563|3.627|02;Lambersart|50.650|3.033|59;Trappes|48.774|2.018|78;Rodez|44.353|2.573|12;Bergerac|44.852|0.482|24;Annemasse|46.194|6.238|74;La Garde|43.125|6.010|83;Ermont|48.990|2.258|95;Rillieux-la-Pape|45.817|4.900|69;Villemomble|48.883|2.500|93;Pierrefitte-sur-Seine|48.967|2.361|93;Le Kremlin-Bicêtre|48.815|2.361|94;Champs-sur-Marne|48.850|2.600|77;Aix-les-Bains|45.692|5.909|73;Bezons|48.924|2.213|95;Vallauris|43.578|7.055|06;Taverny|49.025|2.217|95;Illkirch-Graffenstaden|48.529|7.715|67;La Teste-de-Buch|44.633|-1.145|33;Épernay|49.040|3.959|51;Villiers-le-Bel|49.009|2.398|95;Vichy|46.127|3.426|03;Sannois|48.967|2.250|95;Gonesse|48.987|2.449|95;Vigneux-sur-Seine|48.703|2.414|91;Cavaillon|43.831|5.036|84;Rambouillet|48.644|1.830|78;Cherbourg|49.640|-1.616|50;Armentières|50.686|2.882|59;Lunel|43.678|4.136|34;Cachan|48.796|2.337|94;Le Grand-Quevilly|49.401|1.046|76;Abbeville|50.105|1.835|80;La Garenne-Colombes|48.905|2.247|92;Montigny-lès-Metz|49.096|6.153|57;Vanves|48.823|2.290|92;Vernon|49.093|1.463|27;Savigny-le-Temple|48.574|2.583|77;Dole|47.092|5.490|39;Villeneuve-sur-Lot|44.409|0.704|47;Les Ulis|48.682|2.169|91;Oyonnax|46.259|5.657|01;Oullins|45.714|4.808|69;Le Creusot|46.807|4.416|71;Hénin-Beaumont|50.414|2.965|62;Orvault|47.271|-1.624|44;Coudekerque-Branche|51.023|2.394|59;Herblay-sur-Seine|48.990|2.170|95;Ris-Orangis|48.651|2.414|91;Sucy-en-Brie|48.769|2.535|94;Grigny|48.654|2.393|91;Fresnes|48.756|2.322|94;Romainville|48.885|2.435|93;Fontenay-aux-Roses|48.793|2.293|92;Décines-Charpieu|45.769|4.959|69;Saint-Dié-des-Vosges|48.284|6.949|88;Fontaine|45.193|5.688|38;Auch|43.646|0.589|32;Bruay-la-Buissière|50.483|2.550|62;Lisieux|49.147|0.229|14;Sarreguemines|49.110|7.067|57;Torcy|48.851|2.651|77;Gradignan|44.774|-0.614|33;Lanester|47.763|-3.339|56;Brétigny-sur-Orge|48.611|2.306|91;Muret|43.460|1.325|31;Bois-Colombes|48.919|2.275|92;Blagnac|43.637|1.390|31;Hérouville-Saint-Clair|49.211|-0.307|14;Libourne|44.914|-0.242|33;Le Bouscat|44.865|-0.599|33;Miramas|43.585|5.003|13;Beaune|47.024|4.839|21;Eaubonne|48.997|2.282|95;Brunoy|48.694|2.492|91;Villeparisis|48.942|2.615|77;Montfermeil|48.898|2.579|93;Sèvres|48.823|2.218|92;Fougères|48.352|-1.200|35;Saint-Pol-sur-Mer|51.031|2.340|59;La Madeleine|50.646|3.076|59;Gif-sur-Yvette|48.683|2.133|91;Bègles|44.808|-0.551|33;Cahors|44.449|1.437|46;Millau|44.100|3.078|12;Hazebrouck|50.724|2.537|59;Grande-Synthe|51.015|2.300|59;La Valette-du-Var|43.138|5.983|83;Moulins|46.565|3.332|03;Mont-Saint-Aignan|49.463|1.094|76;Étampes|48.435|2.162|91;Mons-en-Barœul|50.633|3.117|59;Agde|43.311|3.476|34;Saint-Ouen-l\'Aumône|49.044|2.121|95;Vertou|47.169|-1.473|44;Montgeron|48.705|2.450|91;Maisons-Laffitte|48.953|2.145|78;Le Puy-en-Velay|45.044|3.885|43;Le Petit-Quevilly|49.413|1.062|76;Lormont|44.877|-0.519|33;Olivet|47.862|1.899|45;Ozoir-la-Ferrière|48.767|2.669|77;Le Plessis-Robinson|48.789|2.271|92;Cenon|44.856|-0.534|33;Combs-la-Ville|48.665|2.570|77;Dax|43.710|-1.054|40;Frontignan|43.448|3.755|34;Voiron|45.365|5.586|38;Loos|50.610|3.019|59;Le Mée-sur-Seine|48.532|2.628|77;Villeneuve-la-Garenne|48.939|2.315|92;Fécamp|49.758|0.375|76;Cormeilles-en-Parisis|48.971|2.205|95;Sainte-Foy-lès-Lyon|45.734|4.803|69;Verdun|49.160|5.383|55;Vélizy-Villacoublay|48.782|2.194|78;Saint-Lô|49.116|-1.090|50;Achères|48.961|2.069|78;Lunéville|48.593|6.494|54;Deuil-la-Barre|48.977|2.327|95;La Celle-Saint-Cloud|48.850|2.145|78;Annecy-le-Vieux|45.920|6.144|74;Sceaux|48.776|2.290|92;Lannion|48.733|-3.457|22;Denain|50.329|3.394|59;Allauch|43.336|5.482|13;Concarneau|47.875|-3.919|29;Eysines|44.884|-0.651|33;Croix|50.678|3.149|59;Forbach|49.188|6.893|57;Manosque|43.829|5.787|04;Saint-Mandé|48.839|2.416|94;Montmorency|48.988|2.343|95;Gardanne|43.455|5.469|13;Les Lilas|48.880|2.421|93;Fleury-les-Aubrais|47.933|1.918|45;Dammarie-les-Lys|48.517|2.650|77;Roissy-en-Brie|48.792|2.647|77;Saint-Genis-Laval|45.695|4.793|69;Saint-Louis|47.592|7.559|68;Cognac|45.696|-0.329|16;Saint-Michel-sur-Orge|48.635|2.308|91;Longjumeau|48.693|2.294|91;Bressuire|46.842|-0.490|79;Vauréal|49.033|2.033|95;Lons-le-Saunier|46.675|5.556|39;Ploemeur|47.735|-3.430|56;Lagny-sur-Marne|48.867|2.717|77;Sedan|49.702|4.940|08;Orly|48.748|2.393|94;Pontarlier|46.903|6.355|25;Chamalières|45.774|3.067|63;Meylan|45.210|5.778|38;Montceau-les-Mines|46.667|4.367|71;Halluin|50.786|3.126|59;Riom|45.894|3.113|63;Chevilly-Larue|48.765|2.350|94;Romorantin-Lanthenay|47.367|1.750|41;Mantes-la-Ville|48.974|1.703|78;Pertuis|43.694|5.503|84;Morsang-sur-Orge|48.662|2.353|91;Vesoul|47.626|6.143|70;Saint-Jean-de-Braye|47.913|1.977|45;Les Pennes-Mirabeau|43.410|5.308|13;Cluses|46.063|6.575|74;Bourg-lès-Valence|44.947|4.895|26;Villefontaine|45.613|5.151|38;Saint-Gratien|48.974|2.287|95;Les Pavillons-sous-Bois|48.907|2.506|93;Fontainebleau|48.409|2.702|77;Hem|50.653|3.187|59;Nogent-sur-Oise|49.272|2.471|60;Bagnols-sur-Cèze|44.163|4.620|30;Couëron|47.215|-1.725|44;Écully|45.774|4.778|69;Cran-Gevrier|45.900|6.100|74;Wasquehal|50.670|3.134|59;Mandelieu-la-Napoule|43.546|6.937|06;Vendôme|47.793|1.066|41;Louviers|49.217|1.167|27;Gujan-Mestras|44.636|-1.068|33;Sanary-sur-Mer|43.120|5.802|83;Senlis|49.207|2.587|60;Albertville|45.675|6.391|73;Limeil-Brévannes|48.745|2.487|94;Jouy-le-Moutier|49.011|2.040|95;Marmande|44.504|0.165|47;Royan|45.628|-1.032|17;Maurepas|48.765|1.929|78;Digne-les-Bains|44.093|6.232|04;Mougins|43.601|6.995|06;Challans|46.846|-1.879|85;Sélestat|48.262|7.449|67;Garches|48.842|2.182|92;Chilly-Mazarin|48.715|2.316|91;Bourg-la-Reine|48.779|2.318|92;Équeurdreville-Hainneville|49.649|-1.653|50;Cournon-d\'Auvergne|45.741|3.196|63;Chaville|48.806|2.189|92;Neuilly-Plaisance|48.863|2.506|93;Bonneuil-sur-Marne|48.770|2.479|94;Sorgues|44.010|4.874|84;Vence|43.723|7.112|06;Le Plessis-Trévise|48.811|2.574|94;Bar-le-Duc|48.773|5.161|55;Seynod|45.885|6.088|74;Mitry-Mory|48.983|2.617|77;Carvin|50.492|2.958|62;Limay|48.996|1.741|78;La Flèche|47.698|-0.076|72;Plaisance-du-Touch|43.566|1.296|31;La Chapelle-sur-Erdre|47.300|-1.552|44;Avion|50.410|2.831|62;Annonay|45.240|4.671|07;Ronchin|50.599|3.091|59;Mauguio|43.617|4.007|34;Chennevières-sur-Marne|48.797|2.540|94;Autun|46.951|4.299|71;Saint-Avold|49.105|6.704|57;Tourlaville|49.638|-1.566|50;Saint-Omer|50.748|2.261|62;Argentan|48.744|-0.020|61;Givors|45.591|4.769|69;Joinville-le-Pont|48.825|2.475|94;Carquefou|47.297|-1.492|44;Cestas|44.745|-0.682|33;Castelnau-le-Lez|43.636|3.901|34;Montigny-lès-Cormeilles|48.982|2.200|95;La Crau|43.150|6.074|83;Firminy|45.390|4.289|42;Orsay|48.696|2.187|91;Saint-Amand-les-Eaux|50.447|3.431|59;Le Pré-Saint-Gervais|48.885|2.404|93;Lucé|48.437|1.464|28;Les Clayes-sous-Bois|48.822|1.987|78;La Baule-Escoublac|47.292|-2.364|44;Sin-le-Noble|50.362|3.131|59;Toul|48.681|5.891|54;Villeneuve-le-Roi|48.737|2.401|94;Saint-Jean-de-la-Ruelle|47.911|1.865|45;Morlaix|48.578|-3.828|29;Montargis|47.997|2.733|45;Soisy-sous-Montmorency|48.988|2.302|95;Bischheim|48.616|7.753|67;Flers|48.737|-0.575|61;Marly-le-Roi|48.867|2.083|78;Lattes|43.568|3.903|34;Saint-Cyr-sur-Loire|47.400|0.667|37;Fos-sur-Mer|43.438|4.945|13;Arcueil|48.800|2.333|94;Lingolsheim|48.558|7.683|67;Vitré|48.123|-1.210|35;Vitry-le-François|48.725|4.584|51;Elbeuf|49.287|1.003|76;Pamiers|43.117|1.611|09;Montereau-Fault-Yonne|48.383|2.950|77;Tulle|45.266|1.772|19;L\'Isle-sur-la-Sorgue|43.920|5.051|84;Octeville|49.626|-1.643|50;Tassin-la-Demi-Lune|45.755|4.788|69;Bouguenais|47.179|-1.625|44;Verneuil-sur-Seine|48.974|1.965|78;Verrières-le-Buisson|48.746|2.268|91;Pontivy|48.068|-2.966|56;Le Vésinet|48.893|2.133|78;Sallanches|45.944|6.632|74;Montivilliers|49.545|0.188|76;Domont|49.028|2.326|95;Blanquefort|44.911|-0.638|33;Douarnenez|48.095|-4.329|29;Osny|49.070|2.063|95;Le Pecq|48.893|2.104|78;Guérande|47.328|-2.429|44;Floirac|44.831|-0.527|33;Saint-Cyr-l\'École|48.799|2.068|78;Laxou|48.684|6.149|54;Fontenay-le-Comte|46.467|-0.806|85;Moissy-Cramayel|48.626|2.601|77;Saran|47.950|1.876|45;Bry-sur-Marne|48.838|2.525|94;Cesson-Sévigné|48.121|-1.603|35;Le Pontet|43.961|4.860|84;Montbrison|45.608|4.065|42;Faches-Thumesnil|50.583|3.067|59;Viroflay|48.801|2.162|78;Les Sables-d\'Olonne|46.497|-1.785|85;Saint-Leu-la-Forêt|49.017|2.250|95;Saint-Fons|45.709|4.853|69;Landerneau|48.452|-4.252|29;Saint-Avertin|47.364|0.740|37;Châteaudun|48.071|1.338|28;Issoire|45.544|3.249|63;Gien|47.693|2.631|45;Bayeux|49.277|-0.704|14;Gentilly|48.813|2.342|94;Château-Thierry|49.046|3.403|02;Port-de-Bouc|43.407|4.981|13;Saint-Égrève|45.233|5.682|38;Villers-lès-Nancy|48.673|6.153|54;Brie-Comte-Robert|48.692|2.611|77;Boissy-Saint-Léger|48.751|2.512|94;Guéret|46.172|1.872|23;Chenôve|47.293|5.005|21;Lourdes|43.095|-0.046|65;Wittenheim|47.811|7.328|68;Canteleu|49.441|1.025|76;Haubourdin|50.608|2.991|59;Crépy-en-Valois|49.234|2.888|60;Berck-Plage|50.407|1.564|62;Les Herbiers|46.871|-1.016|85;Yutz|49.356|6.193|57;Outreau|50.705|1.590|62;Berck|50.400|1.600|62;Mayenne|48.303|-0.614|53;Audincourt|47.483|6.853|25;Balma|43.611|1.499|31;Hautmont|50.251|3.921|59;Lognes|48.835|2.630|77;Hayange|49.329|6.063|57;Tergnier|49.656|3.301|02;Carrières-sous-Poissy|48.950|2.041|78;Illzach|47.774|7.352|68;Pont-à-Mousson|48.907|6.056|54;Cugnaux|43.536|1.344|31;Éragny|49.017|2.100|95;Noisiel|48.849|2.624|77;Saint-Pierre-des-Corps|47.386|0.748|37;Coulommiers|48.815|3.085|77;Montesson|48.909|2.138|78;Saint-Maximin-la-Sainte-Baume|43.448|5.861|83;Noyon|49.583|3.000|60;Brignoles|43.406|6.062|83;Avon|48.402|2.720|77;Saint-Tropez|43.272|6.639|83;Sainte-Maxime|43.309|6.636|83;Villefranche-sur-Mer|43.704|7.311|06;Beausoleil|43.743|7.422|06;Roquebrune-Cap-Martin|43.763|7.470|06;Valbonne|43.642|7.009|06;Saint-Paul-de-Vence|43.697|7.122|06;Carros|43.789|7.186|06;Monaco|43.738|7.424|MC;Chamonix-Mont-Blanc|45.924|6.869|74;Deauville|49.357|0.070|14;Roissy-en-France|49.004|2.517|95;Marne-la-Vallée|48.836|2.642|77';
  const CITIES = RAW.split(';').map(r => { const [n, la, lo, d] = r.split('|'); return { n, la: +la, lo: +lo, d }; });

  const norm = s => String(s || '')
    .toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\(.*?\)/g, ' ')
    .replace(/\bcedex\b/g, ' ')
    .replace(/\b\d+\s*(e|er|eme)?\b/g, ' ')
    .replace(/[^a-z]+/g, ' ')
    .replace(/\bste\b/g, 'sainte').replace(/\bst\b/g, 'saint')
    .replace(/\s+/g, ' ').trim();

  const INDEX = new Map();
  CITIES.forEach(c => { const k = norm(c.n); if (!INDEX.has(k)) INDEX.set(k, c); });

  function findCity(q) {
    const k = norm(q);
    if (!k) return null;
    if (INDEX.has(k)) return INDEX.get(k);
    if (k.length < 4) return null;
    for (const c of CITIES) { if (norm(c.n).startsWith(k)) return c; } // la plus peuplée d'abord
    return null;
  }

  // Ville de la liste, écrite en entier : réponse immédiate, sans réseau.
  function findLocal(q) { const k = norm(q); return k ? (INDEX.get(k) || null) : null; }

  // Toutes les communes, adresses et codes postaux de France : Base Adresse
  // Nationale (service public gratuit, sans clé). Nouvelle adresse officielle
  // d'abord, l'ancienne en secours.
  const GEO = ['https://data.geopf.fr/geocodage/search', 'https://api-adresse.data.gouv.fr/search/'];
  const geoCache = new Map();
  async function geoFetch(params) {
    let lastErr = null;
    for (const base of GEO) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4500);
      try {
        const r = await fetch(base + '?' + new URLSearchParams(params).toString(), { signal: ctrl.signal });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return (await r.json()).features || [];
      } catch (e) { lastErr = e; } finally { clearTimeout(t); }
    }
    throw lastErr || new Error('indisponible');
  }
  // Renvoie un lieu { n, la, lo }, null si introuvable, ou 'panne' si le service ne répond pas.
  // Jamais de prix sur un lieu deviné : un nom de commune doit correspondre exactement
  // (« Berlin » ne devient pas « Berling ») ; sinon l'internaute choisit dans la liste
  // ou passe par l'application.
  const versLieu = f => ({ n: f.properties.city || f.properties.name, la: f.geometry.coordinates[1], lo: f.geometry.coordinates[0], d: T.departement({ cp: f.properties.postcode }) });
  const outreMer = f => /^9[78]/.test(String(f.properties.postcode || f.properties.citycode || ''));
  async function geocode(q) {
    const txt = String(q).trim().slice(0, 200);
    const key = txt.toLowerCase();
    if (geoCache.has(key)) return geoCache.get(key);
    const cp = (txt.match(/\b\d{5}\b/) || [])[0] || '';
    const nom = txt.replace(/\b\d{5}\b/, ' ').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
    let out = null;
    try {
      if (/\d/.test(nom)) {
        // Adresse complète (« 10 rue de Rivoli Paris ») : premier résultat fiable.
        const f = (await geoFetch({ q: txt, limit: '1' }))[0];
        if (f && Number(f.properties.score) >= 0.6 && !outreMer(f)) out = versLieu(f);
      } else if (!nom && cp) {
        // Code postal seul.
        const f = (await geoFetch({ q: cp, limit: '1', type: 'municipality' }))[0];
        if (f && !outreMer(f)) out = versLieu(f);
      } else if (norm(nom).length >= 2) {
        // Nom de commune, éventuellement avec son code postal (« Raismes (59590) »).
        const params = { q: nom, limit: '10', type: 'municipality' };
        if (cp) params.postcode = cp;
        const k = norm(nom);
        const memes = (await geoFetch(params)).filter(x => !outreMer(x) && norm(x.properties.name) === k);
        // Plusieurs communes du même nom (Montreuil, Saint-Martin…) : on demande laquelle.
        if (memes.length > 1 && !cp) out = { ambigu: memes.slice(0, 6).map(x => x.properties.name + ' (' + x.properties.postcode + ')') };
        else if (memes.length) out = versLieu(memes[0]);
      }
    } catch (e) { return 'panne'; }
    geoCache.set(key, out);
    return out;
  }
  async function resolvePlace(q) {
    const local = findLocal(q);
    if (local) return local;
    const g = await geocode(q);
    if (g === 'panne') return findCity(q) || 'panne'; // service muet : la liste locale dépanne
    return g;
  }

  const isCorse = c => c.la < 43.1 && c.lo > 8.4;

  function roadKm(a, b) {
    const R = 6371, rad = d => d * Math.PI / 180;
    const dLa = rad(b.la - a.la), dLo = rad(b.lo - a.lo);
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.la)) * Math.cos(rad(b.la)) * Math.sin(dLo / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(h)) * DETOUR);
  }

  // Prix Standard (plateau) ou convoyage pour un trajet a → b.
  function priceFor(mode, cat, km, rolling, a, b) {
    if (mode === 'convoyage') {
      const c = B.convoyage;
      return Math.max(c.minimum, km * (c.eur_per_km[CLASSE[cat]] || c.eur_per_km.voiture));
    }
    return T.prixStandard(V3, cat, km, rolling, T.departement(a), T.departement(b));
  }

  // Le convoyage suppose un véhicule qui roule et qui se conduit (voiture ou utilitaire).
  function convoyagePossible(cat, rolling) { return rolling && (CLASSE[cat] === 'voiture' || cat === 'utilitaire'); }

  // Exposé pour les tests uniquement.
  window.__secotoSim = { findCity, findLocal, resolvePlace, roadKm, priceFor, convoyagePossible, norm, count: CITIES.length, cities: CITIES };

  const $ = id => document.getElementById(id);
  const form = $('sim'); if (!form) return;
  const fFrom = $('sim-from'), fTo = $('sim-to');
  const go = $('sim-go'), res = $('sim-result');
  const eur = n => Math.round(n).toLocaleString('fr-FR') + ' €';

  // Liste de suggestions (datalist) remplie après le premier affichage.
  const dl = $('sim-cities');
  function fillList(names) {
    const frag = document.createDocumentFragment(), seen = new Set();
    names.forEach(n => { if (!n || seen.has(n)) return; seen.add(n); const o = document.createElement('option'); o.value = n; frag.appendChild(o); });
    dl.replaceChildren(frag);
  }
  requestAnimationFrame(() => fillList(CITIES.map(c => c.n)));
  let suggestTimer = null, suggestSeq = 0;
  function suggest(input) {
    clearTimeout(suggestTimer);
    const q = input.value.trim();
    if (q.replace(/\s/g, '').length < 3 || findLocal(q)) return;
    suggestTimer = setTimeout(async () => {
      const seq = ++suggestSeq;
      try {
        const feats = await geoFetch({ q, limit: '6', autocomplete: '1', type: 'municipality' });
        if (seq !== suggestSeq) return;
        const ban = feats.map(f => f.properties.city + (f.properties.postcode ? ' (' + f.properties.postcode + ')' : ''));
        const k = norm(q);
        const local = k.length >= 2 ? CITIES.filter(c => norm(c.n).startsWith(k)).slice(0, 4).map(c => c.n) : [];
        if (ban.length || local.length) fillList([...ban, ...local]);
      } catch (e) { /* la liste locale reste en place */ }
    }, 250);
  }

  function setErr(input, msg) {
    $(input.id + '-err').textContent = msg || '';
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }

  let shown = false;

  // Le client choisit sa prestation ; le plateau s'impose quand le convoyage est impossible.
  function syncMode(convoyable, cat, rolling) {
    const radios = form.querySelectorAll('input[name="sim-mode"]');
    const conv = form.querySelector('input[name="sim-mode"][value="convoyage"]');
    const plat = form.querySelector('input[name="sim-mode"][value="plateau"]');
    const hint = $('sim-mode-hint');
    conv.disabled = !convoyable;
    if (!convoyable) {
      plat.checked = true;
      hint.textContent = !rolling
        ? 'Véhicule non roulant : seul le plateau est possible.'
        : (cat === 'moto' ? 'Une moto voyage toujours sur plateau.' : cat === 'camping_car' ? 'Un camping-car voyage sur plateau.' : 'Une caravane voyage toujours sur plateau.');
      hint.hidden = false;
    } else {
      hint.hidden = true;
      hint.textContent = '';
    }
    const checked = Array.prototype.find.call(radios, r => r.checked);
    return checked ? checked.value : 'plateau';
  }

  const fb = $('sim-fallback'), fbTxt = $('sim-fallback-txt'), fbLink = $('sim-fallback-link');
  const GO_LABEL = go.textContent;
  function busy(on) {
    go.disabled = on;
    go.setAttribute('aria-busy', on ? 'true' : 'false');
    go.textContent = on ? 'Calcul de votre prix…' : GO_LABEL;
  }
  // Un lieu reste introuvable (étranger, faute de frappe) : pas d'impasse,
  // le prix exact se calcule dans l'app, trajet déjà rempli.
  function showFallback(msg) {
    const mode = (form.querySelector('input[name="sim-mode"]:checked') || {}).value || 'convoyage';
    fbTxt.textContent = msg;
    fbLink.href = lienApp({ service: mode, from: fFrom.value.trim(), to: fTo.value.trim() });
    fb.hidden = false;
  }

  let seq = 0;
  async function compute(fromSubmit) {
    const mySeq = ++seq;
    const cat = $('sim-cat').value || 'berline';
    const rolling = ((form.querySelector('input[name="sim-roll"]:checked') || {}).value || '1') === '1';
    fb.hidden = true;
    let bad = null;
    if (!fFrom.value.trim()) { setErr(fFrom, 'Indiquez le lieu de départ.'); bad = bad || fFrom; }
    if (!fTo.value.trim()) { setErr(fTo, 'Indiquez le lieu d’arrivée.'); bad = bad || fTo; }
    if (bad) {
      res.hidden = true; go.hidden = false; shown = false; publish(null);
      if (fromSubmit) bad.focus();
      return;
    }

    const lent = !findLocal(fFrom.value) || !findLocal(fTo.value);
    if (lent) busy(true);
    let a, b;
    try { [a, b] = await Promise.all([resolvePlace(fFrom.value), resolvePlace(fTo.value)]); }
    finally { if (lent && mySeq === seq) busy(false); }
    if (mySeq !== seq) return; // une saisie plus récente a pris le relais

    const ambigu = [[fFrom, a], [fTo, b]].find(([, x]) => x && x.ambigu);
    if (ambigu) {
      const [champ, x] = ambigu;
      fillList(x.ambigu);
      setErr(champ, 'Plusieurs communes portent ce nom : choisissez la vôtre, par exemple « ' + x.ambigu[0] + ' ».');
      res.hidden = true; go.hidden = false; shown = false; publish(null);
      if (fromSubmit) champ.focus();
      return;
    }

    const panne = a === 'panne' || b === 'panne';
    if (a && a !== 'panne') setErr(fFrom, ''); else setErr(fFrom, a === 'panne' ? '' : 'Lieu introuvable en France.');
    if (b && b !== 'panne') setErr(fTo, ''); else setErr(fTo, b === 'panne' ? '' : 'Lieu introuvable en France.');
    if (!a || !b || panne) {
      // Une seule action principale à l'écran : le bouton de secours remplace « Voir mon prix ».
      res.hidden = true; go.hidden = true; shown = false; publish(null);
      showFallback(panne
        ? 'La recherche d’adresse ne répond pas pour le moment. Votre prix exact s’obtient en une minute dans l’application.'
        : 'Trajet hors de France ou lieu non reconnu ? Votre prix exact s’obtient en une minute dans l’application, trajet déjà rempli.');
      return;
    }

    if (isCorse(a) !== isCorse(b)) {
      setErr(fTo, 'Trajet avec traversée maritime : votre prix exact se calcule dans l’application, ou au 07 83 27 82 31.');
      res.hidden = true; go.hidden = false; shown = false; publish(null);
      if (fromSubmit) fTo.focus();
      return;
    }

    // Le lieu tapé reste affiché tel quel (adresse, code postal) : seul le prix change.

    const km = (a === b || (a.la === b.la && a.lo === b.lo)) ? 0 : roadKm(a, b);
    const convoyable = convoyagePossible(cat, rolling);
    const mode = syncMode(convoyable, cat, rolling);
    const price = Math.round(priceFor(mode, cat, km, rolling, a, b));
    const plateau = mode === 'plateau';

    $('sim-price').textContent = eur(price);
    $('sim-price-label').textContent = plateau ? 'Standard · sous ' + Math.round(V3.standard.delai_h / 24) + ' jours' : 'Estimation';
    const trajet = km === 0 ? a.n + ' (trajet local)' : a.n + ' → ' + b.n + ' · env. ' + km.toLocaleString('fr-FR') + ' km';
    const grand = cat === 'caravane' || cat === 'camping_car';
    $('sim-detail').textContent = trajet + ' · ' + (plateau
      ? 'Transport sur plateau' + (rolling ? '' : ', véhicule non roulant inclus') + ', péages inclus'
        + (grand ? '. + ' + V3.caravane.poids_majoration_pct + ' % au-delà de ' + (V3.caravane.poids_majore_kg / 1000).toLocaleString('fr-FR') + ' t, + ' + V3.caravane.longueur_majoration_pct + ' % au-delà de ' + V3.caravane.longueur_majoree_m.toLocaleString('fr-FR') + ' m, sur devis au-delà de ' + (V3.caravane.poids_max_kg / 1000).toLocaleString('fr-FR') + ' t' : '')
      : 'Convoyage par chauffeur, carburant et péages inclus');

    // Plateau : les trois offres de l'app (Express, Standard, Éco).
    const offres = $('sim-offres');
    offres.replaceChildren();
    if (plateau && km > 0) {
      const ligne = (titre, sous, prix) => {
        const li = document.createElement('li');
        const g = document.createElement('span'); g.textContent = titre;
        const s2 = document.createElement('small'); s2.textContent = sous; g.appendChild(s2);
        const p = document.createElement('strong'); p.textContent = eur(prix);
        li.append(g, p); offres.appendChild(li);
      };
      ligne('Express', 'prise en charge sous ' + V3.express.delai_h + ' h, obligatoire pour un départ dans moins de ' + V3.express.delai_h + ' h', T.prixExpress(V3, price, cat));
      const eco = T.offreEco(V3, cat, km, rolling, a, b, price);
      if (eco) ligne('Éco', 'de ville à ville : dépôt à ' + eco.depot + ', retrait à ' + eco.retrait + ', sous ' + Math.round(V3.eco.delai_h / 24) + ' jours', eco.prix);
      offres.hidden = false;
    } else offres.hidden = true;

    const alt = $('sim-alt');
    if (convoyable) {
      alt.textContent = mode === 'convoyage'
        ? 'Convoyage : un chauffeur conduit votre véhicule, assuré et en état de circuler. Sur plateau (Standard) : ' + eur(priceFor('plateau', cat, km, true, a, b)) + '.'
        : 'Plateau : votre véhicule est chargé, aucun kilomètre ajouté au compteur. En convoyage : ' + eur(priceFor('convoyage', cat, km, true, a, b)) + '.';
      alt.hidden = false;
    } else alt.hidden = true;

    const url = lienApp({ service: mode, from: a.n, to: b.n });
    $('sim-book').href = url;
    $('sim-book').textContent = 'Réserver à ' + eur(price);

    go.hidden = true; res.hidden = false;
    publish({ price, url, label: 'Réserver à ' + eur(price) });

    if (fromSubmit || !shown) {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      const r = res.getBoundingClientRect();
      if (r.bottom > window.innerHeight - 8 || r.top < 70) res.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    shown = true;
  }

  // Informe le reste de la page (CTA répétés, barre mobile) du prix affiché.
  function publish(detail) { window.dispatchEvent(new CustomEvent('secoto:price', { detail })); }

  form.addEventListener('submit', e => { e.preventDefault(); compute(true); });
  // Pages trajet : départ et arrivée déjà remplis, le prix s'affiche sans clic ni défilement.
  if (form.dataset.auto === '1' && fFrom.value.trim() && fTo.value.trim()) { shown = true; compute(false); }
  fFrom.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); fTo.focus(); } });
  // Une fois le prix affiché, il suit les modifications sans nouveau clic.
  form.addEventListener('change', e => {
    if (e.target.type !== 'radio' && e.target.id !== 'sim-cat') return;
    // Les options impossibles se désactivent tout de suite, avant même le premier calcul.
    const cat = $('sim-cat').value || 'berline';
    const rolling = ((form.querySelector('input[name="sim-roll"]:checked') || {}).value || '1') === '1';
    syncMode(convoyagePossible(cat, rolling), cat, rolling);
    if (shown) compute(false);
  });
  // Pendant la frappe : pas de message d'erreur, on attend deux villes reconnues.
  [fFrom, fTo].forEach(f => f.addEventListener('input', () => {
    if (f.getAttribute('aria-invalid')) setErr(f, '');
    if (!fb.hidden) { fb.hidden = true; go.hidden = false; }
    suggest(f);
    if (!shown) return;
    if (findLocal(fFrom.value) && findLocal(fTo.value)) compute(false);
    else { seq++; res.hidden = true; go.hidden = false; shown = false; publish(null); }
  }));
})();
