// Mobile Navigation - Bottom Nav + Bottom Sheets + Swipe Gestures

let bottomNav;
let bottomNavItems;
let bottomSheets = {};
let mobileOverlay;
let sidebar;
let activeSheet = null;
let isSidebarOpen = false;

// Touch gesture variables
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let isDragging = false;

// Initialize mobile navigation
export function initializeMobileNav() {
    console.log('Mobile Nav: Initializing...', 'Window width:', window.innerWidth);

    // Always create elements, CSS will handle visibility
    createMobileElements();
    setupEventListeners();
    setupSwipeGestures();

    console.log('Mobile Nav: Initialized successfully!');
}

// Create mobile UI elements
function createMobileElements() {
    console.log('Creating mobile elements...');

    // Check if already exists
    if (document.querySelector('.bottom-nav')) {
        console.log('Mobile elements already exist, skipping creation');
        bottomNav = document.querySelector('.bottom-nav');
        bottomNavItems = document.querySelectorAll('.bottom-nav-item');
        bottomSheets.search = document.getElementById('searchSheet');
        bottomSheets.filter = document.getElementById('filterSheet');
        mobileOverlay = document.querySelector('.mobile-overlay');
        sidebar = document.querySelector('.sidebar');
        return;
    }

    // Create Bottom Navigation
    const bottomNavHTML = `
        <nav class="bottom-nav">
            <div class="bottom-nav-items">
                <button class="bottom-nav-item active" data-action="home">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M6.906.664a1.749 1.749 0 0 1 2.187 0l5.25 4.2c.415.332.657.835.657 1.367v7.019A1.75 1.75 0 0 1 13.25 15h-3.5a.75.75 0 0 1-.75-.75V9H7v5.25a.75.75 0 0 1-.75.75h-3.5A1.75 1.75 0 0 1 1 13.25V6.23c0-.531.242-1.034.657-1.366l5.25-4.2Z"></path>
                    </svg>
                    <span>Home</span>
                </button>

                <button class="bottom-nav-item" data-action="search">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.5 4.5 0 1 0-8.999 0A4.5 4.5 0 0 0 11.5 7Z"></path>
                    </svg>
                    <span>Szukaj</span>
                </button>

                <button class="bottom-nav-item" data-action="filter">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M.75 3h14.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5ZM3 7.75A.75.75 0 0 1 3.75 7h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 7.75Zm3 4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path>
                    </svg>
                    <span>Filtry</span>
                </button>

                <button class="bottom-nav-item" data-action="menu">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z"></path>
                    </svg>
                    <span>Menu</span>
                </button>
            </div>
        </nav>
    `;

    // Create Search Bottom Sheet
    const searchSheetHTML = `
        <div class="bottom-sheet" id="searchSheet">
            <div class="bottom-sheet-handle"></div>
            <div class="bottom-sheet-header">
                <h3 class="bottom-sheet-title">Wyszukaj pliki</h3>
                <button class="bottom-sheet-close">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
                    </svg>
                </button>
            </div>
            <div class="bottom-sheet-content">
                <div style="margin-bottom: 1rem;">
                    <input type="text" id="mobileSearchInput" placeholder="Wpisz nazwę pliku...">
                </div>
                <div id="mobileSearchResults"></div>
            </div>
        </div>
    `;

    // Create Filter Bottom Sheet
    const filterSheetHTML = `
        <div class="bottom-sheet" id="filterSheet">
            <div class="bottom-sheet-handle"></div>
            <div class="bottom-sheet-header">
                <h3 class="bottom-sheet-title">Filtruj według daty</h3>
                <button class="bottom-sheet-close">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
                    </svg>
                </button>
            </div>
            <div class="bottom-sheet-content">
                <div class="mobile-filter-form">
                    <div class="mobile-filter-group">
                        <label class="mobile-filter-label">Data od:</label>
                        <input type="date" id="mobileDateFrom">
                    </div>
                    <div class="mobile-filter-group">
                        <label class="mobile-filter-label">Data do:</label>
                        <input type="date" id="mobileDateTo">
                    </div>
                    <button id="applyDateFilter" class="mobile-filter-btn mobile-filter-btn-primary">
                        Zastosuj filtr
                    </button>
                    <button id="clearDateFilterMobile" class="mobile-filter-btn mobile-filter-btn-secondary">
                        Wyczyść filtr
                    </button>
                </div>
            </div>
        </div>
    `;

    // Create Mobile Overlay
    const overlayHTML = '<div class="mobile-overlay"></div>';

    // Insert elements into DOM
    if (!document.querySelector('.bottom-nav')) {
        document.body.insertAdjacentHTML('beforeend', bottomNavHTML);
        document.body.insertAdjacentHTML('beforeend', searchSheetHTML);
        document.body.insertAdjacentHTML('beforeend', filterSheetHTML);
        document.body.insertAdjacentHTML('beforeend', overlayHTML);
    }

    // Get references
    bottomNav = document.querySelector('.bottom-nav');
    bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomSheets.search = document.getElementById('searchSheet');
    bottomSheets.filter = document.getElementById('filterSheet');
    mobileOverlay = document.querySelector('.mobile-overlay');
    sidebar = document.querySelector('.sidebar');

    console.log('Mobile elements created:', {
        bottomNav: !!bottomNav,
        bottomNavItems: bottomNavItems.length,
        searchSheet: !!bottomSheets.search,
        filterSheet: !!bottomSheets.filter,
        overlay: !!mobileOverlay,
        sidebar: !!sidebar
    });
}

