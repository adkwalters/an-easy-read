// // || Article CMS 
    
    // Initialise a categories array
    const categoriesArray = [];


// || Event Listeners 

    // Add event listeners once DOM is loaded
    function listenForContentLoaded() {

        // || Categories

        // Get elements needed for category control and display
        const articleForm = document.querySelector("#article-form");
        const articleFormCategoriesInput = document.querySelector("[list='article-form-categories-input']")
        const addCategoryButton = document.getElementById("article-form-add-category-button");
        const delCategoryButton = document.getElementById("article-form-del-category-button");
        const articleFormCategoriesSelected = document.getElementById("article-form-categories-selected")

        // Upon focus, clear input
        articleFormCategoriesInput.addEventListener("focus", function() { // Non-arrow for this() binding
            this.value = "";
        });

        // Upon click, add a category to the DOM
        addCategoryButton.addEventListener("click", () => {

            // If an author enters or selects a category...
            if (articleFormCategoriesInput.value) {

                // If the category already exists, remind the author...
                if (categoriesArray.includes(articleFormCategoriesInput.value)) {
                    alert("Category already exists");
                } else {
                    //...create a new list item
                    let newCategory = document.createElement("li");
                    newCategory.setAttribute("class", "label-size label-colour");

                    //...add the category to the categories array and display area
                    categoriesArray.push(articleFormCategoriesInput.value);
                    newCategory.textContent = articleFormCategoriesInput.value;
                    articleFormCategoriesSelected.appendChild(newCategory);

                    //...add a hidden input with a value = category
                    let hiddenCategoryInput = document.createElement("input")
                    hiddenCategoryInput.setAttribute("type", "hidden")
                    hiddenCategoryInput.setAttribute("name", "article-form-categories-selected")
                    hiddenCategoryInput.setAttribute("value", articleFormCategoriesInput.value)
                    hiddenCategoryInput.value = articleFormCategoriesInput.value;
                    articleForm.appendChild(hiddenCategoryInput);
                }; 
            }
        })
        
        // Upon click, delete the ultimate item from the DOM (LIFO)
        delCategoryButton.addEventListener("click", () => {
            
            // If the author has a previously selected category...
            if (articleFormCategoriesSelected.firstChild) {
                //...remove the last category from the display area
                articleFormCategoriesSelected.lastChild.remove();
                //...remove its hidden input form
                articleForm.lastChild.remove();
                //...pop it off the array 
                categoriesArray.pop(); 
            }
        })



        // || Paragraphs 

        // Get elements needed for paragraph control
        const articleContent = document.getElementById("article-form-content");
        const addParagraphButton = document.getElementById("add-paragraph");
        
        // Upon click, add a paragraph input to the article form 
        // custom element with an index equal to the number of paragraphs displayed 
        addParagraphButton.addEventListener("click", () => {
            // Create a new custom paragraph item (see components.js)
            let newParagraph = document.createElement("create-paragraph");
            //...find and set its index
            let paragraphIndex = document.getElementsByTagName("create-paragraph").length; 
            newParagraph.setAttribute("data-paragraph-index", paragraphIndex + 1); // Non zero-indexing
            //...and add it to the DOM
            articleContent.appendChild(newParagraph);

            // // Hide all but the ultimate paragraph's delete button (enforces LIFO)
            // let allDelParaButtons = document.getElementsByClassName("del-paragraph");
            // let previousDelParaButtons = Array.from(allDelParaButtons).slice(0, -1); // Excludes ultimate
            // // n.b hiding rather than deleting the button keeps its event listener
            // for (let button of previousDelParaButtons) {
            //     // button.classList.add("hidden");
            //     // console.log(button.parentNode)
            //     // button.remove();
            // }
        });
    }
  


// || Let's gooooOOOoooo
    
    // Run event listeners once document content is fully loaded
    document.addEventListener("DOMContentLoaded", listenForContentLoaded);