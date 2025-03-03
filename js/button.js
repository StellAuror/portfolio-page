var divAbout = document.getElementById('content-about');
var divProjects = document.getElementById('content-projects');
var divDegree = document.getElementById('content-degree');
var divSkills = document.getElementById('content-skills');
var divCareer = document.getElementById('content-career');
var buttStartup = document.getElementById('button-nav-startup');
let currentButton = null; 

var buttStartup = document.getElementById('button-nav-startup');


function hideAllTabs() {
    var tabs = [divAbout, divProjects, divDegree, divSkills, divCareer];
    tabs.forEach(function(tab) {
        tab.classList.remove('fade-in');
        tab.classList.add('fade-out');
        setTimeout(function() {
            tab.style.display = 'none';
        }, 300); 
    });
}

function showTab(tab) {
    hideAllTabs();
    setTimeout(function() { 
        switch(tab) {
            case 'about':
                divAbout.style.display = 'block';
                divAbout.classList.remove('fade-out');
                divAbout.classList.add('fade-in');
                break;
            case 'projects':
                divProjects.style.display = 'block';
                divProjects.classList.remove('fade-out');
                divProjects.classList.add('fade-in');
                break;
            case 'degree':
                divDegree.style.display = 'block';
                divDegree.classList.remove('fade-out');
                divDegree.classList.add('fade-in');
                break;
            case 'skills':
                divSkills.style.display = 'block';
                divSkills.classList.remove('fade-out');
                divSkills.classList.add('fade-in');
                break;
            case 'career':
                divCareer.style.display = 'block';
                divCareer.classList.remove('fade-out');
                divCareer.classList.add('fade-in');
                break;
        }
    }, 300); 
}

document.addEventListener('DOMContentLoaded', function() {
    var tabs = [divAbout, divProjects, divDegree, divSkills, divCareer];
    tabs.forEach(function(tab) {
        tab.style.display = 'none';
        tab.classList.remove('fade-in');
        tab.classList.remove('fade-out');
    });
    divAbout.style.display = 'block';
    divAbout.classList.add('fade-in');
});


function changeColor(button) {
    if (currentButton) {
        currentButton.style.backgroundColor = ''; 
    }
    button.style.backgroundColor = '#c04e15';
    currentButton = button;
}

changeColor(buttStartup)

let currentButtonOTHER = null;

function changeColorOTHER(buttonId) {
    const button = document.getElementById(buttonId);
    
    if (currentButton) {
        currentButton.style.backgroundColor = '';
    }
    button.style.backgroundColor = '#c04e15';
    currentButton = button;
}

$(document).ready(function() {
    $('#themeSwitch').change(function() {
        $('body').toggleClass('light-theme');
    });
});
