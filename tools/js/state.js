// State management
export const state = {
    folders: [],
    currentPath: [],
    currentView: 'root',
    searchQuery: '',
    dateFilter: {
        from: null,
        to: null
    },
    elements: {
        loginContainer: null,
        loginForm: null,
        passwordInput: null,
        errorMessage: null,
        explorerContainer: null,
        logoutBtn: null,
        sidebarContent: null,
        contentArea: null,
        breadcrumb: null,
        searchInput: null,
        headerActions: null,
        searchSuggestions: null,
        searchBox: null,
        searchIcon: null,
        dateFilter: null,
        dateIcon: null,
        dateFrom: null,
        dateTo: null,
        clearDateFilter: null
    },
    logoutTimer: null
};

// Initialize DOM element references
export function initializeElements() {
    state.elements.loginContainer = document.getElementById('loginContainer');
    state.elements.loginForm = document.getElementById('loginForm');
    state.elements.passwordInput = document.getElementById('password');
    state.elements.errorMessage = document.getElementById('errorMessage');
    state.elements.explorerContainer = document.getElementById('explorerContainer');
    state.elements.logoutBtn = document.getElementById('logoutBtn');
    state.elements.sidebarContent = document.getElementById('sidebarContent');
    state.elements.contentArea = document.getElementById('contentArea');
    state.elements.breadcrumb = document.getElementById('breadcrumb');
    state.elements.searchInput = document.getElementById('searchInput');
    state.elements.headerActions = document.getElementById('headerActions');
    state.elements.searchSuggestions = document.getElementById('searchSuggestions');
    state.elements.searchBox = document.querySelector('.search-box');
    state.elements.searchIcon = document.querySelector('.search-icon');
    state.elements.dateFilter = document.getElementById('dateFilter');
    state.elements.dateIcon = document.querySelector('.date-icon');
    state.elements.dateFrom = document.getElementById('dateFrom');
    state.elements.dateTo = document.getElementById('dateTo');
    state.elements.clearDateFilter = document.getElementById('clearDateFilter');
}

// Getters
export function getFolders() {
    return state.folders;
}

export function setFolders(folders) {
    state.folders = folders;
}

export function getCurrentPath() {
    return state.currentPath;
}

export function setCurrentPath(path) {
    state.currentPath = path;
}

export function getSearchQuery() {
    return state.searchQuery;
}

export function setSearchQuery(query) {
    state.searchQuery = query;
}

export function getElements() {
    return state.elements;
}

export function setLogoutTimer(timer) {
    state.logoutTimer = timer;
}

export function getLogoutTimer() {
    return state.logoutTimer;
}

export function getDateFilter() {
    return state.dateFilter;
}

export function setDateFilter(from, to) {
    state.dateFilter.from = from;
    state.dateFilter.to = to;
}
