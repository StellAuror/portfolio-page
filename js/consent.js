// Analytics with explicit consent.
// Google Analytics 4 is loaded ONLY after the visitor clicks "accept".
// Until then nothing is stored and nothing is sent; the choice can be changed anytime
// from the "Cookies" link in the sidebar.
const ANALYTICS_ID = 'G-FT6308LTGC'; // GA4 stream "MK Portfolio"
const CONSENT_KEY = 'cookieConsent'; // 'granted' | 'denied'

function readConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
}

function saveConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* storage unavailable */ }
}

let analyticsLoaded = false;

function loadAnalytics() {
    if (analyticsLoaded || !ANALYTICS_ID) return;
    analyticsLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ANALYTICS_ID, { anonymize_ip: true });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`;
    document.head.appendChild(script);

    // Count section switches as page views — the site is a single page
    document.addEventListener('sectionchange', e => {
        window.gtag('event', 'page_view', {
            page_title: e.detail.id,
            page_location: `${location.origin}${location.pathname}#${e.detail.id}`,
        });
    });
}

function removeAnalyticsCookies() {
    document.cookie.split(';').map(c => c.split('=')[0].trim())
        .filter(name => name === '_ga' || name.startsWith('_ga_') || name === '_gid')
        .forEach(name => {
            const domains = ['', location.hostname, '.' + location.hostname.replace(/^www\./, '')];
            domains.forEach(domain => {
                document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
            });
        });
}

const consentBanner = document.getElementById('cookie-consent');

function showConsentBanner() {
    if (!consentBanner) return;
    consentBanner.hidden = false;
    requestAnimationFrame(() => consentBanner.classList.add('visible'));
}

function hideConsentBanner() {
    if (!consentBanner) return;
    consentBanner.classList.remove('visible');
    setTimeout(() => { consentBanner.hidden = true; }, 300);
}

function setConsent(value) {
    saveConsent(value);
    hideConsentBanner();
    if (value === 'granted') {
        loadAnalytics();
    } else {
        removeAnalyticsCookies();
        if (analyticsLoaded && window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
    }
}

document.getElementById('cookie-accept')?.addEventListener('click', () => setConsent('granted'));
document.getElementById('cookie-decline')?.addEventListener('click', () => setConsent('denied'));
document.querySelectorAll('[data-cookie-settings]').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        showConsentBanner();
    });
});

const storedConsent = readConsent();
if (storedConsent === 'granted') {
    loadAnalytics();
} else if (!storedConsent) {
    // Give the page a moment first — the banner shouldn't be the first thing people see
    setTimeout(showConsentBanner, 2500);
}
