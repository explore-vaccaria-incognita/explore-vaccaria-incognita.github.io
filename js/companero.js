/* Vaccaria Incognita · el caballo que te acompaña
   Un bayo ensillado, sin jinete, que va contigo por el primer plano de la calle: si avanzas, te sigue al paso o al
   galope según lo rápido que vayas (y si te alejas mucho, llega corriendo desde fuera de la pantalla); si paras, se
   para, mueve la cola y, al rato, baja la cabeza a pastar, la levanta y mira. Durante las escenas se aparta y vuelve
   después. Va dentro de lo de delante del paisaje, así que en el final se va con el pueblo. */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, A = VA.arte, PA = VA.paisaje, S = VA.esc;
  var Y = A.BASE + 152, ALTO = 128, VMAX = 1.6;
  var BAYO = ['#c8a070', '#9a7448', '#6a4a2a', '#e8c898'], CRIN = '#2a1a10';
  var C = { x: null, v: 0, dir: 1, fase: 0, pasta: 0, quieto: 0, rumbo: 1, a: 1 };

  // a dónde quiere ir: un poco por detrás del centro, según hacia dónde vas
  function objetivo() { return S.lam(E.W * (C.rumbo > 0 ? 0.36 : 0.64), 0, 1)[0]; }
  E.en('cuadro', function (d) {
    var dt = Math.min(50, d.dt);
    if (Math.abs(d.movido) > 0.5) C.rumbo = d.movido > 0 ? 1 : -1;
    var tx = objetivo(), ancho = E.W / S.k();
    // la primera vez, o si se ha quedado muy atrás, entra corriendo desde fuera de la pantalla
    if (C.x == null || Math.abs(tx - C.x) > ancho * 1.05) { C.x = tx - C.rumbo * ancho * 0.72; C.v = C.rumbo * VMAX * 0.8; }
    // si tú estás quieto, se para donde llegue (sin darse la vuelta para volver al sitio exacto)
    var quieta = Math.abs(d.movido) < 0.5, dx = tx - C.x, zona = quieta ? 230 : 36, vd = Math.abs(dx) < zona || (quieta && dx * C.dir < 0 && Math.abs(dx) < ancho * 0.4) ? 0 : U.clamp(dx * 0.0042, -VMAX, VMAX);
    C.v += (vd - C.v) * Math.min(1, dt / 260);
    C.x += C.v * dt;
    var sp = Math.abs(C.v), marcha = sp < 0.03 ? 'quieto' : sp < 0.34 ? 'paso' : 'galope';
    if (sp > 0.12) C.dir = C.v > 0 ? 1 : -1;
    C.fase = (C.fase + sp * dt / (ALTO * (marcha === 'galope' ? 2.6 : 1.3))) % 1;
    C.marcha = marcha;
    // quieto: al rato baja a pastar, y alterna pastar y mirar
    if (marcha === 'quieto') C.quieto += dt; else C.quieto = 0;
    var quiere = C.quieto > 2600 && ((C.quieto - 2600) % 11000) < 6500 ? 1 : 0;
    C.pasta += (quiere - C.pasta) * Math.min(1, dt / (quiere ? 900 : 420));
  });
  // en las escenas se aparta; al acabar, vuelve corriendo
  E.en('escena', function (d) { if (d.fase === 'fin') C.x = null; });

  PA.companero = function (ctx, t) {
    C.a += ((E.escena ? 0 : 1) - C.a) * 0.15;
    if (C.x == null || C.a < 0.02) return;
    var p = S.pant(C.x, Y, 1); if (p[0] < -ALTO * 2 || p[0] > E.W + ALTO * 2) return;
    var P = PA.paleta(), col = BAYO.map(S.dePaleta);
    ctx.save(); ctx.globalAlpha = C.a; S.enCapa(ctx, 1);
    S.galope(ctx, C.x, Y, ALTO, C.fase, P, { marcha: C.marcha || 'quieto', izq: C.dir < 0, caballo: col, crin: S.dePaleta(CRIN), pasta: C.pasta, cola: Math.sin(t / 650) * 0.025 + Math.max(0, Math.sin(t / 2300)) * Math.sin(t / 90) * 0.02 });
    ctx.restore();
  };
  VA.companero = C;
})();
