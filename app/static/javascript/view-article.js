// || Article control - font-size

// Get font-size selection
const smallFont = document.getElementById("font-size-small");
const mediumFont = document.getElementById("font-size-medium");
const largeFont = document.getElementById("font-size-large");

// Change article font size to user selected size
const changeFontSize = (size) => {
    
    // Get article text
    const articleText = document.getElementsByTagName("html");

    // Clear previous size selections
    articleText[0].classList.remove("small-font", "medium-font", "large-font");
    
    // Add selected size
    articleText[0].classList.add(size);
}

smallFont.addEventListener("click", () => { changeFontSize("small-font"); });
mediumFont.addEventListener("click", () => { changeFontSize("medium-font"); });
largeFont.addEventListener("click", () => { changeFontSize("large-font"); });