// Setup event listeners
function setupEventListeners() {
    // Bottom nav items - add both click and touch support
    bottomNavItems.forEach(item => {
        let touchStartTime = 0;

        item.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
        }, { passive: true });

        item.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            // Only handle quick taps
            if (touchDuration < 200) {
                handleBottomNavClick(e);
            }
        }, { passive: true });

        item.addEventListener('click', handleBottomNavClick);
    });

    // Bottom sheet close buttons - add touch support
    document.querySelectorAll('.bottom-sheet-close').forEach(btn => {
        let touchStartTime = 0;

        btn.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
        }, { passive: true });

        btn.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            if (touchDuration < 200) {
                closeBottomSheet();
            }
        }, { passive: true });

        btn.addEventListener('click', closeBottomSheet);
    });

    // Overlay click
    if (mobileOverlay) {
        let touchStartTime = 0;
        let touchStartTarget = null;

        mobileOverlay.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchStartTarget = e.target;
        }, { passive: true });

        mobileOverlay.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            // Only close if tap was on overlay itself (not on elements underneath)
            if (touchDuration < 200 && e.target === mobileOverlay && touchStartTarget === mobileOverlay) {
                e.preventDefault();
                e.stopPropagation();
                closeBottomSheet();
                closeSidebar();
            }
        }, { passive: false }); // NOT passive so we can preventDefault

        mobileOverlay.addEventListener('click', (e) => {
            // Only close if click was on overlay itself
            if (e.target === mobileOverlay) {
                e.preventDefault();
                e.stopPropagation();
                closeBottomSheet();
                closeSidebar();
            }
        });
    }

    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeBottomSheet();
            closeSidebar();
        }
    });

    // Mobile search input
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', handleMobileSearch);
    }

    // Date filter buttons - add touch support
    const applyBtn = document.getElementById('applyDateFilter');
    const clearBtn = document.getElementById('clearDateFilterMobile');

    if (applyBtn) {
        let applyTouchStartTime = 0;

        applyBtn.addEventListener('touchstart', (e) => {
            applyTouchStartTime = Date.now();
        }, { passive: true });

        applyBtn.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - applyTouchStartTime;
            if (touchDuration < 200) {
                applyDateFilter();
            }
        }, { passive: true });

        applyBtn.addEventListener('click', applyDateFilter);
    }

    if (clearBtn) {
        let clearTouchStartTime = 0;

        clearBtn.addEventListener('touchstart', (e) => {
            clearTouchStartTime = Date.now();
        }, { passive: true });

        clearBtn.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - clearTouchStartTime;
            if (touchDuration < 200) {
                clearDateFilter();
            }
        }, { passive: true });

        clearBtn.addEventListener('click', clearDateFilter);
    }

    // Window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeBottomSheet();
            closeSidebar();
        }
    });

    // Listen for navigation changes to update active nav button
    window.addEventListener('popstate', updateActiveNavBasedOnState);

    // Also listen for custom navigation events (triggered by navigateToFolder/File)
    document.addEventListener('navigationChanged', updateActiveNavBasedOnState);
}

// Update active nav based on current state
function updateActiveNavBasedOnState() {
    // Check if we're on mobile
    if (window.innerWidth > 768) return;

    // Check if sidebar or bottom sheets are open
    if (isSidebarOpen || activeSheet) return;

    // Check URL hash to determine if we're on home
    const hash = window.location.hash;
    if (!hash || hash === '#') {
        // We're on home page
        updateActiveNav('home');
    } else {
        // We're viewing a folder/file - no button should be active
        bottomNavItems.forEach(item => item.classList.remove('active'));
    }
}

