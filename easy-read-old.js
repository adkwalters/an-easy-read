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



// || Article control

    // Change article font size to selected size
    const changeFontSize = (size) => {
        const articleText = document.getElementsByTagName("html");

        // Remove all font-size selections...
        articleText[0].classList.remove("small-font", "medium-font", "large-font");
       
        //...then add selected font-size 
        articleText[0].classList.add(size);
    }

    // Print currently displayed summary paragraphs
    const printArticle = () => {
        const article = document.getElementsByTagName("article-text")[0];
        print(article); 
    }



//  || Summary control
          
    // Show only the selected summary level  !!!!! BUG #4 - paragraph not shown if summary doesn't exist
    const initialiseSummary = (level) => {
        const summaries = document.getElementsByClassName("summary");
        const initialisedSummary = document.getElementsByClassName(level);
        const paragraphs = document.getElementsByClassName("summary-paragraph");

        // Hide all summaries of all paragraphs...
        for (summary of summaries) {
            summary.classList.remove("display-summary");
        }
        
        //...then display selected summary level for each paragraph...
        for (summary of initialisedSummary) {
            summary.classList.add("display-summary");
        }

        //...then update all arrow buttons
        for (paragraph of paragraphs) {
            updateArrows(paragraph);
        }
    }


    // Increase or decrease the summary reading level
    const changeSummary = (currentParagraph, currentSummary, targetSummary) => {
        
        // If the target summary exists...
        if (targetSummary) {
            //...switch the display cursor from the current summary
            currentSummary.classList.remove("display-summary");
            targetSummary.classList.add("display-summary");

            //...then update the arrow buttons
            updateArrows(currentParagraph);
        }        
    }   


    // Hide summary increase or decrease arrows wherever summary is unavailable
    const updateArrows = (paragraph) => {
        const incArrow = paragraph.getElementsByClassName("prev")[0];
        const decArrow = paragraph.getElementsByClassName("next")[0];
        const summaries = Array.from(paragraph.getElementsByClassName("summary"));
        const currentSummary = paragraph.getElementsByClassName("display-summary")[0];
        const highestSummary = summaries[0];
        const lowestSummary = summaries[summaries.length - 1];

        // If there are more than one summary...
        if (summaries.length > 1) {
            //...and if the highest level is displayed...
            if (currentSummary == highestSummary) {
                //...hide the increase arrow and display the decrease arrow...
                incArrow.classList.remove("arrow-display");
                decArrow.classList.add("arrow-display");
            //...else if the lowest level is displayed... 
            } else if (currentSummary == lowestSummary) {
                //...same, same but different...
                incArrow.classList.add("arrow-display");
                decArrow.classList.remove("arrow-display");
            //...else, show all arrows
            } else {
                incArrow.classList.add("arrow-display");
                decArrow.classList.add("arrow-display");
            }
        }
    }
    


// || Event Listeners 

    // Add event listeners once DOM is loaded
    function listenForContentLoaded() {

        // - Navigation
        
            // Show navigation when icon is clicked
            const navIcon = document.getElementById("header-nav-icon");
            
            navIcon.addEventListener("click", showNav);

        
        // - Article Control

            // Set user-selected default summary level
            const level1 = document.getElementById("select-level-1");
            const level2 = document.getElementById("select-level-2");
            
            level1.addEventListener("click", () => { initialiseSummary("level-1"); });
            level2.addEventListener("click", () => { initialiseSummary("level-2"); });

            // Set user-selected summary font size (all)
            const smallFont = document.getElementById("font-size-small");
            const mediumFont = document.getElementById("font-size-medium");
            const largeFont = document.getElementById("font-size-large");
        
            smallFont.addEventListener("click", () => { changeFontSize("small-font"); });
            mediumFont.addEventListener("click", () => { changeFontSize("medium-font"); });
            largeFont.addEventListener("click", () => { changeFontSize("large-font"); });
    
            // Print article showing current summaries
            const printButton = document.getElementById("print-article");

            printButton.addEventListener("click", printArticle);

    
        // Summary Control

            // Set author-selected default summary level 
            initialiseSummary("level-1"); // highest reading level
                    
            // Set user-selected  summary level (individual)
            const paragraphs = document.getElementsByClassName("summary-paragraph");

            for (paragraph of paragraphs) {
                // Add an event listener to every paragraph...
                paragraph.addEventListener("click", e => {                
                    let summaryArrows = e.target.closest("button"),
                        currentParagraph = e.target.parentNode;
                        currentSummary = currentParagraph.getElementsByClassName("display-summary")[0],
                        incSummary = currentSummary.previousElementSibling,
                        decSummary = currentSummary.nextElementSibling;
                    
                    // ...if a user clicks something other than an arrow, exit
                    if (!summaryArrows) { 
                        return; 
                    // ...else call the changeSummary function with the corresponding target summary
                    } else if (e.target.classList.contains("prev")) {
                        changeSummary(currentParagraph, currentSummary, incSummary);
                    } else if (e.target.classList.contains("next")) {
                        changeSummary(currentParagraph, currentSummary, decSummary);
                    }
                });
            }
        }


    // || Let's gooooOOOoooo
        
        // Run event listeners once document content is fully loaded
        document.addEventListener("DOMContentLoaded", listenForContentLoaded);