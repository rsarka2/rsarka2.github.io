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

/* Featured projects: crossfading image slideshows.
   Autoplay pauses on hover/focus and is off for reduced motion; arrows, dots and swipe always work. */
document.querySelectorAll('[data-slideshow]').forEach(function (show) {
  var imgs = show.querySelectorAll('img');
  var n = imgs.length;
  if (n < 2) return;
  var i = 0, timer = null, paused = false;
  var autoplay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var chevron = function (d) {
    return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };

  show.classList.add('is-running');
  show.setAttribute('role', 'group');
  show.setAttribute('aria-roledescription', 'carousel');

  function button(cls, label, html, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.setAttribute('aria-label', label);
    b.innerHTML = html;
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); onClick(); restart(); });
    return b;
  }

  var dots = document.createElement('div');
  dots.className = 'ss-dots';
  var dotBtns = Array.prototype.map.call(imgs, function (img, k) {
    var d = button('ss-dot', 'Show image ' + (k + 1) + ' of ' + n, '', function () { go(k); });
    dots.appendChild(d);
    return d;
  });

  function go(k) {
    imgs[i].classList.remove('active');
    dotBtns[i].removeAttribute('aria-current');
    i = (k + n) % n;
    imgs[i].classList.add('active');
    dotBtns[i].setAttribute('aria-current', 'true');
  }

  show.appendChild(button('ss-btn prev', 'Previous image', chevron('M10 3 5 8l5 5'), function () { go(i - 1); }));
  show.appendChild(button('ss-btn next', 'Next image', chevron('M6 3l5 5-5 5'), function () { go(i + 1); }));
  show.appendChild(dots);
  go(0);

  function stop() { clearInterval(timer); timer = null; }
  function restart() { stop(); if (autoplay && !paused && !document.hidden) timer = setInterval(function () { go(i + 1); }, 4000); }

  var card = show.closest('.entry') || show;
  card.addEventListener('mouseenter', function () { paused = true; stop(); });
  card.addEventListener('mouseleave', function () { paused = false; restart(); });
  card.addEventListener('focusin', function () { paused = true; stop(); });
  card.addEventListener('focusout', function () { paused = false; restart(); });
  document.addEventListener('visibilitychange', restart);

  /* Swipe: touches land on the card's stretched link, so listen on the card and check they began on the images */
  var x0 = null, y0 = null;
  card.addEventListener('touchstart', function (e) {
    var t = e.touches[0], r = show.getBoundingClientRect();
    var inside = t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom;
    x0 = inside ? t.clientX : null; y0 = t.clientY;
  }, { passive: true });
  card.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { go(dx < 0 ? i + 1 : i - 1); restart(); }
  });

  restart();
});
