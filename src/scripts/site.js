// Client script for every page. Astro's ClientRouter swaps pages without a full reload,
// so this module runs once and re-initializes each page on `astro:page-load`.
// Clicks are handled by delegation on `document`, which survives page swaps.
import { navigate } from 'astro:transitions/client';
import { cart, saveCart, upsert, clearCart, cartTotal, shippingFor, refreshBadge, toast, pageUrl } from '../lib/cart.js';
import { CATS, PRODUCT_BY_ID, PRINTS, defaultsOf, priceOf, summaryOf } from '../data/products.js';
import { artSVG, boardSVG } from '../lib/svg.js';
import { getSampleImages } from '../lib/samples.js';
import { money, uid, escA } from '../lib/util.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const printSrc = id => getSampleImages()[id] || null;

// Real-product 3D models (viewer on product pages, rendered thumbnails for cards and the cart)
let p3d = null;
const load3d = () => p3d || (p3d = import('../engine/products3d.js'));
async function getThumb(p, cfg, w = 560, h = 420) {
  const key = 'ks-t:' + p.id + ':' + w + ':' + JSON.stringify(cfg);
  const cacheable = key.length < 3000;   // skip session caching for configs that carry an uploaded image
  if (cacheable) { try { const hit = sessionStorage.getItem(key); if (hit) return hit; } catch (e) {} }
  const { thumbnail } = await load3d();
  const url = await thumbnail(p, cfg, w, h);
  if (cacheable) { try { sessionStorage.setItem(key, url); } catch (e) {} }
  return url;
}
// Swap the build-time illustrations for renders of the 3D models
// Renders yield to idle time and stop as soon as a navigation starts, so they never hold up a page change
let thumbGen = 0;
document.addEventListener('astro:before-preparation', () => { thumbGen++; });
const idle = () => new Promise(r => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 600 }) : setTimeout(r, 60)));
async function fillThumbs() {
  const gen = thumbGen;
  await idle();
  const els = [...document.querySelectorAll('.card[data-pid] .card-media, [data-thumb]')];
  for (const el of els) {
    if (gen !== thumbGen) return;
    const pid = el.dataset.thumb || (el.closest('[data-pid]') || {}).dataset?.pid, p = PRODUCT_BY_ID[pid]; if (!p) continue;
    const url = await getThumb(p, defaultsOf(p));
    if (gen !== thumbGen) return;
    await idle();
    if (el.isConnected) el.innerHTML = `<img src="${url}" alt="${escA(p.brand + ' ' + p.name)}">`;
  }
}
async function fillItemThumbs(scope) {
  const gen = thumbGen;
  for (const el of document.querySelectorAll(`${scope} [data-item]`)) {
    const it = cart.find(i => i.id === el.dataset.item); if (!it || it.type !== 'product') continue;
    const p = PRODUCT_BY_ID[it.pid]; if (!p || gen !== thumbGen) continue;
    const url = await getThumb(p, it.cfg, 400, 300);
    if (el.isConnected) el.innerHTML = `<img src="${url}" alt="">`;
  }
}

// The 3D engine (three.js) loads only when a page needs it, then stays alive across navigations.
let studio = null, studioP = null;
const loadStudio = () => studioP || (studioP = import('../engine/studio.js').then(m => (studio = m)));

// Mount the engine synchronously right after the DOM swap, so the view transition's
// "new" snapshot already shows the 3D canvas in its new place (hero <-> customizer morph).
document.addEventListener('astro:after-swap', () => { if (studio) studio.attach(); });

document.addEventListener('astro:page-load', async () => {
  refreshBadge(); markNav();
  const page = document.body.dataset.page;
  if (page === 'shop') initShop();
  if (page === 'keyboards') initKeyboards();
  if (page === 'product') initProduct();
  if (page === 'cart') renderCart();
  if (page === 'checkout') initCheckout();
  if (page === 'done') renderDone();
  fillThumbs();
  if (document.querySelector('[data-studio]')) { await loadStudio(); studio.attach(); }
  else if (studio) studio.detach();
});

