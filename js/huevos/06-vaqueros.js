/* Secreto 06 · Vaqueros (Lugar)
   Pulsar el corral del rancho.
   La escena: un vaquero pasa al galope por delante del corral haciendo girar el lazo, y vuelve; mientras, del corral salen
   diez tablas: cada palabra del Oeste en inglés, con la palabra española de la que viene. */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, A = VA.arte, PA = VA.paisaje, S = VA.esc;
  var BASE = A.BASE, LC = 5945, Y = 800;
  var PALABRAS = [['VAQUERO', 'BUCKAROO'], ['LAZO', 'LASSO'], ['LA REATA', 'LARIAT'], ['RODEO', 'RODEO'], ['RANCHO', 'RANCH'], ['CORRAL', 'CORRAL'], ['MESTEÑO', 'MUSTANG'], ['CHAPARRERAS', 'CHAPS'], ['ESTAMPIDA', 'STAMPEDE'], ['JUZGADO', 'HOOSEGOW']];

  VA.registrar({
    id: 'vaqueros', n: 6, nombre: 'Vaqueros', tipo: 'Lugar',
    pista: 'Lazo, rodeo, rancho… En el corral te dirán de dónde vienen esas palabras.',
    lugar: function () { return LC / S.K; }, radio: 0.3,
    detectar: function (api) {
      api.en('clic', function (d) { var x = d.l * S.K, y = d.yu * S.K; if (x > 5690 && x < 6210 && y > 626 && y < 745) api.disparar(); });
    },
    escena: function () {
      var D = 13500 + E.lectura;
      function pasada(t) {   // [x, mira a la izquierda] del vaquero
        if (t < 4600) return [U.lerp(5250, 6700, U.tramo(t, 0, 4600)), false];
        return [U.lerp(6700, 5250, U.tramo(t, 5000, 9800)), true];
      }
      return {
        duracion: D,
        tarjeta: { en: 7800, hasta: D - 400, titulo: 'Vaqueros', pie: 'Vaquero, de vaca; vaca, del latín vacca',
          texto: 'Antes que el cowboy estuvo el vaquero, el jinete de las haciendas de la Nueva España y de México: de él vienen la silla, el lazo, las espuelas… y las palabras. Buckaroo es «vaquero» dicho en inglés; lasso es lazo, lariat es la reata, mustang es mesteño, chaps son las chaparreras y hoosegow, el juzgado. Y los cowboys de verdad eran de todas partes: muchos, mexicanos; y según una estimación muy citada, uno de cada cuatro era negro.' },
        inicio: function () { E.irA(LC / S.K, 1400); PA.rodadoraOculta = true; },
        fin: function () { PA.rodadoraOculta = false; },
        calle: function (c, t) {
          var P = PA.paleta(), q = pasada(t);
          if (t > 4600 && t < 5000) return;
          c.save(); S.enCapa(c, 1);
          S.galope(c, q[0], Y, 126, (q[0] / 330) % 1, Object.assign({}, P, { caballo: ['#c8a070', '#9a7448', '#6a4a2a', '#e8c898'], crin: '#3a2410' }), { jinete: true, izq: q[1], lazo: t / 150, inclina: 0.08, ropa: ['#d8b04a', '#a8822e'], sombrero: '#e6d6b4' });
          c.restore();
        },
        frente: function (c, t) {
          var W = E.W, H = E.H, n = PALABRAS.length, fila = Math.min(30, H * 0.034), y0 = H * 0.09, cx = W < 700 ? W / 2 : W * 0.66;
          var fuera = 1 - U.tramo(t, D - 2000, D - 500);
          PALABRAS.forEach(function (p, i) {
            var a = U.sale(U.tramo(t, 1300 + i * 430, 1800 + i * 430)) * fuera; if (a <= 0) return;
            var y = y0 + i * (fila + 6) + (1 - a) * 14, tam = Math.round(fila * 0.5);
            c.save(); c.globalAlpha = a; c.font = '700 ' + tam + 'px Rockwell, "American Typewriter", Georgia, serif';
            var wa = c.measureText(p[0]).width + tam * 2.2, wb = c.measureText(p[1]).width + tam * 2.2;
            // la tabla clara (la palabra española) y la oscura (la que salió de ella)
            A.cel(c, A.rect(cx - 18 - wa, y, wa, fila), ['#d8c8a4', '#f6ecd6'], 0, -2);
            c.strokeStyle = 'rgba(80,50,30,.5)'; c.lineWidth = 1; c.strokeRect(cx - 18 - wa + 2.5, y + 2.5, wa - 5, fila - 5);
            S.letra(c, p[0], cx - 18 - wa / 2, y + fila / 2 + 1, tam, '#7a2418');
            S.letra(c, '→', cx, y + fila / 2 + 1, tam, S.ACENTO);
            A.cel(c, A.rect(cx + 18, y, wb, fila), ['#4a2a18', '#6a4028'], 0, -2);
            S.letra(c, p[1], cx + 18 + wb / 2, y + fila / 2 + 1, tam, '#f6ecd6');
            c.restore();
          });
        }
      };
    }
  });
})();
