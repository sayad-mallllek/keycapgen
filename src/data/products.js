// Accessory catalog: real products, their stock finishes, the custom options we add, and pricing.
// Dimensions and colorways come from maker spec sheets and reviews (colors are visual estimates).
// Prices are example prices for this prototype store.

export const CATS = [
  { id: 'keyboards', name: 'Keyboards', blurb: '9 layouts, every key yours' },
  { id: 'mice', name: 'Mice', blurb: 'Shells, buttons, engraving' },
  { id: 'mats', name: 'Desk mats', blurb: 'Print your art or pick a felt' },
  { id: 'audio', name: 'Headsets & stands', blurb: 'Color-matched audio' },
  { id: 'cables', name: 'Cables & cases', blurb: 'Coiled cables, carry cases' },
];
// Custom colors offered on top of each product's stock finishes
export const SHELLS = [
  { v: '#2447d6', label: 'Royal' }, { v: '#c7cdd8', label: 'Fog' }, { v: '#e0602f', label: 'Ember' }, { v: '#3c9a5f', label: 'Moss' },
  { v: '#d4689a', label: 'Petal' }, { v: '#f2d04b', label: 'Signal' }, { v: '#6b4fbf', label: 'Violet' }, { v: '#0e7a6b', label: 'Teal' },
];
const stock = list => list.map(([v, label]) => ({ v, label, stock: true }));
const custom = (extra = 0) => SHELLS.map(c => ({ ...c, price: extra || undefined }));
export const PRINTS = [['sunset', 'Synth sunset'], ['blueprint', 'Blueprint'], ['marble', 'Marble'], ['topo', 'Topo map'], ['confetti', 'Confetti']];

