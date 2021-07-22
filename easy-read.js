/* || Navigate
        - Toggle header length to show navigation */

function showNav() {
    let header = document.getElementById('header-main');
    if (header.classList.contains('display-menu')) {
        header.classList.remove('display-menu');
    } else {
        header.classList.add('display-menu');
    }
}


/* || Summarise
        - Iterate forwards/backwards through paragraph summaries */

// Set default level
showSummary("level-1");

// Grey out arrows where no summary is available
greyOutArrows();


// Show only selected level
function showSummary(level) {
    var paragraphs = document.getElementsByClassName("summary-paragraph");

    for (paragraph of paragraphs) {
        let summaries = paragraph.getElementsByClassName("summary");
        
        for (summary of summaries) {
            // summary.style.display = "none";
            summary.classList.add("hidden");
            
            if (summary.classList.contains(level)) {
                // summary.style.display = "block";
                summary.classList.remove("hidden")
            }
        }
    }   
}

// Hide inc/decrease arrows when summary cannot be inc/decreased
function greyOutArrows() {
    var paragraphs = document.getElementsByClassName("summary-paragraph");
    
    for (paragraph of paragraphs) {
        // n.b. summaries increase to the left and decrease to the right
        let incSummary = paragraph.getElementsByClassName("prev"),
            decSummary = paragraph.getElementsByClassName("next"),
            firstSummary = paragraph.getElementsByClassName("level-1"),
            lastSummary = paragraph.getElementsByClassName("level-2");

        if (lastSummary[0].classList.contains("hidden")) {
            incSummary[0].classList.remove("unavailable");
        } else {
            incSummary[0].classList.add("unavailable");
        }

        if (firstSummary[0].classList.contains("hidden")) {
            decSummary[0].classList.remove("unavailable");
        } else {
            decSummary[0].classList.add("unavailable");
        }
    }
}

function selectSummary(paragraph, change) {
    var summaries = paragraph.parentNode.getElementsByClassName("summary");

    for (let i = 0; i < summaries.length; i++) {
        // If summary is displayed
        if (summaries[i].classList.contains("hidden") == false) {
            // ...and if selected index is within index range
            let newIndex = i + change;
            if (newIndex >= 0 && newIndex < summaries.length) {
                // hide summary and display the next according to change
                summaries[i].classList.add("hidden");
                summaries[newIndex].classList.remove("hidden");
                greyOutArrows();
                return;
            }
        }
    }
}