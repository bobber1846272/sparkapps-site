/* Openbare reizen uit Mijn Vakanties — alleen lezen, zonder inloggen. */
(function () {
  'use strict';
  var URL0 = 'https://kplorhptmnfddvozpxwl.supabase.co', KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwbG9yaHB0bW5mZGR2b3pweHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMDM0ODUsImV4cCI6MjEwODY3OTQ4NX0.hJ0kbE71rK1zwH5Ow3JInqM-Y9R44XpGoX4C0Ry-VUs';
  var MON = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  var main = document.getElementById('main');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rpc(fn, args) {
    return fetch(URL0 + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) })
      .then(function (r) { if (!r.ok) throw new Error('Laden lukte niet'); return r.json(); });
  }
  function img(u) { u = String(u || ''); return u.indexOf(URL0 + '/storage/v1/object/public/') === 0 ? u : ''; }
  function flag(cc) { cc = String(cc || '').toUpperCase(); return /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(127397 + cc.charCodeAt(0), 127397 + cc.charCodeAt(1)) : ''; }
  function cname(cc) { var w = window.MV_WORLD && MV_WORLD.c[String(cc).toLowerCase()]; return w ? w.n : String(cc).toUpperCase(); }
  function d(s) { if (!s) return null; var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function month(s) { var x = d(s); return x ? MON[x.getMonth()] + ' ' + x.getFullYear() : ''; }
  function range(a, b) {
    var A = d(a), B = d(b); if (!A) return '';
    if (!B) return A.getDate() + ' ' + MON[A.getMonth()] + ' ' + A.getFullYear();
    if (A.getMonth() === B.getMonth() && A.getFullYear() === B.getFullYear()) return A.getDate() + '–' + B.getDate() + ' ' + MON[B.getMonth()] + ' ' + B.getFullYear();
    return A.getDate() + ' ' + MON[A.getMonth()] + ' – ' + B.getDate() + ' ' + MON[B.getMonth()] + ' ' + B.getFullYear();
  }
  function av(o, big) {
    o = o || {}; var u = img(o.avatar_url), ch = esc((o.display_name || o.username || '?').charAt(0).toUpperCase());
    var preset = /^preset:(\d+)$/.exec(o.avatar_url || ''), cols = ['#FFD60A', '#7AE7C7', '#FF8A8A', '#9DB4FF', '#F6B860', '#C3A6FF', '#8FE388', '#FFB3D1', '#7CC0CF', '#FFC48A', '#B8E986', '#A0D2FF'];
    var bg = preset ? cols[(+preset[1] - 1) % cols.length] : '';
    return '<span class="rz-av"' + (u ? ' style="background-image:url(\'' + esc(u) + '\')"' : bg ? ' style="background:' + bg + '"' : '') + '>' + (u ? '' : ch) + '</span>';
  }
  function stars(n) { n = +n || 0; return n ? '★'.repeat(n) + '☆'.repeat(5 - n) : ''; }
  function grad(seed) { var g = [['#0B1B3A', '#3a3410'], ['#10244D', '#1f6474'], ['#0B1B3A', '#5b3a8a'], ['#10244D', '#6f8f3a']], h = 0; String(seed).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); var x = g[h % g.length]; return 'linear-gradient(160deg,' + x[0] + ',' + x[1] + ')'; }
  function empty(ic, t, s) { return '<div class="rz-empty"><div class="big">' + ic + '</div><h2>' + t + '</h2><p>' + (s || '') + '</p></div>'; }

  function card(x) {
    var o = x.owner || {}, cv = img(x.cover_url), cc = (x.countries || [])[0];
    return '<a class="rz-card" href="?t=' + encodeURIComponent(x.trip_id) + '"><div class="rz-cover" style="background-image:' + (cv ? 'url(\'' + esc(cv) + '\')' : grad(x.trip_id)) + '">' + (cv ? '' : (cc ? flag(cc) : '🧳')) +
      (cc ? '<span class="rz-flag">' + flag(cc) + ' ' + esc(cname(cc)) + '</span>' : '') + '</div>' +
      '<div class="rz-body"><div class="rz-who">' + av(o) + '<span><b>' + esc(o.display_name || o.username) + '</b> · @' + esc(o.username) + '</span></div>' +
      '<h3>' + esc(x.title) + '</h3><div class="rz-meta">' + [x.location ? esc(x.location) : '', month(x.start_date), x.places_count + ' plekken', '♥ ' + (x.likes || 0), x.rating ? '★ ' + String(x.rating).replace('.', ',') : ''].filter(Boolean).join(' · ') + '</div></div></a>';
  }

  function worldSvg(on, cls) {
    var W = window.MV_WORLD; if (!W) return '';
    var p = ''; Object.keys(W.c).forEach(function (c) { p += '<path d="' + W.c[c].d + '"' + (on.indexOf(c) > -1 ? ' class="on"' : '') + '><title>' + esc(W.c[c].n) + '</title></path>'; });
    return '<svg class="' + cls + '" viewBox="0 70 3600 1390">' + p + '</svg>';
  }
  function miniMap(places, ccs) {
    var W = window.MV_WORLD; if (!W) return '';
    var K = W.k, pts = places.filter(function (p) { return p.lat != null && p.lon != null; }).map(function (p) { return [(+p.lon + 180) * K, (90 - +p.lat) * K]; });
    if (!pts.length) return '';
    var xs = pts.map(function (q) { return q[0]; }), ys = pts.map(function (q) { return q[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var w = Math.max(x1 - x0, 40), h = Math.max(y1 - y0, 24), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, pad = Math.max(w, h) * .4;
    w += pad * 2; h += pad * 2; if (w / h < 2.2) w = h * 2.2; else h = w / 2.2;
    var box = [cx - w / 2, cy - h / 2, w, h], p = '';
    Object.keys(W.c).forEach(function (c) { var b = W.c[c].b; if (b[2] < box[0] || b[0] > box[0] + w || b[3] < box[1] || b[1] > box[1] + h) return; p += '<path d="' + W.c[c].d + '" style="stroke-width:' + (w / 400).toFixed(2) + '"' + (ccs.indexOf(c) > -1 ? ' class="on"' : '') + '/>'; });
    var r = w / 110;
    return '<div class="rz-map"><svg viewBox="' + box.map(function (v) { return v.toFixed(1); }).join(' ') + '" style="aspect-ratio:2.2">' + p + pts.map(function (q) { return '<circle cx="' + q[0].toFixed(2) + '" cy="' + q[1].toFixed(2) + '" r="' + r.toFixed(2) + '" style="stroke-width:' + (r / 2.5).toFixed(2) + '"/>'; }).join('') + '</svg></div>';
  }

  /* ----- overzicht ----- */
  var feed = [];
  function showFeed(more) {
    document.title = 'Reizen · Spark Apps';
    if (!more) main.innerHTML = '<div class="wrap"><span class="kicker">Mijn Vakanties</span><h1>Reizen van anderen</h1><p class="lead">Waar gingen mensen naartoe, en wat vonden ze ervan? Gedeeld met de app Mijn Vakanties.</p><div class="rz-grid" id="grid"><div class="rz-skel"></div></div><div class="rz-more" id="more"></div></div>';
    var args = { p_scope: 'all', p_limit: 24 }; if (more && feed.length) args.p_before = feed[feed.length - 1].published_at;
    rpc('mv_feed', args).then(function (l) {
      feed = (more ? feed : []).concat(l || []);
      document.getElementById('grid').innerHTML = feed.length ? feed.map(card).join('') : empty('🌍', 'Nog geen gedeelde reizen', 'De eerste reizen verschijnen hier vanzelf.');
      document.getElementById('more').innerHTML = (l || []).length === 24 ? '<button class="btn ghost" id="moreBtn">Meer laden</button>' : '';
      var b = document.getElementById('moreBtn'); if (b) b.onclick = function () { b.disabled = true; showFeed(true); };
    }).catch(function () { document.getElementById('grid').innerHTML = empty('📡', 'Laden lukte niet', 'Probeer het later opnieuw.'); });
  }

  /* ----- één reis ----- */
  function showTrip(id) {
    rpc('mv_trip', { p_trip: id }).then(function (x) {
      if (!x) { main.innerHTML = '<div class="wrap">' + empty('🔒', 'Deze reis is niet (meer) te zien', 'Misschien is hij privé gemaakt, of nog niet zichtbaar.') + '</div>'; return; }
      var s = x.snapshot || {}, o = x.owner || {}, places = s.places || [], cats = s.cats || [], cv = img(x.cover_url);
      document.title = x.title + ' · ' + (o.display_name || o.username) + ' · Mijn Vakanties';
      var visited = places.filter(function (p) { return p.visited; }).length, rated = places.filter(function (p) { return p.rating; });
      var avg = rated.length ? rated.reduce(function (a, p) { return a + p.rating; }, 0) / rated.length : 0;
      var h = '<div class="wrap"><div class="rz-hero" style="background-image:' + (cv ? 'url(\'' + esc(cv) + '\')' : grad(id)) + '"><div class="rz-hero-in">' +
        '<span class="kicker">' + (x.countries || []).map(function (c) { return flag(c) + ' ' + esc(cname(c)); }).join(' · ') + '</span><h1>' + esc(x.title) + '</h1><div style="color:var(--soft)">' + [esc(x.location || ''), range(x.start_date, x.end_date)].filter(Boolean).join(' · ') + '</div></div></div>' +
        (!x.visible ? '<div class="rz-note">Deze reis is nog niet openbaar zichtbaar.</div>' : '') +
        '<div class="rz-row"><a class="rz-who" href="?u=' + encodeURIComponent(o.username) + '" style="text-decoration:none">' + av(o) + '<span><b>' + esc(o.display_name || o.username) + '</b> · @' + esc(o.username) + '</span></a>' +
        '<div class="rz-stats"><div><b>' + places.length + '</b><small>plekken</small></div>' + (visited ? '<div><b>' + visited + '</b><small>bezocht</small></div>' : '') + (avg ? '<div><b>' + avg.toFixed(1).replace('.', ',') + '</b><small>sterren</small></div>' : '') + '<div><b>♥ ' + (x.likes || 0) + '</b><small>hartjes</small></div></div></div>' +
        miniMap(places, x.countries || []);
      var groups = cats.map(function (c) { return { c: c, ps: places.filter(function (p) { return p.catId === c.id; }) }; }).filter(function (g) { return g.ps.length; });
      groups.forEach(function (g) {
        h += '<div class="rz-cat"><h2>' + esc(g.c.emoji || '📌') + ' ' + esc(g.c.name) + '</h2>' + g.ps.map(function (p) {
          var ph = img(p.photo);
          return '<div class="rz-place"><div class="rz-ph"' + (ph ? ' style="background-image:url(\'' + esc(ph) + '\')"' : '') + '>' + (ph ? '' : esc(p.emoji || '📌')) + '</div>' +
            '<div><h3>' + esc(p.name) + (p.visited ? ' <span class="rz-ok">✓ bezocht</span>' : '') + '</h3>' + (p.addr ? '<div class="ad">' + esc(p.addr) + '</div>' : '') + '</div>' +
            (p.rating ? '<div class="rz-stars">' + stars(p.rating) + '</div>' : '<div></div>') +
            (p.review ? '<p>“' + esc(p.review) + '”' + (p.again ? ' <span style="color:var(--faint)">· Nog eens? ' + esc(p.again) + '</span>' : '') + '</p>' : '') + '</div>';
        }).join('') + '</div>';
      });
      var cm = x.comment_list || [];
      h += '<div class="rz-cat"><h2>💬 Reacties (' + cm.length + ')</h2>' + (cm.length ? cm.map(function (c) { var u = c.user || {}; return '<div class="rz-cmt">' + av(u) + '<div><b>' + esc(u.display_name || u.username) + '</b><small>' + new Date(c.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) + '</small><p>' + esc(c.body) + '</p></div></div>'; }).join('') : '<p style="color:var(--muted)">Nog geen reacties. Reageren kan in de app.</p>') + '</div></div>';
      main.innerHTML = h;
    }).catch(function () { main.innerHTML = '<div class="wrap">' + empty('📡', 'Laden lukte niet', 'Probeer het later opnieuw.') + '</div>'; });
  }

  /* ----- profiel ----- */
  function showPerson(name) {
    rpc('mv_profile', { p_username: name }).then(function (x) {
      if (!x) { main.innerHTML = '<div class="wrap">' + empty('🔍', 'Niet gevonden', 'Dit profiel bestaat niet (meer).') + '</div>'; return; }
      document.title = (x.display_name || x.username) + ' · Mijn Vakanties';
      var h = '<div class="wrap"><div class="rz-person">' + av(x, true) + '<div><span class="kicker">Level ' + x.level + ' · ' + esc(x.level_name || '') + '</span><h1 style="margin:6px 0 4px">' + esc(x.display_name || x.username) + '</h1><div style="color:var(--muted)">@' + esc(x.username) + '</div></div></div>' +
        '<div class="rz-row"><div class="rz-stats"><div><b>' + (x.trips || []).length + '</b><small>reizen</small></div><div><b>' + (x.countries || []).length + '</b><small>landen</small></div><div><b>' + (x.places || 0) + '</b><small>plekken</small></div><div><b>' + (x.followers || 0) + '</b><small>volgers</small></div></div></div>';
      if ((x.countries || []).length) h += '<div class="rz-map" style="padding:14px">' + worldSvg(x.countries, 'rz-world') + '</div>';
      h += '<div class="rz-grid">' + ((x.trips || []).length ? x.trips.map(card).join('') : '') + '</div>' + ((x.trips || []).length ? '' : empty('🧳', 'Nog geen gedeelde reizen', '')) + '</div>';
      main.innerHTML = h;
    }).catch(function () { main.innerHTML = '<div class="wrap">' + empty('📡', 'Laden lukte niet', 'Probeer het later opnieuw.') + '</div>'; });
  }

  var q = new URLSearchParams(location.search);
  if (q.get('t')) showTrip(q.get('t'));
  else if (q.get('u')) showPerson(q.get('u'));
  else showFeed(false);
})();
