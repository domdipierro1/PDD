// PDD Cleaning Services — static site interactions
// Mobile menu, active navigation and light reveal animations.
document.addEventListener('DOMContentLoaded', function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var toggle = document.querySelector('.menu-toggle');
  var mobileShell = document.querySelector('.mobile-menu-shell');

  if (toggle && mobileShell) {
    toggle.addEventListener('click', function () {
      var isOpen = mobileShell.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    mobileShell.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileShell.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        mobileShell.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a, .mobile-nav a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  var reveals = document.querySelectorAll('.reveal');
  reveals.forEach(function (el) {
    var group = el.closest('.grid, .picker-grid, .checklist-wrap, .trust-row, .area-row');
    if (group) {
      var groupReveals = Array.prototype.slice.call(group.querySelectorAll('.reveal'));
      var index = groupReveals.indexOf(el);
      if (index > -1) el.style.setProperty('--reveal-delay', Math.min(index * 70, 280) + 'ms');
    }
  });

  if (reduceMotion) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }
});
