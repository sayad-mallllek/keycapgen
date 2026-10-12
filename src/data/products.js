// Accessory catalog: categories, option definitions and pricing rules.

export const CATS = [
  { id: 'keyboards', name: 'Keyboards', blurb: '9 layouts, every key yours' },
  { id: 'mice', name: 'Mice', blurb: 'Shells, buttons, engraving' },
  { id: 'mats', name: 'Desk mats', blurb: 'Print a set or your own art' },
  { id: 'audio', name: 'Headsets & stands', blurb: 'Color-matched audio' },
  { id: 'cables', name: 'Cables & cases', blurb: 'Coiled cables, carry cases' },
];
export const SHELLS = [
  { v: '#16181f', label: 'Carbon' }, { v: '#f1f1ee', label: 'Arctic' }, { v: '#2447d6', label: 'Royal' }, { v: '#c7cdd8', label: 'Fog' },
  { v: '#e0602f', label: 'Ember' }, { v: '#3c9a5f', label: 'Moss' }, { v: '#d4689a', label: 'Petal' }, { v: '#f2d04b', label: 'Signal' },
];
export const METALS = [{ v: '#c9ccd2', label: 'Silver' }, { v: '#2a2c31', label: 'Black' }, { v: '#2447d6', label: 'Royal', price: 4 }, { v: '#c9a24a', label: 'Gold', price: 4 }];
export const PRINTS = [['sunset', 'Synth sunset'], ['blueprint', 'Blueprint'], ['marble', 'Marble'], ['topo', 'Topo map'], ['confetti', 'Confetti']];

