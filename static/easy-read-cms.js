// || Main Image

// Prepare elements
const articleData = document.querySelector("#article-form-meta");
const imageLabel = document.querySelector("label[for='article-form-main-image-input']")
const imageInput = document.querySelector("#article-form-main-image-input");
const articleTitle = document.querySelector("#article-form-title");

const altLabel = document.createElement("label");
altLabel.setAttribute("for", "article-form-main-image-alt");
altLabel.textContent = "Image description:";
    
const altInput = document.createElement("input");
altInput.setAttribute("name", "article-form-main-image-alt");
altInput.setAttribute("class", "image-upload-alt");

const imageId = document.createElement("input");
imageId.setAttribute("name", "article-form-main-image-id");
imageId.setAttribute("type", "hidden");

const delImageButton = document.createElement("button");
delImageButton.setAttribute("class", "button delete del-image-button");
delImageButton.setAttribute("type", "button");
delImageButton.textContent = "Delete Image";  

// Add a main image
imageInput.addEventListener("change", () => {
    // Get uploaded file
    let file = articleData.querySelector(".image-upload").files[0];
    // If a file exists...
    if (file) {
        //...display it in the form
        let img = document.createElement("img");
        img.setAttribute("class", "article-form-image");
        img.src = URL.createObjectURL(file);
        //...create form data object 
        let formData = new FormData();
        formData.append('file', file);
        //...and post it to server
        fetch("/add-image", {
            method: "POST", 
            body: formData
        })
        .then(response => response.json()) 
        .then(data => {
            // Save image ID as hidden input
            imageId.value = data.image_id;
            // Add elements to DOM
            imageLabel.appendChild(delImageButton)
            imageLabel.insertBefore(img, imageInput);
            imageLabel.insertBefore(imageId, delImageButton);
            imageLabel.insertBefore(altLabel, delImageButton);
            imageLabel.insertBefore(altInput, delImageButton);
            // Remove superfluous elements
            imageInput.remove();
        })
        .catch(error => {
            console.error(error);
            alert('invalid or incorrect file extension');
        });
    }
});

// Delete main image
delImageButton.addEventListener("click", () => {
    let image = articleData.querySelector(".article-form-image");
    // Remove image elements
    image.remove();
    altLabel.remove();
    altInput.remove();
    delImageButton.remove();
    // Add image input back to DOM
    imageLabel.appendChild(imageInput);
    imageInput.value = "";
});



// || Categories

// Initialise a categories array
const categoriesArray = [];

// Prepare elements
const articleForm = document.querySelector("#article-form");
const categoryInput = document.querySelector("[list='article-form-categories-input']");
const addCategoryButton = document.getElementById("article-form-add-category-button");
const delCategoryButton = document.getElementById("article-form-del-category-button");
const categoryDisplay = document.getElementById("article-form-categories-selected");


// Clear category input (reset upon click) 
categoryInput.addEventListener("focus", function() { // Non-arrow func for this. binding
    this.value = "";
});


// Add a category
addCategoryButton.addEventListener("click", () => {
    // If an author has entered or selected a category...
    if (categoryInput.value) {
        // ...and if that category does not already exist...
        if (!categoriesArray.includes(categoryInput.value)) {
            //...append it to the categories array
            categoriesArray.push(categoryInput.value);

            //...display its name in the display area
            let newCategory = document.createElement("li");
            newCategory.setAttribute("class", "label-size label-colour");
            newCategory.textContent = categoryInput.value;
            categoryDisplay.appendChild(newCategory);

            //...add a hidden form input to hold its value
            let hiddenInput = document.createElement("input");
            hiddenInput.setAttribute("type", "hidden");
            hiddenInput.setAttribute("name", "article-form-categories-selected");
            hiddenInput.setAttribute("value", categoryInput.value);
            hiddenInput.value = categoryInput.value;
            articleForm.appendChild(hiddenInput);
        } 
        else {   
             //...remind the author        
            alert(`${categoryInput.value} has already been selected`);
        }; 
    }
})

// Delete ultimate category (LIFO)
delCategoryButton.addEventListener("click", () => {
    if (categoryDisplay.firstChild) {
        categoriesArray.pop(); //...pop it off the array
        categoryDisplay.lastChild.remove(); //...remove it from the display area
        articleForm.lastChild.remove(); //...remove it from the article form
    }
})



// || Summaries 

// Prepare elements
const articleContent = document.getElementById("article-form-content");
const addParagraphButton = document.getElementById("add-paragraph");


// N.B.
// The following function has been put in place to help enforce LIFO for
// paragraph deletion. If first paragraphs are deleted first, indexing 
// from html through to SQL will be non-contiguous. 

// Furthermore, the delete-paragraph buttons are hidden, rather than removed
// from the DOM in order to preserve their event-listeners. In a simple codepen,
// I can move buttons around with their event listeners. However, when I move
// a delete-paragraph button to the preceding paragraph, it becomes unclickable.
// I still don't know why.

// Hide or show delete-paragraph button
function updateDelParaButton(paragraph, update) {

    // Get delete-paragraph button
    let button = paragraph.querySelector(".del-para-button");

    if (update == "hide") {
        //...hide the button
        button.classList.add("hidden");
    } else {
        //...if this is the ultimate paragraph and it is empty...
        let nextParagraph = paragraph.nextElementSibling;
        let levels = paragraph.querySelector("ul").childElementCount;
        let children = paragraph.childElementCount;
        if (!nextParagraph && levels === 0 && children < 5) {
            button.classList.remove("hidden");
        }
    }
}


// Add a paragraph to the article
addParagraphButton.addEventListener("click", () => {
    let paragraph = document.createElement("create-paragraph");
    let paragraphs = document.getElementsByTagName("create-paragraph");
    let paragraphIndex = paragraphs.length + 1; // Non zero-indexing
    paragraph.setAttribute("data-paragraph-index", paragraphIndex); 
    articleContent.appendChild(paragraph);

    // Hide previous paragraph's delete-paragraph button (enforce LIFO)
    let prevParagraph = paragraph.previousElementSibling;
    if (prevParagraph) {
        updateDelParaButton(prevParagraph, "hide");
    }
});
