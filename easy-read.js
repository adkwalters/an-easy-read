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
showSummary("cefr-c");

// Set default hidden arrows
hideArrows();


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

// Hide inc/decrease arrows when summary cannot be inc/decreased
function hideArrows() {
    var paragraphs = document.getElementsByClassName("summary-paragraph");
    
    for (paragraph of paragraphs) {
        let incArrow = paragraph.getElementsByClassName("next"),
            decArrow = paragraph.getElementsByClassName("prev"),
            summaryA = paragraph.getElementsByClassName("cefr-a"),
            summaryC = paragraph.getElementsByClassName("cefr-c");

        if (summaryC[0].style.display == "block") {
            incArrow[0].style.color = "#EEE"
        } else {
            incArrow[0].style.color = "black";
        }

        if (summaryA[0].style.display == "block") {
            decArrow[0].style.color = "#EEE";
        } else {
            decArrow[0].style.color = "black";
        }
    }
}

function ChangeLevel(paragraph, change) {
    var summaries = paragraph.parentNode.getElementsByClassName("cefr");

    if (change > 0) {
        for (let i = 0; i < summaries.length -1; i++) { 
                    
            if (summaries[i].style.display === "block") {
                summaries[i].style.display = "none";
                summaries[i + change].style.display = "block";
                hideArrows();
                return;
            }
        } 
    }
    else {
        for (let i = summaries.length - 1; i > 0; i--) { 
        
            if (summaries[i].style.display === "block") {
                summaries[i].style.display = "none";
                summaries[i + change].style.display = "block";
                hideArrows();
                return;
            }
        } 
    } 
}