export const PRODUCTS = [
  {
    id: 'pro-x-superlight-2', cat: 'mice', brand: 'Logitech G', name: 'Pro X Superlight 2', price: 159, kind: 'mouse', model: 'superlight2',
    tag: 'Symmetrical 60 g wireless esports mouse',
    blurb: 'The featherweight symmetric shell pros grip in claw and fingertip styles. We repaint the shell and buttons separately, then add grip tape or an engraving.',
    signature: 'A featherlight 60 g symmetric shell with a magnetic charging puck hidden underneath.',
    specs: [['Size', '125 × 63.5 × 40 mm'], ['Weight', '60 g'], ['Buttons', '5, two on the left side'], ['Feet', 'Zero-additive PTFE']],
    options: [
      { id: 'shell', label: 'Shell', type: 'swatch', choices: [...stock([['#1a1a1a', 'Black'], ['#f2f2ef', 'White'], ['#d6247a', 'Magenta']]), ...custom(12)], def: '#1a1a1a' },
      { id: 'buttons', label: 'Buttons', type: 'swatch', choices: [...stock([['#1a1a1a', 'Black'], ['#f2f2ef', 'White'], ['#d6247a', 'Magenta']]), ...custom(8)], def: '#1a1a1a' },
      { id: 'finish', label: 'Finish', type: 'choice', choices: [{ v: 'Matte' }, { v: 'Gloss', price: 6 }], def: 'Matte' },
      { id: 'grip', label: 'Grip tape on the sides', type: 'toggle', price: 9, def: false },
      { id: 'engrave', label: 'Engraving', type: 'text', max: 12, price: 5, def: '', placeholder: 'Up to 12 characters' },
    ],
  },
  {
    id: 'deathadder-v4-pro', cat: 'mice', brand: 'Razer', name: 'DeathAdder V4 Pro', price: 169, kind: 'mouse-ergo', model: 'deathadder',
    tag: 'Right-hand ergonomic wireless mouse',
    blurb: 'The classic right-handed palm-filler shape at 56 g. Pick shell and button colors, then add grip tape or an engraving.',
    signature: 'The classic DeathAdder palm-filler, now 56 g with a true 8 kHz wireless link.',
    specs: [['Size', '128 × 68 × 44 mm'], ['Weight', '56 g'], ['Controls', '8 programmable, two on the left side'], ['Replaces', 'DeathAdder V3 Pro (same shell)']],
    options: [
      { id: 'shell', label: 'Shell', type: 'swatch', choices: [...stock([['#121212', 'Black'], ['#ededea', 'White'], ['#44d62c', 'Esports Green']]), ...custom(12)], def: '#121212' },
      { id: 'buttons', label: 'Buttons', type: 'swatch', choices: [...stock([['#121212', 'Black'], ['#ededea', 'White'], ['#44d62c', 'Esports Green']]), ...custom(8)], def: '#121212' },
      { id: 'finish', label: 'Finish', type: 'choice', choices: [{ v: 'Matte' }, { v: 'Gloss', price: 6 }], def: 'Matte' },
      { id: 'grip', label: 'Grip tape on the sides', type: 'toggle', price: 9, def: false },
      { id: 'engrave', label: 'Engraving', type: 'text', max: 12, price: 5, def: '', placeholder: 'Up to 12 characters' },
    ],
  },
  {
    id: 'mx-master-4', cat: 'mice', brand: 'Logitech', name: 'MX Master 4', price: 119, kind: 'mouse-ergo', model: 'mxmaster',
    tag: 'Productivity mouse with a haptic thumb rest',
    blurb: 'A sculpted palm mouse with a steel MagSpeed wheel, a side thumb wheel and a haptic panel in the thumb rest. Color the body and thumb rest separately.',
    signature: 'A haptic panel built into the thumb rest gives a tiny click you feel but never press.',
    specs: [['Size', '128.2 × 88.4 × 50.8 mm'], ['Weight', '150 g'], ['Wheels', 'Steel MagSpeed wheel and side thumb wheel'], ['Replaces', 'MX Master 3S']],
    options: [
      { id: 'shell', label: 'Body', type: 'swatch', choices: [...stock([['#3b3c3f', 'Graphite'], ['#d8d6d1', 'Pale Grey'], ['#1c1c1e', 'Space Black'], ['#e6e6e3', 'White Silver']]), ...custom(12)], def: '#3b3c3f' },
      { id: 'thumb', label: 'Thumb rest', type: 'swatch', choices: [...stock([['#3b3c3f', 'Graphite'], ['#d8d6d1', 'Pale Grey'], ['#1c1c1e', 'Space Black'], ['#e6e6e3', 'White Silver']]), ...custom(6)], def: '#3b3c3f' },
      { id: 'wheel', label: 'Main wheel', type: 'choice', choices: [{ v: 'Steel', color: '#b9bcc1' }, { v: 'Graphite steel', color: '#46484d' }, { v: 'Royal anodized', color: '#2447d6', price: 8 }], def: 'Steel' },
      { id: 'engrave', label: 'Engraving', type: 'text', max: 12, price: 5, def: '', placeholder: 'Up to 12 characters' },
    ],
  },
  {
    id: 'qck-heavy-xxl', cat: 'mats', brand: 'SteelSeries', name: 'QcK Heavy XXL', price: 49, kind: 'mat', model: 'qck',
    tag: 'Thick cloth gaming mat, printed to order',
    blurb: 'The esports-standard micro-woven cloth on a thick rubber base. Keep it black, print one of our patterns or your own image, and add stitched edges.',
    signature: 'The esports-standard black cloth slab, thick enough to soften every swipe.',
    specs: [['Surface', 'Micro-woven cloth'], ['Base', 'Non-slip rubber'], ['Edges', 'Cut edges, or stitched to order'], ['Sizes', 'XXL 900 × 400 × 4 mm, Large 450 × 400 × 6 mm']],
    options: [
      { id: 'size', label: 'Size', type: 'choice', choices: [{ v: 'XXL', label: 'XXL · 900 × 400 × 4 mm', mm: [900, 400, 4] }, { v: 'Large', label: 'Large · 450 × 400 × 6 mm', mm: [450, 400, 6], price: -15 }], def: 'XXL' },
      { id: 'print', label: 'Print', type: 'print', price: 12, def: 'solid' },
      { id: 'color', label: 'Cloth color', type: 'swatch', choices: [...stock([['#0e0e0f', 'Black']]), ...custom()], def: '#0e0e0f', showIf: o => o.print === 'solid' },
      { id: 'stitch', label: 'Stitched edges', type: 'toggle', price: 8, def: false },
      { id: 'stitchColor', label: 'Stitching color', type: 'swatch', choices: [...stock([['#0e0e0f', 'Black'], ['#f2f2ef', 'White']]), ...custom()], def: '#2447d6', showIf: o => o.stitch },
    ],
  },
  {
    id: 'wool-felt-desk-pad', cat: 'mats', brand: 'Grovemade', name: 'Wool Felt Desk Pad', price: 70, kind: 'mat', model: 'felt',
    tag: 'Merino wool felt with a leather tag',
    blurb: 'Dense German Merino felt with a vegetable-tanned leather tag. Choose the size, felt color and tag, and we can stamp your initials on the tag.',
    signature: 'Dense Merino felt that quietly warms the whole desk.',
    specs: [['Material', 'German Merino wool felt, 3–3.5 mm'], ['Tag', 'Vegetable-tanned leather'], ['Edges', 'Square-cut raw edges']],
    options: [
      { id: 'size', label: 'Size', type: 'choice', choices: [
        { v: 'Small', label: 'Small · 629 × 279 mm', mm: [629, 279, 3.3] }, { v: 'Medium', label: 'Medium · 965 × 292 mm', mm: [965, 292, 3.3], price: 20 },
        { v: 'Medium Plus', label: 'Medium Plus · 965 × 400 mm', mm: [965, 400, 3.3], price: 40 }, { v: 'Large', label: 'Large · 978 × 660 mm', mm: [978, 660, 3.3], price: 80 },
        { v: 'XL', label: 'XL · 1245 × 673 mm', mm: [1245, 673, 3.3], price: 110 }], def: 'Medium' },
      { id: 'felt', label: 'Felt', type: 'swatch', choices: [...stock([['#4a4a4c', 'Dark Grey'], ['#a8a8a5', 'Light Grey']]), { v: '#1f2a44', label: 'Navy', price: 10 }, { v: '#2f4a3a', label: 'Forest', price: 10 }, { v: '#2447d6', label: 'Royal', price: 10 }], def: '#4a4a4c' },
      { id: 'tag', label: 'Leather tag', type: 'choice', choices: [{ v: 'Tan', color: '#b0794a' }, { v: 'Black', color: '#1f1c1a' }], def: 'Tan' },
      { id: 'mono', label: 'Initials on the tag', type: 'text', max: 3, price: 8, def: '', placeholder: 'Up to 3 letters' },
    ],
  },
  {
    id: 'arctis-nova-pro-omni', cat: 'audio', brand: 'SteelSeries', name: 'Arctis Nova Pro Omni', price: 399, kind: 'headset', model: 'arctis',
    tag: 'Wireless headset with swappable cup plates',
    blurb: 'A steel band over a ski-goggle suspension strap, pill-shaped cups and magnetic outer plates. We make the plates in any color.',
    signature: 'A swappable battery behind a magnetic cup plate means it never needs to stop for charging.',
    specs: [['Size', '87 × 172 × 210 mm'], ['Weight', '339 g'], ['Mic', 'Retractable boom, left cup'], ['Replaces', 'Arctis Nova Pro Wireless']],
    options: [
      { id: 'frame', label: 'Headset color', type: 'swatch', choices: stock([['#1c1c1e', 'Black'], ['#ecebe8', 'White'], ['#1f2a44', 'Midnight Blue']]), def: '#1c1c1e' },
      { id: 'plates', label: 'Magnetic cup plates', type: 'swatch', choices: [...stock([['#1c1c1e', 'Black'], ['#ecebe8', 'White'], ['#1f2a44', 'Midnight Blue']]), ...custom(19)], def: '#1c1c1e' },
      { id: 'cushion', label: 'Cushions', type: 'choice', choices: [{ v: 'Leatherette', color: '#26272b' }, { v: 'Light grey leatherette', color: '#8c8c8c' }, { v: 'Fabric', color: '#5f646d', price: 24 }], def: 'Leatherette' },
      { id: 'mic', label: 'Show the mic extended', type: 'toggle', price: 0, def: false },
    ],
  },
  {
    id: 'pro-x-2-lightspeed', cat: 'audio', brand: 'Logitech G', name: 'Pro X 2 Lightspeed', price: 249, kind: 'headset', model: 'gprox2',
    tag: 'Esports headset with aluminum forks',
    blurb: 'Round cups with machined aluminum caps on a steel-sprung band. Choose the headset color, anodize the caps and pick which pads come fitted.',
    signature: 'Esports-classic round aluminum cups on a steel-sprung band.',
    specs: [['Size', '176 × 95 × 189 mm'], ['Weight', '345 g'], ['Drivers', '50 mm graphene'], ['Mic', 'Detachable boom with windscreen']],
    options: [
      { id: 'frame', label: 'Headset color', type: 'swatch', choices: stock([['#1a1a1a', 'Black'], ['#f0f0ee', 'White'], ['#d6247a', 'Magenta']]), def: '#1a1a1a' },
      { id: 'plates', label: 'Aluminum caps', type: 'swatch', choices: [...stock([['#2b2b2d', 'Black'], ['#e8e8e6', 'White'], ['#d6247a', 'Magenta']]), { v: '#c9ccd2', label: 'Raw silver', price: 15 }, { v: '#2447d6', label: 'Royal', price: 15 }, { v: '#c9a24a', label: 'Gold', price: 15 }, { v: '#3c9a5f', label: 'Moss', price: 15 }], def: '#2b2b2d' },
      { id: 'cushion', label: 'Fitted pads', type: 'choice', choices: [{ v: 'Leatherette', color: '#222225' }, { v: 'Velour', color: '#3a3d44' }], def: 'Leatherette' },
      { id: 'mic', label: 'Boom mic attached', type: 'toggle', price: 0, def: true },
    ],
  },
  {
    id: 'wood-headphone-stand', cat: 'audio', brand: 'Grovemade', name: 'Wood Headphone Stand', price: 220, kind: 'stand', model: 'grovemade',
    tag: 'Hardwood saddle on a steel and leather foot',
    blurb: 'A sculpted hardwood upright on a leather-inlaid stainless steel foot. Choose the wood and leather, and add an engraving.',
    signature: 'A sculpted hardwood saddle anchored by a leather-inlaid steel foot.',
    specs: [['Size', '229 mm tall, 146 mm wide, base 98 × 114 mm'], ['Weight', '1.02 kg'], ['Materials', 'Hardwood, stainless steel, leather, cork']],
    options: [
      { id: 'wood', label: 'Wood', type: 'choice', choices: [{ v: 'Walnut', color: '#5a3e2b' }, { v: 'Maple', color: '#e3c89c' }, { v: 'Oak', color: '#c9a877' }, { v: 'Black', color: '#1f1b19' }], def: 'Walnut' },
      { id: 'leather', label: 'Leather inlay', type: 'choice', choices: [{ v: 'Black', color: '#1d1b1a' }, { v: 'Tan', color: '#b57e4e' }], def: 'Black' },
      { id: 'engrave', label: 'Engraving', type: 'text', max: 16, price: 15, def: '', placeholder: 'Up to 16 characters' },
    ],
  },
  {
    id: 'coiled-aviator-cable', cat: 'cables', brand: 'Keychron', name: 'Coiled Aviator Cable', price: 15, kind: 'cable', model: 'keychron',
    tag: 'Coiled USB-C cable with a GX12 aviator',
    blurb: 'A braided coiled cable with a knurled five-pin aviator coupling. Pick one of eleven sleeve colors and the connector finish.',
    signature: 'A tight coil and a knurled aviator coupling, a desk-setup favourite.',
    specs: [['Length', 'About 90 cm straight plus a 46 cm coil'], ['Connectors', 'USB-C both ends, USB-A adapter included'], ['Coupling', '5-pin GX12 aviator']],
    options: [
      { id: 'sleeve', label: 'Sleeve', type: 'swatch', choices: stock([['#151515', 'Black'], ['#8e8e8e', 'Grey'], ['#f2f2f2', 'White'], ['#2f5da8', 'Blue'], ['#f3a6b8', 'Pink'], ['#f7cad3', 'Light Pink'], ['#f08a24', 'Orange'], ['#f4d35e', 'Yellow'], ['#b9a6e0', 'Light Purple'], ['#a8dcc4', 'Mint'], ['#a9cbea', 'Light Blue']]), def: '#2f5da8' },
      { id: 'metal', label: 'Connector finish', type: 'swatch', choices: [{ v: '#bfc1c3', label: 'Silver', stock: true }, { v: '#2a2c31', label: 'Black', price: 3 }, { v: '#c9a24a', label: 'Gold', price: 3 }, { v: '#2447d6', label: 'Royal', price: 3 }], def: '#bfc1c3' },
      { id: 'plug', label: 'Keyboard plug', type: 'choice', choices: [{ v: 'Straight' }, { v: 'Angled' }], def: 'Straight' },
    ],
  },
  {
    id: 'keyboard-carrying-case', cat: 'cables', brand: 'Keychron', name: 'Keyboard Carrying Case', price: 31, kind: 'case', model: 'keychron',
    tag: 'Made-to-measure EVA case for your board',
    blurb: 'A semi-rigid EVA clamshell with a canvas cover, sized to your keyboard. Choose the canvas color and zip pull, and add a monogram.',
    signature: 'A made-to-measure EVA shell that turns a 75% board into a carry-on.',
    specs: [['Shell', 'Semi-rigid EVA with canvas cover'], ['Depth', '55 mm'], ['Fits', 'Keychron Q, V, K and P models']],
    options: [
      { id: 'size', label: 'Fits', type: 'choice', choices: [
        { v: 'Q1', label: 'Q1 family · 420 × 199 mm', mm: [420, 199, 55] }, { v: 'Q6', label: 'Q6 family · 490 × 200 mm', mm: [490, 200, 55], price: 4 },
        { v: 'K2', label: 'K2 · 367 × 203 mm', mm: [367, 203, 55] }, { v: 'K8', label: 'K8 · 415 × 203 mm', mm: [415, 203, 55] }], def: 'Q1' },
      { id: 'color', label: 'Canvas', type: 'swatch', choices: [...stock([['#2b2b2d', 'Charcoal']]), ...custom(6)], def: '#2b2b2d' },
      { id: 'pull', label: 'Zip pull', type: 'swatch', choices: [...stock([['#2b2b2d', 'Charcoal']]), ...SHELLS], def: '#2447d6' },
      { id: 'mono', label: 'Monogram', type: 'text', max: 3, price: 5, def: '', placeholder: 'Up to 3 letters' },
    ],
  },
];
export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
export const defaultsOf = p => Object.fromEntries(p.options.map(o => [o.id, o.def]));
export const choiceOf = (p, id, v) => { const o = p.options.find(x => x.id === id); return o && o.choices ? o.choices.find(c => c.v === v) : null; };
export function priceOf(p, cfg) {
  let t = p.price;
  p.options.forEach(o => {
    const v = cfg[o.id];
    if (o.showIf && !o.showIf(cfg)) return;
    if (o.type === 'choice' || o.type === 'swatch') { const c = o.choices.find(c => c.v === v); if (c && c.price) t += c.price; }
    else if (o.type === 'toggle' && v) t += o.price;
    else if (o.type === 'text' && v && String(v).trim()) t += o.price;
    else if (o.type === 'print' && v && v !== 'solid') t += o.price || 0;
  });
  return t;
}
export function summaryOf(p, cfg) {
  return p.options.filter(o => !o.showIf || o.showIf(cfg)).map(o => {
    const v = cfg[o.id];
    if (o.type === 'swatch' || o.type === 'choice') { const c = o.choices.find(c => c.v === v) || {}; return `${o.label}: ${c.label || c.v || v}${c.stock ? ' (stock)' : ''}`; }
    if (o.type === 'toggle') return v && o.price ? o.label : null;
    if (o.type === 'text') return v && v.trim() ? `${o.label}: “${v.trim()}”` : null;
    if (o.type === 'print') return `Print: ${v === 'solid' ? 'None (solid cloth)' : v === 'upload' ? 'Your image' : (PRINTS.find(x => x[0] === v) || [, v])[1]}`;
    return null;
  }).filter(Boolean);
}
