// // || Article CMS 

// || Event Listeners 

    // Add event listeners once DOM is loaded
    function listenForContentLoaded() {

        // Add paragraph to content section of article form
        const addParagraphButton = document.getElementById("add-paragraph");
        const articleContent = document.getElementById("article-form-content");
        
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