/* ══ Horarios de los locales (para /paseo-mendoza/ y /cumpleanos/) ══
   Si cambia un horario, cambiarlo ACÁ y también en el bloque HORARIOS de la home (index.html).
   Minutos desde las 00:00. Si cierra después de medianoche, sumar 1440 (ej. 02:00 = 1560).
   Días: 0 domingo, 1 lunes, 2 martes, 3 miércoles, 4 jueves, 5 viernes, 6 sábado. */
window.HORARIOS = {
  chiringuito: {nombre:'El Chiringuito',2:[[600,1500]],3:[[600,1500]],4:[[600,1500]],5:[[600,1620]],6:[[600,1620]],0:[[600,1500]]},
  lounge:      {nombre:'Chiringuito Lounge',3:[[540,1500]],4:[[540,1500]],5:[[540,1500]],6:[[540,1500]],0:[[540,1500]]},
  focacceria:  {nombre:'La Focacceria',2:[[540,1200]],3:[[540,1200]],4:[[540,1200]],5:[[540,1500]],6:[[540,1500]],0:[[540,1500]]},
  unapizza:    {nombre:'Una Pizza',3:[[1140,1440]],4:[[1140,1440]],5:[[1140,1500]],6:[[1140,1500]],0:[[1140,1440]]},
  bakery:      {nombre:'ChirinBakery',2:[[600,1260]],3:[[600,1260]],4:[[600,1260]],5:[[600,1260]],6:[[600,1260]],0:[[600,1260]]}
};
(function () {
  var DIAS = ['dom','lun','mar','mié','jue','vie','sáb'];
  function ahoraBA() {
    try {
      var p = new Intl.DateTimeFormat('en-US',{timeZone:'America/Argentina/Buenos_Aires',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
      var g = function (t) { return p.find(function (x) { return x.type === t; }).value; };
      return {d:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(g('weekday')), m:(+g('hour'))*60+(+g('minute'))};
    } catch (e) { var n = new Date(); return {d:n.getDay(), m:n.getHours()*60+n.getMinutes()}; }
  }
  function hhmm(x) { x = x % 1440; return String(Math.floor(x/60)).padStart(2,'0') + ':' + String(x%60).padStart(2,'0'); }
  function estado(h, now) {
    var d = now.d, m = now.m, ayer = (d+6)%7, i, r;
    r = h[d] || []; for (i=0;i<r.length;i++) if (m>=r[i][0] && m<r[i][1]) return {abierto:true,cierra:r[i][1],resta:r[i][1]-m};
    r = h[ayer] || []; for (i=0;i<r.length;i++) if (r[i][1]>1440 && m<r[i][1]-1440) return {abierto:true,cierra:r[i][1],resta:r[i][1]-1440-m};
    for (var k=0;k<8;k++) {
      var dd = (d+k)%7, prox = (h[dd]||[]).filter(function (x) { return k>0 || x[0]>m; }).sort(function (a,b) { return a[0]-b[0]; })[0];
      if (prox) return {abierto:false,abre:prox[0],k:k,dia:dd};
    }
    return {abierto:false};
  }
  /* devuelve {clase, texto} para mostrar al lado de cada local */
  window.estadoLocal = function (id) {
    var s = estado(window.HORARIOS[id], ahoraBA());
    if (s.abierto) return {clase: s.resta<=45 ? 'pronto' : 'abierto', texto: (s.resta<=45 ? 'Cierra pronto' : 'Abierto') + ' · hasta las ' + hhmm(s.cierra)};
    if (s.abre === undefined) return {clase:'cerrado', texto:'Cerrado'};
    return {clase:'cerrado', texto:'Cerrado · abre ' + (s.k===0 ? 'hoy' : s.k===1 ? 'mañana' : DIAS[s.dia]) + ' a las ' + hhmm(s.abre)};
  };
  /* pinta todos los [data-estado="local"] de la página y se actualiza cada minuto */
  function pintar() {
    document.querySelectorAll('[data-estado]').forEach(function (el) {
      var e = window.estadoLocal(el.getAttribute('data-estado'));
      el.className = 'estado ' + e.clase; el.textContent = e.texto;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pintar); else pintar();
  setInterval(pintar, 60000);
})();
