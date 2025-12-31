import { getElements, setDateFilter, getDateFilter, state } from './state.js';
import { renderView } from './render.js';

// Initialize date filter
export function initializeDateFilter() {
    const elements = getElements();

    // Toggle date filter expansion on hover
    elements.dateFilter.addEventListener('mouseenter', () => {
        elements.dateFilter.classList.add('expanded');
    });

    elements.dateFilter.addEventListener('mouseleave', () => {
        // Delay to allow interacting with inputs
        setTimeout(() => {
            const hasFilter = state.dateFilter.from || state.dateFilter.to;
            const hasFocus = elements.dateFrom.matches(':focus') || elements.dateTo.matches(':focus');
            if (!hasFilter && !hasFocus) {
                elements.dateFilter.classList.remove('expanded');
            }
        }, 200);
    });

    elements.dateFrom.addEventListener('change', handleDateChange);
    elements.dateTo.addEventListener('change', handleDateChange);

    elements.dateFrom.addEventListener('focus', () => {
        elements.dateFilter.classList.add('expanded');
    });

    elements.dateTo.addEventListener('focus', () => {
        elements.dateFilter.classList.add('expanded');
    });

    elements.dateFrom.addEventListener('blur', () => {
        setTimeout(() => {
            const hasFilter = state.dateFilter.from || state.dateFilter.to;
            const hasFocus = elements.dateFrom.matches(':focus') || elements.dateTo.matches(':focus');
            const isHovered = elements.dateFilter.matches(':hover');
            if (!hasFilter && !hasFocus && !isHovered) {
                elements.dateFilter.classList.remove('expanded');
            }
        }, 200);
    });

    elements.dateTo.addEventListener('blur', () => {
        setTimeout(() => {
            const hasFilter = state.dateFilter.from || state.dateFilter.to;
            const hasFocus = elements.dateFrom.matches(':focus') || elements.dateTo.matches(':focus');
            const isHovered = elements.dateFilter.matches(':hover');
            if (!hasFilter && !hasFocus && !isHovered) {
                elements.dateFilter.classList.remove('expanded');
            }
        }, 200);
    });

    elements.clearDateFilter.addEventListener('click', clearDateFilter);

    // Close date filter when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.date-filter')) {
            const hasFilter = state.dateFilter.from || state.dateFilter.to;
            if (!hasFilter) {
                elements.dateFilter.classList.remove('expanded');
            }
        }
    });
}

// Handle date input changes
function handleDateChange() {
    const elements = getElements();
    const from = elements.dateFrom.value || null;
    const to = elements.dateTo.value || null;

    setDateFilter(from, to);
    renderView();
}

// Clear date filter
function clearDateFilter() {
    const elements = getElements();
    elements.dateFrom.value = '';
    elements.dateTo.value = '';
    setDateFilter(null, null);
    renderView();
}

// Check if file passes date filter
export function passesDateFilter(file) {
    if (!file.createdDate) {
        return true; // Show files without dates
    }

    const dateFilter = getDateFilter();
    if (!dateFilter.from && !dateFilter.to) {
        return true; // No filter applied
    }

    const fileDate = new Date(file.createdDate);
    fileDate.setHours(0, 0, 0, 0); // Normalize to start of day

    if (dateFilter.from && dateFilter.to) {
        const fromDate = new Date(dateFilter.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateFilter.to);
        toDate.setHours(23, 59, 59, 999);

        const passes = fileDate >= fromDate && fileDate <= toDate;
        console.log(`File: ${file.name}, Date: ${file.createdDate}, From: ${dateFilter.from}, To: ${dateFilter.to}, Passes: ${passes}`);
        return passes;
    } else if (dateFilter.from) {
        const fromDate = new Date(dateFilter.from);
        fromDate.setHours(0, 0, 0, 0);

        const passes = fileDate >= fromDate;
        console.log(`File: ${file.name}, Date: ${file.createdDate}, From: ${dateFilter.from}, Passes: ${passes}`);
        return passes;
    } else if (dateFilter.to) {
        const toDate = new Date(dateFilter.to);
        toDate.setHours(23, 59, 59, 999);

        const passes = fileDate <= toDate;
        console.log(`File: ${file.name}, Date: ${file.createdDate}, To: ${dateFilter.to}, Passes: ${passes}`);
        return passes;
    }

    return true;
}
