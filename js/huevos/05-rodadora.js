/* Secreto 05 · La planta rodadora (Gesto)
   Atrapar la planta rodadora mientras cruza (pasa cada 20 s): encima, el cursor es una mano; al apretar se queda
   agarrada, se arrastra con ella y al soltarla sale lanzada (Pau 02/11: había que encontrar una forma mejor que
   arrastrar por encima a ciegas).
   La escena: la empujada sale rodando; abajo a la izquierda aparece un saco de semilla de lino que se vuelca; de las
   semillas brotan matas verdes que se secan, se sueltan de la raíz y echan a rodar; detrás llegan decenas más, a todas
   las distancias: la invasión. Arriba, de dónde vino y cuándo. */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, A = VA.arte, PA = VA.paisaje, S = VA.esc;
  var TAU = Math.PI * 2, BASE = A.BASE;
  // las que llegan: [retraso, y en lámina, radio, velocidad]
  var OLA = (function () { var r = U.azar(1873), out = []; for (var i = 0; i < 38; i++) out.push([4600 + r() * 5200, BASE + 40 + r() * 130, 16 + r() * 30, 0.32 + r() * 0.3, r() * TAU]); return out; })();
  var BROTES = [[0.1, 0.14], [0.17, 0.2], [0.24, 0.12], [0.3, 0.22], [0.36, 0.16]];

  VA.registrar({
    id: 'rodadora', n: 5, nombre: 'La planta rodadora', tipo: 'Gesto',
    pista: 'Cada poco cruza una planta rodadora con el viento. Atrápala… y lánzala.',
    detectar: function (api) {
      var agarre = null, lienzo = document.getElementById('lienzo');
      function cerca(x, y, f) { var ro = PA.rodadora(); return ro && Math.hypot(x - ro.x, y - ro.y) < ro.r * f ? ro : null; }
      api.en('mover', function (d) { if (!agarre) lienzo.style.cursor = !api.hallado() && cerca(d.x, d.y, 1.7) ? 'grab' : ''; });
      api.en('bajar', function (d) {
        if (api.hallado()) return;
        var ro = cerca(d.x, d.y, 1.7); if (!ro) return;
        d.tomar(); lienzo.style.cursor = 'grabbing';
        agarre = { pts: [[d.x, d.y, E.t]] };
        PA.rodadoraEn = { x: d.x, y: d.y, r: ro.r, kr: ro.kr };
      });
      api.en('arrastrar', function (d) {
        if (!agarre) return;
        var q = PA.rodadoraEn; q.kr += (d.x - q.x) / (q.r * 26); q.x = d.x; q.y = d.y;
        agarre.pts.push([d.x, d.y, E.t]); if (agarre.pts.length > 6) agarre.pts.shift();
      });
      api.en('soltar', function (d) {
        if (!agarre) return;
        var a = agarre.pts[0], b = agarre.pts[agarre.pts.length - 1], dt = Math.max(16, b[2] - a[2]);
        agarre = null; PA.rodadoraEn = null; lienzo.style.cursor = '';
        api.disparar({ x: d.x, y: d.y, vx: (b[0] - a[0]) / dt, vy: (b[1] - a[1]) / dt });
      });
    },
    escena: function (motor, datos) {
      var D = 13000 + E.lectura, sp = null, x0, y0, vx, vy;
      // una rodadora pintada una vez (radio 40 de lámina) que luego solo se gira y se copia
      function hoja(P) {
        var k = S.k(), d = Math.min(2, E.dpr), R = 46, cv = document.createElement('canvas'); cv.width = cv.height = Math.ceil(R * 2 * k * d);
        var c = cv.getContext('2d'); c.scale(k * d, k * d); c.translate(R, R); S.rodadora(c, 0, 0, 40, 0, P);
        return { c: cv, R: R };
      }
      function pinta(c, x, y, r, giro) {   // en pantalla
        var k = S.k(), s = r / 40, lado = sp.R * 2 * k * s;
        c.save(); c.translate(x, y); c.rotate(giro); c.drawImage(sp.c, -lado / 2, -lado / 2, lado, lado); c.restore();
      }
      return {
        duracion: D,
        tarjeta: { en: 7600, hasta: D - 400, titulo: 'La planta rodadora', pie: 'Salsola · el cardo ruso · Dakota del Sur, hacia 1873',
          texto: 'La planta rodadora, el símbolo del Oeste de las películas, es una inmigrante: es el cardo ruso (Salsola), de las estepas. Llegó hacia 1873 a Dakota del Sur, mezclada con la semilla de lino que traían agricultores ucranianos. Al secarse se suelta de la raíz y rueda con el viento soltando miles de semillas: en pocas décadas cubría las llanuras. Muchos westerns ambientados antes de 1873 la enseñan… y aún no estaba.' },
        inicio: function () {
          PA.rodadoraOculta = true; sp = hoja(PA.paleta());
          x0 = datos && isFinite(datos.x) ? datos.x : E.W * 0.4; y0 = datos && isFinite(datos.y) ? datos.y : (BASE + 80) / S.K * E.H;
          vx = datos && isFinite(datos.vx) ? U.clamp(datos.vx, 0.2, 3) : 0.6; vy = datos && isFinite(datos.vy) ? U.clamp(datos.vy, -1.5, 1.5) : 0;
        },
        fin: function () { PA.rodadoraOculta = false; },
        calle: function (c, t) {
          var W = E.W, H = E.H, k = S.k(), P = PA.paleta();
          // la empujada: sale disparada, botando
          var ke = t / 1600; if (ke < 1) pinta(c, x0 + vx * t + ke * ke * W * 0.6, Math.min(y0 + vy * t * (1 - ke), H) - Math.abs(Math.sin(ke * 9)) * 50 * k * (1 - ke), 32 * k, ke * 20 + vx * t / (32 * k));
          // el saco de semilla de lino, que se vuelca
          var sx = Math.max(60, W * 0.12), sy = (BASE + 130) * k, as = U.meseta(t, 900, 1500, D - 1600, D - 400), vu = U.inOut(U.tramo(t, 2100, 2900)) * 1.2;
          if (as > 0) {
            c.save(); c.globalAlpha = as; c.translate(sx, sy); c.rotate(vu); c.scale(k, k);
            var saco = A.suave([[-34, 0], [-38, -50], [-30, -88], [-20, -100], [-10, -94], [0, -104], [12, -94], [22, -100], [32, -86], [38, -48], [34, 0]]);
            A.cel(c, saco, ['#c8b088', '#eedcb4'], -3, -3);
            c.strokeStyle = '#8a6a44'; c.lineWidth = 2; c.beginPath(); c.moveTo(-26, -86); c.quadraticCurveTo(0, -80, 26, -86); c.stroke();
            S.letra(c, 'FLAX', 0, -54, 15, '#7a2418'); S.letra(c, 'SEED', 0, -36, 15, '#7a2418');
            c.restore();
            // las semillas que se derraman
            var ks = U.tramo(t, 2500, 3300);
            if (ks > 0) { c.fillStyle = 'rgba(120,84,40,' + as.toFixed(3) + ')'; for (var i = 0; i < 40; i++) { var r2 = U._h(i), q = ks * (0.4 + r2 * 0.6); c.beginPath(); c.arc(sx + 60 * k + q * (60 + r2 * 300) * k, sy - 30 * k + Math.min(30 * k, q * q * 90 * k) + U._h(i + 9) * 8 * k, 1.8 * k * 2, 0, TAU); c.fill(); } }
          }
          // los brotes: matas verdes que crecen, se secan, se sueltan y echan a rodar
          BROTES.forEach(function (b, i) {
            var bx = W * b[0] + 40 * k, by = sy - 4 * k + b[1] * 40 * k, cr = U.sale(U.tramo(t, 3200 + i * 140, 4300 + i * 140)), seca = U.tramo(t, 4300, 5000), rueda = U.tramo(t, 5000 + i * 220, 11000);
            if (cr <= 0) return;
            if (rueda <= 0) {
              var verde = A.mezcla('#6a8a3a', P.rodadora, seca);
              c.save(); c.translate(bx, by - 26 * k * cr); c.scale(cr, cr * (1 - 0.1 * seca));
              c.globalAlpha = 0.9; c.strokeStyle = verde; c.lineWidth = 1.4; c.stroke(A.rodadora(0, 0, 26 * k));
              c.restore();
            } else pinta(c, bx + rueda * rueda * W * 1.4, by - 26 * k - Math.abs(Math.sin(rueda * 30)) * 30 * k, 26 * k, rueda * 40);
          });
          // la ola: decenas, a todas las distancias
          OLA.forEach(function (q) {
            var dt = t - q[0]; if (dt < 0) return;
            var x = -80 + dt * q[3] * k * 1.4, y = q[1] * k - Math.abs(Math.sin(dt / 260 + q[4])) * q[2] * 0.9 * k; if (x > W + 80) return;
            c.globalAlpha = U.clamp((q[1] - BASE) / 120, 0.5, 1); pinta(c, x, y, q[2] * k, dt / (q[2] * 9) + q[4]); c.globalAlpha = 1;
          });
        },
        frente: function (c, t) {
          var W = E.W, H = E.H, y = H * 0.13;
          var t1 = U.meseta(t, 1800, 2400, 4800, 5400), t2 = U.meseta(t, 5200, 5800, D - 2200, D - 600);
          S.rotulo(c, '1873 · DAKOTA DEL SUR · EN SACOS DE SEMILLA DE LINO', W / 2, y, t1, S.CREMA);
          S.rotulo(c, 'SALSOLA · DE LAS ESTEPAS AL SALVAJE OESTE', W / 2, y, t2, S.ACENTO);
        }
      };
    }
  });
})();
