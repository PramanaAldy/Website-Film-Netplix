'use strict';

const films = new Map(filmCatalog.map(film => [film.id, film]));
const featured = ['spring', 'charge', 'sintel'].map(id => films.get(id));
const genres = ['Semua', 'Animasi', 'Fantasi', 'Fiksi Ilmiah', 'Petualangan', 'Komedi', 'Drama', 'Aksi', 'Horor'];
const routes = { beranda: 'Beranda', film: 'Semua Film', daftar: 'Daftar Saya', riwayat: 'Riwayat' };
const storageKey = 'layar:library:v1';
const licenseUrl = 'https://studio.blender.org/remixing/';
const hero = document.querySelector('#hero');
const content = document.querySelector('#catalog-content');
const search = document.querySelector('#search');
const searchClear = document.querySelector('#clear-search');
const shortcut = document.querySelector('#search-shortcut');
const dialog = document.querySelector('#dialog');
const dialogContent = document.querySelector('#dialog-content');
const toast = document.querySelector('#toast');

let library = loadLibrary() ?? { saved: [], progress: {} };
let route = currentRoute();
let selectedGenre = 'Semua';
let featuredIndex = 0;
let returnFocus;
let playback;
let toastTimeout;
let localFilms = [];
let catalogRequest = 0;

function isUploadId(id) {
  return typeof id === 'string' && /^upload-[a-f0-9]{32}$/.test(id);
}

function isKnownId(id) {
  return films.has(id) || isUploadId(id);
}

function loadLibrary() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (!stored) return null;
    const saved = Array.isArray(stored.saved) ? stored.saved.filter(isKnownId) : [];
    const progress = Object.fromEntries(Object.entries(stored.progress ?? {}).filter(([id, entry]) =>
      isKnownId(id) && entry && Number.isFinite(entry.time) && entry.time >= 0 &&
      Number.isFinite(entry.duration) && entry.duration > 0 && entry.time <= entry.duration &&
      typeof entry.finished === 'boolean' && Number.isFinite(entry.updated),
    ));
    return { saved: [...new Set(saved)], progress };
  } catch {
    return null;
  }
}

function updateLibrary(update) {
  library = loadLibrary() ?? library;
  update(library);
  try {
    localStorage.setItem(storageKey, JSON.stringify(library));
    return true;
  } catch {
    return false;
  }
}

function currentRoute() {
  const name = location.hash.slice(1);
  return Object.hasOwn(routes, name) ? name : 'beranda';
}

