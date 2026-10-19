/* ==========================================================
   Baden Haus — landing scripts
   © 2026 Полунин Лев. Все права защищены.
   ========================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.remove('no-js');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };

  /* ---------- toast ---------- */
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-shown'); }, 3600);
  }

  /* ---------- header + fab on scroll ---------- */
  var header = $('#header'), fab = $('.fab');
  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset || doc.scrollTop;
    header.classList.toggle('is-scrolled', y > 40);
    if (fab) fab.classList.toggle('is-visible', y > window.innerHeight * 0.8);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- burger menu ---------- */
  var burger = $('#burger'), nav = $('#nav');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) setMenu(false); });

  /* ---------- reveal + active nav ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 0.08 + 's';
      io.observe(el);
    });

    var links = $$('.nav__list a');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.classList.remove('is-active'); });
          map[en.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- calculator ---------- */
  var PRICE = { weekday: 12000, weekend: 15000, spaHour: 4000, combo: 24000, extraGuest: 1000, baseGuests: 8 };
  var form = $('#calc');
  if (form) {
    var totalEl = $('#total'), detailsEl = $('#details'), warnEl = $('#calcWarn');
    var lastText = '';

    function val(name) {
      var el = form.querySelector('[name="' + name + '"]:checked') || form.elements[name];
      return el ? el.value : '';
    }
    function clampInput(input) {
      var min = +input.min, max = +input.max, v = parseInt(input.value, 10);
      if (isNaN(v)) v = min;
      input.value = Math.min(max, Math.max(min, v));
      return +input.value;
    }
    function plural(n, one, few, many) {
      var m10 = n % 10, m100 = n % 100;
      if (m10 === 1 && m100 !== 11) return one;
      if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
      return many;
    }

    function calc() {
      var mode = val('mode');
      var day = val('day');
      var nights = clampInput(form.elements.nights);
      var hours = clampInput(form.elements.hours);
      var guests = clampInput(form.elements.guests);
      var extra = Math.max(0, guests - PRICE.baseGuests);
      var total = 0, parts = [];

      $$('[data-for]', form).forEach(function (g) {
        g.hidden = g.getAttribute('data-for').split(' ').indexOf(mode) === -1;
      });

      if (mode === 'house') {
        var night = day === 'weekend' ? PRICE.weekend : PRICE.weekday;
        total = night * nights + extra * PRICE.extraGuest * nights;
        parts.push('Дом', day === 'weekend' ? 'Пт–Вс' : 'будни', nights + ' ' + plural(nights, 'сутки', 'суток', 'суток'));
        parts.push(guests + ' ' + plural(guests, 'гость', 'гостя', 'гостей'));
        if (extra) parts.push('+' + extra + ' сверх 8');
        warnEl.hidden = day !== 'weekend';
      } else if (mode === 'spa') {
        total = hours * PRICE.spaHour;
        var gift = hours >= 4 ? 1 : 0;
        parts.push('Баня + чан', hours + ' ' + plural(hours, 'час', 'часа', 'часов'));
        if (gift) parts.push('+1 час в подарок');
        else parts.push('возьмите 4 ч — 5-й в подарок');
        warnEl.hidden = true;
      } else {
        total = PRICE.combo + extra * PRICE.extraGuest;
        parts.push('Дом + баня + чан', guests + ' ' + plural(guests, 'гость', 'гостя', 'гостей'), '+2 часа бани в подарок');
        if (extra) parts.push('+' + extra + ' сверх 8');
        warnEl.hidden = true;
      }

      totalEl.textContent = fmt(total);
      detailsEl.textContent = parts.join(' · ');
      lastText = 'Здравствуйте! Хочу забронировать Baden Haus.\n' + parts.join(', ') +
        '\nПредварительно: ' + fmt(total) + ' ₽.\nПодскажите, пожалуйста, свободные даты.';
    }

    form.addEventListener('change', calc);
    form.addEventListener('input', function (e) { if (e.target.type === 'number') calc(); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    $$('.stepper button', form).forEach(function (b) {
      b.addEventListener('click', function () {
        var input = b.parentNode.querySelector('input');
        input.value = (parseInt(input.value, 10) || 0) + (+b.getAttribute('data-step'));
        calc();
      });
    });

    function copy(text) {
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
      return new Promise(function (res, rej) {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy') ? res() : rej(); } catch (err) { rej(err); }
        document.body.removeChild(ta);
      });
    }

    $('#sendTg').addEventListener('click', function () {
      var url = 'https://t.me/Nik_HardWork';
      var w = window.open(url, '_blank', 'noopener');
      copy(lastText).then(function () {
        toast('Текст заявки скопирован — вставьте его в чат Telegram');
      }, function () { toast('Откроется Telegram — напишите нам даты и количество гостей'); });
      if (!w) window.location.href = url;
    });

    calc();
  }

  /* ---------- reviews slider ---------- */
  var slider = $('#slider'), track = $('#track');
  if (slider && track) {
    var slides = $$('.review', track);
    var dotsWrap = $('#dots'), prev = $('#prev'), next = $('#next');
    var index = 0, perView = 3, maxIndex = 0, autoplay;

    function getPerView() {
      var w = window.innerWidth;
      return w <= 640 ? 1 : w <= 1000 ? 2 : 3;
    }
    function step() {
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 20;
      return slides[0].getBoundingClientRect().width + gap;
    }
    function buildDots() {
      dotsWrap.innerHTML = '';
      for (var i = 0; i <= maxIndex; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Отзыв ' + (i + 1));
        b.addEventListener('click', (function (n) { return function () { go(n); restart(); }; })(i));
        dotsWrap.appendChild(b);
      }
    }
    function go(n) {
      index = Math.max(0, Math.min(maxIndex, n));
      track.style.transform = 'translate3d(' + (-index * step()) + 'px,0,0)';
      $$('button', dotsWrap).forEach(function (d, i) { d.setAttribute('aria-selected', i === index ? 'true' : 'false'); });
      prev.disabled = index === 0;
      next.disabled = index === maxIndex;
    }
    function layout() {
      perView = getPerView();
      maxIndex = Math.max(0, slides.length - perView);
      buildDots();
      go(Math.min(index, maxIndex));
    }
    function restart() {
      clearInterval(autoplay);
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      autoplay = setInterval(function () { go(index >= maxIndex ? 0 : index + 1); }, 6000);
    }

    prev.addEventListener('click', function () { go(index - 1); restart(); });
    next.addEventListener('click', function () { go(index + 1); restart(); });
    slider.addEventListener('mouseenter', function () { clearInterval(autoplay); });
    slider.addEventListener('mouseleave', restart);

    // swipe / drag (pointer events with touch fallback)
    var startX = 0, startY = 0, dx = 0, dragging = false, locked = null;
    function start(x, y) { startX = x; startY = y; dx = 0; dragging = true; locked = null; clearInterval(autoplay); }
    function move(x, y, e) {
      if (!dragging) return;
      dx = x - startX;
      var dy = y - startY;
      if (locked === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (locked !== 'x') return;
      if (e && e.cancelable) e.preventDefault();
      slider.classList.add('is-dragging');
      track.style.transform = 'translate3d(' + (-index * step() + dx) + 'px,0,0)';
    }
    function end() {
      if (!dragging) return;
      dragging = false;
      slider.classList.remove('is-dragging');
      if (locked === 'x' && Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1)); else go(index);
      restart();
    }
    if (window.PointerEvent) {
      slider.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button !== 0) return; start(e.clientX, e.clientY); });
      window.addEventListener('pointermove', function (e) { move(e.clientX, e.clientY, e); }, { passive: false });
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    } else {
      slider.addEventListener('touchstart', function (e) { start(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
      slider.addEventListener('touchmove', function (e) { move(e.touches[0].clientX, e.touches[0].clientY, e); }, { passive: false });
      slider.addEventListener('touchend', end);
    }
    slider.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(index + 1); restart(); }
      if (e.key === 'ArrowLeft') { go(index - 1); restart(); }
    });
    slider.setAttribute('tabindex', '0');

    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 150); });
    layout();
    restart();
  }

  /* ---------- gallery lightbox ---------- */
  var lb = $('#lightbox'), lbImg = $('#lbImg');
  var items = $$('.g');
  var cur = 0, lastFocus = null;
  function openLb(i) {
    cur = (i + items.length) % items.length;
    var it = items[cur];
    var webp = it.getAttribute('data-full');
    var supportsWebp = doc.classList.contains('webp');
    lbImg.src = supportsWebp ? webp : it.querySelector('img').currentSrc || it.querySelector('img').src;
    lbImg.alt = it.querySelector('img').alt;
    if (lb.hidden) { lastFocus = document.activeElement; lb.hidden = false; document.body.style.overflow = 'hidden'; $('#lbClose').focus(); }
  }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ''; lbImg.src = ''; if (lastFocus) lastFocus.focus(); }
  items.forEach(function (it, i) { it.addEventListener('click', function () { openLb(i); }); });
  if (lb) {
    $('#lbClose').addEventListener('click', closeLb);
    $('#lbPrev').addEventListener('click', function () { openLb(cur - 1); });
    $('#lbNext').addEventListener('click', function () { openLb(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowRight') openLb(cur + 1);
      if (e.key === 'ArrowLeft') openLb(cur - 1);
    });
    var lx = 0;
    lb.addEventListener('touchstart', function (e) { lx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var d = e.changedTouches[0].clientX - lx;
      if (Math.abs(d) > 50) openLb(cur + (d < 0 ? 1 : -1));
    });
  }

  // webp support flag (for lightbox full-size images)
  (function () {
    var img = new Image();
    img.onload = function () { if (img.width > 0) doc.classList.add('webp'); };
    img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  })();

  /* ---------- lazy Yandex map ---------- */
  var mapBox = $('#map'), mapBtn = $('#mapLoad');
  function loadMap() {
    if (!mapBox || mapBox.querySelector('iframe')) return;
    var f = document.createElement('iframe');
    f.src = 'https://yandex.ru/map-widget/v1/?text=' + encodeURIComponent('Иркутская область, посёлок Изумрудный') + '&z=13';
    f.title = 'Baden Haus на карте — посёлок Изумрудный, Иркутская область';
    f.loading = 'lazy';
    f.setAttribute('allowfullscreen', '');
    mapBox.appendChild(f);
    if (mapBtn) mapBtn.remove();
  }
  if (mapBtn) mapBtn.addEventListener('click', loadMap);
  if (mapBox && 'IntersectionObserver' in window) {
    var mo = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { loadMap(); mo.disconnect(); }
    }, { rootMargin: '200px' });
    mo.observe(mapBox);
  }
})();
