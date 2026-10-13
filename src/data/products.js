// Accessory catalog: real products in their official colorways, shown with the makers' own product photos.
// Each product has one "variant" option (color, wood, sleeve or size) whose choices carry the photo gallery,
// plus a few add-ons we offer on top. Prices are example prices for this prototype store.

export const CATS = [
  { id: 'keyboards', name: 'Keyboards', blurb: '9 layouts, every key yours' },
  { id: 'mice', name: 'Mice', blurb: 'Official colorways, grip tape, engraving' },
  { id: 'mats', name: 'Desk mats', blurb: 'Cloth and wool felt' },
  { id: 'audio', name: 'Headsets & stands', blurb: 'Wireless headsets, hardwood stands' },
  { id: 'cables', name: 'Cables & cases', blurb: 'Coiled cables, carry cases' },
];

// Photo URLs are copied from the makers' product pages. Logitech's image service gets a larger size
// and loses its "transparent placeholder" default, so a missing photo fails visibly and the illustration takes over.
const lg = u => u.replace('d_transparent.gif/', '').replace('w_544,h_466,', 'w_960,h_823,').replace('w_544,h_544,', 'w_900,h_900,');
const cf = u => u.replace('w=1920', 'w=1200');
const LGG = 'https://resource.logitechg.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/gaming/en/products/';
const LGM = 'https://resource.logitech.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-4/gallery/';
const RZ = 'https://assets3.razerzone.com/';
const CTF = 'https://images.ctfassets.net/hmm5mo4qf4mf/';
const SHOP = 'https://cdn.shopify.com/s/files/1/0059/0630/1017/';
const GM = 'https://grovemade.com/shop-static/shop/variant/';
const SL = 'https://siteleaf.grovemade.com/uploads/';