function icon(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

function titleOf(film) {
  return film.subtitle ? `${film.title}: ${film.subtitle}` : film.title;
}

function escapeHtml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value).replace(/[&<>"']/g, character => entities[character]);
}

function mediaUrl(film, kind) {
  return `media.php?id=${encodeURIComponent(film.id)}&kind=${kind}`;
}

function posterOf(film) {
  if (film.local) return film.hasPoster ? mediaUrl(film, 'poster') : '';
  return `assets/art/${film.id}.webp`;
}

function sourceOf(film) {
  return `https://video.blender.org/w/${film.source}`;
}

function playLabel(film) {
  const entry = library.progress[film.id];
  return entry && !entry.finished && entry.time >= 1 ? 'Lanjutkan' : 'Putar Film';
}

function filmMeta(film, detail = false) {
  const genre = detail ? film.genres.join(' / ') : film.genres[0];
  return `<div class="metadata"><span class="genre">${escapeHtml(genre)}</span><span>${escapeHtml(film.year)}</span><span>${escapeHtml(film.duration)}</span></div>`;
}

function renderHero() {
  const film = featured[featuredIndex];
  hero.style.setProperty('--hero-focus', film.focus);
  hero.style.setProperty('--mobile-focus', film.mobileFocus);
  hero.querySelector('.hero-art').src = `assets/art/${film.hero}`;
  hero.querySelector('.hero-content').innerHTML = `
    <p class="hero-kicker">${icon('spark')} Film pilihan</p>
    <h1 class="hero-title">${film.title}</h1>
    ${filmMeta(film)}
    <p class="hero-description">${film.description}</p>
    <div class="actions">
      <button class="button primary" type="button" data-action="play" data-id="${film.id}">${icon('play')} ${playLabel(film)}</button>
      <button class="button" type="button" data-action="detail" data-id="${film.id}">${icon('info')} Info Film</button>
    </div>`;
  hero.querySelectorAll('.hero-dot').forEach((dot, index) => {
    dot.setAttribute('aria-pressed', index === featuredIndex);
  });
}

function renderFilters() {
  return `<div class="genre-filter" role="group" aria-label="Filter genre">${genres.map(genre => `
    <button class="chip" type="button" data-action="genre" data-genre="${genre}" aria-pressed="${selectedGenre === genre}">${genre === 'Semua' ? icon('grid') : ''}${genre}</button>`).join('')}</div>`;
}

function saveButton(film, compact = false) {
  const saved = library.saved.includes(film.id);
  const label = saved ? 'Hapus dari Daftar Saya' : 'Simpan ke Daftar Saya';
  return `<button class="${compact ? 'icon-button card-save' : 'button'}" type="button" data-action="save" data-id="${film.id}" aria-label="${label} — ${escapeHtml(titleOf(film))}" aria-pressed="${saved}" title="${label}">${icon(saved ? 'check' : 'bookmark')}${compact ? '' : saved ? 'Tersimpan' : 'Daftar Saya'}</button>`;
}

function filmCard(film, showProgress = false) {
  const entry = showProgress && library.progress[film.id];
  const status = entry ? entry.finished ? 'Selesai ditonton' : `${Math.floor(entry.time / entry.duration * 100)}% ditonton` : `${film.year} · ${film.genres[0]}`;
  const action = showProgress ? 'play' : 'detail';
  const accessibleTitle = showProgress ? `${playLabel(film)} — ${titleOf(film)}` : `Info film — ${titleOf(film)}`;
  const poster = posterOf(film);
  const title = escapeHtml(titleOf(film));
  return `<article class="film-card">
    <button class="card-button" type="button" data-action="${action}" data-id="${film.id}" aria-label="${escapeHtml(accessibleTitle)}">
      <span class="poster" style="--cover-color:${film.color}">
        ${poster ? `<img src="${escapeHtml(poster)}" width="322" height="482" loading="lazy" alt="">` : ''}
        <span class="poster-name${film.title.length > 14 ? ' long' : ''}" aria-hidden="true">${escapeHtml(film.title)}</span>
      </span>
      <span class="card-info"><strong>${title}</strong><span class="card-meta">${escapeHtml(status)}</span></span>
    </button>
    ${saveButton(film, true)}
    ${entry ? `<progress class="watch-progress" max="${entry.duration}" value="${entry.finished ? entry.duration : entry.time}" aria-label="Kemajuan ${title}"></progress>` : ''}
  </article>`;
}

function filmGrid(list, showProgress = false) {
  return `<div class="film-grid">${list.map(film => filmCard(film, showProgress)).join('')}</div>`;
}

function emptyState(symbol, heading, message, browse = true) {
  return `<div class="empty">${icon(symbol)}<h2>${heading}</h2><p>${message}</p>${browse ? '<a class="button" href="#film">Jelajahi film</a>' : ''}</div>`;
}

function section(heading, inside, { standalone = false, browseLink = false, caption = '' } = {}) {
  const tag = standalone ? 'h1' : 'h2';
  return `<section class="collection${standalone ? ' standalone' : ''}">
    <div class="collection-header">
      <div><${tag}>${heading}</${tag}>${caption ? `<p>${caption}</p>` : ''}</div>
      ${browseLink ? `<a class="collection-link" href="#film">Lihat semua ${icon('arrow')}</a>` : ''}
    </div>
    ${inside}
  </section>`;
}

function recentFilms() {
  return Object.entries(library.progress)
    .sort(([, a], [, b]) => b.updated - a.updated)
    .map(([id]) => films.get(id))
    .filter(Boolean);
}

function renderSavedCount() {
  const count = document.querySelector('#saved-count');
  const visibleSaved = library.saved.filter(id => films.has(id)).length;
  count.hidden = !visibleSaved;
  count.textContent = visibleSaved;
}

function render() {
  const query = search.value.trim().toLocaleLowerCase('id');
  const isHome = route === 'beranda' && !query;
  const allFilms = [...localFilms, ...filmCatalog];
  renderSavedCount();
  searchClear.hidden = !search.value;
  shortcut.hidden = Boolean(search.value);
  document.querySelector('#page-label').textContent = query ? 'Pencarian' : routes[route];
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.route === route && !query) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  hero.hidden = !isHome;

  if (query) {
    const words = query.split(/\s+/);
    const found = allFilms.filter(film => {
      const terms = [titleOf(film), film.year, ...film.genres].join(' ').toLocaleLowerCase('id');
      return words.every(word => terms.includes(word));
    });
    const results = found.length ? filmGrid(found) : emptyState('search', 'Film tidak ditemukan', 'Coba judul atau genre lain.', false);
    content.innerHTML = section('Hasil Pencarian', results, { standalone: true, caption: `${found.length} film ditemukan` });
    return;
  }

  if (route === 'daftar') {
    const list = [...library.saved].reverse().map(id => films.get(id)).filter(Boolean);
    const body = list.length ? filmGrid(list) : emptyState('bookmark', 'Daftar Anda masih kosong', 'Simpan film untuk ditonton kapan saja.');
    content.innerHTML = section('Daftar Saya', body, { standalone: true });
    return;
  }

  if (route === 'riwayat') {
    const list = recentFilms();
    const body = list.length ? filmGrid(list, true) : emptyState('history', 'Belum ada riwayat', 'Film yang Anda putar akan muncul di sini.');
    content.innerHTML = section('Riwayat Tontonan', body, { standalone: true });
    return;
  }

  const filtered = selectedGenre === 'Semua' ? allFilms : allFilms.filter(film => film.genres.includes(selectedGenre));
  if (route === 'film') {
    content.innerHTML = section('Semua Film', renderFilters() + filmGrid(filtered), { standalone: true });
    return;
  }

  const resume = recentFilms().filter(film => playLabel(film) === 'Lanjutkan').slice(0, 5);
  let home = renderFilters();
  if (resume.length && selectedGenre === 'Semua') home += section('Lanjutkan Menonton', filmGrid(resume, true));
  if (selectedGenre === 'Semua') {
    home += section('Pilihan Populer', filmGrid(originalFilms.slice(0, 5)), { browseLink: true });
    home += section('Baru di Layar', filmGrid([...localFilms, ...recentAdditions]));
    home += section('Jelajahi Film Pendek', filmGrid(originalFilms.slice(5)));
  } else {
    home += section(selectedGenre, filmGrid(filtered), { caption: `${filtered.length} film` });
  }
  content.innerHTML = home;
}

