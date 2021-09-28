// || Article Image

// n.b. The following function reduces repetition of image upload code
// However, the asynchronous nature of fetch means that image data (id, src) 
// is saved before the article is submitted, if the article is submitted at all.
// Perhaps this will create too much junk data.

// Post image to server asynchronously
function postImageAsync(file) {

    // Create image element and display file
    let img = document.createElement("img");
    img.setAttribute("class", "article-form-image");
    img.src = URL.createObjectURL(file);
    
    // Create form data object 
    let formData = new FormData();
    formData.append('file', file);

    // Post form data to server
    return fetch("/add-image", {
        method: "POST", 
        body: formData
    })
    .then(response => response.json()) 
    .catch(error => {
        console.error(error);
        alert('Invalid or incorrect file extension.');
    });
}



// || Categories

// Get category elements
const categoryLabel = document.querySelector("[for='article-form-categories']");
const categoryInput = document.querySelector("[list='article-form-categories-input']");
const addCategoryButton = document.getElementById("article-form-add-category-button");
const delCategoryButton = document.getElementById("article-form-del-category-button");
const categoryDisplay = document.getElementById("article-form-categories-selected");

// Prepare elements
const categoryDisplayItem = document.createElement("li");
categoryDisplayItem.setAttribute("class", "label-size label-colour");

const hiddenInput = document.createElement("input");
hiddenInput.setAttribute("type", "hidden");
hiddenInput.setAttribute("name", "article-form-categories-selected");

// Reset input upon click 
categoryInput.addEventListener("focus", function() { // Non-arrow func for this. binding
    this.value = "";
});


// Add category
addCategoryButton.addEventListener("click", () => {

    // Get selected categories
    let categories = categoryDisplay.querySelectorAll("li");

    // Initialise categories array
    let categoryValues = [];

    // Push category values to array
    categories.forEach(category => categoryValues.push(category.textContent));

    // If author inputs a category
    if (categoryInput.value) {

        // If category has not been previously selected
        if (categoryValues.indexOf(categoryInput.value) < 0) {

            // Display value in display area
            categoryDisplayItem.textContent = categoryInput.value;
            categoryDisplay.appendChild(categoryDisplayItem);

            // Append hidden value to form 
            hiddenInput.value = categoryInput.value;
            categoryDisplay.appendChild(hiddenInput); 
        } 
        else {
                        
            // Alert author        
            alert(`${categoryInput.value} has already been selected.`);
        }
    }
    else {
        
        // Alert author
        alert("Please select or enter a category.");
    }
});


// Delete last category (LIFO)
delCategoryButton.addEventListener("click", () => {

    // Get selected categories
    let categories = categoryDisplay.querySelectorAll("li");

    // If a category exists
    if (categories[0]) {

        // Remove the last category
        categories[categories.length -1].remove();
    }
    else {

        // Alert author        
        alert("There are no categories to delete.");

    }
});



// || Article Content 

// Prepare elements
const articleContent = document.querySelector("article-content");

const addParagraphButton = document.getElementById("add-paragraph");

// Add paragraph to article
addParagraphButton.addEventListener("click", () => {

    // Generate paragraph index (non-zero)
    let paragraphIndex = document.querySelectorAll("article-paragraph").length + 1;

    // Create paragraph
    let newParagraph = document.createElement("article-paragraph");
    newParagraph.setAttribute("slot", "slot-article-paragraphs");
    newParagraph.setAttribute("data-paragraph-index", paragraphIndex); 
    
    // Append paragraph to DOM
    articleContent.appendChild(newParagraph);

    // Scroll into view
    newParagraph.scrollIntoView({block: "center", behavior: "smooth"});
});