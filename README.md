# keycapgen

A storefront for custom keyboards and desk accessories, built with [Astro](https://astro.build) and three.js.
Shoppers design every key of a keyboard in 3D, configure matching accessories, and check out (prototype checkout: no payments).

## Run it

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
npm run preview   # serve the built site
```

Requires Node 18.20+ (tested with Node 22).

## Product photos

Product pages and cards use the makers' own photos. By default they load from the makers' sites. To serve your own copies (faster, and needed wherever outside images are blocked):

```sh
npm run photos    # downloads every photo into public/photos/ and writes public/photos/manifest.json
npm run build
```

The site switches to the local copies automatically; anything that didn't download keeps loading from the maker. If a photo can't load at all, a drawing is shown in its place.

## Pages

| Route | What it does |
|---|---|
| `/` | Home: featured board, categories, featured keyboards, keycap sets |
| `/shop` | All products with category filters and price sorting |
| `/keyboards` | The nine keyboard models with maker photos per colorway, filterable by layout |
| `/keyboards/[id]` | One page per keyboard model: photo gallery per stock colorway, specs, and a "Customize in 3D" button that opens it in the customizer |
| `/products/[id]` | One page per accessory (built from `src/data/products.js`): photo gallery per colorway, add-ons, price |
| `/customize` | The full 3D keyboard customizer (the only 3D page), with live price and add to cart |
| `/cart`, `/checkout`, `/order-placed` | Cart (kept in localStorage), prototype checkout and confirmation |

## View transitions

`src/layouts/Base.astro` adds Astro's `<ClientRouter />`, so every link navigates with the browser's View Transitions API instead of a full reload:

- **Page content** slides up and fades in (a custom `transition:animate` on `<main>`); going back reverses the direction.
- **The 3D stage** morphs in: the home hero photo or a keyboard page photo grows into the customizer viewport (`view-transition-name: studio-stage`).
- **Product cards** morph into the product page: card art → large preview (`prod-<id>`), card title → page heading (`prod-title-<id>`). Keyboard cards do the same into the keyboard page (`kb-<id>`, `kb-title-<id>`).
- **The nav** is `transition:persist`, so it stays put and keeps the cart badge.
- `prefers-reduced-motion` turns the animations off.

## How the 3D engine survives navigation

The customizer (`src/engine/studio.js`) is loaded on demand the first time a page needs it, then stays alive for the rest of the visit.
It builds its own UI from `studio-ui.html` once and keeps it in memory. The customizer page provides a mount point (`data-studio="customize"`), and on each `astro:after-swap` the engine moves its canvas and panels into it, before the new view-transition snapshot is taken. Edits, undo history and the WebGL scene carry across pages.

## Project layout

```
src/
  data/keyboards.js   layouts, keycap profiles, 9 models, 21 keycap sets + stock finishes (pure data)
  data/products.js    accessory catalog (10 real products): colorways with maker photos, add-ons, pricing
  data/kbPhotos.js    maker photos for each keyboard edition
  lib/photo.js        photo markup with a drawn fallback when a photo can't load
  lib/svg.js          product and keyboard drawings (fallback for photos; keycap-set previews)
  lib/samples.js      procedural print/skin images (canvas)
  lib/cart.js         cart storage, toast, page-URL helper
  lib/util.js         money formatting and color helpers
  engine/studio.js    three.js scene + customizer (drawing, skins, isolation, demo…)
  engine/studio-ui.html  the customizer's markup
  scripts/site.js     page setup on every navigation (shop filters, product options, cart, checkout)
  layouts/Base.astro  head, nav, footer, ClientRouter
  components/         ProductCard, BoardCard, CtaBanner
  pages/              routes listed above
  styles/global.css   design tokens (ByteTactix system: Poppins, sky blue), light/dark themes, view-transition animations
```

## Notes

- Prices, products and delivery options are placeholders.
- Checkout is a prototype: it validates the form and shows a confirmation; no payment is taken and nothing is sent anywhere.
- Product photos are loaded from the makers' own sites (Logitech, Razer, SteelSeries, Keychron, Grovemade, Wooting, PFU, NuPhy). They belong to those companies: a live store needs their permission or reseller assets, ideally self-hosted. If a photo can't load, the page shows a drawing instead.
- Keyboard models are simplified illustrations; keycapgen is not affiliated with the brands shown. Keycap set colors approximate well-known GMK, SA and ePBT sets.
- The cart and the current design are stored in the visitor's browser (localStorage).
