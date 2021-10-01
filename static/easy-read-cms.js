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
const categoryDisplay = document.getElementById("article-form-categories-selected");
const addCategoryButton = document.getElementById("article-form-add-category-button");
const delCategoryButton = document.getElementById("article-form-del-category-button");

// Initialise categories array
const categoryArray = []; 

// Get current categories
let categoriesSelected = categoryDisplay.querySelectorAll("li");

// Push current category values to categories array
categoriesSelected.forEach(category => {
    categoryArray.push(category.textContent);
});


// Add category
addCategoryButton.addEventListener("click", () => {

    // If author inputs a category
    if (categoryInput.value) {
            
        // If input category has not been previously selected
        if (categoryArray.indexOf(categoryInput.value) < 0) {

            // Add category to array
            categoryArray.push(categoryInput.value);

            // Display category in display area
            let categoryDisplayItem = document.createElement("li");
            categoryDisplayItem.setAttribute("class", "label-size label-colour");
            categoryDisplayItem.textContent = categoryInput.value;
            categoryDisplay.appendChild(categoryDisplayItem);

            // Append hidden input to form 
            let hiddenInput = document.createElement("input");
            hiddenInput.setAttribute("type", "hidden");
            hiddenInput.setAttribute("name", "article-form-categories-selected");
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

    // If a category exists
    if (categoryArray[0]) {

        // Remove last category from array
        categoryArray.pop();

        // Remove last category from display area
        categoriesSelected = categoryDisplay.querySelectorAll("li");
        categoriesSelected[categoriesSelected.length -1].remove();

        // Remove hidden input from form 
        let categoryHiddenInputs = categoryDisplay.querySelectorAll("[name='article-form-categories-selected']");
        categoryHiddenInputs[categoryHiddenInputs.length -1].remove();
    }
    else {

        // Alert author        
        alert("There are no categories to delete.");
    }
});


// Reset input upon click 
categoryInput.addEventListener("focus", function() { // Non-arrow func for this. binding
    this.value = "";
});


