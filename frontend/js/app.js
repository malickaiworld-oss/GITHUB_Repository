// UI logic for the Memory Vault demo. Data comes from js/store.js (localStorage),
// which mirrors the future Express + MongoDB API from decision.md.

const CATEGORIES = ['Food', 'Sports', 'Hiking', 'Travel', 'Nightout', 'Shopping'];

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- auth (simulated) ----------

let user = store.getSession();
let signupMode = false;

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function switchAuthMode(toSignup) {
  signupMode = toSignup;
  $('name-field').classList.toggle('hidden', !toSignup);
  $('auth-name').required = toSignup;
  $('auth-submit').textContent = toSignup ? 'Create account' : 'Sign in';
  $('auth-switch-text').textContent = toSignup ? 'Already have an account?' : 'New here?';
  $('auth-switch').textContent = toSignup ? 'Sign in instead' : 'Create an account';
  $('auth-error').classList.add('hidden');
}

$('auth-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = $('auth-email').value.trim();
  const password = $('auth-password').value;

  if (signupMode && !$('auth-name').value.trim()) {
    return showError($('auth-error'), 'Please enter your name.');
  }
  if (password.length < 6) {
    return showError($('auth-error'), 'Password must be at least 6 characters.');
  }
  // Simulated sign-in: any email/password passes. This is where the real
  // Firebase/Passport call goes (decision.md §1).
  user = store.syncUser({ email, name: signupMode ? $('auth-name').value.trim() : '' });
  renderApp();
});

$('google-btn').addEventListener('click', () => {
  // Placeholder for Firebase Google Sign-In — logs in a demo profile for now.
  user = store.syncUser({ email: 'demo.traveler@gmail.com', name: 'Demo Traveler' });
  renderApp();
});

$('auth-switch').addEventListener('click', () => switchAuthMode(!signupMode));

$('logout-btn').addEventListener('click', () => {
  store.signOut();
  user = null;
  $('app-view').classList.add('hidden');
  $('auth-view').classList.remove('hidden');
  $('auth-view').classList.add('flex');
});

// ---------- dashboard ----------

