import { getFolders } from './state.js';
import { navigateToFolder, navigateToFile } from './navigation.js';
import { setSearchQuery, getElements } from './state.js';
import { renderView } from './render.js';

// Initialize welcome screen interactions
export function initializeWelcomeInteractions() {
    // Recent files click handler
    document.addEventListener('click', (e) => {
        const recentCard = e.target.closest('.recent-file-card');
        if (recentCard) {
            handleRecentFileClick(recentCard);
        }

        // Folder map click handler
        const folderCard = e.target.closest('.folder-map-card');
        if (folderCard) {
            handleFolderMapClick(folderCard);
        }

        // Tag cloud click handler
        const tagItem = e.target.closest('.tag-bubble, .tag-cloud-item');
        if (tagItem) {
            handleTagClick(tagItem);
        }

        // Stats card click handler
        const statCard = e.target.closest('.welcome-stat-card');
        if (statCard) {
            handleStatCardClick(statCard);
        }
    });
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
