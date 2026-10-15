// keycapgen 3D engine: the keyboard scene, the customizer UI and all key editing.
// It builds its own UI once and keeps it in memory, so it survives Astro page swaps:
// pages only provide a mount point (data-studio="hero" or data-studio="customize")
// and the engine moves its canvas and panels there on each navigation.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ROW_TILT, ROW_LIFT, PROFILE_ROW, PROFILES, MODELS, FIELDS, FONTS, FONT_IDS, SWATCHES, COLORWAYS, GENERIC_IDS } from '../data/keyboards.js';
import { SAMPLES, getSampleImages } from '../lib/samples.js';
import { money, uid } from '../lib/util.js';
import { upsert, toast } from '../lib/cart.js';
import UI from './studio-ui.html?raw';

// Colors are managed by hand below (sRGB hex -> linear), as in the original single-file build.
THREE.ColorManagement.enabled = false;

const root = document.createElement('div');
root.className = 'page-cz studio-root';
root.innerHTML = UI;
const $ = s => root.querySelector(s);
const $$ = s => [...root.querySelectorAll(s)];

/* ---------------- State ---------------- */
const keys = [], byId = {}, charMap = new Map();
const state = { model: 'studio75', colorway: 'graphite', case: '#2b2d32', deck: null };
let model = MODELS.studio75;
let selection = new Set(), primary = null, mode = 'play';
let text = '', strokes = 0, capsOn = false, oneShotShift = false, physShift = false;
const dims = { W: 16, D: 6.25, OW: 17.1, OD: 7.35, cz: 0 };

/* ---------------- Three.js scene ---------------- */
const viewport = $('#viewport');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setClearColor(0x000000, 0);
viewport.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.minDistance = 7; controls.maxDistance = 60;
controls.maxPolarAngle = Math.PI * 0.47;
controls.screenSpacePanning = true;

const hemi = new THREE.HemisphereLight(0xffffff, 0x8b909a, 0.55 * Math.PI);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.62 * Math.PI);
sun.position.set(-5, 14, 9); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 9, bottom: -9, near: 1, far: 40 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.2 * Math.PI); fill.position.set(9, 6, -7); scene.add(fill);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.ShadowMaterial({ opacity: 0.2 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.63; ground.receiveShadow = true; scene.add(ground);

const board = new THREE.Group(); scene.add(board);

function rrPath(p, w, d, r, cx = 0, cy = 0) {
  const x = cx - w / 2, y = cy - d / 2;
  r = Math.min(r, w / 2 - 0.001, d / 2 - 0.001);
  p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + d - r); p.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  p.lineTo(x + r, y + d); p.quadraticCurveTo(x, y + d, x, y + d - r);
  p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y);
  return p;
}
const rr = (w, d, r, cx, cy) => rrPath(new THREE.Shape(), w, d, r, cx, cy);
function smooth(g, keepUV) {
  const pos = g.attributes.position, idx = g.index, uv = keepUV ? g.attributes.uv : null;
  const n = idx ? idx.count : pos.count, map = new Map(), verts = [], uvs = [], out = [];
  for (let i = 0; i < n; i++) {
    const v = idx ? idx.getX(i) : i;
    const x = pos.getX(v), y = pos.getY(v), z = pos.getZ(v);
    const key = Math.round(x * 1e4) + ',' + Math.round(y * 1e4) + ',' + Math.round(z * 1e4);
    let j = map.get(key);
    if (j === undefined) { j = verts.length / 3; verts.push(x, y, z); if (uv) uvs.push(uv.getX(v), uv.getY(v)); map.set(key, j); }
    out.push(j);
  }
  const ng = new THREE.BufferGeometry();
  ng.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  if (uv) ng.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  ng.setIndex(out); ng.computeVertexNormals();
  return ng;
}

// Shared materials
const caseMat = new THREE.MeshStandardMaterial({ roughness: 0.48, metalness: 0.12 });
const plateMat = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.15 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0x3a3b3f, roughness: 0.32, metalness: 0.75 });
const oledMat = new THREE.MeshBasicMaterial({ toneMapped: false });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.15, metalness: 0.3 });
const switchMat = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.6 });
const ringMat = new THREE.MeshBasicMaterial({ color: 0x0e7a6b, toneMapped: false });
const crossMat = new THREE.MeshBasicMaterial({ color: 0x0b0c0e });
const undersideMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false });
const fadeMats = [caseMat, plateMat, switchMat, ringMat, metalMat, oledMat, glassMat];
const caseParts = [], caseCasters = [], spinners = [], pickables = [], disposables = [];
const maxAniso = renderer.capabilities.getMaxAnisotropy();
{
  const c = document.createElement('canvas'); c.width = 512; c.height = 160;
  const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 512, 160);
  g.fillStyle = '#f4f4f4'; g.font = '600 46px "IBM Plex Mono", monospace'; g.fillText('PROFILE 1', 26, 66);
  g.font = '400 34px "IBM Plex Mono", monospace'; g.fillText('ACTUATION 0.4mm', 26, 124);
  oledMat.map = new THREE.CanvasTexture(c); oledMat.map.colorSpace = THREE.SRGBColorSpace;
}

// Keycap geometry (cached per profile and size)
const CAP = { gap: 0.1, h: .42, inset: .11, bevel: .045, r: .07, pid: 'studio' };
let CAP_BASE = 0.17, PRESS = 0.11;
const SEL_LIFT = 0.06;
const geoCache = {};
const cached = (kind, w, h, make) => { const key = `${kind}:${CAP.pid}:${w}:${h}`; return geoCache[key] || (geoCache[key] = make()); };
function capGeometry(w, h = 1) {
  return cached('cap', w, h, () => {
    const bw = w - CAP.gap, bd = h - CAP.gap;
    let g = new THREE.ExtrudeGeometry(rr(bw - 2 * CAP.bevel, bd - 2 * CAP.bevel, CAP.r), { depth: CAP.h - 2 * CAP.bevel, bevelEnabled: true, bevelThickness: CAP.bevel, bevelSize: CAP.bevel, bevelSegments: 4, curveSegments: 6 });
    const p = g.attributes.position; let zmin = Infinity, zmax = -Infinity;
    for (let i = 0; i < p.count; i++) { const z = p.getZ(i); if (z < zmin) zmin = z; if (z > zmax) zmax = z; }
    const hw = bw / 2, hd = bd / 2;
    // Unfolded UV atlas: the top face sits in the middle, the sides fold out around it.
    // Each vertex is mapped from its point on the base contour plus the distance travelled down the profile,
    // so the map is continuous across edges and corners (strokes flow from the top onto the sides).
    const sw = bw - 2 * CAP.bevel, sd = bd - 2 * CAP.bevel, r = Math.min(CAP.r, sw / 2 - 0.001, sd / 2 - 0.001);
    const ix = sw / 2 - r, iy = sd / 2 - r, depth = CAP.h - 2 * CAP.bevel, bt = CAP.bevel;
    const slant = Math.sqrt(1 + (CAP.inset / CAP.h) ** 2), Lb = bt * Math.PI / 2, Lw = depth * slant, Smax = 2 * Lb + Lw;
    const TX = sw / 2 * (1 - CAP.inset / hw), TY = sd / 2 * (1 - CAP.inset / hd), EX = TX + Smax, EY = TY + Smax;
    const uvs = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const cx = Math.max(-ix, Math.min(ix, x)), cy = Math.max(-iy, Math.min(iy, y));
      const vx = x - cx, vy = y - cy, len = Math.hypot(vx, vy), nx = len > 1e-6 ? vx / len : 0, ny = len > 1e-6 ? vy / len : 0;
      const bx = cx + nx * r, by = cy + ny * r;
      const sdist = z >= depth ? bt * Math.acos(Math.min(1, (z - depth) / bt)) : z >= 0 ? Lb + (depth - z) * slant : Lb + Lw + bt * Math.asin(Math.min(1, -z / bt));
      const ax = bx / (sw / 2) * TX + nx * sdist, ay = by / (sd / 2) * TY + ny * sdist;
      uvs[i * 2] = (ax + EX) / (2 * EX); uvs[i * 2 + 1] = (ay + EY) / (2 * EY);
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    for (let i = 0; i < p.count; i++) {
      const t = (p.getZ(i) - zmin) / (zmax - zmin);
      p.setX(i, p.getX(i) * (hw - CAP.inset * t) / hw);
      p.setY(i, p.getY(i) * (hd - CAP.inset * t) / hd);
      p.setZ(i, p.getZ(i) - zmin);
    }
    g = smooth(g, true); g.rotateX(-Math.PI / 2);
    g.userData.atlas = { TX, TY, Smax, Lb, Lw, EX, EY };
    return g;
  });
}
const ATLAS_PX = 288;
function atlasDims(k) {
  const a = capGeometry(k.w, k.h).userData.atlas;
  const W = Math.round(2 * a.EX * ATLAS_PX), H = Math.round(2 * a.EY * ATLAS_PX), sx = W / (2 * a.EX), sy = H / (2 * a.EY);
  return { W, H, sx, sy, a, top: { x: a.Smax * sx, y: a.Smax * sy, w: 2 * a.TX * sx, h: 2 * a.TY * sy } };
}
function topSize(w, h = 1) {
  const bw = w - CAP.gap, bd = h - CAP.gap;
  return { tw: (bw - 2 * CAP.bevel) * (1 - CAP.inset / (bw / 2)), td: (bd - 2 * CAP.bevel) * (1 - CAP.inset / (bd / 2)) };
}
function ringGeometry(w, h = 1) {
  return cached('ring', w, h, () => {
    const bw = w - CAP.gap, bd = h - CAP.gap;
    const s = rr(bw + 0.1, bd + 0.1, 0.12); s.holes.push(rrPath(new THREE.Path(), bw - 0.04, bd - 0.04, 0.08));
    const g = new THREE.ShapeGeometry(s, 8); g.rotateX(-Math.PI / 2); return g;
  });
}
function undersideGeometry(w, h = 1) {
  return cached('under', w, h, () => { const g = new THREE.ShapeGeometry(rr(w - CAP.gap - 0.14, h - CAP.gap - 0.14, 0.05), 6); g.rotateX(Math.PI / 2); return g; });
}
function knurled(geo, r, segs) {
  const p = geo.attributes.position, step = Math.PI * 2 / segs;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z);
    if (d > r * 0.97) { const idx = Math.round(Math.atan2(z, x) / step); if (idx % 2) { p.setX(i, x * 1.035); p.setZ(i, z * 1.035); } }
  }
  geo.computeVertexNormals(); return geo;
}
const own = g => { disposables.push(g); return g; };

