/* Vaccaria Incognita · arte
   Todo el dibujo del mundo, por código: lo que se aprobó en lab-c.html (la C, «Technicolor con oficio», con tinta),
   pasado a librería. Las piezas dibujan en «unidades de lámina»: la lámina mide 900 de alto (= 1 u, la altura de la
   pantalla); HOR (horizonte) 560, BASE (la acera del pueblo) 722, VIA (los raíles) 632. Quien las use escala por u/900.
   La tinta es un interruptor (VA.arte.tinta(color | null)): Pau quiere comparar con y sin tinta en el mundo de verdad. */
(function () {
  'use strict';
  var VA = window.VA = window.VA || {};
  var W = 1600, H = 900, HOR = 560, BASE = 722, VIA = 632, ESC = 2;
  var semilla = 11; function azar() { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; }
  function sembrar(s) { semilla = s; }
  function poli(pts, abierto) { var p = new Path2D(); pts.forEach(function (q, i) { p[i ? 'lineTo' : 'moveTo'](q[0], q[1]); }); if (!abierto) p.closePath(); return p; }
  function rect(x, y, w, h) { var p = new Path2D(); p.rect(x, y, w, h); return p; }
  // (se apunta el rectángulo de cada rect() para poder pintar marcos y cristales)
  var RECTS = new WeakMap(); var rectOriginal = rect; rect = function (x, y, w, h) { var p = rectOriginal(x, y, w, h); RECTS.set(p, { x: x, y: y, w: w, h: h }); return p; };
  function rectDe(p) { return RECTS.get(p) || { x: 0, y: 0, w: 0, h: 0 }; }
  function circulo(x, y, r) { var p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2); return p; }
  function elipse(x, y, rx, ry, a) { var p = new Path2D(); p.ellipse(x, y, rx, ry, a || 0, 0, Math.PI * 2); return p; }
  function une(lista) { var p = new Path2D(); lista.forEach(function (q) { p.addPath(q); }); return p; }
  var LETRA = 'Rockwell, "American Typewriter", "Courier New", Georgia, serif';

  /* ================================================================== la geometría (común a los cinco estilos) */
  // una mesa de Monument Valley: pared casi vertical de arenisca con su cima plana, sobre una gran falda de derrubios
  // cóncava (más empinada junto a la pared)
  function mesa(x0, x1, cima, pie, talud, s) {
    sembrar(s); var pts = [];
    for (var t = 0; t <= 1.001; t += 0.1) pts.push([x0 - talud * (1 - t) + (azar() - 0.5) * 3, HOR - (HOR - pie) * Math.pow(t, 1.8)]);
    for (var y = pie - 14; y > cima + 10; y -= 16) pts.push([x0 + (azar() - 0.4) * 5 + (pie - y) * 0.03, y]);
    pts.push([x0 + 8, cima + 5]); pts.push([x0 + 13, cima]);
    for (var x = x0 + 13; x < x1 - 13; x += 20) pts.push([x, cima + (azar() - 0.5) * 2.2]);
    pts.push([x1 - 13, cima]); pts.push([x1 - 8, cima + 5]);
    for (y = cima + 14; y < pie - 10; y += 16) pts.push([x1 - (azar() - 0.4) * 5 - (pie - y) * 0.03, y]);
    for (t = 1; t >= -0.001; t -= 0.1) pts.push([x1 + talud * (1 - t) + (azar() - 0.5) * 3, HOR - (HOR - pie) * Math.pow(t, 1.8)]);
    return { p: poli(pts), x0: x0, x1: x1, cima: cima, pie: pie };
  }
  // el «pulgar» de una Mitten: una aguja estrecha pegada a la mesa
  function aguja(x0, x1, cima, pie) { return poli([[x0, pie], [x0 + 2, cima + 30], [x0 + 5, cima + 6], [x0 + (x1 - x0) / 2, cima], [x1 - 4, cima + 8], [x1 - 1, cima + 40], [x1, pie]]); }
  var MESAS = [
    { m: mesa(704, 788, 396, 492, 58, 3), a: null },                                       // Merrick Butte (más lejos)
    { m: mesa(258, 372, 300, 456, 100, 5), a: aguja(398, 416, 346, 516) },                 // West Mitten (el pulgar a su derecha)
    { m: mesa(1198, 1312, 312, 460, 96, 9), a: aguja(1166, 1184, 364, 506) }               // East Mitten (el pulgar a su izquierda)
  ];
  var LEJOS = poli([[0, HOR + 2], [0, 541], [60, 541], [68, 526], [158, 525], [168, 544], [478, 545], [489, 521], [556, 519], [566, 540], [896, 542], [904, 529], [958, 528], [966, 545], [1398, 545], [1409, 523], [1496, 522], [1506, 540], [1600, 538], [1600, HOR + 2]]);

  // los edificios del pueblo: fachada falsa (más alta que el tejado de dos aguas de detrás), porche, letrero
  var EDIF = [
    { n: 'HOTEL', x: 34, w: 178, top: 466, pisos: 2, tono: 'madera' },
    { n: 'SALOON', x: 222, w: 184, top: 500, pisos: 2, tono: 'madera2', batientes: true },
    { n: 'BANK', x: 416, w: 132, top: 522, pisos: 1, tono: 'piedra', columnas: true },
    { n: 'GENERAL STORE', x: 558, w: 176, top: 508, pisos: 1, tono: 'madera3' },
    { n: 'SHERIFF', x: 744, w: 112, top: 566, pisos: 1, tono: 'madera' }
  ];
  function edificio(e) {
    var x0 = e.x, x1 = e.x + e.w, g = {};
    // el tejado de dos aguas que asoma por detrás de la fachada falsa
    g.tejado = poli([[x0 + 10, e.top + 30], [x0 + e.w / 2, e.top - 12], [x1 - 10, e.top + 30]]);
    var remate = e.n === 'SALOON' ? [[x0, BASE], [x0, e.top + 14], [x0 + 18, e.top + 14], [x0 + 18, e.top], [x1 - 18, e.top], [x1 - 18, e.top + 14], [x1, e.top + 14], [x1, BASE]]
      : e.n === 'BANK' ? [[x0, BASE], [x0, e.top + 10], [x0 + e.w / 2 - 30, e.top + 10], [x0 + e.w / 2, e.top - 10], [x0 + e.w / 2 + 30, e.top + 10], [x1, e.top + 10], [x1, BASE]]
      : [[x0, BASE], [x0, e.top], [x1, e.top], [x1, BASE]];
    g.fachada = poli(remate);
    g.cornisa = rect(x0 - 4, e.top + (e.n === 'BANK' ? 10 : e.n === 'SALOON' ? 14 : 0) - 2, e.w + 8, 7);
    g.sombra = rect(x0, e.top + 20, e.w * 0.14, BASE - e.top - 20);     // el lado sin sol de la fachada (la luz viene de la derecha)
    // el letrero
    var ly = e.top + (e.pisos === 2 ? 26 : 22), lh = e.n === 'GENERAL STORE' ? 26 : 30;
    g.letrero = rect(x0 + 12, ly, e.w - 24, lh); g.texto = { t: e.n, x: x0 + e.w / 2, y: ly + lh / 2 + 1, s: e.n === 'GENERAL STORE' ? 15 : 19, max: e.w - 36 };
    // ventanas del piso de arriba y planta baja; puerta
    g.ventanas = [];
    if (e.pisos === 2) for (var k = 0; k < 3; k++) g.ventanas.push(rect(x0 + 22 + k * (e.w - 44 - 26) / 2, ly + lh + 16, 26, 36));
    var pt = BASE - 64, pw = e.batientes ? 40 : 30;
    g.puerta = rect(x0 + e.w / 2 - pw / 2, pt, pw, 64);
    if (e.batientes) g.batientes = une([poli([[x0 + e.w / 2 - 19, pt + 18], [x0 + e.w / 2 - 1, pt + 14], [x0 + e.w / 2 - 1, pt + 44], [x0 + e.w / 2 - 19, pt + 46]]), poli([[x0 + e.w / 2 + 1, pt + 14], [x0 + e.w / 2 + 19, pt + 18], [x0 + e.w / 2 + 19, pt + 46], [x0 + e.w / 2 + 1, pt + 44]])]);
    g.escaparates = [rect(x0 + 12, pt + 6, e.w / 2 - pw / 2 - 22, 40), rect(x0 + e.w / 2 + pw / 2 + 10, pt + 6, e.w / 2 - pw / 2 - 22, 40)];
    // el porche: tejadillo inclinado sobre postes, y la acera de tablones
    var py = BASE - 92;
    g.porche = poli([[x0 - 6, py], [x1 + 6, py], [x1 + 14, py + 14], [x0 - 14, py + 14]]);
    g.postes = []; for (var q = 0; q < 4; q++) g.postes.push(rect(x0 - 8 + q * (e.w + 8) / 3, py + 14, 5, BASE - py - 14));
    g.acera = rect(x0 - 16, BASE, e.w + 32, 9);
    if (e.columnas) g.columnas = [rect(x0 + 14, pt - 6, 9, 70), rect(x1 - 23, pt - 6, 9, 70)];
    // las tablas de la fachada (líneas)
    g.tablas = new Path2D(); if (e.tono !== 'piedra') for (var y = e.top + 6; y < BASE; y += 9) { g.tablas.moveTo(x0, y); g.tablas.lineTo(x1, y); }
    else for (y = e.top + 16; y < BASE; y += 12) { g.tablas.moveTo(x0, y); g.tablas.lineTo(x1, y); for (var xx = x0 + ((y / 12) % 2) * 14; xx < x1; xx += 28) { g.tablas.moveTo(xx, y); g.tablas.lineTo(xx, y + 12); } }
    return g;
  }
  var PUEBLO = EDIF.map(function (e) { return { e: e, g: edificio(e) }; });

  // el depósito de agua del ferrocarril
  function deposito(x, y) {
    var g = {};
    g.patas = une([poli([[x - 30, y], [x - 24, y - 120], [x - 19, y - 120], [x - 24, y]]), poli([[x + 30, y], [x + 24, y - 120], [x + 19, y - 120], [x + 24, y]]), rect(x - 3, y - 120, 5, 120)]);
    g.riostras = new Path2D(); [[y - 40, y - 85], [y - 85, y - 40]].forEach(function (q) { g.riostras.moveTo(x - 27, q[0]); g.riostras.lineTo(x + 27, q[1]); });
    g.tanque = rect(x - 40, y - 182, 80, 62);
    g.tapa = poli([[x - 46, y - 182], [x, y - 214], [x + 46, y - 182]]);
    g.aros = new Path2D(); [y - 170, y - 150, y - 131].forEach(function (yy) { g.aros.moveTo(x - 40, yy); g.aros.lineTo(x + 40, yy); });
    g.cano = poli([[x + 38, y - 140], [x + 70, y - 108], [x + 66, y - 104], [x + 36, y - 133]]);
    return g;
  }
  // el molino de viento (de los de bombear agua, con su cola)
  function molino(x, y) {
    var g = { torre: new Path2D(), aspas: new Path2D() }, h = 150;
    g.torre.moveTo(x - 20, y); g.torre.lineTo(x - 3, y - h); g.torre.moveTo(x + 20, y); g.torre.lineTo(x + 3, y - h);
    for (var k = 1; k < 5; k++) { var a = y - k * h / 5, b = y - (k - 1) * h / 5, wa = 20 - k * 17 / 5, wb = 20 - (k - 1) * 17 / 5; g.torre.moveTo(x - wb, b); g.torre.lineTo(x + wa, a); g.torre.moveTo(x + wb, b); g.torre.lineTo(x - wa, a); }
    var cx = x - 4, cy = y - h - 6;
    for (var i = 0; i < 18; i++) { var t = i / 18 * Math.PI * 2; g.aspas.moveTo(cx + Math.cos(t) * 8, cy + Math.sin(t) * 8 * 0.95); g.aspas.lineTo(cx + Math.cos(t) * 34, cy + Math.sin(t) * 34 * 0.95); }
    g.aro = elipse(cx, cy, 34, 32.3); g.cubo = circulo(cx, cy, 6);
    g.cola = poli([[cx + 6, cy - 2], [cx + 46, cy - 6], [cx + 58, cy - 22], [cx + 60, cy + 6], [cx + 46, cy + 2], [cx + 6, cy + 3]]);
    return g;
  }
  // la locomotora 4-4-0 (mira a la izquierda: quitapiedras delante) con su ténder y dos vagones de pasajeros
  function tren(x0) {
    var y = VIA, g = { cuerpo: [], ruedas: [], ventanas: [], detalle: new Path2D() };
    g.quita = poli([[x0, y - 6], [x0 + 30, y - 30], [x0 + 34, y - 30], [x0 + 34, y - 6]]);
    g.caldera = rect(x0 + 34, y - 68, 120, 36);
    g.frente = elipse(x0 + 36, y - 50, 6, 18);
    g.chimenea = poli([[x0 + 58, y - 68], [x0 + 62, y - 86], [x0 + 48, y - 112], [x0 + 88, y - 112], [x0 + 74, y - 86], [x0 + 78, y - 68]]);
    g.faro = rect(x0 + 34, y - 88, 18, 16); g.luzFaro = [x0 + 36, y - 80];
    g.domo = poli([[x0 + 100, y - 68], [x0 + 102, y - 80], [x0 + 110, y - 86], [x0 + 118, y - 80], [x0 + 120, y - 68]]);
    g.cabina = rect(x0 + 150, y - 96, 50, 64); g.techo = rect(x0 + 144, y - 102, 62, 7); g.ventanas.push(rect(x0 + 160, y - 86, 26, 20));
    g.bastidor = rect(x0 + 30, y - 34, 172, 10);
    g.tender = rect(x0 + 208, y - 66, 72, 42);
    g.carbon = poli([[x0 + 210, y - 66], [x0 + 224, y - 80], [x0 + 266, y - 78], [x0 + 278, y - 66]]);
    [[x0 + 56, 11], [x0 + 84, 11], [x0 + 124, 22], [x0 + 172, 22], [x0 + 226, 11], [x0 + 262, 11]].forEach(function (r) { g.ruedas.push({ x: r[0], y: y - r[1], r: r[1] }); });
    g.biela = rect(x0 + 120, y - 26, 56, 4);
    // los vagones
    g.vagones = [];
    [x0 + 290, x0 + 450].forEach(function (vx) {
      var v = { caja: rect(vx, y - 74, 150, 50), techo: poli([[vx - 6, y - 74], [vx + 4, y - 84], [vx + 146, y - 84], [vx + 156, y - 74]]), linterna: rect(vx + 20, y - 92, 110, 9), ventanas: [], ruedas: [] };
      for (var k = 0; k < 7; k++) v.ventanas.push(rect(vx + 10 + k * 19.5, y - 66, 11, 16));
      [vx + 20, vx + 42, vx + 108, vx + 130].forEach(function (rx) { v.ruedas.push({ x: rx, y: y - 11, r: 11 }); });
      g.vagones.push(v);
    });
    // el humo: bolas que salen de la chimenea y se van hacia atrás
    g.humo = []; sembrar(21);
    for (var i = 0; i < 16; i++) { var k = i / 15; g.humo.push({ x: x0 + 68 + k * k * 520 + azar() * 20, y: y - 120 - k * 90 - Math.sin(k * 5) * 12, r: 8 + k * 27 + azar() * 5 }); }
    return g;
  }
  // el caballo y el jinete (de lado, al paso, mirando a la izquierda); (x, y) es el suelo bajo el centro y s, la altura a la cruz
  function suave(pts) {   // un contorno cerrado suavizado (curvas por los puntos medios)
    var p = new Path2D(), n = pts.length, m = function (a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }, a0 = m(pts[n - 1], pts[0]);
    p.moveTo(a0[0], a0[1]); for (var i = 0; i < n; i++) { var q = m(pts[i], pts[(i + 1) % n]); p.quadraticCurveTo(pts[i][0], pts[i][1], q[0], q[1]); } p.closePath(); return p;
  }
  function pata(pts, anchos) {   // una pata: la línea de los huesos con su grosor en cada articulación
    var izq = [], der = [];
    for (var i = 0; i < pts.length; i++) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = anchos[i] / 2;
      izq.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); der.unshift([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    }
    return suave(izq.concat(der));
  }
  function jinete(x, y, s) {
    function P(px, py) { return [x - px * s, y - py * s]; }
    function L(arr) { return arr.map(function (q) { return P(q[0], q[1]); }); }
    function A(arr) { return arr.map(function (w) { return w * s; }); }
    var g = {};
    var cuerpo = suave(L([[0.4, 0.6], [0.46, 0.74], [0.52, 0.88], [0.58, 0.97], [0.7, 0.88], [0.8, 0.84], [0.84, 0.89], [0.8, 0.96], [0.7, 1.05], [0.62, 1.12], [0.55, 1.11], [0.47, 1.03], [0.36, 0.96], [0.24, 0.93], [0.1, 0.89], [-0.06, 0.89], [-0.22, 0.93], [-0.34, 0.93], [-0.44, 0.87], [-0.48, 0.75], [-0.43, 0.63], [-0.3, 0.56], [-0.12, 0.54], [0.08, 0.54], [0.24, 0.56], [0.34, 0.56]]));
    var oreja = poli(L([[0.62, 1.1], [0.6, 1.21], [0.55, 1.11]]));
    var mano = pata(L([[0.36, 0.72], [0.38, 0.5], [0.41, 0.3], [0.4, 0.1], [0.44, 0.03], [0.46, 0.0]]), A([0.17, 0.095, 0.062, 0.046, 0.05, 0.066]));
    var trasera = pata(L([[-0.3, 0.78], [-0.37, 0.52], [-0.47, 0.32], [-0.43, 0.1], [-0.41, 0.03], [-0.43, 0.0]]), A([0.26, 0.14, 0.066, 0.046, 0.05, 0.066]));
    var hombro = elipse(x - 0.33 * s, y - 0.71 * s, 0.11 * s, 0.15 * s, 0.25), anca = elipse(x + 0.31 * s, y - 0.75 * s, 0.15 * s, 0.17 * s, -0.2);
    var cola = suave(L([[-0.44, 0.87], [-0.52, 0.82], [-0.58, 0.64], [-0.57, 0.45], [-0.53, 0.43], [-0.53, 0.62], [-0.47, 0.76]]));
    g.caballo = une([cuerpo, oreja, hombro, anca, mano, trasera, cola]);
    // las patas del otro lado, un poco más oscuras (al paso: una adelantada y otra atrasada)
    g.patasLejos = une([pata(L([[0.26, 0.68], [0.23, 0.44], [0.18, 0.3], [0.22, 0.11], [0.2, 0.03], [0.22, 0.0]]), A([0.15, 0.085, 0.06, 0.046, 0.05, 0.066])),
      pata(L([[-0.2, 0.74], [-0.25, 0.48], [-0.31, 0.31], [-0.25, 0.11], [-0.21, 0.03], [-0.23, 0.0]]), A([0.22, 0.12, 0.066, 0.046, 0.05, 0.066]))]);
    g.crin = suave(L([[0.6, 1.12], [0.5, 1.09], [0.38, 0.99], [0.26, 0.95], [0.3, 0.9], [0.42, 0.95], [0.52, 1.02]]));
    g.manta = suave(L([[0.16, 0.92], [-0.16, 0.92], [-0.18, 0.72], [0.14, 0.72]]));
    g.silla = suave(L([[0.15, 0.93], [0.12, 1.0], [0.06, 0.96], [-0.08, 0.96], [-0.14, 1.0], [-0.17, 0.93]]));
    g.jinete = une([
      suave(L([[0.09, 0.95], [0.12, 1.12], [0.06, 1.2], [-0.04, 1.2], [-0.08, 1.12], [-0.07, 0.95]])),                       // el cuerpo
      pata(L([[0.0, 0.96], [0.14, 0.86], [0.1, 0.66], [0.13, 0.6]]), A([0.08, 0.07, 0.055, 0.05])),                        // la pierna (muslo, rodilla, bota)
      pata(L([[0.07, 1.14], [0.18, 1.02], [0.3, 0.99]]), A([0.05, 0.045, 0.04]))                                             // el brazo con las riendas
    ]);
    g.bota = suave(L([[0.08, 0.64], [0.2, 0.6], [0.2, 0.56], [0.08, 0.57]]));
    g.cabeza = circulo(x - 0.02 * s, y - 1.26 * s, 0.055 * s);
    var hx = x - 0.02 * s, hy = y - 1.26 * s, ala = new Path2D();
    ala.moveTo(hx - 0.165 * s, hy - 0.078 * s); ala.quadraticCurveTo(hx, hy - 0.032 * s, hx + 0.165 * s, hy - 0.078 * s); ala.quadraticCurveTo(hx + 0.178 * s, hy - 0.092 * s, hx + 0.155 * s, hy - 0.094 * s);
    ala.quadraticCurveTo(hx, hy - 0.058 * s, hx - 0.155 * s, hy - 0.094 * s); ala.quadraticCurveTo(hx - 0.178 * s, hy - 0.092 * s, hx - 0.165 * s, hy - 0.078 * s); ala.closePath();
    var copa = suave([[hx - 0.078 * s, hy - 0.07 * s], [hx - 0.074 * s, hy - 0.13 * s], [hx - 0.052 * s, hy - 0.168 * s], [hx - 0.012 * s, hy - 0.152 * s], [hx + 0.024 * s, hy - 0.168 * s], [hx + 0.056 * s, hy - 0.152 * s], [hx + 0.074 * s, hy - 0.13 * s], [hx + 0.078 * s, hy - 0.07 * s]]);
    g.sombrero = une([copa, ala]); g.copa = copa; g.cintaSombrero = rect(hx - 0.077 * s, hy - 0.098 * s, 0.154 * s, 0.02 * s); g.cabezaC = [hx, hy];
    g.panuelo = poli(L([[0.07, 1.19], [-0.05, 1.19], [0.0, 1.11]]));
    g.riendas = new Path2D(); var a = P(0.3, 0.98), b = P(0.79, 0.88); g.riendas.moveTo(a[0], a[1]); g.riendas.quadraticCurveTo(x - 0.52 * s, y - 0.86 * s, b[0], b[1]);
    g.ojo = P(0.69, 1.0);
    return g;
  }
  // la planta rodadora: una maraña de ramas finas
  function rodadora(x, y, r) {
    sembrar(77); var p = new Path2D();
    for (var i = 0; i < 120; i++) { var a = azar() * 6.28, b = a + (azar() - 0.5) * 2.6, r1 = r * Math.sqrt(azar()), r2 = r * (0.5 + azar() * 0.5); p.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * 0.88); p.quadraticCurveTo(x + (azar() - 0.5) * r * 1.2, y + (azar() - 0.5) * r, x + Math.cos(b) * r2, y + Math.sin(b) * r2 * 0.88); }
    return p;
  }
  function chumbera(x, y, s) { return une([elipse(x, y - 30 * s, 16 * s, 30 * s, 0.1), elipse(x - 24 * s, y - 62 * s, 12 * s, 22 * s, -0.5), elipse(x + 20 * s, y - 70 * s, 13 * s, 24 * s, 0.4), elipse(x + 6 * s, y - 96 * s, 10 * s, 18 * s, 0.1)]); }
  function artemisa(x, y, s) { sembrar(Math.round(x)); var p = new Path2D(); for (var i = 0; i < 7; i++) { var cx = x + (azar() - 0.5) * 50 * s, cy = y - 8 * s - azar() * 16 * s; p.addPath(elipse(cx, cy, (12 + azar() * 10) * s, (8 + azar() * 6) * s)); } return p; }
  function nube(x, y, k) {
    sembrar(Math.round(x + y)); var p = new Path2D(), base = y + 26 * k;
    p.moveTo(x - 140 * k, base);
    var bolas = [[-118, -2, 26], [-86, -22, 36], [-44, -44, 46], [6, -54, 52], [56, -36, 42], [96, -18, 32], [124, -2, 24]];
    bolas.forEach(function (b) { p.arc(x + b[0] * k, base + b[1] * k - b[2] * k * 0.2, b[2] * k, Math.PI * 0.95, Math.PI * 2.05); });
    p.lineTo(x + 146 * k, base); p.closePath(); return p;
  }
  var DEP = deposito(912, 708), MOL = molino(1500, 640), TREN = tren(968), JIN = jinete(1090, 840, 150);
  var POSTES = [880, 1040, 1200, 1360, 1520].map(function (x) { return { x: x, y: VIA + 2 }; });

  function lienzo(id) { var cv = document.getElementById(id); cv.width = W * ESC; cv.height = H * ESC; var c = cv.getContext('2d'); c.scale(ESC, ESC); c.lineJoin = 'round'; c.lineCap = 'round'; return c; }
  function textoLetrero(c, T, color, sombra) { c.save(); c.font = '700 ' + T.s + 'px ' + LETRA; var mw = c.measureText(T.t).width + T.t.length * 1.5; if (T.max && mw > T.max) c.font = '700 ' + (T.s * T.max / mw).toFixed(1) + 'px ' + LETRA; c.textAlign = 'center'; c.textBaseline = 'middle'; if ('letterSpacing' in c) c.letterSpacing = '1.5px'; if (sombra) { c.fillStyle = sombra; c.fillText(T.t, T.x + 1.2, T.y + 1.2); } c.fillStyle = color; c.fillText(T.t, T.x, T.y); c.restore(); }
  function rueda(c, r, relleno, raya, grosor) { c.fillStyle = relleno; c.beginPath(); c.arc(r.x, r.y, r.r, 0, 6.29); c.fill(); c.strokeStyle = raya; c.lineWidth = grosor || 1.2; c.beginPath(); c.arc(r.x, r.y, r.r - 2, 0, 6.29); for (var i = 0; i < 8; i++) { var a = i / 8 * 6.28; c.moveTo(r.x, r.y); c.lineTo(r.x + Math.cos(a) * (r.r - 2), r.y + Math.sin(a) * (r.r - 2)); } c.stroke(); }
  function grano(c, fuerza, color) { sembrar(5); c.save(); c.fillStyle = color; for (var i = 0; i < 26000 * fuerza; i++) { c.globalAlpha = azar() * 0.5; c.fillRect(azar() * W, azar() * H, 1.1, 1.1); } c.restore(); }
  /* ================================================================== C mejorada: el pintor con planos de luz (cel)
     Todo se pinta igual en las dos versiones; cambian la paleta y de dónde viene la luz (P.luz: -1 izquierda, 1 derecha). */
  var TINTA = null;   // el color de la tinta de la escena (null: sin contorno)
  function contorno(c, p, w) { if (!TINTA) return; c.strokeStyle = TINTA; c.lineWidth = w || 3.4; c.stroke(p); }
  function bajo(p, c, color) { contorno(c, p); c.fillStyle = color; c.fill(p); }
  // pinta un camino y, dentro de él, la misma forma desplazada hacia la luz: lo que queda sin cubrir es la sombra
  function cel(c, p, tonos, dx, dy) {
    contorno(c, p); c.fillStyle = tonos[0]; c.fill(p);
    c.save(); c.clip(p);
    for (var i = 1; i < tonos.length; i++) { c.save(); c.translate(dx * i, dy * i); c.fillStyle = tonos[i]; c.fill(p); c.restore(); }
    c.restore();
  }
  function aRGB(c) { if (c[0] === '#') { var n = parseInt(c.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; } var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c); return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0]; }
  function mezcla(a, b, t) { var A = aRGB(a), B = aRGB(b); return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')'; }

  // las nubes por capas: base en sombra, cuerpo y luz, cada una un poco desplazada hacia el sol
  function nubeCel(c, x, y, k, P) {
    var n = P.nube.length - 1; cel(c, nube(x, y, k), P.nube, -P.luz * 12 * k / n, -16 * k / n);
    // estelas: dos o tres husos finos que salen de la base y se alargan
    [[0, 30, 1.25], [-40, 36, 0.9], [60, 41, 0.7]].forEach(function (q, i) { var e = elipse(x + q[0] * k, y + q[1] * k, 160 * k * q[2], 2 * k + 0.8); c.globalAlpha = 0.75 - i * 0.15; c.fillStyle = P.nube[Math.min(1, n)]; c.fill(e); c.globalAlpha = 1; });
  }
  // las rayas de nubes altas (cirros) del atardecer
  function cirro(c, x, y, w, color) { c.fillStyle = color; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w * 0.5, y - 7, x + w, y + 1); c.quadraticCurveTo(x + w * 0.5, y + 5, x, y); c.fill(); }

  // el cañón en el mismo lenguaje que el resto: planos de color sólido con bordes nítidos (sin transparencias ni ruido)
  function tonos(P) {
    var R = P.roca;
    return { luz: R[0], medio: R[1], sombra: R[2], hondo: R[3], cap: mezcla(R[0], '#fff4e0', 0.35), capSombra: mezcla(R[2], R[3], 0.5), banda: mezcla(R[1], R[2], 0.35), banda2: mezcla(R[1], R[0], 0.3), baja: mezcla(R[2], R[1], 0.35), talud: mezcla(R[1], R[2], 0.2) };
  }
  // una roca con caras: medio tono, la cara de luz y la de sombra cortadas en escalones rectos, franjas y cornisa
  function caras(c, p, b, P, alto, grada) {
    var T = tonos(P), w = b.x1 - b.x0, luzIzq = P.luz < 0, cap = Math.min(16, alto * 0.09), yb = grada ? b.y0 + alto * 0.6 : b.y1;
    sembrar(Math.round(b.x0 * 7 + b.y0));
    contorno(c, p, 3.4);
    c.save(); c.clip(p);
    c.fillStyle = T.medio; c.fillRect(b.x0 - 300, b.y0 - 60, w + 600, HOR - b.y0 + 80);
    // dos franjas de estrato, de color sólido
    var f1 = b.y0 + alto * (0.32 + azar() * 0.06), f2 = b.y0 + alto * (0.5 + azar() * 0.05);
    c.fillStyle = T.banda; c.fillRect(b.x0 - 300, f1, w + 600, alto * 0.06); c.fillStyle = T.banda2; c.fillRect(b.x0 - 300, f2, w + 600, alto * 0.035);
    // la cara de luz: el lado del sol, con el borde en escalones rectos (como la roca rota en columnas)
    var lim = luzIzq ? b.x0 + w * 0.36 : b.x1 - w * 0.36, ext = luzIzq ? b.x0 - 300 : b.x1 + 300, pts = [[ext, b.y0 - 60]], x = lim, y;
    for (y = b.y0 - 60; y < yb; y += 30 + azar() * 30) { pts.push([x, y]); x = lim + (azar() - 0.5) * w * 0.16; pts.push([x, y]); }
    pts.push([x, yb]); pts.push([ext, yb]); c.fillStyle = T.luz; c.fill(poli(pts));
    // la cara de sombra, del otro lado, y una franja honda en su borde
    var lim2 = luzIzq ? b.x1 - w * 0.3 : b.x0 + w * 0.3, ext2 = luzIzq ? b.x1 + 300 : b.x0 - 300, s2 = [[ext2, b.y0 - 60]]; x = lim2;
    for (y = b.y0 - 60; y < b.y1 + 60; y += 26 + azar() * 26) { s2.push([x, y]); x = lim2 + (azar() - 0.5) * w * 0.12; s2.push([x, y]); }
    s2.push([x, b.y1 + 60]); s2.push([ext2, b.y1 + 60]); c.fillStyle = T.sombra; c.fill(poli(s2));
    c.fillStyle = T.hondo; c.fillRect(luzIzq ? b.x1 - w * 0.06 : b.x0, b.y0, w * 0.06, alto);
    // los surcos: pocos, como cuñas estrechas de sombra con su filo de luz al lado
    var n = Math.max(2, Math.round(w / 34));
    for (var k = 0; k < n; k++) {
      var gx = b.x0 + w * (k + 0.3 + azar() * 0.4) / n, top = b.y0 + cap + 4, len = (yb - top) * (0.45 + azar() * 0.5), gw = 3 + azar() * 3;
      c.fillStyle = T.sombra; c.fill(poli([[gx - gw / 2, top], [gx + gw / 2, top], [gx + 0.6, top + len], [gx - 0.6, top + len]]));
      c.fillStyle = T.luz; c.fill(poli([[gx - (luzIzq ? gw / 2 + 2 : -gw / 2), top], [gx - (luzIzq ? gw / 2 : -gw / 2 - 2), top], [gx - (luzIzq ? 0.6 : -0.6), top + len * 0.85]]));
    }
    // la parte baja de las mesetas grandes: pizarra más oscura con repisas (línea de luz y de sombra)
    if (grada) { c.fillStyle = T.baja; c.fillRect(b.x0 - 300, yb, w + 600, b.y1 - yb + 2); c.fillStyle = T.capSombra; c.fillRect(b.x0 - 300, yb, w + 600, 4); for (y = yb + 12; y < b.y1; y += 12 + azar() * 6) { c.fillStyle = T.luz; c.fillRect(b.x0 - 300, y, w + 600, 2); c.fillStyle = T.capSombra; c.fillRect(b.x0 - 300, y + 2, w + 600, 2); } }
    // la cornisa de roca dura de la cima: más clara, con su sombra recortada debajo
    c.fillStyle = T.cap; c.fillRect(b.x0 - 300, b.y0 - 6, w + 600, cap + 6); c.fillStyle = T.capSombra; c.fillRect(b.x0 - 300, b.y0 + cap, w + 600, 4);
    for (k = 0; k < w / 48; k++) { c.fillStyle = T.capSombra; c.fillRect(b.x0 + azar() * w, b.y0 + 2, 3, cap - 2); }
    if (TINTA) { c.save(); c.clip(poli(s2)); c.strokeStyle = TINTA; c.globalAlpha = 0.3; c.lineWidth = 1; c.beginPath(); for (var hx = b.x0 - 200; hx < b.x1 + 200; hx += 6) { c.moveTo(hx, b.y0 - 60); c.lineTo(hx + 40, b.y1 + 60); } c.stroke(); c.restore(); c.globalAlpha = 1; }
    c.restore();
  }
  // la falda de derrubios: triángulos de color plano (luz, medio, sombra) y bloques caídos con su cara de luz
  function derrubios(c, m, P) {
    var T = tonos(P), luzIzq = P.luz < 0, cx = (m.x0 + m.x1) / 2 + (luzIzq ? 1 : -1) * (m.x1 - m.x0) * 0.12, alto = HOR - m.pie;
    sembrar(m.x0 + 99);
    c.save(); c.clip(m.p);
    // dos planos: el lado del sol y el lado de la sombra, partidos por una arista que baja de la pared
    var izq = [[m.x0 - 400, HOR + 4], [m.x0 - 400, m.pie], [cx, m.pie], [cx - (luzIzq ? 1 : -1) * alto * 0.25, HOR + 4]];
    var der = [[cx, m.pie], [m.x1 + 400, m.pie], [m.x1 + 400, HOR + 4], [cx - (luzIzq ? 1 : -1) * alto * 0.25, HOR + 4]];
    var planoSol = mezcla(T.luz, T.talud, 0.5), planoSombra = mezcla(T.sombra, T.talud, 0.35);
    c.fillStyle = luzIzq ? planoSol : planoSombra; c.fill(poli(izq));
    c.fillStyle = luzIzq ? planoSombra : planoSol; c.fill(poli(der));
    // la sombra que la pared echa sobre el arranque de la falda
    c.fillStyle = T.capSombra; c.fill(poli([[m.x0 - 10, m.pie], [m.x1 + 10, m.pie], [m.x1 + 30, m.pie + 8], [m.x0 - 30, m.pie + 8]]));
    // una repisa a media ladera: línea de luz y de sombra que sigue la pendiente
    var yr = m.pie + alto * 0.55; c.fillStyle = mezcla(T.sombra, T.talud, 0.4); c.fill(poli([[m.x0 - 400, yr + 2], [m.x1 + 400, yr + 2], [m.x1 + 400, yr + 4], [m.x0 - 400, yr + 4]]));
    // los regueros: pocos y suaves, cuñas que nacen al pie de la pared y se abren hacia abajo (casi del color del plano)
    var n = Math.max(2, Math.round((m.x1 - m.x0) / 90));
    for (var k = 0; k < n; k++) { var gx = m.x0 + (m.x1 - m.x0) * (k + 0.5) / n + (azar() - 0.5) * 24, ladoSol = (gx < cx) === luzIzq, dx = (gx - cx) * 0.3; c.fillStyle = ladoSol ? mezcla(T.talud, T.sombra, 0.3) : mezcla(T.sombra, T.hondo, 0.3); c.fill(poli([[gx - 1.5, m.pie + 8], [gx + 1.5, m.pie + 8], [gx + dx + 7, HOR + 4], [gx + dx - 7, HOR + 4]])); }
    c.restore();
    // los bloques caídos al pie: cara de arriba en luz, el costado en sombra, con su contorno
    for (k = 0; k < 10; k++) { var bx = m.x0 - 80 + azar() * (m.x1 - m.x0 + 160), by = HOR - azar() * alto * 0.3, br = 4 + azar() * 7, pts = [[bx - br, by], [bx - br * 0.8, by - br * 0.8], [bx + br * 0.2, by - br * 1.05], [bx + br, by - br * 0.4], [bx + br * 0.9, by]]; contorno(c, poli(pts), 2); c.fillStyle = T.sombra; c.fill(poli(pts)); c.fillStyle = T.luz; c.fill(poli([[bx - br * 0.8, by - br * 0.8], [bx + br * 0.2, by - br * 1.05], [bx + br * 0.55, by - br * 0.6], [bx - br * 0.35, by - br * 0.45]])); }
  }
  function mesaCel(c, o, P) {
    var m = o.m, alto = m.pie - m.cima;
    caras(c, m.p, { x0: m.x0, x1: m.x1, y0: m.cima, y1: m.pie }, P, alto, o.grada);
    derrubios(c, m, P);
    if (o.a) caras(c, o.a, { x0: o.ax0, x1: o.ax1, y0: o.acima, y1: o.apie }, P, o.apie - o.acima, false);
  }
  // una roca suelta de primer plano: un canto con su cara de arriba en luz
  function canto(c, x, y, w, h, P, s) {
    sembrar(s); var pts = [], n = 9;
    for (var i = 0; i < n; i++) { var a = Math.PI + i / (n - 1) * Math.PI, r = 0.75 + azar() * 0.3; pts.push([x + Math.cos(a) * w / 2 * r, y + Math.sin(a) * h * r]); }
    var p = poli(pts);
    c.fillStyle = P.roca[2]; c.fill(p);
    c.save(); c.clip(p);
    c.fillStyle = P.roca[1]; c.fill(poli(pts.map(function (q) { return [q[0] - P.luz * w * 0.1, q[1] - h * 0.18]; })));
    c.fillStyle = P.roca[0]; c.fill(poli(pts.map(function (q) { return [q[0] - P.luz * w * 0.2, q[1] - h * 0.42]; })));
    c.restore();
    c.fillStyle = P.sombraSuelo; c.beginPath(); c.ellipse(x + P.luz * -w * 0.1, y + 2, w * 0.55, 6, 0, 0, 6.29); c.fill();
  }

  // una mata de hierba seca: hojas finas en abanico, dos tonos
  function mata(c, x, y, s, P) {
    sembrar(Math.round(x * 3 + y)); var n = 7 + Math.floor(azar() * 5);
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 2.2 + (azar() - 0.5) * 0.2, l = s * (14 + azar() * 16), ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l;
      c.fillStyle = P.hierba[i % 2]; c.beginPath(); c.moveTo(x - 1.6, y); c.quadraticCurveTo((x + ex) / 2 + Math.cos(a) * 2, (y + ey) / 2, ex, ey); c.quadraticCurveTo((x + ex) / 2, (y + ey) / 2 + 2, x + 1.6, y); c.fill();
      if (i % 3 === 1 && s > 0.8) { c.fillStyle = '#efdca0'; c.beginPath(); c.ellipse(ex, ey - 2 * s, 1.6 * s, 4 * s, a + Math.PI / 2, 0, 6.29); c.fill(); }   // las espigas
    }
  }
  // el saguaro: el tronco y los brazos son trazos gruesos de punta redonda (el brazo sale en horizontal, hace codo y sube)
  function saguaro(c, x, y, h, P) {
    var w = h * 0.12, tronco = new Path2D(), brazos = new Path2D();
    tronco.moveTo(x, y + 10); tronco.lineTo(x, y - h + w / 2);
    [[-1, 0.44, 0.78], [1, 0.58, 0.88]].forEach(function (b) {
      var sx = b[0], ya = y - h * b[1], xa = x + sx * w * 1.55;
      brazos.moveTo(x, ya + w * 0.2); brazos.quadraticCurveTo(xa, ya + w * 0.2, xa, ya - w * 0.9); brazos.lineTo(xa, y - h * b[2]);
    });
    c.lineCap = 'round'; c.lineJoin = 'round';
    function trazo(path, ancho, color, dx) { c.save(); c.translate(dx || 0, 0); c.strokeStyle = color; c.lineWidth = ancho; c.stroke(path); c.restore(); }
    c.fillStyle = P.sombraSuelo; c.beginPath(); c.ellipse(x - P.luz * h * 0.22, y + 4, h * 0.28, 8, 0, 0, 6.29); c.fill();
    if (TINTA) { trazo(brazos, w * 0.8 + 3.4, TINTA); trazo(tronco, w + 3.4, TINTA); }
    trazo(brazos, w * 0.8, P.cactus[1]); trazo(tronco, w, P.cactus[1]);
    trazo(brazos, w * 0.46, P.cactus[0], -P.luz * w * 0.14); trazo(tronco, w * 0.56, P.cactus[0], -P.luz * w * 0.16);
    // las costillas: líneas finas que siguen la forma
    [-0.3, 0, 0.3].forEach(function (k) { trazo(brazos, 1.1, P.cactus[2], k * w * 0.8); trazo(tronco, 1.2, P.cactus[2], k * w); });
    // las espinas: puntitos claros a lo largo
    c.fillStyle = 'rgba(255,250,220,.7)'; sembrar(Math.round(x)); for (var k2 = 0; k2 < 40; k2++) c.fillRect(x + (azar() - 0.5) * w, y - azar() * h, 1.4, 1.4);
    c.lineCap = 'round';
  }
  function sierra(P) { sembrar(61); var pts = [[0, HOR]]; for (var x = 0; x <= W; x += 24) pts.push([x, 498 - Math.abs(Math.sin(x / 210)) * 26 - Math.abs(Math.sin(x / 67 + 1)) * 8 - azar() * 4]); pts.push([W, HOR]); return poli(pts); }
  // un enebro o un pino piñonero: copa de bolas con su luz, tronquito corto
  function enebro(c, x, y, s, P) {
    sembrar(Math.round(x * 7 + y)); var bolas = [];
    for (var i = 0; i < 7; i++) bolas.push(circulo(x + (azar() - 0.5) * 34 * s, y - 20 * s - azar() * 22 * s, (11 + azar() * 9) * s));
    c.fillStyle = P.madera[2]; c.fillRect(x - 2 * s, y - 14 * s, 4 * s, 14 * s);
    cel(c, une(bolas), P.arbol, -P.luz * 4 * s, -5 * s);
    c.fillStyle = P.sombraSuelo; c.beginPath(); c.ellipse(x - P.luz * 12 * s, y + 1, 22 * s, 4 * s, 0, 0, 6.29); c.fill();
  }
  // una valla de troncos: postes torcidos y dos o tres travesaños entre cada par
  function valla(c, postes, alto, P, travesanos) {
    sembrar(Math.round(postes[0][0]));
    for (var i = 1; i < postes.length; i++) {
      var a = postes[i - 1], b = postes[i];
      (travesanos || [0.35, 0.72]).forEach(function (k) {
        var t = new Path2D(), d = (azar() - 0.5) * 4; t.moveTo(a[0], a[1] - alto * k + d); t.lineTo(b[0], b[1] - alto * k - d);
        if (TINTA) { c.strokeStyle = TINTA; c.lineWidth = alto * 0.11 + 3.2; c.stroke(t); }
        c.strokeStyle = P.valla[1]; c.lineWidth = alto * 0.11; c.stroke(t); c.strokeStyle = P.valla[0]; c.lineWidth = alto * 0.04; c.save(); c.translate(0, -alto * 0.025); c.stroke(t); c.restore();
      });
    }
    postes.forEach(function (q) { var w = alto * 0.12, p = poli([[q[0] - w / 2, q[1]], [q[0] - w / 2 + 1, q[1] - alto - 2], [q[0] + w / 2 - 1, q[1] - alto], [q[0] + w / 2, q[1]]]); cel(c, p, [P.valla[1], P.valla[0]], -P.luz * w * 0.35, 0); });
  }
  // una persona (de pie, sentada o con vestido): cuerpo por piezas con su luz, sombrero
  function persona(c, x, y, h, op, P) {
    var mira = op.mira || 1; function Q(px, py) { return [x + px * h * mira, y - py * h]; } function L(a) { return a.map(function (q) { return Q(q[0], q[1]); }); } function A2(a) { return a.map(function (w) { return w * h; }); }
    var sent = op.tipo === 'sentado', vest = op.tipo === 'vestido', cad = sent ? 0.34 : 0.5, hom = cad + 0.3, cab = cad + 0.4, lz = -P.luz * mira;
    var ropa = op.ropa, ropa2 = op.ropa2 || P.pantalon2, piel = P.piel, oscuro = '#2a1c16';
    c.fillStyle = P.sombraSuelo; c.beginPath(); c.ellipse(x - P.luz * h * 0.1, y + 1, h * (sent ? 0.2 : 0.14), h * 0.025, 0, 0, 6.29); c.fill();
    if (vest) {
      // la falda acampanada, con su vuelo y un pliegue; el delantal claro encima
      var falda = suave(L([[-0.07, cad + 0.04], [0.07, cad + 0.04], [0.12, cad - 0.2], [0.17, 0.03], [0.1, -0.005], [0, 0.01], [-0.1, -0.005], [-0.17, 0.03], [-0.12, cad - 0.2]]));
      cel(c, falda, [ropa[1], ropa[0]], lz * 2, 0);
      c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; c.beginPath(); [[-0.06, 0.08], [0.05, 0.07]].forEach(function (q) { var a = Q(q[0] * 0.6, cad - 0.02), b = Q(q[0], q[1]); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }); c.stroke();
      if (op.delantal !== false) bajo(suave(L([[-0.05, cad + 0.02], [0.05, cad + 0.02], [0.08, 0.16], [0, 0.12], [-0.08, 0.16]])), c, '#f2ead8');
      c.fillStyle = oscuro; var pz = Q(0.06, 0.0), pz2 = Q(-0.06, 0.0); c.fillRect(pz[0] - 3, pz[1] - 3, 6, 3); c.fillRect(pz2[0] - 3, pz2[1] - 3, 6, 3);
    } else if (sent) {
      cel(c, une([pata(L([[0.0, cad], [0.17, cad + 0.02], [0.19, 0.17], [0.2, 0.05]]), A2([0.1, 0.085, 0.075, 0.07])), pata(L([[-0.03, cad], [0.13, cad], [0.14, 0.17], [0.15, 0.05]]), A2([0.1, 0.085, 0.075, 0.07]))]), [ropa2[1], ropa2[0]], lz * 1.5, 0);
      [[0.2, 0.0], [0.15, 0.0]].forEach(function (q) { bajo(suave(L([[q[0] - 0.04, 0.08], [q[0] + 0.04, 0.08], [q[0] + 0.07, 0.0], [q[0] - 0.04, 0.0]])), c, oscuro); });
    } else {
      // las piernas un poco abiertas y las botas con su tacón
      cel(c, une([pata(L([[0.025, cad], [0.04, 0.26], [0.045, 0.06]]), A2([0.1, 0.08, 0.072])), pata(L([[-0.03, cad], [-0.045, 0.26], [-0.06, 0.06]]), A2([0.1, 0.08, 0.072]))]), [ropa2[1], ropa2[0]], lz * 1.5, 0);
      [[0.045, 1], [-0.06, 1]].forEach(function (q) { bajo(suave(L([[q[0] - 0.035, 0.09], [q[0] + 0.035, 0.09], [q[0] + 0.07, 0.01], [q[0] + 0.07, 0.0], [q[0] - 0.04, 0.0], [q[0] - 0.04, 0.03]])), c, oscuro); });
    }
    // el torso (camisa o blusa), los hombros y los brazos
    var torso = suave(L([[-0.085, cad + 0.01], [0.085, cad + 0.01], [0.1, hom - 0.04], [0.06, hom + 0.02], [-0.06, hom + 0.02], [-0.1, hom - 0.04]]));
    var brazoA = op.brazo === 'apoyado' ? pata(L([[0.08, hom - 0.02], [0.15, hom - 0.12], [0.08, cad + 0.04]]), A2([0.06, 0.055, 0.05])) : pata(L([[0.09, hom - 0.02], [0.12, hom - 0.14], [0.11, cad - 0.04]]), A2([0.062, 0.056, 0.05]));
    var brazoB = pata(L([[-0.09, hom - 0.02], [-0.13, hom - 0.14], [-0.1, cad + 0.02]]), A2([0.062, 0.056, 0.05]));
    cel(c, une([brazoB, torso, brazoA]), [ropa[1], ropa[0]], lz * 2, -1);
    if (!vest) { var ch = suave(L([[-0.085, cad + 0.02], [-0.02, cad + 0.02], [-0.03, hom], [-0.07, hom + 0.01], [-0.095, hom - 0.04]])); bajo(ch, c, op.chaleco || P.chaleco); var ch2 = suave(L([[0.02, cad + 0.02], [0.085, cad + 0.02], [0.095, hom - 0.04], [0.07, hom + 0.01], [0.03, hom]])); bajo(ch2, c, op.chaleco || P.chaleco);
      c.fillStyle = P.cuero[1]; var cin = Q(-0.09, cad + 0.035); c.fillRect(Math.min(cin[0], Q(0.09, 0)[0]), cin[1], 0.18 * h, 0.03 * h); c.fillStyle = P.laton; var hb = Q(0, cad + 0.02); c.fillRect(hb[0] - 0.015 * h, hb[1] - 0.025 * h, 0.03 * h, 0.022 * h);
      bajo(poli(L([[-0.04, hom + 0.01], [0.04, hom + 0.01], [0, hom - 0.05]])), c, op.panuelo || P.panuelo); }
    else { bajo(poli(L([[-0.03, hom + 0.015], [0.03, hom + 0.015], [0, hom - 0.02]])), c, '#f2ead8'); }
    // las manos
    [brazoA === null ? null : Q(op.brazo === 'apoyado' ? 0.08 : 0.11, cad - (op.brazo === 'apoyado' ? -0.04 : 0.05)), Q(-0.1, cad + 0.0)].forEach(function (q) { if (q) { c.fillStyle = piel[0]; c.beginPath(); c.arc(q[0], q[1], 0.026 * h, 0, 6.29); c.fill(); } });
    // el cuello, la cabeza con nariz, ojo y (en él) bigote
    var cz = Q(0, cab); c.fillStyle = piel[1]; c.fillRect(cz[0] - 0.022 * h, cz[1] + 0.03 * h, 0.044 * h, 0.05 * h);
    var cabeza = suave(L([[-0.06, cab + 0.02], [-0.055, cab + 0.07], [0.0, cab + 0.095], [0.055, cab + 0.07], [0.07, cab + 0.02], [0.075, cab - 0.005], [0.05, cab - 0.05], [0.0, cab - 0.065], [-0.05, cab - 0.04]]));
    cel(c, cabeza, [piel[1], piel[0]], lz * 1.4, -1);
    var ojo = Q(0.035, cab + 0.015); c.fillStyle = '#1a1210'; c.beginPath(); c.arc(ojo[0], ojo[1], 0.009 * h, 0, 6.29); c.fill();
    if (!vest && op.bigote !== false) { var bg = Q(0.045, cab - 0.02); c.fillStyle = op.pelo || '#4a2a18'; c.beginPath(); c.ellipse(bg[0], bg[1], 0.03 * h, 0.01 * h, 0, 0, 6.29); c.fill(); }
    if (vest) { var pelo = une([suave(L([[-0.065, cab + 0.0], [-0.06, cab + 0.08], [0.0, cab + 0.105], [0.06, cab + 0.08], [0.05, cab + 0.05], [-0.01, cab + 0.06], [-0.04, cab + 0.02]])), circulo(Q(-0.075, cab + 0.06)[0], Q(-0.075, cab + 0.06)[1], 0.035 * h)]); cel(c, pelo, [mezcla(op.pelo || '#4a2a18', '#000000', 0.25), op.pelo || '#4a2a18'], lz, -1); }
    else {
      // el sombrero, centrado en la cabeza: ala con los lados un poco levantados, copa con su hendidura y la cinta
      var hx = cz[0], hy = cz[1], ala = new Path2D(); ala.moveTo(hx - 0.13 * h, hy - 0.055 * h); ala.quadraticCurveTo(hx, hy - 0.02 * h, hx + 0.13 * h, hy - 0.055 * h); ala.quadraticCurveTo(hx + 0.14 * h, hy - 0.068 * h, hx + 0.12 * h, hy - 0.07 * h); ala.quadraticCurveTo(hx, hy - 0.042 * h, hx - 0.12 * h, hy - 0.07 * h); ala.quadraticCurveTo(hx - 0.14 * h, hy - 0.068 * h, hx - 0.13 * h, hy - 0.055 * h); ala.closePath();
      var copa = suave([[hx - 0.062 * h, hy - 0.05 * h], [hx - 0.058 * h, hy - 0.1 * h], [hx - 0.04 * h, hy - 0.128 * h], [hx - 0.008 * h, hy - 0.116 * h], [hx + 0.02 * h, hy - 0.128 * h], [hx + 0.045 * h, hy - 0.116 * h], [hx + 0.058 * h, hy - 0.1 * h], [hx + 0.062 * h, hy - 0.05 * h]]);
      var sb = op.sombrero || P.sombrero[1]; cel(c, une([copa, ala]), [mezcla(sb, '#000000', 0.3), sb], lz * 1.2, -1.2); c.fillStyle = P.sombrero[2]; c.fillRect(hx - 0.06 * h, hy - 0.072 * h, 0.12 * h, 0.016 * h);
      c.save(); c.clip(cabeza); c.fillStyle = 'rgba(40,20,10,.3)'; c.fillRect(hx - 0.08 * h, hy - 0.06 * h, 0.16 * h, 0.03 * h); c.restore();
    }
  }
  function perro(c, x, y, s, P) {
    function Q(px, py) { return [x + px * s, y + py * s]; }
    var cuerpo = suave([Q(-14, 0), Q(-16, -9), Q(-4, -13), Q(12, -12), Q(22, -9), Q(24, -2), Q(20, 1)]);
    var anca = elipse(x + 16 * s, y - 6 * s, 9 * s, 7 * s), patas = une([pata([Q(-14, -2), Q(-24, 0), Q(-30, 0)], [5 * s, 4 * s, 4 * s]), pata([Q(-10, -1), Q(-22, 2), Q(-29, 2)], [5 * s, 4 * s, 4 * s])]);
    var cabeza = suave([Q(-20, -2), Q(-22, -9), Q(-28, -11), Q(-36, -8), Q(-38, -4), Q(-32, -1)]);
    c.fillStyle = P.sombraSuelo; c.beginPath(); c.ellipse(x, y + 2, 32 * s, 4 * s, 0, 0, 6.29); c.fill();
    c.lineCap = 'round'; c.strokeStyle = P.perro[1]; c.lineWidth = 3 * s; c.beginPath(); var t0 = Q(23, -6), t1 = Q(32, -2), t2 = Q(28, 1); c.moveTo(t0[0], t0[1]); c.quadraticCurveTo(t1[0], t1[1], t2[0], t2[1]); c.stroke();   // la cola
    cel(c, une([cuerpo, anca, patas]), [P.perro[1], P.perro[0]], -P.luz * 1.6, -2);
    c.save(); c.clip(cuerpo); c.fillStyle = '#f2ead8'; c.beginPath(); c.ellipse(x + 2 * s, y - 2 * s, 9 * s, 4 * s, 0, 0, 6.29); c.fill(); c.fillStyle = P.perro[1]; c.beginPath(); c.ellipse(x + 6 * s, y - 10 * s, 5 * s, 3 * s, 0.2, 0, 6.29); c.fill(); c.restore();   // panza clara y una mancha
    cel(c, cabeza, [P.perro[1], P.perro[0]], -P.luz * 1.2, -1.6);
    bajo(suave([Q(-24, -10), Q(-21, -4), Q(-24, 2), Q(-28, -3)]), c, P.perro[1]);   // la oreja caída
    c.fillStyle = '#1a1210'; var na = Q(-37.5, -5); c.beginPath(); c.arc(na[0], na[1], 1.4 * s, 0, 6.29); c.fill(); c.strokeStyle = '#1a1210'; c.lineWidth = 1; var oj = Q(-30, -8); c.beginPath(); c.moveTo(oj[0] - 2 * s, oj[1]); c.quadraticCurveTo(oj[0], oj[1] + 1 * s, oj[0] + 2 * s, oj[1]); c.stroke();   // la nariz y el ojo cerrado
  }
  function ruedaCarro(c, cx, cy, r, P) {
    contorno(c, circulo(cx, cy, r), 2.6);
    c.strokeStyle = P.hierro; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, r - 1.5, 0, 6.29); c.stroke();
    c.strokeStyle = P.madera3[1]; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, r - 5, 0, 6.29); c.stroke();
    c.strokeStyle = P.madera3[2]; c.lineWidth = 1; c.beginPath(); for (var k = 0; k < 6; k++) { var a = k / 6 * 6.283 + 0.3; c.moveTo(cx + Math.cos(a) * (r - 7), cy + Math.sin(a) * (r - 7)); c.lineTo(cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3)); } c.stroke();
    for (k = 0; k < 12; k++) { var b = k / 12 * 6.283; c.fillStyle = k % 2 ? P.madera3[1] : P.madera3[0]; c.beginPath(); c.moveTo(cx + Math.cos(b - 0.09) * r * 0.2, cy + Math.sin(b - 0.09) * r * 0.2); c.lineTo(cx + Math.cos(b - 0.035) * (r - 6), cy + Math.sin(b - 0.035) * (r - 6)); c.lineTo(cx + Math.cos(b + 0.035) * (r - 6), cy + Math.sin(b + 0.035) * (r - 6)); c.lineTo(cx + Math.cos(b + 0.09) * r * 0.2, cy + Math.sin(b + 0.09) * r * 0.2); c.fill(); }
    cel(c, circulo(cx, cy, r * 0.24), [P.madera3[2], P.madera3[0]], -P.luz * 1.5, -1.5); c.fillStyle = P.hierro; c.beginPath(); c.arc(cx, cy, r * 0.1, 0, 6.29); c.fill();
  }
  // un carro de tablas (buckboard): delante (a la izquierda) el pescante con respaldo, detrás la carga de sacos
  function carro(c, x, y, P) {
    var rD = 21, rT = 29, xD = x - 58, xT = x + 50;
    c.fillStyle = P.sombraSuelo; c.beginPath(); c.ellipse(x - P.luz * 26, y + 2, 120, 7, 0, 0, 6.29); c.fill();
    // la lanza y el balancín (donde irían los caballos)
    c.lineCap = 'round'; if (TINTA) { c.strokeStyle = TINTA; c.lineWidth = 7; c.beginPath(); c.moveTo(xD, y - rD); c.lineTo(x - 176, y - 12); c.stroke(); }
    c.strokeStyle = P.madera3[1]; c.lineWidth = 4; c.beginPath(); c.moveTo(xD, y - rD); c.lineTo(x - 176, y - 12); c.stroke(); bajo(rect(x - 172, y - 22, 5, 18), c, P.madera3[2]); c.fillStyle = P.hierro; c.fillRect(x - 174, y - 15, 9, 3);
    // las ruedas de detrás (las del otro lado, más oscuras y un poco desplazadas)
    c.globalAlpha = 0.55; ruedaCarro(c, xD + 10, y - rD, rD, P); ruedaCarro(c, xT + 10, y - rT, rT, P); c.globalAlpha = 1;
    // ejes y ballestas
    [[xD, y - rD, y - 46], [xT, y - rT, y - 48]].forEach(function (q) { c.strokeStyle = P.hierro; c.lineWidth = 3; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0], q[2] + 4); c.stroke(); c.lineWidth = 2; c.beginPath(); c.ellipse(q[0], q[2] + 3, 18, 3.4, 0, 0, 6.29); c.stroke(); });
    // la caja: suelo, dos tablas por lado, cantoneras de hierro y teleras
    var caja = rect(x - 90, y - 70, 172, 24); cel(c, caja, [P.madera3[1], P.madera3[0]], -P.luz * 4, -3);
    c.strokeStyle = P.madera3[2]; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 90, y - 58); c.lineTo(x + 82, y - 58); c.stroke();
    c.fillStyle = P.hierro; [x - 90, x + 76].forEach(function (cx) { c.fillRect(cx, y - 70, 6, 24); }); [x - 50, x - 10, x + 30].forEach(function (cx) { c.fillRect(cx, y - 70, 3, 24); });
    bajo(rect(x - 92, y - 47, 176, 4), c, P.madera3[2]);
    // la carga: sacos de grano atados, detrás
    [[x + 6, y - 78, 18], [x + 40, y - 78, 17], [x + 22, y - 94, 15], [x + 62, y - 76, 13]].forEach(function (q) { var sp = suave([[q[0] - q[2], q[1] + 9], [q[0] - q[2] * 0.9, q[1] - 6], [q[0] - 4, q[1] - 12], [q[0], q[1] - 17], [q[0] + 4, q[1] - 12], [q[0] + q[2] * 0.9, q[1] - 6], [q[0] + q[2], q[1] + 9]]); cel(c, sp, [P.saco[1], P.saco[0]], -P.luz * 3, -3); c.strokeStyle = P.madera[2]; c.lineWidth = 1.4; c.beginPath(); c.moveTo(q[0] - 5, q[1] - 11); c.lineTo(q[0] + 5, q[1] - 11); c.stroke(); c.strokeStyle = 'rgba(120,90,60,.4)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(q[0] - q[2] * 0.6, q[1] + 2); c.lineTo(q[0] + q[2] * 0.6, q[1] + 3); c.stroke(); });
    // el pescante: dos soportes de hierro, el asiento con su cojín y el respaldo; el reposapiés y el freno
    c.strokeStyle = P.hierro; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x - 76, y - 70); c.lineTo(x - 72, y - 92); c.moveTo(x - 40, y - 70); c.lineTo(x - 44, y - 92); c.stroke();
    cel(c, rect(x - 82, y - 98, 50, 8), [P.cuero[1], P.cuero[0]], 0, -2); cel(c, rect(x - 38, y - 118, 6, 26), [P.madera3[2], P.madera3[1]], -P.luz, 0);
    bajo(poli([[x - 106, y - 74], [x - 92, y - 74], [x - 86, y - 70], [x - 102, y - 70]]), c, P.madera3[2]);
    c.strokeStyle = P.hierro; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x - 26, y - 70); c.lineTo(x - 20, y - 112); c.stroke(); bajo(rect(x - 24, y - 116, 8, 5), c, P.hierro);
    c.strokeStyle = P.madera[2]; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 80, y - 98); c.quadraticCurveTo(x - 92, y - 140, x - 70, y - 168); c.stroke(); c.strokeStyle = P.cuero[1]; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - 70, y - 168); c.quadraticCurveTo(x - 52, y - 160, x - 58, y - 140); c.stroke();   // el látigo
    // las ruedas de este lado
    ruedaCarro(c, xD, y - rD, rD, P); ruedaCarro(c, xT, y - rT, rT, P);
  }
  function buitre(c, x, y, s, color) { c.fillStyle = color; c.beginPath(); c.moveTo(x - 30 * s, y - 4 * s); c.quadraticCurveTo(x - 14 * s, y - 12 * s, x, y); c.quadraticCurveTo(x + 14 * s, y - 12 * s, x + 30 * s, y - 4 * s); c.quadraticCurveTo(x + 14 * s, y - 6 * s, x, y + 3 * s); c.quadraticCurveTo(x - 14 * s, y - 6 * s, x - 30 * s, y - 4 * s); c.fill(); for (var i = 0; i < 4; i++) { c.fillRect(x - 30 * s - i * 2 * s, y - 4 * s + i * 1.2 * s, 2 * s, 1.2 * s); c.fillRect(x + 28 * s + i * 2 * s, y - 4 * s + i * 1.2 * s, 2 * s, 1.2 * s); } }
  function yuca(c, x, y, s, P) {
    sembrar(Math.round(x));
    c.strokeStyle = P.madera3[2]; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x, y - 24 * s); c.quadraticCurveTo(x + 5 * s, y - 80 * s, x + 3 * s, y - 132 * s); c.stroke();
    for (var i = 0; i < 9; i++) { var fy = y - 96 * s - i * 4.4 * s; [-1, 1].forEach(function (d) { var fx = x + 3 * s + d * (7 - i * 0.5) * s; c.fillStyle = '#e8dcb8'; c.beginPath(); c.ellipse(fx, fy + 1.5 * s, 4 * s, 3.4 * s, 0, 0, 6.29); c.fill(); c.fillStyle = '#fbf5e2'; c.beginPath(); c.ellipse(fx - 0.8 * s, fy, 3 * s, 2.6 * s, 0, 0, 6.29); c.fill(); }); }
    for (i = 0; i < 34; i++) { var a = -Math.PI / 2 + (i / 33 - 0.5) * 3.1, l = (34 + azar() * 22) * s * (1 - Math.abs(i / 33 - 0.5) * 0.6), ex = x + Math.cos(a) * l, ey = y - 6 * s + Math.sin(a) * l, hoja = poli([[x - 3 * s, y - 4 * s], [ex, ey], [x + 3 * s, y - 4 * s]]); contorno(c, hoja, 2); c.fillStyle = i % 3 === 0 ? P.cactus[0] : i % 3 === 1 ? P.cactus[1] : mezcla(P.cactus[1], '#8aa0a0', 0.4); c.fill(hoja); }
  }
  function chumbera2(c, x, y, s, P) {
    // cada pala: centro, radios, giro; las de detrás primero
    var palas = [[-34, -92, 9, 16, -0.7], [33, -98, 9, 15, 0.62], [-20, -62, 12.5, 22, -0.42], [20, -66, 13, 23, 0.38], [0, -27, 15.5, 27, 0.04], [3, -82, 11, 19, 0.06]];
    sembrar(Math.round(x));
    palas.forEach(function (q, i) {
      var cx = x + q[0] * s, cy = y + q[1] * s, rx = q[2] * s, ry = q[3] * s, a = q[4], pp = elipse(cx, cy, rx, ry, a);
      cel(c, pp, [P.cactus[1], P.cactus[0]], -P.luz * 2.6 * s, -2.4 * s);
      // el borde de luz y la vena central, muy suave
      c.save(); c.clip(pp); c.strokeStyle = P.cactus[2]; c.globalAlpha = 0.5; c.lineWidth = 1.6; c.beginPath(); c.ellipse(cx - P.luz * rx * 0.25, cy - ry * 0.1, rx * 0.8, ry * 0.85, a, 3.6, 5.6); c.stroke(); c.globalAlpha = 1;
      // las aréolas: puntos claros en tresbolillo, con dos espinas cada una
      for (var u = -2; u <= 2; u++) for (var v = -3; v <= 3; v++) { var lx = u * rx * 0.36 + (v % 2 ? rx * 0.18 : 0), ly = v * ry * 0.27; if ((lx * lx) / (rx * rx) + (ly * ly) / (ry * ry) > 0.7) continue; var ax = cx + lx * Math.cos(a) - ly * Math.sin(a), ay = cy + lx * Math.sin(a) + ly * Math.cos(a); c.fillStyle = '#efe4b0'; c.beginPath(); c.arc(ax, ay, 1.1 * s, 0, 6.29); c.fill(); c.strokeStyle = 'rgba(250,245,220,.85)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax - 3 * s, ay - 2.4 * s); c.moveTo(ax, ay); c.lineTo(ax + 2.6 * s, ay - 3 * s); c.stroke(); }
      c.restore();
      // las tunas, en el borde de arriba de las palas altas
      if (i < 2 || i === 5) [-0.6, 0, 0.6].forEach(function (t) { var e = -Math.PI / 2 + t, ex = cx + Math.cos(e) * rx * Math.cos(a) - Math.sin(e) * ry * Math.sin(a), ey = cy + Math.cos(e) * rx * Math.sin(a) + Math.sin(e) * ry * Math.cos(a), tun = elipse(ex + Math.sin(a + t) * 3 * s, ey - 4.4 * s, 4 * s, 5.6 * s, a + t * 0.8); cel(c, tun, ['#8a1a3a', '#c8325a'], -P.luz * 1.2 * s, -1.4 * s); c.fillStyle = 'rgba(255,220,230,.7)'; c.beginPath(); c.arc(ex + Math.sin(a + t) * 3 * s - P.luz * 1.2 * s, ey - 6.5 * s, 1.1 * s, 0, 6.29); c.fill(); });
    });
    c.fillStyle = P.sombraSuelo; c.beginPath(); c.ellipse(x - P.luz * 16 * s, y + 2, 30 * s, 5 * s, 0, 0, 6.29); c.fill();
  }
  function cactusBarril(c, x, y, s, P) {
    var p = suave([[x - 17 * s, y], [x - 19 * s, y - 20 * s], [x - 13 * s, y - 38 * s], [x, y - 44 * s], [x + 13 * s, y - 38 * s], [x + 19 * s, y - 20 * s], [x + 17 * s, y]]);
    c.fillStyle = P.sombraSuelo; c.beginPath(); c.ellipse(x - P.luz * 8 * s, y + 1, 22 * s, 4 * s, 0, 0, 6.29); c.fill();
    cel(c, p, [P.cactus[1], P.cactus[0]], -P.luz * 4 * s, -3 * s);
    c.save(); c.clip(p);
    for (var k = -4; k <= 4; k++) {
      var bx = x + k * 4.2 * s, curva = function (t) { return [x + k * 4.6 * s * Math.sin(Math.PI * (0.15 + t * 0.85)), y - t * 44 * s]; };
      c.strokeStyle = 'rgba(20,50,30,.45)'; c.lineWidth = 1.4; c.beginPath(); for (var t = 0; t <= 1.001; t += 0.1) { var q = curva(t); t ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.stroke();
      for (t = 0.12; t < 0.92; t += 0.13) { var a = curva(t); c.fillStyle = '#f2e6c0'; c.beginPath(); c.arc(a[0], a[1], 1 * s, 0, 6.29); c.fill(); c.strokeStyle = '#c86a4a'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(a[0] + 3 * s, a[1] - 2 * s, a[0] + 2.4 * s, a[1] - 4.4 * s); c.moveTo(a[0], a[1]); c.lineTo(a[0] - 3 * s, a[1] - 1.6 * s); c.stroke(); }
    }
    c.restore(); contorno(c, p, 2);
    // la corona de flores (pétalos alrededor de un centro) y un fruto amarillo
    [[-7, -44, '#f2a23a'], [0, -47, '#f6c443'], [7, -44, '#e8743a']].forEach(function (f) { var fx = x + f[0] * s, fy = y + f[1] * s; c.fillStyle = f[2]; for (var i = 0; i < 7; i++) { var a = i / 7 * 6.283; c.beginPath(); c.ellipse(fx + Math.cos(a) * 2.6 * s, fy + Math.sin(a) * 1.8 * s, 2.4 * s, 1.3 * s, a, 0, 6.29); c.fill(); } c.fillStyle = '#fff3c0'; c.beginPath(); c.arc(fx, fy, 1.3 * s, 0, 6.29); c.fill(); });
    c.fillStyle = '#e8c840'; c.beginPath(); c.ellipse(x + 13 * s, y - 37 * s, 2.6 * s, 3.4 * s, 0.4, 0, 6.29); c.fill();
  }
  function calavera(c, x, y, s, P) {
    function Q(px, py) { return [x + px * s, y + py * s]; } function L(a) { return a.map(function (q) { return Q(q[0], q[1]); }); }
    // la arena amontonada alrededor y la sombra
    c.fillStyle = P.sombraSuelo; c.beginPath(); c.ellipse(x - P.luz * 8 * s, y + 22 * s, 40 * s, 7 * s, 0, 0, 6.29); c.fill();
    // los cuernos: cortos, negros, salen de los lados hacia fuera y se curvan hacia arriba
    [-1, 1].forEach(function (d) {
      var cu = pata(L([[d * 18, -36], [d * 32, -42], [d * 42, -50], [d * 45, -63]]), [10 * s, 8 * s, 6 * s, 1.6 * s]);
      cel(c, cu, ['#1e1816', '#4a3e38'], -P.luz * 1.6 * s, -1.6 * s);
      c.strokeStyle = 'rgba(255,240,220,.25)'; c.lineWidth = 0.8; c.beginPath(); for (var k = 0; k < 4; k++) { var a = Q(d * (22 + k * 5), -38 - k * 3); c.moveTo(a[0] - 3 * s, a[1] + 2 * s); c.lineTo(a[0] + 3 * s, a[1] - 2 * s); } c.stroke();
    });
    // el cráneo: frente ancha y abombada, se estrecha hacia el hocico
    var cr = suave(L([[-25, -30], [-21, -44], [-8, -49], [8, -49], [21, -44], [25, -30], [21, -18], [14, -8], [10, 6], [8, 18], [4, 24], [-4, 24], [-8, 18], [-10, 6], [-14, -8], [-21, -18]]));
    cel(c, cr, P.hueso || ['#c6b48e', '#efe5cc', '#fbf6ea'], -P.luz * 1.8 * s, -2.2 * s);
    c.save(); c.clip(cr);
    // las suturas del hueso (zigzag), alguna grieta y manchas de tierra
    c.strokeStyle = 'rgba(120,96,70,.6)'; c.lineWidth = 0.9; c.beginPath(); var z = Q(-18, -38); c.moveTo(z[0], z[1]); for (var k = 1; k <= 12; k++) { var q = Q(-18 + k * 3, -38 + (k % 2 ? -2 : 1.5)); c.lineTo(q[0], q[1]); } var g1 = Q(0, -46), g2 = Q(1, -30); c.moveTo(g1[0], g1[1]); c.lineTo(g2[0], g2[1]);
    var gr = Q(9, -12); c.moveTo(gr[0], gr[1]); c.lineTo(gr[0] + 4 * s, gr[1] + 7 * s); c.lineTo(gr[0] + 2 * s, gr[1] + 13 * s); c.stroke();
    sembrar(5); c.fillStyle = 'rgba(140,100,60,.22)'; for (k = 0; k < 10; k++) { var mq = Q(-18 + azar() * 36, -40 + azar() * 60); c.beginPath(); c.arc(mq[0], mq[1], (0.8 + azar() * 2) * s, 0, 6.29); c.fill(); }
    // la sombra bajo el hueso de la frente
    c.fillStyle = 'rgba(110,80,50,.28)'; var sf = Q(-24, -22); c.fillRect(sf[0], sf[1], 48 * s, 4 * s);
    c.restore();
    // las cuencas de los ojos, a los lados, con su borde de luz arriba
    [-1, 1].forEach(function (d) { var o = Q(d * 13.5, -20); var cu = elipse(o[0], o[1], 6.2 * s, 5 * s, d * 0.45); c.fillStyle = '#3a2a1e'; c.fill(cu); c.save(); c.clip(cu); c.fillStyle = '#1a120c'; c.beginPath(); c.ellipse(o[0] + d * 1.4 * s, o[1] + 1.4 * s, 4.4 * s, 3.4 * s, d * 0.45, 0, 6.29); c.fill(); c.restore(); c.strokeStyle = 'rgba(255,250,235,.7)'; c.lineWidth = 1; c.beginPath(); c.ellipse(o[0], o[1], 6.4 * s, 5.2 * s, d * 0.45, 3.6, 5.8); c.stroke(); });
    // las fosas nasales, largas y estrechas, y el filo del hocico
    [-1, 1].forEach(function (d) { var n = Q(d * 3.6, 12); c.fillStyle = '#3a2a1e'; c.beginPath(); c.ellipse(n[0], n[1], 1.9 * s, 6.4 * s, d * -0.12, 0, 6.29); c.fill(); });
    contorno(c, cr, 2);
    // un par de matas delante, para sentarla en el suelo
    mata(c, x - 30 * s, y + 24 * s, 0.9, P); mata(c, x + 28 * s, y + 26 * s, 0.7, P);
  }
  function farol(c, x, y, P, enc) {
    c.strokeStyle = P.hierro; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 10, y - 18); c.lineTo(x, y - 18); c.lineTo(x, y - 13); c.moveTo(x - 10, y - 22); c.lineTo(x - 10, y - 14); c.stroke();   // el brazo y el gancho
    c.lineWidth = 1; c.beginPath(); c.arc(x, y - 8, 5, Math.PI, 0); c.stroke();   // el asa
    bajo(poli([[x - 5, y - 8], [x + 5, y - 8], [x + 7, y - 5], [x - 7, y - 5]]), c, P.hierro);   // el sombrerete
    var vidrio = poli([[x - 6, y - 5], [x + 6, y - 5], [x + 5, y + 9], [x - 5, y + 9]]); contorno(c, vidrio, 2.4);
    c.fillStyle = enc ? '#ffe6a0' : 'rgba(230,240,240,.85)'; c.fill(vidrio);
    if (enc) { c.fillStyle = '#ff9a3a'; c.beginPath(); c.moveTo(x - 1.6, y + 5); c.quadraticCurveTo(x, y - 3, x + 1.6, y + 5); c.fill(); } else { c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(x - 4, y - 3, 1.6, 10); }
    c.strokeStyle = P.hierro; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x, y + 9); c.stroke();
    bajo(rect(x - 6, y + 9, 12, 3), c, P.hierro);
    if (enc) { c.save(); c.globalCompositeOperation = 'lighter'; var g = c.createRadialGradient(x, y + 3, 1, x, y + 3, 44); g.addColorStop(0, 'rgba(255,200,110,.6)'); g.addColorStop(1, 'rgba(255,200,110,0)'); c.fillStyle = g; c.fillRect(x - 44, y - 41, 88, 88); c.restore(); }
  }
  function cartel(c, x, y, w, h, txt, P) {   // un cartel colgado de dos cadenas
    c.strokeStyle = P.hierro; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + 6, y - 10); c.lineTo(x + 6, y); c.moveTo(x + w - 6, y - 10); c.lineTo(x + w - 6, y); c.stroke();
    bajo(rect(x, y, w, h), c, P.letrero); c.strokeStyle = P.madera[2]; c.lineWidth = 1.6; c.strokeRect(x + 2, y + 2, w - 4, h - 4);
    textoLetrero(c, { t: txt, x: x + w / 2, y: y + h / 2 + 1, s: h * 0.55, max: w - 8 }, P.letra);
  }
  function seBusca(c, x, y, P, k) {
    k = k || 1; c.save(); c.translate(x, y); c.rotate(-0.04); c.scale(k, k);
    var hoja = poli([[-12, -16], [12, -16], [12, 12], [8, 16], [-12, 16]]); bajo(hoja, c, '#f1e3be');
    c.fillStyle = 'rgba(160,120,70,.25)'; c.fillRect(-12, 8, 24, 8);
    c.fillStyle = '#4a2e1e'; c.font = '700 5.4px ' + LETRA; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('WANTED', 0, -12);
    c.fillStyle = '#e6d4a8'; c.fillRect(-7, -8, 14, 13);   // el retrato: sombrero, cara, bigote
    c.fillStyle = '#3a2418'; c.beginPath(); c.ellipse(0, -5.4, 6, 1.2, 0, 0, 6.29); c.fill(); c.fillRect(-3, -8.4, 6, 3); c.fillStyle = '#c8a07a'; c.beginPath(); c.arc(0, -1.6, 3, 0, 6.29); c.fill(); c.fillStyle = '#3a2418'; c.fillRect(-2.4, -0.4, 4.8, 1); c.fillRect(-4, 3, 8, 2);
    c.fillStyle = '#7a2418'; c.font = '700 4.6px ' + LETRA; c.fillText('$ 500', 0, 8.4); c.fillStyle = '#4a2e1e'; c.font = '700 2.8px ' + LETRA; c.fillText('DEAD OR ALIVE', 0, 12.6);
    c.fillStyle = '#d8c69a'; c.beginPath(); c.moveTo(12, 12); c.lineTo(8, 16); c.lineTo(8, 12); c.fill();   // la esquina doblada
    c.fillStyle = P.hierro; [[-10, -14], [10, -14], [-10, 14]].forEach(function (q) { c.fillRect(q[0] - 0.7, q[1] - 0.7, 1.4, 1.4); });
    c.restore();
  }
  function ruedaTren(c, cx, cy, r, color, P, contrapeso, ang) {
    contorno(c, circulo(cx, cy, r), 2.4);
    c.fillStyle = P.hierro; c.beginPath(); c.arc(cx, cy, r, 0, 6.29); c.fill();
    c.fillStyle = color; c.beginPath(); c.arc(cx, cy, r - 2.6, 0, 6.29); c.fill();
    c.fillStyle = '#1a1214'; c.beginPath(); c.arc(cx, cy, r - 5.2, 0, 6.29); c.fill();
    var n = r > 18 ? 14 : 9; c.strokeStyle = color; c.lineWidth = Math.max(1.4, r * 0.09); c.beginPath(); for (var k = 0; k < n; k++) { var a = k / n * 6.283 + (ang || 0); c.moveTo(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2); c.lineTo(cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4)); } c.stroke();
    if (contrapeso) { var a0 = (ang || 0) + Math.PI - 0.75; c.fillStyle = color; c.beginPath(); c.arc(cx, cy, r - 4.6, a0, a0 + 1.5); c.arc(cx, cy, r * 0.42, a0 + 1.5, a0, true); c.fill(); }
    c.fillStyle = color; c.beginPath(); c.arc(cx, cy, r * 0.24, 0, 6.29); c.fill(); c.fillStyle = P.laton; c.beginPath(); c.arc(cx, cy, r * 0.1, 0, 6.29); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.2; c.beginPath(); c.arc(cx, cy, r - 1.3, 3.6, 4.9); c.stroke();
  }
  function trenDetallado(c, x0, P, op) {
    op = op || {}; var y = VIA, NE = P.loco[1], NE2 = P.loco[0], RO = P.rojo, LA = P.laton, ang = 0.7, conRuedas = !op.sinRuedas;
    // ---- los dos coches de viajeros: caja, ventanas en arco, techo con linterna, plataformas y bogies
    [x0 + 302, x0 + 470].forEach(function (vx) {
      [vx + 30, vx + 120].forEach(function (tx) { bajo(rect(tx - 27, y - 27, 54, 7), c, P.hierro); if (conRuedas) { ruedaTren(c, tx - 14, y - 11, 11, P.hierro2, P); ruedaTren(c, tx + 14, y - 11, 11, P.hierro2, P); } c.strokeStyle = P.laton; c.lineWidth = 1.4; c.beginPath(); c.moveTo(tx - 5, y - 22); c.lineTo(tx + 5, y - 22); c.moveTo(tx - 5, y - 19); c.lineTo(tx + 5, y - 19); c.stroke(); });
      bajo(rect(vx + 2, y - 38, 146, 6), c, NE);
      cel(c, rect(vx, y - 88, 150, 52), [P.vagon[1], P.vagon[0]], 0, -6);
      c.fillStyle = P.moldura; c.fillRect(vx, y - 60, 150, 2); c.fillRect(vx, y - 85, 150, 2);
      for (var k = 0; k < 8; k++) { var wx = vx + 9 + k * 17.5, ven = new Path2D(); ven.moveTo(wx, y - 62); ven.lineTo(wx, y - 76); ven.arc(wx + 5, y - 76, 5, Math.PI, 0); ven.lineTo(wx + 10, y - 62); ven.closePath(); c.fillStyle = P.moldura; c.save(); c.translate(0, 0); c.lineWidth = 3; c.strokeStyle = P.moldura; c.stroke(ven); c.restore(); var gv = c.createLinearGradient(wx, y - 80, wx + 10, y - 62); gv.addColorStop(0, P.cristal[0]); gv.addColorStop(1, P.cristal[1]); c.fillStyle = gv; c.fill(ven); }
      c.fillStyle = P.moldura; c.font = '700 8px ' + LETRA; c.textAlign = 'center'; c.textBaseline = 'middle'; if ('letterSpacing' in c) c.letterSpacing = '1px'; c.fillText('CENTRAL PACIFIC', vx + 75, y - 48); if ('letterSpacing' in c) c.letterSpacing = '0px';
      var techo = new Path2D(); techo.moveTo(vx - 8, y - 88); techo.quadraticCurveTo(vx + 75, y - 98, vx + 158, y - 88); techo.lineTo(vx + 158, y - 92); techo.quadraticCurveTo(vx + 75, y - 102, vx - 8, y - 92); techo.closePath(); bajo(techo, c, P.tejado[1]);
      var lin = new Path2D(); lin.moveTo(vx + 16, y - 96); lin.quadraticCurveTo(vx + 8, y - 98, vx + 10, y - 104); lin.lineTo(vx + 140, y - 104); lin.quadraticCurveTo(vx + 142, y - 98, vx + 134, y - 96); lin.closePath(); bajo(lin, c, P.tejado[0]);
      c.fillStyle = 'rgba(255,230,180,.5)'; for (k = 0; k < 10; k++) c.fillRect(vx + 22 + k * 11.5, y - 102, 6, 3);
      [[vx - 12, vx], [vx + 150, vx + 162]].forEach(function (pl) { bajo(rect(pl[0], y - 40, 12, 4), c, NE); c.strokeStyle = P.hierro; c.lineWidth = 1.4; c.beginPath(); c.moveTo(pl[0], y - 60); c.lineTo(pl[1], y - 60); for (var px = pl[0]; px <= pl[1]; px += 4) { c.moveTo(px, y - 60); c.lineTo(px, y - 40); } c.moveTo(pl[0] + 3, y - 36); c.lineTo(pl[0] + 3, y - 26); c.moveTo(pl[1] - 3, y - 36); c.lineTo(pl[1] - 3, y - 26); c.stroke(); });
    });
    c.strokeStyle = P.hierro; c.lineWidth = 3; c.beginPath(); c.moveTo(x0 + 290, y - 34); c.lineTo(x0 + 302, y - 34); c.moveTo(x0 + 452, y - 34); c.lineTo(x0 + 470, y - 34); c.stroke();   // los enganches
    // ---- el ténder: depósito con su letrero y la leña apilada encima (el Central Pacific quemaba leña)
    [x0 + 236, x0 + 272].forEach(function (tx) { bajo(rect(tx - 20, y - 24, 40, 6), c, P.hierro); if (conRuedas) { ruedaTren(c, tx - 10, y - 10, 10, P.hierro2, P); ruedaTren(c, tx + 10, y - 10, 10, P.hierro2, P); } });
    cel(c, rect(x0 + 214, y - 72, 78, 46), [NE, NE2], 0, -5); c.fillStyle = LA; c.fillRect(x0 + 214, y - 72, 78, 3); c.fillRect(x0 + 214, y - 30, 78, 2);
    c.font = '700 9px ' + LETRA; c.textAlign = 'center'; c.fillText('C. P. R. R.', x0 + 253, y - 49);
    var pila = poli([[x0 + 216, y - 72], [x0 + 220, y - 86], [x0 + 236, y - 92], [x0 + 262, y - 90], [x0 + 284, y - 86], [x0 + 290, y - 72]]); cel(c, pila, [P.madera3[2], P.madera3[1]], 0, -3);
    sembrar(19); for (var f = 0; f < 3; f++) for (var cxl = x0 + 222 + f * 4; cxl < x0 + 286; cxl += 9) { var cyl = y - 76 - f * 5 - azar() * 2; if (cyl < y - 88 + Math.abs(cxl - (x0 + 252)) * 0.12) continue; c.fillStyle = P.madera3[0]; c.beginPath(); c.arc(cxl, cyl, 3.6, 0, 6.29); c.fill(); c.strokeStyle = P.madera3[2]; c.lineWidth = 0.8; c.beginPath(); c.arc(cxl, cyl, 1.8, 0, 6.29); c.stroke(); }
    // ---- la locomotora
    bajo(rect(x0 + 36, y - 38, 176, 7), c, NE);                                            // el bastidor
    var quita = poli([[x0 - 2, y - 2], [x0 + 38, y - 2], [x0 + 38, y - 30], [x0 + 30, y - 30]]); bajo(quita, c, RO);   // el quitapiedras
    c.save(); c.clip(quita); c.strokeStyle = mezcla(RO, '#000000', 0.45); c.lineWidth = 1.6; c.beginPath(); for (var qx = x0 - 30; qx < x0 + 40; qx += 6) { c.moveTo(qx, y - 2); c.lineTo(qx + 30, y - 32); } c.stroke(); c.restore();
    bajo(rect(x0 + 26, y - 36, 16, 6), c, RO);
    if (conRuedas) { ruedaTren(c, x0 + 56, y - 12, 12, RO, P, false, ang); ruedaTren(c, x0 + 82, y - 12, 12, RO, P, false, ang); }   // el bogie delantero
    cel(c, rect(x0 + 46, y - 50, 40, 18), [NE, '#585a64'], 0, -4); c.fillStyle = LA; c.fillRect(x0 + 44, y - 51, 4, 20); c.fillRect(x0 + 84, y - 51, 4, 20);   // el cilindro
    cel(c, rect(x0 + 64, y - 74, 94, 38), [P.caldera[1], P.caldera[0]], 0, -10);                                     // la caldera
    c.fillStyle = LA; [x0 + 80, x0 + 112, x0 + 146].forEach(function (bx) { c.fillRect(bx, y - 74, 4, 38); }); c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(x0 + 64, y - 70, 94, 3);
    cel(c, rect(x0 + 36, y - 76, 30, 42), [NE, NE2], 0, -6); bajo(elipse(x0 + 37, y - 55, 4.5, 19), c, '#24242c');   // la caja de humos y su puerta
    c.strokeStyle = LA; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x0 + 40, y - 62); c.lineTo(x0 + 152, y - 62); [x0 + 50, x0 + 96, x0 + 140].forEach(function (hx) { c.moveTo(hx, y - 62); c.lineTo(hx, y - 66); }); c.stroke();   // el pasamanos
    var chim = poli([[x0 + 45, y - 76], [x0 + 45, y - 90], [x0 + 34, y - 112], [x0 + 36, y - 120], [x0 + 66, y - 120], [x0 + 68, y - 112], [x0 + 57, y - 90], [x0 + 57, y - 76]]); cel(c, chim, [NE, NE2], -P.luz * 3, 0);   // la chimenea de globo
    c.save(); c.clip(chim); c.strokeStyle = 'rgba(160,160,170,.45)'; c.lineWidth = 0.8; c.beginPath(); for (var mx = x0 + 30; mx < x0 + 72; mx += 3) { c.moveTo(mx, y - 120); c.lineTo(mx + 6, y - 104); } c.stroke(); c.restore();
    bajo(rect(x0 + 33, y - 123, 36, 4), c, LA);
    cel(c, rect(x0 + 34, y - 96, 20, 20), [NE, RO], -P.luz * 2, -2); bajo(poli([[x0 + 34, y - 96], [x0 + 44, y - 104], [x0 + 54, y - 96]]), c, LA);   // el farol
    c.fillStyle = '#fff4c8'; c.beginPath(); c.arc(x0 + 36, y - 86, 6, 0, 6.29); c.fill(); c.fillStyle = 'rgba(255,240,180,.5)'; c.beginPath(); c.arc(x0 + 36, y - 86, 10, 0, 6.29); c.fill();
    [[x0 + 92, 10, 12], [x0 + 132, 12, 15]].forEach(function (d) { var dm = suave([[d[0] - d[1], y - 73], [d[0] - d[1] * 0.8, y - 73 - d[2] * 0.7], [d[0], y - 73 - d[2]], [d[0] + d[1] * 0.8, y - 73 - d[2] * 0.7], [d[0] + d[1], y - 73]]); cel(c, dm, [mezcla(LA, '#6a4a10', 0.35), LA], -P.luz * 2, -2); });   // arenero y domo de vapor
    c.strokeStyle = P.hierro; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + 108, y - 74); c.lineTo(x0 + 108, y - 88); c.moveTo(x0 + 118, y - 74); c.lineTo(x0 + 118, y - 88); c.moveTo(x0 + 106, y - 88); c.lineTo(x0 + 120, y - 88); c.stroke(); bajo(suave([[x0 + 107, y - 76], [x0 + 109, y - 84], [x0 + 113, y - 86], [x0 + 117, y - 84], [x0 + 119, y - 76]]), c, LA);   // la campana en su horquilla
    bajo(rect(x0 + 150, y - 84, 4, 10), c, LA);   // el silbato
    // la cabina de madera, con su ventana en arco y el techo que vuela
    cel(c, rect(x0 + 154, y - 102, 54, 66), [mezcla(RO, '#000000', 0.25), RO], -P.luz * 4, 0);
    c.strokeStyle = mezcla(RO, '#000000', 0.4); c.lineWidth = 1; c.strokeRect(x0 + 158, y - 64, 46, 22);
    var vc = new Path2D(); vc.moveTo(x0 + 164, y - 70); vc.lineTo(x0 + 164, y - 86); vc.arc(x0 + 181, y - 86, 17, Math.PI, 0); vc.lineTo(x0 + 198, y - 70); vc.closePath(); c.strokeStyle = P.moldura; c.lineWidth = 3; c.stroke(vc); var gc = c.createLinearGradient(x0 + 164, y - 100, x0 + 198, y - 70); gc.addColorStop(0, P.cristal[0]); gc.addColorStop(1, P.cristal[1]); c.fillStyle = gc; c.fill(vc); c.fillStyle = P.moldura; c.fillRect(x0 + 180, y - 102, 2.4, 32);
    var tc = new Path2D(); tc.moveTo(x0 + 146, y - 102); tc.quadraticCurveTo(x0 + 181, y - 116, x0 + 216, y - 102); tc.lineTo(x0 + 216, y - 106); tc.quadraticCurveTo(x0 + 181, y - 120, x0 + 146, y - 106); tc.closePath(); bajo(tc, c, NE);
    c.fillStyle = LA; c.font = '700 10px ' + LETRA; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Nº 4', x0 + 181, y - 53);
    if (conRuedas) ruedasTren(c, x0, P, 0.7 * 27, true);
  }
  // todas las ruedas del tren y las bielas, para un ángulo de giro (recorrido / radio): sirve para el dibujo fijo y para el vivo
  function ruedasTren(c, x0, P, recorrido, soloLoco) {
    var y = VIA, RO = P.rojo, LA = P.laton, R = 27, ang = recorrido / R, d1 = x0 + 114, d2 = x0 + 172;
    if (!soloLoco) {
      ruedaTren(c, x0 + 56, y - 12, 12, RO, P, false, recorrido / 12); ruedaTren(c, x0 + 82, y - 12, 12, RO, P, false, recorrido / 12);
      [x0 + 236, x0 + 272].forEach(function (tx) { ruedaTren(c, tx - 10, y - 10, 10, P.hierro2, P, false, recorrido / 10); ruedaTren(c, tx + 10, y - 10, 10, P.hierro2, P, false, recorrido / 10); });
      [x0 + 302, x0 + 470].forEach(function (vx) { [vx + 30, vx + 120].forEach(function (tx) { ruedaTren(c, tx - 14, y - 11, 11, P.hierro2, P, false, recorrido / 11); ruedaTren(c, tx + 14, y - 11, 11, P.hierro2, P, false, recorrido / 11); }); });
    }
    ruedaTren(c, d1, y - R, R, RO, P, true, ang); ruedaTren(c, d2, y - R, R, RO, P, true, ang);
    var p1 = [d1 + Math.cos(ang) * R * 0.55, y - R + Math.sin(ang) * R * 0.55], p2 = [d2 + Math.cos(ang) * R * 0.55, y - R + Math.sin(ang) * R * 0.55], cx = x0 + 86 + Math.cos(ang) * R * 0.55 * 0.6;
    c.lineCap = 'round'; if (TINTA) { c.strokeStyle = TINTA; c.lineWidth = 8.4; c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.moveTo(cx, y - 41); c.lineTo(p2[0], p2[1]); c.stroke(); }
    c.strokeStyle = '#9a9aa2'; c.lineWidth = 5; c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.stroke(); c.strokeStyle = '#b8b8c0'; c.lineWidth = 4.4; c.beginPath(); c.moveTo(cx, y - 41); c.lineTo(p2[0], p2[1]); c.stroke();
    [p1, p2].forEach(function (q) { c.fillStyle = LA; c.beginPath(); c.arc(q[0], q[1], 3, 0, 6.29); c.fill(); }); bajo(rect(cx - 6, y - 45, 12, 8), c, '#7a7a84');   // la cruceta, que va y viene
  }
  function bomba(c, x, y, P) {
    var cuerpo = suave([[x - 6, y], [x - 7, y - 30], [x - 5, y - 44], [x + 5, y - 44], [x + 7, y - 30], [x + 6, y]]); cel(c, cuerpo, [P.hierro, '#5a5660'], -P.luz * 2, 0);
    bajo(rect(x - 9, y - 3, 18, 4), c, P.hierro); bajo(rect(x - 8, y - 47, 16, 4), c, P.hierro);
    c.lineCap = 'round'; if (TINTA) { c.strokeStyle = TINTA; c.lineWidth = 6.4; c.beginPath(); c.moveTo(x - 6, y - 32); c.lineTo(x - 22, y - 30); c.moveTo(x, y - 46); c.lineTo(x + 22, y - 62); c.stroke(); }
    c.strokeStyle = P.hierro; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 6, y - 32); c.lineTo(x - 22, y - 30); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(x, y - 46); c.lineTo(x + 22, y - 62); c.stroke();   // el caño y la palanca
    c.fillStyle = P.agua; c.fillRect(x - 23, y - 28, 2, 6);   // un hilo de agua
  }
  function cubo(c, x, y, P) { var p = poli([[x - 8, y], [x - 10, y - 16], [x + 10, y - 16], [x + 8, y]]); cel(c, p, [P.madera3[1], P.madera3[0]], -P.luz * 2, 0); c.strokeStyle = P.hierro; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 9, y - 12); c.lineTo(x + 9, y - 12); c.moveTo(x - 8, y - 3); c.lineTo(x + 8, y - 3); c.stroke(); c.lineWidth = 1; c.beginPath(); c.arc(x, y - 16, 9, Math.PI, 0); c.stroke(); }
  function cuervo(c, x, y, s) { c.fillStyle = '#16141a'; c.beginPath(); c.ellipse(x, y - 6 * s, 6 * s, 4 * s, -0.2, 0, 6.29); c.fill(); c.beginPath(); c.arc(x - 5 * s, y - 10 * s, 3 * s, 0, 6.29); c.fill(); c.beginPath(); c.moveTo(x - 7 * s, y - 11 * s); c.lineTo(x - 12 * s, y - 9.5 * s); c.lineTo(x - 7 * s, y - 9 * s); c.fill(); c.beginPath(); c.moveTo(x + 4 * s, y - 6 * s); c.lineTo(x + 12 * s, y - 2 * s); c.lineTo(x + 5 * s, y - 3 * s); c.fill(); c.strokeStyle = '#16141a'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 1, y - 2 * s); c.lineTo(x - 1, y); c.moveTo(x + 2, y - 2 * s); c.lineTo(x + 2, y); c.stroke(); c.fillStyle = '#e8e0c0'; c.fillRect(x - 6 * s, y - 11 * s, 1, 1); }
  // una serpiente de cascabel enroscada, con la cabeza levantada y el cascabel arriba
  function serpiente(c, x, y, s, P) {
    c.fillStyle = P.sombraSuelo; c.beginPath(); c.ellipse(x - P.luz * 4 * s, y + 2 * s, 24 * s, 5 * s, 0, 0, 6.29); c.fill();
    c.lineCap = 'round';
    [[18, 6, 0], [13, 4.4, -5], [8, 3, -9]].forEach(function (q) {
      var e = new Path2D(); e.ellipse(x, y + q[2] * s, q[0] * s, q[1] * s, 0, 0, 6.29);
      if (TINTA) { c.strokeStyle = TINTA; c.lineWidth = 8.6 * s; c.stroke(e); }
      c.strokeStyle = P.serpiente[1]; c.lineWidth = 6.4 * s; c.stroke(e);
      c.setLineDash([5 * s, 4 * s]); c.strokeStyle = P.serpiente[2]; c.lineWidth = 4 * s; c.stroke(e); c.setLineDash([]);
      c.save(); c.translate(0, -1.6 * s); c.strokeStyle = 'rgba(255,240,200,.3)'; c.lineWidth = 1.6 * s; c.stroke(e); c.restore();
    });
    var cu = new Path2D(); cu.moveTo(x - 4 * s, y - 10 * s); cu.bezierCurveTo(x - 6 * s, y - 22 * s, x + 6 * s, y - 22 * s, x + 2 * s, y - 30 * s);
    if (TINTA) { c.strokeStyle = TINTA; c.lineWidth = 7 * s; c.stroke(cu); } c.strokeStyle = P.serpiente[1]; c.lineWidth = 5 * s; c.stroke(cu);
    var cab = poli([[x + 2 * s, y - 27 * s], [x - 7 * s, y - 32 * s], [x - 3 * s, y - 36 * s], [x + 6 * s, y - 33 * s]]); cel(c, cab, [P.serpiente[1], P.serpiente[0]], 0, -1);
    c.fillStyle = '#e8c040'; c.beginPath(); c.arc(x - 2 * s, y - 33 * s, 1 * s, 0, 6.29); c.fill();
    c.strokeStyle = '#c8203a'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - 7 * s, y - 32 * s); c.lineTo(x - 11 * s, y - 31 * s); c.lineTo(x - 13 * s, y - 33 * s); c.moveTo(x - 11 * s, y - 31 * s); c.lineTo(x - 13 * s, y - 30 * s); c.stroke();   // la lengua
    for (var k = 0; k < 5; k++) { c.fillStyle = k % 2 ? '#d8c08a' : '#b89a62'; c.beginPath(); c.ellipse(x + 9 * s, y - 12 * s - k * 2.6 * s, 2.2 * s, 1.5 * s, 0, 0, 6.29); c.fill(); }   // el cascabel
  }
  function lagarto(c, x, y, s, P) {
    c.lineCap = 'round'; var cu = new Path2D(); cu.moveTo(x - 14 * s, y); cu.quadraticCurveTo(x, y - 3 * s, x + 10 * s, y - 1 * s); cu.quadraticCurveTo(x + 22 * s, y + 2 * s, x + 30 * s, y - 3 * s);
    c.strokeStyle = P.lagarto[1]; c.lineWidth = 2.4 * s; c.beginPath(); [[-6, 0, -10, 4], [-4, -1, -8, -5], [6, -1, 10, 4], [8, -1, 12, -4]].forEach(function (q) { c.moveTo(x + q[0] * s, y + q[1] * s); c.lineTo(x + q[2] * s, y + q[3] * s); }); c.stroke();
    c.strokeStyle = P.lagarto[1]; c.lineWidth = 4.4 * s; c.stroke(cu); c.strokeStyle = P.lagarto[0]; c.lineWidth = 2 * s; c.save(); c.translate(0, -1 * s); c.stroke(cu); c.restore();
    c.fillStyle = P.lagarto[1]; c.beginPath(); c.ellipse(x - 15 * s, y - 0.5 * s, 4 * s, 2.4 * s, -0.1, 0, 6.29); c.fill(); c.fillStyle = '#111'; c.fillRect(x - 17 * s, y - 1.6 * s, 1.2, 1.2);
  }
  function abrevadero(c, x, y, P) {
    var p = poli([[x - 44, y], [x - 48, y - 22], [x + 48, y - 22], [x + 44, y]]); c.fillStyle = P.sombraSuelo; c.beginPath(); c.ellipse(x - P.luz * 10, y + 2, 54, 5, 0, 0, 6.29); c.fill();
    cel(c, p, [P.madera[1], P.madera[0]], -P.luz * 4, 0);
    c.strokeStyle = P.madera[2]; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 46, y - 11); c.lineTo(x + 46, y - 11); c.stroke();
    c.fillStyle = P.hierro; [x - 40, x + 36].forEach(function (bx) { c.fillRect(bx, y - 22, 4, 22); });
    c.fillStyle = P.agua; c.fillRect(x - 46, y - 23, 92, 5); c.fillStyle = 'rgba(255,255,255,.65)'; c.fillRect(x - 32, y - 22, 24, 1.4); c.fillRect(x + 6, y - 21, 12, 1.2);
  }
  function barril(c, x, y, P) {
    var p = new Path2D(); p.moveTo(x - 14, y); p.quadraticCurveTo(x - 19, y - 21, x - 14, y - 42); p.lineTo(x + 14, y - 42); p.quadraticCurveTo(x + 19, y - 21, x + 14, y); p.closePath();
    c.fillStyle = P.sombraSuelo; c.beginPath(); c.ellipse(x - P.luz * 8, y + 1, 20, 4, 0, 0, 6.29); c.fill();
    cel(c, p, [P.madera[1], P.madera[0]], -P.luz * 5, 0);
    c.save(); c.clip(p); c.strokeStyle = P.madera[2]; c.lineWidth = 1; c.beginPath(); for (var k = -3; k <= 3; k++) { c.moveTo(x + k * 4, y); c.quadraticCurveTo(x + k * 5.4, y - 21, x + k * 4, y - 42); } c.stroke(); c.restore();
    [y - 7, y - 12, y - 30, y - 35].forEach(function (yy) { var hw = 14 + Math.sin(Math.PI * (y - yy) / 42) * 4.6; c.strokeStyle = P.hierro; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x - hw, yy); c.quadraticCurveTo(x, yy + 2, x + hw, yy); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - P.luz * -hw * 0.2 - 6, yy - 0.8); c.lineTo(x - P.luz * -hw * 0.2 + 2, yy - 0.6); c.stroke(); });
    var tapa = elipse(x, y - 42, 14, 4); bajo(tapa, c, P.madera[1]); c.save(); c.clip(tapa); c.strokeStyle = P.madera[2]; c.lineWidth = 0.8; c.beginPath(); for (k = -2; k <= 2; k++) { c.moveTo(x + k * 5, y - 46); c.lineTo(x + k * 5, y - 38); } c.stroke(); c.restore();
  }
  function caja(c, x, y, s, P, txt) {
    var p = rect(x, y - s, s, s); cel(c, p, [P.madera3[1], P.madera3[0]], -P.luz * 4, -3);
    c.strokeStyle = P.madera3[2]; c.lineWidth = 1; c.beginPath(); for (var k = 1; k < 3; k++) { c.moveTo(x, y - s + k * s / 3); c.lineTo(x + s, y - s + k * s / 3); } c.stroke();
    c.lineWidth = 2; c.strokeRect(x + 1, y - s + 1, s - 2, s - 2);
    if (txt) { c.save(); c.fillStyle = 'rgba(60,30,20,.7)'; c.font = '700 ' + Math.round(s * 0.2) + 'px ' + LETRA; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, x + s / 2, y - s / 2); c.restore(); }
    c.fillStyle = P.hierro; [[2, 2], [s - 4, 2], [2, s - 4], [s - 4, s - 4]].forEach(function (q) { c.fillRect(x + q[0], y - s + q[1], 1.6, 1.6); });
  }
  function casa(c, o, P) {
    var e = o.e, g = o.g, x0 = e.x, x1 = e.x + e.w, M = P[e.tono] || P.madera;
    // la pared lateral (se ve un poco, del lado contrario a la luz) y el tejado de dos aguas de detrás
    var lado = P.luz < 0 ? x1 : x0, ancho = 16 * (P.luz < 0 ? 1 : -1);
    var pared = poli([[lado, e.top + 34], [lado + ancho, e.top + 40], [lado + ancho, BASE - 4], [lado, BASE]]); contorno(c, pared); c.fillStyle = M[1]; c.fill(pared); contorno(c, g.tejado);
    if (e.n !== 'BANK') { var cx = x0 + e.w * (e.n === 'HOTEL' ? 0.75 : 0.3); bajo(rect(cx - 4, e.top - 30, 8, 40), c, P.hierro); bajo(rect(cx - 7, e.top - 34, 14, 5), c, P.hierro); }
    c.fillStyle = P.tejado[1]; c.fill(g.tejado); c.save(); c.clip(g.tejado); c.fillStyle = P.tejado[0]; c.fillRect(P.luz < 0 ? x0 : x0 + e.w / 2, e.top - 20, e.w / 2, 60); c.restore();
    // la fachada: tablones verticales de dos tonos, con juntas
    contorno(c, g.fachada); c.fillStyle = M[0]; c.fill(g.fachada);
    c.save(); c.clip(g.fachada);
    sembrar(e.x); for (var x = x0; x < x1; x += 9) { c.fillStyle = azar() < 0.5 ? M[0] : mezcla(M[0], M[1], 0.25); c.fillRect(x, e.top - 30, 9, BASE - e.top + 30); c.fillStyle = M[2]; c.fillRect(x, e.top - 30, 1.2, BASE - e.top + 30); }
    if (e.tono === 'piedra') { c.fillStyle = M[0]; c.fillRect(x0, e.top - 30, e.w, BASE); c.strokeStyle = M[2]; c.lineWidth = 1.2; c.stroke(g.tablas); }
    // la sombra que el sol deja en la fachada (bajo la cornisa y del lado contrario)
    c.fillStyle = 'rgba(60,20,20,.22)'; c.fillRect(x0, e.top + 10, e.w, 8); c.fillRect(P.luz < 0 ? x1 - 12 : x0, e.top, 12, BASE);
    c.restore();
    // esquineras y cornisa en crema, con dentículos
    c.fillStyle = P.moldura; c.fillRect(x0, e.top + 6, 6, BASE - e.top - 6); c.fillRect(x1 - 6, e.top + 6, 6, BASE - e.top - 6); contorno(c, g.cornisa, 2.4); c.fill(g.cornisa);
    c.fillStyle = mezcla(P.moldura, '#7a5a40', 0.35); var cy = e.top + (e.n === 'BANK' ? 10 : e.n === 'SALOON' ? 14 : 0) + 5; for (x = x0 + 2; x < x1 - 4; x += 8) c.fillRect(x, cy, 4, 4);
    // el letrero
    c.fillStyle = P.letrero; c.fill(g.letrero); c.strokeStyle = M[2]; c.lineWidth = 2.4; c.stroke(g.letrero); textoLetrero(c, g.texto, P.letra);
    // ventanas: marco, cristal con reflejo, cruceta y alféizar
    g.ventanas.concat(g.escaparates).forEach(function (q, i) { ventana(c, q, P); });
    // la puerta (de dos hojas con cuarterones) o las batientes del saloon
    contorno(c, g.puerta, 2); c.fillStyle = P.puerta; c.fill(g.puerta); c.strokeStyle = P.moldura; c.lineWidth = 3; c.stroke(g.puerta);
    if (g.batientes) { c.fillStyle = M[0]; c.fill(g.batientes); c.strokeStyle = M[2]; c.lineWidth = 1.4; c.stroke(g.batientes); }
    if (g.columnas) g.columnas.forEach(function (q) { cel(c, q, [mezcla(P.moldura, '#806040', 0.3), P.moldura], -P.luz * 3, 0); });
    // clavos en cada tablón, algún nudo y tablas cambiadas de tono (la madera vieja)
    c.save(); c.clip(g.fachada); sembrar(e.x + 3);
    if (e.tono !== 'piedra') { c.fillStyle = M[2]; for (var nx = x0 + 4; nx < x1; nx += 9) for (var ny = e.top + 14; ny < BASE; ny += 34) c.fillRect(nx, ny, 1.6, 1.6);
      for (var kn = 0; kn < 6; kn++) { c.strokeStyle = M[2]; c.lineWidth = 1; c.beginPath(); c.ellipse(x0 + azar() * e.w, e.top + 40 + azar() * (BASE - e.top - 60), 2.4, 4, 0, 0, 6.29); c.stroke(); }
      for (kn = 0; kn < 3; kn++) { c.fillStyle = 'rgba(255,240,220,.16)'; c.fillRect(x0 + Math.floor(azar() * e.w / 9) * 9, e.top + azar() * 60, 9, 40 + azar() * 80); } }
    c.restore();
    // cortinas en las ventanas (rojas en el saloon, de encaje en el hotel) y contraventanas en el hotel
    g.ventanas.forEach(function (q) { var b = rectDe(q); c.fillStyle = e.n === 'SALOON' ? '#b0283a' : '#f6efe0'; c.fillRect(b.x, b.y, b.w * 0.24, b.h); c.fillRect(b.x + b.w * 0.76, b.y, b.w * 0.24, b.h);
      if (e.n === 'HOTEL') { [b.x - 13, b.x + b.w + 3].forEach(function (sx) { bajo(rect(sx, b.y - 2, 10, b.h + 4), c, P.chapa[1]); c.strokeStyle = P.chapa[0]; c.lineWidth = 1; c.beginPath(); for (var yy = b.y; yy < b.y + b.h; yy += 4) { c.moveTo(sx + 1, yy); c.lineTo(sx + 9, yy + 2); } c.stroke(); }); } });
    // rejas en el banco
    if (e.n === 'BANK') g.escaparates.forEach(function (q) { var b = rectDe(q); c.strokeStyle = P.hierro; c.lineWidth = 2; c.beginPath(); for (var bx = b.x + 5; bx < b.x + b.w; bx += 7) { c.moveTo(bx, b.y); c.lineTo(bx, b.y + b.h); } c.stroke(); });
    // el porche: tejadillo de chapa ondulada (o de madera), postes, barandilla y la acera de tablones
    var pr = e.n === 'HOTEL' || e.n === 'GENERAL STORE' ? P.chapa : P.tejado;
    contorno(c, g.porche); c.fillStyle = pr[1]; c.fill(g.porche); c.save(); c.clip(g.porche); c.fillStyle = pr[0]; for (x = x0 - 20; x < x1 + 20; x += 7) c.fillRect(x, BASE - 100, 3, 30); c.restore();
    c.fillStyle = 'rgba(40,15,10,.35)'; c.fillRect(x0 - 10, BASE - 78, e.w + 20, 10);   // la sombra bajo el tejadillo
    g.postes.forEach(function (q) { cel(c, q, [M[1], P.moldura], -P.luz * 2, 0); });
    c.strokeStyle = M[1]; c.lineWidth = 3; c.beginPath(); c.moveTo(x0 - 10, BASE - 34); c.lineTo(x0 + e.w * 0.3, BASE - 34); c.moveTo(x1 - e.w * 0.3, BASE - 34); c.lineTo(x1 + 10, BASE - 34); c.stroke();
    c.lineWidth = 2; c.beginPath(); for (x = x0 - 6; x < x0 + e.w * 0.3; x += 8) { c.moveTo(x, BASE - 34); c.lineTo(x, BASE); } for (x = x1 - e.w * 0.3 + 4; x < x1 + 10; x += 8) { c.moveTo(x, BASE - 34); c.lineTo(x, BASE); } c.stroke();
    if (e.n === 'HOTEL' || e.balcon) { var by = BASE - 92; c.strokeStyle = P.moldura; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x0 - 6, by - 22); c.lineTo(x1 + 6, by - 22); c.stroke(); c.lineWidth = 1.6; c.beginPath(); for (var bx = x0 - 4; bx < x1 + 6; bx += 7) { c.moveTo(bx, by - 22); c.lineTo(bx, by); } c.stroke(); }
    c.fillStyle = P.madera3[1]; c.fill(g.acera); c.fillStyle = P.madera3[0]; c.fillRect(x0 - 16, BASE, e.w + 32, 3); c.strokeStyle = P.madera3[2]; c.lineWidth = 1; c.beginPath(); for (x = x0 - 16; x < x1 + 16; x += 22) { c.moveTo(x, BASE + 3); c.lineTo(x, BASE + 9); } c.stroke();
  }
  function ventana(c, q, P) {
    var b = rectDe(q); if (TINTA) { c.strokeStyle = TINTA; c.lineWidth = 1.6; c.strokeRect(b.x - 3.5, b.y - 3.5, b.w + 7, b.h + 7); } c.fillStyle = P.moldura; c.fillRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
    var g = c.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h); g.addColorStop(0, P.cristal[0]); g.addColorStop(1, P.cristal[1]); c.fillStyle = g; c.fillRect(b.x, b.y, b.w, b.h);
    c.save(); c.beginPath(); c.rect(b.x, b.y, b.w, b.h); c.clip(); c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.moveTo(b.x + b.w * 0.2, b.y + b.h); c.lineTo(b.x + b.w * 0.55, b.y); c.lineTo(b.x + b.w * 0.75, b.y); c.lineTo(b.x + b.w * 0.4, b.y + b.h); c.fill(); c.restore();
    c.fillStyle = P.moldura; c.fillRect(b.x + b.w / 2 - 1.2, b.y, 2.4, b.h); c.fillRect(b.x, b.y + b.h / 2 - 1.2, b.w, 2.4); c.fillRect(b.x - 6, b.y + b.h + 3, b.w + 12, 4);
  }

  // el jinete a lo cómic: caballo con la crin y la cola en mechones, filo de luz del lado del sol
  function jineteCel(c, J, P, op) {
    op = op || {};
    var filo = function (path, col, w) { c.save(); c.translate(-P.luz * 2.6, -1); c.strokeStyle = col; c.lineWidth = w || 3; c.stroke(path); c.restore(); };
    contorno(c, J.patasLejos); contorno(c, J.caballo); if (!op.sinJinete) { contorno(c, J.jinete); contorno(c, J.sombrero); }
    filo(J.caballo, P.filoCaballo, 3.2); if (!op.sinJinete) { filo(J.jinete, P.filoCaballo, 3); filo(J.sombrero, P.filoCaballo, 2.4); }
    bajo(J.patasLejos, c, P.caballo[2]);
    cel(c, J.caballo, [P.caballo[1], P.caballo[0]], -P.luz * 4, -5);
    // los músculos: cuatro trazos de luz (pecho, espalda, anca, cuello)
    c.save(); c.clip(J.caballo); c.strokeStyle = P.caballo[3]; c.lineWidth = 2; c.globalAlpha = 0.55; c.beginPath();
    var X = J.x, Y = J.y, s = J.s; function m(px, py) { return [X - px * s, Y - py * s]; }
    [[[0.36, 0.66], [0.3, 0.76], [0.26, 0.86]], [[-0.28, 0.66], [-0.36, 0.78], [-0.3, 0.88]], [[0.5, 0.92], [0.42, 0.84], [0.38, 0.72]], [[-0.04, 0.6], [0.1, 0.6], [0.2, 0.64]]].forEach(function (l) { var a = m(l[0][0], l[0][1]), b = m(l[1][0], l[1][1]), d = m(l[2][0], l[2][1]); c.moveTo(a[0], a[1]); c.quadraticCurveTo(b[0], b[1], d[0], d[1]); });
    c.stroke(); c.restore(); c.globalAlpha = 1;
    // las marcas blancas: cordón en la cara y calcetines
    if (P2m(P, op).marcas) { c.save(); c.clip(une([J.caballo, J.patasLejos])); c.fillStyle = '#f4efe4'; var cf = m(0.72, 1.0), cf2 = m(0.82, 0.88); c.beginPath(); c.moveTo(cf[0] - 2, cf[1] - 6); c.lineTo(cf[0] + 3, cf[1] - 6); c.lineTo(cf2[0] + 2, cf2[1]); c.lineTo(cf2[0] - 4, cf2[1]); c.fill(); var cal = m(0.6, 0.12); c.fillRect(cal[0] - 0.2 * s, Y - 0.12 * s, 0.32 * s, 0.1 * s); c.restore(); }
    // la crin y la cola en mechones
    c.fillStyle = P.crin; c.fill(J.crin); c.strokeStyle = P.crin; c.lineWidth = 1.6;
    sembrar(12); c.beginPath(); for (var i = 0; i < 14; i++) { var t = i / 13, a2 = m(0.58 - t * 0.32, 1.11 - t * 0.17), b2 = m(0.56 - t * 0.3 + 0.04, 0.96 - t * 0.12 - azar() * 0.05); c.moveTo(a2[0], a2[1]); c.quadraticCurveTo(a2[0] + 6, (a2[1] + b2[1]) / 2, b2[0], b2[1]); } c.stroke();
    c.beginPath(); for (i = 0; i < 16; i++) { var o = m(-0.45 - azar() * 0.03, 0.86), f = m(-0.52 - azar() * 0.1, 0.34 + azar() * 0.14); c.moveTo(o[0], o[1]); c.bezierCurveTo(o[0] + 0.1 * s, o[1] + 0.02 * s, f[0] + 0.02 * s, (o[1] + f[1]) / 2, f[0], f[1]); } c.lineWidth = 2.2; c.stroke();
    // el aparejo: manta a rayas, silla, estribo y el lazo enrollado
    if (!op.sinSilla) {
    cel(c, J.manta, [P.manta[1], P.manta[0]], 0, -3); c.save(); c.clip(J.manta); c.fillStyle = P.manta[2]; var mb = m(0.16, 0.86); for (i = 0; i < 4; i++) c.fillRect(mb[0] - 2, mb[1] - 6 + i * 7, 0.34 * s + 4, 2.2); c.restore();
    cel(c, J.silla, [P.cuero[1], P.cuero[0]], 0, -3); var pomo = m(0.13, 1.0); bajo(suave([[pomo[0] - 3, pomo[1] + 4], [pomo[0] - 3, pomo[1] - 2], [pomo[0] - 5, pomo[1] - 6], [pomo[0] + 5, pomo[1] - 6], [pomo[0] + 3, pomo[1] - 2], [pomo[0] + 3, pomo[1] + 4]]), c, P.cuero[1]);
    var lz = m(0.12, 1.0); c.strokeStyle = P.lazo; c.lineWidth = 2; c.beginPath(); c.ellipse(lz[0] + 4, lz[1] + 10, 9, 12, 0.3, 0, 6.29); c.ellipse(lz[0] + 6, lz[1] + 11, 7, 10, 0.3, 0, 6.29); c.stroke();
    }
    if (!op.sinJinete) {
    // el jinete
    cel(c, J.jinete, [P.ropa[1], P.ropa[0]], -P.luz * 3, -3);
    var pierna = m(0.06, 0.78); c.fillStyle = P.pantalon; c.save(); c.clip(J.jinete); c.fillRect(pierna[0] - 20, pierna[1] - 0.2 * s, 40, 0.24 * s); c.restore();
    c.save(); c.clip(J.jinete); var ch = m(0.0, 1.0); c.fillStyle = P.chaleco; c.fillRect(ch[0] - 0.09 * s, ch[1] - 0.18 * s, 0.18 * s, 0.17 * s); c.fillStyle = P.cuero[1]; c.fillRect(ch[0] - 0.1 * s, ch[1] + 0.02 * s, 0.2 * s, 0.03 * s); c.restore();
    var fd = m(-0.05, 0.98); bajo(suave([[fd[0] - 4, fd[1]], [fd[0] + 8, fd[1]], [fd[0] + 7, fd[1] + 20], [fd[0] - 3, fd[1] + 20]]), c, P.cuero[1]); c.fillStyle = P.hierro; c.fillRect(fd[0], fd[1] - 5, 3, 7);   // la cartuchera y la culata
    cel(c, J.bota, [P.cuero[1], P.cuero[0]], 0, -2);
    var esp = m(-0.02, 0.58); c.strokeStyle = P.laton; c.lineWidth = 1.2; c.beginPath(); c.moveTo(esp[0] - 4, esp[1]); c.lineTo(esp[0] + 2, esp[1]); for (var e2 = 0; e2 < 6; e2++) { var ea = e2 / 6 * 6.283; c.moveTo(esp[0] + 5, esp[1]); c.lineTo(esp[0] + 5 + Math.cos(ea) * 3.4, esp[1] + Math.sin(ea) * 3.4); } c.stroke();   // la espuela var es = m(0.14, 0.56); c.strokeStyle = P.hierro; c.lineWidth = 2.4; c.beginPath(); c.moveTo(es[0] - 8, es[1] + 2); c.lineTo(es[0] + 8, es[1] + 2); c.stroke();
    cel(c, J.cabeza, [P.piel[1], P.piel[0]], -P.luz * 2, -2); bajo(J.panuelo, c, P.panuelo);
    cel(c, J.sombrero, [P.sombrero[1], P.sombrero[0]], -P.luz * 2, -2); c.fillStyle = P.sombrero[2]; c.fill(J.cintaSombrero); c.save(); c.clip(J.cabeza); c.fillStyle = 'rgba(40,20,10,.35)'; c.fillRect(J.cabezaC[0] - 0.08 * s, J.cabezaC[1] - 0.06 * s, 0.16 * s, 0.035 * s); c.restore();   // la cinta y la sombra del ala en la cara
    }
    // la brida y las riendas, y el ojo
    if (!op.sinJinete) { c.strokeStyle = P.cuero[1]; c.lineWidth = 1.6; c.stroke(J.riendas); } var b3 = m(0.66, 1.06), b4 = m(0.78, 0.9); c.beginPath(); c.moveTo(b3[0], b3[1]); c.lineTo(b4[0], b4[1]); c.moveTo(b3[0] - 2, b3[1] + 10); c.lineTo(b3[0] + 10, b3[1] + 10); c.stroke();
    c.fillStyle = '#0a0a0a'; c.beginPath(); c.arc(J.ojo[0], J.ojo[1], 2.2, 0, 6.29); c.fill();
    c.fillStyle = P.sombraSuelo; c.beginPath(); c.ellipse(X + P.luz * -40, Y + 3, 0.62 * s, 8, 0, 0, 6.29); c.fill();
  }

  // las mesas con sus agujas guardando el rectángulo de cada una (para las caras)
  function conAguja(m, ax0, acima, apie) { return { m: m, a: aguja(ax0, ax0 + 17, acima, apie), ax0: ax0, ax1: ax0 + 17, acima: acima, apie: apie }; }
  var MESAS_C = [
    { m: mesa(700, 770, 404, 494, 56, 3), lejos: true },                        // Merrick Butte, al fondo
    { m: mesa(-160, 236, 338, 478, 120, 31), grada: true },                      // la gran meseta de la izquierda, que sigue fuera del cuadro
    { m: mesa(1338, 1780, 350, 486, 112, 33), grada: true },                     // y la de la derecha
    conAguja(mesa(468, 566, 300, 462, 92, 5), 588, 348, 516),                    // West Mitten (el pulgar a su derecha)
    conAguja(mesa(1040, 1138, 318, 466, 92, 9), 1006, 364, 510)                  // East Mitten (el pulgar a su izquierda)
  ];
  var LEJANAS = poli([[0, HOR], [0, 512], [180, 510], [196, 494], [330, 492], [346, 508], [620, 512], [634, 498], [760, 496], [774, 510], [1020, 512], [1034, 490], [1210, 488], [1226, 508], [1460, 510], [1474, 496], [1600, 495], [1600, HOR]]);
  var SIERRA = sierra(); TREN.humo.forEach(function (b, i) { b.x -= 17 * (1 - i / TREN.humo.length); b.y -= 4; });
  var ENEBROS = [[930, 598, 0.55], [990, 612, 0.7], [1160, 600, 0.6], [1240, 618, 0.8], [1290, 596, 0.5], [1440, 606, 0.65], [1520, 620, 0.85], [1580, 600, 0.6], [880, 584, 0.45], [1110, 586, 0.45], [1380, 588, 0.5], [1610, 640, 0.9]];
  function P2m(P, op) { return { marcas: op.marcas !== false && !op.sinJinete || op.marcas }; }
  function hacerJ(x, y, s) { var j = jinete(x, y, s); j.x = x; j.y = y; j.s = s; return j; }
  var JIN_C = hacerJ(1090, 846, 150), ATADO = hacerJ(318, 772, 104), SUELTO = hacerJ(1330, 702, 84), SUELTO2 = hacerJ(1470, 694, 76);
  function caballoA(c, J, P, op, mira) { c.save(); if (mira > 0) { c.translate(2 * J.x, 0); c.scale(-1, 1); } var P2 = mira > 0 ? Object.assign({}, P, { luz: -P.luz }) : P; jineteCel(c, J, P2, op); c.restore(); }

  var BASEC = {
    moldura: '#f6ecd6', letrero: '#f7eedb', letra: '#7a2418', puerta: '#4a2420', hierro: '#2e2a2c', cable: 'rgba(50,40,40,.65)', balasto: '#9a7a5a', traviesa: '#6a4a32', laton: '#f0c25a', rojo: '#c8342a', locoRueda: '#c8342a', lazo: '#d8b878', rodadora: '#a48452'
  };
  function con(o) { var r = {}; for (var k in BASEC) r[k] = BASEC[k]; for (k in o) r[k] = o[k]; return r; }
  var DIA = con({
    serpiente: ['#d8b07a', '#a8804e', '#6a4a2e'], lagarto: ['#c8b07a', '#7a6a48'],
    caldera: ['#3a6a9a', '#21456e'], hierro2: '#3a3438', lejanas: ['#d8b4a4', '#c49a8a'],
    vestido: ['#4a7ab0', '#2e5482'], camisa2: ['#d8b04a', '#a8822e'], camisa3: ['#c8544a', '#943a32'], pantalon2: ['#4a4a5e', '#2e2e3e'], perro: ['#c08a52', '#8a5a32'], saco: ['#eedcb4', '#c8b088'], buitre: 'rgba(40,30,40,.85)', chaleco: '#4a3426', encendido: false, palomino: ['#e2b46a', '#b4823e', '#8a6030', '#f4d496'], tordo: ['#cfcac2', '#94908a', '#6e6a66', '#f2eee6'], 
    luz: -1,
    cielo: ['#1b6fb0', '#3d98d0', '#86c6e4', '#cfeaf0'],
    nubes: [[250, 170, 1.55], [720, 120, 1.05], [1130, 196, 1.4], [1480, 100, 0.95], [520, 270, 0.7], [1500, 280, 0.6]],
    sierra: ['#a9b6d0', '#8d9dc0'], arbol: ['#2f5a34', '#4f7f42', '#7aa55a'], valla: ['#b49a78', '#7a6448'], agua: '#6aa8c8',
    nube: ['#9fc2dc', '#dfeef6', '#ffffff'],
    astro: function (c) { var h = c.createRadialGradient(80, 40, 10, 80, 40, 420); h.addColorStop(0, 'rgba(255,250,225,.55)'); h.addColorStop(1, 'rgba(255,250,225,0)'); c.fillStyle = h; c.fillRect(0, 0, 600, 500); },
    lejos: ['#e3b79a', '#d6a488'], calima: 'rgba(240,226,214,.6)',
    roca: ['#f6b884', '#e08654', '#b25e3c', '#7e3a2a'], rocaLejos: { luz: -1, roca: ['#eeb894', '#dc9a76', '#c08066', '#9a6050'] },
    suelo: ['#ecc07e', '#e6b06a', '#d89a56'], tierra: ['#d89a5a', '#c98a4a'], calle: 'rgba(250,214,150,.55)', sombraSuelo: 'rgba(150,80,40,.3)',
    hierba: ['#c9a548', '#a88a3a'], cactus: ['#6aae5e', '#3f7c46', '#9ad08a'],
    madera: ['#c4473a', '#93302a', '#7a2620'], madera2: ['#b43c34', '#86281f', '#6e201a'], madera3: ['#d9a35e', '#ae7a3e', '#8a5a2a'], piedra: ['#e9dfca', '#c6b89e', '#a8987c'],
    tejado: ['#8e3a30', '#5e2620'], chapa: ['#8fa6b2', '#5e7682'], cristal: ['#9ed6ea', '#4a8cb0'],
    vagon: ['#3a7a5c', '#285a42'], loco: ['#2a2e3c', '#121418'], humo: ['#b8c4d4', '#e6ebf2', '#ffffff'],
    caballo: ['#8a4a2c', '#5a2c18', '#3e1e10', '#c27a52'], crin: '#2a160e', filoCaballo: 'rgba(255,236,200,.95)', manta: ['#d8442e', '#a42e20', '#f2d27a'], cuero: ['#8a5634', '#5a321c'],
    ropa: ['#5aa4b0', '#3a7480'], pantalon: 'rgba(40,40,60,.75)', piel: ['#e4a882', '#c08262'], panuelo: '#c8342a', sombrero: ['#e6d6b4', '#b8a582', '#6a3a2a'],
    vineta: 'rgba(40,20,0,.22)'
  });
  var TARDE = con({
    serpiente: ['#e0a870', '#9a6a40', '#5a3a26'], lagarto: ['#d0a070', '#7a5a40'],
    caldera: ['#3a5a7a', '#1e3450'], hierro2: '#2e2628', lejanas: ['#d49a8a', '#b67a70'],
    vestido: ['#5a8a8a', '#365e60'], camisa2: ['#d8a24a', '#9a6e2e'], camisa3: ['#c8544a', '#8a3030'], pantalon2: ['#3a3a4a', '#22222e'], perro: ['#b07a4a', '#7a4a2a'], saco: ['#f2d0a0', '#c09870'], buitre: 'rgba(40,20,30,.85)', chaleco: '#2a1e1a', encendido: true, palomino: ['#e8a85a', '#a8703a', '#7a4a26', '#ffd08a'], tordo: ['#c4b0a8', '#8a7470', '#5e4c4a', '#ffd8b8'], 
    luz: 1,
    cielo: ['#1b5c66', '#2f8486', '#78b4a0', '#f2c48a', '#ffb070'],
    cirros: [[60, 120, 380, 'rgba(255,214,160,.85)'], [480, 70, 300, 'rgba(255,190,130,.8)'], [1100, 140, 420, 'rgba(255,214,170,.8)'], [1380, 60, 220, 'rgba(255,180,120,.75)']],
    nubes: [[300, 230, 1.6], [820, 180, 1.2], [1250, 250, 1.45], [580, 300, 0.7]],
    sierra: ['#b48492', '#94687a'], arbol: ['#2e4a36', '#4e6a3e', '#c89a52'], valla: ['#b48a6a', '#6e4a3a'], agua: '#e8a070',
    nube: ['#c45a52', '#f29a6a', '#ffd9a0', '#fff0c8'],
    astro: function (c) { var h = c.createRadialGradient(1480, 470, 10, 1480, 470, 560); h.addColorStop(0, 'rgba(255,230,160,.9)'); h.addColorStop(0.3, 'rgba(255,180,100,.4)'); h.addColorStop(1, 'rgba(255,160,90,0)'); c.fillStyle = h; c.fillRect(800, 0, 800, HOR); c.fillStyle = '#fff4d0'; c.beginPath(); c.arc(1480, 500, 34, 0, 6.29); c.fill(); },
    lejos: ['#d9927a', '#c87a66'], calima: 'rgba(255,200,150,.6)',
    roca: ['#ff9d5c', '#d9643a', '#9c4030', '#62261e'], rocaLejos: { luz: 1, roca: ['#f2a07a', '#d07a62', '#a85e52', '#7e4440'] },
    suelo: ['#f0b070', '#d8935a', '#b06a40'], tierra: ['#c47a46', '#a8623a'], calle: 'rgba(255,200,140,.45)', sombraSuelo: 'rgba(90,40,50,.36)',
    hierba: ['#d8a04a', '#a8723a'], cactus: ['#4e8a5a', '#2c5a40', '#9ac27a'],
    madera: ['#c4443a', '#80282a', '#6a2024'], madera2: ['#b43a36', '#782428', '#621c22'], madera3: ['#e0a05e', '#a86a3e', '#84502e'], piedra: ['#f2d8bc', '#c0a48e', '#9a8070'],
    tejado: ['#9a4034', '#5a2228'], chapa: ['#a89a9a', '#6a6070'], cristal: ['#ffc890', '#d0705a'],
    vagon: ['#3a7066', '#22504a'], loco: ['#2a2c38', '#14141c'], humo: ['#a86a72', '#e6a688', '#ffe0b0'],
    caballo: ['#2c3a40', '#162026', '#0e1418', '#4e6a70'], crin: '#0c1216', filoCaballo: 'rgba(255,190,110,.95)', manta: ['#c8402c', '#8a2a1e', '#f0c060'], cuero: ['#6a4028', '#3e2414'],
    ropa: ['#3e8a86', '#24605e'], pantalon: 'rgba(20,24,34,.8)', piel: ['#e0a07a', '#a86a50'], panuelo: '#c8342a', sombrero: ['#3a3a44', '#22222a', '#a8622a'],
    vineta: 'rgba(60,20,30,.3)'
  });

  /* ---------- la mina, el campamento y el rancho (02/11, Pau: «mejorar el pico, el vagón de oro, la caravana, la casita del rancho») ---------- */
  // un pico de minero: mango de madera con su veta y la cabeza de hierro curvada de dos puntas, apoyado
  function pico(c, x, y, ang, s, P) {
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
    var mango = pata([[0, 0], [0, -40], [0, -78]], [5, 4.6, 4.2]); cel(c, mango, [P.madera3[2], P.madera3[0]], -2, 0);
    c.strokeStyle = 'rgba(80,50,20,.5)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-0.6, -8); c.lineTo(-0.6, -70); c.stroke();
    var cab = new Path2D(); cab.moveTo(-36, -70); cab.quadraticCurveTo(-18, -86, 0, -84); cab.quadraticCurveTo(18, -86, 34, -72); cab.lineTo(36, -68); cab.quadraticCurveTo(16, -78, 0, -76); cab.quadraticCurveTo(-16, -78, -34, -66); cab.closePath();
    cel(c, cab, P.metal || ['#4a4a54', '#9a9aa6'], 0, -2); bajo(rect(-4.5, -88, 9, 16), c, (P.metal || ['#5a5a64'])[0]);
    c.restore();
  }
  function pala(c, x, y, ang, s, P) {
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
    cel(c, pata([[0, -10], [0, -60], [0, -80]], [4.4, 4, 3.8]), [P.madera3[2], P.madera3[0]], -2, 0);
    bajo(suave([[-6, -84], [6, -84], [8, -90], [-8, -90]]), c, P.madera3[2]);
    var hoja = suave([[-10, -10], [10, -10], [12, 6], [0, 18], [-12, 6]]); cel(c, hoja, P.metal || ['#4a4a54', '#8a8a96'], -1.5, -1.5);
    c.restore();
  }
  // la vagoneta de mina: caja de chapa remachada con cantoneras, chasis, cuatro ruedas de pestaña en los carriles y el mineral con pepitas
  function vagonetaMina(c, x, y, P) {
    var w = 96, top = y - 58, bot = y - 18;
    c.fillStyle = P.sombraSuelo; c.beginPath(); c.ellipse(x, y + 2, 60, 5, 0, 0, 6.29); c.fill();
    bajo(rect(x - w / 2 + 6, bot, w - 12, 6), c, P.hierro);   // el chasis
    var caja = poli([[x - w / 2, top], [x + w / 2, top], [x + w / 2 - 8, bot], [x - w / 2 + 8, bot]]);
    var mineral = suave([[x - w / 2 + 4, top + 2], [x - 30, top - 14], [x - 8, top - 20], [x + 14, top - 17], [x + 34, top - 10], [x + w / 2 - 4, top + 2]]);
    cel(c, mineral, [mezcla(P.roca[2], '#3a2a20', 0.3), P.roca[1]], -P.luz * 3, -3);
    sembrar(Math.round(x)); for (var k = 0; k < 9; k++) { var px = x - 34 + azar() * 68, py = top - 2 - azar() * 14; c.fillStyle = k % 3 ? P.roca[2] : P.roca[0]; c.beginPath(); c.ellipse(px, py, 3.5 + azar() * 3, 2.6 + azar() * 2, azar(), 0, 6.29); c.fill(); }
    [[x - 18, top - 9], [x + 10, top - 14], [x + 26, top - 6], [x - 4, top - 4]].forEach(function (q) { c.fillStyle = '#f6cd4a'; c.beginPath(); c.moveTo(q[0] - 3, q[1]); c.lineTo(q[0], q[1] - 3); c.lineTo(q[0] + 3.4, q[1] - 0.6); c.lineTo(q[0] + 1.4, q[1] + 2.4); c.closePath(); c.fill(); c.fillStyle = '#fff4c0'; c.fillRect(q[0] - 0.6, q[1] - 1.8, 1.2, 1.2); });
    cel(c, caja, P.metal || ['#4a4850', '#7a7884'], -P.luz * 4, -3);
    c.save(); c.clip(caja); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.beginPath(); [x - 16, x + 16].forEach(function (lx) { c.moveTo(lx, top); c.lineTo(lx, bot); }); c.moveTo(x - w / 2, top + 20); c.lineTo(x + w / 2, top + 20); c.stroke();
    c.fillStyle = 'rgba(255,240,210,.5)'; for (var rx = x - w / 2 + 6; rx < x + w / 2 - 4; rx += 8) { c.fillRect(rx, top + 3, 1.6, 1.6); c.fillRect(rx, bot - 5, 1.6, 1.6); } c.restore();
    c.fillStyle = P.hierro; c.fillRect(x - w / 2 - 1, top - 2, w + 2, 4); [[x - w / 2, top], [x + w / 2 - 6, top]].forEach(function (q) { c.fillRect(q[0], q[1], 6, 16); });
    c.strokeStyle = P.hierro; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + w / 2 - 6, bot - 4); c.lineTo(x + w / 2 + 10, bot - 4); c.stroke(); c.beginPath(); c.arc(x + w / 2 + 12, bot - 4, 3, 0, 6.29); c.stroke();   // el enganche
    [[x - 26, 1], [x + 26, 1]].forEach(function (q) { ruedaTren(c, q[0], y - 9, 9, P.hierro2 || P.hierro, P, false, q[0] / 9); });
  }
  // la carreta del campamento (Conestoga), de lado: la lona en silla de montar (las puntas más altas que el centro), hundida
  // entre los arcos y atada a la caja con cuerdas; la caja de barco con su franja roja; debajo, la vara entre los ejes, el
  // freno con su zapata, el cubo de grasa; detrás, el comedero y un farol colgado; delante, la lanza y el yugo en el suelo
  function carreta(c, x, y, P) {
    var RD = P.rojoCarro || '#b8382a', LONA = P.lona || ['#cfc1a0', '#efe6cf', '#faf5e8'], rD = 34, rT = 46, xD = x - 104, xT = x + 110;
    c.fillStyle = P.sombraSuelo; c.beginPath(); c.ellipse(x + P.luz * -30, y + 4, 200, 9, 0, 0, 6.29); c.fill();
    // el yugo de los bueyes, en el suelo delante de la lanza
    var yx = x - 300, yu = poli([[yx - 40, y - 8], [yx + 40, y - 8], [yx + 44, y - 16], [yx - 44, y - 16]]); cel(c, yu, [P.madera3[2], P.madera3[1]], -P.luz * 2, -2);
    c.strokeStyle = P.madera3[2]; c.lineWidth = 3.4; c.beginPath(); [yx - 24, yx + 24].forEach(function (bx) { c.moveTo(bx - 10, y - 12); c.quadraticCurveTo(bx - 12, y + 4, bx, y + 4); c.quadraticCurveTo(bx + 12, y + 4, bx + 10, y - 12); }); c.stroke();
    c.strokeStyle = P.hierro; c.lineWidth = 1.4; c.beginPath(); c.moveTo(yx, y - 12); for (var k = 0; k < 8; k++) c.lineTo(yx + 14 + k * 9, y - 6 + (k % 2) * 3); c.stroke();   // la cadena
    // las ruedas de detrás (del otro lado)
    c.globalAlpha = 0.5; ruedaCarroColor(c, xD + 14, y - rD, rD, P, RD); ruedaCarroColor(c, xT + 14, y - rT, rT, P, RD); c.globalAlpha = 1;
    // la lanza y la vara que une los ejes por debajo
    c.lineCap = 'round'; if (TINTA) { c.strokeStyle = TINTA; c.lineWidth = 8; c.beginPath(); c.moveTo(xD, y - rD); c.lineTo(x - 290, y - 14); c.stroke(); }
    c.strokeStyle = P.madera3[1]; c.lineWidth = 5; c.beginPath(); c.moveTo(xD, y - rD); c.lineTo(x - 290, y - 14); c.stroke();
    c.strokeStyle = P.madera3[2]; c.lineWidth = 6; c.beginPath(); c.moveTo(xD, y - rD - 4); c.lineTo(xT, y - rT + 4); c.stroke();
    // el cubo de grasa colgado del eje de atrás
    c.strokeStyle = P.hierro; c.lineWidth = 1.2; c.beginPath(); c.moveTo(xT - 40, y - 54); c.lineTo(xT - 40, y - 40); c.stroke(); cel(c, poli([[xT - 47, y - 40], [xT - 33, y - 40], [xT - 35, y - 24], [xT - 45, y - 24]]), [P.hierro, mezcla(P.hierro, '#ffffff', 0.25)], -P.luz, 0);
    // la caja: forma de barco, tablas, la franja roja de arriba, los herrajes, la tabla perezosa y la caja de herramientas
    var caja = new Path2D(); caja.moveTo(x - 162, y - 116); caja.quadraticCurveTo(x - 140, y - 100, x, y - 98); caja.quadraticCurveTo(x + 150, y - 100, x + 174, y - 122); caja.lineTo(x + 158, y - 58); caja.quadraticCurveTo(x, y - 54, x - 148, y - 58); caja.closePath();
    cel(c, caja, [P.vagon[1], P.vagon[0]], -P.luz * 4, -4);
    c.save(); c.clip(caja); c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1.2; c.beginPath(); [-86, -77, -68].forEach(function (d) { c.moveTo(x - 170, y + d); c.quadraticCurveTo(x, y + d + 4, x + 180, y + d - 2); }); c.stroke();
    c.fillStyle = RD; c.beginPath(); c.moveTo(x - 164, y - 118); c.quadraticCurveTo(x - 140, y - 102, x, y - 100); c.quadraticCurveTo(x + 150, y - 102, x + 176, y - 124); c.lineTo(x + 176, y - 111); c.quadraticCurveTo(x + 150, y - 90, x, y - 89); c.quadraticCurveTo(x - 140, y - 90, x - 164, y - 106); c.fill(); c.restore();
    c.fillStyle = P.hierro; [-120, -60, 0, 60, 120].forEach(function (d) { c.fillRect(x + d - 1.5, y - 96, 3, 38); c.fillRect(x + d - 3, y - 62, 6, 3); });
    cel(c, rect(x - 40, y - 60, 70, 7), [P.madera3[2], P.madera3[1]], 0, -2);   // la tabla perezosa
    cel(c, rect(x - 118, y - 84, 44, 22), [P.madera3[2], P.madera3[1]], -P.luz * 2, -2); c.fillStyle = P.hierro; c.fillRect(x - 100, y - 78, 8, 4); c.fillRect(x - 118, y - 85, 44, 3);
    // el comedero de atrás
    cel(c, poli([[x + 170, y - 110], [x + 196, y - 106], [x + 192, y - 86], [x + 166, y - 90]]), [P.madera3[2], P.madera3[1]], -P.luz * 2, -2); c.fillStyle = (P.heno || ['#c8a040', '#e8c86a'])[1]; c.fillRect(x + 172, y - 112, 22, 4);
    // la lona: perfil en silla, hundida entre los arcos; abajo atada a la caja
    var arcos = [[-150, -240], [-100, -233], [-50, -228], [0, -226], [50, -228], [100, -233], [150, -240]];
    var lona = new Path2D(); lona.moveTo(x - 168, y - 112); lona.quadraticCurveTo(x - 206, y - 176, x - 192, y - 250);
    var px = x - 192, py = y - 250; arcos.forEach(function (a) { var ax = x + a[0], ay = y + a[1]; lona.quadraticCurveTo((px + ax) / 2, Math.max(py, ay) + 6, ax, ay); px = ax; py = ay; });
    lona.quadraticCurveTo((px + x + 198) / 2, Math.max(py, y - 252) + 6, x + 198, y - 252); lona.quadraticCurveTo(x + 214, y - 180, x + 180, y - 118);
    for (var b = arcos.length - 1; b >= 0; b--) { var ax2 = x + arcos[b][0]; lona.quadraticCurveTo(ax2 + 25, y - 106, ax2, y - 112); }
    lona.closePath();
    cel(c, lona, LONA, -P.luz * 6, -6);
    c.save(); c.clip(lona);
    // cada arco: una arista de luz y, a su lado, la sombra del pliegue
    arcos.forEach(function (a) { var ax = x + a[0]; c.strokeStyle = LONA[2]; c.globalAlpha = 0.9; c.lineWidth = 3; c.beginPath(); c.moveTo(ax - P.luz * 2, y + a[1] + 2); c.quadraticCurveTo(ax + a[0] * 0.08 - P.luz * 2, y - 170, ax - P.luz * 2, y - 112); c.stroke(); c.strokeStyle = LONA[0]; c.globalAlpha = 0.8; c.lineWidth = 2; c.beginPath(); c.moveTo(ax + P.luz * 3, y + a[1] + 4); c.quadraticCurveTo(ax + a[0] * 0.08 + P.luz * 3, y - 170, ax + P.luz * 3, y - 112); c.stroke(); });
    c.globalAlpha = 1;
    // la sombra baja de la lona, sobre la caja, y unos pliegues sueltos entre arcos
    var gl = c.createLinearGradient(0, y - 150, 0, y - 104); gl.addColorStop(0, 'rgba(0,0,0,0)'); gl.addColorStop(1, 'rgba(60,40,20,.18)'); c.fillStyle = gl; c.fillRect(x - 220, y - 150, 440, 50);
    c.strokeStyle = 'rgba(120,96,64,.25)'; c.lineWidth = 1; c.beginPath(); for (var d = -140; d < 160; d += 50) { c.moveTo(x + d + 18, y - 226); c.quadraticCurveTo(x + d + 22, y - 190, x + d + 14, y - 150); c.moveTo(x + d + 30, y - 224); c.quadraticCurveTo(x + d + 34, y - 200, x + d + 28, y - 170); } c.stroke();
    // un remiendo cosido y el lema pintado de la fiebre del oro de Colorado (1859)
    var rx = x + 66, ry = y - 192; c.fillStyle = LONA[0]; c.fillRect(rx, ry, 30, 24); c.strokeStyle = 'rgba(90,70,50,.6)'; c.lineWidth = 1; c.setLineDash([2, 2]); c.strokeRect(rx + 2, ry + 2, 26, 20); c.setLineDash([]);
    c.save(); c.fillStyle = 'rgba(70,40,26,.75)'; c.font = '700 13px ' + LETRA; c.textAlign = 'center'; c.textBaseline = 'middle'; if ('letterSpacing' in c) c.letterSpacing = '1px'; c.fillText("PIKE'S PEAK OR BUST", x - 40, y - 160); c.restore();
    c.restore();
    // las cuerdas que atan la lona a la caja, en cada arco
    c.strokeStyle = '#8a6a40'; c.lineWidth = 1.2; c.beginPath(); arcos.forEach(function (a) { var ax = x + a[0]; c.moveTo(ax - 3, y - 112); c.lineTo(ax + 2, y - 100); c.lineTo(ax - 2, y - 96); }); c.stroke();
    // las puntas: el borde fruncido con su rendija y el cordón
    [[x - 192, y - 250, x - 168, y - 112, -1], [x + 198, y - 252, x + 180, y - 118, 1]].forEach(function (q) {
      var d = q[4], rend = new Path2D(); rend.moveTo(q[2] + d * 2, q[3]); rend.quadraticCurveTo(q[0] + d * 6, (q[1] + q[3]) / 2 + 10, q[0] + d * 2, q[1] + 10); rend.quadraticCurveTo(q[0] - d * 2, (q[1] + q[3]) / 2 + 6, q[2] - d * 4, q[3] - 2); rend.closePath(); bajo(rend, c, '#3a2c22');
      c.strokeStyle = 'rgba(120,96,64,.5)'; c.lineWidth = 1.1; c.beginPath(); for (var k2 = 0; k2 < 9; k2++) { var t = (k2 + 0.5) / 9, ex = U2(q[2], q[0], t) + d * Math.sin(Math.PI * t) * 10, ey = U2(q[3], q[1], t), ix = ex - d * (16 + Math.sin(Math.PI * t) * 8); c.moveTo(ex, ey); c.quadraticCurveTo((ex + ix) / 2, ey + 2, ix, ey + (t - 0.5) * 8); } c.stroke();
      c.strokeStyle = '#8a6a40'; c.lineWidth = 2; c.beginPath(); c.moveTo(q[2] + d * 2, q[3]); c.quadraticCurveTo(q[0] + d * 8, (q[1] + q[3]) / 2 + 10, q[0] + d * 2, q[1] + 10); c.stroke();
    });
    // el farol colgado del último arco y el barril de agua atado al costado
    farol(c, x + 150, y - 132, P, P.encendido);
    barril(c, x + 46, y - 58, P); c.strokeStyle = '#8a6a40'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x + 28, y - 86); c.lineTo(x + 64, y - 86); c.stroke();
    // el freno: la palanca por el costado y la zapata contra la rueda de atrás
    c.strokeStyle = P.hierro; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 40, y - 62); c.lineTo(xT - rT - 2, y - rT + 6); c.stroke(); bajo(rect(xT - rT - 6, y - rT - 4, 8, 22), c, P.madera3[2]);
    // las ruedas de este lado: rojas, como las de las Conestoga
    ruedaCarroColor(c, xD, y - rD, rD, P, RD); ruedaCarroColor(c, xT, y - rT, rT, P, RD);
  }
  function U2(a, b, t) { return a + (b - a) * t; }
  function ruedaCarroColor(c, cx, cy, r, P, color) { var Q = Object.assign({}, P, { madera3: [color, mezcla(color, '#000000', 0.2), mezcla(color, '#000000', 0.45)] }); ruedaCarro(c, cx, cy, r, Q); }
  // el granero: tejado de dos pendientes (holandés), tablas verticales con remates blancos, puerta de cruz, henil con su viga y polea, ventanucos y una veleta
  function granero(c, x, P) {
    var w = 300, cx = x + w / 2, alero = 552, quiebre = 488, cima = 452;
    var tejado = poli([[x - 18, alero + 6], [x + 12, quiebre], [cx, cima], [x + w - 12, quiebre], [x + w + 18, alero + 6]]);
    cel(c, tejado, [P.tejado[1], P.tejado[0]], -P.luz * 12, 0);
    c.save(); c.clip(tejado); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; c.beginPath(); for (var y = cima + 8; y < alero + 6; y += 9) { c.moveTo(x - 20, y); c.lineTo(x + w + 20, y); } c.stroke(); c.restore();
    var pared = rect(x, alero, w, BASE - alero); cel(c, pared, [P.madera[1], P.madera[0]], -P.luz * 8, 0);
    var hastial = poli([[x + 18, alero], [x + 30, quiebre + 10], [cx, cima + 14], [x + w - 30, quiebre + 10], [x + w - 18, alero]]); cel(c, hastial, [P.madera[1], P.madera[0]], -P.luz * 8, 0);
    c.save(); c.clip(une([pared, hastial])); c.fillStyle = P.madera[2]; for (var xx = x; xx < x + w; xx += 10) c.fillRect(xx, cima, 1.2, BASE - cima); c.restore();
    c.fillStyle = P.moldura; c.fillRect(x, alero - 3, w, 5); c.fillRect(x, alero, 6, BASE - alero); c.fillRect(x + w - 6, alero, 6, BASE - alero);
    // la puerta grande de cruz, en dos hojas, con su riel
    [[cx - 54, BASE - 118, 54], [cx, BASE - 118, 54]].forEach(function (q) { bajo(rect(q[0], q[1], q[2], 118), c, P.madera[1]); c.strokeStyle = P.moldura; c.lineWidth = 4; c.strokeRect(q[0] + 2, q[1] + 2, q[2] - 4, 114); c.beginPath(); c.moveTo(q[0] + 4, q[1] + 4); c.lineTo(q[0] + q[2] - 4, q[1] + 114); c.moveTo(q[0] + q[2] - 4, q[1] + 4); c.lineTo(q[0] + 4, q[1] + 114); c.stroke(); });
    c.fillStyle = P.hierro; c.fillRect(cx - 70, BASE - 124, 140, 4);
    // el henil: la puerta abierta con heno, la viga que sobresale y la polea con su cuerda
    bajo(rect(cx - 24, cima + 46, 48, 40), c, '#2a1a12'); c.fillStyle = (P.heno || ['#c8a040', '#e8c86a'])[1]; c.fill(suave([[cx - 22, cima + 86], [cx - 20, cima + 66], [cx - 4, cima + 58], [cx + 16, cima + 64], [cx + 22, cima + 86]])); c.strokeStyle = '#c8a040'; c.lineWidth = 1; c.beginPath(); for (var k = 0; k < 8; k++) { c.moveTo(cx - 18 + k * 5, cima + 84); c.lineTo(cx - 20 + k * 5 + 4, cima + 64); } c.stroke();
    c.strokeStyle = P.moldura; c.lineWidth = 3; c.strokeRect(cx - 24, cima + 46, 48, 40);
    bajo(rect(cx - 4, cima + 28, 8, 18), c, P.madera3[2]); bajo(rect(cx - 4, cima + 28, 46, 7), c, P.madera3[2]); c.strokeStyle = P.hierro; c.lineWidth = 1.4; c.beginPath(); c.arc(cx + 34, cima + 40, 5, 0, 6.29); c.moveTo(cx + 34, cima + 45); c.lineTo(cx + 34, cima + 104); c.stroke();
    // dos ventanucos y la veleta del gallo en la cumbrera
    [x + 40, x + w - 64].forEach(function (vx) { ventana(c, rect(vx, alero + 30, 24, 24), P); });
    c.strokeStyle = P.hierro; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cima); c.lineTo(cx, cima - 30); c.moveTo(cx - 12, cima - 14); c.lineTo(cx + 12, cima - 14); c.stroke();
    c.fillStyle = P.hierro; c.beginPath(); c.moveTo(cx - 10, cima - 30); c.quadraticCurveTo(cx - 4, cima - 42, cx + 4, cima - 40); c.lineTo(cx + 8, cima - 46); c.lineTo(cx + 10, cima - 38); c.quadraticCurveTo(cx + 12, cima - 30, cx + 2, cima - 28); c.lineTo(cx - 12, cima - 26); c.closePath(); c.fill();
    // pacas de heno al lado
    [[x + w + 20, BASE + 2], [x + w + 66, BASE + 2], [x + w + 42, BASE - 30]].forEach(function (q) { var pa = rect(q[0], q[1] - 32, 46, 32); cel(c, pa, P.heno || ['#c8a040', '#e8c86a'], -P.luz * 3, -3); c.strokeStyle = '#a07a2a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(q[0] + 14, q[1] - 32); c.lineTo(q[0] + 14, q[1]); c.moveTo(q[0] + 32, q[1] - 32); c.lineTo(q[0] + 32, q[1]); c.stroke(); });
  }
  // la casa del rancho: una planta de troncos con porche, tejado de tablillas, chimenea de piedra y una mecedora
  function casaRancho(c, x, P) {
    var w = 230, alero = 600, cima = 548, cx = x + w / 2;
    var ch = rect(x + w - 50, cima - 26, 26, BASE - cima + 26); cel(c, ch, P.piedra2 || ['#8a7a6a', '#b8a894'], -P.luz * 4, 0); c.save(); c.clip(ch); c.strokeStyle = 'rgba(60,40,30,.4)'; c.lineWidth = 1; c.beginPath(); for (var y = cima - 26; y < BASE; y += 9) { c.moveTo(x + w - 50, y); c.lineTo(x + w - 24, y); } c.stroke(); c.restore();
    var tej = poli([[x - 22, alero + 4], [cx, cima], [x + w + 22, alero + 4]]); cel(c, tej, [P.tejado[1], P.tejado[0]], -P.luz * 10, 0);
    c.save(); c.clip(tej); c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1; c.beginPath(); for (var yy = cima + 6; yy < alero + 6; yy += 7) { c.moveTo(x - 30, yy); c.lineTo(x + w + 30, yy); for (var xx = x - 30 + ((yy / 7) % 2) * 9; xx < x + w + 30; xx += 18) { c.moveTo(xx, yy); c.lineTo(xx, yy + 7); } } c.stroke(); c.restore();
    var muro = rect(x, alero, w, BASE - alero); cel(c, muro, [P.madera3[1], P.madera3[0]], -P.luz * 6, 0);
    c.save(); c.clip(muro); for (var t = alero + 4; t < BASE; t += 12) { var g = c.createLinearGradient(0, t, 0, t + 12); g.addColorStop(0, P.madera3[0]); g.addColorStop(1, P.madera3[2]); c.fillStyle = g; c.fillRect(x, t, w, 12); } c.restore();   // los troncos
    [[x, alero], [x + w - 8, alero]].forEach(function (q) { for (var t2 = alero + 4; t2 < BASE; t2 += 12) { c.fillStyle = P.madera3[0]; c.beginPath(); c.arc(q[0] + 4, t2 + 6, 6, 0, 6.29); c.fill(); c.strokeStyle = P.madera3[2]; c.lineWidth = 0.8; c.beginPath(); c.arc(q[0] + 4, t2 + 6, 3, 0, 6.29); c.stroke(); } });   // las testas de los troncos
    bajo(rect(cx - 16, BASE - 62, 32, 62), c, P.puerta); c.strokeStyle = P.moldura; c.lineWidth = 3; c.strokeRect(cx - 16, BASE - 62, 32, 62);
    [x + 30, x + w - 80].forEach(function (vx) { ventana(c, rect(vx, BASE - 70, 36, 30), P); });
    // el porche: tejadillo sobre postes, la mecedora
    var por = poli([[x - 14, alero + 14], [x + w + 14, alero + 14], [x + w + 24, alero + 30], [x - 24, alero + 30]]); cel(c, por, [P.tejado[1], P.tejado[0]], 0, -3);
    [x - 16, x + w / 3, x + w * 2 / 3, x + w + 12].forEach(function (px) { cel(c, rect(px, alero + 30, 5, BASE - alero - 30), [P.madera3[2], P.moldura], -P.luz * 2, 0); });
    bajo(rect(x - 24, BASE, w + 48, 8), c, P.madera3[1]);
    var mx = x + w - 34; c.strokeStyle = P.madera3[2]; c.lineWidth = 2.6; c.beginPath(); c.moveTo(mx - 14, BASE - 2); c.quadraticCurveTo(mx, BASE + 4, mx + 16, BASE - 4); c.moveTo(mx - 10, BASE - 2); c.lineTo(mx - 8, BASE - 22); c.lineTo(mx + 10, BASE - 22); c.lineTo(mx + 8, BASE - 2); c.moveTo(mx + 10, BASE - 22); c.lineTo(mx + 12, BASE - 48); c.stroke();
  }

  // la tinta: un color, o null para quitarla
  function tinta(t) { if (t !== undefined) TINTA = t; return TINTA; }
  var A = VA.arte = {
    HOR: HOR, BASE: BASE, VIA: VIA, tinta: tinta, DIA: DIA, TARDE: TARDE, BASEC: BASEC, con: con, sembrar: sembrar, azar: azar,
    P2m: P2m,
    abrevadero: abrevadero,
    aguja: aguja,
    artemisa: artemisa,
    bajo: bajo,
    barril: barril,
    bomba: bomba,
    buitre: buitre,
    caballoA: caballoA,
    cactusBarril: cactusBarril,
    caja: caja,
    calavera: calavera,
    canto: canto,
    caras: caras,
    carro: carro,
    cartel: cartel,
    casa: casa,
    cel: cel,
    chumbera: chumbera,
    chumbera2: chumbera2,
    circulo: circulo,
    cirro: cirro,
    con: con,
    conAguja: conAguja,
    contorno: contorno,
    cubo: cubo,
    cuervo: cuervo,
    deposito: deposito,
    derrubios: derrubios,
    edificio: edificio,
    elipse: elipse,
    enebro: enebro,
    farol: farol,
    grano: grano,
    hacerJ: hacerJ,
    jinete: jinete,
    jineteCel: jineteCel,
    lagarto: lagarto,
    mata: mata,
    mesa: mesa,
    mesaCel: mesaCel,
    mezcla: mezcla,
    molino: molino,
    nube: nube,
    nubeCel: nubeCel,
    pata: pata,
    perro: perro,
    persona: persona,
    poli: poli,
    rect: rect,
    pico: pico,
    pala: pala,
    vagonetaMina: vagonetaMina,
    carreta: carreta,
    ruedaCarroColor: ruedaCarroColor,
    granero: granero,
    casaRancho: casaRancho,
    ruedasTren: ruedasTren,
    rectDe: rectDe,
    rodadora: rodadora,
    rueda: rueda,
    ruedaCarro: ruedaCarro,
    ruedaTren: ruedaTren,
    saguaro: saguaro,
    seBusca: seBusca,
    sembrar: sembrar,
    serpiente: serpiente,
    sierra: sierra,
    suave: suave,
    textoLetrero: textoLetrero,
    tonos: tonos,
    tren: tren,
    trenDetallado: trenDetallado,
    une: une,
    valla: valla,
    ventana: ventana,
    yuca: yuca
  };
})();
