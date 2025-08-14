// Navigation functionality
function showSection(sectionId, linkElement) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    const mobilesections = document.querySelectorAll('.mobile-content-section');

    sections.forEach(section => section.classList.remove('active'));
    mobilesections.forEach(section => section.classList.remove('active'));
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update navigation active state
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    linkElement.classList.add('active');

    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    mobileNavLinks.forEach(link => link.classList.remove('active'));
    linkElement.classList.add('active');
    
    // Close mobile sidebar
    if (window.innerWidth <= 1000) {
        document.getElementById('sidebar').classList.remove('open');
    }
}


// Handle window resize
const sidebar = document.getElementById('sidebar');

window.addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
});

window.addEventListener('touchend', e => {
  endX = e.changedTouches[0].clientX;
  const deltaX = endX - startX;

  if (deltaX > 150) {  // swipe right - open sidebar
    sidebar.style.display = 'block';
  } else if (deltaX < -100) {  // swipe left - close sidebar
    sidebar.style.display = 'none';
  }
});

window.addEventListener('resize', function() {
    if (window.innerWidth > 1000) {
        sidebar.classList.remove('open');
    }
});

// Smooth scroll for navigation links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
    });
});

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

function openSidebar() {
    document.getElementById('sidebar').style.display = 'block';
}

function closeSidebar() {
    document.getElementById('sidebar').style.display = 'none';
}

function toggleSidebar(item) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.style.display === 'block') {
        closeSidebar();
        item.classList.remove('active');
    } else {
        openSidebar();
        item.classList.add('active');
    }
}

function resetSidebarDisplay() {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth > 1000) {
    sidebar.style.display = 'block';  // force show on desktop
  } else {
    sidebar.style.display = 'none';   // hide on mobile by default
  }
}

window.addEventListener('resize', resetSidebarDisplay);
window.addEventListener('load', resetSidebarDisplay);
