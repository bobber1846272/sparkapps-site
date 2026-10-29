/* =============================================================
   sparkapps.nl
   ============================================================= */
/* Later, met de eigen server: SUPABASE_URL wordt 'https://api.sparkapps.nl' */
var SUPABASE_URL = 'https://kplorhptmnfddvozpxwl.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwbG9yaHB0bW5mZGR2b3pweHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMDM0ODUsImV4cCI6MjEwODY3OTQ4NX0.hJ0kbE71rK1zwH5Ow3JInqM-Y9R44XpGoX4C0Ry-VUs';
var STORE_PKG = 'nl.thomas.sparkapps';
var SITE_URL = 'https://sparkapps.nl/';

try { SparkAccount.init({ url: SUPABASE_URL, key: SUPABASE_ANON_KEY.indexOf('__') === 0 ? '' : SUPABASE_ANON_KEY }); } catch (e) {}

function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
var SPARK_PATH = 'M50 4 C54 36 64 46 96 50 C64 54 54 64 50 96 C46 64 36 54 4 50 C36 46 46 36 50 4 Z';
function star(size, color) { return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" aria-hidden="true"><path d="' + SPARK_PATH + '" fill="' + (color || '#FFD60A') + '"/></svg>'; }
function check() { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>'; }
function lock() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'; }
function fmt(n) { return Number(n || 0).toLocaleString('nl-NL'); }
var toastT;
function toast(m) { var t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 2800); }
$('year').textContent = new Date().getFullYear();

/* =============================================================
   1. Links uit mails opvangen (#access_token=...)
   ============================================================= */
var linkState = null;   /* 'confirmed' | 'recovery' | 'linkerror' */
(function readLink() {
  var h = location.hash.slice(1);
  if (!/access_token=|error=|error_description=/.test(h) && !/error=/.test(location.search)) return;
  var p = new URLSearchParams(h.indexOf('=') > -1 ? h : location.search.slice(1));
  history.replaceState(null, '', location.pathname + '#account');   /* gevoelige gegevens weg uit de adresbalk */
  if (p.get('error') || p.get('error_description')) { linkState = 'linkerror'; return; }
  var data = { access_token: p.get('access_token'), refresh_token: p.get('refresh_token'), expires_in: p.get('expires_in'), expires_at: p.get('expires_at') };
  linkState = p.get('type') === 'recovery' ? 'recovery' : 'confirmed';
  SparkAccount.fromLink(data).then(function () { drawAccBtn(); if (curView === 'account') drawAccount(); });
})();

/* =============================================================
   2. Weergaven: home of account
   ============================================================= */
var curView = 'home';
var PAGES = ['account', 'nieuw', 'aanvragen'];
function route() {
  var h = location.hash.slice(1), q = '', qi = h.indexOf('?');
  if (qi > -1) { q = h.slice(qi + 1); h = h.slice(0, qi); }
  var view = PAGES.indexOf(h) > -1 ? h : 'home';
  if (view !== curView) {
    curView = view;
    $('v-home').hidden = view !== 'home';
    PAGES.forEach(function (v) { $('v-' + v).hidden = view !== v; });
    $('top').classList.toggle('solid', view !== 'home');
    [].forEach.call(document.querySelectorAll('.nav a'), function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + view ? 'page' : 'false'); });
    window.scrollTo(0, 0);
  }
  if (view === 'account') { drawAccount(); document.title = 'Spark Account · Spark Apps'; }
  else if (view === 'nieuw') { drawNews(); document.title = 'Wat is er nieuw · Spark Apps'; }
  else if (view === 'aanvragen') { reqFromQuery(q); drawReq(); document.title = 'App aanvragen of iets melden · Spark Apps'; }
  else {
    document.title = 'Spark Apps';
    if (h && $(h)) setTimeout(function () { $(h).scrollIntoView(); }, 0);
  }
}
window.addEventListener('hashchange', route);

/* =============================================================
   3. Apps
   ============================================================= */
var APPS = (window.SPARK_APPS || []).slice();
var catPick = '';
var CAT_ORDER = ['Fun-apps', 'Geld', 'Reizen', 'Planning', 'Leren', 'Chat', 'Werk', 'Veiligheid'];

function icoHtml(a, size) {
  if (a.icon) return '<span class="app-ico" style="width:' + size + 'px;height:' + size + 'px"><img src="' + esc(a.icon) + '" alt="" loading="lazy"></span>';
  return '<span class="app-ico" style="width:' + size + 'px;height:' + size + 'px;background:' + esc(a.bg || '#12285A') + '">' + star(Math.round(size * .5)) + '</span>';
}

var HERO_SHOW = ['gooihenk', 'tidepool', 'coinwise', 'daybreak', 'muse', 'gerard'];
function drawHero() {
  var shows = HERO_SHOW.map(function (id) { return APPS.filter(function (a) { return a.id === id; })[0]; })
    .filter(function (a) { return a && a.shots && a.shots.length; });
  $('screen').innerHTML = shows.map(function (a, i) { return '<img src="' + esc(a.shots[0]) + '" alt=""' + (i === 0 ? ' class="on"' : '') + '>'; }).join('');
  var icons = APPS.filter(function (a) { return a.icon && HERO_SHOW.indexOf(a.id) < 0; }).slice(0, 4);
  $('floats').innerHTML = icons.map(function (a, i) { return '<div class="float f' + (i + 1) + '"><img src="' + esc(a.icon) + '" alt=""></div>'; }).join('');
  if (!shows.length) return;
  $('cap').textContent = shows[0].name;
  var idx = 0, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || shows.length < 2) return;
  setInterval(function () {
    if (document.hidden || curView !== 'home') return;
    var imgs = $('screen').children; imgs[idx].classList.remove('on');
    idx = (idx + 1) % imgs.length; imgs[idx].classList.add('on');
    $('cap').textContent = shows[idx].name;
  }, 3200);
}

