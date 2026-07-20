/* RYCP Rwanda Community - shared scripts
   Handles the mobile menu, hero slider, scroll effects,
   number counters and simple form feedback. No dependencies. */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky header shadow ---------- */

  var header = document.querySelector('.site-header');
  if (header) {
    var onScrollHeader = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScrollHeader, { passive: true });
    onScrollHeader();
  }

  /* ---------- Mobile menu ---------- */

  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('mobile-menu');

  if (toggle && menu) {
    var scrim = menu.querySelector('.mobile-menu__scrim');
    var closeBtn = menu.querySelector('.mobile-menu__close');

    var openMenu = function () {
      menu.classList.add('is-open');
      document.body.classList.add('menu-open');
      toggle.setAttribute('aria-expanded', 'true');
      var firstLink = menu.querySelector('a');
      if (firstLink) firstLink.focus();
    };

    var closeMenu = function () {
      menu.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    };

    toggle.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) { closeMenu(); } else { openMenu(); }
    });
    if (scrim) scrim.addEventListener('click', closeMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    menu.querySelectorAll('nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('is-open');
        document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu();
    });
  }

  /* ---------- Hero slider ---------- */

  /* Fully automatic: the slides cycle on their own, no manual controls. */
  var hero = document.querySelector('[data-slider]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero__slide'));
    var current = 0;
    var timer = null;
    var INTERVAL = 6000;

    var goTo = function (index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
    };

    var stop = function () {
      if (timer) { clearInterval(timer); timer = null; }
    };

    var play = function () {
      if (prefersReducedMotion || slides.length < 2) return;
      stop();
      timer = setInterval(function () { goTo(current + 1); }, INTERVAL);
    };

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); } else { play(); }
    });

    goTo(0);
    play();
  }

  /* ---------- Scroll reveal ---------- */

  var revealItems = document.querySelectorAll('.reveal');
  if (revealItems.length && 'IntersectionObserver' in window && !prefersReducedMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Animated counters ---------- */

  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var animateCount = function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      if (prefersReducedMotion) { el.textContent = target + suffix; return; }
      var duration = 1600;
      var start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { countObserver.observe(el); });
    } else {
      counters.forEach(animateCount);
    }
  }

  /* ---------- Back to top ---------- */

  var toTop = document.querySelector('.to-top');
  if (toTop) {
    var onScrollTop = function () {
      toTop.classList.toggle('is-visible', window.scrollY > 600);
    };
    window.addEventListener('scroll', onScrollTop, { passive: true });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
    onScrollTop();
  }

  /* ---------- Real form submissions via Netlify Forms ----------
     No backend or API key needed: Netlify detects these forms at deploy
     time because of the data-netlify attribute and the hidden form-name
     field, then emails a notification for every submission. Submitting
     with fetch instead of a normal page POST lets us show the success or
     error message inline without leaving the page. */

  document.querySelectorAll('form[data-netlify-ajax]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var success = form.querySelector('.form-success');
      var error = form.querySelector('.form-error');
      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn ? submitBtn.textContent : '';

      if (error) error.classList.remove('is-visible');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Submission failed');
          if (success) {
            success.classList.add('is-visible');
            success.setAttribute('role', 'status');
            success.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
          }
          form.reset();
        })
        .catch(function () {
          if (error) {
            error.classList.add('is-visible');
            error.setAttribute('role', 'alert');
            error.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
          }
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
          }
        });
    });
  });

  /* ---------- Local-only demo forms ----------
     Reserved for forms with no real destination yet, such as the member
     login form before the member portal exists. Shows a message locally
     and never sends data anywhere. */

  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var success = form.querySelector('.form-success');
      if (success) {
        success.classList.add('is-visible');
        success.setAttribute('role', 'status');
        success.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
      }
      form.reset();
    });
  });

  /* ---------- Footer year ---------- */

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
