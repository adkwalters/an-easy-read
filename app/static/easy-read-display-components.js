// !! The following has not been updated in a long time
// and has been separated from new code

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