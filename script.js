// ====================================================================
// script.js — Delta + TablaExacta + simulador + canvas interactivo
// ====================================================================

// ---------- Estados / símbolos (igual que tenías) ----------
const Q = ['q0','q1','q2','q3','q4','q5','q6','q7','q8'];
const BOX = '☐';
const BLANK = ' ';
const q0 = 'q0';

// ---------- Delta (idéntico) ----------
const Delta = {
  'q0': { '0': ['q1','X','R'], '1': ['q2','X','R'], 'X': ['q0','X','R'], ' ': ['q8',' ','R'] },
  'q1': { '0': ['q1','0','R'], '1': ['q1','1','R'], 'Y': ['q1','Y','R'], ' ': ['q4',' ','R'] },
  'q2': { '0': ['q2','0','R'], '1': ['q2','1','R'], 'Y': ['q2','Y','R'], ' ': ['q6',' ','R'] },
  'q4': { 'Y': ['q4','Y','R'], '0': ['q5','Y','L'], '1': ['q7','1','R'], ' ': ['q7',' ','R'] },
  'q5': { 'Y': ['q5','Y','L'], ' ': ['q5',' ','L'], '0': ['q5','0','L'], '1': ['q5','1','L'], 'X': ['q0','X','R'] },
  'q6': { 'Y': ['q6','Y','R'], '1': ['q5','Y','L'], '0': ['q7','0','R'], ' ': ['q7',' ','R'] },
  'q7': { 'Y': ['q7','Y','R'], 'X': ['q7','X','R'], '1': ['q7','1','R'], '0': ['q7','0','R'], ' ': ['q3','M','S'] },
  'q8': { 'Y': ['q8','Y','R'], '0': ['q7','0','R'], '1': ['q7','1','R'], ' ': ['q3','E','S'] }
};

// ---------- TablaExacta (para mostrar) ----------
const TablaExacta = [
  ['q0','0','X','R','q1'],['q0','1','X','R','q2'],['q0','-','-','R','q8'],
  ['q1','0','0','R','q1'],['q1','1','1','R','q1'],['q1','-','-','R','q4'],
  ['q2','0','0','R','q2'],['q2','1','1','R','q2'],['q2','-','-','R','q6'],
  ['q4','Y','Y','R','q4'],['q4','0','Y','L','q5'],['q4','1','1','R','q7'],['q4','-','-','R','q7'],
  ['q5','Y','Y','L','q5'],['q5','-','-','L','q5'],['q5','0','0','L','q5'],['q5','1','1','L','q5'],['q5','X','X','R','q0'],
  ['q6','Y','Y','R','q6'],['q6','1','Y','L','q5'],['q6','0','0','R','q7'],['q6','ε','ε','R','q7'],
  ['q7','Y','Y','R','q7'],['q7','X','X','R','q7'],['q7','1','1','R','q7'],['q7','0','0','R','q7'],['q7','ε','M','S','q3'],
  ['q8','Y','Y','R','q8'],['q8','0','0','R','q7'],['q8','1','1','R','q7'],['q8','ε','E','S','q3']
];

// ---------- Mostrar tabla ----------
function mostrarTablaTransiciones() {
  const cont = document.getElementById('tabla-transiciones-display');
  if (!cont) return;
  let html = '<table class="tabla-transiciones"><thead><tr>' +
             '<th>Estado actual</th><th>Símbolo leído</th><th>Símbolo escrito</th><th>Movimiento</th><th>Nuevo estado</th>' +
             '</tr></thead><tbody>';
  TablaExacta.forEach(row => {
    const [est, leido, escrito, mov, nuevo] = row;
    html += `<tr><td><strong>${est}</strong></td><td class="mono">${leido}</td><td class="mono">${escrito}</td><td class="mono">${mov}</td><td>${nuevo}</td></tr>`;
  });
  html += '</tbody></table>';
  cont.innerHTML = html;
}

// ---------- DI (igual) ----------
function generarDI(estado, cinta, cabezal) {
  const visual = cinta.map(s => s === BLANK ? BOX : s);
  const left = visual.slice(0, cabezal).join(' ');
  const headSymbol = visual[cabezal] || BOX;
  const right = visual.slice(cabezal + 1).join(' ');
  return `${left} <span class="di-state">${estado}</span>[<span class="di-symbol">${headSymbol}</span>] ${right}`.trim();
}

