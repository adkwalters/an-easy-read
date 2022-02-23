// <summary-paragraph>
class SummaryParagraph extends HTMLElement {
    constructor() {
        super();

        // Create object array to hold summaries
        this.summaries = [];

        // Set the reading level
        this.setLevel = (difficulty) => {
            if (this.summaries.length > 0) {
                // Hide all summaries
                for (let summary of this.summaries) {
                    summary.classList.remove("cursor");
                    summary.classList.add("no-display");
                }
                // Display highest level
                if (difficulty == "hardest") {
                    this.summaries[this.summaries.length -1].classList.replace("no-display", "cursor");
                }
                // Display lowest level
                else if (difficulty == "easiest") {
                    this.summaries[0].classList.replace("no-display", "cursor");
                }
            }
        }

        // Increase reading level
        this.increaseLevel = () => {
            let cursor = this.summaries.indexOf(this.querySelector(".cursor"));
            let current = this.summaries[cursor];
            let next = this.summaries[cursor + 1];
            if (next) {
                // Hide current level and display next level
                current.classList.replace("cursor", "no-display");
                next.classList.replace("no-display", "cursor");
            }
        }

        // Decrease reading level
        this.decreaseLevel = () => {
            let cursor = this.summaries.indexOf(this.querySelector(".cursor"));
            let current = this.summaries[cursor];
            let previous = this.summaries[cursor - 1];
            if (previous) {
                // Hide current level and display previous level
                current.classList.replace("cursor", "no-display");
                previous.classList.replace("no-display", "cursor");  
            }
        }

        // Display arrows controls to inc/decrease level
        this.displayArrows = () => {
            // Get arrows
            let incArrow = this.shadowRoot.querySelector(".next");
            let decArrow = this.shadowRoot.querySelector(".prev");
            if (this.summaries.length > 0) {
                // If highest level, remove increase arrow
                if (this.summaries[this.summaries.length -1].classList.contains("cursor")) {
                    incArrow.classList.add("no-display");
                } else {
                    incArrow.classList.remove("no-display");
                }  
                // If lowest level, remove decrease arrow
                if (this.summaries[0].classList.contains("cursor")) {
                    decArrow.classList.add("no-display");
                } else {
                    decArrow.classList.remove("no-display");
                }  
            }
            else {
                if (incArrow) { incArrow.remove(); }
                if (decArrow) { decArrow.remove(); }
            }
        }
    }

    connectedCallback() {

        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Add styling
        const style = document.createElement("style");
        style.textContent = `
            ::slotted([slot=slot-image]) {
                width: 100%;
            }            
            ::slotted([slot=slot-summary]) {
                margin: 1rem;
                background: var(--foreground);
                border-radius: 10px;
            }
            div.summary-div {
                position: relative;
            }
            .prev,
            .next {
                position: absolute;
                transform: translateY(-50%);
                top: 50%;
                margin: 0;
                padding: 0;
                background: none;
                border: none;
                font-size: 2rem;
                color: #888;
            }
            .prev {
                left: -1rem;
            }
            .next {
                right: -1rem;
            }
            .prev:active,
            .next:active {
                color: var(--contrast-dark);
                text-shadow: 0 0 1rem rgba(0,0,0,0.4);
            }
            .no-display {
                display: none;
            }

            @media (hover: hover) {
                .prev:hover,
                .next:hover  {
                    color: var(--contrast-dark);
                    text-shadow: 0 0 1rem rgba(0,0,0,0.4);
                }
            }

            @media (min-width: 48rem) {
                .prev {
                    left: -2rem;
                }
                .next {
                    right: -2rem;
                }
            }

            @media print {
                .prev,
                .next {
                    display: none;
                }
            }
            `;

        // Prepare elements
        const div = document.createElement("div");
        div.setAttribute("class", "summary-div");

        const imageSlot = document.createElement("slot");
        imageSlot.setAttribute("name", "slot-image");

        const headerSlot = document.createElement("slot");
        headerSlot.setAttribute("name", "slot-header");

        const summarySlot = document.createElement("slot");
        summarySlot.setAttribute("name", "slot-summary");

        const incButton = document.createElement("button");
        incButton.setAttribute("class", "next");
        incButton.innerHTML = "&#10095;";

        const decButton = document.createElement("button");
        decButton.setAttribute("class", "prev");
        decButton.innerHTML = "&#10094;";        

        // Append elements to shadow DOM
        shadow.appendChild(style);
        shadow.appendChild(imageSlot);
        shadow.appendChild(headerSlot);
        shadow.appendChild(div);
            div.appendChild(summarySlot);
            div.appendChild(decButton);
            div.appendChild(incButton);

        // Append slotted summaries to object array
        summarySlot.addEventListener("slotchange", () => {
            this.summaries = summarySlot.assignedNodes();
            this.displayArrows();
        })

        // Increase reading level and configure arrow controls
        incButton.addEventListener("click", () => {
            this.increaseLevel();
            this.displayArrows();
        });

        // Decrease reading level and configure arrow controls
        decButton.addEventListener("click", () => {
            this.decreaseLevel();
            this.displayArrows();
        });
    }
}
customElements.define("summary-paragraph", SummaryParagraph);


