import { getFolders, getCurrentPath, getSearchQuery, getElements } from './state.js';
import { navigateToFolder, navigateToFile, navigateToRoot } from './navigation.js';
import { createRepoCard, createWelcomeScreen, createFolderDescription, createFilePreview, updateBreadcrumb } from './components.js';
import { passesDateFilter } from './dateFilter.js';

// Render current view
export function renderView() {
    const currentPath = getCurrentPath();

    if (currentPath.length === 0) {
        renderRootView();
    } else if (currentPath.length === 1) {
        renderFolderView(currentPath[0]);
    } else if (currentPath.length === 2) {
        renderFolderView(currentPath[0], true);
        renderFileView(currentPath[0], currentPath[1]);
    }
    updateBreadcrumbView();
}

// Render root view (folders)
function renderRootView() {
    const elements = getElements();
    const searchQuery = getSearchQuery();
    const folders = getFolders();

    elements.sidebarContent.innerHTML = '';

    let sortedFolders = [...folders];

    if (searchQuery) {
        // Separate matching and non-matching folders
        const matching = [];
        const nonMatching = [];

        folders.forEach(folder => {
            // Check folder itself
            const folderMatches = folder.name.toLowerCase().includes(searchQuery) ||
                folder.description.toLowerCase().includes(searchQuery) ||
                folder.tags.some(tag => tag.toLowerCase().includes(searchQuery));

            // Check files inside folder (deep search)
            const hasMatchingFile = folder.files.some(file =>
                file.name.toLowerCase().includes(searchQuery) ||
                file.description.toLowerCase().includes(searchQuery) ||
                file.tags.some(tag => tag.toLowerCase().includes(searchQuery))
            );

            if (folderMatches || hasMatchingFile) {
                matching.push(folder);
            } else {
                nonMatching.push(folder);
            }
        });

        // Matching folders first, then non-matching
        sortedFolders = [...matching, ...nonMatching];
    }

    sortedFolders.forEach(folder => {
        const card = createRepoCard(folder, 'folder');

        // Add highlight only to matching folders
        if (searchQuery) {
            // Check folder itself
            const folderMatches = folder.name.toLowerCase().includes(searchQuery) ||
                folder.description.toLowerCase().includes(searchQuery) ||
                folder.tags.some(tag => tag.toLowerCase().includes(searchQuery));

            // Check files inside folder (deep search)
            const hasMatchingFile = folder.files.some(file =>
                file.name.toLowerCase().includes(searchQuery) ||
                file.description.toLowerCase().includes(searchQuery) ||
                file.tags.some(tag => tag.toLowerCase().includes(searchQuery))
            );

            if (folderMatches || hasMatchingFile) {
                card.classList.add('search-highlight');
            }
        }

        card.addEventListener('click', () => navigateToFolder(folder));
        elements.sidebarContent.appendChild(card);
    });

    showWelcomeScreen();
}

// Render folder view (subfolders and files)
function renderFolderView(folder, skipContentArea = false) {
    const elements = getElements();
    const searchQuery = getSearchQuery();
    const currentPath = getCurrentPath();

    elements.sidebarContent.innerHTML = '';

    // First render subfolders
    if (folder.subfolders && folder.subfolders.length > 0) {
        folder.subfolders.forEach(subfolder => {
            const card = createRepoCard(subfolder, 'folder');

            if (searchQuery) {
                const folderMatches = subfolder.name.toLowerCase().includes(searchQuery) ||
                    subfolder.description.toLowerCase().includes(searchQuery) ||
                    subfolder.tags.some(tag => tag.toLowerCase().includes(searchQuery));

                if (folderMatches) {
                    card.classList.add('search-highlight');
                }
            }

            card.addEventListener('click', () => navigateToFolder(subfolder));
            elements.sidebarContent.appendChild(card);
        });
    }

    // Then render files
    let sortedFiles = [...folder.files];

    if (searchQuery) {
        // Separate matching and non-matching files
        const matching = [];
        const nonMatching = [];

        folder.files.forEach(file => {
            const matches = file.name.toLowerCase().includes(searchQuery) ||
                file.description.toLowerCase().includes(searchQuery) ||
                file.tags.some(tag => tag.toLowerCase().includes(searchQuery));

            if (matches) {
                matching.push(file);
            } else {
                nonMatching.push(file);
            }
        });

        // Matching files first, then non-matching
        sortedFiles = [...matching, ...nonMatching];
    }

    sortedFiles.forEach(file => {
        // Apply date filter
        if (!passesDateFilter(file)) {
            return; // Skip files outside date range
        }

        const card = createRepoCard(file, 'file');

        // Add highlight only to matching files
        if (searchQuery) {
            const matches = file.name.toLowerCase().includes(searchQuery) ||
                file.description.toLowerCase().includes(searchQuery) ||
                file.tags.some(tag => tag.toLowerCase().includes(searchQuery));

            if (matches) {
                card.classList.add('search-highlight');
            }
        }

        // Mark active file
        if (currentPath.length === 2 && currentPath[1] === file) {
            card.classList.add('active');
        }

        card.addEventListener('click', () => navigateToFile(folder, file));
        elements.sidebarContent.appendChild(card);
    });

    // Only show folder description if not viewing a file
    if (!skipContentArea) {
        showFolderDescription(folder);
    }
}

// Render file view
function renderFileView(folder, file) {
    const elements = getElements();
    elements.contentArea.innerHTML = createFilePreview(folder, file);
}

// Show welcome screen
function showWelcomeScreen() {
    const elements = getElements();
    const folders = getFolders();
    elements.contentArea.innerHTML = createWelcomeScreen(folders);
}

// Show folder description
function showFolderDescription(folder) {
    const elements = getElements();
    elements.contentArea.innerHTML = createFolderDescription(folder);
}

// Update breadcrumb
function updateBreadcrumbView() {
    const currentPath = getCurrentPath();

    updateBreadcrumb(currentPath, (action) => {
        if (action === 'root') {
            navigateToRoot();
        } else if (action === 'folder') {
            navigateToFolder(currentPath[0]);
        }
    });
}