async function refreshUploads() {
  const request = ++catalogRequest;
  try {
    const response = await fetch('media.php', { cache: 'no-store' });
    if (!response.ok) return;
    const records = await response.json();
    if (request !== catalogRequest || !Array.isArray(records)) return;
    const next = records.filter(film => film && isUploadId(film.id) && typeof film.title === 'string' && Array.isArray(film.genres));
    if (next.length === localFilms.length && next.every((film, index) => film.id === localFilms[index].id)) return;

    localFilms.forEach(film => films.delete(film.id));
    localFilms = next.map(({ id, title, description, year, duration, genres, hasPoster }) => ({
      id, title, description, year, duration, genres, hasPoster, color: '#415736', local: true,
    }));
    localFilms.forEach(film => films.set(film.id, film));
    render();
  } catch {
    // The included catalog is still available if the upload service cannot be reached.
  }
}

function notify(message) {
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 2400);
}

function toggleSaved(film) {
  let saved;
  const persisted = updateLibrary(list => {
    saved = !list.saved.includes(film.id);
    list.saved = saved ? [...list.saved, film.id] : list.saved.filter(id => id !== film.id);
  });
  const focused = document.activeElement;
  renderSavedCount();
  for (const button of document.querySelectorAll(`[data-action="save"][data-id="${film.id}"]`)) {
    const template = document.createElement('template');
    template.innerHTML = saveButton(film, button.classList.contains('card-save'));
    const replacement = template.content.firstElementChild;
    button.replaceWith(replacement);
    if (button === focused) replacement.focus({ preventScroll: true });
    if (button === returnFocus) returnFocus = replacement;
  }
  if (route === 'daftar' && !search.value.trim()) {
    render();
    if (!dialog.open && !document.activeElement.closest('#catalog-content')) document.querySelector('main').focus({ preventScroll: true });
  }
  if (!dialog.open) {
    const message = saved ? 'Ditambahkan ke Daftar Saya' : 'Dihapus dari Daftar Saya';
    notify(persisted ? message : `${message} untuk sesi ini`);
  }
}

function openDialog(html, className, opener) {
  if (!dialog.open) returnFocus = opener;
  dialog.className = `dialog ${className}`;
  dialogContent.innerHTML = `<button class="icon-button dialog-close" type="button" data-action="close" aria-label="Tutup" autofocus>${icon('close')}</button>${html}`;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  dialog.querySelector('.dialog-close').focus({ preventScroll: true });
}

