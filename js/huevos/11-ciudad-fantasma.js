/* Secreto escondido 1 · La ciudad fantasma (Lugar)
   A medianoche (de las 23:00 a la 1:30), pulsar el cartel de la entrada del pueblo, el de «POP. 312». (Pau 02/11: antes
   bastaba con esperar en la calle, pero quien esperaba para el tiroteo podía encontrarlo sin querer.)
   La escena: el pueblo se vacía a medida que corren los años (arriba, Bodie: de 5.417 habitantes en 1880 a nadie): las
   ventanas se apagan y se quedan negras, los cristales se rajan, tablas clavadas en cruz sobre las puertas, letreros
   colgando de un clavo, agujeros en las fachadas y telarañas; el color se va, la niebla corre por la calle, pasan las
   rodadoras y los murciélagos. Al final, el parque estatal: «decadencia detenida». */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, A = VA.arte, PA = VA.paisaje, S = VA.esc;
  var TAU = Math.PI * 2, BASE = A.BASE, T0 = 1500, T1 = 8800;
  // [año, habitantes]: el censo de 1880, 1910 y 1920; hacia 1943 quedaban tres; en 1962, parque estatal
  var CENSO = [[1880, 5417], [1910, 698], [1920, 120], [1943, 3], [1962, 0]];
  // los faroles de la calle mayor (los mismos sitios que en paisaje.js)
  var FAROLES = [1656, 1840, 2036, 2486, 2700, 2990, 3460, 3840];
  function medianoche() { var h = PA.hora; return h >= 23 || h < 1.5; }
  // el cartel de la entrada (los dos letreros y el poste, en lámina)
  function enCartel(d) { var x = d.l * S.K, y = d.yu * S.K; return x > 1432 && x < 1568 && y > 664 && y < 770; }
  function ano(t) { return Math.round(U.lerp(1880, 1962, U.inOut(U.tramo(t, T0, T1)))); }
  function habitantes(a) {
    for (var i = 1; i < CENSO.length; i++) if (a <= CENSO[i][0]) { var p = CENSO[i - 1], q = CENSO[i], k = (a - p[0]) / (q[0] - p[0]); return q[1] === 0 ? Math.round(p[1] * (1 - k)) : Math.round(Math.exp(U.lerp(Math.log(p[1]), Math.log(q[1]), k))); }
    return 0;
  }

  VA.registrar({
    id: 'ciudad-fantasma', n: 11, escondido: true, nombre: 'La ciudad fantasma', tipo: 'Lugar',
    pista: 'A medianoche, el cartel de la entrada cuenta a los vecinos. Pregúntale cuántos quedan.',
    detectar: function (api) {
      api.en('clic', function (d) { if (medianoche() && enCartel(d)) api.disparar(); });
    },
    escena: function () {
      var D = 15500 + E.lectura, casas = null, RODA = null;
      // el deterioro de cada casa, uno tras otro: k entre 0 y 1
      function k(i, t) { return U.suave(U.tramo(t, T0 + i * 380, T0 + i * 380 + 2600)); }
      function tabla(c, x0, y0, x1, y1, w, a) {
        var ang = Math.atan2(y1 - y0, x1 - x0), l = Math.hypot(x1 - x0, y1 - y0);
        c.save(); c.globalAlpha = a; c.translate(x0, y0); c.rotate(ang);
        A.cel(c, A.rect(-6, -w / 2, l + 12, w), [S.dePaleta('#5e574e'), S.dePaleta('#8a8274')], 0, -1.5);
        c.strokeStyle = 'rgba(30,24,20,.5)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-4, -w * 0.1); c.lineTo(l + 8, w * 0.05); c.stroke();
        c.fillStyle = '#2a2420'; c.beginPath(); c.arc(2, 0, 1.6, 0, TAU); c.arc(l - 2, 0, 1.6, 0, TAU); c.fill();
        c.restore();
      }
      return {
        duracion: D, detenerDia: true, sinTren: true,
        tarjeta: { en: 9300, hasta: D - 400, titulo: 'La ciudad fantasma', pie: 'Bodie · California · parque histórico estatal desde 1962',
          texto: 'Bodie (California) fue uno de los pueblos mineros más salvajes del Oeste: el censo de 1880 contó 5.417 habitantes. Cuando se acabó el oro se fueron yendo; en 1910 quedaban 698 y en 1920, 120, y hacia 1915 ya la llamaban ciudad fantasma. En 1962 se convirtió en parque histórico estatal: los edificios que quedan se conservan tal como los dejaron, con las cosas aún dentro, en «decadencia detenida».' },
        inicio: function () {
          E.irA(2.75, 1400); PA.rodadoraOculta = true;
          casas = PA.EDIF.map(function (e, i) { return { e: e, g: A.edificio(e), i: i }; });
          RODA = (function () { var c = document.createElement('canvas'), d = Math.min(2, E.dpr), k2 = S.k(), R = 46; c.width = c.height = Math.ceil(R * 2 * k2 * d); var x = c.getContext('2d'); x.scale(k2 * d, k2 * d); x.translate(R, R); S.rodadora(x, 0, 0, 40, 0, PA.paleta()); return { c: c, R: R }; })();
        },
        fin: function () { PA.rodadoraOculta = false; },
        calle: function (c, t) {
          if (!casas) return;
          c.save(); S.enCapa(c, 1);
          casas.forEach(function (o) {
            var a = k(o.i, t); if (a <= 0) return;
            var g = o.g, e = o.e, r;
            // las ventanas y los escaparates se apagan y se quedan negros, con el cristal rajado
            g.escaparates.concat(g.ventanas).forEach(function (v, j) {
              r = A.rectDe(v); c.fillStyle = 'rgba(8,10,20,' + (0.88 * a).toFixed(3) + ')'; c.fillRect(r.x, r.y, r.w, r.h);
              if ((o.i + j) % 2 === 0) { c.strokeStyle = 'rgba(200,210,230,' + (0.45 * a).toFixed(3) + ')'; c.lineWidth = 0.8; c.beginPath(); var cx = r.x + r.w * 0.4, cy = r.y + r.h * 0.35; for (var q = 0; q < 5; q++) { var an = q * 1.3 + j; c.moveTo(cx, cy); c.lineTo(cx + Math.cos(an) * r.w * 0.5, cy + Math.sin(an) * r.h * 0.5); } c.stroke(); }
            });
            // la puerta negra y dos tablas clavadas en cruz
            r = A.rectDe(g.puerta); c.fillStyle = 'rgba(8,10,20,' + (0.9 * a).toFixed(3) + ')'; c.fillRect(r.x, r.y, r.w, r.h);
            var ka = U.tramo(a, 0.5, 1);
            if (ka > 0) { tabla(c, r.x - 6, r.y + 10, r.x + r.w + 6, r.y + r.h - 14, 8, ka); tabla(c, r.x + r.w + 6, r.y + 12, r.x - 6, r.y + r.h - 18, 8, ka); }
            // un letrero que cuelga de un solo clavo, balanceándose
            if (o.i % 3 === 0 && a > 0.6) {
              var lr = A.rectDe(g.letrero), sw = Math.sin(t / 700 + o.i) * 0.05;
              c.save(); c.translate(lr.x + 6, lr.y + 4); c.rotate(0.55 + sw);
              c.fillStyle = 'rgba(8,10,20,.85)'; c.fillRect(-3, -3, lr.w * 0.9, 7);
              A.cel(c, A.rect(0, -2, lr.w * 0.85, lr.h * 0.7), [S.dePaleta('#6e665a'), S.dePaleta('#968c7c')], 0, -1.5);
              c.restore();
            }
            // agujeros en las tablas de la fachada
            if (o.i % 2 === 1 && a > 0.4) {
              var hx = e.x + e.w * 0.72, hy = e.top + (BASE - e.top) * 0.36; c.fillStyle = 'rgba(8,10,20,' + (0.85 * U.tramo(a, 0.4, 1)).toFixed(3) + ')';
              c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + 18, hy + 3); c.lineTo(hx + 22, hy + 14); c.lineTo(hx + 9, hy + 20); c.lineTo(hx + 2, hy + 12); c.closePath(); c.fill();
            }
            // telarañas en las esquinas del porche
            if (a > 0.7) {
              var px = e.x - 6, py = BASE - 78; c.strokeStyle = 'rgba(220,226,240,' + (0.35 * U.tramo(a, 0.7, 1)).toFixed(3) + ')'; c.lineWidth = 0.6; c.beginPath();
              for (var q2 = 0; q2 < 5; q2++) { var an2 = q2 / 4 * Math.PI / 2; c.moveTo(px, py); c.lineTo(px + Math.cos(an2) * 26, py + Math.sin(an2) * 26); }
              for (var rr = 8; rr <= 24; rr += 8) { c.moveTo(px + rr, py); for (q2 = 1; q2 <= 4; q2++) { var an3 = q2 / 4 * Math.PI / 2; c.lineTo(px + Math.cos(an3) * rr, py + Math.sin(an3) * rr); } }
              c.stroke();
            }
          });
          // los faroles de la calle se apagan (el halo se tapa y el cristal se queda oscuro)
          FAROLES.forEach(function (x, j) {
            var a = U.suave(U.tramo(t, T0 + 600 + j * 450, T0 + 1600 + j * 450)); if (a <= 0) return;
            var y = BASE - 76, g = c.createRadialGradient(x, y + 3, 4, x, y + 3, 46); g.addColorStop(0, 'rgba(10,12,24,' + (0.55 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(10,12,24,0)');
            c.fillStyle = g; c.beginPath(); c.arc(x, y + 3, 46, 0, TAU); c.fill();
            c.fillStyle = 'rgba(30,34,48,' + (0.95 * a).toFixed(3) + ')'; c.fillRect(x - 6, y - 5, 12, 14);
          });
          c.restore();
        },
        frente: function (c, t) {
          var W = E.W, H = E.H, kk = U.suave(U.tramo(t, T0, T1)) * (1 - U.tramo(t, D - 1200, D - 200));
          // el color se va y todo se enfría
          if (kk > 0) {
            c.save(); c.globalCompositeOperation = 'saturation'; c.fillStyle = 'rgba(128,128,128,' + (0.75 * kk).toFixed(3) + ')'; c.fillRect(0, 0, W, H); c.restore();
            c.fillStyle = 'rgba(16,22,44,' + (0.22 * kk).toFixed(3) + ')'; c.fillRect(0, 0, W, H);
          }
          // la niebla que corre por la calle
          for (var n = 0; n < 4; n++) {
            var x = ((t * (0.02 + n * 0.008) + n * W * 0.37) % (W * 1.6)) - W * 0.3, y = H * (0.8 + n * 0.035), g = c.createRadialGradient(x, y, 0, x, y, W * 0.35);
            g.addColorStop(0, 'rgba(200,210,230,' + (0.22 * kk).toFixed(3) + ')'); g.addColorStop(1, 'rgba(200,210,230,0)');
            c.save(); c.translate(x, y); c.scale(1, 0.18); c.translate(-x, -y); c.fillStyle = g; c.beginPath(); c.arc(x, y, W * 0.35, 0, TAU); c.fill(); c.restore();
          }
          // dos rodadoras que cruzan
          [[3600, 0.86, 30], [8200, 0.92, 38]].forEach(function (q) {
            var dt = t - q[0]; if (dt < 0 || dt > 6000 || !RODA) return;
            var k2 = S.k(), r = q[2] * k2, rx = -80 + dt * (W + 160) / 6000, ry = H * q[1] - Math.abs(Math.sin(dt / 280)) * r * 0.8, lado = RODA.R * 2 * k2 * (q[2] / 40);
            c.save(); c.globalAlpha = 0.9; c.translate(rx, ry); c.rotate(dt / 300); c.drawImage(RODA.c, -lado / 2, -lado / 2, lado, lado); c.restore();
          });
          // los murciélagos
          c.fillStyle = 'rgba(10,10,18,' + (0.9 * kk).toFixed(3) + ')';
          for (var m = 0; m < 4; m++) {
            var bx = W * (0.2 + m * 0.18) + Math.sin(t / (500 + m * 90) + m) * W * 0.08, by = H * (0.16 + (m % 2) * 0.08) + Math.cos(t / (380 + m * 60) + m * 2) * H * 0.04, al = Math.sin(t / 60 + m) * 5;
            c.beginPath(); c.moveTo(bx - 10, by - al); c.quadraticCurveTo(bx - 5, by - 2, bx, by + 2); c.quadraticCurveTo(bx + 5, by - 2, bx + 10, by - al); c.quadraticCurveTo(bx + 4, by + 1, bx, by + 4); c.quadraticCurveTo(bx - 4, by + 1, bx - 10, by - al); c.fill();
          }
          // el año y los que quedan
          var a = ano(t), ar = U.meseta(t, T0 - 500, T0, D - 2200, D - 600);
          S.rotulo(c, 'BODIE · CALIFORNIA · ' + a, W / 2, H * 0.12, ar, S.CREMA, 12);
          S.rotulo(c, a >= 1962 ? 'PARQUE ESTATAL · «DECADENCIA DETENIDA»' : S.num(habitantes(a)) + ' HABITANTES', W / 2, H * 0.12 + 34, ar, a >= 1962 ? S.ACENTO : S.CREMA, 12);
        }
      };
    }
  });
})();
