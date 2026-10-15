// Keyboard layouts, keycap profiles, models and colorways.
// Pure data: safe to import at build time (Astro pages) and in the browser (3D engine).

/* ---------------- Layout building blocks (units of 1u = 19.05 mm) ---------------- */
const K = (label, code, w = 1, extra = {}) => ({ label, code, w, ...extra });
const G = w => ({ gap: w });
const AT = x => ({ at: x });
const sym = (main, shift, code) => K(main, code, 1, { sub: shift, out: main, outShift: shift });
const letters = s => s.split('').map(c => K(c, 'Key' + c, 1, { out: c.toLowerCase(), outShift: c }));
const fkeys = (a, b) => { const r = []; for (let n = a; n <= b; n++) r.push(K('F' + n, 'F' + n)); return r; };
const digits = () => ['1!','2@','3#','4$','5%','6^','7&','8*','9(','0)'].map(p => sym(p[0], p[1], 'Digit' + p[0]));
const L = {
  esc: () => K('Esc', 'Escape'),
  fGroups: g => [...fkeys(1, 4), G(g), ...fkeys(5, 8), G(g), ...fkeys(9, 12)],
  num: (bk = 2) => [sym('`','~','Backquote'), ...digits(), sym('-','_','Minus'), sym('=','+','Equal'), K('Backspace','Backspace',bk,{act:'bksp'})],
  tab: () => [K('Tab','Tab',1.5,{out:'\t',outShift:'\t'}), ...letters('QWERTYUIOP'), sym('[','{','BracketLeft'), sym(']','}','BracketRight'), K('\\','Backslash',1.5,{sub:'|',out:'\\',outShift:'|'})],
  caps: () => [K('Caps Lock','CapsLock',1.75,{act:'caps'}), ...letters('ASDFGHJKL'), sym(';',':','Semicolon'), sym("'",'"','Quote'), K('Enter','Enter',2.25,{out:'\n',outShift:'\n'})],
  shift: (rs = 2.75) => [K('Shift','ShiftLeft',2.25,{act:'shift'}), ...letters('ZXCVBNM'), sym(',','<','Comma'), sym('.','>','Period'), sym('/','?','Slash'), K('Shift','ShiftRight',rs,{act:'shift'})],
  left: () => [K('Ctrl','ControlLeft',1.25), K('Win','MetaLeft',1.25), K('Alt','AltLeft',1.25), K('','Space',6.25,{out:' ',outShift:' '})],
  right4: () => [K('Alt','AltRight',1.25), K('Fn','Fn',1.25), K('Menu','ContextMenu',1.25), K('Ctrl','ControlRight',1.25)],
  right3: () => [K('Alt','AltRight'), K('Fn','Fn'), K('Ctrl','ControlRight')],
  arrows: () => [K('←','ArrowLeft'), K('↓','ArrowDown'), K('→','ArrowRight')],
  up: () => K('↑','ArrowUp'),
};
function tklRows() {
  return [
    { y: 0, p: 0, keys: [L.esc(), G(1), ...L.fGroups(.5), AT(15.25), K('PrtSc','PrintScreen'), K('ScrLk','ScrollLock'), K('Pause','Pause')] },
    { y: 1.25, p: 1, keys: [...L.num(), AT(15.25), K('Ins','Insert'), K('Home','Home'), K('PgUp','PageUp')] },
    { y: 2.25, p: 2, keys: [...L.tab(), AT(15.25), K('Del','Delete'), K('End','End'), K('PgDn','PageDown')] },
    { y: 3.25, p: 3, keys: [...L.caps()] },
    { y: 4.25, p: 4, keys: [...L.shift(), AT(16.25), L.up()] },
    { y: 5.25, p: 5, keys: [...L.left(), ...L.right4(), AT(15.25), ...L.arrows()] },
  ];
}
function fullRows() {
  const r = tklRows(), n = (d, extra = {}) => K(d, 'Numpad' + d, extra.w || 1, { out: d, outShift: d, ...extra });
  r[1].keys.push(AT(18.5), K('Num','NumLock'), K('/','NumpadDivide',1,{out:'/',outShift:'/'}), K('*','NumpadMultiply',1,{out:'*',outShift:'*'}), K('−','NumpadSubtract',1,{out:'-',outShift:'-'}));
  r[2].keys.push(AT(18.5), n('7'), n('8'), n('9'), K('+','NumpadAdd',1,{out:'+',outShift:'+',h:2}));
  r[3].keys.push(AT(18.5), n('4'), n('5'), n('6'));
  r[4].keys.push(AT(18.5), n('1'), n('2'), n('3'), K('Enter','NumpadEnter',1,{out:'\n',outShift:'\n',h:2}));
  r[5].keys.push(AT(18.5), n('0', { w: 2 }), K('.','NumpadDecimal',1,{out:'.',outShift:'.'}));
  return r;
}

