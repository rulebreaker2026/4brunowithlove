/* Uma mensagem para você — interaction logic.
   Screens: 0 abertura · 1 frases (4 raspadinhas) · 2 transição · 3 surpresa.
   Review helpers (URL): ?inicio=frases | ?inicio=surpresa · ?calmo=1 forces the reduced-motion version. */
(() => {
  'use strict';

  const PHRASES = [
    'Foram tantas loucurinhas que aconteceram entre nós que, pela lógica, eu deveria ter desistido. Mas a minha consideração por você, que vai além de mim, me impediu de fazer isso.',
    'Eu me importo com você, e você sabe disso. Mesmo nos dias em que a gente não se entendeu, o carinho e a preocupação nunca foram embora.',
    'Há sentimentos que não escolhemos e nem conseguimos controlar. Os meus por você são inevitáveis, e eu já aceitei isso.',
    'Por isso, hoje, eu preciso te dizer algumas coisas que até então tentei guardar só para mim…'
  ];
  const OUT = 'cubic-bezier(.2,.8,.2,1)';
  const CONF_COLS = ['#FF6B5B', '#1FB5AC', '#FFC93C', '#FF6FA8', '#4E7CFF'];

  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const mqR = matchMedia('(prefers-reduced-motion: reduce)');
  const forcedCalm = params.get('calmo') === '1';
  const rm = () => forcedCalm || mqR.matches;

  const el = {
    root: $('root'), screens: [$('s-opening'), $('s-cards'), $('s-transition'), $('s-surprise')],
    env: $('envelope'), flapO: $('flapO'), flapC: $('flapC'), letter: $('letter'),
    seal: $('seal'), sealInner: $('seal-inner'), sealL: $('sealL'), sealR: $('sealR'),
    openText: $('open-text'), openCont: $('open-cont'),
    progress: $('progress'), ghost: $('ghost'), card: $('card'), under: $('under'), underPhrase: $('under-phrase'),
    coat: $('coat'), canvas: $('scratch'), flakes: $('flakes'), revealNow: $('reveal-now'), next: $('next'),
    heart: $('heart'),
    surprise: $('s-surprise'), clown: $('clown'), upper: $('upper'), head: $('head'), arm: $('arm'),
    handBall: $('handBall'), ballF: $('ballF'), ballB: $('ballB'), pupilL: $('pupilL'), pupilR: $('pupilR'),
    poster: $('poster'), tchau: $('tchau'), again: $('again'), conf: $('confetti'),
    petals: $('petals'), grain: $('grain'), mute: $('mute'), muteLabel: $('mute-label'), live: $('live')
  };

  const state = { screen: 0, sealBroken: false, step: 1, revealed: false, blown: false, muted: false };

  /* ---------- timers (all interruptible) ---------- */
  let timers = [];
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const focus = node => node && node.focus({ preventScroll: true });

  /* ---------- cake (shared art for cards + transition) ---------- */
  function cakeSVG(shadow, ms, smoke) {
    const xs = [64, 88, 112, 136];
    const candles = xs.map(x => `<rect x="${x - 3.5}" y="48" width="7" height="26" rx="2" fill="#F4E9E4"/><rect x="${x - 3.5}" y="56" width="7" height="3" fill="#E08AA0"/><rect x="${x - 3.5}" y="64" width="7" height="3" fill="#E08AA0"/>`).join('');
    const flames = xs.map((x, i) => `<g class="flame" data-flame="${i + 1}" style="opacity:0; transition:opacity ${ms}ms ease"><circle cx="${x}" cy="34" r="10" fill="#FFC45C" opacity=".18"/><path d="M${x} 22C${x + 5.5} 29 ${x + 5.5} 36 ${x} 42 ${x - 5.5} 36 ${x - 5.5} 29 ${x} 22Z" fill="#FFB547"/><path d="M${x} 30C${x + 2.5} 34 ${x + 2.5} 38 ${x} 41 ${x - 2.5} 38 ${x - 2.5} 34 ${x} 30Z" fill="#FFF1D2"/></g>`).join('');
    const smokes = smoke ? xs.map(x => `<path data-smoke d="M${x} 40C${x - 4} 34 ${x + 4} 30 ${x} 24 ${x - 4} 18 ${x + 4} 14 ${x} 8" stroke="#CDB9B2" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0"/>`).join('') : '';
    return `<svg viewBox="0 0 200 130" aria-hidden="true"><ellipse cx="100" cy="119" rx="90" ry="7" fill="${shadow}"/><rect x="30" y="74" width="140" height="44" rx="10" fill="#F4E9E4"/><path d="M30 84 Q30 74 40 74 H160 Q170 74 170 84 V90 Q164 98 158 90 Q151 100 144 90 Q137 97 130 90 Q122 101 114 90 Q107 97 100 90 Q92 100 85 90 Q78 97 71 90 Q63 100 56 90 Q49 97 42 90 Q36 98 30 90 Z" fill="#E08AA0"/>${candles}<path d="M64 42v6M88 42v6M112 42v6M136 42v6" stroke="#8C6A72" stroke-width="1.5" stroke-linecap="round"/>${flames}${smokes}</svg>`;
  }
  document.querySelector('[data-cake="cards"]').innerHTML = cakeSVG('#2E1820', 300, false);
  document.querySelector('[data-cake="transition"]').innerHTML = cakeSVG('#24131A', 150, true);
  const cardFlames = [...el.screens[1].querySelectorAll('[data-flame]')];
  const transFlames = [...el.screens[2].querySelectorAll('[data-flame]')];

  /* ---------- film grain ---------- */
  const grainSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>";
  el.grain.style.backgroundImage = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(grainSvg) + '")';

  /* ---------- ambient loops (flames, balloons) ---------- */
  let ambient = [];
  function decorate() {
    ambient.forEach(a => a.cancel()); ambient = [];
    if (rm()) return;
    document.querySelectorAll('[data-flame]').forEach((f, i) => {
      try { ambient.push(f.animate([{ transform: 'scale(1,1) rotate(0deg)' }, { transform: 'scale(.9,1.08) rotate(-3deg)' }, { transform: 'scale(1.06,.94) rotate(2deg)' }, { transform: 'scale(.96,1.04) rotate(-1deg)' }], { duration: 700 + (i % 4) * 110, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' })); } catch (e) {}
    });
    document.querySelectorAll('[data-balloon]').forEach((b, i) => {
      ambient.push(b.animate([{ transform: 'translateY(0) rotate(-2deg)' }, { transform: 'translateY(-14px) rotate(2deg)' }], { duration: 2600 + i * 350, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }));
    });
  }
  const cancelIn = node => node.getAnimations({ subtree: true }).forEach(a => { if (!ambient.includes(a)) a.cancel(); });

  /* ---------- render ---------- */
  function renderCards() {
    const s = state, phrase = PHRASES[s.step - 1];
    el.ghost.textContent = phrase; el.underPhrase.textContent = phrase;
    const hide = s.revealed ? 'false' : 'true';
    el.ghost.setAttribute('aria-hidden', hide); el.underPhrase.setAttribute('aria-hidden', hide);
    el.progress.setAttribute('aria-label', `${s.step} de 4`);
    el.progress.querySelectorAll('[data-tick]').forEach(t => t.classList.toggle('on', +t.dataset.tick <= s.step));
    el.coat.classList.toggle('done', s.revealed); el.coat.tabIndex = s.revealed ? -1 : 0;
    el.revealNow.hidden = s.revealed; el.next.hidden = !s.revealed;
    renderFlames();
  }
  function renderFlames() {
    cardFlames.forEach((f, i) => { f.style.opacity = i + 1 <= state.step ? '1' : '0'; });
    transFlames.forEach(f => { f.style.opacity = state.blown ? '0' : '1'; });
  }
  function setLive(text) { el.live.textContent = text; }

  function setScreen(n) {
    state.screen = n;
    el.screens.forEach((s, i) => { s.hidden = i !== n; });
    document.body.classList.toggle('party', n === 3);
    onEnterScreen();
  }
  function onEnterScreen() {
    const s = state.screen;
    if (s === 3) { runSurprise(); return; }
    if (s === 2) { runTransition(); return; }
    const scr = el.screens[s];
    if (!rm()) scr.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: OUT });
    if (s === 1) { renderCards(); initScratch(); later(() => focus(el.coat), 40); }
    if (s === 0) later(() => focus(el.seal), 40);
  }

  /* ---------- audio (WebAudio, only after a user gesture) ---------- */
  let ac = null, master = null, noise = null, scr = null;
  function ensureAudio() {
    try {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
        ac = new AC(); master = ac.createGain();
        master.gain.value = state.muted ? 0 : 0.9; master.connect(ac.destination);
      }
      if (ac.state === 'suspended') { const p = ac.resume(); p && p.catch && p.catch(() => {}); }
      return ac;
    } catch (e) { return null; }
  }
  function toggleMute() {
    state.muted = !state.muted;
    el.mute.setAttribute('aria-pressed', String(state.muted));
    el.muteLabel.textContent = state.muted ? 'Ativar som' : 'Silenciar';
    ensureAudio();
    try { master && master.gain.setTargetAtTime(state.muted ? 0 : 0.9, ac.currentTime, 0.02); } catch (e) {}
  }
  function startScratchSound() {
    const a = ensureAudio(); if (!a) return;
    try {
      if (!noise) { const b = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; noise = b; }
      const src = a.createBufferSource(); src.buffer = noise; src.loop = true;
      const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.8;
      const g = a.createGain(); g.gain.value = 0;
      src.connect(bp); bp.connect(g); g.connect(master); src.start();
      scr = { src, g };
    } catch (e) { scr = null; }
  }
  function bumpScratchSound(dist) {
    if (!scr || !ac) return;
    try { const t = ac.currentTime, g = scr.g.gain; g.cancelScheduledValues(t); g.setTargetAtTime(Math.min(0.16, 0.02 + dist * 0.005), t, 0.02); g.setTargetAtTime(0, t + 0.07, 0.05); } catch (e) {}
  }
  function stopScratchSound() {
    if (!scr) return;
    try { const t = ac.currentTime; scr.g.gain.setTargetAtTime(0, t, 0.03); scr.src.stop(t + 0.2); } catch (e) {}
    scr = null;
  }
  function heartbeat() {
    const a = ensureAudio(); if (!a) return;
    try {
      const t = a.currentTime + 0.01;
      [0, 0.2].forEach((o, i) => {
        const osc = a.createOscillator(), g = a.createGain(); osc.type = 'sine';
        osc.frequency.setValueAtTime(i ? 62 : 74, t + o); osc.frequency.exponentialRampToValueAtTime(38, t + o + 0.18);
        g.gain.setValueAtTime(0.0001, t + o); g.gain.exponentialRampToValueAtTime(i ? 0.55 : 0.85, t + o + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + o + 0.28);
        osc.connect(g); g.connect(master); osc.start(t + o); osc.stop(t + o + 0.32);
      });
    } catch (e) {}
  }
  function honk() {
    const a = ensureAudio(); if (!a) return;
    try {
      const t = a.currentTime + 0.01, g = a.createGain();
      const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 1.3;
      const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3400;
      [[392, 'sawtooth'], [398, 'square']].forEach(([f, type]) => {
        const o = a.createOscillator(); o.type = type;
        o.frequency.setValueAtTime(f * 1.08, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.05); o.frequency.linearRampToValueAtTime(f * 0.93, t + 0.42);
        o.connect(bp); o.start(t); o.stop(t + 0.5);
      });
      bp.connect(lp); lp.connect(g); g.connect(master);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.02); g.gain.setValueAtTime(0.42, t + 0.34); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
    } catch (e) {}
  }
  const vibrate = () => { try { navigator.vibrate && navigator.vibrate([70, 40, 90]); } catch (e) {} };

  /* ---------- petals on tap (dark screens only) ---------- */
  el.root.addEventListener('pointerdown', e => {
    if (rm() || state.screen > 1) return;
    if (e.target.closest && e.target.closest('[data-scratch]')) return;
    for (let i = 0; i < 3; i++) {
      const p = document.createElement('span'), s = 8 + Math.random() * 6;
      Object.assign(p.style, { position: 'fixed', left: e.clientX + 'px', top: e.clientY + 'px', width: s + 'px', height: s * 1.3 + 'px', background: '#E08AA0', borderRadius: '80% 0 80% 0', opacity: '0', pointerEvents: 'none' });
      el.petals.appendChild(p);
      const dx = (Math.random() - 0.5) * 80, dy = 30 + Math.random() * 60, r = Math.random() * 240 - 120;
      const a = p.animate([{ transform: 'translate(-50%,-50%) rotate(0deg) scale(.6)', opacity: 0.9 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${r}deg) scale(1)`, opacity: 0 }], { duration: 900 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.4,1)' });
      a.onfinish = () => p.remove();
    }
  });

  /* ---------- 01 opening: wax seal ---------- */
  let sd = null, sealDragged = false;
  el.seal.addEventListener('pointerdown', e => {
    if (state.sealBroken) return;
    sd = { x: e.clientX, y: e.clientY };
    try { el.seal.setPointerCapture(e.pointerId); } catch (_) {}
  });
  el.seal.addEventListener('pointermove', e => {
    if (!sd || state.sealBroken) return;
    const dx = e.clientX - sd.x, dy = e.clientY - sd.y;
    el.sealInner.style.transition = ''; el.sealInner.style.transform = `translate(${dx * 0.5}px, ${dy * 0.5}px) rotate(${dx * 0.2}deg)`;
    if (Math.hypot(dx, dy) > 48) { sd = null; sealDragged = true; breakSeal(); }
  });
  const sealUp = () => {
    if (sd && !state.sealBroken) { el.sealInner.style.transition = 'transform 300ms cubic-bezier(.34,1.4,.5,1)'; el.sealInner.style.transform = ''; }
    sd = null;
  };
  el.seal.addEventListener('pointerup', sealUp);
  el.seal.addEventListener('pointercancel', sealUp);
  el.seal.addEventListener('click', () => { if (sealDragged) { sealDragged = false; return; } breakSeal(); });

  function breakSeal() {
    if (state.sealBroken) return;
    ensureAudio(); state.sealBroken = true;
    const calm = rm(), D = calm ? 150 : 600, ease = 'cubic-bezier(.5,0,.75,0)';
    el.sealL.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(-22px,46px) rotate(-38deg)', opacity: 0 }], { duration: D, easing: ease, fill: 'forwards' });
    el.sealR.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(22px,52px) rotate(34deg)', opacity: 0 }], { duration: D, easing: ease, fill: 'forwards' });
    if (!calm) {
      el.flapC.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duration: 300, delay: 150, easing: 'ease-in', fill: 'forwards' });
      el.flapO.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 300, delay: 450, easing: 'ease-out', fill: 'forwards' });
      el.letter.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-64px)' }], { duration: 600, delay: 700, easing: OUT, fill: 'forwards' });
    }
    later(() => {
      const done = () => { el.env.hidden = true; el.openText.hidden = false; enterOpenText(); };
      if (!calm) { const a = el.env.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.94) translateY(12px)' }], { duration: 300, easing: 'ease-in', fill: 'forwards' }); a.onfinish = done; }
      else done();
    }, calm ? 200 : 1450);
  }
  function enterOpenText() {
    if (!rm()) el.openText.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: OUT });
    later(() => focus(el.openCont), 300);
  }
  el.openCont.addEventListener('click', () => {
    ensureAudio();
    Object.assign(state, { step: 1, revealed: false }); setLive('');
    setScreen(1);
  });

  /* ---------- 02 scratch cards ---------- */
  const c = el.canvas;
  let ctx = null, dpr = 1, cw = 0, ch = 0, cols = 24, rows = 30, grid = null, cleared = 0, brush = 18;
  let drawing = false, last = null, lastFlake = 0;

  function initScratch() {
    c.getAnimations().forEach(a => a.cancel());
    const r = c.getBoundingClientRect();
    if (r.width < 2) { requestAnimationFrame(initScratch); return; }
    dpr = Math.min(2, window.devicePixelRatio || 1); cw = r.width; ch = r.height;
    c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
    ctx = c.getContext('2d');
    grid = new Uint8Array(cols * rows); cleared = 0;
    brush = Math.max(18, r.width * 0.07);
    if (state.revealed) ctx.clearRect(0, 0, c.width, c.height);
    else {
      drawFoil();
      if (document.fonts && document.fonts.load) document.fonts.load('500 16px Outfit').then(() => { if (ctx && !cleared && !state.revealed) drawFoil(); }).catch(() => {});
    }
    el.under.style.visibility = 'visible';
    el.ghost.style.transition = 'none'; el.ghost.style.opacity = state.revealed ? '1' : '0';
    void el.ghost.offsetWidth; el.ghost.style.transition = '';
  }
  function drawFoil() {
    const w = c.width, h = c.height, d = dpr;
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, 0, w, h);
    [[0, '#C46A82'], [0.22, '#EDB3C1'], [0.45, '#BD5F78'], [0.62, '#F2C7D1'], [0.82, '#C7718A'], [1, '#E9A9B9']].forEach(([o, col]) => g.addColorStop(o, col));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = d;
    for (let y = 0; y < h; y += 3 * d) { ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.09})`; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 6 * d); ctx.stroke(); }
    const n = Math.round((w * h) / 90);
    for (let i = 0; i < n; i++) { ctx.fillStyle = Math.random() < 0.5 ? `rgba(255,240,244,${Math.random() * 0.35})` : `rgba(90,30,48,${Math.random() * 0.18})`; ctx.fillRect(Math.random() * w, Math.random() * h, d * (1 + Math.random()), d * (1 + Math.random())); }
    ctx.strokeStyle = 'rgba(255,245,248,.4)'; ctx.lineWidth = d;
    const m = 12 * d;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(m, m, w - 2 * m, h - 2 * m, 10 * d); ctx.stroke(); } else ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
    ctx.fillStyle = '#3A1622'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `500 ${16 * d}px Outfit, system-ui, sans-serif`;
    ctx.fillText('Raspe aqui', w / 2, h / 2 + 18 * d);
    ctx.strokeStyle = '#3A1622'; ctx.lineWidth = 1.6 * d; ctx.lineCap = 'round';
    ctx.beginPath(); const sx = w / 2 - 22 * d, sy = h / 2 - 8 * d;
    ctx.moveTo(sx, sy); ctx.bezierCurveTo(sx + 10 * d, sy - 10 * d, sx + 14 * d, sy + 10 * d, sx + 22 * d, sy); ctx.bezierCurveTo(sx + 30 * d, sy - 10 * d, sx + 34 * d, sy + 10 * d, sx + 44 * d, sy); ctx.stroke();
  }
  function resizeScratch() {
    if (!ctx || state.screen !== 1) return;
    const r = c.getBoundingClientRect();
    if (r.width < 2 || (Math.abs(r.width - cw) < 1 && Math.abs(r.height - ch) < 1)) return;
    const tmp = document.createElement('canvas'); tmp.width = c.width; tmp.height = c.height; tmp.getContext('2d').drawImage(c, 0, 0);
    c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
    ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(tmp, 0, 0, c.width, c.height);
    cw = r.width; ch = r.height; brush = Math.max(18, r.width * 0.07);
  }
  const pt = e => { const r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  el.coat.addEventListener('pointerdown', e => {
    if (state.revealed || !ctx) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try { el.coat.setPointerCapture(e.pointerId); } catch (_) {}
    drawing = true; last = pt(e); startScratchSound(); scratch(last, last);
  });
  el.coat.addEventListener('pointermove', e => { if (!drawing) return; const p = pt(e); scratch(last, p); last = p; });
  const scrUp = () => { drawing = false; stopScratchSound(); };
  el.coat.addEventListener('pointerup', scrUp);
  el.coat.addEventListener('pointercancel', scrUp);
  // Enter / Space on the focused card (click with detail 0) reveals it.
  el.coat.addEventListener('click', e => { if (e.detail === 0) { ensureAudio(); reveal(); } });

  function scratch(a, b) {
    const d = dpr, rad = brush;
    ctx.globalCompositeOperation = 'destination-out'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = rad * 2 * d;
    ctx.beginPath(); ctx.moveTo(a.x * d, a.y * d); ctx.lineTo(b.x * d + 0.01, b.y * d); ctx.stroke();
    const dist = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.max(1, Math.ceil(dist / (rad / 2)));
    const cwc = cw / cols, chc = ch / rows;
    for (let s = 0; s <= steps; s++) {
      const x = a.x + (b.x - a.x) * s / steps, y = a.y + (b.y - a.y) * s / steps;
      const c0 = Math.max(0, Math.floor((x - rad) / cwc)), c1 = Math.min(cols - 1, Math.floor((x + rad) / cwc));
      const r0 = Math.max(0, Math.floor((y - rad) / chc)), r1 = Math.min(rows - 1, Math.floor((y + rad) / chc));
      for (let r = r0; r <= r1; r++) for (let cc = c0; cc <= c1; cc++) {
        const k = r * cols + cc; if (grid[k]) continue;
        if (Math.hypot((cc + 0.5) * cwc - x, (r + 0.5) * chc - y) < rad) { grid[k] = 1; cleared++; }
      }
    }
    const p = cleared / grid.length;
    el.ghost.style.opacity = String(Math.min(1, p / 0.5) * 0.85);
    bumpScratchSound(dist);
    spawnFlakes(b.x, b.y);
    if (p >= 0.5) reveal();
  }
  function spawnFlakes(x, y) {
    if (rm()) return;
    const now = performance.now(); if (now - lastFlake < 28 || el.flakes.childElementCount > 70) return;
    lastFlake = now;
    const fc = ['#E9A9B9', '#C46A82', '#F2C7D1', '#B95A74'];
    for (let i = 0; i < 2; i++) {
      const f = document.createElement('span'), s = 3 + Math.random() * 4;
      Object.assign(f.style, { position: 'absolute', left: x + 'px', top: y + 'px', width: s + 'px', height: s * 0.7 + 'px', background: fc[(Math.random() * 4) | 0], borderRadius: '1px' });
      el.flakes.appendChild(f);
      const dx = (Math.random() - 0.5) * 50, dy = 70 + Math.random() * 110, rot = (Math.random() - 0.5) * 540;
      const an = f.animate([{ transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg)`, opacity: 0 }], { duration: 700 + Math.random() * 500, easing: 'cubic-bezier(.25,.6,.5,1)' });
      an.onfinish = () => f.remove();
    }
  }
  el.revealNow.addEventListener('click', () => { ensureAudio(); reveal(); });

  function reveal() {
    if (state.revealed || state.screen !== 1) return;
    drawing = false; stopScratchSound();
    c.getAnimations().forEach(a => a.cancel());
    c.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.03)' }], { duration: rm() ? 150 : 600, easing: OUT, fill: 'forwards' });
    el.ghost.style.opacity = '1';
    state.revealed = true; renderCards(); setLive(PHRASES[state.step - 1]);
    if (!rm()) el.next.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 150, easing: OUT, fill: 'backwards' });
    later(() => focus(el.next), 320);
  }
  el.next.addEventListener('click', () => {
    ensureAudio();
    if (state.step >= 4) { state.blown = false; setScreen(2); return; }
    el.under.style.visibility = 'hidden';
    state.step++; state.revealed = false; setLive('');
    renderCards(); initScratch();
    if (!rm()) el.card.animate([{ opacity: 0, transform: 'translateX(24px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: OUT });
    later(() => focus(el.coat), 30);
  });

  /* ---------- 03 transition: heartbeat, candles out, silence ---------- */
  function runTransition() {
    const calm = rm(), scrn = el.screens[2];
    renderFlames();
    if (!calm) scrn.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: 'ease-out' });
    later(() => {
      heartbeat(); later(heartbeat, 500);
      if (!calm) el.heart.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.16)', offset: 0.12 }, { transform: 'scale(1)', offset: 0.32 }, { transform: 'scale(1.16)', offset: 0.5 }, { transform: 'scale(1)', offset: 0.72 }, { transform: 'scale(1)' }], { duration: 1000 });
    }, 400);
    later(() => {
      state.blown = true; renderFlames();
      el.heart.animate([{ opacity: 1 }, { opacity: 0.3 }], { duration: calm ? 150 : 600, fill: 'forwards' });
      if (!calm) scrn.querySelectorAll('[data-smoke]').forEach((s, i) => s.animate([{ opacity: 0, transform: 'translateY(0)' }, { opacity: 0.8, offset: 0.25 }, { opacity: 0, transform: 'translateY(-18px)' }], { duration: 900, delay: i * 50, easing: 'ease-out' }));
    }, 1450);
    // 1s of smoke, then 1s of complete silence, then the hard cut.
    later(() => setScreen(3), 1450 + 1000 + 1000);
  }

  /* ---------- 04 surprise: confetti, clown throw, poster ---------- */
  let cctx = null, cW = 0, cH = 0, parts = [], confRAF = null, lastT = 0, raf = null;
  function sizeConfetti() {
    const d = Math.min(2, window.devicePixelRatio || 1), W = window.innerWidth, H = window.innerHeight;
    el.conf.width = W * d; el.conf.height = H * d; cctx = el.conf.getContext('2d'); cctx.setTransform(d, 0, 0, d, 0, 0);
    cW = W; cH = H;
    if (rm() && state.screen === 3) staticConfetti();
  }
  const makePart = y => ({ x: Math.random() * cW, y, vx: (Math.random() - 0.5) * 1.4, vy: 1.4 + Math.random() * 2.4, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.2, w: 6 + Math.random() * 6, h: 9 + Math.random() * 8, c: CONF_COLS[(Math.random() * 5) | 0], sw: Math.random() * 6.28, round: Math.random() < 0.25 });
  function burst(n) {
    if (!cctx || rm()) return;
    for (let i = 0; i < n; i++) parts.push(makePart(-10 - Math.random() * cH * 0.7));
    if (!confRAF) { lastT = performance.now(); confRAF = requestAnimationFrame(tick); }
  }
  function tick(now) {
    if (!cctx) { confRAF = null; return; }
    const dt = Math.min(3, (now - lastT) / 16.67); lastT = now;
    cctx.clearRect(0, 0, cW, cH);
    parts = parts.filter(p => p.y < cH + 40);
    for (const p of parts) {
      p.vy = Math.min(p.vy + 0.05 * dt, 3.6); p.sw += 0.05 * dt; p.x += (p.vx + Math.sin(p.sw) * 0.8) * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      drawPart(cctx, p);
    }
    confRAF = parts.length ? requestAnimationFrame(tick) : null;
  }
  function drawPart(g, p) {
    g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(Math.cos(p.sw * 1.7), 1); g.fillStyle = p.c;
    if (p.round) { g.beginPath(); g.arc(0, 0, p.w / 2, 0, 6.28); g.fill(); } else g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    g.restore();
  }
  function staticConfetti() {
    if (!cctx) return; cctx.clearRect(0, 0, cW, cH);
    for (let i = 0; i < 50; i++) drawPart(cctx, makePart(Math.random() * cH));
  }

  function runSurprise() {
    el.surprise.scrollTop = 0;
    sizeConfetti();
    if (rm()) {
      el.clown.style.opacity = '1';
      later(() => { honk(); vibrate(); el.handBall.setAttribute('opacity', '0'); }, 600);
      later(() => {
        el.poster.style.opacity = '1';
        el.poster.querySelectorAll('[data-line],[data-tape]').forEach(l => { l.style.opacity = '1'; });
        el.tchau.style.opacity = '1';
        el.again.hidden = false; focus(el.again);
      }, 900);
      return;
    }
    burst(150);
    el.clown.animate([{ transform: 'scale(.3) translateY(40px)', opacity: 0 }, { transform: 'scale(1.06)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.34,1.3,.5,1)', fill: 'forwards' });
    later(() => el.upper.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(1.018)' }], { duration: 1300, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }), 600);
    later(throwBall, 1000);
    later(dropPoster, 2900);
  }

  function throwBall() {
    const { arm, head, pupilL: pl, pupilR: pr, ballF: bf, ballB: bb, handBall: hb } = el;
    const S = { x: 276, y: 340 }, O = { x: 64, y: 84 };
    const world = a => { const r = a * Math.PI / 180; return { x: S.x + O.x * Math.cos(r) - O.y * Math.sin(r), y: S.y + O.x * Math.sin(r) + O.y * Math.cos(r) }; };
    const eo = x => 1 - Math.pow(1 - x, 3), ei = x => x * x * x, eio = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    let t0 = null, rel = null, relT = 0;
    const step = now => {
      if (state.screen !== 3) return;
      if (t0 === null) t0 = now; const t = now - t0;
      let a;
      if (t < 380) a = 25 * eo(t / 380);                          // wind-up
      else if (t < 680) a = 25 - 145 * ei((t - 380) / 300);       // swing back over the shoulder
      else if (t < 820) a = -120 - 12 * eo((t - 680) / 140);      // follow-through
      else if (t < 1350) a = -132 + 132 * eio((t - 820) / 530);   // settle
      else a = 0;
      arm.setAttribute('transform', `rotate(${a.toFixed(2)} ${S.x} ${S.y})`);
      if (!rel && a <= -100) { rel = world(a); relT = t; hb.setAttribute('opacity', '0'); honk(); vibrate(); }
      let b, u = 0;
      if (rel) {
        u = Math.min(1, (t - relT) / 1000);
        const P1 = { x: 430, y: -430 }, P2 = { x: 170, y: 330 }, k = 1 - u;
        b = { x: k * k * rel.x + 2 * k * u * P1.x + u * u * P2.x, y: k * k * rel.y + 2 * k * u * P1.y + u * u * P2.y };
        const front = u < 0.5, ball = front ? bf : bb, other = front ? bb : bf;   // passes behind him halfway
        const op = u > 0.8 ? Math.max(0, 1 - (u - 0.8) / 0.2) : 1;
        ball.setAttribute('cx', b.x.toFixed(1)); ball.setAttribute('cy', b.y.toFixed(1)); ball.setAttribute('r', (19 * (1 - 0.4 * u)).toFixed(1)); ball.setAttribute('opacity', op.toFixed(2));
        other.setAttribute('opacity', '0');
      } else b = world(a);
      const back = rel && u >= 1 ? Math.max(0, 1 - (t - relT - 1000) / 400) : 1;
      const dx = b.x - 200, dy = b.y - 190, ang = Math.atan2(dx, -dy) * 180 / Math.PI;
      const hr = Math.max(-14, Math.min(14, dy < 0 ? ang * 0.18 : dx * 0.05)) * back;
      head.setAttribute('transform', `rotate(${hr.toFixed(2)} 200 300)`);
      const len = Math.hypot(dx, dy) || 1, px = (dx / len * 6 * back).toFixed(2), py = (dy / len * 6 * back).toFixed(2);
      pl.setAttribute('transform', `translate(${px} ${py})`); pr.setAttribute('transform', `translate(${px} ${py})`);
      if (t < 1350 || (rel && t - relT < 1400)) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function dropPoster() {
    const p = el.poster;
    p.animate([{ transform: 'translateY(-110vh) rotate(-8deg)', opacity: 1 }, { transform: 'translateY(14px) rotate(-1deg)', opacity: 1, offset: 0.75 }, { transform: 'translateY(0) rotate(-1.5deg)', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' });
    p.querySelectorAll('[data-tape]').forEach(t => { const r = t.dataset.r; t.animate([{ transform: `rotate(${r}deg) scale(.6)`, opacity: 0 }, { transform: `rotate(${r}deg) scale(1)`, opacity: 1 }], { duration: 150, delay: 460, fill: 'forwards', easing: 'ease-out' }); });
    later(() => {
      const sc = el.surprise;
      if (sc.scrollHeight > sc.clientHeight + 4) sc.scrollTo({ top: Math.max(0, p.offsetTop - 16), behavior: 'smooth' });
    }, 600);
    p.querySelectorAll('[data-line]').forEach((l, i) => l.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 700 + i * 350, easing: OUT, fill: 'forwards' }));
    later(() => {
      el.tchau.animate([{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1.22)', offset: 0.5 }, { opacity: 1, transform: 'scale(.94)', offset: 0.75 }, { opacity: 1, transform: 'scale(1)' }], { duration: 600, easing: 'cubic-bezier(.34,1.3,.5,1)', fill: 'forwards' });
      later(() => burst(170), 250);
    }, 700 + 3 * 350 + 100);
    later(() => {
      el.again.hidden = false;
      el.again.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: OUT });
      focus(el.again);
    }, 700 + 3 * 350 + 900);
  }

  /* ---------- "Ver de novo": reset everything, back to the opening ---------- */
  function resetScenes() {
    clearTimers(); cancelAnimationFrame(raf); cancelAnimationFrame(confRAF); confRAF = null; parts = [];
    stopScratchSound(); drawing = false; sd = null; sealDragged = false;
    el.screens.forEach(cancelIn);
    cctx && cctx.clearRect(0, 0, cW, cH);
    // opening
    el.env.hidden = false; el.openText.hidden = true;
    el.sealInner.style.transition = ''; el.sealInner.style.transform = '';
    // surprise
    el.clown.style.opacity = ''; el.poster.style.opacity = ''; el.tchau.style.opacity = '';
    el.poster.querySelectorAll('[data-line],[data-tape]').forEach(l => { l.style.opacity = ''; });
    ['arm', 'head', 'pupilL', 'pupilR'].forEach(k => el[k].removeAttribute('transform'));
    el.handBall.removeAttribute('opacity');
    el.ballF.setAttribute('opacity', '0'); el.ballB.setAttribute('opacity', '0');
    el.again.hidden = true;
    el.under.style.visibility = 'hidden';
    Object.assign(state, { sealBroken: false, step: 1, revealed: false, blown: false });
    setLive('');
  }
  el.again.addEventListener('click', () => { resetScenes(); setScreen(0); });

  /* ---------- global wiring ---------- */
  el.mute.addEventListener('click', toggleMute);
  window.addEventListener('resize', () => { resizeScratch(); if (state.screen === 3) sizeConfetti(); });
  mqR.addEventListener && mqR.addEventListener('change', decorate);

  decorate();
  renderCards();
  const start = (params.get('inicio') || '').toLowerCase();
  if (start === 'frases') setScreen(1);
  else if (start === 'surpresa') setScreen(3);
  else later(() => focus(el.seal), 60);
})();