/* ---------------- Build a keyboard model ---------------- */
function buildModel(id) {
  if (!MODELS[id]) id = 'studio75';
  const M = MODELS[id];
  // tear down the previous board
  if (iso.id) { iso.id = null; controls.autoRotate = false; if (iso.relaxed) restoreLimits(); }
  iso.fade = 1; tween = null;
  board.clear(); disposables.forEach(d => d.dispose()); disposables.length = 0;
  caseParts.length = caseCasters.length = spinners.length = pickables.length = 0;
  selection = new Set(); primary = null; hovered = null; down = null; capsOn = false; oneShotShift = false;
  releaseAllPhysical();
  state.model = id; model = M;
  const P = PROFILES[M.profile];
  Object.assign(CAP, { h: P.h, inset: P.inset, bevel: P.bevel, r: P.r, pid: M.profile });
  CAP_BASE = P.base; PRESS = P.press;

  // keys
  keys.length = 0; Object.keys(byId).forEach(k => delete byId[k]); charMap.clear();
  M.rows().forEach(row => {
    let x = 0;
    row.keys.forEach(d => {
      if (d.gap) { x += d.gap; return; }
      if (d.at !== undefined) { x = d.at; return; }
      const group = (d.code === 'Escape' || d.code === 'Enter' || d.code === 'NumpadEnter') ? 'accent'
        : (d.out !== undefined && d.code !== 'Tab' && !/^Numpad(Divide|Multiply|Subtract|Add)$/.test(d.code)) ? 'alpha' : 'mod';
      const sub = d.sub || '';
      const align = (!sub && d.label.length > 1 && d.w >= 1.25) ? 'top-left' : 'center';
      const def = { label: d.label, sub, out: d.out ?? '', outShift: d.outShift ?? '', font: 'Public Sans', size: 1, bold: false, align };
      const k = { id: d.code, code: d.code === 'Fn' ? 'Fn (no key code)' : d.code, w: d.w, h: d.h || 1, x, y: row.y, row: row.p, group,
        act: d.act || null, presses: 0, def, ...def, cap: '#888888', ink: '#000000', fly: 0, bob: 0 };
      keys.push(k); byId[k.id] = k;
      x += d.w;
    });
  });
  const addChars = list => list.forEach(k => [k.def.out, k.def.outShift].forEach(c => { if (c && c.length === 1 && c !== '\t' && c !== '\n' && !charMap.has(c)) charMap.set(c, k); }));
  addChars(keys.filter(k => !k.id.startsWith('Numpad'))); addChars(keys.filter(k => k.id.startsWith('Numpad')));

  // dimensions
  const C = M.case;
  dims.W = Math.max(...keys.map(k => k.x + k.w)); dims.D = Math.max(...keys.map(k => k.y + k.h));
  dims.OW = dims.W + 2 * C.m; dims.OD = dims.D + 2 * C.m + C.top; dims.cz = -C.top / 2;
  const W = dims.W, D = dims.D, cy = C.top / 2;

  // case
  let g = new THREE.ExtrudeGeometry(rr(dims.OW - 0.16, dims.OD - 0.16, C.radius, 0, cy), { depth: C.depth, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 4, curveSegments: 10 });
  g = own(smooth(g)); g.rotateX(-Math.PI / 2); g.computeBoundingBox(); g.translate(0, 0.04 - g.boundingBox.max.y, 0);
  const baseBottom = 0.04 - (g.boundingBox.max.y - g.boundingBox.min.y);
  const base = new THREE.Mesh(g, caseMat); base.castShadow = base.receiveShadow = true; board.add(base);
  caseParts.push(base); caseCasters.push(base);
  let deckTop;
  if (C.floating) {
    g = new THREE.ExtrudeGeometry(rr(dims.OW - 0.14, dims.OD - 0.14, Math.max(0.06, C.radius - 0.02), 0, cy), { depth: 0.02, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 10 });
    g = own(smooth(g)); g.rotateX(-Math.PI / 2); g.computeBoundingBox(); g.translate(0, 0.06 - g.boundingBox.max.y, 0);
    const deck = new THREE.Mesh(g, plateMat); deck.receiveShadow = true; board.add(deck); caseParts.push(deck);
    deckTop = 0.06;
  } else {
    const rim = rr(dims.OW - 0.1, dims.OD - 0.1, C.radius + 0.03, 0, cy); rim.holes.push(rrPath(new THREE.Path(), W + 0.35, D + 0.35, 0.18));
    g = new THREE.ExtrudeGeometry(rim, { depth: C.rim - 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 10 });
    g = own(smooth(g)); g.rotateX(-Math.PI / 2); g.computeBoundingBox(); g.translate(0, 0.02 - g.boundingBox.min.y, 0);
    const rimMesh = new THREE.Mesh(g, caseMat); rimMesh.castShadow = rimMesh.receiveShadow = true; board.add(rimMesh);
    const plate = new THREE.Mesh(own(new THREE.BoxGeometry(W + 0.3, 0.04, D + 0.3)), plateMat);
    plate.position.y = 0.03; plate.receiveShadow = true; board.add(plate);
    caseParts.push(rimMesh, plate); caseCasters.push(rimMesh);
    deckTop = 0.05;
  }
  ground.position.y = baseBottom - 0.005;
  const sc = sun.shadow.camera; Object.assign(sc, { left: -(dims.OW / 2 + 2), right: dims.OW / 2 + 2, top: dims.OD / 2 + 3, bottom: -(dims.OD / 2 + 3) }); sc.updateProjectionMatrix();

  // extras on the top surface
  const at = (x, y) => [x - W / 2, y - D / 2];
  (M.extras || []).forEach(e => {
    const [ex, ez] = at(e.x, e.y);
    if (e.type === 'knob') {
      const kg = own(knurled(new THREE.CylinderGeometry(e.r, e.r * 1.02, e.h, 72, 1), e.r, 72));
      const knob = new THREE.Mesh(kg, metalMat); knob.position.set(ex, deckTop + e.h / 2, ez); knob.castShadow = true;
      const dot = new THREE.Mesh(own(new THREE.CylinderGeometry(e.r * 0.08, e.r * 0.08, 0.01, 16)), ringMat);
      dot.position.set(e.r * 0.62, e.h / 2 + 0.006, 0); knob.add(dot);
      board.add(knob); caseParts.push(knob); spinners.push({ mesh: knob, axis: 'y', target: 0, cur: 0 });
    } else if (e.type === 'roller') {
      const rg = own(knurled(new THREE.CylinderGeometry(e.r, e.r, e.len, 48, 1), e.r, 48));
      const roller = new THREE.Mesh(rg, metalMat); roller.rotation.z = Math.PI / 2; roller.position.set(ex, deckTop + e.r * 0.4, ez); roller.castShadow = true;
      board.add(roller); caseParts.push(roller); spinners.push({ mesh: roller, axis: 'y', target: 0, cur: 0 });
    } else if (e.type === 'button') {
      const b = new THREE.Mesh(own(new THREE.CylinderGeometry(e.r, e.r, 0.06, 32)), metalMat); b.position.set(ex, deckTop + 0.03, ez); b.castShadow = true;
      board.add(b); caseParts.push(b);
    } else if (e.type === 'oled') {
      const frame = new THREE.Mesh(own(new THREE.BoxGeometry(e.w + 0.1, 0.03, e.d + 0.1)), glassMat); frame.position.set(ex, deckTop + 0.015, ez);
      const screen = new THREE.Mesh(own(new THREE.PlaneGeometry(e.w, e.d)), oledMat); screen.rotation.x = -Math.PI / 2; screen.position.set(ex, deckTop + 0.032, ez);
      board.add(frame, screen); caseParts.push(frame, screen);
    }
  });

  // keycaps, switches, rings
  const switchH = M.profile === 'nsa' ? 0.07 : 0.14, switchGeo = own(new THREE.BoxGeometry(0.54, switchH, 0.54));
  const stemLen = Math.min(0.2, CAP_BASE + 0.02), stemGeo = own(new THREE.CylinderGeometry(0.105, 0.105, stemLen, 24));
  const crossGeoA = own(new THREE.BoxGeometry(0.15, 0.01, 0.042)), crossGeoB = own(new THREE.BoxGeometry(0.042, 0.01, 0.15));
  keys.forEach(k => {
    const cx = k.x + k.w / 2 - W / 2, cz = k.y + k.h / 2 - D / 2;
    const rest = { x: cx, y: CAP_BASE + (P.sculpted ? ROW_LIFT[k.row] * P.lift : 0), z: cz, tilt: ROW_TILT[k.row] * P.tilt };
    const root = new THREE.Group(); root.position.set(rest.x, rest.y, rest.z); root.rotation.x = rest.tilt;
    const mover = new THREE.Group(); root.add(mover);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 4;
    const tex = own(new THREE.CanvasTexture(canvas)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso;
    const mat = own(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62, metalness: 0 }));
    const stemMat = own(new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0 }));
    const cap = new THREE.Mesh(capGeometry(k.w, k.h), mat); cap.castShadow = cap.receiveShadow = true; mover.add(cap);
    cap.userData.key = k; pickables.push(cap);
    board.add(root);
    const sw = new THREE.Mesh(switchGeo, switchMat); sw.position.set(cx, deckTop + switchH / 2, cz); sw.receiveShadow = true; board.add(sw);
    const ring = new THREE.Mesh(ringGeometry(k.w, k.h), ringMat); ring.position.set(cx, deckTop + 0.006, cz); ring.visible = false; board.add(ring);
    // underside: hollow shell, cross stem, stabilizer stems on long keys (seen in isolation)
    const under = new THREE.Mesh(undersideGeometry(k.w, k.h), undersideMat); under.position.y = -0.002; mover.add(under);
    const stems = k.w >= 6 ? [[0,0],[-2.625,0],[2.625,0]] : k.w >= 2 ? [[0,0],[-0.625,0],[0.625,0]] : k.h >= 2 ? [[0,0],[0,-0.5],[0,0.5]] : [[0,0]];
    stems.forEach(([sx, sz]) => {
      const stem = new THREE.Mesh(stemGeo, stemMat); stem.position.set(sx, -stemLen / 2, sz); stem.castShadow = true; mover.add(stem);
      const c1 = new THREE.Mesh(crossGeoA, crossMat), c2 = new THREE.Mesh(crossGeoB, crossMat);
      c1.position.set(sx, -stemLen, sz); c2.position.set(sx, -stemLen, sz); mover.add(c1, c2);
    });
    k.obj = { root, mover, mat, stemMat, cap, canvas, tex, ring, sw, y: 0, rest };
  });
  boardIn = 0;
  renderModelUI();
}

/* ---------------- Legends ---------------- */
const famCss = f => f === 'system-ui' ? 'system-ui' : `"${f}"`;
const fontCache = {};
function ensureFont(f) {
  if (f === 'system-ui' || !document.fonts || !document.fonts.load) return Promise.resolve();
  if (!fontCache[f]) {
    fontCache[f] = Promise.all([document.fonts.load(`500 64px "${f}"`), document.fonts.load(`700 64px "${f}"`)])
      .then(r => { if (!r.flat().length) delete fontCache[f]; })
      .catch(() => { delete fontCache[f]; });
  }
  return fontCache[f];
}
let accentHex = '#0e7a6b';
function drawLegend(k) {
  const { canvas, tex } = k.obj, A = atlasDims(k);
  if (canvas.width !== A.W || canvas.height !== A.H) { canvas.width = A.W; canvas.height = A.H; tex.dispose(); }  // new size needs a fresh GPU texture
  const ctx = canvas.getContext('2d');
  // whole-key atlas: cap color, then skin, then drawing, then the legend inside the top region
  ctx.fillStyle = k.cap; ctx.fillRect(0, 0, A.W, A.H);
  if (k.skin) drawSkinAtlas(ctx, k, A);
  if (k.paint) ctx.drawImage(k.paint, 0, 0, A.W, A.H);
  ctx.save(); ctx.translate(A.top.x, A.top.y);
  drawLegendText(ctx, k, A.top.w, A.top.h);
  ctx.restore();
  tex.needsUpdate = true;
}
function drawLegendText(ctx, k, W, H) {
  const S = Math.min(W, H), mid = H / 2;
  const pad = S * 0.15, maxW = W - 2 * pad, s = k.size;
  if (!k.hideLegend) {
    ctx.fillStyle = k.ink;
    const weight = k.bold ? 700 : 500, fam = `${famCss(k.font)}, "Barlow", system-ui, sans-serif`;
    const setFont = px => { ctx.font = `${weight} ${px}px ${fam}`; };
    const fit = (t, px) => { setFont(px); const m = ctx.measureText(t).width; if (m > maxW) setFont(px * maxW / m); };
    const len = [...k.label].length;
    if (k.align === 'center') {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (k.sub) { fit(k.sub, S * 0.27 * s); ctx.fillText(k.sub, W / 2, mid - S * 0.19); fit(k.label, S * 0.27 * s); ctx.fillText(k.label, W / 2, mid + S * 0.21); }
      else if (k.label) { fit(k.label, (len <= 1 ? S * 0.42 : S * 0.22) * s); ctx.fillText(k.label, W / 2, mid + S * 0.03); }
    } else {
      ctx.textAlign = 'left';
      const px = (k.sub ? S * 0.25 : len <= 1 ? S * 0.34 : S * 0.2) * s;
      if (k.sub) {
        ctx.textBaseline = 'top'; fit(k.sub, px); ctx.fillText(k.sub, pad, pad);
        ctx.textBaseline = 'bottom'; fit(k.label, px); ctx.fillText(k.label, pad, H - pad);
      } else if (k.label) {
        if (k.align === 'top-left') { ctx.textBaseline = 'top'; fit(k.label, px); ctx.fillText(k.label, pad, pad); }
        else { ctx.textBaseline = 'bottom'; fit(k.label, px); ctx.fillText(k.label, pad, H - pad); }
      }
    }
  }
  if (k.act === 'caps' && capsOn) { ctx.fillStyle = accentHex; ctx.beginPath(); ctx.arc(W - pad, pad + S * 0.04, S * 0.05, 0, Math.PI * 2); ctx.fill(); }
}
function setCapColor(k) { k.obj.stemMat.color.set(k.cap).convertSRGBToLinear(); markDirty(k); }
function refreshKey(k) { setCapColor(k); }
function refreshAll() {
  keys.forEach(refreshKey);
  const fonts = [...new Set(keys.map(k => k.font))];
  Promise.all(fonts.map(ensureFont)).then(() => keys.forEach(drawLegend));
}
function setCase(hex, deck) {
  state.case = hex; state.deck = deck || null;
  caseMat.color.set(hex).convertSRGBToLinear();
  const c = new THREE.Color(hex), black = new THREE.Color(0x000000);
  if (model.case.floating) plateMat.color.copy(deck ? new THREE.Color(deck) : c.clone().lerp(black, 0.12)).convertSRGBToLinear();
  else plateMat.color.copy(c).lerp(black, 0.6).convertSRGBToLinear();
  const lum = c.r * 0.3 + c.g * 0.59 + c.b * 0.11;
  metalMat.color.set(lum > 0.55 ? '#cfd0d3' : lum > 0.3 ? '#8d8f94' : '#3d3e43').convertSRGBToLinear();
  $('#caseColor').value = hex; $('#caseHex').textContent = hex;
}

