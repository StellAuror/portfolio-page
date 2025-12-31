// Recent files management with localStorage
const RECENT_FILES_KEY = 'explorer_recent_files';
const MAX_RECENT_FILES = 5;

// Get recent files from localStorage
export function getRecentFiles() {
    try {
        const stored = localStorage.getItem(RECENT_FILES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading recent files:', error);
        return [];
    }
}

// Add file to recent files
export function addRecentFile(folder, file) {
    try {
        const recentFiles = getRecentFiles();

        // Create file entry
        const fileEntry = {
            folderName: folder.name,
            folderPath: folder.path,
            fileName: file.name,
            fileDescription: file.description,
            fileTags: file.tags,
            timestamp: Date.now()
        };

        // Remove duplicate if exists (based on folder and file name)
        const filtered = recentFiles.filter(rf =>
            !(rf.folderName === fileEntry.folderName && rf.fileName === fileEntry.fileName)
        );

        // Add to beginning
        filtered.unshift(fileEntry);

        // Keep only MAX_RECENT_FILES
        const trimmed = filtered.slice(0, MAX_RECENT_FILES);

        // Save to localStorage
        localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(trimmed));

        return trimmed;
    } catch (error) {
        console.error('Error adding recent file:', error);
        return getRecentFiles();
    }
}

// Clear all recent files
export function clearRecentFiles() {
    try {
        localStorage.removeItem(RECENT_FILES_KEY);
    } catch (error) {
        console.error('Error clearing recent files:', error);
    }
}

// Get time ago string
export function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return days === 1 ? '1 dzień temu' : `${days} dni temu`;
    } else if (hours > 0) {
        return hours === 1 ? '1 godzinę temu' : `${hours} godzin temu`;
    } else if (minutes > 0) {
        return minutes === 1 ? '1 minutę temu' : `${minutes} minut temu`;
    } else {
        return 'przed chwilą';
    }
}