function markNav() {
  const page = document.body.dataset.page;
  const key = page === 'product' ? 'shop' : page === 'checkout' || page === 'done' ? 'cart' : page;
  $$('[data-nav]').forEach(a => { if (a.dataset.nav === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  // The nav persists across swaps; refresh its links so relative URLs stay right in the flat preview build
  $$('.nav [data-nav]').forEach(a => { a.setAttribute('href', pageUrl(a.dataset.nav)); });
  const brand = $('.nav .brand'); if (brand) brand.setAttribute('href', pageUrl('home'));
}

/* ---------- Delegated clicks ---------- */
document.addEventListener('click', async e => {
  // "Customize" on any keyboard card: load that board, morph the card art into the customizer stage
  const m = e.target.closest('[data-model]');
  if (m) {
    e.preventDefault();
    const card = m.closest('.card'), media = card && card.querySelector('.card-media');
    const hero = $('.hero-stage');
    if (hero) hero.style.viewTransitionName = 'none';
    if (media) media.style.viewTransitionName = 'studio-stage';
    await loadStudio(); studio.selectModel(m.dataset.model);
    navigate(pageUrl('customize'));
    return;
  }
  const set = e.target.closest('[data-set]');
  if (set) { await loadStudio(); studio.applyColorway(set.dataset.set); navigate(pageUrl('customize')); return; }
  const cat = e.target.closest('.cat[data-cat]');
  if (cat) { try { sessionStorage.setItem('ks-shopcat', cat.dataset.cat); } catch (err) {} }
  const sc = e.target.closest('[data-shopcat]');
  if (sc) { shopFilter(sc.dataset.shopcat); return; }
  const kb = e.target.closest('[data-kb]');
  if (kb) { kbFilter(kb.dataset.kb); return; }
});

/* ---------- Shop ---------- */
let shopCat = 'all';
function initShop() {
  try { const c = sessionStorage.getItem('ks-shopcat'); if (c) { shopCat = c === 'keyboards' ? 'keyboards' : c; sessionStorage.removeItem('ks-shopcat'); } } catch (e) {}
  $('#shopSort').addEventListener('change', applyShop);
  applyShop();
}
function shopFilter(c) { shopCat = c; applyShop(); }
function applyShop() {
  const grid = $('#shopGrid'); if (!grid) return;
  $$('[data-shopcat]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.shopcat === shopCat)));
  const sort = $('#shopSort').value, cards = [...grid.children];
  cards.forEach(c => { c.hidden = shopCat !== 'all' && c.dataset.cat !== shopCat; });
  cards.sort((a, b) => sort === 'low' ? a.dataset.price - b.dataset.price : sort === 'high' ? b.dataset.price - a.dataset.price : a.dataset.order - b.dataset.order);
  cards.forEach(c => grid.appendChild(c));
}

/* ---------- Keyboards ---------- */
function initKeyboards() { kbFilter('all'); }
function kbFilter(g) {
  $$('[data-kb]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.kb === g)));
  $$('#kbGrid .card').forEach(c => { c.hidden = g !== 'all' && c.dataset.layout !== g; });
}

/* ---------- Product page ---------- */
let pd = null, viewer = null;
async function initProduct() {
  viewer = null;
  const host = $('[data-product]'); if (!host) return;
  const p = PRODUCT_BY_ID[host.dataset.product]; if (!p) return;
  let edit = null;
  try { const id = sessionStorage.getItem('ks-edit'); if (id) { edit = cart.find(i => i.id === id && i.pid === p.id); sessionStorage.removeItem('ks-edit'); } } catch (e) {}
  pd = { p, cfg: edit ? { ...defaultsOf(p), ...edit.cfg } : defaultsOf(p), qty: edit ? edit.qty : 1, editId: edit ? edit.id : null };
  $('#pdQty').textContent = pd.qty;
  $('#pdAdd').textContent = pd.editId ? 'Update cart item' : 'Add to cart';
  $$('[data-q]').forEach(b => b.addEventListener('click', () => { pd.qty = Math.max(1, Math.min(20, pd.qty + +b.dataset.q)); $('#pdQty').textContent = pd.qty; }));
  $('#pdAdd').addEventListener('click', () => {
    const { p, cfg, qty, editId } = pd;
    upsert({ id: editId || uid(), type: 'product', pid: p.id, name: `${p.brand} ${p.name}`, lines: summaryOf(p, cfg), price: priceOf(p, cfg), qty, cfg: { ...cfg } });
    toast(editId ? `Updated ${p.name} in your cart` : `Added ${qty > 1 ? qty + ' × ' : ''}${p.name} to the cart`);
    if (editId) navigate(pageUrl('cart'));
  });
  renderOptions(); updatePreview();
  mountViewer(p);
}
function renderOptions() {
  const { p, cfg } = pd, S = getSampleImages();
  $('#pdOpts').innerHTML = p.options.filter(o => !o.showIf || o.showIf(cfg)).map(o => {
    const v = cfg[o.id], head = extra => `<div class="opt-h">${o.label}<span>${extra || ''}</span></div>`;
    if (o.type === 'swatch') { const cur = o.choices.find(c => c.v === v) || {}; return `<div class="opt">${head(cur.label + (cur.stock ? ' · stock' : '') + (cur.price ? ` · +${money(cur.price)}` : ''))}<div class="swatch-row">${o.choices.map(c => `<button type="button" class="sw" style="background:${c.v}" data-opt="${o.id}" data-v="${c.v}" aria-pressed="${c.v === v}" aria-label="${o.label}: ${c.label}" title="${c.label}${c.price ? ' +' + money(c.price) : ''}"></button>`).join('')}</div></div>`; }
    if (o.type === 'choice') return `<div class="opt">${head()}<div class="choice-row">${o.choices.map(c => `<button type="button" class="choice" data-opt="${o.id}" data-v="${escA(c.v)}" aria-pressed="${c.v === v}">${escA(c.label || c.v)}<small>${c.price ? '+' + money(c.price) : 'Included'}</small></button>`).join('')}</div></div>`;
    if (o.type === 'toggle') return `<div class="opt"><label class="toggle-row" for="opt-${o.id}"><span class="opt-h" style="flex:1">${o.label}<span>+${money(o.price)}</span></span><input type="checkbox" class="switch" id="opt-${o.id}" data-opt="${o.id}" ${v ? 'checked' : ''}></label></div>`;
    if (o.type === 'text') return `<div class="opt"><label class="opt-h" for="opt-${o.id}">${o.label}<span>+${money(o.price)} when added</span></label><input type="text" id="opt-${o.id}" data-opt="${o.id}" maxlength="${o.max}" placeholder="${o.placeholder}" value="${escA(v || '')}" autocomplete="off"></div>`;
    if (o.type === 'print') return `<div class="opt">${head()}<div class="print-row">${PRINTS.map(([id, name]) => `<button type="button" class="print" data-opt="print" data-v="${id}" aria-pressed="${v === id}" style="background-image:url(${S[id]})" aria-label="${name}" title="${name}"></button>`).join('')}
      <button type="button" class="print" data-opt="print" data-v="solid" aria-pressed="${v === 'solid'}">Solid</button>
      <label class="print" for="matUpload" aria-pressed="${v === 'upload'}" style="cursor:pointer;${cfg.printImg ? `background-image:url(${cfg.printImg})` : ''}">${cfg.printImg ? '' : 'Your image'}</label>
      <input type="file" id="matUpload" accept="image/*" class="sr-only"></div><p class="note" style="margin:0">Uploads are cropped to fill the mat.</p></div>`;
    return '';
  }).join('');
  $$('#pdOpts [data-opt]').forEach(el => {
    const ev = el.tagName === 'INPUT' ? (el.type === 'checkbox' ? 'change' : 'input') : 'click';
    el.addEventListener(ev, () => {
      cfg[el.dataset.opt] = el.type === 'checkbox' ? el.checked : el.tagName === 'INPUT' ? el.value : el.dataset.v;
      if (el.tagName === 'BUTTON') renderOptions();
      updatePreview();
    });
  });
  const up = $('#matUpload');
  if (up) up.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if (!f || !/^image\//.test(f.type)) return;
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => {
      const sc = Math.min(1, 1400 / Math.max(img.naturalWidth || 1400, img.naturalHeight || 1400)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round((img.naturalWidth || 1400) * sc)); c.height = Math.max(1, Math.round((img.naturalHeight || 1400) * sc));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      cfg.printImg = c.toDataURL('image/jpeg', 0.85); cfg.print = 'upload'; renderOptions(); updatePreview();
    }; img.src = r.result; };
    r.readAsDataURL(f);
  });
}
function updatePreview() {
  if (viewer && viewer.canvas.isConnected) viewer.show(pd.p, pd.cfg);
  else if (!viewer) $('#pdStage').innerHTML = artSVG(pd.p, pd.cfg, printSrc);
  $('#pdPrice').textContent = money(priceOf(pd.p, pd.cfg));
}
async function mountViewer(p) {
  const { createViewer } = await load3d();
  const stage = $('#pdStage'); if (!stage || !pd || pd.p !== p) return;
  stage.innerHTML = '';
  viewer = createViewer(stage);
  stage.insertAdjacentHTML('beforeend', '<span class="pd-hint">Drag to turn · scroll to zoom</span>');
  viewer.show(pd.p, pd.cfg);
}

/* ---------- Cart ---------- */
const thumbOf = i => i.type === 'board' ? (i.thumb ? `<img src="${i.thumb}" alt="">` : boardSVG(i.model)) : (PRODUCT_BY_ID[i.pid] ? `<span class="thumb-slot" data-item="${i.id}">${artSVG(PRODUCT_BY_ID[i.pid], i.cfg, printSrc)}</span>` : '');
function renderCart() {
  const v = $('#cartView'); if (!v) return;
  if (!cart.length) { v.innerHTML = `<div class="empty-cart"><h2>Your cart is empty</h2><p class="lede">Design a keyboard or pick an accessory to get started.</p><div class="row-btns"><a class="btn primary" href="${pageUrl('keyboards')}">Design a keyboard</a><a class="btn" href="${pageUrl('shop')}">Shop accessories</a></div></div>`; return; }
  const sub = cartTotal(), ship = shippingFor(sub, false);
  v.innerHTML = `<div class="cart-grid"><div>${cart.map(i => `<article class="ci" data-id="${i.id}"><div class="ci-thumb">${thumbOf(i)}</div>
      <div class="ci-info"><h3>${escA(i.name)}</h3><ul class="ci-lines">${(i.lines || []).map(l => `<li>${escA(l)}</li>`).join('')}</ul>
        <div class="ci-actions"><button type="button" class="linkbtn" data-act="edit">${i.type === 'board' ? 'Edit design' : 'Edit options'}</button><button type="button" class="linkbtn danger" data-act="remove">Remove</button></div></div>
      <div class="ci-right"><div class="qty"><button type="button" data-act="dec" aria-label="Decrease quantity">−</button><span>${i.qty}</span><button type="button" data-act="inc" aria-label="Increase quantity">+</button></div><strong>${money(i.price * i.qty)}</strong></div></article>`).join('')}</div>
    <aside class="summary"><h2>Order summary</h2>
      <div class="sum-row"><span>Subtotal</span><span>${money(sub)}</span></div>
      <div class="sum-row"><span>Shipping</span><span>${ship ? money(ship) : 'Free'}</span></div>
      ${ship ? `<p class="note" style="margin:0">Free standard shipping on orders over $150.</p>` : ''}
      <div class="sum-row total"><span>Total</span><span>${money(sub + ship)}</span></div>
      <a class="btn primary lg" href="${pageUrl('checkout')}" style="justify-content:center">Checkout</a></aside></div>`;
  fillItemThumbs('#cartView');
  $$('#cartView .ci').forEach(row => row.addEventListener('click', async e => {
    const act = e.target.closest('[data-act]'); if (!act) return;
    const i = cart.findIndex(c => c.id === row.dataset.id); if (i < 0) return;
    const it = cart[i];
    if (act.dataset.act === 'remove') cart.splice(i, 1);
    else if (act.dataset.act === 'inc') it.qty = Math.min(20, it.qty + 1);
    else if (act.dataset.act === 'dec') it.qty = Math.max(1, it.qty - 1);
    else if (act.dataset.act === 'edit') {
      if (it.type === 'board') {
        await loadStudio();
        if (!studio.loadDesign(it.design, it.id, it.model)) toast('The saved design was too large to keep, so the model is loaded without it');
        navigate(pageUrl('customize')); return;
      }
      try { sessionStorage.setItem('ks-edit', it.id); } catch (err) {}
      navigate(pageUrl('products/' + it.pid)); return;
    }
    saveCart(); renderCart();
  }));
}

/* ---------- Checkout ---------- */
const COUNTRIES = ['Lebanon', 'France', 'United Arab Emirates', 'Saudi Arabia', 'United Kingdom', 'Germany', 'United States', 'Canada', 'Other'];
const express = () => ($('input[name=ship]:checked') || {}).value === 'express';
function initCheckout() {
  if (!cart.length) { navigate(pageUrl('cart')); return; }
  $('#coCountry').innerHTML = COUNTRIES.map(c => `<option>${c}</option>`).join('');
  $$('input[name=ship]').forEach(r => r.addEventListener('change', renderSummary));
  $('#coForm').addEventListener('submit', placeOrder);
  renderSummary();
}
function renderSummary() {
  const sub = cartTotal(), ship = shippingFor(sub, express());
  $('#shipStd').textContent = sub >= 150 ? 'Free' : '$9';
  $('#coSummary').innerHTML = `<h2>Order summary</h2>${cart.map(i => `<div class="mini"><div class="ci-thumb">${thumbOf(i)}</div><div>${escA(i.name)}${i.qty > 1 ? ` × ${i.qty}` : ''}</div><strong>${money(i.price * i.qty)}</strong></div>`).join('')}
    <div class="sum-row"><span>Subtotal</span><span>${money(sub)}</span></div><div class="sum-row"><span>Shipping</span><span>${ship ? money(ship) : 'Free'}</span></div>
    <div class="sum-row total"><span>Total</span><span>${money(sub + ship)}</span></div>`;
  fillItemThumbs('#coSummary');
}
function placeOrder(e) {
  e.preventDefault();
  const req = [['coEmail', 'your email'], ['coName', 'your full name'], ['coAddr', 'a street address'], ['coCity', 'a city']];
  const miss = req.filter(([id]) => !$('#' + id).value.trim()), email = $('#coEmail').value.trim(), err = $('#coErr');
  if (miss.length) { err.textContent = `Please add ${miss.map(m => m[1]).join(', ')}.`; err.hidden = false; $('#' + miss[0][0]).focus(); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'That email address looks incomplete. Check it and try again.'; err.hidden = false; $('#coEmail').focus(); return; }
  err.hidden = true;
  const order = { num: 'KS-' + Math.floor(100000 + Math.random() * 900000), count: cart.reduce((a, i) => a + i.qty, 0), total: cartTotal() + shippingFor(cartTotal(), express()), email };
  try { sessionStorage.setItem('ks-order', JSON.stringify(order)); } catch (er) {}
  clearCart(); navigate(pageUrl('order-placed'));
}
function renderDone() {
  let o = null; try { o = JSON.parse(sessionStorage.getItem('ks-order') || 'null'); } catch (e) {}
  const v = $('#doneView'); if (!v) return;
  if (!o) { v.innerHTML = `<h1>No recent order</h1><p class="lede">Orders you place in this browser show up here.</p><a class="btn primary" href="${pageUrl('shop')}">Go to the shop</a>`; return; }
  v.innerHTML = `<div class="tick">✓</div><h1>Order placed</h1><p class="lede">Order ${o.num} · ${o.count} item${o.count > 1 ? 's' : ''} · ${money(o.total)}</p>
    <p class="demo-note">This is a prototype store, so no payment was taken and nothing will ship. In a live store, a confirmation would go to ${escA(o.email)}.</p>
    <div class="row-btns"><a class="btn primary" href="${pageUrl('shop')}">Keep shopping</a><a class="btn" href="${pageUrl('customize')}">Back to the customizer</a></div>`;
}
