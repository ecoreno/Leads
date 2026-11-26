/* AJM Courtage — interactions communes (aucune dépendance) */
(function () {
  'use strict';

  /* ---- En-tête : ombre au scroll ---- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Menu mobile ---- */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- Méga-menu « Nos assurances » ---- */
  var trigger = document.querySelector('.nav-trigger');
  var mega = document.getElementById('mega');
  function closeMega() {
    if (!trigger || !mega) return;
    mega.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  }
  if (trigger && mega) {
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = mega.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.menu-wrap')) closeMega();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeMega(); trigger.focus(); }
    });
    var wrap = trigger.closest('.menu-wrap');
    if (wrap && window.matchMedia('(hover:hover) and (min-width:921px)').matches) {
      var t;
      wrap.addEventListener('mouseenter', function () {
        clearTimeout(t); mega.classList.add('open'); trigger.setAttribute('aria-expanded', 'true');
      });
      wrap.addEventListener('mouseleave', function () { t = setTimeout(closeMega, 160); });
    }
  }

  /* ---- Carte de comparaison (onglets produits) ---- */
  var tabs = document.querySelectorAll('.tab');
  if (tabs.length) {
    var sub = document.getElementById('compare-sub');
    var besoin = document.getElementById('compare-besoin');
    var select = function (tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      if (sub) sub.textContent = tab.getAttribute('data-sub');
      if (besoin) besoin.value = tab.getAttribute('data-id');
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); n.focus(); select(n); }
      });
    });
    var first = document.querySelector('.tab[aria-selected="true"]') || tabs[0];
    select(first);
  }

  /* ---- Validation du code postal (carte de comparaison) ---- */
  var cmpForm = document.getElementById('compare-form');
  if (cmpForm) {
    cmpForm.addEventListener('submit', function (e) {
      var cp = cmpForm.querySelector('[name="cp"]');
      var field = cp.closest('.field');
      var ok = /^\d{5}$/.test(cp.value.trim());
      field.classList.toggle('invalid', !ok);
      if (!ok) { e.preventDefault(); cp.focus(); }
    });
  }

  /* ---- Formulaire de rappel (Netlify Forms, envoi sans rechargement) ---- */
  var cb = document.getElementById('callback-form');
  if (cb) {
    cb.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('callback-msg');
      var tel = cb.querySelector('[name="telephone"]');
      var field = tel.closest('.field');
      var ok = /^[\d\s.+()-]{9,18}$/.test(tel.value.trim());
      field.classList.toggle('invalid', !ok);
      if (!ok) { tel.focus(); return; }
      var btn = cb.querySelector('button[type="submit"]');
      btn.disabled = true;
      var body = new URLSearchParams(new FormData(cb)).toString();
      var post = function (u) { return fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body }).then(function (r) { if (!r.ok && !r.redirected) throw new Error('http ' + r.status); }); };
      post('/').catch(function () { return post(window.location.pathname); })
      .then(function () {
        if (false) throw 0;
        cb.innerHTML = '<div class="success"><div class="okc"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h2 style="font-size:22px;margin-bottom:8px">Demande de rappel envoyée</h2><p style="margin:0 auto">Un conseiller AJM Courtage vous recontacte sous quelques jours ouvrés.</p></div>';
      }).catch(function () {
        btn.disabled = false;
        if (msg) { msg.className = 'form-alert err show'; msg.textContent = "L'envoi n'a pas abouti. Merci de réessayer dans un instant."; }
      });
    });
  }

  /* ---- Apparition douce des blocs ---- */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && items.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }
})();
