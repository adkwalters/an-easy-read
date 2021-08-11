// || Navigation
         
    // Toggle navigation display
    const showNav = () => {
        let header = document.getElementById('header-main');

        // If the navigation list is displayed, hide it...
        if (header.classList.contains('display-menu')) {
            header.classList.remove('display-menu');
        //...else display it
        } else {
            header.classList.add('display-menu');
        }
    }



// || Event Listeners 

    // Add event listeners once DOM is loaded
    function listenForContentLoaded() {

        // Show navigation when icon is clicked
        const navIcon = document.getElementById("header-nav-icon");
        
        navIcon.addEventListener("click", showNav);
    }

    

// || Let's gooooOOOoooo
        
    // Run event listeners once document content is fully loaded
    document.addEventListener("DOMContentLoaded", listenForContentLoaded);