// Handle bottom nav clicks
function handleBottomNavClick(e) {
    const button = e.currentTarget;
    const action = button.dataset.action;

    // Handle action
    switch(action) {
        case 'home':
            closeBottomSheet();
            closeSidebar();
            // Navigate to home
            const homeButton = document.querySelector('.breadcrumb-item');
            if (homeButton) {
                homeButton.click();
            }
            scrollToTop();
            // Set home as active
            updateActiveNav('home');
            break;
        case 'search':
            openBottomSheet('search');
            // Don't change active state when opening search
            break;
        case 'filter':
            openBottomSheet('filter');
            // Don't change active state when opening filter
            break;
        case 'menu':
            closeBottomSheet();
            openSidebar();
            // Don't change active state when opening menu
            break;
    }
}

// Update active navigation button
function updateActiveNav(action) {
    bottomNavItems.forEach(item => item.classList.remove('active'));
    const activeButton = document.querySelector(`.bottom-nav-item[data-action="${action}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Open bottom sheet
function openBottomSheet(sheetName) {
    closeSidebar();

    // Close any open sheets
    Object.values(bottomSheets).forEach(sheet => {
        if (sheet) sheet.classList.remove('active');
    });

    const sheet = bottomSheets[sheetName];
    if (sheet) {
        activeSheet = sheetName;
        sheet.classList.add('active');
        mobileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus search input if opening search
        if (sheetName === 'search') {
            setTimeout(() => {
                document.getElementById('mobileSearchInput')?.focus();
            }, 300);
        }
    }
}

// Close bottom sheet
function closeBottomSheet() {
    Object.values(bottomSheets).forEach(sheet => {
        if (sheet) sheet.classList.remove('active');
    });

    if (!isSidebarOpen) {
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
        // Update active nav based on current page state
        updateActiveNavBasedOnState();
    }

    activeSheet = null;
}

// Open sidebar
function openSidebar() {
    closeBottomSheet();

    if (sidebar) {
        isSidebarOpen = true;
        sidebar.classList.add('mobile-open');
        mobileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Set menu as active when sidebar is open
        updateActiveNav('menu');
    }
}

// Close sidebar
function closeSidebar() {
    if (sidebar) {
        isSidebarOpen = false;
        sidebar.classList.remove('mobile-open');

        if (!activeSheet) {
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
            // Update active nav based on current page state
            updateActiveNavBasedOnState();
        }
    }
}

// Setup swipe gestures
function setupSwipeGestures() {
    // Swipe from RIGHT edge to open sidebar
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isDragging = false;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        // Only set isDragging if there's significant horizontal movement (for swipe detection)
        const horizontalMovement = Math.abs(e.touches[0].clientX - touchStartX);
        const verticalMovement = Math.abs(e.touches[0].clientY - touchStartY);

        // Require at least 30px horizontal movement and less vertical than horizontal (horizontal swipe)
        if (!isDragging && horizontalMovement > 30 && horizontalMovement > verticalMovement) {
            isDragging = true;
        }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        // Only handle if it was a drag/swipe gesture
        if (!isDragging) {
            isDragging = false;
            return;
        }

        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;

        const swipeDistance = touchEndX - touchStartX;
        const verticalDistance = Math.abs(touchEndY - touchStartY);

        // Only recognize horizontal swipes
        if (verticalDistance > 100) {
            isDragging = false;
            return;
        }

        // Swipe from right edge to left = open menu (LEFT in your case)
        if (touchStartX > window.innerWidth - 50 && swipeDistance < -80) {
            openSidebar();
        }

        // Swipe from left to right on open sidebar = close (RIGHT in your case)
        if (isSidebarOpen && swipeDistance > 80) {
            closeSidebar();
        }

        isDragging = false;
    }, { passive: true });

    // Swipe on sidebar to close
    if (sidebar) {
        sidebar.addEventListener('touchstart', (e) => {
            if (!isSidebarOpen) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        sidebar.addEventListener('touchend', (e) => {
            if (!isSidebarOpen) return;
            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;

            const swipeDistance = touchEndX - touchStartX;
            const verticalDistance = Math.abs(touchEndY - touchStartY);

            // Swipe right to close
            if (swipeDistance > 100 && verticalDistance < 100) {
                closeSidebar();
            }
        }, { passive: true });
    }

    // Swipe DOWN on bottom sheets to close
    Object.values(bottomSheets).forEach(sheet => {
        if (!sheet) return;

        let sheetStartY = 0;
        let sheetEndY = 0;

        sheet.addEventListener('touchstart', (e) => {
            if (!activeSheet) return;
            sheetStartY = e.touches[0].clientY;
        }, { passive: true });

        sheet.addEventListener('touchend', (e) => {
            if (!activeSheet) return;
            sheetEndY = e.changedTouches[0].clientY;

            const swipeDistance = sheetEndY - sheetStartY;

            // Swipe down to close (> 100px down)
            if (swipeDistance > 100) {
                closeBottomSheet();
            }
        }, { passive: true });
    });

    // Touch and click support for sidebar items
    if (sidebar) {
        let sidebarTouchStartTime = 0;
        let sidebarTouchHandled = false;

        // Touch support
        sidebar.addEventListener('touchstart', (e) => {
            // Only for repo-cards, not for swipe gestures
            if (e.target.closest('.repo-card')) {
                sidebarTouchStartTime = Date.now();
                sidebarTouchHandled = false;
            }
        }, { passive: true });

        sidebar.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - sidebarTouchStartTime;

            // Only handle quick taps on repo-cards
            if (e.target.closest('.repo-card') && touchDuration < 200 && !sidebarTouchHandled) {
                sidebarTouchHandled = true;

                // Check if it's a file (not folder)
                const card = e.target.closest('.repo-card');
                const isFile = card?.querySelector('.repo-icon.file');

                // Trigger click on the card
                card.click();

                if (isFile) {
                    setTimeout(() => closeSidebar(), 200);
                }
            }
        }, { passive: true });

        // Click support (for desktop)
        sidebar.addEventListener('click', (e) => {
            // Skip if touch already handled
            if (sidebarTouchHandled) {
                sidebarTouchHandled = false;
                return;
            }

            // Only auto-close for file/folder clicks, not breadcrumbs
            if (e.target.closest('.repo-card')) {
                // Check if it's a file (not folder)
                const card = e.target.closest('.repo-card');
                const isFile = card?.querySelector('.repo-icon.file');
                if (isFile) {
                    setTimeout(() => closeSidebar(), 200);
                }
                // Folders keep sidebar open for navigation
            }
        });
    }
}

// Handle mobile search
function handleMobileSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const resultsDiv = document.getElementById('mobileSearchResults');

    if (!searchTerm) {
        resultsDiv.innerHTML = '';
        return;
    }

    // Get search input from desktop version to reuse logic
    const desktopSearchInput = document.getElementById('searchInput');
    if (desktopSearchInput) {
        desktopSearchInput.value = searchTerm;
        desktopSearchInput.dispatchEvent(new Event('input'));

        // Copy suggestions to mobile
        setTimeout(() => {
            const suggestions = document.querySelector('.search-suggestions');
            if (suggestions && suggestions.classList.contains('active')) {
                resultsDiv.innerHTML = suggestions.innerHTML;

                // Add click and touch handlers to open files
                resultsDiv.querySelectorAll('.search-suggestion-item').forEach((mobileItem, index) => {
                    let touchStartTime = 0;

                    // Touch support
                    mobileItem.addEventListener('touchstart', (e) => {
                        touchStartTime = Date.now();
                    }, { passive: true });

                    mobileItem.addEventListener('touchend', (e) => {
                        const touchDuration = Date.now() - touchStartTime;
                        if (touchDuration < 200) {
                            // Find the corresponding desktop item and click it
                            const desktopItems = document.querySelectorAll('.search-suggestions .search-suggestion-item');
                            if (desktopItems[index]) {
                                desktopItems[index].click();
                            }
                            closeBottomSheet();
                        }
                    }, { passive: true });

                    // Click support for desktop
                    mobileItem.addEventListener('click', () => {
                        // Find the corresponding desktop item and click it
                        const desktopItems = document.querySelectorAll('.search-suggestions .search-suggestion-item');
                        if (desktopItems[index]) {
                            desktopItems[index].click();
                        }
                        closeBottomSheet();
                    });
                });
            }
        }, 100);
    }
}

// Apply date filter
function applyDateFilter() {
    const dateFrom = document.getElementById('mobileDateFrom').value;
    const dateTo = document.getElementById('mobileDateTo').value;

    // Sync with desktop filters
    const desktopDateFrom = document.getElementById('dateFrom');
    const desktopDateTo = document.getElementById('dateTo');

    if (desktopDateFrom) desktopDateFrom.value = dateFrom;
    if (desktopDateTo) desktopDateTo.value = dateTo;

    // Trigger filter
    if (desktopDateFrom) {
        desktopDateFrom.dispatchEvent(new Event('change'));
    }

    closeBottomSheet();
}

// Clear date filter
function clearDateFilter() {
    document.getElementById('mobileDateFrom').value = '';
    document.getElementById('mobileDateTo').value = '';

    const clearBtn = document.getElementById('clearDateFilter');
    if (clearBtn) clearBtn.click();

    closeBottomSheet();
}

// Scroll to top
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Export functions
export { openSidebar, closeSidebar, closeBottomSheet, updateActiveNav };
