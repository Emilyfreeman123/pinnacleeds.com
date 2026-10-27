/* Pinnacle EDS — hero network, parallax, scroll timeline.
   Everything here is decoration: the page is complete without it.
   Motion stops for prefers-reduced-motion and can be paused with the button. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hero = document.querySelector('.hero');
  var cv = hero && hero.querySelector('canvas.net');
  var btn = hero && hero.querySelector('.motion-btn');
  var raf = 0, paused = false, onScreen = true, tabVisible = true;

  /* ---------- Network ---------- */
  var net = null;
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = 1, nodes = [], pulses = [], t0 = 0, last = 0, nextPulse = 0;
    var ptr = { x: -9999, y: -9999, nx: 0.5, ny: 0.5, on: false };
    var LINK = 140;

    var size = function () {
      var r = cv.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      LINK = W < 700 ? 105 : 145;
      var count = Math.max(22, Math.min(95, Math.round((W * H) / (W < 700 ? 12000 : 10500))));
      var hubs = Math.max(4, Math.round(count / 9));
      nodes = [];
      for (var i = 0; i < count; i++) {
        var hub = i < hubs, z = hub ? 1 : 0.35 + Math.random() * 0.6;
        nodes.push({
          x: Math.random() * W, y: Math.random() * H, z: z, hub: hub,
          vx: (Math.random() - 0.5) * 0.18 * z, vy: (Math.random() - 0.5) * 0.18 * z,
          r: hub ? 3.4 : 1.2 + z * 1.4, flash: 0
        });
      }
      pulses = [];
    };

    var step = function (dt) {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx * dt * 0.06; n.y += n.vy * dt * 0.06;
        if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
        if (n.flash > 0) n.flash = Math.max(0, n.flash - dt / 700);
      }
    };

    var pos = function (n) { /* depth: nearer nodes shift more with the pointer */
      return { x: n.x + (0.5 - ptr.nx) * 26 * n.z, y: n.y + (0.5 - ptr.ny) * 18 * n.z };
    };

    var draw = function (now, animate) {
      ctx.clearRect(0, 0, W, H);
      var fade = animate ? Math.min(1, (now - t0) / 1600) : 1;
      var P = nodes.map(pos), i, j, a, b, dx, dy, d, lim, al;
      ctx.lineWidth = 1;
      for (i = 0; i < nodes.length; i++) {
        for (j = i + 1; j < nodes.length; j++) {
          a = P[i]; b = P[j]; dx = a.x - b.x; dy = a.y - b.y;
          lim = (nodes[i].hub || nodes[j].hub) ? LINK * 1.55 : LINK;
          if (Math.abs(dx) > lim || Math.abs(dy) > lim) continue;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d > lim) continue;
          al = (1 - d / lim) * 0.85 * Math.min(nodes[i].z, nodes[j].z + 0.2) * fade;
          ctx.strokeStyle = 'rgba(140,190,255,' + al.toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      if (ptr.on) { /* the pointer joins the network */
        for (i = 0; i < nodes.length; i++) {
          a = P[i]; dx = a.x - ptr.x; dy = a.y - ptr.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < 190) {
            al = (1 - d / 190) * 0.75;
            ctx.strokeStyle = 'rgba(190,225,255,' + al.toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(ptr.x, ptr.y); ctx.lineTo(a.x, a.y); ctx.stroke();
          }
        }
      }
      for (i = 0; i < pulses.length; i++) { /* data moving along the lines */
        var p = pulses[i], A = P[p.a], B = P[p.b], k = p.t,
            x = A.x + (B.x - A.x) * k, y = A.y + (B.y - A.y) * k,
            g = ctx.createRadialGradient(x, y, 0, x, y, 12);
        g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.35, 'rgba(140,200,255,0.55)'); g.addColorStop(1, 'rgba(140,200,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 12, 0, 6.2832); ctx.fill();
      }
      for (i = 0; i < nodes.length; i++) {
        var n = nodes[i], q = P[i], base = (n.hub ? 0.95 : 0.35 + n.z * 0.5) * fade;
        if (n.hub) {
          var h = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 16 + n.flash * 14);
          h.addColorStop(0, 'rgba(140,200,255,' + (0.45 + n.flash * 0.4).toFixed(2) + ')'); h.addColorStop(1, 'rgba(140,200,255,0)');
          ctx.fillStyle = h; ctx.beginPath(); ctx.arc(q.x, q.y, 16 + n.flash * 14, 0, 6.2832); ctx.fill();
        }
        ctx.fillStyle = 'rgba(' + (n.flash > 0 ? '255,255,255' : '175,214,255') + ',' + Math.min(1, base + n.flash).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(q.x, q.y, n.r + n.flash * 1.5, 0, 6.2832); ctx.fill();
      }
    };

    var spawn = function () {
      for (var tries = 0; tries < 12; tries++) {
        var a = (Math.random() * nodes.length) | 0, b = (Math.random() * nodes.length) | 0;
        if (a === b) continue;
        var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, d = Math.sqrt(dx * dx + dy * dy);
        var lim = (nodes[a].hub || nodes[b].hub) ? LINK * 1.55 : LINK;
        if (d < lim * 0.9) { pulses.push({ a: a, b: b, t: 0, s: 0.0007 + Math.random() * 0.0006 }); return; }
      }
    };

    var frame = function (now) {
      raf = 0;
      if (paused || !onScreen || !tabVisible || reduce.matches) return;
      var dt = Math.min(48, now - (last || now)); last = now;
      step(dt);
      if (now > nextPulse && pulses.length < 6) { spawn(); nextPulse = now + 500 + Math.random() * 700; }
      for (var i = pulses.length - 1; i >= 0; i--) {
        pulses[i].t += pulses[i].s * dt;
        if (pulses[i].t >= 1) { nodes[pulses[i].b].flash = 1; pulses.splice(i, 1); }
      }
      draw(now, true);
      raf = requestAnimationFrame(frame);
    };

    net = {
      start: function () { if (!raf && !paused && onScreen && tabVisible && !reduce.matches) { last = 0; raf = requestAnimationFrame(frame); } },
      still: function () { for (var i = 0; i < 160; i++) step(16); draw(0, false); },
      resize: function () { size(); if (reduce.matches || paused) net.still(); }
    };
    size(); t0 = performance.now();
    if (reduce.matches) net.still(); else net.start();

    var rt = 0;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(net.resize, 150); });
    hero.addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect();
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.nx = ptr.x / r.width; ptr.ny = ptr.y / r.height; ptr.on = true;
    });
    hero.addEventListener('pointerleave', function () { ptr.on = false; ptr.nx = 0.5; ptr.ny = 0.5; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; if (onScreen) net.start(); }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { tabVisible = !document.hidden; if (tabVisible) net.start(); });
  }

  /* ---------- Pause control ---------- */
  function syncButton() {
    if (!btn) return;
    btn.hidden = reduce.matches || !net;
    var lbl = btn.querySelector('.lbl');
    lbl.textContent = paused ? btn.getAttribute('data-play') : btn.getAttribute('data-pause');
    btn.classList.toggle('paused', paused);
  }
  if (btn) {
    btn.addEventListener('click', function () {
      paused = !paused; syncButton();
      if (paused) { if (raf) cancelAnimationFrame(raf); raf = 0; } else if (net) net.start();
    });
  }
  function onMotionPref() {
    syncButton();
    if (!net) return;
    if (reduce.matches) { if (raf) cancelAnimationFrame(raf); raf = 0; net.still(); } else net.start();
    onScroll();
  }
  if (reduce.addEventListener) reduce.addEventListener('change', onMotionPref); else if (reduce.addListener) reduce.addListener(onMotionPref);

  /* ---------- Parallax + scroll timeline ---------- */
  var layers = [].slice.call(document.querySelectorAll('[data-speed]'));
  var steps = document.querySelector('.steps');
  var stepItems = steps ? [].slice.call(steps.children) : [];
  var ticking = false;

  function update() {
    ticking = false;
    var vh = window.innerHeight, i, el, host, r, d;
    for (i = 0; i < layers.length; i++) {
      el = layers[i];
      if (reduce.matches) { el.style.transform = ''; continue; }
      host = el.closest('section'); if (!host) continue;
      r = host.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) continue;
      d = (r.top + r.height / 2) - vh / 2;
      el.style.transform = 'translate3d(0,' + (-d * parseFloat(el.getAttribute('data-speed'))).toFixed(1) + 'px,0)';
    }
    if (steps) {
      var p = 1;
      if (!reduce.matches) {
        var sr = steps.getBoundingClientRect(), vertical = window.matchMedia('(max-width: 60em)').matches;
        p = vertical ? (vh * 0.65 - sr.top) / sr.height : (vh * 0.85 - sr.top) / (vh * 0.4);
        p = Math.max(0, Math.min(1, p));
      }
      steps.style.setProperty('--p', p.toFixed(3));
      for (i = 0; i < stepItems.length; i++) {
        stepItems[i].classList.toggle('on', p >= (i / (stepItems.length - 1)) - 0.001 && (p > 0 || i === 0 && p > 0));
      }
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  syncButton();
  update();
})();
