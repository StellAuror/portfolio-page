// Navigation functionality
const SECTION_IDS = ['about', 'journey', 'projects', 'skills', 'testimonials'];
window.activeSection = 'about';

function showSection(sectionId, linkElement) {
    const target = document.getElementById(sectionId);
    if (!target) return;

    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    target.classList.add('active');
    window.activeSection = sectionId;

    // Sync desktop and mobile navigation, whichever was clicked
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${sectionId}`);
    });

    const main = document.querySelector('.main-content');
    if (main) main.scrollTop = 0;

    if (history.replaceState) history.replaceState(null, '', `#${sectionId}`);

    if (window.innerWidth <= 1000) closeSidebar();

    document.dispatchEvent(new CustomEvent('sectionchange', { detail: { id: sectionId } }));
}

document.querySelectorAll('.nav-link, .mobile-nav-link[href^="#"]').forEach(link => {
    link.addEventListener('click', e => e.preventDefault());
});

// ---------- Mobile sidebar ----------
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('mobile-nav-item-toggle');

function openSidebar() {
    sidebar.classList.add('open');
    sidebarToggle?.querySelector('a')?.classList.add('active');
}

function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarToggle?.querySelector('a')?.classList.remove('active');
}

function toggleSidebar() {
    if (sidebar.classList.contains('open')) closeSidebar();
    else openSidebar();
}

// Close when tapping outside the sidebar or pressing Escape
document.addEventListener('click', e => {
    if (!sidebar.classList.contains('open')) return;
    if (sidebar.contains(e.target) || sidebarToggle?.contains(e.target)) return;
    closeSidebar();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSidebar();
});

// Edge swipe opens / swipe left closes — only from the screen edge,
// so horizontal scrolling inside the page never toggles the sidebar
let swipeStartX = null;
window.addEventListener('touchstart', e => {
    const x = e.touches[0].clientX;
    swipeStartX = (x < 24 || sidebar.classList.contains('open')) ? x : null;
}, { passive: true });

window.addEventListener('touchend', e => {
    if (swipeStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - swipeStartX;
    if (deltaX > 80) openSidebar();
    else if (deltaX < -80) closeSidebar();
    swipeStartX = null;
}, { passive: true });

window.addEventListener('resize', () => {
    if (window.innerWidth > 1000) closeSidebar();
});

// Deep links: open the section from the URL hash once sections are loaded
window.sectionsReady?.then(() => {
    const id = location.hash.slice(1);
    if (SECTION_IDS.includes(id) && id !== 'about') showSection(id);
});