/* ---------------- Theme ---------------- */
const accentLin = new THREE.Color(), white = new THREE.Color(1, 1, 1);
let groundOpacity = 0.2;
function readTheme() {
  const cs = getComputedStyle(document.documentElement);
  accentHex = cs.getPropertyValue('--accent').trim() || '#0e7a6b';
  const dark = cs.getPropertyValue('--is-dark').trim() === '1';
  accentLin.set(accentHex).convertSRGBToLinear();
  ringMat.color.set(accentHex);
  groundOpacity = dark ? 0.5 : 0.2;
  if (byId.CapsLock) drawLegend(byId.CapsLock);
}
readTheme();
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readTheme); } catch (e) {}
new MutationObserver(readTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

/* ---------------- Camera ---------------- */
const VIEWS = {
  home:  { dir: [0, 1.3, 0.88], target: [0, -0.15, 0.55], pad: 1.0 },
  top:   { dir: [0, 1, 0.0001], target: [0, 0, 0], pad: 1.0 },
  front: { dir: [0, 0.62, 1], target: [0, -0.1, 0.4], pad: 0.92 },
  side:  { dir: [-0.85, 0.75, 0.8], target: [0, -0.1, 0], pad: 0.95 },
};
function fitDistance(pad) {
  const vf = camera.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  return Math.max(((dims.OW * 1.14 + 0.8) / 2) / Math.tan(hf / 2), ((dims.OD + 1.3) / 2) / Math.tan(vf / 2)) * pad;
}
function viewPose(name) {
  const v = VIEWS[name], t = new THREE.Vector3(...v.target); t.z += dims.cz;
  return { pos: t.clone().add(new THREE.Vector3(...v.dir).normalize().multiplyScalar(fitDistance(v.pad))), target: t };
}
let tween = null, userMoved = false;
function tweenPose(pos, target, ms, onDone, arc = 0) {
  tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, start: performance.now(), dur: ms, onDone, arc };
}
function tweenTo(name, ms = 900) { const p = viewPose(name); tweenPose(p.pos, p.target, ms); }
controls.addEventListener('start', () => { userMoved = true; tween = null; });
$$('[data-view]').forEach(b => b.addEventListener('click', () => {
  if (iso.id) setIsolation(null);
  userMoved = b.dataset.view !== 'home'; tweenTo(b.dataset.view, 800);
}));

/* ---------------- Isolation: fly one key up for a 360° view ---------------- */
const REDUCED = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
const FLY_S = REDUCED ? 0.35 : 1.25, ISO_H = 3.2;
const LIMITS = { min: controls.minDistance, max: controls.maxDistance, polar: controls.maxPolarAngle };
const iso = { id: null, fade: 1, saved: null, autoSpin: true, relaxed: false };
function relaxLimits() { iso.relaxed = true; controls.minDistance = 1.1; controls.maxDistance = 16; controls.maxPolarAngle = Math.PI; }
function restoreLimits() { iso.relaxed = false; controls.minDistance = LIMITS.min; controls.maxDistance = LIMITS.max; controls.maxPolarAngle = LIMITS.polar; }
function isoPose(k) {
  const r = k.obj.rest, S = new THREE.Vector3(r.x, r.y + ISO_H + 0.12, r.z);
  const vf = camera.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  const d = Math.max((Math.max(k.w, k.h) * 0.5 + 0.4) / Math.tan(hf / 2), (k.h * 0.5 + 0.35) / Math.tan(vf / 2)) * 1.2;
  return { pos: S.clone().add(new THREE.Vector3(0.5, 0.8, 1).normalize().multiplyScalar(d)), target: S };
}
function setIsolation(k) {
  const prev = iso.id, next = k ? k.id : null;
  if (next === prev) { updateIsoUI(); return; }
  if (k && !prev) iso.saved = { pos: camera.position.clone(), target: controls.target.clone() };
  if (k) relaxLimits();
  iso.id = next; hovered = null; tip.hidden = true; controls.autoRotate = false;
  if (k) { const p = isoPose(k); tweenPose(p.pos, p.target, FLY_S * 1000, null, REDUCED ? 0 : 2.4); }
  else if (iso.saved) tweenPose(iso.saved.pos, iso.saved.target, FLY_S * 1000, null, REDUCED ? 0 : 2.4);
  updateIsoUI();
}
function updateIsoUI() {
  const on = !!iso.id;
  $('#isoToggle').checked = on;
  $('#isoBar').hidden = !on; $('#viewBar').hidden = on;
  viewport.classList.toggle('isolated', on);
  updateHint();
}
const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 128;
{ const g = glowCanvas.getContext('2d'), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.45, 'rgba(255,255,255,.35)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128); }
const glowMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, depthWrite: false, opacity: 0, toneMapped: false });
const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMat); glow.rotation.x = -Math.PI / 2; glow.visible = false; scene.add(glow);
function setOpacity(m, o, keepTransparent) {
  if (m.userData.o === o) return;
  m.userData.o = o;
  const tr = keepTransparent || o < 0.999;
  if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
  m.opacity = o;
}
const approach = (v, t, step) => v < t ? Math.min(t, v + step) : Math.max(t, v - step);

function onResize() {
  const host = renderer.domElement.parentElement || viewport, r = host.getBoundingClientRect();
  const w = Math.max(1, r.width), h = Math.max(1, r.height);
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  if (!userMoved && !tween && !iso.id) { const p = viewPose('home'); camera.position.copy(p.pos); controls.target.copy(p.target); }
}
const resizeObs = new ResizeObserver(onResize); resizeObs.observe(viewport);
onResize();

/* ---------------- Sound ---------------- */
let actx = null, soundOn = true, noiseBuf = null;
function ensureAudio() {
  try {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      noiseBuf = actx.createBuffer(1, actx.sampleRate * 0.08, actx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (actx.state === 'suspended') actx.resume();
  } catch (e) { actx = null; }
}
function keySound(k, up) {
  if (!soundOn || !actx) return;
  try {
    const t = actx.currentTime;
    const src = actx.createBufferSource(); src.buffer = noiseBuf;
    const bp = actx.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = (up ? 3400 : 2300) + Math.random() * 500 - Math.min(k.w, 3) * 180; bp.Q.value = 1.3;
    const g = actx.createGain(); g.gain.setValueAtTime(up ? 0.1 : 0.26, t); g.gain.exponentialRampToValueAtTime(0.001, t + (up ? 0.025 : 0.045));
    src.connect(bp).connect(g).connect(actx.destination); src.start(t); src.stop(t + 0.07);
    if (!up) {
      const o = actx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(190 - Math.min(k.w, 3) * 28, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.06);
      const og = actx.createGain(); og.gain.setValueAtTime(0.16, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      o.connect(og).connect(actx.destination); o.start(t); o.stop(t + 0.08);
    }
  } catch (e) {}
}
$('#soundBtn').addEventListener('click', e => { soundOn = !soundOn; e.currentTarget.setAttribute('aria-pressed', soundOn); });

/* ---------------- Typing output ---------------- */
const tapeEl = $('#tape');
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function renderTape() {
  if (!text) { tapeEl.classList.add('empty'); tapeEl.textContent = 'Type on your keyboard or click the keys…'; }
  else { tapeEl.classList.remove('empty'); tapeEl.innerHTML = esc(text.slice(-1500)).replace(/\t/g, '    ') + '<span class="caret"></span>'; tapeEl.scrollTop = tapeEl.scrollHeight; }
  let top = null; keys.forEach(k => { if (k.presses && (!top || k.presses > top.presses)) top = k; });
  $('#stats').textContent = `${strokes} keystroke${strokes === 1 ? '' : 's'}` + (top ? ` · most pressed: ${niceName(top)} (${top.presses})` : '');
}
function appendText(ch) { text += ch; if (text.length > 4000) text = text.slice(-3000); renderTape(); }
function backspace() { const a = [...text]; a.pop(); text = a.join(''); renderTape(); }
function setLatched(on) { oneShotShift = on; byId.ShiftLeft.latched = byId.ShiftRight.latched = on; }
function toggleCaps(v) { capsOn = v === undefined ? !capsOn : v; if (byId.CapsLock) drawLegend(byId.CapsLock); }
function emitFromKey(k, shift) {
  if (k.act === 'bksp') return backspace();
  if (k.act === 'caps') return toggleCaps();
  if (k.act === 'shift') return;
  let ch = shift ? k.outShift : k.out;
  if (capsOn && k.out.length === 1 && k.out.toLowerCase() !== k.out.toUpperCase()) ch = shift ? k.out : k.outShift;
  if (ch) appendText(ch.replace(/\\n/g, '\n'));
}
$('#clearTape').addEventListener('click', () => { text = ''; renderTape(); });
const niceName = k => (k.label && k.label.trim()) ? k.label : (k.id === 'Space' ? 'Space' : k.id);

/* ---------------- Undo / persistence ---------------- */
const STORE = 'keycap-studio-v1';
let route = 'none';
function snapObj() {
  return { app: 'keycapgen', v: 4, model: state.model, colorway: state.colorway, case: state.case, deck: state.deck,
    keys: Object.fromEntries(keys.map(k => [k.id, { ...Object.fromEntries(FIELDS.map(f => [f, k[f]])), paint: k.paintData || null, skin: k.skin || null, hideLegend: !!k.hideLegend }])) };
}
function snapshot() { return JSON.stringify(snapObj()); }
function snapshotWithImages() {
  const o = snapObj(), used = {};
  keys.forEach(k => { if (k.skin && !k.skin.id.startsWith('sample:') && images[k.skin.id]) used[k.skin.id] = images[k.skin.id]; });
  o.images = used; return JSON.stringify(o);
}
const HEX = /^#[0-9a-f]{6}$/i;
function restore(json) {
  const d = typeof json === 'string' ? JSON.parse(json) : json;
  if (!d || typeof d.keys !== 'object') throw new Error('That JSON is not a keycapgen design.');
  if (d.images && typeof d.images === 'object') Object.entries(d.images).forEach(([id, src]) => { if (typeof src === 'string' && src.startsWith('data:image/') && !id.startsWith('sample:')) images[id] = src; });
  const mid = MODELS[d.model] ? d.model : 'studio75';
  if (mid !== state.model || !keys.length) { buildModel(mid); userMoved = false; tweenTo('home', 700); }
  state.colorway = COLORWAYS[d.colorway] ? d.colorway : null;
  if (HEX.test(d.case || '')) setCase(d.case, HEX.test(d.deck || '') ? d.deck : null);
  keys.forEach(k => {
    const kd = d.keys[k.id]; if (!kd) return;
    ['label','sub','out','outShift'].forEach(f => { if (kd[f] !== undefined) k[f] = String(kd[f]).slice(0, 16); });
    ['cap','ink'].forEach(f => { if (HEX.test(kd[f] || '')) k[f] = kd[f]; });
    if (FONT_IDS.includes(kd.font)) k.font = kd.font;
    if (Number.isFinite(+kd.size)) k.size = Math.min(1.8, Math.max(0.4, +kd.size));
    if (kd.bold !== undefined) k.bold = !!kd.bold;
    if (['center','top-left','bottom-left'].includes(kd.align)) k.align = kd.align;
    k.hideLegend = !!kd.hideLegend;
    if (typeof kd.paint === 'string' && kd.paint.startsWith('data:image/')) { if (kd.paint !== k.paintData) loadPaint(k, kd.paint, (+d.v || 1) < 4); }
    else { k.paint = null; k.paintData = null; }
    const sk = kd.skin, okCrop = sk && sk.crop && ['x','y','w','h'].every(n => Number.isFinite(+sk.crop[n]));
    k.skin = (sk && typeof sk.id === 'string' && images[sk.id] && ['cover','contain','stretch','span'].includes(sk.mode))
      ? { id: sk.id, mode: sk.mode, wrap: sk.wrap === 'whole' ? 'whole' : 'top', bg: HEX.test(sk.bg || '') ? sk.bg : null,
          ...(okCrop ? { crop: { x: +sk.crop.x, y: +sk.crop.y, w: +sk.crop.w, h: +sk.crop.h } } : {}) } : null;
  });
  refreshAll(); renderColorways(); renderInspector();
}
let saveT = 0;
function scheduleSave() {
  if (typeof renderQuote === 'function') renderQuote();
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    let ok = true; try { localStorage.setItem(STORE, snapshotWithImages()); } catch (e) { ok = !(e && (e.name === 'QuotaExceededError' || e.code === 22)); }
    $('#saveWarn').hidden = ok;
  }, 400);
}
const undoStack = [], redoStack = []; let lastTag = null, lastAt = 0, suppressUndo = false;
function pushUndo(tag) {
  if (suppressUndo) return;
  const now = Date.now();
  if (tag && tag === lastTag && now - lastAt < 1000) { lastAt = now; return; }
  undoStack.push(snapshot()); if (undoStack.length > 60) undoStack.shift();
  redoStack.length = 0; lastTag = tag || null; lastAt = now; updateUndoUI();
}
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); lastTag = null; updateUndoUI(); scheduleSave(); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); lastTag = null; updateUndoUI(); scheduleSave(); }
function updateUndoUI() { $('#undoBtn').disabled = !undoStack.length; $('#redoBtn').disabled = !redoStack.length; }
$('#undoBtn').addEventListener('click', undo);
$('#redoBtn').addEventListener('click', redo);

