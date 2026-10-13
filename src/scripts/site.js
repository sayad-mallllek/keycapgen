// Client script for every page. Astro's ClientRouter swaps pages without a full reload,
// so this module runs once and re-initializes each page on `astro:page-load`.
// Clicks are handled by delegation on `document`, which survives page swaps.
import { navigate } from 'astro:transitions/client';
import { cart, saveCart, upsert, clearCart, cartTotal, shippingFor, refreshBadge, toast, pageUrl } from '../lib/cart.js';
import { PRODUCT_BY_ID, defaultsOf, priceOf, summaryOf, variantOf, photosOf } from '../data/products.js';
import { artSVG, boardSVG } from '../lib/svg.js';
import { photoHTML, markBrokenPhotos } from '../lib/photo.js';
import { MODELS } from '../data/keyboards.js';
import { money, uid, escA } from '../lib/util.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// The 3D engine (three.js) loads only when a page needs it, then stays alive across navigations.
let studio = null, studioP = null;
const loadStudio = () => studioP || (studioP = import('../engine/studio.js').then(m => (studio = m)));

// Mount the engine synchronously right after the DOM swap, so the view transition's
// "new" snapshot already shows the 3D canvas in place (keyboard photo -> customizer morph).
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
  markBrokenPhotos();
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
    const card = m.closest('.card'), media = card ? card.querySelector('.card-media') : m.closest('.hero-stage');
    $$('.hero-stage').forEach(h => { h.style.viewTransitionName = 'none'; });
    if (media) media.style.viewTransitionName = 'studio-stage';
    const edition = m.dataset.edition || (card && card.dataset.edition);
    await loadStudio(); studio.selectModel(m.dataset.model);
    if (edition) studio.applyColorway(edition);
    navigate(pageUrl('customize'));
    return;
  }
  // Color dots on keyboard and product cards swap the card photo
  const dot = e.target.closest('.card-vars .dot');
  if (dot) {
    const card = dot.closest('.card'), media = card.querySelector('.card-media');
    card.querySelectorAll('.card-vars .dot').forEach(d => d.setAttribute('aria-pressed', String(d === dot)));
    card.querySelector('.dot-label').textContent = dot.dataset.label;
    if (dot.dataset.kbed) {
      card.dataset.edition = dot.dataset.kbed;
      const M = MODELS[card.dataset.mid];
      media.innerHTML = photoHTML(dot.dataset.src, `${M.name} in ${dot.dataset.label}`, boardSVG(card.dataset.mid, dot.dataset.kbed));
    } else {
      const p = PRODUCT_BY_ID[card.dataset.pid];
      media.innerHTML = photoHTML(dot.dataset.src, `${p.brand} ${p.name}, ${dot.dataset.label}`, artSVG(p, { [p.gallery]: dot.dataset.pvar }));
      try { sessionStorage.setItem('ks-pvar:' + p.id, dot.dataset.pvar); } catch (err) {}
    }
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
let pd = null;
function initProduct() {
  const host = $('[data-product]'); if (!host) return;
  const p = PRODUCT_BY_ID[host.dataset.product]; if (!p) return;
  let edit = null, pvar = null;
  try { const id = sessionStorage.getItem('ks-edit'); if (id) { edit = cart.find(i => i.id === id && i.pid === p.id); sessionStorage.removeItem('ks-edit'); } } catch (e) {}
  try { pvar = sessionStorage.getItem('ks-pvar:' + p.id); sessionStorage.removeItem('ks-pvar:' + p.id); } catch (e) {}
  const cfg = edit ? { ...defaultsOf(p), ...edit.cfg } : defaultsOf(p);
  if (!edit && pvar && p.options.find(o => o.id === p.gallery).choices.some(c => c.v === pvar)) cfg[p.gallery] = pvar;
  pd = { p, cfg, qty: edit ? edit.qty : 1, editId: edit ? edit.id : null, shot: 0, shown: null };
  $('#pdQty').textContent = pd.qty;
  $('#pdAdd').textContent = pd.editId ? 'Update cart item' : 'Add to cart';
  $$('[data-q]').forEach(b => b.addEventListener('click', () => { pd.qty = Math.max(1, Math.min(20, pd.qty + +b.dataset.q)); $('#pdQty').textContent = pd.qty; }));
  $('#pdAdd').addEventListener('click', () => {
    const { p, cfg, qty, editId } = pd;
    upsert({ id: editId || uid(), type: 'product', pid: p.id, name: `${p.brand} ${p.name}`, lines: summaryOf(p, cfg), price: priceOf(p, cfg), qty, cfg: { ...cfg } });
    toast(editId ? `Updated ${p.name} in your cart` : `Added ${qty > 1 ? qty + ' × ' : ''}${p.name} to the cart`);
    if (editId) navigate(pageUrl('cart'));
  });
  $('#pdThumbs').addEventListener('click', e => { const b = e.target.closest('[data-shot]'); if (b) { pd.shot = +b.dataset.shot; renderGallery(true); } });
  renderOptions(); updatePreview();
}
function renderOptions() {
  const { p, cfg } = pd;
  $('#pdOpts').innerHTML = p.options.map(o => {
    const v = cfg[o.id], head = extra => `<div class="opt-h">${o.label}<span>${extra || ''}</span></div>`;
    if (o.type === 'variant' && o.choices.every(c => c.hex)) { const cur = o.choices.find(c => c.v === v) || {}; return `<div class="opt">${head(cur.v + (cur.price ? ` · +${money(cur.price)}` : ''))}<div class="swatch-row">${o.choices.map(c => `<button type="button" class="sw" style="background:${c.hex}" data-opt="${o.id}" data-v="${escA(c.v)}" aria-pressed="${c.v === v}" aria-label="${o.label}: ${escA(c.v)}" title="${escA(c.v)}${c.price ? ' +' + money(c.price) : ''}"></button>`).join('')}</div></div>`; }
    if (o.type === 'choice' || o.type === 'variant') return `<div class="opt">${head()}<div class="choice-row">${o.choices.map(c => `<button type="button" class="choice" data-opt="${o.id}" data-v="${escA(c.v)}" aria-pressed="${c.v === v}">${escA(c.label || c.v)}<small>${c.price ? (c.price > 0 ? '+' : '−') + money(Math.abs(c.price)) : 'Included'}</small></button>`).join('')}</div></div>`;
    if (o.type === 'toggle') return `<div class="opt"><label class="toggle-row" for="opt-${o.id}"><span class="opt-h" style="flex:1">${o.label}<span>+${money(o.price)}</span></span><input type="checkbox" class="switch" id="opt-${o.id}" data-opt="${o.id}" ${v ? 'checked' : ''}></label></div>`;
    if (o.type === 'text') return `<div class="opt"><label class="opt-h" for="opt-${o.id}">${o.label}<span>+${money(o.price)} when added</span></label><input type="text" id="opt-${o.id}" data-opt="${o.id}" maxlength="${o.max}" placeholder="${o.placeholder}" value="${escA(v || '')}" autocomplete="off"></div>`;
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
}
// Main photo plus a strip of the chosen variant's other photos
function renderGallery(force) {
  const { p, cfg } = pd, vc = variantOf(p, cfg), shots = vc.images;
  if (pd.shown !== vc.v) { pd.shown = vc.v; pd.shot = 0; force = true; }
  if (!force) return;
  const i = Math.min(pd.shot, shots.length - 1);
  $('#pdStage').innerHTML = photoHTML(shots[i], `${p.brand} ${p.name}, ${vc.v}, photo ${i + 1} of ${shots.length}`, artSVG(p, cfg), true);
  $('#pdThumbs').innerHTML = shots.length > 1 ? shots.map((u, k) => `<button type="button" class="pd-thumb" data-shot="${k}" aria-pressed="${k === i}" aria-label="Photo ${k + 1}">${photoHTML(u, '', '')}</button>`).join('') : '';
}
function updatePreview() {
  renderGallery(false);
  $('#pdPrice').textContent = money(priceOf(pd.p, pd.cfg));
}

/* ---------- Cart ---------- */
const thumbOf = i => { if (i.type === 'board') return i.thumb ? `<img src="${i.thumb}" alt="">` : boardSVG(i.model);
  const p = PRODUCT_BY_ID[i.pid]; if (!p) return '';
  let cfg = { ...defaultsOf(p), ...i.cfg }; return photoHTML(photosOf(p, cfg)[0], '', artSVG(p, cfg)); };
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
