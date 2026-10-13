// Cookie-free visit counting with GoatCounter (https://www.goatcounter.com).
// No cookies, no local storage, no personal data — so it runs for every visitor,
// independently of the consent given for Google Analytics.
// Reports: visits, sections, referrers, browsers, countries and regions.
const GOATCOUNTER_CODE = 'mkportfolio'; // panel: https://mkportfolio.goatcounter.com

(function () {
    if (!GOATCOUNTER_CODE) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://gc.zgo.at/count.js';
    script.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
    document.head.appendChild(script);

    // The site is a single page: count every section switch as its own page ("/#journey", "/#projects"...)
    document.addEventListener('sectionchange', e => {
        if (!window.goatcounter || !window.goatcounter.count) return;
        window.goatcounter.count({
            path: `${location.pathname}#${e.detail.id}`,
            title: e.detail.id,
        });
    });
})();
