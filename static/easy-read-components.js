// Create a custom class for each paragraph in the article CMS
class CreateParagraph extends HTMLElement {
    constructor() {
        super(); 
    }
    connectedCallback() {

        // Get paragraph index from html attribute and set level index counter
        const paragraphIndex = this.getAttribute("data-paragraph-index");

        // Prepare elements    
        const li = document.createElement("li");

        const h3 = document.createElement("h3");
        h3.innerHTML = `Paragraph ${paragraphIndex}`; 

        const ul = document.createElement("ul");
        ul.setAttribute("data-paragraph-index", paragraphIndex);

        const div = document.createElement("div");
        div.setAttribute("class", "article-form-summary-controls")

        const addLevelButton = document.createElement("button");
        addLevelButton.setAttribute("class", "add-level");
        addLevelButton.setAttribute("type", "button");
        addLevelButton.textContent = "Add Level";    

        const delParaButton = document.createElement("button");
        delParaButton.setAttribute("class", "del-paragraph");
        delParaButton.setAttribute("type", "button");
        delParaButton.textContent = "Delete Paragraph";

        const delLevelButton = document.createElement("button");
        delLevelButton.setAttribute("class", "del-level");
        delLevelButton.setAttribute("type", "button");
        delLevelButton.textContent = "Delete Level";

        // Attach elements to the DOM
        this.appendChild(li);
        li.appendChild(h3);
        li.appendChild(ul);
        li.appendChild(div);
        div.appendChild(addLevelButton);
        div.appendChild(delParaButton);

        // Add a level to the article paragraph
        addLevelButton.addEventListener("click", () => {
            let level = document.createElement("create-level"); 
            let levels = this.getElementsByTagName("create-level")
            let levelIndex = levels.length + 1; // Non-zero indexing
            level.setAttribute("data-paragraph-index", paragraphIndex);
            level.setAttribute("data-level-index", levelIndex)
            level.setAttribute("class", "custom-level")
            ul.appendChild(level);
               
            // If this is the first level...
            if (ul.childElementCount === 1) {
                //...hide the delete-paragraph button
                updateDelParaButton(this, "hide")
                //...add a delete-level button as a first child
                div.prepend(delLevelButton); 
            }
        });    

        // Delete the ultimate level from the article paragraph 
        delLevelButton.addEventListener("click", () => {
            ul.removeChild(ul.lastChild); 
            // If no level exists...
            if (ul.childElementCount === 0) {               
                //...remove the delete-level button
                div.removeChild(delLevelButton);
                //...show the delete-paragraph button
                if (!this.nextElementSibling) {
                    updateDelParaButton(this, "show")
                }
            }        
        });

        // Delete this paragraph
        delParaButton.addEventListener("click", () => {
            // If there is a previous paragraph...         
            let prevParagraph = this.previousElementSibling
            if (prevParagraph) {
                //...and if no levels exist in that paragraph...
                let prevParagraphUl = prevParagraph.querySelector("ul");
                let prevParagraphLevels = prevParagraphUl.childElementCount;
                if (prevParagraphLevels === 0) {
                    //...show it's delete-paragraph button   
                    updateDelParaButton(prevParagraph, "show")
                }
            }        
            // Remove this paragraph
            this.remove();
        }); 
    }
}
customElements.define("create-paragraph", CreateParagraph);



// Create a custom class for each level in the article CMS
class CreateLevel extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {

        // Get paragraph and level indices from html attributes
        const paragraphIndex = this.getAttribute("data-paragraph-index");
        const levelIndex = this.getAttribute("data-level-index");

        // Generate id to be used in name attribute
        const levelId = `paragraph-${paragraphIndex}-level-${levelIndex}`;
                
        // Prepare elements
        const li = document.createElement("li");
        
        const label = document.createElement("label");
        label.setAttribute("for", levelId);
        label.textContent = `Level ${levelIndex}:`; 
       
        const textarea = document.createElement("textarea");
        textarea.setAttribute("id", levelId);
        textarea.setAttribute("name", levelId);
        textarea.setAttribute("class", "form-text");

        // Attach elements to the DOM
        this.appendChild(li);
        li.appendChild(label);
        label.appendChild(textarea);
    }
}
customElements.define("create-level", CreateLevel);

















// Create a custom class for the summary paragraphs
class SummaryParagraph extends HTMLElement {
    constructor() {
        super();
    }
        connectedCallback() {
    
        // Note, this constructor seems to demand a shadow DOM.
        // When I removed the shadow DOM, an error was throw
        // saying that the custom element should not have children.
        
        // Create a shadow root
        const shadow = this.attachShadow({mode: "open"});

        // Bind 'this' keyword to custom element, 
        // not the object that triggers the callback
        this.increase = this.increase.bind(this);
        this.decrease = this.decrease.bind(this);

        // Prepare elements
        const wrapper = document.createElement("div");
        wrapper.setAttribute("class", "summary-paragraph label-colour");

        const summaryUL = document.createElement("ul");

        const summaryLevel1 = document.createElement("li");
        summaryLevel1.setAttribute("class", "summary level-1");

        const summaryLevel2 = document.createElement("li");
        summaryLevel2.setAttribute("class", "summary level-2");

        const summaryLevel3 = document.createElement("li");
        summaryLevel3.setAttribute("class", "summary level-3");

        const incButton = document.createElement("button");
        incButton.setAttribute("class", "prev");
        incButton.innerHTML = "&#10094;";
        incButton.addEventListener("click", this.increase);

        const decButton = document.createElement("button");
        decButton.setAttribute("class", "next");
        decButton.innerHTML = "&#10095;";
        decButton.addEventListener("click", this.decrease);

        // Get templates and content
        const templateSummary = document.getElementById("summary-paragraph-text");
        const templateSummaryContent = templateSummary.content;

        // Apply external styles to the shadow DOM
        const styleLink = document.createElement("link");
        styleLink.setAttribute("rel", "stylesheet");
        styleLink.setAttribute("href", "/static/easy-read.css");

        // Attach elements to the shadow DOM
        shadow.appendChild(styleLink);
        shadow.appendChild(wrapper);
        wrapper.appendChild(incButton);
        wrapper.appendChild(decButton);
        wrapper.appendChild(summaryUL);
        summaryUL.appendChild(summaryLevel1);
        summaryUL.appendChild(summaryLevel2);
        summaryUL.appendChild(summaryLevel3);
        summaryLevel1.appendChild(templateSummaryContent.cloneNode(true));
    }
    // Is this the proper way to define methods? 
    // It's not allowing function or this keywords to be declared
    increase() {  
        console.log("increase this summary");
        console.log(this);
    }

    decrease() {
        console.log("decrease this summary");
        console.log(this);
    }
}
customElements.define("summary-paragraph", SummaryParagraph);


// Create a custom class for the summary headers
class SummaryHeader extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {

        // Note, this constructor seems to demand not to be put 
        // in a connectedCallback(). If it is, the slot default
        // values are shown along the custom values

        // Prepare elements
        const header = document.createElement("h2");
        header.setAttribute("class", "summary-header");

        // Get template and content
        const templateHeader = document.getElementById("summary-paragraph-header");
        const templateHeaderContent = templateHeader.content;

        // Attach elements to the shadow DOM
        this.appendChild(header);
        header.appendChild(templateHeaderContent.cloneNode(true));
    }
}
customElements.define("summary-header", SummaryHeader);