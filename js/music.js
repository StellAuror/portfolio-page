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
        audio.play();
        elements.forEach(el => {
            el.textContent = "⏸";
        }); 
        txt.forEach(el => {
            el.style.display = '';
        });
    }

    isPlaying = !isPlaying;
}


document.querySelectorAll('.copy-text').forEach(el => {
    el.addEventListener('click', () => {
        const text = el.textContent.trim();
        navigator.clipboard.writeText(text).then(() => {
            alert(`Copied "${text}" to clipboard`);
        });
    });
});

const popup = document.getElementById("ambient-popup");


function playAmbientFromPopup() {
    audio.play();
    toggleBtn.innerText = "Pause Music";
    popup.style.display = "none";
}

setTimeout(() => {
    popup.style.display = "flex";
}, 1500);

setTimeout(() => {
    popup.style.display = "none";
}, 9000);