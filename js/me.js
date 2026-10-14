// About me: the lensed star field, the Clair Obscur brush canvas and the unicycle track
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

        // A lensed image is smeared along the Einstein ring, so draw it as a short arc around the hole
        function drawLensed(cx, cy, radius, angle, r, alpha, color, tangent, stretch) {
            if (stretch < 1.3) {
                drawStar(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, r, alpha, color, tangent, 1);
                return;
            }
            if (alpha < 0.02) return;
            const half = Math.min(r * stretch / radius, 0.5);
            ctx.strokeStyle = `rgba(${color},${Math.min(alpha * 0.8, 0.9)})`;
            ctx.lineWidth = r * 1.3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(cx, cy, radius, angle - half, angle + half);
            ctx.stroke();
        }

        // ---------- Accretion disk ----------
        // The disk is painted face-on once as concentric bands of fine orbital streaks, then each band
        // is rotated at its own speed (inner ones faster, as in a real orbit) and squashed every frame.
        // The far side bent over and under the hole is a separate, thinner set of bands.
        const TILT = 0.2;
        let disk = null, halo = null, layer = null, layerCtx = null, texKey = '';

        // Angular speed of a band in rad/ms, falling off with radius like a Keplerian orbit
        const orbit = r => 0.0021 * Math.pow(r, -1.5);

        function ringBands(rs, edges, streaks) {
            const s = rs * dpr;
            const rIn = edges[0], rOut = edges[edges.length - 1];
            const size = Math.ceil(s * rOut * 2) + 4;
            const bands = edges.slice(0, -1).map((from, i) => {
                const c = document.createElement('canvas');
                c.width = c.height = size;
                const g = c.getContext('2d');
                g.translate(size / 2, size / 2);
                const to = edges[i + 1];

                // One radial gradient across the whole disk, so the bands meet without seams
                const base = g.createRadialGradient(0, 0, s * rIn, 0, 0, s * rOut);
                base.addColorStop(0, 'rgba(255,238,210,0.55)');
                base.addColorStop(0.15, 'rgba(255,198,128,0.32)');
                base.addColorStop(0.5, 'rgba(225,120,52,0.12)');
                base.addColorStop(1, 'rgba(120,40,12,0)');
                g.fillStyle = base;
                g.beginPath();
                g.arc(0, 0, s * to, 0, Math.PI * 2);
                g.arc(0, 0, s * from, 0, Math.PI * 2, true);
                g.fill();
                g.globalCompositeOperation = 'lighter';
                g.lineCap = 'round';
                return { canvas: c, ctx: g, from, to, speed: orbit((from + to) / 2) };
            });

            for (let i = 0; i < streaks; i++) {
                const f = Math.pow(Math.random(), 1.7);          // denser and hotter towards the inner edge
                const r = rIn + f * (rOut - rIn);
                const band = bands.find(b => r < b.to) || bands[bands.length - 1];
                const g = band.ctx;
                const heat = 1 - f;
                const a0 = Math.random() * Math.PI * 2;
                const color = heat > 0.75 ? '255,245,228' : heat > 0.45 ? '255,206,140' : '238,138,68';
                g.strokeStyle = `rgba(${color},${0.03 + Math.random() * 0.22 * (0.4 + heat)})`;
                g.lineWidth = dpr * (0.35 + Math.random() * (0.6 + heat));
                g.beginPath();
                g.arc(0, 0, s * r, a0, a0 + 0.8 + Math.random() * 2.4);
                g.stroke();
            }

            // Hot, sharp inner edge
            const g = bands[0].ctx;
            g.strokeStyle = 'rgba(255,250,238,0.7)';
            g.lineWidth = 1.1 * dpr;
            g.beginPath();
            g.arc(0, 0, s * rIn * 1.01, 0, Math.PI * 2);
            g.stroke();
            return bands;
        }

        function ensureTextures(rs) {
            const key = `${Math.round(rs)}:${dpr}`;
            if (key === texKey) return;
            texKey = key;
            disk = ringBands(rs, [1.5, 1.85, 2.3, 2.9, 3.6, 4.4], 420);
            halo = ringBands(rs, [1.08, 1.4, 1.8], 160);
            layer = document.createElement('canvas');
            layer.width = disk[0].canvas.width;
            layer.height = layer.width;
            layerCtx = layer.getContext('2d');
        }

        // Paint a set of bands into the layer, each rotated by its own orbit, tilted,
        // and brighter on the approaching (left) side
        function renderRing(bands, t, tilt) {
            const n = layer.width;
            layerCtx.setTransform(1, 0, 0, 1, 0, 0);
            layerCtx.globalCompositeOperation = 'source-over';
            layerCtx.clearRect(0, 0, n, n);
            for (const band of bands) {
                const tex = band.canvas;
                layerCtx.setTransform(1, 0, 0, tilt, n / 2, n / 2);
                layerCtx.rotate(reduceMotion ? 0 : -t * band.speed);
                layerCtx.drawImage(tex, -tex.width / 2, -tex.width / 2);
            }
            layerCtx.setTransform(1, 0, 0, 1, 0, 0);
            const beam = layerCtx.createLinearGradient(0, 0, n, 0);
            beam.addColorStop(0, 'rgba(0,0,0,1)');
            beam.addColorStop(0.5, 'rgba(0,0,0,0.75)');
            beam.addColorStop(1, 'rgba(0,0,0,0.35)');
            layerCtx.globalCompositeOperation = 'destination-in';
            layerCtx.fillStyle = beam;
            layerCtx.fillRect(0, 0, n, n);
        }

        // Draw the layer centred on the hole, optionally only above (-1) or below (+1) its centre
        function blitLayer(x, y, side) {
            const S = layer.width / dpr;
            ctx.save();
            if (side) {
                ctx.beginPath();
                ctx.rect(x - S / 2, side < 0 ? y - S / 2 : y, S, S / 2);
                ctx.clip();
            }
            ctx.drawImage(layer, x - S / 2, y - S / 2, S, S);
            ctx.restore();
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

                const angle = Math.atan2(uy, ux);
                const outer = (beta + root) / 2;
                if (outer > shadow) {
                    const m = Math.min((mu + 1) / 2, 6);
                    drawLensed(hole.x, hole.y, outer, angle, s.r * Math.min(Math.sqrt(m), 1.6),
                        alpha * Math.min(m, 1.5), s.hue, tangent, Math.min(outer / beta, 4));
                }

                const inner = (root - beta) / 2;   // on the opposite side of the lens
                if (inner > shadow) {
                    const m = Math.min((mu - 1) / 2, 6);
                    drawLensed(hole.x, hole.y, inner, angle + Math.PI, s.r * Math.min(Math.sqrt(m), 1.6),
                        alpha * Math.min(m, 1.5), s.hue, tangent, Math.min(inner / beta, 4));
                }
            }

            drawHole(hole.x, hole.y, shadow, t);
        }

        function drawHole(x, y, rs, t) {
            ensureTextures(rs);

            // Soft glow around the whole system
            const glow = ctx.createRadialGradient(x, y, rs, x, y, rs * 4.5);
            glow.addColorStop(0, 'rgba(255,180,110,0.16)');
            glow.addColorStop(0.45, 'rgba(255,140,70,0.05)');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, rs * 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Far side of the disk, lensed into a ring over the top and under the bottom of the shadow
            renderRing(halo, t, 0.94);
            blitLayer(x, y, 0);

            // Back half of the disk, behind the hole
            renderRing(disk, t, TILT);
            blitLayer(x, y, -1);

            // Shadow and the thin photon ring at its edge
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x, y, rs, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,240,220,0.75)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, rs * 1.03, 0, Math.PI * 2);
            ctx.stroke();

            // Front half of the disk, crossing in front of the shadow
            blitLayer(x, y, 1);
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
                size: 0.9 + Math.random() * 1.1,
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
                    if (!reduceMotion && Math.random() < 0.35) spawnPetal(s, t);
                }
                const alpha = age < HOLD ? 1 : 1 - (age - HOLD) / FADE;
                if (alpha <= 0) return false;

                ctx.strokeStyle = `rgba(241,231,208,${0.7 * alpha})`;
                ctx.lineWidth = s.w;
                ctx.beginPath();
                ctx.moveTo(s.x1, s.y1);
                ctx.lineTo(s.x2, s.y2);
                ctx.stroke();

                // Bristle streaks give the stroke some texture
                const nx = -(s.y2 - s.y1), ny = s.x2 - s.x1, len = Math.hypot(nx, ny) || 1;
                ctx.strokeStyle = `rgba(150,120,95,${0.2 * alpha})`;
                ctx.lineWidth = Math.max(0.8, s.w * 0.08);
                for (const off of [-0.25, 0.25]) {
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
                ctx.fillStyle = p.crimson ? `rgba(200,60,78,${a * 0.8})` : `rgba(241,231,208,${a * 0.6})`;
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size, p.size * 2.2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                return true;
            });

            if (strokes.length || petals.length) rafId = requestAnimationFrame(draw);
            else { rafId = null; prevT = 0; segment.classList.remove('painting'); }
        }

        function paint(e) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top, t = performance.now();
            if (last) {
                const dist = Math.hypot(x - last.x, y - last.y);
                if (dist < 1.5) return;
                const speed = dist / Math.max(t - last.t, 8);           // px per ms
                const width = Math.max(2, Math.min(9, 9 - speed * 3.5));
                const smooth = last.w == null ? width : last.w + (width - last.w) * 0.35;
                strokes.push({ x1: last.x, y1: last.y, x2: x, y2: y, w: smooth, born: t });
                last = { x, y, t, w: smooth };
            } else {
                last = { x, y, t, w: null };
            }
            segment.classList.add('painting');
            if (!rafId) rafId = requestAnimationFrame(draw);
        }

        // A short demo stroke each time the canvas scrolls into view, so it never sits empty
        let demoDone = false;
        function demo() {
            if (reduceMotion || demoDone || !w || !h) return;
            demoDone = true;
            const start = performance.now(), DURATION = 1400;
            last = null;
            (function step(now) {
                const k = Math.min((now - start) / DURATION, 1);
                const x = w * (0.18 + 0.64 * k);
                const y = h * (0.5 + Math.sin(k * Math.PI * 2) * 0.16 - k * 0.06);
                const rect = canvas.getBoundingClientRect();
                paint({ clientX: rect.left + x, clientY: rect.top + y });
                if (k < 1) requestAnimationFrame(step);
                else last = null;
            })(start);
        }

        new IntersectionObserver(entries => {
            if (entries.some(e => e.isIntersecting)) setTimeout(demo, 400);
        }, { threshold: 0.6 }).observe(segment);
        document.addEventListener('sectionchange', () => { demoDone = false; });

        new ResizeObserver(resize).observe(segment);
        segment.addEventListener('pointermove', paint);
        segment.addEventListener('pointerleave', () => { last = null; });
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

    // ---------- DOM cursor: the Clair Obscur brush ----------
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

    function initCursors(section) {
        section.classList.add('me-cursors-on');

        const brush = document.createElement('div');
        brush.className = 'me-cursor me-cursor-brush';
        brush.innerHTML = BRUSH_SVG;
        document.body.appendChild(brush);

        // The brush paints from its tip, so the tip is the hotspot
        const place = e => { brush.style.transform = `translate(${e.clientX - 1.4}px, ${e.clientY - 30.6}px)`; };

        section.querySelectorAll('[data-cursor="brush"]').forEach(stage => {
            stage.addEventListener('pointerenter', e => { place(e); brush.classList.add('visible'); });
            stage.addEventListener('pointerleave', () => brush.classList.remove('visible'));
            stage.addEventListener('pointermove', place);
        });

        // Hide the cursor whenever the section is left
        document.addEventListener('sectionchange', () => brush.classList.remove('visible'));
    }

    function translateAlts(translations) {
        document.querySelectorAll('#me [data-i18n-alt]').forEach(img => {
            const value = img.dataset.i18nAlt.split('.').reduce((o, k) => (o == null ? undefined : o[k]), translations);
            if (typeof value === 'string') img.alt = value;
        });
    }

    document.addEventListener('langchange', e => {
        translateAlts(e.detail.translations);
    });

    window.sectionsReady?.then(() => {
        const section = document.getElementById('me');
        if (!section) return;
        const space = section.querySelector('.me-space');
        if (space) initSpace(space);
        const stage = section.querySelector('.me-stage');
        if (stage) initBrush(stage);
        const photo = section.querySelector('.me-gravel-media');
        if (photo) initTracks(photo);
        if (finePointer) initCursors(section);
    });
})();