function detail(film, opener) {
  const art = film.hero ? `assets/art/${film.hero}` : posterOf(film);
  const credit = film.local
    ? '<p class="credit">Diunggah oleh admin Layar</p>'
    : `<p class="credit">© Blender Foundation · <a href="${sourceOf(film)}" target="_blank" rel="noopener">Sumber film</a> · <a href="${film.license ?? licenseUrl}" target="_blank" rel="noopener">Lisensi</a></p>`;
  openDialog(`
    <div class="detail-art" style="--cover-color:${film.color}">
      ${art ? `<img src="${escapeHtml(art)}" alt="">` : ''}<h2 id="dialog-title">${escapeHtml(titleOf(film))}</h2>
    </div>
    <div class="dialog-body">
      ${filmMeta(film, true)}
      <p>${escapeHtml(film.description)}</p>
      <div class="actions">
        <button class="button primary" type="button" data-action="play" data-id="${film.id}">${icon('play')} ${playLabel(film)}</button>
        ${saveButton(film)}
      </div>
      ${credit}
    </div>`, 'dialog-detail', opener);
}

function savePlayback(force = false) {
  if (!playback?.started) return;
  const { video, film } = playback;
  const duration = video.duration;
  const time = Math.min(video.currentTime, duration);
  if (!Number.isFinite(duration) || !Number.isFinite(time) || (!force && Math.abs(time - playback.lastSaved) < 5)) return;
  if (time === playback.lastSaved && video.ended === playback.lastFinished) return;
  if (time < 1 && !library.progress[film.id]) return;

  playback.lastSaved = time;
  playback.lastFinished = video.ended;
  updateLibrary(list => {
    list.progress[film.id] = { time, duration, finished: video.ended, updated: Date.now() };
  });
}

function play(film, opener) {
  const entry = library.progress[film.id];
  const resumeAt = entry && !entry.finished ? entry.time : 0;
  const title = escapeHtml(titleOf(film));
  const poster = film.hero ? `assets/art/${film.hero}` : posterOf(film);
  const error = film.local
    ? 'Video gagal dimuat. Coba muat ulang atau gunakan peramban yang mendukung format video ini.'
    : `Video gagal dimuat. Coba putar ulang atau <a href="${sourceOf(film)}" target="_blank" rel="noopener">buka video di Blender</a>.`;
  openDialog(`
    <div class="player-head">${icon('play')} <div><h2 id="dialog-title">${title}</h2><small>${escapeHtml(film.year)} · ${escapeHtml(film.duration)}</small></div></div>
    <video class="player" controls playsinline preload="metadata"${poster ? ` poster="${escapeHtml(poster)}"` : ''} aria-label="Pemutar ${title}"></video>
    <p class="player-error" hidden>${error}</p>
    <div class="player-actions"><button class="button" type="button" data-action="restart" hidden>Putar dari awal</button></div>`, 'dialog-player', opener);

  const video = dialog.querySelector('video');
  const restart = dialog.querySelector('[data-action="restart"]');
  playback = { video, film, startAt: resumeAt, started: false, lastSaved: resumeAt, lastFinished: false };
  restart.hidden = !resumeAt;
  video.addEventListener('loadedmetadata', () => {
    if (playback?.video !== video) return;
    const startAt = playback.startAt;
    if (startAt > 0 && startAt < video.duration) video.currentTime = startAt;
    restart.textContent = 'Putar dari awal';
    restart.hidden = !(startAt > 0 && startAt < video.duration);
  });
  video.addEventListener('playing', () => { if (playback?.video === video) playback.started = true; });
  video.addEventListener('timeupdate', () => savePlayback());
  for (const event of ['pause', 'ended', 'seeked']) video.addEventListener(event, () => savePlayback(true));
  video.addEventListener('error', () => {
    if (playback?.video !== video) return;
    dialog.querySelector('.player-error').hidden = false;
    restart.textContent = 'Muat ulang video';
    restart.hidden = false;
  });
  video.src = film.local ? mediaUrl(film, 'video') : `https://video.blender.org/object-storage/web_videos/${film.file}.mp4`;
  video.play().catch(() => { /* The controls are available if autoplay is blocked. */ });
}