/* ---------------- Colorways ---------------- */
function applyColorway(name, { undo = true } = {}) {
  const cw = COLORWAYS[name]; if (!cw) return;
  if (undo) pushUndo();
  state.colorway = name;
  keys.forEach(k => { [k.cap, k.ink] = cw[k.group]; refreshKey(k); });
  setCase(cw.case, cw.deck); renderColorways(); renderInspector(); scheduleSave();
}
const cwButton = (id, cw) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'cw'; b.dataset.cw = id;
  b.title = cw.set ? `${cw.name} (${cw.set}-inspired, approximate colors)` : cw.name;
  b.innerHTML = `<span class="dots"><i style="background:${cw.alpha[0]}"></i><i style="background:${cw.mod[0]}"></i><i style="background:${cw.accent[0]}"></i><i class="case-dot" style="background:${cw.case}"></i></span><span class="cw-name">${cw.name}</span>${cw.set ? `<span class="cw-set">${cw.set}</span>` : ''}`;
  b.addEventListener('click', () => applyColorway(id));
  return b;
};
function renderColorways() {
  const host = $('#colorways');
  if (!host.children.length) GENERIC_IDS.forEach(id => host.appendChild(cwButton(id, COLORWAYS[id])));
  const ed = $('#editions');
  if (ed.dataset.model !== state.model) {
    ed.dataset.model = state.model; ed.innerHTML = '';
    model.editionIds.forEach(id => ed.appendChild(cwButton(id, COLORWAYS[id])));
  }
  $$('.cw').forEach(b => b.setAttribute('aria-pressed', b.dataset.cw === state.colorway));
}
$('#caseColor').addEventListener('input', e => { pushUndo('case'); setCase(e.target.value); scheduleSave(); });

/* ---------------- Keyboard models ---------------- */
function renderModelUI() {
  const sel = $('#modelSelect');
  if (!sel.options.length) sel.innerHTML = Object.entries(MODELS).map(([id, M]) => `<option value="${id}">${M.name}</option>`).join('');
  sel.value = state.model;
  const M = model, P = PROFILES[M.profile];
  $('#modelName').textContent = M.name;
  const heroTag = document.getElementById('heroTag'); if (heroTag) heroTag.textContent = `Live preview · ${M.name}`;
  $('#modelMaker').textContent = `${M.maker} · ${M.layout} · ${keys.length} keys`;
  $('#modelSig').textContent = M.signature;
  $('#modelFacts').innerHTML = [['Switches', M.switches], ['Keycaps', `${M.keycaps}`], ['Case', M.caseDesc], ['On top', M.extrasDesc], ['Size', `${+dims.W.toFixed(2)} × ${+dims.D.toFixed(2)}u key area`]]
    .map(([a, b]) => `<dt>${a}</dt><dd>${esc(b)}</dd>`).join('');
  renderColorways();
}
function switchModel(id) {
  if (!MODELS[id] || id === state.model) return;
  if (demo.running) stopDemo();
  pushUndo();
  hideCaption();
  buildModel(id);
  applyColorway(model.editionIds[0], { undo: false });
  refreshAll(); userMoved = false; tweenTo('home', 900);
  renderInspector(); renderTape(); updateIsoUI(); scheduleSave();
}
$('#modelSelect').addEventListener('change', e => switchModel(e.target.value));

/* ---------------- Selection & inspector ---------------- */
const selectedKeys = () => [...selection].map(id => byId[id]).filter(Boolean);
function select(k, additive) {
  if (additive) {
    if (selection.has(k.id)) { selection.delete(k.id); if (primary === k.id) primary = [...selection].pop() || null; }
    else { selection.add(k.id); primary = k.id; }
  } else { selection = new Set([k.id]); primary = k.id; }
  renderInspector();
}
function setSelection(list) { selection = new Set(list.map(k => k.id)); primary = list.length ? list[list.length - 1].id : null; renderInspector(); }
function clearSelection() { setSelection([]); }
$$('[data-q]').forEach(b => b.addEventListener('click', () => {
  const q = b.dataset.q, p = byId[primary];
  if (q === 'all') setSelection(keys);
  else if (q === 'alpha') setSelection(keys.filter(k => k.group === 'alpha'));
  else if (q === 'mod') setSelection(keys.filter(k => k.group !== 'alpha'));
  else if (q === 'row') { if (p) setSelection(keys.filter(k => k.row === p.row).sort((a, b) => (a.id === p.id) - (b.id === p.id))); }
  else clearSelection();
}));

const encOut = v => String(v).replace(/\n/g, '\\n').replace(/\t/g, '\\t');
const decOut = v => v.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
const fmtU = w => `${+w.toFixed(2)}u`;
function renderInspector() {
  const sel = selectedKeys();
  if (iso.id && primary !== iso.id) setIsolation(primary ? byId[primary] : null);
  $('#emptyState').hidden = sel.length > 0;
  $('#editor').hidden = sel.length === 0;
  if (!sel.length) return;
  const p = byId[primary] || sel[0];
  $('#isoSub').textContent = iso.id ? `${niceName(p)} is floating above the board. Uncheck to fly it back.`
    : sel.length > 1 ? `Fly ${niceName(p)} (last selected) up for a 360° view` : `Fly ${niceName(p)} up for a 360° view`;
  const same = f => sel.every(k => k[f] === p[f]);
  const chip = $('#selChip');
  chip.textContent = p.label || '␣'; chip.style.background = p.cap; chip.style.color = p.ink;
  chip.style.fontFamily = `${famCss(p.font)}, system-ui, sans-serif`; chip.style.fontWeight = p.bold ? 700 : 500;
  chip.style.fontSize = ([...p.label].length > 2 ? 0.72 : 1.3) * Math.min(1.3, p.size) + 'rem';
  const facts = $('#facts');
  if (sel.length === 1) {
    $('#selTitle').textContent = niceName(p);
    const P = PROFILES[model.profile];
    $('#selSub').textContent = `${p.code} · ${fmtU(p.w)}${p.h > 1 ? ' × ' + fmtU(p.h) : ''} · ${P.name}${P.sculpted ? ' ' + PROFILE_ROW[p.row] : ''}`;
    facts.innerHTML = [
      ['Code', p.code],
      ['Width', `${fmtU(p.w)} · ${(p.w * 19.05).toFixed(2)} mm pitch`],
      ['Position', `x ${p.x.toFixed(2)}u · y ${p.y.toFixed(2)}u`],
      ['Group', { alpha: 'Alpha', mod: 'Modifier', accent: 'Accent' }[p.group]],
      ['Sends', p.act ? { bksp: 'Delete previous character', caps: 'Toggle Caps Lock', shift: 'Shift modifier' }[p.act] : (p.out ? `"${esc(encOut(p.out))}"  /  "${esc(encOut(p.outShift))}"` : 'Nothing (navigation)')],
      ['Presses', String(p.presses)],
    ].map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('');
  } else {
    $('#selTitle').textContent = `${sel.length} keys selected`;
    const names = sel.map(niceName);
    $('#selSub').textContent = names.slice(0, 10).join(' ') + (names.length > 10 ? ` +${names.length - 10}` : '');
    const totalU = sel.reduce((a, k) => a + k.w, 0), pres = sel.reduce((a, k) => a + k.presses, 0);
    facts.innerHTML = [['Keys', String(sel.length)], ['Total width', `${+totalU.toFixed(2)}u`], ['Presses', String(pres)], ['Editing', 'Changes apply to every selected key']]
      .map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('');
  }
  ['label', 'sub', 'out', 'outShift'].forEach(f => {
    const el = $('#f-' + f), s = same(f);
    el.placeholder = s ? (f === 'sub' || f === 'outShift' ? 'none' : '') : 'Mixed';
    if (document.activeElement !== el) el.value = s ? (f.startsWith('out') ? encOut(p[f]) : p[f]) : '';
  });
  $('#f-cap').value = p.cap; $('#capHex').textContent = same('cap') ? p.cap : 'Mixed';
  $('#f-ink').value = p.ink; $('#inkHex').textContent = same('ink') ? p.ink : 'Mixed';
  $('#f-font').value = p.font;
  $('#f-size').value = p.size; $('#sizeOut').textContent = same('size') ? Math.round(p.size * 100) + '%' : 'Mixed';
  $$('#f-bold button').forEach(b => b.setAttribute('aria-pressed', same('bold') && String(p.bold) === b.dataset.v));
  $$('#f-align button').forEach(b => b.setAttribute('aria-pressed', same('align') && p.align === b.dataset.v));
  renderArt();
}
function applyField(field, value, opts = {}) {
  const sel = selectedKeys(); if (!sel.length) return;
  if (opts.undo !== false) pushUndo(field + ':' + [...selection].join(','));
  sel.forEach(k => {
    k[field] = value;
    if (field === 'cap') setCapColor(k);
    else if (field === 'font') { drawLegend(k); ensureFont(value).then(() => drawLegend(k)); }
    else if (field !== 'out' && field !== 'outShift') drawLegend(k);
  });
  if (field === 'cap' || field === 'ink') { state.colorway = null; renderColorways(); }
  scheduleSave(); renderInspector();
}
$('#f-font').innerHTML = FONTS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
['label', 'sub', 'out', 'outShift'].forEach(f => $('#f-' + f).addEventListener('input', e => applyField(f, f.startsWith('out') ? decOut(e.target.value) : e.target.value)));
['cap', 'ink'].forEach(f => $('#f-' + f).addEventListener('input', e => applyField(f, e.target.value)));
$('#f-font').addEventListener('change', e => applyField('font', e.target.value));
$('#f-size').addEventListener('input', e => applyField('size', +e.target.value));
$$('#f-bold button').forEach(b => b.addEventListener('click', () => applyField('bold', b.dataset.v === 'true')));
$$('#f-align button').forEach(b => b.addEventListener('click', () => applyField('align', b.dataset.v)));
$$('.swatches[data-for="cap"], .swatches[data-for="ink"]').forEach(host => {
  const f = host.dataset.for;
  SWATCHES.forEach(c => {
    const b = document.createElement('button'); b.type = 'button'; b.style.background = c; b.title = c; b.setAttribute('aria-label', `${f === 'cap' ? 'Cap' : 'Legend'} color ${c}`);
    b.addEventListener('click', () => applyField(f, c, { undo: true }));
    host.appendChild(b);
  });
});
$('#resetSel').addEventListener('click', () => {
  const sel = selectedKeys(); if (!sel.length) return;
  pushUndo();
  const cw = COLORWAYS[state.colorway] || COLORWAYS[model.editionIds[0]];
  sel.forEach(k => { Object.assign(k, k.def); [k.cap, k.ink] = cw[k.group]; k.skin = null; k.paint = null; k.paintData = null; k.hideLegend = false; refreshKey(k); });
  scheduleSave(); renderInspector();
});
$('#goInspect').addEventListener('click', () => setMode('inspect'));
$('#isoToggle').addEventListener('change', e => { setIsolation(e.target.checked ? (byId[primary] || selectedKeys()[0] || null) : null); renderInspector(); });
$('#isoBack').addEventListener('click', () => { setIsolation(null); renderInspector(); });
$('#isoSpin').addEventListener('click', e => { iso.autoSpin = !iso.autoSpin; e.currentTarget.setAttribute('aria-pressed', String(iso.autoSpin)); });