function drawApps() {
  var cats = [];
  APPS.forEach(function (a) { if (a.cat && cats.indexOf(a.cat) < 0) cats.push(a.cat); });
  cats.sort(function (x, y) { var i = CAT_ORDER.indexOf(x), j = CAT_ORDER.indexOf(y); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); });
  $('chips').innerHTML = ['', ].concat(cats).map(function (c) {
    return '<button class="chip" aria-pressed="' + (catPick === c) + '" data-cat="' + esc(c) + '">' + (c ? esc(c) : 'Alle') + '</button>';
  }).join('');
  var list = APPS.filter(function (a) { return !catPick || a.cat === catPick; });
  var feats = catPick ? [] : ['gooihenk', 'tidepool'];
  if (!catPick) list = feats.map(function (id) { return list.filter(function (a) { return a.id === id; })[0]; }).filter(Boolean)
    .concat(list.filter(function (a) { return feats.indexOf(a.id) < 0; }));
  var more = '<span class="more">Bekijk de app <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>';
  $('app-grid').innerHTML = list.map(function (a) {
    var c = /^#[0-9a-f]{6}$/i.test(a.bg || '') ? a.bg : '#12285A';
    if (feats.indexOf(a.id) > -1 && a.shots && a.shots.length) {
      return '<button class="app-card feat" style="--c:' + c + '" data-app="' + esc(a.id) + '"><span class="txt"><span class="feat-tag">Uitgelicht</span>' +
        '<span class="head">' + icoHtml(a, 60) + '<span><span class="cat">' + esc(a.cat || 'App') + '</span><b>' + esc(a.name) + '</b></span></span>' +
        '<span class="s">' + esc(a.tagline) + '</span>' + more + '</span>' +
        '<span class="shot"><img src="' + esc(a.shots[0]) + '" alt="" loading="lazy"></span></button>';
    }
    return '<button class="app-card" style="--c:' + c + '" data-app="' + esc(a.id) + '"><span class="head">' + icoHtml(a, 60) +
      '<span><span class="cat">' + esc(a.cat || 'App') + '</span><b>' + esc(a.name) + '</b></span></span>' +
      '<span class="s">' + esc(a.tagline) + '</span>' + more + '</button>';
  }).join('');
  $('st-apps').textContent = APPS.length;
}

$('chips').addEventListener('click', function (e) {
  var b = e.target.closest('[data-cat]'); if (!b) return;
  catPick = b.getAttribute('data-cat'); drawApps();
});
$('app-grid').addEventListener('click', function (e) {
  var b = e.target.closest('[data-app]'); if (!b) return;
  openApp(b.getAttribute('data-app'));
});

function openApp(id) {
  var a = APPS.filter(function (x) { return x.id === id; })[0]; if (!a) return;
  var bg = /^#[0-9a-f]{6}$/i.test(a.bg || '') ? a.bg : '#12285A', bg2 = /^#[0-9a-f]{6}$/i.test(a.bg2 || '') ? a.bg2 : '#0B1B3A';
  $('dlg-app-body').innerHTML =
    '<div class="dlg-hero" style="background:linear-gradient(150deg,' + bg + ',' + bg2 + ')">' + icoHtml(a, 84) +
      '<div><h2 id="dlg-app-t">' + esc(a.name) + '</h2><span>' + esc(a.cat || '') + (a.version ? ' · versie ' + esc(a.version) : '') + '</span></div>' +
      '<button class="dlg-x" onclick="$(\'dlg-app\').close()" aria-label="Sluiten"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
    '<div class="dlg-body">' +
      '<h3 style="font-size:20px">' + esc(a.tagline) + '</h3>' +
      (a.desc ? '<p>' + esc(a.desc) + '</p>' : '') +
      (a.shots && a.shots.length ? '<div class="shots" tabindex="0" aria-label="Schermafbeeldingen">' + a.shots.map(function (s, i) { return '<img src="' + esc(s) + '" alt="Scherm ' + (i + 1) + ' van ' + esc(a.name) + '" loading="lazy">'; }).join('') + '</div>' : '') +
      (a.features && a.features.length ? '<ul class="feats">' + a.features.map(function (f) { return '<li><span style="color:var(--spark-ink)">' + check() + '</span>' + esc(f) + '</li>'; }).join('') + '</ul>' : '') +
      '<div class="row"><a class="btn" href="#download" onclick="$(\'dlg-app\').close()">Installeren via de Spark-appstore</a>' +
      '<a class="btn ghost" href="#aanvragen?soort=fout&app=' + encodeURIComponent(a.name) + '" onclick="$(\'dlg-app\').close()">Fout of tip melden</a></div>' +
    '</div>';
  $('dlg-app').showModal();
}
$('dlg-app').addEventListener('click', function (e) { if (e.target === this) this.close(); });

function drawBuildSteps() {
  var steps = window.SPARK_STEPS || [];
  $('build-steps').innerHTML = steps.map(function (s) { return '<li><span class="num"></span><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></li>'; }).join('');
}

