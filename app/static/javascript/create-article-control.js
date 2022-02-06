// || Categories

// Get category elements
const categoryFieldList = document.getElementById("article_category");
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

            // Generate input name to replicate wtform FieldList naming
            let inputName = "article_category-" + (categoryArray.length);

            // Append hidden input to form 
            let hiddenInput = document.createElement("input");
            hiddenInput.setAttribute("type", "hidden");
            hiddenInput.setAttribute("name", inputName);
            hiddenInput.value = categoryInput.value;
            categoryFieldList.appendChild(hiddenInput); 
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
        let categoryHiddenInputs = categoryDisplay.querySelectorAll("[type='hidden']");
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


// || Return Key

// Prevent form submission upon clicking return
let forms = document.querySelectorAll("input");
for (let form of forms) {
    form.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
        }
    })
}


// || Custom Validation

// Prevent form submission if outstanding alerts exist
const submitButton = document.getElementById("submit");
submitButton.addEventListener("click", (event) => {
    let alerts = document.querySelectorAll("span.form-alert");
    if (alerts[0]) {
        alerts[0].scrollIntoView({block: "center", behavior: "smooth"});
        event.preventDefault();
    }
})

