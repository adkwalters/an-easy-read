// || Article CMS 

    // Add paragraph to article CMS
    function addParagraph(paragraphId) {
        
        // Select article content 
        const articleContent = document.getElementById("article-content");

        const newParagraph = document.createElement("create-paragraph");
        newParagraph.setAttribute("data-paragraph-level", paragraphId)
        
        // Append elements to article content
        articleContent.appendChild(h3);
        articleContent.appendChild(li);
        li.appendChild(customParagraph);
    }



// || Event Listeners 

    // Add event listeners once DOM is loaded
    function listenForContentLoaded() {

        // Add paragraph to content section of article form
        const addParagraphButton = document.getElementById("add-paragraph");
        const articleContent = document.getElementById("article-content");
        let paragraphIndex = 1;

        addParagraphButton.addEventListener("click", () => {
            const newParagraph = document.createElement("create-paragraph");
            newParagraph.setAttribute("data-paragraph-index", paragraphIndex);
            articleContent.appendChild(newParagraph);
            paragraphIndex++;
        });
    }
  


// || Let's gooooOOOoooo
    
    // Run event listeners once document content is fully loaded
    document.addEventListener("DOMContentLoaded", listenForContentLoaded);