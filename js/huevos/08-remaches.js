/* Secreto 08 · Remaches de cobre (Teclado)
   Escribir 1873 (en cualquier sitio).
   La escena: la cámara va a la tienda MERCANTILE; aparece una lámina de papel con unos «waist overalls» de lona azul; los
   remaches de cobre se clavan uno a uno en las esquinas de los bolsillos, con su chispa; al lado se escribe la patente. */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, A = VA.arte, PA = VA.paisaje, S = VA.esc;
  var TAU = Math.PI * 2, TIENDA = 3561, CLAVE = '1873', buf = '', TR = 2000;
  var LINEAS = [['J. W. DAVIS', 0], ['& L. STRAUSS', 0], ['Improvement in', 1], ['Fastening Pocket-', 1], ['Openings.', 1], ['Nº 139.121', 2], ['MAY 20, 1873', 2]];

  VA.registrar({
    id: 'remaches', n: 8, nombre: 'Remaches de cobre', tipo: 'Teclado',
    pista: 'Un sastre y un comerciante de telas lo patentaron en 1873. Escribe el año.',
    detectar: function (api) {
      api.en('tecla', function (d) {
        if (!d.key || d.key.length !== 1) return;
        buf = (buf + d.key).slice(-CLAVE.length);
        if (buf === CLAVE) { buf = ''; api.disparar(); }
      });
    },
    escena: function () {
      var D = 13000 + E.lectura;
      function pantalon(c, x, y, w, h, t) {
        var cx = x + w * 0.3, top = y + h * 0.07, alto = h * 0.9, ww = w * 0.34, bot = top + alto, cr = top + alto * 0.3;
        var cuerpo = A.poli([[cx - ww / 2, top], [cx + ww / 2, top], [cx + ww / 2 + w * 0.02, top + alto * 0.22], [cx + ww / 2 + w * 0.005, bot], [cx + w * 0.03, bot], [cx, cr], [cx - w * 0.03, bot], [cx - ww / 2 - w * 0.005, bot], [cx - ww / 2 - w * 0.02, top + alto * 0.22]]);
        c.fillStyle = 'rgba(40,24,10,.25)'; c.save(); c.translate(6, 8); c.fill(cuerpo); c.restore();
        A.cel(c, cuerpo, ['#22385e', '#33507e', '#40629a'], -w * 0.008, -h * 0.006);
        // la trama de la sarga, en diagonal
        c.save(); c.clip(cuerpo); c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1; c.beginPath(); for (var d = -h; d < w; d += 4) { c.moveTo(x + d, bot); c.lineTo(x + d + h, top - h * 0.1); } c.stroke();
        // el pliegue de las rodillas
        c.strokeStyle = 'rgba(10,20,40,.25)'; c.lineWidth = 2; c.beginPath(); [[-1, 0.66], [1, 0.62]].forEach(function (q) { c.moveTo(cx + q[0] * ww * 0.18, top + alto * q[1]); c.quadraticCurveTo(cx + q[0] * ww * 0.3, top + alto * (q[1] + 0.02), cx + q[0] * ww * 0.42, top + alto * (q[1] - 0.01)); }); c.stroke();
        c.restore();
        // la pretina, la bragueta con sus botones y los bolsillos, con el pespunte naranja
        A.cel(c, A.rect(cx - ww / 2, top, ww, alto * 0.055), ['#2a426c', '#3a5888'], 0, -1);
        c.strokeStyle = '#e0a040'; c.lineWidth = 1.2; c.setLineDash([3, 2]);
        c.beginPath(); c.moveTo(cx - ww / 2 + 3, top + alto * 0.05); c.lineTo(cx + ww / 2 - 3, top + alto * 0.05);
        c.moveTo(cx + w * 0.02, top + alto * 0.06); c.lineTo(cx + w * 0.02, cr - alto * 0.04); c.quadraticCurveTo(cx + w * 0.02, cr, cx, cr);
        var bols = [[-1, 0], [1, 0]].map(function (q) { var a = [cx + q[0] * ww * 0.18, top + alto * 0.056], b = [cx + q[0] * (ww / 2 + w * 0.012), top + alto * 0.2]; c.moveTo(a[0], a[1]); c.quadraticCurveTo(cx + q[0] * ww * 0.3, top + alto * 0.17, b[0], b[1]); return [a, b]; });
        var reloj = [cx + ww * 0.24, top + alto * 0.075]; c.moveTo(reloj[0], reloj[1]); c.lineTo(reloj[0], reloj[1] + alto * 0.07); c.lineTo(reloj[0] + ww * 0.14, reloj[1] + alto * 0.075); c.lineTo(reloj[0] + ww * 0.14, reloj[1]);
        c.stroke(); c.setLineDash([]);
        c.fillStyle = '#9a9aa6'; [0.12, 0.2, 0.28].forEach(function (f) { c.beginPath(); c.arc(cx + w * 0.012, top + alto * f, 2.4, 0, TAU); c.fill(); });
        // los remaches de cobre: en las esquinas de los bolsillos, uno a uno
        var rem = [bols[0][0], bols[0][1], bols[1][0], bols[1][1], reloj, [reloj[0] + ww * 0.14, reloj[1]]];
        rem.forEach(function (p, i) {
          var tr = TR + i * 520, k = U.tramo(t, tr, tr + 160); if (k <= 0) return;
          var r = 5.2 * (1.6 - 0.6 * k);
          c.fillStyle = '#7a3a18'; c.beginPath(); c.arc(p[0] + 0.8, p[1] + 1, r, 0, TAU); c.fill();
          var g = c.createRadialGradient(p[0] - r * 0.3, p[1] - r * 0.3, 0, p[0], p[1], r); g.addColorStop(0, '#ffd8a8'); g.addColorStop(0.5, '#d8803a'); g.addColorStop(1, '#8a4418');
          c.fillStyle = g; c.beginPath(); c.arc(p[0], p[1], r, 0, TAU); c.fill();
          var ch = t - tr; if (ch > 0 && ch < 700) for (var j = 0; j < 8; j++) { var an = j / 8 * TAU, rr = ch * 0.05; S.destello(c, p[0] + Math.cos(an) * rr, p[1] + Math.sin(an) * rr, 1.6, 1 - ch / 700); }
        });
      }
      return {
        duracion: D,
        tarjeta: { en: 6700, hasta: D - 400, titulo: 'Remaches de cobre', pie: 'Patente nº 139.121 · 20 de mayo de 1873',
          texto: 'Jacob Davis, un sastre de Reno (Nevada), hacía pantalones de trabajo para mineros y obreros que se rompían siempre por los bolsillos. Se le ocurrió reforzarlos con remaches de cobre. No tenía los 68 dólares de la patente y escribió a quien le vendía la tela, Levi Strauss, en San Francisco. La patente salió a nombre de los dos el 20 de mayo de 1873: así nacieron los pantalones vaqueros, que entonces se llamaban «waist overalls».' },
        inicio: function () { E.irA(TIENDA / S.K, 1300); },
        frente: function (c, t) {
          var W = E.W, H = E.H, w = Math.min(W * 0.86, H * 0.66, 560), h = w * 0.86, x = W < 700 ? (W - w) / 2 : W - w - Math.min(W * 0.06, 70), y = H * 0.1;
          var a = U.meseta(t, 700, 1400, D - 1800, D - 500);
          S.vineta(c, x, y, w, h, a, function (ix, iy, iw, ih) {
            c.fillStyle = '#f4ead4'; c.fillRect(ix, iy, iw, ih);
            c.strokeStyle = 'rgba(80,60,40,.12)'; c.lineWidth = 1; c.beginPath(); for (var l = iy + 18; l < iy + ih; l += 18) { c.moveTo(ix, l); c.lineTo(ix + iw, l); } c.stroke();
            pantalon(c, ix, iy, iw, ih, t);
            // la patente, que se escribe a la derecha
            var tx = ix + iw * 0.58, tam = Math.max(10, iw * 0.034), ly = iy + ih * 0.12;
            LINEAS.forEach(function (ln, i) {
              var k = U.tramo(t, 1600 + i * 520, 2100 + i * 520), n = Math.floor(ln[0].length * k);
              var alto = ln[1] === 1 ? tam * 1.75 : tam * 1.55; if (i === 2 || i === 5) ly += tam * 0.9;
              if (n > 0) {
                c.save(); c.fillStyle = ln[1] === 2 ? '#7a2418' : '#3b2618'; c.textAlign = 'left'; c.textBaseline = 'middle';
                c.font = ln[1] === 1 ? 'italic 400 ' + Math.round(tam * 1.45) + 'px "Instrument Serif", Georgia, serif' : '500 ' + Math.round(tam * 0.9) + 'px "IBM Plex Mono", monospace';
                if (ln[1] !== 1 && 'letterSpacing' in c) c.letterSpacing = '1px';
                c.fillText(ln[0].slice(0, n), tx, ly); c.restore();
              }
              ly += alto;
            });
            // un sello de lacre con la estrella
            var ks = U.sale(U.tramo(t, 5200, 5600)); if (ks > 0) {
              var sx = ix + iw * 0.78, sy = iy + ih * 0.8, sr = iw * 0.075 * (1.4 - 0.4 * ks);
              c.save(); c.globalAlpha = ks; c.fillStyle = '#9a2a20'; c.beginPath(); for (var p = 0; p < 18; p++) { var an = p / 18 * TAU, rr = sr * (p % 2 ? 0.9 : 1); c.lineTo(sx + Math.cos(an) * rr, sy + Math.sin(an) * rr); } c.fill();
              c.fillStyle = '#d85a40'; c.beginPath(); for (p = 0; p < 10; p++) { var a2 = -Math.PI / 2 + p * Math.PI / 5, r2 = p % 2 ? sr * 0.25 : sr * 0.6; c.lineTo(sx + Math.cos(a2) * r2, sy + Math.sin(a2) * r2); } c.fill(); c.restore();
            }
          });
        }
      };
    }
  });
})();
