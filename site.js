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
function route() {
  var h = location.hash.slice(1);
  var view = h === 'account' ? 'account' : 'home';
  if (view !== curView) {
    curView = view;
    $('v-home').hidden = view !== 'home';
    $('v-account').hidden = view !== 'account';
    window.scrollTo(0, 0);
  }
  if (view === 'account') { drawAccount(); document.title = 'Spark Account · Spark Apps'; }
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

function drawMosaic() {
  var list = APPS.filter(function (a) { return a.icon; }).slice(0, 11), h = '';
  list.forEach(function (a, i) {
    if (i === 5) h += '<div class="tile star">' + star(48, '#0B1B3A') + '</div>';
    h += '<div class="tile"><img src="' + esc(a.icon) + '" alt=""></div>';
  });
  $('mosaic').innerHTML = h;
}

function drawApps() {
  var cats = [];
  APPS.forEach(function (a) { if (a.cat && cats.indexOf(a.cat) < 0) cats.push(a.cat); });
  cats.sort(function (x, y) { var i = CAT_ORDER.indexOf(x), j = CAT_ORDER.indexOf(y); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); });
  $('chips').innerHTML = ['', ].concat(cats).map(function (c) {
    return '<button class="chip" aria-pressed="' + (catPick === c) + '" data-cat="' + esc(c) + '">' + (c ? esc(c) : 'Alle apps') + '</button>';
  }).join('');
  var list = APPS.filter(function (a) { return !catPick || a.cat === catPick; });
  $('app-grid').innerHTML = list.map(function (a) {
    return '<button class="app-card" data-app="' + esc(a.id) + '">' + icoHtml(a, 64) +
      '<span class="t"><span class="tag">' + esc(a.cat || 'App') + '</span><b>' + esc(a.name) + '</b><span class="s">' + esc(a.tagline) + '</span></span></button>';
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
      '<a class="btn" href="#download" onclick="$(\'dlg-app\').close()">Installeren via de Spark-appstore</a>' +
    '</div>';
  $('dlg-app').showModal();
}
$('dlg-app').addEventListener('click', function (e) { if (e.target === this) this.close(); });

function drawBuildSteps() {
  var steps = window.SPARK_STEPS || [];
  $('build-steps').innerHTML = steps.map(function (s) { return '<li><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></li>'; }).join('');
}

/* Gegevens van de server: nieuwe apps, de store-download en de cijfers */
function loadServer() {
  if (!SparkAccount.configured()) return;
  SparkAccount.rpc('public_stats', {}).then(function (s) {
    if (!s) return;
    $('st-dl').textContent = fmt(s.downloads);
    $('st-acc').textContent = fmt(s.accounts);
  }).catch(function () {});
  SparkAccount.select('apps?status=eq.live&select=id,slug,name,tagline,description,icon_url,color,package_name,app_versions(version_name,version_code,apk_path,size_bytes)')
    .then(function (list) {
      if (!Array.isArray(list)) return;
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
    }).catch(function () {});
}
$('dl-btn').addEventListener('click', function (e) { if (this.getAttribute('aria-disabled') === 'true') { e.preventDefault(); toast('De download komt eraan. Mail info@sparkapps.nl als je hem nu al wilt.'); } });

/* =============================================================
   4. Spark Account
   ============================================================= */
var acc = { mode: 'login', busy: false, progress: null, pickAvatar: false, delArm: false, unameT: null, forgotSent: false };

function drawAccBtn() {
  var b = $('acc-btn'), p = SparkAccount.cached();
  if (p) { b.className = 'acc-btn'; b.innerHTML = esc(p.display_name) + ' ' + SparkAccount.avatarHtml(p, 32); b.setAttribute('aria-label', 'Je account: ' + p.display_name); }
  else { b.className = 'acc-btn out'; b.textContent = 'Inloggen'; b.removeAttribute('aria-label'); }
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
    acc.progress = null; drawAccount(); drawAccBtn();
    toast(reg ? 'Welkom bij Spark!' : 'Ingelogd');
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
  var h = '<div class="panel"><div class="me">' + SparkAccount.avatarHtml(p, 88) +
      '<div style="min-width:0"><h1>' + esc(p.display_name) + '</h1><div class="handle">@' + esc(p.username) + '</div>' +
      '<div class="pills"><span class="pill">Level ' + (+p.level || 1) + ' · ' + esc(SparkAccount.levelName(p.level)) + '</span>' + (p.is_admin ? '<span class="pill y">Beheerder</span>' : '') + '</div></div></div>' +
      '<button class="linkbtn" id="av-toggle">' + (acc.pickAvatar ? 'Klaar met avatar kiezen' : 'Avatar of foto wijzigen') + '</button>';
  if (acc.pickAvatar) {
    h += '<div class="av-grid" role="group" aria-label="Kies een avatar">';
    for (var i = 1; i <= SparkAccount.presetCount; i++) h += '<button class="av-pick" aria-pressed="' + (i === cur) + '" data-av="' + i + '" aria-label="Avatar ' + i + '">' + SparkAccount.avatarHtml(p, 52, i) + '</button>';
    h += '<button class="av-pick" aria-pressed="' + (!cur && !photo) + '" data-av="0" aria-label="Eerste letter van je naam">' + SparkAccount.avatarHtml({ display_name: p.display_name }, 52) + '</button></div>' +
      '<label class="btn ghost sm" style="align-self:flex-start;cursor:pointer">Eigen foto uploaden<input type="file" id="av-file" accept="image/jpeg,image/png,image/webp" class="sr-only"></label>' +
      '<p class="small">Een foto van maximaal 2 MB. Die is zichtbaar voor andere Spark-gebruikers.</p>';
  }
  h += '</div>' + levelHtml(p);
  h += '<div class="panel"><h2>Je naam</h2><form class="row" id="name-form" novalidate><input class="inp" id="f-name" maxlength="40" value="' + esc(p.display_name) + '" aria-label="Je naam"><button class="btn sm" id="f-go" type="submit">Opslaan</button></form><p class="err" id="f-err" role="alert" hidden></p></div>';
  h += '<div class="panel info"><div><span>E-mail</span><b>' + esc(p.email || '') + '</b></div><div><span>Lid sinds</span><b>' + esc(new Date(p.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })) + '</b></div></div>';
  h += '<div class="panel"><div class="row"><button class="btn ghost" id="sign-out">Uitloggen</button>' +
       (p.is_admin ? '' : '<button class="btn danger" id="del-acc">' + (acc.delArm ? 'Zeker weten? Klik nog een keer' : 'Account verwijderen') + '</button>') + '</div>' +
       (p.is_admin ? '' : '<p class="small">Verwijderen haalt je account, profiel en Spark-niveau definitief weg.</p>') + '</div>';
  return h;
}

function levelHtml(p) {
  var pr = acc.progress;
  if (!pr) {
    SparkAccount.progress().then(function (r) { if (r && typeof r.xp === 'number') { acc.progress = r; if (curView === 'account' && SparkAccount.isSignedIn()) drawAccount(); } });
    var L = +p.level || 1; pr = { xp: +p.xp || 0, level: L, level_start_xp: 25 * (L - 1) * L, next_level_xp: 25 * L * (L + 1), badges: null };
  }
  var pct = pr.next_level_xp ? Math.max(3, Math.min(100, Math.round((pr.xp - pr.level_start_xp) / (pr.next_level_xp - pr.level_start_xp) * 100))) : 100;
  var h = '<div class="panel"><div class="lvl-top"><div class="lvl-num"><b>' + pr.level + '</b><span>level</span></div><div><span class="kicker">Spark-niveau</span><br><b class="name">' + esc(SparkAccount.levelName(pr.level)) + '</b><div class="sub">' + fmt(pr.xp) + ' XP' + (pr.next_level_xp ? ' · nog ' + fmt(pr.next_level_xp - pr.xp) + ' tot level ' + (pr.level + 1) : ' · hoogste level') + '</div></div></div>' +
    '<div class="bar" role="progressbar" aria-label="Voortgang naar het volgende level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div>';
  if (pr.badges) {
    var n = pr.badges.filter(function (b) { return b.earned_at; }).length;
    h += '<div class="row" style="justify-content:space-between"><h2>Badges</h2><span class="small">' + n + ' van ' + pr.badges.length + '</span></div><div class="bdgs">' +
      pr.badges.map(function (b) { return '<div class="bdg' + (b.earned_at ? ' on' : '') + '"><div class="ic">' + (b.earned_at ? star(22, '#0B1B3A') : lock()) + '</div><b>' + esc(b.name) + '</b><span>' + esc(b.description) + '</span></div>'; }).join('') + '</div>';
  }
  return h + '<p class="small">Je verdient punten door de Spark-apps te gebruiken. Alle apps tellen mee voor hetzelfde niveau.</p></div>';
}

function bindProfile() {
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
  $('sign-out').addEventListener('click', function () { acc.progress = null; linkState = null; SparkAccount.signOut().then(function () { acc.mode = 'login'; drawAccount(); toast('Uitgelogd'); }); });
  var del = $('del-acc');
  if (del) del.addEventListener('click', function () {
    if (!acc.delArm) { acc.delArm = true; drawAccount(); setTimeout(function () { if (acc.delArm) { acc.delArm = false; drawAccount(); } }, 5000); return; }
    acc.delArm = false;
    SparkAccount.deleteAccount().then(function () { acc.mode = 'login'; drawAccount(); toast('Je account is verwijderd'); }).catch(function (e) { toast(e.message); drawAccount(); });
  });
}

/* =============================================================
   5. Start
   ============================================================= */
drawMosaic(); drawApps(); drawBuildSteps(); drawAccBtn();
route();
loadServer();
if (SparkAccount.isSignedIn() && !linkState) SparkAccount.profile().then(drawAccBtn).catch(function (e) { if (e.code === 'blocked') toast(e.message); drawAccBtn(); });
