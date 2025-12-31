import { TAG_CONFIG, ICONS } from './config.js';
import { navigateToFile } from './navigation.js';
import { getRecentFiles, getTimeAgo } from './recentFiles.js';

// Create repository card
export function createRepoCard(item, type) {
    const card = document.createElement('div');
    card.className = 'repo-card';

    const icon = type === 'folder' ? ICONS.folder : ICONS.file;
    const iconClass = type === 'folder' ? 'folder' : 'file';

    // Format date if available
    const formattedDate = item.createdDate ? formatDate(item.createdDate) : '';

    card.innerHTML = `
        <div class="repo-header">
            <div class="repo-icon ${iconClass}">
                ${icon}
            </div>
            <div class="repo-info">
                <div class="repo-name">${item.name}</div>
                <div class="repo-description">${item.description}</div>
                ${item.tags ? `
                    <div class="repo-tags">
                        ${item.tags.map(tag => {
                            const tagConfig = TAG_CONFIG[tag] || { dot: 'html', label: tag };
                            return `
                                <span class="tag">
                                    <span class="tag-dot ${tagConfig.dot}"></span>
                                    ${tagConfig.label}
                                </span>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
        ${formattedDate ? `<div class="repo-date">${formattedDate}</div>` : ''}
    `;

    return card;
}

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// Create welcome screen
export function createWelcomeScreen(folders) {
    const totalFiles = folders.reduce((sum, folder) => sum + folder.files.length, 0);
    const recentFiles = getRecentFiles();

    // Collect all tags from all folders and files
    const allTags = new Map();
    folders.forEach(folder => {
        // Count folder tags
        folder.tags?.forEach(tag => {
            allTags.set(tag, (allTags.get(tag) || 0) + 1);
        });
        // Count file tags
        folder.files.forEach(file => {
            file.tags?.forEach(tag => {
                allTags.set(tag, (allTags.get(tag) || 0) + 1);
            });
        });
    });

    // Sort tags by frequency
    const sortedTags = Array.from(allTags.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15); // Top 15 tags

    // Generate recent files HTML
    const recentFilesHTML = recentFiles.length > 0 ? `
        <div class="recent-files-section">
            <div class="section-header">
                <div class="section-icon-wrapper">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"></path>
                    </svg>
                </div>
                <div>
                    <h2>Kontynuuj naukę</h2>
                    <p class="section-subtitle">Wróć do materiałów, które przeglądałeś ostatnio</p>
                </div>
            </div>
            <div class="recent-files-grid">
                ${recentFiles.map(rf => `
                    <div class="recent-file-card" data-folder="${rf.folderName}" data-file="${rf.fileName}">
                        <div class="recent-file-icon">
                            ${ICONS.file}
                        </div>
                        <div class="recent-file-info">
                            <div class="recent-file-name">${rf.fileName}</div>
                            <div class="recent-file-folder">${rf.folderName}</div>
                            <div class="recent-file-time">${getTimeAgo(rf.timestamp)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    // Generate folder map HTML
    const folderMapHTML = `
        <div class="folder-map-section">
            <div class="section-header">
                <div class="section-icon-wrapper">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M.513 1.513A1.75 1.75 0 0 1 1.75 1h3.5c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 0 0 .2.1h6.5a.25.25 0 0 0 .25-.25v-.5a.75.75 0 0 1 1.5 0v.5c0 .966-.784 1.75-1.75 1.75h-6.5c-.55 0-1.07-.26-1.4-.7l-.9-1.2a.25.25 0 0 0-.2-.1h-3.5a.25.25 0 0 0-.25.25v11.5c0 .138.112.25.25.25h13.5a.25.25 0 0 0 .25-.25V6.5a.75.75 0 0 1 1.5 0v7.75A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25V2.75c0-.464.184-.91.513-1.237Z"></path>
                    </svg>
                </div>
                <div>
                    <h2>Eksploruj kolekcje</h2>
                    <p class="section-subtitle">Szybki dostęp do wszystkich kategorii materiałów</p>
                </div>
            </div>
            <div class="folder-map-grid">
                ${folders.map(folder => {
                    const subfolderCount = folder.subfolders ? folder.subfolders.length : 0;
                    const fileText = folder.files.length === 1 ? 'plik' :
                                    (folder.files.length >= 2 && folder.files.length <= 4) ? 'pliki' : 'plików';
                    const subfolderText = subfolderCount > 0 ?
                        ` • ${subfolderCount} ${subfolderCount === 1 ? 'podfolder' :
                        (subfolderCount >= 2 && subfolderCount <= 4) ? 'podfoldery' : 'podfolderów'}` : '';

                    return `
                        <div class="folder-map-card" data-folder="${folder.name}">
                            <div class="folder-map-icon">
                                ${ICONS.folder}
                            </div>
                            <div class="folder-map-info">
                                <div class="folder-map-name">${folder.name}</div>
                                <div class="folder-map-count">${folder.files.length} ${fileText}${subfolderText}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    // Generate tag cloud HTML - completely redesigned
    const tagCloudHTML = sortedTags.length > 0 ? `
        <div class="tag-cloud-section">
            <div class="section-header">
                <div class="section-icon-wrapper">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"></path>
                    </svg>
                </div>
                <div>
                    <h2>Tematy i technologie</h2>
                    <p class="section-subtitle">Kliknij tag, aby znaleźć wszystkie powiązane materiały</p>
                </div>
            </div>
            <div class="tag-cloud-wrapper">
                ${sortedTags.map(([tag, count], index) => {
                    const tagConfig = TAG_CONFIG[tag] || { dot: 'html', label: tag };
                    const maxCount = Math.max(...sortedTags.map(t => t[1]));
                    const minCount = Math.min(...sortedTags.map(t => t[1]));
                    const range = maxCount - minCount || 1;
                    const normalizedSize = (count - minCount) / range;
                    const fontSize = 0.75 + (normalizedSize * 0.6); // Range: 0.75rem to 1.35rem
                    const opacity = 0.7 + (normalizedSize * 0.3); // Range: 0.7 to 1.0

                    return `
                        <button class="tag-bubble" data-tag="${tag}" style="
                            font-size: ${fontSize}rem;
                            opacity: ${opacity};
                        ">
                            <span class="tag-bubble-dot ${tagConfig.dot}"></span>
                            <span class="tag-bubble-label">${tagConfig.label}</span>
                            <span class="tag-bubble-count">${count}</span>
                        </button>
                    `;
                }).join('')}
            </div>
        </div>
    ` : '';

    return `
        <div class="welcome-screen">
            <div class="welcome-hero">
                <h1>Twoja biblioteka wiedzy</h1>
                <p>Wszystko w jednym miejscu - gotowe do nauki, projektowania i eksploracji</p>
            </div>
            <div class="welcome-stats">
                <div class="welcome-stat-card">
                    <span class="welcome-stat-value">${folders.length}</span>
                    <div class="welcome-stat-label">Kolekcje</div>
                    <div class="welcome-stat-desc">Zorganizowane tematycznie</div>
                </div>
                <div class="welcome-stat-card">
                    <span class="welcome-stat-value">${totalFiles}</span>
                    <div class="welcome-stat-label">Zasoby</div>
                    <div class="welcome-stat-desc">Gotowe do użycia</div>
                </div>
                <div class="welcome-stat-card">
                    <span class="welcome-stat-value">${allTags.size}</span>
                    <div class="welcome-stat-label">Technologie</div>
                    <div class="welcome-stat-desc">Różne obszary</div>
                </div>
            </div>

            ${folderMapHTML}

            <div class="welcome-content-grid">
                ${recentFilesHTML}
                ${tagCloudHTML}
            </div>
        </div>
    `;
}

// Create folder description view
export function createFolderDescription(folder) {
    return `
        <div class="folder-description">
            <div class="folder-description-header">
                <h1>${folder.name}</h1>
                <p style="color: var(--text-secondary); margin: 0.5rem 0 1rem 0;">${folder.description}</p>
                <div class="meta">
                    <span>${folder.files.length} ${folder.files.length === 1 ? 'plik' : 'plików'}</span>
                </div>
                ${folder.tags ? `
                    <div class="repo-tags" style="margin-top: 1rem;">
                        ${folder.tags.map(tag => {
                            const tagConfig = TAG_CONFIG[tag] || { dot: 'html', label: tag };
                            return `
                                <span class="tag">
                                    <span class="tag-dot ${tagConfig.dot}"></span>
                                    ${tagConfig.label}
                                </span>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Create file preview view
export function createFilePreview(folder, file) {
    const filePath = `${folder.path}/${file.name}`;

    return `
        <div class="file-preview">
            <div class="file-preview-header">
                <div class="file-info">
                    <h1>${file.name}</h1>
                    <p>${file.description}</p>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn" id="downloadBtn" data-path="${filePath}">
                        <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                            <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"></path>
                            <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"></path>
                        </svg>
                        Download
                    </button>
                </div>
            </div>
            <iframe src="${filePath}" id="fileIframe"></iframe>
        </div>
    `;
}

// Update breadcrumb navigation
export function updateBreadcrumb(currentPath, onNavigate) {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = '';

    // Home
    const homeItem = document.createElement('div');
    homeItem.className = 'breadcrumb-item';
    if (currentPath.length === 0) {
        homeItem.classList.add('active');
    }
    homeItem.innerHTML = `
        ${ICONS.home}
        Home
    `;
    if (currentPath.length > 0) {
        homeItem.addEventListener('click', () => onNavigate('root'));
    }
    breadcrumb.appendChild(homeItem);

    // Folder
    if (currentPath.length >= 1) {
        const sep1 = document.createElement('span');
        sep1.className = 'breadcrumb-separator';
        sep1.textContent = '/';
        breadcrumb.appendChild(sep1);

        const folderItem = document.createElement('div');
        let folderClass = 'breadcrumb-item';
        if (currentPath.length === 1) {
            folderClass += ' active';
        } else if (currentPath.length === 2) {
            // Truncate folder name when there's also a file
            folderClass += ' truncated';
        }
        folderItem.className = folderClass;

        if (currentPath.length === 2) {
            // Wrap in span for truncation
            const folderName = document.createElement('span');
            folderName.textContent = currentPath[0].name;
            folderItem.appendChild(folderName);
        } else {
            folderItem.textContent = currentPath[0].name;
        }

        if (currentPath.length > 1) {
            folderItem.addEventListener('click', () => onNavigate('folder'));
        }
        breadcrumb.appendChild(folderItem);
    }

    // File
    if (currentPath.length === 2) {
        const sep2 = document.createElement('span');
        sep2.className = 'breadcrumb-separator';
        sep2.textContent = '/';
        breadcrumb.appendChild(sep2);

        const fileItem = document.createElement('div');
        fileItem.className = 'breadcrumb-item active truncated';
        const fileName = document.createElement('span');
        fileName.textContent = currentPath[1].name;
        fileItem.appendChild(fileName);
        breadcrumb.appendChild(fileItem);
    }
}
