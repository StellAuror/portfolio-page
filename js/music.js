// Music button: a quiet play / pause toggle
let isPlaying = false;
let audio = null;

function toggleMusic() {
    const button = document.getElementById('musicToggle');
    if (!audio) {
        audio = new Audio("static/dawnofchange.mp3");
        audio.loop = true;
    }

    if (isPlaying) audio.pause();
    else audio.play().catch(() => {});

    isPlaying = !isPlaying;
    button?.classList.toggle('playing', isPlaying);
    button?.setAttribute('aria-pressed', String(isPlaying));
}


// Copy contact details with a small inline confirmation instead of alert()
function copyContact(el) {
    const text = el.dataset.value || el.textContent.trim();
    el.dataset.value = text;
    navigator.clipboard?.writeText(text).then(() => {
        el.textContent = window.translations?.music?.copied || 'Copied';
        el.classList.add('copied');
        setTimeout(() => {
            el.textContent = text;
            el.classList.remove('copied');
        }, 1400);
    }).catch(() => {});
}

document.querySelectorAll('.copy-text').forEach(el => {
    el.addEventListener('click', () => copyContact(el));
    el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            copyContact(el);
        }
    });
});
