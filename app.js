/* ---------- Client identity (used only to know which listings are "mine" — deletion is enforced server-side) ---------- */
const CLIENT_KEY = 'carmarket-client-id';
function clientId() {
  let id = localStorage.getItem(CLIENT_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(CLIENT_KEY, id); }
  return id;
}

/* ---------- State ---------- */
let listings = [];
let game = 'cpm1'; let category = '';
const grid = document.querySelector('#listings');
const empty = document.querySelector('#empty');
const money = new Intl.NumberFormat('tr-TR');
const gameNames = { cpm1: 'CPM 1', cpm2: 'CPM 2' };
const esc = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
const escBr = value => esc(value).replace(/\n/g, '<br>');

function render() {
  const term = document.querySelector('#keyword').value.toLocaleLowerCase('tr');
  const max = Number(document.querySelector('#price').value || Infinity);
  const filtered = listings.filter(x => x.game === game && (!category || x.category === category) && x.price <= max && `${x.vehicle} ${x.vehicleId} ${x.playerId}`.toLocaleLowerCase('tr').includes(term));
  grid.innerHTML = filtered.map(x => `<article class="listing" data-id="${x.id}"><div class="listing-img">${x.images[0] ? `<img src="${x.images[0]}" alt="${esc(x.vehicle)}" loading="lazy">` : '<div class="no-photo">CPM<br>BUILD</div>'}<span class="badge">${esc(x.category)}</span><span class="game-badge">${gameNames[x.game]}</span></div><div class="listing-info"><h3>${esc(x.vehicle)}</h3><p>${esc(x.engine || 'Build bilgisi yok')} · ${esc(x.gearbox || 'Ayar belirtilmedi')}</p><div class="listing-tags"><span>Oyuncu ID: ${esc(x.playerId)}</span>${x.vehicleId ? `<span>Araç ID: ${esc(x.vehicleId)}</span>` : ''}</div><div class="listing-bottom"><b>${money.format(x.price)} ${esc(x.currency)}</b><span>${x.images.length} fotoğraf</span></div></div></article>`).join('');
  empty.hidden = filtered.length !== 0;
  document.querySelector('#activeCount').textContent = listings.length;
  document.querySelector('#marketLabel').textContent = `${gameNames[game]} PAZARI`;
  document.querySelector('#marketTitle').textContent = `${gameNames[game]} ilanları`;
  document.querySelector('#heroGame').textContent = game === 'cpm1' ? '1' : '2';
}

function setGame(next) {
  game = next; category = '';
  document.querySelectorAll('.game-tab').forEach(x => x.classList.toggle('active', x.dataset.game === game));
  document.querySelectorAll('[data-category]').forEach((x, i) => x.classList.toggle('active', i === 0));
  render();
}
document.querySelectorAll('.game-tab').forEach(button => button.addEventListener('click', () => setGame(button.dataset.game)));
document.querySelector('#searchButton').addEventListener('click', render);
document.querySelector('#keyword').addEventListener('keydown', e => { if (e.key === 'Enter') render(); });
document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => { category = button.dataset.category; document.querySelectorAll('[data-category]').forEach(x => x.classList.remove('active')); button.classList.add('active'); render(); }));

grid.addEventListener('click', e => {
  const card = e.target.closest('.listing');
  if (!card) return;
  openDetail(card.dataset.id);
});

/* ---------- Toast ---------- */
const toast = document.querySelector('#toast');
let toastTimer;
function showToast(message, isError) {
  toast.textContent = message;
  toast.classList.toggle('error', !!isError);
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ---------- Add-listing dialog (multi-step) ---------- */
const dialog = document.querySelector('#listingDialog');
const form = document.querySelector('#listingForm');
const steps = [...form.querySelectorAll('.form-step')];
const progressSpans = [...document.querySelectorAll('.form-progress span')];
let currentStep = 1;

function goToStep(n) {
  currentStep = n;
  steps.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === n));
  progressSpans.forEach((s, i) => {
    s.classList.toggle('active', i === n - 1);
    s.classList.toggle('done', i < n - 1);
  });
  document.querySelector('[data-prev]').hidden = n === 1;
  document.querySelector('[data-next]').hidden = n === steps.length;
  document.querySelector('[data-submit]').hidden = n !== steps.length;
}

