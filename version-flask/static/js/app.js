/* ===========================================================
   Tablero de Incidencias de Vehículos Eléctricos
   Lógica de front-end: consume la API REST de Flask.
   =========================================================== */

const API = {
  incidencias: '/api/incidencias',
  metricas:    '/api/metricas',
  estadisticas:'/api/estadisticas',
  vehiculos:   '/api/vehiculos',
  salud:       '/api/salud'
};

const COLOR = {
  'Alta':'#c94a45', 'Media':'#c98a12', 'Baja':'#2f8f6b',
  'Pendiente':'#c94a45', 'En proceso':'#c98a12', 'Solucionada':'#2f8f6b'
};
const PALETA = ['#0f6e5c','#3a6ea5','#c98a12','#c94a45','#6a5acd','#17997c','#a4632a','#5b7083'];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------------- Gráfico de dona (SVG) ---------------- */
function dona(contenedor, datos, colores) {
  const total = datos.reduce((a, d) => a + d.total, 0);
  const R = 62, r = 40, cx = 75, cy = 75;
  let ang = -Math.PI / 2, paths = '';

  if (total === 0) { contenedor.innerHTML = '<p class="vacio">Sin datos</p>'; return; }

  datos.forEach((d, i) => {
    const frac = d.total / total;
    const fin = ang + frac * Math.PI * 2;
    const largo = frac > 0.5 ? 1 : 0;
    const color = colores[d.etiqueta] || PALETA[i % PALETA.length];
    if (frac >= 0.9999) {
      paths += `<circle cx="${cx}" cy="${cy}" r="${(R + r) / 2}" fill="none"
                 stroke="${color}" stroke-width="${R - r}"/>`;
    } else {
      const p = (rad, a) => `${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`;
      paths += `<path d="M ${p(R, ang)} A ${R} ${R} 0 ${largo} 1 ${p(R, fin)}
                        L ${p(r, fin)} A ${r} ${r} 0 ${largo} 0 ${p(r, ang)} Z"
                 fill="${color}"><title>${esc(d.etiqueta)}: ${d.total}</title></path>`;
    }
    ang = fin;
  });

  const leyenda = datos.map((d, i) => {
    const color = colores[d.etiqueta] || PALETA[i % PALETA.length];
    const pct = Math.round(d.total * 100 / total);
    return `<span><i style="background:${color}"></i>${esc(d.etiqueta)} — <b>${d.total}</b> (${pct}%)</span>`;
  }).join('');

  contenedor.innerHTML = `
    <div style="display:flex;justify-content:center">
      <svg viewBox="0 0 150 150" width="160" height="160" role="img"
           aria-label="Distribución de incidencias">
        ${paths}
        <text x="75" y="72" text-anchor="middle" font-size="24" font-weight="700" fill="#1c2530">${total}</text>
        <text x="75" y="88" text-anchor="middle" font-size="9" fill="#68717d">TOTAL</text>
      </svg>
    </div>
    <div class="legend">${leyenda}</div>`;
}

/* ---------------- Gráfico de barras horizontales ---------------- */
function barras(contenedor, datos, colores) {
  if (!datos.length) { contenedor.innerHTML = '<p class="vacio">Sin datos</p>'; return; }
  const max = Math.max(...datos.map(d => d.total));
  contenedor.innerHTML = datos.map((d, i) => {
    const color = (colores && colores[d.etiqueta]) || PALETA[i % PALETA.length];
    const ancho = Math.max(4, Math.round(d.total * 100 / max));
    return `<div class="bar-row">
              <span title="${esc(d.etiqueta)}">${esc(d.etiqueta)}</span>
              <span class="bar-track"><span class="bar-fill" style="width:${ancho}%;background:${color}"></span></span>
              <span class="num">${d.total}</span>
            </div>`;
  }).join('');
}

/* ---------------- Carga de datos ---------------- */
async function cargarMetricas() {
  const m = await (await fetch(API.metricas)).json();
  $('kpi-total').textContent        = m.total;
  $('kpi-pendientes').textContent   = m.pendientes;
  $('kpi-alta').textContent         = m.alta_prioridad;
  $('kpi-solucionadas').textContent = m.solucionadas;
  $('kpi-pend-hint').textContent    = `${m.en_proceso} adicionales en proceso`;
  $('kpi-ok-hint').textContent      = `${m.porcentaje_solucion}% de resolución`;
  $('kpi-alta-hint').textContent    = m.total ? `${Math.round(m.alta_prioridad*100/m.total)}% del total` : '—';
}

async function cargarGraficos() {
  const s = await (await fetch(API.estadisticas)).json();
  dona($('chart-estado'), s.por_estado, COLOR);
  dona($('chart-prioridad'), s.por_prioridad, COLOR);
  barras($('chart-tipo'), s.por_tipo, null);
}

function filtrosActuales() {
  const p = new URLSearchParams();
  const estado = $('f-estado').value, prio = $('f-prioridad').value,
        tipo = $('f-tipo').value, q = $('f-q').value.trim();
  if (estado) p.set('estado', estado);
  if (prio)   p.set('prioridad', prio);
  if (tipo)   p.set('tipo', tipo);
  if (q)      p.set('q', q);
  return p;
}

