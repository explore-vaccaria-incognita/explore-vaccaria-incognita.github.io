/* Vaccaria Incognita · el final
   Con los diez, el final de una película del Oeste (Pau 02/11: «hay que mejorar mucho la animación del final… el jinete
   iba corriendo por encima de la ciudad; cuando lo consigues, se va la ciudad, se queda el horizonte con el sol cayendo,
   las montañas, y el jinete se va hacia el final; y después aparece la ciudad otra vez»):
   1. una ráfaga de polvo cruza la pantalla y se lleva el pueblo (la vía, la calle y el primer plano se apagan) y la
      cámara queda en Monument Valley: las mesas, la sierra y un sol enorme que baja entre ellas, con su abanico de rayos;
   2. en el llano, un camino hacia el sol; un jinete a contraluz entra desde muy cerca y se aleja por él al galope (el
      tamaño va con la distancia); al llegar al sol el caballo se encabrita y se pierde en él;
   3. diez luces, una por secreto, forman la estrella de sheriff; cae el cartel de SE BUSCA · FORASTERO con el tiempo que
      te ha costado; el sello de ENCONTRADO y la estrella clavada;
   4. el iris del cine se cierra sobre el sol, «FIN», y se vuelve a abrir sobre el pueblo, que ha vuelto.
   El «in» del título se tacha: «Vaccaria cognita». Después, los créditos y el botón de la tinta. */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, PA = VA.paisaje, S = VA.esc;
  var TAU = Math.PI * 2, HORA = 18.3, MV = 740;   // MV: el hueco entre Merrick y la Mitten del este, donde se pone el sol
  var T = { polvo: 300, apaga: 800, enciende: 1900, jinete: 2000, llega: 11500, luces: 3200, estrella: 5800, cartel: 7200, sello: 9000, clava: 9600, tarjeta: 10200 };
  var SILUETA = { caballo: ['#2a1610', '#1e100a', '#140a06', '#3a2016'], crin: '#140a06', ropa: ['#2a1610', '#1e100a'], piel: ['#2a1610', '#1e100a'], sombrero: ['#2a1610', '#1e100a', '#140a06'], manta: ['#2a1610', '#1e100a', '#3a2016'], cuero: ['#2a1610', '#1e100a'], panuelo: '#4a1a10', pantalon2: ['#1e100a', '#140a06'], filoCaballo: 'rgba(255,196,120,.95)', sombraSuelo: 'rgba(30,10,4,.35)', lazo: '#2a1610', luz: 1 };
  function duracion(ms) {
    var m = Math.round(ms / 60000); if (m < 1) return 'MENOS DE 1 MIN'; if (m < 60) return m + ' MIN';
    var h = Math.floor(m / 60); if (h < 48) return h + ' H ' + U.dos(m % 60) + ' MIN';
    return Math.round(h / 24) + ' DÍAS';
  }
  function fecha(ms) { var d = new Date(ms); return U.dos(d.getDate()) + '.' + U.dos(d.getMonth() + 1) + '.' + d.getFullYear(); }

  // la estrella de sheriff: seis puntas con sus bolitas, de latón
  function estrella(c, x, y, R, a, luz, giro) {
    if (a <= 0 || R <= 0) return;
    c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(giro || 0);
    if (luz > 0) { var g = c.createRadialGradient(0, 0, R * 0.3, 0, 0, R * (2 + luz * 2)); g.addColorStop(0, 'rgba(255,220,140,' + (0.6 * luz).toFixed(3) + ')'); g.addColorStop(1, 'rgba(240,160,58,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R * (2 + luz * 2), 0, TAU); c.fill(); }
    var pts = []; for (var i = 0; i < 12; i++) { var an = -Math.PI / 2 + i * Math.PI / 6, rr = i % 2 ? R * 0.5 : R; pts.push([Math.cos(an) * rr, Math.sin(an) * rr]); }
    c.fillStyle = 'rgba(20,8,2,.35)'; c.beginPath(); pts.forEach(function (q, i) { i ? c.lineTo(q[0] + R * 0.06, q[1] + R * 0.08) : c.moveTo(q[0] + R * 0.06, q[1] + R * 0.08); }); c.fill();
    c.beginPath(); pts.forEach(function (q, i) { i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath();
    var gb = c.createLinearGradient(-R, -R, R, R); gb.addColorStop(0, '#fff0b0'); gb.addColorStop(0.5, '#e8b448'); gb.addColorStop(1, '#a8701e');
    c.lineWidth = Math.max(2, R * 0.05); c.strokeStyle = '#3b2618'; c.stroke(); c.fillStyle = gb; c.fill();
    // las caras biseladas de cada punta: una con luz y otra en sombra
    for (i = 0; i < 12; i += 2) { var p0 = pts[i], pa = pts[(i + 11) % 12], pb = pts[i + 1]; c.fillStyle = 'rgba(255,250,220,.35)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(pa[0], pa[1]); c.lineTo(p0[0], p0[1]); c.fill(); c.fillStyle = 'rgba(90,50,10,.25)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(p0[0], p0[1]); c.lineTo(pb[0], pb[1]); c.fill(); }
    for (i = 0; i < 12; i += 2) { c.beginPath(); c.arc(pts[i][0], pts[i][1], R * 0.085, 0, TAU); c.fillStyle = '#e8b448'; c.fill(); c.stroke(); }
    c.beginPath(); c.arc(0, 0, R * 0.36, 0, TAU); c.fillStyle = 'rgba(255,240,200,.25)'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = 'rgba(80,50,10,.6)'; c.stroke();
    S.letra(c, 'SHERIFF', 0, 1, Math.max(6, Math.round(R * 0.2)), '#5a3a10');
    c.restore();
  }

  // el cartel de SE BUSCA (en su sitio: x, y, ancho; se dibuja con su propio giro)
  function cartel(c, x, y, w, a, giro, sello, datos) {
    var h = w * 1.36;
    c.save(); c.globalAlpha = a; c.translate(x + w / 2, y); c.rotate(giro); c.translate(-w / 2, 0);
    c.fillStyle = 'rgba(20,8,2,.35)'; c.fillRect(8, 12, w, h);
    // el papel con las esquinas rotas y manchas de sol
    c.beginPath(); c.moveTo(0, 6); c.lineTo(w * 0.3, 0); c.lineTo(w * 0.62, 3); c.lineTo(w, 0); c.lineTo(w - 3, h * 0.4); c.lineTo(w, h - 8); c.lineTo(w * 0.7, h); c.lineTo(w * 0.36, h - 4); c.lineTo(4, h); c.lineTo(0, h * 0.55); c.closePath();
    var gp = c.createRadialGradient(w * 0.5, h * 0.45, w * 0.1, w * 0.5, h * 0.5, w * 0.95); gp.addColorStop(0, '#f6e6c2'); gp.addColorStop(1, '#d8b47a'); c.fillStyle = gp; c.fill();
    c.save(); c.clip(); c.fillStyle = 'rgba(120,70,20,.12)'; for (var i = 0; i < 9; i++) { c.beginPath(); c.arc(U._h(i) * w, U._h(i + 3) * h, w * (0.04 + U._h(i + 7) * 0.08), 0, TAU); c.fill(); } c.restore();
    c.strokeStyle = 'rgba(60,30,10,.55)'; c.lineWidth = 1.2; c.strokeRect(w * 0.06, h * 0.04, w * 0.88, h * 0.92);
    // el clavo de arriba
    c.fillStyle = '#4a4a54'; c.beginPath(); c.arc(w / 2, h * 0.025, 3.5, 0, TAU); c.fill();
    var tt = function (txt, yy, tam, col) { S.letra(c, txt, w / 2, h * yy, Math.round(w * tam), col); };
    tt('SE BUSCA', 0.12, 0.15, '#7a2418');
    c.strokeStyle = '#3b2618'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(w * 0.16, h * 0.19); c.lineTo(w * 0.84, h * 0.19); c.stroke();
    // el retrato: un forastero de espaldas al sol, con su sombrero
    var px = w * 0.24, py = h * 0.22, pw = w * 0.52, ph = h * 0.3;
    var gr = c.createLinearGradient(0, py, 0, py + ph); gr.addColorStop(0, '#e8b070'); gr.addColorStop(1, '#a86a3a'); c.fillStyle = gr; c.fillRect(px, py, pw, ph);
    c.fillStyle = '#3b2618'; var cx = px + pw / 2, cy = py + ph * 0.55;
    c.beginPath(); c.ellipse(cx, cy, pw * 0.13, ph * 0.17, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(cx - pw * 0.42, py + ph); c.quadraticCurveTo(cx - pw * 0.36, cy + ph * 0.2, cx, cy + ph * 0.16); c.quadraticCurveTo(cx + pw * 0.36, cy + ph * 0.2, cx + pw * 0.42, py + ph); c.fill();
    c.beginPath(); c.ellipse(cx, cy - ph * 0.14, pw * 0.34, ph * 0.05, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(cx - pw * 0.15, cy - ph * 0.14); c.quadraticCurveTo(cx - pw * 0.14, cy - ph * 0.4, cx, cy - ph * 0.36); c.quadraticCurveTo(cx + pw * 0.14, cy - ph * 0.4, cx + pw * 0.15, cy - ph * 0.14); c.fill();
    S.letra(c, '?', cx, cy + ph * 0.02, Math.round(pw * 0.16), '#e8b070');
    c.strokeStyle = '#3b2618'; c.lineWidth = 1.5; c.strokeRect(px, py, pw, ph);
    tt('FORASTERO', 0.6, 0.12, '#2a1810');
    c.save(); c.fillStyle = '#3b2618'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '500 ' + Math.round(w * 0.04) + 'px "IBM Plex Mono", monospace'; if ('letterSpacing' in c) c.letterSpacing = '1.5px';
    c.fillText('POR DESCUBRIR LOS DIEZ', w / 2, h * 0.67); c.fillText('SECRETOS DEL OESTE', w / 2, h * 0.705);
    c.fillText(datos.tiene ? 'EN ' + datos.tiempo + ' · ' + datos.fecha : 'THE OLD WEST · 10 / 10', w / 2, h * 0.89); c.restore();
    tt('RECOMPENSA', 0.765, 0.065, '#7a2418');
    c.save(); c.fillStyle = '#2a1810'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'italic 400 ' + Math.round(w * 0.11) + 'px "Instrument Serif", Georgia, serif'; c.fillText('Vaccaria cognita', w / 2, h * 0.83); c.restore();
    // el sello rojo de ENCONTRADO
    if (sello > 0) {
      var ks = U.sale(sello), sc = U.lerp(2.4, 1, ks);
      c.save(); c.translate(w * 0.5, h * 0.4); c.rotate(-0.28); c.scale(sc, sc); c.globalAlpha = a * Math.min(1, sello * 3) * 0.88;
      c.strokeStyle = '#b8261c'; c.lineWidth = w * 0.022; c.strokeRect(-w * 0.38, -w * 0.09, w * 0.76, w * 0.18); c.lineWidth = w * 0.008; c.strokeRect(-w * 0.35, -w * 0.065, w * 0.7, w * 0.13);
      S.letra(c, 'ENCONTRADO', 0, 1, Math.round(w * 0.1), '#b8261c');
      c.restore();
    }
    c.restore();
  }

  // matas del llano, repartidas en profundidad (0 lejos … 1 cerca) y por el ancho
  var MATAS = (function () { var r = U.azar(1881), out = []; for (var i = 0; i < 38; i++) out.push([r(), Math.pow(r(), 1.8), r()]); out.sort(function (a, b) { return a[1] - b[1]; }); return out; })();
  function saguaroSilueta(c, x, y, h, luz) {
    var w = h * 0.12, brazos = [[-1, 0.42, 0.3], [1, 0.55, 0.24]];
    var p = new Path2D(); p.moveTo(x - w / 2, y); p.lineTo(x - w / 2, y - h + w / 2); p.arc(x, y - h + w / 2, w / 2, Math.PI, 0); p.lineTo(x + w / 2, y); p.closePath();
    brazos.forEach(function (b) {
      var by = y - h * b[1], bx = x + b[0] * w * 0.5, ex = bx + b[0] * h * 0.16, ty = by - h * b[2], bw = w * 0.8, xo = ex + b[0] * bw / 2, xi = ex - b[0] * bw / 2;
      // el brazo: sale del tronco, sube por fuera, cierra por arriba en semicírculo y baja por dentro
      p.moveTo(bx, by + bw / 2); p.lineTo(xo, by + bw / 2); p.lineTo(xo, ty + bw / 2);
      if (b[0] > 0) p.arc(ex, ty + bw / 2, bw / 2, 0, Math.PI, true); else p.arc(ex, ty + bw / 2, bw / 2, Math.PI, Math.PI * 2, false);
      p.lineTo(xi, by - bw / 2); p.lineTo(bx, by - bw / 2); p.closePath();
    });
    c.save(); c.translate(-luz * w * 0.12, -w * 0.06); c.strokeStyle = 'rgba(255,170,90,.9)'; c.lineWidth = Math.max(2, w * 0.14); c.stroke(p); c.restore();
    c.fillStyle = '#1c0e08'; c.fill(p);
  }

  VA.registrarFinal({
    escena: function (motor, datos) {
      var IRIS = 15500 + E.lectura, CIERRA = IRIS + 1500, ABRE = IRIS + 2700, D = IRIS + 4200;
      var tiene = isFinite(datos.desde) && datos.hasta, h0, cam0, camMV = null, cerrado = false, polvo = [], chispas = [];
      var info = { tiene: tiene, tiempo: tiene ? duracion(datos.hasta - datos.desde) : '', fecha: tiene ? fecha(datos.hasta) : '' };
      function xSol() { return E.W * (E.W > 800 ? 0.56 : 0.5); }
      function sol(t) { var H = E.H, R = Math.min(E.W, H) * 0.2; return { x: xSol(), y: U.lerp(H * 0.24, H * PA.HOR - R * 0.32, U.inOut(U.tramo(t, 0, 13000))), R: R }; }
      function sitioCartel() { var W = E.W, H = E.H, w = W > 800 ? Math.min(W * 0.17, 270) : Math.min(W * 0.46, H * 0.24); return { w: w, x: W > 800 ? W * 0.83 - w / 2 : W / 2 - w / 2, y: W > 800 ? H * 0.09 : H * 0.06 }; }
      // dónde está el jinete: por el camino, del primer plano al sol (u: 0…1); la talla va con la distancia
      function jinete(t) {
        var W = E.W, H = E.H, hz = H * PA.HOR, u = U.tramo(t, T.jinete, T.llega), y0 = H * 1.04, x0 = -W * 0.08;
        var yf = hz + H * 0.028, y = yf + (y0 - yf) * Math.pow(1 - u, 1.7), x = U.lerp(x0, xSol() - H * 0.02, 1 - Math.pow(1 - u, 1.25));
        var s = H * (0.05 + 0.29 * (y - yf) / (y0 - yf)), ida = U.tramo(t, T.llega + 1500, T.llega + 3600);
        return { x: x + ida * H * 0.02, y: y - ida * H * 0.026, s: s * (1 - ida * 0.8), a: 1 - U.tramo(ida, 0.55, 1), u: u, enc: Math.sin(Math.PI * U.tramo(t, T.llega, T.llega + 1400)) };
      }
      var esc = {
        duracion: D, detenerDia: true, sinSol: true, sinTren: true,
        tarjeta: { en: T.tarjeta, hasta: IRIS - 200, titulo: 'Vaccaria cognita',
          texto: 'Has encontrado los diez secretos del Oeste. Del O.K. Corral a la fiebre del oro, la tierra de los vaqueros ya no es incógnita para ti.' + (tiene ? ' Te ha llevado ' + duracion(datos.hasta - datos.desde).toLowerCase() + '.' : '') + ' Y ahora puedes recorrerla con tinta: busca el punto pequeño abajo a la derecha.',
          pie: tiene ? fecha(datos.desde) + ' — ' + fecha(datos.hasta) : 'The Old West · 10 / 10' },
        inicio: function () { document.documentElement.classList.add('cognita'); h0 = PA.hora; if (h0 > HORA || h0 < 6) h0 = 16.4; cam0 = E.camX; PA.rodadoraOculta = true; },
        fin: function () { PA.rodadoraOculta = false; if (!cerrado) E.camX = cam0; },
        cuadro: function (t) {
          PA.hora = U.lerp(h0, HORA, U.inOut(U.tramo(t, 0, 7000)));
          // con el polvo encima, la cámara salta a Monument Valley (el sol entre las mesas); con el iris cerrado, vuelve
          if (camMV == null && t >= 1350) { var k = E.u / S.K; camMV = U.clamp((E.W / 2 + MV * k - xSol()) / 0.25 - E.W / 2, 0, E.maxCam()); E.camX = camMV; }
          if (!cerrado && t >= CIERRA) { cerrado = true; E.camX = cam0; esc.sinSol = false; }
        },
        frontal: function (t) { return t >= CIERRA ? 1 : 1 - U.suave(U.tramo(t, T.apaga, T.enciende)); },
        cielo: function (c, t) {
          var W = E.W, H = E.H, a = U.meseta(t, 0, 2600, CIERRA - 100, CIERRA), hz = H * PA.HOR, so = sol(t);
          if (a <= 0) return;
          var g = c.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, 'rgba(58,24,80,' + (0.62 * a).toFixed(3) + ')'); g.addColorStop(0.55, 'rgba(200,70,100,' + (0.4 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,170,80,' + (0.55 * a).toFixed(3) + ')');
          c.fillStyle = g; c.fillRect(0, 0, W, hz + 2);
          c.save(); c.globalAlpha = a * 0.16; c.fillStyle = '#ffe2a0';
          for (var i = 0; i < 22; i++) { var an = i / 22 * TAU + t / 26000, w2 = 0.07; c.beginPath(); c.moveTo(so.x, so.y); c.lineTo(so.x + Math.cos(an - w2) * W * 1.2, so.y + Math.sin(an - w2) * W * 1.2); c.lineTo(so.x + Math.cos(an + w2) * W * 1.2, so.y + Math.sin(an + w2) * W * 1.2); c.fill(); }
          c.restore();
          c.save(); c.globalAlpha = a;
          var gh = c.createRadialGradient(so.x, so.y, so.R * 0.8, so.x, so.y, so.R * 2.6); gh.addColorStop(0, 'rgba(255,200,120,.55)'); gh.addColorStop(1, 'rgba(255,140,80,0)'); c.fillStyle = gh; c.beginPath(); c.arc(so.x, so.y, so.R * 2.6, 0, TAU); c.fill();
          var corte = new Path2D(); corte.rect(so.x - so.R - 2, so.y - so.R - 2, so.R * 2 + 4, so.R * 1.28 + 2);
          var yb = so.y + so.R * 0.26;
          for (var b = 0; b < 5; b++) { var bh = so.R * (0.025 + b * 0.012), y0 = so.y + so.R * (0.28 + b * 0.16) + Math.sin(t / 300 + b) * 1.2; corte.rect(so.x - so.R - 2, yb, so.R * 2 + 4, y0 - yb); yb = y0 + bh; }
          corte.rect(so.x - so.R - 2, yb, so.R * 2 + 4, so.y + so.R - yb + 2);
          c.save(); c.clip(corte);
          var gs = c.createLinearGradient(0, so.y - so.R, 0, so.y + so.R); gs.addColorStop(0, '#fff6c8'); gs.addColorStop(0.55, '#ffc060'); gs.addColorStop(1, '#ff6a3a');
          c.fillStyle = gs; c.beginPath(); c.arc(so.x, so.y, so.R, 0, TAU); c.fill();
          c.restore(); c.restore();
        },
        // el llano vacío (queda debajo del pueblo; se ve cuando el pueblo se va): el camino hacia el sol y las matas
        detras: function (c, t) {
          if (t >= CIERRA) return;
          var W = E.W, H = E.H, hz = H * PA.HOR, xs = xSol();
          var gs = c.createLinearGradient(0, hz, 0, H); gs.addColorStop(0, 'rgba(232,140,80,.55)'); gs.addColorStop(0.4, 'rgba(150,70,50,.35)'); gs.addColorStop(1, 'rgba(50,20,16,.6)'); c.fillStyle = gs; c.fillRect(0, hz, W, H - hz);
          // el camino: de abajo a la izquierda hasta el pie del sol, con sus dos rodadas
          var camino = new Path2D(); camino.moveTo(xs - 3, hz + 1); camino.quadraticCurveTo(xs - W * 0.06, hz + (H - hz) * 0.45, -W * 0.06, H + 2); camino.lineTo(W * 0.42, H + 2); camino.quadraticCurveTo(xs + W * 0.02, hz + (H - hz) * 0.45, xs + 3, hz + 1); camino.closePath();
          var gc = c.createLinearGradient(0, hz, 0, H); gc.addColorStop(0, 'rgba(255,200,140,.7)'); gc.addColorStop(1, 'rgba(200,120,80,.55)'); c.fillStyle = gc; c.fill(camino);
          c.strokeStyle = 'rgba(90,40,24,.45)'; c.lineWidth = 2; c.beginPath();
          [[0.1, 0.23], [0.24, 0.36]].forEach(function (q) { c.moveTo(xs - 1, hz + 1); c.quadraticCurveTo(xs - W * 0.03, hz + (H - hz) * 0.45, W * q[0], H + 2); });
          c.stroke();
          // las matas: siluetas con su filo de sol y su sombra larga hacia delante
          MATAS.forEach(function (m) {
            var y = hz + (H - hz) * (0.02 + m[1] * 0.98), x = m[0] * W, r = 2 + m[1] * 24;
            if (Math.abs(x - U.lerp(xs, W * 0.18, m[1])) < W * 0.12 + r) return;   // no en el camino
            c.fillStyle = 'rgba(60,20,10,.22)'; c.beginPath(); c.ellipse(x - r * 0.6, y + r * 0.15, r * 1.6, r * 0.18, -0.06, 0, TAU); c.fill();
            c.fillStyle = 'rgba(84,40,26,.85)'; c.beginPath(); c.ellipse(x, y - r * 0.3, r, r * 0.55, 0, Math.PI, 0); c.fill();
            c.strokeStyle = 'rgba(255,170,90,.8)'; c.lineWidth = Math.max(1, r * 0.12); c.beginPath(); c.ellipse(x, y - r * 0.3, r, r * 0.55, 0, Math.PI * 1.25, Math.PI * 1.85); c.stroke();
          });
        },
        frente: function (c, t) {
          var W = E.W, H = E.H, hz = H * PA.HOR, so = sol(t), a = U.meseta(t, 200, 1800, CIERRA - 100, CIERRA);
          if (a > 0) {
            // el tono de película
            c.fillStyle = 'rgba(120,40,30,' + (0.1 * a).toFixed(3) + ')'; c.fillRect(0, 0, W, H);

            // el primer plano que enmarca: un saguaro a la derecha y rocas a la izquierda, a contraluz
            var ap = U.tramo(t, T.apaga + 300, T.enciende + 300);
            if (ap > 0) {
              c.save(); c.globalAlpha = a * ap;
              saguaroSilueta(c, W * (W > 800 ? 0.92 : 0.86), H * 1.02, H * 0.46, -1);
              var roca = new Path2D(); roca.moveTo(-10, H + 2); roca.lineTo(-10, H * 0.86); roca.quadraticCurveTo(W * 0.04, H * 0.8, W * 0.09, H * 0.84); roca.quadraticCurveTo(W * 0.13, H * 0.87, W * 0.15, H * 0.93); roca.lineTo(W * 0.17, H + 2); roca.closePath();
              c.save(); c.translate(3, -3); c.strokeStyle = 'rgba(255,170,90,.8)'; c.lineWidth = 3; c.stroke(roca); c.restore(); c.fillStyle = '#1c0e08'; c.fill(roca);
              c.restore();
            }

            // el jinete y su polvo
            var J = jinete(t);
            if (t > T.jinete && J.a > 0) {
              if (J.u < 1 && Math.random() < 0.85) polvo.push({ x: J.x - J.s * 0.45, y: J.y, t: t, s: J.s });
              for (var i = polvo.length - 1; i >= 0; i--) { var q = polvo[i], kq = (t - q.t) / 1500; if (kq > 1 || kq < 0) { polvo.splice(i, 1); continue; } c.fillStyle = 'rgba(200,110,70,' + (0.32 * (1 - kq) * a).toFixed(3) + ')'; c.beginPath(); c.arc(q.x - kq * q.s * 0.5, q.y - kq * q.s * 0.3, q.s * (0.08 + kq * 0.32), 0, TAU); c.fill(); }
              c.save(); c.globalAlpha = a * J.a; S.galope(c, J.x, J.y, Math.max(2, J.s), J.u < 1 ? (t / 470) % 1 : 0.3, SILUETA, { jinete: true, inclina: 0.22, encabrita: J.enc }); c.restore();
            }

            // diez luces que suben del suelo y se juntan en la estrella
            var ex = W > 800 ? W * 0.24 : W * 0.5, ey = W > 800 ? H * 0.22 : H * 0.48, R = Math.min(W, H) * 0.085;
            for (var n = 0; n < 10; n++) {
              var t0 = T.luces + n * 200, kq2 = U.inOut(U.tramo(t, t0, T.estrella)); if (t < t0 || kq2 >= 1) continue;
              var an = -Math.PI / 2 + n / 10 * TAU, ox = W * (0.05 + n * 0.1), oy = H * 0.96, mx = ex + Math.cos(an) * R * 3.2, my = ey + Math.sin(an) * R * 2.4;
              var lx = (1 - kq2) * (1 - kq2) * ox + 2 * (1 - kq2) * kq2 * mx + kq2 * kq2 * ex, ly = (1 - kq2) * (1 - kq2) * oy + 2 * (1 - kq2) * kq2 * my + kq2 * kq2 * ey;
              var gq = c.createRadialGradient(lx, ly, 0, lx, ly, 18); gq.addColorStop(0, 'rgba(255,244,210,.95)'); gq.addColorStop(1, 'rgba(240,160,58,0)'); c.fillStyle = gq; c.beginPath(); c.arc(lx, ly, 18, 0, TAU); c.fill();
              c.fillStyle = '#fff8e0'; c.beginPath(); c.arc(lx, ly, 2.6, 0, TAU); c.fill();
            }
            var C = sitioCartel(), kv = U.inOut(U.tramo(t, T.sello + 200, T.clava));
            var ax = U.lerp(ex, C.x + C.w * 0.86, kv), ay = U.lerp(ey, C.y + C.w * 1.24, kv), aR = U.lerp(R, C.w * 0.13, kv), ke = U.sale(U.tramo(t, T.estrella, T.estrella + 500));
            if (t >= T.estrella) {
              if (!chispas.length) for (var k = 0; k < 28; k++) chispas.push({ a: k / 28 * TAU + Math.random() * 0.2, v: 0.25 + Math.random() * 0.35 });
              var dc = t - T.estrella;
              if (dc < 1400) {
                chispas.forEach(function (q) { S.destello(c, ex + Math.cos(q.a) * q.v * dc, ey + Math.sin(q.a) * q.v * dc + dc * dc * 0.00012, 3, a * (1 - dc / 1400)); });
                c.save(); c.globalAlpha = a * (1 - dc / 900); c.strokeStyle = '#ffe2a0'; c.lineWidth = 3 * (1 - dc / 900) + 0.5; c.beginPath(); c.arc(ex, ey, R * (0.6 + dc / 300), 0, TAU); c.stroke(); c.restore();
              }
            }
            var kc = U.tramo(t, T.cartel, T.cartel + 700), giro = 0;
            if (kc > 0) {
              var dt2 = t - T.cartel - 700, cy = U.lerp(-C.w * 1.5, C.y, U.sale(kc));
              giro = dt2 > 0 ? Math.sin(dt2 / 260) * 0.12 * Math.exp(-dt2 / 900) - 0.03 : -0.25 * (1 - kc);
              cartel(c, C.x, cy, C.w, a, giro, U.tramo(t, T.sello, T.sello + 260), info);
              var dsl = t - T.sello - 200; if (dsl > 0 && dsl < 700) { c.save(); c.globalAlpha = a * (1 - dsl / 700); c.strokeStyle = 'rgba(184,38,28,.6)'; c.lineWidth = 2; c.beginPath(); c.ellipse(C.x + C.w / 2, C.y + C.w * 0.55, C.w * (0.4 + dsl / 900), C.w * (0.14 + dsl / 2600), -0.28, 0, TAU); c.stroke(); c.restore(); }
            }
            if (t >= T.estrella) estrella(c, ax, ay, aR * ke * (1 + 0.04 * Math.sin(t / 260)), a, kv < 1 ? U.tramo(t, T.estrella, T.estrella + 1500) * (1 - kv * 0.7) : 0.25, (1 - ke) * 1.4 + (kv >= 1 ? giro : 0));
          }

          // la ráfaga de polvo que se lleva el pueblo
          var kp = U.tramo(t, T.polvo, T.polvo + 2600);
          if (kp > 0 && kp < 1) {
            var frente2 = U.lerp(-W * 0.4, W * 1.4, kp), velo = U.meseta(t, 500, 1050, 1550, 2500);
            c.save(); c.fillStyle = 'rgba(214,150,96,' + (0.94 * velo).toFixed(3) + ')'; c.fillRect(0, 0, W, H);
            for (var p = 0; p < 26; p++) { var px = frente2 - (p % 9) * W * 0.06 - U._h(p) * W * 0.1, py = H * (0.2 + U._h(p + 5) * 0.8), pr = H * (0.1 + U._h(p + 9) * 0.18); var gp = c.createRadialGradient(px, py, 0, px, py, pr); gp.addColorStop(0, 'rgba(226,166,110,.75)'); gp.addColorStop(1, 'rgba(226,166,110,0)'); c.fillStyle = gp; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill(); }
            c.restore();
          }

          // el iris del cine: se cierra sobre el sol, FIN, y se abre sobre el pueblo que ha vuelto
          var cierra = U.inOut(U.tramo(t, IRIS, CIERRA)), abre = U.inOut(U.tramo(t, ABRE, D - 300));
          if (cierra > 0) {
            var rmax = Math.hypot(W, H), r = t < CIERRA ? rmax * (1 - cierra) : rmax * abre, cx = t < CIERRA ? so.x : W / 2, cyi = t < CIERRA ? so.y : H / 2;
            c.save(); c.fillStyle = '#0a0604'; c.beginPath(); c.rect(0, 0, W, H); if (r > 0.5) c.arc(cx, cyi, r, 0, TAU, true); c.fill('evenodd'); c.restore();
            var af = U.meseta(t, CIERRA - 300, CIERRA + 200, ABRE - 200, ABRE + 300);
            if (af > 0) { c.save(); c.globalAlpha = af; S.letra(c, 'FIN', W / 2, H / 2, Math.round(Math.min(W, H) * 0.11), '#f2e3c6'); c.restore(); }
          }
        }
      };
      return esc;
    }
  });
})();
