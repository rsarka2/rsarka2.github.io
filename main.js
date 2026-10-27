/* Rohan Sarkar · Portfolio — shared script (used by every page) */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Nav: stagger delays scale with however many links there are */
  document.querySelectorAll('.nav-list > li').forEach(function (li, i) {
    li.style.setProperty('--i', i);
  });

  /* Nav: border + shadow once the page scrolls */
  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Nav: hamburger menu */
  var menuBtn = document.querySelector('.menu-btn');
  var navList = document.getElementById('nav-list');
  if (menuBtn && navList) {
    var setMenu = function (open) {
      navList.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    menuBtn.addEventListener('click', function () { setMenu(!navList.classList.contains('open')); });
    navList.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navList.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
    });
    window.matchMedia('(min-width: 1081px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* Hero: typewriter titles (static first title when reduced motion is on) */
  var tw = document.querySelector('[data-typewriter]');
  if (tw) {
    var words = JSON.parse(tw.getAttribute('data-typewriter'));
    var out = tw.querySelector('.tw-text');
    if (!reduceMotion && out && words.length) {
      var w = 0, c = 0, deleting = false;
      out.textContent = '';
      var tick = function () {
        c += deleting ? -1 : 1;
        out.textContent = words[w].slice(0, c);
        var delay = deleting ? 40 : 85;
        if (!deleting && c === words[w].length) { deleting = true; delay = 2200; }
        else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 400; }
        setTimeout(tick, delay);
      };
      setTimeout(tick, 700);
    }
  }

  /* Scroll reveal: children of [data-stagger] get increasing delays */
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (el, i) {
      el.classList.add('reveal');
      el.style.setProperty('--i', i);
    });
  });
  var revealEls = document.querySelectorAll('.reveal');
  var finish = function (el) {
    el.classList.add('in');
    // Once revealed, drop the reveal styles so hover transitions aren't delayed
    setTimeout(function () { el.classList.remove('reveal', 'in'); el.style.removeProperty('--i'); }, 1400);
  };
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { finish(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* Homepage: highlight the nav link for the section in view */
  var spyLinks = Array.prototype.filter.call(document.querySelectorAll('.nav-list a[href^="#"]'), function (a) {
    return document.getElementById(a.hash.slice(1));
  });
  if (spyLinks.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        spyLinks.forEach(function (a) {
          if (a.hash === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyLinks.forEach(function (a) { spy.observe(document.getElementById(a.hash.slice(1))); });
  }

  /* Posters: click or press Enter on any img[data-zoom] to view it full-screen */
  var zoomables = document.querySelectorAll('img[data-zoom]');
  if (zoomables.length) {
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Enlarged image');
    box.innerHTML = '<button type="button">Close ✕</button><img alt="">';
    document.body.appendChild(box);
    var big = box.querySelector('img');
    var closeBtn = box.querySelector('button');
    var lastFocus = null;
    var close = function () { box.classList.remove('open'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); };
    var open = function (img) {
      lastFocus = img;
      big.src = img.getAttribute('data-zoom') || img.src;
      big.alt = img.alt;
      box.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    };
    zoomables.forEach(function (img) {
      img.classList.add('zoomable');
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.addEventListener('click', function () { open(img); });
      img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); } });
    });
    closeBtn.addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }
    });
  }
})();
