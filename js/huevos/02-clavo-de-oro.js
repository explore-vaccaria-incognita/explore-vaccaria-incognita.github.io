/* Secreto 02 · El clavo de oro (Gesto)
   Apretar por encima de la vía y bajar hasta el raíl, como quien da un mazazo.
   La pista en vivo (Pau 02/11: «no se sabe cómo tienes que hacerlo»): en cuanto aprietas por encima de la vía y bajas,
   aparece un mazo bajo el dedo que se va echando hacia delante, una guía a rayas hasta el raíl y el clavo de oro
   esperando abajo. Si sueltas antes, el mazo se va; si llegas al raíl, golpe y secreto.
   La escena: de cerca, en una lámina de papel, el clavo de oro a medio clavar en la traviesa; el mazo baja… y falla (como
   Stanford); el segundo golpe lo clava, con chispas. Lejos, por la vía, llegan la Jupiter del Central Pacific por la
   izquierda y la 119 del Union Pacific por la derecha y se quedan morro con morro sobre el clavo; por los hilos del
   telégrafo sale a todo el país, en Morse, una sola palabra: DONE. */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, A = VA.arte, PA = VA.paisaje, S = VA.esc;
  var TAU = Math.PI * 2, VIA = A.VIA, PLL = 0.6, UNIDAD = 120, TM = 3000, LUGAR = 7.2;
  var GOLPES = [[1300, 1560, false], [2300, 2560, true]];   // [sube, baja, acierta]
  function yVia() { return VIA / S.K * E.H; }

  // una locomotora con su ténder, pintada una vez (sin ruedas: van en vivo); al revés para la Jupiter
  function loco(P, num, rotulo, alReves) {
    var X0 = 0;
    return S.sprite(X0 - 8, VIA - 132, 304, 140, function (c) {
      c.save(); c.beginPath(); c.rect(X0 - 8, VIA - 132, 302, 140); c.clip();
      A.trenDetallado(c, X0, P, { sinRuedas: true }); c.restore();
      // las placas: el número en la cabina y las siglas en el ténder (escritas al revés si el dibujo se va a voltear)
      var RO = A.mezcla(P.rojo, '#000000', 0.25);
      c.fillStyle = RO; c.fillRect(X0 + 166, VIA - 61, 30, 16);
      c.fillStyle = P.loco[1]; c.fillRect(X0 + 222, VIA - 57, 62, 14);
      [[num, X0 + 181, VIA - 53, 10], [rotulo, X0 + 253, VIA - 50, 9]].forEach(function (q) {
        c.save(); c.translate(q[1], q[2]); if (alReves) c.scale(-1, 1);
        S.letra(c, q[0], 0, 0, q[3], P.laton); c.restore();
      });
    });
  }
  function ruedas(c, x0, P) {
    [[56, 12], [82, 12], [226, 10], [246, 10], [262, 10], [282, 10]].forEach(function (q) { A.ruedaTren(c, x0 + q[0], VIA - q[1], q[1], q[1] > 10 ? P.rojo : P.hierro2, P, false, x0 / q[1]); });
    A.ruedasTren(c, x0, P, x0, true);
  }

  VA.registrar({
    id: 'clavo-de-oro', n: 2, nombre: 'El clavo de oro', tipo: 'Gesto',
    pista: 'A la vía le falta el último clavo. Aprieta por encima de los raíles y baja hasta ellos, como quien da un mazazo.',
    detectar: function (api) {
      var golpe = null;
      function comprobar(px, py) {
        if (!golpe) return false;
        var dy = py - golpe.y0, dx = px - golpe.x0;
        if (dy > E.H * 0.1 && Math.abs(dx) < dy * 0.7 && py >= yVia() - E.H * 0.012) { golpe = null; api.disparar({ x: px }); return true; }
        return false;
      }
      api.en('bajar', function (d) { if (!api.hallado() && d.y < yVia() - E.H * 0.06) golpe = { x0: d.x, y0: d.y, k: 0, a: 0 }; });
      var soltar = function () { if (!golpe || golpe.suelta) return; if (!comprobar(E.puntero.x, E.puntero.y)) golpe.suelta = E.t; };
      window.addEventListener('pointerup', soltar); window.addEventListener('pointercancel', soltar);
      api.en('cuadro', function () {
        if (!golpe) return;
        if (golpe.suelta) { if (E.t - golpe.suelta > 350) golpe = null; return; }
        var p = E.puntero, dy = p.y - golpe.y0, dx = p.x - golpe.x0;
        golpe.vertical = dy > 16 && Math.abs(dx) < dy * 0.7;
        golpe.k = U.clamp(dy / Math.max(1, yVia() - golpe.y0), 0, 1);
        golpe.a += ((golpe.vertical ? U.tramo(dy, 16, 60) : 0) - golpe.a) * 0.25;
        comprobar(p.x, p.y);
      });
      // la pista: el mazo bajo el dedo, la guía hasta el raíl y el clavo que espera
      api.capa(function (c, t) {
        if (!golpe) return;
        var a = golpe.suelta ? golpe.a * (1 - U.tramo(E.t - golpe.suelta, 0, 350)) : golpe.a; if (a <= 0.01) return;
        var p = E.puntero, ty = yVia(), H = E.H, k = golpe.k, sube = golpe.suelta ? U.tramo(E.t - golpe.suelta, 0, 350) * H * 0.05 : 0;
        c.save(); c.globalAlpha = a;
        // el clavo de oro en el raíl, con su pulso
        var pul = 0.5 + 0.5 * Math.sin(t / 180), r = H * 0.016;
        c.strokeStyle = S.ACENTO; c.lineWidth = 1.5; c.globalAlpha = a * (0.35 + 0.4 * pul); c.beginPath(); c.ellipse(p.x, ty, r * (2 + pul), r * (0.8 + pul * 0.4), 0, 0, TAU); c.stroke();
        c.globalAlpha = a; var gc = c.createLinearGradient(p.x - r * 0.4, 0, p.x + r * 0.4, 0); gc.addColorStop(0, '#a8701e'); gc.addColorStop(0.5, '#fff0b0'); gc.addColorStop(1, '#c8902a');
        c.fillStyle = gc; c.fillRect(p.x - r * 0.3, ty - r * 1.6, r * 0.6, r * 1.6); c.fillRect(p.x - r * 0.3, ty - r * 1.9, r * 1.3, r * 0.45);
        S.destello(c, p.x, ty - r * 1.7, r * 0.5 * (0.6 + pul * 0.6), a);
        // la guía a rayas, que corre hacia abajo
        c.lineCap = 'round'; c.setLineDash([6, 8]); c.lineDashOffset = -t / 25;
        c.beginPath(); c.moveTo(p.x, p.y + H * 0.03); c.lineTo(p.x, ty - r * 2.3);
        c.strokeStyle = 'rgba(40,20,8,.45)'; c.lineWidth = 4.2; c.stroke(); c.strokeStyle = '#ffe6b0'; c.lineWidth = 2.2; c.stroke(); c.setLineDash([]);
        // el mazo: la cabeza bajo el dedo, el mango que se echa hacia delante a medida que bajas
        var ang = U.lerp(-2.25, -3.05, U.suave(k)), L = H * 0.15, hw = H * 0.026, hh = H * 0.04;
        c.save(); c.translate(p.x, p.y - sube); c.rotate(ang + Math.PI / 2);
        c.fillStyle = 'rgba(30,16,8,.25)'; c.fillRect(-hw * 0.3 + 3, -L + 3, hw * 0.3, L);
        var gm = c.createLinearGradient(-hw * 0.2, 0, hw * 0.2, 0); gm.addColorStop(0, '#5a3a20'); gm.addColorStop(0.5, '#b8885a'); gm.addColorStop(1, '#6a4428');
        c.fillStyle = gm; c.fillRect(-hw * 0.16, -L, hw * 0.32, L);
        c.restore();
        c.save(); c.translate(p.x, p.y - sube); c.rotate(ang + Math.PI);
        var gh = c.createLinearGradient(0, -hh / 2, 0, hh / 2); gh.addColorStop(0, '#f2f2fa'); gh.addColorStop(0.5, '#b8b8c4'); gh.addColorStop(1, '#5a5a66');
        c.fillStyle = gh; c.fillRect(-hw / 2, -hh / 2, hw, hh); c.fillStyle = '#4a4a54'; c.fillRect(-hw / 2, -hh / 2, hw * 0.16, hh); c.fillRect(hw / 2 - hw * 0.16, -hh / 2, hw * 0.16, hh);
        c.restore();
        // el letrero, solo al principio
        S.rotulo(c, '↓ HASTA LA VÍA', p.x, ty + H * 0.045, a * (1 - U.tramo(k, 0.6, 0.9)), S.ACENTO, 10);
        c.restore();
      });
    },
    escena: function () {
      var D = 14500 + E.lectura, P, xl, spJ, sp119;
      var MORSE = S.impulsos('DONE');
      return {
        duracion: D,
        tarjeta: { en: 8600, hasta: D - 400, titulo: 'El clavo de oro', pie: 'Promontory Summit · Utah · 10.05.1869',
          texto: 'El 10 de mayo de 1869, en Promontory Summit (Utah), se unieron las vías del Central Pacific, que venía de Sacramento, y del Union Pacific, que venía del este: el primer ferrocarril que cruzaba el continente. Las locomotoras Jupiter y 119 quedaron morro con morro. Leland Stanford levantó el mazo… y falló. Daba igual: el telegrafista envió igualmente una sola palabra a todo el país, «DONE». El clavo, de oro de 17,6 quilates, se quitó enseguida; hoy está en la Universidad de Stanford.' },
        inicio: function () {
          P = PA.paleta();
          // la cámara va a un tramo de vía despejado (entre el rancho y la mina) y el clavo queda un poco a la izquierda del centro
          var camX = U.clamp(LUGAR * E.u - E.W / 2, 0, E.maxCam()), k = S.k();
          E.irA(LUGAR, 1500);
          xl = Math.round(((E.W * 0.42 - E.W / 2 + (E.W / 2 + camX) * PLL) / k) / 13) * 13 + 2.5;
          spJ = loco(P, '60', 'C. P. R. R.', true);
          sp119 = loco(Object.assign({}, P, { caldera: ['#4a5a4e', '#2c3a32'], rojo: '#8a2a22' }), '119', 'U. P. R. R.', false);
        },
        sinTren: true,
        llanura: function (c, t) {
          // las dos locomotoras, frenando hasta quedar morro con morro
          c.save(); S.enCapa(c, PLL);
          var kJ = U.sale(U.tramo(t, 500, 3700)), k1 = U.sale(U.tramo(t, 200, 3400));
          var xJ = xl + 6 + 1100 * (1 - kJ), x1 = xl + 6 + 1100 * (1 - k1);
          c.save(); c.translate(2 * xl, 0); c.scale(-1, 1); S.pegar(c, spJ, xJ); ruedas(c, xJ, P); c.restore();
          S.pegar(c, sp119, x1); ruedas(c, x1, P);
          // el brillo del clavo entre los dos morros
          var br = U.meseta(t, 2560, 2700, D - 2200, D - 600); if (br > 0) S.destello(c, xl, VIA - 3, 3 + Math.sin(t / 160), br);
          c.restore();
          // los impulsos de Morse por los hilos del telégrafo, hacia los dos lados del clavo
          if (t < TM) return;
          c.save(); S.enCapa(c, PLL); c.lineCap = 'round';
          var v = 0.75, a = 1 - U.tramo(t, D - 2000, D - 400);
          MORSE.forEach(function (q) {
            var te = TM + q.t * UNIDAD, dt = t - te; if (dt < 0) return;
            var largo = q.d * UNIDAD * v, cab = dt * v;
            [-1, 1].forEach(function (lado) {
              c.strokeStyle = S.ACENTO; c.lineWidth = 2.6; c.globalAlpha = a * 0.95; c.beginPath();
              for (var s = Math.max(0, cab - largo); s <= cab; s += 4) {
                var x = xl + lado * s, u = (((x - 20 + 15) % 160) + 160) % 160 / 160, y = VIA - 96 + 28 * u * (1 - u);
                s === Math.max(0, cab - largo) ? c.moveTo(x, y) : c.lineTo(x, y);
              }
              c.stroke();
            });
          });
          c.restore();
        },
        frente: function (c, t) {
          var W = E.W, H = E.H, k = S.k();
          // de cerca: el mazo y el clavo, en una lámina de papel
          var w = Math.min(W * 0.82, H * 0.5, 460), h = w * 0.6, vx = W - w - Math.min(W * 0.06, 60), vy = H * 0.1, av = U.meseta(t, 0, 500, 7600, 8400);
          if (W < 700) vx = (W - w) / 2;
          S.vineta(c, vx, vy, w, h, av, function (x, y, iw, ih) {
            var s = iw / 400, base = y + ih * 0.8, hor = y + ih * 0.5;
            // el cielo, la sierra de Promontory y el llano
            var g = c.createLinearGradient(0, y, 0, hor); g.addColorStop(0, '#8ec0e4'); g.addColorStop(1, '#f6dcb0'); c.fillStyle = g; c.fillRect(x, y, iw, hor - y + 1);
            c.fillStyle = '#9a8ab0'; c.beginPath(); c.moveTo(x, hor); for (var i = 0; i <= 12; i++) c.lineTo(x + iw * i / 12, hor - (18 + Math.abs(Math.sin(i * 1.7)) * 26 + (i % 3) * 6) * s); c.lineTo(x + iw, hor); c.fill();
            c.fillStyle = '#c4a6a0'; c.beginPath(); c.moveTo(x, hor); for (i = 0; i <= 8; i++) c.lineTo(x + iw * i / 8, hor - (6 + Math.abs(Math.sin(i * 2.3 + 1)) * 12) * s); c.lineTo(x + iw, hor); c.fill();
            var gs = c.createLinearGradient(0, hor, 0, y + ih); gs.addColorStop(0, '#e8c690'); gs.addColorStop(1, '#c49460'); c.fillStyle = gs; c.fillRect(x, hor, iw, y + ih - hor);
            // la traviesa (madera con su veta) y el raíl de lado: cabeza, alma y patín, con los tornillos de la brida
            A.cel(c, A.rect(x - 4, base, iw + 8, 22 * s), ['#5a3a24', '#7a5236', '#8a6444'], 0, -3 * s);
            c.strokeStyle = 'rgba(40,24,14,.4)'; c.lineWidth = 1; c.beginPath(); for (var v = 0; v < 4; v++) { c.moveTo(x, base + 5 * s + v * 5 * s); c.bezierCurveTo(x + iw * 0.3, base + 3 * s + v * 5 * s, x + iw * 0.7, base + 8 * s + v * 5 * s, x + iw, base + 5 * s + v * 5 * s); } c.stroke();
            var rt = base - 30 * s;
            A.cel(c, A.rect(x - 4, base - 6 * s, iw + 8, 6 * s), ['#3e3e48', '#6a6a76'], 0, -1.5 * s);
            A.cel(c, A.rect(x - 4, rt + 9 * s, iw + 8, 15 * s), ['#34343c', '#50505c'], 0, -2 * s);
            A.cel(c, A.rect(x - 4, rt, iw + 8, 10 * s), ['#5a5a66', '#a8a8b6', '#d8d8e2'], 0, -1.5 * s);
            c.fillStyle = '#26262e'; [0.18, 0.82].forEach(function (f) { c.beginPath(); c.arc(x + iw * f, rt + 16 * s, 3 * s, 0, TAU); c.fill(); });
            // el clavo: grande, de oro, que se hunde con el golpe bueno
            var dentro = U.sale(U.tramo(t, GOLPES[1][1] - 40, GOLPES[1][1] + 120)), alto = (50 - 32 * dentro) * s, sx = x + iw * 0.6, top = base - alto;
            var gc = c.createLinearGradient(sx - 8 * s, 0, sx + 8 * s, 0); gc.addColorStop(0, '#9a6418'); gc.addColorStop(0.45, '#fff2b8'); gc.addColorStop(1, '#c8902a');
            c.fillStyle = 'rgba(40,20,0,.25)'; c.fillRect(sx - 6 * s, base - 2 * s, 22 * s, 3 * s);
            c.fillStyle = gc; c.fillRect(sx - 6 * s, top, 12 * s, alto + 2 * s);
            A.cel(c, A.poli([[sx - 7 * s, top], [sx + 22 * s, top], [sx + 24 * s, top - 7 * s], [sx - 9 * s, top - 7 * s]]), ['#a8701e', '#e8b448', '#fff0b0'], -1.5 * s, -1.2 * s);
            var br2 = 0.6 + 0.4 * Math.sin(t / 220); S.destello(c, sx + 2 * s, top - 3 * s, 2.2 * s * br2, 0.8);
            // el mazo: un mango largo y la cabeza de plata; gira desde las manos (fuera de la lámina, a la izquierda)
            var R = 230 * s, ox = sx + 8 * s - R, oy = top - 7 * s - 17 * s, dx = 0, ang = -0.25;
            GOLPES.forEach(function (q, j) {
              var fin = q[2] ? 0 : 0.07, des = q[2] ? 0 : -46 * s;
              if (t >= q[0] - 600 && t < q[1] + 600) {
                dx = des * U.tramo(t, q[0] - 600, q[0] - 200) * (1 - U.tramo(t, q[1] + 200, q[1] + 600));
                ang = t < q[0] ? U.lerp(-0.25, -1.15, U.suave(U.tramo(t, q[0] - 600, q[0]))) : t < q[1] ? U.lerp(-1.15, fin, U.entra(U.tramo(t, q[0], q[1]))) : U.lerp(fin, -0.25, U.suave(U.tramo(t, q[1] + 150, q[1] + 600)));
              }
            });
            if (t > GOLPES[1][1] + 600) ang = -0.25 - 0.5 * U.tramo(t, GOLPES[1][1] + 600, GOLPES[1][1] + 1500);
            c.save(); c.translate(ox + dx, oy); c.rotate(ang);
            A.cel(c, A.rect(-20 * s, -4.5 * s, R + 4 * s, 9 * s), ['#5a3a20', '#9a6a40', '#b8885a'], 0, -1.5 * s);
            A.cel(c, A.rect(R - 15 * s, -17 * s, 30 * s, 34 * s), ['#6a6a76', '#c8c8d4', '#f2f2fa'], -2 * s, -2 * s);
            c.fillStyle = '#4a4a54'; c.fillRect(R - 15 * s, -17 * s, 4 * s, 34 * s); c.fillRect(R + 11 * s, -17 * s, 4 * s, 34 * s);
            c.restore();
            // el fallo: el mazo da en el raíl (chispa gris y polvo); el acierto: chispas de oro
            var df = t - GOLPES[0][1];
            if (df > 0 && df < 900) { for (i = 0; i < 10; i++) { var an = -Math.PI * (0.12 + i * 0.077), r = df * 0.1 * s * (0.6 + (i % 3) * 0.3); c.fillStyle = 'rgba(150,120,90,' + (0.75 * (1 - df / 900)).toFixed(3) + ')'; c.beginPath(); c.arc(sx - 40 * s + Math.cos(an) * r, rt + Math.sin(an) * r + df * df * 0.00008 * s, 3.5 * s, 0, TAU); c.fill(); } }
            var da = t - GOLPES[1][1];
            if (da > 0 && da < 1200) { for (i = 0; i < 18; i++) { var an2 = -Math.PI * (0.04 + i * 0.052), r2 = da * 0.24 * s * (0.5 + (i % 4) * 0.2); S.destello(c, sx + 6 * s + Math.cos(an2) * r2, top + Math.sin(an2) * r2 + da * da * 0.00022 * s, 2.6 * s, 1 - da / 1200); } }
            // los letreros de la lámina
            c.save(); c.fillStyle = 'rgba(59,38,24,.75)'; c.font = 'italic ' + Math.round(15 * s) + 'px "Instrument Serif", Georgia, serif'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('The last spike', x + 12 * s, y + 10 * s); c.restore();
            S.letra(c, df > 0 && t < GOLPES[1][0] ? '¡FALLO!' : da > 0 ? '17,6 QUILATES' : '', x + iw - 12 * s, y + 20 * s, Math.round(15 * s), '#7a2418', 'right');
          });
          // la palabra que sale por el hilo
          var hechas = 0; MORSE.forEach(function (q) { if (t >= TM + q.t * UNIDAD) hechas = Math.max(hechas, q.letra + 1); });
          var ar = U.meseta(t, TM - 400, TM, D - 2000, D - 500), ry = Math.min(vy + h + 34, H * 0.48);
          S.rotulo(c, 'WESTERN UNION · PROMONTORY SUMMIT', W < 700 ? W / 2 : vx + w / 2, ry, ar, S.CREMA);
          var txt = 'DONE'.slice(0, hechas).split('').join(' '), cod = 'DONE'.slice(0, hechas).split('').map(function (l) { return S.MORSE[l].replace(/\./g, '·').replace(/-/g, '—'); }).join('  ');
          if (hechas) { S.rotulo(c, txt, W < 700 ? W / 2 : vx + w / 2, ry + 36, ar, S.ACENTO, 18); S.rotulo(c, cod, W < 700 ? W / 2 : vx + w / 2, ry + 76, ar * 0.9, S.CREMA, 11); }
        }
      };
    }
  });
})();
