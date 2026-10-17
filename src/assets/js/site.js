// Site vitrine SECOTO — interactions communes à toutes les pages.
// Tout le contenu est déjà dans le HTML : ce script n'ajoute que du confort.
(() => {
  'use strict';

  const APP = 'https://app.secoto-transport.fr/';

  /* ── Provenance de la visite, transmise à l'app (tableau Acquisition) ──
     - campagne payante (gclid, utm_* reçus) : transmise telle quelle ;
     - arrivée depuis Google sans gclid : « Google naturel » ;
     - sinon : « Site » (utm déjà présents sur chaque lien).
     Conservée dans l'onglet le temps de la visite (aucun cookie). */
  const CLES_PAYANT = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid'];
  const CLES_UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const GOOGLE = /^https?:\/\/(www\.)?google\.[a-z.]{2,8}(\/|$)/i;
  const lireProv = () => { try { return JSON.parse(sessionStorage.getItem('secoto_prov') || 'null'); } catch (e) { return null; } };
  const ecrireProv = v => { try { sessionStorage.setItem('secoto_prov', JSON.stringify(v)); } catch (e) { /* navigation privée : sans effet */ } };
  let prov = lireProv();
  (() => {
    const q = new URLSearchParams(location.search);
    const recus = {};
    [...CLES_PAYANT, ...CLES_UTM].forEach(k => { const v = q.get(k); if (v) recus[k] = v.slice(0, 200); });
    if (Object.keys(recus).length) { prov = { type: 'campagne', params: recus }; ecrireProv(prov); return; }
    if (!prov && GOOGLE.test(document.referrer || '')) { prov = { type: 'google-naturel' }; ecrireProv(prov); }
  })();

  // Complète un lien vers l'app avec la provenance de la visite.
  window.secotoProvenance = function (href) {
    if (!prov || typeof href !== 'string' || href.indexOf(APP) !== 0) return href;
    try {
      const u = new URL(href);
      if (prov.type === 'google-naturel') u.searchParams.set('utm_content', 'google-naturel');
      else if (prov.type === 'campagne') {
        const p = prov.params || {};
        if (p.utm_source) CLES_UTM.forEach(k => { if (p[k]) u.searchParams.set(k, p[k]); else u.searchParams.delete(k); });
        CLES_PAYANT.forEach(k => { if (p[k]) u.searchParams.set(k, p[k]); });
      }
      return u.toString();
    } catch (e) { return href; }
  };
  const marquerLiens = () => document.querySelectorAll('a[href^="' + APP + '"]').forEach(a => {
    a.href = window.secotoProvenance(a.getAttribute('href'));
  });
  marquerLiens();

  /* ── CTA principal unique : « Voir mon prix en 30 secondes » ──
     Avant le prix : ramène au simulateur et place le curseur dans le premier champ vide.
     Après le prix : devient « Réserver à X € » partout. */
  const LIBELLE = 'Voir mon prix en 30 secondes';
  let reservation = null;
  const ctas = () => document.querySelectorAll('.js-main-cta');
  window.addEventListener('secoto:price', e => {
    reservation = e.detail || null;
    ctas().forEach(a => {
      a.textContent = reservation ? reservation.label : LIBELLE;
      a.setAttribute('href', reservation ? reservation.url : (document.getElementById('simulateur') ? '#simulateur' : '/#simulateur'));
    });
  });
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('.js-main-cta');
    const sim = document.getElementById('simulateur');
    if (!a || reservation || !sim) return;
    e.preventDefault();
    const de = document.getElementById('sim-from'), vers = document.getElementById('sim-to');
    const cible = !de.value.trim() ? de : (!vers.value.trim() ? vers : document.getElementById('sim-go'));
    sim.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => cible.focus({ preventScroll: true }), 450);
  });

  /* ── Barre mobile : masquée pendant la saisie (clavier ouvert) ── */
  const champ = el => el && el.matches && el.matches('input:not([type=radio]):not([type=hidden]),select,textarea');
  document.addEventListener('focusin', e => { if (champ(e.target)) document.body.classList.add('typing'); });
  document.addEventListener('focusout', () => setTimeout(() => {
    if (!champ(document.activeElement)) document.body.classList.remove('typing');
  }, 50));

  /* ── Bouton de l'en-tête : visible quand le simulateur est hors de l'écran ── */
  const simEl = document.getElementById('simulateur');
  if (simEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => document.body.classList.toggle('sim-visible', en.isIntersecting), { threshold: 0.15 }).observe(simEl);
  }

  const pointeurFin = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mouvementReduit = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Curseur personnalisé : ordinateur uniquement ── */
  const dot = document.getElementById('cursor-dot'), ring = document.getElementById('cursor-ring');
  if (dot && ring && pointeurFin && !mouvementReduit) {
    document.body.classList.add('curseur-perso');
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function anim() {
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(anim);
    })();
    document.addEventListener('mouseover', e => {
      document.body.classList.toggle('cursor-hover', !!(e.target.closest && e.target.closest('a, button, label, .tilt-card, .step-card, .why-card')));
    }, { passive: true });
  }

  /* ── En-tête au défilement + retour en haut ── */
  const hdr = document.getElementById('hdr'), btt = document.getElementById('btt');
  let attente = false;
  window.addEventListener('scroll', () => {
    if (attente) return;
    attente = true;
    requestAnimationFrame(() => {
      const s = window.scrollY;
      if (hdr) hdr.classList.toggle('scrolled', s > 40);
      if (btt) btt.classList.toggle('on', s > 500);
      attente = false;
    });
  }, { passive: true });

  /* ── Menu mobile ── */
  const hbg = document.getElementById('hbg'), nav = document.getElementById('nav');
  if (hbg && nav) {
    const fermer = () => { hbg.setAttribute('aria-expanded', 'false'); hbg.classList.remove('open'); nav.removeAttribute('data-open'); hbg.setAttribute('aria-label', 'Ouvrir le menu'); };
    hbg.addEventListener('click', () => {
      const ouvert = hbg.getAttribute('aria-expanded') === 'true';
      if (ouvert) return fermer();
      hbg.setAttribute('aria-expanded', 'true'); hbg.classList.add('open'); nav.setAttribute('data-open', '1');
      hbg.setAttribute('aria-label', 'Fermer le menu');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', fermer));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.hasAttribute('data-open')) { fermer(); hbg.focus(); } });
  }

  /* ── Thème clair / sombre ── */
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const html = document.documentElement;
    html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ── Apparition au défilement (contenu déjà présent dans le HTML) ── */
  const reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || mouvementReduit) reveals.forEach(r => r.classList.add('in'));
  else {
    const ro = new IntersectionObserver(entrees => entrees.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); }
    }), { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    reveals.forEach(r => ro.observe(r));
  }

  /* ── Cartes inclinées : ordinateur uniquement ── */
  if (pointeurFin && !mouvementReduit) document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, cx = r.width / 2, cy = r.height / 2;
      card.style.transform = `perspective(800px) rotateX(${-((y - cy) / cy) * 6}deg) rotateY(${((x - cx) / cx) * 9}deg) translateZ(6px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  /* ── FAQ : boutons natifs (clavier et lecteurs d'écran) ── */
  document.querySelectorAll('.faq-q').forEach(btn => btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const ouvert = item.classList.contains('open');
    item.parentElement.querySelectorAll('.faq-item.open').forEach(i => {
      i.classList.remove('open'); i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });
    if (!ouvert) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
  }));

  /* ── Demande sur mesure → Supabase (table mission_requests, clé publique) ── */
  const SUPA_URL = 'https://znnigxmzacukpfueqfrh.supabase.co';
  const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubmlneG16YWN1a3BmdWVxZnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyODQ2NzgsImV4cCI6MjA5MTg2MDY3OH0.YNnKgsxm5AoorOsk-FVRWBgP2AVFI6rZKSmlbUSsfXo';
  let service = 'auto';
  document.querySelectorAll('[data-service]').forEach(btn => btn.addEventListener('click', () => {
    service = btn.dataset.service;
    document.querySelectorAll('[data-service]').forEach(b => {
      const actif = b.dataset.service === service;
      b.classList.toggle('active', actif); b.setAttribute('aria-selected', String(actif));
    });
    const auto = document.getElementById('block-auto'), moto = document.getElementById('block-moto');
    if (auto) auto.hidden = service !== 'auto';
    if (moto) moto.hidden = service !== 'moto';
  }));

  const devis = document.getElementById('devis-form');
  if (devis) devis.addEventListener('submit', e => {
    e.preventDefault();
    const g = id => (document.getElementById(id)?.value || '').trim();
    const msg = document.getElementById('fs');
    const dire = (texte, erreur) => { msg.textContent = texte; msg.classList.toggle('form-erreur', !!erreur); msg.style.display = 'block'; };
    const tel = g('f-tel');
    if (tel.replace(/\D/g, '').length < 6) {
      dire('Indiquez un numéro de téléphone valide pour que nous puissions vous répondre.', true);
      document.getElementById('f-tel').focus();
      return;
    }
    const nom = [g('f-prenom'), g('f-nom')].filter(Boolean).join(' ') || 'Client web';
    let vehicule = '', notes = '';
    if (service === 'auto') {
      vehicule = [g('f-marque-auto'), g('f-modele-auto')].filter(Boolean).join(' ');
      notes = g('f-info-auto');
    } else {
      const nb = g('f-nb-motos');
      const types = { moto: 'Moto', scooter: 'Scooter / 50cc', quad: 'Quad', 'auto-non-roulante': 'Voiture non roulante', 'auto-prestige': 'Voiture prestige / collection', autre: 'Autre' };
      vehicule = [(nb && nb !== '1' ? nb + ' véhicules' : ''), types[g('f-type-plateau')] || '', g('f-marque-moto'), g('f-modele-moto')].filter(Boolean).join(' ');
      notes = g('f-info-moto');
    }
    const societe = g('f-societe');
    const ligne = {
      public_ref: 'REQ-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      type: service === 'moto' ? 'plateau' : 'convoyage',
      status: 'pending',
      from_city: g('f-depart') || null,
      to_city: g('f-arrivee') || null,
      mission_date: g('f-date') || null,
      vehicle: vehicule || null,
      distance_km: g('f-km') ? Number(g('f-km')) : null,
      client_name: societe ? nom + ' (' + societe + ')' : nom,
      client_contact: g('f-email') || null,
      client_phone: tel,
      price_mode: 'fixed',
      notes: notes || null,
      created_by_role: 'guest',
      requester_id: null,
      requester_name: nom
    };
    const btn = devis.querySelector('button[type="submit"]');
    const libelle = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }
    fetch(SUPA_URL + '/rest/v1/mission_requests', {
      method: 'POST',
      headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(ligne)
    }).then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      dire('✓ Demande envoyée ! Nous vous recontactons rapidement au ' + tel + '.');
      devis.querySelectorAll('input,select,textarea,button').forEach(f => { f.disabled = true; });
      msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }).catch(() => {
      dire('L’envoi n’a pas abouti. Réessayez, ou appelez-nous au 07 83 27 82 31.', true);
      if (btn) { btn.disabled = false; btn.textContent = libelle; }
    });
  });

  /* ── Contact : ouvre la messagerie avec le message prêt ── */
  const contact = document.getElementById('contact-form');
  if (contact) contact.addEventListener('submit', e => {
    e.preventDefault();
    const g = id => (document.getElementById(id)?.value || '').trim();
    const sujet = encodeURIComponent('Contact site — ' + [g('c-prenom'), g('c-nom')].filter(Boolean).join(' '));
    const corps = encodeURIComponent(g('c-message') + '\n\nE-mail : ' + g('c-email'));
    window.location.href = 'mailto:contact.secoto@gmail.com?subject=' + sujet + '&body=' + corps;
  });
})();