// ---------- Simulador (igual) ----------
function simular(rawInput, maxSteps = 5000) {
  let input = rawInput.replace(/-/g, ' ').trim();
  let cinta = input.split('');
  cinta.unshift(BLANK); cinta.push(BLANK);
  let cabezal = 1;
  let estado = q0;
  const historial = [];
  let pasos = 0;
  while (estado !== 'q3' && pasos < maxSteps) {
    if (cabezal < 0) { cinta.unshift(BLANK); cabezal = 0; }
    if (cabezal >= cinta.length) cinta.push(BLANK);
    historial.push(generarDI(estado, cinta, cabezal));
    const sym = cinta[cabezal];
    const trans = (Delta[estado] && Delta[estado][sym]) ? Delta[estado][sym] : null;
    if (!trans) {
      historial.push(`<span class="error">⚠️ Detención inesperada: estado ${estado} leyendo "${sym === BLANK ? BOX : sym}" — transición no definida.</span>`);
      break;
    }
    const [ns, write, mov] = trans;
    cinta[cabezal] = write;
    if (mov === 'R') cabezal++;
    else if (mov === 'L') cabezal--;
    else if (mov === 'S' || mov === 's') { estado = ns; break; }
    estado = ns;
    pasos++;
  }
  historial.push(generarDI(estado, cinta, Math.max(0, Math.min(cabezal, cinta.length - 1))));
  return { historialDI: historial, cintaFinal: cinta, estadoFinal: estado, pasosEjecutados: pasos };
}

function renderTapeVisual(cinta) {
  return cinta.map(s => `<span class="tape-cell">${s === BLANK ? BOX : s}</span>`).join('');
}

// ---------- Usadas + registro de transiciones ----------
function simularConRegistro(rawInput, maxSteps = 5000) {
  const res = simular(rawInput, maxSteps);
  let input = rawInput.replace(/-/g, ' ').trim();
  let cinta = input.split(''); cinta.unshift(BLANK); cinta.push(BLANK);
  let cabezal = 1; let estado = q0;
  const used = [];
  let pasos = 0;
  while (estado !== 'q3' && pasos < maxSteps) {
    if (cabezal < 0) { cinta.unshift(BLANK); cabezal = 0; }
    if (cabezal >= cinta.length) cinta.push(BLANK);
    const sym = cinta[cabezal];
    const trans = (Delta[estado] && Delta[estado][sym]) ? Delta[estado][sym] : null;
    if (!trans) break;
    const [ns, write, mov] = trans;
    const leidoVista = sym === ' ' ? 'ε' : (sym === '-' ? '-' : sym);
    const escribirVista = write === ' ' ? 'ε' : write;
    const key = `${estado}|${leidoVista}|${escribirVista}|${mov}|${ns}`;
    used.push(key);
    cinta[cabezal] = write;
    if (mov === 'R') cabezal++; else if (mov === 'L') cabezal--;
    estado = ns;
    pasos++;
  }
  return { result: res, usedKeys: used };
}

// ---------- Convertir key -> texto legible ----------
function keyToTransitionText(key) {
  const parts = key.split('|');
  if (parts.length !== 5) return key;
  const [est, leido, escrito, mov, ns] = parts;
  const leidoDisplay = leido === 'ε' ? BOX : leido;
  const escritoDisplay = escrito === 'ε' ? BOX : escrito;
  return `(${est}, ${leidoDisplay}) → (${ns}, ${escritoDisplay}, ${mov})`;
}

// ---------- Resaltar filas tabla ----------
function highlightUsedTableRows(usedKeys) {
  document.querySelectorAll('.tabla-transiciones tr.used').forEach(r => r.classList.remove('used'));
  const rows = document.querySelectorAll('#tabla-transiciones-display table.tabla-transiciones tbody tr');
  rows.forEach(tr => {
    const cells = tr.querySelectorAll('td');
    if (cells.length < 5) return;
    const est = cells[0].textContent.trim();
    const leido = cells[1].textContent.trim();
    const escrito = cells[2].textContent.trim();
    const mov = cells[3].textContent.trim();
    const nuevo = cells[4].textContent.trim();
    const key = `${est}|${leido}|${escrito}|${mov}|${nuevo}`;
    if (usedKeys.includes(key)) tr.classList.add('used');
  });
}

