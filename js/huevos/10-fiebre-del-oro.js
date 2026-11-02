/* Secreto 10 · La fiebre del oro (Lugar)
   Pulsar la pepita que brilla de vez en cuando en el montón de mineral de la mina (o la vagoneta).
   La escena: de la pepita sale un surtidor de polvo de oro; arriba, EUREKA y la fecha; por los dos lados de la calle
   empiezan a llegar buscadores de oro con su pico o su batea, cada vez más, mientras la cuenta sube hasta 300.000. */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, A = VA.arte, PA = VA.paisaje, S = VA.esc;
  var TAU = Math.PI * 2, BASE = A.BASE, PX = 8432, PY = 700, VX = 8256, T0 = 2600, T1 = 9600;
  var GENTE = (function () { var r = U.azar(1849), out = []; for (var i = 0; i < 30; i++) out.push([T0 + Math.pow(r(), 0.8) * (T1 - T0 - 1500), r() < 0.5 ? -1 : 1, BASE + 50 + r() * 120, 0.06 + r() * 0.05, r() < 0.5, r()]); out.sort(function (a, b) { return a[2] - b[2]; }); return out; })();
  function enPepita(d) { var x = d.l * S.K, y = d.yu * S.K; return Math.hypot(x - PX, y - PY) < 36 || (x > VX - 50 && x < VX + 50 && y > 640 && y < BASE + 4); }

  // un buscador de oro, en silueta, andando: con el pico al hombro o la batea bajo el brazo
  function minero(c, x, y, h, fase, mira, pico, col) {
    c.save(); c.translate(x, y); c.scale(mira, 1);
    var p = Math.sin(fase) * 0.22, bote = Math.abs(Math.cos(fase)) * h * 0.02;
    c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round'; c.lineWidth = h * 0.09;
    c.beginPath(); c.moveTo(0, -h * 0.48 - bote); c.lineTo(Math.sin(p) * h * 0.46, 0); c.moveTo(0, -h * 0.48 - bote); c.lineTo(-Math.sin(p) * h * 0.46, 0); c.stroke();
    c.lineWidth = h * 0.16; c.beginPath(); c.moveTo(0, -h * 0.5 - bote); c.lineTo(h * 0.03, -h * 0.8 - bote); c.stroke();
    c.beginPath(); c.arc(h * 0.05, -h * 0.9 - bote, h * 0.07, 0, TAU); c.fill();
    c.fillRect(-h * 0.08, -h * 0.97 - bote, h * 0.26, h * 0.025); c.fillRect(-h * 0.01, -h * 1.05 - bote, h * 0.12, h * 0.09);
    c.lineWidth = h * 0.05;
    if (pico) { c.beginPath(); c.moveTo(-h * 0.22, -h * 0.55 - bote); c.lineTo(h * 0.16, -h * 0.9 - bote); c.stroke(); c.beginPath(); c.moveTo(-h * 0.3, -h * 0.42 - bote); c.quadraticCurveTo(-h * 0.26, -h * 0.6 - bote, -h * 0.14, -h * 0.66 - bote); c.stroke(); }
    else { c.beginPath(); c.ellipse(h * 0.14, -h * 0.58 - bote, h * 0.16, h * 0.05, 0.1, 0, TAU); c.fill(); }
    c.restore();
  }

  VA.registrar({
    id: 'fiebre-del-oro', n: 10, nombre: 'La fiebre del oro', tipo: 'Lugar',
    pista: 'En la mina todavía brilla algo. Espera a verlo… y cógelo.',
    lugar: function () { return PX / S.K; }, radio: 0.25,
    detectar: function (api) {
      api.en('clic', function (d) { if (enPepita(d)) api.disparar(); });
      // el brillo de la pepita: un destello corto cada tres segundos
      api.capa(function (c, t) {
        if (api.hallado()) return;
        var p = S.pant(PX, PY, 1); if (p[0] < -20 || p[0] > E.W + 20) return;
        var k = (t % 3200) / 3200, a = k < 0.12 ? Math.sin(k / 0.12 * Math.PI) : 0;
        if (a > 0) S.destello(c, p[0], p[1], 3.2 * S.k() * 2, a);
      });
    },
    escena: function () {
      var D = 13500 + E.lectura, chispas = [];
      return {
        duracion: D,
        tarjeta: { en: 8200, hasta: D - 400, titulo: 'La fiebre del oro', pie: 'Sutter’s Mill · Coloma, California · 24.01.1848',
          texto: 'El 24 de enero de 1848, James W. Marshall vio brillar unas escamas en el canal del aserradero que construía para John Sutter en Coloma (California). La noticia dio la vuelta al mundo y en 1849 empezaron a llegar los «forty-niners»: hasta 1855, unas 300.000 personas, la mitad por mar y la mitad por tierra. Casi ninguno se hizo rico; Sutter acabó arruinado y, para los pueblos nativos de California, fue una catástrofe. «Eureka», lo he encontrado, sigue siendo el lema del estado.' },
        inicio: function () { E.irA(PX / S.K - 0.15, 1300); PA.rodadoraOculta = true; },
        fin: function () { PA.rodadoraOculta = false; },
        calle: function (c, t, dt) {
          var P = PA.paleta(), k = S.k(), col = S.dePaleta('#3a2418');
          c.save(); S.enCapa(c, 1);
          // los que llegan, por los dos lados, hacia la mina
          var V = S.vista(1);
          var ropas = [P.camisa2, P.camisa3, P.ropa, P.vestido, ['#8a7a6a', '#5a4e44']];
          GENTE.forEach(function (g, i) {
            var d = t - g[0]; if (d < 0) return;
            var desde = g[1] < 0 ? V[0] - 60 : V[1] + 60, hasta = PX + g[1] * (110 + g[5] * 300), x = U.lerp(desde, hasta, U.clamp(d * g[3] / Math.abs(hasta - desde), 0, 1)), anda = x !== hasta;
            var h = 78 + (g[2] - BASE) * 0.32, y = g[2] - (anda ? Math.abs(Math.sin(d / 130 + i)) * 3 : 0), mira = anda ? (g[1] < 0 ? 1 : -1) : (x < PX ? 1 : -1);
            A.persona(c, x, y, h, { tipo: 'de pie', ropa: ropas[i % ropas.length], mira: mira, sombrero: i % 3 ? '#c8b088' : '#4a3a2e' }, P);
            if (g[4]) A.pico(c, x - mira * h * 0.12, y - h * 0.45, mira * 0.9, h / 150, P);
            else { c.fillStyle = '#6a6a74'; c.beginPath(); c.ellipse(x + mira * h * 0.16, y - h * 0.5, h * 0.13, h * 0.035, 0, 0, TAU); c.fill(); }
          });
          // el surtidor de oro
          if (t < 6200) for (var n = 0; n < 6; n++) chispas.push({ t: t, a: -Math.PI / 2 + (Math.random() - 0.5) * 1.6, v: 0.22 + Math.random() * 0.3, s: 1.6 + Math.random() * 3.2 });
          for (var i = chispas.length - 1; i >= 0; i--) {
            var q = chispas[i], d2 = t - q.t; if (d2 > 1600 || d2 < 0) { chispas.splice(i, 1); continue; }
            var x2 = PX + Math.cos(q.a) * q.v * d2, y2 = PY + Math.sin(q.a) * q.v * d2 + 0.00022 * d2 * d2;
            c.fillStyle = 'rgba(255,214,90,' + (1 - d2 / 1600).toFixed(3) + ')'; c.beginPath(); c.arc(x2, y2, q.s, 0, TAU); c.fill();
          }
          var br = U.meseta(t, 200, 800, 6000, 7500); if (br > 0) S.destello(c, PX, PY, 7 + Math.sin(t / 120) * 1.5, br);
          c.restore();
        },
        frente: function (c, t) {
          var W = E.W, H = E.H, y = H * 0.12;
          var ae = U.meseta(t, 700, 1200, D - 2200, D - 600);
          if (ae > 0) { c.save(); c.globalAlpha = ae; S.letra(c, 'EUREKA', W / 2, y + 6, Math.round(Math.min(W * 0.11, 64)), S.ACENTO); c.restore(); }
          S.rotulo(c, '24.01.1848 · SUTTER’S MILL · COLOMA, CALIFORNIA', W / 2, y + 54, U.meseta(t, 1400, 2000, D - 2200, D - 600), S.CREMA);
          var kk = U.tramo(t, T0, T1), ano = Math.round(U.lerp(1848, 1855, kk));
          S.rotulo(c, ano + ' · LLEGADOS: ' + S.num(Math.round(U.entra(kk) * 300000 / 1000) * 1000), W / 2, y + 92, U.meseta(t, T0 - 300, T0, D - 2200, D - 600), kk >= 1 ? S.ACENTO : S.CREMA);
        }
      };
    }
  });
})();
