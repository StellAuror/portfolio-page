// Music button feature
let isPlaying = false;
let audio = null;

function toggleMusic() {
    const elements = document.querySelectorAll('.music-toggle');
    const txt = document.querySelectorAll('#musicVisualizer');
    if (!audio) {
        audio = new Audio("static/dawnofchange.mp3"); 
        audio.loop = true;
    }

    if (isPlaying) {
        audio.pause();
        elements.forEach(el => {
            el.textContent = "▶";
        }); 
        txt.forEach(el => {
            el.style.display = 'none';
        });
    } else {
        audio.play().catch(() => {});
        elements.forEach(el => {
            el.textContent = "⏸";
        }); 
        txt.forEach(el => {
            el.style.display = '';
        });
    }

    isPlaying = !isPlaying;
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

// Ambient music hint — shown once per visit
const popup = document.getElementById("ambient-popup");
let popupSeen = false;
try { popupSeen = sessionStorage.getItem('ambientPopupSeen') === '1'; } catch (e) { /* ignore */ }

if (popup && !popupSeen) {
    setTimeout(() => { if (!isPlaying) popup.style.display = "flex"; }, 1500);
    setTimeout(() => { popup.style.display = "none"; }, 9000);
    try { sessionStorage.setItem('ambientPopupSeen', '1'); } catch (e) { /* ignore */ }
}

document.querySelector('.music-control')?.addEventListener('click', () => {
    if (popup) popup.style.display = 'none';
});
