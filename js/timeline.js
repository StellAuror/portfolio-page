// Journey timeline
// Data comes from language.js ("langchange"); rendering waits until the
// Journey section is visible, because layout depends on the wrapper width.
window.timelineData = [];
let currentIdx = 0;
let timelineDirty = true;      // data or width changed since last render
let renderedWidth = 0;
let controlsBound = false;

// Layout of the time strip (px)
const TL = {
    pad: 28,          // horizontal padding inside the strip
    minPerMonth: 9,   // below this the strip scrolls horizontally
    lanePitch: 38,    // vertical distance between lanes
    laneGap: 14,      // min horizontal gap between items sharing a lane
    labelFont: '600 12px Inter, sans-serif',
    top: 10,          // space above the highest lane
    axisGap: 16,      // space between lowest lane and the axis
    axisArea: 52,     // axis + year labels + date chips
};

function journeyVisible() {
    const wrapper = document.querySelector('#journey .timeline-wrapper');
    return !!wrapper && wrapper.clientWidth > 0;
}

// "YYYY-MM" → absolute month index; end dates are inclusive, so they map to the month's end
const monthIndex = ym => { const [y, m] = ym.split('-').map(Number); return y * 12 + (m - 1); };
const nowIndex = () => { const d = new Date(); return d.getFullYear() * 12 + d.getMonth(); };

function formatMonth(idx) {
    const lang = document.documentElement.lang || 'en';
    const d = new Date(Math.floor(idx / 12), idx % 12, 1);
    return new Intl.DateTimeFormat(lang === 'pl' ? 'pl-PL' : 'en-GB', { month: 'short', year: 'numeric' }).format(d);
}

let measureCtx = null;
function textWidth(text) {
    measureCtx = measureCtx || document.createElement('canvas').getContext('2d');
    measureCtx.font = TL.labelFont;
    return Math.ceil(measureCtx.measureText(text).width);
}

// Periods of an item as month ranges [start, endExclusive]; ongoing ones end "now".
// A single one-month period is drawn as a point (e.g. a certificate).
function itemRanges(item) {
    const periods = item.periods || [];
    return periods.map(p => {
        const s = monthIndex(p.start);
        const ongoing = !p.end;
        const e = ongoing ? nowIndex() + 1 : monthIndex(p.end) + 1;
        return { s, e, ongoing, point: !ongoing && p.start === p.end && periods.length === 1 };
    });
}

let geometry = null; // per-item pixel geometry used by guides and auto-scroll

// Cards row (the original white cards) + brackets on a real time axis, joined by curved links
const CARD_DESKTOP = { width: 120, height: 104, gap: 14, top: 16, link: 42, lanePitch: 13 };
const CARD_MOBILE = { width: 104, height: 76, gap: 10, top: 12, link: 26, lanePitch: 11 };
let CARD = CARD_DESKTOP;

