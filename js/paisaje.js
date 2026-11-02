/* Vaccaria Incognita · el paisaje
   El Oeste que se recorre de lado, de izquierda a derecha: Monument Valley → el pueblo de Vaccaria → la estación →
   el rancho → la mina de oro → el campamento. Cinco capas con paralaje (sierra, mesas, llanura con la vía, la calle y el
   primer plano). Lo fijo se pinta por teselas de 512 px y por paleta (día, atardecer, noche), con un taller que pinta
   primero lo visible y espera a WebKit; entre dos paletas las teselas se funden. Lo vivo (cielo, sol, luna, estrellas,
   nubes, buitres, el tren y su humo, el molino, la rodadora) se pinta en cada fotograma.
   Las piezas dibujan en unidades de lámina (900 = 1 u = la altura de la pantalla): ver js/arte.js. */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, A = VA.arte;
  var TAU = Math.PI * 2, K = 900, TW = 512;
  var PA = VA.paisaje = {};
  E.largo = 12;
  var LARGO = E.largo * K, HOR = A.HOR, BASE = A.BASE, VIA = A.VIA;
  PA.HOR = HOR / K;

  /* ================================================================== las paletas: día, atardecer y noche */
  // la noche se saca del día: todo hacia un azul de luna, con las ventanas y los faroles encendidos
  function nocturna(P) {
    var N = { luz: -1 }, AZUL = '#1a2140';
    function oscurece(v, k) { if (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) return A.mezcla(v, AZUL, k).replace(/rgb\((\d+),(\d+),(\d+)\)/, function (m, r, g, b) { return '#' + [r, g, b].map(function (x) { return ('0' + (+x).toString(16)).slice(-2); }).join(''); }); if (Array.isArray(v)) return v.map(function (x) { return oscurece(x, k); }); if (v && typeof v === 'object') { var o = {}; for (var q in v) o[q] = oscurece(v[q], k); return o; } return v; }
    for (var k in P) N[k] = oscurece(P[k], 0.66);
    N.luz = -1;
    N.cielo = ['#04071a', '#0c1434', '#1c2850', '#34406a'];
    N.nube = ['#141a30', '#222c48', '#36405e'];
    N.cristal = ['#ffd890', '#e8a04a']; N.encendido = true;
    N.calima = 'rgba(70,80,130,.35)'; N.sombraSuelo = 'rgba(4,6,18,.4)'; N.vineta = 'rgba(0,0,10,.45)';
    N.filoCaballo = 'rgba(170,190,255,.85)'; N.humo = ['#2a3048', '#3c4462', '#545c7a']; N.buitre = 'rgba(8,10,20,.9)';
    N.letra = '#d8c8a0'; N.agua = '#3a5a8a'; N.calle = 'rgba(70,80,130,.22)';
    return N;
  }
  // colores de las piezas nuevas (lona, ruedas rojas, metal, hueso, heno, piedra), para que también se oscurezcan de noche
  Object.assign(A.DIA, { lona: ['#cfc1a0', '#efe6cf', '#faf5e8'], rojoCarro: '#b8382a', metal: ['#4a4a54', '#9a9aa6'], hueso: ['#c6b48e', '#efe5cc', '#fbf6ea'], heno: ['#c8a040', '#e8c86a'], piedra2: ['#8a7a6a', '#b8a894'] });
  Object.assign(A.TARDE, { lona: ['#d0a888', '#f0d0ac', '#ffe6c4'], rojoCarro: '#b8342c', metal: ['#4a4450', '#a0909a'], hueso: ['#d0a888', '#f2d8b8', '#ffeeda'], heno: ['#c89040', '#f0c070'], piedra2: ['#8a6a5e', '#c09a84'] });
  var PAL = PA.PALETAS = { dia: A.DIA, ocaso: A.TARDE, noche: nocturna(A.DIA) };
  var TINTA_DIA = '#3b2618', TINTA_NOCHE = '#0b0d1a', conTinta = false;   // (Pau 02/11: «me gusta sin tinta»; la tinta es un premio al encontrar los diez)
  PA.tintaGuardada = function () { try { return localStorage.getItem('vaccaria-incognita.tinta') === '1'; } catch (e) { return false; } };
  function tintaDe(pal) { return conTinta ? (pal === 'noche' ? TINTA_NOCHE : TINTA_DIA) : null; }
  PA.conTinta = function () { return conTinta; };
  PA.tinta = function (si) { conTinta = !!si; try { localStorage.setItem('vaccaria-incognita.tinta', si ? '1' : '0'); } catch (e) { /* nada */ } sprites = {}; };

  /* ================================================================== las capas y sus piezas */
  var CAPAS = [
    { id: 'sierra', p: 0.08, y0: 0.5, y1: 0.63, res: 1, els: [] },
    { id: 'mesas', p: 0.25, y0: 0.26, y1: 0.63, res: 0.9, els: [] },
    { id: 'llanura', p: 0.6, y0: 0.52, y1: 0.75, res: 1, els: [] },
    { id: 'calle', p: 1, y0: 0.4, y1: 1, res: 1, els: [] },
    { id: 'cerca', p: 1.3, y0: 0.6, y1: 1, res: 1, els: [] }
  ];
  var CAPA = {}; CAPAS.forEach(function (c) { CAPA[c.id] = c; });
  // una pieza, en unidades de lámina de su capa: de x0 a x1; f(c, P) dibuja en lámina (la escala ya va puesta)
  function pieza(capa, x0, x1, f) { CAPA[capa].els.push({ l0: x0 / K, l1: x1 / K, f: function (c, P, u, t0, t1) { c.scale(u / K, u / K); f(c, P, t0 * K - 60, t1 * K + 60); } }); }

  /* ================================================================== las sombras vivas
     (Pau 02/11: «cuando la luna va moviéndose, las sombras tienen que moverse con ella, igual que con el sol»).
     Cada cosa que hace sombra se apunta con su capa, su ancho (x0–x1, en lámina), la y de su base y su alto; en cada
     fotograma su sombra sale de la base hacia delante y hacia el lado contrario a la luz, larga si la luz está baja. */
  var SOMBRAS = { llanura: [], calle: [], cerca: [] };
  function sombra(capa, x0, x1, y, h, forma) { SOMBRAS[capa].push({ x0: x0, x1: x1, y: y, h: h, forma: forma || 'caja' }); }

  /* ================================================================== el mundo */
  var LUGARES = [[0, 'Monument Valley'], [1.75, 'Vaccaria · Main Street'], [4.55, 'La estación'], [5.9, 'El rancho'], [8.15, 'La mina'], [10.05, 'El campamento']];
  PA.nombreLugar = function (l) { var n = LUGARES[0][1]; for (var i = 0; i < LUGARES.length; i++) if (l >= LUGARES[i][0]) n = LUGARES[i][1]; return n; };
  PA.LUGARES = LUGARES;
  // el pueblo: las casas de la calle mayor (la geometría es la de arte.edificio)
  var EDIF = [
    { n: 'HOTEL', x: 1660, w: 178, top: 466, pisos: 2, tono: 'madera' },
    { n: 'SALOON', x: 1850, w: 184, top: 500, pisos: 2, tono: 'madera2', batientes: true },
    { n: 'BANK', x: 2046, w: 132, top: 522, pisos: 1, tono: 'piedra', columnas: true },
    { n: 'GENERAL STORE', x: 2190, w: 176, top: 508, pisos: 1, tono: 'madera3' },
    { n: 'SHERIFF', x: 2378, w: 112, top: 566, pisos: 1, tono: 'madera' },
    { n: 'BARBER', x: 2700, w: 118, top: 548, pisos: 1, tono: 'madera3' },
    { n: 'TELEGRAPH', x: 2830, w: 150, top: 520, pisos: 1, tono: 'madera2' },
    { n: 'BLACKSMITH', x: 2992, w: 160, top: 540, pisos: 1, tono: 'madera' },
    { n: 'ASSAY OFFICE', x: 3164, w: 150, top: 512, pisos: 2, tono: 'piedra', columnas: true },
    { n: 'UNDERTAKER', x: 3326, w: 128, top: 552, pisos: 1, tono: 'madera3' },
    { n: 'MERCANTILE', x: 3466, w: 190, top: 490, pisos: 2, tono: 'madera2', balcon: true },
    { n: 'SALOON', x: 3668, w: 170, top: 506, pisos: 2, tono: 'madera', batientes: true, nombre: 'LAST CHANCE' }
  ];
  PA.EDIF = EDIF;
  var PUEBLO = EDIF.map(function (e) { var g = A.edificio(e); if (e.nombre) g.texto.t = e.nombre; return { e: e, g: g }; });

  // lo disperso: piedras y matas por todo el camino (posiciones fijas, para que cada tesela pinte las suyas)
  var r = U.azar(1881), PIEDRAS = [], MATAS = [], MATAS_CERCA = [];
  for (var x = -200; x < LARGO + 400; x += 26 + r() * 40) { var y = BASE + 14 + Math.pow(r(), 0.6) * (900 - BASE - 14); PIEDRAS.push([x, y, r()]); }
  for (x = -200; x < LARGO + 400; x += 60 + r() * 120) MATAS.push([x, BASE + 30 + r() * 140, r()]);
  for (x = 0; x < LARGO * 1.3 + 3000; x += 110 + r() * 200) MATAS_CERCA.push([x, 880 + r() * 40, r()]);

  function construir() {
    /* ---- la sierra azul y las mesetas lejanas ---- */
    pieza('sierra', -400, 4400, function (c, P) {
      A.sembrar(61); var pts = [[-400, HOR]]; for (var x = -400; x <= 4400; x += 24) pts.push([x, 498 - Math.abs(Math.sin(x / 210)) * 26 - Math.abs(Math.sin(x / 67 + 1)) * 8 - A.azar() * 4]); pts.push([4400, HOR]);
      var s = A.poli(pts); A.bajo(s, c, P.sierra[0]); c.save(); c.clip(s); c.fillStyle = P.sierra[1]; c.fillRect(-400, 520, 4800, 50); c.restore();
      var lj = [[-400, HOR], [-400, 512]]; A.sembrar(62); for (x = -400; x < 4400; x += 180 + A.azar() * 260) { var w = 90 + A.azar() * 200, h = 10 + A.azar() * 14; lj.push([x, 512], [x + 10, 512 - h], [x + w, 512 - h], [x + w + 12, 512]); } lj.push([4400, 512], [4400, HOR]);
      var l2 = A.poli(lj); A.bajo(l2, c, P.lejanas[0]); c.save(); c.clip(l2); c.fillStyle = P.lejanas[1]; c.fillRect(-400, 500, 4800, 14); c.restore();
    });
    /* ---- las mesas de Monument Valley (y otras), repartidas por el camino ---- */
    var MS = [
      { m: A.mesa(-220, 180, 336, 478, 120, 31), grada: true },
      { m: A.mesa(560, 630, 404, 494, 56, 3), lejos: true },
      A.conAguja(A.mesa(330, 428, 300, 462, 92, 5), 450, 348, 516),
      A.conAguja(A.mesa(880, 978, 318, 466, 92, 9), 846, 364, 510),
      { m: A.mesa(1220, 1640, 350, 486, 112, 33), grada: true },
      { m: A.mesa(1840, 1900, 384, 486, 60, 41), lejos: true },
      { m: A.mesa(2060, 2180, 330, 470, 96, 43) },
      A.conAguja(A.mesa(2460, 2540, 342, 470, 80, 45), 2570, 380, 516),
      { m: A.mesa(2860, 3380, 326, 482, 120, 47), grada: true },
      { m: A.mesa(3560, 3610, 300, 470, 46, 49) },
      { m: A.mesa(3700, 3740, 330, 470, 40, 51) },
      { m: A.mesa(3900, 4500, 344, 486, 120, 53), grada: true }
    ];
    MS.forEach(function (o) { var m = o.m; pieza('mesas', m.x0 - 140, m.x1 + 140, function (c, P) { A.mesaCel(c, o, o.lejos ? P.rocaLejos : P); }); });

    /* ---- la llanura: enebros, la vía, el telégrafo y la estación ---- */
    var LL = 7600;
    A.sembrar(17); for (var ex = -300; ex < LL + 600; ex += 70 + A.azar() * 160) (function (x, y, s) { pieza('llanura', x - 40, x + 40, function (c, P) { A.enebro(c, x, y, s, P); }); })(ex, 584 + A.azar() * 34, 0.45 + A.azar() * 0.45);
    pieza('llanura', -300, LL + 600, function (c, P, xa, xb) {
      c.fillStyle = P.balasto; c.fillRect(xa, VIA + 2, xb - xa, 9);
      c.strokeStyle = P.traviesa; c.lineWidth = 3; c.beginPath(); for (var x = Math.floor(xa / 13) * 13; x < xb; x += 13) { c.moveTo(x, VIA + 9); c.lineTo(x + 5, VIA - 1); } c.stroke();
      c.strokeStyle = P.hierro; c.lineWidth = 1.8; c.beginPath(); c.moveTo(xa, VIA); c.lineTo(xb, VIA); c.moveTo(xa, VIA + 5); c.lineTo(xb, VIA + 5); c.stroke();
      c.strokeStyle = P.cable; c.lineWidth = 1.1; c.beginPath();
      for (x = Math.floor((xa - 160) / 160) * 160 + 20; x < xb; x += 160) [-15, 13].forEach(function (dx) { c.moveTo(x + dx, VIA - 96); c.quadraticCurveTo(x + 80 + dx, VIA - 82, x + 160 + dx, VIA - 96); });
      c.stroke();
      for (x = Math.floor((xa - 20) / 160) * 160 + 20; x < xb + 20; x += 160) { A.cel(c, A.rect(x - 3, VIA - 102, 6, 104), [P.madera[1], P.madera[0]], -P.luz * 2, 0); c.fillStyle = P.madera[1]; c.fillRect(x - 16, VIA - 96, 32, 4); c.fillStyle = '#6ab89a'; [-15, -6, 5, 13].forEach(function (d) { c.beginPath(); c.arc(x + d, VIA - 98, 2.2, 0, TAU); c.fill(); }); }
    });
    // la estación: el edificio de la compañía (a escala, porque está más lejos) con su andén
    pieza('llanura', 2700, 3200, function (c, P) {
      var e = { n: 'VACCARIA', x: 2760, w: 260, top: 520, pisos: 2, tono: 'madera3' }, g = A.edificio(e);
      c.save(); c.translate(0, VIA - BASE + 2); c.translate(2890, BASE); c.scale(0.72, 0.72); c.translate(-2890, -BASE); A.casa(c, { e: e, g: g }, P); c.restore();
      A.cel(c, A.rect(2720, VIA - 6, 360, 7), [P.madera3[2], P.madera3[1]], 0, -2);
      A.barril(c, 2800, VIA - 4, P); A.caja(c, 3040, VIA - 3, 16, P, 'MAIL');
    });
    // el depósito de agua del ferrocarril, junto a la estación
    pieza('llanura', 3120, 3260, function (c, P) {
      var D = A.deposito(3190, VIA + 6);
      c.save(); c.translate(3190, VIA + 6); c.scale(0.8, 0.8); c.translate(-3190, -(VIA + 6));
      A.bajo(D.patas, c, P.madera[1]); c.strokeStyle = P.madera[1]; c.lineWidth = 2.6; c.stroke(D.riostras);
      A.cel(c, D.tanque, [P.madera3[1], P.madera3[0]], -P.luz * 8, 0); c.strokeStyle = P.hierro; c.lineWidth = 2.4; c.stroke(D.aros); A.cel(c, D.tapa, [P.tejado[1], P.tejado[0]], -P.luz * 10, 0); A.bajo(D.cano, c, P.hierro);
      c.restore();
    });

    /* ---- la calle: el camino, las rodadas, piedras y matas ---- */
    pieza('calle', -300, LARGO + 300, function (c, P, xa, xb) {
      c.fillStyle = P.calle; c.fillRect(xa, BASE + 9, xb - xa, 120);
      c.strokeStyle = P.tierra[1]; c.lineWidth = 3; c.globalAlpha = 0.6; c.beginPath();
      [BASE + 46, BASE + 64, BASE + 96, BASE + 112].forEach(function (y, k) { for (var x = Math.floor(xa / 900) * 900; x < xb; x += 900) { c.moveTo(x, y); c.bezierCurveTo(x + 300, y + (k % 2 ? 6 : -4), x + 600, y + (k % 2 ? -5 : 4), x + 900, y); } });
      c.stroke(); c.globalAlpha = 1;
    });
    // las piedras y las matas, cada una en su sitio
    PIEDRAS.forEach(function (q) {
      pieza('calle', q[0] - 12, q[0] + 12, function (c, P) { var r = 1 + (q[1] - HOR) / 150 * (0.6 + q[2] * q[2] * 3); c.fillStyle = q[2] < 0.5 ? P.roca[2] : P.roca[1]; c.beginPath(); c.ellipse(q[0], q[1], r * 1.4, r, 0, 0, TAU); c.fill(); c.fillStyle = P.roca[0]; c.beginPath(); c.ellipse(q[0] + P.luz * -r * 0.3, q[1] - r * 0.35, r * 0.8, r * 0.45, 0, 0, TAU); c.fill(); });
    });
    MATAS.forEach(function (q) { pieza('calle', q[0] - 40, q[0] + 40, function (c, P) { A.mata(c, q[0], q[1], 0.5 + (q[1] - BASE) / 180, P); }); });

    /* ---- Monument Valley, a pie de camino: rocas, una calavera de bisonte, una serpiente ---- */
    pieza('calle', 80, 1500, function (c, P) {
      A.canto(c, 300, 760, 170, 60, P, 5); A.canto(c, 420, 770, 80, 30, P, 6); A.canto(c, 1100, 756, 120, 44, P, 7);
      A.calavera(c, 620, 800, 0.62, P); A.serpiente(c, 860, 820, 1.1, P); A.lagarto(c, 1090, 712, 1, P);
      A.yuca(c, 520, 828, 1.2, P); A.cactusBarril(c, 980, 836, 1.1, P); A.chumbera2(c, 1300, 820, 0.9, P);
      // el cartel de la entrada del pueblo
      c.strokeStyle = P.madera[2]; c.lineWidth = 6; c.beginPath(); c.moveTo(1500, 768); c.lineTo(1500, 690); c.stroke();
      A.cartel(c, 1440, 676, 120, 26, 'VACCARIA  →', P); A.cartel(c, 1452, 712, 96, 18, 'POP. 312', P);
    });

    /* ---- el pueblo ---- */
    PUEBLO.forEach(function (o) {
      var e = o.e;
      // la sombra del edificio en la calle, la casa, y sus cosas
      pieza('calle', e.x - 80, e.x + e.w + 90, function (c, P) {
        A.casa(c, o, P);
      });
    });
    // los detalles de la calle mayor (en lámina: las casas empiezan en 1660)
    pieza('calle', 1600, 2520, function (c, P) {
      var X = 1660 - 34;   // (las posiciones de la lámina se movieron en bloque: el hotel estaba en 34)
      c.save(); c.translate(X, 0);
      A.persona(c, 160, BASE - 92, 64, { tipo: 'vestido', ropa: P.vestido, mira: -1, pelo: '#4a2a18' }, P);
      A.cartel(c, 60, BASE - 74, 52, 16, 'ROOMS', P); A.cartel(c, 296, BASE - 74, 66, 16, 'WHISKEY', P); A.cartel(c, 600, BASE - 74, 92, 16, 'FEED · TOOLS', P);
      A.farol(c, 30, BASE - 76, P, P.encendido); A.farol(c, 214, BASE - 76, P, P.encendido); A.farol(c, 410, BASE - 76, P, P.encendido); A.farol(c, 860, BASE - 76, P, P.encendido);
      A.bajo(A.rect(112, BASE - 24, 56, 5), c, P.madera[2]); A.bajo(A.rect(116, BASE - 19, 4, 19), c, P.madera[2]); A.bajo(A.rect(160, BASE - 19, 4, 19), c, P.madera[2]);
      A.persona(c, 132, BASE - 1, 70, { tipo: 'sentado', ropa: P.camisa2, mira: 1 }, P);
      A.persona(c, 728, BASE + 2, 78, { tipo: 'de pie', ropa: P.camisa3, brazo: 'apoyado', mira: -1 }, P);
      A.bajo(A.rect(866, BASE - 50, 4, 70), c, P.madera[2]); A.bajo(A.rect(914, BASE - 50, 4, 70), c, P.madera[2]); A.cel(c, A.rect(860, BASE - 64, 64, 46), [P.madera3[1], P.madera3[0]], -P.luz * 3, -2);
      A.seBusca(c, 878, BASE - 41, P, 1); A.seBusca(c, 906, BASE - 42, P, 1); A.seBusca(c, 892, BASE - 60, P, 0.7); A.seBusca(c, 380, BASE - 52, P, 0.9);
      A.perro(c, 456, BASE + 4, 1, P);
      [[566, 0], [584, 1]].forEach(function (q) { A.cel(c, A.elipse(q[0], BASE - 12, 9, 13), [P.saco[1], P.saco[0]], -P.luz * 2, -2); });
      c.strokeStyle = P.madera[2]; c.lineWidth = 2.4; c.beginPath(); c.moveTo(702, BASE); c.lineTo(712, BASE - 52); c.moveTo(708, BASE); c.lineTo(722, BASE - 50); c.stroke(); c.fillStyle = P.hierro; c.fillRect(698, BASE - 6, 10, 7); c.fillRect(705, BASE - 6, 10, 7);
      A.barril(c, 214, BASE + 2, P); A.barril(c, 196, BASE + 4, P); A.caja(c, 540, BASE + 3, 24, P, 'NAILS'); A.caja(c, 548, BASE - 21, 18, P, 'COFFEE'); A.barril(c, 862, BASE + 2, P);
      c.strokeStyle = P.madera[1]; c.lineWidth = 4; c.beginPath(); c.moveTo(262, BASE + 26); c.lineTo(262, BASE + 2); c.moveTo(372, BASE + 26); c.lineTo(372, BASE + 2); c.moveTo(256, BASE + 6); c.lineTo(378, BASE + 6); c.stroke();
      A.caballoA(c, A.hacerJ(318, 772, 104), P, { sinJinete: true }, -1);
      A.ruedaCarro(c, 742, BASE - 26, 26, P);
      A.abrevadero(c, 470, BASE + 34, P); A.bomba(c, 408, BASE + 36, P); A.cubo(c, 388, BASE + 38, P);
      A.carro(c, 600, BASE + 84, P);
      c.restore();
    });
    // la otra punta de la calle: más gente, barriles y un yunque frente al herrero
    pieza('calle', 2680, 3880, function (c, P) {
      A.farol(c, 2700, BASE - 76, P, P.encendido); A.farol(c, 2990, BASE - 76, P, P.encendido); A.farol(c, 3460, BASE - 76, P, P.encendido); A.farol(c, 3840, BASE - 76, P, P.encendido);
      A.cartel(c, 2730, BASE - 74, 60, 16, 'SHAVE 15¢', P); A.cartel(c, 3020, BASE - 74, 92, 16, 'HORSESHOES', P); A.cartel(c, 3700, BASE - 74, 74, 16, 'BEER 5¢', P);
      A.persona(c, 2905, BASE + 2, 76, { tipo: 'de pie', ropa: P.camisa2, mira: 1 }, P); A.persona(c, 3560, BASE - 92, 62, { tipo: 'vestido', ropa: P.camisa3, mira: 1, pelo: '#2a1a10' }, P);
      A.bajo(A.poli([[3080, BASE + 30], [3088, BASE + 12], [3120, BASE + 12], [3112, BASE + 2], [3138, BASE + 2], [3132, BASE + 12], [3142, BASE + 14], [3136, BASE + 30]]), c, P.hierro);   // el yunque
      A.barril(c, 3160, BASE + 4, P); A.barril(c, 3460, BASE + 2, P); A.caja(c, 3480, BASE + 3, 22, P, 'BEANS'); A.caja(c, 3870, BASE + 3, 20, P, 'TNT');
      A.abrevadero(c, 3900, BASE + 34, P);
    });

    /* ---- el rancho: el granero, el corral con caballos, el molino (vivo) ---- */
    pieza('calle', 5000, 6800, function (c, P) {
      A.casaRancho(c, 5060, P); A.granero(c, 5380, P);
      A.valla(c, [[5720, 656], [5785, 654], [5850, 656], [5915, 653], [5980, 656], [6045, 654], [6110, 656], [6175, 655]], 30, P);
      A.caballoA(c, A.hacerJ(6050, 694, 76), Object.assign({}, P, { caballo: P.tordo, crin: '#4a4644' }), { sinJinete: true, sinSilla: true }, 1);
      A.caballoA(c, A.hacerJ(5900, 702, 84), Object.assign({}, P, { caballo: P.palomino, crin: '#f4ead0' }), { sinJinete: true, sinSilla: true, marcas: true }, -1);
      A.abrevadero(c, 5800, 704, P);
      A.valla(c, [[5700, 716], [5770, 718], [5840, 715], [5910, 718], [5980, 716], [6050, 718], [6120, 715], [6190, 717]], 42, P, [0.3, 0.62, 0.9]);
      A.valla(c, [[5720, 656], [5710, 686], [5700, 716]], 34, P); A.cuervo(c, 5980, 674, 1.2);
      A.barril(c, 5360, BASE + 2, P); A.cubo(c, 5700, BASE + 30, P);
    });

    /* ---- la mina de oro: la pared de roca con su bocamina entibada, la vagoneta y el montón de mineral ---- */
    pieza('calle', 7300, 9000, function (c, P) {
      // la roca de la mina: un farallón que nace de la calle (se dibuja como una mesa y se baja hasta el suelo del camino)
      var m = A.mesa(7760, 8440, 360, 470, 90, 71), o = { m: m }; c.save(); c.translate(0, BASE + 6 - HOR); A.mesaCel(c, o, P); c.restore();
      var bx = 8040, bw = 120, bt = 596;
      var boca = new Path2D(); boca.moveTo(bx, BASE); boca.lineTo(bx, bt + 30); boca.quadraticCurveTo(bx + bw / 2, bt - 6, bx + bw, bt + 30); boca.lineTo(bx + bw, BASE); boca.closePath();
      A.bajo(boca, c, '#0e0a0a');
      // las entibas: dos postes y el cabezal, de troncos
      [[bx - 6, bt + 10, 14, BASE - bt - 10], [bx + bw - 8, bt + 10, 14, BASE - bt - 10], [bx - 20, bt - 4, bw + 40, 16]].forEach(function (q) { A.cel(c, A.rect(q[0], q[1], q[2], q[3]), [P.madera3[2], P.madera3[1]], -P.luz * 3, -2); });
      A.cartel(c, bx + 6, bt - 44, bw - 12, 22, 'GOLD MINE', P);
      // la vía estrecha que sale de la bocamina y la vagoneta cargada
      c.strokeStyle = P.hierro; c.lineWidth = 2; c.beginPath(); c.moveTo(bx + 30, BASE); c.lineTo(bx + 300, BASE + 6); c.moveTo(bx + 30, BASE + 8); c.lineTo(bx + 300, BASE + 14); c.stroke();
      A.vagonetaMina(c, bx + 216, BASE + 4, P);
      // el montón de mineral, con el pico y la pala apoyados
      A.cel(c, A.suave([[bx + 320, BASE + 30], [bx + 352, BASE - 6], [bx + 386, BASE - 26], [bx + 424, BASE - 30], [bx + 456, BASE - 8], [bx + 478, BASE + 30]]), [P.roca[2], P.roca[1]], -P.luz * 5, -5);
      A.sembrar(5); for (var kk = 0; kk < 14; kk++) { var mx2 = bx + 340 + A.azar() * 120, my2 = BASE + 26 - A.azar() * 40; c.fillStyle = kk % 2 ? P.roca[0] : P.roca[2]; c.beginPath(); c.ellipse(mx2, my2, 4 + A.azar() * 3, 3, A.azar(), 0, TAU); c.fill(); }
      A.pico(c, bx + 470, BASE + 30, 0.42, 1, P); A.pala(c, bx + 330, BASE + 28, -0.32, 1, P);
      A.farol(c, bx - 30, bt + 20, P, true); A.caja(c, bx - 70, BASE + 4, 24, P, 'TNT');
    });

    /* ---- el campamento: la carreta cubierta, la hoguera (viva), el petate y la cafetera ---- */
    pieza('calle', 9300, 10900, function (c, P) {
      A.carreta(c, 9560, BASE + 44, P);
      // la hoguera: el círculo de piedras y los troncos (las llamas son vivas)
      for (var k = 0; k < 9; k++) { var a = k / 9 * TAU; A.canto(c, 9900 + Math.cos(a) * 34, BASE + 76 + Math.sin(a) * 9, 18, 10, P, 80 + k); }
      c.strokeStyle = P.madera3[2]; c.lineWidth = 7; c.beginPath(); c.moveTo(9876, BASE + 80); c.lineTo(9922, BASE + 66); c.moveTo(9924, BASE + 80); c.lineTo(9880, BASE + 66); c.stroke();
      // el petate, la silla de montar en el suelo y la cafetera
      A.cel(c, A.suave([[9980, BASE + 90], [9984, BASE + 70], [10100, BASE + 66], [10110, BASE + 88]]), [P.manta[1], P.manta[0]], 0, -3);
      A.cel(c, A.suave([[10140, BASE + 80], [10146, BASE + 56], [10180, BASE + 50], [10206, BASE + 60], [10210, BASE + 80]]), [P.cuero[1], P.cuero[0]], -P.luz * 2, -2);
      A.cel(c, A.poli([[9944, BASE + 66], [9948, BASE + 44], [9966, BASE + 44], [9970, BASE + 66]]), ['#5a5a68', '#9a9aa6'], -P.luz * 2, 0);
      A.caballoA(c, A.hacerJ(10380, BASE + 70, 120), P, { sinJinete: true, marcas: true }, -1);
    });

    /* ---- lo que hace sombra ---- */
    PUEBLO.forEach(function (o) { var e = o.e; sombra('calle', e.x, e.x + e.w, BASE + 9, BASE - e.top + 24); });
    sombra('calle', 5060, 5290, BASE + 8, BASE - 548); sombra('calle', 5380, 5680, BASE, BASE - 452); sombra('calle', 9390, 9760, BASE + 44, 250);
    sombra('calle', 6416, 6424, 690, 190, 'palo'); sombra('calle', 5860, 5950, 702, 92); sombra('calle', 6000, 6090, 694, 84); sombra('calle', 1885, 2005, 772, 130); sombra('calle', 10320, 10450, BASE + 70, 170);
    sombra('calle', 1760, 1800, BASE - 1, 70); sombra('calle', 2340, 2370, BASE + 2, 80); sombra('calle', 2885, 2925, BASE + 2, 78); sombra('calle', 8040, 8160, BASE, 126);
    for (var px = -300; px < 7600 + 600; px += 160) sombra('llanura', px - 3, px + 3, VIA + 2, 104, 'palo');
    sombra('llanura', 2797, 2984, VIA + 2, 150); sombra('llanura', 3166, 3214, VIA + 6, 170);
    A.sembrar(17); for (var ex2 = -300; ex2 < 7600 + 600; ex2 += 70 + A.azar() * 160) { var ey2 = 584 + A.azar() * 34, es2 = 0.45 + A.azar() * 0.45; sombra('llanura', ex2 - 22 * es2, ex2 + 22 * es2, ey2, 48 * es2, 'copa'); }

    /* ---- el primer plano (capa cerca): saguaros, vallas, cantos, yucas ---- */
    var CERCA = LARGO * 1.3 + 2600;
    for (var sx = 200, k2 = 0; sx < CERCA; sx += 700 + U._h(k2) * 900, k2++) (function (sx, k2) {
      var tipo = k2 % 4;
      if (tipo === 0) { var hs = 260 + (k2 % 3) * 30; sombra('cerca', sx - hs * 0.06, sx + hs * 0.06, 930, hs * 0.9); }
      if (tipo === 3) sombra('cerca', 160 + sx, 180 + sx, 940, 200);
      pieza('cerca', sx - 260, sx + 260, function (c, P) {
        if (tipo === 0) { A.saguaro(c, sx, 930, 260 + (k2 % 3) * 30, P); A.mata(c, sx + 90, 912, 1.6, P); }
        else if (tipo === 1) { A.canto(c, sx, 920, 190, 70, P, k2); A.canto(c, sx + 140, 930, 90, 34, P, k2 + 1); A.yuca(c, sx - 120, 930, 1.4, P); }
        else if (tipo === 2) { A.valla(c, [[sx - 240, 930], [sx - 140, 918], [sx - 40, 908], [sx + 60, 900], [sx + 160, 894], [sx + 260, 890]], 84, P, [0.3, 0.62, 0.9]); A.cactusBarril(c, sx + 40, 930, 1.3, P); }
        else { A.chumbera2(c, sx, 920, 1.2, P); A.mata(c, sx - 90, 920, 1.8, P); A.saguaro(c, sx + 170, 940, 220, P); }
      });
    })(sx, k2);
    MATAS_CERCA.forEach(function (q) { pieza('cerca', q[0] - 50, q[0] + 50, function (c, P) { A.mata(c, q[0], q[1], 1.4 + q[2], P); }); });
  }

  /* ================================================================== la hora y las paletas */
  var RITMO = [[0, 8], [5, 14], [7, 9], [15, 14], [20, 8]];   // segundos reales por hora (la tarde va despacio)
  PA.hora = 10.5; PA.velocidad = 1;
  function segPorHora(h) { var s = RITMO[0][1]; for (var i = 0; i < RITMO.length; i++) if (h >= RITMO[i][0]) s = RITMO[i][1]; return s; }
  var HORARIO = [[7.2, 'dia'], [15.6, 'dia', 'ocaso'], [17.4, 'ocaso'], [19.2, 'ocaso', 'noche'], [20.6, 'noche'], [5, 'noche', 'ocaso'], [6.2, 'ocaso', 'dia']];
  PA.mezcla = function (h) {
    h = h == null ? PA.hora : h;
    var hh = h < 5 ? h + 24 : h, lista = HORARIO.map(function (q) { return [q[0] < 5 ? q[0] + 24 : q[0]].concat(q.slice(1)); });
    lista.sort(function (x, y) { return x[0] - y[0]; });
    var i = lista.length - 1; for (var j = 0; j < lista.length; j++) if (hh >= lista[j][0]) i = j;
    var q = lista[i], fin = lista[(i + 1) % lista.length][0] + (i + 1 >= lista.length ? 24 : 0);
    if (!q[2]) return { a: q[1], b: null, k: 0 };
    return { a: q[1], b: q[2], k: U.suave(U.tramo(hh, q[0], fin)) };
  };
  PA.peso = function (nombre, h) { var m = PA.mezcla(h); return (m.a === nombre ? 1 - m.k : 0) + (m.b === nombre ? m.k : 0); };
  PA.franja = function (h) { h = h == null ? PA.hora : h; return h >= 7.2 && h < 15.6 ? 'día' : h >= 15.6 && h < 19.2 ? 'atardecer' : h >= 19.2 && h < 20.6 ? 'anochecer' : h >= 5 && h < 7.2 ? 'amanecer' : 'noche'; };
  function siguiente(h) { var m = PA.mezcla(h); if (m.b) return m.b; for (var d = 0.2; d < 6; d += 0.2) { var n = PA.mezcla((h + d) % 24); if (n.a !== m.a) return n.a; if (n.b && n.b !== m.a) return n.b; } return m.a; }
  // la paleta mezclada (para lo que se pinta en vivo)
  var mezclada = {}, mezclaClave = '';
  function hexDe(v) { var m = /^rgb\((\d+),(\d+),(\d+)\)$/.exec(v); return m ? '#' + [m[1], m[2], m[3]].map(function (x) { return ('0' + (+x).toString(16)).slice(-2); }).join('') : v; }
  function mezclaValor(va, vb, k) {
    if (typeof va === 'string' && /^#[0-9a-f]{6}$/i.test(va) && typeof vb === 'string' && /^#[0-9a-f]{6}$/i.test(vb)) return hexDe(A.mezcla(va, vb, k));
    if (Array.isArray(va) && Array.isArray(vb)) {
      if (va.length !== vb.length) { var n = Math.max(va.length, vb.length); va = remuestrea(va, n); vb = remuestrea(vb, n); }   // (Pau 02/11: el cielo del atardecer tiene 5 colores y el de la noche 4; al mezclarlos faltaba uno y la pantalla se quedaba marrón)
      return va.map(function (x, i) { return mezclaValor(x, vb[i], k); });
    }
    return k > 0.5 ? vb : va;
  }
  function remuestrea(arr, n) {
    if (arr.length === n || typeof arr[0] !== 'string' || arr[0][0] !== '#') return arr.length === n ? arr : arr.concat(new Array(n - arr.length).fill(arr[arr.length - 1]));
    var out = []; for (var i = 0; i < n; i++) { var t = i / (n - 1) * (arr.length - 1), j = Math.min(arr.length - 2, Math.floor(t)); out.push(hexDe(A.mezcla(arr[j], arr[j + 1], t - j))); }
    return out;
  }
  PA.paleta = function () {
    var m = PA.mezcla(), clave = m.a + (m.b || '') + Math.round(m.k * 40);
    if (clave === mezclaClave) return mezclada;
    mezclaClave = clave; var a = PAL[m.a], b = m.b ? PAL[m.b] : null, out = {};
    for (var q in a) out[q] = b ? mezclaValor(a[q], b[q], m.k) : a[q];
    mezclada = out; return out;
  };

  /* ================================================================== las teselas */
  var cache = {}, pxGuardados = 0, sprites = {};
  var LIMITE = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ? 26e6 : 40e6;
  function resCapa(capa) { return Math.min(2, E.dpr * capa.res); }
  function clave(capa, i, pal) { return capa.id + '|' + i + '|' + pal + '|' + (conTinta ? 't' : 's'); }
  function pintarTesela(capa, i, pal) {
    var d = resCapa(capa), H = E.H, u = E.u, w = Math.ceil(TW * d), h = Math.ceil((capa.y1 - capa.y0) * H * d);
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var c = cv.getContext('2d'), P = PAL[pal];
    c.setTransform(d, 0, 0, d, -i * TW * d, -capa.y0 * H * d); c.lineJoin = 'round'; c.lineCap = 'round';
    var x0 = i * TW, x1 = x0 + TW, t0 = x0 / u, t1 = x1 / u;
    c.beginPath(); c.rect(x0, capa.y0 * H, TW, (capa.y1 - capa.y0) * H); c.clip();
    A.tinta(tintaDe(pal));
    for (var k = 0; k < capa.els.length; k++) {
      var el = capa.els[k];
      if (el.l1 < t0 || el.l0 > t1) continue;
      c.save(); try { el.f(c, P, u, t0, t1); } catch (err) { console.error(err); } c.restore();
    }
    var T = { c: cv, px: w * h, usado: E.t };
    var k2 = clave(capa, i, pal); if (cache[k2]) pxGuardados -= cache[k2].px;
    cache[k2] = T; pxGuardados += T.px;
    return T;
  }
  function rango(capa, margen) { var base = (E.W / 2 + E.camX) * capa.p - E.W / 2; return [Math.floor((base - (margen || 0)) / TW), Math.floor((base + E.W + (margen || 0)) / TW)]; }
  function tieneContenido(capa, i) { var t0 = i * TW / E.u, t1 = (i + 1) * TW / E.u; for (var k = 0; k < capa.els.length; k++) if (!(capa.els[k].l1 < t0 || capa.els[k].l0 > t1)) return true; return false; }
  function liberar() {
    if (pxGuardados <= LIMITE) return;
    var lista = []; for (var q in cache) lista.push([q, cache[q]]);
    lista.sort(function (a, b) { return a[1].usado - b[1].usado; });
    for (var j = 0; j < lista.length && pxGuardados > LIMITE * 0.85; j++) { if (E.t - lista[j][1].usado < 400) break; pxGuardados -= lista[j][1].px; delete cache[lista[j][0]]; }
  }
  PA.olvidar = function () { cache = {}; pxGuardados = 0; mezclaClave = ''; sprites = {}; };
  var pendientes = 0;
  function tareas() {
    var m = PA.mezcla(), pals = [m.a], lista = [];
    if (m.b) pals.push(m.b);
    var sig = siguiente(PA.hora); if (pals.indexOf(sig) < 0) pals.push(sig);
    var dir = E.velX > 0.05 || (E.camObj != null && E.camObj > E.camX) ? 1 : E.velX < -0.05 || (E.camObj != null && E.camObj < E.camX) ? -1 : 0;
    pals.forEach(function (pal, pi) {
      CAPAS.forEach(function (capa) {
        var vr = rango(capa, 0), cr = rango(capa, E.W * 0.9);
        for (var i = cr[0]; i <= cr[1]; i++) {
          if (cache[clave(capa, i, pal)] || !tieneContenido(capa, i)) continue;
          var visible = i >= vr[0] && i <= vr[1], dist = visible ? 0 : (i < vr[0] ? vr[0] - i : i - vr[1]);
          lista.push({ capa: capa, i: i, pal: pal, prio: (visible ? 0 : 10 + dist * 2 - (dir && (i - vr[0]) * dir > 0 ? 1 : 0)) + pi * 4 + (pi === 2 ? 20 : 0) });
        }
      });
    });
    lista.sort(function (a, b) { return a.prio - b.prio; });
    return lista;
  }
  function taller() {
    var presupuesto = E.bloqueado ? 40 : (E.camObj != null || Math.abs(E.velX) > 0.02) ? 4 : 10;
    var t0 = performance.now(), lista = tareas(), j = 0;
    pendientes = lista.filter(function (x) { return x.prio < 30; }).length;
    while (j < lista.length && performance.now() - t0 < presupuesto) { var tt = lista[j++]; pintarTesela(tt.capa, tt.i, tt.pal).usado = E.t; E.vaciar(); }
    liberar();
  }
  PA.ocupado = function () { return pendientes > 0; };
  PA._taller = { tareas: tareas, cache: function () { return cache; }, px: function () { return pxGuardados; }, capas: CAPAS };
  PA.preparar = function () {
    var m = PA.mezcla();
    [m.a].concat(m.b ? [m.b] : []).forEach(function (pal) { CAPAS.forEach(function (capa) { var vr = rango(capa, 0); for (var i = vr[0]; i <= vr[1]; i++) if (!cache[clave(capa, i, pal)] && tieneContenido(capa, i)) pintarTesela(capa, i, pal); }); });
    E.vaciar();
  };

  /* ================================================================== lo vivo */
  // el sol (sale por la izquierda, se pone por la derecha) y la luna
  PA.sol = function (h) { h = h == null ? PA.hora : h; var s = (h - 6.4) / 13; var a = Math.sin(Math.PI * U.clamp(s, -0.1, 1.1)); return { x: E.W * (0.12 + 0.76 * s), y: E.H * (HOR / K - (a < 0 ? a : Math.pow(a, 1.4)) * 0.5), r: E.H * 0.05, visible: s > -0.06 && s < 1.06, e: a }; };
  PA.luna = function (h) { h = h == null ? PA.hora : h; var s = ((h - 19.8 + 24) % 24) / 10; return { x: E.W * (0.2 + 0.62 * s), y: E.H * (HOR / K - Math.sin(Math.PI * U.clamp(s, -0.1, 1.1)) * 0.5), r: E.H * 0.032, visible: s > -0.05 && s < 1.05 }; };
  var estrellas = []; (function () { var r2 = U.azar(9); for (var i = 0; i < 420; i++) estrellas.push({ x: r2(), y: Math.pow(r2(), 1.3) * 0.58, s: r2() < 0.06 ? 2.2 : 1.1, f: r2() * TAU, v: 0.6 + r2() * 1.8 }); })();
  // las nubes: un sprite por paleta y por tinta, que cruzan despacio
  var NUBES = [[0.08, 0.17, 1.5], [0.36, 0.11, 1.0], [0.6, 0.2, 1.35], [0.86, 0.1, 0.95], [0.24, 0.29, 0.7], [0.74, 0.31, 0.6]];
  function spriteNube(pal, k) {
    var id = 'nube' + pal + k + conTinta; if (sprites[id]) return sprites[id];
    var d = Math.min(2, E.dpr), w = 380 * k, h = 190 * k, cv = document.createElement('canvas'); cv.width = Math.ceil(w * E.u / K * d); cv.height = Math.ceil(h * E.u / K * d);
    var c = cv.getContext('2d'); c.scale(E.u / K * d, E.u / K * d); A.tinta(tintaDe(pal)); A.nubeCel(c, w / 2, h * 0.62, k, PAL[pal]);
    return (sprites[id] = { c: cv, w: w * E.u / K, h: h * E.u / K });
  }
  // el tren: un sprite por paleta (se pinta una vez) y su recorrido: llega por la derecha, para en la estación y se va
  var CICLO_TREN = 80000;
  function spriteTren(pal) {
    var id = 'tren' + pal + conTinta; if (sprites[id]) return sprites[id];
    var d = Math.min(2, E.dpr), k = E.u / K * 0.6 / 0.6, w = 660, h = 140, cv = document.createElement('canvas'); cv.width = Math.ceil(w * k * d); cv.height = Math.ceil(h * k * d);
    var c = cv.getContext('2d'); c.scale(k * d, k * d); c.translate(10, -(VIA - 130)); c.lineJoin = 'round'; c.lineCap = 'round'; A.tinta(tintaDe(pal)); A.trenDetallado(c, 0, PAL[pal], { sinRuedas: true });
    return (sprites[id] = { c: cv, w: w * k, h: h * k });
  }
  PA.tren = function (t) {   // x de la locomotora en la capa de la llanura (lámina), o null; parado en la estación
    t = (t == null ? E.t : t) % CICLO_TREN; var EST = 2900, DE = 8200, A0 = 0, A1 = 20000, P0 = 30000, P1 = 46000;
    if (t < A0 || t > P1) return null;
    if (t < A1) return { x: U.lerp(DE, EST, U.sale(U.tramo(t, A0, A1))), v: 1 - U.tramo(t, A0, A1) };
    if (t < P0) return { x: EST, v: 0, parado: true };
    return { x: U.lerp(EST, -900, U.entra(U.tramo(t, P0, P1))), v: U.tramo(t, P0, P1) };
  };
  // el humo: una bocanada cada cuarto de vuelta de las motrices (2π·27/4 ≈ 42 de lámina recorridos); parado, bocanadas
  // lentas que suben rectas. Cada bocanada es un racimo de bolas que crece, sube, se frena y se aclara.
  var humo = [], ultX = null, ultHumo = 0, rh = U.azar(4);
  function bocanada(x, grande) {
    var sub = []; for (var i = 0; i < 7; i++) { var a = -Math.PI / 2 + (rh() - 0.5) * 3.4, d = i ? 0.42 + rh() * 0.4 : 0; sub.push([Math.cos(a) * d, Math.sin(a) * d * 0.75, i ? 0.5 + rh() * 0.38 : 1]); }
    humo.push({ x: x, y: VIA - 124, t: E.t, r0: grande ? 9 : 6, crece: grande ? 52 : 28, vx: grande ? 40 : 6, vy: grande ? -34 : -26, vida: grande ? 6200 : 4600, sub: sub });
  }
  function moverHumo(dt) {
    var tr = E.escena && E.escena.s.sinTren ? null : PA.tren();
    if (tr) {
      if (ultX == null || Math.abs(ultX - tr.x) > 400) ultX = tr.x;
      if (!tr.parado && Math.abs(tr.x - ultX) >= 21) { ultX = tr.x; bocanada(tr.x + 51, true); }   // dos bocanadas por cada golpe de vapor, para que el penacho no tenga huecos
      else if (tr.parado && E.t - ultHumo > 900) { ultHumo = E.t; bocanada(tr.x + 51, false); }
    } else ultX = null;
    for (var i = humo.length - 1; i >= 0; i--) {
      var q = humo[i], k = (E.t - q.t) / q.vida; if (k > 1) { humo.splice(i, 1); continue; }
      q.x += q.vx * dt / 1000; q.y += q.vy * dt / 1000; q.vx *= Math.pow(0.996, dt / 16); q.vy *= Math.pow(0.988, dt / 16);
    }
  }
  function pintarHumo(ctx, P) {
    for (var i = 0; i < humo.length; i++) {
      var q = humo[i], k = (E.t - q.t) / q.vida, r = q.r0 + q.crece * Math.sqrt(k), a = Math.pow(1 - k, 1.6) * 0.95;
      var u = new Path2D(); q.sub.forEach(function (b) { u.addPath(A.circulo(q.x + b[0] * r, q.y + b[1] * r, r * b[2])); });
      // la bocanada nueva sale oscura (humo de leña) y se aclara al subir
      var oscuro = 0.38 * (1 - Math.min(1, k * 3)), tonos = P.humo.map(function (c) { return hexDe(A.mezcla(c, '#4a4640', oscuro)); });
      ctx.globalAlpha = a; A.cel(ctx, u, tonos, -P.luz * r * 0.16, -r * 0.2);
    }
    ctx.globalAlpha = 1;
  }
  // los buitres que dan vueltas
  var buitres = [{ cx: 0.3, cy: 0.2, r: 0.06, f: 0, s: 0.7 }, { cx: 0.32, cy: 0.22, r: 0.05, f: 2.2, s: 0.55 }, { cx: 0.7, cy: 0.16, r: 0.07, f: 4, s: 0.6 }];
  // la planta rodadora: cruza la calle con el viento, rodando
  var RODA = { periodo: 20000 };
  // dónde está la rodadora en pantalla (cruza la pantalla, no el mundo: rueda con el viento delante de la cámara), o null.
  // Mientras alguien la tiene agarrada (secreto 05), está donde diga PA.rodadoraEn.
  PA.rodadoraEn = null;
  PA.rodadora = function (t) {
    if (t == null && PA.rodadoraEn) return PA.rodadoraEn;
    t = t == null ? E.t : t; var kr = (t % RODA.periodo) / 9000; if (kr >= 1) return null;
    var k = E.u / K; return { x: -80 + kr * (E.W + 160), y: (BASE + 80 - Math.abs(Math.sin(kr * 18)) * 26) * k, r: 32 * k, kr: kr };
  };
  PA.rodadoraOculta = false;
  // la capa a pantalla: el desplazamiento y la escala de una capa (para pintar en vivo en lámina)
  function enCapa(ctx, p) { var k = E.u / K; ctx.translate(E.W / 2 - (E.W / 2 + E.camX) * p, 0); ctx.scale(k, k); }

  // la luz que manda: el sol, o de noche la luna; x en pantalla, altura (0 en el horizonte, 1 arriba) e intensidad
  PA.luzActual = function () {
    var so = PA.sol(), lu = PA.luna(), Hh = E.H * HOR / K;
    var es = U.clamp((Hh - so.y) / (E.H * 0.5), 0, 1), is = so.visible ? U.suave(U.tramo(es, 0, 0.06)) : 0;
    var em = U.clamp((Hh - lu.y) / (E.H * 0.5), 0, 1), im = lu.visible ? U.suave(U.tramo(em, 0, 0.08)) * PA.peso('noche') * 0.75 : 0;
    return is >= im ? { x: so.x, e: es, i: is, sol: true } : { x: lu.x, e: em, i: im, sol: false };
  };
  var MAXDY = { calle: 150, llanura: 50, cerca: 40 };
  function sombrasVivas(ctx, capa, L, P) {
    if (L.i < 0.02) return;
    var lista = SOMBRAS[capa.id], k = E.u / K, camp = (E.W / 2 + E.camX) * capa.p, u2 = new Path2D(), hay = false;
    var largo = 0.18 + Math.pow(1 - L.e, 1.6) * 1.9;
    for (var i = 0; i < lista.length; i++) {
      var s = lista[i], xc = (s.x0 + s.x1) / 2, xs = E.W / 2 + xc * k - camp;
      if (xs < -s.h * k * 3 || xs > E.W + s.h * k * 3) continue;
      var dir = U.clamp((xs - L.x) / (E.W * 0.55), -1.6, 1.6), dx = dir * s.h * largo * 0.55, dy = Math.min(MAXDY[capa.id], s.h * (0.1 + (1 - L.e) * 0.3));
      if (s.forma === 'copa') { u2.addPath(A.elipse(xc + dx * 0.55, s.y + dy * 0.35, (s.x1 - s.x0) * 0.7 + Math.abs(dx) * 0.25, 2 + dy * 0.18)); }
      else if (s.forma === 'palo') { u2.addPath(A.poli([[s.x0, s.y], [s.x1, s.y], [s.x1 + dx, s.y + dy], [s.x0 + dx, s.y + dy]])); }
      else u2.addPath(A.poli([[s.x0, s.y], [s.x1, s.y], [s.x1 + dx, s.y + dy], [s.x0 + dx, s.y + dy]]));
      hay = true;
    }
    if (!hay) return;
    var noche = PA.peso('noche'), a = L.i * (L.sol ? 0.3 : 0.32);
    ctx.save(); ctx.translate(E.W / 2 - camp, 0); ctx.scale(k, k);
    ctx.fillStyle = noche > 0.5 ? 'rgba(4,6,22,' + a.toFixed(3) + ')' : 'rgba(110,52,24,' + a.toFixed(3) + ')'; ctx.fill(u2);
    ctx.restore();
  }

  PA.actualizar = function (dt) {
    if (!E.escena || !E.escena.s.detenerDia) PA.hora = (PA.hora + dt / 1000 / segPorHora(PA.hora) * PA.velocidad) % 24;
    moverHumo(dt);
    taller();
  };
  function capaTeselas(ctx, capa, m) {
    var vr = rango(capa, 0), bandaY = capa.y0 * E.H, bandaH = (capa.y1 - capa.y0) * E.H;
    for (var i = vr[0]; i <= vr[1]; i++) {
      if (!tieneContenido(capa, i)) continue;
      var x = E.W / 2 + i * TW - (E.W / 2 + E.camX) * capa.p;
      var ta = cache[clave(capa, i, m.a)], tb = m.b && m.k > 0.004 ? cache[clave(capa, i, m.b)] : null;
      if (!ta && !tb) ta = pintarTesela(capa, i, m.a);
      if (ta) { ta.usado = E.t; ctx.globalAlpha = 1; ctx.drawImage(ta.c, x, bandaY, TW, bandaH); }
      if (tb) { tb.usado = E.t; ctx.globalAlpha = ta ? m.k : 1; ctx.drawImage(tb.c, x, bandaY, TW, bandaH); }
    }
    ctx.globalAlpha = 1;
  }
  function conAmbas(ctx, m, f) { ctx.globalAlpha = 1; f(m.a); if (m.b && m.k > 0.004) { ctx.globalAlpha = m.k; f(m.b); } ctx.globalAlpha = 1; }

  PA.dibujar = function (ctx, s, t) {
    var W = E.W, H = E.H, m = PA.mezcla(), P = PA.paleta(), noche = PA.peso('noche'), k = E.u / K, tt = E.t / 1000;
    A.tinta(conTinta ? (noche > 0.5 ? TINTA_NOCHE : TINTA_DIA) : null);
    /* el cielo */
    var g = ctx.createLinearGradient(0, 0, 0, H * HOR / K); P.cielo.forEach(function (q, i) { g.addColorStop(i / (P.cielo.length - 1), q); }); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * HOR / K + 2);
    if (noche > 0.01) for (var i = 0; i < estrellas.length; i++) { var st = estrellas[i], a = noche * (0.55 + 0.45 * Math.sin(tt * st.v + st.f)); ctx.fillStyle = 'rgba(240,238,255,' + a.toFixed(3) + ')'; ctx.fillRect(((st.x * W - E.camX * 0.02) % W + W) % W, st.y * H, st.s, st.s); }
    var so = PA.sol();
    if (so.visible && !(s && s.sinSol)) { var gs = ctx.createRadialGradient(so.x, so.y, so.r * 0.5, so.x, so.y, so.r * 5); gs.addColorStop(0, 'rgba(255,240,200,.55)'); gs.addColorStop(1, 'rgba(255,220,160,0)'); ctx.fillStyle = gs; ctx.fillRect(so.x - so.r * 5, so.y - so.r * 5, so.r * 10, so.r * 10); ctx.fillStyle = so.e < 0.25 ? '#ffd6a0' : '#fff6dc'; ctx.beginPath(); ctx.arc(so.x, so.y, so.r, 0, TAU); ctx.fill(); }
    var lu = PA.luna();
    if (lu.visible && noche > 0.05) { ctx.globalAlpha = noche; var gl = ctx.createRadialGradient(lu.x, lu.y, lu.r, lu.x, lu.y, lu.r * 6); gl.addColorStop(0, 'rgba(210,220,255,.35)'); gl.addColorStop(1, 'rgba(210,220,255,0)'); ctx.fillStyle = gl; ctx.fillRect(lu.x - lu.r * 6, lu.y - lu.r * 6, lu.r * 12, lu.r * 12); ctx.fillStyle = '#f2f0e4'; ctx.beginPath(); ctx.arc(lu.x, lu.y, lu.r, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(150,150,165,.45)'; [[-0.3, -0.2, 0.25], [0.3, 0.2, 0.18], [-0.1, 0.4, 0.14]].forEach(function (q) { ctx.beginPath(); ctx.arc(lu.x + q[0] * lu.r, lu.y + q[1] * lu.r, q[2] * lu.r, 0, TAU); ctx.fill(); }); ctx.globalAlpha = 1; }
    NUBES.forEach(function (q) { conAmbas(ctx, m, function (pal) { var sp = spriteNube(pal, q[2]), x = ((q[0] * (W + sp.w) + tt * 6 * q[2] - E.camX * 0.04) % (W + sp.w) + W + sp.w) % (W + sp.w) - sp.w; ctx.drawImage(sp.c, x, q[1] * H, sp.w, sp.h); }); });
    if (s && s.cielo) s.cielo(ctx, t);
    buitres.forEach(function (b) { var a2 = tt * 0.35 + b.f; A.buitre(ctx, (b.cx + Math.cos(a2) * b.r) * W - E.camX * 0.1 % W, (b.cy + Math.sin(a2) * b.r * 0.4) * H, b.s * k * 1.6, P.buitre); });
    /* el suelo y la calima del horizonte */
    var gsu = ctx.createLinearGradient(0, H * HOR / K, 0, H); P.suelo.forEach(function (q, i) { gsu.addColorStop(i / (P.suelo.length - 1), q); }); ctx.fillStyle = gsu; ctx.fillRect(0, H * HOR / K, W, H);
    /* las capas */
    capaTeselas(ctx, CAPA.sierra, m);
    var gh = ctx.createLinearGradient(0, H * (HOR - 30) / K, 0, H * (HOR + 30) / K); gh.addColorStop(0, 'rgba(255,255,255,0)'); gh.addColorStop(0.5, P.calima); gh.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gh; ctx.fillRect(0, H * (HOR - 30) / K, W, H * 60 / K);
    capaTeselas(ctx, CAPA.mesas, m);
    if (s && s.detras) s.detras(ctx, t);
    // lo de delante (la vía, el pueblo y el primer plano): una escena puede apagarlo con s.frontal(t) (el final se queda
    // solo con el horizonte); a medias se pinta aparte y se funde
    var opF = s && s.frontal ? U.clamp(s.frontal(t), 0, 1) : 1;
    if (opF > 0.002) {
      var cF = opF < 0.998 ? lienzoAparte(ctx) : ctx;
      (function (ctx) {
      capaTeselas(ctx, CAPA.llanura, m);
      var LUZ = PA.luzActual(); sombrasVivas(ctx, CAPA.llanura, LUZ, P);
      // el tren y su humo (en la capa de la llanura)
      var tr = PA.tren();
      ctx.save(); enCapa(ctx, CAPA.llanura.p);
      pintarHumo(ctx, P);
      ctx.restore();
      if (s && s.sinTren) tr = null;
      if (tr) { var xs = E.W / 2 + (tr.x - 10) * k - (E.W / 2 + E.camX) * CAPA.llanura.p; if (xs < W + 20 && xs > -700 * k) {
        conAmbas(ctx, m, function (pal) { var sp = spriteTren(pal); ctx.drawImage(sp.c, xs, (VIA - 130) * k, sp.w, sp.h); });
        // las ruedas y las bielas, en vivo: giran lo que avanza el tren (rodar sin deslizar: ángulo = recorrido / radio)
        ctx.save(); enCapa(ctx, CAPA.llanura.p); A.tinta(conTinta ? (noche > 0.5 ? TINTA_NOCHE : TINTA_DIA) : null); A.ruedasTren(ctx, tr.x, P, tr.x); ctx.restore();
      } }
      if (s && s.llanura) s.llanura(ctx, t);
      capaTeselas(ctx, CAPA.calle, m);
      sombrasVivas(ctx, CAPA.calle, LUZ, P);
      // vivo en la calle: el molino del rancho, la hoguera del campamento y la rodadora
      ctx.save(); enCapa(ctx, 1);
      var mx = 6420, my = 690, ang = tt * (1.2 + E.viento * 4);
      ctx.strokeStyle = P.hierro; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(mx - 20, my); ctx.lineTo(mx - 3, my - 150); ctx.moveTo(mx + 20, my); ctx.lineTo(mx + 3, my - 150); for (var r3 = 1; r3 < 5; r3++) { var ya = my - r3 * 30, yb = my - (r3 - 1) * 30, wa = 20 - r3 * 3.4, wb = 20 - (r3 - 1) * 3.4; ctx.moveTo(mx - wb, yb); ctx.lineTo(mx + wa, ya); ctx.moveTo(mx + wb, yb); ctx.lineTo(mx - wa, ya); } ctx.stroke();
      var cx = mx - 4, cy = my - 156; ctx.lineWidth = 2; ctx.beginPath(); for (var b2 = 0; b2 < 18; b2++) { var a3 = ang + b2 / 18 * TAU; ctx.moveTo(cx + Math.cos(a3) * 8, cy + Math.sin(a3) * 8); ctx.lineTo(cx + Math.cos(a3) * 34, cy + Math.sin(a3) * 34); } ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 34, 0, TAU); ctx.stroke();
      ctx.fillStyle = P.hierro; ctx.beginPath(); ctx.moveTo(cx + 6, cy - 2); ctx.lineTo(cx + 46, cy - 6); ctx.lineTo(cx + 58, cy - 22); ctx.lineTo(cx + 60, cy + 6); ctx.lineTo(cx + 46, cy + 2); ctx.lineTo(cx + 6, cy + 3); ctx.fill(); ctx.beginPath(); ctx.arc(cx, cy, 6, 0, TAU); ctx.fill();
      // la hoguera: llamas que bailan y su luz (más fuerte de noche)
      var fx = 9900, fy = BASE + 70, nf = 0.35 + noche * 0.65;
      // (Pau 02/11: la luz iluminaba todo el paisaje; ahora solo el suelo alrededor y un halo pequeño)
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(fx, fy + 8); ctx.scale(1, 0.24);
      var gfu = ctx.createRadialGradient(0, 0, 6, 0, 0, 230); gfu.addColorStop(0, 'rgba(255,150,60,' + (0.55 * nf).toFixed(3) + ')'); gfu.addColorStop(0.5, 'rgba(255,120,40,' + (0.18 * nf).toFixed(3) + ')'); gfu.addColorStop(1, 'rgba(255,110,40,0)'); ctx.fillStyle = gfu; ctx.fillRect(-230, -230, 460, 460); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; var gh2 = ctx.createRadialGradient(fx, fy - 30, 4, fx, fy - 30, 70); gh2.addColorStop(0, 'rgba(255,170,80,' + (0.4 * nf).toFixed(3) + ')'); gh2.addColorStop(1, 'rgba(255,140,60,0)'); ctx.fillStyle = gh2; ctx.fillRect(fx - 70, fy - 100, 140, 140); ctx.restore();
      [[1, '#ff7a2a'], [0.72, '#ffb04a'], [0.42, '#fff0b0']].forEach(function (q, j) { var h2 = (70 + Math.sin(tt * 9 + j) * 8) * q[0], w2 = 22 * q[0]; ctx.fillStyle = q[1]; ctx.beginPath(); ctx.moveTo(fx - w2, fy); ctx.quadraticCurveTo(fx - w2 * 1.2, fy - h2 * 0.5, fx + Math.sin(tt * 5 + j) * 6, fy - h2); ctx.quadraticCurveTo(fx + w2 * 1.1, fy - h2 * 0.5, fx + w2, fy); ctx.closePath(); ctx.fill(); });
      // la rodadora: cada 20 s cruza la calle de izquierda a derecha, rodando y dando botes
      var ro = PA.rodadoraOculta ? null : PA.rodadora(); if (ro) { var kr = ro.kr, rx = E.lDe(ro.x) * K, ry = ro.y / k; ctx.save(); ctx.translate(rx, ry); ctx.rotate(kr * 26); ctx.fillStyle = 'rgba(90,60,30,.18)'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.fill(); var rd = A.rodadora(0, 0, 32); ctx.strokeStyle = A.mezcla(P.rodadora, '#000000', 0.3); ctx.lineWidth = 1.4; ctx.stroke(rd); ctx.strokeStyle = P.rodadora; ctx.lineWidth = 1; ctx.stroke(rd); ctx.restore(); }
      ctx.restore();
      if (PA.companero) PA.companero(ctx, t);   // el caballo que te acompaña (js/companero.js)
      if (s && s.calle) s.calle(ctx, t);
      capaTeselas(ctx, CAPA.cerca, m);
      sombrasVivas(ctx, CAPA.cerca, LUZ, P);
      })(cF);
      if (cF !== ctx) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = opF; ctx.drawImage(cF.canvas, 0, 0); ctx.restore(); }
    }
    // la viñeta
    var v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.55, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, P.vineta); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    // la entrada: la escena aparece desde negro
    if (entrada) { var ke = U.tramo(E.t - entrada.t0, 0, 1600); ctx.fillStyle = 'rgba(10,6,4,' + (1 - U.suave(ke)).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); if (ke >= 1) entrada = null; }
  };
  var aparte = null;
  function lienzoAparte(ctx) {
    var w = ctx.canvas.width, h = ctx.canvas.height;
    if (!aparte) aparte = document.createElement('canvas').getContext('2d');
    if (aparte.canvas.width !== w || aparte.canvas.height !== h) { aparte.canvas.width = w; aparte.canvas.height = h; }
    aparte.setTransform(1, 0, 0, 1, 0, 0); aparte.clearRect(0, 0, w, h); aparte.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
    aparte.globalAlpha = 1; aparte.globalCompositeOperation = 'source-over'; aparte.lineJoin = 'round'; aparte.lineCap = 'round';
    return aparte;
  }
  var entrada = null;
  PA.imprimir = function () { entrada = { t0: E.t }; };
  PA.dibujarImpresion = function () {};
  PA.imprimiendo = function () { return !!entrada; };

  E.en('tamano', function () { PA.olvidar(); });
  construir();
})();