export const PRODUCTS = [
  { id: 'glide-58', cat: 'mice', name: 'Glide 58', tag: 'Lightweight symmetrical mouse', price: 79, kind: 'mouse',
    blurb: 'A 58 g symmetrical shell for claw and fingertip grips. Pick the shell and button colors separately, then add grip tape or an engraving.',
    specs: [['Weight', '58 g'], ['Sensor', '26,000 DPI optical'], ['Connection', '2.4 GHz wireless and USB-C'], ['Battery', 'Up to 90 hours']],
    options: [
      { id: 'shell', label: 'Shell color', type: 'swatch', choices: SHELLS, def: '#16181f' },
      { id: 'buttons', label: 'Button color', type: 'swatch', choices: SHELLS, def: '#2447d6' },
      { id: 'finish', label: 'Finish', type: 'choice', choices: [{ v: 'Matte' }, { v: 'Gloss', price: 6 }], def: 'Matte' },
      { id: 'grip', label: 'Grip tape on the sides', type: 'toggle', price: 9, def: false },
      { id: 'engrave', label: 'Engraving', type: 'text', max: 12, price: 5, def: '', placeholder: 'Up to 12 characters' },
    ] },
  { id: 'arc-pro', cat: 'mice', name: 'Arc Pro', tag: 'Ergonomic right-hand mouse', price: 99, kind: 'mouse-ergo',
    blurb: 'A sculpted right-hand shape with a thumb rest. Color the shell, buttons and side grip to match your board.',
    specs: [['Weight', '79 g'], ['Sensor', '30,000 DPI optical'], ['Buttons', '6 programmable'], ['Battery', 'Up to 120 hours']],
    options: [
      { id: 'shell', label: 'Shell color', type: 'swatch', choices: SHELLS, def: '#f1f1ee' },
      { id: 'buttons', label: 'Button color', type: 'swatch', choices: SHELLS, def: '#f1f1ee' },
      { id: 'side', label: 'Side grip', type: 'swatch', choices: SHELLS, def: '#2447d6' },
      { id: 'finish', label: 'Finish', type: 'choice', choices: [{ v: 'Matte' }, { v: 'Soft-touch', price: 8 }], def: 'Matte' },
      { id: 'engrave', label: 'Engraving', type: 'text', max: 12, price: 5, def: '', placeholder: 'Up to 12 characters' },
    ] },
  { id: 'studio-mat', cat: 'mats', name: 'Studio Mat', tag: 'Printed desk mat in three sizes', price: 24, kind: 'mat',
    blurb: 'Smooth micro-weave cloth on a natural rubber base. Print one of our patterns, a solid color, or upload your own image.',
    specs: [['Surface', 'Micro-weave cloth'], ['Base', 'Natural rubber, 4 mm'], ['Edges', 'Stitched, color of your choice'], ['Care', 'Hand wash, air dry']],
    options: [
      { id: 'size', label: 'Size', type: 'choice', choices: [{ v: 'S', label: 'S · 450 × 400 mm' }, { v: 'M', label: 'M · 800 × 300 mm', price: 8 }, { v: 'XL', label: 'XL · 900 × 400 mm', price: 21 }], def: 'M' },
      { id: 'print', label: 'Print', type: 'print', def: 'sunset' },
      { id: 'color', label: 'Solid color', type: 'swatch', choices: SHELLS, def: '#2447d6', showIf: o => o.print === 'solid' },
      { id: 'stitch', label: 'Edge stitching', type: 'swatch', choices: SHELLS, def: '#16181f' },
    ] },
  { id: 'halo-headset', cat: 'audio', name: 'Halo', tag: 'Wireless headset with swappable cushions', price: 129, kind: 'headset',
    blurb: 'Closed-back 40 mm drivers, a soft headband and magnetic cushions. Pick the frame, cushion and accent ring colors.',
    specs: [['Drivers', '40 mm dynamic'], ['Connection', '2.4 GHz, Bluetooth 5.3'], ['Battery', 'Up to 60 hours'], ['Weight', '268 g']],
    options: [
      { id: 'frame', label: 'Frame color', type: 'swatch', choices: SHELLS, def: '#16181f' },
      { id: 'cushion', label: 'Cushions', type: 'choice', choices: [{ v: 'Leatherette', color: '#26272c' }, { v: 'Fabric', color: '#8a8f99' }, { v: 'Velour', color: '#2b3a80', price: 12 }], def: 'Fabric' },
      { id: 'accent', label: 'Accent ring', type: 'swatch', choices: SHELLS, def: '#2447d6' },
      { id: 'mic', label: 'Detachable boom mic', type: 'toggle', price: 15, def: true },
    ] },
  { id: 'perch-stand', cat: 'audio', name: 'Perch', tag: 'Headset stand with an engraved base', price: 49, kind: 'stand',
    blurb: 'A weighted base and a soft hook that will not dent your headband. Choose aluminum or walnut, and engrave the base.',
    specs: [['Height', '270 mm'], ['Base', '780 g, non-slip'], ['Hook', 'Silicone-lined']],
    options: [
      { id: 'color', label: 'Stand color', type: 'swatch', choices: SHELLS, def: '#2447d6' },
      { id: 'base', label: 'Base', type: 'choice', choices: [{ v: 'Aluminum' }, { v: 'Walnut', price: 14 }], def: 'Aluminum' },
      { id: 'engrave', label: 'Engraving', type: 'text', max: 16, price: 5, def: '', placeholder: 'Up to 16 characters' },
    ] },
  { id: 'coil-cable', cat: 'cables', name: 'Coil Cable', tag: 'Coiled USB-C keyboard cable', price: 39, kind: 'cable',
    blurb: 'A double-sleeved coiled cable with metal connectors. Match the sleeve to your keycaps and add an aviator connector if you like.',
    specs: [['Connectors', 'USB-C to USB-C or USB-A'], ['Coil', '15 cm on the keyboard end'], ['Sleeve', 'Paracord over TechFlex']],
    options: [
      { id: 'sleeve', label: 'Sleeve color', type: 'swatch', choices: SHELLS, def: '#2447d6' },
      { id: 'metal', label: 'Connector color', type: 'swatch', choices: METALS, def: '#c9ccd2' },
      { id: 'aviator', label: 'Aviator connector', type: 'toggle', price: 8, def: true },
      { id: 'length', label: 'Length', type: 'choice', choices: [{ v: '1.2 m' }, { v: '1.8 m', price: 4 }], def: '1.8 m' },
    ] },
  { id: 'carry-case', cat: 'cables', name: 'Carry Case', tag: 'Hard-shell case sized to your board', price: 45, kind: 'case',
    blurb: 'A molded hard shell with a padded interior sized to your layout. Choose the shell and zip pull colors, and add a monogram.',
    specs: [['Shell', 'Molded EVA, water-resistant'], ['Interior', 'Padded, with cable pocket'], ['Sizes', '60%, 75%, TKL and full-size']],
    options: [
      { id: 'size', label: 'Fits', type: 'choice', choices: [{ v: '60%' }, { v: '75%' }, { v: 'TKL', price: 5 }, { v: 'Full', price: 10 }], def: '75%' },
      { id: 'color', label: 'Shell color', type: 'swatch', choices: SHELLS, def: '#16181f' },
      { id: 'pull', label: 'Zip pull', type: 'swatch', choices: SHELLS, def: '#2447d6' },
      { id: 'mono', label: 'Monogram', type: 'text', max: 3, price: 5, def: '', placeholder: 'Up to 3 letters' },
    ] },
];
export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
export const defaultsOf = p => Object.fromEntries(p.options.map(o => [o.id, o.def]));
export function priceOf(p, cfg) {
  let t = p.price;
  p.options.forEach(o => {
    const v = cfg[o.id];
    if (o.showIf && !o.showIf(cfg)) return;
    if (o.type === 'choice' || o.type === 'swatch') { const c = o.choices.find(c => c.v === v); if (c && c.price) t += c.price; }
    else if (o.type === 'toggle' && v) t += o.price;
    else if (o.type === 'text' && v && String(v).trim()) t += o.price;
  });
  return t;
}
export function summaryOf(p, cfg) {
  return p.options.filter(o => !o.showIf || o.showIf(cfg)).map(o => {
    const v = cfg[o.id];
    if (o.type === 'swatch') return `${o.label}: ${(o.choices.find(c => c.v === v) || {}).label || v}`;
    if (o.type === 'choice') return `${o.label}: ${(o.choices.find(c => c.v === v) || {}).label || v}`;
    if (o.type === 'toggle') return v ? o.label : null;
    if (o.type === 'text') return v && v.trim() ? `${o.label}: “${v.trim()}”` : null;
    if (o.type === 'print') return `Print: ${v === 'solid' ? 'Solid color' : v === 'upload' ? 'Your image' : (PRINTS.find(x => x[0] === v) || [, v])[1]}`;
    return null;
  }).filter(Boolean);
}

