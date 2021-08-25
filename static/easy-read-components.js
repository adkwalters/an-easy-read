// Create a custom class for adding paragraphs to the article CMS
class CreateParagraph extends HTMLElement {
    constructor() {
        super(); 
    }
    connectedCallback() {

        // Get paragraph index from html attribute and set level index counter
        const paragraphIndex = this.getAttribute("data-paragraph-index");

        // Prepare elements    
        const h3 = document.createElement("h3");
        h3.setAttribute("class", "paragraph-header");
        h3.innerHTML = `Paragraph ${paragraphIndex}`; 

        const ul = document.createElement("ul");
        ul.setAttribute("data-paragraph-index", paragraphIndex);

        const div = document.createElement("div");
        div.setAttribute("class", "article-content-controls")

        const divLeft = document.createElement("div");
        divLeft.setAttribute("class", "article-content-controls-left")

        const addButton = document.createElement("button");
        addButton.setAttribute("class", "button");
        addButton.setAttribute("type", "button");
        addButton.textContent = "Add";
        
        const addMenu = document.createElement("ul");
        addMenu.setAttribute("class", "button add-menu")
        addMenu.textContent = "Add...";  

        const addLevelButton = document.createElement("li");
        addLevelButton.setAttribute("class", "side-list add-level");
        addLevelButton.textContent = "level";  

        const addHeaderButton = document.createElement("li");
        addHeaderButton.setAttribute("class", "side-list add-header");
        addHeaderButton.textContent = "header";  

        const addImageButton = document.createElement("li");
        addImageButton.setAttribute("class", "side-list add-image");
        addImageButton.textContent = "image"; 
         
        const delLevelButton = document.createElement("button");
        delLevelButton.setAttribute("class", "button delete del-level-button");
        delLevelButton.setAttribute("type", "button");
        delLevelButton.textContent = "Delete Level";   
        
        const delParaButton = document.createElement("button");
        delParaButton.setAttribute("class", "button delete del-para-button");
        delParaButton.setAttribute("type", "button");
        delParaButton.textContent = "Delete Paragraph";

        // Attach elements to the DOM
        this.appendChild(h3);
        this.appendChild(ul);
        this.appendChild(div);
            div.appendChild(divLeft);
                divLeft.appendChild(addMenu);
                    addMenu.appendChild(addLevelButton);
                    addMenu.appendChild(addHeaderButton);
                    addMenu.appendChild(addImageButton);
            div.appendChild(delParaButton);
 

        // Add a level to the this paragraph
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
                div.appendChild(delLevelButton); 
            }
        });   
        

        // Add a header to this paragraph    
        addHeaderButton.addEventListener("click", () => {
            // If there is no current header...
            let currentHeader = this.querySelector("create-header");
            if (!currentHeader) {
                //...create one
                let header = document.createElement("create-header")
                header.setAttribute("data-paragraph-index", paragraphIndex);
                this.insertBefore(header, ul)
                //...set the create header option to unavailable
                let menuOption = this.querySelector(".add-header");
                menuOption.classList.add("unavailable")
                //...hide the delete-paragraph button
                updateDelParaButton(this, "hide") 
            } else {
                alert("A header has already been added for this paragraph")
            }
        });

        // Add an image to this paragraph
        addImageButton.addEventListener("click", () => {
            // If there is no current image...
            let currentImage = this.querySelector(".image-upload");
            if (!currentImage) {
                //...create one 
                let image = document.createElement("create-image");
                image.setAttribute("data-paragraph-index", paragraphIndex);
                //...ensure it is placed before a paragraph header
                let header = this.querySelector("create-header");
                if (header) {
                    this.insertBefore(image, header)
                } else {
                    this.insertBefore(image, ul)
                }
                //...set the create image option to unavailable
                let menuOption = this.querySelector(".add-image");
                menuOption.classList.add("unavailable")
                //...hide the delete-paragraph button
                updateDelParaButton(this, "hide") 
            } else {
                alert("An image has already been added for this paragraph")
            }
        });


        // Delete the ultimate level from this paragraph 
        delLevelButton.addEventListener("click", () => {
            ul.removeChild(ul.lastChild); 
            // If no level exists in this paragraph...
            if (ul.childElementCount === 0) {               
                //...remove the delete-level button
                delLevelButton.remove();
                // Show the delete-paragraph button
                updateDelParaButton(this, "show")
            }               
        });


        // Delete this paragraph
        delParaButton.addEventListener("click", () => {            
            // If this is the ultimate paragraph       
            let prevParagraph = this.previousElementSibling
            let nextParagraph = this.nextElementSibling;
            if (prevParagraph && !nextParagraph) {
                //...and if the previous paragraph is empty of content
                let levels = prevParagraph.querySelector("ul").childElementCount;
                let header = prevParagraph.querySelector("create-header");
                let image = prevParagraph.querySelector("create-image");
                if (levels === 0 && !header && !image) {
                    //...show the previous paragraph's delete-paragraph button
                    let button = prevParagraph.querySelector(".del-para-button");
                    button.classList.remove("hidden");
                }                
            }        
            // Remove this paragraph
            this.remove();
        }); 
    }
}
customElements.define("create-paragraph", CreateParagraph);