export const PRODUCTS = [
  {
    id: 'pro-x-superlight-2', cat: 'mice', brand: 'Logitech G', name: 'Pro X Superlight 2', price: 159, kind: 'mouse', gallery: 'color',
    source: 'https://www.logitechg.com/en-us/products/gaming-mice/pro-x2-superlight-wireless-mouse.html',
    tag: 'Symmetrical 60 g wireless esports mouse',
    blurb: 'The featherweight symmetric shell pros grip in claw and fingertip styles. Pick an official colorway, then add side grip tape or an engraving.',
    signature: 'A featherlight 60 g symmetric shell with a magnetic charging puck hidden underneath.',
    specs: [['Size', '125 × 63.5 × 40 mm'], ['Weight', '60 g'], ['Buttons', '5, two on the left side'], ['Feet', 'Zero-additive PTFE']],
    options: [
      { id: 'color', label: 'Color', type: 'variant', def: 'Black', choices: [
        { v: 'Black', hex: '#1a1a1a', images: ['pro-x-superlight-2/new-gallery-assets-2025/pro-x-superlight-2-mice-top-angle-black-gallery-1.png', 'pro-x-superlight-2/new-gallery-assets-2025/pro-x-superlight-2-mice-profile-left-angle-black-gallery-4-2-award.png', 'pro-x-superlight-2/new-gallery-assets-2025/pro-x-superlight-2-mice-profile-right-angle-black-gallery-5.png', 'pro-x-superlight-2/new-gallery-assets-2025/pro-x-superlight-2-mice-bottom-angle-black-gallery-6.png'].map(u => lg(LGG + u)) },
        { v: 'White', hex: '#f2f2f0', images: ['pro-x-superlight-2/new-gallery-assets-2025/pro-x-superlight-2-mice-top-angle-white-gallery-1.png', 'pro-x-superlight-2/new-gallery-assets-2025/pro-x-superlight-2-mice-profile-left-angle-white-gallery-4-2-award.png', 'pro-x-superlight-2/new-gallery-assets-2025/pro-x-superlight-2-mice-profile-right-angle-white-gallery-5.png', 'pro-x-superlight-2/new-gallery-assets-2025/pro-x-superlight-2-mouse-bottom-angle-white-gallery-6.png'].map(u => lg(LGG + u)) },
        { v: 'Magenta', hex: '#e8508f', images: ['pro-x-superlight-2/new-gallery-assets-2025/pro-x-superlight-2-mice-top-angle-pink-gallery-1-new.png', 'pro-x-superlight-2/new-gallery-assets-2025/pro-x-superlight-2-mouse-profile-left-angle-pink-gallery-4-2-award.png', 'pro-x-superlight-2/new-gallery-assets-2025/pro-x-superlight-2-mouse-profile-right-angle-pink-gallery-5-new.png', 'pro-x-superlight-2/new-gallery-assets-2025/pro-x-superlight-2-mouse-bottom-angle-pink-gallery-6-new.png'].map(u => lg(LGG + u)) },
      ] },
      { id: 'grip', label: 'Grip tape on the sides', type: 'toggle', price: 9, def: false },
      { id: 'engrave', label: 'Engraving', type: 'text', max: 12, price: 5, def: '', placeholder: 'Up to 12 characters' },
    ],
  },
  {
    id: 'deathadder-v4-pro', cat: 'mice', brand: 'Razer', name: 'DeathAdder V4 Pro', price: 169, kind: 'mouse-ergo', gallery: 'color',
    source: 'https://www.razer.com/gaming-mice/razer-deathadder-v4-pro/RZ01-05330100-R3U1',
    tag: 'Right-hand ergonomic wireless mouse',
    blurb: 'The classic right-handed palm-filler shape at 56 g. Pick an official colorway, then add side grip tape or an engraving.',
    signature: 'The classic DeathAdder palm-filler, now 56 g with a true 8 kHz wireless link.',
    specs: [['Size', '128 × 68 × 44 mm'], ['Weight', '56 g'], ['Controls', '8 programmable, two on the left side'], ['Replaces', 'DeathAdder V3 Pro (same shell)']],
    options: [
      { id: 'color', label: 'Color', type: 'variant', def: 'Black', choices: [
        { v: 'Black', hex: '#151515', images: [
          'S9rXPeM_f0C5mgTbeGFEyB9zFRo=/1500x1000/https%3A%2F%2Fmedias-p1.phoenix.razer.com%2Fsys-master-phoenix-images-container%2Fh56%2Fh3e%2F9926513033246%2F250710-deathadder-v4-pro-black-1500x1000-1.jpg',
          'eXoYfHoTAqLTeDTN9uUHtV1UgOE=/1500x1000/https%3A%2F%2Fmedias-p1.phoenix.razer.com%2Fsys-master-phoenix-images-container%2Fh6a%2Fh89%2F9926512934942%2F250710-deathadder-v4-pro-black-1500x1000-2.jpg',
          'gefb-GQxOeuJ5NzkjY4fvY_HfcE=/1500x1000/https%3A%2F%2Fmedias-p1.phoenix.razer.com%2Fsys-master-phoenix-images-container%2Fhc1%2Fh89%2F9926512902174%2F250710-deathadder-v4-pro-black-1500x1000-3.jpg',
          '0kY196o4CRHutp4eXRSriSRvCLY=/1500x1000/https%3A%2F%2Fmedias-p1.phoenix.razer.com%2Fsys-master-phoenix-images-container%2Fh29%2Fh8d%2F9926512803870%2F250710-deathadder-v4-pro-black-1500x1000-4.jpg'].map(u => RZ + u) },
        { v: 'White', hex: '#ececea', images: [
          'T7ntyJy2PBhwZg3ZW7u11NwBzfM=/1500x1000/https%3A%2F%2Fmedias-p1.phoenix.razer.com%2Fsys-master-phoenix-images-container%2Fhd2%2Fh8c%2F9926512836638%2F250710-deathadder-v4-pro-white-1500x1000-2.jpg',
          'XCMMkqf3zU_pY1fbEe2RSoj6G9M=/1500x1000/https%3A%2F%2Fmedias-p1.phoenix.razer.com%2Fsys-master-phoenix-images-container%2Fhad%2Fh3e%2F9926513000478%2F250710-deathadder-v4-pro-white-1500x1000-3.jpg',
          'kHCGEf-jb0tbF7ipJSnQeQUUguY=/1500x1000/https%3A%2F%2Fmedias-p1.phoenix.razer.com%2Fsys-master-phoenix-images-container%2Fh40%2Fh3a%2F9926513197086%2F250710-deathadder-v4-pro-white-1500x1000-4.jpg',
          'CNrxZAsj9t8kz3cCRD-g-qlgmj8=/1500x1000/https%3A%2F%2Fmedias-p1.phoenix.razer.com%2Fsys-master-phoenix-images-container%2Fha8%2Fh3d%2F9926513098782%2F250710-deathadder-v4-pro-white-1500x1000-5.jpg'].map(u => RZ + u) },
      ] },
      { id: 'grip', label: 'Grip tape on the sides', type: 'toggle', price: 9, def: false },
      { id: 'engrave', label: 'Engraving', type: 'text', max: 12, price: 5, def: '', placeholder: 'Up to 12 characters' },
    ],
  },
  {
    id: 'mx-master-4', cat: 'mice', brand: 'Logitech', name: 'MX Master 4', price: 119, kind: 'mouse-ergo', gallery: 'color',
    source: 'https://www.logitech.com/en-us/products/mice/mx-master-4.html',
    tag: 'Productivity mouse with a haptic thumb rest',
    blurb: 'A sculpted palm mouse with a steel MagSpeed wheel, a side thumb wheel and a haptic panel in the thumb rest. Pick a colorway and add an engraving.',
    signature: 'A haptic panel built into the thumb rest gives a tiny click you feel but never press.',
    specs: [['Size', '128.2 × 88.4 × 50.8 mm'], ['Weight', '150 g'], ['Wheels', 'Steel MagSpeed wheel and side thumb wheel'], ['Replaces', 'MX Master 3S']],
    options: [
      { id: 'color', label: 'Color', type: 'variant', def: 'Graphite', choices: [
        { v: 'Graphite', hex: '#3a3b3d', images: [lg(LGM + 'mx-master-4-graphite-top-angle-gallery-1.png'), lg(LGM.replace('w_544,h_466,ar_7:6,c_pad', 'w_544,h_544,ar_1,c_fill') + 'mx-master-4-graphite-offer-lifestyle-gallery-3.png')] },
        { v: 'Pale Grey', hex: '#d9d8d3', images: [lg(LGM + 'mx-master-4-pale-grey-top-angle-gallery-1.png'), lg(LGM.replace('w_544,h_466,ar_7:6,c_pad', 'w_544,h_544,ar_1,c_fill') + 'mx-master-4-pale-grey-offer-lifestyle-gallery-3.png')] },
      ] },
      { id: 'engrave', label: 'Engraving', type: 'text', max: 12, price: 5, def: '', placeholder: 'Up to 12 characters' },
    ],
  },
  {
    id: 'qck-heavy-xxl', cat: 'mats', brand: 'SteelSeries', name: 'QcK Heavy', price: 49, kind: 'mat', gallery: 'size',
    source: 'https://steelseries.com/gaming-mousepads/qck-heavy',
    tag: 'Thick cloth gaming mat',
    blurb: 'The esports-standard micro-woven cloth on a thick rubber base, in desk-spanning XXL or a mouse-only Large.',
    signature: 'The esports-standard black cloth slab, thick enough to soften every swipe.',
    specs: [['Surface', 'Micro-woven cloth'], ['Base', 'Non-slip rubber'], ['Color', 'Black']],
    options: [
      { id: 'size', label: 'Size', type: 'variant', def: 'XXL', choices: [
        { v: 'XXL', label: 'XXL · 900 × 400 × 4 mm', mm: [900, 400, 4], images: ['1LmTjOKEqxZeA59KMXaHek/33a82cea1eb6789755dcee4546d00076/qck_heavy_xxl_black_pdp_img_buy_01.png?fm=webp&q=90&fit=scale&w=1920', '1wOsFdI7TUDcyyHIFJHvFs/3a47f3a316a098d5279929b120af1ed5/qck_heavy_xxl_black_pdp_img_buy_02.png?fm=webp&q=90&fit=scale&w=1920'].map(u => cf(CTF + u)) },
        { v: 'Large', label: 'Large · 450 × 400 × 6 mm', mm: [450, 400, 6], price: -15, images: ['25QEB8hV9jk6YhUDB2glCE/a2d752170c99abbab4f36039842f1954/qck_heavy_l_black_pdp_img_buy_01.png?fm=webp&q=90&fit=scale&w=1920'].map(u => cf(CTF + u)) },
      ] },
    ],
  },
  {
    id: 'wool-felt-desk-pad', cat: 'mats', brand: 'Grovemade', name: 'Wool Felt Desk Pad', price: 70, kind: 'mat', felt: true, gallery: 'felt',
    source: 'https://grovemade.com/product/wool-felt-desk-pad/',
    tag: 'Dense Merino wool felt',
    blurb: 'Dense German Merino felt that quiets the desk and warms the wrists. Choose the felt and the size that fits your setup.',
    signature: 'Dense Merino felt that quietly warms the whole desk.',
    specs: [['Material', 'German Merino wool felt, 3–3.5 mm'], ['Edges', 'Square-cut raw edges']],
    options: [
      { id: 'felt', label: 'Felt', type: 'variant', def: 'Dark Grey', choices: [
        { v: 'Dark Grey', hex: '#4a4b4d', images: [GM + 'grovemade-desk-pad-wool-dark-small-galA-A1.jpg?_v=1635191745.8557458', SL + 'grovemade-felt-desk-pad-dark-mediumplus-galB-A1.jpg', SL + 'grovemade-wool-felt-desk-pad-dark-galB-C1.jpg', GM + 'walnut-desk-02-pad-galA-A1.jpg?_v=1503967485.7040215'] },
        { v: 'Light Grey', hex: '#b9b8b4', images: [GM + 'grovemade-desk-pad-wool-light-S-galA-A1.jpg?_v=1635191816.1788392', GM + 'grovemade-desk-pad-wool-light-MPlus-galA-A1.jpg?_v=1635192086.754584', GM + 'grovemade-woolfelt-desk-pad-light-deepmedium-galA-A1.jpg?_v=1631199065.1148996', GM + 'maple-desk-02-pad-galA-A1.jpg?_v=1503967446.067817'] },
      ] },
      { id: 'size', label: 'Size', type: 'choice', choices: [
        { v: 'Small', label: 'Small · 629 × 279 mm', mm: [629, 279, 3.3] }, { v: 'Medium', label: 'Medium · 965 × 292 mm', mm: [965, 292, 3.3], price: 20 },
        { v: 'Medium Plus', label: 'Medium Plus · 965 × 400 mm', mm: [965, 400, 3.3], price: 40 }, { v: 'Large', label: 'Large · 978 × 660 mm', mm: [978, 660, 3.3], price: 80 },
        { v: 'XL', label: 'XL · 1245 × 673 mm', mm: [1245, 673, 3.3], price: 110 }], def: 'Medium' },
    ],
  },
  {
    id: 'arctis-nova-pro-omni', cat: 'audio', brand: 'SteelSeries', name: 'Arctis Nova Pro Omni', price: 399, kind: 'headset', gallery: 'color',
    source: 'https://steelseries.com/gaming-headsets/arctis-nova-pro-omni',
    tag: 'Wireless headset with a swappable battery',
    blurb: 'A steel band over a ski-goggle suspension strap, pill-shaped cups and magnetic outer plates, in three official colorways.',
    signature: 'A swappable battery behind a magnetic cup plate means it never needs to stop for charging.',
    specs: [['Size', '87 × 172 × 210 mm'], ['Weight', '339 g'], ['Mic', 'Retractable boom, left cup'], ['Replaces', 'Arctis Nova Pro Wireless']],
    options: [
      { id: 'color', label: 'Color', type: 'variant', def: 'Black', choices: [
        { v: 'Black', hex: '#1a1a1a', images: ['1VkqkV7Z3WN1ygbODUmPmH/173e839d023259f2b94b667288d5cf20/arctis_nova_pro_omni_black_pdp_img_buy_01.png?fm=webp&q=90&fit=scale&w=1920', '2lRW25yxCZzi5vfxq8dH3Z/7239ba889bab27644530fbd017e64eb0/arctis_nova_pro_omni_black_pdp_img_buy_02.png?fm=webp&q=90&fit=scale&w=1920', '5V6ZkJoGW71hn4tNoSwQWq/ab400ae23ebfbaee8ad48f5ba5b67a1b/arctis_nova_pro_omni_black_pdp_img_buy_03.png?fm=webp&q=90&fit=scale&w=1920', '7A08cBswa4rIsliuD8RM3W/03ae4fa2d0886a13b4142c7a3069860e/arctis_nova_pro_omni_black_pdp_img_buy_04.png?fm=webp&q=90&fit=scale&w=1920'].map(u => cf(CTF + u)) },
        { v: 'White', hex: '#e6e6e4', images: ['6pNzQDSGhzSwfnXPsL1ffa/33db2c17cc9a64a83ce8502bb6c59bf3/arctis_nova_pro_omni_white_pdp_img_buy_01.png?fm=webp&q=90&fit=scale&w=1920', '3H5sA1eTHq1xhQG0az91yS/fe09b4823fdac1251c6a55c4c74da05e/arctis_nova_pro_omni_white_pdp_img_buy_02.png?fm=webp&q=90&fit=scale&w=1920', '39QSF3uIRDmQRJ5zYSblkc/84a183ca9f6688b370d70a5c16857598/arctis_nova_pro_omni_white_pdp_img_buy_03.png?fm=webp&q=90&fit=scale&w=1920', '3OrXF3kBYsm3Pd0lOL1bcV/6fc91e935e4ce1c9c09e1b6f615629f7/arctis_nova_pro_omni_white_pdp_img_buy_04.png?fm=webp&q=90&fit=scale&w=1920'].map(u => cf(CTF + u)) },
        { v: 'Midnight Blue', hex: '#1e2a44', images: ['5rTnlK7KQIEa6g1Sel1k8M/4875e5071c7b8aa9d3ead1ef09f4f49e/arctis_nova_pro_omni_midnight_blue_pdp_img_buy_01_15.png?fm=webp&q=90&fit=scale&w=1920', '1gB5XH9QENrow4w3xHqXQ6/fc193ca5fee44c60ca38b257e8160849/arctis_nova_pro_omni_midnight_blue_pdp_img_buy_02.png?fm=webp&q=90&fit=scale&w=1920', '7oiHP8mtMrw1xdeRJZc77I/6190e21641f503e24068811217511bcf/arctis_nova_pro_omni_midnight_blue_pdp_img_buy_03.png?fm=webp&q=90&fit=scale&w=1920', '58ifp4A73Jy5PoMJJcpzVX/c5670c02516c195995fd5f5650405ee6/arctis_nova_pro_omni_midnight_blue_pdp_img_buy_04.png?fm=webp&q=90&fit=scale&w=1920'].map(u => cf(CTF + u)) },
      ] },
    ],
  },
  {
    id: 'pro-x-2-lightspeed', cat: 'audio', brand: 'Logitech G', name: 'Pro X 2 Lightspeed', price: 249, kind: 'headset', gallery: 'color',
    source: 'https://www.logitechg.com/en-us/products/gaming-audio/pro-x-2-wireless-headset.981-001262.html',
    tag: 'Esports headset with aluminum forks',
    blurb: 'Round cups with machined aluminum forks on a steel-sprung band, with both leatherette and velour pads in the box.',
    signature: 'Esports-classic round aluminum cups on a steel-sprung band.',
    specs: [['Size', '176 × 95 × 189 mm'], ['Weight', '345 g'], ['Drivers', '50 mm graphene'], ['Mic', 'Detachable boom with windscreen']],
    options: [
      { id: 'color', label: 'Color', type: 'variant', def: 'Black', choices: ['Black', 'White', 'Magenta'].map((c, i) => ({
        v: c, hex: ['#1c1c1c', '#efefed', '#e0457f'][i],
        images: [`gallery-1-pro-x-2-lightspeed-gaming-headset-${c.toLowerCase()}.png`, `gallery-2-pro-x-2-lightspeed-gaming-headset-${c.toLowerCase()}.png`, `pro-x-2-headset-${c.toLowerCase()}-3qtr-back-left-angle-gallery-4-award.png`, `gallery-4-pro-x-2-lightspeed-gaming-headset-${c.toLowerCase()}.png`].map(u => lg(LGG + 'pro-x-2-lightspeed/gallery/' + u)),
      })) },
    ],
  },
  {
    id: 'wood-headphone-stand', cat: 'audio', brand: 'Grovemade', name: 'Wood Headphone Stand', price: 220, kind: 'stand', gallery: 'wood',
    source: 'https://grovemade.com/product/wood-headphone-stand/',
    tag: 'Hardwood saddle on a steel and leather foot',
    blurb: 'A sculpted hardwood upright on a leather-inlaid stainless steel foot. Choose the wood and add an engraving.',
    signature: 'A sculpted hardwood saddle anchored by a leather-inlaid steel foot.',
    specs: [['Size', '229 mm tall, 146 mm wide, base 98 × 114 mm'], ['Weight', '1.02 kg'], ['Materials', 'Hardwood, stainless steel, leather, cork']],
    options: [
      { id: 'wood', label: 'Wood', type: 'variant', def: 'Walnut', choices: [
        { v: 'Walnut', hex: '#5c3d2a', images: ['walnut-headphone-stand-grid-A2_cn5NMwp.jpg?_v=1622041949.654405', 'walnut-headphone-stand-grid-D1.jpg?_v=1561080219.601914', 'walnut-headphone-stand-grid-E1.jpg?_v=1561133884.2165966', 'walnut-headphone-stand-grid-B2_fuwMEc8.jpg?_v=1622041949.6677382'].map(u => GM + u) },
        { v: 'Maple', hex: '#e3cfa7', images: ['maple-headphone-stand-grid-A1_1.jpg?_v=1561061338.9322507', 'maple-headphone-stand-grid-D1.jpg?_v=1561065184.6734395', 'maple-headphone-stand-grid-E1.jpg?_v=1561067307.0374148', 'maple-headphone-stand-grid-B2.jpg?_v=1561065184.6701062'].map(u => GM + u) },
        { v: 'Oak', hex: '#c9a77a', images: ['oak-headphone-stand-GalA-A1.jpg?_v=1696541411.9882941', 'oak-headphone-stand-GalA-B1.jpg?_v=1696541411.9962943', 'oak-headphone-stand-GalA-D1.jpg?_v=1696614392.6934452', 'oak-headphone-stand-GalA-E1.jpg?_v=1696541412.0082946'].map(u => GM + u) },
        { v: 'Blackened Walnut', hex: '#1f1b19', images: ['blackened-walnut-headphone-stand-GalA-A1.jpg?_v=1696634032.974268', 'blackened-walnut-headphone-stand-GalA-B1.jpg?_v=1696878784.0365436', 'blackened-walnut-headphone-stand-GalA-D1.jpg?_v=1696634032.9862683', 'blackened-walnut-headphone-stand-GalA-E1.jpg?_v=1696634032.9862683'].map(u => GM + u) },
      ] },
      { id: 'engrave', label: 'Engraving', type: 'text', max: 16, price: 15, def: '', placeholder: 'Up to 16 characters' },
    ],
  },
  {
    id: 'coiled-aviator-cable', cat: 'cables', brand: 'Keychron', name: 'Coiled Aviator Cable', price: 15, kind: 'cable', gallery: 'sleeve',
    source: 'https://www.keychron.com/products/keychron-custom-coiled-cable',
    tag: 'Coiled USB-C cable with a GX12 aviator',
    blurb: 'A braided coiled cable with a knurled five-pin aviator coupling, in ten sleeve colors.',
    signature: 'A tight coil and a knurled aviator coupling, a desk-setup favourite.',
    specs: [['Length', 'About 90 cm straight plus a 46 cm coil'], ['Connectors', 'USB-C both ends, USB-A adapter included'], ['Coupling', '5-pin GX12 aviator']],
    options: [
      { id: 'sleeve', label: 'Sleeve', type: 'variant', def: 'Blue', choices: [
        { v: 'Black', hex: '#1f1f20', images: ['products/Keychron-custom-coiled-aviator-USB-type-C-cable-black-color.jpg', 'products/Keychron-custom-coiled-aviator-USB-type-C-cable-for-keyboards-black-color.jpg'] },
        { v: 'Blue', hex: '#2c4a7a', images: ['products/Keychron-custom-coiled-aviator-USB-type-C-cable-blue-color.jpg', 'products/Keychron-custom-coiled-aviator-USB-type-C-cable-for-keyboards-blue-color.jpg'] },
        { v: 'Grey', hex: '#8a8d90', images: ['products/Keychron-custom-coiled-aviator-USB-type-C-cable-grey-color.jpg', 'products/Keychron-custom-coiled-aviator-USB-type-C-cable-for-keyboards-grey-color.jpg'] },
        { v: 'White', hex: '#ececea', images: ['files/Keychron-custom-coiled-aviator-USB-type-C-cable-white-color.jpg', 'files/Keychron-custom-coiled-aviator-USB-type-C-cable-for-keyboards-white-color.jpg', 'files/Keychron-custom-coiled-aviator-USB-type-C-cable-white-color-with-angled-connector.jpg'] },
        { v: 'Pink Orange', hex: '#f2a07b', images: ['products/coiled-cable-Pink-Orange-1.jpg', 'files/Keychron-custom-coiled-aviator-USB-type-C-cable-Pink-Orange.jpg', 'files/coiled-cable-Pink-Orange-3_dd218e10-ac3e-4611-8ae9-954bd64214fe.jpg'] },
        { v: 'Light Pink', hex: '#f4c6cf', images: ['products/coiled-cable-light-pink-1.jpg', 'files/Keychron-custom-coiled-aviator-USB-type-C-cable-Light-Pink.jpg', 'files/coiled-cable-light-pink-3_64d8c94b-a45e-4043-a657-5ca329fbb095.jpg'] },
        { v: 'Yellow', hex: '#f3d36b', images: ['files/coiled-cable-yellow-1_05269fa6-66f7-428a-acf9-46837682dfee.jpg', 'files/Keychron-custom-coiled-aviator-USB-type-C-cable-Yellow.jpg', 'files/coiled-cable-yellow-3_59208a50-4485-45d3-b38a-544e15c0f25c.jpg'] },
        { v: 'Light Purple', hex: '#c3b3e0', images: ['products/coiled-cable-light-purple-1.jpg', 'files/Keychron-custom-coiled-aviator-USB-type-C-cable-Light-Purple.jpg', 'files/coiled-cable-light-purple-3_3cbc17df-4aa5-4638-9161-a71455464b7f.jpg'] },
        { v: 'Mint', hex: '#a8dcc6', images: ['products/coiled-cable-mint-1.jpg', 'files/Keychron-custom-coiled-aviator-USB-type-C-cable-Mint.jpg', 'files/coiled-cable-mint-3_ae7cfb20-2808-4e85-bfb9-bd9195dc35df.jpg'] },
        { v: 'Light Blue', hex: '#a9cbea', images: ['products/coiled-cable-light-blue-1.jpg', 'files/Keychron-custom-coiled-aviator-USB-type-C-cable-Light-Blue.jpg', 'files/coiled-cable-light-blue-3_a5e993da-c6a7-4bc4-987e-1b9ec1e81368.jpg'] },
      ].map(c => ({ ...c, images: c.images.map(u => SHOP + u) })) },
      { id: 'plug', label: 'Keyboard plug', type: 'choice', choices: [{ v: 'Straight' }, { v: 'Angled' }], def: 'Straight' },
    ],
  },
  {
    id: 'keyboard-carrying-case', cat: 'cables', brand: 'Keychron', name: 'Keyboard Carrying Case', price: 31, kind: 'case', gallery: 'size',
    source: 'https://www.keychron.com/products/keychron-keyboard-carrying-case',
    tag: 'Made-to-measure EVA case for your board',
    blurb: 'A semi-rigid EVA clamshell with a canvas cover, cut to the exact size of your keyboard.',
    signature: 'A made-to-measure EVA shell that turns a 75% board into a carry-on.',
    specs: [['Shell', 'Semi-rigid EVA with canvas cover'], ['Color', 'Dark grey'], ['Fits', 'Keychron Q, V, K and P models']],
    options: [
      { id: 'size', label: 'Fits', type: 'variant', def: 'Q1', choices: [
        { v: 'Q1', label: '75% · Q1, Q1 Max, V1', mm: [420, 199, 55], images: ['products/keychron-q1-keyboard-carrying-case.jpg'] },
        { v: 'Q2', label: '65% · Q2, Q2 Max', mm: [360, 199, 55], images: ['products/Carrying-Case-for-Keychron-Q2.jpg'] },
        { v: 'Q3', label: 'TKL · Q3, Q3 Max', mm: [440, 199, 55], price: 2, images: ['products/keychron-q3-keyboard-carrying-case.jpg'] },
        { v: 'Q6', label: 'Full size · Q6, Q6 Max', mm: [490, 200, 55], price: 4, images: ['products/Keychron-Q6-Custom-Mechanical-Keyboard.jpg'] },
        { v: 'K2', label: 'K2 aluminum', mm: [367, 203, 55], images: ['products/keychron-k2-keyboard-carrying-case-k2-aluminum.jpg'] },
        { v: 'K8', label: 'K8 aluminum', mm: [415, 203, 55], images: ['products/keychron-k8-keyboard-carrying-case-for-alu-frame-version.jpg'] },
      ].map(c => ({ ...c, images: [...c.images.map(u => SHOP + u), SHOP + 'products/keychron-keyboard-carrying-case.jpg'] })) },
    ],
  },
];
export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
export const defaultsOf = p => Object.fromEntries(p.options.map(o => [o.id, o.def]));
export const choiceOf = (p, id, v) => { const o = p.options.find(x => x.id === id); return o && o.choices ? o.choices.find(c => c.v === v) : null; };
// The chosen variant (color, wood, sleeve or size) and its photos
export const variantOf = (p, cfg = {}) => { const o = p.options.find(x => x.id === p.gallery); return o.choices.find(c => c.v === cfg[o.id]) || o.choices.find(c => c.v === o.def) || o.choices[0]; };
export const photosOf = (p, cfg) => variantOf(p, cfg).images;
export function priceOf(p, cfg) {
  let t = p.price;
  p.options.forEach(o => {
    const v = cfg[o.id];
    if (o.type === 'choice' || o.type === 'variant') { const c = o.choices.find(c => c.v === v); if (c && c.price) t += c.price; }
    else if (o.type === 'toggle' && v) t += o.price;
    else if (o.type === 'text' && v && String(v).trim()) t += o.price;
  });
  return t;
}
export function summaryOf(p, cfg) {
  return p.options.map(o => {
    const v = cfg[o.id];
    if (o.type === 'variant' || o.type === 'choice') { const c = o.choices.find(c => c.v === v) || {}; return `${o.label}: ${c.label || c.v || v}`; }
    if (o.type === 'toggle') return v && o.price ? o.label : null;
    if (o.type === 'text') return v && v.trim() ? `${o.label}: “${v.trim()}”` : null;
    return null;
  }).filter(Boolean);
}
