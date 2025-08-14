window.timelineData = [];
let currentIdx = 0;
let currentLang = 'en'; 
let __timelineInitialized = false;

// Function to fetch data from language-specific JSON file
async function fetchTimelineData(lang = 'en') {
    try {
        const response = await fetch(`languages/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${lang}.json: ${response.status}`);
        }
        const data = await response.json();
        return data.timelineData || data || []; // Handle different JSON structures
    } catch (error) {
        console.error(`Error loading timeline data for language ${lang}:`, error);
        // Fallback to English if current language fails
        if (lang !== 'en') {
            console.log('Falling back to English...');
            return fetchTimelineData('en');
        }
        return []; // Return empty array if all else fails
    }
}

// Function to update language and refresh timeline
async function setLanguage(newLang) {
    if (newLang === currentLang) return; // No change needed
    
    console.log(`Changing language from ${currentLang} to ${newLang}`);
    currentLang = newLang;
    
    // Show loading state (optional)
    const container = document.getElementById('timeline-items');
    const leftContent = document.getElementById('timeline-left-content');
    const rightContent = document.getElementById('timeline-right-content');
    
    if (container) container.innerHTML = '<div class="timeline-loading">Loading...</div>';
    if (leftContent) leftContent.innerHTML = '<div class="fade-in">Loading...</div>';
    if (rightContent) rightContent.innerHTML = '<div class="timeline-slide-in">Loading...</div>';
    
    try {
        // Fetch new data
        window.timelineData = await fetchTimelineData(newLang);
        
        // Reset current index
        currentIdx = 0;
        
        // Re-render timeline with new data
        if (window.timelineData.length > 0) {
            renderTimeline();
            showEvent(0);
        } else {
            console.warn(`No timeline data available for language: ${newLang}`);
            if (container) container.innerHTML = '<div class="timeline-error">No data available</div>';
        }
    } catch (error) {
        console.error('Error updating timeline language:', error);
        if (container) container.innerHTML = '<div class="timeline-error">Error loading data</div>';
    }
}

// Initialize timeline with current language
async function init() {
    // Fetch initial data
    window.timelineData = await fetchTimelineData(currentLang);
    
    // Wait few seconds to ensure all elements are ok
    setTimeout(() => {
        if (!document.getElementById('journey')) return;
        if (document.querySelector('.timeline-wrapper')?.clientWidth === 0) {
            console.warn('Timeline wrapper width is 0, waiting for ResizeObserver...');
            return;
        }
        if (window.timelineData.length > 0) {
            renderTimeline();
            showEvent(0);
        }
    }, 500);
    
    if (window.timelineData.length > 0) {
        renderTimeline();
        showEvent(0);
        setupEventListeners();
    }
}

function renderTimeline() {
    const container = document.getElementById('timeline-items');
    const timeline = document.querySelector('.timeline');
    const wrapper = document.querySelector('.timeline-wrapper');
    if (!container || !timeline || !wrapper) return;

    // Remove old elements from axis (keep only container)
    [...timeline.children].forEach(child => {
        if (child.id !== 'timeline-items') {
            timeline.removeChild(child);
        }
    });

    // Clear container from events (important for re-rendering)
    container.innerHTML = '';

    const wrapperWidth = wrapper.clientWidth;
    const padding = 120;
    const blockWidth = 120;
    const minSpacing = 140;
    const timelineWidth = Math.max(wrapperWidth - padding, (Array.isArray(timelineData) ? timelineData.length : 0) * minSpacing);

    if (!Array.isArray(timelineData) || timelineData.length === 0) {
        timeline.style.minWidth = (timelineWidth + padding) + 'px';
        setupTouchGestures();
        return;
    }

    // Assume timelineData[i].date is a number like 2020.5 (year + fraction)
    const startValue = Math.min(...timelineData.map(item => Number(item.date)));
    const endValue = Math.max(...timelineData.map(item => Number(item.date)));
    const valueRange = endValue - startValue;

    timeline.style.minWidth = (timelineWidth + padding) + 'px';

    // Axis
    const axis = document.createElement('div');
    axis.className = 'timeline-axis';
    timeline.appendChild(axis);

    // Draw tick and label only for events
    timelineData.forEach((item, index) => {
        const dateNum = Number(item.date);
        const year = Math.floor(dateNum);
        const fraction = dateNum - year;

        // Map fraction to month
        let month = Math.round(fraction * 12);
        if (month <= 0) month = 1;
        if (month > 12) month = 12;

        const relativePosition = valueRange > 0
            ? (dateNum - startValue) / valueRange
            : (timelineData.length > 1 ? index / (timelineData.length - 1) : 0.5);

        const leftPosition = padding / 2 + (relativePosition * timelineWidth);

        // Tick
        const tick = document.createElement('div');
        tick.className = 'timeline-tick';
        tick.style.left = leftPosition + 'px';
        timeline.appendChild(tick);

        // Label (YYYY-MM)
        const label = document.createElement('div');
        label.className = 'timeline-label';
        label.style.left = leftPosition + 'px';
        label.textContent = `${year}-${String(month).padStart(2, '0')}`;
        timeline.appendChild(label);

        // Event block (placed above axis)
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.dataset.index = index;
        timelineItem.style.left = (leftPosition - blockWidth / 2) + 'px';

        const shortDesc = item.description
            ? (item.description.length > 100 ? item.description.substring(0, 100) + '...' : item.description)
            : '';

        timelineItem.innerHTML = `
            <div class="timeline-block">
                <div class="timeline-block-title">${item.title || ''}</div>
                <div class="timeline-block-desc">${shortDesc}</div>
                <div class="timeline-connector"></div>
                <div class="timeline-point"></div>
            </div>
        `;

        timelineItem.addEventListener('click', () => showEvent(index));
        container.appendChild(timelineItem);
    });

    setupTouchGestures();
}

