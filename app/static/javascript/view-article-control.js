// || Article Font Size

// Get font-size selection buttons
const smallFont = document.getElementById("font-size-small");
const mediumFont = document.getElementById("font-size-medium");
const largeFont = document.getElementById("font-size-large");

// Change article font size to selected size
const changeFontSize = (size) => {
    // Get paragraphs
    let paragraphs = document.querySelectorAll("summary-paragraph");
    for (let paragraph of paragraphs) {
        // Get headers and summaries
        let summaries = paragraph.querySelectorAll(
            "[slot='slot-header'], [slot='slot-summary']");
        for (let summary of summaries) {
            // Replace font size with selected size
            summary.classList.remove("small-font", "medium-font", "large-font");
            summary.classList.add(size);
        } 
    }
}

// Attach function to buttons
smallFont.addEventListener("click", () => { changeFontSize("small-font"); });
mediumFont.addEventListener("click", () => { changeFontSize("medium-font"); });
largeFont.addEventListener("click", () => { changeFontSize("large-font"); });


// || Article Reading Level

// Get reading level selection
const easiest = document.getElementById("easiest-level");
const hardest = document.getElementById("hardest-level");

// Change article reading level to selected level
const changeLevel = (difficulty) => {
    // Get all summaries
    let paragraphs = document.querySelectorAll("summary-paragraph");
    for (let paragraph of paragraphs) {
        // Change level and configure arrow controls
        paragraph.setLevel(difficulty);
        paragraph.displayArrows();
    }
}

// Attach function to buttons
easiest.addEventListener("click", () => { changeLevel("easiest"); });
hardest.addEventListener("click", () => { changeLevel("hardest"); });

// Set default level
changeLevel("easiest");


// || Save and Print Article

// Get save and print buttons
const printWithImages = document.getElementById("with-images");
const printWithoutImages = document.getElementById("without-images");

// Get document header
const head = document.querySelector("head");

// Create stylesheet with rule to remove images from print
const stylesheet = document.createElement("style");
stylesheet.innerHTML = "@media print { img, figcaption { display: none; } }";

// Print article with images
printWithImages.addEventListener("click", () => {
    if (head.contains(stylesheet)) {
        head.removeChild(stylesheet);
    }
    print()
})

// Print article without images
printWithoutImages.addEventListener("click", () => {
    if (!head.contains(stylesheet)) {
        head.appendChild(stylesheet);
    }
    print()
    
})
