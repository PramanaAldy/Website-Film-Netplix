'use strict';

const form = document.querySelector('#upload-form');
if (form) {
  const endpoint = form.getAttribute('action');
  const video = form.elements.video;
  const poster = form.elements.poster;
  const duration = form.elements.duration;
  const genres = [...form.querySelectorAll('input[name="genres[]"]')];
  const progressBox = document.querySelector('#upload-progress');
  const progress = progressBox.querySelector('progress');
  const progressText = progressBox.querySelector('[role="status"]');
  const errorBox = document.querySelector('#upload-error');
  const probe = document.createElement('video');
  let probeUrl;
  let measuredDuration;

  function clearProbe() {
    if (!probeUrl) return;
    URL.revokeObjectURL(probeUrl);
    probeUrl = undefined;
  }

  probe.preload = 'metadata';
  probe.addEventListener('loadedmetadata', () => {
    const seconds = Math.round(probe.duration);
    if (Number.isFinite(seconds) && seconds > 0 && seconds <= 86400 && !duration.value) {
      measuredDuration = String(seconds);
      duration.value = measuredDuration;
    }
    clearProbe();
  });
  probe.addEventListener('error', clearProbe);
  video.addEventListener('change', () => {
    clearProbe();
    probe.removeAttribute('src');
    if (duration.value === measuredDuration) duration.value = '';
    measuredDuration = undefined;
    const file = video.files[0];
    if (file && file.size <= 512 * 1024 * 1024) {
      probeUrl = URL.createObjectURL(file);
      probe.src = probeUrl;
    }
  });

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function setBusy(busy) {
    form.setAttribute('aria-busy', String(busy));
    for (const input of form.elements) input.disabled = busy;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    errorBox.hidden = true;
    if (!genres.some(genre => genre.checked)) {
      showError('Pilih minimal satu genre.');
      genres[0].focus();
      return;
    }
    if (video.files[0].size > 512 * 1024 * 1024 || poster.files[0]?.size > 8 * 1024 * 1024) {
      showError('Pilih video maksimal 512 MB dan poster maksimal 8 MB.');
      return;
    }

    const payload = new FormData(form);
    const request = new XMLHttpRequest();
    request.open('POST', endpoint);
    request.setRequestHeader('Accept', 'application/json');
    request.responseType = 'json';
    progressBox.hidden = false;
    progress.value = 0;
    progressText.textContent = 'Mengunggah video…';
    setBusy(true);

    request.upload.addEventListener('progress', event => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      progress.value = percent;
      progressText.textContent = percent < 100 ? `Mengunggah ${percent}%` : 'Menyimpan film…';
    });

    const failed = message => {
      setBusy(false);
      progressBox.hidden = true;
      showError(message);
    };
    request.addEventListener('load', () => {
      if (request.status === 201 && request.response?.id) {
        window.location.replace(endpoint);
      } else {
        const fallback = request.status === 413 ? 'Unggahan melebihi batas ukuran Laragon.' : 'Unggahan gagal. Silakan coba lagi.';
        failed(request.response?.error ?? fallback);
      }
    });
    request.addEventListener('error', () => failed('Koneksi ke Laragon terputus. Periksa koneksi lalu coba lagi.'));
    request.send(payload);
  });
}