/* ---------------- Key art: drawing and skins ---------------- */
const images = {};      // id -> data URL (imported and sample skins)
const imgCache = {};    // id -> HTMLImageElement
const dirtyKeys = new Set();
let artTab = 'draw', brushTool = 'brush', brushColor = '#e0602f', brushSize = 14, paint3d = false, imgSeq = 0;
function markDirty(k) { dirtyKeys.add(k); }
function flushDirty() {
  if (!dirtyKeys.size) return;
  let padHit = false;
  dirtyKeys.forEach(k => { if (k.obj && byId[k.id] === k) drawLegend(k); if (k.id === primary) padHit = true; });
  dirtyKeys.clear();
  if (padHit) renderPad();
}
function loadImg(id) {
  const c = imgCache[id];
  if (c && c.complete && c.naturalWidth) return Promise.resolve(c);
  if (c && c._p) return c._p;
  if (!images[id]) return Promise.reject(new Error('missing image'));
  const img = new Image(); imgCache[id] = img;
  img._p = new Promise((res, rej) => { img.onload = () => res(img); img.onerror = rej; });
  img.src = images[id];
  return img._p;
}
function drawSkinAtlas(ctx, k, A) {
  const sk = k.skin, img = imgCache[sk.id];
  if (!img || !img.complete || !img.naturalWidth) { loadImg(sk.id).then(() => markDirty(k), () => {}); return; }
  // "Top only" fills every other surface with the skin's background color
  let R = { x: 0, y: 0, w: A.W, h: A.H };
  if (sk.wrap === 'top') { ctx.fillStyle = sk.bg || k.cap; ctx.fillRect(0, 0, A.W, A.H); R = A.top; }
  const iw = img.naturalWidth, ih = img.naturalHeight, m = sk.mode;
  ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
  if (m === 'span' && sk.crop) { const c = sk.crop; ctx.drawImage(img, c.x * iw, c.y * ih, c.w * iw, c.h * ih, R.x, R.y, R.w, R.h); }
  else if (m === 'stretch') ctx.drawImage(img, R.x, R.y, R.w, R.h);
  else if (m === 'contain') { const sc = Math.min(R.w / iw, R.h / ih), dw = iw * sc, dh = ih * sc; ctx.drawImage(img, R.x + (R.w - dw) / 2, R.y + (R.h - dh) / 2, dw, dh); }
  else { const sc = Math.max(R.w / iw, R.h / ih), sw = R.w / sc, sh = R.h / sc; ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, R.x, R.y, R.w, R.h); }
  ctx.restore();
}
// Background color of an image: the most common color along its border
const bgCache = {};
function detectBg(id) {
  if (bgCache[id]) return bgCache[id];
  const img = imgCache[id]; if (!img || !img.naturalWidth) return null;
  const N = 48, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, N, N);
  const d = g.getImageData(0, 0, N, N).data, buckets = new Map();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (x > 2 && y > 2 && x < N - 3 && y < N - 3) continue;
    const i = (y * N + x) * 4; if (d[i + 3] < 128) continue;
    const key = (d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | (d[i + 2] >> 4);
    const b = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 }; b.n++; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2]; buckets.set(key, b);
  }
  let best = null; buckets.forEach(b => { if (!best || b.n > best.n) best = b; });
  if (!best) return null;
  const hex = '#' + [best.r, best.g, best.b].map(v => Math.round(v / best.n).toString(16).padStart(2, '0')).join('');
  return (bgCache[id] = hex);
}

// Drawing layer, one transparent canvas per key at the legend's resolution
function ensurePaint(k) {
  if (!k.paint) { const { W, H } = atlasDims(k); k.paint = document.createElement('canvas'); k.paint.width = W; k.paint.height = H; }
  return k.paint;
}
function clearPaint(k) { k.paint = null; k.paintData = null; markDirty(k); }
function loadPaint(k, data, legacyTop) {
  k.paintData = data;
  const img = new Image();
  img.onload = () => {
    const c = ensurePaint(k), g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
    if (legacyTop) { const t = atlasDims(k).top; g.drawImage(img, t.x, t.y, t.w, t.h); k.paintData = c.toDataURL('image/png'); }  // older designs painted the top only
    else g.drawImage(img, 0, 0, c.width, c.height);
    markDirty(k);
  };
  img.src = data;
}
// position inside the top face (0..1) -> position on the whole-key atlas
function topUV(k, u, v) { const A = atlasDims(k); return [(A.top.x + u * A.top.w) / A.W, (A.top.y + v * A.top.h) / A.H]; }
// points of a ring that wraps around the key's sides, d world units below the top edge
function ringUV(k, d, steps = 120) {
  const A = atlasDims(k), t = A.top, rx = d * A.sx, ry = d * A.sy, pts = [];
  const per = 2 * (t.w + t.h) + Math.PI * (rx + ry);
  for (let i = 0; i <= steps; i++) {
    let L = i / steps * per, x, y;
    const segs = [[t.w, (l) => [t.x + l, t.y - ry]], [Math.PI / 2 * (rx + ry) / 2, (l) => { const a = -Math.PI / 2 + l / ((rx + ry) / 2); return [t.x + t.w + Math.cos(a) * rx, t.y + Math.sin(a) * ry]; }],
      [t.h, (l) => [t.x + t.w + rx, t.y + l]], [Math.PI / 2 * (rx + ry) / 2, (l) => { const a = l / ((rx + ry) / 2); return [t.x + t.w + Math.cos(a) * rx, t.y + t.h + Math.sin(a) * ry]; }],
      [t.w, (l) => [t.x + t.w - l, t.y + t.h + ry]], [Math.PI / 2 * (rx + ry) / 2, (l) => { const a = Math.PI / 2 + l / ((rx + ry) / 2); return [t.x + Math.cos(a) * rx, t.y + t.h + Math.sin(a) * ry]; }],
      [t.h, (l) => [t.x - rx, t.y + t.h - l]], [Math.PI / 2 * (rx + ry) / 2, (l) => { const a = Math.PI + l / ((rx + ry) / 2); return [t.x + Math.cos(a) * rx, t.y + Math.sin(a) * ry]; }]];
    for (const [len, f] of segs) { if (L <= len + 1e-9) { [x, y] = f(Math.min(L, len)); break; } L -= len; }
    if (x === undefined) [x, y] = [t.x, t.y - ry];
    pts.push([x / A.W, y / A.H]);
  }
  return pts;
}
function strokeOn(k, u0, v0, u1, v1) {
  const c = ensurePaint(k), g = c.getContext('2d');
  const x0 = u0 * c.width, y0 = v0 * c.height, x1 = u1 * c.width, y1 = v1 * c.height;
  g.save();
  g.globalCompositeOperation = brushTool === 'eraser' ? 'destination-out' : 'source-over';
  g.strokeStyle = g.fillStyle = brushColor; g.lineWidth = brushSize; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath();
  if (Math.hypot(x1 - x0, y1 - y0) < 0.5) { g.arc(x1, y1, brushSize / 2, 0, Math.PI * 2); g.fill(); }
  else { g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  g.restore(); markDirty(k);
}
function commitPaint(list) { list.forEach(k => { if (k.paint) k.paintData = k.paint.toDataURL('image/png'); }); scheduleSave(); }

// Drawing pad in the inspector (mirrors the primary key, paints every selected key)
const pad = $('#pad'), padCtx = pad.getContext('2d');
function renderPad() {
  const k = byId[primary];
  if (!k || !k.obj || artTab !== 'draw' || $('#editor').hidden) return;
  const A = atlasDims(k), aspect = A.W / A.H;
  const avail = Math.max(120, $('#padWrap').clientWidth - 22), maxH = 230;
  let cw = avail, ch = cw / aspect; if (ch > maxH) { ch = maxH; cw = ch * aspect; }
  const dpr = Math.min(2, window.devicePixelRatio || 1), pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
  if (pad.width !== pw || pad.height !== ph) { pad.width = pw; pad.height = ph; pad.style.width = cw + 'px'; pad.style.height = ch + 'px'; }
  padCtx.clearRect(0, 0, pw, ph);
  padCtx.drawImage(k.obj.canvas, 0, 0, pw, ph);
  // guides: the outer band is the bottom lip (mostly hidden), the dashed box is the top face
  const fx = pw / A.W, fy = ph / A.H, lx = A.a.Lb * A.sx * fx, ly = A.a.Lb * A.sy * fy;
  padCtx.fillStyle = 'rgba(0,0,0,.32)';
  padCtx.fillRect(0, 0, pw, ly); padCtx.fillRect(0, ph - ly, pw, ly); padCtx.fillRect(0, ly, lx, ph - 2 * ly); padCtx.fillRect(pw - lx, ly, lx, ph - 2 * ly);
  const t = { x: A.top.x * fx, y: A.top.y * fy, w: A.top.w * fx, h: A.top.h * fy };
  padCtx.save(); padCtx.setLineDash([4 * dpr, 3 * dpr]); padCtx.lineWidth = dpr;
  padCtx.strokeStyle = 'rgba(0,0,0,.45)'; padCtx.strokeRect(t.x + dpr, t.y + dpr, t.w, t.h);
  padCtx.strokeStyle = 'rgba(255,255,255,.85)'; padCtx.strokeRect(t.x, t.y, t.w, t.h);
  padCtx.setLineDash([]); padCtx.font = `600 ${9 * dpr}px "IBM Plex Mono", monospace`; padCtx.textAlign = 'center'; padCtx.textBaseline = 'middle';
  const label = (txt, x, y, rot) => { padCtx.save(); padCtx.translate(x, y); padCtx.rotate(rot || 0); padCtx.lineWidth = 3 * dpr; padCtx.lineJoin = 'round'; padCtx.strokeStyle = 'rgba(0,0,0,.55)'; padCtx.strokeText(txt, 0, 0); padCtx.fillStyle = 'rgba(255,255,255,.92)'; padCtx.fillText(txt, 0, 0); padCtx.restore(); };
  label('BACK', pw / 2, (t.y + ly) / 2 + ly / 2); label('FRONT', pw / 2, ph - ((ph - t.y - t.h - ly) / 2 + ly));
  label('LEFT', (t.x + lx) / 2 + lx / 2, ph / 2, -Math.PI / 2); label('RIGHT', pw - ((pw - t.x - t.w - lx) / 2 + lx), ph / 2, Math.PI / 2);
  padCtx.restore();
}
let padStroke = null;
const padUV = e => { const r = pad.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; };
pad.addEventListener('pointerdown', e => {
  const sel = selectedKeys(); if (!sel.length) return;
  e.preventDefault(); pad.setPointerCapture(e.pointerId);
  pushUndo();
  const [u, v] = padUV(e); padStroke = { u, v, keys: sel };
  sel.forEach(k => strokeOn(k, u, v, u, v));
});
pad.addEventListener('pointermove', e => {
  if (!padStroke) return;
  const [u, v] = padUV(e);
  padStroke.keys.forEach(k => strokeOn(k, padStroke.u, padStroke.v, u, v));
  padStroke.u = u; padStroke.v = v;
});
const endPad = () => { if (!padStroke) return; commitPaint(padStroke.keys); padStroke = null; };
pad.addEventListener('pointerup', endPad); pad.addEventListener('pointercancel', endPad);
window.addEventListener('resize', () => renderPad());

// Painting straight onto the 3D keys
let paintStroke = null;
function pickLegend(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const ik = iso.id && byId[iso.id];
  const hit = ray.intersectObjects(ik ? [ik.obj.cap] : pickables, false)[0];
  if (!hit || !hit.uv) return null;
  return { k: hit.object.userData.key, u: hit.uv.x, v: 1 - hit.uv.y };
}
function setPaint3d(on) {
  paint3d = on;
  $('#paint3d').checked = on; $('#paintDone').hidden = !on;
  viewport.classList.toggle('painting', on);
  if (on) tip.hidden = true;
  updateHint();
}
function beginPaint3d(e) {
  const h = pickLegend(e); if (!h) return false;
  controls.enabled = false; pushUndo();
  paintStroke = { k: h.k, u: h.u, v: h.v, touched: new Set([h.k]) };
  strokeOn(h.k, h.u, h.v, h.u, h.v);
  return true;
}
window.addEventListener('pointermove', e => {
  if (!paintStroke) return;
  const h = pickLegend(e);
  if (!h) { paintStroke.k = null; return; }
  if (h.k !== paintStroke.k) { paintStroke.k = h.k; paintStroke.u = h.u; paintStroke.v = h.v; }
  strokeOn(h.k, paintStroke.u, paintStroke.v, h.u, h.v);
  paintStroke.u = h.u; paintStroke.v = h.v; paintStroke.touched.add(h.k);
});
window.addEventListener('pointerup', () => { if (!paintStroke) return; commitPaint([...paintStroke.touched]); paintStroke = null; controls.enabled = true; });

// Skins
function skinMsg(t) { $('#skinNote').textContent = t; }
function defaultFit(list) {
  const n = (list || selectedKeys()).length;
  if (n > 1) return 'span';
  return state.skinFit && state.skinFit !== 'span' ? state.skinFit : 'cover';
}
function spanCrops(list, img, wrap) {
  const rects = list.map(k => {
    const a = atlasDims(k).a, tw = 2 * (wrap === 'top' ? a.TX : a.EX), td = 2 * (wrap === 'top' ? a.TY : a.EY), cx = k.x + k.w / 2, cy = k.y + k.h / 2;
    return { k, x0: cx - tw / 2, y0: cy - td / 2, tw, td };
  });
  const X0 = Math.min(...rects.map(r => r.x0)), Y0 = Math.min(...rects.map(r => r.y0));
  const BW = Math.max(...rects.map(r => r.x0 + r.tw)) - X0, BH = Math.max(...rects.map(r => r.y0 + r.td)) - Y0;
  const ia = img.naturalWidth / img.naturalHeight, ba = BW / BH;
  let rx = 0, ry = 0, rw = 1, rh = 1;
  if (ia > ba) { rw = ba / ia; rx = (1 - rw) / 2; } else { rh = ia / ba; ry = (1 - rh) / 2; }
  return rects.map(r => [r.k, { x: rx + (r.x0 - X0) / BW * rw, y: ry + (r.y0 - Y0) / BH * rh, w: r.tw / BW * rw, h: r.td / BH * rh }]);
}
async function applySkin(id, fit, list, opts = {}) {
  list = list || selectedKeys(); if (!list.length) { skinMsg('Select a key first, then add a skin.'); return; }
  let img; try { img = await loadImg(id); } catch (e) { skinMsg('That image could not be loaded. Try another file.'); return; }
  const wrap = opts.wrap || state.skinWrap || 'whole', bg = opts.bg || detectBg(id) || '#202124';
  pushUndo();
  if (fit === 'span' && list.length > 1) spanCrops(list, img, wrap).forEach(([k, crop]) => { k.skin = { id, mode: 'span', crop, wrap, bg }; });
  else list.forEach(k => { k.skin = { id, mode: fit === 'span' ? 'cover' : fit, wrap, bg }; });
  list.forEach(markDirty);
  state.skinFit = fit; state.skinWrap = wrap;
  skinMsg(fit === 'span' && list.length > 1 ? `One picture now spans ${list.length} keys.` : `Skin applied to ${list.length === 1 ? niceName(list[0]) : list.length + ' keys'}.`);
  scheduleSave(); renderArt();
}
function importImageFile(file, list) {
  if (!file || !/^image\//.test(file.type)) { skinMsg('That file is not an image. Use a PNG, JPG, WebP, GIF or SVG.'); return; }
  const reader = new FileReader();
  reader.onerror = () => skinMsg('That image could not be read.');
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => skinMsg('That image could not be read.');
    img.onload = () => {
      const alpha = /png|webp|gif|svg/.test(file.type), max = alpha ? 1024 : 1600;
      const nw = img.naturalWidth || max, nh = img.naturalHeight || max, s = Math.min(1, max / Math.max(nw, nh));
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(nw * s)); c.height = Math.max(1, Math.round(nh * s));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const id = 'img' + Date.now().toString(36) + (imgSeq++);
      images[id] = c.toDataURL(alpha ? 'image/png' : 'image/jpeg', 0.9);
      applySkin(id, defaultFit(list), list);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

{
  const S = getSampleImages();
  SAMPLES.forEach(([id, name]) => {
    const sid = 'sample:' + id; images[sid] = S[id];
    const b = document.createElement('button'); b.type = 'button'; b.title = name; b.setAttribute('aria-label', `Sample skin: ${name}`);
    b.style.backgroundImage = `url(${images[sid]})`;
    b.addEventListener('click', () => applySkin(sid, defaultFit()));
    $('#samples').appendChild(b);
  });
}

function renderArt() {
  const sel = selectedKeys(); if (!sel.length) return;
  const p = byId[primary] || sel[0];
  $$('#artTabs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === artTab)));
  $('#artDraw').hidden = artTab !== 'draw'; $('#artSkin').hidden = artTab !== 'skin';
  $('#padNote').textContent = (sel.length > 1 ? `Strokes go on all ${sel.length} selected keys. ` : `This is ${niceName(p)} unfolded. `) + 'The top face is in the middle and the sides fold out around it; strokes flow over the edges.';
  $$('#brushTool button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === brushTool)));
  const fit = p.skin ? p.skin.mode : defaultFit(sel);
  $$('#skinFit button').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.fit === fit)); if (b.dataset.fit === 'span') b.disabled = sel.length < 2; });
  $('#removeSkin').disabled = !sel.some(k => k.skin);
  const wrap = p.skin ? (p.skin.wrap || 'top') : (state.skinWrap || 'whole');
  $$('#skinWrap button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.wrap === wrap)));
  $('#sideColorField').hidden = wrap !== 'top';
  const bg = (p.skin && p.skin.bg) || '#202124';
  $('#skinBg').value = bg; $('#skinBgHex').textContent = p.skin ? bg : 'Set when a skin is added';
  $('#skinBg').disabled = $('#skinBgAuto').disabled = !(p.skin && p.skin.wrap === 'top');
  $('#hideLegend').checked = !!p.hideLegend;
  renderPad();
}

// Art controls
$$('#artTabs button').forEach(b => b.addEventListener('click', () => { artTab = b.dataset.tab; renderArt(); }));
$$('#brushTool button').forEach(b => b.addEventListener('click', () => { brushTool = b.dataset.tool; renderArt(); }));
$('#brushColor').addEventListener('input', e => { brushColor = e.target.value; brushTool = 'brush'; renderArt(); });
$('#brushSize').addEventListener('input', e => { brushSize = +e.target.value; $('#brushOut').textContent = brushSize; });
{
  const host = $('.swatches[data-for="brush"]');
  SWATCHES.forEach(c => {
    const b = document.createElement('button'); b.type = 'button'; b.style.background = c; b.title = c; b.setAttribute('aria-label', `Brush color ${c}`);
    b.addEventListener('click', () => { brushColor = c; $('#brushColor').value = c; brushTool = 'brush'; renderArt(); });
    host.appendChild(b);
  });
}
$('#paint3d').addEventListener('change', e => setPaint3d(e.target.checked));
$('#paintDone').addEventListener('click', () => setPaint3d(false));
$('#fillPaint').addEventListener('click', () => {
  const sel = selectedKeys(); if (!sel.length) return;
  pushUndo();
  sel.forEach(k => { const c = ensurePaint(k), g = c.getContext('2d'); if (brushTool === 'eraser') g.clearRect(0, 0, c.width, c.height); else { g.fillStyle = brushColor; g.fillRect(0, 0, c.width, c.height); } markDirty(k); });
  commitPaint(sel);
});
$('#clearPaint').addEventListener('click', () => { const sel = selectedKeys(); if (!sel.length) return; pushUndo(); sel.forEach(clearPaint); scheduleSave(); });
$$('#skinFit button').forEach(b => b.addEventListener('click', () => {
  const sel = selectedKeys(), p = byId[primary];
  state.skinFit = b.dataset.fit;
  if (p && p.skin) applySkin(p.skin.id, b.dataset.fit, null, { wrap: p.skin.wrap || 'top', bg: p.skin.bg }); else renderArt();
}));
$$('#skinWrap button').forEach(b => b.addEventListener('click', () => {
  const p = byId[primary];
  state.skinWrap = b.dataset.wrap;
  if (p && p.skin) applySkin(p.skin.id, p.skin.mode, null, { wrap: b.dataset.wrap, bg: p.skin.bg }); else renderArt();
}));
$('#skinBg').addEventListener('input', e => {
  const list = selectedKeys().filter(k => k.skin && k.skin.wrap === 'top'); if (!list.length) return;
  pushUndo('skinbg'); list.forEach(k => { k.skin.bg = e.target.value; markDirty(k); }); $('#skinBgHex').textContent = e.target.value; scheduleSave();
});
$('#skinBgAuto').addEventListener('click', () => {
  const list = selectedKeys().filter(k => k.skin && k.skin.wrap === 'top'); if (!list.length) return;
  pushUndo(); list.forEach(k => { k.skin.bg = detectBg(k.skin.id) || k.skin.bg; markDirty(k); }); scheduleSave(); renderArt();
});
$('#isoPaint').addEventListener('click', () => {
  const p = byId[primary]; if (!p) return;
  setIsolation(p); renderInspector(); setPaint3d(true);
});
$('#removeSkin').addEventListener('click', () => {
  const sel = selectedKeys(); if (!sel.some(k => k.skin)) return;
  pushUndo(); sel.forEach(k => { k.skin = null; markDirty(k); }); skinMsg('Skin removed.'); scheduleSave(); renderArt();
});
$('#hideLegend').addEventListener('change', e => { const sel = selectedKeys(); if (!sel.length) return; pushUndo(); sel.forEach(k => { k.hideLegend = e.target.checked; markDirty(k); }); scheduleSave(); });
$('#skinFile').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (f) importImageFile(f); e.target.value = ''; });
{
  const dz = $('#dropzone');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) importImageFile(f); });
  // drop an image straight onto a key in the 3D view
  viewport.addEventListener('dragover', e => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
  viewport.addEventListener('drop', e => {
    const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (!f) return;
    e.preventDefault();
    const k = pick(e);
    let list;
    if (k) { if (selection.has(k.id) && selection.size > 1) list = selectedKeys(); else { select(k, false); list = [k]; } }
    else list = selectedKeys();
    if (!list.length) { say('Drop the image onto a key, or select keys first.', [{ label: 'OK', fn: hideCaption }]); return; }
    artTab = 'skin'; importImageFile(f, list);
  });
  document.addEventListener('paste', e => {
    if (route !== 'customize' || isField(e.target)) return;
    const it = e.clipboardData && [...e.clipboardData.items].find(i => i.type.startsWith('image/'));
    if (!it) return;
    e.preventDefault();
    if (!selectedKeys().length) { say('Select a key first, then paste the image again.', [{ label: 'OK', fn: hideCaption }]); return; }
    artTab = 'skin'; importImageFile(it.getAsFile()); renderArt();
  });
}

