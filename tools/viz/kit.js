// Wizualizacje DAX / Power Query — wspólne klocki.
// Bez zależności i bez modułów, żeby plik działał także otwarty lokalnie (file://).
// Kontekst filtra = obiekt { kolumna: [dozwolone wartości] }. Brak klucza = brak filtra na tej kolumnie.
(function () {
    const VZ = {};

    // ---------- Dane przykładowe (te same we wszystkich narzędziach DAX) ----------

    VZ.colors = { Czerwony: '#e11d48', Niebieski: '#2563eb', Czarny: '#27272a' };

    VZ.sales = [
        { Id: 1, Kategoria: 'Rowery', Kolor: 'Czerwony', Kwota: 1200 },
        { Id: 2, Kategoria: 'Rowery', Kolor: 'Niebieski', Kwota: 800 },
        { Id: 3, Kategoria: 'Rowery', Kolor: 'Czarny', Kwota: 1500 },
        { Id: 4, Kategoria: 'Rowery', Kolor: 'Czerwony', Kwota: 600 },
        { Id: 5, Kategoria: 'Kaski', Kolor: 'Czerwony', Kwota: 150 },
        { Id: 6, Kategoria: 'Kaski', Kolor: 'Niebieski', Kwota: 220 },
        { Id: 7, Kategoria: 'Kaski', Kolor: 'Czarny', Kwota: 90 },
        { Id: 8, Kategoria: 'Kaski', Kolor: 'Niebieski', Kwota: 130 },
        { Id: 9, Kategoria: 'Odzież', Kolor: 'Niebieski', Kwota: 300 },
        { Id: 10, Kategoria: 'Odzież', Kolor: 'Czarny', Kwota: 450 },
        { Id: 11, Kategoria: 'Odzież', Kolor: 'Czerwony', Kwota: 200 },
        { Id: 12, Kategoria: 'Odzież', Kolor: 'Czarny', Kwota: 180 },
    ];

    VZ.distinct = (rows, col) => [...new Set(rows.map(r => r[col]))];

    // ---------- Kontekst filtra ----------

    VZ.rowPasses = (row, ctx) =>
        Object.entries(ctx).every(([col, values]) => values.includes(row[col]));

    VZ.filterRows = (rows, ctx) => rows.filter(r => VZ.rowPasses(r, ctx));

    VZ.sum = (rows, col) => rows.reduce((s, r) => s + r[col], 0);

    // Suma w kontekście; pusty zbiór wierszy = BLANK (null), tak jak w DAX
    VZ.sumIn = (rows, ctx, col) => {
        const hit = VZ.filterRows(rows, ctx);
        return hit.length ? VZ.sum(hit, col) : null;
    };

    VZ.intersect = (a, b) => a.filter(v => b.includes(v));

    // ---------- Formatowanie ----------

    const nf = new Intl.NumberFormat('pl-PL');
    VZ.fmt = v => (v === null || v === undefined ? '(puste)' : nf.format(v));

    VZ.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    VZ.swatch = value => (VZ.colors[value] ? `<span class="vz-swatch" style="background:${VZ.colors[value]}"></span>` : '');

    // ---------- Chip filtra ----------
    // kind: visual | calc | row | and | off | empty | none ; tag: mała etykieta, np. "nadpisany"
    VZ.chip = (col, values, kind = 'visual', tag = '') => {
        const list = Array.isArray(values) ? values : [values];
        const val = list.length ? list.map(v => VZ.swatch(v) + VZ.esc(v)).join(', ') : '∅';
        const colHtml = col ? `<span class="col">${VZ.esc(col)} =</span>` : '';
        const tagHtml = tag ? `<span class="tag">${VZ.esc(tag)}</span>` : '';
        return `<span class="vz-chip ${kind}">${colHtml}<span>${val}</span>${tagHtml}</span>`;
    };

    VZ.op = (symbol = '&', cls = '') => `<span class="vz-op ${cls}">${VZ.esc(symbol)}</span>`;

    // ---------- Podświetlanie składni ----------
    // Fragmenty w {{klasa|tekst}} zostają owinięte w <mark class="klasa">, żeby można je było
    // podświetlać razem z krokiem. Np. 'CALCULATE([Sprzedaż], {{calc|Sprzedaz[Kolor] = "Czerwony"}})'
    const KEYWORDS = new Set(('CALCULATE CALCULATETABLE KEEPFILTERS REMOVEFILTERS ALL ALLEXCEPT ALLSELECTED ALLNOBLANKROW ' +
        'VALUES DISTINCT FILTER SUM SUMX AVERAGE AVERAGEX COUNTROWS COUNT MIN MAX MINX MAXX DIVIDE RELATED RELATEDTABLE ' +
        'USERELATIONSHIP CROSSFILTER TREATAS SELECTEDVALUE HASONEVALUE ISFILTERED ISINSCOPE RANKX TOPN ADDCOLUMNS SUMMARIZE ' +
        'SUMMARIZECOLUMNS DATESYTD DATESMTD DATEADD SAMEPERIODLASTYEAR TOTALYTD PARALLELPERIOD DATESINPERIOD DATESBETWEEN ' +
        'EARLIER VAR RETURN IF SWITCH TRUE FALSE BLANK AND OR NOT IN ' +
        'let in each if then else type and or not true false null').split(' '));

    // komentarz | tekst | Tabela[Kolumna] | [Miara] | liczba | słowo
    const TOKEN = /(--[^\n]*|\/\/[^\n]*)|("[^"\n]*")|((?:'[^'\n]*'|[\p{L}_][\p{L}\d_]*)\[[^\]\n]*\])|(\[[^\]\n]*\])|(\b\d+(?:[.,]\d+)?\b)|([\p{L}_][\p{L}\d_]*(?:\.[\p{L}_][\p{L}\d_]*)*)/gu;

    function highlightPlain(src) {
        let out = '';
        let last = 0;
        for (const m of src.matchAll(TOKEN)) {
            out += VZ.esc(src.slice(last, m.index));
            const t = VZ.esc(m[0]);
            if (m[1]) out += `<span class="c">${t}</span>`;
            else if (m[2]) out += src[m.index - 1] === '#' ? t : `<span class="s">${t}</span>`; // #"Nazwa kroku" to identyfikator
            else if (m[3]) out += t;
            else if (m[4]) out += `<span class="m">${t}</span>`;
            else if (m[5]) out += `<span class="n">${t}</span>`;
            else if (KEYWORDS.has(m[6]) || /^(Table|List|Text|Number|Date|DateTime|Record|JoinKind|Splitter|Combiner|Csv|File|Excel|Web|Sql|Json|Int64|Currency|Percentage|MissingField|QuoteStyle|GroupKind|Occurrence|Order|Value|Expression)\./.test(m[6])) out += `<span class="k">${t}</span>`;
            else out += t;
            last = m.index + m[0].length;
        }
        return out + VZ.esc(src.slice(last));
    }

    VZ.code = src => {
        const parts = [];
        let last = 0;
        const re = /\{\{(\w+)\|([\s\S]*?)\}\}/g;
        let m;
        while ((m = re.exec(src))) {
            parts.push(highlightPlain(src.slice(last, m.index)));
            parts.push(`<mark class="${m[1]}">${highlightPlain(m[2])}</mark>`);
            last = re.lastIndex;
        }
        parts.push(highlightPlain(src.slice(last)));
        return parts.join('');
    };

    // ---------- Zakładki ----------
    // items: [{ id, label }] ; onChange(id)
    VZ.tabs = (el, items, onChange, selected = items[0].id) => {
        el.classList.add('vz-tabs');
        el.setAttribute('role', 'tablist');
        el.innerHTML = items.map(it =>
            `<button type="button" class="vz-tab" role="tab" data-id="${it.id}" aria-selected="${it.id === selected}">${it.label}</button>`).join('');
        el.addEventListener('click', e => {
            const btn = e.target.closest('.vz-tab');
            if (!btn) return;
            el.querySelectorAll('.vz-tab').forEach(b => b.setAttribute('aria-selected', b === btn));
            onChange(btn.dataset.id);
        });
    };

    // ---------- Tabela danych ----------
    // opts: { columns: [{ key, label, num }], rows, state(row) -> '' | 'in' | 'in calc' | 'out' | 'current', total: key }
    VZ.table = (el, opts) => {
        const { columns, rows, state = () => '', total } = opts;
        const head = columns.map(c => `<th class="${c.num ? 'num' : ''}">${VZ.esc(c.label || c.key)}</th>`).join('');
        const body = rows.map(r => {
            const map = { in: 'is-in', out: 'is-out', current: 'is-current' };
            const fixed = (state(r) || '').split(' ').filter(Boolean).map(t => map[t] || t).join(' ');
            const cells = columns.map(c => {
                const v = r[c.key];
                const txt = c.format ? c.format(v, r) : (c.num ? VZ.fmt(v) : VZ.swatch(v) + VZ.esc(v));
                return `<td class="${c.num ? 'num' : ''}">${txt}</td>`;
            }).join('');
            return `<tr class="${fixed}">${cells}</tr>`;
        }).join('');
        let foot = '';
        if (total) {
            const inRows = rows.filter(r => /\bin\b|current/.test(state(r) || ''));
            foot = '<tfoot><tr>' + columns.map((c, i) => {
                if (c.key === total) return `<td class="num">${VZ.fmt(inRows.length ? VZ.sum(inRows, total) : null)}</td>`;
                return i === 0 ? '<td>Suma widocznych</td>' : '<td></td>';
            }).join('') + '</tr></tfoot>';
        }
        el.innerHTML = `<div class="vz-table-wrap"><table class="vz-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${foot}</table></div>`;
    };

    // ---------- Macierz ----------
    // opts: { rowField, colField, rowValues, colValues, value(ctx) -> number|null, base(ctx) -> number|null (opcjonalnie,
    //         pokazuje przekreśloną starą wartość gdy różna), selected: { r, c } (null = suma), onSelect({ r, c }) }
    VZ.matrix = (el, opts) => {
        const { rowField, colField, rowValues, colValues, value, base, selected, onSelect } = opts;
        const ctxOf = (r, c) => {
            const ctx = {};
            if (r !== null) ctx[rowField] = [r];
            if (c !== null) ctx[colField] = [c];
            return ctx;
        };
        const cols = [...colValues, null];
        const rowsAll = [...rowValues, null];
        const isSel = (r, c) => selected && selected.r === r && selected.c === c;
        const cell = (r, c) => {
            const ctx = ctxOf(r, c);
            const v = value(ctx);
            const b = base ? base(ctx) : v;
            const changed = base && b !== v;
            const cls = ['cell', v === null ? 'blank' : '', changed ? 'changed' : '', isSel(r, c) ? 'is-selected' : '', r === null || c === null ? 'total' : ''].join(' ');
            const was = changed ? `<span class="was">${VZ.fmt(b)}</span>` : '';
            return `<td class="${cls}" data-r="${r === null ? '' : VZ.esc(r)}" data-c="${c === null ? '' : VZ.esc(c)}" tabindex="0">${was}${v === null ? '' : VZ.fmt(v)}</td>`;
        };
        const head = `<tr><th class="corner">${VZ.esc(rowField)} ↓<br>${VZ.esc(colField)} →</th>` +
            cols.map(c => `<th class="${c === null ? 'total' : ''} ${selected && selected.c === c && c !== null ? 'is-hdr-on' : ''}">${c === null ? 'Suma' : VZ.swatch(c) + VZ.esc(c)}</th>`).join('') + '</tr>';
        const body = rowsAll.map(r =>
            `<tr class="${r === null ? 'total-row' : ''}"><th class="${r === null ? 'total' : ''} ${selected && selected.r === r && r !== null ? 'is-hdr-on' : ''}">${r === null ? 'Suma' : VZ.esc(r)}</th>` +
            cols.map(c => cell(r, c)).join('') + '</tr>').join('');
        el.innerHTML = `<div class="vz-table-wrap"><table class="vz-matrix"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
        const pick = td => onSelect && onSelect({ r: td.dataset.r || null, c: td.dataset.c || null });
        el.querySelectorAll('td.cell').forEach(td => {
            td.addEventListener('click', () => pick(td));
            td.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(td); } });
        });
    };

    // ---------- Kroki ----------
    // Odsłania kolejne .vz-step w kontenerze. mode: 'all' (szybko, jeden po drugim) | 'manual'
    VZ.reveal = (container, delay = 140) => {
        const steps = [...container.querySelectorAll('.vz-step')];
        steps.forEach(s => s.classList.add('is-pending'));
        steps.forEach((s, i) => setTimeout(() => s.classList.remove('is-pending'), 30 + i * delay));
    };

    // Ręczne przechodzenie krok po kroku: zwraca { next, prev, reset, index }
    VZ.stepper = (container, onStep) => {
        const steps = () => [...container.querySelectorAll('.vz-step')];
        let idx = -1;
        const apply = () => {
            steps().forEach((s, i) => {
                s.classList.toggle('is-pending', i > idx);
                s.classList.toggle('is-hidden', i > idx);
                s.classList.toggle('is-current', i === idx);
            });
            onStep && onStep(idx, steps().length);
        };
        return {
            start() { idx = 0; apply(); },
            next() { if (idx < steps().length - 1) { idx++; apply(); } },
            prev() { if (idx > 0) { idx--; apply(); } },
            showAll() { idx = steps().length - 1; apply(); steps().forEach(s => s.classList.remove('is-current', 'is-hidden')); },
            get index() { return idx; },
            get count() { return steps().length; },
        };
    };

    window.VZ = VZ;
})();
