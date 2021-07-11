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

var summaryIndex = 0;
changeSummary(summaryIndex);

// Difficulty controls
function setLevel(num) {
    summaryIndex += num;
    changeSummary(summaryIndex);
}

// Show only selected summary
function changeSummary(index) {
    var summaries = document.getElementsByClassName("cefr");

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