// ---------- Mostrar resultados (incluye transiciones aplicadas) ----------
function mostrarResultados(resultado, elementoId, titulo, esTeorico = false, usedKeys = []) {
  const cont = document.getElementById(elementoId);
  if (!cont) return;
  const { historialDI, cintaFinal, estadoFinal, pasosEjecutados } = resultado;
  let html = '';
  if (titulo) html += `<h4>${titulo}</h4>`;
  const seq = historialDI.map(di => {
    const m = di.match(/<span class="di-state">([^<]+)<\/span>/);
    return m ? m[1] : null;
  }).filter(s => s !== null);
  const seqStr = seq.join(' → ');
  if (!esTeorico) {
    if (seqStr) {
      html += `<p><strong>Secuencia de estados:</strong></p>`;
      html += `<div class="state-sequence-box" role="status" aria-live="polite">${seqStr}</div>`;
    }
    html += `<div class="septupla-box"><strong>Séptupla:</strong> M = (Q, Σ, Γ, δ, q<sub>0</sub>, B, q<sub>3</sub>)<br/>` +
            `<strong>Q:</strong> { q0, q1, q2, q3, q4, q5, q6, q7, q8 }<br/>` +
            `<strong>Σ:</strong> {0,1 } &nbsp;&nbsp; <strong>Γ:</strong> {0,1,X,Y,E,M,☐ }<br/>` +
            `<strong>q<sub>0</sub>:</strong> q0 &nbsp;&nbsp; <strong>B:</strong> ☐ &nbsp;&nbsp; <strong>q<sub>3</sub>:</strong> q3<br/>` +
            `<strong>Lenguaje:</strong> L(M) = { w - w | w ∈ {0,1}* }</div>`;
  }
  const cintaStr = cintaFinal.join('');
  const tieneE = cintaStr.includes('E');
  const tieneM = cintaStr.includes('M');
  if (!esTeorico) {
    if (estadoFinal === 'q3' && tieneE) html += `<p class="resultado-exito"><strong>✅ CADENA ACEPTADA:</strong> w1 = w2 (escrito 'E')</p>`;
    else if (estadoFinal === 'q3' && tieneM) html += `<p class="resultado-error"><strong>❌ CADENA RECHAZADA:</strong> w1 ≠ w2 (escrito 'M')</p>`;
    else html += `<p class="resultado-advertencia"><strong>⚠️ Detención:</strong> Estado ${estadoFinal} (pasos: ${pasosEjecutados})</p>`;
    html += `<p><strong>Cinta final (visual):</strong> <div class="tape-visual">${renderTapeVisual(cintaFinal)}</div></p>`;
  } else {
    html += `<p class="nota-teorica"><em>Traza automática (teórica)</em></p>`;
    html += `<p><strong>Cinta final (visual):</strong> <div class="tape-visual">${renderTapeVisual(cintaFinal)}</div></p>`;
  }

  if (usedKeys && usedKeys.length > 0) {
    html += '<h4>Transiciones aplicadas (función extendida)</h4>';
    html += '<ol class="transitions-box">';
    usedKeys.forEach((k, i) => {
      const txt = keyToTransitionText(k);
      html += `<li class="transition-step"><span class="mono">${i+1}.</span> ${txt}</li>`;
    });
    html += '</ol>';
  }

  html += '<h4>Descripciones instantáneas (DI)</h4><ol class="di-list">';
  historialDI.forEach(d => html += `<li class="di-step">${d}</li>`);
  html += '</ol>';
  cont.innerHTML = html;
}

// ---------- Helpers para keys ----------
function keyFromRow(row) {
  return `${row[0]}|${row[1]}|${row[2]}|${row[3]}|${row[4]}`;
}

