/* Boots every circular gallery on the page (one per business cluster) only
   when the browser can actually render it well: WebGL available and the
   visitor has not asked for reduced motion. Otherwise each gallery's static
   image grid already in the page (its "fallback" markup) stays visible, so
   nobody loses the content, only the animated presentation. */

(function () {
  'use strict';

  var mounts = document.querySelectorAll('.circular-gallery[data-gallery]');
  if (!mounts.length) return;

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function supportsWebGL() {
    try {
      var canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (prefersReducedMotion || !supportsWebGL()) {
    return; // leave every static fallback grid visible
  }

  var galleryModulePromise = null;
  function loadGalleryModule() {
    if (!galleryModulePromise) galleryModulePromise = import('./circular-gallery.js');
    return galleryModulePromise;
  }

  Array.prototype.forEach.call(mounts, function (mount) {
    var wrap = mount.closest('.circular-gallery-wrap');
    var fallback = wrap ? wrap.querySelector('.gallery') : null;

    var items = Array.prototype.map.call(mount.querySelectorAll('[data-image]'), function (el) {
      return { image: el.getAttribute('data-image'), text: el.getAttribute('data-text') || '' };
    });
    if (!items.length) return;

    var started = false;

    // Observe the wrapper, not the (initially display:none) canvas mount itself --
    // a non-rendered element never reports as intersecting, which would deadlock
    // the lazy init.
    var observeTarget = wrap || fallback || mount;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !started) {
          started = true;
          loadGalleryModule().then(function (mod) {
            // Must switch the container to display:block BEFORE constructing the
            // gallery: it reads clientWidth/clientHeight synchronously to size the
            // WebGL canvas, and a still-display:none element reports 0x0.
            mount.classList.add('is-active');
            new mod.CircularGallery(mount, {
              items: items,
              bend: 2.4,
              textColor: '#ffffff',
              borderRadius: 0.06,
              font: '600 26px "Space Grotesk", sans-serif',
              scrollSpeed: 1.6,
              scrollEase: 0.06
            });
            /* Keep the fallback grid's real <img alt> content in the accessibility
               tree (visually-hidden, not display:none) so screen reader users
               still get every image and caption even once the canvas takes over. */
            if (fallback) fallback.classList.add('visually-hidden');
          }).catch(function () {
            /* leave the static fallback grid visible */
          });
          observer.disconnect();
        }
      });
    }, { threshold: 0.15 });

    observer.observe(observeTarget);
  });
})();
