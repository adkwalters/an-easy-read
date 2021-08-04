// Create a custom class for the summary paragraphs
class SummaryParagraph extends HTMLElement {
    constructor() {
        super();

        // Create a shadow root
        const shadow = this.attachShadow({mode: "open"});

        // Create elements
        const wrapper = document.createElement("div");
        wrapper.setAttribute("class", "summary-paragraph label-colour");

        const incButton = document.createElement("button");
        incButton.setAttribute("class", "prev");
        incButton.innerHTML = "&#10094;";

        const decButton = document.createElement("button");
        decButton.setAttribute("class", "next");
        decButton.innerHTML = "&#10095;";

        const summaryUL = document.createElement("ul");

        const summaryLevel1 = document.createElement("li");
        summaryLevel1.setAttribute("class", "summary level-1");

        const summaryLevel2 = document.createElement("li");
        summaryLevel2.setAttribute("class", "summary level-2");

        const summaryLevel3 = document.createElement("li");
        summaryLevel3.setAttribute("class", "summary level-3");

        // Get templates and content
        const templateSummary = document.getElementById("summary-paragraph-text");
        const templateSummaryContent = templateSummary.content;

        // Apply external styles to the shadow DOM
        const styleLink = document.createElement("link");
        styleLink.setAttribute("rel", "stylesheet");
        styleLink.setAttribute("href", "easy-read.css");

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
}
customElements.define("summary-paragraph", SummaryParagraph);


// Create a custom class for the summary headers
class SummaryHeader extends HTMLElement {
    constructor() {
        super();

        // Create shadow root
        const shadow = this.attachShadow({mode: "open"});

        // Create elements
        const header = document.createElement("h2");
        header.setAttribute("class", "summary-header");

        // Get template and content
        const templateHeader = document.getElementById("summary-paragraph-header");
        const templateHeaderContent = templateHeader.content;

        // Attach elements to the shadow DOM
        shadow.appendChild(header);
        header.appendChild(templateHeaderContent.cloneNode(true));
    }
}
customElements.define("summary-header", SummaryHeader);
