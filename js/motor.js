/* Pascua Incognita · motor
   La costa de Rapa Nui pintada en serigrafía, que se recorre de lado: cámara con inercia y muelle, capas con paralaje,
   la entrada (arrastre, rueda, táctil, teclado) convertida en eventos con nombre, y las escenas de los secretos.
   Todo en píxeles CSS. La unidad de diseño «u» es la altura de la pantalla: las posiciones de la costa van en u.
   El cielo es CSS (detrás del lienzo, que es transparente); el papel y el marco de la lámina, también. */
(function () {
  'use strict';
  var VA = window.VA = window.VA || {};
  var TAU = Math.PI * 2;

  /* ------------------------------------------------------------------ utilidades */
  var U = VA.util = {
    clamp: function (x, a, b) { return x < a ? a : x > b ? b : x; },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    tramo: function (t, a, b) { return U.clamp((t - a) / (b - a), 0, 1); },
    suave: function (t) { t = U.clamp(t, 0, 1); return t * t * (3 - 2 * t); },
    entra: function (t) { t = U.clamp(t, 0, 1); return t * t * t; },
    sale: function (t) { t = U.clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); },
    inOut: function (t) { t = U.clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    meseta: function (t, a, b, c, d) { return t < a || t > d ? 0 : t < b ? U.suave((t - a) / (b - a)) : t > c ? 1 - U.suave((t - c) / (d - c)) : 1; },
    azar: function (semilla) { var s = (semilla | 0) || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; },
    rgb: function (hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; },
    rgba: function (c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ')'; },
    mezcla: function (a, b, t) { return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]; },
    num: function (x, dec) {
      var s = Math.abs(x).toFixed(dec || 0).split('.'), ent = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return (x < 0 ? '−' : '') + ent + (s[1] ? ',' + s[1] : '');
    },
    dos: function (n) { return (n < 10 ? '0' : '') + n; },
    // ruido de valor en 1D (suave) y su suma en octavas
    ruido: function (x, semilla) {
      var i = Math.floor(x), f = x - i, a = U._h(i + (semilla | 0) * 131), b = U._h(i + 1 + (semilla | 0) * 131);
      f = f * f * (3 - 2 * f); return a + (b - a) * f;
    },
    _h: function (n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); },
    fbm: function (x, semilla, oct) { var v = 0, a = 0.5, f = 1; for (var o = 0; o < (oct || 4); o++) { v += U.ruido(x * f, semilla + o * 7) * a; a *= 0.5; f *= 2.03; } return v; }
  };

  VA.color = {
    crema: [242, 227, 198],
    tinta: [22, 24, 52],
    acento: [255, 127, 110],
    papel: [239, 227, 201]
  };
  var C = VA.color;

  /* ------------------------------------------------------------------ el motor */
  var E = VA.motor = {
    t: 0, W: 800, H: 600, u: 600, dpr: 1,
    largo: 10,                // largo de la costa, en u
    camX: 0, velX: 0, camObj: null, empuje: 0,
    puntero: { x: -999, y: -999, sobre: false, tipo: 'mouse', velocidad: 0 },
    viento: 0, senal: 0,
    escena: null, bloqueado: false, ligero: false, lectura: 5000,
    ultimoInput: 0,
    oyentes: {}, capas: []
  };
  var cv, ctx, raf = window.requestAnimationFrame.bind(window), ultimoRaf = null, congelado = false, cam = null, mediaDt = 16, nMedidos = 0;

  E.en = function (n, fn) { (E.oyentes[n] = E.oyentes[n] || []).push(fn); };
  function emitir(n, d) { var l = E.oyentes[n]; if (!l) return; for (var i = 0; i < l.length; i++) { try { l[i](d); } catch (err) { console.error(err); } } }
  E.emitir = emitir;

  /* ---------- coordenadas: x de pantalla de algo que está en λ (u) de una capa de profundidad p ---------- */
  E.sx = function (l, p) { p = p == null ? 1 : p; return E.W / 2 + l * E.u - (E.W / 2 + E.camX) * p; };
  E.lDe = function (sx, p) { p = p == null ? 1 : p; return (sx - E.W / 2 + (E.W / 2 + E.camX) * p) / E.u; };
  E.maxCam = function () { return Math.max(0, E.largo * E.u - E.W); };
  E.centro = function () { return (E.camX + E.W / 2) / E.u; };    // la λ de la costa en el centro de la pantalla
  E.irA = function (l, ms, ease) {   // centra la cámara en λ
    cam = { x0: E.camX, x1: U.clamp(l * E.u - E.W / 2, 0, E.maxCam()), t0: E.t, dur: ms || 1400, ease: ease || U.inOut };
    E.velX = 0; E.camObj = null;
  };
  E.camaraActiva = function () { return !!cam; };

  /* ---------- tamaño ---------- */
  function medir() {
    var w = window.innerWidth, h = window.innerHeight;
    var proporcion = E.u ? (E.camX + E.W / 2) / E.u : 0;
    E.W = w; E.H = h; E.u = h;
    E.dpr = E.ligero ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * E.dpr); cv.height = Math.round(h * E.dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    E.camX = U.clamp(proporcion * E.u - E.W / 2, 0, E.maxCam()); E.camObj = null;
    emitir('tamano', { W: w, H: h });
  }

  /* ---------- la espera a WebKit: Safari pinta los lienzos en otro proceso; leer un píxel obliga a acabar lo pedido ---------- */
  var unPixel = null;
  E.vaciar = function () {
    if (!unPixel) { unPixel = document.createElement('canvas'); unPixel.width = unPixel.height = 1; unPixel = unPixel.getContext('2d', { willReadFrequently: true }); }
    try { unPixel.fillRect(0, 0, 1, 1); unPixel.getImageData(0, 0, 1, 1); } catch (err) { /* nada */ }
  };

  /* ---------- efectos sencillos para las escenas ---------- */
  var FX = VA.fx = {
    texto: function (s, x, y, op) {
      op = op || {};
      var fam = op.serif ? '"Instrument Serif", Georgia, serif' : '"IBM Plex Mono", ui-monospace, Menlo, monospace';
      ctx.font = (op.cursiva ? 'italic ' : '') + (op.peso || 400) + ' ' + (op.tam || 11) + 'px ' + fam;
      ctx.textAlign = op.alin || 'left'; ctx.textBaseline = op.base || 'middle';
      ctx.fillStyle = U.rgba(op.color || C.crema, op.a == null ? 0.9 : op.a);
      if (op.espaciado && 'letterSpacing' in ctx) ctx.letterSpacing = op.espaciado + 'px';
      ctx.fillText(s, x, y);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    },
    brillo: function (x, y, r, col, a) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, U.rgba(col, a)); g.addColorStop(1, U.rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
  };

  /* ---------- dibujar un fotograma ---------- */
  function dibujar() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    var esc = E.escena, s = esc && esc.s, t = esc ? esc.t : 0;
    VA.paisaje.dibujar(ctx, s, t);
    if (!s) for (var i = 0; i < E.capas.length; i++) { try { E.capas[i](ctx, E.t); } catch (err) { console.error(err); } }
    if (s && s.frente) { try { s.frente(ctx, t); } catch (err) { console.error(err); } }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    VA.paisaje.dibujarImpresion(ctx);
  }

  /* ---------- un paso del reloj ---------- */
  function actualizar(dt) {
    E.t += dt;
    var esc = E.escena, antes = E.camX;
    if (cam) {
      var k = U.clamp((E.t - cam.t0) / cam.dur, 0, 1); E.camX = U.lerp(cam.x0, cam.x1, cam.ease(k)); if (k >= 1) cam = null;
    } else if (!esc) {
      if (Math.abs(E.velX) > 0.001) { E.camX += E.velX * dt; E.velX *= Math.pow(0.93, dt / 16); }
      // la cámara persigue su objetivo con un muelle crítico (unos 110 ms): la rueda no da saltos
      if (E.camObj != null) {
        E.camX += (E.camObj - E.camX) * (1 - Math.exp(-dt / 110));
        if (Math.abs(E.camObj - E.camX) < 0.25) { E.camX = E.camObj; E.camObj = null; }
      }
    }
    E.camX = U.clamp(E.camX, 0, E.maxCam());
    // el viento: una brisa que nunca para, ráfagas que recorren la costa y lo que mueve el ratón
    var p = E.puntero;
    E.viento = E.viento * Math.pow(0.95, dt / 16) + U.clamp(p.velocidad / 2.5, 0, 1) * 0.06;
    p.velocidad *= Math.pow(0.8, dt / 16);
    if (esc) {
      esc.t += dt;
      var sc = esc.s, ta = sc.tarjeta;
      if (ta && !esc.tv && esc.t >= ta.en) { esc.tv = true; VA.interfaz && VA.interfaz.tarjeta(ta); }
      if (ta && esc.tv && !esc.tq && esc.t >= ta.hasta) { esc.tq = true; VA.interfaz && VA.interfaz.tarjeta(null); }
      if (sc.cuadro) { try { sc.cuadro(esc.t, dt); } catch (err) { console.error(err); } }
      if (esc.t >= esc.dur) terminarEscena(false);
    }
    VA.paisaje.actualizar(dt);
    if (!esc && !E.bloqueado) emitir('cuadro', { t: E.t, dt: dt, inactivo: E.t - E.ultimoInput, movido: E.camX - antes });
  }
  function paso(dt) { actualizar(dt); dibujar(); }
  function bucle(ahora) {
    if (congelado) return;
    var dt = ultimoRaf === null ? 16 : Math.min(50, ahora - ultimoRaf); ultimoRaf = ahora;
    paso(dt);
    // si el equipo no llega (de media más de 28 ms por fotograma), modo ligero (resolución 1×). Solo se mide con el
    // taller parado y sin entrada ni escena: el taller usa a propósito el tiempo libre y no debe confundirse con lentitud
    var midiendo = !E.ligero && !E.escena && !VA.paisaje.ocupado();
    if (midiendo) { mediaDt = mediaDt * 0.95 + dt * 0.05; if (++nMedidos > 120 && mediaDt > 28) { E.ligero = true; medir(); } }
    raf(bucle);
  }

  /* ---------- escenas ---------- */
  E.reproducir = function (h, alTerminar) {
    if (E.escena) return false;
    var s = h.escena(E) || {};
    E.escena = { h: h, s: s, t: 0, dur: s.duracion || 8000, fin: alTerminar };
    E.velX = 0; cam = null; arrastre = null; E.camObj = null;
    document.documentElement.classList.add('en-escena');
    if (s.inicio) { try { s.inicio(); } catch (err) { console.error(err); } }
    emitir('escena', { fase: 'inicio', huevo: h });
    return true;
  };
  function terminarEscena(saltada) {
    var e = E.escena; if (!e) return;
    try { e.s.fin && e.s.fin(saltada); } catch (err) { console.error(err); }
    E.escena = null; cam = null;
    VA.interfaz && VA.interfaz.tarjeta(null);
    document.documentElement.classList.remove('en-escena');
    E.ultimoInput = E.t;
    emitir('escena', { fase: 'fin', huevo: e.h, saltada: saltada });
    if (e.fin) e.fin(saltada);
  }
  E.saltar = function () { terminarEscena(true); };

  /* ---------- entrada ----------
     Arrastrar, rueda, trackpad o flechas: recorrer la costa. Un clic sin moverse: el evento «clic».
     Un secreto puede quedarse un arrastre que empieza sobre algo suyo: en «bajar», d.tomar() (llegan «arrastrar» y «soltar»). */
  var arrastre = null, punteros = {}, dosDedos = null;
  function libre() { return !E.escena && !E.bloqueado; }
  function marcar() { E.ultimoInput = E.t; }
  function datos(x, y) { return { x: x, y: y, l: E.lDe(x), yu: y / E.u }; }

  function alBajar(ev) {
    marcar();
    var p = E.puntero; p.x = ev.clientX; p.y = ev.clientY; p.sobre = true; p.tipo = ev.pointerType || 'mouse';
    if (!libre()) return;
    punteros[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
    if (Object.keys(punteros).length === 2) { arrastre = null; dosDedos = {}; return; }
    arrastre = { x0: ev.clientX, y0: ev.clientY, t0: E.t, cam0: E.camX, movido: 0, tomado: false, pts: [[ev.clientX, ev.clientY, E.t, E.camX]] };
    cam = null; E.velX = 0; E.camObj = null;
    var d = datos(ev.clientX, ev.clientY); d.tomar = function () { if (arrastre) arrastre.tomado = true; };
    emitir('bajar', d);
    document.documentElement.classList.toggle('arrastrando', !arrastre.tomado);
  }
  function alMover(ev) {
    marcar();
    var p = E.puntero, dx = ev.clientX - p.x, dy = ev.clientY - p.y;
    if (p.sobre && E.t - (p.tm || 0) > 0) { var v = Math.hypot(dx, dy) / Math.max(1, E.t - (p.tm || E.t - 16)); p.velocidad = Math.max(p.velocidad, v); }
    p.x = ev.clientX; p.y = ev.clientY; p.sobre = ev.target === cv || !!arrastre; p.tm = E.t; p.tipo = ev.pointerType || p.tipo;
    if (punteros[ev.pointerId]) { punteros[ev.pointerId].x = ev.clientX; punteros[ev.pointerId].y = ev.clientY; }
    if (!libre()) return;
    if (dosDedos) {
      var ids = Object.keys(punteros); if (ids.length < 2) return;
      var mx = (punteros[ids[0]].x + punteros[ids[1]].x) / 2;
      if (dosDedos.ultimo != null) E.camX = U.clamp(E.camX - (mx - dosDedos.ultimo), 0, E.maxCam());
      dosDedos.ultimo = mx; return;
    }
    var A = arrastre;
    if (A) {
      var ult = A.pts[A.pts.length - 1];
      A.movido += Math.hypot(ev.clientX - ult[0], ev.clientY - ult[1]);
      if (A.tomado) emitir('arrastrar', datos(ev.clientX, ev.clientY));
      else {
        var obj = A.cam0 - (ev.clientX - A.x0);
        if (obj < 0 && E.camX <= 0.5) E.empujarInicio(-obj - (A.empujado || 0)), A.empujado = -obj;
        if (obj > E.maxCam() && E.camX >= E.maxCam() - 0.5) E.empujarFin(obj - E.maxCam() - (A.empujado || 0)), A.empujado = obj - E.maxCam();
        E.camX = U.clamp(obj, 0, E.maxCam());
      }
      A.pts.push([ev.clientX, ev.clientY, E.t, E.camX]);
    } else emitir('mover', datos(ev.clientX, ev.clientY));
  }
  function alSubir(ev) {
    marcar();
    delete punteros[ev.pointerId];
    document.documentElement.classList.remove('arrastrando');
    if (dosDedos) { if (Object.keys(punteros).length < 2) dosDedos = null; arrastre = null; return; }
    var A = arrastre; arrastre = null;
    if (!A || !libre()) return;
    var dur = E.t - A.t0, d = datos(ev.clientX, ev.clientY);
    if (A.tomado) { emitir('soltar', d); return; }
    if (A.movido < 6 && dur < 600) { emitir('clic', datos(A.x0, A.y0)); return; }
    // inercia
    var n = A.pts.length; if (n > 2) { var a = A.pts[Math.max(0, n - 5)], b = A.pts[n - 1]; E.velX = -(b[0] - a[0]) / Math.max(16, b[2] - a[2]); }
    // el trazo completo, con la λ de la costa de cada punto (para los gestos)
    var pts = A.pts.map(function (q) { return { x: q[0], y: q[1], t: q[2], l: (q[0] + q[3]) / E.u, yu: q[1] / E.u }; });
    emitir('trazo', { pts: pts, dur: dur, movido: A.movido });
  }

  E.iniciar = function (lienzo) {
    cv = lienzo; ctx = cv.getContext('2d'); E.ctx = ctx;
    medir();
    window.addEventListener('resize', medir);
    cv.addEventListener('pointerdown', alBajar);
    window.addEventListener('pointermove', function (ev) { if (ev.target === cv || arrastre || dosDedos) alMover(ev); else { E.puntero.sobre = false; marcar(); } });
    window.addEventListener('pointerup', alSubir);
    window.addEventListener('pointercancel', function (ev) { delete punteros[ev.pointerId]; arrastre = null; dosDedos = null; document.documentElement.classList.remove('arrastrando'); });
    cv.addEventListener('pointerleave', function (ev) { if (ev.pointerType === 'mouse' && !arrastre) E.puntero.sobre = false; });
    cv.addEventListener('wheel', function (ev) {
      ev.preventDefault(); marcar();
      if (!libre()) return;
      var d = (Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.deltaY) * (ev.deltaMode === 1 ? 16 : 1);
      cam = null;
      var antes = E.camObj != null ? E.camObj : E.camX; E.camObj = U.clamp(antes + d, 0, E.maxCam());
      if (d > 0 && antes >= E.maxCam() - 0.5) E.empujarFin(d);
      if (d < 0 && antes <= 0.5) E.empujarInicio(-d);
      E.velX = 0;
    }, { passive: false });
    window.addEventListener('keydown', function (ev) {
      marcar();
      var t = ev.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (ev.key === 'Backspace') ev.preventDefault();
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (libre() && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) {
        ev.preventDefault(); cam = null; E.camObj = null;
        var dir = ev.key === 'ArrowRight' ? 1 : -1;
        if (dir > 0 && E.camX >= E.maxCam() - 0.5) E.empujarFin(120);
        if (dir < 0 && E.camX <= 0.5) E.empujarInicio(120);
        E.velX = dir * 1.5;
      }
      emitir('tecla', { key: ev.key });
    });
    document.addEventListener('visibilitychange', function () { ultimoRaf = null; marcar(); });
    raf(bucle);
  };
  // empujar más allá de los extremos: se acumula mientras sigas empujando (si paras 0,7 s, vuelve a cero)
  E.empujarFin = function (d) { if (E.t - (E.ultimoEmpuje || -1e9) > 700) E.empuje = 0; E.ultimoEmpuje = E.t; E.empuje += d; emitir('empujar', { lado: 'fin', d: d, total: E.empuje }); };
  E.empujarInicio = function (d) { if (E.t - (E.ultimoEmpujeI || -1e9) > 700) E.empujeI = 0; E.ultimoEmpujeI = E.t; E.empujeI = (E.empujeI || 0) + d; emitir('empujar', { lado: 'inicio', d: d, total: E.empujeI }); };

  /* ---------- pruebas: pasos manuales (cada fotograma simulado espera a que WebKit lo pinte) ---------- */
  E.congelar = function (si) { congelado = si !== false; if (!congelado) { ultimoRaf = null; raf(bucle); } };
  E.paso = function (ms, trozos) { trozos = trozos || Math.max(1, Math.round(ms / 16)); for (var i = 0; i < trozos; i++) { paso(ms / trozos); E.vaciar(); } };
})();