/* ---------------- Board actions ---------------- */
$('#exportBtn').addEventListener('click', e => {
  const btn = e.currentTarget, json = snapshotWithImages();
  const fallback = () => { $('#importBox').hidden = false; $('#importToggle').setAttribute('aria-expanded', 'true'); const ta = $('#importText'); ta.value = json; ta.focus(); ta.select(); $('#importMsg').textContent = 'Copy the selected JSON.'; };
  try {
    navigator.clipboard.writeText(json).then(() => { btn.textContent = 'Copied'; setTimeout(() => btn.textContent = 'Copy design JSON', 1500); }, fallback);
  } catch (err) { fallback(); }
});
$('#importToggle').addEventListener('click', e => { const box = $('#importBox'); box.hidden = !box.hidden; e.currentTarget.setAttribute('aria-expanded', String(!box.hidden)); });
$('#importApply').addEventListener('click', () => {
  const msg = $('#importMsg');
  try { const s = snapshot(); restore($('#importText').value); undoStack.push(s); redoStack.length = 0; updateUndoUI(); scheduleSave(); msg.textContent = 'Design applied.'; }
  catch (err) { msg.textContent = err instanceof SyntaxError ? 'That is not valid JSON. Check for a missing bracket or quote.' : err.message; }
});
let resetArmed = 0;
$('#resetAll').addEventListener('click', e => {
  const b = e.currentTarget;
  if (Date.now() - resetArmed > 3000) { resetArmed = Date.now(); b.textContent = 'Click again to reset all keys'; setTimeout(() => b.textContent = 'Reset everything', 3000); return; }
  resetArmed = 0; b.textContent = 'Reset everything';
  pushUndo();
  keys.forEach(k => { Object.assign(k, k.def); k.skin = null; k.paint = null; k.paintData = null; k.hideLegend = false; });
  applyColorway(model.editionIds[0], { undo: false });
  refreshAll();
});

