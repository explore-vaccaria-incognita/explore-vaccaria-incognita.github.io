/* Secreto 07 · Los bisontes (Lugar)
   Tocar la calavera de bisonte de Monument Valley (Pau 02/11: «prefiero que en el ordenador también sea tocando la
   calavera»; antes bastaba con dejar el cursor encima).
   La escena: la calavera se enciende y la pradera se llena de bisontes en estampida, lejos y cerca; arriba corren los años
   de 1800 a 1889 y la manada se va aclarando hasta que solo pasa alguno suelto; en el suelo quedan los huesos. Al final,
   la cifra que contó Hornaday. */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, A = VA.arte, PA = VA.paisaje, S = VA.esc;
  var TAU = Math.PI * 2, BASE = A.BASE, CX = 620, CY = 786, T0 = 1200, T1 = 8200;
  // la manada: [capa, y, tamaño, sale, velocidad, azar]
  var MANADA = (function () {
    var r = U.azar(1889), out = [];
    for (var i = 0; i < 110; i++) {
      var cerca = r() < 0.4;
      out.push([cerca ? 1 : 0.6, cerca ? BASE + 40 + r() * 140 : 596 + r() * 40, cerca ? 64 + r() * 26 : 24 + r() * 16, T0 - 600 + r() * (T1 - T0), 0.5 + r() * 0.25, r()]);
    }
    out.sort(function (a, b) { return a[1] - b[1]; });
    return out;
  })();
  var HUESOS = (function () { var r = U.azar(7), out = []; for (var i = 0; i < 70; i++) out.push([r(), r() < 0.45 ? 1 : 0.6, r(), r()]); return out; })();
  // cuántos quedan (0…1) en el instante t: la manada entera hasta 1870 y casi nada en 1885
  function densidad(t) { return 1 - 0.99 * U.suave(U.tramo(t, 5300, 7100)); }
  function sobreCalavera(x, y) { var p = S.pant(CX, CY, 1); return Math.hypot(x - p[0], y - p[1]) < 42 * S.k(); }
  function ano(t) { return Math.round(U.lerp(1800, 1889, U.inOut(U.tramo(t, T0, T1)))); }

  VA.registrar({
    id: 'bisontes', n: 7, nombre: 'Los bisontes', tipo: 'Lugar',
    pista: 'Una calavera en el camino recuerda a los que se fueron. Tócala.',
    lugar: function () { return CX / S.K; }, radio: 0.22,
    detectar: function (api) {
      api.en('clic', function (d) { if (sobreCalavera(d.x, d.y)) api.disparar(); });
    },
    escena: function () {
      var D = 14000 + E.lectura, V;
      function pinta(c, capa, t) {
        c.save(); S.enCapa(c, capa); V = S.vista(capa);
        var ancho = V[1] - V[0] + 400, n = PA.peso('noche');
        // los huesos que quedan en la pradera
        var ah = U.tramo(t, T1 - 2600, T1 - 400) * (1 - U.tramo(t, D - 1500, D - 300));
        if (ah > 0) {
          c.fillStyle = n > 0.5 ? 'rgba(170,180,210,' + (0.7 * ah).toFixed(3) + ')' : 'rgba(250,244,228,' + (0.85 * ah).toFixed(3) + ')';
          HUESOS.forEach(function (h) { if (h[1] !== capa) return; var x = V[0] + h[0] * (V[1] - V[0]), y = capa === 1 ? BASE + 30 + h[2] * 150 : 600 + h[2] * 34, s = capa === 1 ? 1 : 0.5; c.beginPath(); c.ellipse(x, y, (5 + h[3] * 6) * s, 1.6 * s, h[3] - 0.5, 0, TAU); c.fill(); if (h[3] > 0.6) { c.beginPath(); c.arc(x + 8 * s, y - 2 * s, 3 * s, 0, TAU); c.fill(); } });
        }
        // la manada, de derecha a izquierda
        MANADA.forEach(function (b, i) {
          var vivo = U.clamp((densidad(t) - U._h(i * 7 + 3)) / 0.06, 0, 1); if (b[0] !== capa || vivo <= 0) return;
          var dt = t - b[3]; if (dt < 0) return;
          var x = V[1] + 200 - dt * b[4] * (capa === 1 ? 1 : 0.6); if (x < V[0] - 200) return;
          c.globalAlpha = vivo; S.bisonte(c, x, b[1], b[2], ((V[1] - x) / (b[2] * 1.8) + b[5]) % 1, { izq: true }); c.globalAlpha = 1;
        });
        // el polvo de la estampida
        var ap = U.meseta(t, T0, T0 + 1200, T0 + 3200, T1 - 1000) * (capa === 1 ? 0.5 : 0.35);
        if (ap > 0) { c.fillStyle = 'rgba(214,170,120,' + ap.toFixed(3) + ')'; for (var k = 0; k < 14; k++) { var px = V[0] + ((k * 137 + t * 0.4) % ancho) - 200, py = capa === 1 ? BASE + 150 : 632; c.beginPath(); c.ellipse(px, py - Math.sin(k + t / 900) * 8, 90, 26 * (capa === 1 ? 1 : 0.5), 0, 0, TAU); c.fill(); } }
        c.restore();
      }
      return {
        duracion: D,
        tarjeta: { en: 8800, hasta: D - 400, titulo: 'Los bisontes', pie: 'Bison bison · 1889: 1.091 en todo el mundo',
          texto: 'A principios del siglo XIX había decenas de millones de bisontes en las praderas (las estimaciones van de 20 a 60 millones). Entre 1870 y 1885 los cazadores los mataron a millones por su piel, y muchos militares lo vieron con buenos ojos: sin bisontes, los pueblos de las llanuras perdían su sustento. Sus huesos se recogían a toneladas para hacer abono. En 1889, William Hornaday contó poco más de mil en todo el mundo: 1.091.' },
        inicio: function () { E.irA(0.9, 1300); },
        llanura: function (c, t) { pinta(c, 0.6, t); },
        calle: function (c, t) {
          pinta(c, 1, t);
          // la calavera encendida
          var p = S.pant(CX, CY, 1), a = U.meseta(t, 0, 600, D - 1500, D - 300), k = S.k();
          if (a > 0) { c.save(); c.globalCompositeOperation = 'lighter'; var g = c.createRadialGradient(p[0], p[1], 4, p[0], p[1], 90 * k); g.addColorStop(0, 'rgba(255,190,90,' + (0.45 * a * (0.85 + 0.15 * Math.sin(t / 300))).toFixed(3) + ')'); g.addColorStop(1, 'rgba(240,160,58,0)'); c.fillStyle = g; c.beginPath(); c.arc(p[0], p[1], 90 * k, 0, TAU); c.fill(); c.restore(); }
        },
        frente: function (c, t) {
          var W = E.W, H = E.H, a = U.meseta(t, T0 - 400, T0 + 200, D - 2200, D - 600), y = H * 0.13, an = ano(t);
          var fase = an < 1870 ? 'DECENAS DE MILLONES' : an < 1886 ? 'LA GRAN MATANZA' : '';
          S.rotulo(c, an + (fase ? ' · ' + fase : ''), W / 2, y, a, an < 1870 ? S.CREMA : S.ACENTO, 13);
          S.rotulo(c, '1.091 EN TODO EL MUNDO', W / 2, y + 38, U.meseta(t, T1 - 200, T1 + 500, D - 2200, D - 600), S.ACENTO, 13);
        }
      };
    }
  });
})();