function stepIsValid(n) {
  const fields = steps[n - 1].querySelectorAll('input, select, textarea');
  for (const field of fields) {
    if (field.id === 'photos') continue; // validated separately
    if (!field.checkValidity()) { field.reportValidity(); return false; }
  }
  if (n === 3 && pendingImages.length === 0) {
    document.querySelector('#photos').setCustomValidity('En az 1 fotoğraf ekle.');
    document.querySelector('#photos').reportValidity();
    return false;
  }
  document.querySelector('#photos').setCustomValidity('');
  return true;
}

document.querySelector('[data-next]').addEventListener('click', () => { if (stepIsValid(currentStep)) goToStep(currentStep + 1); });
document.querySelector('[data-prev]').addEventListener('click', () => goToStep(currentStep - 1));

document.querySelectorAll('[data-open-form]').forEach(button => button.addEventListener('click', () => {
  document.querySelector('#formGame').value = game;
  goToStep(1);
  dialog.showModal();
}));
document.querySelector('[data-close]').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => resetForm());

/* ---------- Photos: compress + preview + remove ---------- */
const preview = document.querySelector('#previews');
let pendingImages = []; // { uid, blob, url }

function compressImage(file, maxDim = 1000, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = e => {
      const img = new Image();
      img.onerror = () => reject(new Error('image load failed'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio); height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderPreviews() {
  preview.innerHTML = pendingImages.map(p => `<div class="preview-thumb" data-uid="${p.uid}"><img src="${p.url}" alt="Fotoğraf önizlemesi"><button type="button" class="remove-thumb" data-remove="${p.uid}" aria-label="Fotoğrafı kaldır">×</button></div>`).join('');
}
preview.addEventListener('click', e => {
  const uid = e.target.dataset.remove;
  if (!uid) return;
  const removed = pendingImages.find(p => p.uid === uid);
  if (removed) URL.revokeObjectURL(removed.url);
  pendingImages = pendingImages.filter(p => p.uid !== uid);
  renderPreviews();
});

document.querySelector('#photos').addEventListener('change', async event => {
  const files = [...event.target.files].slice(0, 5 - pendingImages.length);
  if (event.target.files.length > files.length) showToast('En fazla 5 fotoğraf yükleyebilirsin.');
  for (const file of files) {
    try {
      const blob = await compressImage(file);
      pendingImages.push({ uid: crypto.randomUUID(), blob, url: URL.createObjectURL(blob) });
      renderPreviews();
    } catch (e) { showToast('Bir fotoğraf yüklenemedi, tekrar dene.', true); }
  }
  event.target.value = '';
});

/* ---------- Player ID: digits only ---------- */
const playerIdField = form.querySelector('input[name="playerId"]');
const stripNonDigits = () => {
  const clean = playerIdField.value.replace(/[^0-9]/g, '');
  if (clean !== playerIdField.value) playerIdField.value = clean;
};
['input', 'keyup', 'paste', 'change', 'blur'].forEach(evt => playerIdField.addEventListener(evt, () => setTimeout(stripNonDigits, 0)));

/* ---------- Description char counter ---------- */
const descField = form.querySelector('textarea[name="description"]');
const descCount = document.querySelector('#descCount');
if (descField && descCount) {
  const updateCount = () => { descCount.textContent = `${descField.value.length}/350`; };
  descField.addEventListener('input', updateCount);
  updateCount();
}

function resetForm() {
  form.reset();
  pendingImages.forEach(p => URL.revokeObjectURL(p.url));
  preview.innerHTML = '';
  pendingImages = [];
  goToStep(1);
  if (descCount) descCount.textContent = '0/350';
}

/* ---------- Submit ---------- */
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!stepIsValid(3)) return;
  const submitBtn = document.querySelector('[data-submit]');
  submitBtn.disabled = true; submitBtn.textContent = 'Gönderiliyor…';

  const data = new FormData(form);
  data.set('clientId', clientId());
  data.delete('photos');
  pendingImages.forEach(p => data.append('photos', p.blob, `${p.uid}.jpg`));

  try {
    const res = await fetch('/api/listings', { method: 'POST', body: data });
    if (!res.ok) throw new Error(await res.text());
    game = data.get('game');
    await loadListings();
    dialog.close();
    showToast('İlanın pazara eklendi.');
  } catch (e) {
    showToast('İlan kaydedilemedi. Lütfen tekrar dene.', true);
  } finally {
    submitBtn.disabled = false; submitBtn.textContent = 'İlanı pazara gönder →';
  }
});

