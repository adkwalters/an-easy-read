// || Navigation

// Toggle navigation display
const navIcon = document.getElementById("header-nav-icon");
const header = document.getElementById("header-main");
// click menu button to toggle menu
navIcon.addEventListener("click", () => {
    header.classList.toggle("display-menu");
    // Toggle aria-expanded attribute
    if (header.classList.contains("display-menu")) {
        navIcon.ariaExpanded = "true";
    } else { 
        navIcon.ariaExpanded = "false"; }
});
// Click outside open menu to close
window.addEventListener("click", (event) => {
    if (!header.contains(event.target) 
            && header.classList.contains("display-menu")) {
        header.classList.toggle("display-menu");
        navIcon.ariaExpanded = "false";
    } 
});


// Close flashed message
const flashClose = document.querySelector(".close-message");
if (flashClose) {
    flashClose.addEventListener("click", () => {
        flashClose.parentNode.remove();
    });
}


// || Cookie Consent

// Helper function to test local storage availability
const localStorageAvailable = () => {
    let test = "test";
    try {
        localStorage.setItem("test", test);
        localStorage.removeItem(test);
        return true;
    } catch {
        return false;
    }
}

// Get consent modal popup
const consentModal = document.getElementById("consent-modal");

// Show popup if local storage is available and user consent is unknown
if (localStorageAvailable() && localStorage.getItem('cookies_enabled') == null) {
    consentModal.classList.remove("no-display");
}

// Record users' consent to cookies
consentModal.addEventListener("click", (event) => {
    if (localStorageAvailable()) {
        let consent = event.target.innerHTML;
        if (consent == "Accept") {
            // Enable cookies and hide pop up
            localStorage.setItem('cookies_enabled', '1');
            consentModal.classList.add("no-display");
        }
        else if (consent == "Reject") {
            // Keep cookies disabled and hide pop up
            localStorage.setItem('cookies_enabled', '0');
            consentModal.classList.add("no-display");
        }
    }
})
