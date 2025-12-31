import { getFolders } from './state.js';
import { navigateToFolder, navigateToFile } from './navigation.js';
import { setSearchQuery, getElements } from './state.js';
import { renderView } from './render.js';

// Initialize welcome screen interactions
export function initializeWelcomeInteractions() {
    console.log('Initializing welcome interactions...');

    // Wait for explorer to be shown, then setup handlers
    waitForWelcomeContent();

    // Setup click handlers (for desktop)
    document.addEventListener('click', (e) => {
        const recentCard = e.target.closest('.recent-file-card');
        if (recentCard) {
            handleRecentFileClick(recentCard);
            return;
        }

        const folderCard = e.target.closest('.folder-map-card');
        if (folderCard) {
            handleFolderMapClick(folderCard);
            return;
        }

        const tagItem = e.target.closest('.tag-bubble');
        if (tagItem) {
            handleTagClick(tagItem);
            return;
        }

        const statCard = e.target.closest('.welcome-stat-card');
        if (statCard) {
            handleStatCardClick(statCard);
            return;
        }
    });
}

// Wait for welcome content to be rendered
function waitForWelcomeContent() {
    const checkWelcome = () => {
        const welcomeCards = document.querySelectorAll('.welcome-stat-card');
        if (welcomeCards.length > 0) {
            console.log('Welcome cards found, setting up touch handlers');
            setupTouchHandlers();
        } else {
            console.log('Welcome cards not found yet, checking again...');
            setTimeout(checkWelcome, 500);
        }
    };
    checkWelcome();
}

// Setup touch handlers for all interactive elements
function setupTouchHandlers() {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) {
        console.log('Content area not found!');
        return;
    }

    console.log('Setting up touch handlers on content area');

    let touchStartTime = 0;
    let startTarget = null;

    contentArea.addEventListener('touchstart', (e) => {
        touchStartTime = Date.now();
        startTarget = e.target;
        console.log('Touch start on content area, target:', e.target.className, 'tag?', e.target.closest('.tag-bubble'));
    }, { passive: true });

    contentArea.addEventListener('touchend', (e) => {
        const touchDuration = Date.now() - touchStartTime;
        console.log('Touch end - duration:', touchDuration, 'target:', startTarget?.className);

        // Only handle quick taps
        if (touchDuration > 300) {
            console.log('Touch too long, ignoring');
            return;
        }

        const target = startTarget;

        const statCard = target.closest('.welcome-stat-card');
        if (statCard) {
            console.log('Stat card tap detected!');
            e.preventDefault();
            handleStatCardClick(statCard);
            return;
        }

        const recentCard = target.closest('.recent-file-card');
        if (recentCard) {
            console.log('Recent card tap detected!');
            e.preventDefault();
            handleRecentFileClick(recentCard);
            return;
        }

        const folderCard = target.closest('.folder-map-card');
        if (folderCard) {
            console.log('Folder card tap detected!');
            e.preventDefault();
            handleFolderMapClick(folderCard);
            return;
        }

        const tagItem = target.closest('.tag-bubble');
        if (tagItem) {
            console.log('Tag tap detected!');
            e.preventDefault();
            handleTagClick(tagItem);
            return;
        }
    }, { passive: false }); // NOT passive so we can preventDefault
}

// Handle recent file click
function handleRecentFileClick(card) {
    const folderName = card.dataset.folder;
    const fileName = card.dataset.file;

    const folders = getFolders();
    const folder = findFolderByName(folders, folderName);

    if (folder) {
        const file = folder.files.find(f => f.name === fileName);
        if (file) {
            navigateToFile(folder, file);
        }
    }
}

// Handle folder map click
function handleFolderMapClick(card) {
    const folderName = card.dataset.folder;
    const folders = getFolders();
    const folder = folders.find(f => f.name === folderName);

    if (folder) {
        navigateToFolder(folder);

        // On mobile, open sidebar to show folder contents
        if (window.innerWidth <= 768) {
            // Import and call openSidebar from mobileNav
            import('./mobileNav.js').then(module => {
                if (module.openSidebar) {
                    module.openSidebar();
                }
            });
        }
    }
}

// Handle tag click - filter by tag
function handleTagClick(tagItem) {
    const tag = tagItem.dataset.tag;
    const elements = getElements();

    // Set search query to tag
    setSearchQuery(tag.toLowerCase());
    elements.searchInput.value = tag;
    elements.searchBox.classList.add('expanded');

    // Re-render to show filtered results
    renderView();

    // Scroll to sidebar to see results
    elements.sidebarContent.scrollIntoView({ behavior: 'smooth' });
}

// Handle stat card click - highlight corresponding section
function handleStatCardClick(card) {
    const label = card.querySelector('.welcome-stat-label')?.textContent;

    let sectionSelector;
    if (label === 'Kolekcje') {
        sectionSelector = '.folder-map-section';
    } else if (label === 'Zasoby') {
        sectionSelector = '.recent-files-section';
    } else if (label === 'Technologie') {
        sectionSelector = '.tag-cloud-section';
    }

    if (sectionSelector) {
        highlightSection(sectionSelector);
    }
}

// Highlight a section with animation
function highlightSection(selector) {
    const section = document.querySelector(selector);
    if (!section) return;

    // Add highlight class
    section.classList.add('section-highlight');

    // Scroll to section
    section.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Remove highlight after animation
    setTimeout(() => {
        section.classList.remove('section-highlight');
    }, 600);
}

// Helper function to find folder by name (including subfolders)
function findFolderByName(folders, name) {
    for (const folder of folders) {
        if (folder.name === name) {
            return folder;
        }
        if (folder.subfolders) {
            const found = findFolderByName(folder.subfolders, name);
            if (found) return found;
        }
    }
    return null;
}
