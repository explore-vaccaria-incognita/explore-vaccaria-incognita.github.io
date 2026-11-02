/* Vaccaria Incognita · sonido
   Todo sintetizado con Web Audio, sin archivos (como en Pascua y Cyber).
   - El recorrido (Pau 02/11: menos es más): el viento del desierto como fondo único; de vez en cuando un caballo o
     una vaca; el tren cuando pasa (resoplidos y silbato); grillos de noche; y, cada 20–35 s, una frase de guitarra.
   - Cada escena con lo suyo, al compás de lo que se ve (los tiempos salen de cada secreto).
   Empieza apagado: el botón ♪ lo enciende y se recuerda. Los navegadores solo dejan sonar después de un gesto.
   Las escenas suenan por su propio canal: si se salta la escena, su sonido se apaga con ella. */
(function () {
  'use strict';
  var VA = window.VA, E = VA.motor, U = VA.util, CLAVE = 'vaccaria-incognita.sonido';
  var S = VA.sonido = { activo: false };
  var ac = null, master, salaEnv, ruido, musica, AMB = null, bus = null, escBus = null, ksCache = {};
  // mi menor pentatónica, dos octavas (la guitarra)
  var ESCALA = [164.81, 196.0, 220.0, 246.94, 293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25];

  function crear() {
    var Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return false;
    ac = new Ctx();
    master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    var conv = ac.createConvolver(); conv.buffer = impulso(3.2, 2.2);   // el eco del cañón
    salaEnv = ac.createGain(); salaEnv.gain.value = 0.5; salaEnv.connect(conv); var rv = ac.createGain(); rv.gain.value = 0.4; conv.connect(rv); rv.connect(master);
    musica = ac.createGain(); musica.gain.value = 1; musica.connect(master);
    AMB = { seco: master, sala: salaEnv }; bus = AMB;
    ruido = bufferRuido(4);
    S.viento = bucle(ruido, 'bandpass', 500, 0.6, 0);
    S.rafaga = bucle(ruido, 'highpass', 2500, 0.5, 1.3);
    // los grillos de noche: un tono agudo que se corta a golpes
    var o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = 4700;
    var trino = ac.createGain(); trino.gain.value = 0.5; var lfo = ac.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 31; var lg = ac.createGain(); lg.gain.value = 0.5;
    lfo.connect(lg); lg.connect(trino.gain); var gr = ac.createGain(); gr.gain.value = 0; o.connect(trino); trino.connect(gr); gr.connect(master); o.start(); lfo.start();
    S.grillos = { g: gr };
    return true;
  }
  function bucle(buf, tipo, frec, q, desde) {
    var s = ac.createBufferSource(); s.buffer = buf; s.loop = true;
    var f = ac.createBiquadFilter(); f.type = tipo; f.frequency.value = frec; f.Q.value = q;
    var g = ac.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); s.start(0, desde || 0);
    return { f: f, g: g };
  }
  function bufferRuido(seg) {
    var n = Math.floor(ac.sampleRate * seg), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0), b0 = 0, b1 = 0, b2 = 0;
    for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
    return b;
  }
  function impulso(seg, caida) {
    var n = Math.floor(ac.sampleRate * seg), b = ac.createBuffer(2, n, ac.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, caida); }
    return b;
  }
  // por dónde sale un sonido: seco y a la sala, por el canal de ahora, y a izquierda o derecha (pan: -1…1)
  function salida(nodo, sala, pan) {
    var n = nodo;
    if (pan && ac.createStereoPanner) { var p = ac.createStereoPanner(); p.pan.value = U.clamp(pan, -1, 1); nodo.connect(p); n = p; }
    n.connect(bus.seco);
    if (sala) { var g = ac.createGain(); g.gain.value = sala; n.connect(g); g.connect(bus.sala); }
  }
  function env(g, t, ataque, vol, dur) {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + ataque); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tono(tipo, f, t, dur, vol, op) {
    op = op || {};
    var o = ac.createOscillator(), g = ac.createGain(); o.type = tipo; o.frequency.setValueAtTime(f, t);
    if (op.f2) o.frequency.exponentialRampToValueAtTime(op.f2, t + (op.glide || dur));
    env(g, t, op.ataque || 0.01, vol, dur);
    if (op.filtro) { var fl = ac.createBiquadFilter(); fl.type = op.tipoFiltro || 'lowpass'; fl.frequency.value = op.filtro; fl.Q.value = op.q || 0.7; o.connect(fl); fl.connect(g); } else o.connect(g);
    salida(g, op.sala == null ? 0.4 : op.sala, op.pan); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function golpe(t, dur, frec, vol, tipo, op) {
    op = op || {};
    var s = ac.createBufferSource(); s.buffer = ruido; var f = ac.createBiquadFilter(); f.type = tipo || 'lowpass'; f.frequency.setValueAtTime(frec, t); f.Q.value = op.q || (tipo === 'bandpass' ? 2 : 0.7);
    if (op.f2) f.frequency.exponentialRampToValueAtTime(op.f2, t + (op.barre || dur));
    var g = ac.createGain(); env(g, t, op.ataque || Math.min(0.02, dur * 0.2), vol, dur);
    s.loop = true; s.connect(f); f.connect(g); salida(g, op.sala == null ? 0.3 : op.sala, op.pan); s.start(t, Math.random() * 2); s.stop(t + dur + 0.05);
  }
  // una cuerda punteada (Karplus-Strong): la guitarra de acero del Oeste, con su cola larga
  function cuerda(f, seg, apagado) {
    var clave = Math.round(f * 10) + (apagado ? 'a' : ''); if (ksCache[clave]) return ksCache[clave];
    var sr = ac.sampleRate, n = Math.floor(sr * seg), b = ac.createBuffer(1, n, sr), d = b.getChannelData(0), N = Math.max(2, Math.round(sr / f)), anillo = new Float32Array(N), k = 0, caida = apagado ? 0.985 : 0.9965;
    for (var i = 0; i < N; i++) anillo[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin(Math.PI * i / N));
    for (var j = 0; j < n; j++) { var a = anillo[k], s = anillo[(k + 1) % N]; anillo[k] = (a * 0.5 + s * 0.5) * caida; d[j] = a * Math.min(1, j / 20); k = (k + 1) % N; }
    return (ksCache[clave] = b);
  }
  function punteo(f, t, vol, op) {
    op = op || {};
    var s = ac.createBufferSource(); s.buffer = cuerda(f, op.apagado ? 0.8 : 3.2, op.apagado); var g = ac.createGain(); g.gain.value = vol;
    var fl = ac.createBiquadFilter(); fl.type = 'peaking'; fl.frequency.value = 2400; fl.gain.value = 5;   // el brillo metálico
    s.connect(fl); fl.connect(g);
    if (op.musica) { var n = g; if (op.pan && ac.createStereoPanner) { var p = ac.createStereoPanner(); p.pan.value = op.pan; g.connect(p); n = p; } n.connect(musica); var g2 = ac.createGain(); g2.gain.value = 0.5; n.connect(g2); g2.connect(salaEnv); }
    else salida(g, 0.5, op.pan);
    s.start(t);
  }
  // rasgueo: las notas casi juntas, de grave a agudo
  function rasgueo(t, notas, vol, op) { notas.forEach(function (f, k) { punteo(f, t + k * 0.022, vol * (1 - k * 0.06), op); }); }
  function arpegio(t, indices, paso, vol, op) { indices.forEach(function (i, k) { punteo(ESCALA[i % ESCALA.length] * (i >= ESCALA.length ? 2 : 1), t + k * paso, vol, op); }); }

  /* --- las piezas del Oeste --- */
  // un silbido (con su vibrato y el aire), de nota en nota con portamento: [[frecuencia, duración], …]
  function silbido(t, notas, vol) {
    var o = ac.createOscillator(), g = ac.createGain(), vib = ac.createOscillator(), vg = ac.createGain();
    o.type = 'sine'; vib.frequency.value = 5.6; vg.gain.value = 0; vib.connect(vg); vg.connect(o.frequency);
    var tt = t; g.gain.setValueAtTime(0.0001, t);
    notas.forEach(function (n, i) {
      if (!n[0]) { g.gain.setTargetAtTime(0.0001, tt, 0.04); tt += n[1]; return; }
      if (i === 0 || !notas[i - 1][0]) o.frequency.setValueAtTime(n[0], tt); else o.frequency.setTargetAtTime(n[0], tt, 0.035);
      g.gain.setTargetAtTime(vol, tt, 0.05); vg.gain.setTargetAtTime(n[0] * 0.012, tt + Math.min(0.25, n[1] * 0.4), 0.15);
      vg.gain.setTargetAtTime(0, tt + n[1] - 0.05, 0.03); tt += n[1];
    });
    g.gain.setTargetAtTime(0.0001, tt, 0.12);
    o.connect(g); salida(g, 0.9); o.start(t); vib.start(t); o.stop(tt + 1); vib.stop(tt + 1);
    golpe(t, tt - t, 3000, vol * 0.05, 'bandpass', { q: 0.8, sala: 0.4 });   // el aire de los labios
    return tt;
  }
  // los cascos: galope de tres tiempos (pa-ta-tam); vol0 → vol1 entre t0 y t1, de pan0 a pan1
  function galope(t0, t1, vol0, vol1, pan0, pan1, zancada) {
    zancada = zancada || 0.42;
    for (var t = t0; t < t1; t += zancada) {
      var k = (t - t0) / Math.max(0.01, t1 - t0), v = vol0 + (vol1 - vol0) * k, pan = (pan0 || 0) + ((pan1 || 0) - (pan0 || 0)) * k;
      if (v < 0.004) continue;
      [0, 0.075, 0.15].forEach(function (d, i) {
        golpe(t + d, 0.05, 700 + i * 120, v * (i === 2 ? 1 : 0.7), 'bandpass', { q: 1.4, sala: 0.15, pan: pan });
        tono('sine', 110, t + d, 0.07, v * 0.5, { f2: 70, glide: 0.06, sala: 0.05, pan: pan });
      });
    }
  }
  // el relincho: un sierra con vibrato rápido y hondo, que sube y cae, con el soplido al final
  function relincho(t, vol, pan) {
    var o = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(700, t); o.frequency.linearRampToValueAtTime(1250, t + 0.25); o.frequency.linearRampToValueAtTime(980, t + 0.7); o.frequency.exponentialRampToValueAtTime(420, t + 1.3);
    lfo.frequency.setValueAtTime(14, t); lfo.frequency.linearRampToValueAtTime(9, t + 1.3); lg.gain.value = 70; lfo.connect(lg); lg.connect(o.frequency);
    fl.type = 'bandpass'; fl.frequency.value = 1500; fl.Q.value = 2.2;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.08); g.gain.setValueAtTime(vol, t + 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);
    o.connect(fl); fl.connect(g); salida(g, 0.5, pan); o.start(t); lfo.start(t); o.stop(t + 1.4); lfo.stop(t + 1.4);
    golpe(t + 1.4, 0.35, 900, vol * 0.6, 'bandpass', { q: 0.7, f2: 400, pan: pan });   // el resoplido
  }
  // un disparo de revólver: el chasquido, el estampido y el eco del cañón; a veces, el rebote
  function disparo(t, vol, pan) {
    golpe(t, 0.035, 3000, vol, 'highpass', { ataque: 0.002, sala: 0.8, pan: pan });
    golpe(t, 0.45, 900, vol * 0.8, 'lowpass', { ataque: 0.003, f2: 120, barre: 0.3, sala: 0.9, pan: pan });
    tono('sine', 80, t, 0.3, vol * 0.6, { f2: 35, glide: 0.25, ataque: 0.003, sala: 0.6, pan: pan });
    if (Math.random() < 0.18) tono('sine', 2600, t + 0.06, 0.55, vol * 0.12, { f2: 800, glide: 0.5, ataque: 0.01, sala: 0.7, pan: -pan });
  }
  // metal golpeado (yunque, clavo, remache): parciales inarmónicos
  function metal(t, vol, f, dur, pan) { [1, 2.76, 5.4, 8.93].forEach(function (k, i) { tono('sine', f * k, t, (dur || 1.2) / (1 + i * 0.6), vol / (1 + i), { ataque: 0.002, sala: 0.5, pan: pan }); }); golpe(t, 0.03, 4000, vol * 0.6, 'highpass', { pan: pan }); }
  function campana(t, vol, f) { [1, 2.0, 2.4, 3.0, 4.2].forEach(function (k, i) { tono('sine', (f || 520) * k, t, 1.8 / (1 + i * 0.4), vol / (1 + i * 0.7), { ataque: 0.003, sala: 0.6 }); }); }
  function madera(t, vol, f, pan) { tono('triangle', f || 300, t, 0.1, vol, { f2: (f || 300) * 0.6, glide: 0.08, sala: 0.3, pan: pan }); golpe(t, 0.04, 1600, vol * 0.5, 'bandpass', { pan: pan }); }
  // el silbato del vapor: un acorde de tres tubos, que sube un poco al abrir y se apaga
  function silbato(t, dur, vol, pan) {
    [311, 392, 466].forEach(function (f) {
      var o = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.93, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.25);
      fl.type = 'bandpass'; fl.frequency.value = f * 2.2; fl.Q.value = 3; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.2); g.gain.setValueAtTime(vol, t + dur - 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); fl.connect(g); salida(g, 0.9, pan); o.start(t); o.stop(t + dur + 0.05);
    });
    golpe(t, dur, 2400, vol * 0.5, 'bandpass', { q: 0.6, sala: 0.6, pan: pan });
  }
  function resoplido(t, vol, pan) { golpe(t, 0.16, 650, vol, 'bandpass', { q: 0.9, sala: 0.3, pan: pan }); golpe(t, 0.12, 5000, vol * 0.25, 'highpass', { pan: pan }); }
  function morse(t, dur, vol) { tono('sine', 680, t, dur, vol, { ataque: 0.005, sala: 0.15 }); golpe(t, 0.02, 2500, vol * 0.8, 'bandpass', { q: 3 }); golpe(t + dur, 0.02, 1800, vol * 0.6, 'bandpass', { q: 3 }); }
  function vaca(t, vol, pan) { tono('sawtooth', 150, t, 1.5, vol, { f2: 108, glide: 1.4, ataque: 0.25, filtro: 520, q: 3, tipoFiltro: 'bandpass', sala: 0.6, pan: pan }); }
  function brillo(t, vol) { [1, 1.5, 2, 3].forEach(function (k, i) { tono('sine', 1568 * k, t + i * 0.03, 0.6, vol / (i + 1), { ataque: 0.003, sala: 0.8 }); }); }
  function pasos(t0, t1, cada, vol, pan) { for (var t = t0; t < t1; t += cada * (0.9 + Math.random() * 0.2)) golpe(t, 0.06, 500, vol, 'bandpass', { q: 1, sala: 0.1, pan: pan }); }

  /* --- lo que suena solo (Pau 02/11: «un sonido único durante casi todo el recorrido, y algún caballo, alguna vaca, el
     tren cuando pasa, grillos de noche; no haría mucha más cosa»): el viento, igual en todas partes, y poco más --- */
  // la guitarra (Pau 02/11: «también haría algún sonido de algún instrumento»): de vez en cuando, una frase corta y
  // lenta en mi menor, con su bajo; siempre una de estas, para que suene a canción y no a notas sueltas
  var FRASES = [[0, [0, 3, 5, 6, 5, 3]], [0, [5, 4, 3, 1, 0]], [2, [2, 5, 7, 6, 5]], [1, [1, 4, 6, 5, 4, 3]], [0, [3, 5, 8, 7, 5, 3, 0]]], frase = 0;
  function guitarra(t) {
    var f = FRASES[frase % FRASES.length]; frase += 1 + Math.floor(Math.random() * 2);
    punteo(ESCALA[f[0]] / 2, t, 0.11, { musica: true });
    f[1].forEach(function (i, k) { punteo(ESCALA[i], t + 0.5 + k * 0.42 + (k % 3 === 2 ? 0.08 : 0), 0.085 * (1 - k * 0.05), { musica: true }); });
  }
  var prox = { animal: 12, guitarra: 6 }, trenAntes = null, ultResoplo = 0, xTrenAntes = null;
  function cerca(x, r) { var l = E.centro() * 900; return U.clamp(1 - Math.abs(l - x) / r, 0, 1); }
  function lado(x) { var l = E.centro() * 900; return U.clamp((x - l) / 900, -0.8, 0.8); }
  function actualizar() {
    if (!ac || !S.activo) return;
    var t = ac.currentTime, PA = VA.paisaje, noche = PA ? PA.peso('noche') : 0, esc = !!E.escena, s = E.escena && E.escena.s;
    // el viento: un fondo grave y continuo, y encima un soplo que sube y baja muy despacio
    S.viento.g.gain.setTargetAtTime(0.06 + 0.025 * Math.sin(t * 0.13) * Math.sin(t * 0.051), t, 1.2);
    S.viento.f.frequency.setTargetAtTime(380 + 180 * Math.sin(t * 0.07), t, 1.5);
    S.rafaga.g.gain.setTargetAtTime(Math.max(0, Math.sin(t * 0.09) * Math.sin(t * 0.037)) * 0.008, t, 1.2);
    S.grillos.g.gain.setTargetAtTime(Math.sin(t * 2.1) > 0.15 ? noche * 0.01 : 0, t, 0.03);
    musica.gain.setTargetAtTime(esc ? 0.15 : 1, t, 0.5);
    if (esc) return;
    // de vez en cuando, un caballo o una vaca (las vacas, sobre todo en el rancho)
    if (t > prox.animal) {
      var rancho = cerca(5900, 1300), pan = (Math.random() - 0.5) * 1.2;
      if (Math.random() < 0.35 + rancho * 0.4) vaca(t, 0.025 + 0.03 * rancho, rancho > 0.2 ? lado(5900) : pan);
      else if (Math.random() < 0.5) relincho(t, 0.025, pan); else golpe(t, 0.4, 700, 0.04, 'bandpass', { q: 0.8, f2: 350, pan: pan });   // un resoplido de caballo
      prox.animal = t + 16 + Math.random() * 16;
    }
    if (t > prox.guitarra) { guitarra(t); prox.guitarra = t + 20 + Math.random() * 15; }
    // el tren, cuando pasa
    tren(t, s);
  }
  function tren(t, s) {
    var PA = VA.paisaje, tr = s && s.sinTren ? null : PA.tren(), ciclo = E.t % 80000;
    if (!tr) { trenAntes = null; xTrenAntes = null; return; }
    var k = E.u / 900, xs = E.W / 2 + (tr.x + 51) * k - (E.W / 2 + E.camX) * 0.6, d = Math.abs(xs - E.W / 2) / E.W, vol = U.clamp(1.1 - d * 0.8, 0.12, 1), pan = U.clamp((xs - E.W / 2) / E.W, -0.9, 0.9);
    // el silbato al aparecer y al salir; la campana antes de salir
    if (trenAntes == null) { trenAntes = ciclo; }
    [[600, 'silbato'], [29500, 'silbato']].forEach(function (q) { if (trenAntes < q[0] && ciclo >= q[0]) { if (q[1] === 'silbato') silbato(t, 1.6, 0.04 * vol, pan); else for (var i = 0; i < 6; i++) campana(t + i * 0.45, 0.03 * vol, 620); } });
    trenAntes = ciclo;
    // los resoplidos: uno por cada 21 de lámina recorridos (como las bocanadas); parado, uno lento
    if (xTrenAntes == null) xTrenAntes = tr.x;
    if (!tr.parado && Math.abs(tr.x - xTrenAntes) >= 21) { xTrenAntes = tr.x; resoplido(t, 0.05 * vol, pan); }
    else if (tr.parado && t - ultResoplo > 1.8) { ultResoplo = t; golpe(t, 0.9, 4000, 0.02 * vol, 'highpass', { ataque: 0.2, pan: pan }); }
  }
  setInterval(actualizar, 100);

  /* --- cada escena con lo suyo (t en segundos desde que empieza) --- */
  function huevo(id) { var h = null; VA.interfaz.huevos().forEach(function (x) { if (x.id === id) h = x; }); return h; }
  function morsePalabra(t, palabra, unidad, vol) { var M = VA.esc.impulsos(palabra); M.forEach(function (q) { morse(t + q.t * unidad, q.d * unidad, vol); }); return M.total * unidad; }
  // la melodía silbada del Oeste (propia): la menor, con su caída al final
  var TEMA = [[440, 0.9], [659.25, 0.45], [587.33, 0.22], [523.25, 0.22], [493.88, 0.5], [440, 1.0], [0, 0.25], [392, 0.45], [440, 0.45], [523.25, 0.5], [493.88, 0.7], [329.63, 1.3]];
  var ESCENAS = {
    'ok-corral': function (t) {
      pasos(t + 0.5, t + 3.8, 0.5, 0.05, -0.4);
      for (var k = 0; k < 3; k++) madera(t + 1.2 + k, 0.05, k % 2 ? 900 : 1200);   // el reloj
      var h = huevo('ok-corral'); (h && h.tiros || []).forEach(function (q) { disparo(t + q.t / 1000, 0.32, q.lado === 0 ? -0.45 : 0.45); });
      golpe(t + 7.8, 3, 300, 0.05, 'lowpass', { ataque: 1 });
      punteo(ESCALA[0], t + 9.4, 0.18); punteo(ESCALA[3], t + 9.8, 0.12);
    },
    'clavo-de-oro': function (t) {
      for (var i = 0; i < 12; i++) { resoplido(t + 0.2 + i * (0.2 + i * 0.025), 0.05 * (1 - i / 14), -0.6); resoplido(t + 0.3 + i * (0.2 + i * 0.03), 0.05 * (1 - i / 14), 0.6); }
      golpe(t + 3.6, 1.6, 4500, 0.03, 'highpass', { ataque: 0.3 });   // el vapor al parar
      madera(t + 1.56, 0.2, 160); golpe(t + 1.56, 0.25, 400, 0.12, 'lowpass');   // el fallo, en la traviesa
      metal(t + 2.56, 0.16, 880, 1.8); brillo(t + 2.6, 0.06);   // el acierto
      silbato(t + 3.4, 1.4, 0.035, -0.5); silbato(t + 3.9, 1.4, 0.035, 0.5);
      morsePalabra(t + 3.0, 'DONE', 0.12, 0.05);
      campana(t + 6.2, 0.04, 620); campana(t + 6.7, 0.04, 620);
    },
    'pony-express': function (t) {
      galope(t, t + 2.6, 0.03, 0.12, -0.8, 0, 0.4); relincho(t + 2.75, 0.06, 0);
      golpe(t + 2.65, 0.33, 1500, 0.05, 'bandpass', { f2: 600, q: 0.8 });   // la mochila vuela
      galope(t + 3.0, t + 6.2, 0.12, 0.01, 0.1, 0.9, 0.36);
      for (var i = 0; i < 19; i++) madera(t + 0.9 + i * 0.34, 0.015, 2200);   // las postas que se encienden
    },
    telegrafo: function (t) {
      var dur = morsePalabra(t + 1.6, 'MORSE', 0.13, 0.06);
      rasgueo(t + 1.6 + dur + 0.3, [ESCALA[0], ESCALA[3], ESCALA[5], ESCALA[7]], 0.12);
      galope(t + 1.6 + dur + 1.3, t + 1.6 + dur + 4.5, 0.05, 0.003, 0, 0.6, 0.4);
    },
    rodadora: function (t) {
      golpe(t, 1.8, 600, 0.08, 'bandpass', { f2: 2400, barre: 0.8, q: 0.6, ataque: 0.1 });
      golpe(t + 2.3, 0.4, 300, 0.12, 'lowpass');   // el saco cae
      for (var i = 0; i < 30; i++) golpe(t + 2.5 + Math.random() * 0.9, 0.02, 3500, 0.03, 'bandpass');   // las semillas
      for (i = 0; i < 5; i++) tono('sine', 900 + i * 180, t + 3.2 + i * 0.14, 0.25, 0.03, { f2: 1400 + i * 200, glide: 0.2 });   // los brotes
      golpe(t + 4.4, 7, 900, 0.08, 'bandpass', { ataque: 1.2, q: 0.5, f2: 1800, barre: 4 });   // la ventolera
      for (i = 0; i < 40; i++) golpe(t + 4.8 + Math.random() * 6, 0.12, 2200 + Math.random() * 2000, 0.025, 'bandpass', { q: 1.2, pan: Math.random() * 1.6 - 0.8 });
    },
    vaqueros: function (t) {
      galope(t, t + 4.6, 0.04, 0.09, -0.7, 0.7, 0.4); galope(t + 5.0, t + 9.8, 0.09, 0.04, 0.7, -0.7, 0.4);
      for (var i = 0; i < 10; i++) golpe(t + 0.4 + i * 0.942, 0.3, 1200, 0.04, 'bandpass', { f2: 400, q: 0.7 });   // el lazo
      for (i = 0; i < 10; i++) { madera(t + 1.3 + i * 0.43, 0.05, 340); punteo(ESCALA[i % ESCALA.length], t + 1.32 + i * 0.43, 0.12); }
    },
    bisontes: function (t) {
      golpe(t + 1.2, 6.2, 140, 0.4, 'lowpass', { ataque: 1.4, sala: 0.4 });
      for (var i = 0; i < 70; i++) { var tt = 1.3 + Math.random() * (4.1 + (i < 20 ? 1.5 : 0)); golpe(t + tt, 0.08, 300 + Math.random() * 300, 0.06, 'lowpass', { pan: Math.random() * 1.6 - 0.8 }); }
      silbido(t + 7.4, [[329.63, 0.8], [293.66, 0.4], [261.63, 0.4], [246.94, 1.4]], 0.035);
      tono('triangle', 82.4, t + 8.2, 4, 0.08, { ataque: 0.2, filtro: 500, sala: 0.7 });
    },
    remaches: function (t) {
      for (var i = 0; i < 6; i++) { metal(t + 2.0 + i * 0.52, 0.09, 1320, 0.5); golpe(t + 2.0 + i * 0.52, 0.04, 700, 0.1, 'lowpass'); }
      for (i = 0; i < 40; i++) golpe(t + 1.6 + i * 0.09 + Math.random() * 0.04, 0.03, 5000, 0.02, 'bandpass', { q: 2 });   // la pluma
      golpe(t + 5.2, 0.3, 250, 0.2, 'lowpass');   // el sello
    },
    almeria: function (t) {
      for (var i = 0; i < 180; i++) golpe(t + 0.3 + i / 14, 0.025, 1800, 0.02, 'bandpass', { q: 2, sala: 0 });   // el proyector
      madera(t + 1.75, 0.3, 700); golpe(t + 1.75, 0.05, 3000, 0.2, 'highpass');   // la claqueta
      var fin = silbido(t + 2.4, TEMA, 0.045);
      rasgueo(t + 2.4, [ESCALA[0] / 2, ESCALA[0], ESCALA[3], ESCALA[5]], 0.12); rasgueo(t + 6.0, [ESCALA[1] / 2, ESCALA[1], ESCALA[4], ESCALA[6]], 0.1); rasgueo(fin - 1.2, [ESCALA[0] / 2, ESCALA[0], ESCALA[3], ESCALA[5]], 0.12);
    },
    'fiebre-del-oro': function (t) {
      for (var i = 0; i < 16; i++) brillo(t + 0.2 + i * 0.35 + Math.random() * 0.1, 0.012);
      rasgueo(t + 0.7, [ESCALA[2], ESCALA[5], ESCALA[7], ESCALA[9]], 0.16);
      pasos(t + 2.6, t + 9.6, 0.18, 0.025, 0);
      for (i = 0; i < 8; i++) metal(t + 3 + i * 0.8 + Math.random() * 0.3, 0.025, 1500, 0.4, Math.random() - 0.5);
    },
    'ciudad-fantasma': function (t) {
      golpe(t + 0.5, 13, 420, 0.12, 'bandpass', { ataque: 3, q: 1.4, f2: 900, barre: 6, sala: 0.6 });   // el viento que aúlla
      for (var i = 0; i < 6; i++) tono('sawtooth', 210 + i * 30, t + 2 + i * 1.3, 0.9, 0.025, { f2: 330 + i * 20, glide: 0.8, ataque: 0.2, filtro: 900, q: 9, tipoFiltro: 'bandpass', sala: 0.7, pan: (i % 2 ? 0.5 : -0.5) });   // las puertas que crujen
      for (i = 0; i < 5; i++) madera(t + 3.4 + i * 1.7 + Math.random() * 0.3, 0.12, 180, 0.4);   // una contraventana que golpea
      for (i = 0; i < 4; i++) punteo(ESCALA[[5, 3, 1, 0][i]] , t + 9.6 + i * 0.7, 0.07);
    },
    'black-bart': function (t) {
      galope(t, t + 3.2, 0.03, 0.12, 0.8, 0.1, 0.36); galope(t + 0.05, t + 3.2, 0.02, 0.08, 0.8, 0.1, 0.38);   // el tiro de cuatro
      for (var i = 0; i < 9; i++) madera(t + 0.4 + i * 0.33, 0.03, 140, 0.4);   // las ruedas y el traqueteo
      relincho(t + 3.3, 0.05, -0.1);
      golpe(t + 3.05, 0.04, 2400, 0.12, 'bandpass', { q: 4, pan: -0.5 }); golpe(t + 3.15, 0.04, 1800, 0.12, 'bandpass', { q: 4, pan: -0.5 });   // la escopeta, amartillada
      golpe(t + 4.85, 0.3, 300, 0.25, 'lowpass', { pan: -0.4 }); metal(t + 4.86, 0.04, 700, 0.5, -0.4);   // la caja, en el suelo
      galope(t + 5.6, t + 9.2, 0.12, 0.01, 0.1, -0.9, 0.36);
      golpe(t + 6.1, 0.9, 2500, 0.03, 'bandpass', { f2: 1200, q: 1 });   // el papel que vuela
      for (i = 0; i < 8; i++) punteo(ESCALA[[5, 4, 3, 1, 3, 4, 3, 0][i]], t + 7.4 + i * 0.38, 0.08);
    },
    'butch-y-sundance': function (t) {
      brillo(t + 0.3, 0.04); golpe(t + 0.4, 0.9, 1500, 0.04, 'bandpass', { f2: 600 });   // el cartel que vuela
      golpe(t + 3.3, 0.5, 3000, 0.12, 'bandpass', { f2: 1200, q: 0.8 });   // se rasga
      galope(t + 3.5, t + 8.4, 0.13, 0.02, -0.2, 0.8, 0.36); galope(t + 3.76, t + 8.6, 0.11, 0.02, -0.2, 0.8, 0.38);
      golpe(t + 7.0, 0.8, 2200, 0.04, 'bandpass', { f2: 900 });   // el mapa que se despliega
      tono('sawtooth', 98, t + 7.9, 2.4, 0.05, { ataque: 0.3, filtro: 400, sala: 0.8 }); tono('sawtooth', 147, t + 7.9, 2.4, 0.03, { ataque: 0.3, filtro: 400, sala: 0.8 });   // la sirena del vapor
      galope(t + 9.7, t + 12.1, 0.05, 0.05, 0, 0, 0.42);
      for (var i = 0; i < 6; i++) disparo(t + 12.3 + i * 0.13, 0.14, i % 2 ? 0.3 : -0.3);
      for (i = 0; i < 4; i++) punteo(ESCALA[[0, 3, 5, 7][i]], t + 8.2 + i * 1.3, 0.09);
      rasgueo(t + 14.6, [ESCALA[0] / 2, ESCALA[1], ESCALA[4], ESCALA[6]], 0.12);   // el final abierto
    },
    final: function (t) {
      golpe(t + 0.3, 2.8, 500, 0.3, 'bandpass', { f2: 2600, barre: 1.2, q: 0.5, ataque: 0.5 });   // la ráfaga de polvo
      golpe(t + 0.5, 2.4, 6000, 0.06, 'highpass', { ataque: 0.4 });
      galope(t + 2.0, t + 11.5, 0.14, 0.008, -0.6, 0.05, 0.4); relincho(t + 11.6, 0.03, 0.05);
      var fin = silbido(t + 3.0, TEMA.concat([[0, 0.4]], TEMA.slice(0, 6)), 0.04);
      arpegio(t + 2.6, [0, 3, 5, 7, 5, 3], 0.4, 0.1); arpegio(t + 7.4, [1, 4, 6, 8, 6, 4], 0.4, 0.09); rasgueo(fin, [ESCALA[0] / 2, ESCALA[0], ESCALA[3], ESCALA[5], ESCALA[7]], 0.14);
      brillo(t + 5.8, 0.07); golpe(t + 7.2, 0.6, 1200, 0.06, 'bandpass', { f2: 400 }); golpe(t + 9.0, 0.3, 250, 0.22, 'lowpass');
      var iris = 15.5 + E.lectura / 1000;
      tono('triangle', 82.4, t + iris + 1.5, 3, 0.12, { ataque: 0.05, filtro: 600, sala: 0.8 }); tono('triangle', 123.5, t + iris + 1.5, 3, 0.07, { ataque: 0.05, filtro: 600, sala: 0.8 });
    }
  };
  E.en('escena', function (d) {
    if (!ac || !S.activo) return;
    var t = ac.currentTime;
    if (d.fase === 'fin') { if (escBus) { escBus.seco.gain.setTargetAtTime(0, t, 0.25); escBus.sala.gain.setTargetAtTime(0, t, 0.25); escBus = null; } return; }
    if (d.fase !== 'inicio') return;
    escBus = { seco: ac.createGain(), sala: ac.createGain() }; escBus.seco.connect(master); escBus.sala.connect(salaEnv);
    bus = escBus;
    // al empezar cualquier secreto: las espuelas y un acorde de guitarra
    try { for (var i = 0; i < 3; i++) tono('sine', 3200 + i * 400, t + 0.05 + i * 0.05, 0.25, 0.02, { ataque: 0.002, sala: 0.5 }); rasgueo(t + 0.12, [ESCALA[0] / 2, ESCALA[0], ESCALA[3], ESCALA[5]], 0.14); var f = ESCENAS[d.huevo && d.huevo.id]; if (f) f(t); }
    finally { bus = AMB; }
  });

  /* --- encender y apagar --- */
  S.encender = function () {
    if (!ac && !crear()) return;
    if (ac.state === 'suspended') ac.resume();
    S.activo = true; master.gain.setTargetAtTime(0.9, ac.currentTime, 0.6);
    try { localStorage.setItem(CLAVE, '1'); } catch (e) { /* nada */ }
    pintarBoton();
  };
  S.apagar = function () {
    S.activo = false; if (ac) master.gain.setTargetAtTime(0, ac.currentTime, 0.25);
    try { localStorage.setItem(CLAVE, '0'); } catch (e) { /* nada */ }
    pintarBoton();
  };
  S.alternar = function () { if (S.activo) S.apagar(); else S.encender(); };
  S.medidor = function () { if (!ac) return null; var an = ac.createAnalyser(); an.fftSize = 2048; master.connect(an); return function () { var d = new Float32Array(an.fftSize); an.getFloatTimeDomainData(d); var q = 0; for (var i = 0; i < d.length; i++) q += d[i] * d[i]; return Math.sqrt(q / d.length); }; };
  function pintarBoton() { var b = document.getElementById('b-sonido'); if (b) { b.setAttribute('aria-pressed', S.activo ? 'true' : 'false'); b.classList.toggle('activo', S.activo); } }
  // el botón va a la izquierda del del diario (en el móvil, debajo)
  function colocar() {
    var b = document.getElementById('b-sonido'), c = document.getElementById('b-cuaderno'); if (!b || !c) return;
    var r = c.getBoundingClientRect(), movil = innerWidth < 640;
    b.style.top = (movil ? r.bottom + 8 : r.top) + 'px'; b.style.height = (movil ? 44 : r.height) + 'px';
    b.style.right = (movil ? innerWidth - r.right : innerWidth - r.left + 8) + 'px';
  }
  var quiere = false; try { quiere = localStorage.getItem(CLAVE) === '1'; } catch (e) { /* nada */ }
  function primerGesto() { if (quiere && !S.activo) S.encender(); window.removeEventListener('pointerdown', primerGesto, true); window.removeEventListener('keydown', primerGesto, true); }
  window.addEventListener('pointerdown', primerGesto, true); window.addEventListener('keydown', primerGesto, true);
  var b = document.getElementById('b-sonido');
  if (b) b.addEventListener('click', function (ev) { ev.stopPropagation(); quiere = false; S.alternar(); });
  window.addEventListener('resize', colocar); colocar(); setTimeout(colocar, 600);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(colocar);
  pintarBoton();
})();