function showEvent(index) {
    if (!Array.isArray(window.timelineData) || timelineData.length === 0) return;
    if (index < 0 || index >= timelineData.length) return;
    
    currentIdx = index;
    const event = timelineData[index];

    document.querySelectorAll('.timeline-item').forEach((item, i) => {
        item.classList.toggle('timeline-active', i === index);
    });

    const leftContent = document.getElementById('timeline-left-content');
    leftContent.innerHTML = `
        <div class="fade-in">
            ${event.media ? `<img src="${event.media}" alt="${event.title}" class="timeline-event-media">` : ''}
        </div>
    `;

    const rightContent = document.getElementById('timeline-right-content');
    rightContent.innerHTML = `
        <div class="timeline-slide-in">
            <div class="timeline-event-year">${event.date_full}</div>
            <h1 class="timeline-event-title">${event.title}</h1>
            <p class="timeline-event-description">${event.description}</p>

            <div class="timeline-event-tags">
                ${event.tags.map(tag => `<span class="timeline-tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;

    document.getElementById('timeline-next-btn').disabled = index === 0;
    document.getElementById('timeline-prev-btn').disabled = index === timelineData.length - 1;

    // Call improved auto-scroll function
    autoScrollToActiveItem();
}

// IMPROVED AUTO-SCROLL FUNCTION
function autoScrollToActiveItem() {
    const activeItem = document.querySelector('.timeline-item.timeline-active');
    const wrapper = document.querySelector('.timeline-wrapper');
    
    if (!activeItem || !wrapper) {
        console.warn('Cannot find active item or timeline wrapper');
        return;
    }

    const wrapperWidth = wrapper.clientWidth;
    const timeline = wrapper.querySelector('.timeline');
    const timelineWidth = timeline ? timeline.scrollWidth : 0;
    
    // Position of active item relative to timeline
    const itemLeft = activeItem.offsetLeft;
    const itemWidth = activeItem.offsetWidth;
    const itemCenter = itemLeft + (itemWidth / 2);
    
    // Calculate target scroll position (center the item)
    let targetScrollLeft = itemCenter - (wrapperWidth / 2);
    
    // Maximum scroll position (cannot scroll beyond content)
    const maxScrollLeft = Math.max(0, timelineWidth - wrapperWidth);
    
    // Apply constraints:
    // - for extreme items scroll maximally to edge
    // - cannot extend axis range
    if (targetScrollLeft < 0) {
        targetScrollLeft = 0; // Maximum to left edge
    } else if (targetScrollLeft > maxScrollLeft) {
        targetScrollLeft = maxScrollLeft; // Maximum to right edge
    }
    
    // Smooth scroll to calculated position
    wrapper.scrollTo({ 
        left: targetScrollLeft, 
        behavior: 'smooth' 
    });
}

