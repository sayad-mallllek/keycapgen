// Procedural sample prints, drawn on canvas in the browser (nothing loads from the network).
// Used as keycap skins in the customizer and as desk mat prints.
// Procedural sample skins (generated here, so nothing loads from the network)
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const SAMPLES = [
  ['sunset', 'Synth sunset', (g, W, H) => {
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#2b1055'); sky.addColorStop(0.55, '#d53a9d'); sky.addColorStop(1, '#ff9a5a');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const sr = H * 0.34, sx = W / 2, sy = H * 0.56, sun = g.createLinearGradient(0, sy - sr, 0, sy + sr);
    sun.addColorStop(0, '#ffe66d'); sun.addColorStop(1, '#ff4f8b'); g.fillStyle = sun; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fill();
    g.fillStyle = sky; for (let i = 0; i < 6; i++) g.fillRect(sx - sr - 2, sy + sr * 0.08 + i * sr * 0.16, 2 * sr + 4, 3 + i * 2.4);
    g.fillStyle = '#1a0b2e'; g.fillRect(0, H * 0.8, W, H * 0.2);
    g.strokeStyle = 'rgba(255,92,205,.85)'; g.lineWidth = 2;
    for (let i = 0; i < 7; i++) { const y = H * 0.8 + Math.pow(i / 6, 1.8) * H * 0.2; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(W / 2 + i * 14, H * 0.8); g.lineTo(W / 2 + i * 120, H); g.stroke(); }
  }],
  ['blueprint', 'Blueprint', (g, W, H) => {
    g.fillStyle = '#16407a'; g.fillRect(0, 0, W, H);
    for (let x = 0; x <= W; x += 24) { g.strokeStyle = x % 96 ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.26)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y <= H; y += 24) { g.strokeStyle = y % 96 ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.26)'; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(W * 0.3, H * 0.5, H * 0.3, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(W * 0.3, H * 0.5, H * 0.12, 0, Math.PI * 2); g.stroke();
    for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2; g.beginPath(); g.moveTo(W * 0.3 + Math.cos(t) * H * 0.3, H * 0.5 + Math.sin(t) * H * 0.3); g.lineTo(W * 0.3 + Math.cos(t) * H * 0.36, H * 0.5 + Math.sin(t) * H * 0.36); g.stroke(); }
    g.strokeRect(W * 0.56, H * 0.22, W * 0.32, H * 0.56); g.setLineDash([10, 8]); g.beginPath(); g.moveTo(W * 0.56, H * 0.5); g.lineTo(W * 0.88, H * 0.5); g.stroke(); g.setLineDash([]);
    g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '500 26px "IBM Plex Mono", monospace'; g.fillText('REV. A · 19.05 mm', W * 0.57, H * 0.88);
  }],
  ['marble', 'Marble', (g, W, H) => {
    const r = rng(11); g.fillStyle = '#f1eee9'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 80; i++) {
      const gold = i > 74;
      g.strokeStyle = gold ? 'rgba(196,154,72,.85)' : `rgba(${70 + r() * 40 | 0},${72 + r() * 40 | 0},${84 + r() * 40 | 0},${0.05 + r() * 0.2})`;
      g.lineWidth = gold ? 1.5 + r() * 2 : 0.6 + r() * 3; g.beginPath();
      let x = r() * W - 200, y = r() * H; g.moveTo(x, y);
      for (let j = 0; j < 5; j++) { const nx = x + 120 + r() * 220, ny = y + (r() - 0.5) * 160; g.bezierCurveTo(x + r() * 120, y + (r() - 0.5) * 120, nx - r() * 120, ny + (r() - 0.5) * 120, nx, ny); x = nx; y = ny; }
      g.stroke();
    }
  }],
  ['topo', 'Topo map', (g, W, H) => {
    const r = rng(5); g.fillStyle = '#24382f'; g.fillRect(0, 0, W, H);
    const centers = [0, 1, 2].map(() => ({ x: r() * W, y: r() * H, s: 7 + r() * 6, p: r() * 6, q: r() * 6 }));
    for (let lvl = 1; lvl < 34; lvl++) {
      g.strokeStyle = lvl % 5 ? 'rgba(214,236,200,.28)' : 'rgba(214,236,200,.8)'; g.lineWidth = lvl % 5 ? 1.2 : 2.2;
      centers.forEach(c => { g.beginPath(); for (let a = 0; a <= Math.PI * 2 + 0.06; a += 0.06) { const rad = lvl * c.s * (1 + 0.18 * Math.sin(a * 3 + c.p) + 0.1 * Math.sin(a * 5 + c.q)); const x = c.x + Math.cos(a) * rad * 1.5, y = c.y + Math.sin(a) * rad; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); });
    }
  }],
  ['confetti', 'Confetti', (g, W, H) => {
    const r = rng(3), cols = ['#ff5d73', '#ffb43a', '#2ec4b6', '#4361ee', '#8338ec', '#06d6a0'];
    g.fillStyle = '#fff6e9'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 460; i++) { g.fillStyle = cols[i % cols.length]; g.save(); g.translate(r() * W, r() * H); g.rotate(r() * Math.PI); if (r() < 0.55) g.fillRect(-7, -3, 12 + r() * 12, 6); else { g.beginPath(); g.arc(0, 0, 3 + r() * 5, 0, Math.PI * 2); g.fill(); } g.restore(); }
  }],
];

let cache = null;
// Returns { id: dataURL } for every sample, generated once per page session.
export function getSampleImages() {
  if (cache) return cache;
  cache = {};
  SAMPLES.forEach(([id, , draw]) => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    draw(c.getContext('2d'), 1024, 512);
    cache[id] = c.toDataURL('image/jpeg', 0.88);
  });
  return cache;
}
