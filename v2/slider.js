let slider = document.querySelector('.slider .list');
let items = document.querySelectorAll('.slider .list .item');
let descriptions = document.querySelectorAll('.slider .list .item .description');
let next = document.getElementById('next');
let prev = document.getElementById('prev');
let dots = document.querySelectorAll('.slider .dots li');

let lengthItems = items.length - 1;
let active = 0;
next.onclick = function(){
    active = active + 1 <= lengthItems ? active + 1 : 0;
    reloadSlider();
}
prev.onclick = function(){
    active = active - 1 >= 0 ? active - 1 : lengthItems;
    reloadSlider();
}
function reloadSlider(){
    slider.style.left = -items[active].offsetLeft + 'px';
    // 
    let last_active_dot = document.querySelector('.slider .dots li.activated');
    last_active_dot.classList.remove('activated');
    dots[active].classList.add('activated');

    descriptions.forEach((desc, index) => {
        if(index === active) {
            desc.style.display = 'block';
        } else {
            desc.style.display = 'none';
        }
    });

    clearInterval(refreshInterval);
}

dots.forEach((li, key) => {
    li.addEventListener('click', ()=>{
         active = key;
         reloadSlider();
    })
})
window.onresize = function(event) {
    reloadSlider();
};

window.onload = function() {
    descriptions[active].style.display = 'block';
}
