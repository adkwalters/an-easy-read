// || Navigation

    const navIcon = document.getElementById("header-nav-icon");
    const flashClose = document.querySelector(".close-message");


    // Toggle navigation display
    navIcon.addEventListener("click", () => {
        let header = document.getElementById('header-main');

        // If the navigation list is displayed, hide it...
        if (header.classList.contains('display-menu')) {
            header.classList.remove('display-menu');
        //...else display it
        } else {
            header.classList.add('display-menu');
        }
    });


    // Close flashed message
    if (flashClose) {
        flashClose.addEventListener("click", () => {
            flashClose.parentNode.remove();
        });
    }