/* ---------------- Modes & hint ---------------- */
function setMode(m) {
  mode = m;
  $$('#modeSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  updateHint();
}
$$('#modeSeg button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
function updateHint() {
  const h = $('#hint'), focused = document.hasFocus();
  h.classList.toggle('warn', !focused);
  const t = paint3d ? `Painting · ${brushTool === 'eraser' ? 'erasing' : 'drag across any key'} · drag empty space to orbit`
    : iso.id ? `Isolated · ${niceName(byId[iso.id])} · drag to orbit 360°, scroll to zoom`
    : !focused ? 'Click the board, then type on your keyboard'
    : mode === 'play' ? 'Play · click keys or type on your keyboard' : 'Inspect · click a key · Shift-click to add more';
  h.innerHTML = `<span class="dot"></span>${t}`;
}
window.addEventListener('focus', updateHint);
window.addEventListener('blur', () => { updateHint(); releaseAllPhysical(); });

/* ---------------- Pointer interaction ---------------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const ik = iso.id && byId[iso.id];
  const hit = ray.intersectObjects(ik ? [ik.obj.cap] : pickables, false)[0];
  return hit ? hit.object.userData.key : null;
}
let down = null, hovered = null;
const tip = $('#tip');
viewport.addEventListener('pointerdown', e => {
  if (e.target !== renderer.domElement) return;
  if (demo.running) stopDemo();
  ensureAudio(); window.focus();
  if (paint3d) { beginPaint3d(e); down = null; return; }
  const k = pick(e);
  down = { x: e.clientX, y: e.clientY, key: k };
  if (k && mode === 'play') {
    controls.enabled = false;
    k.down = true; k.presses++; strokes++; keySound(k, false);
    if (k.act === 'shift') setLatched(!oneShotShift);
    else { emitFromKey(k, oneShotShift || physShift); if (oneShotShift && !k.act) setLatched(false); }
    if (selection.has(k.id)) renderInspector();
  } else if (!k && !iso.id && spinners.length) {
    // knobs, dials and rollers turn a notch when clicked
    const hit = ray.intersectObjects(spinners.map(sp => sp.mesh), false)[0];
    if (hit) {
      const sp = spinners.find(s => s.mesh === hit.object || s.mesh === hit.object.parent);
      if (sp) { sp.target += (e.shiftKey ? -1 : 1) * Math.PI / 8; keySound({ w: 0.6 }, true); controls.enabled = false; down.spin = true; }
    }
  }
}, true);
window.addEventListener('pointerup', e => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6;
  if (down.spin) controls.enabled = true;
  if (mode === 'play' && down.key) { down.key.down = false; keySound(down.key, true); controls.enabled = true; renderTape(); }
  else if (mode === 'inspect' && !moved && !down.spin) {
    const k = pick(e);
    if (k) { select(k, e.shiftKey || e.metaKey || e.ctrlKey); tapVisual(k); }
    else if (!e.shiftKey && !iso.id) clearSelection();
  }
  down = null;
});
renderer.domElement.addEventListener('pointermove', e => {
  if (route !== 'customize') return;
  if (e.buttons) { tip.hidden = true; return; }
  if (paint3d) { const h = pickLegend(e); hovered = h ? h.k : null; viewport.style.cursor = h ? 'crosshair' : 'grab'; tip.hidden = true; return; }
  const k = pick(e); hovered = k;
  viewport.style.cursor = k ? 'pointer' : 'grab';
  if (k && e.pointerType === 'mouse') {
    const r = viewport.getBoundingClientRect();
    tip.hidden = false;
    tip.textContent = `${niceName(k)} · ${k.code} · ${fmtU(k.w)}`;
    const x = Math.min(e.clientX - r.left, r.width - tip.offsetWidth - 24);
    tip.style.left = x + 'px'; tip.style.top = (e.clientY - r.top) + 'px';
  } else tip.hidden = true;
});
renderer.domElement.addEventListener('pointerleave', () => { hovered = null; tip.hidden = true; });
function tapVisual(k) { k.down = true; keySound(k, false); setTimeout(() => { k.down = false; keySound(k, true); }, 110); }

/* ---------------- Physical keyboard ---------------- */
const physByCode = {};
const isField = el => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
function resolveKey(e) {
  if (e.code && e.code.startsWith('Numpad') && byId[e.code]) return byId[e.code];
  if (e.key && e.key.length === 1 && charMap.has(e.key)) return charMap.get(e.key);
  return byId[e.code] || null;
}
function releaseAllPhysical() { Object.keys(physByCode).forEach(c => { physByCode[c].physDown = false; delete physByCode[c]; }); physShift = false; }
window.addEventListener('keydown', e => {
  if (route !== 'customize' || isField(e.target)) return;
  if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
  if (e.ctrlKey || e.metaKey) return;
  const k = resolveKey(e); if (!k) return;
  e.preventDefault();
  if (demo.running) stopDemo();
  ensureAudio();
  if (e.getModifierState) { const c = e.getModifierState('CapsLock'); if (c !== capsOn) toggleCaps(c); }
  if (k.act === 'shift') physShift = true;
  if (!e.repeat) { k.physDown = true; physByCode[e.code] = k; k.presses++; strokes++; keySound(k, false); }
  if (mode === 'inspect') {
    if (!e.repeat && !['ShiftLeft','ShiftRight','ControlLeft','ControlRight','AltLeft','AltRight','MetaLeft'].includes(k.id)) select(k, false);
    renderTape(); return;
  }
  if (k.act === 'bksp') backspace();
  else if (k.act === 'caps' || k.act === 'shift') renderTape();
  else if (k.out) {
    const custom = k.out !== k.def.out || k.outShift !== k.def.outShift;
    if (!custom && e.key.length === 1) appendText(e.key);
    else emitFromKey(k, e.shiftKey);
  } else renderTape();
  if (selection.has(k.id)) renderInspector();
});
window.addEventListener('keyup', e => {
  const k = physByCode[e.code];
  if (k) { k.physDown = false; delete physByCode[e.code]; keySound(k, true); }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') physShift = false;
});

/* ---------------- Caption ---------------- */
function say(msg, actions = []) {
  $('#caption').hidden = false; $('#captionText').textContent = msg;
  const acts = $('#captionActs'); acts.innerHTML = '';
  actions.forEach(a => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn small' + (a.primary ? ' primary' : ''); b.textContent = a.label; b.addEventListener('click', a.fn); acts.appendChild(b); });
}
const hideCaption = () => { $('#caption').hidden = true; };

/* ---------------- Guided demo ---------------- */
const demo = { running: false, token: 0, before: null };
const STOP = Symbol('stop');
function stopDemo() { demo.token++; }
function updateDemoBtn() { $('#demoBtn').textContent = demo.running ? '■ Stop demo' : '▶ Run demo'; }
async function runDemo() {
  if (demo.running) { stopDemo(); return; }
  ensureAudio(); window.focus();
  const tok = ++demo.token;
  demo.running = true; demo.before = snapshot(); updateDemoBtn();
  pushUndo('demo'); suppressUndo = true;
  const step = async ms => { await new Promise(r => setTimeout(r, ms)); if (demo.token !== tok) throw STOP; };
  const press = async (k, shift) => {
    const sh = byId.ShiftLeft;
    if (shift) { sh.down = true; keySound(sh, false); await step(60); }
    k.down = true; k.presses++; strokes++; keySound(k, false);
    emitFromKey(k, shift);
    await step(55 + Math.random() * 45);
    k.down = false; keySound(k, true);
    if (shift) { sh.down = false; strokes++; sh.presses++; }
    await step(45 + Math.random() * 70);
  };
  const typeStr = async s => { for (const ch of s) { const k = charMap.get(ch); if (k) await press(k, ch === k.def.outShift && ch !== k.def.out); } };
  const typeField = async (field, s) => {
    const el = $('#f-' + field); el.classList.add('flash');
    applyField(field, '', { undo: false });
    const chars = [...s];
    for (let i = 1; i <= chars.length; i++) { const v = chars.slice(0, i).join(''); applyField(field, v, { undo: false }); el.value = field.startsWith('out') ? encOut(v) : v; await step(85); }
    el.classList.remove('flash');
  };
  try {
    clearSelection(); setMode('play'); setLatched(false);
    say('1 of 7 · Typing. Every character presses its 3D key, just like your own keyboard will.');
    tweenTo('front', 1000); await step(1150);
    await typeStr('Hello, Ibrahim!'); await press(byId.Enter, false); await typeStr('Every key is live.');
    await step(700);

    say('2 of 7 · Colorways restyle the whole board in one click. There are 21 keycap sets plus each model’s stock finishes.');
    tweenTo('side', 1600);
    for (const cw of ['olivia-light', 'laser', 'botanical', 'red-samurai', 'mizu', model.editionIds[0]]) { await step(800); applyColorway(cw, { undo: false }); }
    await step(900);

    setMode('inspect'); tweenTo('home', 1100);
    say('3 of 7 · Inspect mode. Click a key to read its code, size and legend, then edit it.');
    await step(1300);
    select(byId.Escape); tapVisual(byId.Escape); await step(1000);
    for (const c of ['#f2d04b', '#3c9a5f', '#2f6fd6']) { applyField('cap', c, { undo: false }); await step(420); }
    applyField('ink', '#ffffff', { undo: false }); await step(300);
    await typeField('label', '✦'); await step(900);

    say('4 of 7 · Shift-click selects several keys. Edits apply to all of them.');
    for (const id of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) { select(byId[id], id !== 'KeyW'); tapVisual(byId[id]); await step(320); }
    await step(300);
    applyField('cap', '#e0602f', { undo: false }); await step(380);
    applyField('ink', '#1d1f23', { undo: false }); await step(380);
    applyField('font', 'Bebas Neue', { undo: false }); await step(380);
    applyField('size', 1.3, { undo: false }); await step(900);
    select(byId.Space); tapVisual(byId.Space); await step(600);
    applyField('font', 'Caveat', { undo: false }); applyField('size', 1.35, { undo: false });
    await typeField('label', 'hello, ibrahim'); await step(900);

    say('5 of 7 · Change what a key sends. Q now types ω, and Ω with Shift.');
    select(byId.KeyQ); tapVisual(byId.KeyQ); await step(600);
    applyField('cap', '#6b4fbf', { undo: false }); applyField('ink', '#ffffff', { undo: false }); applyField('font', 'Fraunces', { undo: false });
    await typeField('label', 'Ω'); await typeField('out', 'ω'); await typeField('outShift', 'Ω');
    await step(700);
    clearSelection(); setMode('play'); tweenTo('front', 900); await step(1000);
    await press(byId.Enter, false); await typeStr('Remapped: '); await press(byId.KeyQ, false); await press(byId.Space, false); await press(byId.KeyQ, true);
    await step(800);

    say('6 of 7 · Isolate a key. It flies up and the camera circles it so you can see every side, stem included.');
    setMode('inspect'); tweenTo('home', 900); await step(1000);
    select(byId.KeyQ); await step(500);
    setIsolation(byId.KeyQ); renderInspector();
    await step(FLY_S * 1000 + 4200);
    setIsolation(null); renderInspector();
    await step(FLY_S * 1000 + 300);
    clearSelection();

    say('7 of 7 · Key art. Wrap one picture across many keys, or paint straight onto a cap.');
    tweenTo('home', 900);
    setSelection(keys.filter(k => /^Key[A-Z]$/.test(k.id))); artTab = 'skin'; renderArt(); await step(900);
    await applySkin('sample:sunset', 'span'); await step(1700);
    const escKey = byId.Escape, keep = [brushColor, brushSize, brushTool];
    select(escKey); artTab = 'draw'; renderArt(); await step(500);
    escKey.hideLegend = true; markDirty(escKey);
    brushColor = '#ffffff'; brushSize = 20; brushTool = 'brush';
    const T = (u, v) => topUV(escKey, u, v);
    strokeOn(escKey, ...T(.34, .36), ...T(.34, .36)); await step(160); strokeOn(escKey, ...T(.66, .36), ...T(.66, .36)); await step(160);
    let prev = null;
    for (let i = 0; i <= 30; i++) { const a = Math.PI * 0.18 + i / 30 * Math.PI * 0.64, pt = T(0.5 + Math.cos(a) * 0.27, 0.4 + Math.sin(a) * 0.3); if (prev) strokeOn(escKey, prev[0], prev[1], pt[0], pt[1]); prev = pt; if (i % 3 === 0) await step(35); }
    commitPaint([escKey]);
    say('7 of 7 · Drawing and skins cover the whole key, not just the top. Here a stripe wraps around every side.');
    setIsolation(escKey); renderInspector(); await step(FLY_S * 1000 + 300);
    brushColor = '#f2d04b'; brushSize = 26;
    const ring = ringUV(escKey, atlasDims(escKey).a.Lb + atlasDims(escKey).a.Lw * 0.45);
    for (let i = 1; i < ring.length; i++) { strokeOn(escKey, ring[i - 1][0], ring[i - 1][1], ring[i][0], ring[i][1]); if (i % 4 === 0) await step(30); }
    await step(3200);
    setIsolation(null); renderInspector(); await step(FLY_S * 1000 + 200);
    commitPaint([escKey]); [brushColor, brushSize, brushTool] = keep;
    await step(1500);
    clearSelection();
    tweenTo('home', 900);
    finishDemo('Demo finished. Your turn: type on your keyboard, or switch to Inspect and click any key.');
  } catch (err) {
    if (err !== STOP) console.error(err);
    finishDemo('Demo stopped.');
  }
}
function finishDemo(msg) {
  demo.running = false; suppressUndo = false; updateDemoBtn();
  keys.forEach(k => { k.down = false; }); setLatched(false); controls.enabled = true;
  renderTape(); scheduleSave();
  const before = demo.before;
  say(msg, [
    { label: 'Restore my design', fn: () => { restore(before); scheduleSave(); hideCaption(); } },
    { label: 'Keep demo changes', primary: true, fn: hideCaption },
  ]);
}
$('#demoBtn').addEventListener('click', runDemo);

/* ---------------- Render loop ---------------- */
let last = performance.now(), boardIn = 1;
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (route !== 'home' && route !== 'customize') { requestAnimationFrame(loop); return; }
  if (tween) {
    const t = Math.min(1, (now - tween.start) / tween.dur), e = ease(t);
    camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0, tween.t1, e);
    if (tween.arc) camera.position.y += Math.sin(Math.PI * e) * tween.arc;
    if (t >= 1) { const done = tween.onDone; tween = null; if (done) done(); }
  }
  if (iso.relaxed && !iso.id && !tween) restoreLimits();
  const isoKey = iso.id ? byId[iso.id] : null;
  controls.autoRotate = route === 'home' ? !tween : !!(isoKey && iso.autoSpin && isoKey.fly === 1 && !tween && !paint3d);
  controls.autoRotateSpeed = route === 'home' ? 0.8 : 1.6;
  controls.update();

  // Board fades out while a key is isolated, and back in on return
  iso.fade = approach(iso.fade, isoKey ? 0 : 1, dt / (FLY_S * (isoKey ? 0.4 : 0.8)));
  const bf = iso.fade, boardOn = bf > 0.002;
  ground.material.opacity = groundOpacity * bf;
  fadeMats.forEach(m => setOpacity(m, bf));
  // new model drops into place; knobs and rollers ease toward their turned angle
  if (boardIn < 1) { boardIn = Math.min(1, boardIn + dt / (REDUCED ? 0.01 : 0.7)); board.position.y = (1 - ease(boardIn)) * 1.6; }
  spinners.forEach(sp => { sp.cur += (sp.target - sp.cur) * Math.min(1, dt * 10); sp.mesh.rotation[sp.axis] = sp.cur; });
  caseParts.forEach(m => { m.visible = boardOn; });
  caseCasters.forEach(m => { m.castShadow = bf > 0.5; });

  const pulse = 0.5 + 0.5 * Math.sin(now / 240);
  const kSpeed = Math.min(1, dt * 32);
  let glowKey = null;
  for (const k of keys) {
    const o = k.obj, sel = selection.has(k.id), isIso = k === isoKey;
    // flight: up, spin a full turn, level out; reverse on the way back
    const flyT = isIso ? 1 : 0;
    if (k.fly !== flyT) k.fly = approach(k.fly, flyT, dt / FLY_S);
    k.bob = approach(k.bob, isIso && k.fly === 1 ? 1 : 0, dt * 1.5);
    const e = ease(k.fly), r = o.rest;
    o.root.position.set(r.x, r.y + e * ISO_H + Math.sin(now / 650) * 0.035 * k.bob, r.z);
    o.root.rotation.x = r.tilt * (1 - e);
    o.root.rotation.y = REDUCED ? 0 : e * Math.PI * 2;
    if (k.fly > 0 && (!glowKey || k.fly > glowKey.fly || isIso)) glowKey = k;

    const op = (k.fly > 0 || isIso) ? 1 : bf;
    setOpacity(o.mat, op); setOpacity(o.stemMat, op);
    o.root.visible = op > 0.002; o.sw.visible = boardOn;
    o.mat.userData.cast !== (op > 0.5) && (o.cap.castShadow = o.mat.userData.cast = op > 0.5);

    const isDown = k.down || k.physDown || k.latched;
    const target = isDown ? -PRESS : (sel && !isIso) ? SEL_LIFT : 0;
    o.y += (target - o.y) * kSpeed; o.mover.position.y = o.y;
    const f = (sel && !isIso) ? 0.12 + 0.1 * pulse : (k === hovered ? (isIso ? 0.03 : 0.06) : 0);
    o.mat.emissive.copy(sel && !isIso ? accentLin : white).multiplyScalar(f);
    o.ring.visible = sel && k.fly === 0 && boardOn;
  }
  if (glowKey) {
    const r = glowKey.obj.rest, e = ease(glowKey.fly);
    glow.visible = true; glow.position.set(r.x, r.y + ISO_H - 0.42, r.z);
    glow.scale.set(glowKey.w + 1.8, 2.4, 1);
    glowMat.color.copy(accentLin); glowMat.opacity = 0.5 * e;
  } else glow.visible = false;
  flushDirty();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}


/* ---------------- Price quote + add to cart ---------------- */
let editingBoard = null;
function boardQuote() {
  const cw = COLORWAYS[state.colorway];
  const keycaps = !cw ? 19 : cw.set ? 39 : 0;
  const keycapLabel = !cw ? 'Custom colors' : cw.set ? `${cw.name} keycap set` : `${cw.name} keycaps`;
  const artKeys = keys.filter(k => k.skin || k.paintData).length;
  const legends = keys.filter(k => k.label !== k.def.label || k.sub !== k.def.sub).length;
  return { base: model.price, keycaps, keycapLabel, artKeys, art: artKeys * 2, legends, total: model.price + keycaps + artKeys * 2 };
}
function renderQuote() {
  if (!model) return;
  const q = boardQuote();
  $('#czPrice').textContent = money(q.total);
  $('#czBreak').textContent = [`Board ${money(q.base)}`, q.keycaps ? `${q.keycapLabel} +${money(q.keycaps)}` : `${q.keycapLabel} included`, q.artKeys ? `Art on ${q.artKeys} key${q.artKeys > 1 ? 's' : ''} +${money(q.art)}` : null].filter(Boolean).join(' · ');
  $('#czAdd').textContent = editingBoard ? 'Update cart item' : 'Add to cart';
}
function captureBoard() {
  try {
    renderer.render(scene, camera);
    const src = renderer.domElement, c = document.createElement('canvas'), w = 360;
    c.width = w; c.height = Math.max(1, Math.round(w * src.height / Math.max(1, src.width)));
    const g = c.getContext('2d'); g.fillStyle = '#eef1f8'; g.fillRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.82);
  } catch (e) { return null; }
}
$('#czAdd').addEventListener('click', () => {
  const q = boardQuote();
  const lines = [q.keycapLabel, q.artKeys ? `Custom art on ${q.artKeys} key${q.artKeys > 1 ? 's' : ''}` : null, q.legends ? `${q.legends} custom legend${q.legends > 1 ? 's' : ''}` : null].filter(Boolean);
  upsert({ id: editingBoard || uid(), type: 'board', model: state.model, name: model.name, lines, price: q.total, qty: 1, keepQty: true, thumb: captureBoard(), design: snapshotWithImages() });
  toast(editingBoard ? `Updated ${model.name} in your cart` : `Added your ${model.name} to the cart`);
  editingBoard = null; renderQuote();
});

