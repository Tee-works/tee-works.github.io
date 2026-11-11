(function () {
  var root = document.documentElement;
  root.classList.remove('no-js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // theme
  var themeBtn = document.getElementById('theme');
  function isDark() { return (root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark'; }
  function label() { if (themeBtn) themeBtn.textContent = isDark() ? 'Light' : 'Dark'; }
  label();
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next); label();
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // nav background
  var nav = document.getElementById('nav');
  var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 20); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var cur = nav.querySelector('.links a[aria-current="page"]');
  if (cur && cur.scrollIntoView && window.innerWidth < 980) { var l = nav.querySelector('.links'); l.scrollLeft = cur.offsetLeft - 16; }

  // reveal + counters
  function animateCount(el) {
    var to = parseFloat(el.dataset.to), dec = parseInt(el.dataset.dec || '0', 10);
    if (reduced) { el.textContent = to.toFixed(dec); return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        en.target.querySelectorAll('.count').forEach(animateCount);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
  }

  // hero stream (home only)
  var hero = document.getElementById('hero'), c = document.getElementById('stream');
  if (hero && c) (function () {
    var ctx = c.getContext('2d'), tag = document.getElementById('tagfx');
    var W, H, dpr, rows = [], mouse = { x: -999, y: -999 }, running = true;
    var findings = ['$2.97M · misattributed · traced', 'failed → success · flagged', '1,477 · parents contradict · flagged', '$2.17M · discounts zeroed · traced', '$99.6bn · counted twice · caught', '40 broken rows · quarantined'];
    var fi = 0, caught = null;
    function css(v) { return getComputedStyle(root).getPropertyValue(v).trim(); }
    function makeRow(y, scatter) {
      var segs = [], x = 0, count = 6 + Math.floor(Math.random() * 10);
      for (var k = 0; k < count; k++) { var w = 6 + Math.random() * 46; segs.push({ dx: x, w: w }); x -= w + 6 + Math.random() * 18; }
      return { y: y, x: scatter ? Math.random() * W * 1.4 : -Math.random() * 300, v: 0.3 + Math.random() * 0.85, segs: segs, a: (0.05 + Math.random() * 0.1) * (W < 700 ? 0.5 : 1), bad: false, lift: 0 };
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rows = []; for (var y = 7; y < H; y += 14) rows.push(makeRow(y, true));
      caught = null; tag.classList.remove('on');
    }
    hero.addEventListener('mousemove', function (e) { var r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    hero.addEventListener('mouseleave', function () { mouse.y = -999; });
    window.addEventListener('resize', resize);
    new IntersectionObserver(function (en) { running = en[0].isIntersecting; }).observe(hero);
    resize();
    function pickBad() {
      if (caught || !running) return;
      var cand = rows.filter(function (r) { return r.y > H * 0.88 && r.y < H * 0.97 && r.x > W * 0.3 && r.x < W * 0.85; });
      if (!cand.length) return;
      caught = cand[Math.floor(Math.random() * cand.length)];
      caught.bad = true; caught.t = 0;
      tag.textContent = findings[fi++ % findings.length];
    }
    setInterval(pickBad, 3200); setTimeout(pickBad, 900);
    function frame() {
      if (running) {
        var ink = css('--ink'), red = css('--red');
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i];
          var slow = Math.abs(r.y - mouse.y) < 60 ? 0.2 : 1;
          if (!r.bad && !reduced) r.x += r.v * slow;
          if (r.x - 900 > W) { var y = r.y; rows[i] = makeRow(y, false); r = rows[i]; }
          ctx.globalAlpha = r.bad ? 1 : r.a;
          ctx.fillStyle = r.bad ? red : ink;
          var ly = r.y - r.lift;
          for (var k = 0; k < r.segs.length; k++) ctx.fillRect(r.x + r.segs[k].dx, ly - 1, r.segs[k].w, 2);
        }
        if (caught) {
          caught.t += 1; caught.lift = Math.min(caught.t * 0.5, 18);
          var head = caught.x + caught.segs[0].dx + caught.segs[0].w;
          tag.style.left = Math.max(8, Math.min(head + 12, W - 280)) + 'px';
          tag.style.top = (caught.y - caught.lift - 32) + 'px';
          tag.classList.add('on');
          if (caught.t > 150) { tag.classList.remove('on'); caught.bad = false; caught.lift = 0; caught = null; }
        }
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(frame);
    }
    frame();
  })();

  // puzzle (home only)
  var reveal = document.getElementById('reveal');
  if (reveal) {
    var rows = document.querySelectorAll('#prows tr');
    rows.forEach(function (tr) {
      function pick() {
        rows.forEach(function (r) { r.classList.remove('picked'); r.classList.add('bad'); });
        tr.classList.add('picked');
        reveal.classList.add('show');
        reveal.innerHTML = '<b>Trick question: all four are wrong.</b>A subsidiary’s holdings were counted inside its parent’s book every quarter, so the error moved with the trend and every quarter-on-quarter check passed. Only a control that compares each entity with what it reports separately catches it. In the real filings it was up to $99.6bn in one report. <a href="' + reveal.dataset.href + '">See the case study &rarr;</a>';
      }
      tr.addEventListener('click', pick);
      tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
  }

  // work filters
  var filters = document.getElementById('filters');
  if (filters) {
    var cards = document.querySelectorAll('[data-cats]'), countEl = document.getElementById('fcount');
    function apply(f) {
      var n = 0;
      cards.forEach(function (cd) { var show = f === 'all' || cd.dataset.cats.split(' ').indexOf(f) > -1; cd.hidden = !show; if (show) n++; });
      document.querySelectorAll('[data-group]').forEach(function (g) { g.hidden = !g.querySelector('[data-cats]:not([hidden])'); });
      filters.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.f === f ? 'true' : 'false'); });
      if (countEl) countEl.textContent = n + (n === 1 ? ' project' : ' projects');
    }
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      apply(b.dataset.f);
      try { history.replaceState(null, '', b.dataset.f === 'all' ? location.pathname : '#' + b.dataset.f); } catch (err) {}
    });
    var h = location.hash.replace('#', '');
    apply(filters.querySelector('[data-f="' + h + '"]') ? h : 'all');
  }

  // contact form sent message
  if (/[?&]sent=1/.test(location.search)) { var s = document.getElementById('sent'); if (s) s.hidden = false; }
})();
