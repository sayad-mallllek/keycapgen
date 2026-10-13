# Keycap Studio

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

## Pages

| Route | What it does |
|---|---|
| `/` | Home: live 3D preview of the shopper's current board, categories, featured boards, keycap sets |
| `/shop` | All products with category filters and price sorting |
| `/keyboards` | The nine keyboard models, filterable by layout |
| `/products/[id]` | One page per accessory (built from `src/data/products.js`) with a 360° 3D model and options |
| `/customize` | The full 3D keyboard customizer, with live price and add to cart |
| `/cart`, `/checkout`, `/order-placed` | Cart (kept in localStorage), prototype checkout and confirmation |

## View transitions

`src/layouts/Base.astro` adds Astro's `<ClientRouter />`, so every link navigates with the browser's View Transitions API instead of a full reload:

- **Page content** slides up and fades in (a custom `transition:animate` on `<main>`); going back reverses the direction.
- **The 3D stage** morphs between pages: the home hero, the art on a keyboard card and the customizer viewport all share `view-transition-name: studio-stage`.
- **Product cards** morph into the product page: card art → large preview (`prod-<id>`), card title → page heading (`prod-title-<id>`).
- **The nav** is `transition:persist`, so it stays put and keeps the cart badge.
- `prefers-reduced-motion` turns the animations off.

## How the 3D engine survives navigation

The customizer (`src/engine/studio.js`) is loaded on demand the first time a page needs it, then stays alive for the rest of the visit.
It builds its own UI from `studio-ui.html` once and keeps it in memory. Pages only provide a mount point (`data-studio="hero"` or `data-studio="customize"`), and on each `astro:after-swap` the engine moves its canvas and panels into the new page. That happens before the new view-transition snapshot is taken, so the hero ↔ customizer morph shows the live board. Edits, undo history and the WebGL scene all carry across pages.

## Project layout

```
src/
  data/keyboards.js   layouts, keycap profiles, 9 models, 21 keycap sets + stock finishes (pure data)
  data/products.js    accessory catalog (10 real products), options and pricing
  lib/svg.js          product and keyboard illustrations as SVG (rendered at build time and live in the browser)
  lib/samples.js      procedural print/skin images (canvas)
  lib/cart.js         cart storage, toast, page-URL helper
  lib/util.js         money formatting and color helpers
  engine/products3d.js procedural 3D models of the accessories, product viewer and thumbnail renderer
  engine/studio.js    three.js scene + customizer (drawing, skins, isolation, demo…)
  engine/studio-ui.html  the customizer's markup
  scripts/site.js     page setup on every navigation (shop filters, product options, cart, checkout)
  layouts/Base.astro  head, nav, footer, ClientRouter
  components/         ProductCard, BoardCard
  pages/              routes listed above
  styles/global.css   design tokens (Public Sans, royal blue), light/dark themes, view-transition animations
```

## Notes

- Prices, products and delivery options are placeholders.
- Checkout is a prototype: it validates the form and shows a confirmation; no payment is taken and nothing is sent anywhere.
- Accessories are real products (Logitech, Razer, SteelSeries, Grovemade…) modeled procedurally from their published dimensions. Card and cart images are rendered from the same 3D models.
- Keyboard models are simplified illustrations; Keycap Studio is not affiliated with the brands shown. Keycap set colors approximate well-known GMK, SA and ePBT sets.
- The cart and the current design are stored in the visitor's browser (localStorage).
