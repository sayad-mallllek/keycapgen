// A maker photo with a drawn fallback. If the photo can't load (offline, blocked host, moved file),
// the wrapper gets .failed and CSS shows the illustration instead.
import { escA } from './util.js';
export const photoHTML = (src, alt, fallback = '', eager = false) => src
  ? `<span class="ph"><img class="ph-img" src="${escA(src)}" alt="${escA(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('failed')"><span class="ph-fb">${fallback}</span></span>`
  : `<span class="ph failed"><span class="ph-fb">${fallback}</span></span>`;
// Images that failed before the error handler could run
export function markBrokenPhotos(root = document) {
  root.querySelectorAll('.ph:not(.failed) img.ph-img').forEach(img => { if (img.complete && !img.naturalWidth) img.parentNode.classList.add('failed'); });
}
