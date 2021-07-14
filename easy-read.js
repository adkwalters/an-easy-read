/* || Navigate
        - Toggle header length to show navigation */

function showNav() {
    let header = document.getElementById('header-main');
    if (header.style.height === "11rem") {
        header.style.height = "4rem";
    } else {
        header.style.height = "11rem";
    }
}


/* || Summarise
        - Iterate forwards/backwards through paragraph summaries
            - Adapted from https://www.w3schools.com/howto/howto_js_slideshow.asp */

var summaryIndex = 0;
switchSummary(summaryIndex);

// Difficulty controls
function setLevel(change) {
    summaryIndex += change;
    switchSummary(summaryIndex);
}

function switchSummary(index) {
    var paragraphs = document.getElementsByClassName("summary-paragraph");
    
    // For each paragraph, hide all but the selected summary
    for (let paragraph of paragraphs) {
        
        var summaries = paragraph.getElementsByClassName("cefr");
        
        // If summary index is out of bounds, stop scrolling
        if (index > summaries.length - 1) {
            summaryIndex = summaries.length - 1; 
        }
        if (index < 0) {
            summaryIndex = 0;
        }

        // Hide all summaries
        for (let i = 0; i < summaries.length; i++) {
            summaries[i].style.display = "none";
        }

        // Show selected summary
        summaries[summaryIndex].style.display = "block"
    }
}