// OLD FUNCTION - KEPT FOR BACKWARD COMPATIBILITY
function scrollToActiveItem() {
    // Redirect to new improved function
    autoScrollToActiveItem();
}

function setupTouchGestures() {
    const wrapper = document.querySelector('.timeline-wrapper');
    if (!wrapper) return;
    
    let startX = 0;
    let startTime = 0;
    let isScrolling = false;

    wrapper.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startTime = Date.now();
        isScrolling = false;
    }, { passive: true });

    wrapper.addEventListener('touchmove', () => {
        isScrolling = true;
    }, { passive: true });

    wrapper.addEventListener('touchend', (e) => {
        if (isScrolling) return;
        const endX = e.changedTouches[0].clientX;
        const endTime = Date.now();
        const deltaX = startX - endX;
        const deltaTime = endTime - startTime;
        if (Math.abs(deltaX) > 50 && deltaTime < 300) {
            if (deltaX > 0 && currentIdx < timelineData.length - 1) {
                showEvent(currentIdx + 1);
            } else if (deltaX < 0 && currentIdx > 0) {
                showEvent(currentIdx - 1);
            }
        }
    }, { passive: true });
}

function setupEventListeners() {
    const nextBtn = document.getElementById('timeline-next-btn');
    const prevBtn = document.getElementById('timeline-prev-btn');
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentIdx > 0) showEvent(currentIdx - 1);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentIdx < timelineData.length - 1) showEvent(currentIdx + 1);
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && currentIdx > 0) showEvent(currentIdx - 1);
        else if (e.key === 'ArrowRight' && currentIdx < timelineData.length - 1) showEvent(currentIdx + 1);
    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const container = document.getElementById('timeline-items');
            if (container) container.innerHTML = '';
            renderTimeline();
            showEvent(currentIdx);
        }, 250);
    });
}

async function tryInitTimeline() {
    if (__timelineInitialized) return false;

    const journey = document.getElementById('journey');
    if (!journey) return false;

    const wrapper = journey.querySelector('.timeline-wrapper');
    const container = journey.querySelector('#timeline-items');
    const timelineEl = journey.querySelector('.timeline');

    if (!wrapper || !container || !timelineEl) return false;

    // If wrapper exists but is invisible / has width 0 -> wait for ResizeObserver
    if (wrapper.clientWidth === 0) {
        const ro = new ResizeObserver(() => {
            if (wrapper.clientWidth > 0) {
                ro.disconnect();
                init();
                __timelineInitialized = true;
            }
        });
        ro.observe(wrapper);
        return true;
    }

    // Everything ready -> initialize
    await init();
    __timelineInitialized = true;
    return true;
}

// Watch for currentLang changes (multiple methods)
let lastKnownLang = currentLang;

function watchLanguageChanges() {
    if (window.currentLang && window.currentLang !== lastKnownLang) {
        lastKnownLang = window.currentLang;
        currentLang = window.currentLang;
        setLanguage(currentLang);
    }
}

// Method 1: Check for language changes every 500ms
setInterval(watchLanguageChanges, 500);

// Method 2: Override the global changeLang function if it exists
const originalChangeLang = window.changeLang;
window.changeLang = function(newLang) {
    // Call original function if it exists
    if (originalChangeLang && typeof originalChangeLang === 'function') {
        originalChangeLang(newLang);
    }
    
    // Update timeline language
    if (newLang !== currentLang) {
        setLanguage(newLang);
    }
};

// Method 3: Listen for custom events
document.addEventListener('languageChange', (event) => {
    if (event.detail && event.detail.language) {
        setLanguage(event.detail.language);
    }
});

// Method 4: Listen for clicks on language switcher buttons
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('lang-switcher-switch')) {
        const newLang = event.target.dataset.lang;
        if (newLang && newLang !== currentLang) {
            setLanguage(newLang);
        }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    if (await tryInitTimeline()) return;

    // DOM observer (triggers when #journey or its content is added)
    const mo = new MutationObserver(async (mutations, observer) => {
        if (await tryInitTimeline()) observer.disconnect();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Fallback — after 10s try once more (without loops)
    setTimeout(async () => {
        if (!__timelineInitialized) await tryInitTimeline();
    }, 10000);
});

// Expose setLanguage function globally for external use
window.setTimelineLanguage = setLanguage;