import { CONFIG, LOGOUT_HOLD_DURATION } from './config.js';
import { getElements, setCurrentPath, setSearchQuery, setLogoutTimer, getLogoutTimer } from './state.js';

// Check if user is logged in
export function checkSession() {
    try {
        const isLoggedIn = localStorage.getItem(CONFIG.sessionKey);
        console.log('Session check - key:', CONFIG.sessionKey);
        console.log('Session check - value:', isLoggedIn);
        console.log('All localStorage keys:', Object.keys(localStorage));
        return isLoggedIn === 'true';
    } catch (error) {
        console.error('localStorage error:', error);
        console.log('localStorage might be disabled or unavailable');
        return false;
    }
}

// Login handler
export function handleLogin(password, onSuccess) {
    const elements = getElements();
    console.log('Login attempt with password:', password);

    if (password === CONFIG.password) {
        console.log('Password correct, setting localStorage');
        localStorage.setItem(CONFIG.sessionKey, 'true');
        console.log('localStorage set:', localStorage.getItem(CONFIG.sessionKey));
        elements.loginContainer.classList.add('fade-out');
        setTimeout(onSuccess, 300);
    } else {
        console.log('Password incorrect');
        elements.errorMessage.classList.add('show');
        setTimeout(() => elements.errorMessage.classList.remove('show'), 3000);
        elements.passwordInput.value = '';
    }
}

// Logout handler
export function handleLogout() {
    const elements = getElements();
    console.log('Logging out...');

    localStorage.removeItem(CONFIG.sessionKey);
    console.log('localStorage cleared:', localStorage.getItem(CONFIG.sessionKey));

    elements.explorerContainer.classList.remove('active');
    elements.headerActions.style.display = 'none';
    elements.loginContainer.style.display = 'flex';
    elements.loginContainer.classList.remove('fade-out');
    elements.passwordInput.value = '';

    setCurrentPath([]);
    setSearchQuery('');
    elements.searchInput.value = '';
    elements.searchBox.classList.remove('expanded');
    elements.logoutBtn.classList.remove('holding');
    setLogoutTimer(null);
}

// Initialize logout button with hold-to-confirm functionality
export function initializeLogoutButton() {
    const elements = getElements();
    let isHoldingLogout = false;

    elements.logoutBtn.addEventListener('mousedown', (e) => {
        console.log('Logout button mousedown');
        e.preventDefault(); // Prevent text selection
        isHoldingLogout = true;
        elements.logoutBtn.classList.add('holding');

        const timer = setTimeout(() => {
            isHoldingLogout = false;
            handleLogout();
        }, LOGOUT_HOLD_DURATION);

        setLogoutTimer(timer);
    });

    // Global mouseup handler to cancel logout if released early
    document.addEventListener('mouseup', () => {
        const logoutTimer = getLogoutTimer();
        if (isHoldingLogout && logoutTimer) {
            console.log('Global mouseup - cancelling logout (released early)');
            clearTimeout(logoutTimer);
            setLogoutTimer(null);
            isHoldingLogout = false;
            elements.logoutBtn.classList.remove('holding');
        }
    });
}