const ROW_TILT = [0.15, 0.11, 0.055, 0, -0.045, -0.08];
const ROW_LIFT = [0.07, 0.05, 0.02, 0, 0.012, 0.03];
const PROFILE_ROW = ['R1','R1','R2','R3','R4','R4'];
const PROFILES = {
  studio: { name: 'Sculpted OEM-style', h: .42, inset: .11, bevel: .045, r: .07, tilt: 1, lift: 1, base: .17, press: .11, sculpted: true },
  ksa:    { name: 'KSA spherical', h: .47, inset: .13, bevel: .05, r: .1, tilt: .6, lift: .6, base: .17, press: .11, sculpted: true },
  cherry: { name: 'Cherry profile', h: .34, inset: .1, bevel: .04, r: .06, tilt: 1.1, lift: .7, base: .17, press: .11, sculpted: true },
  oem:    { name: 'OEM profile', h: .4, inset: .11, bevel: .04, r: .06, tilt: 1, lift: 1, base: .17, press: .11, sculpted: true },
  topre:  { name: 'Topre cylindrical', h: .44, inset: .12, bevel: .05, r: .08, tilt: 1.15, lift: 1.1, base: .18, press: .1, sculpted: true },
  nsa:    { name: 'nSA low profile', h: .2, inset: .06, bevel: .03, r: .06, tilt: 0, lift: 0, base: .09, press: .06, sculpted: false },
};

