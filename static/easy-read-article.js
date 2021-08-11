// || Article control

    // Change article font size to selected size
    const changeFontSize = (size) => {
        const articleText = document.getElementsByTagName("html");

        // Remove all font-size selections...
        articleText[0].classList.remove("small-font", "medium-font", "large-font");
       
        //...then add selected font-size 
        articleText[0].classList.add(size);
    }

    // Print currently displayed summary paragraphs
    const printArticle = () => {
        const article = document.getElementsByTagName("article-text")[0];
        print(article); 
    }



//  || Summary control
          
    // Display selected summary level // UNTESTED
    function displaySummary(paragraph, level) { // Design backend to determine best parameters

        // Save copy 
        const text = level.textContent;  // How do I actually access text content?

        // Return custom element 
        return `<p slot="summary-text-level-${level}">${text}</p>`
    }    


    // Hide summary increase or decrease arrows wherever summary is unavailable
    function greyOutArrows() {

        summaryUp = this.previousElementSibling
        summaryDown = this.nextElementSibling
        
        console.log("prev: " + summaryUp + ", next: " + summaryDown);
    }



// || Event Listeners 

    // Add event listeners once DOM is loaded
    function listenForContentLoaded() {
        
        // Article Control

            // Set user-selected default summary level
           
            

            // Set user-selected summary font size (all)
            const smallFont = document.getElementById("font-size-small");
            const mediumFont = document.getElementById("font-size-medium");
            const largeFont = document.getElementById("font-size-large");
        
            smallFont.addEventListener("click", () => { changeFontSize("small-font"); });
            mediumFont.addEventListener("click", () => { changeFontSize("medium-font"); });
            largeFont.addEventListener("click", () => { changeFontSize("large-font"); });
    
            // Print article showing current summaries
            const printButton = document.getElementById("print-article");

            printButton.addEventListener("click", printArticle);

    
        // Summary Control

            // Set author-selected default summary level 

            
            // Set user-selected  summary level (individual)


            
        }


// || Let's gooooOOOoooo
    
    // Run event listeners once document content is fully loaded
    document.addEventListener("DOMContentLoaded", listenForContentLoaded);