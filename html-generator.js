// Create a custom class 
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
        summaryLevel1.setAttribute("class", "summary level-1")

        // Get attribute content and set it as paragraph text
        const level1Para = document.createElement("p");
        level1Para.textContent = this.getAttribute("data-text"); 

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
        summaryLevel1.appendChild(level1Para);
    }
}

customElements.define("summary-paragraph", SummaryParagraph);
