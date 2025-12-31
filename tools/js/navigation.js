import { setCurrentPath, setSearchQuery, getElements, getFolders } from './state.js';
import { renderView } from './render.js';
import { addRecentFile } from './recentFiles.js';

// Navigate to folder
export function navigateToFolder(folder, skipHistory = false) {
    setCurrentPath([folder]);

    if (!skipHistory) {
        const state = { type: 'folder', folderName: folder.name };
        const url = `#folder=${encodeURIComponent(folder.name)}`;
        window.history.pushState(state, '', url);
    }

    renderView();

    // Trigger custom event for mobile nav
    document.dispatchEvent(new CustomEvent('navigationChanged'));
}

// Navigate to file
export function navigateToFile(folder, file, skipHistory = false) {
    const elements = getElements();
    setCurrentPath([folder, file]);
    setSearchQuery('');
    elements.searchInput.value = '';
    elements.searchBox.classList.remove('expanded');
    elements.searchSuggestions.classList.remove('active');

    // Add to recent files
    addRecentFile(folder, file);

    if (!skipHistory) {
        const state = {
            type: 'file',
            folderName: folder.name,
            fileName: file.name
        };
        const url = `#folder=${encodeURIComponent(folder.name)}&file=${encodeURIComponent(file.name)}`;
        window.history.pushState(state, '', url);
    }

    renderView();

    // Trigger custom event for mobile nav
    document.dispatchEvent(new CustomEvent('navigationChanged'));
}

// Navigate to root
export function navigateToRoot(skipHistory = false) {
    setCurrentPath([]);

    if (!skipHistory) {
        window.history.pushState({ type: 'root' }, '', '#');
    }

    renderView();

    // Trigger custom event for mobile nav
    document.dispatchEvent(new CustomEvent('navigationChanged'));
}

// Handle browser back/forward navigation
export function handlePopState(event) {
    if (!event.state) {
        // No state means initial page load or root
        setCurrentPath([]);
        renderView();
        return;
    }

    const folders = getFolders();

    if (event.state.type === 'root') {
        setCurrentPath([]);
        renderView();
    } else if (event.state.type === 'folder') {
        const folder = findFolderByName(folders, event.state.folderName);
        if (folder) {
            navigateToFolder(folder, true); // skipHistory = true to avoid creating new history entry
        }
    } else if (event.state.type === 'file') {
        const folder = findFolderByName(folders, event.state.folderName);
        if (folder) {
            const file = folder.files.find(f => f.name === event.state.fileName);
            if (file) {
                navigateToFile(folder, file, true); // skipHistory = true
            }
        }
    }
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

// Initialize browser navigation on page load
export function initializeBrowserNavigation() {
    // Set initial state
    window.history.replaceState({ type: 'root' }, '', '#');

    // Listen for popstate events (back/forward buttons)
    window.addEventListener('popstate', handlePopState);
}
