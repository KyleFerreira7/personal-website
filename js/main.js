/* ===========================================================
   Kyle Ferreira — Portfolio
   main.js
   =========================================================== */

(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------------- Year ---------------- */
  const yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- Loader ---------------- */
  const loader = $('[data-loader]');
  const loaderBar = $('[data-loader-bar]');
  function hideLoader() {
    if (!loader) return;
    if (loaderBar) loaderBar.style.width = '100%';
    setTimeout(() => loader.classList.add('is-done'), 350);
  }

  /* ---------------- Lenis smooth scroll ---------------- */
  let lenis = null;
  function initLenis() {
    if (reduceMotion || typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 1,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---------------- Anchor links ---------------- */
  function bindAnchorLinks() {
    $$('a[href^="#"]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      a.addEventListener('click', (e) => {
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { offset: 0, duration: 1.2 });
        } else {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (menu && menu.classList.contains('is-open')) toggleMenu(false);
      });
    });
  }

  /* ---------------- Custom cursor ---------------- */
  const cursor = $('[data-cursor]');
  const cursorDot = $('[data-cursor-dot]');
  let cursorX = 0, cursorY = 0, dotX = 0, dotY = 0;
  let mx = 0, my = 0;

  function initCursor() {
    if (isCoarse || !cursor) return;
    document.body.classList.add('has-cursor');

    let raf = 0;
    function loop() {
      const dx  = mx - cursorX, dy  = my - cursorY;
      const dxd = mx - dotX,    dyd = my - dotY;
      // Idle? Stop the rAF loop so we don't burn frames during scroll.
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && Math.abs(dxd) < 0.1 && Math.abs(dyd) < 0.1) {
        raf = 0;
        return;
      }
      cursorX += dx  * 0.18; cursorY += dy  * 0.18;
      dotX    += dxd * 0.5;  dotY    += dyd * 0.5;
      cursor.style.transform    = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
      cursorDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      kick();
    });

    const hoverSel = 'a, button, [data-cursor-text], .project, .email-copy, .service-item, .about-tags li';
    $$(hoverSel).forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('is-hover');
        const txt = el.getAttribute('data-cursor-text');
        if (txt) cursor.textContent = txt;
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-hover');
        cursor.textContent = '';
      });
    });

    document.addEventListener('mouseleave', () => {
      cursor.classList.add('is-hidden');
      cursorDot.classList.add('is-hidden');
    });
    document.addEventListener('mouseenter', () => {
      cursor.classList.remove('is-hidden');
      cursorDot.classList.remove('is-hidden');
    });
  }

  /* ---------------- Menu ---------------- */
  const menu = $('[data-menu]');
  const menuToggle = $('[data-menu-toggle]');
  function toggleMenu(force) {
    if (!menu || !menuToggle) return;
    const open = typeof force === 'boolean' ? force : !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    menuToggle.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  if (menuToggle) menuToggle.addEventListener('click', () => toggleMenu());
  $$('[data-menu-link]').forEach((a) => a.addEventListener('click', () => toggleMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu && menu.classList.contains('is-open')) toggleMenu(false);
  });

  /* ---------------- Email copy ---------------- */
  const copyBtn = $('[data-copy]');
  const toast = $('[data-toast]');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const text = copyBtn.getAttribute('data-copy');
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(ta);
      }
      copyBtn.classList.add('is-copied');
      if (toast) {
        toast.classList.add('is-show');
        clearTimeout(copyBtn._t);
        copyBtn._t = setTimeout(() => {
          copyBtn.classList.remove('is-copied');
          toast.classList.remove('is-show');
        }, 1800);
      }
    });
  }

  /* ---------------- Typing reveal — wraps each character in a span so
        CSS can stagger it via the --i custom property ---------------- */
  function initTyping() {
    $$('[data-typing]').forEach((el) => {
      if (el.dataset.typingDone) return;
      const text = el.textContent;
      el.textContent = '';
      el.setAttribute('aria-label', text);
      [...text].forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.setAttribute('aria-hidden', 'true');
        span.style.setProperty('--i', i);
        span.textContent = ch === ' ' ? ' ' : ch;
        el.appendChild(span);
      });
      el.dataset.typingDone = '1';
    });
  }

  /* ---------------- Eye-peek pupils track cursor ---------------- */
  function initEyes() {
    if (isCoarse) return;
    const pupils = $$('[data-pupil]');
    if (!pupils.length) return;
    document.addEventListener('mousemove', (e) => {
      pupils.forEach((pupil) => {
        const eye = pupil.parentElement;
        const r = eye.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const angle = Math.atan2(dy, dx);
        const max = r.width * 0.18;
        const dist = Math.min(max, Math.hypot(dx, dy) / 30);
        pupil.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
      });
    });
  }

  /* ---------------- Back-to-top button ---------------- */
  function initBackToTop() {
    const btn = $('[data-back-to-top]');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (lenis) lenis.scrollTo(0, { duration: 1.4 });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------------- Services hover (alternating angles, grey-out) ---------------- */
  function initServices() {
    const stage = $('[data-services-stage]');
    const imageEl = $('[data-services-image]');
    if (!stage || !imageEl || isCoarse) return;

    const items = $$('.service-item', stage);
    const arts = $$('.svc-art', imageEl);

    let imgX = 0, imgY = 0, targetX = 0, targetY = 0;

    function updatePosition() {
      imgX += (targetX - imgX) * 0.18;
      imgY += (targetY - imgY) * 0.18;
      imageEl.style.left = imgX + 'px';
      imageEl.style.top = imgY + 'px';
      requestAnimationFrame(updatePosition);
    }
    updatePosition();

    stage.addEventListener('mousemove', (e) => {
      const r = stage.getBoundingClientRect();
      targetX = e.clientX - r.left;
      targetY = e.clientY - r.top;
    });

    stage.addEventListener('mouseenter', (e) => {
      const r = stage.getBoundingClientRect();
      imgX = targetX = e.clientX - r.left;
      imgY = targetY = e.clientY - r.top;
    });

    items.forEach((item, idx) => {
      const key = item.dataset.service;
      const art = arts.find((a) => a.dataset.svc === key);
      // Alternating angle: even indices tilt left, odd indices tilt right
      const angle = (idx % 2 === 0) ? '-5deg' : '5deg';

      item.addEventListener('mouseenter', () => {
        stage.classList.add('is-hovering');
        items.forEach((i) => i.classList.remove('is-active'));
        item.classList.add('is-active');
        arts.forEach((a) => a.classList.remove('is-shown'));
        if (art) art.classList.add('is-shown');
        imageEl.style.setProperty('--rot', angle);
        imageEl.classList.add('is-visible');
      });
    });

    stage.addEventListener('mouseleave', () => {
      stage.classList.remove('is-hovering');
      imageEl.classList.remove('is-visible');
      items.forEach((i) => i.classList.remove('is-active'));
    });
  }

  /* ---------------- About scroll-reveal ---------------- */
  function initAboutReveal() {
    const blocks = $$('[data-about-block]');
    if (!blocks.length) return;

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      blocks.forEach((b) => {
        ScrollTrigger.create({
          trigger: b,
          start: 'top 82%',
          once: true,
          onEnter: () => b.classList.add('is-in'),
        });
      });
    } else if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.15 });
      blocks.forEach((b) => io.observe(b));
    } else {
      blocks.forEach((b) => b.classList.add('is-in'));
    }
  }

  /* ---------------- Card enter-animations — adds .is-active when the card
        enters the viewport so the IDE typewriter and the chart's draw-in
        animation both kick off. Re-arms when scrolled out and back in. ---------------- */
  function initIdeTyping() {
    const cards = $$('.proj-art--ide, .proj-art--chart');
    if (!cards.length || !('IntersectionObserver' in window)) {
      cards.forEach((c) => c.classList.add('is-active'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-active');
          // force reflow so animations actually replay
          void entry.target.offsetWidth;
          entry.target.classList.add('is-active');
        }
      });
    }, { threshold: 0.4 });
    cards.forEach((card) => io.observe(card));
  }

  /* ---------------- Card tilt parallax — small mouse-tracked rotation + shift
        on project cards so they feel responsive to the cursor ---------------- */
  function initCardTilt() {
    if (isCoarse) return;
    $$('[data-tilt-card]').forEach((card) => {
      let raf = 0;
      let tx = 0, ty = 0, rx = 0, ry = 0;
      let targetTx = 0, targetTy = 0, targetRx = 0, targetRy = 0;

      function loop() {
        // Lerp toward target for smoothness
        tx += (targetTx - tx) * 0.18;
        ty += (targetTy - ty) * 0.18;
        rx += (targetRx - rx) * 0.18;
        ry += (targetRy - ry) * 0.18;
        card.style.setProperty('--tx', tx.toFixed(2) + 'px');
        card.style.setProperty('--ty', ty.toFixed(2) + 'px');
        card.style.setProperty('--rx', rx.toFixed(2) + 'deg');
        card.style.setProperty('--ry', ry.toFixed(2) + 'deg');
        if (Math.abs(targetTx - tx) > 0.05 || Math.abs(targetTy - ty) > 0.05
         || Math.abs(targetRx - rx) > 0.05 || Math.abs(targetRy - ry) > 0.05) {
          raf = requestAnimationFrame(loop);
        } else {
          raf = 0;
        }
      }
      function kick() { if (!raf) raf = requestAnimationFrame(loop); }

      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        // Relative position from -1..1 across each axis
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        // INVERTED translate: cursor pulls card the opposite way (subtle shift)
        targetTx = -dx * 8;
        targetTy = -dy * 8;
        // Tilt: card leans toward the cursor (3D feel)
        targetRy =  dx * 4;
        targetRx = -dy * 4;
        kick();
      });
      card.addEventListener('mouseleave', () => {
        targetTx = targetTy = targetRx = targetRy = 0;
        kick();
      });
    });
  }

  /* ---------------- Tilt hover (small playful tilt for buttons / links) ---------------- */
  function initTilt() {
    if (isCoarse) return;
    $$('[data-tilt]').forEach((el) => {
      // Each element gets its own random tilt direction + amount
      const dir = Math.random() > 0.5 ? 1 : -1;
      const baseAngle = (3 + Math.random() * 2) * dir; // 3°–5°
      el.addEventListener('mouseenter', () => {
        el.style.transform = `rotate(${baseAngle.toFixed(2)}deg) translateY(-2px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---------------- Reveal animations (CSS-driven, IO-triggered) ---------------- */
  function initReveals() {
    // Hero [data-reveal] — fire on load with staggered delay (CSS transitions)
    const heroReveals = $$('.hero [data-reveal]');
    heroReveals.forEach((el, i) => {
      el.style.setProperty('--reveal-delay', (0.35 + i * 0.08) + 's');
    });
    // Double rAF to ensure the initial transform paints before the class change
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        heroReveals.forEach((el) => el.classList.add('is-in'));
      });
    });

    // Other [data-reveal] — observe the parent .display-line (which has its
    // natural layout position) so the trigger fires when the line enters the
    // viewport, not when the translated inner span does.
    const otherReveals = $$('[data-reveal]').filter((el) => !el.closest('.hero'));
    const textReveals = $$('[data-reveal-text]');

    if ('IntersectionObserver' in window) {
      const triggerMap = new WeakMap();

      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = triggerMap.get(entry.target) || entry.target;
          target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      }, { threshold: 0.05, rootMargin: '0px 0px -2% 0px' });

      otherReveals.forEach((el) => {
        const trigger = el.closest('.display-line') || el;
        triggerMap.set(trigger, el);
        io.observe(trigger);
      });
      textReveals.forEach((el) => io.observe(el));
    } else {
      otherReveals.concat(textReveals).forEach((el) => el.classList.add('is-in'));
    }

    // Optional GSAP enhancements (parallax, scrub) — only if GSAP loaded
    if (typeof gsap === 'undefined') return;
    if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

    // Project tile gentle fade-up on enter
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.utils.toArray('.project').forEach((el, i) => {
        gsap.from(el, {
          y: 50, opacity: 0, duration: 1, ease: 'expo.out',
          delay: (i % 3) * 0.06,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });

      // Service items rise up
      gsap.utils.toArray('.service-item').forEach((el, i) => {
        gsap.from(el, {
          y: 36, opacity: 0, duration: 0.85, ease: 'expo.out',
          delay: i * 0.06,
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
      });

      // Section labels
      gsap.utils.toArray('.section-label').forEach((el) => {
        gsap.from(el, {
          y: 16, opacity: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        });
      });

      // (Removed: portrait + .proj-art scrub parallax — they were running
      //  gsap updates on every scroll frame and tanking smoothness, especially
      //  with the IDE code cards in view. One-shot reveals above are enough.)
    }
  }

  /* ---------------- Magnetic CTA ---------------- */
  function initMagnetic() {
    if (isCoarse) return;
    $$('.nav-mark').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const relX = e.clientX - (r.left + r.width / 2);
        const relY = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${relX * 0.18}px, ${relY * 0.25}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---------------- Init ---------------- */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(() => {
    if (loaderBar) loaderBar.style.width = '40%';
    initLenis();
    initCursor();
    bindAnchorLinks();
    initTyping();
    initReveals();
    initAboutReveal();
    initServices();
    initEyes();
    initBackToTop();
    initTilt();
    initCardTilt();
    initIdeTyping();
    initMagnetic();
  });

  window.addEventListener('load', () => {
    hideLoader();
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  });
})();
