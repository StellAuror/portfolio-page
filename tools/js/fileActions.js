// File actions: Download only

// Initialize file action buttons
export function initializeFileActions() {
    // Event delegation for dynamically created buttons
    document.addEventListener('click', async (e) => {
        if (e.target.closest('#downloadBtn')) {
            const btn = e.target.closest('#downloadBtn');
            const filePath = btn.dataset.path;
            await downloadFile(filePath);
        }
    });
}

// Download file
async function downloadFile(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error('Failed to fetch file');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filePath.split('/').pop();
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Download failed:', error);
        alert('Nie udało się pobrać pliku');
    }
}
