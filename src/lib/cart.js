// Cart kept in this browser (localStorage), plus the toast and page-URL helpers.
const CART_KEY = 'keycap-studio-cart';
export let cart = load();
function load() {
  try { const c = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); return Array.isArray(c) ? c : []; } catch (e) { return []; }
}
export function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  catch (e) { try { localStorage.setItem(CART_KEY, JSON.stringify(cart.map(i => ({ ...i, design: undefined })))); } catch (e2) {} }
  refreshBadge();
}
export function upsert(item) {
  const i = cart.findIndex(c => c.id === item.id);
  if (i >= 0 && item.keepQty) item.qty = cart[i].qty;  // editing a design keeps the quantity already chosen
  delete item.keepQty;
  if (i >= 0) cart[i] = item; else cart.push(item);
  saveCart();
}
export function clearCart() { cart.length = 0; saveCart(); }
export const cartCount = () => cart.reduce((a, i) => a + i.qty, 0);
export const cartTotal = () => cart.reduce((a, i) => a + i.price * i.qty, 0);
export const shippingFor = (sub, express) => express ? 24 : sub >= 150 ? 0 : 9;
export function refreshBadge() {
  const b = document.getElementById('cartCount'); if (!b) return;
  const n = cartCount(); b.textContent = n; b.dataset.n = n;
}

let toastT = 0;
export function toast(msg) {
  const t = document.getElementById('toast'); if (!t) return;
  document.getElementById('toastMsg').textContent = msg;
  document.getElementById('toastLink').href = pageUrl('cart');
  t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3600);
}

// Page links: "/shop" when deployed normally, "shop.html" in the single-folder preview build.
export function pageUrl(name) {
  const m = document.querySelector('meta[name="ks-base"]');
  const base = m ? m.content : '/', ext = m ? (m.dataset.ext || '') : '';
  if (!name || name === 'home') return m && m.dataset.home ? base + m.dataset.home : base;
  return base + (ext ? name.replace(/\//g, '-') : name) + ext;  // the preview build keeps every page in one folder
}