function renderTimeline() {
    const timeline = document.querySelector('#journey .timeline');
    const wrapper = document.querySelector('#journey .timeline-wrapper');
    if (!timeline || !wrapper) return;

    timeline.innerHTML = '';
    const items = window.timelineData;
    if (!items.length) return;
    CARD = window.innerWidth <= 1000 ? CARD_MOBILE : CARD_DESKTOP;

    const ranges = items.map(itemRanges);
    const all = ranges.flat();
    const first = Math.min(...all.map(r => r.s)) - 3;
    const last = Math.max(...all.map(r => r.e)) + 4;
    const months = last - first;
    const minWidth = Math.max(wrapper.clientWidth, items.length * (CARD.width + CARD.gap) + 2 * TL.pad);
    const perMonth = Math.max(TL.minPerMonth, (minWidth - 2 * TL.pad) / months);
    const width = Math.ceil(months * perMonth + 2 * TL.pad);
    const xOf = idx => TL.pad + (idx - first) * perMonth;

    geometry = items.map((item, index) => {
        const segs = ranges[index].map(r => ({ ...r, x0: xOf(r.s), x1: Math.max(xOf(r.e), xOf(r.s) + 2) }));
        const x0 = Math.min(...segs.map(g => g.x0));
        const x1 = Math.max(...segs.map(g => g.x1));
        const point = segs.length === 1 && segs[0].point;
        return { index, segs, x0, x1, point };
    });

    // Bracket lanes: only brackets that overlap in time get stacked
    const laneEnds = [];
    [...geometry].sort((a, b) => a.x0 - b.x0).forEach(g => {
        const start = g.point ? g.x0 - 6 : g.x0;
        const end = g.point ? g.x0 + 6 : g.x1;
        let lane = laneEnds.findIndex(e => e + 6 <= start);
        if (lane === -1) { lane = laneEnds.length; laneEnds.push(0); }
        laneEnds[lane] = end;
        g.lane = lane;
    });

    // Cards: as close as possible above their period, pushed apart so they never overlap
    const order = [...geometry].sort((a, b) => (a.x0 + a.x1) - (b.x0 + b.x1));
    let prevRight = -Infinity;
    order.forEach(g => {
        const ideal = (g.point ? g.x0 : (g.x0 + g.x1) / 2) - CARD.width / 2;
        g.cardX = Math.max(ideal, prevRight + CARD.gap, TL.pad / 2);
        prevRight = g.cardX + CARD.width;
    });
    let nextLeft = width - TL.pad / 2 + CARD.gap;
    [...order].reverse().forEach(g => {
        g.cardX = Math.min(g.cardX, nextLeft - CARD.gap - CARD.width);
        nextLeft = g.cardX;
    });

    const bracketsTop = CARD.top + CARD.height + CARD.link;
    const axisY = bracketsTop + laneEnds.length * CARD.lanePitch + 12;
    timeline.style.width = width + 'px';
    timeline.style.height = (axisY + TL.axisArea) + 'px';
    geometry.axisY = axisY;

    // Axis with month ticks, year ticks and year labels
    const axis = document.createElement('div');
    axis.className = 'tl-axis';
    axis.style.top = axisY + 'px';
    timeline.appendChild(axis);
    for (let m = first; m <= last; m++) {
        const isYear = m % 12 === 0;
        const tick = document.createElement('div');
        tick.className = isYear ? 'tl-tick tl-tick-year' : 'tl-tick';
        tick.style.left = xOf(m) + 'px';
        tick.style.top = axisY + 'px';
        timeline.appendChild(tick);
        if (isYear) {
            const label = document.createElement('div');
            label.className = 'tl-year';
            label.style.left = xOf(m) + 'px';
            label.style.top = (axisY + 10) + 'px';
            label.textContent = m / 12;
            timeline.appendChild(label);
        }
    }

    const today = document.createElement('div');
    today.className = 'tl-today';
    today.style.left = xOf(nowIndex() + new Date().getDate() / 31) + 'px';
    today.style.top = bracketsTop + 'px';
    today.style.height = (axisY - bracketsTop) + 'px';
    timeline.appendChild(today);

    // Curved links between cards and their brackets
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'tl-links');
    svg.setAttribute('width', width);
    svg.setAttribute('height', axisY);
    timeline.appendChild(svg);

    geometry.forEach(g => {
        const item = items[g.index];
        const laneTop = bracketsTop + (laneEnds.length - 1 - g.lane) * CARD.lanePitch;
        g.legTop = laneTop;

        // Bracket(s) or a diamond for one-off events
        const span = document.createElement('div');
        span.className = 'tl-span';
        span.dataset.index = g.index;
        if (g.point) {
            const dot = document.createElement('span');
            dot.className = 'tl-point';
            dot.style.left = g.x0 + 'px';
            dot.style.top = (laneTop - 1) + 'px';
            span.appendChild(dot);
        } else {
            g.segs.forEach((seg, k) => {
                const bracket = document.createElement('span');
                bracket.className = 'tl-bracket' + (seg.ongoing ? ' tl-bracket-ongoing' : '');
                bracket.style.left = seg.x0 + 'px';
                bracket.style.top = laneTop + 'px';
                bracket.style.width = (seg.x1 - seg.x0) + 'px';
                span.appendChild(bracket);
                const next = g.segs[k + 1];
                if (next) {
                    const bridge = document.createElement('span');
                    bridge.className = 'tl-bridge';
                    bridge.style.left = seg.x1 + 'px';
                    bridge.style.top = (laneTop + 1) + 'px';
                    bridge.style.width = (next.x0 - seg.x1) + 'px';
                    span.appendChild(bridge);
                }
            });
        }
        span.addEventListener('click', () => showEvent(g.index));
        timeline.appendChild(span);

        // Link: card bottom-centre → nearest point of the period
        const cx = g.cardX + CARD.width / 2;
        const cy = CARD.top + CARD.height;
        const tx = g.point ? g.x0 : Math.min(Math.max(cx, g.x0 + 3), g.x1 - 3);
        const ty = laneTop - 1;
        const path = document.createElementNS(svgNS, 'path');
        const bend = (ty - cy) / 2;
        path.setAttribute('d', `M${cx},${cy} C${cx},${cy + bend} ${tx},${ty - bend} ${tx},${ty}`);
        path.setAttribute('class', 'tl-link');
        path.setAttribute('pathLength', '1');
        path.dataset.index = g.index;
        svg.appendChild(path);

        // The card itself (original look)
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'timeline-item';
        card.dataset.index = g.index;
        card.style.left = g.cardX + 'px';
        card.style.top = CARD.top + 'px';
        card.title = item.date_full;
        card.innerHTML = `
            <div class="timeline-block">
                <div class="timeline-block-title">${item.title || ''}</div>
                <div class="timeline-block-desc">${(item.description || '').replace(/<[^>]+>/g, '')}</div>
            </div>`;
        card.addEventListener('click', () => showEvent(g.index));
        // hovering a card brings its faint bracket forward
        card.addEventListener('mouseenter', () => span.classList.add('tl-hover'));
        card.addEventListener('mouseleave', () => span.classList.remove('tl-hover'));
        timeline.appendChild(card);
    });

    renderedWidth = wrapper.clientWidth;
    timelineDirty = false;
}