function applyFilters() {
  const search = $('filter-search').value.trim().toLowerCase();
  const country = $('filter-country').value;
  const category = $('filter-category').value;
  const minRating = Number($('filter-rating').value);

  let visits = store.getVisits({ country, category, minRating });
  if (search) {
    visits = visits.filter((v) =>
      [v.primaryVenue, v.comments, ...v.alternativeVenues].join(' ').toLowerCase().includes(search)
    );
  }
  return visits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function uniqueCountries() {
  return [...new Set(store.getAll().map((v) => v.country))].sort();
}

function populateCountries() {
  const sel = $('filter-country');
  const current = sel.value;
  sel.innerHTML =
    '<option value="">All countries</option>' +
    uniqueCountries().map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  if ([...sel.options].some((o) => o.value === current)) sel.value = current;
}

function stars(n) {
  return '★'.repeat(n) + '<span class="text-slate-300">' + '★'.repeat(5 - n) + '</span>';
}

function badge(text) {
  return `<span class="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">${esc(text)}</span>`;
}

// decision.md §4.2 — spotlights: best pick per category (top rating, then newest)
function computeHighlights() {
  const visits = store.getAll();
  return CATEGORIES.map((category) => {
    const inCat = visits
      .filter((v) => v.category === category && v.rating > 0)
      .sort((a, b) => b.rating - a.rating || new Date(b.createdAt) - new Date(a.createdAt));
    const top = inCat[0];
    if (!top) return null;
    const others = inCat.length - 1;
    return { ...top, category, others };
  }).filter(Boolean);
}

function renderHighlights() {
  const list = computeHighlights();
  const el = $('highlights');
  if (!list.length) {
    $('highlights-section').classList.add('hidden');
    return;
  }
  $('highlights-section').classList.remove('hidden');
  el.innerHTML = list
    .map(
      (h) => `
      <div class="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-3 shadow-sm">
        <div class="text-xs font-bold uppercase tracking-wide text-amber-600">Best ${esc(h.category)}</div>
        <div class="mt-1 truncate font-bold">${esc(h.primaryVenue)}</div>
        <div class="text-sm text-slate-500">${esc(h.country)} · ${esc(h.placeType || '—')}</div>
        <div class="mt-1 text-amber-500">${stars(h.rating)}</div>
        ${h.others ? `<div class="mt-1 text-xs text-slate-400">+${h.others} more in this category</div>` : ''}
      </div>`
    )
    .join('');
}

function visitCard(v) {
  const img = v.photoUrl
    ? `<img src="${esc(v.photoUrl)}" alt="" class="h-44 w-full object-cover"
           onerror="this.style.display='none'" />`
    : '';
  return `
    <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      ${img}
      <div class="p-4">
        <div class="flex flex-wrap items-center gap-2">
          ${badge(`🌍 ${v.country}`)}
          ${badge(v.category)}
          <span class="ml-auto text-amber-500">${stars(v.rating)}</span>
        </div>
        <h3 class="mt-2 text-lg font-bold">${esc(v.primaryVenue)}</h3>
        <p class="text-sm text-slate-500">${esc(v.placeType || '')}</p>
        ${v.alternativeVenues.length ? `<p class="mt-1 text-xs text-slate-400">Also: ${esc(v.alternativeVenues.join(', '))}</p>` : ''}
        <p class="mt-2 text-sm text-slate-600">${esc(v.comments)}</p>
        <div class="mt-4 flex gap-2 border-t border-slate-100 pt-3">
          <button data-edit="${esc(v._id)}" class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Edit</button>
          <button data-delete="${esc(v._id)}" class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
        </div>
      </div>
    </article>`;
}

function renderVisits() {
  const visits = applyFilters();
  populateCountries();
  $('visit-count').textContent = `(${visits.length})`;
  const grid = $('visits-grid');
  grid.innerHTML = visits.map(visitCard).join('');
  const empty = $('empty-state');
  empty.classList.toggle('hidden', visits.length > 0);
  empty.innerHTML = store.getAll().length
    ? 'No memories match these filters.'
    : 'Nothing logged yet — click <strong>+ Add memory</strong> to start your vault.';
}

function renderApp() {
  $('auth-view').classList.add('hidden');
  $('app-view').classList.remove('hidden');
  $('user-name').textContent = user.name || user.email;
  $('user-avatar').textContent = (user.name || user.email)[0]?.toUpperCase() || '?';
  seedIfEmpty();
  renderVisits();
  renderHighlights();
}

// ---------- add / edit modal ----------

let editingId = null;

function openModal(id = null) {
  editingId = id;
  $('modal-title').textContent = id ? 'Edit visit memory' : 'Add visit memory';
  $('form-error').classList.add('hidden');
  const existing = id ? store.getAll().find((v) => v._id === id) : null;

  $('f-country').value = existing?.country || '';
  $('f-placeType').value = existing?.placeType || '';
  $('f-category').value = existing?.category || CATEGORIES[0];
  $('f-venue').value = existing?.primaryVenue || '';
  $('f-alternatives').value = existing?.alternativeVenues.join(', ') || '';
  $('f-comments').value = existing?.comments || '';
  $('f-photoUrl').value = existing?.photoUrl || '';
  setStars(existing?.rating || 0);

  $('modal-backdrop').classList.remove('hidden');
  $('visit-modal').classList.remove('hidden');
  $('f-country').focus();
}

function closeModal() {
  $('modal-backdrop').classList.add('hidden');
  $('visit-modal').classList.add('hidden');
  editingId = null;
}

function setStars(n) {
  selectedRating = n;
  document.querySelectorAll('#star-input button').forEach((b) => {
    b.classList.toggle('text-amber-400', Number(b.dataset.star) <= n);
    b.classList.toggle('text-slate-300', Number(b.dataset.star) > n);
  });
}

let selectedRating = 0;
document.querySelectorAll('#star-input button').forEach((b) =>
  b.addEventListener('click', () => setStars(Number(b.dataset.star)))
);

$('visit-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    country: $('f-country').value.trim(),
    placeType: $('f-placeType').value.trim(),
    category: $('f-category').value,
    primaryVenue: $('f-venue').value.trim(),
    alternativeVenues: $('f-alternatives').value.split(',').map((s) => s.trim()).filter(Boolean),
    rating: selectedRating,
    comments: $('f-comments').value.trim(),
    photoUrl: $('f-photoUrl').value.trim(),
  };
  if (!data.country || !data.primaryVenue) return showError($('form-error'), 'Country and primary venue are required.');
  if (!data.rating) return showError($('form-error'), 'Please pick a star rating.');

  if (editingId) store.updateVisit(editingId, data);
  else store.addVisit(data);
  closeModal();
  renderVisits();
  renderHighlights();
});

$('add-btn').addEventListener('click', () => openModal());
$('modal-close').addEventListener('click', closeModal);
$('modal-cancel').addEventListener('click', closeModal);
$('modal-backdrop').addEventListener('click', closeModal);

// edit / delete buttons on the cards
$('visits-grid').addEventListener('click', (e) => {
  const editBtn = e.target.closest('[data-edit]');
  const delBtn = e.target.closest('[data-delete]');
  if (editBtn) openModal(editBtn.dataset.edit);
  if (delBtn && confirm('Delete this memory?')) {
    store.deleteVisit(delBtn.dataset.delete);
    renderVisits();
    renderHighlights();
  }
});

// ---------- filters ----------

['filter-search', 'filter-country', 'filter-category', 'filter-rating'].forEach((id) =>
  $(id).addEventListener('input', renderVisits)
);

$('clear-filters').addEventListener('click', () => {
  $('filter-search').value = '';
  $('filter-country').value = '';
  $('filter-category').value = '';
  $('filter-rating').value = '0';
  renderVisits();
});

// ---------- boot ----------

$('f-category').innerHTML = CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join('');
$('filter-category').innerHTML =
  '<option value="">All categories</option>' + CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join('');

if (user) renderApp();
else {
  $('auth-view').classList.remove('hidden');
  $('auth-view').classList.add('flex');
}
