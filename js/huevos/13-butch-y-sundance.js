/* Secreto escondido 3 · Butch Cassidy y Sundance Kid (Gesto)
   Mantener pulsados 3 s los carteles de SE BUSCA del tablón del sheriff (o el que hay junto al saloon). Mientras se
   mantiene, los carteles se encienden y un anillo se va llenando; si se suelta antes, se apaga (Pau 02/11).
   La escena (Pau 02/11: «la podemos mejorar bastante»):
   1. el cartel sale del tablón y crece: WANTED · THE WILD BUNCH, con los dos retratos;
   2. se rasga por la mitad y por detrás salen los dos al galope; la cámara los sigue calle abajo;
   3. un mapa antiguo de las Américas, en pergamino, donde se dibuja la huida: en barco de Nueva York a Buenos Aires
      (1901), a caballo hasta el rancho de Cholila, en la Patagonia, y de allí a San Vicente, en Bolivia (1908): los
      fogonazos… y una línea de puntos que vuelve al norte con una interrogación (la leyenda de que volvieron). */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, A = VA.arte, PA = VA.paisaje, S = VA.esc;
  var TAU = Math.PI * 2, BASE = A.BASE, TABLON = 2518, MANTENER = 3000;
  var T = { crece: 300, rasga: 3300, sigue: 3500, mapa: 7000, barco: 7900, rancho: 9900, bolivia: 11100, tiros: 12300, vuelta: 13200, tarjeta: 12600 };
  function enCarteles(d) { var x = d.l * S.K, y = d.yu * S.K; return (x > 2482 && x < 2554 && y > 652 && y < 708) || (x > 1992 && x < 2022 && y > 656 && y < 700); }

  /* ---------- el mapa: costas muy simplificadas, en longitud y latitud ---------- */
  var NORTE = [[-130, 55], [-125, 49], [-124, 40], [-117, 32.5], [-110, 23], [-105, 20], [-97, 16], [-92, 14.5], [-87, 13], [-83, 9], [-79, 9], [-77, 8], [-77.5, 9.5], [-83, 10.5], [-84, 15], [-88, 16], [-87, 21.5], [-90, 21], [-91, 19], [-97, 22], [-97, 26], [-94, 29.5], [-89, 30], [-84, 30], [-82.5, 27], [-81, 25], [-80, 26], [-81, 30.5], [-76, 35], [-74, 40.5], [-70, 41.7], [-66, 44.5], [-61, 45.5], [-53, 47], [-60, 52], [-58, 55]];
  var SUR = [[-77, 8], [-80, 0], [-81, -5], [-76, -14], [-70.3, -18.5], [-70.5, -25], [-71.5, -32], [-73.5, -38], [-73.5, -45], [-75, -50], [-73, -53], [-68.5, -55], [-65, -55], [-67.5, -50], [-65.5, -46], [-63.5, -42.5], [-62, -39], [-57.5, -38], [-58, -35], [-56, -35], [-53, -34], [-48.5, -28], [-45, -23.5], [-41, -22], [-39, -17], [-39, -13], [-35, -9], [-35, -5.5], [-38.5, -3.5], [-44, -2.5], [-50, 0], [-51, 4], [-57, 6], [-61.5, 8.5], [-64, 10.5], [-68, 11], [-72, 11.5], [-75.5, 10.5]];
  var CUBA = [[-85, 21.8], [-81, 23.1], [-77, 21.5], [-74.2, 20.2], [-77.5, 19.9], [-81, 21.6]];
  var SITIOS = { ny: [-74, 40.7, 'Nueva York', '1901'], ba: [-58.4, -34.6, 'Buenos Aires', ''], ch: [-71.4, -42.5, 'Cholila', 'el rancho'], sv: [-66.3, -21.3, 'San Vicente', '1908'] };
  var BARCO = [[-74, 40.7], [-70, 35], [-62, 22], [-48, 8], [-33, -6], [-37, -20], [-46, -30], [-58.4, -34.6]];
  var TIERRA1 = [[-58.4, -34.6], [-64, -38], [-71.4, -42.5]], TIERRA2 = [[-71.4, -42.5], [-69, -33], [-66.3, -21.3]];
  var VUELTA = [[-66.3, -21.3], [-72, -6], [-86, 10], [-100, 22], [-108, 32]];
  // un punto de un camino a una fracción k (por longitud)
  function enCamino(pts, k) {
    var L = [0], i; for (i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var d = U.clamp(k, 0, 1) * L[L.length - 1];
    for (i = 1; i < pts.length; i++) if (d <= L[i]) { var f = (d - L[i - 1]) / (L[i] - L[i - 1] || 1); return [U.lerp(pts[i - 1][0], pts[i][0], f), U.lerp(pts[i - 1][1], pts[i][1], f), Math.atan2(-(pts[i][1] - pts[i - 1][1]), pts[i][0] - pts[i - 1][0])]; }
    var u = pts[pts.length - 1]; return [u[0], u[1], 0];
  }

  // un retrato de cartel: busto con sombrero, en tinta sobre el papel
  function retrato(c, x, y, w, h, ala, bigote) {
    c.fillStyle = '#d8c49a'; c.fillRect(x, y, w, h);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    var cx = x + w / 2, cy = y + h * 0.5;
    c.fillStyle = '#3b2618';
    c.beginPath(); c.moveTo(x - 2, y + h); c.quadraticCurveTo(cx - w * 0.42, cy + h * 0.16, cx, cy + h * 0.14); c.quadraticCurveTo(cx + w * 0.42, cy + h * 0.16, x + w + 2, y + h); c.fill();
    c.fillStyle = '#c8a878'; c.beginPath(); c.ellipse(cx, cy - h * 0.02, w * 0.17, h * 0.2, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(59,38,24,.35)'; c.beginPath(); c.ellipse(cx + w * 0.06, cy, w * 0.1, h * 0.17, 0, -1.2, 1.2); c.fill();
    c.fillStyle = '#3b2618'; c.beginPath(); c.ellipse(cx, cy - h * 0.2, w * (ala ? 0.4 : 0.3), h * 0.045, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(cx - w * 0.17, cy - h * 0.2); c.quadraticCurveTo(cx - w * 0.16, cy - h * 0.42, cx, cy - h * 0.38); c.quadraticCurveTo(cx + w * 0.16, cy - h * 0.42, cx + w * 0.17, cy - h * 0.2); c.fill();
    [-1, 1].forEach(function (k) { c.beginPath(); c.arc(cx + k * w * 0.065, cy - h * 0.04, w * 0.018, 0, TAU); c.fill(); });
    if (bigote) { c.beginPath(); c.ellipse(cx, cy + h * 0.07, w * 0.08, h * 0.02, 0, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(59,38,24,.22)'; c.lineWidth = 1; for (var l = y; l < y + h; l += 3) { c.beginPath(); c.moveTo(x, l); c.lineTo(x + w, l); c.stroke(); }
    c.restore();
    c.strokeStyle = '#3b2618'; c.lineWidth = 1.5; c.strokeRect(x, y, w, h);
  }
  // el cartel entero (en su sitio, de ancho w)
  function cartelWanted(c, x, y, w) {
    var h = w * 1.3;
    c.fillStyle = 'rgba(20,10,4,.35)'; c.fillRect(x + 8, y + 10, w, h);
    var gp = c.createRadialGradient(x + w / 2, y + h / 2, w * 0.1, x + w / 2, y + h / 2, w * 0.85); gp.addColorStop(0, '#f2e2bc'); gp.addColorStop(1, '#d0ae76'); c.fillStyle = gp; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(59,38,24,.5)'; c.lineWidth = 1.2; c.strokeRect(x + w * 0.04, y + w * 0.04, w * 0.92, h - w * 0.08);
    S.letra(c, 'WANTED', x + w / 2, y + h * 0.1, Math.round(w * 0.17), '#7a2418');
    c.save(); c.fillStyle = '#3b2618'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '500 ' + Math.round(w * 0.04) + 'px "IBM Plex Mono", monospace'; if ('letterSpacing' in c) c.letterSpacing = '2px'; c.fillText('THE WILD BUNCH', x + w / 2, y + h * 0.19); c.restore();
    var rw = w * 0.38, rh = rw * 1.15, ry = y + h * 0.25;
    retrato(c, x + w * 0.08, ry, rw, rh, true, false); retrato(c, x + w * 0.54, ry, rw, rh, false, true);
    c.save(); c.fillStyle = '#2a1810'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'italic 400 ' + Math.round(w * 0.058) + 'px "Instrument Serif", Georgia, serif';
    c.fillText('Butch Cassidy', x + w * 0.08 + rw / 2, ry + rh + w * 0.06); c.fillText('Sundance Kid', x + w * 0.54 + rw / 2, ry + rh + w * 0.06); c.restore();
    S.letra(c, 'REWARD', x + w / 2, y + h * 0.83, Math.round(w * 0.11), '#7a2418');
    c.save(); c.fillStyle = '#3b2618'; c.textAlign = 'center'; c.font = '500 ' + Math.round(w * 0.032) + 'px "IBM Plex Mono", monospace'; c.fillText('PINKERTON NATIONAL DETECTIVE AGENCY', x + w / 2, y + h * 0.92); c.restore();
    return h;
  }

  VA.registrar({
    id: 'butch-y-sundance', n: 13, escondido: true, nombre: 'Butch Cassidy y Sundance Kid', tipo: 'Gesto',
    pista: 'En el tablón del sheriff buscan a dos. Aprieta sus carteles y no los sueltes.',
    detectar: function (api) {
      var mant = null;
      api.en('bajar', function (d) { if (api.hallado() || !enCarteles(d)) return; d.tomar(); mant = { t0: E.t, x: d.x, y: d.y }; });
      api.en('arrastrar', function (d) { if (mant && Math.hypot(d.x - mant.x, d.y - mant.y) > 40) mant = null; });
      var suelta = function () { mant = null; };
      api.en('soltar', suelta); window.addEventListener('pointerup', suelta); window.addEventListener('pointercancel', suelta);
      api.en('cuadro', function () { if (mant && E.t - mant.t0 >= MANTENER) { mant = null; api.disparar(); } });
      // mientras se mantiene: los carteles se encienden y un anillo dorado se va llenando
      api.capa(function (c) {
        if (!mant) return;
        var k = U.tramo(E.t - mant.t0, 250, MANTENER); if (k <= 0) return;
        var p = S.pant(TABLON, BASE - 40, 1), r = 54 * S.k();
        c.save(); c.globalCompositeOperation = 'lighter';
        var g = c.createRadialGradient(p[0], p[1], 2, p[0], p[1], r * 1.8); g.addColorStop(0, 'rgba(255,200,110,' + (0.55 * k).toFixed(3) + ')'); g.addColorStop(1, 'rgba(240,160,58,0)'); c.fillStyle = g; c.beginPath(); c.arc(p[0], p[1], r * 1.8, 0, TAU); c.fill();
        c.restore();
        c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(30,16,8,.45)'; c.lineWidth = 5; c.beginPath(); c.arc(p[0], p[1], r, 0, TAU); c.stroke();
        c.strokeStyle = S.ACENTO; c.lineWidth = 3; c.beginPath(); c.arc(p[0], p[1], r, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke(); c.restore();
      });
    },
    escena: function () {
      var D = 15600 + E.lectura, P, polvo = [], siguio = false;
      // dónde van los dos jinetes (en lámina): salen del tablón y la cámara va con ellos
      function xJinete(i, t) { var dt = t - T.sigue - i * 260; return dt < 0 ? null : TABLON + 60 + dt * 0.5 + Math.max(0, dt - 3800) * 0.45; }
      function mapa(c, x, y, w, h, t) {
        var lon0 = -128, lon1 = -30, lat0 = 52, lat1 = -57;
        var M = function (lon, lat) { return [x + (lon - lon0) / (lon1 - lon0) * w, y + (lat0 - lat) / (lat0 - lat1) * h]; };
        var tierra = function (pts) { var p = new Path2D(); pts.forEach(function (q, i) { var m = M(q[0], q[1]); i ? p.lineTo(m[0], m[1]) : p.moveTo(m[0], m[1]); }); p.closePath(); return p; };
        // el mar: el pergamino con líneas de olas
        var gm = c.createRadialGradient(x + w / 2, y + h / 2, w * 0.2, x + w / 2, y + h / 2, w * 0.9); gm.addColorStop(0, '#efe2c2'); gm.addColorStop(1, '#cfb284'); c.fillStyle = gm; c.fillRect(x, y, w, h);
        c.strokeStyle = 'rgba(80,90,90,.18)'; c.lineWidth = 1; for (var ly = y + 10; ly < y + h; ly += 14) { c.beginPath(); for (var lx = x; lx < x + w; lx += 8) c.lineTo(lx, ly + Math.sin(lx / 9 + ly) * 1.6); c.stroke(); }
        // las tierras, con su costa en tinta y un rayado de sombra
        [tierra(NORTE), tierra(SUR), tierra(CUBA)].forEach(function (p) {
          c.fillStyle = '#e4c890'; c.fill(p);
          c.save(); c.clip(p); c.strokeStyle = 'rgba(120,80,40,.18)'; c.lineWidth = 1; for (var d = -h; d < w; d += 6) { c.beginPath(); c.moveTo(x + d, y + h); c.lineTo(x + d + h * 0.6, y); c.stroke(); } c.restore();
          c.strokeStyle = '#5a3a1e'; c.lineWidth = 1.6; c.stroke(p);
          c.strokeStyle = 'rgba(90,58,30,.25)'; c.lineWidth = 4; c.stroke(p);
        });
        // la rosa de los vientos
        var rx = x + w * 0.18, ry = y + h * 0.78, rr = w * 0.07;
        c.strokeStyle = '#5a3a1e'; c.fillStyle = '#7a2418'; c.lineWidth = 1; c.beginPath(); c.arc(rx, ry, rr, 0, TAU); c.stroke();
        c.beginPath(); c.moveTo(rx, ry - rr * 1.3); c.lineTo(rx + rr * 0.18, ry); c.lineTo(rx, ry + rr * 1.3); c.lineTo(rx - rr * 0.18, ry); c.closePath(); c.fill();
        S.letra(c, 'N', rx, ry - rr * 1.6, Math.round(w * 0.04), '#5a3a1e');
        // el título
        c.save(); c.fillStyle = '#3b2618'; c.textAlign = 'right'; c.textBaseline = 'middle'; c.font = 'italic 400 ' + Math.round(w * 0.06) + 'px "Instrument Serif", Georgia, serif'; c.fillText('The Wild Bunch', x + w * 0.95, y + h * 0.06);
        c.font = '500 ' + Math.round(w * 0.03) + 'px "IBM Plex Mono", monospace'; if ('letterSpacing' in c) c.letterSpacing = '1.5px'; c.fillText('1901 — 1908', x + w * 0.95, y + h * 0.1); c.restore();
        // el camino, que se va dibujando
        var tramo = function (pts, t0, t1, color, raya) {
          var k = U.tramo(t, t0, t1); if (k <= 0) return null;
          c.save(); c.strokeStyle = color; c.lineWidth = 2.2; c.setLineDash(raya || [5, 5]); c.beginPath();
          for (var i = 0; i <= 40; i++) { var q = enCamino(pts, k * i / 40), m = M(q[0], q[1]); i ? c.lineTo(m[0], m[1]) : c.moveTo(m[0], m[1]); }
          c.stroke(); c.restore();
          var e = enCamino(pts, k); return { p: M(e[0], e[1]), ang: e[2], k: k };
        };
        var sitio = function (s, t0, abajo) {
          var a = U.tramo(t, t0, t0 + 400); if (a <= 0) return; var m = M(s[0], s[1]);
          c.save(); c.globalAlpha = a; c.fillStyle = '#7a2418'; c.beginPath(); c.arc(m[0], m[1], 4.5, 0, TAU); c.fill(); c.strokeStyle = '#f2e3c6'; c.lineWidth = 1.5; c.stroke();
          c.fillStyle = '#2a1810'; c.textAlign = s[0] < -66 ? 'right' : 'left'; c.textBaseline = 'middle'; c.font = 'italic 400 ' + Math.round(w * 0.05) + 'px "Instrument Serif", Georgia, serif';
          var dx = s[0] < -66 ? -9 : 9; c.fillText(s[2], m[0] + dx, m[1] + (abajo ? 12 : -2));
          if (s[3]) { c.font = '500 ' + Math.round(w * 0.028) + 'px "IBM Plex Mono", monospace'; c.fillStyle = '#7a2418'; c.fillText(s[3].toUpperCase(), m[0] + dx, m[1] + (abajo ? 12 : -2) + w * 0.045); }
          c.restore();
        };
        sitio(SITIOS.ny, T.mapa + 300);
        var b = tramo(BARCO, T.barco, T.rancho - 300, '#2a4a6a', [6, 4]);
        if (b && b.k < 1) {   // el vapor
          c.save(); c.translate(b.p[0], b.p[1]); c.fillStyle = '#2a1810'; c.beginPath(); c.moveTo(-9, -1); c.lineTo(9, -1); c.lineTo(6, 4); c.lineTo(-7, 4); c.closePath(); c.fill(); c.fillRect(-2, -7, 4, 6); c.fillStyle = 'rgba(60,50,40,.4)'; c.beginPath(); c.arc(-4, -11, 3, 0, TAU); c.arc(-9, -14, 4, 0, TAU); c.fill(); c.restore();
        }
        if (U.tramo(t, T.barco, T.rancho - 300) >= 1) sitio(SITIOS.ba, T.rancho - 300, true);
        var j1 = tramo(TIERRA1, T.rancho - 200, T.rancho + 700, '#7a2418'), j2 = tramo(TIERRA2, T.bolivia - 400, T.tiros - 200, '#7a2418');
        if (U.tramo(t, T.rancho - 200, T.rancho + 700) >= 1) {
          sitio(SITIOS.ch, T.rancho + 700, true);
          var mc = M(SITIOS.ch[0], SITIOS.ch[1]), ac = U.tramo(t, T.rancho + 700, T.rancho + 1100); c.save(); c.globalAlpha = ac; c.fillStyle = '#5a3a1e'; c.fillRect(mc[0] + 6, mc[1] - 12, 14, 9); c.beginPath(); c.moveTo(mc[0] + 4, mc[1] - 12); c.lineTo(mc[0] + 13, mc[1] - 19); c.lineTo(mc[0] + 22, mc[1] - 12); c.fill(); c.restore();
        }
        [j1, j2].forEach(function (j) { if (j && j.k < 1) { c.save(); c.translate(j.p[0], j.p[1]); c.fillStyle = '#2a1810'; c.beginPath(); c.ellipse(0, -4, 6, 3, 0, 0, TAU); c.fill(); c.fillRect(-5, -2, 1.5, 4); c.fillRect(3, -2, 1.5, 4); c.beginPath(); c.arc(-1, -9, 2, 0, TAU); c.arc(5, -9, 2, 0, TAU); c.fill(); c.restore(); } });
        if (U.tramo(t, T.bolivia - 400, T.tiros - 200) >= 1) {
          sitio(SITIOS.sv, T.tiros - 200);
          var ms = M(SITIOS.sv[0], SITIOS.sv[1]);
          for (var f = 0; f < 6; f++) { var dt = t - T.tiros - f * 130; if (dt > 0 && dt < 160) S.fogonazo(c, ms[0] + (f % 2 ? 9 : -9), ms[1] - 6 - (f % 3) * 3, 5, 1 - dt / 160, f % 2 ? -1 : 1); }
        }
        // ¿volvieron?
        var v = tramo(VUELTA, T.vuelta, T.vuelta + 1600, 'rgba(122,36,24,.55)', [2, 6]);
        if (v && v.k >= 1) { var aq = U.tramo(t, T.vuelta + 1600, T.vuelta + 2100); c.save(); c.globalAlpha = aq; S.letra(c, '¿?', v.p[0] - 6, v.p[1] - 14, Math.round(w * 0.08), '#7a2418'); c.restore(); }
      }
      return {
        duracion: D,
        tarjeta: { en: T.tarjeta, hasta: D - 400, titulo: 'Butch Cassidy y Sundance Kid', pie: 'The Wild Bunch · San Vicente, Bolivia · noviembre de 1908',
          texto: 'Robert LeRoy Parker, «Butch Cassidy», y Harry Longabaugh, «Sundance Kid», de la banda del Wild Bunch, asaltaron trenes y bancos por todo el Oeste. Con la agencia Pinkerton detrás, en 1901 se fueron con Etta Place de Nueva York a Argentina y tuvieron un rancho en Cholila, en la Patagonia. En noviembre de 1908, tras robar la paga de una mina, los rodearon en San Vicente (Bolivia) y murieron en el tiroteo… o eso dicen: los cuerpos nunca se identificaron con seguridad, y hay quien asegura que volvieron.' },
        inicio: function () { P = PA.paleta(); E.irA(TABLON / S.K, 1200); PA.rodadoraOculta = true; },
        cuadro: function (t) { if (!siguio && t >= T.sigue + 300) { siguio = true; E.irA((TABLON + 1900) / S.K, 3600); } },
        fin: function () { PA.rodadoraOculta = false; },
        calle: function (c, t) {
          c.save(); S.enCapa(c, 1);
          // el tablón, encendido, y el hueco que deja el cartel
          var a = U.meseta(t, 0, 300, 2800, 3600);
          if (a > 0) { c.save(); c.globalCompositeOperation = 'lighter'; var g = c.createRadialGradient(TABLON, BASE - 44, 4, TABLON, BASE - 44, 90); g.addColorStop(0, 'rgba(255,200,110,' + (0.55 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(240,160,58,0)'); c.fillStyle = g; c.fillRect(TABLON - 90, BASE - 134, 180, 180); c.restore(); }
          // los dos jinetes al galope, calle abajo
          [[0, P.caballo, ['#3a3a4a', '#26262e'], '#d8c8a0'], [1, ['#2c3a40', '#162026', '#0e1418', '#4e6a70'], ['#8a6a4a', '#5a4430'], '#3a2a20']].forEach(function (q) {
            var x = xJinete(q[0], t); if (x == null || x > S.vista(1)[1] + 300) return; var y = BASE + 112 + q[0] * 34;
            if (Math.random() < 0.7) polvo.push({ x: x - 80, y: y, t: t, s: 1 + q[0] * 0.2 });
            S.galope(c, x, y, 136 + q[0] * 10, (x / 360 + q[0] * 0.43) % 1, Object.assign({}, P, { caballo: q[1] }), { jinete: true, ropa: q[2], inclina: 0.24, sombrero: q[3] });
          });
          for (var p = polvo.length - 1; p >= 0; p--) { var o = polvo[p], k = (t - o.t) / 1500; if (k > 1 || k < 0) { polvo.splice(p, 1); continue; } c.fillStyle = 'rgba(214,170,120,' + (0.3 * (1 - k)).toFixed(3) + ')'; c.beginPath(); c.arc(o.x - k * 50, o.y - k * 34, (10 + k * 34) * o.s, 0, TAU); c.fill(); }
          c.restore();
        },
        frente: function (c, t) {
          var W = E.W, H = E.H;
          // el cartel: sale del tablón, crece hasta el centro y se rasga
          var ka = U.inOut(U.tramo(t, T.crece, T.crece + 1100)), kr = U.tramo(t, T.rasga, T.rasga + 900);
          if (t >= T.crece && kr < 1) {
            var p0 = S.pant(TABLON, BASE - 50, 1), wf = Math.min(W * 0.72, H * 0.52, 360), w = U.lerp(26 * S.k(), wf, ka), h = w * 1.3;
            var cx = U.lerp(p0[0], W / 2, ka), cy = U.lerp(p0[1], H * 0.12 + h / 2, ka), x = cx - w / 2, y = cy - h / 2, rot = (1 - ka) * 0.3;
            if (kr <= 0) { c.save(); c.translate(cx, cy); c.rotate(rot); c.translate(-cx, -cy); cartelWanted(c, x, y, w); c.restore(); }
            else {
              // las dos mitades, con el borde rasgado, se abren y caen
              [-1, 1].forEach(function (lado) {
                c.save(); c.globalAlpha = 1 - U.tramo(kr, 0.6, 1);
                c.translate(cx + lado * kr * W * 0.25, cy + kr * kr * H * 0.5); c.rotate(lado * kr * 0.6); c.translate(-cx, -cy);
                var corte = new Path2D(); corte.moveTo(cx, y - 10); for (var i = 0; i <= 14; i++) corte.lineTo(cx + (i % 2 ? 6 : -5), y + h * i / 14);
                corte.lineTo(cx, y + h + 20); corte.lineTo(lado < 0 ? x - 20 : x + w + 20, y + h + 20); corte.lineTo(lado < 0 ? x - 20 : x + w + 20, y - 10); corte.closePath();
                c.clip(corte); cartelWanted(c, x, y, w); c.restore();
              });
            }
          }
          // el mapa de la huida
          var am = U.meseta(t, T.mapa, T.mapa + 700, D - 1600, D - 400); if (am <= 0) return;
          var mw = W < 700 ? Math.min(W * 0.78, H * 0.31) : Math.min(W * 0.34, H * 0.66), mh = mw * 1.12, mx = W < 700 ? (W - mw) / 2 : W - mw - Math.min(W * 0.06, 70), my = (W < 700 ? H * 0.065 : H * 0.08) + (1 - U.sale(U.tramo(t, T.mapa, T.mapa + 700))) * 30;
          S.vineta(c, mx, my, mw, mh, am, function (ix, iy, iw, ih) { mapa(c, ix, iy, iw, ih, t); });
        }
      };
    }
  });
})();
