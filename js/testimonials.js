// Testimonials: client feedback + mentoring (i18n via language.js "langchange")
function testimonialEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

function authorBlock(item, translated) {
    const author = testimonialEl('figcaption', 'testimonial-author', item.author);
    const details = [item.role, item.company, item.context, translated].filter(Boolean).join(' · ');
    if (details) author.appendChild(testimonialEl('span', 'testimonial-context', details));
    return author;
}

function clientCard(item, translated) {
    const card = testimonialEl('figure', 'testimonial-card testimonial-wide');

    if (item.logos?.length) {
        const logos = testimonialEl('div', 'testimonial-logos');
        item.logos.forEach(logo => {
            const img = testimonialEl('img');
            img.src = logo.src;
            img.alt = logo.alt;
            img.loading = 'lazy';
            logos.appendChild(img);
        });
        if (item.myRole) logos.appendChild(testimonialEl('span', 'testimonial-myrole', item.myRole));
        card.appendChild(logos);
    }

    if (item.highlights) {
        card.appendChild(testimonialEl('div', 'testimonial-highlights-title', item.title));
        if (item.intro) card.appendChild(testimonialEl('p', 'testimonial-intro', item.intro));
        const list = testimonialEl('ul', 'testimonial-highlights');
        item.highlights.forEach(h => list.appendChild(testimonialEl('li', null, h)));
        card.appendChild(list);
        if (item.context) card.appendChild(testimonialEl('span', 'testimonial-context', [item.context, translated].filter(Boolean).join(' · ')));
        return card;
    }

    const quote = testimonialEl('blockquote', 'testimonial-quote');
    (Array.isArray(item.quote) ? item.quote : [item.quote]).forEach(p => quote.appendChild(testimonialEl('p', null, p)));
    card.appendChild(quote);
    card.appendChild(authorBlock(item, translated));
    return card;
}

function mentoringCard(item, translated) {
    const card = testimonialEl('figure', 'testimonial-card');
    const quote = testimonialEl('blockquote', 'testimonial-quote');
    (Array.isArray(item.quote) ? item.quote : [item.quote]).forEach(p => quote.appendChild(testimonialEl('p', null, p)));
    card.appendChild(quote);
    card.appendChild(authorBlock(item, translated));
    return card;
}

function renderTestimonials(data) {
    const clients = document.getElementById('clientTestimonials');
    const mentoring = document.getElementById('mentoringTestimonials');
    if (!data || !clients || !mentoring) return;

    clients.replaceChildren(...(data.clients || []).map(item => clientCard(item, data.translated)));
    mentoring.replaceChildren(...(data.mentoring || []).map(item => mentoringCard(item, data.translated)));
}

document.addEventListener('langchange', (e) => renderTestimonials(e.detail.translations.testimonials));
