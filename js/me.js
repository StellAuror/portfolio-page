// About me: per-segment cursors (black hole, brush, bike), the lensed star field and the light-painting canvas
(function () {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // ---------- Star field with gravitational lensing ----------
    function initSpace(segment) {
        const canvas = segment.querySelector('.me-canvas');
        const ctx = canvas.getContext('2d');
        let w = 0, h = 0, dpr = 1, stars = [];
        let pointer = null;               // pointer position inside the segment, if any
        const hole = { x: 0, y: 0, ready: false };
        let visible = false, rafId = null;

        function resize() {
            const rect = canvas.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = rect.width;
            h = rect.height;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const count = Math.round(w * h / 950);
            stars = Array.from({ length: count }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() < 0.08 ? 1.3 + Math.random() * 0.8 : 0.4 + Math.random() * 0.7,
                a: 0.35 + Math.random() * 0.65,
                tw: 0.0008 + Math.random() * 0.002,
                ph: Math.random() * Math.PI * 2,
                hue: Math.random() < 0.15 ? (Math.random() < 0.5 ? '200,215,255' : '255,225,200') : '255,255,255',
            }));
            if (!visible || reduceMotion) draw(performance.now());
        }

        function drawStar(x, y, r, alpha, color, angle, stretch) {
            if (alpha < 0.02 || x < -10 || y < -10 || x > w + 10 || y > h + 10) return;
            ctx.fillStyle = `rgba(${color},${Math.min(alpha, 1)})`;
            ctx.beginPath();
            if (stretch > 1.15) ctx.ellipse(x, y, r * stretch, r, angle, 0, Math.PI * 2);
            else ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        function draw(t) {
            const thetaE = Math.max(42, Math.min(w, h) * 0.13);  // Einstein radius
            const shadow = thetaE * 0.42;                        // event-horizon shadow

            // Follow the pointer, otherwise drift slowly on the right-hand side
            const target = pointer || {
                x: w * (w < 700 ? 0.7 : 0.76) + Math.sin(t * 0.00021) * w * 0.1,
                y: h * 0.5 + Math.sin(t * 0.00033) * h * 0.24,
            };
            if (!hole.ready) { hole.x = target.x; hole.y = target.y; hole.ready = true; }
            const ease = pointer ? 0.22 : 0.05;
            hole.x += (target.x - hole.x) * ease;
            hole.y += (target.y - hole.y) * ease;

            ctx.clearRect(0, 0, w, h);

            for (const s of stars) {
                const alpha = reduceMotion ? s.a : s.a * (0.75 + 0.25 * Math.sin(t * s.tw + s.ph));
                const dx = s.x - hole.x, dy = s.y - hole.y;
                const beta = Math.hypot(dx, dy);

                if (beta > thetaE * 7) { drawStar(s.x, s.y, s.r, alpha, s.hue, 0, 1); continue; }
                if (beta < 0.5) continue;

                // Point-mass lens: two images on the line through the lens
                const root = Math.sqrt(beta * beta + 4 * thetaE * thetaE);
                const u = beta / thetaE;
                const mu = (u * u + 2) / (u * Math.sqrt(u * u + 4));
                const ux = dx / beta, uy = dy / beta;
                const tangent = Math.atan2(uy, ux) + Math.PI / 2;

                const outer = (beta + root) / 2;
                if (outer > shadow) {
                    const m = Math.min((mu + 1) / 2, 6);
                    drawStar(hole.x + ux * outer, hole.y + uy * outer, s.r * Math.min(Math.sqrt(m), 1.8),
                        alpha * Math.min(m, 2.2), s.hue, tangent, Math.min(outer / beta, 5));
                }

                const inner = (root - beta) / 2;   // on the opposite side of the lens
                if (inner > shadow) {
                    const m = Math.min((mu - 1) / 2, 6);
                    drawStar(hole.x - ux * inner, hole.y - uy * inner, s.r * Math.min(Math.sqrt(m), 1.8),
                        alpha * Math.min(m, 2.2), s.hue, tangent, Math.min(inner / beta, 5));
                }
            }

            drawHole(hole.x, hole.y, shadow, t);
        }

        function drawHole(x, y, rs, t) {
            const spin = reduceMotion ? 0 : t * 0.0004;
            const diskRx = rs * 2.9, diskRy = rs * 0.45;

            function diskHalf(front) {
                const g = ctx.createLinearGradient(x - diskRx, y, x + diskRx, y);
                const shift = (Math.sin(spin) + 1) / 2;
                g.addColorStop(0, 'rgba(255,140,60,0.15)');
                g.addColorStop(0.25 + shift * 0.2, 'rgba(255,214,160,0.9)');
                g.addColorStop(1, 'rgba(255,120,50,0.25)');
                ctx.strokeStyle = g;
                ctx.lineWidth = rs * 0.32;
                ctx.beginPath();
                ctx.ellipse(x, y, diskRx, diskRy, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
                ctx.stroke();
            }

            // Soft halo
            const halo = ctx.createRadialGradient(x, y, rs * 0.9, x, y, rs * 3.2);
            halo.addColorStop(0, 'rgba(255,190,120,0.18)');
            halo.addColorStop(0.5, 'rgba(139,92,246,0.06)');
            halo.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(x, y, rs * 3.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.save();
            ctx.shadowColor = 'rgba(255,170,90,0.6)';
            ctx.shadowBlur = 10;
            diskHalf(false);

            // Far side of the disk, bent by the hole over the top and under the bottom
            ctx.strokeStyle = 'rgba(255,205,150,0.75)';
            ctx.lineWidth = rs * 0.3;
            ctx.beginPath();
            ctx.ellipse(x, y, rs * 1.42, rs * 1.38, 0, Math.PI, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255,205,150,0.4)';
            ctx.lineWidth = rs * 0.1;
            ctx.beginPath();
            ctx.ellipse(x, y, rs * 1.2, rs * 1.16, 0, 0, Math.PI);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x, y, rs, 0, Math.PI * 2);
            ctx.fill();

            // Photon ring
            ctx.strokeStyle = 'rgba(255,236,210,0.85)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(x, y, rs * 1.04, 0, Math.PI * 2);
            ctx.stroke();

            ctx.save();
            ctx.shadowColor = 'rgba(255,170,90,0.6)';
            ctx.shadowBlur = 10;
            diskHalf(true);
            ctx.restore();
        }

        function loop(t) {
            draw(t);
            rafId = requestAnimationFrame(loop);
        }

        function start() {
            if (rafId || !visible) return;
            rafId = requestAnimationFrame(loop);
        }

        function stop() {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;
        }

        new IntersectionObserver(entries => {
            visible = entries[0].isIntersecting;
            if (visible) { resize(); start(); } else stop();
        }).observe(segment);

        new ResizeObserver(resize).observe(segment);

        function toLocal(e) {
            const rect = canvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
        segment.addEventListener('pointermove', e => { pointer = toLocal(e); });
        segment.addEventListener('pointerdown', e => { pointer = toLocal(e); });
        segment.addEventListener('pointerleave', () => { pointer = null; });
    }

    // ---------- Clair Obscur: painting light that scatters into petals ----------
    // The canvas is blended with "difference", so painted light inverts the text beneath it
    function initBrush(segment) {
        const canvas = segment.querySelector('.me-canvas');
        const ctx = canvas.getContext('2d');
        const HOLD = 1300, FADE = 900;
        let w = 0, h = 0, strokes = [], petals = [], last = null, rafId = null, prevT = 0;

        function resize() {
            const rect = canvas.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = rect.width;
            h = rect.height;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            strokes = [];
            petals = [];
        }

        function spawnPetal(s, t) {
            const k = Math.random();
            const spread = (Math.random() - 0.5) * s.w;
            const nx = -(s.y2 - s.y1), ny = s.x2 - s.x1, len = Math.hypot(nx, ny) || 1;
            petals.push({
                x: s.x1 + (s.x2 - s.x1) * k + nx / len * spread,
                y: s.y1 + (s.y2 - s.y1) * k + ny / len * spread,
                vx: (Math.random() - 0.3) * 0.04,
                vy: -0.02 - Math.random() * 0.05,
                rot: Math.random() * Math.PI,
                vr: (Math.random() - 0.5) * 0.006,
                size: 1.6 + Math.random() * 2,
                born: t,
                life: 1400 + Math.random() * 1200,
                crimson: Math.random() < 0.7,
            });
        }

        function draw(t) {
            const dt = Math.min(t - (prevT || t), 50);
            prevT = t;
            ctx.clearRect(0, 0, w, h);
            ctx.lineCap = 'round';

            strokes = strokes.filter(s => {
                const age = t - s.born;
                if (age >= HOLD && !s.scattered) {
                    s.scattered = true;
                    if (!reduceMotion) for (let i = 0; i < Math.ceil(s.w / 9); i++) spawnPetal(s, t);
                }
                const alpha = age < HOLD ? 1 : 1 - (age - HOLD) / FADE;
                if (alpha <= 0) return false;

                ctx.strokeStyle = `rgba(241,231,208,${0.95 * alpha})`;
                ctx.lineWidth = s.w;
                ctx.beginPath();
                ctx.moveTo(s.x1, s.y1);
                ctx.lineTo(s.x2, s.y2);
                ctx.stroke();

                // Bristle streaks give the stroke some texture
                const nx = -(s.y2 - s.y1), ny = s.x2 - s.x1, len = Math.hypot(nx, ny) || 1;
                ctx.strokeStyle = `rgba(150,120,95,${0.25 * alpha})`;
                ctx.lineWidth = Math.max(0.8, s.w * 0.08);
                for (const off of [-0.3, 0.12, 0.36]) {
                    const ox = nx / len * s.w * off, oy = ny / len * s.w * off;
                    ctx.beginPath();
                    ctx.moveTo(s.x1 + ox, s.y1 + oy);
                    ctx.lineTo(s.x2 + ox, s.y2 + oy);
                    ctx.stroke();
                }
                return true;
            });

            petals = petals.filter(p => {
                const age = t - p.born;
                if (age > p.life) return false;
                p.x += (p.vx + Math.sin((t + p.born) * 0.003) * 0.02) * dt;
                p.y += p.vy * dt;
                p.rot += p.vr * dt;
                const a = 1 - age / p.life;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.crimson ? `rgba(200,60,78,${a})` : `rgba(241,231,208,${a * 0.8})`;
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size, p.size * 2.2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                return true;
            });

            if (strokes.length || petals.length) rafId = requestAnimationFrame(draw);
            else { rafId = null; prevT = 0; }
        }

        function paint(e) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top, t = performance.now();
            if (last) {
                const dist = Math.hypot(x - last.x, y - last.y);
                if (dist < 1.5) return;
                const speed = dist / Math.max(t - last.t, 8);           // px per ms
                const width = Math.max(5, Math.min(26, 26 - speed * 9));
                const smooth = last.w == null ? width : last.w + (width - last.w) * 0.35;
                strokes.push({ x1: last.x, y1: last.y, x2: x, y2: y, w: smooth, born: t });
                last = { x, y, t, w: smooth };
            } else {
                last = { x, y, t, w: null };
            }
            if (!rafId) rafId = requestAnimationFrame(draw);
        }

        new ResizeObserver(resize).observe(segment);
        segment.addEventListener('pointermove', paint);
        segment.addEventListener('pointerleave', () => { last = null; });
    }

    // ---------- DOM cursors: brush and bike ----------
    const BIKE_SVG = `
        <svg viewBox="0 0 56 34" aria-hidden="true">
            <g fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <g class="wheel" data-wheel>
                    <circle cx="11" cy="23" r="9.5"/>
                    <path d="M11 13.5v19M1.5 23h19M4.3 16.3l13.4 13.4M17.7 16.3L4.3 29.7" stroke-width="0.8" stroke="#8b8f94"/>
                </g>
                <g class="wheel" data-wheel>
                    <circle cx="45" cy="23" r="9.5"/>
                    <path d="M45 13.5v19M35.5 23h19M38.3 16.3l13.4 13.4M51.7 16.3L38.3 29.7" stroke-width="0.8" stroke="#8b8f94"/>
                </g>
                <path d="M11 23l9-12h17l-9 12H11zM28 23L20 11M37 11l8 12M20 11l-1-4M17 7h5M37 11l-2-5h5" stroke="#8b5cf6"/>
                <circle cx="28" cy="23" r="1.8" fill="#8b5cf6" stroke="none"/>
            </g>
        </svg>`;

    // Drawn horizontally from the tip, then tilted so the tip sits at the bottom-left (2, 44)
    const BRUSH_SVG = `
        <svg viewBox="0 0 46 46" aria-hidden="true">
            <g transform="translate(2 44) rotate(-45)">
                <path d="M24 -3.2 L57 -1.7 Q61 0 57 1.7 L24 3.2Z" fill="#1b1414" stroke="#4a3a32" stroke-width="0.6"/>
                <rect x="50" y="-2" width="2.2" height="4" fill="#c9a24a"/>
                <rect x="16" y="-3.6" width="8.5" height="7.2" rx="1" fill="#c9a24a"/>
                <path d="M18.5 -3.6v7.2M21.5 -3.6v7.2" stroke="#8a6a2a" stroke-width="0.6"/>
                <path d="M0 0 C4 -3.5 10 -4 16 -3.2 L16 3.2 C10 4 4 3.5 0 0Z" fill="#efe6d2"/>
                <path d="M0 0 C2 -1.7 4.5 -2.2 7 -2 L7 2 C4.5 2.2 2 1.7 0 0Z" fill="#c83c4e"/>
            </g>
        </svg>`;

    function createCursor(kind, html) {
        const el = document.createElement('div');
        el.className = `me-cursor me-cursor-${kind}`;
        el.innerHTML = html;
        document.body.appendChild(el);
        return el;
    }

    function initCursors(section) {
        section.classList.add('me-cursors-on');

        const bike = createCursor('bike', BIKE_SVG);
        const brush = createCursor('brush', BRUSH_SVG);
        const wheels = bike.querySelectorAll('[data-wheel]');
        const cursors = { bike, brush };

        let wheelAngle = 0, lastX = null;

        function place(el, x, y) {
            // The brush paints from its tip; everything else is centred on the pointer
            if (el === brush) el.style.transform = `translate(${x - 2}px, ${y - 44}px)`;
            else el.style.transform = `translate(${x - el.offsetWidth / 2}px, ${y - el.offsetHeight / 2}px)`;
        }

        section.querySelectorAll('.me-segment[data-cursor]').forEach(segment => {
            const el = cursors[segment.dataset.cursor];
            if (!el) return;

            segment.addEventListener('pointerenter', e => {
                lastX = e.clientX;
                place(el, e.clientX, e.clientY);
                el.classList.add('visible');
            });

            segment.addEventListener('pointerleave', () => {
                el.classList.remove('visible');
                lastX = null;
            });

            segment.addEventListener('pointermove', e => {
                const dx = lastX == null ? 0 : e.clientX - lastX;
                lastX = e.clientX;
                place(el, e.clientX, e.clientY);

                if (el === bike) {
                    if (Math.abs(dx) > 0.5) bike.classList.toggle('left', dx < 0);
                    wheelAngle += Math.abs(dx) / 9.5 * (180 / Math.PI);
                    if (!reduceMotion) wheels.forEach(wh => { wh.style.transform = `rotate(${wheelAngle}deg)`; });
                }
            });
        });

        // Hide the cursors whenever the section is left
        document.addEventListener('sectionchange', () => Object.values(cursors).forEach(c => c.classList.remove('visible')));
    }

    // Bisz: in English each translated line carries the Polish original beneath it
    function renderQuote(me) {
        const box = document.getElementById('me-quote-lines');
        if (!box || !me?.quote) return;
        box.replaceChildren(...me.quote.map((line, i) => {
            const p = document.createElement('p');
            p.className = 'me-quote-line';
            p.textContent = line;
            const original = me.quoteOriginal?.[i];
            if (original) {
                p.lang = 'en';
                const o = document.createElement('span');
                o.className = 'me-quote-original';
                o.lang = 'pl';
                o.textContent = original;
                p.appendChild(o);
            }
            return p;
        }));
    }

    function translateAlts(translations) {
        document.querySelectorAll('#me [data-i18n-alt]').forEach(img => {
            const value = img.dataset.i18nAlt.split('.').reduce((o, k) => (o == null ? undefined : o[k]), translations);
            if (typeof value === 'string') img.alt = value;
        });
    }

    document.addEventListener('langchange', e => {
        translateAlts(e.detail.translations);
        renderQuote(e.detail.translations.me);
    });

    window.sectionsReady?.then(() => {
        const section = document.getElementById('me');
        if (!section) return;
        const space = section.querySelector('.me-space');
        if (space) initSpace(space);
        const philosophy = section.querySelector('.me-philosophy');
        if (philosophy) initBrush(philosophy);
        if (finePointer) initCursors(section);
    });
})();
