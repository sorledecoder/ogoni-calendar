const START = new Date(2026, 7, 28), END = new Date(2056, 7, 27);
const NAMES = ['Deemua', 'Deebom', 'Deezia', 'Deesor', 'Deekor'];
const COLORS = ['#f28a2e', '#7b4bd1', '#16a39a', '#d64f7d', '#5a8f2e'];
const $ = (id) => document.getElementById(id);
const day0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const key = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const diff = (a, b) => Math.round((Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) / 864e5);
const idx = (d) => ((diff(d, START) % 5) + 5) % 5;
const inRange = (d) => d >= START && d <= END;
const clampMonth = (d) => { const f = new Date(d.getFullYear(), d.getMonth(), 1); const lo = new Date(2026, 7, 1), hi = new Date(2056, 7, 1); return f < lo ? lo : f > hi ? hi : f; };
const fmt = (d, o) => d.toLocaleDateString(undefined, o);

let current = clampMonth(new Date()), filter = -1, selected = null, notes = {};
try { notes = JSON.parse(localStorage.getItem('ogoni-notes') || '{}'); } catch (e) {}
const saveNotes = () => { try { localStorage.setItem('ogoni-notes', JSON.stringify(notes)); } catch (e) {} };

window.toast = (m, ms = 3000) => { const t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), ms); };

function setup() {
  const s = $('month');
  for (let d = new Date(2026, 7, 1); d <= new Date(2056, 7, 1); d.setMonth(d.getMonth() + 1)) {
    const o = document.createElement('option');
    o.value = d.getFullYear() + '-' + d.getMonth();
    o.textContent = fmt(d, { month: 'long', year: 'numeric' });
    s.appendChild(o);
  }
  $('legend').innerHTML = NAMES.map((n, i) => `<button class="chip" style="--c:${COLORS[i]}" data-i="${i}" aria-pressed="false">${n}</button>`).join('');
  $('legend').onclick = (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    const i = +b.dataset.i; filter = filter === i ? -1 : i;
    document.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(+c.dataset.i === filter)));
    render();
  };
  $('prev').onclick = () => move(-1); $('next').onclick = () => move(1);
  $('month').onchange = () => { const [y, m] = $('month').value.split('-').map(Number); current = new Date(y, m, 1); render(); };
  $('todayBtn').onclick = goToday;
  $('jump').min = key(START); $('jump').max = key(END);
  $('jump').onchange = (e) => { if (!e.target.value) return; const [y, m, d] = e.target.value.split('-').map(Number); current = new Date(y, m - 1, 1); render(); openSheet(new Date(y, m - 1, d)); };
  $('sheetClose').onclick = closeSheet;
  $('sheet').onclick = (e) => { if (e.target.id === 'sheet') closeSheet(); };
  $('sSave').onclick = () => { const k = key(selected), v = $('sNote').value.trim(); if (v) notes[k] = v; else delete notes[k]; saveNotes(); closeSheet(); render(); toast(v ? 'Note saved' : 'Note removed'); };
  $('days').onclick = (e) => { const c = e.target.closest('.day[data-d]'); if (c) { const [y, m, d] = c.dataset.d.split('-').map(Number); openSheet(new Date(y, m - 1, d)); } };

  let x0 = null;
  const cal = document.querySelector('.calendar');
  cal.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  cal.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 60) move(dx < 0 ? 1 : -1); x0 = null; });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); if ($('sheet').hidden && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) { if (e.key === 'ArrowLeft') move(-1); if (e.key === 'ArrowRight') move(1); } });
  const net = () => { $('status').textContent = navigator.onLine ? 'Offline ready' : 'You are offline. The calendar still works.'; };
  addEventListener('online', net); addEventListener('offline', net); net();
}

function move(x) { const n = new Date(current.getFullYear(), current.getMonth() + x, 1); if (n >= new Date(2026, 7, 1) && n <= new Date(2056, 7, 1)) { current = n; render(); } }
function goToday() { current = clampMonth(new Date()); render(); }

function hero() {
  const t = day0(new Date());
  if (!inRange(t)) {
    $('heroNative').textContent = t < START ? 'Starts 28 Aug 2026' : 'Ended 27 Aug 2056';
    $('heroDate').textContent = fmt(t, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('heroNext').textContent = 'The calendar covers 28 Aug 2026 to 27 Aug 2056.'; return;
  }
  const i = idx(t);
  $('heroNative').textContent = NAMES[i];
  document.querySelector('.hero').style.setProperty('--hc', COLORS[i]);
  $('heroDate').textContent = fmt(t, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  $('heroNext').textContent = 'Tomorrow is ' + NAMES[(i + 1) % 5] + '. Next ' + NAMES[0] + ' in ' + (((5 - i) % 5) || 5) + (((5 - i) % 5) === 1 ? ' day.' : ' days.');
}

function render() {
  hero();
  $('title').textContent = fmt(current, { month: 'long', year: 'numeric' });
  const g = $('days'); g.innerHTML = '';
  const off = current.getDay(), total = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate(), now = day0(new Date());
  let h = '';
  for (let i = 0; i < off; i++) h += '<div class="day empty"></div>';
  for (let n = 1; n <= total; n++) {
    const d = new Date(current.getFullYear(), current.getMonth(), n);
    if (!inRange(d)) { h += '<div class="day empty out"></div>'; continue; }
    const i = idx(d), k = key(d);
    const cls = ['day', d.getTime() === now.getTime() ? 'today' : '', notes[k] ? 'has-note' : '', filter >= 0 && filter !== i ? 'dim' : ''].join(' ');
    h += `<div class="${cls}" style="--c:${COLORS[i]}" data-d="${k}" role="button" tabindex="0" aria-label="${fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })}, ${NAMES[i]}"><div class="num">${n}</div><div class="native">${NAMES[i]}</div></div>`;
  }
  g.innerHTML = h;
  $('month').value = current.getFullYear() + '-' + current.getMonth();
}

function openSheet(d) {
  if (!inRange(d)) { toast('That date is outside the 30-year range'); return; }
  selected = d; const i = idx(d), t = day0(new Date()), dd = diff(d, t);
  $('sheet').querySelector('.sheet-card').style.setProperty('--c', COLORS[i]);
  $('sTitle').textContent = NAMES[i];
  $('sSub').textContent = fmt(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + (dd === 0 ? ' · Today' : dd > 0 ? ` · In ${dd} day${dd > 1 ? 's' : ''}` : ` · ${-dd} day${dd < -1 ? 's' : ''} ago`);
  $('sNote').value = notes[key(d)] || '';
  $('sheet').hidden = false; $('sNote').focus();
}
function closeSheet() { $('sheet').hidden = true; }

// Auto date: refresh at midnight, on focus, and every minute
let lastDay = key(new Date());
function auto() { const k = key(new Date()); if (k !== lastDay) { lastDay = k; goToday(); } else hero(); }
setInterval(auto, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) auto(); });

setup();
if (new URLSearchParams(location.search).get('go') === 'today') goToday(); else render();
