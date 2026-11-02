/* Secreto 09 · Hecho en Almería (Lugar)
   Pulsar la fachada del saloon LAST CHANCE, al final de la calle mayor.
   La escena: entran las bandas negras del cine y el color se vuelve película (sepia, grano, rayas, perforaciones); suena
   la claqueta; en la calle aparece la cámara de rodaje con su operador, y detrás del saloon asoman los puntales: la
   fachada es un decorado. Arriba, dónde se rodó. */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, A = VA.arte, PA = VA.paisaje, S = VA.esc;
  var TAU = Math.PI * 2, BASE = A.BASE, X0 = 3668, X1 = 3838, TOP = 506;

  VA.registrar({
    id: 'almeria', n: 9, nombre: 'Hecho en Almería', tipo: 'Lugar',
    pista: 'Muchos de estos desiertos estaban, en realidad, en España. Llama a la puerta de la última oportunidad.',
    lugar: function () { return (X0 + X1) / 2 / S.K; }, radio: 0.25,
    detectar: function (api) {
      api.en('clic', function (d) { var x = d.l * S.K, y = d.yu * S.K; if (x > X0 && x < X1 && y > TOP - 10 && y < BASE + 6) api.disparar(); });
    },
    escena: function () {
      var D = 13000 + E.lectura;
      return {
        duracion: D,
        tarjeta: { en: 6800, hasta: D - 400, titulo: 'Hecho en Almería', pie: 'Desierto de Tabernas · Almería · años 60 y 70',
          texto: 'Muchos de estos desiertos del Oeste estaban en España. En el desierto de Tabernas (Almería), al que a menudo llaman el único desierto de Europa, se rodaron en los años sesenta y setenta muchísimos «spaghetti westerns», entre ellos escenas de las películas de Sergio Leone con Clint Eastwood. Varios de aquellos pueblos de madera siguen en pie y se visitan: Oasys Mini Hollywood, Fort Bravo y Western Leone.' },
        inicio: function () { E.irA((X0 + X1) / 2 / S.K - 0.1, 1300); PA.rodadoraOculta = true; },
        fin: function () { PA.rodadoraOculta = false; },
        calle: function (c, t) {
          var P = PA.paleta(), a = U.meseta(t, 1700, 2400, D - 1600, D - 400);
          c.save(); S.enCapa(c, 1);
          // los puntales que sujetan la fachada por detrás
          if (a > 0) {
            c.globalAlpha = a;
            [[X1 - 30, TOP + 30, X1 + 110], [X1 - 30, TOP + 100, X1 + 70], [X0 + 20, TOP + 10, X0 - 40]].forEach(function (q) {
              var dx = q[2] - q[0], len = Math.hypot(dx, BASE - q[1]), ang = Math.atan2(BASE - q[1], dx);
              c.save(); c.translate(q[0], q[1]); c.rotate(ang); A.cel(c, A.rect(0, -4, len, 8), [P.madera3[2], P.madera3[1]], 0, -2); c.restore();
              A.bajo(A.rect(q[2] - 10, BASE - 4, 20, 8), c, P.madera3[2]);
            });
            // la cámara de rodaje en su trípode, con sus dos bobinas, y el operador
            var cx = X0 - 120, cy = BASE + 110;
            c.strokeStyle = '#2a2428'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx, cy - 92); c.lineTo(cx - 34, cy); c.moveTo(cx, cy - 92); c.lineTo(cx + 30, cy); c.moveTo(cx, cy - 92); c.lineTo(cx + 4, cy + 6); c.stroke();
            A.cel(c, A.rect(cx - 30, cy - 132, 60, 40), ['#2a2a30', '#4a4a54'], -2, -2);
            A.cel(c, A.rect(cx + 30, cy - 122, 22, 20), ['#2a2a30', '#5a5a64'], -1, -1);
            [[cx - 12, cy - 150], [cx + 18, cy - 150]].forEach(function (b, i) { c.save(); c.translate(b[0], b[1]); c.rotate(t / 300 * (i ? 1 : -1)); A.bajo(A.circulo(0, 0, 18), c, '#3a3a42'); c.strokeStyle = '#8a8a96'; c.lineWidth = 2; c.beginPath(); for (var r = 0; r < 3; r++) { var an = r / 3 * TAU; c.moveTo(0, 0); c.lineTo(Math.cos(an) * 14, Math.sin(an) * 14); } c.stroke(); c.restore(); });
            A.persona(c, cx - 56, cy + 2, 96, { tipo: 'de pie', ropa: ['#e8e0cc', '#c0b8a4'], mira: 1, brazo: 'apoyado', sombrero: '#f2ecd8' }, P);
          }
          c.restore();
        },
        frente: function (c, t) {
          var W = E.W, H = E.H, ap = U.meseta(t, 300, 1300, D - 1400, D - 300);
          if (ap <= 0) return;
          // la película: tono sepia, grano, rayas y luz que parpadea
          c.save();
          c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(232,190,140,' + (0.55 * ap).toFixed(3) + ')'; c.fillRect(0, 0, W, H);
          c.globalCompositeOperation = 'source-over';
          var r = U.azar(Math.floor(t / 70) + 1);
          c.fillStyle = 'rgba(255,248,230,' + (0.05 * ap * r()).toFixed(3) + ')'; c.fillRect(0, 0, W, H);
          c.fillStyle = 'rgba(30,18,8,' + (0.5 * ap).toFixed(3) + ')'; for (var i = 0; i < 60; i++) c.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2);
          c.strokeStyle = 'rgba(255,248,230,' + (0.25 * ap).toFixed(3) + ')'; c.lineWidth = 1; for (i = 0; i < 2; i++) { var rx = r() * W; c.beginPath(); c.moveTo(rx, 0); c.lineTo(rx + (r() - 0.5) * 8, H); c.stroke(); }
          // las bandas negras y las perforaciones
          var bh = H * 0.1 * U.inOut(U.tramo(t, 300, 1300)) * (1 - U.tramo(t, D - 1400, D - 300));
          c.fillStyle = '#0a0806'; c.fillRect(0, 0, W, bh); c.fillRect(0, H - bh, W, bh);
          c.fillStyle = 'rgba(240,226,200,.5)'; var paso = 26, des = (t * 0.06) % paso;
          for (var px = -paso + des; px < W + paso; px += paso) { if (bh > 18) { c.fillRect(px, bh * 0.35, 12, bh * 0.3); c.fillRect(px, H - bh * 0.65, 12, bh * 0.3); } }
          c.restore();
          // la claqueta
          var ac = U.meseta(t, 900, 1300, 3400, 4000); if (ac > 0) {
            var cw = Math.min(W * 0.36, 260), chh = cw * 0.62, cx = W < 700 ? W / 2 - cw / 2 : W * 0.62, cy = H * 0.2, cierre = U.entra(U.tramo(t, 1500, 1750));
            c.save(); c.globalAlpha = ac;
            c.fillStyle = '#1a1a1a'; c.fillRect(cx, cy, cw, chh);
            c.strokeStyle = '#f2ece0'; c.lineWidth = 1.5; c.strokeRect(cx + 6, cy + chh * 0.28, cw - 12, chh * 0.66);
            c.beginPath(); c.moveTo(cx + 6, cy + chh * 0.6); c.lineTo(cx + cw - 6, cy + chh * 0.6); c.moveTo(cx + cw / 2, cy + chh * 0.6); c.lineTo(cx + cw / 2, cy + chh * 0.94); c.stroke();
            c.fillStyle = '#f2ece0'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = '500 ' + Math.round(cw * 0.06) + 'px "IBM Plex Mono", monospace';
            c.fillText('TABERNAS · ALMERÍA', cx + 14, cy + chh * 0.44); c.fillText('ESCENA 1', cx + 14, cy + chh * 0.77); c.fillText('TOMA 1', cx + cw / 2 + 10, cy + chh * 0.77);
            // el palo de arriba, que se cierra
            c.save(); c.translate(cx, cy + chh * 0.02); c.rotate(-0.42 * (1 - cierre));
            c.fillStyle = '#1a1a1a'; c.fillRect(0, -chh * 0.2, cw, chh * 0.2);
            c.fillStyle = '#f2ece0'; for (var b = 0; b < 6; b++) { c.beginPath(); c.moveTo(b * cw / 6 + 6, -chh * 0.2); c.lineTo(b * cw / 6 + cw / 12 + 6, -chh * 0.2); c.lineTo(b * cw / 6 + 6, 0); c.lineTo(b * cw / 6 - cw / 12 + 6, 0); c.fill(); }
            c.restore();
            if (t > 1750 && t < 2300) S.letra(c, '¡CLAC!', cx + cw / 2, cy - chh * 0.4, Math.round(cw * 0.11), S.ACENTO);
            c.restore();
          }
          // dónde estamos de verdad
          var p = S.pant(X1 + 60, TOP - 60, 1);
          S.rotulo(c, 'DECORADO', p[0], p[1], U.meseta(t, 2600, 3200, D - 2200, D - 700), S.ACENTO);
          S.rotulo(c, 'DESIERTO DE TABERNAS · ALMERÍA · 37°N 2°O', W / 2, H * 0.1 + 26, U.meseta(t, 3600, 4200, D - 2200, D - 700), S.CREMA);
        }
      };
    }
  });
})();