const KEYCHRON_EDITIONS = [
  { slug: 'carbon', name: 'Carbon Black', alpha: ['#e8e4d8','#2c3d5c'], mod: ['#2c3d5c','#e8e4d8'], accent: ['#3aa59c','#ffffff'], case: '#2a2b2d' },
  { slug: 'shell', name: 'Shell White', alpha: ['#ece8df','#4a4a4a'], mod: ['#b8b8b2','#363636'], accent: ['#b8b8b2','#363636'], case: '#e6e3dc' },
];
const MODELS = {
  studio75: {
    price: 149, name: 'keycapgen 75', maker: 'Original design', layout: '75%', profile: 'studio',
    switches: 'Generic MX-style switches', keycaps: 'Sculpted OEM-style caps', caseDesc: 'Rounded tray with a raised rim', extrasDesc: 'None',
    signature: 'The original workbench board: a 75% with a gapped function row and a rim all around.',
    case: { m: .55, top: 0, depth: .5, radius: .42, rim: .36 },
    rows: () => [
      { y: 0, p: 0, keys: [L.esc(), G(.5), ...L.fGroups(.5), G(.5), K('Del','Delete')] },
      { y: 1.25, p: 1, keys: [...L.num(), K('Home','Home')] },
      { y: 2.25, p: 2, keys: [...L.tab(), K('PgUp','PageUp')] },
      { y: 3.25, p: 3, keys: [...L.caps(), K('PgDn','PageDown')] },
      { y: 4.25, p: 4, keys: [...L.shift(1.75), L.up(), K('End','End')] },
      { y: 5.25, p: 5, keys: [...L.left(), ...L.right3(), ...L.arrows()] },
    ],
    editions: ['graphite'],
  },
  q1max: {
    price: 229, name: 'Keychron Q1 Max', maker: 'Keychron', layout: '75%', profile: 'ksa',
    switches: 'Gateron Jupiter, hot-swappable', keycaps: 'KSA double-shot PBT', caseDesc: 'CNC aluminum, 5.2° typing angle, 1.72 kg', extrasDesc: 'Volume knob, top right',
    signature: 'A heavy CNC-aluminum 75% with a volume knob tucked into the top-right corner.',
    case: { m: .6, top: 0, depth: .58, radius: .3, rim: .42 },
    rows: () => [
      { y: 0, p: 0, keys: [L.esc(), G(.25), ...L.fGroups(.25), G(.25), K('Del','Delete')] },
      { y: 1.25, p: 1, keys: [...L.num(), K('PgUp','PageUp')] },
      { y: 2.25, p: 2, keys: [...L.tab(), K('PgDn','PageDown')] },
      { y: 3.25, p: 3, keys: [...L.caps(), K('Home','Home')] },
      { y: 4.25, p: 4, keys: [...L.shift(1.75), L.up()] },
      { y: 5.25, p: 5, keys: [...L.left(), ...L.right3(), ...L.arrows()] },
    ],
    extras: [{ type: 'knob', x: 15.5, y: .5, r: .4, h: .6 }],
    editions: [...KEYCHRON_EDITIONS, { slug: 'purple', name: 'Purple', alpha: ['#e7e2f0','#5b4a85'], mod: ['#9c8fc2','#ffffff'], accent: ['#5b4a85','#ffffff'], case: '#7d6e9e' }],
  },
  apexpro: {
    price: 219, name: 'SteelSeries Apex Pro TKL', maker: 'SteelSeries · Gen 3', layout: 'TKL', profile: 'cherry',
    switches: 'OmniPoint 3.0 Hall-effect, adjustable 0.1–4.0 mm', keycaps: 'Double-shot PBT, Cherry-style', caseDesc: 'Aluminum top plate on a plastic body, floating keys', extrasDesc: 'OLED screen, menu button and volume roller, top right',
    signature: 'An OLED screen and volume roller live in the top-right corner of a floating-key aluminum deck.',
    case: { m: .3, top: 1.0, depth: .42, radius: .22, floating: true },
    rows: tklRows,
    extras: [{ type: 'oled', x: 15.95, y: -.55, w: 1.7, d: .55 }, { type: 'button', x: 17.2, y: -.55, r: .14 }, { type: 'roller', x: 17.85, y: -.55, len: .5, r: .2 }],
    editions: [
      { slug: 'black', name: 'Black', alpha: ['#1a1a1a','#f2f2f2'], mod: ['#1a1a1a','#f2f2f2'], accent: ['#1a1a1a','#f2f2f2'], case: '#141414', deck: '#2a2b2e' },
      { slug: 'white', name: 'White', alpha: ['#f0f0ee','#2a2a2a'], mod: ['#f0f0ee','#2a2a2a'], accent: ['#f0f0ee','#2a2a2a'], case: '#f0f0ee', deck: '#dcdcda' },
    ],
  },
  wooting60: {
    price: 189, name: 'Wooting 60HE+', maker: 'Wooting', layout: '60%', profile: 'oem',
    switches: 'Lekker Hall-effect, adjustable 0.1–4.0 mm', keycaps: 'Double-shot, OEM-style', caseDesc: 'Compact plastic tray', extrasDesc: 'None',
    signature: 'A 60% built for analog input: every key’s actuation point is adjustable.',
    case: { m: .5, top: .15, depth: .5, radius: .35, rim: .34 },
    rows: () => [
      { y: 0, p: 1, keys: [L.esc(), ...digits(), sym('-','_','Minus'), sym('=','+','Equal'), K('Backspace','Backspace',2,{act:'bksp'})] },
      { y: 1, p: 2, keys: L.tab() },
      { y: 2, p: 3, keys: L.caps() },
      { y: 3, p: 4, keys: L.shift() },
      { y: 4, p: 5, keys: [...L.left(), ...L.right4()] },
    ],
    editions: [{ slug: 'black', name: 'Black', alpha: ['#1b1b1b','#f2f2f2'], mod: ['#1b1b1b','#f2f2f2'], accent: ['#1b1b1b','#f2f2f2'], case: '#1d1d1f' }],
  },
  hhkb: {
    price: 299, name: 'HHKB Professional Hybrid Type-S', maker: 'PFU (HHKB)', layout: '60% HHKB', profile: 'topre',
    switches: 'Topre Type-S silenced capacitive, 45 g', keycaps: 'Topre cylindrical PBT, dye-sub legends', caseDesc: 'ABS case, three height settings', extrasDesc: 'None (power button is on the back)',
    signature: 'Control sits where Caps Lock usually is: a 60-key Topre layout with no arrows or F-row.',
    case: { m: .7, top: .35, depth: .75, radius: .5, rim: .4 },
    rows: () => [
      { y: 0, p: 1, keys: [L.esc(), ...digits(), sym('-','_','Minus'), sym('=','+','Equal'), K('\\','Backslash',1,{sub:'|',out:'\\',outShift:'|'}), sym('`','~','Backquote')] },
      { y: 1, p: 2, keys: [K('Tab','Tab',1.5,{out:'\t',outShift:'\t'}), ...letters('QWERTYUIOP'), sym('[','{','BracketLeft'), sym(']','}','BracketRight'), K('Delete','Backspace',1.5,{act:'bksp'})] },
      { y: 2, p: 3, keys: [K('Control','ControlLeft',1.75), ...letters('ASDFGHJKL'), sym(';',':','Semicolon'), sym("'",'"','Quote'), K('Return','Enter',2.25,{out:'\n',outShift:'\n'})] },
      { y: 3, p: 4, keys: [K('Shift','ShiftLeft',2.25,{act:'shift'}), ...letters('ZXCVBNM'), sym(',','<','Comma'), sym('.','>','Period'), sym('/','?','Slash'), K('Shift','ShiftRight',1.75,{act:'shift'}), K('Fn','Fn')] },
      { y: 4, p: 5, keys: [AT(1.5), K('Alt','AltLeft'), K('◇','MetaLeft',1.5), K('','Space',6,{out:' ',outShift:' '}), K('◇','MetaRight',1.5), K('Alt','AltRight')] },
    ],
    editions: [
      { slug: 'charcoal', name: 'Charcoal', alpha: ['#3c3c3e','#8f8f8f'], mod: ['#3c3c3e','#8f8f8f'], accent: ['#3c3c3e','#8f8f8f'], case: '#3c3c3e' },
      { slug: 'white', name: 'White', alpha: ['#e9e7e0','#555555'], mod: ['#b6b6b0','#444444'], accent: ['#b6b6b0','#444444'], case: '#e9e7e0' },
      { slug: 'snow', name: 'Snow', alpha: ['#f4f4f2','#a5a5a2'], mod: ['#f4f4f2','#a5a5a2'], accent: ['#f4f4f2','#a5a5a2'], case: '#f4f4f2' },
    ],
  },
  air75: {
    price: 139, name: 'NuPhy Air75 V3', maker: 'NuPhy · replaces the V2', layout: '75% low profile', profile: 'nsa',
    switches: 'Gateron low-profile 3.0, 3.5 mm travel', keycaps: 'nSA low-profile double-shot PBT', caseDesc: '13.2 mm thin aluminum top, floating keys', extrasDesc: 'Swappable knob module, top right',
    signature: 'A 13 mm-thin aluminum 75% whose top-right key swaps for a knob.',
    case: { m: .32, top: 0, depth: .2, radius: .3, floating: true },
    rows: () => [
      { y: 0, p: 0, keys: [L.esc(), ...fkeys(1, 12), K('PrtSc','PrintScreen'), K('Del','Delete')] },
      { y: 1, p: 1, keys: [...L.num(), K('PgUp','PageUp')] },
      { y: 2, p: 2, keys: [...L.tab(), K('PgDn','PageDown')] },
      { y: 3, p: 3, keys: [...L.caps(), K('Home','Home')] },
      { y: 4, p: 4, keys: [...L.shift(1.75), L.up(), K('End','End')] },
      { y: 5, p: 5, keys: [...L.left(), ...L.right3(), ...L.arrows()] },
    ],
    extras: [{ type: 'knob', x: 15.5, y: .5, r: .36, h: .26 }],
    editions: [
      { slug: 'dark', name: 'Nebula Dark', alpha: ['#3a3b40','#e6e6e6'], mod: ['#2a2b2f','#e6e6e6'], accent: ['#e0603a','#ffffff'], case: '#2b2c30' },
      { slug: 'white', name: 'Nova White', alpha: ['#f0efec','#3a3a3a'], mod: ['#cfcfcc','#3a3a3a'], accent: ['#e0603a','#ffffff'], case: '#ecebe8' },
    ],
  },
  gprox: {
    price: 179, name: 'Logitech G Pro X TKL', maker: 'Logitech G · Lightspeed', layout: 'TKL', profile: 'cherry',
    switches: 'GX mechanical: tactile, linear or clicky', keycaps: 'Double-shot PBT', caseDesc: 'Floating keys on an aluminum plate', extrasDesc: 'Media buttons and volume roller along the top edge',
    signature: 'A floating-key TKL with a pro-esports media strip and a volume roller across the top edge.',
    case: { m: .35, top: .85, depth: .45, radius: .28, floating: true },
    rows: tklRows,
    extras: [
      ...[.45, 1.05, 1.65, 2.25].map(x => ({ type: 'button', x, y: -.48, r: .12 })),
      ...[14.95, 15.6, 16.25, 16.9].map(x => ({ type: 'button', x, y: -.48, r: .15 })),
      { type: 'roller', x: 17.75, y: -.48, len: .6, r: .2 },
    ],
    editions: [
      { slug: 'black', name: 'Black', alpha: ['#1c1c1e','#ffffff'], mod: ['#1c1c1e','#ffffff'], accent: ['#1c1c1e','#ffffff'], case: '#1c1c1e', deck: '#242427' },
      { slug: 'white', name: 'White', alpha: ['#f1f1ef','#3a3a3a'], mod: ['#f1f1ef','#3a3a3a'], accent: ['#f1f1ef','#3a3a3a'], case: '#f1f1ef', deck: '#e2e2e0' },
      { slug: 'magenta', name: 'Magenta', alpha: ['#d9479a','#ffffff'], mod: ['#d9479a','#ffffff'], accent: ['#d9479a','#ffffff'], case: '#d9479a', deck: '#c63e8a' },
    ],
  },
  huntsman: {
    price: 249, name: 'Razer Huntsman V3 Pro TKL', maker: 'Razer', layout: 'TKL', profile: 'cherry',
    switches: 'Analog optical Gen-2, adjustable 0.1–4.0 mm', keycaps: 'Double-shot PBT', caseDesc: 'Brushed aluminum top plate, floating keys', extrasDesc: 'Multi-function dial and 2 buttons above the numpad',
    signature: 'An analog optical tenkeyless with a metal dial and two buttons in the top-right corner.',
    case: { m: .3, top: 1.0, depth: .45, radius: .2, floating: true },
    rows: tklRows,
    extras: [{ type: 'button', x: 15.55, y: -.55, r: .18 }, { type: 'button', x: 16.3, y: -.55, r: .18 }, { type: 'knob', x: 17.6, y: -.55, r: .38, h: .45 }],
    editions: [{ slug: 'black', name: 'Black', alpha: ['#161616','#f2f2f2'], mod: ['#161616','#f2f2f2'], accent: ['#161616','#f2f2f2'], case: '#151515', deck: '#2a2a2c' },
      { slug: 'white', name: 'White', alpha: ['#ececea','#2a2a2a'], mod: ['#ececea','#2a2a2a'], accent: ['#ececea','#2a2a2a'], case: '#ececea', deck: '#dcdcda' }],
  },
  q6max: {
    price: 249, name: 'Keychron Q6 Max', maker: 'Keychron', layout: '100%', profile: 'ksa',
    switches: 'Gateron Jupiter, hot-swappable', keycaps: 'KSA double-shot PBT', caseDesc: 'CNC aluminum, 5.2° typing angle, 2.18 kg', extrasDesc: 'Knob above the numpad',
    signature: 'A 2.2 kg full-size aluminum slab with a knob crowning the numpad.',
    case: { m: .6, top: 0, depth: .58, radius: .3, rim: .42 },
    rows: fullRows,
    extras: [{ type: 'knob', x: 22, y: .5, r: .4, h: .6 }],
    editions: KEYCHRON_EDITIONS,
  },
};