// Dashed guides from the active item's start/end down to the axis, with exact dates
function drawGuides(index) {
    const timeline = document.querySelector('#journey .timeline');
    if (!timeline || !geometry) return;
    timeline.querySelectorAll('.tl-guide, .tl-date').forEach(el => el.remove());
    const g = geometry[index];
    if (!g) return;

    const marks = [];
    g.segs.forEach(seg => {
        marks.push({ x: g.point ? seg.x0 : seg.x0, text: formatMonth(seg.s) });
        if (!g.point) {
            marks.push({ x: seg.x1, text: seg.ongoing ? (window.translations?.journey?.present || 'present') : formatMonth(seg.e - 1) });
        }
    });

    let lastRight = -Infinity;
    marks.forEach(mk => {
        const guide = document.createElement('div');
        guide.className = 'tl-guide';
        guide.style.left = mk.x + 'px';
        guide.style.top = g.legTop + 'px';
        guide.style.height = (geometry.axisY - g.legTop) + 'px';
        timeline.appendChild(guide);

        const chip = document.createElement('div');
        chip.className = 'tl-date';
        chip.textContent = mk.text;
        chip.style.top = (geometry.axisY + 28) + 'px';
        timeline.appendChild(chip);
        // keep neighbouring date chips from overlapping
        const w = chip.offsetWidth;
        let left = mk.x - w / 2;
        if (left < lastRight + 4) left = lastRight + 4;
        chip.style.left = left + 'px';
        lastRight = left + w;
    });
}

