/* Secreto 01 · Treinta segundos (Espera)
   Quedarse quieto 30 s en la calle mayor (con el diario cerrado).
   La escena: son las tres de la tarde; por la izquierda llegan andando los tres Earp y Doc Holliday, de abrigo largo; en
   el solar estrecho entre el sheriff y la barbería esperan cinco Cowboys. Treinta disparos en treinta segundos (el reloj
   de arriba los cuenta, en cámara rápida): fogonazos y humo de pólvora; dos Cowboys salen corriendo; cuando el humo se
   va, en el suelo quedan tres sombreros. Encima del solar, dónde fue de verdad. */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, A = VA.arte, PA = VA.paisaje, S = VA.esc;
  var BASE = A.BASE, LOTE = 2595, ESPERA = 30000, T0 = 4300, T1 = 7500;
  var armado = true;
  // los cuatro de la ley (de abrigo largo y sombrero negro) y los cinco Cowboys
  var LEY = [[2300, 102, 116], [2346, 86, 110], [2392, 110, 118], [2436, 94, 112]];
  var COW = [[2534, 90, 112, 'camisa2'], [2568, 108, 116, 'camisa3'], [2602, 88, 110, 'ropa'], [2636, 104, 114, 'camisa2'], [2670, 92, 112, 'camisa3']];
  var HUYEN = [0, 4], CAEN = [1, 2, 3];
  var TIROS = (function () {
    var r = U.azar(1881), out = [];
    for (var i = 0; i < 30; i++) out.push({ t: T0 + Math.pow(i / 29, 0.9) * (T1 - T0) + (r() - 0.5) * 70, lado: r() < 0.55 ? 0 : 1, quien: Math.floor(r() * 4) });
    out.sort(function (a, b) { return a.t - b.t; });
    return out;
  })();
  function enCalle() { var l = E.centro(); return l > 1.95 && l < 4.15; }

  VA.registrar({
    id: 'ok-corral', n: 1, nombre: 'Treinta segundos', tipo: 'Espera',
    tiros: TIROS,   // (el sonido los lee para disparar a la vez que los fogonazos)
    pista: 'En la calle mayor, quédate quieto treinta segundos. Ni uno más.',
    detectar: function (api) {
      api.en('cuadro', function (d) {
        var aqui = enCalle(), abierto = document.documentElement.classList.contains('cuaderno-abierto');
        if (!aqui || d.inactivo < 1000) armado = true;
        if (armado && aqui && !abierto && d.inactivo >= ESPERA) { armado = false; api.disparar(); }
      });
    },
    escena: function () {
      var D = 13800 + E.lectura, h0;
      // dónde está cada uno (x en lámina) en el instante t
      function xLey(i, t) { return LEY[i][0] - 520 * (1 - U.inOut(U.tramo(t, 500 + i * 120, 3700 + i * 120))); }
      function xCow(i, t) { return HUYEN.indexOf(i) >= 0 ? COW[i][0] + 900 * U.entra(U.tramo(t, 4700 + i * 120, 6900 + i * 120)) : COW[i][0]; }
      function mano(x, y, h, mira) { return [x + mira * h * 0.36, y - h * 0.71]; }
      function brazo(c, x, y, h, mira, P, ropa) {
        var hom = [x + mira * h * 0.06, y - h * 0.78], m = mano(x, y, h, mira);
        A.bajo(A.pata([hom, [x + mira * h * 0.2, y - h * 0.75], m], [h * 0.06, h * 0.055, h * 0.05]), c, ropa[0]);
        c.fillStyle = P.hierro; c.save(); c.translate(m[0], m[1]); if (mira < 0) c.scale(-1, 1);
        c.fillRect(0, -h * 0.02, h * 0.1, h * 0.022); c.fillRect(0, -h * 0.02, h * 0.025, h * 0.06); c.restore();
      }
      function sombreroCaido(c, x, y, s, col) {
        c.fillStyle = 'rgba(40,20,10,.25)'; c.beginPath(); c.ellipse(x, y + 2, s * 1.2, s * 0.25, 0, 0, Math.PI * 2); c.fill();
        A.bajo(A.elipse(x, y, s, s * 0.22), c, A.mezcla(col, '#000000', 0.25));
        A.bajo(A.suave([[x - s * 0.5, y], [x - s * 0.45, y - s * 0.5], [x, y - s * 0.62], [x + s * 0.45, y - s * 0.5], [x + s * 0.5, y]]), c, col);
      }
      return {
        duracion: D, detenerDia: true,
        tarjeta: { en: 9400, hasta: D - 400, titulo: 'El tiroteo del O.K. Corral', pie: 'Tombstone · Arizona · 26.10.1881',
          texto: 'El 26 de octubre de 1881, hacia las tres de la tarde, en Tombstone (Arizona), los hermanos Virgil, Wyatt y Morgan Earp y Doc Holliday se enfrentaron a cinco Cowboys. Se dispararon unas treinta balas en unos treinta segundos; murieron tres. Y no fue dentro del O.K. Corral: fue en un solar estrecho de Fremont Street, junto al estudio del fotógrafo C. S. Fly.' },
        inicio: function () { E.irA(LOTE / S.K - (E.W > 800 ? 0.3 : 0), 1500); h0 = PA.hora; PA.rodadoraOculta = true; },
        cuadro: function (t) { PA.hora = U.lerp(h0, 15, U.suave(U.tramo(t, 0, 1800))); },
        fin: function () { PA.rodadoraOculta = false; },
        calle: function (c, t) {
          var P = PA.paleta();
          c.save(); S.enCapa(c, 1);
          var tirando = U.tramo(t, T0 - 500, T0) * (1 - U.tramo(t, T1 + 600, T1 + 1200));
          // los Cowboys, en el solar, mirando a la izquierda
          COW.forEach(function (q, i) {
            var x = xCow(i, t), y = BASE + q[1], cae = CAEN.indexOf(i) >= 0;
            if (cae && t > T1 + 900) { sombreroCaido(c, x + 6, y - 2, 17, i % 2 ? '#d8c8a0' : '#b8a582'); return; }
            if (x > S.vista(1)[1] + 80) return;
            var corre = HUYEN.indexOf(i) >= 0 && t > 4700, bote = corre ? Math.abs(Math.sin(t / 70)) * 4 : 0;
            A.persona(c, x, y - bote, q[2], { tipo: 'de pie', ropa: P[q[3]], mira: corre ? 1 : -1, sombrero: i % 2 ? '#d8c8a0' : '#b8a582' }, P);
            if (!corre && tirando > 0) brazo(c, x, y, q[2], -1, P, P[q[3]]);
          });
          // los cuatro de la ley, que llegan andando
          LEY.forEach(function (q, i) {
            var x = xLey(i, t), y = BASE + q[1], anda = t < 3700 + i * 120 ? Math.abs(Math.sin(t / 120 + i)) * 3 : 0;
            var abrigo = i === 3 ? ['#6a6a72', '#4a4a52'] : ['#3a3440', '#24202a'];
            A.persona(c, x, y - anda, q[2], { tipo: 'de pie', ropa: abrigo, ropa2: ['#2a2630', '#1a1820'], mira: 1, sombrero: '#2a2428', chaleco: '#1a1618' }, P);
            if (tirando > 0) brazo(c, x, y, q[2], 1, P, abrigo);
          });
          // los tiros: el fogonazo en la boca del revólver y su humo, que sube y se abre
          TIROS.forEach(function (q) {
            var dt = t - q.t; if (dt < 0 || dt > 3200) return;
            var g, x, y, h, mira;
            if (q.lado === 0) { g = LEY[q.quien]; x = xLey(q.quien, q.t); mira = 1; } else { var i = CAEN[q.quien % 3]; g = COW[i]; x = xCow(i, q.t); mira = -1; }
            y = BASE + g[1]; h = g[2]; var m = mano(x, y, h, mira), bx = m[0] + mira * h * 0.12, by = m[1] - h * 0.005;
            S.humo(c, bx + mira * dt * 0.01 + Math.sin(dt / 400) * 4, by - dt * 0.022, 4 + dt * 0.007, 0.5 * Math.pow(1 - dt / 3200, 1.6));
            if (dt < 110) S.fogonazo(c, bx, by, 6, 1 - dt / 110, mira);
          });
          // el humo grande que se queda en el solar y se lleva el viento
          var nube = U.meseta(t, T1 - 1600, T1, T1 + 1300, T1 + 2900);
          for (var n = 0; n < 7; n++) S.humo(c, 2520 + n * 28 + (t - T1) * 0.012, BASE + 40 - (n % 3) * 26 - Math.max(0, t - T1) * 0.008, 30 + (n % 2) * 10, nube * 0.7);
          c.restore();
        },
        frente: function (c, t) {
          var H = E.H, W = E.W;
          var ar = U.meseta(t, 1200, 1800, D - 2200, D - 600);
          var seg = Math.round(U.tramo(t, T0, T1) * 30), tiros = TIROS.filter(function (q) { return q.t <= t; }).length;
          S.rotulo(c, 'TOMBSTONE · 26.10.1881 · 15:00:' + U.dos(seg), W / 2, H * 0.13, ar, S.CREMA, 12);
          S.rotulo(c, 'DISPAROS · ' + U.dos(tiros) + ' / 30', W / 2, H * 0.13 + 32, ar * U.tramo(t, T0 - 300, T0), tiros >= 30 ? S.ACENTO : S.CREMA);
          var p = S.pant(LOTE, BASE - 190, 1), al = U.meseta(t, T1 + 2200, T1 + 2900, D - 1400, D - 300);
          S.rotulo(c, 'FREMONT STREET · JUNTO AL ESTUDIO DE C. S. FLY', p[0], p[1], al, S.ACENTO);
          if (al > 0) { c.save(); c.globalAlpha = al; c.strokeStyle = S.ACENTO; c.setLineDash([3, 5]); c.lineWidth = 1.2; c.beginPath(); c.moveTo(p[0], p[1] + 12); c.lineTo(p[0], p[1] + 70 * S.k()); c.stroke(); c.restore(); }
        }
      };
    }
  });
})();