function credits(opener) {
  openDialog(`
    <div class="dialog-body dialog-simple">
      <h2 id="dialog-title">Kredit film</h2>
      <p>Film terbuka Blender menyertakan tautan ke rilis aslinya. Ilustrasi untuk film Blender dibuat untuk Layar.</p>
      <p class="credit">© Blender Foundation · <a href="https://studio.blender.org/films/" target="_blank" rel="noopener">Blender Studio Films</a> · <a href="${licenseUrl}" target="_blank" rel="noopener">Ketentuan lisensi</a></p>
    </div>`, 'dialog-credits', opener);
}

function changeRoute() {
  route = currentRoute();
  selectedGenre = 'Semua';
  search.value = '';
  render();
  window.scrollTo(0, 0);
}

hero.innerHTML = `<img class="hero-art" alt="" fetchpriority="high">
  <div class="hero-content" aria-live="polite"></div>
  <div class="hero-controls">
    <div class="hero-dots" role="group" aria-label="Pilih film unggulan">${featured.map((film, index) => `<button class="hero-dot" type="button" data-action="featured" data-index="${index}" aria-label="Tampilkan ${film.title}"></button>`).join('')}</div>
    <div class="hero-arrows">
      <button class="icon-button" type="button" data-action="previous" aria-label="Film unggulan sebelumnya">${icon('left')}</button>
      <button class="icon-button" type="button" data-action="next" aria-label="Film unggulan berikutnya">${icon('right')}</button>
    </div>
  </div>`;
renderHero();
render();
refreshUploads();

document.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (link?.classList.contains('skip')) {
    event.preventDefault();
    document.querySelector('main').focus();
  }
  if (link?.hash === `#${route}` && link.getAttribute('href') === link.hash && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    if (!location.hash) history.replaceState(null, '', link.hash);
    changeRoute();
  }

  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, id, genre, index } = button.dataset;
  const film = films.get(id);
  switch (action) {
    case 'previous':
    case 'next':
      featuredIndex = (featuredIndex + (action === 'next' ? 1 : -1) + featured.length) % featured.length;
      renderHero();
      break;
    case 'featured':
      featuredIndex = Number(index);
      renderHero();
      break;
    case 'genre': {
      const offset = button.parentElement.scrollLeft;
      selectedGenre = genre;
      render();
      content.querySelector('.genre-filter').scrollLeft = offset;
      content.querySelector('[data-genre][aria-pressed="true"]').focus({ preventScroll: true });
      break;
    }
    case 'detail': detail(film, button); break;
    case 'play': play(film, button); break;
    case 'save': toggleSaved(film); break;
    case 'credits': credits(button); break;
    case 'close': dialog.close(); break;
    case 'restart': {
      const { video } = playback;
      if (video.error) {
        dialog.querySelector('.player-error').hidden = true;
        savePlayback(true);
        playback.startAt = Math.max(video.currentTime, playback.lastSaved);
        playback.started = false;
        video.load();
      } else {
        video.currentTime = 0;
      }
      video.play().catch(() => {});
      break;
    }
  }
});

document.querySelector('#search-form').addEventListener('submit', event => event.preventDefault());
search.addEventListener('input', render);
searchClear.addEventListener('click', () => {
  search.value = '';
  render();
  search.focus();
});
document.addEventListener('keydown', event => {
  if (dialog.open) return;
  if (event.key === '/' && !event.target.closest('input, textarea, [contenteditable]') && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    search.focus();
  } else if (event.key === 'Escape' && document.activeElement === search && search.value) {
    event.preventDefault();
    searchClear.click();
  }
});
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => {
  if (playback) {
    savePlayback(true);
    const { video } = playback;
    playback = null;
    video.pause();
    video.removeAttribute('src');
    video.load();
    const fromHero = returnFocus && hero.contains(returnFocus);
    const id = returnFocus?.dataset.id;
    const action = returnFocus?.dataset.action;
    renderHero();
    render();
    const selector = `[data-action="${action}"][data-id="${id}"]`;
    returnFocus = (fromHero ? hero : content).querySelector(selector);
  }
  dialogContent.replaceChildren();
  const focusTarget = returnFocus?.isConnected ? returnFocus : document.querySelector('main');
  focusTarget.focus({ preventScroll: true });
  returnFocus = undefined;
});
window.addEventListener('hashchange', changeRoute);
window.addEventListener('pagehide', () => savePlayback(true));
window.addEventListener('pageshow', event => { if (event.persisted) refreshUploads(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshUploads(); });
window.addEventListener('storage', event => {
  if (event.key !== storageKey && event.key !== null) return;
  library = loadLibrary() ?? { saved: [], progress: {} };
  renderHero();
  render();
});
