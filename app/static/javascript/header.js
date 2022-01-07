// || Navigation

// Toggle navigation display
const navIcon = document.getElementById("header-nav-icon");
const header = document.getElementById('header-main');
// click menu button to toggle menu
navIcon.addEventListener("click", () => {
    header.classList.toggle('display-menu')
});
// Click outside open menu to close
window.addEventListener("click", (event) => {
    if (!header.contains(event.target) 
            && header.classList.contains('display-menu')) {
        header.classList.toggle('display-menu');
    } 
})


// Close flashed message
const flashClose = document.querySelector(".close-message");
if (flashClose) {
    flashClose.addEventListener("click", () => {
        flashClose.parentNode.remove();
    });
}