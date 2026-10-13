// Procedural 3D models of the real accessories, built in three.js from their published dimensions.
// Units are centimeters. Each builder returns a THREE.Group for a product and its configuration.
// Also exports a product-page viewer and a thumbnail renderer used for cards and the cart.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getSampleImages } from '../lib/samples.js';
import { choiceOf } from '../data/products.js';

THREE.ColorManagement.enabled = false;   // same convention as the keyboard engine: hex colors converted by hand
const lin = hex => new THREE.Color(hex).convertSRGBToLinear();
const mat = (hex, rough = 0.55, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color: lin(hex), roughness: rough, metalness: metal, ...extra });
const shadeHex = (hex, f) => { const c = new THREE.Color(hex); c.lerp(new THREE.Color(f < 0 ? 0 : 0xffffff), Math.abs(f)); return '#' + c.getHexString(); };
const lum = hex => { const c = new THREE.Color(hex); return c.r * 0.3 + c.g * 0.59 + c.b * 0.11; };
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
// Smooth interpolation through [s, value] control points
const prof = pts => s => {
  if (s <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (s <= pts[i][0]) {
    const [s0, v0] = pts[i - 1], [s1, v1] = pts[i], t = (s - s0) / (s1 - s0), k = (1 - Math.cos(Math.PI * t)) / 2;
    return v0 + (v1 - v0) * k;
  }
  return pts[pts.length - 1][1];
};
function rrPath(p, w, d, r, cx = 0, cy = 0) {
  const x = cx - w / 2, y = cy - d / 2; r = Math.min(r, w / 2 - 0.001, d / 2 - 0.001);
  p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + d - r); p.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  p.lineTo(x + r, y + d); p.quadraticCurveTo(x, y + d, x, y + d - r); p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y);
  return p;
}
const rr = (w, d, r, cx, cy) => rrPath(new THREE.Shape(), w, d, r, cx, cy);
function smooth(g) {
  const pos = g.attributes.position, idx = g.index, uv = g.attributes.uv;
  const n = idx ? idx.count : pos.count, map = new Map(), verts = [], uvs = [], out = [];
  for (let i = 0; i < n; i++) {
    const v = idx ? idx.getX(i) : i, x = pos.getX(v), y = pos.getY(v), z = pos.getZ(v);
    const key = Math.round(x * 1e4) + ',' + Math.round(y * 1e4) + ',' + Math.round(z * 1e4);
    let j = map.get(key);
    if (j === undefined) { j = verts.length / 3; verts.push(x, y, z); if (uv) uvs.push(uv.getX(v), uv.getY(v)); map.set(key, j); }
    out.push(j);
  }
  const ng = new THREE.BufferGeometry();
  ng.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  if (uv) ng.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  ng.setIndex(out); ng.computeVertexNormals(); return ng;
}
// Rounded slab lying flat: footprint w (x) by d (z), thickness h, from y = 0 up
function slab(w, d, h, r, bevel = 0.05, curve = 8) {
  const b = Math.min(bevel, h / 2.2);
  const g = new THREE.ExtrudeGeometry(rr(w - 2 * b, d - 2 * b, Math.max(0.01, r - b)), { depth: Math.max(0.001, h - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: curve });
  g.rotateX(-Math.PI / 2); g.translate(0, b, 0);
  return g;
}
const knurled = (r, h, segs = 48, depth = 0.04) => {
  const g = new THREE.CylinderGeometry(r, r, h, segs, 1);
  const p = g.attributes.position, step = Math.PI * 2 / segs;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z); if (d > r * 0.97) { const k = Math.round(Math.atan2(z, x) / step) % 2 ? 1 : 1 - depth / r; p.setX(i, x * k); p.setZ(i, z * k); } }
  g.computeVertexNormals(); return g;
};
// A flat text label (engraving, monogram) as a transparent decal plane
function decal(text, wCm, hCm, color, font = '700', opacity = 0.85) {
  const W = 512, H = Math.max(64, Math.round(512 * hCm / wCm));
  const tex = canvasTex(W, H, (g) => {
    g.fillStyle = color; g.globalAlpha = opacity; g.textAlign = 'center'; g.textBaseline = 'middle';
    let px = H * 0.62; g.font = `${font} ${px}px "Public Sans", system-ui, sans-serif`;
    const m = g.measureText(text).width; if (m > W * 0.92) { px *= W * 0.92 / m; g.font = `${font} ${px}px "Public Sans", system-ui, sans-serif`; }
    g.fillText(text, W / 2, H / 2 + px * 0.04);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(wCm, hCm), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
  return m;
}
const noiseFill = (g, w, h, base, amount, n, size, seed = 1) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  let s = seed; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${amount * r()})` : `rgba(255,255,255,${amount * r() * 0.7})`; g.fillRect(r() * w, r() * h, size * (0.5 + r()), size * (0.5 + r())); }
};

/* ================= Mice ================= */
const MICE = {
  superlight2: { L: 12.5, W: 6.35, H: 4.0, n: 2.5, lean: 0,
    wl: [[0, .9], [.25, 1], [.5, .93], [.78, 1], [1, .9]], wr: [[0, .9], [.25, 1], [.5, .93], [.78, 1], [1, .9]],
    h: [[0, .5], [.2, .78], [.58, 1], [.85, .86], [1, .55]], btn: .4, side: [[.33, .45], [.47, .59]], wheel: { s: .2, r: .9, w: .62, hub: '#e8e8e8' }, feet: 'superlight' },
  deathadder: { L: 12.8, W: 6.8, H: 4.4, n: 2.6, lean: .22, conc: .1,
    wl: [[0, .95], [.18, 1], [.5, .86], [.78, .88], [1, .74]], wr: [[0, .92], [.25, 1], [.55, 1.02], [.8, .94], [1, .72]],
    h: [[0, .46], [.22, .78], [.53, 1], [.82, .84], [1, .48]], btn: .38, side: [[.31, .43], [.45, .57]], wheel: { s: .19, r: .9, w: .66, hub: '#2a2a2a' }, feet: 'deathadder' },
  mxmaster: { L: 12.8, W: 7.0, H: 5.08, n: 2.8, lean: .3, flare: { s0: .28, s1: .98, amount: 1.7, top: .34 },
    wl: [[0, .82], [.2, .95], [.5, .98], [.8, .95], [1, .8]], wr: [[0, .84], [.25, 1], [.55, 1.03], [.8, .96], [1, .78]],
    h: [[0, .4], [.25, .7], [.62, 1], [.88, .82], [1, .46]], btn: .4, side: [[.44, .52], [.53, .61]], wheel: { s: .2, r: .95, w: .75, steel: true }, feet: 'mx', thumbWheel: true },
};
function mouseShape(P) {
  const WL = prof(P.wl), WR = prof(P.wr), HP = prof(P.h);
  const flareAt = s => { if (!P.flare) return 0; const { s0, s1, amount } = P.flare; if (s < s0 || s > s1) return 0; const t = (s - s0) / (s1 - s0); return amount * Math.sin(Math.PI * Math.min(1, t * 1.25)) ** 0.8; };
  // s: 0 front -> 1 back; t: 0 (right base) -> PI (left base) over the top
  return (s, t) => {
    const e = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * s - 1), 4)), 1 / 4);
    const right = t < Math.PI / 2, c = Math.cos(t), sn = Math.max(0, Math.sin(t));
    const hw = (right ? WR(s) : WL(s)) * (P.W / 2) * e, hh = HP(s) * P.H * Math.pow(e, 0.45);
    let x = Math.sign(c) * Math.pow(Math.abs(c), 2 / P.n) * hw;
    const y = Math.pow(sn, 2 / P.n) * hh;
    const yr = hh > 0 ? y / hh : 0;
    x += (P.lean || 0) * (P.W / 2) * e * Math.pow(yr, 1.6) * 0.5;
    if (!right && P.conc && s > .3 && s < .8) x += P.conc * hw * Math.sin(Math.PI * yr) * Math.sin(Math.PI * (s - .3) / .5);
    if (!right && P.flare) { const top = P.flare.top * P.H; if (y < top) x -= flareAt(s) * e * Math.pow(1 - y / top, 1.6); }
    return [x, y, (s - 0.5) * P.L];
  };
}
function buildMouse(p, o) {
  const P = MICE[p.model], F = mouseShape(P), G = new THREE.Group();
  const NS = 120, NT = 73, S = i => 0.5 - 0.5 * Math.cos(Math.PI * i / NS), T = j => Math.PI * j / (NT - 1);
  const pos = [], uv = [], groups = [[], [], []];   // shell, buttons, groove
  for (let i = 0; i <= NS; i++) for (let j = 0; j < NT; j++) { const [x, y, z] = F(S(i), T(j)); pos.push(x, y, z); uv.push(S(i), T(j) / Math.PI); }
  const id = (i, j) => i * NT + j, slotHalf = P.wheel.w / 2 / (P.W / 2) * 0.62;
  for (let i = 0; i < NS; i++) for (let j = 0; j < NT - 1; j++) {
    const s0 = S(i), s1 = S(i + 1), t0 = T(j), t1 = T(j + 1), sm = (s0 + s1) / 2, tm = (t0 + t1) / 2, cm = Math.abs(Math.cos(tm));
    const inB = sm < P.btn && cm < .8;
    let g = inB ? 1 : 0;
    const straddle = (a, b, v) => a <= v && b > v;
    if ((straddle(s0, s1, P.btn) && cm < .8) || (sm < P.btn && straddle(t0, t1, Math.PI / 2)) || (sm < P.btn && (straddle(Math.abs(Math.cos(t1)), Math.abs(Math.cos(t0)), .8) || straddle(Math.abs(Math.cos(t0)), Math.abs(Math.cos(t1)), .8)))) g = 2;
    if (Math.abs(sm - P.wheel.s) < 0.075 && Math.abs(tm - Math.PI / 2) < slotHalf) g = 2;
    if (P.thumbWheel && sm > .38 && sm < .5 && tm > Math.PI * .7 && tm < Math.PI * .8) g = 2;
    const a = id(i, j), b = id(i + 1, j), c = id(i + 1, j + 1), d = id(i, j + 1);
    groups[g].push(a, d, b, b, d, c);  // counter-clockwise seen from outside
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const index = [...groups[0], ...groups[1], ...groups[2]]; geo.setIndex(index);
  geo.addGroup(0, groups[0].length, 0); geo.addGroup(groups[0].length, groups[1].length, 1); geo.addGroup(groups[0].length + groups[1].length, groups[2].length, 2);
  geo.computeVertexNormals();
  const rough = o.finish === 'Gloss' ? 0.22 : 0.62;
  // Shell texture: base color, grip tape, thumb rest color, haptic pad, engraving (u = front→back, v = right→left)
  const shellTex = canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = o.shell; g.fillRect(0, 0, w, h);
    if (o.thumb && o.thumb !== o.shell) { const gr = g.createLinearGradient(0, 0, 0, h * 0.15); gr.addColorStop(0, o.thumb); gr.addColorStop(0.8, o.thumb); gr.addColorStop(1, o.shell); g.fillStyle = gr; g.fillRect(w * .3, 0, w * .7, h * .15); }
    if (P.thumbWheel) { g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(w * .62, h * .09, w * .07, h * .035, 0, 0, Math.PI * 2); g.fill(); }
    if (o.grip) [[.03, .2], [.8, .97]].forEach(([v0, v1]) => {
      const y0 = (1 - v1) * h, y1 = (1 - v0) * h; g.fillStyle = 'rgba(12,12,14,.92)'; g.beginPath(); g.roundRect(w * .43, y0, w * .37, y1 - y0, 18); g.fill();
      g.fillStyle = 'rgba(255,255,255,.07)'; for (let x = w * .44; x < w * .79; x += 9) for (let y = y0 + 4; y < y1 - 4; y += 9) g.fillRect(x, y, 3, 3);
    });
    if (o.engrave && o.engrave.trim()) {
      g.save(); g.translate(w * .72, h * .5); g.rotate(-Math.PI / 2); g.scale(1, 1);
      g.fillStyle = lum(o.shell) > 0.55 ? 'rgba(20,22,28,.75)' : 'rgba(255,255,255,.78)';
      g.textAlign = 'center'; g.textBaseline = 'middle'; let px = 64; g.font = `800 ${px}px "Public Sans", system-ui, sans-serif`;
      const m = g.measureText(o.engrave).width; if (m > h * .26) { px *= h * .26 / m; g.font = `800 ${px}px "Public Sans", system-ui, sans-serif`; }
      g.scale(-1, 1); g.fillText(o.engrave.trim(), 0, 0); g.restore();
    }
  });
  const shellMat = new THREE.MeshStandardMaterial({ map: shellTex, roughness: rough, metalness: 0 });
  const mesh = new THREE.Mesh(geo, [shellMat, mat(o.buttons || o.shell, rough), mat('#0b0b0d', .7)]);
  mesh.castShadow = true; mesh.receiveShadow = true; G.add(mesh);
  // Underside with PTFE feet and sensor
  const outline = [];
  for (let i = 0; i <= NS; i++) { const [x, , z] = F(S(i), 0); outline.push([x, z]); }
  for (let i = NS; i >= 0; i--) { const [x, , z] = F(S(i), Math.PI); outline.push([x, z]); }
  const shp = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, z)));
  const bg = new THREE.ShapeGeometry(shp, 1); bg.rotateX(Math.PI / 2);
  const bb = new THREE.Box3().setFromBufferAttribute(bg.attributes.position);
  const bw = bb.max.x - bb.min.x, bl = bb.max.z - bb.min.z;
  const feetTex = canvasTex(256, Math.round(256 * bl / bw), (g, w, h) => {
    g.fillStyle = shadeHex(o.shell, -0.25); g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8e5dd';
    const rect = (x, y, rw, rh, r) => { g.beginPath(); g.roundRect(x * w, y * h, rw * w, rh * h, r); g.fill(); };
    if (P.feet === 'mx') { [[.15, .1], [.75, .1], [.12, .82], [.78, .82]].forEach(([x, y]) => rect(x, y, .12, .08, 6)); }
    else if (P.feet === 'deathadder') { rect(.2, .04, .6, .14, 14); rect(.22, .82, .56, .12, 14); }
    else { rect(.12, .04, .76, .26, 22); g.lineWidth = 8; g.strokeStyle = '#e8e5dd'; g.beginPath(); g.moveTo(w * .14, h * .7); g.lineTo(w * .14, h * .9); g.lineTo(w * .86, h * .9); g.lineTo(w * .86, h * .7); g.stroke(); g.fillStyle = '#3a3b40'; g.beginPath(); g.arc(w * .5, h * .78, w * .1, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = '#e8e5dd'; g.lineWidth = 6; g.beginPath(); g.ellipse(w * .5, h * .5, w * .13, h * .06, 0, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#111'; g.beginPath(); g.arc(w * .5, h * .5, w * .035, 0, Math.PI * 2); g.fill();
  });
  // ShapeGeometry UVs are the shape coordinates: remap them onto the texture
  const uvA = bg.attributes.uv, pA = bg.attributes.position;
  for (let i = 0; i < uvA.count; i++) uvA.setXY(i, (pA.getX(i) - bb.min.x) / bw, 1 - (pA.getZ(i) - bb.min.z) / bl);
  const bottom = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ map: feetTex, roughness: .5 })); bottom.position.y = 0.001; G.add(bottom);
  // Scroll wheel in its slot
  const top = F(P.wheel.s, Math.PI / 2), wr = P.wheel.r;
  const wheel = new THREE.Group();
  const tire = new THREE.Mesh(knurled(wr, P.wheel.w, 40, 0.035), P.wheel.steel ? mat(choiceOf(p, 'wheel', o.wheel)?.color || '#b9bcc1', .28, .85) : mat('#18181a', .85));
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(wr * .72, wr * .72, P.wheel.w + .04, 32), P.wheel.steel ? mat('#2a2b2e', .4, .5) : mat(P.wheel.hub, .5));
  wheel.add(tire, hub); wheel.rotation.z = Math.PI / 2; wheel.position.set(top[0], top[1] - wr * .62, top[2]);
  wheel.traverse(m => { if (m.isMesh) m.castShadow = true; }); G.add(wheel);
  if (P.wheel.steel) { const mode = new THREE.Mesh(slab(.55, .7, .2, .2), mat(o.shell, rough)); const q = F(P.wheel.s + .1, Math.PI / 2); mode.position.set(q[0], q[1] - .12, q[2]); G.add(mode); }  // mode-shift button
  // Side buttons on the left flank, oriented to the surface
  const onSide = (s, yFrac) => {
    let t = Math.PI; for (let k = 0; k < 200; k++) { const pt = F(s, t); if (pt[1] >= yFrac * P.H) break; t -= Math.PI / 400; }
    const pt = new THREE.Vector3(...F(s, t)), a = new THREE.Vector3(...F(s + .01, t)), b = new THREE.Vector3(...F(s, t - .02));
    const n = new THREE.Vector3().crossVectors(a.sub(pt), b.sub(pt)).normalize(); if (n.x > 0) n.negate();
    return { pt, n };
  };
  P.side.forEach(([s0, s1]) => {
    const { pt, n } = onSide((s0 + s1) / 2, P.flare ? .5 : .56), len = (s1 - s0) * P.L;
    const btn = new THREE.Mesh(new THREE.BoxGeometry(.22, .62, len * .92, 1, 1, 1), mat(o.buttons || o.shell, rough));
    btn.position.copy(pt).addScaledVector(n, .04); btn.castShadow = true;
    btn.quaternion.setFromUnitVectors(new THREE.Vector3(-1, 0, 0), n);
    G.add(btn);
  });
  if (P.thumbWheel) {
    const { pt, n } = onSide(.44, .46);
    const tw = new THREE.Mesh(knurled(.62, .42, 36, .03), mat('#2c2d31', .5, .3));
    tw.position.copy(pt).addScaledVector(n, -.1); tw.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.25, 1, 0).normalize()); tw.castShadow = true; G.add(tw);
  }
  return G;
}

/* ================= Desk mats ================= */
const imgCache = new Map();
function loadImage(src) {
  if (!src) return Promise.resolve(null);
  if (imgCache.has(src)) return imgCache.get(src);
  const pr = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  imgCache.set(src, pr); return pr;
}
const printSrc = o => o.print === 'upload' ? o.printImg : o.print && o.print !== 'solid' ? getSampleImages()[o.print] : null;
function buildMat(p, o, imgs) {
  const G = new THREE.Group(), felt = p.model === 'felt';
  const mm = (choiceOf(p, 'size', o.size) || {}).mm || [900, 400, 4];
  const w = mm[0] / 10, d = mm[1] / 10, h = mm[2] / 10;
  const geo = slab(w, d, h, felt ? 0.12 : 1.2, felt ? 0.03 : 0.08, 10);
  // Cap UVs are shape coordinates: map them onto the print
  const uvA = geo.attributes.uv, pA = geo.attributes.position;
  for (let i = 0; i < uvA.count; i++) uvA.setXY(i, pA.getX(i) / w + 0.5, -pA.getZ(i) / d + 0.5);
  const TW = 2048, TH = Math.max(64, Math.round(2048 * d / w)), img = imgs.print;
  const top = canvasTex(TW, TH, (g, W, H) => {
    if (felt) { noiseFill(g, W, H, o.felt, 0.16, 26000, 3, 7); return; }
    if (img) { const sc = Math.max(W / img.naturalWidth, H / img.naturalHeight), sw = W / sc, sh = H / sc; g.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, W, H); }
    else { g.fillStyle = o.color || '#0e0e0f'; g.fillRect(0, 0, W, H); }
    g.globalAlpha = 0.07; noiseFill(g, W, H, 'rgba(0,0,0,0)', 1, 30000, 2, 3); g.globalAlpha = 1;
  });
  const side = felt ? mat(shadeHex(o.felt, -0.15), .95) : mat('#151517', .9);
  const m = new THREE.Mesh(geo, [new THREE.MeshStandardMaterial({ map: top, roughness: felt ? .98 : .82 }), side]);
  m.receiveShadow = true; G.add(m);
  if (!felt && o.stitch) {
    const pts = [], r = 1.05, ww = w - .5, dd = d - .5, N = 220;
    const perim = new THREE.Shape(); rrPath(perim, ww, dd, r);
    perim.getSpacedPoints(N).forEach(v => pts.push(new THREE.Vector3(v.x, h - .02, -v.y)));
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const len = curve.getLength();
    const tex = canvasTex(64, 16, (g, W, H) => { g.clearRect(0, 0, W, H); g.fillStyle = o.stitchColor; g.fillRect(0, 0, W * .62, H); }, [len / 0.5, 1]);
    G.add(new THREE.Mesh(new THREE.TubeGeometry(curve, N * 2, 0.09, 6, true), new THREE.MeshStandardMaterial({ map: tex, roughness: .8, alphaTest: .5 })));
  }
  if (felt) {
    const tagC = (choiceOf(p, 'tag', o.tag) || {}).color || '#b0794a';
    const tag = new THREE.Mesh(slab(2.2, 3.4, .16, .25, .04), mat(tagC, .7));
    tag.position.set(w / 2 - 1.3, h - .02, d / 2 - 4); tag.castShadow = true; G.add(tag);
    if (o.mono && o.mono.trim()) { const dc = decal(o.mono.trim().toUpperCase(), 1.8, 1.0, lum(tagC) > .4 ? '#3b2414' : '#d9c8b4', '800', .7); dc.rotation.x = -Math.PI / 2; dc.rotation.z = Math.PI / 2; dc.position.set(w / 2 - 1.3, h + .15, d / 2 - 4); G.add(dc); }
  }
  return G;
}

/* ================= Headsets ================= */
function bandGeo(R, Ry, y0, th, width, t0 = 0.02, t1 = 0.98) {
  const pts = []; for (let i = 0; i <= 40; i++) { const a = Math.PI * (t0 + (t1 - t0) * i / 40); pts.push(new THREE.Vector3(R * Math.cos(a), y0 + Ry * Math.sin(a), 0)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  const sh = rr(th, width, Math.min(th, width) * 0.45);
  return new THREE.ExtrudeGeometry(sh, { steps: 80, bevelEnabled: false, extrudePath: curve });
}
function buildHeadset(p, o) {
  const G = new THREE.Group(), arctis = p.model === 'arctis';
  const frame = o.frame, plateC = o.plates || frame, cushC = (choiceOf(p, 'cushion', o.cushion) || {}).color || '#26272b';
  const rough = .5, frameMat = mat(frame, rough), metalDark = mat(arctis ? shadeHex(frame, -0.1) : '#9a9ca2', .35, .8);
  const ry = arctis ? 4.9 : 4.55, rz = arctis ? 3.9 : 4.55, depth = arctis ? 3.3 : 3.0, cupX = 8.6, cupY = 6.2;
  const cup = (side) => {
    const g = new THREE.Group(), prof = [];
    const r = 1; [[0.001, 0], [r - .16, 0], [r - .05, -.06], [r, -.22], [r, -.78], [r - .06, -.94], [r - .2, -1], [0.001, -1]].forEach(([a, b]) => prof.push(new THREE.Vector2(a, b)));
    const shell = new THREE.Mesh(new THREE.LatheGeometry(prof, 56), frameMat);
    shell.scale.set(ry, depth, rz); shell.castShadow = true; g.add(shell);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .22, 56), arctis ? mat(plateC, .45) : mat(plateC, .3, .75));
    plate.scale.set(ry * (arctis ? .86 : .64), 1, rz * (arctis ? .86 : .64)); plate.position.y = .06; plate.castShadow = true; g.add(plate);
    if (!arctis) { const ring = new THREE.Mesh(new THREE.TorusGeometry(1, .04, 8, 56), mat(shadeHex(plateC, -0.3), .35, .7)); ring.rotation.x = Math.PI / 2; ring.scale.set(ry * .66, rz * .66, 1); ring.position.y = .16; g.add(ring); }
    const cush = new THREE.Mesh(new THREE.TorusGeometry(1, .34, 18, 56), mat(cushC, o.cushion === 'Velour' || o.cushion === 'Fabric' ? .95 : .6));
    cush.rotation.x = Math.PI / 2; cush.scale.set(ry * .8, rz * .8, 1.25); cush.position.y = -depth - .28; cush.castShadow = true; g.add(cush);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat('#16161a', .9)); inner.rotation.x = Math.PI / 2; inner.scale.set(ry * .62, rz * .62, 1); inner.position.y = -depth - .05; g.add(inner);
    // the cup's axis (local +y) points outward along x
    g.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    g.position.set(side * cupX, cupY, 0);
    return g;
  };
  G.add(cup(-1), cup(1));
  const innerX = cupX - depth / 2, topY = cupY + ry + (arctis ? 1.4 : 1.1);
  if (arctis) {
    // steel outer band and fabric suspension strap underneath
    const band = new THREE.Mesh(bandGeo(innerX + .1, 7.4, topY + 1.2, .35, 1.7), mat(lum(frame) > .5 ? '#c9ccd2' : '#2b2c30', .35, .75)); band.castShadow = true; G.add(band);
    const strap = new THREE.Mesh(bandGeo(innerX - .9, 5.6, topY + .4, .28, 4.2, 0.04, 0.96), mat(shadeHex(frame, lum(frame) > .5 ? -0.35 : 0.12), .95)); G.add(strap);
    [-1, 1].forEach(sd => {
      const blk = new THREE.Mesh(slab(1.6, 2.2, 1.6, .5, .2), frameMat); blk.position.set(sd * (innerX + .1), topY - .1, 0); blk.castShadow = true; G.add(blk);
      [-0.7, 0.7].forEach(z => { const rod = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, 1.6, 12), metalDark); rod.position.set(sd * innerX, cupY + ry + .55, z); G.add(rod); });
    });
    if (o.mic) { const boom = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-cupX + .4, cupY - 2.4, 2.6), new THREE.Vector3(-cupX + 1.4, cupY - 4.2, 5.4), new THREE.Vector3(-cupX + 4, cupY - 4.6, 8.4)]), 30, .22, 10), mat('#1b1b1e', .6)); boom.castShadow = true; G.add(boom); const tip = new THREE.Mesh(new THREE.SphereGeometry(.42, 16, 12), mat('#1b1b1e', .7)); tip.scale.set(1.2, 1, 1); tip.position.set(-cupX + 4.1, cupY - 4.6, 8.5); G.add(tip); }
    else { const stub = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .6, 12), mat('#1b1b1e', .6)); stub.rotation.x = Math.PI / 2; stub.position.set(-cupX + .6, cupY - 2.6, rz * .8); G.add(stub); }
  } else {
    // padded band, drilled aluminum yokes and forks around each cup
    const band = new THREE.Mesh(bandGeo(innerX - .2, 6.9, topY + 2.3, 1.15, 3.6), mat(frame, .7)); band.castShadow = true; G.add(band);
    [-1, 1].forEach(sd => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(.18, 3.6, 1.9), metalDark); strip.position.set(sd * (innerX - .1), topY + .9, 0); G.add(strip);
      const pts = []; for (let i = 0; i <= 24; i++) { const a = Math.PI * i / 24; pts.push(new THREE.Vector3(sd * innerX, cupY + (rz + .55) * Math.sin(a) * (ry / rz), (rz + .55) * Math.cos(a))); }
      const fork = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .26, 10), metalDark); fork.castShadow = true; G.add(fork);
    });
    if (o.mic) { const boom = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-cupX + .3, cupY - 2.8, 1.6), new THREE.Vector3(-cupX + 1.6, cupY - 4.8, 4.6), new THREE.Vector3(-cupX + 4.6, cupY - 5.2, 8)]), 30, .2, 10), mat('#1b1b1e', .6)); boom.castShadow = true; G.add(boom); const foam = new THREE.Mesh(new THREE.SphereGeometry(.62, 18, 14), mat('#202024', .95)); foam.scale.set(1.5, 1, 1); foam.position.set(-cupX + 4.9, cupY - 5.2, 8.2); G.add(foam); }
  }
  const vol = new THREE.Mesh(knurled(.55, .4, 28, .03), mat('#2a2b2f', .5, .3)); vol.rotation.z = Math.PI / 2; vol.position.set(-cupX + depth * .45, cupY - 1, -rz - .1); G.add(vol);
  return G;
}

/* ================= Headphone stand ================= */
function woodTexture(base, seed = 3) {
  return canvasTex(512, 1024, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    let s = seed; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 140; i++) {
      const x0 = r() * w, amp = 6 + r() * 26, dark = r() < 0.6;
      g.strokeStyle = dark ? `rgba(0,0,0,${0.05 + r() * 0.12})` : `rgba(255,255,255,${0.03 + r() * 0.06})`; g.lineWidth = 1 + r() * 3;
      g.beginPath(); for (let y = 0; y <= h; y += 16) { const x = x0 + Math.sin(y / (60 + r() * 40) + i) * amp; y ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    }
  }, [1, 1]);
}
function buildStand(p, o) {
  const G = new THREE.Group(), woodC = (choiceOf(p, 'wood', o.wood) || {}).color || '#5a3e2b', leatherC = (choiceOf(p, 'leather', o.leather) || {}).color || '#1d1b1a';
  const black = o.wood === 'Black', steel = mat(black ? '#2a2b2e' : '#c4c6c8', .3, .9);
  // splayed stainless foot with leather inlay
  const foot = new THREE.Shape(); foot.moveTo(-5.7, 4.9); foot.lineTo(5.7, 4.9); foot.quadraticCurveTo(6.2, 4.9, 5.8, 4.3); foot.lineTo(4.4, -4.6); foot.quadraticCurveTo(4.2, -4.9, 3.7, -4.9); foot.lineTo(-3.7, -4.9); foot.quadraticCurveTo(-4.2, -4.9, -4.4, -4.6); foot.lineTo(-5.8, 4.3); foot.quadraticCurveTo(-6.2, 4.9, -5.7, 4.9);
  const fg = new THREE.ExtrudeGeometry(foot, { depth: .5, bevelEnabled: true, bevelThickness: .12, bevelSize: .12, bevelSegments: 3, curveSegments: 10 });
  fg.rotateX(-Math.PI / 2); fg.translate(0, .12, 0);
  const fm = new THREE.Mesh(fg, steel); fm.castShadow = true; fm.receiveShadow = true; G.add(fm);
  const inlay = new THREE.Mesh(new THREE.ShapeGeometry(foot, 10), mat(leatherC, .75)); inlay.rotation.x = -Math.PI / 2; inlay.scale.set(.86, .86, 1); inlay.position.y = .76; G.add(inlay);
  // hardwood upright that widens into a curved saddle
  const up = new THREE.Shape();
  up.moveTo(-2.6, .7); up.lineTo(2.6, .7); up.bezierCurveTo(2.2, 7, 4.6, 15, 7.3, 21.2); up.quadraticCurveTo(7.5, 21.9, 6.8, 22.1); up.quadraticCurveTo(0, 23.6, -6.8, 22.1); up.quadraticCurveTo(-7.5, 21.9, -7.3, 21.2); up.bezierCurveTo(-4.6, 15, -2.2, 7, -2.6, .7);
  const ug = new THREE.ExtrudeGeometry(up, { depth: 2.4, bevelEnabled: true, bevelThickness: .25, bevelSize: .25, bevelSegments: 4, curveSegments: 24 });
  ug.translate(0, 0, -1.2);
  const uvA = ug.attributes.uv; for (let i = 0; i < uvA.count; i++) uvA.setXY(i, uvA.getX(i) / 16 + 0.5, uvA.getY(i) / 24);
  const um = new THREE.Mesh(ug, new THREE.MeshStandardMaterial({ map: woodTexture(woodC), roughness: .55 })); um.castShadow = true; um.receiveShadow = true; G.add(um);
  for (let k = -2; k <= 2; k++) { const groove = new THREE.Mesh(new THREE.BoxGeometry(.06, .05, 2.6), mat(shadeHex(woodC, -0.4), .8)); groove.position.set(k * 1.6, 23.05 - Math.abs(k) * .38, 0); G.add(groove); }
  if (o.engrave && o.engrave.trim()) { const dc = decal(o.engrave.trim(), 4.4, .9, lum(woodC) > .5 ? '#3b2414' : '#e6d3b8', '700', .75); dc.position.set(0, 6.2, 1.46); G.add(dc); }
  [[-3.6, 3.4], [3.6, 3.4], [-2.6, -3.6], [2.6, -3.6]].forEach(([x, z]) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .12, 16), mat(black ? '#111' : '#a87d52', .9)); c.position.set(x, .06, z); G.add(c); });
  G.position.y = .12;
  return G;
}

/* ================= Coiled cable ================= */
function sleeveTexture(color, len) {
  return canvasTex(128, 32, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.strokeStyle = lum(color) > .5 ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.14)'; g.lineWidth = 3;
    for (let x = -h; x < w + h; x += 10) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke(); g.beginPath(); g.moveTo(x + h, 0); g.lineTo(x, h); g.stroke(); }
  }, [len / 1.1, 1]);
}
function usbC(metalC, sleeveC, len = 2.1) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(len, .62, 1.0), mat(metalC, .3, .85)); body.position.y = 0; body.geometry.translate(0, 0, 0);
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(.7, .26, .82), mat('#c8c9cc', .25, .9)); tongue.position.x = len / 2 + .35;
  const relief = new THREE.Mesh(new THREE.CylinderGeometry(.3, .34, .9, 16), mat(sleeveC, .7)); relief.rotation.z = Math.PI / 2; relief.position.x = -len / 2 - .4;
  g.add(body, tongue, relief); g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  return g;
}
function buildCable(p, o) {
  const G = new THREE.Group(), R = .22, y = R + .02;
  const sm = len => new THREE.MeshStandardMaterial({ map: sleeveTexture(o.sleeve, len), roughness: .7 });
  // host run: loose S-curve from the host plug to the aviator coupling
  const run = new THREE.CatmullRomCurve3([[-17, y, 5], [-14, y, 5.4], [-10, y, 2.6], [-6.5, y, -1.5], [-3.2, y, -.4], [-1.6, y, 0]].map(a => new THREE.Vector3(...a)));
  const rl = run.getLength(); const runM = new THREE.Mesh(new THREE.TubeGeometry(run, 120, R, 10), sm(rl)); runM.castShadow = true; G.add(runM);
  const host = usbC(o.metal, o.sleeve); host.position.set(-18.4, .34, 5); host.rotation.y = Math.PI; G.add(host);
  // knurled GX12 aviator coupling
  const av = new THREE.Group();
  const a1 = new THREE.Mesh(knurled(.62, 1.3, 40, .05), mat(o.metal, .32, .85)); a1.rotation.z = Math.PI / 2; a1.position.x = -.65;
  const a2 = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 1.2, 32), mat(o.metal, .28, .9)); a2.rotation.z = Math.PI / 2; a2.position.x = .62;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.6, .06, 8, 32), mat(shadeHex(o.metal, -0.3), .3, .9)); ring.rotation.y = Math.PI / 2;
  av.add(a1, a2, ring); av.position.set(0, .64, 0); av.traverse(m => { if (m.isMesh) m.castShadow = true; }); G.add(av);
  // the coil
  const x0 = 1.8, x1 = 10.5, turns = 15, rc = .62, yc = rc + R + .02;
  class Helix extends THREE.Curve { getPoint(t, out = new THREE.Vector3()) { const a = Math.PI * 2 * turns * t; return out.set(x0 + (x1 - x0) * t, yc + rc * Math.cos(a), rc * Math.sin(a)); } }
  const lead = new THREE.CatmullRomCurve3([new THREE.Vector3(1.25, .64, 0), new THREE.Vector3(1.6, yc + rc * .5, 0), new THREE.Vector3(x0, yc + rc, 0)]);
  G.add(new THREE.Mesh(new THREE.TubeGeometry(lead, 12, R, 10), sm(1)));
  const coil = new THREE.Mesh(new THREE.TubeGeometry(new Helix(), turns * 28, R, 10), sm(turns * 4)); coil.castShadow = true; G.add(coil);
  const angled = o.plug === 'Angled';
  const tail = new THREE.CatmullRomCurve3([new THREE.Vector3(x1, yc + rc, 0), new THREE.Vector3(x1 + .8, yc, 0), new THREE.Vector3(x1 + 1.8, y, 0)]);
  G.add(new THREE.Mesh(new THREE.TubeGeometry(tail, 16, R, 10), sm(2)));
  const kb = usbC(o.metal, o.sleeve, angled ? 1.6 : 2.1);
  if (angled) { kb.rotation.y = -Math.PI / 2; kb.position.set(x1 + 2.3, .34, -1.1); }
  else kb.position.set(x1 + 3.1, .34, 0);
  G.add(kb);
  return G;
}

/* ================= Carrying case ================= */
function buildCase(p, o) {
  const G = new THREE.Group(), mm = (choiceOf(p, 'size', o.size) || {}).mm || [420, 199, 55];
  const L = mm[0] / 10, W = mm[1] / 10, H = mm[2] / 10;
  const fabric = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = o.color; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) { g.fillStyle = `rgba(0,0,0,${y % 8 ? .06 : .12})`; g.fillRect(0, y, w, 2); }
    for (let x = 0; x < w; x += 4) { g.fillStyle = `rgba(255,255,255,${x % 8 ? .03 : .06})`; g.fillRect(x, 0, 2, h); }
  }, [L / 6, W / 6]);
  const shellMat = new THREE.MeshStandardMaterial({ map: fabric, roughness: .92 });
  const half = (lid) => {
    const g = smooth(new THREE.ExtrudeGeometry(rr(L - 1.8, W - 1.8, 2.2), { depth: H / 2 - 1.8, bevelEnabled: true, bevelThickness: .9, bevelSize: .9, bevelSegments: 5, curveSegments: 12 }));
    const pa = g.attributes.position, uvs = []; for (let i = 0; i < pa.count; i++) uvs.push(pa.getX(i) / 6, pa.getY(i) / 6 + pa.getZ(i) / 6); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.rotateX(-Math.PI / 2); g.computeBoundingBox(); g.translate(0, lid ? H / 2 - g.boundingBox.min.y + .05 : -g.boundingBox.min.y, 0);
    const m = new THREE.Mesh(g, shellMat); m.castShadow = true; m.receiveShadow = true; return m;
  };
  G.add(half(false), half(true));
  // wraparound zipper
  const zp = new THREE.Shape(); rrPath(zp, L - .2, W - .2, 3);
  const pts = zp.getSpacedPoints(260).map(v => new THREE.Vector3(v.x, H / 2 + .02, -v.y));
  const zc = new THREE.CatmullRomCurve3(pts, true), zl = zc.getLength();
  const teeth = canvasTex(64, 16, (g, w, h) => { g.fillStyle = '#141416'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a3b40'; for (let x = 0; x < w; x += 8) g.fillRect(x, 4, 4, 8); }, [zl / .5, 1]);
  G.add(new THREE.Mesh(new THREE.TubeGeometry(zc, 520, .22, 6, true), new THREE.MeshStandardMaterial({ map: teeth, roughness: .6, metalness: .3 })));
  const pull = new THREE.Group(); const slider = new THREE.Mesh(new THREE.BoxGeometry(.9, .5, .7), mat('#2a2b2e', .35, .7));
  const tab = new THREE.Mesh(slab(1.0, 2.4, .25, .45, .08), mat(o.pull, .6)); tab.rotation.x = Math.PI / 2; tab.position.set(0, -.1, 1.4);
  pull.add(slider, tab); pull.position.set(L / 2 - 4.5, H / 2 + .05, W / 2 + .2); pull.traverse(m => { if (m.isMesh) m.castShadow = true; }); G.add(pull);
  // carry handle on the back edge
  const hc = new THREE.CatmullRomCurve3([new THREE.Vector3(-4.6, H * .72, -W / 2 + .3), new THREE.Vector3(-3, H * .78, -W / 2 - 1.6), new THREE.Vector3(3, H * .78, -W / 2 - 1.6), new THREE.Vector3(4.6, H * .72, -W / 2 + .3)]);
  const handle = new THREE.Mesh(new THREE.ExtrudeGeometry(rr(.35, 1.6, .15), { steps: 40, bevelEnabled: false, extrudePath: hc }), mat(shadeHex(o.color, -0.25), .85)); handle.castShadow = true; G.add(handle);
  if (o.mono && o.mono.trim()) { const dc = decal(o.mono.trim().toUpperCase(), 6, 2.6, lum(o.color) > .5 ? '#1c1d22' : '#f3f1ec', '800', .82); dc.rotation.x = -Math.PI / 2; dc.position.set(0, H + .08, 0); G.add(dc); }
  else { const tagm = new THREE.Mesh(slab(3.2, 1.1, .08, .2, .02), mat(shadeHex(o.color, lum(o.color) > .5 ? -0.3 : 0.25), .8)); tagm.position.set(L / 2 - 5, H + .02, W / 2 - 2.4); G.add(tagm); }
  return G;
}

/* ================= Public API ================= */
const BUILDERS = { mouse: buildMouse, 'mouse-ergo': buildMouse, mat: buildMat, headset: buildHeadset, stand: buildStand, cable: buildCable, case: buildCase };
const VIEW_DIR = { mouse: [-0.9, 0.95, 1.1], 'mouse-ergo': [-0.9, 0.95, 1.1], mat: [0.15, 1.15, 0.85], headset: [0.55, 0.3, 1], stand: [0.65, 0.3, 1], cable: [0.1, 1.2, 0.75], case: [0.55, 0.75, 1] };
async function prepare(p, cfg) { return { print: p.kind === 'mat' ? await loadImage(printSrc(cfg)) : null }; }
export async function buildProduct(p, cfg) { const imgs = await prepare(p, cfg); return BUILDERS[p.kind](p, cfg, imgs); }
function disposeTree(o) {
  o.traverse(m => {
    if (m.geometry) m.geometry.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    mats.forEach(x => { if (x.map) x.map.dispose(); x.dispose(); });
  });
}
function stage(renderer) {
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.setClearColor(0, 0);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8b909a, 0.6 * Math.PI));
  const key = new THREE.DirectionalLight(0xffffff, 0.7 * Math.PI); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = .02; key.shadow.radius = 4; scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xffffff, 0.22 * Math.PI); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.25 * Math.PI); scene.add(rim);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.22 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const camera = new THREE.PerspectiveCamera(30, 4 / 3, 0.1, 2000);
  // place the model on the ground, size lights and shadow camera to it, aim the camera
  const frame = (obj, kind, aspect, keepCamera) => {
    const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= box.min.y;
    const span = Math.max(size.x, size.y, size.z);
    ground.scale.set(span * 6, span * 6, 1);
    key.position.set(-span * .8, span * 1.6, span * 1.1); key.target.position.set(0, size.y / 2, 0);
    Object.assign(key.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: .1, far: span * 5 }); key.shadow.camera.updateProjectionMatrix();
    fill.position.set(span * 1.2, span * .6, -span * .5); rim.position.set(0, span * .8, -span * 1.5);
    const target = new THREE.Vector3(0, size.y * .42, 0);
    if (!keepCamera) {
      const dir = new THREE.Vector3(...(VIEW_DIR[kind] || [0.6, 0.6, 1])).normalize();
      camera.aspect = aspect; camera.updateProjectionMatrix();
      const vf = camera.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
      const radius = size.length() / 2;
      const dist = Math.max(radius / Math.sin(Math.min(vf, hf) / 2)) * 0.92;
      camera.position.copy(target).addScaledVector(dir, dist); camera.lookAt(target);
    }
    return { target, span };
  };
  return { scene, camera, frame };
}

// Interactive viewer for the product page
export function createViewer(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const { scene, camera, frame } = stage(renderer);
  const canvas = renderer.domElement; canvas.className = 'pd-canvas';
  host.appendChild(canvas);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.enablePan = false; controls.autoRotate = true; controls.autoRotateSpeed = 1.1;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  canvas.style.touchAction = 'pan-y';   // vertical swipes still scroll the page on phones
  let current = null, currentId = null, alive = true, seq = 0;
  const size = () => { const r = host.getBoundingClientRect(); const w = Math.max(1, r.width), h = Math.max(1, r.height); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(size); ro.observe(host); size();
  async function show(p, cfg) {
    const my = ++seq, obj = await buildProduct(p, cfg);
    if (!alive || my !== seq) { disposeTree(obj); return; }
    if (current) { scene.remove(current); disposeTree(current); }
    current = obj; scene.add(obj);
    const r = host.getBoundingClientRect(), keep = currentId === p.id;
    const { target, span } = frame(obj, p.kind, Math.max(.5, r.width / Math.max(1, r.height)), keep);
    if (!keep) { controls.target.copy(target); controls.minDistance = span * .6; controls.maxDistance = span * 4; controls.update(); }
    currentId = p.id;
  }
  const loop = () => { if (!alive) return; if (!canvas.isConnected) { dispose(); return; } controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  function dispose() { if (!alive) return; alive = false; ro.disconnect(); controls.dispose(); if (current) disposeTree(current); renderer.dispose(); canvas.remove(); }
  return { show, dispose, canvas };
}

// Still renders for cards and the cart, made with one shared offscreen renderer
let thumbStage = null; const thumbCache = new Map(); let queue = Promise.resolve();
export function thumbnail(p, cfg, w = 640, h = 480) {
  const key = p.id + '|' + JSON.stringify(cfg) + '|' + w + 'x' + h;
  if (thumbCache.has(key)) return thumbCache.get(key);
  const job = queue.then(async () => {
    if (!thumbStage) { const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); thumbStage = { renderer: r, ...stage(r) }; }
    const { renderer, scene, camera, frame } = thumbStage;
    renderer.setPixelRatio(1); renderer.setSize(w, h, false);
    const obj = await buildProduct(p, cfg); scene.add(obj); frame(obj, p.kind, w / h, false);
    renderer.render(scene, camera);
    const url = renderer.domElement.toDataURL('image/png');
    scene.remove(obj); disposeTree(obj);
    return url;
  });
  queue = job.catch(() => {});
  thumbCache.set(key, job);
  return job;
}
