let stories = [];
let currentIndex = 0;
let autoPlayActive = true;
let autoPlayInterval;
let isAnimating = false;

// DOM elements
const grayscaleImage = document.querySelector('.grayscale-image');
const colorImage = document.querySelector('.color-image');
const storyImage = document.getElementById('story-image');
const storyTitle = document.getElementById('story-title');
const storyDescription = document.getElementById('story-description');
const currentNumber = document.getElementById('story-current-number');
const totalNumber = document.getElementById('story-total-number');
const autoPlayBtn = document.getElementById('story-auto-play-btn');
const autoPlayProgress = document.getElementById('story-auto-play-progress');
const progressIndicators = document.getElementById('story-progress-indicators');

Object.defineProperty(window, "currentLang", {
  get: () => _currentLang,
  set: async (value) => {
    _currentLang = value;
    await loadStories();       // <-- automatyczne przeładowanie stories
    showStory(0);              // <-- np. pokaż pierwszą po zmianie języka
  }
});

let _currentLang = "";
async function waitForLang() {
  while (!currentLang) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function loadStories() {
  const response = await fetch(`languages/${currentLang}.json`);
  const data = await response.json();
  stories = data.stories; 
}

async function initializeApp() {
    await waitForLang();             // <-- czekaj na currentLang
    await loadStories();


    totalNumber.textContent = stories.length.toString().padStart(2, '0');
    createProgressDots();
    startAutoPlay();
    addEventListeners();
    showStory(0);
}

function createProgressDots() {
    progressIndicators.innerHTML = '';
    stories.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'story-progress-dot';
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToStory(index));
        progressIndicators.appendChild(dot);
    });
}

function addEventListeners() {
    document.getElementById('story-prev-btn').addEventListener('click', prevStory);
    document.getElementById('story-next-btn').addEventListener('click', nextStory);
    autoPlayBtn.addEventListener('click', toggleAutoPlay);
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevStory();
        if (e.key === 'ArrowRight') nextStory();
        if (e.key === ' ') {
            e.preventDefault();
            toggleAutoPlay();
        }
    });
}
function triggerColorReveal() {
    if (!colorImage || !grayscaleImage) return;

    const dividerLine = document.getElementById('color-divider-line');
    if (!dividerLine) return;

    // Reset clip-path
    colorImage.classList.remove('revealing');
    colorImage.style.clipPath = 'inset(0 100% 0 0)';

    // Reset divider line – usuwamy transition tymczasowo
    dividerLine.style.transition = 'none';
    dividerLine.style.left = '0%';
    dividerLine.style.opacity = '1';

    //  Force reflow
    void dividerLine.offsetHeight;

    // Przywracamy transition po 1 klatce
    requestAnimationFrame(() => {
        dividerLine.style.transition = 'left 5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.5s ease 5s';
        colorImage.classList.add('revealing');
        dividerLine.style.left = '100%';
        dividerLine.style.opacity = '0';
    });
}


function showStory(index, direction = 'next') {
    if (isAnimating && autoPlayActive) return;

    
    isAnimating = true;
    const story = stories[index];
    
    // Update counter
    currentNumber.textContent = (index + 1).toString().padStart(2, '0');
    
    // Update progress dots
    updateProgressDots(index);
    
    // Fade out content
    storyTitle.classList.remove('visible');
    storyDescription.classList.remove('visible');
    
    // Update image with smooth transition
    setTimeout(() => {
        // Update legacy story image if it exists
        if (storyImage) {
            storyImage.src = story.image;
        }
        
        // Update both grayscale and color images for reveal effect
        if (grayscaleImage && colorImage) {
            grayscaleImage.src = story.image;
            colorImage.src = story.image;
            
            // Reset color reveal effect
            colorImage.classList.remove('revealing');
            colorImage.style.clipPath = 'inset(0 100% 0 0)';
        }
        
        storyTitle.textContent = story.title;
        storyDescription.textContent = story.description;
    }, 300);
    
    // Fade in content and start color reveal
    setTimeout(() => {
        storyTitle.classList.add('visible');
        storyDescription.classList.add('visible');
        
        // Start color reveal after content fades in
        if (grayscaleImage && colorImage) {
            setTimeout(() => {
                triggerColorReveal();
            }, 500);
        }
    }, 500);
    
    // Reset animation state
    setTimeout(() => {
        isAnimating = false;
    }, 1500);
}

function updateProgressDots(activeIndex) {
    const dots = progressIndicators.querySelectorAll('.story-progress-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === activeIndex);
    });
}

function nextStory() {
    if (isAnimating && autoPlayActive) return;
    currentIndex = (currentIndex + 1) % stories.length;
    showStory(currentIndex, 'next');
    resetAutoPlay();
}

function prevStory() {
    if (isAnimating) return;
    currentIndex = (currentIndex - 1 + stories.length) % stories.length;
    showStory(currentIndex, 'prev');
    resetAutoPlay();
}

function goToStory(index) {
    if (index !== currentIndex && !isAnimating) {
        currentIndex = index;
        showStory(currentIndex);
        resetAutoPlay();
    }
}

function startAutoPlay() {
    if (autoPlayActive) {
        autoPlayInterval = setInterval(nextStory, 12000);
        autoPlayProgress.classList.add('active');
    }
}

function stopAutoPlay() {
    clearInterval(autoPlayInterval);
    autoPlayProgress.classList.remove('active');
}

function resetAutoPlay() {
    if (autoPlayActive) {
        stopAutoPlay();
        startAutoPlay();
    }
}

function toggleAutoPlay() {
    autoPlayActive = !autoPlayActive;
    autoPlayBtn.classList.toggle('active', autoPlayActive);
    
    if (autoPlayActive) {
        startAutoPlay();
    } else {
        stopAutoPlay();
    }
}

// Initialize the application
initializeApp();
