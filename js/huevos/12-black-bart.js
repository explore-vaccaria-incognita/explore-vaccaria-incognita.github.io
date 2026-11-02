/* Secreto escondido 2 · Black Bart (Distancia)
   Seguir empujando hacia la izquierda, más allá del principio del camino (rueda, flecha o arrastre).
   La escena: por el camino de Monument Valley llega una diligencia Concord de Wells Fargo, roja y amarilla, con sus
   cuatro caballos al galope; detrás de una roca sale un bandido a pie, con un saco de harina por capucha, un bombín y la
   escopeta: «Throw down the box». La diligencia para, el cochero tira la caja de Wells Fargo, la diligencia sigue y el
   bandido se va andando (le daban miedo los caballos); en el suelo queda su poema de 1878, firmado «Black Bart, the PO8». */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, A = VA.arte, PA = VA.paisaje, S = VA.esc;
  var TAU = Math.PI * 2, Y = 836, YB = 796, XB = 330, PARA = 820;
  var T = { llega: 3400, sale: 3000, caja: 4300, vuelve: 5600, poema: 7000, tarjeta: 10400 };
  var POEMA = ['Here I lay me down to sleep', 'To wait the coming morrow,', 'Perhaps success, perhaps defeat,', 'And everlasting sorrow.', 'Let come what will, I’ll try it on,', 'My condition can’t be worse;', 'And if there’s money in that box', '’Tis munny in my purse.'];

  // una rueda de diligencia (amarilla, con sus radios) que gira lo que rueda
  function rueda(c, x, y, r, ang) {
    c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(40,20,10,.25)'; c.beginPath(); c.ellipse(0, r + 2, r * 0.9, 4, 0, 0, TAU); c.fill();
    c.strokeStyle = '#2a1a12'; c.lineWidth = r * 0.16; c.beginPath(); c.arc(0, 0, r - r * 0.08, 0, TAU); c.stroke();
    c.strokeStyle = S.dePaleta('#d8a838'); c.lineWidth = r * 0.09; c.beginPath(); c.arc(0, 0, r - r * 0.2, 0, TAU); c.stroke();
    c.lineWidth = Math.max(1.5, r * 0.06); c.beginPath(); for (var i = 0; i < 12; i++) { var a = ang + i / 12 * TAU; c.moveTo(Math.cos(a) * r * 0.18, Math.sin(a) * r * 0.18); c.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); } c.stroke();
    c.fillStyle = S.dePaleta('#b88a28'); c.beginPath(); c.arc(0, 0, r * 0.2, 0, TAU); c.fill(); c.fillStyle = '#2a1a12'; c.beginPath(); c.arc(0, 0, r * 0.08, 0, TAU); c.fill();
    c.restore();
  }
  // la diligencia Concord, mirando a la derecha: x es el centro de la caja, y el suelo; d: lo recorrido (para las ruedas)
  function diligencia(c, x, y, d, P, conCaja) {
    var RO = S.dePaleta('#a8322a'), RO2 = S.dePaleta('#7a2018'), OR = S.dePaleta('#e8b448'), NE = S.dePaleta('#2a1a12');
    // el tren de rodaje y las sopandas de cuero sobre las que cuelga la caja
    c.strokeStyle = NE; c.lineWidth = 6; c.beginPath(); c.moveTo(x - 74, y - 34); c.lineTo(x + 66, y - 26); c.stroke();
    c.strokeStyle = S.dePaleta('#4a2a18'); c.lineWidth = 5; c.beginPath(); c.moveTo(x - 92, y - 74); c.quadraticCurveTo(x, y - 30, x + 84, y - 70); c.stroke();
    // la caja: el fondo abombado, el techo con su baca y el maletero de cuero detrás
    var caja = new Path2D(); caja.moveTo(x - 82, y - 150); caja.lineTo(x + 70, y - 150); caja.quadraticCurveTo(x + 80, y - 110, x + 70, y - 76); caja.quadraticCurveTo(x, y - 52, x - 82, y - 76); caja.quadraticCurveTo(x - 94, y - 112, x - 82, y - 150); caja.closePath();
    A.cel(c, caja, [RO2, RO], -4, -5);
    c.strokeStyle = OR; c.lineWidth = 1.6; c.stroke(caja); c.save(); c.clip(caja); c.strokeStyle = 'rgba(232,180,72,.6)'; c.lineWidth = 1.2; c.strokeRect(x - 70, y - 140, 128, 70); c.restore();
    // la ventana de la puerta, con su cortina recogida
    A.bajo(A.rect(x - 22, y - 138, 40, 32), c, S.dePaleta('#2a1a14')); A.bajo(A.rect(x - 22, y - 138, 12, 32), c, S.dePaleta('#c8a060'));
    c.save(); c.translate(x - 6, y - 92); c.scale(-1, 1); S.letra(c, 'WELLS FARGO & CO', 0, 0, 10, OR); c.restore();   // (la diligencia se pinta volteada: el letrero se vuelve a voltear)
    A.cel(c, A.suave([[x - 84, y - 140], [x - 112, y - 136], [x - 116, y - 98], [x - 86, y - 92]]), [S.dePaleta('#3a2418'), S.dePaleta('#5a3a24')], -2, -2);   // el maletero
    c.fillStyle = NE; c.fillRect(x - 86, y - 156, 154, 6);
    A.cel(c, A.rect(x - 70, y - 176, 48, 20), [S.dePaleta('#6a4a30'), S.dePaleta('#8a6444')], 0, -2); A.cel(c, A.rect(x - 18, y - 170, 36, 14), [S.dePaleta('#3a4a5a'), S.dePaleta('#5a6a7a')], 0, -2);   // los baúles
    c.strokeStyle = NE; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 84, y - 166); c.lineTo(x + 40, y - 166); for (var q = 0; q < 7; q++) { c.moveTo(x - 84 + q * 20, y - 166); c.lineTo(x - 84 + q * 20, y - 156); } c.stroke();
    // el pescante del cochero, con la caja de Wells Fargo debajo
    c.fillStyle = NE; c.fillRect(x + 62, y - 158, 44, 6); c.fillRect(x + 98, y - 158, 5, 54);
    if (conCaja) cajaFuerte(c, x + 82, y - 152, 1);
    // las ruedas: la de atrás grande, la de delante pequeña
    rueda(c, x - 74, y - 34, 34, -d / 34); rueda(c, x + 66, y - 26, 26, -d / 26);
  }
  // la caja de Wells Fargo: verde, con sus herrajes
  function cajaFuerte(c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    A.cel(c, A.rect(-18, -16, 36, 18), [S.dePaleta('#1e3e2a'), S.dePaleta('#2e5a3a')], -1.5, -1.5);
    c.fillStyle = S.dePaleta('#c89a3a'); c.fillRect(-18, -16, 36, 2.5); c.fillRect(-2, -13, 4, 6); c.fillRect(-18, -16, 2.5, 18); c.fillRect(15.5, -16, 2.5, 18);
    c.restore();
  }
  // el bandido: abrigo largo, el saco de harina con dos agujeros, el bombín y la escopeta
  function bandido(c, x, y, h, apunta, P, andar) {
    var ropa = [S.dePaleta('#c8b89a'), S.dePaleta('#9a8a6e')];
    A.persona(c, x, y - (andar ? Math.abs(Math.sin(andar)) * 2 : 0), h, { tipo: 'de pie', ropa: ropa, ropa2: [S.dePaleta('#3a3438'), S.dePaleta('#26222a')], mira: apunta ? 1 : -1, chaleco: S.dePaleta('#6a5a46'), panuelo: S.dePaleta('#6a5a46'), bigote: false }, P);
    var mira = apunta ? 1 : -1, hx = x, hy = y - h * 0.9 - (andar ? Math.abs(Math.sin(andar)) * 2 : 0);
    // el saco
    var saco = A.suave([[hx - h * 0.075, hy + h * 0.06], [hx - h * 0.085, hy - h * 0.04], [hx - h * 0.05, hy - h * 0.1], [hx + h * 0.05, hy - h * 0.1], [hx + h * 0.085, hy - h * 0.04], [hx + h * 0.075, hy + h * 0.06], [hx + h * 0.09, hy + h * 0.1], [hx - h * 0.09, hy + h * 0.1]]);
    A.cel(c, saco, [S.dePaleta('#d8d0bc'), S.dePaleta('#f2ecdc')], -h * 0.01, -h * 0.01);
    c.strokeStyle = S.dePaleta('#8a7a5a'); c.lineWidth = 1; c.beginPath(); c.moveTo(hx - h * 0.08, hy + h * 0.065); c.lineTo(hx + h * 0.08, hy + h * 0.065); c.stroke();
    c.fillStyle = '#120c08'; [-1, 1].forEach(function (k) { c.beginPath(); c.ellipse(hx + mira * h * 0.02 + k * h * 0.028, hy - h * 0.025, h * 0.013, h * 0.011, 0, 0, TAU); c.fill(); });
    // el bombín
    c.fillStyle = S.dePaleta('#2a2228'); c.beginPath(); c.ellipse(hx, hy - h * 0.1, h * 0.1, h * 0.018, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(hx, hy - h * 0.12, h * 0.06, h * 0.05, 0, Math.PI, 0); c.fill();
    // la escopeta de dos cañones
    var ax = x + mira * h * 0.05, ay = y - h * 0.66, ang = apunta ? -0.32 : 0.95;
    c.save(); c.translate(ax, ay); c.scale(mira, 1); c.rotate(ang);
    c.fillStyle = S.dePaleta('#5a3a22'); c.beginPath(); c.moveTo(-h * 0.12, -h * 0.01); c.lineTo(h * 0.06, -h * 0.015); c.lineTo(h * 0.06, h * 0.02); c.lineTo(-h * 0.13, h * 0.04); c.fill();
    c.fillStyle = S.dePaleta('#3a3a42'); c.fillRect(h * 0.05, -h * 0.018, h * 0.4, h * 0.018); c.fillRect(h * 0.05, -h * 0.002, h * 0.4, h * 0.012);
    c.restore();
  }

  VA.registrar({
    id: 'black-bart', n: 12, escondido: true, nombre: 'Black Bart, el poeta', tipo: 'Distancia',
    pista: 'Vuelve atrás, más allá del principio del camino. Alguien espera a la diligencia.',
    detectar: function (api) {
      api.en('empujar', function (d) { if (d.lado === 'inicio' && d.total > 1300) api.disparar(); });
    },
    escena: function () {
      var D = 15500 + E.lectura, P;
      // dónde está la diligencia (centro de la caja) y lo que ha rodado
      function xDil(t) {
        if (t < T.llega) return 1900 - (1900 - PARA) * U.sale(U.tramo(t, 0, T.llega));
        if (t < T.vuelve) return PARA;
        return PARA - 2200 * U.entra(U.tramo(t, T.vuelve, T.vuelve + 3600));
      }
      // el equipo de cuatro caballos: dos parejas delante de la diligencia (mira a la izquierda: se pinta volteada)
      function tiro(c, x, t, galopa) {
        var fase = (x / 330) % 1;
        [[150, 0], [292, 0.18]].forEach(function (p) {
          [[-10, 0.1, 0.92], [0, 0, 1]].forEach(function (q) {   // el de allá (más arriba y algo más oscuro) y el de acá
            var hx = x + p[0] + q[0] * 0.5, hy = Y + q[0], s = 112 * q[2], Pc = q[0] ? Object.assign({}, P, { caballo: ['#5a2c18', '#3e1e10', '#2a140a', '#8a4a2c'] }) : P;
            if (galopa) S.galope(c, hx, hy, s, (fase + p[1] + q[1]) % 1, Pc, { sinSilla: true });
            else A.caballoA(c, A.hacerJ(hx, hy, s * 0.96), Pc, { sinJinete: true, sinSilla: true }, 1);
          });
        });
        // los tirantes y las riendas
        c.strokeStyle = S.dePaleta('#2a1a12'); c.lineWidth = 2; c.beginPath(); c.moveTo(x + 70, Y - 64); c.lineTo(x + 330, Y - 80); c.moveTo(x + 104, Y - 150); c.quadraticCurveTo(x + 220, Y - 120, x + 360, Y - 112); c.stroke();
      }
      return {
        duracion: D,
        tarjeta: { en: T.tarjeta, hasta: D - 400, titulo: 'Black Bart, el poeta', pie: 'Wells Fargo · norte de California · 1875–1883',
          texto: 'Entre 1875 y 1883, un bandido con un saco de harina por capucha y una escopeta asaltó al menos 28 diligencias de Wells Fargo en el norte de California. Pedía con educación «throw down the box», la caja del dinero, y dicen que nunca disparó. Le daban miedo los caballos: llegaba y se iba a pie. Dos veces dejó un poema firmado «Black Bart, the PO8». Lo delató la marca de lavandería de un pañuelo, F.X.O.7: era Charles Boles, un señor muy elegante que vivía en San Francisco.' },
        inicio: function () { P = PA.paleta(); E.irA(0.95, 1200); PA.rodadoraOculta = true; },
        fin: function () { PA.rodadoraOculta = false; },
        calle: function (c, t) {
          c.save(); S.enCapa(c, 1);
          var xd = xDil(t), galopa = t < T.llega - 300 || t > T.vuelve + 300;
          // el bandido sale de detrás de la roca, apunta, recoge la caja y se va andando
          var kb = U.sale(U.tramo(t, T.sale - 600, T.sale)), xb = U.lerp(XB - 70, XB, kb), yb = U.lerp(YB - 30, YB, kb), vete = U.tramo(t, T.vuelve + 400, T.vuelve + 5000);
          if (vete > 0) { xb = XB - vete * 520; }
          var conCaja = t < T.caja;
          // la caja en el suelo (cae del pescante con un bote) y luego en brazos del bandido
          if (!conCaja && vete <= 0) {
            var kc = U.tramo(t, T.caja, T.caja + 600), cx0 = xd - 82, cy0 = Y - 152, cx1 = XB + 70, cy1 = YB + 4;
            var cx = U.lerp(cx0, cx1, kc), cy = U.lerp(cy0, cy1, kc) - Math.sin(Math.PI * kc) * 60 - (kc >= 1 ? Math.abs(Math.sin((t - T.caja - 600) / 90)) * 8 * Math.exp(-(t - T.caja - 600) / 300) : 0);
            cajaFuerte(c, cx, cy, 1.2);
          }
          if (t > T.sale - 600 && vete < 1) { c.save(); c.globalAlpha = 1 - U.tramo(vete, 0.75, 1); bandido(c, xb, yb, 104, vete <= 0, P, vete > 0 ? t / 160 : 0); if (vete > 0) cajaFuerte(c, xb - 18, yb - 44, 0.9); c.restore(); }
          // la diligencia y su tiro (van hacia la izquierda: se dibujan volteadas sobre su centro)
          c.save(); c.translate(2 * xd, 0); c.scale(-1, 1);
          tiro(c, xd, t, galopa);
          diligencia(c, xd, Y, -xd, P, conCaja);
          A.persona(c, xd + 84, Y - 154, 64, { tipo: 'sentado', ropa: [S.dePaleta('#4a4a5e'), S.dePaleta('#2e2e3e')], mira: 1, brazo: 'apoyado' }, P);
          c.restore();
          // el poema, que vuela y se queda en el suelo junto a la roca
          var kp = U.tramo(t, T.poema - 900, T.poema);
          if (kp > 0) { c.save(); c.translate(U.lerp(XB - 40, XB + 30, kp), U.lerp(YB - 140, YB + 6, kp) + Math.sin(kp * 9) * 10); c.rotate(Math.sin(kp * 7) * 0.5 * (1 - kp) + 0.12); c.fillStyle = S.dePaleta('#f2ead6'); c.fillRect(-14, -10, 28, 20); c.strokeStyle = 'rgba(60,40,20,.5)'; c.lineWidth = 0.8; for (var l = 0; l < 5; l++) { c.beginPath(); c.moveTo(-10, -6 + l * 3.4); c.lineTo(8 - (l % 2) * 5, -6 + l * 3.4); c.stroke(); } c.restore(); }
          // el polvo de la diligencia
          if (galopa && t < T.vuelve + 3600) { c.fillStyle = 'rgba(214,170,120,.28)'; for (var p = 0; p < 6; p++) { var px = xd + 90 + p * 26 + Math.sin(t / 200 + p) * 6, py = Y - 8 - p * 4; c.beginPath(); c.arc(px, py, 16 + p * 5, 0, TAU); c.fill(); } }
          c.restore();
        },
        frente: function (c, t) {
          var W = E.W, H = E.H;
          S.rotulo(c, 'NORTE DE CALIFORNIA · 1878', W / 2, H * 0.12, U.meseta(t, 600, 1100, T.poema - 400, T.poema + 200), S.CREMA, 12);
          var pb = S.pant(XB, YB - 150, 1);
          S.rotulo(c, '«THROW DOWN THE BOX»', pb[0] + 60, pb[1], U.meseta(t, T.sale + 200, T.sale + 600, T.caja + 400, T.caja + 900), S.ACENTO, 12);
          // el poema, de cerca, verso a verso
          var w = Math.min(W * 0.86, 400), h = w * 0.82, x = W < 700 ? (W - w) / 2 : W - w - Math.min(W * 0.06, 70), y = H * 0.1, a = U.meseta(t, T.poema, T.poema + 600, D - 1600, D - 400);
          S.vineta(c, x, y, w, h, a, function (ix, iy, iw, ih) {
            c.fillStyle = '#f4ead4'; c.fillRect(ix, iy, iw, ih);
            var tam = Math.max(13, iw * 0.05);
            c.save(); c.fillStyle = '#3b2618'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = 'italic 400 ' + Math.round(tam) + 'px "Instrument Serif", Georgia, serif';
            POEMA.forEach(function (v, i) { var k = U.tramo(t, T.poema + 400 + i * 380, T.poema + 800 + i * 380), n = Math.floor(v.length * k); if (n > 0) c.fillText(v.slice(0, n), ix + iw * 0.08, iy + ih * 0.1 + i * tam * 1.22 + (i >= 4 ? tam * 0.4 : 0)); });
            var kf = U.tramo(t, T.poema + 400 + 8 * 380, T.poema + 1000 + 8 * 380);
            if (kf > 0) { c.globalAlpha = kf; c.textAlign = 'right'; c.font = 'italic 400 ' + Math.round(tam * 1.15) + 'px "Instrument Serif", Georgia, serif'; c.fillStyle = '#7a2418'; c.fillText('Black Bart, the PO8', ix + iw * 0.92, iy + ih * 0.9); }
            c.restore();
          });
        }
      };
    }
  });
})();