async function cargarTabla() {
  const p = filtrosActuales();
  const r = await (await fetch(`${API.incidencias}?${p}`)).json();
  const tb = $('tbody');

  $('resumen-tabla').textContent = p.toString()
    ? `${r.total} incidencia(s) coinciden con los filtros aplicados`
    : `${r.total} incidencia(s) registradas en total`;

  if (!r.total) {
    tb.innerHTML = '<tr><td colspan="10" class="vacio">No se encontraron incidencias con los filtros seleccionados.</td></tr>';
    return;
  }

  tb.innerHTML = r.incidencias.map(i => `
    <tr>
      <td>#${i.id}</td>
      <td><span class="placa">${esc(i.placa)}</span><br>
          <span style="color:#68717d;font-size:12px">${esc(i.marca)} ${esc(i.modelo)}</span></td>
      <td>${esc(i.tipo)}</td>
      <td>${esc(i.fecha)}</td>
      <td>${esc(i.ubicacion)}</td>
      <td><span class="chip ${i.prioridad}">${esc(i.prioridad)}</span></td>
      <td><span class="chip ${i.estado.replace(' ','')}">${esc(i.estado)}</span></td>
      <td class="desc">${esc(i.descripcion)}</td>
      <td>${esc(i.reportado_por)}</td>
      <td><div class="acciones">
        ${i.estado !== 'Solucionada'
          ? `<button class="mini" data-id="${i.id}" data-next="${i.estado === 'Pendiente' ? 'En proceso' : 'Solucionada'}">
               &rarr; ${i.estado === 'Pendiente' ? 'En proceso' : 'Solucionar'}</button>`
          : '<span style="color:#68717d;font-size:11.5px">Cerrada</span>'}
      </div></td>
    </tr>`).join('');

  tb.querySelectorAll('button.mini').forEach(b => {
    b.addEventListener('click', () => actualizarEstado(b.dataset.id, b.dataset.next));
  });
}

async function actualizarEstado(id, estado) {
  const res = await fetch(`${API.incidencias}/${id}`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({estado})
  });
  if (res.ok) { aviso(`Incidencia #${id} actualizada a "${estado}"`); refrescar(); }
}

async function cargarVehiculos() {
  const v = await (await fetch(API.vehiculos)).json();
  $('i-placa').innerHTML = v.map(x =>
    `<option value="${esc(x.placa)}">${esc(x.placa)} — ${esc(x.marca)} ${esc(x.modelo)}</option>`).join('');
}

async function verificarConexion() {
  try {
    const s = await (await fetch(API.salud)).json();
    $('estado-conexion').textContent =
      `BD conectada · ${s.motor} · ${s.registros.incidencias} incidencias / ${s.registros.vehiculos} vehículos`;
  } catch { $('estado-conexion').textContent = 'Sin conexión a la base de datos'; }
}

function refrescar() {
  return Promise.all([cargarMetricas(), cargarGraficos(), cargarTabla(), verificarConexion()]);
}

/* ---------------- Modal de registro ---------------- */
function abrirModal()  { $('aviso').classList.remove('err'); $('overlay').classList.add('open'); $('i-ubicacion').focus(); }
function cerrarModal() { $('overlay').classList.remove('open'); }

function aviso(msg) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

async function guardarIncidencia(ev) {
  ev.preventDefault();
  const cuerpo = {
    placa: $('i-placa').value,
    tipo: $('i-tipo').value,
    fecha: $('i-fecha').value,
    ubicacion: $('i-ubicacion').value,
    prioridad: $('i-prioridad').value,
    estado: $('i-estado').value,
    reportado_por: $('i-reporto').value,
    descripcion: $('i-desc').value
  };
  const res = await fetch(API.incidencias, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(cuerpo)
  });
  const data = await res.json();
  if (!res.ok) {
    const a = $('aviso');
    a.textContent = data.error + (data.campos ? ': ' + data.campos.join(', ') : '');
    a.classList.add('err');
    return;
  }
  cerrarModal();
  $('form-inc').reset();
  $('i-fecha').valueAsDate = new Date();
  aviso(`Incidencia #${data.id} registrada en la base de datos`);
  refrescar();
}

/* ---------------- Eventos ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  ['f-estado','f-prioridad','f-tipo'].forEach(id => $(id).addEventListener('change', cargarTabla));
  let t; $('f-q').addEventListener('input', () => { clearTimeout(t); t = setTimeout(cargarTabla, 250); });
  $('btn-limpiar').addEventListener('click', () => {
    ['f-estado','f-prioridad','f-tipo','f-q'].forEach(id => $(id).value = '');
    cargarTabla();
  });
  $('btn-nueva').addEventListener('click', abrirModal);
  $('btn-cerrar').addEventListener('click', cerrarModal);
  $('btn-cancelar').addEventListener('click', cerrarModal);
  $('overlay').addEventListener('click', e => { if (e.target === $('overlay')) cerrarModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarModal(); });
  $('form-inc').addEventListener('submit', guardarIncidencia);

  cargarVehiculos();
  refrescar();
});
