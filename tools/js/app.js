import { initializeElements, setFolders } from './state.js';
import { checkSession, handleLogin, initializeLogoutButton } from './auth.js';
import { initializeSearch } from './search.js';
import { initializeDateFilter } from './dateFilter.js';
import { initializeFileActions } from './fileActions.js';
import { renderView } from './render.js';
import { loadFolders, showExplorer } from './data.js';
import { initializeWelcomeInteractions } from './welcomeInteractions.js';
import { initializeBrowserNavigation } from './navigation.js';
import { initializeMobileNav } from './mobileNav.js';

// Initialize application
async function initializeApp() {
    // Initialize all DOM elements
    initializeElements();

    // Initialize event listeners
    initializeEventListeners();

    // Initialize browser navigation (back/forward buttons)
    initializeBrowserNavigation();

    // Check session and auto-login if needed
    if (checkSession()) {
        console.log('Auto-login successful');
        await showExplorer();
    } else {
        console.log('Not logged in, showing login screen');
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        handleLogin(passwordInput.value, showExplorer);
    });

    // Logout button
    initializeLogoutButton();

    // Search functionality
    initializeSearch();

    // Date filter functionality
    initializeDateFilter();

    // File actions (Download)
    initializeFileActions();

    // Welcome screen interactions
    initializeWelcomeInteractions();

    // Mobile navigation (bottom nav + bottom sheets + swipe)
    initializeMobileNav();
}

// Start the application when DOM is ready
window.addEventListener('DOMContentLoaded', initializeApp);

// Export for access from other modules if needed
export { initializeApp };
