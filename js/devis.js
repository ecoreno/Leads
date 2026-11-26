/* AJM Courtage — formulaire de devis multi-besoins (3 étapes) */
(function () {
  'use strict';

  var form = document.getElementById('devis-form');
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll('.form-step[data-step]'));
  var progress = document.querySelectorAll('.progress li');
  var alertBox = document.getElementById('form-alert');
  var current = 1;

  var PRIO = { 1: 'Faible', 2: 'Moyenne', 3: 'Importante', 4: 'Essentielle' };
  var NEED_LABELS = {};
  form.querySelectorAll('input[name="besoins"]').forEach(function (i) { NEED_LABELS[i.value] = i.getAttribute('data-label'); });

  /* ---------- Brouillon : on ne perd jamais la saisie (session du navigateur) ---------- */
  var DRAFT = 'ajm_devis_draft_v1';
  function store(fn) { try { return fn(window.sessionStorage); } catch (e) { return null; } }
  function saveDraft() {
    var d = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.name === 'bot-field' || el.name === 'form-name' || el.name === 'resume' || el.name === 'consentement') return;
      if (el.type === 'checkbox' || el.type === 'radio') { if (el.checked) (d[el.name] = d[el.name] || []).push(el.value); }
      else d[el.name] = [el.value];
    });
    store(function (st) { st.setItem(DRAFT, JSON.stringify(d)); });
  }
  function restoreDraft() {
    var raw = store(function (st) { return st.getItem(DRAFT); });
    if (!raw) return;
    var d; try { d = JSON.parse(raw); } catch (e) { return; }
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || !d[el.name]) return;
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = d[el.name].indexOf(el.value) > -1;
      else if (typeof d[el.name][0] === 'string') el.value = d[el.name][0];
    });
  }
  restoreDraft();

  /* ---------- Navigation entre étapes ---------- */
  function show(n, initial) {
    current = n;
    steps.forEach(function (s) { s.hidden = Number(s.getAttribute('data-step')) !== n; });
    progress.forEach(function (li, i) {
      li.classList.toggle('done', i + 1 < n);
      li.classList.toggle('current', i + 1 === n);
    });
    if (alertBox) alertBox.className = 'form-alert';
    if (n === 2) syncDetails();
    if (initial) return;
    var top = document.querySelector('.progress');
    if (top) window.scrollTo({ top: top.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
    var h = steps[n - 1].querySelector('h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  /* ---------- Besoins : bloc santé + priorités ---------- */
  var santeBox = document.getElementById('sante-box');
  var santeInput = form.querySelector('input[name="besoins"][value="sante"]');

  function syncSante() {
    if (!santeBox || !santeInput) return;
    santeBox.hidden = !santeInput.checked;
  }

  function setRow(row, on) {
    row.classList.toggle('on', on);
    var radios = row.querySelectorAll('input[type="radio"]');
    radios.forEach(function (r) { r.disabled = !on; if (!on) r.checked = false; });
    if (on && !row.querySelector('input[type="radio"]:checked')) {
      var def = row.querySelector('input[type="radio"][value="2"]');
      if (def) def.checked = true;
    }
    updateLabel(row);
  }

  function updateLabel(row) {
    var lab = row.querySelector('.prio-label');
    var checked = row.querySelector('input[type="radio"]:checked');
    if (lab) lab.textContent = checked && row.classList.contains('on') ? PRIO[checked.value] : 'Priorité';
  }

  form.querySelectorAll('.hrow').forEach(function (row) {
    var cb = row.querySelector('input[type="checkbox"]');
    setRow(row, cb.checked);
    cb.addEventListener('change', function () { setRow(row, cb.checked); });
    row.querySelectorAll('input[type="radio"]').forEach(function (r) {
      r.addEventListener('change', function () { updateLabel(row); });
    });
  });

  form.querySelectorAll('input[name="besoins"]').forEach(function (i) { i.addEventListener('change', syncSante); });

  /* ---------- Étape 2 : questions propres à chaque produit ---------- */
  function syncDetails() {
    var any = false;
    form.querySelectorAll('.pq').forEach(function (fs) {
      var on = !!form.querySelector('input[name="besoins"][value="' + fs.getAttribute('data-prod') + '"]:checked');
      fs.hidden = !on; fs.disabled = !on;
      if (on) any = true;
    });
    return any;
  }

  function detailGroups() {
    var groups = [];
    form.querySelectorAll('.pq:not([hidden])').forEach(function (fs) {
      var rows = [], seen = {};
      fs.querySelectorAll('input, select').forEach(function (el) {
        var q = el.getAttribute('data-q');
        if (!q || seen[el.name]) return;
        seen[el.name] = 1;
        var v = '';
        if (el.type === 'radio') { var r = fs.querySelector('input[name="' + el.name + '"]:checked'); v = r ? r.value : ''; }
        else if (el.type === 'checkbox') { v = Array.prototype.map.call(fs.querySelectorAll('input[name="' + el.name + '"]:checked'), function (c) { return c.value; }).join(', '); }
        else { v = el.value.trim(); }
        if (v) rows.push([q, v]);
      });
      groups.push({ name: fs.getAttribute('data-label'), rows: rows });
    });
    return groups;
  }

  /* ---------- Pré-sélection via l'URL (?besoin=auto&cp=75001) ---------- */
  var params = new URLSearchParams(window.location.search);
  var pre = params.get('besoin');
  if (pre) {
    pre.split(',').forEach(function (v) {
      var el = form.querySelector('input[name="besoins"][value="' + v.replace(/[^a-z-]/g, '') + '"]');
      if (el) el.checked = true;
    });
  }
  var cp = params.get('cp');
  if (cp && /^\d{5}$/.test(cp)) form.querySelector('[name="code_postal"]').value = cp;
  syncSante();

  /* ---------- Validation ---------- */
  function setInvalid(el, bad) {
    var f = el.closest('.field');
    if (f) f.classList.toggle('invalid', bad);
  }

  function validateStep(n) {
    var ok = true, firstBad = null;
    function bad(el) { ok = false; setInvalid(el, true); if (!firstBad) firstBad = el; }

    if (n === 1) {
      var any = form.querySelectorAll('input[name="besoins"]:checked').length > 0;
      var err = document.getElementById('needs-error');
      err.style.display = any ? 'none' : 'block';
      if (!any) { ok = false; firstBad = form.querySelector('input[name="besoins"]'); }
    }
    if (n === 3) {
      var rules = {
        code_postal: function (v) { return /^\d{5}$/.test(v); },
        prenom: function (v) { return v.length >= 2; },
        nom: function (v) { return v.length >= 2; },
        email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); },
        telephone: function (v) { return /^[\d\s.+()-]{9,18}$/.test(v); }
      };
      Object.keys(rules).forEach(function (name) {
        var el = form.querySelector('[name="' + name + '"]');
        var v = el.value.trim();
        if (rules[name](v)) setInvalid(el, false); else bad(el);
      });
    }
    if (firstBad) firstBad.focus();
    return ok;
  }

  /* ---------- Récapitulatif ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function stars(n) { return '★'.repeat(n) + '☆'.repeat(4 - n); }

  function healthLines() {
    var out = [];
    form.querySelectorAll('.hrow.on').forEach(function (row) {
      var name = row.querySelector('.hname').textContent.trim();
      var r = row.querySelector('input[type="radio"]:checked');
      out.push({ name: name, prio: r ? Number(r.value) : 0 });
    });
    return out;
  }

  function buildSummary() {
    var needs = Array.prototype.map.call(form.querySelectorAll('input[name="besoins"]:checked'), function (i) { return NEED_LABELS[i.value]; });
    var health = healthLines();
    var val = function (n) { return form.querySelector('[name="' + n + '"]').value.trim(); };
    var delai = form.querySelector('input[name="echeance"]:checked');

    var html = '<h3>Besoins sélectionnés</h3><ul>' + needs.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>';
    if (health.length) {
      html += '<h3>Priorités santé</h3><ul>' + health.map(function (h) {
        return '<li><span>' + esc(h.name) + '</span><span class="st" aria-label="Priorité ' + h.prio + ' sur 4">' + stars(h.prio) + '</span></li>';
      }).join('') + '</ul>';
    }
    detailGroups().forEach(function (g) {
      if (!g.rows.length) return;
      html += '<h3>' + esc(g.name) + '</h3><ul>' + g.rows.map(function (r) { return '<li><span>' + esc(r[0]) + '</span><span>' + esc(r[1]) + '</span></li>'; }).join('') + '</ul>';
    });
    html += '<h3>Votre demande</h3><ul>' +
      '<li><span>Code postal</span><span>' + esc(val('code_postal')) + '</span></li>' +
      (delai ? '<li><span>Échéance</span><span>' + esc(delai.value) + '</span></li>' : '') + '</ul>';
    html += '<h3>Coordonnées</h3><ul>' +
      '<li><span>' + esc(val('prenom') + ' ' + val('nom')) + '</span></li>' +
      '<li><span>' + esc(val('email')) + '</span></li>' +
      '<li><span>' + esc(val('telephone')) + '</span></li></ul>';
    document.getElementById('summary').innerHTML = html;

    /* Résumé lisible, ajouté à l'e-mail de notification Netlify */
    var txt = 'Besoins : ' + needs.join(', ');
    if (health.length) txt += '\nPriorités santé : ' + health.map(function (h) { return h.name + ' (' + h.prio + '/4)'; }).join(' ; ');
    detailGroups().forEach(function (g) {
      if (g.rows.length) txt += '\n\n' + g.name.toUpperCase() + '\n' + g.rows.map(function (r) { return '- ' + r[0] + ' : ' + r[1]; }).join('\n');
    });
    txt += '\n\nContact : ' + val('prenom') + ' ' + val('nom') + ' · ' + val('email') + ' · ' + val('telephone') + ' · CP ' + val('code_postal');
    form.querySelector('[name="resume"]').value = txt;
    return txt;
  }

  /* ---------- Boutons ---------- */
  form.addEventListener('click', function (e) {
    var next = e.target.closest('[data-next]');
    var prev = e.target.closest('[data-prev]');
    if (next) {
      var n = Number(next.getAttribute('data-next'));
      if (validateStep(current)) { if (n === 4) buildSummary(); show(n); }
    }
    if (prev) show(Number(prev.getAttribute('data-prev')));
  });

  ['code_postal', 'prenom', 'nom', 'email', 'telephone'].forEach(function (n) {
    form.querySelector('[name="' + n + '"]').addEventListener('input', function (e) { setInvalid(e.target, false); });
  });
  form.querySelectorAll('input[name="besoins"]').forEach(function (i) {
    i.addEventListener('change', function () { document.getElementById('needs-error').style.display = 'none'; });
  });

  /* ---------- Envoi (Netlify Forms) ---------- */
  var sending = false;
  var lastStatus = '';

  function done() {
    store(function (st) { st.removeItem(DRAFT); });
    steps.forEach(function (s) { s.hidden = true; });
    document.getElementById('step-done').hidden = false;
    progress.forEach(function (li) { li.classList.remove('current'); li.classList.add('done'); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    var h = document.querySelector('#step-done h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
  }

  function showFail(txt, mail) {
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = false; btn.textContent = 'Envoyer ma demande';
    alertBox.className = 'form-alert err show';
    alertBox.textContent = '';
    var m = document.createElement('div');
    m.textContent = "L'envoi n'a pas abouti" + (lastStatus ? ' (' + lastStatus + ')' : '') + ". Vos réponses sont conservées : vous pouvez réessayer sans rien ressaisir.";
    var alt = document.createElement('div'); alt.className = 'alt';
    function mk(tag, cls, label) { var x = document.createElement(tag); x.className = cls; x.textContent = label; if (tag === 'button') x.type = 'button'; return x; }
    var b1 = mk('button', 'btn btn-primary', 'Réessayer');
    b1.addEventListener('click', function () { send(); });
    var b2 = mk('button', 'btn btn-ghost', 'Copier ma demande');
    b2.addEventListener('click', function () {
      var ok = function () { b2.textContent = 'Copié ✓'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, function () {});
    });
    alt.appendChild(b1); alt.appendChild(b2);
    if (mail) {
      var a = mk('a', 'btn btn-ghost', 'Envoyer par e-mail');
      a.href = 'mailto:' + mail + '?subject=' + encodeURIComponent('Demande de devis AJM Courtage') + '&body=' + encodeURIComponent(txt);
      alt.appendChild(a);
    }
    alertBox.appendChild(m); alertBox.appendChild(alt);
  }

  function send() {
    if (sending) return;
    sending = true;
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Envoi en cours…';
    alertBox.className = 'form-alert';
    var mail = form.getAttribute('data-fallback-mail');
    var txt = form.querySelector('[name="resume"]').value;
    var data = new URLSearchParams(new FormData(form)).toString();
    /* Netlify accepte un POST vers la racine ou vers la page du formulaire */
    var targets = ['/', window.location.pathname];
    var endpoint = form.getAttribute('data-endpoint');
    if (endpoint) targets.push(endpoint);

    function attempt(i) {
      return fetch(targets[i], { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: data })
        .then(function (r) {
          if (r.ok || r.redirected) return;
          lastStatus = 'erreur ' + r.status;
          throw new Error('http ' + r.status);
        }).catch(function (err) {
          if (!lastStatus) lastStatus = 'réseau';
          if (i + 1 < targets.length) return attempt(i + 1);
          throw err;
        });
    }
    lastStatus = '';
    attempt(0).then(function () { sending = false; done(); })
      .catch(function () { sending = false; showFail(txt, mail); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.querySelector('input[name="consentement"]').checked) {
      alertBox.className = 'form-alert err show';
      alertBox.textContent = 'Merci de cocher la case de consentement pour envoyer votre demande.';
      return;
    }
    buildSummary();
    send();
  });

  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);
  show(1, true);
})();
