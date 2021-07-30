// || Navigation
         
    // Toggle navigation between displaying and hiding the navigation list
    function showNav() {
        let header = document.getElementById('header-main');

        // If the navigation list is displayed, hide it...
        if (header.classList.contains('display-menu')) {
            header.classList.remove('display-menu');
        // ...else display it
        } else {
            header.classList.add('display-menu');
        }
    }



//  || Control Summary
          
    // Show only the selected summary level (high level = increased summary)
    function showSummary(level) {
        var paragraphs = document.getElementsByClassName("summary-paragraph");

        // For each of the paragraphs...
        for (paragraph of paragraphs) {
            let summaries = paragraph.getElementsByClassName("summary");
            // ...and for each of the summaries...
            for (summary of summaries) {
                // ...hide...
                summary.classList.add("hidden");
                // ...and if the element matches the preset level...
                if (summary.classList.contains(level)) {
                    // show
                    summary.classList.remove("hidden")
                }
            }
        }
        // Grey out unavailable options to increase or decrease summary
        greyOutArrows(); 
    }


    // Switch the displayed summary according to the change selected
    function changeSummary(paragraph, change) {
        var summaries = paragraph.parentNode.getElementsByClassName("summary");

        for (let i = 0; i < summaries.length; i++) {
            // If summary is displayed...
            if (summaries[i].classList.contains("hidden") == false) {
                // ...and if selected index is within index range...
                let newIndex = i + change;
                if (newIndex >= 0 && newIndex < summaries.length) {
                    // ...hide summary and show next...
                    summaries[i].classList.add("hidden");
                    summaries[newIndex].classList.remove("hidden");
                    // ...then update arrows and stop loop
                    greyOutArrows();
                    return;
                }
            }
        }
    }


    // Grey out unavailable options to increase or decrease summary
    function greyOutArrows() {
        var paragraphs = document.getElementsByClassName("summary-paragraph");
        
        // For each of the paragraphs...
        for (paragraph of paragraphs) {
            let summaries = paragraph.getElementsByClassName("summary");
            let incArrows = paragraph.getElementsByClassName("increase-summary-level");
            let decArrows = paragraph.getElementsByClassName("decrease-summary-level");

            // ...if the last summary is shown, grey out the increase(prev) arrow
            if (summaries[0].classList.contains("hidden") == false) {
                incArrows[0].classList.add("unavailable");
            } else {
                incArrows[0].classList.remove("unavailable");
            }

            // ...or if the first summary is shown, grey out the decrease(next) arrow
            if (summaries[summaries.length -1].classList.contains("hidden") == false) {
                decArrows[0].classList.add("unavailable");
            } else {
                decArrows[0].classList.remove("unavailable");
            }
        }
    }


    // Change article font size to selected size
    function changeFontSize(size) {
        var articleText = document.getElementsByTagName("html");

        // Remove all font-size selections...
        articleText[0].classList.remove("small-font", "medium-font", "large-font");
       
        // ...then add selected font-size 
        articleText[0].classList.add(size);
    }



// || Event Listeners 

    // Add event listeners once DOM is loaded
    function listenForContentLoaded() {
        
        // Show navigation when icon is clicked
        var navIcon = document.getElementById("header-nav-icon");
        
        navIcon.addEventListener("click", showNav);

        
        // Set author-selected paragraph summary level (all)
        showSummary("level-1"); // Set lowest level


        // Set user-selected paragraph summary level (all)
        var level1 = document.getElementById("select-level-1"),
            level2 = document.getElementById("select-level-2");
        
        level1.addEventListener("click", () => { showSummary("level-1"); }, false);
        level2.addEventListener("click", () => { showSummary("level-2"); }, false);

        
        // Set user-selected paragraph summary level (individual)
        var summaryParagraphs = document.getElementsByClassName("summary-paragraph");

        for (paragraph of summaryParagraphs) {
            paragraph.addEventListener("click", function(e) {
                if (e.target.classList.contains("increase-summary-level")) {
                    changeSummary(e.target.parentNode, -1);
                } else if (e.target.classList.contains("decrease-summary-level")) {
                    changeSummary(e.target.parentNode, 1);
                }
            })
        }
        
        
        // Set user-selected paragraph font size 
        var smallFont = document.getElementById("font-size-small"),
            mediumFont = document.getElementById("font-size-medium"),
            largeFont = document.getElementById("font-size-large");
        
        smallFont.addEventListener("click", () => { changeFontSize("small-font"); }, false);
        mediumFont.addEventListener("click", () => { changeFontSize("medium-font"); }, false);
        largeFont.addEventListener("click", () => { changeFontSize("large-font"); }, false);
        
    }

    document.addEventListener("DOMContentLoaded", listenForContentLoaded);