/* Gegevens van de server: nieuwe apps, de store-download en de cijfers */
function loadServer() {
  if (!SparkAccount.configured()) return;
  SparkAccount.rpc('public_stats', {}).then(function (s) {
    if (!s) return;
    $('st-dl').textContent = fmt(s.downloads);
    $('st-acc').textContent = fmt(s.accounts);
  }).catch(function () {});
  SparkAccount.select('apps?status=eq.live&select=id,slug,name,tagline,description,icon_url,color,package_name,app_versions(version_name,version_code,apk_path,size_bytes,changelog,created_at)')
    .then(function (list) {
      if (!Array.isArray(list)) return;
      buildUpdates(list);
      list.forEach(function (s) {
        var vs = (s.app_versions || []).slice().sort(function (x, y) { return y.version_code - x.version_code; });
        var latest = vs[0];
        if (s.package_name === STORE_PKG) {
          if (latest) {
            var b = $('dl-btn');
            b.href = SparkAccount.storageUrl('apks', latest.apk_path);
            b.removeAttribute('aria-disabled');
            b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg> Download Spark Apps';
            $('dl-meta').textContent = 'Versie ' + latest.version_name + (latest.size_bytes ? ' · ' + (latest.size_bytes / 1048576).toFixed(1).replace('.', ',') + ' MB' : '') + ' · APK voor Android';
          }
          return;
        }
        var known = APPS.filter(function (a) { return a.pkg && a.pkg === s.package_name; })[0];
        if (known) { if (latest) known.version = latest.version_name; return; }
        if (!/^[a-z0-9-]{2,40}$/.test(s.slug || '')) return;
        APPS.push({ id: 's-' + s.slug, name: s.name, pkg: s.package_name, cat: 'Nieuw', tagline: s.tagline || 'Een app van Spark', desc: s.description || '',
          features: [], bg: /^#[0-9a-f]{6}$/i.test(s.color || '') ? s.color : '#12285A', bg2: '#0B1B3A',
          icon: /^https:\/\/[^"'<>\s]+$/.test(s.icon_url || '') ? s.icon_url : '', shots: [], version: latest ? latest.version_name : '' });
      });
      drawApps();
    }).catch(function () { if (!UPDATES) buildUpdates([]); });
}
$('dl-btn').addEventListener('click', function (e) { if (this.getAttribute('aria-disabled') === 'true') { e.preventDefault(); toast('De download komt eraan. Mail info@sparkapps.nl als je hem nu al wilt.'); } });

/* =============================================================
   4. Spark Account
   ============================================================= */
var acc = { returnTo: null, mode: 'login', busy: false, progress: null, pickAvatar: false, delArm: false, unameT: null, forgotSent: false };

function drawAccBtn() {
  var b = $('acc-btn'), p = SparkAccount.cached();
  if (p) { b.className = 'acc-btn'; b.innerHTML = esc(p.display_name) + ' ' + SparkAccount.avatarHtml(p, 32); b.setAttribute('aria-label', 'Je account: ' + p.display_name); }
  else { b.className = 'acc-btn out'; b.textContent = 'Inloggen'; b.removeAttribute('aria-label'); }
  b.classList.toggle('has-new', !!(p && hasNewReply));
  $('sa-cta').textContent = p ? 'Naar je account' : 'Account maken';
}
SparkAccount.onChange(function () { drawAccBtn(); });

function drawAccount() {
  var el = $('acc-body');
  if (!SparkAccount.configured()) { el.innerHTML = '<div class="panel"><h1>Nog even geduld</h1><p>Inloggen is op de website nog niet ingesteld.</p></div>'; return; }
  if (linkState === 'linkerror') {
    el.innerHTML = '<div class="panel"><span class="kicker">Spark Account</span><h1>Deze link werkt niet meer</h1><p>De link is verlopen of al gebruikt. Vraag hieronder een nieuwe aan, of mail naar info@sparkapps.nl.</p><button class="btn" onclick="linkState=null;acc.mode=\'forgot\';drawAccount()">Nieuwe link aanvragen</button></div>';
    return;
  }
  if (linkState === 'recovery') { el.innerHTML = recoveryHtml(); bindRecovery(); return; }
  var p = SparkAccount.cached();
  el.classList.toggle('dash', !!(SparkAccount.isSignedIn() && p));
  if (SparkAccount.isSignedIn() && p) { el.innerHTML = (linkState === 'confirmed' ? '<div class="okmsg" role="status">' + check() + ' Je e-mailadres is bevestigd. Welkom bij Spark!</div>' : '') + profileHtml(p); bindProfile(); return; }
  if (linkState === 'confirmed') {
    el.innerHTML = '<div class="panel"><span class="kicker">Spark Account</span><h1>Je e-mailadres is bevestigd</h1><p>Log in in de Spark-appstore of hieronder op de website.</p><button class="btn" onclick="linkState=null;drawAccount()">Inloggen</button></div>';
    return;
  }
  el.innerHTML = loggedOutHtml(); bindLoggedOut();
}

function loggedOutHtml() {
  if (acc.mode === 'forgot') {
    return '<div class="panel"><span class="kicker">Spark Account</span><h1>Wachtwoord vergeten?</h1>' +
      '<p>Vul je e-mailadres in. Je krijgt een mail met een link om een nieuw wachtwoord te kiezen.</p>' +
      (acc.forgotSent ? '<div class="okmsg" role="status">Als er een account bij dit adres hoort, staat de mail nu in je inbox. Kijk ook in je spam.</div>' :
      '<form id="acc-form" novalidate style="display:flex;flex-direction:column;gap:14px">' +
        '<label class="field"><span>E-mail</span><input class="inp" id="f-email" type="email" autocomplete="email"></label>' +
        '<p class="err" id="f-err" role="alert" hidden></p><button class="btn full" id="f-go" type="submit">Stuur de link</button></form>') +
      '<button class="linkbtn" onclick="acc.mode=\'login\';acc.forgotSent=false;drawAccount()">Terug naar inloggen</button></div>';
  }
  var reg = acc.mode === 'register';
  return '<div class="panel"><span class="kicker">Spark Account</span><h1>' + (reg ? 'Maak je Spark Account' : 'Inloggen met Spark') + '</h1>' +
    '<p>Eén account voor de store, de website en alle Spark-apps.</p>' +
    '<div class="seg" role="tablist"><button role="tab" aria-selected="' + !reg + '" onclick="acc.mode=\'login\';drawAccount()">Inloggen</button>' +
      '<button role="tab" aria-selected="' + reg + '" onclick="acc.mode=\'register\';drawAccount()">Account maken</button></div>' +
    '<form id="acc-form" novalidate style="display:flex;flex-direction:column;gap:14px">' +
      (reg ? '<label class="field"><span>Je naam</span><input class="inp" id="f-name" maxlength="40" autocomplete="name" placeholder="Zoals anderen je zien"></label>' +
             '<label class="field"><span>Gebruikersnaam</span><div class="un"><i>@</i><input class="inp" id="f-user" maxlength="20" autocapitalize="off" spellcheck="false" autocomplete="username" placeholder="jouwnaam"></div>' +
             '<small id="f-user-hint">3 tot 20 tekens: kleine letters, cijfers, _ of .</small></label>' : '') +
      '<label class="field"><span>E-mail</span><input class="inp" id="f-email" type="email" autocomplete="email"></label>' +
      '<label class="field"><span>Wachtwoord</span><input class="inp" id="f-pw" type="password" autocomplete="' + (reg ? 'new-password' : 'current-password') + '"' + (reg ? ' placeholder="Minstens 8 tekens"' : '') + '></label>' +
      '<p class="err" id="f-err" role="alert" hidden></p>' +
      '<button class="btn full" id="f-go" type="submit">' + (reg ? 'Account maken' : 'Inloggen') + '</button>' +
    '</form>' +
    (reg ? '<p class="small">Met een account bewaar je je naam, gebruikersnaam, avatar en Spark-niveau bij Spark. Lees de <a href="privacy.html">privacyverklaring</a>. Je kunt je account altijd zelf verwijderen.</p>'
         : '<button class="linkbtn" onclick="acc.mode=\'forgot\';drawAccount()">Wachtwoord vergeten?</button>') +
    '</div>';
}

function err(msg) { var e = $('f-err'); if (!e) return; e.textContent = msg || ''; e.hidden = !msg; }

function bindLoggedOut() {
  var f = $('acc-form'); if (!f) return;
  [].forEach.call(f.querySelectorAll('input'), function (i) { i.addEventListener('input', function () { err(''); }); });
  f.addEventListener('submit', function (e) { e.preventDefault(); submitAccount(); });
  var u = $('f-user');
  if (u) u.addEventListener('input', function () {
    var v = SparkAccount.cleanUsername(u.value); if (u.value !== v) u.value = v;
    var hint = $('f-user-hint'); clearTimeout(acc.unameT); hint.className = '';
    if (!v) { hint.textContent = '3 tot 20 tekens: kleine letters, cijfers, _ of .'; return; }
    if (!SparkAccount.validUsername(v)) { hint.textContent = v.length < 3 ? 'Nog ' + (3 - v.length) + ' teken(s)…' : 'Alleen kleine letters, cijfers, _ of .'; hint.className = 'bad'; return; }
    hint.textContent = 'Even kijken…';
    acc.unameT = setTimeout(function () {
      SparkAccount.usernameAvailable(v).then(function (ok) {
        if (SparkAccount.cleanUsername(u.value) !== v) return;
        hint.textContent = ok ? '@' + v + ' is nog vrij' : '@' + v + ' is al bezet'; hint.className = ok ? 'ok' : 'bad';
      }).catch(function () { hint.textContent = 'Kon niet checken. Probeer het zo opnieuw.'; });
    }, 400);
  });
  var first = f.querySelector('input'); if (first) first.focus();
}

function submitAccount() {
  if (acc.busy) return;
  var email = ($('f-email').value || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Vul een geldig e-mailadres in.');
  var go = $('f-go'), label = go.textContent;
  function done() { acc.busy = false; if ($('f-go')) { go.disabled = false; go.textContent = label; } }
  if (acc.mode === 'forgot') {
    acc.busy = true; go.disabled = true; go.textContent = 'Even geduld…';
    SparkAccount.resetPassword(email, SITE_URL).then(function () { acc.busy = false; acc.forgotSent = true; drawAccount(); })
      .catch(function (e) { done(); err(e.message); });
    return;
  }
  var reg = acc.mode === 'register', pw = $('f-pw').value || '', name, user;
  if (reg) {
    name = ($('f-name').value || '').trim(); user = SparkAccount.cleanUsername($('f-user').value);
    if (!name) return err('Vul je naam in.');
    if (!SparkAccount.validUsername(user)) return err('Kies een gebruikersnaam van 3 tot 20 tekens: kleine letters, cijfers, _ of .');
    if (pw.length < 8) return err('Kies een wachtwoord van minstens 8 tekens.');
  } else if (!pw) return err('Vul je wachtwoord in.');
  acc.busy = true; go.disabled = true; go.textContent = 'Even geduld…';
  var job = reg ? SparkAccount.signUp({ email: email, password: pw, username: user, displayName: name })
                : SparkAccount.signIn(email, pw).then(function (p) { return { profile: p }; });
  job.then(function (r) {
    acc.busy = false;
    if (r && r.needsConfirm) {
      $('acc-body').innerHTML = '<div class="panel"><span class="kicker">Bijna klaar</span><h1>Check je mail</h1><p>We hebben een mail gestuurd naar <b>' + esc(email) + '</b>. Klik op de link in die mail om je account te bevestigen.</p></div>';
      return;
    }
    acc.progress = null; req.mine = null; drawAccount(); drawAccBtn(); loadMyRequests();
    toast(reg ? 'Welkom bij Spark!' : 'Ingelogd');
    if (acc.returnTo && !reg) { var back = acc.returnTo; acc.returnTo = null; location.hash = back; }
    SparkAccount.award('store', 'account_created');
  }).catch(function (e) { done(); err(e.message); });
}

/* ---------- nieuw wachtwoord ---------- */
function recoveryHtml() {
  return '<div class="panel"><span class="kicker">Spark Account</span><h1>Kies een nieuw wachtwoord</h1>' +
    '<form id="acc-form" novalidate style="display:flex;flex-direction:column;gap:14px">' +
      '<label class="field"><span>Nieuw wachtwoord</span><input class="inp" id="f-pw1" type="password" autocomplete="new-password" placeholder="Minstens 8 tekens"></label>' +
      '<label class="field"><span>Nog een keer</span><input class="inp" id="f-pw2" type="password" autocomplete="new-password"></label>' +
      '<p class="err" id="f-err" role="alert" hidden></p><button class="btn full" id="f-go" type="submit">Wachtwoord opslaan</button></form></div>';
}
function bindRecovery() {
  var f = $('acc-form');
  f.addEventListener('input', function () { err(''); });
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var a = $('f-pw1').value, b = $('f-pw2').value;
    if (a.length < 8) return err('Kies een wachtwoord van minstens 8 tekens.');
    if (a !== b) return err('De twee wachtwoorden zijn niet hetzelfde.');
    var go = $('f-go'); go.disabled = true; go.textContent = 'Even geduld…';
    SparkAccount.changePassword(a).then(function () {
      linkState = null;
      $('acc-body').innerHTML = '<div class="panel"><span class="kicker">Spark Account</span><h1>Je wachtwoord is gewijzigd</h1><p>Je kunt nu inloggen met je nieuwe wachtwoord, in de store en op de website.</p><a class="btn" href="#account" onclick="drawAccount()">Naar je account</a></div>';
    }).catch(function (e) { go.disabled = false; go.textContent = 'Wachtwoord opslaan'; err(e.code === 'auth' || e.code === 'expired' ? 'Deze link is verlopen. Vraag een nieuwe aan via Wachtwoord vergeten.' : e.message); });
  });
}

/* ---------- profiel ---------- */
function profileHtml(p) {
  var cur = 0, m = /^preset:(\d+)$/.exec(p.avatar_url || ''); if (m) cur = +m[1];
  var photo = /^https:\/\//.test(p.avatar_url || '');
  var pr = progressFor(p);
  var since = new Date(p.created_at), sinceTxt = isNaN(since) ? '—' : since.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  /* links: wie je bent en je instellingen */
  var h = '<aside class="panel dash-side" aria-label="Je profiel"><div class="me">' + SparkAccount.avatarHtml(p, 76) +
      '<div style="min-width:0"><h1>' + esc(p.display_name) + '</h1><div class="handle">@' + esc(p.username) + '</div>' +
      '<div class="pills"><span class="p">Level ' + pr.level + ' · ' + esc(SparkAccount.levelName(pr.level)) + '</span>' + (p.is_admin ? '<span class="p y">Beheerder</span>' : '') + '</div></div></div>' +
      '<button class="linkbtn" id="av-toggle">' + (acc.pickAvatar ? 'Klaar met avatar kiezen' : 'Avatar of foto wijzigen') + '</button>';
  if (acc.pickAvatar) {
    h += '<div class="av-grid" role="group" aria-label="Kies een avatar">';
    for (var i = 1; i <= SparkAccount.presetCount; i++) h += '<button class="av-pick" aria-pressed="' + (i === cur) + '" data-av="' + i + '" aria-label="Avatar ' + i + '">' + SparkAccount.avatarHtml(p, 44, i) + '</button>';
    h += '<button class="av-pick" aria-pressed="' + (!cur && !photo) + '" data-av="0" aria-label="Eerste letter van je naam">' + SparkAccount.avatarHtml({ display_name: p.display_name }, 44) + '</button></div>' +
      '<label class="btn ghost sm" style="align-self:flex-start;cursor:pointer">Eigen foto uploaden<input type="file" id="av-file" accept="image/jpeg,image/png,image/webp" class="sr-only"></label>' +
      '<p class="small">Een foto van maximaal 2 MB. Die is zichtbaar voor andere Spark-gebruikers.</p>';
  }
  h += '<div class="side-sep"></div>' +
    '<form class="field" id="name-form" novalidate><span>Je naam</span><div class="row"><input class="inp" id="f-name" maxlength="40" value="' + esc(p.display_name) + '" aria-label="Je naam"><button class="btn sm" id="f-go" type="submit">Opslaan</button></div><p class="err" id="f-err" role="alert" hidden></p></form>' +
    '<div class="info"><div><span>E-mail</span><b>' + esc(p.email || '') + '</b></div><div><span>Lid sinds</span><b>' + esc(sinceTxt) + '</b></div></div>' +
    '<div class="side-sep"></div>' +
    '<div class="row"><button class="btn ghost sm" id="sign-out">Uitloggen</button>' +
      (p.is_admin ? '' : '<button class="btn danger sm" id="del-acc">' + (acc.delArm ? 'Zeker weten? Klik nog een keer' : 'Account verwijderen') + '</button>') + '</div>' +
    (p.is_admin ? '' : '<p class="small">Verwijderen haalt je account, profiel en Spark-niveau definitief weg.</p>') +
  '</aside>';
  /* rechts: niveau bovenaan, daaronder badges en berichten naast elkaar */
  h += '<div class="dash-main">' + levelHtml(pr) + '<div class="dash-row">' + badgesHtml(pr) +
    '<section class="panel" id="acc-req"><div class="row" style="justify-content:space-between"><h2>Je berichten</h2><a class="linkbtn" href="#aanvragen">Alles bekijken</a></div><p class="small">Even laden…</p></section>' +
  '</div></div>';
  return h;
}

function progressFor(p) {
  if (acc.progress) return acc.progress;
  SparkAccount.progress().then(function (r) { if (r && typeof r.xp === 'number') { acc.progress = r; if (curView === 'account' && SparkAccount.isSignedIn()) drawAccount(); } });
  var L = +p.level || 1;
  return { xp: +p.xp || 0, level: L, level_start_xp: 25 * (L - 1) * L, next_level_xp: 25 * L * (L + 1), badges: null };
}

function levelHtml(pr) {
  var pct = pr.next_level_xp ? Math.max(3, Math.min(100, Math.round((pr.xp - pr.level_start_xp) / (pr.next_level_xp - pr.level_start_xp) * 100))) : 100;
  return '<section class="panel lvl-panel"><div class="lvl-top"><div class="lvl-num"><b>' + pr.level + '</b><span>level</span></div>' +
      '<div class="lvl-txt"><span class="kicker">Spark-niveau</span><b class="name">' + esc(SparkAccount.levelName(pr.level)) + '</b>' +
      '<div class="sub">' + fmt(pr.xp) + ' XP' + (pr.next_level_xp ? ' · nog ' + fmt(pr.next_level_xp - pr.xp) + ' tot level ' + (pr.level + 1) : ' · hoogste level') + '</div></div>' +
      '<p class="small lvl-note">Je verdient punten door de Spark-apps te gebruiken. Alle apps tellen mee voor hetzelfde niveau.</p></div>' +
    '<div class="bar" role="progressbar" aria-label="Voortgang naar het volgende level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div></section>';
}

function badgesHtml(pr) {
  if (!pr.badges) return '<section class="panel"><h2>Badges</h2><p class="small">Je badges worden geladen…</p></section>';
  var n = pr.badges.filter(function (b) { return b.earned_at; }).length;
  var list = pr.badges.slice().sort(function (a, b) { return (b.earned_at ? 1 : 0) - (a.earned_at ? 1 : 0); });
  return '<section class="panel"><div class="row" style="justify-content:space-between"><h2>Badges</h2><span class="small">' + n + ' van ' + pr.badges.length + '</span></div><div class="bdgs">' +
    list.map(function (b) { return '<div class="bdg' + (b.earned_at ? ' on' : '') + '" title="' + esc(b.description) + '"><div class="ic">' + (b.earned_at ? star(20, '#0B1B3A') : lock()) + '</div><b>' + esc(b.name) + '</b><span>' + esc(b.description) + '</span></div>'; }).join('') +
  '</div></section>';
}

function bindProfile() {
  fillAccReq();
  $('av-toggle').addEventListener('click', function () { acc.pickAvatar = !acc.pickAvatar; drawAccount(); });
  [].forEach.call(document.querySelectorAll('[data-av]'), function (b) {
    b.addEventListener('click', function () {
      var n = +b.getAttribute('data-av');
      SparkAccount.updateProfile({ avatar_url: n ? 'preset:' + n : null }).then(function () {
        acc.pickAvatar = false; drawAccount(); toast('Avatar opgeslagen');
        if (n) SparkAccount.award('store', 'avatar_set');
      }).catch(function (e) { toast(e.message); });
    });
  });
  var file = $('av-file');
  if (file) file.addEventListener('change', function () {
    var f = file.files[0]; if (!f) return;
    toast('Foto uploaden…');
    SparkAccount.uploadAvatar(f).then(function () { acc.pickAvatar = false; drawAccount(); toast('Foto opgeslagen'); SparkAccount.award('store', 'avatar_set'); })
      .catch(function (e) { toast(e.message); });
  });
  $('name-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = ($('f-name').value || '').trim(); if (!v) return err('Je naam mag niet leeg zijn.');
    $('f-go').disabled = true;
    SparkAccount.updateProfile({ display_name: v }).then(function () { toast('Naam opgeslagen'); drawAccount(); })
      .catch(function (x) { $('f-go').disabled = false; err(x.message); });
  });
  $('f-name').addEventListener('input', function () { err(''); });
  $('sign-out').addEventListener('click', function () { acc.progress = null; linkState = null; req.mine = null; markUnread(false); SparkAccount.signOut().then(function () { acc.mode = 'login'; drawAccount(); toast('Uitgelogd'); }); });
  var del = $('del-acc');
  if (del) del.addEventListener('click', function () {
    if (!acc.delArm) { acc.delArm = true; drawAccount(); setTimeout(function () { if (acc.delArm) { acc.delArm = false; drawAccount(); } }, 5000); return; }
    acc.delArm = false;
    SparkAccount.deleteAccount().then(function () { acc.mode = 'login'; drawAccount(); toast('Je account is verwijderd'); }).catch(function (e) { toast(e.message); drawAccount(); });
  });
}

function onScroll() { $('top').classList.toggle('scrolled', window.scrollY > 24); }
window.addEventListener('scroll', onScroll, { passive: true });


/* =============================================================
   5. Wat is er nieuw (alle updates van alle apps)
   ============================================================= */
var UPDATES = null, newsPick = '';
function buildUpdates(list) {
  var out = [];
  list.forEach(function (s) {
    var known = APPS.filter(function (a) { return a.pkg && a.pkg === s.package_name; })[0];
    var look = known || { name: s.name, bg: /^#[0-9a-f]{6}$/i.test(s.color || '') ? s.color : '#12285A', icon: /^https:\/\/[^"'<>\s]+$/.test(s.icon_url || '') ? s.icon_url : '' };
    (s.app_versions || []).forEach(function (v) {
      if (!v.created_at) return;
      out.push({ app: s.package_name === STORE_PKG ? 'Spark Apps' : s.name, look: look, version: v.version_name, code: v.version_code, notes: (v.changelog || '').trim(), at: v.created_at, store: s.package_name === STORE_PKG });
    });
  });
  out.sort(function (a, b) { return b.at < a.at ? -1 : b.at > a.at ? 1 : 0; });
  UPDATES = out;
  drawNewsTeaser();
  if (curView === 'nieuw') drawNews();
}

var MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
function fmtDay(iso) { var d = new Date(iso); return d.getDate() + ' ' + MONTHS[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : ''); }
function ago(iso) {
  var d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  return d <= 0 ? 'vandaag' : d === 1 ? 'gisteren' : d < 7 ? d + ' dagen geleden' : fmtDay(iso);
}
function storeIco(size) { return '<span class="app-ico" style="width:' + size + 'px;height:' + size + 'px;background:var(--spark)">' + star(Math.round(size * .5), '#0B1B3A') + '</span>'; }

function updateItem(u) {
  return '<li class="upd"><div class="upd-ico">' + (u.store ? storeIco(48) : icoHtml(u.look, 48)) + '</div><div class="upd-txt">' +
    '<div class="upd-head"><b>' + esc(u.app) + '</b><span class="ver">' + esc(u.version) + '</span><span class="when">' + esc(ago(u.at)) + '</span></div>' +
    '<p>' + esc(u.notes || 'Verbeteringen en kleine fixes.') + '</p></div></li>';
}

function drawNewsTeaser() {
  var el = $('news-teaser'); if (!el) return;
  if (!UPDATES || !UPDATES.length) { el.innerHTML = '<p class="small">Updates verschijnen hier zodra ze er zijn.</p>'; return; }
  el.innerHTML = '<ul class="upd-list">' + UPDATES.slice(0, 3).map(updateItem).join('') + '</ul>';
}

function drawNews() {
  var el = $('news-body');
  var head = '<div class="page-head"><span class="kicker">Wat is er nieuw</span><h1>Alle updates van Spark.</h1>' +
    '<p>Elke nieuwe versie van elke app. Heb je de Spark-appstore? Dan komen deze updates vanzelf bij je binnen.</p></div>';
  if (!UPDATES) { el.innerHTML = head + '<div class="panel"><p class="small">Even laden…</p></div>'; return; }
  var names = []; UPDATES.forEach(function (u) { if (names.indexOf(u.app) < 0) names.push(u.app); }); names.sort();
  var list = UPDATES.filter(function (u) { return !newsPick || u.app === newsPick; });
  var html = head + '<div class="tabs" id="news-chips" role="group" aria-label="Filter op app">' + [''].concat(names).map(function (n) {
    return '<button class="chip" aria-pressed="' + (newsPick === n) + '" data-n="' + esc(n) + '">' + (n ? esc(n) : 'Alle apps') + '</button>'; }).join('') + '</div>';
  if (!list.length) html += '<div class="panel"><p>Nog geen updates.</p></div>';
  var month = '';
  list.slice(0, 80).forEach(function (u) {
    var d = new Date(u.at), m = MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    if (m !== month) { if (month) html += '</ul></section>'; month = m; html += '<section class="month"><h2>' + esc(m.charAt(0).toUpperCase() + m.slice(1)) + '</h2><ul class="upd-list">'; }
    html += updateItem(u);
  });
  if (month) html += '</ul></section>';
  el.innerHTML = html;
  var chips = $('news-chips');
  if (chips) chips.addEventListener('click', function (e) { var b = e.target.closest('[data-n]'); if (!b) return; newsPick = b.getAttribute('data-n'); drawNews(); });
}

/* =============================================================
   6. App aanvragen, fout melden, feedback
   ============================================================= */
var req = { kind: 'app', draft: {}, mine: null, busy: false, sent: false, armDel: '' };
var REQ_KINDS = [['app', 'Een app aanvragen'], ['fout', 'Een fout melden'], ['feedback', 'Feedback geven']];
var REQ_STATUS = { nieuw: 'Ontvangen', bekeken: 'Bekeken', bezig: 'Mee bezig', klaar: 'Klaar', afgewezen: 'Niet opgepakt' };
var REQ_TAG = { app: 'App-aanvraag', fout: 'Fout', feedback: 'Feedback' };

function reqFromQuery(q) {
  if (!q) return;
  var p = new URLSearchParams(q);
  var k = p.get('soort'); if (k && /^(app|fout|feedback)$/.test(k)) req.kind = k;
  var a = p.get('app'); if (a) req.draft.app = a.slice(0, 60);
  req.sent = false;
  history.replaceState(null, '', location.pathname + '#aanvragen');
}

function appOptions(sel, withGeneral) {
  var names = APPS.map(function (a) { return a.name; }).concat(['Spark Apps (de appstore)', 'De website']);
  names = names.filter(function (n, i) { return names.indexOf(n) === i; });
  return (withGeneral ? '<option value="">Algemeen</option>' : '<option value="">Kies een app</option>') +
    names.map(function (n) { return '<option' + (n === sel ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('');
}

function reqFormHtml() {
  var k = req.kind, d = req.draft, signed = SparkAccount.isSignedIn();
  var title = { app: ['Wat moet de app doen?', 'Bijv. Een app om boodschappen te verdelen'], fout: ['Wat gaat er mis?', 'Bijv. De nachttoeslag klopt niet na 00:00'], feedback: ['Je tip of compliment in één zin', 'Bijv. Een donkere modus zou fijn zijn'] }[k];
  var body = { app: ['Vertel er meer over', 'Voor wie is het? Wat moet erin zitten? Wat gebruik je nu?'], fout: ['Hoe kunnen we het zien gebeuren?', 'Wat deed je, wat verwachtte je en wat gebeurde er?'], feedback: ['Wil je nog iets toevoegen?', 'Optioneel'] }[k];
  return '<div class="panel"><div class="seg" role="tablist" aria-label="Wat wil je doen?">' + REQ_KINDS.map(function (x) {
      return '<button role="tab" type="button" aria-selected="' + (k === x[0]) + '" data-kind="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>' +
    (req.sent ? '<div class="okmsg" role="status">' + check() + ' Verstuurd! Je ziet hieronder wanneer er een antwoord is.</div>' : '') +
    '<form id="req-form" novalidate style="display:flex;flex-direction:column;gap:14px">' +
      (k !== 'app' ? '<label class="field"><span>' + (k === 'fout' ? 'Welke app?' : 'Over welke app?') + '</span><select class="inp" id="r-app">' + appOptions(d.app, k === 'feedback') + '</select></label>' : '') +
      '<label class="field"><span>' + title[0] + '</span><input class="inp" id="r-title" maxlength="100" placeholder="' + esc(title[1]) + '" value="' + esc(d.title || '') + '"></label>' +
      '<label class="field"><span>' + body[0] + '</span><textarea class="inp area" id="r-body" maxlength="3000" rows="5" placeholder="' + esc(body[1]) + '">' + esc(d.body || '') + '</textarea></label>' +
      (k === 'fout' ? '<label class="field"><span>Welke telefoon heb je?</span><input class="inp" id="r-device" maxlength="200" placeholder="Bijv. Samsung Galaxy A54, Android 14" value="' + esc(d.device || '') + '"><small>Helpt om de fout te vinden. Mag je leeg laten.</small></label>' : '') +
      '<p class="err" id="r-err" role="alert" hidden></p>' +
      '<button class="btn full" id="r-go" type="submit">' + (signed ? 'Versturen' : 'Log in om te versturen') + '</button>' +
      (signed ? '<p class="small">Alleen Spark kan dit lezen. Je krijgt hier en op je account een antwoord.</p>' : '<p class="small">Je hebt een gratis Spark Account nodig, zodat je ook een antwoord kunt krijgen. Wat je al getypt hebt, blijft bewaard.</p>') +
    '</form></div>';
}

function reqItem(r) {
  var unread = r.replied_at && (!r.seen_at || r.seen_at < r.replied_at);
  return '<li class="msg' + (unread ? ' unread' : '') + '"><div class="msg-top"><span class="tag t-' + esc(r.kind) + '">' + esc(REQ_TAG[r.kind] || r.kind) + '</span>' +
      '<span class="st st-' + esc(r.status) + '">' + esc(REQ_STATUS[r.status] || r.status) + '</span>' + (unread ? '<span class="new">Nieuw antwoord</span>' : '') + '</div>' +
    '<b>' + esc(r.title) + '</b><span class="small">' + (r.app_name ? esc(r.app_name) + ' · ' : '') + esc(ago(r.created_at)) + '</span>' +
    (r.reply ? '<div class="reply"><span class="kicker">Antwoord van Spark</span><p>' + esc(r.reply) + '</p></div>' : '') +
    (r.status === 'nieuw' ? '<button class="linkbtn" data-del="' + esc(r.id) + '">' + (req.armDel === r.id ? 'Zeker weten? Klik nog een keer' : 'Intrekken') + '</button>' : '') +
  '</li>';
}

function drawReq() {
  var el = $('req-body');
  var html = '<div class="page-head"><span class="kicker">Aanvragen</span><h1>Idee of probleem? Laat het weten.</h1>' +
    '<p>Vraag een nieuwe app aan, meld een fout of geef een tip. Thomas leest alles en je ziet hier wat ermee gebeurt.</p></div>' + reqFormHtml();
  if (SparkAccount.isSignedIn()) {
    html += '<div class="panel"><h2>Je berichten</h2>';
    if (req.mine === null) html += '<p class="small">Even laden…</p>';
    else if (req.mine === 'error') html += '<p class="small">Je berichten zijn nu niet te laden. Probeer het later nog eens.</p>';
    else if (!req.mine.length) html += '<p class="small">Je hebt nog niks gestuurd.</p>';
    else html += '<ul class="msgs">' + req.mine.map(reqItem).join('') + '</ul>';
    html += '</div>';
  }
  el.innerHTML = html;
  bindReq();
  if (SparkAccount.isSignedIn() && req.mine === null) loadMyRequests();
  else if (Array.isArray(req.mine) && req.mine.some(function (r) { return r.replied_at && (!r.seen_at || r.seen_at < r.replied_at); })) setTimeout(markSeen, 1500);
}

function reqErr(m) { var e = $('r-err'); if (!e) return; e.textContent = m || ''; e.hidden = !m; }
function keepDraft() {
  ['app', 'title', 'body', 'device'].forEach(function (f) { var i = $('r-' + f); if (i) req.draft[f] = i.value; });
}

function bindReq() {
  [].forEach.call(document.querySelectorAll('[data-kind]'), function (b) {
    b.addEventListener('click', function () { keepDraft(); req.kind = b.getAttribute('data-kind'); req.sent = false; drawReq(); });
  });
  var f = $('req-form');
  f.addEventListener('input', function () { reqErr(''); keepDraft(); });
  f.addEventListener('submit', function (e) { e.preventDefault(); sendReq(); });
  [].forEach.call(document.querySelectorAll('[data-del]'), function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-del');
      if (req.armDel !== id) { req.armDel = id; drawReq(); setTimeout(function () { if (req.armDel === id) { req.armDel = ''; if (curView === 'aanvragen') drawReq(); } }, 5000); return; }
      req.armDel = '';
      SparkAccount.rest('spark_requests?id=eq.' + encodeURIComponent(id), 'DELETE', null, 'return=minimal')
        .then(function () { req.mine = req.mine.filter(function (r) { return r.id !== id; }); drawReq(); toast('Ingetrokken'); })
        .catch(function (x) { toast(x.message); drawReq(); });
    });
  });
}

function sendReq() {
  if (req.busy) return;
  keepDraft();
  if (!SparkAccount.isSignedIn()) { acc.mode = 'login'; acc.returnTo = 'aanvragen'; location.hash = 'account'; return; }
  var d = req.draft, k = req.kind, t = (d.title || '').trim(), b = (d.body || '').trim();
  if (k === 'fout' && !d.app) return reqErr('Kies over welke app het gaat.');
  if (t.length < 3) return reqErr('Schrijf in een paar woorden waar het over gaat.');
  if (k === 'app' && b.length < 10) return reqErr('Vertel iets meer over de app, dan snapt Thomas wat je bedoelt.');
  if (k === 'fout' && b.length < 10) return reqErr('Beschrijf kort wat er gebeurt, dan kan de fout gevonden worden.');
  var row = { kind: k, title: t.slice(0, 100), body: b.slice(0, 3000), app_name: k === 'app' ? null : (d.app || null), device: k === 'fout' ? ((d.device || '').trim().slice(0, 200) || null) : null };
  var go = $('r-go'); req.busy = true; go.disabled = true; go.textContent = 'Versturen…';
  SparkAccount.rest('spark_requests', 'POST', row, 'return=representation').then(function (r) {
    req.busy = false; req.draft = {}; req.sent = true;
    var added = Array.isArray(r) ? r[0] : r;
    if (Array.isArray(req.mine) && added) req.mine.unshift(added); else req.mine = null;
    drawReq(); toast('Verstuurd, dank je!');
  }).catch(function (x) {
    req.busy = false; go.disabled = false; go.textContent = 'Versturen';
    reqErr(/spark_requests|relation|schema/i.test(x.message || '') ? 'Insturen kan nog niet. Probeer het later nog eens of mail info@sparkapps.nl.' : (x.message || 'Versturen lukte niet.'));
  });
}

function loadMyRequests() {
  if (!SparkAccount.isSignedIn()) return Promise.resolve();
  return SparkAccount.select('spark_requests?select=*&order=created_at.desc&limit=50').then(function (rows) {
    req.mine = Array.isArray(rows) ? rows : [];
  }).catch(function () { req.mine = 'error'; }).then(function () {
    markUnread(Array.isArray(req.mine) && req.mine.some(function (r) { return r.replied_at && (!r.seen_at || r.seen_at < r.replied_at); }));
    if (curView === 'aanvragen') drawReq();
    if (curView === 'account') fillAccReq();
  });
}

function markSeen() {
  if (!Array.isArray(req.mine)) return;
  SparkAccount.rpc('spark_requests_seen', {}).then(function () {
    var now = new Date().toISOString();
    req.mine.forEach(function (r) { if (r.replied_at) r.seen_at = now; });
    markUnread(false);
  }).catch(function () {});
}

var hasNewReply = false;
function markUnread(on) { hasNewReply = !!on; var b = $('acc-btn'); if (b) b.classList.toggle('has-new', hasNewReply && !!SparkAccount.cached()); }

function fillAccReq() {
  var el = $('acc-req'); if (!el) return;
  var top = '<div class="row" style="justify-content:space-between"><h2>Je berichten</h2><a class="linkbtn" href="#aanvragen">' + (Array.isArray(req.mine) && req.mine.length ? 'Alles bekijken' : 'Iets insturen') + '</a></div>';
  if (req.mine === null) { el.innerHTML = top + '<p class="small">Even laden…</p>'; loadMyRequests(); return; }
  if (!Array.isArray(req.mine) || !req.mine.length) { el.innerHTML = top + '<p class="small">Heb je een idee voor een app of loop je ergens tegenaan? <a href="#aanvragen">Laat het weten</a>, dan zie je hier het antwoord.</p>'; return; }
  el.innerHTML = top + '<ul class="msgs">' + req.mine.slice(0, 4).map(reqItem).join('') + '</ul>';
  [].forEach.call(el.querySelectorAll('[data-del]'), function (b) { b.remove(); });
}

/* =============================================================
   7. Start
   ============================================================= */
drawHero(); drawApps(); drawBuildSteps(); drawAccBtn();
route();
onScroll();
loadServer();
if (SparkAccount.isSignedIn() && !linkState) SparkAccount.profile().then(function () { drawAccBtn(); loadMyRequests(); }).catch(function (e) { if (e.code === 'blocked') toast(e.message); drawAccBtn(); });