/* ---------------- Mounting into Astro pages ---------------- */
let observed = null;
function mountCanvas(host) {
  const el = renderer.domElement;
  if (el.parentElement !== host) host.prepend(el);
  if (observed !== host) { if (observed) resizeObs.unobserve(observed); observed = host; resizeObs.observe(host); }
}

/* ---------------- Mobile mini preview ---------------- */
// On narrow screens, once the viewer is scrolled up out of sight, the live canvas moves into a small
// floating card so edits further down stay visible. Drag it around, tap it to scroll back, or close it;
// a closed card stays away until the viewer has been seen again.
const pip = $('#pip'), pipStage = $('#pipStage'), mobileMq = matchMedia('(max-width: 900px)');
const pipState = { out: false, dismissed: false, x: null, y: null };
const navBottom = () => { const nav = document.querySelector('.nav'); return nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0; };
function syncPip() {
  const on = route === 'customize' && mobileMq.matches && pipState.out && !pipState.dismissed;
  if (on === pip.hidden) { pip.hidden = !on; if (on) placePip(); }
  if (route === 'customize') mountCanvas(on ? pipStage : viewport);
}
function checkPip() {
  if (route !== 'customize' || !viewport.isConnected) return;
  // only when scrolled down past it: the viewer sits above the screen (or under the sticky nav)
  const out = viewport.getBoundingClientRect().bottom <= navBottom();
  if (out === pipState.out) return;
  pipState.out = out;
  if (!out) pipState.dismissed = false;
  syncPip();
}
function placePip(x = pipState.x, y = pipState.y) {
  const w = pip.offsetWidth, h = pip.offsetHeight, m = 12, vw = document.documentElement.clientWidth, vh = innerHeight;
  if (x == null) { x = vw - w - m; y = vh - h - m * 2; }
  pipState.x = Math.min(Math.max(m, x), vw - w - m);
  pipState.y = Math.min(Math.max(navBottom() + m, y), vh - h - m);
  pip.style.translate = `${pipState.x}px ${pipState.y}px`;
}
function dismissPip() { pipState.dismissed = true; syncPip(); }
function backToViewer() { viewport.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' }); }
let pipDrag = null;
pip.addEventListener('pointerdown', e => {
  if (e.target.closest('.pip-close')) return;
  pipDrag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: pipState.x, y: pipState.y, moved: false };
  pip.setPointerCapture(e.pointerId);
});
pip.addEventListener('pointermove', e => {
  if (!pipDrag || e.pointerId !== pipDrag.id) return;
  const dx = e.clientX - pipDrag.sx, dy = e.clientY - pipDrag.sy;
  if (!pipDrag.moved && Math.hypot(dx, dy) < 6) return;
  pipDrag.moved = true; pip.classList.add('dragging');
  placePip(pipDrag.x + dx, pipDrag.y + dy);
});
const endPipDrag = e => {
  if (!pipDrag || e.pointerId !== pipDrag.id) return;
  const tap = !pipDrag.moved && e.type === 'pointerup';
  pipDrag = null; pip.classList.remove('dragging');
  if (tap) backToViewer();
};
pip.addEventListener('pointerup', endPipDrag);
pip.addEventListener('pointercancel', endPipDrag);
pip.addEventListener('keydown', e => {
  if (e.target !== pip) return;
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); backToViewer(); }
  else if (e.key === 'Escape') dismissPip();
});
$('#pipClose').addEventListener('click', e => { e.stopPropagation(); dismissPip(); });
document.addEventListener('scroll', checkPip, { passive: true, capture: true });
addEventListener('resize', () => { if (!pip.hidden) placePip(); checkPip(); });
mobileMq.addEventListener('change', syncPip);

function attach() {
  const cz = document.querySelector('[data-studio="customize"]'), hero = document.querySelector('[data-studio="hero"]'), el = renderer.domElement;
  if (cz) {
    if (root.parentElement !== cz) cz.replaceChildren(root);
    route = 'customize';
    pipState.out = pipState.dismissed = false; pip.hidden = true;
    mountCanvas(viewport);
    controls.enableZoom = true; controls.enablePan = true; el.style.touchAction = 'none';
  } else if (hero) {
    if (demo.running) stopDemo();
    if (iso.id) setIsolation(null);
    if (paint3d) setPaint3d(false);
    route = 'home';
    mountCanvas(hero);
    controls.enableZoom = false; controls.enablePan = false; el.style.touchAction = 'pan-y';
    const t = document.getElementById('heroTag'); if (t) t.textContent = `Live preview · ${model.name}`;
  } else { detach(); return; }
  userMoved = false; onResize();
  const p = viewPose('home'); camera.position.copy(p.pos); controls.target.copy(p.target); tween = null;
  controls.update(); renderer.render(scene, camera);
  if (route === 'customize') { renderQuote(); renderInspector(); updateHint(); checkPip(); }
}
function detach() { if (demo.running) stopDemo(); route = 'none'; }
function selectModel(mid) { if (mid !== state.model) switchModel(mid); editingBoard = null; renderQuote(); }
function loadDesign(json, cartId, fallbackModel) {
  editingBoard = cartId || null;
  if (json) { try { pushUndo(); restore(json); scheduleSave(); return true; } catch (e) { /* fall through */ } }
  if (fallbackModel) switchModel(fallbackModel);
  renderQuote(); return false;
}

/* ---------------- Boot ---------------- */
let restored = false;
try { const s = localStorage.getItem(STORE); if (s) { restore(s); restored = true; } } catch (e) { restored = false; }
if (!restored) { buildModel('studio75'); applyColorway(model.editionIds[0], { undo: false }); }
{ const p = viewPose('home'); camera.position.copy(p.pos); controls.target.copy(p.target); tween = null; userMoved = false; }
refreshAll(); renderColorways(); renderInspector(); renderTape(); updateHint(); updateUndoUI(); renderQuote();
requestAnimationFrame(loop);
window.__ks = { keys, byId, runDemo, setMode, select, applyField, switchModel, applyColorway, MODELS, COLORWAYS,
  screenOf: id => { const k = byId[id]; const v = new THREE.Vector3(); k.obj.cap.getWorldPosition(v); v.y += CAP.h; v.project(camera); const r = renderer.domElement.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; } };

export { attach, detach, selectModel, applyColorway, loadDesign };
