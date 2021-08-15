// // || Article CMS 
    
    // Initialise a categories array
    const categoriesArray = [];


// || Event Listeners 

    // Add event listeners once DOM is loaded
    function listenForContentLoaded() {

        // Add selected category to article form
        const addCategoryButton = document.getElementById("article-form-add-category-button");
        const articleFormCategoriesList = document.querySelector(".article-form-categories-list")

        // Upon click, add an element to the category list
        addCategoryButton.addEventListener("click", () => {
            const newCategory = document.createElement("li");
            newCategory.setAttribute("class", "label-size label-colour");

            // If a user selects a value, get that value... 
            const categoryText = document.querySelector("input[name='article-form-categories']").value
            if (categoryText) {

                // If it exists, throw an alert
                if (categoriesArray.includes(categoryText)) {
                    alert("Category already exists");
                //...else add it to the categories array and display it as a list element
                } else {
                    categoriesArray.push(categoryText);
                    newCategory.textContent = categoryText;
                    articleFormCategoriesList.appendChild(newCategory);
                };                
            }

            // How to get the data of all categories added?
        })

        // Delete category from article form
        const delCategoryButton = document.getElementById("article-form-del-category-button");

        // Upon click, if the list has an item, delete the ultimate item (LIFO)
        delCategoryButton.addEventListener("click", () => {
            if (articleFormCategoriesList.firstChild) {
                articleFormCategoriesList.lastChild.remove();
            }
        })

        // Add paragraph to content section of article form
        const addParagraphButton = document.getElementById("add-paragraph");
        const articleContent = document.getElementById("article-form-content");
        
        // Upon click, add a custom element with an index equal to the number of paragraphs displayed 
        addParagraphButton.addEventListener("click", () => {
            const newParagraph = document.createElement("create-paragraph");
            let paragraphIndex = document.getElementsByTagName("create-paragraph").length; 
            newParagraph.setAttribute("data-paragraph-index", paragraphIndex + 1); // Non zero-indexing
            articleContent.appendChild(newParagraph);

            const allDelParaButtons = document.getElementsByClassName("del-paragraph");
            const previousDelParaButtons = Array.from(allDelParaButtons).slice(0, -1); // Excludes ultimate

            // Hide all previous delete paragraph buttons (enforces LIFO while keeping event listener)
            for (const button of previousDelParaButtons) {
                button.classList.add("hidden");
            }
        });
    }
  


// || Let's gooooOOOoooo
    
    // Run event listeners once document content is fully loaded
    document.addEventListener("DOMContentLoaded", listenForContentLoaded);