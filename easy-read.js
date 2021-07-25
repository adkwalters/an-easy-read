/* || Navigate
        - Toggle navigation between displaying and hiding the navigation list */


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




/* || Control Summary
        - control the reading level of the summary paragraphs shown */


    // Set default level (high level = increased summary)
    showSummary("level-1"); // Set to least amount of summarisation
    
    // Grey out unavailable options to increase or decrease summary
    greyOutArrows();  
    
    
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
                let incArrows = paragraph.getElementsByClassName("prev");
                let decArrows = paragraph.getElementsByClassName("next");
    
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