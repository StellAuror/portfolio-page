import { setFolders, getElements } from './state.js';
import { renderView } from './render.js';

// Load metadata from JSON
async function loadMetadata() {
    try {
        const response = await fetch('./metadata.json');
        if (!response.ok) {
            throw new Error('Failed to load metadata.json');
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading metadata:', error);
        return { folders: {}, defaults: {} };
    }
}

// Scan directory for files
async function scanDirectory(path) {
    const files = [];
    try {
        // Try to load directory listing - for now we'll use the metadata
        // In a real browser environment, we can't list directory contents
        // So we rely on metadata.json to know what files exist
        return files;
    } catch (error) {
        console.error(`Error scanning directory ${path}:`, error);
        return files;
    }
}

// Build folder structure from metadata (recursive)
async function buildFoldersFromMetadata(metadata) {
    const folders = [];

    function processFolderData(folderName, folderData, parentPath = '') {
        const folder = {
            name: folderName,
            description: folderData.description || metadata.defaults.folderDescription,
            tags: folderData.tags || metadata.defaults.folderTags,
            path: folderData.path || (parentPath ? `${parentPath}/${folderName}` : folderName),
            files: [],
            subfolders: []
        };

        // Add files from metadata
        if (folderData.files) {
            for (const [fileName, fileData] of Object.entries(folderData.files)) {
                folder.files.push({
                    name: fileName,
                    description: fileData.description || metadata.defaults.fileDescription,
                    tags: fileData.tags || metadata.defaults.fileTags,
                    createdDate: fileData.createdDate || null
                });
            }
        }

        // Process subfolders recursively
        if (folderData.subfolders) {
            for (const [subfolderName, subfolderData] of Object.entries(folderData.subfolders)) {
                const subfolder = processFolderData(subfolderName, subfolderData, folder.path);
                folder.subfolders.push(subfolder);
            }
        }

        return folder;
    }

    // Don't flatten - keep only top-level folders
    // Subfolders will be accessible when navigating into parent folder
    for (const [folderName, folderData] of Object.entries(metadata.folders)) {
        const folder = processFolderData(folderName, folderData);
        folders.push(folder);
    }

    return folders;
}

// Load folders data
export async function loadFolders() {
    const metadata = await loadMetadata();
    const folders = await buildFoldersFromMetadata(metadata);
    setFolders(folders);
}

// Show explorer
export async function showExplorer() {
    const elements = getElements();
    console.log('showExplorer called');

    elements.loginContainer.style.display = 'none';
    elements.explorerContainer.classList.add('active');
    elements.headerActions.style.display = 'flex';

    await loadFolders();
    renderView();
}