/* ---------- Detail dialog ---------- */
const detailDialog = document.querySelector('#detailDialog');
let detailImages = []; let detailIndex = 0;

function setDetailImage(i) {
  detailIndex = (i + detailImages.length) % detailImages.length;
  const mainImg = document.querySelector('#detailMainImg');
  if (detailImages.length) { mainImg.src = detailImages[detailIndex]; mainImg.hidden = false; }
  else { mainImg.hidden = true; }
  document.querySelectorAll('#detailThumbs .thumb').forEach((t, i2) => t.classList.toggle('active', i2 === detailIndex));
}

function openDetail(id) {
  const item = listings.find(x => x.id === id);
  if (!item) return;
  detailImages = item.images; detailIndex = 0;
  document.querySelector('#detailBadge').textContent = item.category;
  document.querySelector('#detailGame').textContent = gameNames[item.game];
  document.querySelector('#detailTitle').textContent = item.vehicle;
  document.querySelector('#detailPrice').textContent = `${money.format(item.price)} ${item.currency}`;
  document.querySelector('#detailMeta').textContent = `${item.engine || 'Build bilgisi yok'} · ${item.gearbox || 'Ayar belirtilmedi'}`;
  document.querySelector('#detailVehicleId').textContent = item.vehicleId ? `Araç ID: ${item.vehicleId}` : '';
  document.querySelector('#detailDesc').innerHTML = escBr(item.description);
  document.querySelector('#detailPlayerId').textContent = `Oyuncu ID: ${item.playerId}`;
  document.querySelector('#detailContact').textContent = item.contact;
  document.querySelector('#detailThumbs').innerHTML = detailImages.map((src, i) => `<button type="button" class="thumb" data-i="${i}"><img src="${src}" alt=""></button>`).join('');
  setDetailImage(0);
  const deleteBtn = document.querySelector('#detailDelete');
  deleteBtn.hidden = item.clientId !== clientId();
  deleteBtn.onclick = async () => {
    if (!confirm('Bu ilanı silmek istediğine emin misin?')) return;
    try {
      const res = await fetch(`/api/listings/${item.id}?clientId=${encodeURIComponent(clientId())}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      listings = listings.filter(x => x.id !== item.id);
      render();
      detailDialog.close();
      showToast('İlan silindi.');
    } catch (e) { showToast('İlan silinemedi.', true); }
  };
  detailDialog.showModal();
}
document.querySelector('#detailThumbs').addEventListener('click', e => {
  const btn = e.target.closest('.thumb'); if (!btn) return; setDetailImage(Number(btn.dataset.i));
});
document.querySelector('#detailPrev').addEventListener('click', () => setDetailImage(detailIndex - 1));
document.querySelector('#detailNext').addEventListener('click', () => setDetailImage(detailIndex + 1));
document.querySelector('[data-close-detail]').addEventListener('click', () => detailDialog.close());

/* ---------- Load from server ---------- */
async function loadListings() {
  const res = await fetch('/api/listings');
  if (!res.ok) throw new Error('load failed');
  listings = await res.json();
  render();
}

/* ---------- Init ---------- */
(async function init() {
  try {
    await loadListings();
  } catch (e) {
    showToast('İlanlar yüklenemedi. İnternet bağlantını kontrol et.', true);
  }
})();
