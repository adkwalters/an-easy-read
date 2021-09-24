// !! The following function reduces repetition in image upload
// However, the nature of fetch means that image data (id, src) is stored 
// when the article is not submitted. I worry this will create too much junk data

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

// Prepare elements
const articleForm = document.querySelector("#article-form");
const categoryInput = document.querySelector("[list='article-form-categories-input']");
const addCategoryButton = document.getElementById("article-form-add-category-button");
const delCategoryButton = document.getElementById("article-form-del-category-button");
const categoryDisplay = document.getElementById("article-form-categories-selected");

// Reset input upon click 
categoryInput.addEventListener("focus", function() { // Non-arrow func for this. binding
    this.value = "";
});


// Initialise categories array to hold selected categories
const categoriesArray = [];

// Add category
addCategoryButton.addEventListener("click", () => {

    // If author enters or selects category
    if (categoryInput.value) {

        // If category is not already selected
        if (!categoriesArray.includes(categoryInput.value)) {

            // Select category
            categoriesArray.push(categoryInput.value);

            // Display category in display area
            let newCategory = document.createElement("li");
            newCategory.setAttribute("class", "label-size label-colour");
            newCategory.textContent = categoryInput.value;
            categoryDisplay.appendChild(newCategory);

            // Add hidden form input to hold category value
            let hiddenInput = document.createElement("input");
            hiddenInput.setAttribute("type", "hidden");
            hiddenInput.setAttribute("name", "article-form-categories-selected");
            hiddenInput.setAttribute("value", categoryInput.value);
            hiddenInput.value = categoryInput.value;
            articleForm.appendChild(hiddenInput);          
        } 
        else {

            // Alert author        
            alert(`${categoryInput.value} has already been selected.`);
        }; 
    }
})


// Delete last category (LIFO)
delCategoryButton.addEventListener("click", () => {

    // If a category exists
    if (categoryDisplay.firstChild) {
        
        // Deselect last category
        categoriesArray.pop(); 
        
        // Remove from display area
        categoryDisplay.lastChild.remove(); 
        
         // Remove hidden input from article form
        articleForm.lastChild.remove();
    }
})



// || Article Content 

// Prepare elements
const articleContent = document.querySelector("article-content");

const addParagraphButton = document.getElementById("add-paragraph");

// Add paragraph to article
addParagraphButton.addEventListener("click", () => {

    // Calculate paragraph index (non-zero)
    let paragraphIndex = document.querySelectorAll("article-paragraph").length + 1;

    // Create paragraph
    let newParagraph = document.createElement("article-paragraph");
    newParagraph.setAttribute("data-paragraph-index", paragraphIndex); 
    newParagraph.setAttribute("slot", "slot-article-paragraphs");
    
    // Add paragraph to DOM
    articleContent.appendChild(newParagraph);

    // Scroll into view
    newParagraph.scrollIntoView({block: "center", behavior: "smooth"});
});