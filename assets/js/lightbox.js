/* Lightweight, accessible image lightbox.
   Wires up every ".gallery" grid so clicking (or Enter/Space on) a photo
   opens it full-size with next/prev and captions, and exposes
   window.RYCPLightbox.open(items, startIndex) so other components
   (like the circular gallery canvas) can open the same viewer. */

(function () {
  'use strict';

  var items = [];
  var currentIndex = 0;
  var lastFocused = null;
  var root, imgEl, captionEl, counterEl, closeBtn, prevBtn, nextBtn;

  function buildDom() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'lightbox';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Image viewer');
    root.innerHTML =
      '<button type="button" class="lightbox__scrim" aria-label="Close image viewer"></button>' +
      '<div class="lightbox__body">' +
      '  <button type="button" class="lightbox__close" aria-label="Close image viewer">' +
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
      '  </button>' +
      '  <button type="button" class="lightbox__nav lightbox__nav--prev" aria-label="Previous image">' +
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>' +
      '  </button>' +
      '  <figure class="lightbox__figure">' +
      '    <img class="lightbox__img" alt="">' +
      '    <figcaption class="lightbox__caption"></figcaption>' +
      '  </figure>' +
      '  <button type="button" class="lightbox__nav lightbox__nav--next" aria-label="Next image">' +
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>' +
      '  </button>' +
      '  <div class="lightbox__counter"></div>' +
      '</div>';
    document.body.appendChild(root);

    imgEl = root.querySelector('.lightbox__img');
    captionEl = root.querySelector('.lightbox__caption');
    counterEl = root.querySelector('.lightbox__counter');
    closeBtn = root.querySelector('.lightbox__close');
    prevBtn = root.querySelector('.lightbox__nav--prev');
    nextBtn = root.querySelector('.lightbox__nav--next');

    root.querySelector('.lightbox__scrim').addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { show(currentIndex - 1); });
    nextBtn.addEventListener('click', function () { show(currentIndex + 1); });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowLeft') { show(currentIndex - 1); }
      else if (e.key === 'ArrowRight') { show(currentIndex + 1); }
      else if (e.key === 'Tab') {
        // simple focus trap between the three buttons
        var focusable = [prevBtn, nextBtn, closeBtn];
        var idx = focusable.indexOf(document.activeElement);
        e.preventDefault();
        var next = e.shiftKey ? idx - 1 : idx + 1;
        if (next < 0) next = focusable.length - 1;
        if (next >= focusable.length) next = 0;
        focusable[next].focus();
      }
    });
  }

  function show(index) {
    if (!items.length) return;
    currentIndex = (index + items.length) % items.length;
    var item = items[currentIndex];
    imgEl.src = item.image;
    imgEl.alt = item.text || '';
    captionEl.textContent = item.text || '';
    captionEl.style.display = item.text ? '' : 'none';
    counterEl.textContent = (currentIndex + 1) + ' / ' + items.length;
    var multi = items.length > 1;
    prevBtn.style.display = multi ? '' : 'none';
    nextBtn.style.display = multi ? '' : 'none';
    counterEl.style.display = multi ? '' : 'none';
  }

  function open(list, startIndex) {
    buildDom();
    items = list;
    lastFocused = document.activeElement;
    show(startIndex || 0);
    root.classList.add('is-open');
    document.body.classList.add('lightbox-open');
    closeBtn.focus();
  }

  function close() {
    if (!root || !root.classList.contains('is-open')) return;
    root.classList.remove('is-open');
    document.body.classList.remove('lightbox-open');
    imgEl.src = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  window.RYCPLightbox = { open: open, close: close };

  /* ---------- Wire up every static .gallery grid ---------- */

  document.querySelectorAll('.gallery').forEach(function (gallery) {
    var figures = Array.prototype.slice.call(gallery.querySelectorAll('figure'));
    if (!figures.length) return;

    var galleryItems = figures.map(function (fig) {
      var img = fig.querySelector('img');
      var caption = fig.querySelector('figcaption');
      return {
        image: img ? img.getAttribute('src') : '',
        text: caption ? caption.textContent.trim() : (img ? img.getAttribute('alt') : '')
      };
    });

    figures.forEach(function (fig, i) {
      var img = fig.querySelector('img');
      if (!img) return;
      img.style.cursor = 'zoom-in';
      img.setAttribute('role', 'button');
      img.setAttribute('tabindex', '0');
      img.setAttribute('aria-label', 'Open image' + (galleryItems[i].text ? ': ' + galleryItems[i].text : ''));

      var trigger = function () { open(galleryItems, i); };
      img.addEventListener('click', trigger);
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger(); }
      });
    });
  });
})();
