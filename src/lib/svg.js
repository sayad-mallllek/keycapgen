// Product illustrations as inline SVG strings, generated from each configuration.
// Pure functions: Astro renders them at build time and the browser re-renders them live.
import { MODELS, COLORWAYS } from '../data/keyboards.js';
import { PRODUCTS, defaultsOf, variantOf, choiceOf } from '../data/products.js';
import { escA, lum, shade, inkOn } from './util.js';
let svgSeq = 0;

// Vector stand-ins for the printed patterns (the browser swaps in the full raster prints)
function printFallback(kind, x, y, w, h, id) {
  if (kind === 'sunset') return `<defs><linearGradient id="${id}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1055"/><stop offset=".6" stop-color="#d53a9d"/><stop offset="1" stop-color="#ff9a5a"/></linearGradient><linearGradient id="${id}u" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe66d"/><stop offset="1" stop-color="#ff4f8b"/></linearGradient></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}k)"/><circle cx="${x + w / 2}" cy="${y + h * 0.58}" r="${h * 0.32}" fill="url(#${id}u)"/><rect x="${x}" y="${y + h * 0.8}" width="${w}" height="${h * 0.2}" fill="#1a0b2e"/>`;
  if (kind === 'blueprint') return `<defs><pattern id="${id}p" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" stroke="#fff" stroke-opacity=".18"/></pattern></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#16407a"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}p)"/><circle cx="${x + w * 0.3}" cy="${y + h / 2}" r="${h * 0.3}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2"/>`;
  if (kind === 'marble') return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f1eee9"/><path d="M${x} ${y + h * 0.3} C${x + w * 0.3} ${y + h * 0.1} ${x + w * 0.5} ${y + h * 0.7} ${x + w} ${y + h * 0.45}" fill="none" stroke="#7d7f8a" stroke-opacity=".5" stroke-width="2"/><path d="M${x} ${y + h * 0.75} C${x + w * 0.4} ${y + h * 0.55} ${x + w * 0.6} ${y + h} ${x + w} ${y + h * 0.8}" fill="none" stroke="#c49a48" stroke-width="1.5"/>`;
  if (kind === 'topo') { let r = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#24382f"/>`; for (let i = 1; i < 9; i++) r += `<ellipse cx="${x + w * 0.62}" cy="${y + h * 0.55}" rx="${i * w * 0.06}" ry="${i * h * 0.08}" fill="none" stroke="#d6ecc8" stroke-opacity="${i % 3 ? 0.35 : 0.8}"/>`; return r; }
  if (kind === 'confetti') return `<defs><pattern id="${id}c" width="26" height="22" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="3" fill="#ff5d73"/><rect x="14" y="3" width="8" height="4" fill="#2ec4b6" transform="rotate(25 18 5)"/><circle cx="18" cy="16" r="2.5" fill="#4361ee"/><rect x="3" y="14" width="7" height="4" fill="#ffb43a"/></pattern></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff6e9"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}c)"/>`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#c7cdd8"/>`;
}

export function artSVG(p, cfg, printSrc = null) {
  const o = { ...defaultsOf(p), ...(cfg || {}) }, id = 'a' + (svgSeq++);
  // Fallback illustration, shown when a maker photo can't load: map the chosen variant onto the generic drawing
  const vc = variantOf(p, o);
  if (p.kind === 'mouse' || p.kind === 'mouse-ergo') { o.shell = o.buttons = o.side = vc.hex; o.finish = 'Matte'; }
  if (p.kind === 'mat') { const sz = p.felt ? choiceOf(p, 'size', o.size) : vc; o._dims = sz && sz.mm; o.print = 'solid'; o.color = p.felt ? vc.hex : '#0e0e0f'; o._stitch = 'transparent'; o.mono = ''; }
  if (p.kind === 'headset') { o.frame = o.accent = o.plates = vc.hex; o.cushion = 'Leatherette'; o.mic = false; }
  if (p.kind === 'stand') { o.color = vc.hex; o.base = 'steel'; }
  if (p.kind === 'cable') { o.sleeve = vc.hex; o.metal = '#bfc1c3'; o.aviator = true; o.length = '1.8 m'; }
  if (p.kind === 'case') { o.color = o.pull = '#2e2f31'; o.mono = ''; if (vc.mm) o._w = Math.round(360 * vc.mm[0] / 490); }
  const T = (x, y, txt, fill, size = 15) => txt ? `<text x="${x}" y="${y}" text-anchor="middle" font-family="Public Sans, system-ui, sans-serif" font-weight="700" font-size="${size}" fill="${fill}" opacity=".8">${escA(txt)}</text>` : '';
  const shadow = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.1}" fill="#000" opacity=".13"/>`;
  const shine = `<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${o.finish === 'Gloss' ? 0.5 : 0.2}"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>`;
  let body = '';
  if (p.kind === 'mouse' || p.kind === 'mouse-ergo') {
    const ergo = p.kind === 'mouse-ergo';
    const path = ergo ? 'M208 34 C270 30 302 88 304 152 C306 216 284 262 226 272 C172 280 118 262 110 198 C104 148 114 106 134 78 C152 52 178 36 208 34 Z'
      : 'M200 34 C262 34 288 92 288 156 C288 228 252 270 200 270 C148 270 112 228 112 156 C112 92 138 34 200 34 Z';
    const split = ergo ? 206 : 200;
    body = `<defs><clipPath id="${id}c"><path d="${path}"/></clipPath>${shine}
      <pattern id="${id}g" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.4" fill="#000" opacity=".4"/></pattern></defs>
      ${shadow(205, 282, 100)}<path d="${path}" fill="${o.shell}"/>
      <g clip-path="url(#${id}c)">
        <rect x="80" y="20" width="${split - 81}" height="118" fill="${o.buttons}"/><rect x="${split + 1}" y="20" width="${330 - split}" height="118" fill="${o.buttons}"/>
        <rect x="${split - 2}" y="20" width="4" height="118" fill="#000" opacity=".35"/><rect x="80" y="136" width="260" height="3" fill="#000" opacity=".22"/>
        ${ergo ? `<path d="M96 120 C 128 128 140 190 128 262 L 80 262 L 80 120 Z" fill="${o.side}"/>` : ''}
        ${o.grip ? `<rect x="100" y="150" width="34" height="120" fill="url(#${id}g)"/><rect x="266" y="150" width="34" height="120" fill="url(#${id}g)"/>` : ''}
        <rect width="400" height="300" fill="url(#${id}s)"/>
      </g>
      <rect x="${split - 8}" y="62" width="16" height="38" rx="8" fill="#1b1d23"/><rect x="${split - 4}" y="70" width="8" height="6" rx="2" fill="#6b6f78"/>
      ${T(split, 222, o.engrave, inkOn(o.shell))}`;
  } else if (p.kind === 'mat') {
    const dm = o._dims || { S: [450, 400], M: [800, 300], XL: [900, 400] }[o.size] || [800, 300];
    const sc = Math.min(350 / dm[0], 210 / dm[1]), w = dm[0] * sc, h = dm[1] * sc, x = 200 - w / 2, y = 140 - h / 2;
    const src = o.print === 'upload' ? o.printImg : o.print === 'solid' ? null : (printSrc ? printSrc(o.print) : null);
    const fill = src ? `<image href="${src}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>`
      : o.print === 'solid' || o.print === 'upload' ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${o.print === 'upload' ? '#c7cdd8' : o.color}"/>` + (o.print === 'upload' ? T(200, y + h / 2 + 5, 'Upload an image', '#535e7d', 14) : '')
      : printFallback(o.print, x, y, w, h, id);
    body = `<defs><clipPath id="${id}c"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/></clipPath></defs>
      <rect x="${x + 4}" y="${y + 8}" width="${w}" height="${h}" rx="12" fill="#000" opacity=".12"/>
      <g clip-path="url(#${id}c)">${fill}</g>
      <rect x="${x + 5}" y="${y + 5}" width="${w - 10}" height="${h - 10}" rx="8" fill="none" stroke="${o._stitch || o.stitch}" stroke-width="2.2" stroke-dasharray="5 4"/>
      ${T(200, y + h + 30, `${dm[0]} × ${dm[1]} mm`, '#535e7d', 13)}`;
  } else if (p.kind === 'headset') {
    const cush = shade(o.frame, -0.35);
    body = `<defs>${shine}</defs>${shadow(200, 276, 120)}
      <path d="M112 176 C108 62 292 62 288 176" fill="none" stroke="${o.frame}" stroke-width="20" stroke-linecap="round"/>
      <path d="M132 150 C138 92 262 92 268 150" fill="none" stroke="${cush}" stroke-width="11" stroke-linecap="round"/>
      <rect x="74" y="150" width="70" height="110" rx="32" fill="${o.frame}"/><rect x="256" y="150" width="70" height="110" rx="32" fill="${o.frame}"/>
      <rect x="132" y="160" width="22" height="90" rx="11" fill="${cush}"/><rect x="246" y="160" width="22" height="90" rx="11" fill="${cush}"/>
      <rect x="82" y="158" width="54" height="94" rx="26" fill="none" stroke="${o.accent}" stroke-width="4"/><rect x="264" y="158" width="54" height="94" rx="26" fill="none" stroke="${o.accent}" stroke-width="4"/>
      <rect x="74" y="150" width="70" height="110" rx="32" fill="url(#${id}s)"/><rect x="256" y="150" width="70" height="110" rx="32" fill="url(#${id}s)"/>
      ${o.mic ? `<path d="M96 246 C96 280 140 290 176 280" fill="none" stroke="#24262c" stroke-width="6" stroke-linecap="round"/><circle cx="180" cy="279" r="8" fill="#24262c"/>` : ''}`;
  } else if (p.kind === 'stand') {
    const base = o.base === 'steel' ? '#c4c6c8' : o.base === 'Walnut' ? '#7a4e2d' : shade(o.color, -0.25);
    body = `<defs>${shine}</defs>${shadow(200, 276, 110)}
      <ellipse cx="200" cy="258" rx="100" ry="20" fill="${shade(base, -0.25)}"/><ellipse cx="200" cy="250" rx="100" ry="20" fill="${base}"/>
      <rect x="191" y="70" width="18" height="182" rx="6" fill="${o.color}"/>
      <path d="M200 74 C200 40 258 36 270 64" fill="none" stroke="${o.color}" stroke-width="18" stroke-linecap="round"/>
      <path d="M254 52 C262 54 268 58 270 64" fill="none" stroke="#24262c" stroke-width="18" stroke-linecap="round" opacity=".55"/>
      <rect x="191" y="70" width="18" height="182" rx="6" fill="url(#${id}s)"/>
      ${T(200, 255, o.engrave, inkOn(base), 13)}`;
  } else if (p.kind === 'cable') {
    const loops = o.length === '1.8 m' ? 16 : 12, x0 = 124, step = 8;
    let coil = '';
    for (let i = 0; i < loops; i++) coil += `<ellipse cx="${x0 + i * step}" cy="150" rx="11" ry="26" fill="none" stroke="${shade(o.sleeve, i % 2 ? -0.18 : 0)}" stroke-width="6"/>`;
    const xe = x0 + (loops - 1) * step + 12, av = o.aviator;
    body = `${shadow(200, 230, 170)}
      <rect x="30" y="140" width="56" height="22" rx="7" fill="${o.metal}"/><rect x="18" y="145" width="14" height="12" rx="3" fill="#8d929c"/>
      <path d="M86 151 L${x0 - 10} 151" stroke="${o.sleeve}" stroke-width="7"/>${coil}
      <path d="M${xe} 151 L${av ? 262 : 330} 151" stroke="${o.sleeve}" stroke-width="7"/>
      ${av ? `<rect x="262" y="134" width="40" height="34" rx="7" fill="${o.metal}"/><rect x="274" y="134" width="3" height="34" fill="#000" opacity=".2"/><rect x="288" y="134" width="3" height="34" fill="#000" opacity=".2"/><path d="M302 151 L330 151" stroke="${o.sleeve}" stroke-width="7"/>` : ''}
      <rect x="330" y="140" width="50" height="22" rx="7" fill="${o.metal}"/><rect x="378" y="145" width="12" height="12" rx="3" fill="#8d929c"/>`;
  } else if (p.kind === 'case') {
    const w = o._w || { '60%': 250, '75%': 280, 'TKL': 320, 'Full': 360 }[o.size] || 280, h = 150, x = 200 - w / 2, y = 90;
    body = `<defs>${shine}</defs>${shadow(200, 262, w / 2 + 10)}
      <path d="M${200 - 34} ${y + 2} C${200 - 34} ${y - 30} ${200 + 34} ${y - 30} ${200 + 34} ${y + 2}" fill="none" stroke="${shade(o.color, -0.2)}" stroke-width="10" stroke-linecap="round"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="30" fill="${o.color}"/>
      <rect x="${x + 10}" y="${y + 10}" width="${w - 20}" height="${h - 20}" rx="22" fill="none" stroke="${shade(o.color, lum(o.color) > 0.5 ? -0.25 : 0.25)}" stroke-width="3" stroke-dasharray="3 3"/>
      <rect x="${x + w - 44}" y="${y + 4}" width="12" height="26" rx="5" fill="${o.pull}"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="30" fill="url(#${id}s)"/>
      ${T(200, y + h / 2 + 8, o.mono ? o.mono.toUpperCase() : '', inkOn(o.color), 24)}`;
  }
  return `<svg viewBox="0 0 400 300" role="img" aria-label="${escA(p.name)} preview">${body}</svg>`;
}
// Top-down keyboard illustration generated from the real layout data
export function boardSVG(mid, cwId) {
  const M = MODELS[mid], cw = COLORWAYS[cwId || M.editionIds[0]], C = M.case, ks = [];
  M.rows().forEach(row => { let x = 0; row.keys.forEach(d => {
    if (d.gap) { x += d.gap; return; } if (d.at !== undefined) { x = d.at; return; }
    const g = (d.code === 'Escape' || d.code === 'Enter' || d.code === 'NumpadEnter') ? 'accent' : (d.out !== undefined && d.code !== 'Tab' && !/^Numpad(Divide|Multiply|Subtract|Add)$/.test(d.code)) ? 'alpha' : 'mod';
    ks.push({ x, y: row.y, w: d.w, h: d.h || 1, g, label: d.label }); x += d.w; }); });
  const W = Math.max(...ks.map(k => k.x + k.w)), D = Math.max(...ks.map(k => k.y + k.h)), OW = W + 2 * C.m, OD = D + 2 * C.m + C.top;
  const plate = C.floating ? (cw.deck || shade(cw.case, -0.12)) : shade(cw.case, -0.55);
  let s = `<svg viewBox="${-C.m - 0.3} ${-C.m - C.top - 0.3} ${OW + 0.6} ${OD + 0.9}" role="img" aria-label="${escA(M.name)} layout">
    <rect x="${-C.m + 0.08}" y="${-C.m - C.top + 0.22}" width="${OW}" height="${OD}" rx="${C.radius + 0.1}" fill="#000" opacity=".14"/>
    <rect x="${-C.m}" y="${-C.m - C.top}" width="${OW}" height="${OD}" rx="${C.radius + 0.1}" fill="${cw.case}"/>
    ${C.floating ? '' : `<rect x="-0.12" y="-0.12" width="${W + 0.24}" height="${D + 0.24}" rx="0.15" fill="${plate}"/>`}`;
  ks.forEach(k => {
    const [cap, ink] = cw[k.g];
    s += `<rect x="${k.x + 0.05}" y="${k.y + 0.05}" width="${k.w - 0.1}" height="${k.h - 0.1}" rx="0.13" fill="${shade(cap, -0.18)}"/>`
      + `<rect x="${k.x + 0.13}" y="${k.y + 0.09}" width="${k.w - 0.26}" height="${k.h - 0.3}" rx="0.11" fill="${cap}"/>`;
    if (k.label && k.label.length === 1 && k.w === 1) s += `<text x="${k.x + 0.5}" y="${k.y + 0.55}" text-anchor="middle" font-family="Public Sans, sans-serif" font-size="0.32" font-weight="600" fill="${ink}" opacity=".85">${escA(k.label)}</text>`;
  });
  (M.extras || []).forEach(e => {
    if (e.type === 'knob') s += `<circle cx="${e.x}" cy="${e.y}" r="${e.r}" fill="${lum(cw.case) > 0.5 ? '#cfd1d6' : '#45474d'}" stroke="#000" stroke-opacity=".2" stroke-width="0.04"/>`;
    else if (e.type === 'oled') s += `<rect x="${e.x - e.w / 2}" y="${e.y - e.d / 2}" width="${e.w}" height="${e.d}" rx="0.06" fill="#050506"/><rect x="${e.x - e.w / 2 + 0.12}" y="${e.y - 0.06}" width="${e.w * 0.5}" height="0.08" fill="#f4f4f4"/>`;
    else if (e.type === 'button') s += `<circle cx="${e.x}" cy="${e.y}" r="${e.r}" fill="${lum(cw.case) > 0.5 ? '#bfc2c8' : '#55575d'}"/>`;
    else if (e.type === 'roller') s += `<rect x="${e.x - e.len / 2}" y="${e.y - e.r}" width="${e.len}" height="${e.r * 2}" rx="0.08" fill="${lum(cw.case) > 0.5 ? '#bfc2c8' : '#55575d'}"/>`;
  });
  return s + '</svg>';
}

