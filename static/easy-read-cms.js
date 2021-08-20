// || Categories

// Initialise a categories array
const categoriesArray = [];

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


// // Display the proper delete button (paragraph or level)
// function updateDelButton(paragraph, visibility) {
//     let prevParagraph = paragraph.previousElementSibling;
//     if (prevParagraph) {
//         delButton = prevParagraph.querySelector(".del-paragraph");
//         if (delButton) {
//             delButton.style.visibility = visibility; 
//             // nb. setting the element to hidden retails its event listeners
//             //     This is important when deleting paragraphs 
//         }
//     }
// }

function removeButton(paragraph, button) {
    let prevParagraph = paragraph.previousElementSibling;
    if (prevParagraph) {
        button.remove()
        console.log("removed", button) 
    }
}

function addButton(paragraph, button) {
    let nextParagraph = paragraph.nextElementSibling;
    let nextNextParagraph = nextParagraph.nextElementSibling;

    if (!nextNextParagraph) {
        let controls = paragraph.querySelector("div");
        controls.appendChild(button);
        console.log("added", button) 
    } 
}


// Add paragraph
addParagraphButton.addEventListener("click", () => {
    let paragraph = document.createElement("create-paragraph");
    let paragraphs = document.getElementsByTagName("create-paragraph");
    let paragraphIndex = paragraphs.length + 1; // Non zero-indexing
    paragraph.setAttribute("data-paragraph-index", paragraphIndex); 
    articleContent.appendChild(paragraph);

    // Hide previous button
    // updateDelButton(paragraph, "hidden")

    // let prevParagraph = paragraph.previousElementSibling;
    // if (prevParagraph) {
    //     delButton = prevParagraph.querySelector(".del-paragraph");
    //     if (delButton) {
    //         delButton.remove();
    //     }
    // }

    let prevParagraph = paragraph.previousElementSibling;
    if (prevParagraph) {
        let delButton = prevParagraph.querySelector(".del-paragraph");
        removeButton(paragraph, delButton);
    }
});