// ---------- Canvas: nodos (tomados del XML JFLAP que enviaste) ----------
const graphNodes = {
  'q0': { x: 237, y: 127, r: 28 },
  'q1': { x: 415, y: 66, r: 26 },
  'q2': { x: 387, y: 307, r: 26 },
  'q3': { x: 317, y: 433, r: 36, final: true },
  'q4': { x: 716, y: 96, r: 26 },
  'q5': { x: 542, y: 197, r: 28 },
  'q6': { x: 669, y: 298, r: 26 },
  'q7': { x: 868, y: 391, r: 34 },
  'q8': { x: 151, y: 313, r: 30 }
};

// ---------- Canvas: construir aristas a partir de TablaExacta ----------
const graphEdges = []; // cada arista: {from,to,label,key}
(function buildEdgesFromTable(){
  const seen = new Set();
  TablaExacta.forEach(row => {
    const [est, leido, escrito, mov, nuevo] = row;
    // Homogenizar símbolos para key: 'ε' ya está en tabla para blancos
    const key = `${est}|${leido}|${escrito}|${mov}|${nuevo}`;
    // Para el label usamos leido:escrito,mov (más legible)
    let label = `${leido} : ${escrito}, ${mov}`;
    // evitar duplicados exactos
    if (!seen.has(key)) {
      seen.add(key);
      graphEdges.push({ from: est, to: nuevo, label, key });
    }
  });
})();

// ---------- Canvas drawing ----------
const canvas = document.getElementById('graphCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const CANVAS_PADDING = 30;
const EDGE_HIGHLIGHT_COLOR = '#ffbf00';
const NODE_HIGHLIGHT_FILL = '#fff3b8';

function clearCanvas() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,canvas.width, canvas.height);
}

function drawGraph(highlight = { node: null, edgeKey: null }) {
  if (!ctx) return;
  clearCanvas();
  // draw edges first
  graphEdges.forEach(e => {
    drawEdge(e, highlight.edgeKey === e.key);
  });
  // draw nodes after
  Object.keys(graphNodes).forEach(id => {
    drawNode(id, highlight.node === id);
  });
}

function drawNode(id, highlight=false) {
  const n = graphNodes[id];
  if (!n) return;
  ctx.beginPath();
  ctx.fillStyle = highlight ? NODE_HIGHLIGHT_FILL : '#fff7c7';
  ctx.strokeStyle = highlight ? EDGE_HIGHLIGHT_COLOR : '#333';
  ctx.lineWidth = highlight ? 3 : 1.4;
  ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
  ctx.fill();
  ctx.stroke();
  // inner double circle if final
  if (n.final) {
    ctx.beginPath();
    ctx.lineWidth = 1.4;
    ctx.arc(n.x, n.y, n.r - 8, 0, Math.PI*2);
    ctx.stroke();
  }
  // text
  ctx.fillStyle = '#222';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(id, n.x, n.y);
}

function drawEdge(e, highlight=false) {
  const a = graphNodes[e.from];
  const b = graphNodes[e.to];
  if (!a || !b) return;
  ctx.lineWidth = highlight ? 3 : 1.2;
  ctx.strokeStyle = highlight ? EDGE_HIGHLIGHT_COLOR : (e.key && e.key.includes('ε') && e.key.includes('E') ? '#0b9b57' : '#333');
  ctx.fillStyle = ctx.strokeStyle;
  // if self-loop
  if (e.from === e.to) {
    const cx = a.x + a.r + 8;
    const cy = a.y - a.r - 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI*2);
    ctx.stroke();
    // arrowhead
    drawArrowHeadOnLoop(cx, cy);
    // label
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(e.label, cx, cy - 28);
    return;
  }
  // otherwise draw quadratic curve with control point
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  // offset control to curve nicely (based on vector perpendicular)
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx*dx + dy*dy) || 1;
  const ux = -dy / len;
  const uy = dx / len;
  const offset = 40; // tune curvature
  const cx = mx + ux * offset;
  const cy = my + uy * offset;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.quadraticCurveTo(cx, cy, b.x, b.y);
  ctx.stroke();
  // arrowhead: compute point near target
  drawArrowOnQuadratic(a.x,a.y,cx,cy,b.x,b.y);
  // label at t=0.5
  const labelPos = quadraticPoint(a.x,a.y,cx,cy,b.x,b.y,0.5);
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(e.label, labelPos.x, labelPos.y - 8);
}

