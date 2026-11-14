// 146 : simulateur Navette Pro (page Professionnels). Même règle que l'app :
// prix pro = prix par voiture de l'axe ; proposé seulement si moins cher que
// le Standard. Le SIREN (9 chiffres) débloque l'affichage du prix ; il n'est
// ni envoyé ni enregistré.
(() => {
  'use strict';
  const B = (() => { try { return JSON.parse(document.getElementById('secoto-bareme').textContent); } catch (e) { return null; } })();
  const T = window.SecotoTarif, S = window.__secotoSim;
  const form = document.getElementById('simpro');
  if (!form || !B || !B.v3 || !T || !S) return;
  const V3 = B.v3, N = V3.navette_pro;
  const APP_URL = 'https://app.secoto-transport.fr/';
  const $ = id => document.getElementById(id);
  const eur = n => Math.round(n).toLocaleString('fr-FR') + ' €';

  // Belgique et Allemagne : grandes villes (le simulateur français ne couvre que la France).
  const ETRANGER = [
    ['Bruxelles', 50.847, 4.357, 'BE', 'brussel brussels'], ['Anvers', 51.220, 4.402, 'BE', 'antwerpen antwerp'], ['Gand', 51.054, 3.717, 'BE', 'gent ghent'],
    ['Liège', 50.633, 5.567, 'BE', 'luik'], ['Charleroi', 50.411, 4.444, 'BE', ''], ['Namur', 50.467, 4.867, 'BE', ''], ['Bruges', 51.209, 3.224, 'BE', 'brugge'],
    ['Mons', 50.454, 3.952, 'BE', 'bergen'], ['Louvain', 50.879, 4.701, 'BE', 'leuven'],
    ['Cologne', 50.938, 6.960, 'DE', 'koln koeln'], ['Düsseldorf', 51.227, 6.774, 'DE', 'dusseldorf duesseldorf'], ['Francfort', 50.110, 8.682, 'DE', 'frankfurt'],
    ['Stuttgart', 48.776, 9.183, 'DE', ''], ['Munich', 48.137, 11.575, 'DE', 'munchen muenchen'], ['Berlin', 52.520, 13.405, 'DE', ''],
    ['Hambourg', 53.551, 9.994, 'DE', 'hamburg'], ['Aix-la-Chapelle', 50.776, 6.084, 'DE', 'aachen'], ['Bonn', 50.737, 7.098, 'DE', ''],
    ['Essen', 51.456, 7.012, 'DE', ''], ['Dortmund', 51.514, 7.468, 'DE', ''], ['Mannheim', 49.488, 8.466, 'DE', ''], ['Karlsruhe', 49.007, 8.404, 'DE', ''],
    ['Sarrebruck', 49.240, 6.997, 'DE', 'saarbrucken saarbruecken'], ['Nuremberg', 49.452, 11.077, 'DE', 'nurnberg nuernberg'], ['Hanovre', 52.375, 9.732, 'DE', 'hannover'],
    ['Brême', 53.079, 8.802, 'DE', 'bremen'], ['Leipzig', 51.340, 12.375, 'DE', ''], ['Fribourg-en-Brisgau', 47.999, 7.842, 'DE', 'freiburg'],
    ['Wiesbaden', 50.083, 8.240, 'DE', ''], ['Mayence', 49.993, 8.247, 'DE', 'mainz'],
  ].map(([n, la, lo, pays, alias]) => ({ n, la, lo, pays, cles: [S.norm(n), ...alias.split(' ').filter(Boolean)] }));
  const etranger = q => { const k = S.norm(q); return k ? ETRANGER.find(v => v.cles.includes(k)) || null : null; };

  // Suggestions : villes françaises du simulateur + Belgique / Allemagne.
  requestAnimationFrame(() => {
    const dl = $('simpro-villes'), frag = document.createDocumentFragment();
    [...S.cities.map(c => c.n), ...ETRANGER.map(v => v.n)].forEach(n => { const o = document.createElement('option'); o.value = n; frag.appendChild(o); });
    dl.replaceChildren(frag);
  });

  // SIREN : 9 chiffres (espaces, points ou tirets acceptés). Aucun autre
  // contrôle : l'inscription pro donne un accès immédiat.
  function sirenValide(v) {
    return /^\d{9}$/.test(String(v || '').replace(/[\s.-]/g, ''));
  }

  async function lieu(champ) {
    const q = champ.value.trim();
    if (!q) return { erreur: 'Indiquez une ville.' };
    const e = etranger(q);
    if (e) return { n: e.n, la: e.la, lo: e.lo, pays: e.pays, d: '' };
    const p = await S.resolvePlace(q);
    if (p === 'panne') return { erreur: 'Recherche d’adresse indisponible : réessayez dans un instant.' };
    if (!p) return { erreur: 'Ville introuvable.' };
    if (p.ambigu) return { erreur: 'Plusieurs communes portent ce nom : ajoutez le code postal.' };
    return { n: p.n, la: p.la, lo: p.lo, d: p.d, pays: p.d === 'MC' ? 'MC' : 'FR' };
  }
  const setErr = (id, msg) => { const el = $(id + '-err'); el.textContent = msg || ''; const f = $(id); if (msg) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid'); };
  const lien = (params) => {
    const q = new URLSearchParams({ compte: 'pro', service: 'plateau', ...params, utm_source: 'site', utm_medium: 'organic_page', utm_campaign: 'professionnels' });
    const url = APP_URL + '?' + q.toString();
    return window.secotoProvenance ? window.secotoProvenance(url) : url;
  };

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const res = $('simpro-result');
    ['simpro-from', 'simpro-to', 'simpro-siren'].forEach(id => setErr(id, ''));
    if (!sirenValide($('simpro-siren').value)) {
      res.hidden = true;
      const chiffres = $('simpro-siren').value.replace(/\D/g, '');
      setErr('simpro-siren', 'Entrez les 9 chiffres du SIREN de votre entreprise (vous en avez saisi ' + chiffres.length + '). Sinon, consultez les exemples de trajets plus bas.');
      $('simpro-siren').focus();
      return;
    }
    const go = $('simpro-go'); go.disabled = true;
    let a, b;
    try { [a, b] = await Promise.all([lieu($('simpro-from')), lieu($('simpro-to'))]); } finally { go.disabled = false; }
    if (a.erreur || b.erreur) { if (a.erreur) setErr('simpro-from', a.erreur); if (b.erreur) setErr('simpro-to', b.erreur); res.hidden = true; return; }

    const cat = $('simpro-cat').value, n = +$('simpro-n').value || 1;
    const km = S.roadKm(a, b);
    const axe = N && N.actif ? T.axeNavette(V3, a, b, km) : null;
    const dep = l => (l.pays === 'FR' ? l.d : l.pays === 'MC' ? '06' : '');
    const standard1 = T.prixStandard(V3, cat, km, true, dep(a), dep(b));
    const prix = axe ? T.prixNavette(axe, cat, n) : null;
    const trajet = a.n + ' → ' + b.n + ' · env. ' + km.toLocaleString('fr-FR') + ' km';
    $('simpro-book').href = lien({ from: a.n, to: b.n });

    if (prix != null && (standard1 == null || T.prixNavette(axe, cat, 1) < standard1)) {
      $('simpro-label').textContent = (N.libelle || 'Navette Pro') + ' · ' + n + (n > 1 ? ' voitures' : ' voiture');
      $('simpro-price').textContent = eur(prix);
      $('simpro-detail').textContent = trajet + ' · ' + (n > 1 ? n + ' × ' + eur(prix / n) + ' par voiture' : 'prix par voiture')
        + ' · porte à porte, prise en charge sous ' + Math.round(N.fenetre_h / 24) + ' jours'
        + (standard1 && a.pays === 'FR' && b.pays === 'FR' ? ' · prix public Standard : ' + eur(standard1) + ' par voiture' : '');
    } else {
      $('simpro-label').textContent = 'Prix Standard · par voiture';
      $('simpro-price').textContent = standard1 ? eur(standard1) : 'Prix dans l’app';
      $('simpro-detail').textContent = trajet + ' · ' + (axe
        ? 'sur ce trajet, le prix Standard est le plus avantageux : il vous est proposé dans l’application (remise dès le 2e véhicule).'
        : 'trajet hors des axes ' + (N && N.axes ? N.axes.map(x => x.nom).join(' et ') : 'Navette Pro') + ' : votre compte pro affiche vos prix Standard et Express.');
    }
    res.hidden = false;
    res.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('simpro-siren').addEventListener('input', () => setErr('simpro-siren', ''));
})();
