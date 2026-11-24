(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Barra de progreso de lectura + Header pegajoso + Spy de navegación
  const header = document.getElementById('site-header');
  const progressBar = document.getElementById('scroll-progress-bar');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  const sections = Array.from(navLinks)
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const onScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (progressBar && docHeight > 0) {
      progressBar.style.width = `${Math.min(100, (scrollTop / docHeight) * 100)}%`;
    }
    if (header) {
      header.classList.toggle('is-scrolled', scrollTop > 24);
    }
    let activeId = '';
    for (const sec of sections) {
      if (scrollTop >= sec.offsetTop - 160) {
        activeId = `#${sec.id}`;
      }
    }
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === activeId);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 2. Menú móvil accesible
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-links');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navMenu.classList.toggle('is-open', !expanded);
    });
    navMenu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('is-open');
      });
    });
  }

  // 3. Scroll-Reveal y Contadores numéricos
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  const counterEls = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const counterObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseFloat(el.dataset.count || '0');
          const prefix = el.dataset.prefix || '';
          const suffix = el.dataset.suffix || '';
          const decimals = parseInt(el.dataset.decimals || '0', 10);
          const duration = 1300;
          const start = performance.now();
          const tick = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            const val = (target * eased).toFixed(decimals);
            el.textContent = `${prefix}${Number(val).toLocaleString('es-MX', {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals
            })}${suffix}`;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          obs.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );
    counterEls.forEach((el) => counterObserver.observe(el));
  }

  // 4. Motor Compartido de Pouch Interactivo (#inicio y #producto):
  //    Hover 3D con físicas de resorte + Explosión de hojas Rivelant al scroll + Apretón con gotas realistas
  if (!prefersReducedMotion) {
    // Paleta oficial de hojas Rivelant (Manual de Identidad Visual)
    const LEAF_PALETTE = [
      { fill: '#0c3c2d', vein: '#74c365' },
      { fill: '#1e5631', vein: '#97c49e' },
      { fill: '#234e35', vein: '#c3d15e' },
      { fill: '#80a32f', vein: '#effbef' },
      { fill: '#74c365', vein: '#0c3c2d' },
      { fill: '#c3d15e', vein: '#1e5631' },
      { fill: '#97c49e', vein: '#1e5631' }
    ];

    let prevScrollY = window.scrollY || 0;
    let globalScrollDir = 1;
    window.addEventListener('scroll', () => {
      const currY = window.scrollY || 0;
      if (currY !== prevScrollY) {
        globalScrollDir = currY > prevScrollY ? 1 : -1;
        prevScrollY = currY;
      }
    }, { passive: true });

    const stepSpring = (val, vel, goal, stiffness, damping, dt) => {
      const nextVel = vel + ((goal - val) * stiffness - vel * damping) * dt;
      return [val + nextVel * dt, nextVel];
    };

    const drawLeaf = (ctx, l, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rot);
      const scaleX = 0.26 + 0.74 * Math.abs(Math.cos(l.flip));
      ctx.scale(scaleX, 1);

      const s = l.size;
      ctx.beginPath();
      if (l.shape === 0) {
        ctx.moveTo(0, -s);
        ctx.bezierCurveTo(s * 0.78, -s * 0.45, s * 0.68, s * 0.55, 0, s);
        ctx.bezierCurveTo(-s * 0.68, s * 0.55, -s * 0.78, -s * 0.45, 0, -s);
      } else if (l.shape === 1) {
        ctx.moveTo(0, -s * 0.92);
        ctx.quadraticCurveTo(s * 0.92, -s * 0.12, 0, s * 0.92);
        ctx.quadraticCurveTo(-s * 0.92, -s * 0.12, 0, -s * 0.92);
      } else {
        ctx.moveTo(-s * 0.18, -s);
        ctx.bezierCurveTo(s * 0.9, -s * 0.5, s * 0.55, s * 0.65, -s * 0.1, s);
        ctx.bezierCurveTo(-s * 0.58, s * 0.32, -s * 0.68, -s * 0.48, -s * 0.18, -s);
      }
      ctx.closePath();
      ctx.fillStyle = l.color;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -s * 0.72);
      ctx.quadraticCurveTo(s * 0.08, 0, 0, s * 0.78);
      ctx.strokeStyle = l.vein;
      ctx.globalAlpha = alpha * 0.65;
      ctx.lineWidth = Math.max(0.9, s * 0.085);
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    };

    // Render óptico realista de gota de agua: sombra suave, cuerpo translúcido refractivo, cáustica inferior y destello especular
    const drawWaterDroplet = (ctx, d, alpha) => {
      const speed = Math.hypot(d.vx, d.vy);
      const angle = Math.atan2(d.vy, d.vx);
      const wobble = 1 + 0.075 * Math.sin(d.age * 24 + d.phase);
      const stretch = Math.min(1.9, (1 + speed / 310) * wobble);
      const r = d.r;

      const traceDropPath = (ox, oy) => {
        ctx.beginPath();
        ctx.moveTo(ox + r * 1.12, oy);
        ctx.bezierCurveTo(ox + r * 0.68, oy + r * 0.98, ox - r * stretch * 0.55, oy + r * 0.72, ox - r * stretch * 1.48, oy);
        ctx.bezierCurveTo(ox - r * stretch * 0.55, oy - r * 0.72, ox + r * 0.68, oy - r * 0.98, ox + r * 1.12, oy);
        ctx.closePath();
      };

      ctx.save();
      ctx.translate(d.x, d.y);

      // 1. Sombra suave proyectada para sensación de volumen 3D sobre el fondo claro
      ctx.save();
      ctx.translate(1.4, 2.8);
      ctx.rotate(angle);
      ctx.globalAlpha = alpha * 0.16;
      traceDropPath(0, 0);
      ctx.fillStyle = '#0c3c2d';
      ctx.fill();
      ctx.restore();

      // 2. Cuerpo cristalino refractivo
      ctx.rotate(angle);
      ctx.globalAlpha = alpha;
      traceDropPath(0, 0);

      const bodyGrad = ctx.createRadialGradient(r * 0.28, -r * 0.3, r * 0.08, -r * 0.1, r * 0.1, r * stretch * 1.25);
      bodyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
      bodyGrad.addColorStop(0.32, 'rgba(222, 249, 253, 0.78)');
      bodyGrad.addColorStop(0.72, 'rgba(148, 218, 232, 0.64)');
      bodyGrad.addColorStop(1, 'rgba(84, 174, 192, 0.46)');
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Borde Fresnel sutil
      ctx.strokeStyle = 'rgba(20, 92, 86, 0.24)';
      ctx.lineWidth = Math.max(0.65, r * 0.16);
      ctx.stroke();

      // 3. Cáustica luminosa interna en el borde opuesto a la luz
      if (r >= 2.2) {
        ctx.beginPath();
        ctx.arc(r * 0.12, r * 0.32, r * 0.48, 0.2, Math.PI * 0.85);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = Math.max(0.8, r * 0.22);
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // 4. Destello especular húmedo principal + micro-brillo secundario
      ctx.beginPath();
      ctx.ellipse(r * 0.36, -r * 0.3, r * 0.32, r * 0.2, -0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
      ctx.fill();

      if (r >= 2.8) {
        ctx.beginPath();
        ctx.arc(-r * 0.25, -r * 0.18, r * 0.13, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
        ctx.fill();
      }
      ctx.restore();
    };

    const drawLiquidFilament = (ctx, f, alpha) => {
      const p = f.age / f.life;
      const extend = 1 - Math.pow(1 - Math.min(1, p * 2.2), 3);
      const retract = p > 0.42 ? (p - 0.42) / 0.58 : 0;
      const startT = retract * 0.72;
      const endT = extend;
      if (endT <= startT) return;

      const x0 = f.x + f.dx * startT;
      const y0 = f.y + f.dy * startT + 14 * startT * startT;
      const xm = f.x + f.dx * ((startT + endT) * 0.5) + f.curveX;
      const ym = f.y + f.dy * ((startT + endT) * 0.5) - 6;
      const x1 = f.x + f.dx * endT;
      const y1 = f.y + f.dy * endT + 18 * endT * endT;

      ctx.save();
      ctx.globalAlpha = alpha * (1 - p);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(xm, ym, x1, y1);
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, 'rgba(235, 252, 255, 0.85)');
      grad.addColorStop(0.6, 'rgba(164, 228, 240, 0.72)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(0.8, f.width * (1 - p * 0.7));
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    };

    const initInteractivePouch = (cfg) => {
      const {
        host,
        trigger,
        pouch,
        pouchImg,
        shadow,
        aura,
        ring,
        sheen,
        tags,
        fxCanvas,
        fadeOnLeave = false
      } = cfg;
      if (!host || !pouch) return;
      const fxCtx = fxCanvas ? fxCanvas.getContext('2d') : null;

      const leaves = [];
      const drops = [];
      const ripples = [];
      const filaments = [];
      const emitters = [];

      const state = {
        hover: 0, hoverV: 0,
        rx: 0, rxV: 0,
        ry: 0, ryV: 0,
        tx: 0, txV: 0,
        ty: 0, tyV: 0,
        gx: 50, gy: 45,
        pop: fadeOnLeave ? 0 : 1, popV: 0,
        vis: fadeOnLeave ? 0 : 1, visV: 0,
        entryY: fadeOnLeave ? 36 : 0, entryYV: 0,
        sq: 0, sqV: 0
      };
      const target = {
        hover: 0, rx: 0, ry: 0, tx: 0, ty: 0, gx: 50, gy: 45,
        pop: fadeOnLeave ? 0 : 1,
        vis: fadeOnLeave ? 0 : 1,
        entryY: fadeOnLeave ? 36 : 0,
        sq: 0
      };

      let hovered = false;
      let pressing = false;
      let squeezeDir = 1;
      let releaseTimer = 0;
      let rafId = 0;
      let lastTime = 0;
      let canvasW = 0;
      let canvasH = 0;

      const syncCanvas = () => {
        if (!fxCanvas || !fxCtx) return;
        const w = fxCanvas.clientWidth;
        const h = fxCanvas.clientHeight;
        if (!w || !h) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvasW = w;
        canvasH = h;
        fxCanvas.width = Math.round(w * dpr);
        fxCanvas.height = Math.round(h * dpr);
        fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      const getAnchorPoints = () => {
        const refRect = fxCanvas ? fxCanvas.getBoundingClientRect() : host.getBoundingClientRect();
        if (pouchImg) {
          const imgRect = pouchImg.getBoundingClientRect();
          if (imgRect.width > 0 && imgRect.height > 0) {
            return {
              centerX: imgRect.left - refRect.left + imgRect.width * 0.555,
              centerY: imgRect.top - refRect.top + imgRect.height * 0.45,
              spoutX: imgRect.left - refRect.left + imgRect.width * 0.549,
              spoutY: imgRect.top - refRect.top + imgRect.height * 0.122
            };
          }
        }
        return {
          centerX: refRect.width * 0.5,
          centerY: refRect.height * 0.42,
          spoutX: refRect.width * 0.5,
          spoutY: refRect.height * 0.14
        };
      };

      const spawnLeafBurst = (entryDir) => {
        if (!fxCtx) return;
        syncCanvas();
        const { centerX, centerY } = getAnchorPoints();
        const count = 40;
        for (let i = 0; i < count; i++) {
          if (leaves.length > 96) leaves.shift();
          const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.42;
          const speed = 155 + Math.random() * 265;
          const offsetR = 12 + Math.random() * 38;
          const palette = LEAF_PALETTE[i % LEAF_PALETTE.length];
          leaves.push({
            x: centerX + Math.cos(angle) * offsetR,
            y: centerY + Math.sin(angle) * offsetR * 1.12,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - entryDir * 50 - 28,
            size: 8.5 + Math.random() * 12,
            rot: angle + (Math.random() - 0.5) * 1.3,
            vRot: (Math.random() - 0.5) * 6.8,
            flip: Math.random() * Math.PI * 2,
            vFlip: 4.0 + Math.random() * 5.2,
            swayPhase: Math.random() * Math.PI * 2,
            shape: i % 3,
            color: palette.fill,
            vein: palette.vein,
            age: 0,
            life: 1.55 + Math.random() * 0.65
          });
        }
      };

      // Emisión escalonada y continua de agua para que la salida se vea orgánica y líquida
      const queueWaterStream = (dir) => {
        if (!fxCtx) return;
        syncCanvas();
        const { spoutX, spoutY } = getAnchorPoints();
        ripples.push({ x: spoutX, y: spoutY, age: 0, life: 0.36, maxR: 24 });

        // Dos filamentos finos que salen de la boquilla antes de romperse en gotas
        for (let i = 0; i < 2; i++) {
          const side = i === 0 ? -1 : 1;
          filaments.push({
            x: spoutX + side * 2,
            y: spoutY + 1,
            dx: side * (12 + Math.random() * 14) + dir * 4,
            dy: -(24 + Math.random() * 16),
            curveX: side * (6 + Math.random() * 6),
            width: 2.6 + Math.random() * 1.2,
            age: 0,
            life: 0.19 + Math.random() * 0.05
          });
        }

        emitters.push({
          age: 0,
          duration: 0.145,
          wave: 0,
          dir
        });
      };

      const emitWaterWave = (wave, dir) => {
        const { spoutX, spoutY } = getAnchorPoints();
        if (wave === 0) {
          // Fase 1: micro-chorro inicial con gotas brillantes rápidas y rocío fino
          for (let i = 0; i < 7; i++) {
            if (drops.length > 84) drops.shift();
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.05 + dir * 0.12;
            const speed = 175 + Math.random() * 145;
            drops.push({
              x: spoutX + (Math.random() - 0.5) * 5,
              y: spoutY + (Math.random() - 0.5) * 2,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              g: 620 + Math.random() * 90,
              r: 1.7 + Math.random() * 2.4,
              phase: Math.random() * Math.PI * 2,
              age: 0,
              life: 0.62 + Math.random() * 0.28,
              drip: false
            });
          }
        } else if (wave === 1) {
          // Fase 2: gotas principales con arco suave y volumen de agua real
          for (let i = 0; i < 8; i++) {
            if (drops.length > 84) drops.shift();
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.48;
            const speed = 115 + Math.random() * 145;
            drops.push({
              x: spoutX + (Math.random() - 0.5) * 7,
              y: spoutY + (Math.random() - 0.5) * 3,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              g: 640 + Math.random() * 110,
              r: 2.5 + Math.random() * 2.8,
              phase: Math.random() * Math.PI * 2,
              age: 0,
              life: 0.72 + Math.random() * 0.34,
              drip: false
            });
          }
        } else {
          // Fase 3: goteo suave que escurre por los costados de la boquilla
          for (let i = 0; i < 5; i++) {
            if (drops.length > 84) drops.shift();
            const side = i % 2 === 0 ? dir : -dir;
            drops.push({
              x: spoutX + side * (5 + Math.random() * 7),
              y: spoutY + 4 + Math.random() * 6,
              vx: side * (12 + Math.random() * 24),
              vy: -36 + Math.random() * 44,
              g: 300 + Math.random() * 90,
              r: 2.4 + Math.random() * 2.3,
              phase: Math.random() * Math.PI * 2,
              age: 0,
              life: 0.82 + Math.random() * 0.36,
              drip: true
            });
          }
        }
      };

      const stepParticles = (dt) => {
        if (!fxCtx) return;
        fxCtx.clearRect(0, 0, canvasW, canvasH);

        // Emisores de agua escalonados (salida fluida en 3 oleadas)
        for (let i = emitters.length - 1; i >= 0; i--) {
          const em = emitters[i];
          if (em.wave === 0) {
            emitWaterWave(0, em.dir);
            em.wave = 1;
          }
          em.age += dt;
          if (em.wave === 1 && em.age >= 0.045) {
            emitWaterWave(1, em.dir);
            em.wave = 2;
          }
          if (em.wave === 2 && em.age >= 0.095) {
            emitWaterWave(2, em.dir);
            em.wave = 3;
          }
          if (em.age >= em.duration && em.wave >= 3) {
            emitters.splice(i, 1);
          }
        }

        // Ondas en la boquilla
        for (let i = ripples.length - 1; i >= 0; i--) {
          const rp = ripples[i];
          rp.age += dt;
          if (rp.age >= rp.life) {
            ripples.splice(i, 1);
            continue;
          }
          const p = rp.age / rp.life;
          const eased = 1 - Math.pow(1 - p, 3);
          fxCtx.save();
          fxCtx.beginPath();
          fxCtx.arc(rp.x, rp.y, 3 + rp.maxR * eased, 0, Math.PI * 2);
          fxCtx.strokeStyle = `rgba(154, 226, 238, ${((1 - p) * 0.62).toFixed(3)})`;
          fxCtx.lineWidth = 2.0 * (1 - p * 0.65);
          fxCtx.stroke();
          fxCtx.restore();
        }

        // Filamentos líquidos saliendo de la boquilla
        for (let i = filaments.length - 1; i >= 0; i--) {
          const f = filaments[i];
          f.age += dt;
          if (f.age >= f.life) {
            filaments.splice(i, 1);
            continue;
          }
          drawLiquidFilament(fxCtx, f, 0.9);
        }

        // Hojas botánicas Rivelant (+0.5s más duraderas y más frondosas)
        const leafDrag = Math.exp(-2.12 * dt);
        for (let i = leaves.length - 1; i >= 0; i--) {
          const l = leaves[i];
          l.age += dt;
          if (l.age >= l.life) {
            leaves.splice(i, 1);
            continue;
          }
          l.vx *= leafDrag;
          l.vy = l.vy * leafDrag + 32 * dt;
          l.x += (l.vx + Math.sin(l.age * 4.6 + l.swayPhase) * 28) * dt;
          l.y += l.vy * dt;
          l.rot += l.vRot * dt;
          l.flip += l.vFlip * dt;

          const p = l.age / l.life;
          const fadeIn = Math.min(1, l.age / 0.09);
          const fadeOut = p > 0.62 ? 1 - (p - 0.62) / 0.38 : 1;
          drawLeaf(fxCtx, l, Math.max(0, Math.min(1, fadeIn * fadeOut * 0.94)));
        }

        // Gotas de agua realistas
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i];
          d.age += dt;
          if (d.age >= d.life) {
            drops.splice(i, 1);
            continue;
          }
          const drag = d.drip ? Math.exp(-1.15 * dt) : Math.exp(-0.58 * dt);
          d.vx *= drag;
          d.vy += d.g * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;

          const p = d.age / d.life;
          const fadeIn = Math.min(1, d.age / 0.035);
          const fadeOut = p > 0.66 ? 1 - (p - 0.66) / 0.34 : 1;
          drawWaterDroplet(fxCtx, d, Math.max(0, Math.min(1, fadeIn * fadeOut * 0.96)));
        }
      };

      const renderFrame = (now) => {
        const dt = lastTime ? Math.min(0.032, (now - lastTime) / 1000) : 0.016;
        lastTime = now;

        const kHover = hovered ? 165 : 115;
        const dHover = hovered ? 15.5 : 16.5;
        const kTilt = hovered ? 185 : 105;
        const dTilt = hovered ? 17.5 : 15;
        const kSq = pressing ? 360 : 310;
        const dSq = pressing ? 20 : 13;

        [state.hover, state.hoverV] = stepSpring(state.hover, state.hoverV, target.hover, kHover, dHover, dt);
        [state.rx, state.rxV] = stepSpring(state.rx, state.rxV, target.rx, kTilt, dTilt, dt);
        [state.ry, state.ryV] = stepSpring(state.ry, state.ryV, target.ry, kTilt, dTilt, dt);
        [state.tx, state.txV] = stepSpring(state.tx, state.txV, target.tx, kTilt, dTilt, dt);
        [state.ty, state.tyV] = stepSpring(state.ty, state.tyV, target.ty, kTilt, dTilt, dt);
        [state.pop, state.popV] = stepSpring(state.pop, state.popV, target.pop, 145, 13.5, dt);
        [state.vis, state.visV] = stepSpring(state.vis, state.visV, target.vis, 130, 18, dt);
        [state.entryY, state.entryYV] = stepSpring(state.entryY, state.entryYV, target.entryY, 140, 16, dt);
        [state.sq, state.sqV] = stepSpring(state.sq, state.sqV, target.sq, kSq, dSq, dt);

        const lightLerp = 1 - Math.exp(-9 * dt);
        state.gx += (target.gx - state.gx) * lightLerp;
        state.gy += (target.gy - state.gy) * lightLerp;

        const hClamped = Math.max(0, Math.min(1, state.hover));
        const vClamped = Math.max(0, Math.min(1, state.vis));
        const popScale = 0.74 + 0.26 * state.pop;
        const t = now * 0.001;
        const floatY = Math.sin(t * 2.2) * 3.5 * hClamped;
        const floatZ = Math.sin(t * 1.45) * 1.15 * hClamped;

        const baseScale = (1 + 0.075 * state.hover) * popScale;
        const scaleX = baseScale * (1 - 0.1 * state.sq);
        const scaleY = baseScale * (1 + 0.062 * state.sq);
        const liftY = -14 * state.hover + state.ty + state.entryY + floatY + 5 * state.sq;
        const rotX = state.rx - 5.5 * state.sq;
        const rotZ = state.ry * 0.14 + floatZ + squeezeDir * 3.2 * state.sq;

        pouch.style.transform =
          `translate3d(${state.tx.toFixed(2)}px, ${liftY.toFixed(2)}px, 0) ` +
          `rotateX(${rotX.toFixed(2)}deg) rotateY(${state.ry.toFixed(2)}deg) ` +
          `rotateZ(${rotZ.toFixed(2)}deg) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`;

        if (fadeOnLeave) {
          pouch.style.opacity = vClamped.toFixed(3);
        }

        if (shadow) {
          const sx = (1 + 0.16 * state.hover) * (1 - 0.06 * state.sq) * popScale;
          const sy = (1 - 0.18 * hClamped) * (1 + 0.12 * state.sq);
          shadow.style.transform =
            `translate3d(${(-state.tx * 0.75).toFixed(2)}px, ${(state.hover * 10 - state.sq * 3).toFixed(2)}px, 0) ` +
            `scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
          shadow.style.opacity = (0.34 - 0.1 * hClamped + 0.08 * Math.max(0, state.sq)).toFixed(3);
        }

        const burstBloom = Math.max(0, 1 - state.pop) * 0.6 + Math.max(0, state.sq) * 0.35;
        const visualEnergy = Math.max(hClamped, Math.min(1, burstBloom));

        if (aura) {
          const ax = (state.gx - 50) * 1.35;
          const ay = -14 + (state.gy - 50) * 1.15;
          aura.style.transform =
            `translate3d(${ax.toFixed(2)}px, ${ay.toFixed(2)}px, 0) scale(${(0.86 + 0.28 * Math.max(state.hover, burstBloom)).toFixed(3)})`;
          aura.style.opacity = ((0.42 + 0.52 * visualEnergy) * (fadeOnLeave ? vClamped : 1)).toFixed(3);
        }

        if (ring) {
          const ringX = (state.gx - 50) * -0.35;
          const ringY = -16 + (state.gy - 50) * -0.35;
          ring.style.transform =
            `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0) ` +
            `scale(${(0.82 + 0.22 * Math.max(state.hover, burstBloom)).toFixed(3)}) rotate(${(state.ry * 1.6).toFixed(2)}deg)`;
          ring.style.opacity = visualEnergy.toFixed(3);
        }

        if (sheen) {
          sheen.style.opacity = hClamped.toFixed(3);
          sheen.style.background =
            `radial-gradient(circle 260px at ${state.gx.toFixed(1)}% ${state.gy.toFixed(1)}%, ` +
            `rgba(255, 255, 255, 0.45) 0%, rgba(195, 209, 94, 0.14) 38%, transparent 72%)`;
        }

        if (tags) {
          tags.style.transform = `translate3d(${(state.tx * 0.22).toFixed(2)}px, ${(state.hover * 3).toFixed(2)}px, 0)`;
        }

        stepParticles(dt);

        const hasParticles =
          leaves.length > 0 || drops.length > 0 || ripples.length > 0 || filaments.length > 0 || emitters.length > 0;
        const settled =
          !hovered &&
          !pressing &&
          !hasParticles &&
          Math.abs(state.hover) < 0.002 &&
          Math.abs(state.hoverV) < 0.002 &&
          Math.abs(state.rx) < 0.02 &&
          Math.abs(state.ry) < 0.02 &&
          Math.abs(state.tx) < 0.05 &&
          Math.abs(state.ty) < 0.05 &&
          Math.abs(target.pop - state.pop) < 0.002 &&
          Math.abs(state.popV) < 0.002 &&
          Math.abs(target.vis - state.vis) < 0.002 &&
          Math.abs(state.visV) < 0.002 &&
          Math.abs(target.entryY - state.entryY) < 0.05 &&
          Math.abs(state.sq) < 0.002 &&
          Math.abs(state.sqV) < 0.002;

        if (settled) {
          rafId = 0;
          lastTime = 0;
          if (!fadeOnLeave || target.vis > 0.5) {
            pouch.style.transform = '';
            if (fadeOnLeave) pouch.style.opacity = '1';
          } else {
            pouch.style.opacity = '0';
          }
          if (shadow) { shadow.style.transform = ''; shadow.style.opacity = ''; }
          if (aura && (!fadeOnLeave || target.vis > 0.5)) { aura.style.transform = ''; aura.style.opacity = ''; }
          if (ring) { ring.style.transform = ''; ring.style.opacity = ''; }
          if (sheen) { sheen.style.opacity = ''; sheen.style.background = ''; }
          if (tags) tags.style.transform = '';
          return;
        }

        rafId = requestAnimationFrame(renderFrame);
      };

      const startLoop = () => {
        if (!rafId) {
          lastTime = 0;
          rafId = requestAnimationFrame(renderFrame);
        }
      };

      const updatePointer = (e) => {
        if (e.pointerType === 'touch') return;
        const rect = host.getBoundingClientRect();
        const nx = Math.max(-0.5, Math.min(0.5, (e.clientX - rect.left) / rect.width - 0.5));
        const ny = Math.max(-0.5, Math.min(0.5, (e.clientY - rect.top) / rect.height - 0.5));
        target.ry = nx * 24;
        target.rx = -ny * 20;
        target.tx = nx * 20;
        target.ty = ny * 14;
        target.gx = (nx + 0.5) * 100;
        target.gy = (ny + 0.5) * 100;
      };

      const enterHost = (e) => {
        if (e.pointerType === 'touch') return;
        if (fadeOnLeave && target.vis < 0.5) return;
        if (!hovered) {
          hovered = true;
          target.hover = 1;
          host.classList.add('is-hovered');
        }
        updatePointer(e);
        startLoop();
      };

      host.addEventListener('pointerenter', enterHost);
      host.addEventListener('pointermove', enterHost);

      host.addEventListener('pointerleave', () => {
        hovered = false;
        target.hover = 0;
        target.rx = 0;
        target.ry = 0;
        target.tx = 0;
        target.ty = 0;
        target.gx = 50;
        target.gy = 45;
        host.classList.remove('is-hovered');
        if (pressing) {
          pressing = false;
          target.sq = 0;
          host.classList.remove('is-squeezing');
        }
        startLoop();
      });

      const triggerSqueezeStart = (clientX) => {
        if (fadeOnLeave && target.vis < 0.5) return;
        clearTimeout(releaseTimer);
        const rect = host.getBoundingClientRect();
        squeezeDir = clientX !== undefined && clientX < rect.left + rect.width * 0.5 ? -1 : 1;
        pressing = true;
        target.sq = 1;
        state.sqV = Math.max(state.sqV, 3.2);
        host.classList.add('is-squeezing');
        queueWaterStream(squeezeDir);
        startLoop();
      };

      const triggerSqueezeEnd = () => {
        if (!pressing) return;
        clearTimeout(releaseTimer);
        releaseTimer = window.setTimeout(() => {
          pressing = false;
          target.sq = 0;
          host.classList.remove('is-squeezing');
          startLoop();
        }, 95);
      };

      const pressEl = trigger || pouch;
      pressEl.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        triggerSqueezeStart(e.clientX);
      });
      pressEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerSqueezeStart();
          triggerSqueezeEnd();
        }
      });
      window.addEventListener('pointerup', triggerSqueezeEnd);
      window.addEventListener('pointercancel', triggerSqueezeEnd);

      let inView = false;
      let lastBurstAt = -1000;
      const triggerAppear = (entryDir) => {
        const now = performance.now();
        target.vis = 1;
        target.pop = 1;
        target.entryY = 0;
        if (now - lastBurstAt >= 550) {
          lastBurstAt = now;
          state.pop = 0;
          state.popV = 2.6;
          state.entryY = entryDir * 40;
          state.entryYV = 0;
          spawnLeafBurst(entryDir);
        }
        startLoop();
      };

      const triggerDisappear = () => {
        if (!fadeOnLeave) return;
        hovered = false;
        target.hover = 0;
        target.rx = 0;
        target.ry = 0;
        target.tx = 0;
        target.ty = 0;
        target.vis = 0;
        target.pop = 0.25;
        target.entryY = -30;
        host.classList.remove('is-hovered', 'is-squeezing');
        startLoop();
      };

      if (fadeOnLeave) {
        pouch.style.opacity = '0';
      }

      if ('IntersectionObserver' in window) {
        const leaveThreshold = fadeOnLeave ? 0.18 : 0.04;
        const enterThreshold = fadeOnLeave ? 0.34 : 0.28;
        const burstIO = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.intersectionRatio < leaveThreshold) {
                if (inView || fadeOnLeave) {
                  inView = false;
                  triggerDisappear();
                }
              } else if (entry.intersectionRatio >= enterThreshold && !inView) {
                inView = true;
                triggerAppear(fadeOnLeave ? 1 : globalScrollDir);
              }
            });
          },
          { threshold: [0.02, 0.18, 0.28, 0.34] }
        );
        burstIO.observe(host);
      } else if (fadeOnLeave) {
        triggerAppear(1);
      }

      window.addEventListener('resize', syncCanvas, { passive: true });
      syncCanvas();
    };

    // Instancia 1: Pouch del Inicio (#hero-stage) — aparece/desaparece con explosión de hojas + hover + apretón con agua
    const heroStage = document.getElementById('hero-stage');
    if (heroStage) {
      initInteractivePouch({
        host: heroStage,
        trigger: document.getElementById('pouch-card3d'),
        pouch: document.getElementById('pouch-card3d'),
        pouchImg: heroStage.querySelector('.pouch-card3d__img'),
        fxCanvas: heroStage.querySelector('.hero__fx'),
        fadeOnLeave: true
      });
    }

    // Instancia 2: Pouch del apartado Producto (#product-showcase) — explosión de hojas arriba/abajo + hover + apretón con agua
    const productShowcase = document.getElementById('product-showcase');
    if (productShowcase) {
      initInteractivePouch({
        host: productShowcase,
        trigger: productShowcase.querySelector('.product-showcase__stage'),
        pouch: productShowcase.querySelector('.product-showcase__pouch'),
        pouchImg: productShowcase.querySelector('.product-showcase__img'),
        shadow: productShowcase.querySelector('.product-showcase__shadow'),
        aura: productShowcase.querySelector('.product-showcase__aura'),
        ring: productShowcase.querySelector('.product-showcase__ring'),
        sheen: productShowcase.querySelector('.product-showcase__sheen'),
        tags: productShowcase.querySelector('.product-showcase__tags'),
        fxCanvas: productShowcase.querySelector('.product-showcase__fx'),
        fadeOnLeave: false
      });
    }
  }

  // 4c. Organigrama (#org-chart): animación bidireccional al subir/bajar scroll + hover 3D suave
  const orgChart = document.getElementById('org-chart');
  if (orgChart && !prefersReducedMotion) {
    const orgLeader = orgChart.querySelector('.org-leader');
    const orgConnector = orgChart.querySelector('.org-connector');
    const orgCards = Array.from(orgChart.querySelectorAll('.org-card'));
    const allOrgCards = [orgLeader, ...orgCards].filter(Boolean);

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const items = allOrgCards.map((el) => {
      const isLeader = el === orgLeader;
      const idx = isLeader ? 2 : parseInt(el.dataset.orgIndex || '0', 10);
      const centerDist = isLeader ? 0 : Math.abs(idx - 2);
      return {
        el,
        isLeader,
        centerDist,
        scrollY: 0,
        scrollOpacity: 1,
        scrollScale: 1,
        hovered: false,
        hover: 0,
        hoverV: 0,
        rx: 0,
        rxV: 0,
        ry: 0,
        ryV: 0,
        targetRx: 0,
        targetRy: 0,
        mx: 50,
        my: 35,
        targetMx: 50,
        targetMy: 35
      };
    });

    let connY = 0;
    let connScale = 1;
    let connOpacity = 1;
    let orgRaf = 0;
    let orgLastTime = 0;

    const stepOrgSpring = (val, vel, goal, k, d, dt) => {
      const nextVel = vel + ((goal - val) * k - vel * d) * dt;
      return [val + nextVel * dt, nextVel];
    };

    const getScrollNorm = () => {
      const rect = orgChart.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const center = rect.top + rect.height * 0.5;
      return clamp((center - vh * 0.5) / (vh * 0.65), -1.35, 1.35);
    };

    const tickOrg = (now) => {
      const dt = orgLastTime ? Math.min(0.032, (now - orgLastTime) / 1000) : 0.016;
      orgLastTime = now;

      const norm = getScrollNorm();
      let stillMoving = false;

      if (orgConnector) {
        const goalConnY = norm * 42;
        const goalConnScale = clamp(1 - Math.max(0, Math.abs(norm) - 0.35) * 0.5, 0.55, 1);
        const goalConnOp = clamp(1 - Math.max(0, Math.abs(norm) - 0.5) / 0.7, 0.2, 1);
        const lerpC = 1 - Math.exp(-8.5 * dt);
        connY += (goalConnY - connY) * lerpC;
        connScale += (goalConnScale - connScale) * lerpC;
        connOpacity += (goalConnOp - connOpacity) * lerpC;

        orgConnector.style.setProperty('--org-conn-y', `${connY.toFixed(2)}px`);
        orgConnector.style.setProperty('--org-conn-scale', connScale.toFixed(3));
        orgConnector.style.opacity = connOpacity.toFixed(3);

        if (Math.abs(goalConnY - connY) > 0.08 || Math.abs(goalConnScale - connScale) > 0.003) {
          stillMoving = true;
        }
      }

      for (const item of items) {
        // Desfase escalonado bidireccional (al subir y al bajar scroll)
        const amp = item.isLeader ? 32 : 46 + item.centerDist * 16;
        const followRate = item.isLeader ? 9.5 : 8.6 - item.centerDist * 1.15;
        const goalScrollY = norm * amp;
        const edgeFade = Math.max(0, Math.abs(norm) - (item.isLeader ? 0.58 : 0.52 - item.centerDist * 0.04));
        const goalOpacity = clamp(1 - edgeFade / 0.72, 0.2, 1);
        const goalScrollScale = clamp(1 - edgeFade * 0.09, 0.92, 1);

        const lerpS = 1 - Math.exp(-followRate * dt);
        item.scrollY += (goalScrollY - item.scrollY) * lerpS;
        item.scrollOpacity += (goalOpacity - item.scrollOpacity) * lerpS;
        item.scrollScale += (goalScrollScale - item.scrollScale) * lerpS;

        // Resorte fluido de entrada, movimiento y salida al pasar el mouse
        const kH = item.hovered ? 185 : 120;
        const dH = item.hovered ? 17 : 16;
        const goalHover = item.hovered ? 1 : 0;

        [item.hover, item.hoverV] = stepOrgSpring(item.hover, item.hoverV, goalHover, kH, dH, dt);
        [item.rx, item.rxV] = stepOrgSpring(item.rx, item.rxV, item.targetRx, kH, dH, dt);
        [item.ry, item.ryV] = stepOrgSpring(item.ry, item.ryV, item.targetRy, kH, dH, dt);

        const lerpM = 1 - Math.exp(-11 * dt);
        item.mx += (item.targetMx - item.mx) * lerpM;
        item.my += (item.targetMy - item.my) * lerpM;

        const hoverLift = (item.isLeader ? -5 : -9) * item.hover;
        const hoverScaleBoost = (item.isLeader ? 0.012 : 0.028) * item.hover;
        const totalScale = item.scrollScale + hoverScaleBoost;

        const s = item.el.style;
        s.setProperty('--org-scroll-y', `${item.scrollY.toFixed(2)}px`);
        s.setProperty('--org-hover-y', `${hoverLift.toFixed(2)}px`);
        s.setProperty('--org-rx', `${item.rx.toFixed(2)}deg`);
        s.setProperty('--org-ry', `${item.ry.toFixed(2)}deg`);
        s.setProperty('--org-scale', totalScale.toFixed(4));
        s.setProperty('--mx', `${item.mx.toFixed(1)}%`);
        s.setProperty('--my', `${item.my.toFixed(1)}%`);
        s.opacity = item.scrollOpacity.toFixed(3);

        if (
          item.hovered ||
          Math.abs(goalScrollY - item.scrollY) > 0.08 ||
          Math.abs(item.hover) > 0.002 ||
          Math.abs(item.hoverV) > 0.002 ||
          Math.abs(item.rx) > 0.02 ||
          Math.abs(item.ry) > 0.02
        ) {
          stillMoving = true;
        }
      }

      if (stillMoving) {
        orgRaf = requestAnimationFrame(tickOrg);
      } else {
        orgRaf = 0;
        orgLastTime = 0;
      }
    };

    const wakeOrg = () => {
      if (!orgRaf) {
        orgLastTime = 0;
        orgRaf = requestAnimationFrame(tickOrg);
      }
    };

    items.forEach((item) => {
      const maxRx = item.isLeader ? 2.4 : 6.5;
      const maxRy = item.isLeader ? 2.8 : 7.5;

      const onPointer = (e) => {
        if (e.pointerType === 'touch') return;
        const rect = item.el.getBoundingClientRect();
        const nx = clamp((e.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
        const ny = clamp((e.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);
        if (!item.hovered) {
          item.hovered = true;
          item.el.classList.add('is-hovered');
        }
        item.targetRy = nx * maxRy * 2;
        item.targetRx = -ny * maxRx * 2;
        item.targetMx = (nx + 0.5) * 100;
        item.targetMy = (ny + 0.5) * 100;
        wakeOrg();
      };

      item.el.addEventListener('pointerenter', onPointer);
      item.el.addEventListener('pointermove', onPointer);
      item.el.addEventListener('pointerleave', () => {
        item.hovered = false;
        item.targetRx = 0;
        item.targetRy = 0;
        item.targetMx = 50;
        item.targetMy = 35;
        item.el.classList.remove('is-hovered');
        wakeOrg();
      });
    });

    window.addEventListener('scroll', wakeOrg, { passive: true });
    window.addEventListener('resize', wakeOrg, { passive: true });
    wakeOrg();
  }

  // 5. Explorador Interactivo "¿De qué está hecho nuestro producto?"
  const ingredientData = {
    moringa: {
      title: 'Moringa oleifera en polvo (2.0 g por pouch)',
      sci: 'Superalimento botánico antioxidante y revitalizante celular',
      desc: 'Conocida como el "Árbol de la Vida", nuestra moringa seleccionada aporta vitaminas A, C y E, calcio, potasio, hierro y aminoácidos esenciales que combaten la fatiga física y oxidativa sin alterar el sistema nervioso.',
      CostNote: 'Dosificación estandarizada: 2 g de hoja pura micropulverizada por envase de 500 ml.',
      bars: [
        { label: 'Potencia Antioxidante y Vitaminas (A, C, E)', pct: '96%' },
        { label: 'Recuperación y Vitalidad Continua', pct: '92%' },
        { label: 'Pureza Botánica Natural', pct: '100%' }
      ]
    },
    espirulina: {
      title: 'Espirulina azul-verde (0.125 g por pouch)',
      sci: 'Arthrospira platensis — Microalga bioactiva de alto rendimiento mental',
      desc: 'Fuente concentrada de ficocianina, vitaminas del complejo B, hierro biodisponible y proteína vegetal. Favorece la oxigenación cerebral, la concentración prolongada en estudio o trabajo y la resistencia muscular.',
      CostNote: 'Dosificación científica: 0.125 g de extracto puro de alta absorción por pouch.',
      bars: [
        { label: 'Concentración y Enfoque Cognitivo', pct: '95%' },
        { label: 'Hierro Biodisponible y Complejo B', pct: '90%' },
        { label: 'Desintoxicación y Oxigenación', pct: '94%' }
      ]
    },
    electrolitos: {
      title: 'Base deSuero Hidratante & Balance Mineral',
      sci: 'Agua purificada, sales minerales de rehidratación y toque glucídico funcional',
      desc: 'Fórmula isotónica suave libre de cafeína sintética, taurina y exceso de azúcares refinados. Permite una absorción osmótica inmediata que hidrata profundamente sin provocar taquicardia, insomnio ni efecto rebote.',
      CostNote: '0% Cafeína sintética · Bajo en azúcar · Hidratación limpia.',
      bars: [
        { label: 'Velocidad de Hidratación Celular', pct: '98%' },
        { label: 'Seguridad (Libre de Cafeína y Rebote)', pct: '100%' },
        { label: 'Frescura y Ligereza Digestiva', pct: '93%' }
      ]
    },
    pouch: {
      title: 'Envase Stand-Up Pouch de 500 ml + Metal Cap',
      sci: 'Empaque ergonómico multicapa con boquilla resellable de seguridad',
      desc: 'Diseñado para el ritmo de estudiantes, deportistas y trabajadores en Texcoco y alrededores. Ligero, irrompible, fácil de llevar en la mochila y con barrera protectora que preserva intactos los nutrientes fotosensibles.',
      CostNote: 'Presentación de 500 ml a precio accesible ($40 – $45 MXN).',
      bars: [
        { label: 'Practicidad y Portabilidad Diaria', pct: '97%' },
        { label: 'Conservación de Fitonutrientes', pct: '95%' },
        { label: 'Menor Huella de Volumen vs. Rígidos', pct: '89%' }
      ]
    }
  };

  const ingTabs = document.querySelectorAll('.ingredient-tab');
  const ingTitle = document.getElementById('ing-title');
  const ingSci = document.getElementById('ing-sci');
  const ingDesc = document.getElementById('ing-desc');
  const ingNote = document.getElementById('ing-note');
  const ingBars = document.getElementById('ing-bars');

  ingTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.ingredient;
      const info = ingredientData[key];
      if (!info) return;
      ingTabs.forEach((t) => {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      if (ingTitle) ingTitle.textContent = info.title;
      if (ingSci) ingSci.textContent = info.sci;
      if (ingDesc) ingDesc.textContent = info.desc;
      if (ingNote) ingNote.textContent = info.CostNote;
      if (ingBars) {
        ingBars.innerHTML = info.bars
          .map(
            (b) => `
          <div class="nutrient-bar">
            <div class="nutrient-bar__head">
              <span>${b.label}</span>
              <span>${b.pct}</span>
            </div>
            <div class="nutrient-bar__track">
              <div class="nutrient-bar__fill" style="--bar-w: ${b.pct}"></div>
            </div>
          </div>`
          )
          .join('');
      }
    });
  });

  // 6. Formulario de Opiniones y Sugerencias (Validación + Envío a correo)
  const form = document.getElementById('rivelant-feedback-form');
  const feedbackStatus = document.getElementById('feedback-status');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;

      const clearError = (id) => {
        const input = document.getElementById(id);
        const err = document.getElementById(`${id}-error`);
        if (input) input.classList.remove('is-invalid');
        if (err) err.textContent = '';
      };

      const setError = (id, msg) => {
        valid = false;
        const input = document.getElementById(id);
        const err = document.getElementById(`${id}-error`);
        if (input) input.classList.add('is-invalid');
        if (err) err.textContent = msg;
      };

      ['fb-nombre', 'fb-correo', 'fb-mensaje', 'fb-terminos'].forEach(clearError);

      const nombre = (document.getElementById('fb-nombre')?.value || '').trim();
      const correo = (document.getElementById('fb-correo')?.value || '').trim();
      const telefono = (document.getElementById('fb-telefono')?.value || '').trim();
      const tipo = document.getElementById('fb-tipo')?.value || 'Opinión del producto';
      const mensaje = (document.getElementById('fb-mensaje')?.value || '').trim();
      const terminos = document.getElementById('fb-terminos')?.checked;
      const ratingEl = form.querySelector('input[name="calificacion"]:checked');
      const calificacion = ratingEl ? ratingEl.value : '5';

      if (nombre.length < 2) setError('fb-nombre', 'Por favor ingresa tu nombre completo.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        setError('fb-correo', 'Ingresa un correo electrónico válido.');
      }
      if (mensaje.length < 8) {
        setError('fb-mensaje', 'Escribe tu opinión o sugerencia (mínimo 8 caracteres).');
      }
      if (!terminos) {
        setError('fb-terminos', 'Debes aceptar los Términos y Condiciones y el Aviso de Privacidad.');
      }

      if (!valid) return;

      const submitBtn = document.getElementById('fb-submit-btn');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando opinión al correo...';
      }

      const subject = encodeURIComponent(`[Rivelant Web - ${tipo}] Opinión de ${nombre} (${calificacion}★)`);
      const bodyText = encodeURIComponent(
        `Nueva opinión / sugerencia desde la web oficial de Rivelant, S.A. de C.V.\n\n` +
          `• Nombre: ${nombre}\n` +
          `• Correo: ${correo}\n` +
          `• Teléfono: ${telefono || 'No especificado'}\n` +
          `• Categoría: ${tipo}\n` +
          `• Calificación: ${calificacion} / 5 estrellas\n\n` +
          `Mensaje / Sugerencia:\n${mensaje}\n`
      );
      const mailtoHref = `mailto:contacto@rivelant.com?cc=andreipinedagato321@gmail.com&subject=${subject}&body=${bodyText}`;

      try {
        const formData = new FormData(form);
        formData.append('ajax_feedback', '1');
        const response = await fetch(form.getAttribute('action') || window.location.href, {
          method: 'POST',
          body: formData
        });
        const data = await response.json();

        if (feedbackStatus) {
          feedbackStatus.hidden = false;
          feedbackStatus.className = 'form-alert form-alert--success';
          feedbackStatus.innerHTML = `
            <p><strong>¡Gracias por tu mensaje, ${nombre.replace(/[<>&"']/g, '')}!</strong> ${
            data.message || 'Tu opinión y sugerencia ha sido registrada y procesada para envío al correo de Rivelant.'
          }</p>
            <p style="margin-top:10px; font-size:0.88rem;">
              Destinatario oficial: <strong>contacto@rivelant.com</strong>.
              <a href="${mailtoHref}" class="btn btn--primary" style="margin-top:10px; padding:8px 18px; min-height:40px; font-size:0.85rem;">
                Confirmar envío directo en mi cliente de correo
              </a>
            </p>
          `;
        }
        form.reset();
      } catch (_err) {
        // Fallback directo por cliente de correo si el servidor local no responde JSON
        if (feedbackStatus) {
          feedbackStatus.hidden = false;
          feedbackStatus.className = 'form-alert form-alert--success';
          feedbackStatus.innerHTML = `
            <p><strong>¡Mensaje listo para enviar!</strong> Haz clic abajo para despachar tu sugerencia directamente a <strong>contacto@rivelant.com</strong>:</p>
            <p style="margin-top:10px;">
              <a href="${mailtoHref}" class="btn btn--primary">Abrir correo y enviar ahora</a>
            </p>
          `;
        }
        window.location.href = mailtoHref;
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  }

  // 7. Modales Legales (Términos y Condiciones / Política de Cookies)
  const openModalBtns = document.querySelectorAll('[data-open-modal]');
  const closeModalBtns = document.querySelectorAll('[data-close-modal]');

  const openModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
  };

  const closeModal = (modal) => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  };

  openModalBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(btn.dataset.openModal);
    });
  });

  closeModalBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const backdrop = btn.closest('.modal-backdrop');
      if (backdrop) closeModal(backdrop);
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal(backdrop);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.is-open').forEach(closeModal);
    }
  });

  // 8. Gestión de Política de Cookies
  const cookieBanner = document.getElementById('cookie-banner');
  const acceptAllCookiesBtn = document.getElementById('cookie-accept-all');
  const saveCookiesBtn = document.getElementById('cookie-save-prefs');
  const reopenCookiesBtn = document.getElementById('reopen-cookie-banner');

  const COOKIE_KEY = 'rivelant_cookie_consent_v1';

  const saveCookieConsent = (mode) => {
    const analytics = mode === 'all' ? true : Boolean(document.getElementById('chk-cookie-analytics')?.checked);
    const marketing = mode === 'all' ? true : Boolean(document.getElementById('chk-cookie-marketing')?.checked);
    const payload = {
      essential: true,
      analytics,
      marketing,
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(COOKIE_KEY, JSON.stringify(payload));
    } catch (_e) {
      // Ignorar si almacenamiento está restringido
    }
    document.cookie = `rivelant_cookies=${mode}; path=/; max-age=31536000; SameSite=Lax`;
    if (cookieBanner) cookieBanner.classList.remove('is-visible');
  };

  if (cookieBanner) {
    let saved = null;
    try {
      saved = localStorage.getItem(COOKIE_KEY);
    } catch (_e) {
      saved = null;
    }
    if (!saved) {
      setTimeout(() => cookieBanner.classList.add('is-visible'), 600);
    }
  }

  if (acceptAllCookiesBtn) {
    acceptAllCookiesBtn.addEventListener('click', () => saveCookieConsent('all'));
  }
  if (saveCookiesBtn) {
    saveCookiesBtn.addEventListener('click', () => saveCookieConsent('custom'));
  }
  if (reopenCookiesBtn && cookieBanner) {
    reopenCookiesBtn.addEventListener('click', () => {
      cookieBanner.classList.add('is-visible');
    });
  }
})();
