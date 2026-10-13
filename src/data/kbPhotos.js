// Maker product photos for each keyboard edition (model id -> edition slug -> photos).
// Copied from the makers' product pages. Keycap Studio 75 is our own design, so it has no photo.
const lg = u => u.replace('d_transparent.gif/', '').replace('w_544,h_466,', 'w_960,h_823,');
const cf = u => u.replace('w=1920', 'w=1400');
const KC = 'https://cdn.shopify.com/s/files/1/0059/0630/1017/files/';
const LGK = 'https://resource.logitechg.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/gaming/en/products/pro-x-tkl/';
const CTF = 'https://images.ctfassets.net/hmm5mo4qf4mf/';
const RZ = 'https://assets3.razerzone.com/';
const BC = 'https://cdn11.bigcommerce.com/s-bj9b4ipm7o/images/stencil/1280x1280/products/';
const q1 = c => `${KC}Keychron-Q1-Max-QMK-VIA-Wireless-Custom-Mechanical-Keyboard-75_-Layout-Aluminum-${c}-Fully-Assembled-Knob-for-Mac-Windows-Linux-Gateron-Jupiter-Red.jpg`;
const q6 = c => `${KC}Keychron-Q6-Max-QMK-VIA-Wireless-Custom-Mechanical-Keyboard-100_-Layout-Aluminum-${c}-Fully-Assembled-Knob-for-Mac-Windows-Linux-Gateron-Jupiter-Red.jpg`;

export const KB_PHOTOS = {
  q1max: { carbon: [q1('Black')], shell: [q1('White')], purple: [q1('Purple')] },
  q6max: { carbon: [q6('Black')], shell: [q6('White')] },
  apexpro: {
    black: ['4JowI26eF16rzKZ2fMJpI7/30f8b3e7ee6f957b5a927f526ada0185/apex_pro_tkl_gen_3_black_img_buy_01.png__1920x1080_crop-fit_optimize_subsampling-2-3759.png?fm=webp&q=90&fit=scale&w=1920', '7uVSrb7FETDVvuq9VaRw8q/b5207825d2e5c68900a25008951d7133/apex_pro_tkl_gen_3_black_img_buy_03.png__1920x1080_crop-fit_optimize_subsampling-2-3762.png?fm=webp&q=90&fit=scale&w=1920'].map(u => cf(CTF + u)),
    white: ['22R7jt4S6sI4Np6PgnpwFh/cc87592b85a191dbe3ce292e63d36d99/apex_pro_tkl_gen_3_white_img_buy_01_us.png?fm=webp&q=90&fit=scale&w=1920', '7wwooOp6aDbclct2ZITGSv/1ce91a28541835a7fddd3e78df9f42d9/apex_pro_tkl_gen_3_white_img_buy_03.png?fm=webp&q=90&fit=scale&w=1920'].map(u => cf(CTF + u)),
  },
  wooting60: {
    black: ['https://cdn.shopify.com/s/files/1/1008/0269/1355/files/products_W60HE_ANSI_US_PBT_c5da3e11-45aa-43f1-95ee-500f7bb0968b.jpg', 'https://wooting-website.ams3.cdn.digitaloceanspaces.com/products/keyboards/60HE/60HE_OG.webp'],
  },
  hhkb: {
    charcoal: ['3374/14071/hhkb_3_hybrid_S_charcoal_printed_ecomm_297201__24669__31178.1781557336.jpg?c=2', '3374/14072/hypbrid_black_side_view_no_foot_ecomm__05273__01133.1781557336.jpg?c=2'].map(u => BC + u),
    white: ['3372/14075/hhkb_3_hybrid_S_white_printed_ecomm_297001__73892__34406.1781557665.jpg?c=2', '3372/14077/hypbrid_white_side_view_no_foot_ecomm__06140__76317.1781557665.jpg?c=2'].map(u => BC + u),
    snow: ['3481/14033/1_top_straight_abovesnow_en__29744__74323.1781556867.jpg?c=2', '3481/14035/4_right_downsnow_en__49423__69176.1781556867.jpg?c=2'].map(u => BC + u),
  },
  air75: {
    dark: ['https://cdn.shopify.com/s/files/1/0268/7297/1373/files/Air75_V3_Main04_v2_1800x_F5F5F5.jpg'],
    white: ['https://cdn.shopify.com/s/files/1/0268/7297/1373/files/NuPhy_Air75_V3_Nova_White_lSO-FR_Main01_1800x_F5F5F5.jpg', 'https://cdn.shopify.com/s/files/1/0268/7297/1373/files/2.4_Air75_v3.jpg'],
  },
  gprox: {
    black: ['gallery-2-pro-x-tkl-black-lightspeed-gaming-keyboard.png.png', 'pro-x-tkl-black-3qtr-angle-gallery-2-us-award-2.png'].map(u => lg(LGK + u)),
    white: ['gallery-2-pro-x-tkl-white-lightspeed-gaming-keyboard.png', 'pro-x-tkl-white-3qtr-angle-gallery-2-us-award-2.png'].map(u => lg(LGK + u)),
    magenta: ['gallery-2-pro-x-tkl-magenta-lightspeed-gaming-keyboard.png', 'gallery-4-pro-x-tkl-magenta-lightspeed-gaming-keyboard-us.png'].map(u => lg(LGK + u)),
  },
  huntsman: {
    black: ['aJ35BGn2XfFLuNHZtruJnwsT_mE=/1500x1000/https%3A%2F%2Fmedias-p1.phoenix.razer.com%2Fsys-master-phoenix-images-container%2Fh9c%2Fh37%2F9662065770526%2F230921-huntsman-v3-pro-tkl-1500x1000-1.jpg', 'lJZeGqJedq7oZoqmv9I8zzY2gQA=/1500x1000/https%3A%2F%2Fmedias-p1.phoenix.razer.com%2Fsys-master-phoenix-images-container%2Fhf7%2Fhac%2F9814446702622%2F240909-huntsman-v3-pro-tkl-1500x1000-2.jpg'].map(u => RZ + u),
    white: ['KD5SBneigdw4-FMm09FBoXTsjRg=/1500x1000/https%3A%2F%2Fmedias-p1.phoenix.razer.com%2Fsys-master-phoenix-images-container%2Fh5d%2Fhe3%2F9774773534750%2F240509-huntsman-v3-pro-tkl-white-1500x1000-1.jpg', 'zoLZW_-nODP9A_0Gqfg4aHUNOVQ=/1500x1000/https%3A%2F%2Fmedias-p1.phoenix.razer.com%2Fsys-master-phoenix-images-container%2Fh89%2Fha8%2F9814446899230%2F240909-huntsman-v3-pro-tkl-white-1500x1000-2.jpg'].map(u => RZ + u),
  },
};
export const kbPhotos = (mid, slug) => (KB_PHOTOS[mid] || {})[slug] || null;
