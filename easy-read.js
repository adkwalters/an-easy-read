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
        - Iterate forwards/backwards through paragraph summaries */

// Set default level
showSummary("c");

// Show only selected level
function showSummary(level) {
    var paragraphs = document.getElementsByClassName("summary-paragraph");

    for (paragraph of paragraphs) {
        let summaries = paragraph.getElementsByClassName("cefr");
        
        for (summary of summaries) {
            summary.style.display = "none";
            
            if (summary.classList.contains(level)) {
                summary.style.display = "block";
            }
        }
    }   
}

function increaseLevel(paragraph) {
    var summaries = paragraph.parentNode.getElementsByClassName("cefr");

    for (let i = 0; i < summaries.length -1; i++) { 
        
        if (summaries[i].style.display === "block") {
            summaries[i].style.display = "none";
            summaries[i + 1].style.display = "block";
            break;
        }
    } 
}

function decreaseLevel(paragraph) {
    var summaries = paragraph.parentNode.getElementsByClassName("cefr");

    for (let i = summaries.length - 1; i > 0; i--) { 
        
        if (summaries[i].style.display === "block") {
            summaries[i].style.display = "none";
            summaries[i - 1].style.display = "block";
            break;
        }
    } 
}
