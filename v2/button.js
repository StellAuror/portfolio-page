var divAbout = document.getElementById('content-about');
var divProjects = document.getElementById('content-projects');
    divProjects.style.display = 'none'
var display = 0;

function hideShow() {
    if (display == 1) {
        divAbout.style.display = 'block';
        divProjects.style.display = 'none'
        display = 0;
    } else {
        divAbout.style.display = 'none';
        divProjects.style.display = 'block'
        display = 1;
    }
}