const FIELDS = ['label','sub','out','outShift','cap','ink','font','size','bold','align'];
const FONTS = [['Public Sans','Public Sans'],['Barlow','Barlow'],['IBM Plex Mono','IBM Plex Mono'],['Fraunces','Fraunces'],['Bebas Neue','Bebas Neue'],['Rubik Mono One','Rubik Mono One'],['Press Start 2P','Press Start 2P'],['Caveat','Caveat'],['system-ui','System UI']];
const FONT_IDS = FONTS.map(f => f[0]);
const SWATCHES = ['#1d1f23','#3b3e44','#8a9099','#e9e7e2','#ffffff','#d64b2a','#e0602f','#e9a23b','#f2d04b','#3c9a5f','#0e7a6b','#2f6fd6','#6b4fbf','#d4689a'];
// Generic keycap colorways. The named sets are close approximations of well-known GMK / SA / ePBT sets.
const COLORWAYS = {
  graphite:     { name:'Graphite', alpha:['#3b3e44','#ebe9e4'], mod:['#25272b','#c3c7cd'], accent:['#e0602f','#1c1c1c'], case:'#2b2d32' },
  paper:        { name:'Paper',    alpha:['#efece6','#2a2a2a'], mod:['#b7bcc4','#262626'], accent:['#2f6fd6','#ffffff'], case:'#d7d9dd' },
  lagoon:       { name:'Lagoon',   alpha:['#e1eeeb','#174a50'], mod:['#174a50','#e1eeeb'], accent:['#f08a5d','#2a1a12'], case:'#8fb1ad' },
  beige:        { name:'1987',     alpha:['#e5dfcd','#3a3833'], mod:['#9a958a','#f3efe4'], accent:['#b3362f','#f3efe4'], case:'#d6cfbb' },
  sakura:       { name:'Sakura',   alpha:['#fbedf0','#7a3b58'], mod:['#d8b2c3','#4b2236'], accent:['#7a3b58','#fbedf0'], case:'#f0d9e1' },
  midnight:     { name:'Midnight', alpha:['#1e2535','#93b4ff'], mod:['#131824','#6380c2'], accent:['#ffcc4d','#1e2535'], case:'#0e121b' },
  'olivia-light': { name:'Olivia Light', set:'GMK', alpha:['#e1dbd1','#2e2c2d'], mod:['#e1dbd1','#c98f7b'], accent:['#deaf9d','#2e2c2d'], case:'#edebe6' },
  'olivia-dark':  { name:'Olivia Dark',  set:'GMK', alpha:['#2e2c2d','#e8e2da'], mod:['#2e2c2d','#deaf9d'], accent:['#deaf9d','#2e2c2d'], case:'#2a292b' },
  laser:        { name:'Laser',        set:'GMK', alpha:['#2e1f66','#d31b4e'], mod:['#28224f','#189cbc'], accent:['#d31b4e','#28224f'], case:'#1b1a2e' },
  '8008':       { name:'8008',         set:'GMK', alpha:['#9aa3b0','#2f353e'], mod:['#333a45','#f44c7f'], accent:['#f44c7f','#333a45'], case:'#7d848e' },
  botanical:    { name:'Botanical',    set:'GMK', alpha:['#eef2f1','#4f6b66'], mod:['#7b9c98','#eef2f1'], accent:['#3f5753','#eef2f1'], case:'#e9ebe8' },
  'red-samurai':{ name:'Red Samurai',  set:'GMK', alpha:['#8a2230','#c79e6e'], mod:['#393b3b','#c79e6e'], accent:['#c79e6e','#393b3b'], case:'#1e1e20' },
  dracula:      { name:'Dracula',      set:'GMK', alpha:['#44475a','#f8f8f2'], mod:['#282a36','#f8f8f2'], accent:['#bd93f9','#282a36'], case:'#1e1e24' },
  bento:        { name:'Bento',        set:'GMK', alpha:['#f2e8e0','#2d394d'], mod:['#4a768d','#f2e8e0'], accent:['#ff7a90','#f2e8e0'], case:'#2d394d' },
  wob:          { name:'White on Black', set:'GMK', alpha:['#171718','#f7f2ea'], mod:['#171718','#f7f2ea'], accent:['#171718','#f7f2ea'], case:'#c8c9cc' },
  mizu:         { name:'Mizu',         set:'GMK', alpha:['#afcbdd','#1a2633'], mod:['#85a5bb','#fcfbf6'], accent:['#f7f2ea','#6e90aa'], case:'#f0f0ec' },
  godspeed:     { name:'Godspeed',     set:'GMK', alpha:['#eae4cf','#646669'], mod:['#9abbcd','#3e4a56'], accent:['#f4d476','#646669'], case:'#e8e6e1' },
  'modern-dolch': { name:'Modern Dolch', set:'GMK', alpha:['#5a5e63','#e3e6eb'], mod:['#2d2e30','#e3e6eb'], accent:['#7eddd3','#2d2e30'], case:'#2b2c2e' },
  hyperfuse:    { name:'Hyperfuse',    set:'GMK', alpha:['#c6c9c7','#5a3e8e'], mod:['#67635b','#3fb8c9'], accent:['#3fb8c9','#5a3e8e'], case:'#2e2e30' },
  vilebloom:    { name:'Vilebloom',    set:'SA',  alpha:['#2c5f5d','#e8dcc4'], mod:['#e8dcc4','#2c5f5d'], accent:['#e8a3a1','#2c5f5d'], case:'#e6e2da' },
  'kuro-shiro': { name:'Kuro Shiro',   set:'ePBT', alpha:['#ededE8','#1a1a1a'], mod:['#1a1a1a','#ededE8'], accent:['#1a1a1a','#ededE8'], case:'#1c1c1e' },
};
const GENERIC_IDS = Object.keys(COLORWAYS);
// Register each model's stock editions as colorways too
Object.entries(MODELS).forEach(([mid, M]) => {
  M.editionIds = M.editions.map(e => {
    if (typeof e === 'string') return e;
    const id = `${mid}:${e.slug}`; COLORWAYS[id] = { ...e, edition: mid }; return id;
  });
});


export { ROW_TILT, ROW_LIFT, PROFILE_ROW, PROFILES, MODELS, FIELDS, FONTS, FONT_IDS, SWATCHES, COLORWAYS, GENERIC_IDS };