function showEvent(index, instant = false) {
    const items = window.timelineData;
    if (!items.length || index < 0 || index >= items.length) return;

    currentIdx = index;
    const event = items[index];

    document.querySelectorAll('#journey .timeline-item, #journey .tl-span, #journey .tl-link').forEach(el => {
        const active = Number(el.dataset.index) === index;
        el.classList.toggle('timeline-active', active);
        if (el.tagName === 'BUTTON') el.setAttribute('aria-pressed', String(active));
    });
    drawGuides(index);

    document.getElementById('timeline-left-content').innerHTML = `
        <div class="fade-in">
            ${event.media ? `<img src="${event.media}" alt="${event.title}" class="timeline-event-media">` : ''}
        </div>
    `;

    document.getElementById('timeline-right-content').innerHTML = `
        <div class="timeline-slide-in">
            <div class="timeline-event-year">${event.date_full}</div>
            <h3 class="timeline-event-title">${event.title}</h3>
            <p class="timeline-event-description">${event.description}</p>
            <div class="timeline-event-tags">
                ${(event.tags || []).map(tag => `<span class="timeline-tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;

    // Data is ordered newest-first: "newer" moves towards index 0
    document.getElementById('timeline-next-btn').disabled = index === 0;
    document.getElementById('timeline-prev-btn').disabled = index === items.length - 1;
    document.querySelectorAll('#journey .tl-mnav').forEach(nav => {
        nav.querySelector('.tl-mnav-prev').disabled = index === items.length - 1;
        nav.querySelector('.tl-mnav-next').disabled = index === 0;
        nav.querySelector('.tl-mnav-count').textContent = `${items.length - index} / ${items.length}`;
    });

    autoScrollToActiveItem(instant);
}

function autoScrollToActiveItem(instant = false) {
    const wrapper = document.querySelector('#journey .timeline-wrapper');
    const g = geometry && geometry[currentIdx];
    if (!wrapper || !g) return;
    const center = g.cardX + CARD.width / 2;
    const maxScrollLeft = Math.max(0, wrapper.scrollWidth - wrapper.clientWidth);
    const target = Math.min(maxScrollLeft, Math.max(0, center - wrapper.clientWidth / 2));
    wrapper.scrollTo({ left: target, behavior: instant ? 'auto' : 'smooth' });
}

// Render (or re-render) only when the strip is actually visible
function refreshTimeline() {
    if (!journeyVisible()) return;
    const wrapper = document.querySelector('#journey .timeline-wrapper');
    if (timelineDirty || wrapper.clientWidth !== renderedWidth) {
        renderTimeline();
    }
    bindControls();
    showEvent(Math.min(currentIdx, window.timelineData.length - 1), true);
}

function bindControls() {
    if (controlsBound) return;
    controlsBound = true;

    document.getElementById('timeline-next-btn')?.addEventListener('click', () => {
        if (currentIdx > 0) showEvent(currentIdx - 1);
    });
    document.getElementById('timeline-prev-btn')?.addEventListener('click', () => {
        if (currentIdx < window.timelineData.length - 1) showEvent(currentIdx + 1);
    });

    // Mobile nav bars (above and below the content); the lower one brings the reader back up
    document.querySelectorAll('#journey .tl-mnav').forEach(nav => {
        const go = step => {
            const next = currentIdx + step;
            if (next < 0 || next >= window.timelineData.length) return;
            showEvent(next);
            if (nav.classList.contains('tl-mnav-bottom')) {
                document.querySelector('#journey .timeline-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
        nav.querySelector('.tl-mnav-prev').addEventListener('click', () => go(1));
        nav.querySelector('.tl-mnav-next').addEventListener('click', () => go(-1));
    });

    // Arrow keys only while Journey is open
    document.addEventListener('keydown', (e) => {
        if (window.activeSection !== 'journey') return;
        if (e.key === 'ArrowLeft' && currentIdx < window.timelineData.length - 1) showEvent(currentIdx + 1);
        else if (e.key === 'ArrowRight' && currentIdx > 0) showEvent(currentIdx - 1);
    });

    // Swipe on the content area switches events (the strip itself scrolls natively)
    const content = document.querySelector('#journey .timeline-main-content');
    let startX = 0, startY = 0;
    content?.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });
    content?.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        if (dx < 0 && currentIdx > 0) showEvent(currentIdx - 1);
        else if (dx > 0 && currentIdx < window.timelineData.length - 1) showEvent(currentIdx + 1);
    }, { passive: true });
}

document.addEventListener('langchange', (e) => {
    window.timelineData = e.detail.translations.timelineData || [];
    timelineDirty = true;
    refreshTimeline();
});

document.addEventListener('sectionchange', (e) => {
    if (e.detail.id === 'journey') requestAnimationFrame(refreshTimeline);
});

let timelineResizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(timelineResizeTimeout);
    timelineResizeTimeout = setTimeout(refreshTimeline, 200);
});
