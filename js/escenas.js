/* Vaccaria Incognita · piezas de las escenas
   Lo que dibujan los secretos en vivo, con el mismo pintor de planos de luz (cel) que el mundo: el caballo al galope con
   su jinete, el bisonte, los fogonazos y el humo de pólvora, la planta rodadora suelta, los rótulos y la viñeta de papel.
   Casi todo dibuja en unidades de lámina (900 = la altura de la pantalla) dentro de una capa: S.enCapa(c, p). */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, A = VA.arte, PA = VA.paisaje;
  var TAU = Math.PI * 2, K = 900, ACENTO = '#f0a03a', CREMA = '#f2e3c6', CUERO = 'rgba(38,22,14,.86)';
  var S = VA.esc = { ACENTO: ACENTO, CREMA: CREMA, K: K, P: { llanura: 0.6, calle: 1, cerca: 1.3 } };

  /* ---------- coordenadas: de lámina de una capa a pantalla y al revés ---------- */
  S.k = function () { return E.u / K; };
  S.enCapa = function (c, p) { var k = E.u / K; c.translate(E.W / 2 - (E.W / 2 + E.camX) * p, 0); c.scale(k, k); };
  S.pant = function (x, y, p) { var k = E.u / K; return [E.W / 2 + x * k - (E.W / 2 + E.camX) * (p == null ? 1 : p), y * k]; };
  S.lam = function (sx, sy, p) { var k = E.u / K; return [(sx - E.W / 2 + (E.W / 2 + E.camX) * (p == null ? 1 : p)) / k, sy / k]; };
  // la lámina que se ve en pantalla en una capa (para repartir cosas por el ancho de la vista)
  S.vista = function (p) { var a = S.lam(0, 0, p)[0], b = S.lam(E.W, 0, p)[0]; return [a, b]; };

  // un dibujo pesado se pinta una vez en un lienzo aparte (en lámina) y luego solo se copia
  S.sprite = function (x0, y0, w, h, f) {
    var d = Math.min(2, E.dpr), k = E.u / K, cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(w * k * d)); cv.height = Math.max(1, Math.ceil(h * k * d));
    var c = cv.getContext('2d'); c.scale(k * d, k * d); c.translate(-x0, -y0); c.lineJoin = 'round'; c.lineCap = 'round';
    f(c);
    return { c: cv, x0: x0, y0: y0, w: w, h: h };
  };
  S.pegar = function (c, sp, dx, dy) { c.drawImage(sp.c, sp.x0 + (dx || 0), sp.y0 + (dy || 0), sp.w, sp.h); };

  // un color de la escena, apagado hacia el azul de la luna cuando es de noche
  S.dePaleta = function (hex) { var n = PA.peso('noche'); return n > 0.02 ? A.mezcla(hex, '#1a2140', 0.62 * n) : hex; };

  /* ---------- el caballo al galope (y su jinete) ----------
     Mira a la derecha (op.izq: a la izquierda). y es el suelo; s, la altura a la cruz. fase: 0…1 por zancada.
     Galope de verdad, por fotogramas clave como las fotos de Muybridge: cada pata pasa por apoyo, empuje, recogida,
     vuelo hacia delante y alcance, con su desfase (mano derecha de guía), y hay un instante con las cuatro en el aire;
     el cuerpo cabecea y sube y baja con la zancada. op.encabrita (0…1): se levanta de manos sobre las patas de atrás. */
  // [fase, ángulo de arriba, ángulo de abajo]: 0 = vertical, positivo = hacia delante
  var MANO = [[0, 0.42, 0.36], [0.14, 0.02, 0.02], [0.3, -0.48, -0.62], [0.45, -0.3, -1.95], [0.64, 0.42, -1.4], [0.84, 0.8, 0.5]];
  var PIE = [[0, 0.4, -0.05], [0.2, 0.02, -0.3], [0.38, -0.5, -0.62], [0.54, -0.6, -1.35], [0.74, 0.12, 0.25], [0.9, 0.5, 0.4]];
  // al paso (cuatro tiempos, más corto y sin vuelo) y quieto
  var MANO_P = [[0, 0.28, 0.12], [0.3, 0.0, 0.0], [0.55, -0.28, -0.25], [0.7, -0.12, -1.0], [0.88, 0.28, -0.25]];
  var PIE_P = [[0, 0.28, -0.02], [0.35, 0.0, -0.18], [0.6, -0.32, -0.4], [0.76, -0.2, -1.0], [0.92, 0.22, 0.05]];
  // las patas: el arranque (la misma anatomía que el caballo quieto de arte.jinete, ya aprobado) y su desfase
  var PATAS = [
    { o: [-0.22, 0.74], d: 0.0, dp: 0.0, tras: true, lejos: true }, { o: [-0.32, 0.76], d: 0.1, dp: 0.5, tras: true },
    { o: [0.26, 0.68], d: 0.36, dp: 0.25, lejos: true }, { o: [0.36, 0.7], d: 0.47, dp: 0.75 }
  ];
  function clave(tabla, f) {
    f = ((f % 1) + 1) % 1;
    for (var i = 0; i < tabla.length; i++) {
      var a = tabla[i], b = tabla[(i + 1) % tabla.length], fb = i + 1 < tabla.length ? b[0] : 1;
      if (f >= a[0] && f < fb) { var k = U.suave((f - a[0]) / (fb - a[0])); return [U.lerp(a[1], b[1], k), U.lerp(a[2], b[2], k)]; }
    }
    return [tabla[0][1], tabla[0][2]];
  }
  function pataGalope(Q, q, fase, s, enc, marcha) {
    var an = marcha === 'quieto' ? (q.tras ? [q.lejos ? 0.02 : -0.08, 0.04] : [q.lejos ? -0.02 : 0.05, 0.0]) : marcha === 'paso' ? clave(q.tras ? PIE_P : MANO_P, fase + q.dp) : clave(q.tras ? PIE : MANO, fase + q.d);
    if (enc > 0) { var e = q.tras ? [-0.45, -0.7] : [0.5, -2.1]; an = [U.lerp(an[0], e[0], enc), U.lerp(an[1], e[1], enc)]; }
    var L = q.tras ? [0.34, 0.3, 0.1] : [0.3, 0.29, 0.1], p0 = q.o;
    var dir = function (p, l, th) { return [p[0] + Math.sin(th) * l, p[1] - Math.cos(th) * l]; };
    var mid = function (a, b, f, lado) { return [U.lerp(a[0], b[0], f) + lado, U.lerp(a[1], b[1], f)]; };
    // arriba el músculo (antebrazo o pierna), la rodilla o el corvejón, la caña fina, el menudillo, la cuartilla y el casco
    var p1 = dir(p0, L[0], an[0]), p2 = dir(p1, L[1], an[1]), cuartilla = an[1] + 0.55 + (q.tras ? 0.05 : 0), p3 = dir(p2, L[2], cuartilla);
    var pts = [p0, mid(p0, p1, 0.45, q.tras ? -0.02 : 0.01), p1, mid(p1, p2, 0.55, 0), p2, p3];
    var W = q.tras ? [0.27, 0.17, 0.09, 0.05, 0.062, 0.042] : [0.17, 0.11, 0.08, 0.048, 0.058, 0.042];
    if (q.lejos) W = W.map(function (w) { return w * 0.88; });
    return { pata: A.pata(pts.map(function (p) { return Q(p[0], p[1]); }), W.map(function (w) { return w * s; })), casco: [Q(p3[0], p3[1]), cuartilla] };
  }
  function casco(c, p, ang, s, color) {
    c.save(); c.translate(p[0], p[1]); c.rotate(-ang); c.fillStyle = color;
    c.beginPath(); c.moveTo(-0.024 * s, -0.016 * s); c.lineTo(0.026 * s, -0.016 * s); c.lineTo(0.036 * s, 0.022 * s); c.lineTo(-0.03 * s, 0.022 * s); c.closePath(); c.fill(); c.restore();
  }
  // los puntos de la cabeza del caballo de arte.jinete (del 2 al 12), para que cabecee
  var CUERPO = [[0.4, 0.6], [0.46, 0.74], [0.52, 0.88], [0.58, 0.97], [0.7, 0.88], [0.8, 0.84], [0.84, 0.89], [0.8, 0.96], [0.7, 1.05], [0.62, 1.12], [0.55, 1.11], [0.47, 1.03], [0.36, 0.96], [0.24, 0.93], [0.1, 0.89], [-0.06, 0.89], [-0.22, 0.93], [-0.34, 0.93], [-0.44, 0.87], [-0.48, 0.75], [-0.43, 0.63], [-0.3, 0.56], [-0.12, 0.54], [0.08, 0.54], [0.24, 0.56], [0.34, 0.56]];
  S.galope = function (c, x, y, s, fase, P, op) {
    op = op || {};
    var enc = op.encabrita || 0, f2 = TAU * fase, marcha = op.marcha || 'galope', galope = marcha === 'galope';
    var bote = galope ? (Math.cos(f2 - TAU * 0.7) * 0.035 + 0.01) * (1 - enc) : marcha === 'paso' ? Math.abs(Math.sin(f2 * 2)) * 0.012 : 0;
    var pitch = galope ? Math.sin(f2 - TAU * 0.2) * 0.04 * (1 - enc) - enc * 0.62 : marcha === 'paso' ? Math.sin(f2 * 2) * 0.008 : 0;
    var cab = galope ? Math.sin(f2 + 1.2) * 0.03 * (1 - enc) - 0.03 * (1 - enc) : marcha === 'paso' ? Math.sin(f2 * 2 + 1) * 0.02 : 0;
    var ondea = galope ? Math.sin(f2 * 2) * 0.05 : (op.cola || 0), cuelga = galope ? 0 : 1;
    // la cabeza: cabecea (cab) y, quieto, baja a pastar (op.pasta: 0…1), girando el cuello sobre su base
    var pasta = op.pasta || 0, PV = [0.4, 0.86], ap = -pasta * 1.4;
    var hp = function (px, py, w) { px += cab * 0.4; py += cab; if (!pasta) return [px, py]; var a = ap * (w == null ? 1 : w), dx = px - PV[0], dy = py - PV[1]; return [PV[0] + dx * Math.cos(a) - dy * Math.sin(a), PV[1] + dx * Math.sin(a) + dy * Math.cos(a)]; };
    var col = op.caballo || P.caballo, crin = op.crin || P.crin, luz = op.izq ? -P.luz : P.luz;
    c.save(); if (op.izq) { c.translate(2 * x, 0); c.scale(-1, 1); }
    c.fillStyle = P.sombraSuelo; c.beginPath(); c.ellipse(x - luz * 0.2 * s - enc * 0.2 * s, y + 2, 0.6 * s * (1 - enc * 0.4), 0.05 * s, 0, 0, TAU); c.fill();
    // el cuerpo cabecea con la zancada; al encabritarse gira sobre las patas de atrás
    var px0 = enc > 0 ? -0.3 : 0, py0 = enc > 0 ? 0 : 0.75;
    c.translate(x + px0 * s, y - (py0 + bote) * s); c.rotate(pitch); c.translate(-(x + px0 * s), -(y - py0 * s));
    var Q = function (px, py) { return [x + px * s, y - py * s]; }, L = function (a) { return a.map(function (q) { return Q(q[0], q[1]); }); };
    var Wd = function (a) { return a.map(function (w) { return w * s; }); };
    // las patas de allá, más oscuras
    var lejos = PATAS.filter(function (q) { return q.lejos; }).map(function (q) { return pataGalope(Q, q, fase, s, enc, marcha); });
    A.bajo(A.une(lejos.map(function (g) { return g.pata; })), c, col[2]);
    lejos.forEach(function (g) { casco(c, g.casco[0], g.casco[1], s, A.mezcla(col[2], '#000000', 0.55)); });
    // la cola: el maslo corto y, detrás, mechones de pelo que ondean cada uno a su ritmo
    A.bajo(A.suave(L([[-0.42, 0.9], [-0.54, 0.9 + ondea * 0.3 * (1 - cuelga)], [-0.6, U.lerp(0.84 + ondea * 0.4, 0.74, cuelga)], [-0.5, 0.78], [-0.43, 0.82]])), c, crin);
    c.strokeStyle = crin; c.lineCap = 'round';
    for (var i = 0; i < 16; i++) {
      var k = i / 15, o = Q(-0.5, 0.87 - k * 0.06), fz = Math.sin(f2 * 2 + k * 2.4) * 0.05;
      var m1 = Q(U.lerp(-0.66 - k * 0.03, -0.58 - k * 0.02, cuelga), U.lerp(0.88 + fz - k * 0.06, 0.7 - k * 0.03, cuelga)), e = Q(U.lerp(-0.78 - (i % 4) * 0.025 - k * 0.04, -0.56 - (i % 4) * 0.012 - k * 0.03 + ondea, cuelga), U.lerp(0.68 + fz * 1.4 - k * 0.1 + ondea, 0.36 - k * 0.05 + (i % 3) * 0.01, cuelga));
      c.lineWidth = Math.max(1, s * (0.022 - k * 0.01)); c.beginPath(); c.moveTo(o[0], o[1]); c.quadraticCurveTo(m1[0], m1[1], e[0], e[1]); c.stroke();
    }
    // el cuerpo, el cuello y la cabeza (la del caballo aprobado), con la paletilla y el anca
    // (al volverlo hacia la derecha el contorno cambia de sentido: se recorre al revés para que no se reste con la paletilla y el anca)
    var pts = CUERPO.map(function (q, i) { return i >= 2 && i <= 12 ? hp(q[0], q[1], i === 2 ? 0.45 : i === 12 ? 0.4 : 1) : q; }).reverse();
    var cuerpo = A.suave(L(pts));
    var oreja = A.poli(L([hp(0.62, 1.1), hp(0.6, 1.21), hp(0.55, 1.11)]));
    var hombro = A.elipse(x + 0.33 * s, y - 0.71 * s, 0.11 * s, 0.15 * s, -0.25), anca = A.elipse(x - 0.31 * s, y - 0.75 * s, 0.15 * s, 0.17 * s, 0.2);
    var cerca = PATAS.filter(function (q) { return !q.lejos; }).map(function (q) { return pataGalope(Q, q, fase, s, enc, marcha); });
    var todo = A.une([cuerpo, oreja, hombro, anca].concat(cerca.map(function (g) { return g.pata; })));
    // el filo de luz: se traza debajo, desplazado hacia la luz, y el cuerpo lo tapa salvo por ese lado
    c.save(); c.translate(-luz * 0.013 * s, -0.007 * s); c.strokeStyle = P.filoCaballo; c.lineWidth = Math.max(1.5, s * 0.016); c.stroke(todo); c.restore();
    A.cel(c, todo, [col[1], col[0]], -luz * 0.027 * s, -0.033 * s);
    cerca.forEach(function (g) { casco(c, g.casco[0], g.casco[1], s, A.mezcla(col[2], '#000000', 0.45)); });
    // los músculos: pecho, espalda, anca y cuello
    c.save(); c.clip(todo); c.strokeStyle = col[3] || col[0]; c.lineWidth = Math.max(1, s * 0.013); c.globalAlpha = 0.55; c.beginPath();
    [[[0.36, 0.66], [0.3, 0.76], [0.26, 0.86]], [[-0.28, 0.66], [-0.36, 0.78], [-0.3, 0.88]], [[0.5, 0.92], [0.42, 0.84], [0.38, 0.72]], [[-0.04, 0.6], [0.1, 0.6], [0.2, 0.64]]].forEach(function (l) { var a = Q(l[0][0], l[0][1]), b = Q(l[1][0], l[1][1]), d = Q(l[2][0], l[2][1]); c.moveTo(a[0], a[1]); c.quadraticCurveTo(b[0], b[1], d[0], d[1]); });
    c.stroke(); c.restore();
    // la crin al viento, en mechones
    c.fillStyle = crin; c.fill(A.suave(L([hp(0.6, 1.12), hp(0.5, 1.09, 0.7), hp(0.38, 0.99, 0.3), [0.26, 0.95], [0.3, 0.9], hp(0.42, 0.95, 0.35), hp(0.52, 1.02, 0.7)])));
    c.strokeStyle = crin; c.lineWidth = Math.max(1, s * 0.011); c.beginPath();
    for (i = 0; i < 12; i++) { var t = i / 11, h1 = hp(0.58 - t * 0.32, 1.11 - t * 0.17, 1 - t), a1 = Q(h1[0], h1[1]); c.moveTo(a1[0], a1[1]); c.quadraticCurveTo(a1[0] - 0.06 * s, a1[1] - 0.02 * s, a1[0] - 0.13 * s, a1[1] + (0.02 + ondea * 0.6 + (i % 2) * 0.025) * s); }
    c.stroke();
    // la brida y el ojo
    c.strokeStyle = P.cuero[1]; c.lineWidth = Math.max(1, s * 0.012); var hb3 = hp(0.66, 1.06), hb4 = hp(0.78, 0.9), b3 = Q(hb3[0], hb3[1]), b4 = Q(hb4[0], hb4[1]); c.beginPath(); c.moveTo(b3[0], b3[1]); c.lineTo(b4[0], b4[1]); c.moveTo(b3[0] + 0.02 * s, b3[1] + 0.1 * s); c.lineTo(b3[0] - 0.08 * s, b3[1]); c.stroke();
    var ho = hp(0.69, 1.0), ojo = Q(ho[0], ho[1]); c.fillStyle = '#0a0a0a'; c.beginPath(); c.arc(ojo[0], ojo[1], Math.max(1.2, s * 0.016), 0, TAU); c.fill();
    // la manta a rayas y la silla
    if (!op.sinSilla) {
      var manta = A.suave(L([[-0.16, 0.92], [0.16, 0.92], [0.18, 0.72], [-0.14, 0.72]]));
      A.cel(c, manta, [P.manta[1], P.manta[0]], 0, -0.02 * s); c.save(); c.clip(manta); c.fillStyle = P.manta[2]; var mb = Q(-0.16, 0.86); for (i = 0; i < 4; i++) c.fillRect(mb[0] - 2, mb[1] - 6 + i * 0.047 * s, 0.34 * s + 4, Math.max(1.5, 0.014 * s)); c.restore();
      A.cel(c, A.suave(L([[-0.15, 0.93], [-0.12, 1.0], [-0.06, 0.96], [0.08, 0.96], [0.14, 1.0], [0.17, 0.93]])), [P.cuero[1], P.cuero[0]], 0, -0.02 * s);
      var pomo = Q(-0.13, 1.0); A.bajo(A.suave([[pomo[0] - 0.02 * s, pomo[1] + 0.025 * s], [pomo[0] - 0.02 * s, pomo[1] - 0.01 * s], [pomo[0] - 0.035 * s, pomo[1] - 0.04 * s], [pomo[0] + 0.035 * s, pomo[1] - 0.04 * s], [pomo[0] + 0.02 * s, pomo[1] - 0.01 * s], [pomo[0] + 0.02 * s, pomo[1] + 0.025 * s]]), c, P.cuero[0]);
      var lz = Q(-0.12, 1.0); c.strokeStyle = P.lazo; c.lineWidth = Math.max(1, s * 0.013); c.beginPath(); c.ellipse(lz[0] - 0.026 * s, lz[1] + 0.066 * s, 0.06 * s, 0.08 * s, -0.3, 0, TAU); c.stroke();
    }
    if (op.mochila) {   // la mochila del Pony Express: cuero sobre la silla, con sus cuatro cantinas
      A.cel(c, A.poli(L([[-0.2, 1.0], [0.16, 1.0], [0.18, 0.8], [-0.22, 0.8]])), ['#5a321c', '#8a5634'], 0, -0.02 * s);
      c.fillStyle = '#3a2010'; [[-0.17, 0.86], [0.07, 0.86]].forEach(function (q) { var p = Q(q[0], q[1]); c.fillRect(p[0], p[1], 0.1 * s, 0.08 * s); });
    }
    if (op.jinete) {
      // el jinete de arte.jinete (aprobado), inclinado hacia delante al galope
      var ropa = op.ropa || P.ropa, inc = (op.inclina == null ? 0.16 : op.inclina) + enc * 0.3, silla = Q(0, 0.96);
      c.save(); c.translate(silla[0], silla[1]); c.rotate(inc * 1.4); c.translate(-silla[0], -silla[1]);
      var torso = A.suave(L([[0.09, 0.95], [0.12, 1.12], [0.06, 1.2], [-0.04, 1.2], [-0.08, 1.12], [-0.07, 0.95]]));
      var pierna = A.pata(L([[0.0, 0.96], [0.14, 0.86], [0.1, 0.66], [0.13, 0.6]]), Wd([0.08, 0.07, 0.055, 0.05]));
      var brazo = A.pata(L([[0.07, 1.14], [0.18, 1.02], [0.3, 0.99]]), Wd([0.05, 0.045, 0.04]));
      var rj = A.une([torso, pierna, brazo]);
      c.save(); c.translate(-luz * 0.011 * s, -0.006 * s); c.strokeStyle = P.filoCaballo; c.lineWidth = Math.max(1.2, s * 0.013); c.stroke(rj); c.restore();
      A.cel(c, rj, [ropa[1], ropa[0]], -luz * 0.02 * s, -0.02 * s);
      c.save(); c.clip(rj);
      var pq = Q(0.06, 0.78); c.fillStyle = P.pantalon || 'rgba(40,40,60,.75)'; c.fillRect(pq[0] - 0.2 * s, pq[1] - 0.2 * s, 0.4 * s, 0.24 * s);
      var ch = Q(0.0, 1.0); c.fillStyle = P.chaleco || '#3a2a20'; c.fillRect(ch[0] - 0.09 * s, ch[1] - 0.18 * s, 0.18 * s, 0.17 * s); c.fillStyle = P.cuero[1]; c.fillRect(ch[0] - 0.1 * s, ch[1] + 0.02 * s, 0.2 * s, 0.03 * s);
      c.restore();
      var fd = Q(-0.05, 0.98); A.bajo(A.suave([[fd[0] - 0.02 * s, fd[1]], [fd[0] + 0.05 * s, fd[1]], [fd[0] + 0.045 * s, fd[1] + 0.12 * s], [fd[0] - 0.015 * s, fd[1] + 0.12 * s]]), c, P.cuero[1]); c.fillStyle = P.hierro || '#2e2a2c'; c.fillRect(fd[0], fd[1] - 0.035 * s, 0.018 * s, 0.045 * s);
      A.cel(c, A.suave(L([[0.08, 0.64], [0.2, 0.6], [0.2, 0.56], [0.08, 0.57]])), [P.cuero[1], P.cuero[0]], 0, -0.012 * s);
      var esp = Q(0.08, 0.58); c.strokeStyle = P.laton || '#f0c25a'; c.lineWidth = Math.max(1, s * 0.008); c.beginPath(); c.moveTo(esp[0], esp[1]); c.lineTo(esp[0] - 0.035 * s, esp[1]); c.stroke(); c.beginPath(); c.arc(esp[0] - 0.05 * s, esp[1], 0.016 * s, 0, TAU); c.stroke();
      var mn = Q(0.3, 0.99); c.fillStyle = P.piel[1]; c.beginPath(); c.arc(mn[0], mn[1], 0.024 * s, 0, TAU); c.fill();
      // la cabeza, el pañuelo al viento y el sombrero (con el ala levantada por el aire)
      var hc = Q(0.02, 1.26); A.cel(c, A.circulo(hc[0], hc[1], 0.055 * s), [P.piel[1], P.piel[0]], -luz * 0.012 * s, -0.012 * s);
      A.bajo(A.poli(L([[0.07, 1.19], [-0.05, 1.19], [0.0, 1.11]])), c, P.panuelo);
      c.fillStyle = P.panuelo; var pv = Q(-0.06, 1.18); c.beginPath(); c.moveTo(pv[0], pv[1]); c.quadraticCurveTo(pv[0] - 0.1 * s, pv[1] - (0.02 + ondea) * s, pv[0] - 0.18 * s, pv[1] + (0.03 - ondea) * s); c.lineTo(pv[0] - 0.02 * s, pv[1] + 0.04 * s); c.fill();
      var hx = hc[0], hy = hc[1], ala = new Path2D();
      ala.moveTo(hx - 0.165 * s, hy - 0.078 * s); ala.quadraticCurveTo(hx, hy - 0.032 * s, hx + 0.165 * s, hy - 0.078 * s); ala.quadraticCurveTo(hx + 0.178 * s, hy - 0.092 * s, hx + 0.155 * s, hy - 0.094 * s);
      ala.quadraticCurveTo(hx, hy - 0.058 * s, hx - 0.155 * s, hy - 0.094 * s); ala.quadraticCurveTo(hx - 0.178 * s, hy - 0.092 * s, hx - 0.165 * s, hy - 0.078 * s); ala.closePath();
      var copa = A.suave([[hx - 0.078 * s, hy - 0.07 * s], [hx - 0.074 * s, hy - 0.13 * s], [hx - 0.052 * s, hy - 0.168 * s], [hx - 0.012 * s, hy - 0.152 * s], [hx + 0.024 * s, hy - 0.168 * s], [hx + 0.056 * s, hy - 0.152 * s], [hx + 0.074 * s, hy - 0.13 * s], [hx + 0.078 * s, hy - 0.07 * s]]);
      var sb = op.sombrero || P.sombrero[1]; A.cel(c, A.une([copa, ala]), [A.mezcla(sb, '#000000', 0.3), sb], -luz * 0.012 * s, -0.012 * s);
      c.fillStyle = P.sombrero[2] || '#3a2418'; c.fillRect(hx - 0.077 * s, hy - 0.098 * s, 0.154 * s, 0.02 * s);
      c.save(); c.clip(A.circulo(hc[0], hc[1], 0.055 * s)); c.fillStyle = 'rgba(40,20,10,.35)'; c.fillRect(hx - 0.08 * s, hy - 0.06 * s, 0.16 * s, 0.03 * s); c.restore();
      // el lazo que da vueltas por encima de la cabeza (op.lazo: el ángulo)
      if (op.lazo != null) {
        var mano = Q(0.02, 1.48), rl = 0.32 * s, hb = Q(-0.06, 1.18);
        c.strokeStyle = P.lazo; c.lineWidth = Math.max(1.2, s * 0.014);
        c.beginPath(); c.moveTo(hb[0], hb[1]); c.lineTo(mano[0], mano[1]); c.stroke();
        var lc = [mano[0] + Math.cos(op.lazo) * rl * 0.6, mano[1] - 0.12 * s + Math.sin(op.lazo) * rl * 0.12];
        c.beginPath(); c.moveTo(mano[0], mano[1]); c.lineTo(lc[0], lc[1]); c.ellipse(lc[0], lc[1] - 0.02 * s, rl, rl * 0.28, Math.sin(op.lazo) * 0.12, 0, TAU); c.stroke();
      }
      c.restore();
      // las riendas, de la mano al bocado
      c.strokeStyle = P.cuero[1]; c.lineWidth = Math.max(1, s * 0.009); var rm = Q(0.3 + inc * 0.6, 0.99 - inc * 0.2), hr2 = hp(0.78, 0.9), r2 = Q(hr2[0], hr2[1]); c.beginPath(); c.moveTo(rm[0], rm[1]); c.quadraticCurveTo((rm[0] + r2[0]) / 2, rm[1] + 0.06 * s, r2[0], r2[1]); c.stroke();
    }
    c.restore();
  };

  /* ---------- el bisonte: la joroba, la cabeza baja con su barba, la melena oscura delante ---------- */
  S.bisonte = function (c, x, y, s, fase, op) {
    op = op || {};
    var bote = Math.abs(Math.sin(TAU * fase)) * 0.04, n = PA.peso('noche');
    var tono = function (h) { return n > 0.02 ? A.mezcla(h, '#121830', 0.6 * n) : h; };
    c.save(); if (op.izq) { c.translate(2 * x, 0); c.scale(-1, 1); }
    var Q = function (px, py) { return [x + px * s, y - (py + bote) * s]; }, L = function (a) { return a.map(function (q) { return Q(q[0], q[1]); }); };
    c.fillStyle = 'rgba(60,30,20,.22)'; c.beginPath(); c.ellipse(x, y + 2, 0.7 * s, 0.05 * s, 0, 0, TAU); c.fill();
    var patas = [{ o: [-0.42, 0.5], d: 0, tras: true, lejos: true }, { o: [0.3, 0.42], d: 0.45, lejos: true }, { o: [-0.36, 0.5], d: 0.12, tras: true }, { o: [0.36, 0.42], d: 0.57 }];
    var corta = function (q) { var a = Math.sin(TAU * (fase + q.d)), b = Math.max(0, Math.cos(TAU * (fase + q.d))), th = (q.tras ? -0.2 : 0.15) + 0.55 * a, p1 = [q.o[0] + Math.sin(th) * 0.22, q.o[1] - Math.cos(th) * 0.22], th2 = th + (q.tras ? 0.4 - 0.7 * b : -1.1 * b), p2 = [p1[0] + Math.sin(th2) * 0.2, p1[1] - Math.cos(th2) * 0.2]; return A.pata([Q(q.o[0], q.o[1]), Q(p1[0], p1[1]), Q(p2[0], p2[1])], [0.17 * s, 0.07 * s, 0.06 * s]); };
    A.bajo(A.une(patas.filter(function (q) { return q.lejos; }).map(corta)), c, tono('#24160e'));
    var cuerpo = A.suave(L([[0.5, 0.42], [0.42, 0.86], [0.22, 1.06], [0.02, 1.02], [-0.3, 0.84], [-0.56, 0.78], [-0.64, 0.6], [-0.5, 0.42], [0.1, 0.36], [0.4, 0.3]]));
    var cabeza = A.suave(L([[0.42, 0.8], [0.62, 0.72], [0.74, 0.5], [0.76, 0.3], [0.7, 0.22], [0.6, 0.26], [0.5, 0.36]]));
    A.cel(c, A.une([cuerpo].concat(patas.filter(function (q) { return !q.lejos; }).map(corta))), [tono('#3a2416'), tono('#5a3a24')], -0.03 * s, -0.04 * s);
    // la melena de delante, más clara y lanuda, y la barba
    var melena = A.suave(L([[0.48, 0.42], [0.46, 0.86], [0.24, 1.06], [0.0, 1.0], [-0.08, 0.7], [0.06, 0.4], [0.3, 0.3]]));
    A.cel(c, A.une([melena, cabeza]), [tono('#4a2e1a'), tono('#8a5e3a')], -0.025 * s, -0.035 * s);
    A.bajo(A.suave(L([[0.6, 0.26], [0.66, 0.1], [0.58, 0.06], [0.52, 0.22]])), c, tono('#2a1a10'));
    c.strokeStyle = tono('#c8a070'); c.globalAlpha = 0.5; c.lineWidth = Math.max(1, s * 0.012); c.beginPath();
    for (var i = 0; i < 9; i++) { var p = Q(0.04 + i * 0.05, 0.98 - Math.abs(i - 4) * 0.04); c.moveTo(p[0], p[1]); c.lineTo(p[0] - 0.03 * s, p[1] + 0.06 * s); }
    c.stroke(); c.globalAlpha = 1;
    // el cuerno, corto y negro, y el ojo
    c.strokeStyle = tono('#141010'); c.lineWidth = Math.max(1.2, s * 0.03); var h1 = Q(0.62, 0.62), h2 = Q(0.7, 0.72); c.beginPath(); c.moveTo(h1[0], h1[1]); c.quadraticCurveTo(h2[0], h2[1] + 0.04 * s, h2[0] - 0.02 * s, h2[1] - 0.04 * s); c.stroke();
    var oj = Q(0.68, 0.5); c.fillStyle = '#0a0806'; c.beginPath(); c.arc(oj[0], oj[1], Math.max(1, s * 0.016), 0, TAU); c.fill();
    // la cola, corta, con su borla
    var co = Q(-0.6, 0.76); c.strokeStyle = tono('#2a1a10'); c.lineWidth = Math.max(1, s * 0.015); c.beginPath(); c.moveTo(co[0], co[1]); c.quadraticCurveTo(co[0] - 0.1 * s, co[1] - 0.02 * s, co[0] - 0.12 * s, co[1] + 0.12 * s); c.stroke();
    c.restore();
  };

  /* ---------- pólvora: el fogonazo de un revólver y su humo blanco ---------- */
  S.fogonazo = function (c, x, y, r, a, dir) {
    if (a <= 0) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
    var g = c.createRadialGradient(x, y, 0, x, y, r * 2.4); g.addColorStop(0, 'rgba(255,240,190,.9)'); g.addColorStop(1, 'rgba(255,150,50,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.4, 0, TAU); c.fill();
    c.fillStyle = '#fff2c0'; c.beginPath();
    for (var i = 0; i < 10; i++) { var an = i / 10 * TAU, rr = i % 2 ? r * 0.35 : r * (i === 0 ? 1.6 : 0.9), ex = dir && i === 0 ? dir : 1; c.lineTo(x + Math.cos(an) * rr * (Math.cos(an) * ex > 0 ? 1.4 : 1), y + Math.sin(an) * rr); }
    c.closePath(); c.fill(); c.restore();
  };
  S.humo = function (c, x, y, r, a) {
    if (a <= 0) return;
    var u = new Path2D(); [[0, 0, 1], [-0.6, 0.2, 0.7], [0.6, 0.15, 0.75], [-0.2, -0.5, 0.65], [0.35, -0.45, 0.6]].forEach(function (b) { u.addPath(A.circulo(x + b[0] * r, y + b[1] * r, r * b[2])); });
    c.save(); c.globalAlpha = a; A.cel(c, u, [S.dePaleta('#b8b2a8'), S.dePaleta('#e8e2d6'), S.dePaleta('#f8f4ec')], -r * 0.12, -r * 0.18); c.restore();
  };

  /* ---------- la planta rodadora (la misma maraña que la del paisaje) ---------- */
  S.rodadora = function (c, x, y, r, giro, P) {
    c.save(); c.translate(x, y); c.rotate(giro);
    c.fillStyle = 'rgba(90,60,30,.18)'; c.beginPath(); c.arc(0, 0, r * 0.8, 0, TAU); c.fill();
    var rd = A.rodadora(0, 0, r); c.strokeStyle = A.mezcla(P.rodadora, '#000000', 0.3); c.lineWidth = 1.4; c.stroke(rd); c.strokeStyle = P.rodadora; c.lineWidth = 1; c.stroke(rd);
    c.restore();
  };

  /* ---------- un chispazo de oro (estrella de cuatro puntas) ---------- */
  S.destello = function (c, x, y, r, a) {
    if (a <= 0) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
    var g = c.createRadialGradient(x, y, 0, x, y, r * 1.6); g.addColorStop(0, 'rgba(255,236,160,.9)'); g.addColorStop(1, 'rgba(255,190,60,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 1.6, 0, TAU); c.fill();
    c.fillStyle = '#fff6d0'; c.beginPath(); c.moveTo(x, y - r * 2); c.quadraticCurveTo(x, y, x + r * 2, y); c.quadraticCurveTo(x, y, x, y + r * 2); c.quadraticCurveTo(x, y, x - r * 2, y); c.quadraticCurveTo(x, y, x, y - r * 2); c.fill();
    c.restore();
  };

  /* ---------- el código Morse (el internacional de hoy) ---------- */
  S.MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..' };
  // la palabra en una lista de impulsos { t (en unidades), largo, letra }: punto 1, raya 3, hueco 1, entre letras 3
  S.impulsos = function (palabra) {
    var out = [], t = 0;
    palabra.split('').forEach(function (l, i) { (S.MORSE[l] || '').split('').forEach(function (s) { var d = s === '-' ? 3 : 1; out.push({ t: t, d: d, letra: i }); t += d + 1; }); t += 2; });
    out.total = t; return out;
  };

  /* ---------- rótulos y viñetas ---------- */
  S.rotulo = function (c, txt, x, y, a, color, tam) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a; tam = tam || 11;
    c.font = '500 ' + tam + 'px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = (tam * 0.2).toFixed(1) + 'px';
    var w = c.measureText(txt).width + tam * 1.7, h = tam * 2;
    // si no cabe en la pantalla (en el móvil), la letra encoge
    if (w > E.W - 20 && tam > 8) { c.restore(); return S.rotulo(c, txt, x, y, a, color, tam - 1); }
    c.fillStyle = CUERO; c.fillRect(x - w / 2, y - h / 2, w, h);
    c.strokeStyle = 'rgba(240,160,58,.35)'; c.lineWidth = 1; c.strokeRect(x - w / 2 + 2.5, y - h / 2 + 2.5, w - 5, h - 5);
    c.fillStyle = color || CREMA; c.fillText(txt, x, y + 0.5);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.restore();
  };
  // una lámina de papel enmarcada, para contar algo de cerca (dibujo recibe el rectángulo de dentro)
  S.vineta = function (c, x, y, w, h, a, dibujo) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    c.fillStyle = 'rgba(20,10,4,.4)'; c.fillRect(x + 8, y + 10, w, h);
    c.fillStyle = '#efe3c9'; c.fillRect(x, y, w, h);
    c.save(); c.beginPath(); c.rect(x + 10, y + 10, w - 20, h - 20); c.clip(); dibujo(x + 10, y + 10, w - 20, h - 20); c.restore();
    c.strokeStyle = '#3b2618'; c.lineWidth = 1.5; c.strokeRect(x + 10, y + 10, w - 20, h - 20);
    c.strokeStyle = 'rgba(59,38,24,.35)'; c.lineWidth = 1; c.strokeRect(x + 4, y + 4, w - 8, h - 8);
    c.restore();
  };
  // texto de letrero (la letra de los carteles del pueblo)
  S.letra = function (c, txt, x, y, tam, color, alin) {
    c.save(); c.font = '700 ' + tam + 'px Rockwell, "American Typewriter", "Courier New", Georgia, serif'; c.textAlign = alin || 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = (tam * 0.08).toFixed(1) + 'px';
    c.fillStyle = color; c.fillText(txt, x, y); c.restore();
  };
  // la cuenta de un número con puntos de miles
  S.num = function (n) { return U.num(Math.round(n)); };
})();
