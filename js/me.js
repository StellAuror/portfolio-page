// About me: the lensed star field, the story spines and the unicycle track
(function () {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    // ---------- Stories: spines that open into small animated covers ----------
    const STRIP_ART = {
        karamazov: ['glow', 'candle', 'flame'],
        zarathustra: ['rays', 'sun', 'peaks'],
        frankl: ['dot', 'ring', 'ring', 'ring'],
        kwantechizm: ['fringes', 'slit'],
        witcher: ['blade b1', 'blade b2', 'snow', 'snow', 'snow', 'snow', 'snow'],
        cyberpunk: ['scan', 'bar'],
        e33: ['num', 'petal', 'petal', 'petal', 'petal'],
    };

    function renderStrips(items) {
        const box = document.getElementById('me-strips');
        if (!box || !Array.isArray(items)) return;

        box.replaceChildren(...items.map(item => {
            const strip = document.createElement('div');
            strip.className = 'me-strip';
            strip.dataset.id = item.id;
            strip.tabIndex = 0;
            strip.setAttribute('role', 'button');
            strip.setAttribute('aria-label', `${item.title} — ${item.kind}`);

            const art = document.createElement('div');
            art.className = 'me-strip-art';
            art.setAttribute('aria-hidden', 'true');
            (STRIP_ART[item.id] || []).forEach(cls => {
                const piece = document.createElement('i');
                piece.className = cls;
                if (cls === 'num') piece.textContent = '33';
                art.appendChild(piece);
            });

            const spine = document.createElement('span');
            spine.className = 'me-strip-spine';
            spine.setAttribute('aria-hidden', 'true');
            spine.textContent = item.title;

            const caption = document.createElement('div');
            caption.className = 'me-strip-caption';
            caption.innerHTML = '<span class="me-strip-title"></span><span class="me-strip-kind"></span>';
            caption.firstChild.textContent = item.title;
            caption.lastChild.textContent = item.kind;

            strip.append(art, spine, caption);
            return strip;
        }));
    }

    function initStrips(box) {
        const open = strip => box.querySelectorAll('.me-strip').forEach(s => s.classList.toggle('active', s === strip));
        box.addEventListener('pointerover', e => { const s = e.target.closest('.me-strip'); if (s) open(s); });
        box.addEventListener('pointerleave', () => { if (!box.querySelector(':focus-visible')) open(null); });
        box.addEventListener('focusin', e => open(e.target.closest('.me-strip')));
        box.addEventListener('focusout', e => { if (!box.contains(e.relatedTarget)) open(null); });
    }

    // ---------- Gravel: a faint unicycle tyre track over the photo that fades ----------
    function initTracks(segment) {
        const canvas = segment.querySelector('.me-canvas');
        const ctx = canvas.getContext('2d');
        const HOLD = 350, FADE = 900, WIDTH = 7, STEP = 5;
        let w = 0, h = 0, marks = [], last = null, travelled = 0, rafId = null;

        function resize() {
            const rect = canvas.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = rect.width;
            h = rect.height;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            marks = [];
        }

        function draw(t) {
            ctx.clearRect(0, 0, w, h);
            ctx.lineCap = 'round';
            marks = marks.filter(m => {
                const age = t - m.born;
                const alpha = age < HOLD ? 1 : 1 - (age - HOLD) / FADE;
                if (alpha <= 0) return false;
                const nx = -Math.sin(m.a), ny = Math.cos(m.a);   // across the track
                const tx = Math.cos(m.a), ty = Math.sin(m.a);    // along the track
                const half = WIDTH / 2;

                // Tyre edges
                ctx.strokeStyle = `rgba(235,230,220,${0.14 * alpha})`;
                ctx.lineWidth = 1;
                for (const side of [-1, 1]) {
                    ctx.beginPath();
                    ctx.moveTo(m.x - tx * STEP / 2 + nx * half * side, m.y - ty * STEP / 2 + ny * half * side);
                    ctx.lineTo(m.x + tx * STEP / 2 + nx * half * side, m.y + ty * STEP / 2 + ny * half * side);
                    ctx.stroke();
                }

                // Chevron tread knob
                ctx.strokeStyle = `rgba(240,235,225,${0.3 * alpha})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(m.x + nx * half * 0.8 - tx * 1.8, m.y + ny * half * 0.8 - ty * 1.8);
                ctx.lineTo(m.x + tx * 1.2, m.y + ty * 1.2);
                ctx.lineTo(m.x - nx * half * 0.8 - tx * 1.8, m.y - ny * half * 0.8 - ty * 1.8);
                ctx.stroke();
                return true;
            });

            if (marks.length) rafId = requestAnimationFrame(draw);
            else rafId = null;
        }

        function roll(e) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top;
            if (!last) { last = { x, y }; return; }
            const dx = x - last.x, dy = y - last.y, dist = Math.hypot(dx, dy);
            if (dist < 0.5) return;
            const a = Math.atan2(dy, dx), t = performance.now();
            // Lay a tread knob every few pixels along the path
            for (let d = STEP - travelled; d <= dist; d += STEP) {
                marks.push({ x: last.x + dx * d / dist, y: last.y + dy * d / dist, a, born: t });
            }
            travelled = (travelled + dist) % STEP;
            last = { x, y };
            if (!rafId) rafId = requestAnimationFrame(draw);
        }

        new ResizeObserver(resize).observe(segment);
        segment.addEventListener('pointermove', roll);
        segment.addEventListener('pointerleave', () => { last = null; });
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
        renderStrips(e.detail.translations.me?.stories?.items);
    });

    window.sectionsReady?.then(() => {
        const section = document.getElementById('me');
        if (!section) return;
        const space = section.querySelector('.me-space');
        if (space) initSpace(space);
        const strips = section.querySelector('#me-strips');
        if (strips) initStrips(strips);
        const photo = section.querySelector('.me-gravel-media');
        if (photo) initTracks(photo);
    });
})();