function quadraticPoint(x0,y0,xc,yc,x1,y1,t){
  // Q(t) = (1-t)^2 P0 + 2(1-t)t Pc + t^2 P1
  const x = (1-t)*(1-t)*x0 + 2*(1-t)*t*xc + t*t*x1;
  const y = (1-t)*(1-t)*y0 + 2*(1-t)*t*yc + t*t*y1;
  return {x,y};
}

function drawArrowHeadOnLoop(cx, cy) {
  // small arrow along loop — draw simple triangle
  ctx.beginPath();
  ctx.moveTo(cx+10, cy+6);
  ctx.lineTo(cx+2, cy-4);
  ctx.lineTo(cx-6, cy+6);
  ctx.closePath();
  ctx.fill();
}

function drawArrowOnQuadratic(x0,y0,xc,yc,x1,y1){
  // approximate direction at t=0.95
  const t = 0.92;
  const p = quadraticPoint(x0,y0,xc,yc,x1,y1,t);
  const q = quadraticPoint(x0,y0,xc,yc,x1,y1,t+0.01);
  const angle = Math.atan2(q.y - p.y, q.x - p.x);
  const size = 8;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.lineTo(-size, size/2);
  ctx.lineTo(-size, -size/2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------- Encontrar arista por key ----------
function findEdgeByKey(key) {
  return graphEdges.find(e => e.key === key);
}

// ---------- Animación de ejecución ----------
let animationTimer = null;
async function animateExecution(usedKeys, speedMs = 600) {
  // stop any previous
  if (!ctx) return;
  if (animationTimer) { clearInterval(animationTimer); animationTimer = null; }
  drawGraph({ node: null, edgeKey: null });
  for (let i=0;i<usedKeys.length;i++){
    const key = usedKeys[i];
    const edge = findEdgeByKey(key);
    // highlight edge and destination node
    const dest = edge ? edge.to : null;
    drawGraph({ node: dest, edgeKey: edge ? edge.key : null });
    // scroll results area to show current transition (optional)
    await sleep(speedMs);
  }
  // final: highlight final node q3 if reached
  drawGraph({ node: 'q3', edgeKey: null });
}

// sleep helper
function sleep(ms){ return new Promise(res => setTimeout(res, ms)); }

// ---------- Toggle image / canvas ----------
function initViewToggle() {
  const sel = document.getElementById('viewToggle');
  const canvasWrapper = document.getElementById('canvas-wrapper');
  const imageWrapper = document.getElementById('image-wrapper');
  sel.onchange = () => {
    if (sel.value === 'canvas') {
      canvasWrapper.style.display = 'block';
      imageWrapper.style.display = 'none';
      drawGraph({});
    } else {
      canvasWrapper.style.display = 'none';
      imageWrapper.style.display = 'block';
    }
  };
  // reset button
  const btnReset = document.getElementById('btnResetGraph');
  if (btnReset) btnReset.onclick = () => drawGraph({});
}

// ---------- Ejecutar MT (con animación) ----------
function ejecutarMT() {
  const raw = document.getElementById('cadenaInput').value.trim();
  if (!raw) { alert('Ingrese una cadena...'); return; }
  const { result, usedKeys } = simularConRegistro(raw);
  highlightUsedTableRows(usedKeys);
  mostrarResultados(result, 'resultados', `Simulación para "${raw}"`, false, usedKeys);
  // si la vista está en canvas, animar
  const view = document.getElementById('viewToggle').value;
  if (view === 'canvas') animateExecution(usedKeys, 550);
}

// ---------- Inicialización ----------
document.addEventListener('DOMContentLoaded', () => {
  mostrarTablaTransiciones();
  // event handlers
  const btn = document.getElementById('ejecutarBtn');
  if (btn) btn.onclick = ejecutarMT;
  initViewToggle();
  // dibujar por primera vez
  if (ctx) drawGraph({});
});
