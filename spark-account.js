/* =============================================================
   Spark Account — "Inloggen met Spark"
   Eén bestand dat in elke Spark-app past (WebView of website).

   Gebruik:
     SparkAccount.init({ url: 'https://xxxx.supabase.co', key: 'eyJ...' });
     SparkAccount.signIn(email, wachtwoord).then(...)
     SparkAccount.profile().then(function(p){ ... })

   Geen andere bibliotheken nodig: alles gaat via fetch.
   Later, met de eigen server, verander je alleen de url.
   ============================================================= */
(function (global) {
  'use strict';

  var cfg = { url: '', key: '' };
  var STORE_KEY = 'spark-session-v1';
  var PROFILE_KEY = 'spark-profile-v1';
  var listeners = [];
  var session = read(STORE_KEY);
  var cachedProfile = read(PROFILE_KEY);
  var refreshing = null;

  /* ---------- opslag ---------- */
  function read(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function write(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function emit() { listeners.forEach(function (f) { try { f(session ? cachedProfile : null); } catch (e) {} }); }

  /* ---------- foutmeldingen in gewoon Nederlands ---------- */
  function SparkError(msg, code) { var e = new Error(msg); e.code = code || 'error'; return e; }
  function friendly(raw, status) {
    var m = String(raw || '').toLowerCase();
    if (m.indexOf('invalid login') > -1) return SparkError('E-mail of wachtwoord klopt niet.', 'credentials');
    if (m.indexOf('email not confirmed') > -1) return SparkError('Bevestig eerst je e-mailadres via de mail die je kreeg.', 'unconfirmed');
    if (m.indexOf('already registered') > -1 || m.indexOf('already been registered') > -1) return SparkError('Er bestaat al een account met dit e-mailadres.', 'exists');
    if (m.indexOf('password should be') > -1 || m.indexOf('weak') > -1) return SparkError('Kies een sterker wachtwoord: minstens 8 tekens.', 'weak');
    if (m.indexOf('unable to validate email') > -1 || m.indexOf('invalid email') > -1 || m.indexOf('email address') > -1 && m.indexOf('invalid') > -1) return SparkError('Dit e-mailadres klopt niet.', 'email');
    if (m.indexOf('database error saving new user') > -1) return SparkError('Deze gebruikersnaam is al bezet of ongeldig.', 'username');
    if (m.indexOf('rate limit') > -1 || status === 429) return SparkError('Even te veel pogingen. Probeer het over een paar minuten opnieuw.', 'rate');
    if (m.indexOf('different from the old') > -1 || m.indexOf('same_password') > -1) return SparkError('Kies een ander wachtwoord dan je oude.', 'same');
    if (m.indexOf('jwt expired') > -1) return SparkError('Je sessie is verlopen. Log opnieuw in.', 'expired');
    if (m.indexOf('niet ingelogd') > -1) return SparkError('Je bent niet ingelogd.', 'auth');
    if (m.indexOf('beheerder') > -1) return SparkError(raw, 'admin');
    if (m.indexOf('username_format') > -1) return SparkError('Een gebruikersnaam is 3 tot 20 tekens: kleine letters, cijfers, _ of .', 'username');
    if (m.indexOf('profiles_username_key') > -1 || m.indexOf('duplicate') > -1) return SparkError('Deze gebruikersnaam is al bezet.', 'username');
    if (m.indexOf('display_name_length') > -1) return SparkError('Je naam mag 1 tot 40 tekens zijn.', 'name');
    if (status === 0) return SparkError('Geen verbinding. Check je internet en probeer het opnieuw.', 'offline');
    return SparkError(raw || 'Er ging iets mis. Probeer het opnieuw.', 'error');
  }

  /* ---------- verzoeken ---------- */
  function request(path, opts) {
    opts = opts || {};
    if (!cfg.url || !cfg.key) return Promise.reject(SparkError('Spark Account is nog niet ingesteld.', 'config'));
    var headers = { 'apikey': cfg.key, 'Content-Type': 'application/json' };
    if (opts.token) headers['Authorization'] = 'Bearer ' + opts.token;
    if (opts.prefer) headers['Prefer'] = opts.prefer;
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, opts.timeout || 15000) : null;
    return fetch(cfg.url + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body != null ? JSON.stringify(opts.body) : undefined,
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
        if (!res.ok) {
          var msg = data && (data.error_description || data.msg || data.message || data.error) || ('Fout ' + res.status);
          throw friendly(msg, res.status);
        }
        return data;
      });
    }, function () {
      if (timer) clearTimeout(timer);
      throw friendly('', 0);
    });
  }

  function saveSession(data) {
    if (!data || !data.access_token) return null;
    session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      user: { id: data.user && data.user.id, email: data.user && data.user.email }
    };
    write(STORE_KEY, session);
    return session;
  }

  function clearSession() {
    session = null; cachedProfile = null;
    write(STORE_KEY, null); write(PROFILE_KEY, null);
    emit();
  }

  /* Geeft een geldige toegangscode; vernieuwt hem op tijd. */
  function token() {
    if (!session) return Promise.resolve(null);
    var now = Math.floor(Date.now() / 1000);
    if (session.expires_at - now > 60) return Promise.resolve(session.access_token);
    if (refreshing) return refreshing;
    refreshing = request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } })
      .then(function (d) { saveSession(d); return session.access_token; })
      .catch(function (e) {
        if (e.code !== 'offline') clearSession();
        throw e;
      })
      .then(function (t) { refreshing = null; return t; }, function (e) { refreshing = null; throw e; });
    return refreshing;
  }

  function authed(path, opts) {
    return token().then(function (t) {
      if (!t) throw SparkError('Je bent niet ingelogd.', 'auth');
      opts = opts || {}; opts.token = t;
      return request(path, opts);
    });
  }

  /* ---------- gebruikersnaam ---------- */
  function cleanUsername(u) { return String(u || '').trim().replace(/^@/, '').toLowerCase(); }
  function validUsername(u) { return /^[a-z0-9_.]{3,20}$/.test(cleanUsername(u)); }

  /* ---------- profiel ---------- */
  function loadProfile() {
    if (!session) return Promise.resolve(null);
    return authed('/rest/v1/profiles?select=*&id=eq.' + encodeURIComponent(session.user.id))
      .then(function (rows) {
        var p = rows && rows[0] || null;
        if (p && p.is_blocked) {
          return request('/auth/v1/logout', { method: 'POST', token: session.access_token }).catch(function () {})
            .then(function () { clearSession(); throw SparkError('Je account is geblokkeerd. Denk je dat dit niet klopt? Mail naar info@sparkapps.nl.', 'blocked'); });
        }
        if (p) { p.email = session.user.email; cachedProfile = p; write(PROFILE_KEY, p); emit(); }
        return p;
      });
  }

  /* ---------- avatars ---------- */
  var PRESETS = [
    ['#FFD60A', '#0B1B3A'], ['#7AE7C7', '#08392C'], ['#FF8A8A', '#4A0E0E'], ['#8EA8FF', '#0E1E57'],
    ['#F2994A', '#3E1D02'], ['#C79BFF', '#2C0F57'], ['#5BD1F0', '#06323D'], ['#F7E3C4', '#3A2A12'],
    ['#9BE15D', '#183405'], ['#FF6FB5', '#4B0628'], ['#2F4BFF', '#FFFFFF'], ['#0E1116', '#FFD60A']
  ];
  var SPARK_PATH = 'M50 4 C54 36 64 46 96 50 C64 54 54 64 50 96 C46 64 36 54 4 50 C36 46 46 36 50 4 Z';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function presetIndex(p) { var m = /^preset:(\d{1,2})$/.exec(p && p.avatar_url || ''); return m ? Math.min(12, Math.max(1, +m[1])) : 0; }
  function avatarHtml(p, size, presetOverride) {
    size = size || 44;
    var n = presetOverride || presetIndex(p);
    var initial = esc(((p && (p.display_name || p.username)) || '?').trim().charAt(0).toUpperCase());
    if (!n && p && /^https:\/\//.test(p.avatar_url || '')) {
      return '<span class="spa-av" style="width:' + size + 'px;height:' + size + 'px"><img src="' + esc(p.avatar_url) + '" alt=""></span>';
    }
    var c = PRESETS[(n || 1) - 1];
    var inner = n ? '<svg viewBox="0 0 100 100" width="' + Math.round(size * .5) + '" height="' + Math.round(size * .5) + '" aria-hidden="true"><path d="' + SPARK_PATH + '" fill="' + c[1] + '"/></svg>'
                  : '<b style="font-size:' + Math.round(size * .42) + 'px;color:' + c[1] + '">' + initial + '</b>';
    return '<span class="spa-av" style="width:' + size + 'px;height:' + size + 'px;background:' + c[0] + '">' + inner + '</span>';
  }

  /* ---------- openbare functies ---------- */
  var api = {
    init: function (o) {
      cfg.url = String(o.url || '').replace(/\/+$/, '');
      cfg.key = String(o.key || '');
      if (/^sb_secret_/.test(cfg.key)) { cfg.key = ''; throw new Error('Gebruik nooit de geheime sleutel in een app.'); }
      return api;
    },
    configured: function () { return !!(cfg.url && cfg.key); },
    isSignedIn: function () { return !!session; },
    user: function () { return session ? session.user : null; },
    cached: function () { return session ? cachedProfile : null; },
    onChange: function (f) { listeners.push(f); return function () { listeners = listeners.filter(function (x) { return x !== f; }); }; },
    cleanUsername: cleanUsername,
    validUsername: validUsername,
    avatarHtml: avatarHtml,
    presetCount: PRESETS.length,

    usernameAvailable: function (u) {
      u = cleanUsername(u);
      if (!validUsername(u)) return Promise.resolve(false);
      return request('/rest/v1/rpc/username_available', { method: 'POST', body: { p_username: u } }).then(function (r) { return r === true; });
    },

    signUp: function (o) {
      var username = cleanUsername(o.username);
      if (!validUsername(username)) return Promise.reject(SparkError('Een gebruikersnaam is 3 tot 20 tekens: kleine letters, cijfers, _ of .', 'username'));
      if (!o.password || o.password.length < 8) return Promise.reject(SparkError('Kies een wachtwoord van minstens 8 tekens.', 'weak'));
      return api.usernameAvailable(username).then(function (free) {
        if (!free) throw SparkError('Deze gebruikersnaam is al bezet.', 'username');
        return request('/auth/v1/signup', { method: 'POST', body: {
          email: String(o.email || '').trim(), password: o.password,
          data: { username: username, display_name: String(o.displayName || '').trim() || username }
        } });
      }).then(function (d) {
        if (d && d.access_token) { saveSession(d); return loadProfile().then(function (p) { return { profile: p, needsConfirm: false }; }); }
        return { profile: null, needsConfirm: true };
      });
    },

    signIn: function (email, password) {
      return request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: String(email || '').trim(), password: password } })
        .then(function (d) { saveSession(d); return loadProfile(); });
    },

    signOut: function () {
      var t = session && session.access_token;
      clearSession();
      if (t) return request('/auth/v1/logout', { method: 'POST', token: t }).catch(function () {});
      return Promise.resolve();
    },

    /* Haalt het profiel opnieuw op (en checkt of het account geblokkeerd is). */
    profile: function () { return loadProfile(); },

    updateProfile: function (fields) {
      var allowed = {};
      if (fields.display_name != null) allowed.display_name = String(fields.display_name).trim();
      if (fields.avatar_url !== undefined) allowed.avatar_url = fields.avatar_url;
      return authed('/rest/v1/profiles?id=eq.' + encodeURIComponent(session.user.id), { method: 'PATCH', body: allowed, prefer: 'return=representation' })
        .then(function (rows) {
          var p = rows && rows[0];
          if (p) { p.email = session.user.email; cachedProfile = p; write(PROFILE_KEY, p); emit(); }
          return p;
        });
    },

    /* Inloggen met de gegevens uit een link in een mail (bevestigen / nieuw wachtwoord). */
    fromLink: function (p) {
      if (!p || !p.access_token) return Promise.resolve(null);
      var claims = {};
      try { var part = p.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'); claims = JSON.parse(decodeURIComponent(escape(atob(part)))); } catch (e) {}
      if (!claims.sub) return Promise.resolve(null);
      saveSession({ access_token: p.access_token, refresh_token: p.refresh_token, expires_in: +p.expires_in || 3600,
                    expires_at: +p.expires_at || 0, user: { id: claims.sub, email: claims.email } });
      return loadProfile().catch(function () { return null; });
    },

    changePassword: function (pw) {
      if (!pw || pw.length < 8) return Promise.reject(SparkError('Kies een wachtwoord van minstens 8 tekens.', 'weak'));
      return authed('/auth/v1/user', { method: 'PUT', body: { password: pw } }).then(function () { return true; });
    },

    /* Mail met een link om een nieuw wachtwoord te kiezen. */
    resetPassword: function (email, redirectTo) {
      var q = redirectTo ? '?redirect_to=' + encodeURIComponent(redirectTo) : '';
      return request('/auth/v1/recover' + q, { method: 'POST', body: { email: String(email || '').trim() } }).then(function () { return true; });
    },

    /* Eigen profielfoto uploaden (website). Max. 2 MB: jpg, png of webp. */
    uploadAvatar: function (file) {
      if (!session) return Promise.reject(SparkError('Je bent niet ingelogd.', 'auth'));
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return Promise.reject(SparkError('Kies een foto: jpg, png of webp.', 'file'));
      if (file.size > 2097152) return Promise.reject(SparkError('Deze foto is groter dan 2 MB.', 'file'));
      var ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      var path = session.user.id + '/avatar-' + Date.now() + '.' + ext;
      return token().then(function (t) {
        return fetch(cfg.url + '/storage/v1/object/avatars/' + path, {
          method: 'POST', headers: { 'apikey': cfg.key, 'Authorization': 'Bearer ' + t, 'Content-Type': file.type, 'x-upsert': 'false' }, body: file
        });
      }).then(function (res) {
        if (!res.ok) return res.text().then(function (x) { throw friendly(x || 'Uploaden mislukt', res.status); });
        return api.updateProfile({ avatar_url: api.storageUrl('avatars', path) });
      });
    },

    deleteAccount: function () {
      return api.rpc('delete_my_account', {}).then(function () { clearSession(); });
    },

    /* ---------- Spark-niveau ---------- */
    /* Geeft punten voor iets wat de gebruiker deed. De server bepaalt hoeveel.
       Geeft { points, xp, level, level_name, level_up, new_badges } terug, of null. */
    award: function (app, action) {
      if (!session) return Promise.resolve(null);
      return api.rpc('award_xp', { p_app: app, p_action: action }).then(function (r) {
        if (r && r.points > 0 && cachedProfile) {
          cachedProfile.xp = r.xp; cachedProfile.level = r.level; write(PROFILE_KEY, cachedProfile); emit();
        }
        return r;
      }).catch(function () { return null; });
    },
    progress: function () {
      if (!session) return Promise.resolve(null);
      return api.rpc('my_progress', {}).catch(function () { return null; });
    },
    levelName: function (l) {
      l = +l || 1;
      return l >= 50 ? 'Supernova' : l >= 40 ? 'Onweer' : l >= 30 ? 'Bliksem' : l >= 20 ? 'Flits' : l >= 10 ? 'Spark' : l >= 5 ? 'Sprankel' : 'Vonkje';
    },

    /* Algemene toegang voor app-eigen tabellen en functies. */
    rpc: function (fn, args) {
      var opts = { method: 'POST', body: args || {} };
      return session ? authed('/rest/v1/rpc/' + fn, opts) : request('/rest/v1/rpc/' + fn, opts);
    },
    select: function (pathAndQuery) {
      return session ? authed('/rest/v1/' + pathAndQuery) : request('/rest/v1/' + pathAndQuery);
    },
    storageUrl: function (bucket, path) {
      return cfg.url + '/storage/v1/object/public/' + bucket + '/' + String(path).split('/').map(encodeURIComponent).join('/');
    }
  };

  global.SparkAccount = api;
})(window);
