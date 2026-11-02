/* Secreto 04 · El telégrafo (Teclado)
   Escribir MORSE (en cualquier sitio).
   La escena: la cámara va a la oficina del telégrafo; la ventana se enciende a cada golpe del manipulador y la palabra
   sale en puntos y rayas por un hilo hasta el poste y de allí, por la línea, hacia el este y el oeste. Arriba se escribe
   letra a letra. Después: 24.10.1861, los hilos del este y del oeste se unen en Salt Lake City; y dos días más tarde un
   último jinete del Pony Express se apaga. */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, A = VA.arte, PA = VA.paisaje, S = VA.esc;
  var TAU = Math.PI * 2, VIA = A.VIA, BASE = A.BASE, OFI = 2905, PLL = 0.6, UNIDAD = 130, TM = 1600;
  var PALABRA = 'MORSE', buf = '';

  VA.registrar({
    id: 'telegrafo', n: 4, nombre: 'El telégrafo', tipo: 'Teclado',
    pista: 'En la oficina del telégrafo, escribe el apellido de los puntos y las rayas.',
    detectar: function (api) {
      api.en('tecla', function (d) {
        if (!d.key || d.key.length !== 1) return;
        buf = (buf + d.key.toUpperCase()).slice(-PALABRA.length);
        if (buf === PALABRA) { buf = ''; api.disparar(); }
      });
    },
    escena: function () {
      var D = 14000 + E.lectura, M = S.impulsos(PALABRA), FIN = TM + M.total * UNIDAD, poste;
      function sonando(t) { for (var i = 0; i < M.length; i++) { var a = TM + M[i].t * UNIDAD; if (t >= a && t < a + M[i].d * UNIDAD) return M[i]; } return null; }
      return {
        duracion: D,
        tarjeta: { en: FIN + 1800, hasta: D - 400, titulo: 'El telégrafo', pie: 'First Transcontinental Telegraph · Salt Lake City · 24.10.1861',
          texto: 'El 24 de octubre de 1861 se unieron en Salt Lake City los hilos del telégrafo del este y del oeste: un mensaje cruzaba el continente en minutos, no en diez días. Dos días después, el Pony Express anunció su cierre; había durado año y medio. (En los hilos de entonces se usaba el Morse americano; el que ves aquí es el internacional de hoy.)' },
        inicio: function () {
          E.irA(OFI / S.K, 1300);
          // el poste de la línea más cercano a la oficina (se calcula cuando la cámara ya está allí)
          poste = null;
        },
        llanura: function (c, t) {
          var co = S.pant(OFI, 0, 1)[0], xl = S.lam(co, 0, PLL)[0]; poste = Math.round((xl - 20) / 160) * 160 + 20;
          if (t < TM) return;
          c.save(); S.enCapa(c, PLL); c.lineCap = 'round';
          var v = 0.7, a = 1 - U.tramo(t, D - 2000, D - 400);
          M.forEach(function (q) {
            var te = TM + q.t * UNIDAD + 260, dt = t - te; if (dt < 0) return;
            var largo = q.d * UNIDAD * v, cab = dt * v;
            [-1, 1].forEach(function (lado) {
              c.strokeStyle = S.ACENTO; c.lineWidth = 2.6; c.globalAlpha = a * 0.95; c.beginPath();
              for (var s = Math.max(0, cab - largo); s <= cab; s += 4) {
                var x = poste + 13 + lado * s, u = (((x - 33) % 160) + 160) % 160 / 160, y = VIA - 96 + 28 * u * (1 - u);
                s === Math.max(0, cab - largo) ? c.moveTo(x, y) : c.lineTo(x, y);
              }
              c.stroke();
            });
          });
          c.restore();
        },
        calle: function (c, t) {
          var q = sonando(t), P = PA.paleta();
          c.save(); S.enCapa(c, 1);
          // la luz de la ventana, que late con cada golpe del manipulador
          var luz = q ? 1 : 0.25 * U.meseta(t, 600, 1400, D - 2000, D - 500);
          c.globalCompositeOperation = 'lighter';
          var g = c.createRadialGradient(OFI, BASE - 58, 4, OFI, BASE - 58, 90); g.addColorStop(0, 'rgba(255,200,110,' + (0.55 * luz).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,170,80,0)');
          c.fillStyle = g; c.fillRect(OFI - 90, BASE - 150, 180, 180);
          c.globalCompositeOperation = 'source-over';
          if (q) S.letra(c, q.d > 1 ? 'clac' : 'clic', OFI + 60, BASE - 120 - (t % 300) * 0.04, 13, 'rgba(255,240,210,.9)');
          c.restore();
        },
        frente: function (c, t) {
          var W = E.W, H = E.H;
          // los hilos que salen del tejado de la oficina por encima del pueblo, hacia el este y el oeste, y los impulsos
          var ot = S.pant(OFI + 40, 524, 1), ad = U.meseta(t, 300, 900, D - 1500, D - 400);
          var hilos = [[ot, [ot[0] - W * 0.28, ot[1] - H * 0.12], [-30, H * 0.3]], [ot, [ot[0] + W * 0.28, ot[1] - H * 0.1], [W + 30, H * 0.27]]];
          var punto = function (h, u) { var a = h[0], m = h[1], b = h[2]; return [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * m[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * m[1] + u * u * b[1]]; };
          if (ad > 0) {
            c.save(); c.globalAlpha = ad; c.lineCap = 'round';
            hilos.forEach(function (h) {
              c.strokeStyle = 'rgba(40,28,24,.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(h[0][0], h[0][1]); c.quadraticCurveTo(h[1][0], h[1][1], h[2][0], h[2][1]); c.stroke();
              var largoHilo = Math.hypot(h[2][0] - h[0][0], h[2][1] - h[0][1]) * 1.1, v = 0.75;
              M.forEach(function (q) {
                var dt = t - (TM + q.t * UNIDAD); if (dt < 0) return;
                var u1 = Math.min(1, dt * v / largoHilo), u0 = Math.max(0, (dt - q.d * UNIDAD) * v / largoHilo); if (u0 >= 1) return;
                c.strokeStyle = S.ACENTO; c.lineWidth = 3.2; c.shadowColor = 'rgba(255,190,90,.9)'; c.shadowBlur = 8; c.beginPath();
                for (var k = 0; k <= 6; k++) { var p = punto(h, u0 + (u1 - u0) * k / 6); k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
                c.stroke(); c.shadowBlur = 0;
              });
            });
            // el aislador de vidrio en el tejado
            c.fillStyle = '#6ab89a'; c.beginPath(); c.arc(ot[0], ot[1], 4, 0, TAU); c.fill();
            c.restore();
          }
          // la palabra, letra a letra, con su código debajo
          var ar = U.meseta(t, TM - 500, TM, D - 2200, D - 600), hechas = 0, cx = W / 2, y = H * 0.12;
          M.forEach(function (q) { if (t >= TM + q.t * UNIDAD) hechas = Math.max(hechas, q.letra + 1); });
          S.rotulo(c, PALABRA.slice(0, hechas).split('').join(' ') || ' ', cx, y, ar, S.ACENTO, 18);
          S.rotulo(c, PALABRA.slice(0, hechas).split('').map(function (l) { return S.MORSE[l].replace(/\./g, '·').replace(/-/g, '—'); }).join('   ') || '·', cx, y + 40, ar, S.CREMA, 12);
          // la línea unida y el último jinete
          var a2 = U.meseta(t, FIN + 300, FIN + 900, D - 2200, D - 600);
          S.rotulo(c, 'SALT LAKE CITY · 24.10.1861 · EL ESTE Y EL OESTE, UNIDOS', cx, y + 82, a2, S.CREMA);
          var a3 = U.meseta(t, FIN + 1300, FIN + 1900, D - 2200, D - 600);
          S.rotulo(c, '26.10.1861 · FIN DEL PONY EXPRESS', cx, y + 120, a3, S.ACENTO);
          if (a3 > 0) {
            var kk = U.tramo(t, FIN + 1300, FIN + 5200), hx = cx - 150 + kk * 300, P = PA.paleta();
            c.save(); c.globalAlpha = a3 * (1 - U.tramo(kk, 0.6, 1)); S.galope(c, hx, y + 176, 34, (hx / 90) % 1, P, { jinete: true, mochila: true }); c.restore();
          }
        }
      };
    }
  });
})();
