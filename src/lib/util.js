// Small pure helpers shared by pages, the store scripts and the 3D engine.
export const money = n => '$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '');
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const escA = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rgb = hex => { const h = hex.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255); };
const toHex = a => '#' + a.map(v => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('');
export const lum = hex => { const [r, g, b] = rgb(hex); return r * 0.3 + g * 0.59 + b * 0.11; };
export const inkOn = hex => lum(hex) > 0.55 ? '#1a1d26' : '#ffffff';
// f < 0 darkens toward black, f > 0 lightens toward white
export const shade = (hex, f) => toHex(rgb(hex).map(v => f < 0 ? v * (1 + f) : v + (1 - v) * f));
