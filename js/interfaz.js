/* Vaccaria Incognita · interfaz
   El registro de secretos, el progreso (en este navegador), el diario, la tarjeta de cada escena, los avisos, los
   instrumentos (LUGAR: dónde estás; HORA: la hora del sol; RASTRO: late cerca de un secreto de lugar), el botón de la
   tinta (Pau quiere comparar con y sin tinta), la entrada (la medalla: una estrella de sheriff) y los créditos. Para volver o cerrar: la tecla ⌫ (nunca Esc, que saca de la pantalla completa). */
(function () {
  'use strict';
  var VA = window.VA, U = VA.util, E = VA.motor, PA = VA.paisaje;
  var CLAVE = 'vaccaria-incognita.v1';   // no se cambia nunca: borraría el progreso de quien ya juega
  var PRUEBA = /[?&]prueba\b/.test(location.search);
  var I = VA.interfaz = { prueba: PRUEBA };
  var huevos = [], final = null;
  var estado = { hallados: {}, final: false, introVista: false };
  var $ = function (id) { return document.getElementById(id); };
  var raiz = document.documentElement;
  var AUTOR = { nombre: 'Pau Morató Sebastià', linkedin: 'https://www.linkedin.com/in/pau-morat%C3%B3-sebasti%C3%A0-5554a01b2' };

  /* ---------- registro ----------
     Cada secreto: { id, n, nombre, tipo, pista, lugar?: () => λ de la costa, radio?, detectar(api), escena(motor, datos) } */
  VA.registrar = function (h) { huevos.push(h); huevos.sort(function (a, b) { return a.n - b.n; }); };
  VA.registrarFinal = function (h) { final = h; };
  I.huevos = function () { return huevos; };
  I.estado = function () { return estado; };

  function cargar() { try { var s = localStorage.getItem(CLAVE); if (s) { var o = JSON.parse(s); for (var k in o) estado[k] = o[k]; } } catch (e) { /* sin almacenamiento */ } }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* sin almacenamiento */ } }
  // los escondidos (h.escondido) no cuentan para los diez ni para el final; salen en el diario cuando se encuentran
  function visibles() { return huevos.filter(function (h) { return !h.escondido; }); }
  function escondidos() { return huevos.filter(function (h) { return h.escondido; }); }
  function cuantos(lista) { return (lista || visibles()).filter(function (h) { return estado.hallados[h.id]; }).length; }

  /* ---------- disparar un secreto ---------- */
  I.disparar = function (h, datos, op) {
    op = op || {};
    if (!h.escena || E.escena || !$('intro').hidden || !$('creditos').hidden) return false;
    // un secreto ya encontrado no vuelve a salir solo (Pau, 01/11: molestaban mientras buscabas los otros); se vuelve a ver desde el cuaderno
    if (estado.hallados[h.id] && !op.cuaderno && !op.prueba) return false;
    cerrarCuaderno();
    var nuevo = !estado.hallados[h.id] && !op.prueba;
    if (nuevo) { estado.hallados[h.id] = Date.now(); guardar(); }
    h.ultimosDatos = datos || h.ultimosDatos || null;
    var envoltorio = { id: h.id, escena: function (motor) {
      var s = h.escena(motor, datos || h.ultimosDatos || null);
      if (s && s.tarjeta && !s.tarjeta.etiqueta) s.tarjeta.etiqueta = h.escondido ? 'Secreto escondido · ' + h.tipo : 'Secreto ' + U.dos(h.n) + ' / ' + U.dos(visibles().length) + ' · ' + h.tipo;
      return s;
    } };
    E.reproducir(envoltorio, function () {
      pintarLista(nuevo ? h.id : null);
      if (nuevo) {
        if (h.escondido) aviso('Secreto escondido <b>' + cuantos(escondidos()) + '/' + escondidos().length + '</b> · ' + h.nombre);
        else aviso('Secreto encontrado <b>' + U.dos(cuantos()) + '/' + U.dos(visibles().length) + '</b> · ' + h.nombre);
        var b = $('b-cuaderno'); b.classList.remove('pulso'); void b.offsetWidth; b.classList.add('pulso');
        if (!h.escondido && cuantos() === visibles().length && !estado.final && final) setTimeout(function () { I.verFinal(); }, 1600);
      }
    });
    return true;
  };
  I.verFinal = function () {
    if (!final || E.escena) return;
    cerrarCuaderno();
    var primero = Infinity, ultimo = 0;
    visibles().forEach(function (h) { var t = estado.hallados[h.id]; if (t) { primero = Math.min(primero, t); ultimo = Math.max(ultimo, t); } });
    raiz.classList.add('final-activo');
    E.reproducir({ id: 'final', escena: function (motor) { return final.escena(motor, { desde: primero, hasta: ultimo, huevos: huevos }); } }, function () {
      raiz.classList.remove('final-activo');
      if (cuantos() === visibles().length) { estado.final = true; guardar(); I.pintarTinta && I.pintarTinta(); }
      pintarLista();
      mostrarCreditos();
    });
  };

  /* ---------- créditos ---------- */
  function mostrarCreditos() {
    var c = $('creditos');
    c.hidden = false; c.classList.remove('saliendo'); void c.offsetWidth; c.classList.add('visible');
    E.bloqueado = true;
    setTimeout(function () { var b = $('creditos-enlace'); try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); } }, 2600);
  }
  function cerrarCreditos() {
    var c = $('creditos'); if (c.hidden) return;
    c.classList.remove('visible'); c.classList.add('saliendo');
    E.bloqueado = false; E.ultimoInput = E.t;
    setTimeout(function () { c.hidden = true; c.classList.remove('saliendo'); }, 650);
  }
  I.mostrarCreditos = mostrarCreditos;

  /* ---------- tarjeta ---------- */
  I.tarjeta = function (t) {
    var el = $('tarjeta');
    if (!t) { el.classList.remove('visible'); return; }
    var v = function (x) { return typeof x === 'function' ? x() : (x || ''); };
    $('t-etq').textContent = v(t.etiqueta);
    $('t-tit').textContent = v(t.titulo);
    $('t-txt').innerHTML = v(t.texto);
    $('t-pie').textContent = v(t.pie);
    void el.offsetWidth; el.classList.add('visible');
  };

  /* ---------- aviso ---------- */
  var tAviso = null;
  function aviso(html, ms) {
    var el = $('aviso'); el.innerHTML = html; el.classList.add('visible');
    clearTimeout(tAviso); tAviso = setTimeout(function () { el.classList.remove('visible'); }, ms || 4200);
  }
  I.aviso = aviso;

  /* ---------- cuaderno ---------- */
  function abrirCuaderno() {
    $('cuaderno').classList.add('abierto'); $('cuaderno').setAttribute('aria-hidden', 'false');
    $('b-cuaderno').setAttribute('aria-expanded', 'true'); raiz.classList.add('cuaderno-abierto');
  }
  function cerrarCuaderno() {
    $('cuaderno').classList.remove('abierto'); $('cuaderno').setAttribute('aria-hidden', 'true');
    $('b-cuaderno').setAttribute('aria-expanded', 'false'); raiz.classList.remove('cuaderno-abierto');
  }
  I.abrirCuaderno = abrirCuaderno; I.cerrarCuaderno = cerrarCuaderno;

  function fecha(ms) {
    var d = new Date(ms);
    return U.dos(d.getDate()) + '.' + U.dos(d.getMonth() + 1) + '.' + d.getFullYear() + ' · ' + U.dos(d.getHours()) + ':' + U.dos(d.getMinutes());
  }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function pintarLista(recien) {
    var ol = $('lista'); ol.innerHTML = '';
    var fila = function (h) {
      var ok = !!estado.hallados[h.id];
      var li = el('li', 'entrada' + (ok ? ' hallada' : '') + (recien === h.id ? ' nueva' : ''));
      li.appendChild(el('div', 'e-num', h.escondido ? '✦' : U.dos(h.n)));
      var c = el('div', 'e-cuerpo');
      c.appendChild(el('div', 'e-tipo', h.tipo));
      var nom = el('div', 'e-nombre');
      if (ok) nom.textContent = h.nombre;
      else { var cen = el('span', 'e-censura'); cen.style.width = (h.nombre.length * 0.48 + 0.6) + 'em'; nom.appendChild(cen); nom.setAttribute('aria-label', 'Por descubrir'); }
      c.appendChild(nom);
      c.appendChild(el('p', 'e-pista', h.pista));
      if ((ok || PRUEBA) && h.escena) {
        var meta = el('div', 'e-meta');
        if (ok) meta.appendChild(el('span', '', 'Hallado · ' + fecha(estado.hallados[h.id])));
        var b = el('button', 'e-ver', ok ? 'Volver a ver' : '▶ Probar');
        b.type = 'button';
        b.addEventListener('click', function () { I.disparar(h, null, { prueba: !ok, cuaderno: true }); });
        meta.appendChild(b); c.appendChild(meta);
      }
      li.appendChild(c); ol.appendChild(li);
    };
    visibles().forEach(fila);
    var esc = escondidos(), vistos = esc.filter(function (h) { return estado.hallados[h.id] || PRUEBA; });
    if (vistos.length) {
      var cab = el('li', 'seccion'); cab.appendChild(el('span', '', 'Escondidos')); cab.appendChild(el('b', '', cuantos(esc) + '/' + esc.length)); ol.appendChild(cab);
      vistos.forEach(fila);
    }
    var n = cuantos(), total = visibles().length;
    $('contador').textContent = U.dos(n) + '/' + U.dos(total);
    var seg = $('segmentos'); seg.innerHTML = ''; seg.style.gridTemplateColumns = 'repeat(' + Math.max(1, total) + ', 1fr)';
    for (var i = 0; i < total; i++) seg.appendChild(el('i', i < n ? 'si' : ''));
    $('ver-final').hidden = !(estado.final || (PRUEBA && final));
    $('c-credito-linea').hidden = !estado.final;
    raiz.classList.toggle('cognita', !!estado.final);
  }

  /* ---------- instrumentos ---------- */
  var cuadroHud = 0, ultimos = {}, lugarActual = '';
  var PUNTOS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  function barras(id, valor) {
    var b = Math.ceil(valor * 5 - 0.15); if (ultimos[id] === b) return; ultimos[id] = b;
    var is = $(id).children; for (var i = 0; i < is.length; i++) is[i].classList.toggle('si', i < b);
  }
  function instrumentos() {
    // RASTRO: sube cuando te acercas a un secreto de lugar que aún no has encontrado
    var objetivo = 0, p = E.puntero, ref = p.sobre && p.tipo === 'mouse' ? p.x : E.W / 2;
    huevos.forEach(function (h) {
      if (!h.lugar || h.escondido || estado.hallados[h.id]) return;
      var l = h.lugar(); if (l == null) return;
      objetivo = Math.max(objetivo, U.clamp(1 - Math.abs(E.sx(l, 1) - ref) / (h.radio || 0.35) / E.u, 0, 1));
    });
    E.senal += (objetivo - E.senal) * 0.12;
    if (++cuadroHud % 5) return;
    barras('h-rastro', E.senal);
    $('h-rastro').classList.toggle('latiendo', E.senal > 0.12);
    $('h-rastro').style.animationDuration = (1.3 - E.senal * 0.75).toFixed(2) + 's';
    var h = PA.hora, hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
    $('h-hora').textContent = U.dos(hh) + ':' + U.dos(Math.floor(mm / 5) * 5) + ' · ' + PA.franja();
    if (cuadroHud % 15 === 0) { var lugar = PA.nombreLugar(E.centro()); if (lugar !== lugarActual) { lugarActual = lugar; var hl = $('h-lugar'); hl.classList.remove('cambia'); void hl.offsetWidth; hl.textContent = lugar; hl.classList.add('cambia'); } }
  }


  /* ---------- teclas pulsadas (para los secretos de teclado) ---------- */
  var SIMBOLOS = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Backspace: '⌫' };
  function tecla(d) {
    if (E.escena && d.key !== 'Backspace') return;
    var s = SIMBOLOS[d.key] || (d.key.length === 1 && /\S/.test(d.key) ? d.key.toUpperCase() : null);
    if (!s || /^[+\-=_]$/.test(d.key)) return;
    var cont = $('teclas'), k = el('kbd', '', s);
    cont.appendChild(k);
    while (cont.children.length > 10) cont.removeChild(cont.firstChild);
    setTimeout(function () { if (k.parentNode) k.parentNode.removeChild(k); }, 2300);
  }

  /* ---------- la medalla de la entrada: la cabeza de Ko Te Riku, con sus ojos, delante del sol ---------- */
  function medalla() {
    var cv = $('intro-medalla'); if (!cv) return;
    var d = Math.min(2, window.devicePixelRatio || 1), sz = 168; cv.width = cv.height = sz * d;
    var c = cv.getContext('2d'); c.scale(d, d);
    c.save(); c.beginPath(); c.arc(sz / 2, sz / 2, sz / 2 - 2, 0, Math.PI * 2); c.clip();
    var g = c.createLinearGradient(0, 0, 0, sz); g.addColorStop(0, '#1f6f78'); g.addColorStop(0.55, '#f2c48a'); g.addColorStop(0.75, '#ffb070'); g.addColorStop(1, '#d8935a'); c.fillStyle = g; c.fillRect(0, 0, sz, sz);
    c.fillStyle = '#c4573a'; c.beginPath(); c.moveTo(-10, sz * 0.78); c.lineTo(sz * 0.12, sz * 0.78); c.lineTo(sz * 0.16, sz * 0.5); c.lineTo(sz * 0.36, sz * 0.5); c.lineTo(sz * 0.4, sz * 0.78); c.lineTo(sz * 0.7, sz * 0.78); c.lineTo(sz * 0.74, sz * 0.56); c.lineTo(sz * 0.9, sz * 0.56); c.lineTo(sz * 0.94, sz * 0.78); c.lineTo(sz + 10, sz * 0.78); c.lineTo(sz + 10, sz); c.lineTo(-10, sz); c.fill();
    // la estrella de seis puntas con sus bolitas, de latón
    var cx = sz / 2, cy = sz * 0.46, R = sz * 0.3, r = R * 0.5, pts = [];
    for (var i = 0; i < 12; i++) { var a = -Math.PI / 2 + i * Math.PI / 6, rr = i % 2 ? r : R; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    c.beginPath(); pts.forEach(function (q, i) { i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath();
    c.lineWidth = 5; c.strokeStyle = '#3b2618'; c.stroke(); var gb = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R); gb.addColorStop(0, '#fff0b0'); gb.addColorStop(0.5, '#e8b448'); gb.addColorStop(1, '#a8701e'); c.fillStyle = gb; c.fill();
    for (i = 0; i < 12; i += 2) { var q = pts[i]; c.beginPath(); c.arc(q[0], q[1], 5, 0, Math.PI * 2); c.fillStyle = '#e8b448'; c.fill(); c.lineWidth = 2; c.stroke(); }
    c.beginPath(); c.arc(cx, cy, r * 0.75, 0, Math.PI * 2); c.lineWidth = 1.5; c.strokeStyle = 'rgba(80,50,10,.6)'; c.stroke();
    c.fillStyle = '#5a3a10'; c.font = '700 ' + Math.round(r * 0.42) + 'px Rockwell, Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SHERIFF', cx, cy);
    c.restore();
    c.strokeStyle = 'rgba(242,227,198,.7)'; c.lineWidth = 1.5; c.beginPath(); c.arc(sz / 2, sz / 2, sz / 2 - 1.5, 0, Math.PI * 2); c.stroke();
    cv.classList.add('listo');
  }


  /* ---------- arranque ---------- */
  I.iniciar = function () {
    cargar();
    var tactil = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    $('ayuda').textContent = tactil ? 'Desliza para recorrer el Oeste' : 'Arrastra o usa la rueda para recorrer el Oeste';

    huevos.forEach(function (h) {
      h.detectar && h.detectar({
        motor: E,
        en: function (n, fn) { E.en(n, fn); },
        capa: function (fn) { E.capas.push(fn); },
        hallado: function () { return !!estado.hallados[h.id]; },
        disparar: function (datos) { return I.disparar(h, datos); }
      });
    });
    E.en('cuadro', instrumentos);
    // la tinta: el mundo va sin tinta; con los diez secretos se desbloquea un botón diminuto para verlo con contorno de tinta
    // (Pau 02/11: «me gusta sin tinta… si terminas los 10 secretos, tienes la opción de cambiar a con tinta»)
    I.pintarTinta = function () { var b = $('b-tinta'); if (!b) return; b.hidden = !(estado.final || PRUEBA); b.setAttribute('aria-pressed', PA.conTinta() ? 'true' : 'false'); b.title = PA.conTinta() ? 'Quitar la tinta' : 'Ver con tinta'; };
    if ($('b-tinta')) $('b-tinta').addEventListener('click', function (ev) { ev.stopPropagation(); PA.tinta(!PA.conTinta()); I.pintarTinta(); });
    if (estado.final && PA.tintaGuardada()) PA.tinta(true);
    I.pintarTinta();
    E.en('tecla', tecla);
    // ⌫ para volver: salta la escena, cierra el cuaderno o los créditos
    E.en('tecla', function (d) {
      if (d.key !== 'Backspace') return;
      if (E.escena) E.saltar();
      else if ($('cuaderno').classList.contains('abierto')) cerrarCuaderno();
      else if (!$('creditos').hidden) cerrarCreditos();
    });

    $('b-cuaderno').addEventListener('click', function () { $('cuaderno').classList.contains('abierto') ? cerrarCuaderno() : abrirCuaderno(); });
    $('cerrar-cuaderno').addEventListener('click', cerrarCuaderno);
    $('saltar').addEventListener('click', function () { E.saltar(); });
    $('ver-final').addEventListener('click', function () { I.verFinal(); });
    $('borrar').addEventListener('click', function () {
      if (!window.confirm('¿Borrar los secretos encontrados en este navegador?')) return;
      estado = { hallados: {}, final: false, introVista: true }; guardar(); pintarLista();
    });

    $('creditos-nombre').textContent = AUTOR.nombre;
    $('c-credito-nombre').textContent = AUTOR.nombre;
    $('creditos-enlace').href = AUTOR.linkedin; $('c-credito').href = AUTOR.linkedin;
    $('creditos-cerrar').addEventListener('click', cerrarCreditos);

    pintarLista();
    I.introPendiente = !estado.introVista && !PRUEBA;
  };
  // la entrada (solo la primera vez): al pulsar «Desembarcar» se imprime la isla
  I.mostrarIntro = function (alEmpezar) {
    var intro = $('intro');
    intro.hidden = false; E.bloqueado = true;
    medalla();
    $('empezar').addEventListener('click', function () {
      estado.introVista = true; guardar();
      intro.classList.add('saliendo'); E.bloqueado = false; E.ultimoInput = E.t;
      setTimeout(function () { intro.hidden = true; }, 900);
      alEmpezar && alEmpezar();
    });
    setTimeout(function () { try { $('empezar').focus({ preventScroll: true }); } catch (e) { /* nada */ } }, 50);
  };
})();
