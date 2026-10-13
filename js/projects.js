// Global variables
window.currentLang = window.currentLang || "en";
let currentLanguageData = {};

// Load language data
async function loadLanguageData(lang) {
    try {
        const response = await fetch(`languages/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load language file: ${lang}.json`);
        }
        currentLanguageData = await response.json();
        return currentLanguageData;
    } catch (error) {
        console.error('Error loading language data:', error);
        // Fallback to English if current language fails
        if (lang !== 'en') {
            return await loadLanguageData('en');
        }
        return {};
    }
}

// Create project tile HTML
function createProjectTile(projectId, project) {
    const gradients = {
        project1: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        project2: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        project3: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        project4: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        project5: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        project6: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    };

    // Determine what to show in the project image area
    let imageContent = '';
    if (project.preview) {
        // If there's an actual image, use it as background
        imageContent = `<div class="project-image" style="background-image: url('${project.preview}'); background-size: cover; background-position: center; background-repeat: no-repeat;">
            <div class="project-image-overlay"></div>
        </div>`;
    } else if (project.preview) {
        // If there's an emoji, treat it as an image with gradient background
        imageContent = `<div class="project-image" style="background: ${gradients[projectId] || gradients.project1};">
            <div class="project-emoji-image">${project.preview}</div>
        </div>`;
    } else {
        // Fallback to just gradient
        imageContent = `<div class="project-image" style="background: ${gradients[projectId] || gradients.project1};">
            <div class="project-image-placeholder"></div>
        </div>`;
    }

    return `
        <div class="project-tile" onclick="openProjectModal('${projectId}')">
            ${imageContent}
            <div class="project-tile-content">
                <h3 class="project-tile-title">${project.title}</h3>
                <p class="project-tile-tech">${project.tech}</p>
                <p class="project-tile-description">${project.description}</p>
            </div>
        </div>
    `;
}

// Render projects grid
function renderProjectsGrid() {
    const projectsGrid = document.getElementById('projectsGrid');
    if (!projectsGrid || !currentLanguageData.projects?.items) return;

    const projectsHTML = Object.entries(currentLanguageData.projects.items)
        .map(([projectId, project]) => createProjectTile(projectId, project))
        .join('');

    projectsGrid.innerHTML = projectsHTML;

    // Add touch event listeners for mobile
    document.querySelectorAll('.project-tile').forEach(tile => {
        tile.addEventListener('touchstart', () => {
            tile.classList.add('hover');
        });

        tile.addEventListener('touchend', () => {
            setTimeout(() => tile.classList.remove('hover'), 1500);
        });
    });
}

// Update text content based on language
function updateTextContent() {
    const elementsToUpdate = document.querySelectorAll('[data-lang]');
    elementsToUpdate.forEach(element => {
        const key = element.getAttribute('data-lang');
        const text = getNestedValue(currentLanguageData, key);
        if (text) {
            element.textContent = text;
        }
    });
}

// Helper function to get nested object values
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Get project image (handles both actual images and emojis)
function getProjectImageForModal(project) {
    if (project.image) {
        // If there's an actual image, return it
        return {
            type: 'image',
            content: project.image
        };
    } else if (project.emoji) {
        // If there's an emoji, treat it as the image content
        return {
            type: 'emoji',
            content: project.emoji
        };
    } else {
        // No image content
        return {
            type: 'none',
            content: null
        };
    }
}

// Open project modal
function openProjectModal(projectId) {
    const project = currentLanguageData.projects?.items?.[projectId];
    if (!project) return;

    const modal = document.getElementById('projectModal');
    document.getElementById('modalTitle').textContent = project.title;
    document.getElementById('modalTech').textContent = project.tech;
    document.getElementById('modalDescription').textContent = project.description;

    // Update features list
    const featuresList = document.getElementById('modalFeatures');
    featuresList.innerHTML = '';
    (project.features || []).forEach(feature => {
        const li = document.createElement('li');
        li.textContent = feature;
        featuresList.appendChild(li);
    });

    // Update links
    const linksContainer = document.getElementById('modalLinks');
    linksContainer.innerHTML = '';
    (project.links || []).forEach(({ href, label, icon }) => {
        const a = document.createElement('a');
        a.href = href;
        a.className = 'project-link';
        a.target = '_blank';
        
        // Create SVG icons based on label
        let svgIcon = '';
        if (label.toLowerCase().includes('github')) {
            svgIcon = `<svg viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>`;
        } else {
            svgIcon = `<svg viewBox="0 0 24 24">
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H6.9C3.71 7 1 9.79 1 13s2.71 6 6 6h4v-1.9H6.9c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c3.21 0 5.9-2.79 5.9-6s-2.69-6-5.9-6z"/>
            </svg>`;
        }
        
        a.innerHTML = `${svgIcon}${label}`;
        linksContainer.appendChild(a);
    });

    // Update modal image (handles both images and emojis)
    const modalImage = document.getElementById('modalImage');
    const projectImageData = getProjectImageForModal(project);
    
    // Clear previous styling
    modalImage.style.backgroundImage = '';
    modalImage.innerHTML = '';
    modalImage.className = 'modal-image';

    switch (projectImageData.type) {
        case 'image':
            // Handle actual image
            modalImage.style.backgroundImage = `url('${projectImageData.content}')`;
            modalImage.classList.add('has-background-image');
            break;
        case 'emoji':
            // Handle emoji as image
            modalImage.innerHTML = `<div class="modal-emoji-image">${projectImageData.content}</div>`;
            modalImage.classList.add('has-emoji-image');
            break;
        default:
            // No image content
            modalImage.classList.add('no-image');
            break;
    }

    modal.classList.add('active');
    
    // Add event listeners for closing modal
    // Click outside to close
    modal.addEventListener('click', handleModalClick);
    
    // Press any key to close
    document.addEventListener('keydown', handleKeyPress);
}

// Close project modal
function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    modal.classList.remove('active');
    
    // Remove event listeners to prevent memory leaks
    modal.removeEventListener('click', handleModalClick);
    document.removeEventListener('keydown', handleKeyPress);
}

// Handle modal click events (close on outside click)
function handleModalClick(event) {
    const modal = document.getElementById('projectModal');
    const modalContent = modal.querySelector('.modal-content, .project-modal-content');
    
    // If clicking outside the modal content, close the modal
    if (event.target === modal || (modalContent && !modalContent.contains(event.target))) {
        closeProjectModal();
    }
}

// Handle keyboard events (close on any key press)
function handleKeyPress(event) {
    const modal = document.getElementById('projectModal');
    
    // If modal is open and any key is pressed, close it
    if (modal && modal.classList.contains('active')) {
        closeProjectModal();
        event.preventDefault(); // Prevent default key behavior
    }
}

// Initialize language system
async function initializeLanguage(lang = window.currentLang) {
    window.currentLang = lang;
    await loadLanguageData(lang);
    updateTextContent();
    renderProjectsGrid();
}

// Language switcher event listener
document.addEventListener('DOMContentLoaded', function() {
    // Initialize with current language
    initializeLanguage();
    
    // Store the original changeLang function if it exists
    const originalChangeLang = window.changeLang;
    
    // Create a new changeLang function that calls both the original and our language update
    window.changeLang = function(lang) {
        // Call the original changeLang function first (for your CSS/UI)
        if (originalChangeLang && typeof originalChangeLang === 'function') {
            originalChangeLang(lang);
        }
        
        // Then update our projects content
        if (lang && lang !== window.currentLang) {
            initializeLanguage(lang);
        }
    };
});