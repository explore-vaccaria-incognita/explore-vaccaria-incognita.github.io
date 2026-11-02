/* Secreto 03 · Pony Express (Distancia)
   Seguir empujando más allá del final del camino (rueda, flecha o arrastre).
   La escena: llega un jinete al galope con la mochila del correo; en la posta le espera un caballo fresco con el mozo; la
   mochila vuela de una silla a otra y sale a galope tendido. Arriba, la ruta de St. Joseph a Sacramento con sus 190 postas
   se va encendiendo, con los días y las millas. */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, A = VA.arte, PA = VA.paisaje, S = VA.esc;
  var TAU = Math.PI * 2, BASE = A.BASE, Y = BASE + 150, ALTO = 140;

  VA.registrar({
    id: 'pony-express', n: 3, nombre: 'Pony Express', tipo: 'Distancia',
    pista: 'Cabalga más allá del final del camino. Y no pares.',
    detectar: function (api) {
      api.en('empujar', function (d) { if (d.lado === 'fin' && d.total > 1300) api.disparar(); });
    },
    escena: function () {
      var D = 13500 + E.lectura, V, mid, polvo = [];
      function xUno(t) { return U.lerp(V[0] - 420, mid - 70, U.sale(U.tramo(t, 0, 2700))); }
      function xDos(t) { return U.lerp(mid + 70, V[1] + 520, U.entra(U.tramo(t, 3000, 6000))); }
      return {
        duracion: D,
        tarjeta: { en: 8200, hasta: D - 400, titulo: 'Pony Express', pie: 'St. Joseph, Misuri → Sacramento, California · 1860–1861',
          texto: 'Del 3 de abril de 1860 a octubre de 1861, jinetes jóvenes y ligeros llevaron el correo de St. Joseph (Misuri) a Sacramento (California): unas 1.900 millas, casi 3.000 km, en unos diez días. Había unas 190 postas, cada 15 o 25 km, y en cada una saltaban a un caballo fresco con la «mochila» del correo, sin perder tiempo. El viaje más rápido fue el del discurso inaugural de Lincoln: 7 días y 17 horas.' },
        inicio: function () { V = S.vista(1); mid = V[0] + (V[1] - V[0]) * 0.62; PA.rodadoraOculta = true; },
        fin: function () { PA.rodadoraOculta = false; },
        calle: function (c, t) {
          var P = PA.paleta();
          c.save(); S.enCapa(c, 1);
          // el polvo que levantan los cascos
          [[xUno(t), t < 2700], [xDos(t), t > 3000 && t < 6200]].forEach(function (q) { if (q[1] && Math.random() < 0.7) polvo.push({ x: q[0] - ALTO * 0.5, y: Y - 4, t: t }); });
          for (var i = polvo.length - 1; i >= 0; i--) {
            var p = polvo[i], k = (t - p.t) / 1500; if (k > 1 || k < 0) { polvo.splice(i, 1); continue; }
            c.fillStyle = 'rgba(214,170,120,' + (0.35 * (1 - k)).toFixed(3) + ')'; c.beginPath(); c.arc(p.x - k * 30, p.y - k * 26, 6 + k * 22, 0, TAU); c.fill();
          }
          // la posta: el poste de atar, un cubo de agua y el mozo con el caballo fresco
          var ap = U.tramo(t, 300, 1000);
          c.globalAlpha = ap;
          c.strokeStyle = P.madera[1]; c.lineWidth = 5; c.beginPath(); c.moveTo(mid + 190, Y); c.lineTo(mid + 190, Y - 64); c.moveTo(mid + 160, Y - 56); c.lineTo(mid + 250, Y - 56); c.moveTo(mid + 244, Y); c.lineTo(mid + 244, Y - 60); c.stroke();
          A.cubo(c, mid + 214, Y + 2, P);
          A.persona(c, mid + 150, Y + 4, 96, { tipo: 'de pie', ropa: P.camisa2, mira: -1, brazo: t < 3000 ? 'apoyado' : null }, P);
          c.globalAlpha = 1;
          if (t < 3000) A.caballoA(c, A.hacerJ(mid + 70, Y, ALTO * 0.98), Object.assign({}, P, { caballo: P.palomino, crin: '#f4ead0' }), { sinJinete: true }, 1);
          // el primer caballo: llega al galope; al pararse se queda quieto, sin jinete
          var x1 = xUno(t);
          if (t < 2700) S.galope(c, x1, Y, ALTO, (x1 / (ALTO * 2.6)) % 1, P, { jinete: true, mochila: t < 2650 });
          else A.caballoA(c, A.hacerJ(x1, Y, ALTO * 0.98), P, { sinJinete: true }, 1);
          // la mochila que vuela de una silla a la otra
          var km = U.tramo(t, 2650, 2980);
          if (km > 0 && km < 1) {
            var mx = U.lerp(x1, mid + 70, km), my = Y - ALTO * 0.95 - Math.sin(km * Math.PI) * 60;
            c.save(); c.translate(mx, my); c.rotate(km * 2.4); A.cel(c, A.rect(-22, -9, 44, 18), ['#5a321c', '#8a5634'], 0, -2); c.restore();
          }
          // y el caballo fresco sale a galope tendido
          if (t >= 3000) { var x2 = xDos(t); S.galope(c, x2, Y, ALTO, (x2 / (ALTO * 2.6)) % 1, Object.assign({}, P, { caballo: P.palomino, crin: '#f4ead0' }), { jinete: true, mochila: true, inclina: 0.22 }); }
          c.restore();
        },
        frente: function (c, t) {
          var W = E.W, H = E.H, a = U.meseta(t, 400, 1200, D - 2200, D - 600); if (a <= 0) return;
          // la ruta, con sus postas
          var x0 = W * (W < 700 ? 0.1 : 0.16), x1 = W * (W < 700 ? 0.9 : 0.84), y = H * 0.17, k = U.inOut(U.tramo(t, 900, 7400));
          c.save(); c.globalAlpha = a;
          c.fillStyle = 'rgba(38,22,14,.78)'; c.fillRect(x0 - 26, y - 34, x1 - x0 + 52, 96);
          c.strokeStyle = 'rgba(242,227,198,.45)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
          for (var i = 0; i <= 190; i++) {
            var xi = U.lerp(x0, x1, i / 190), on = i / 190 <= k, alto = i % 10 === 0 ? 9 : 4;
            c.strokeStyle = on ? S.ACENTO : 'rgba(242,227,198,.4)'; c.lineWidth = on ? 1.4 : 1; c.beginPath(); c.moveTo(xi, y - alto); c.lineTo(xi, y + alto); c.stroke();
          }
          c.strokeStyle = S.ACENTO; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x0, y); c.lineTo(U.lerp(x0, x1, k), y); c.stroke();
          var px = U.lerp(x0, x1, k); var g = c.createRadialGradient(px, y, 0, px, y, 14); g.addColorStop(0, 'rgba(255,220,150,.95)'); g.addColorStop(1, 'rgba(240,160,58,0)'); c.fillStyle = g; c.beginPath(); c.arc(px, y, 14, 0, TAU); c.fill();
          c.font = '500 10px "IBM Plex Mono", monospace'; if ('letterSpacing' in c) c.letterSpacing = '2px'; c.fillStyle = S.CREMA; c.textBaseline = 'middle';
          c.textAlign = 'left'; c.fillText('ST. JOSEPH, MO', x0, y - 20); c.textAlign = 'right'; c.fillText('SACRAMENTO, CA', x1, y - 20);
          c.textAlign = 'center'; c.fillStyle = k >= 1 ? S.ACENTO : S.CREMA;
          c.fillText('DÍA ' + U.dos(Math.min(10, 1 + Math.floor(k * 10))) + ' · ' + S.num(k * 1900) + ' MILLAS · POSTA ' + Math.round(k * 190) + ' / 190', (x0 + x1) / 2, y + 30);
          if ('letterSpacing' in c) c.letterSpacing = '0px';
          c.restore();
          var ar = U.meseta(t, 2600, 2800, 3600, 4200), p = S.pant(mid + 70, Y - ALTO * 1.7, 1);
          S.rotulo(c, 'CAMBIO DE CABALLO', p[0], p[1], ar, S.ACENTO);
        }
      };
    }
  });
})();
