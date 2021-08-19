// // || Article CMS 
    
// Initialise a categories array
const categoriesArray = [];

// || Categories

// Prepare elements
const articleForm = document.querySelector("#article-form");
const categoryInput = document.querySelector("[list='article-form-categories-input']")
const addCategoryButton = document.getElementById("article-form-add-category-button");
const delCategoryButton = document.getElementById("article-form-del-category-button");
const categoryDisplay = document.getElementById("article-form-categories-selected")


// Clear category input (reset upon click) 
categoryInput.addEventListener("focus", function() { // Non-arrow for this() binding
    this.value = "";
});


// Add a category
addCategoryButton.addEventListener("click", () => {

    // If an author enters or selects a category...
    if (categoryInput.value) {

        // If the category already exists, remind the author...
        if (categoriesArray.includes(categoryInput.value)) {
            alert("Category already exists");
        } else {
            //...append the categories array
            categoriesArray.push(categoryInput.value);

            //...display category name in display area
            let newCategory = document.createElement("li");
            newCategory.setAttribute("class", "label-size label-colour");
            newCategory.textContent = categoryInput.value;
            categoryDisplay.appendChild(newCategory);

            //...add a hidden form input to hold category value
            let hiddenCategoryInput = document.createElement("input")
            hiddenCategoryInput.setAttribute("type", "hidden")
            hiddenCategoryInput.setAttribute("name", "article-form-categories-selected")
            hiddenCategoryInput.setAttribute("value", categoryInput.value)
            hiddenCategoryInput.value = categoryInput.value;
            articleForm.appendChild(hiddenCategoryInput);
        }; 
    }
})

// Delete ultimate category (LIFO)
delCategoryButton.addEventListener("click", () => {
    if (categoryDisplay.firstChild) {
        categoriesArray.pop(); //...pop off array
        categoryDisplay.lastChild.remove(); //...remove from display area
        articleForm.lastChild.remove(); //...remove from article form
    }
})



// || Summaries 

// Prepare elements
const articleContent = document.getElementById("article-form-content");
const addParagraphButton = document.getElementById("add-paragraph");

// Add paragraph
addParagraphButton.addEventListener("click", () => {
    let paragraph = document.createElement("create-paragraph");
    let paragraphs = document.getElementsByTagName("create-paragraph");
    let paragraphIndex = paragraphs.length + 1; // Non zero-indexing
    paragraph.setAttribute("data-paragraph-index", paragraphIndex); 
    articleContent.appendChild(paragraph);
});
