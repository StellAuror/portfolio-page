import { getFolders, getElements, getSearchQuery, setSearchQuery } from './state.js';
import { navigateToFolder, navigateToFile } from './navigation.js';
import { renderView } from './render.js';

// Update search suggestions based on query
export function updateSearchSuggestions() {
    const searchQuery = getSearchQuery();
    const elements = getElements();

    if (!searchQuery) {
        elements.searchSuggestions.classList.remove('active');
        return;
    }

    const allResults = [];
    const folders = getFolders();

    // Search in folders
    folders.forEach(folder => {
        if (folder.name.toLowerCase().includes(searchQuery) ||
            folder.description.toLowerCase().includes(searchQuery) ||
            folder.tags.some(tag => tag.toLowerCase().includes(searchQuery))) {
            allResults.push({
                type: 'folder',
                name: folder.name,
                description: folder.description,
                path: folder.name,
                folder: folder
            });
        }

        // Search in files within folders
        folder.files.forEach(file => {
            if (file.name.toLowerCase().includes(searchQuery) ||
                file.description.toLowerCase().includes(searchQuery) ||
                file.tags.some(tag => tag.toLowerCase().includes(searchQuery))) {
                allResults.push({
                    type: 'file',
                    name: file.name,
                    description: file.description,
                    path: `${folder.name} / ${file.name}`,
                    folder: folder,
                    file: file
                });
            }
        });
    });

    if (allResults.length === 0) {
        elements.searchSuggestions.classList.remove('active');
        return;
    }

    // Limit to 8 results
    const limitedResults = allResults.slice(0, 8);

    elements.searchSuggestions.innerHTML = limitedResults.map(result => `
        <div class="search-suggestion-item" data-type="${result.type}" data-folder="${result.folder.name}" ${result.file ? `data-file="${result.file.name}"` : ''}>
            <div class="search-suggestion-name">${result.name}</div>
            <div class="search-suggestion-desc">${result.description}</div>
            <div class="search-suggestion-path">${result.path}</div>
        </div>
    `).join('');

    elements.searchSuggestions.classList.add('active');

    // Add click handlers
    elements.searchSuggestions.querySelectorAll('.search-suggestion-item').forEach((item, index) => {
        item.addEventListener('click', () => {
            const result = limitedResults[index];
            elements.searchSuggestions.classList.remove('active');
            elements.searchInput.value = '';
            setSearchQuery('');

            if (result.type === 'folder') {
                navigateToFolder(result.folder);
            } else {
                navigateToFile(result.folder, result.file);
            }
        });
    });
}

// Initialize search event listeners
export function initializeSearch() {
    const elements = getElements();

    // Toggle search box expansion on hover
    elements.searchBox.addEventListener('mouseenter', () => {
        elements.searchBox.classList.add('expanded');
    });

    elements.searchBox.addEventListener('mouseleave', () => {
        // Delay to allow clicking on suggestions
        setTimeout(() => {
            if (!getSearchQuery() && !elements.searchInput.matches(':focus')) {
                elements.searchBox.classList.remove('expanded');
            }
        }, 200);
    });

    elements.searchInput.addEventListener('input', (e) => {
        setSearchQuery(e.target.value.toLowerCase().trim());
        updateSearchSuggestions();
        renderView();
    });

    elements.searchInput.addEventListener('focus', () => {
        elements.searchBox.classList.add('expanded');
        if (getSearchQuery()) {
            updateSearchSuggestions();
        }
    });

    elements.searchInput.addEventListener('blur', () => {
        // Delay to allow clicking on suggestions
        setTimeout(() => {
            if (!getSearchQuery() && !elements.searchSuggestions.matches(':hover')) {
                elements.searchBox.classList.remove('expanded');
            }
        }, 200);
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            elements.searchSuggestions.classList.remove('active');
            if (!getSearchQuery()) {
                elements.searchBox.classList.remove('expanded');
            }
        }
    });
}