// Create a custom class for adding levels to the article CMS
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



// Create a custom class for adding headers to the article CMS
class CreateHeader extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {    

        // Generate label name   
        const paragraphIndex = this.getAttribute("data-paragraph-index");
        const labelName = `paragraph-${paragraphIndex}-header`
        
        // Prepare elements       
        const label = document.createElement("label");
        label.setAttribute("for", labelName);
        label.textContent = "Header:" 
       
        const textarea = document.createElement("textarea");
        textarea.setAttribute("name", labelName);
        textarea.setAttribute("class", "form-text form-text-header");

        const delHeaderButton = document.createElement("button");
        delHeaderButton.setAttribute("class", "button delete del-header-button");
        delHeaderButton.setAttribute("type", "button");
        delHeaderButton.textContent = "Delete Header";  

        // Attach elements to the DOM
        this.appendChild(label)
        this.appendChild(textarea)
        this.appendChild(delHeaderButton)

        // Delete header
        delHeaderButton.addEventListener("click", () => { 
            // Re-activate add-header option
            let menuOption = this.parentNode.querySelector(".add-header");
            menuOption.classList.remove("unavailable");
            // Show the delete-paragraph button
            updateDelParaButton(this.parentNode, "show")
            // Delete header and delete-header button
            delHeaderButton.remove();
            this.remove();
        });
    }
}
customElements.define("create-header", CreateHeader);


// Create a custom class for adding images to the article CMS
class CreateImage extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {    

        // Generate label names   
        const paragraphIndex = this.getAttribute("data-paragraph-index");
        const labelName = `paragraph-${paragraphIndex}-image`
        const altLabelName = `${labelName}-alt`
        
        // Prepare elements       
        const label = document.createElement("label");
        label.setAttribute("for", labelName);
        label.textContent = "Image:" 

        const input = document.createElement("input");
        input.setAttribute("name", labelName);
        input.setAttribute("class", "image-upload")
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*")

        const altLabel = document.createElement("label");
        altLabel.setAttribute("for", altLabelName);
        altLabel.textContent = "Image description:" 
        
        const altInput = document.createElement("input");
        altInput.setAttribute("name", altLabelName);
        altInput.setAttribute("class", "image-upload-alt");
        
        const delImageButton = document.createElement("button");
        delImageButton.setAttribute("class", "button delete del-image-button");
        delImageButton.setAttribute("type", "button");
        delImageButton.textContent = "Delete Image";  

        // Attach elements to the DOM
        this.appendChild(label);
        this.appendChild(input);
        this.appendChild(delImageButton);


        // fetch("/add-image", {
        //     method: "POST", 
        //     headers: {
        //         "Content-Type": "application/json" 
        //     },
        //     body: JSON.stringify(image)
        // })
        // .then(response => response.text()) 
        // .then(json => {
        //     console.log(json);
        // });

        // Add an image
        input.addEventListener("change", () => {
            // Get uploaded file
            let file = this.querySelector(".image-upload").files[0];
            // Display uploaded file 
            let img = document.createElement("img");
            img.setAttribute("class", "article-form-image");
            img.src = URL.createObjectURL(file);
            this.insertBefore(img, input);
            this.removeChild(input);
            this.removeChild(label);
            this.insertBefore(altLabel, delImageButton);
            this.insertBefore(altInput, delImageButton);


            // console.log(`File name: ${file.name}`)
            // console.log(`File name: ${file.lastModified}`)

            // let reader = new FileReader();

            // reader.readAsDataURL(file);

            // reader.onload = () => {
            //     console.log(reader.result);
            // };

            // reader.error = () => {
            //     console.log(reader.error);
            // };

        });


        // Delete image
        delImageButton.addEventListener("click", () => { 
            // Re-activate add-image option
            let menuOption = this.parentNode.querySelector(".add-image");
            menuOption.classList.remove("unavailable");
            // Show the delete-paragraph button
            updateDelParaButton(this.parentNode, "show")
            // Delete image and delete-image button
            delImageButton.remove();
            this.remove();
        });
    }
}
customElements.define("create-image", CreateImage);



























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