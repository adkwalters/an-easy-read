// !! The following elements use a LIFO system of content deletion
// in order to preserve content indicies (data-paragraph-index, data-level-index)
// If the author were to be allowed to delete content out of sequence,
// content indicies would need to be pulled by the server
// rather than pushed by the client

// <article-image> 
class ArticleImage extends HTMLElement {
    constructor() {
        super(); 
    }
    connectedCallback() {
        
        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Attach external stylesheet
        const styleLink = document.createElement("link");
        styleLink.setAttribute("rel", "stylesheet");
        styleLink.setAttribute("href", "/static/easy-read.css");

        // Prepare elements 
        const label = document.createElement("label");
        label.setAttribute("for", "article-form-main-image-input");
        label.textContent = "Main image";

        const fileInput = document.createElement("input");
        fileInput.setAttribute("name", "article-form-main-image-input");
        fileInput.setAttribute("class", "image-upload");
        fileInput.setAttribute("type", "file");
        fileInput.setAttribute("accept", "image/*");
        
        const slotImg = document.createElement("slot");
        slotImg.setAttribute("name", "slot-article-image");

        const img = document.createElement("img");
        img.setAttribute("class", "article-form-image");
        img.setAttribute("slot", "slot-article-image");
        
        const slotAlt = document.createElement("slot");
        slotAlt.setAttribute("name", "slot-article-image-alt");

        const altLabel = document.createElement("label");
        altLabel.setAttribute("for", "article-image-alt");
        altLabel.textContent = "Image description:";
        
        const altInput = document.createElement("input");
        altInput.setAttribute("name", "article-image-alt");
        altInput.setAttribute("slot", "slot-article-image-alt");

        const imageId = document.createElement("input");
        imageId.setAttribute("name", "article-image-id");
        imageId.setAttribute("type", "hidden");
        
        const delImageButton = document.createElement("button");
        delImageButton.setAttribute("class", "button delete del-image-button");
        delImageButton.setAttribute("type", "button");
        delImageButton.textContent = "Delete Image";  

        // Append elements to shadow DOM
        shadow.appendChild(styleLink);
        shadow.appendChild(label);
            label.appendChild(fileInput);
        shadow.appendChild(slotImg);
        shadow.appendChild(slotAlt);
  
        // Add article image
        fileInput.addEventListener("change", () => {

            // Get file
            let file = this.shadowRoot.querySelector(".image-upload").files[0];
        
            if (file) {
        
                // Create image URL
                img.src = URL.createObjectURL(file);
        
                // Post image to the server asynchronously 
                postImageAsync(file).then(response => {
        
                    // Save image ID to hidden input
                    imageId.value = response.image_id;
        
                    // Append elements to shadow DOM
                    this.appendChild(imageId);  
                    this.appendChild(img);
                    this.appendChild(altInput); 
                                         
                });
            }
        });

        
        // Ensure one article image per article 
        slotImg.addEventListener("slotchange", () => {
           
            // Get image
            let images = slotImg.assignedNodes({flatten: true});
            
            // If image exists
            if (images.length > 0) {

                // Show image-alt header
                shadow.insertBefore(altLabel, slotAlt);

                // Show image-delete button
                shadow.appendChild(delImageButton);

                // If image input exists 
                if (label.contains(fileInput)) {

                    // Remove image input
                    label.removeChild(fileInput);
                }
            }
        });


// Delete content

        // Delete this paragraph
        delImageButton.addEventListener("click", () => {  

            // Get image content
            let slottedImage = slotImg.assignedNodes();
            let slottedAlt = slotAlt.assignedNodes();

            // If image exists
            if (slottedImage.length > 0) {

                // Remove image elements
                slottedImage[0].remove();
                slottedAlt[0].remove();
                altLabel.remove();
                delImageButton.remove();

                // !! What about hidden input

                // Re-append image file input
                label.appendChild(fileInput);
                fileInput.value = "";    
            }
        }); 
    }
}
customElements.define("article-image", ArticleImage);



// <article-content> 
class ArticleContent extends HTMLElement {
    constructor() {
        super(); 
    }
    connectedCallback() {
        
        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Attach external stylesheet
        const styleLink = document.createElement("link");
        styleLink.setAttribute("rel", "stylesheet");
        styleLink.setAttribute("href", "/static/easy-read.css");

        // Prepare elements    
        const articleContentHeader = document.createElement("h2");
        articleContentHeader.setAttribute("class", "article-form-paragraph-header");
        articleContentHeader.innerHTML = "Article Content"; 

        const slotParagraphs = document.createElement("slot");
        slotParagraphs.setAttribute("name", "slot-article-paragraphs");

        const delParaButton = document.createElement("button");
        delParaButton.setAttribute("class", "button delete del-para-button");
        delParaButton.setAttribute("type", "button");
        delParaButton.textContent = "Delete Paragraph";

         // Append elements to shadow DOM
        shadow.appendChild(styleLink);
        shadow.appendChild(articleContentHeader);
        shadow.appendChild(slotParagraphs);

// Track content

        // Display delete-paragraph button for last paragraph only (LIFO)
        slotParagraphs.addEventListener("slotchange", () => {
            
            // Get all paragraphs
            let paragraphs = slotParagraphs.assignedNodes({flatten: true});
            
            // Get last paragraph
            let lastParagraph = paragraphs[paragraphs.length -1];

            for (let paragraph of paragraphs) {
  
                // Get paragraph controls
                let controls = paragraph.shadowRoot.querySelector(".article-form-paragraph-controls");
                let button = controls.querySelector(".del-para-button");

                // If this is the last paragraph and it is empty 
                if (paragraph == lastParagraph && paragraph.childElementCount == 0) {
                    
                    // If no button exists
                    if (!controls.contains(button)) {

                        // Append button
                        controls.appendChild(delParaButton);
                    }
                } 
                else {
                
                    // If button exists
                    if (controls.contains(button)) {

                        // Remove button
                        controls.removeChild(button);
                    }
                }
            }      
        });


// Delete content

        // Delete this paragraph
        delParaButton.addEventListener("click", (event) => {  
            let paragraph = event.target.getRootNode().host; 
            paragraph.remove();
        }); 
    }
}
customElements.define("article-content", ArticleContent);


// <article-paragraph> 
class ArticleParagraph extends HTMLElement {
    constructor() {
        super(); 
    }
    connectedCallback() {

        // Get paragraph index from html attribute and set level index counter
        const paragraphIndex = this.getAttribute("data-paragraph-index");

        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Attach external stylesheet
        const styleLink = document.createElement("link");
        styleLink.setAttribute("rel", "stylesheet");
        styleLink.setAttribute("href", "/static/easy-read.css");

        // Prepare elements    
        const paragraphHeader = document.createElement("h3");
        paragraphHeader.setAttribute("class", "article-form-paragraph-header");
        paragraphHeader.innerHTML = `Paragraph ${paragraphIndex}`; 

        const slotImage = document.createElement("slot");
        slotImage.setAttribute("name", "slot-paragraph-image");

        const slotHeader = document.createElement("slot");
        slotHeader.setAttribute("name", "slot-paragraph-header");

        const slotLevels = document.createElement("slot");
        slotLevels.setAttribute("name", "slot-paragraph-levels");

        const paragraphControls = document.createElement("div");
        paragraphControls.setAttribute("class", "article-form-paragraph-controls");

        const addMenu = document.createElement("div");
        addMenu.setAttribute("class", "article-form-add-menu");
        
        const addMenuList = document.createElement("ul");
        addMenuList.setAttribute("class", "button add-menu-list");
        addMenuList.textContent = "Add...";  

        const addLevelButton = document.createElement("li");
        addLevelButton.setAttribute("class", "add-menu add-level");
        addLevelButton.textContent = "level";  

        const addHeaderButton = document.createElement("li");
        addHeaderButton.setAttribute("class", "add-menu add-header");
        addHeaderButton.textContent = "header";  

        const addImageButton = document.createElement("li");
        addImageButton.setAttribute("class", "add-menu add-image");
        addImageButton.textContent = "image"; 
                 
        const delParaButton = document.createElement("button");
        delParaButton.setAttribute("class", "button delete del-para-button");
        delParaButton.setAttribute("type", "button");
        delParaButton.textContent = "Delete Paragraph";

        const delLevelButton = document.createElement("button");
        delLevelButton.setAttribute("class", "button delete del-level-button");
        delLevelButton.setAttribute("type", "button");
        delLevelButton.textContent = "Delete Level";   

        // Append elements to shadow DOM
        shadow.appendChild(styleLink);
        shadow.appendChild(paragraphHeader);
        shadow.appendChild(slotImage);
        shadow.appendChild(slotHeader);
        shadow.appendChild(slotLevels);
        shadow.appendChild(paragraphControls);
            paragraphControls.appendChild(addMenu);
                addMenu.appendChild(addMenuList);
                    addMenuList.appendChild(addImageButton);
                    addMenuList.appendChild(addHeaderButton);
                    addMenuList.appendChild(addLevelButton);
            paragraphControls.appendChild(delParaButton);

// Add content

        // Add image to paragraph
        addImageButton.addEventListener("click", () => {

            // Get image content 
            let imageSlot = this.shadowRoot.querySelector("[name='slot-paragraph-image']");
            let imageContent = imageSlot.assignedNodes({flatten: true});
            
            // If no image exists
            if (imageContent.length < 1) {

                // Create image 
                let image = document.createElement("paragraph-image");
                image.setAttribute("data-paragraph-index", paragraphIndex);
                image.setAttribute("slot", "slot-paragraph-image");
                
                // Add header to shadow DOM
                this.appendChild(image);

                // Scroll into view
                image.scrollIntoView({block: "center", behavior: "smooth"});
            }
            else {
                
                // Alert author
                alert("An image has already been added for this paragraph");

            }
        });


        // Add header to paragraph    
        addHeaderButton.addEventListener("click", () => {

            // Get header content
            let headerSlot = this.shadowRoot.querySelector("[name='slot-paragraph-header']");
            let headerContent = headerSlot.assignedNodes({flatten: true});
            
            // If no header exists
            if (headerContent.length < 1) {

                // Create header
                let header = document.createElement("paragraph-header");
                header.setAttribute("data-paragraph-index", paragraphIndex);
                header.setAttribute("slot", "slot-paragraph-header");

                // Attach header to shadow DOM
                this.appendChild(header);

                // Scroll into view
                header.scrollIntoView({block: "center", behavior: "smooth"});
            } 
            else {

                // Alert author
                alert("A header has already been added for this paragraph");
            }
        });

        
        // Add level to paragraph
        addLevelButton.addEventListener("click", () => {
            
            // Calculate level index (non-zero)
            let levels = this.querySelectorAll("paragraph-level");
            let levelIndex = levels.length + 1; 

            // Create level
            let level = document.createElement("paragraph-level"); 
            level.setAttribute("data-paragraph-index", paragraphIndex);
            level.setAttribute("class", "custom-level");
            level.setAttribute("data-level-index", levelIndex);
            level.setAttribute("slot", "slot-paragraph-levels");
                
            // Add level to shadow DOM
            this.appendChild(level);       

            // Scroll into view
            level.scrollIntoView({block: "center", behavior: "smooth"});
        });   


// Delete Content

        // Initialise delete-paragraph criteria
        let imageSlotEmpty = true;
        let headerSlotEmpty = true;
        let levelsSlotEmpty = true;

        // Add or remove delete-paragraph button
        const updateDelParaButton = () => {
            
            // If this is the last paragraph and it is empty
            if (!this.nextElementSibling && imageSlotEmpty && headerSlotEmpty && levelsSlotEmpty) {
                
                // Display button
                paragraphControls.appendChild(delParaButton);
            } 
            else {
           
                // If button already exists
                if (paragraphControls.contains(delParaButton)) {
                    
                    // Remove button
                    paragraphControls.removeChild(delParaButton);
                }
            }
        }
        // Update button
        updateDelParaButton();

        
        // Delete this paragraph
        delParaButton.addEventListener("click", () => {   

            // Update previous paragraph's button
            updateDelParaButton(); 

            // Delete paragraph
            this.remove();
        }); 


        // Delete last level (LIFO)
        delLevelButton.addEventListener("click", () => {
            
            // Get last level
            let levelsSlot = this.shadowRoot.querySelector("[name='slot-paragraph-levels']");
            let levels = levelsSlot.assignedNodes({flatten: true});
            let lastLevel = levels[levels.length -1];
            
            // Delete last level
            lastLevel.remove();
        })


// Track content           

        // Mark image as empty or filled
        slotImage.addEventListener("slotchange", () => {
            
            // Get image content
            let content = slotImage.assignedNodes({flatten: true});
            
            // If no image exists
            if (content.length < 1) {

                // Mark slot as empty
                imageSlotEmpty = true;

                // Display menu option
                addImageButton.classList.remove("unavailable");
            }         
            else {

                // Mark slot as not empty
                imageSlotEmpty = false;

                // Hide menu option
                addImageButton.classList.add("unavailable");
            }

            // Update button
            updateDelParaButton();
        });

        
        // Mark header as empty or filled
        slotHeader.addEventListener("slotchange", () => {
            
            // Get header content
            let content = slotHeader.assignedNodes({flatten: true});

            // If no header exists
            if (content.length < 1) {

                // Mark slot as empty
                headerSlotEmpty = true;

                // Display menu option
                addHeaderButton.classList.remove("unavailable");
            } 
            else {

                // Mark slot as not empty
                headerSlotEmpty = false;

                // Hide menu option
                addHeaderButton.classList.add("unavailable");
            }

            // Update button
            updateDelParaButton();   
        });

        
        // Mark level as empty or filled
        slotLevels.addEventListener("slotchange", () => {

            // Get level content
            let levels = slotLevels.assignedNodes({flatten: true});

            // If no level exists
            if (levels.length < 1) {     

                // Mark slot as empty
                levelsSlotEmpty = true;
            } 
            else {

                // Mark slot as not empty
                levelsSlotEmpty = false;
            } 
 
            // Update button
            updateDelParaButton(); 
        });


        // Display delete-level button for last level only (LIFO)
        slotLevels.addEventListener("slotchange", () => {

            // Get levels
            let levels = slotLevels.assignedNodes({flatten: true});

            // Get last level
            let lastLevel = levels[levels.length - 1];

            // If no level exists
            if (levels.length < 1) {  

                // If button exists
                if (paragraphControls.contains(delLevelButton)) {

                    // Remove button
                    paragraphControls.removeChild(delLevelButton);
                }
            }
            else {

                // Update delete-level buttons
                for (let level of levels) {

                    // If level is last level in paragraph
                    if (level == lastLevel) {
                        
                        // If no button exists
                        if (!paragraphControls.contains(delLevelButton)) {

                            // Append button 
                            paragraphControls.appendChild(delLevelButton);
                        }        
                    } 
                    else {

                        // If button exists
                        if (paragraphControls.contains(delLevelButton)) {

                            // Remove button
                            paragraphControls.removeChild(delLevelButton);
                        }
                    }
                }  
            }
    
            // Update button
            updateDelParaButton(); 
        });
    }
}
customElements.define("article-paragraph", ArticleParagraph);



// <paragraph-image>
class ParagraphImage extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {    

        // Generate label names   
        const paragraphIndex = this.getAttribute("data-paragraph-index");
        const labelName = `paragraph-${paragraphIndex}-image`;
        const altLabelName = `${labelName}-alt`;
        const imageIdName = `${labelName}-id`;
                        
        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Attach external stylesheet
        const styleLink = document.createElement("link");
        styleLink.setAttribute("rel", "stylesheet");
        styleLink.setAttribute("href", "/static/easy-read.css");

        // Prepare elements       
        const label = document.createElement("label");
        label.setAttribute("for", labelName);
        label.textContent = "Image:";

        const fileInput = document.createElement("input");
        fileInput.setAttribute("name", labelName);
        fileInput.setAttribute("class", "image-upload");
        fileInput.setAttribute("type", "file");
        fileInput.setAttribute("accept", "image/*");
        
        const slotImg = document.createElement("slot");
        slotImg.setAttribute("name", "slot-paragraph-image-src");

        const img = document.createElement("img");
        img.setAttribute("class", "article-form-image");
        img.setAttribute("slot", "slot-paragraph-image-src");
        
        const slotAlt = document.createElement("slot");
        slotAlt.setAttribute("name", "slot-paragraph-image-alt");

        const altLabel = document.createElement("label");
        altLabel.setAttribute("for", altLabelName);
        altLabel.textContent = "Image description:";
        
        const altInput = document.createElement("input");
        altInput.setAttribute("name", altLabelName);
        altInput.setAttribute("slot", "slot-paragraph-image-alt");

        const imageId = document.createElement("input");
        imageId.setAttribute("name", imageIdName);
        imageId.setAttribute("type", "hidden");
        
        const delImageButton = document.createElement("button");
        delImageButton.setAttribute("class", "button delete del-image-button");
        delImageButton.setAttribute("type", "button");
        delImageButton.textContent = "Delete Image";  

        // Append elements to shadow DOM
        shadow.appendChild(styleLink);
        shadow.appendChild(label);
            label.appendChild(fileInput);
        shadow.appendChild(slotImg);
        shadow.appendChild(slotAlt);
        shadow.appendChild(delImageButton);


// Add content

        // Add image
        fileInput.addEventListener("change", () => {

            // Get file
            let file = this.shadowRoot.querySelector(".image-upload").files[0];

            if (file) {

                // Create image URL
                img.src = URL.createObjectURL(file);

                // Post image to the server asynchronously 
                postImageAsync(file).then(response => {
                    
                    // Save image ID to hidden input
                    imageId.value = response.image_id;

                    // Append elements to shadow DOM
                    this.appendChild(imageId); // !! TEST deleting this and not reinputting 
                    this.appendChild(img);
                    this.appendChild(altInput); 
                })
            }
        });
    

        // Ensure one image per paragraph
        slotImg.addEventListener("slotchange", () => {
            
            // Get image
            let images = slotImg.assignedNodes({flatten: true});
            
            // If image exists
            if (images.length > 0) {

                // Show image alt label
                shadow.insertBefore(altLabel, slotAlt);

                // If image input exists
                if (label.contains(fileInput)) {

                    // Remove image input
                    label.removeChild(fileInput);
                }
            }
        });


// Delete content

        // Delete image
        delImageButton.addEventListener("click", () => {  
            this.remove();
        });
    }
}
customElements.define("paragraph-image", ParagraphImage);



// <paragraph-header>
class ParagraphHeader extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {    

        // Generate label name   
        const paragraphIndex = this.getAttribute("data-paragraph-index");
        const labelName = `paragraph-${paragraphIndex}-header`;
                
        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Attach external stylesheet
        const styleLink = document.createElement("link");
        styleLink.setAttribute("rel", "stylesheet");
        styleLink.setAttribute("href", "/static/easy-read.css");

        // Prepare elements       
        const label = document.createElement("label");
        label.setAttribute("for", labelName);
        label.textContent = "Header:";

        const slotHeaderText = document.createElement("slot");
        slotHeaderText.setAttribute("name", "slot-header-text");

        const textarea = document.createElement("textarea");
        textarea.setAttribute("name", labelName);
        textarea.setAttribute("class", "form-text form-text-header");
        textarea.setAttribute("slot", "slot-header-text")

        const delHeaderButton = document.createElement("button");
        delHeaderButton.setAttribute("class", "button delete del-header-button");
        delHeaderButton.setAttribute("type", "button");
        delHeaderButton.textContent = "Delete Header";  

        // Append elements to shadow DOM
        shadow.appendChild(styleLink);
        shadow.appendChild(label);
            label.appendChild(slotHeaderText);
                // slotHeaderText.appendChild(textarea); // !! This stops saving to db. I want it to work as fallback
        shadow.appendChild(delHeaderButton);
        this.appendChild(textarea); // !! This saves to db but the fallback is included with the slotted elements



        // Delete header
        delHeaderButton.addEventListener("click", () => { 
            this.remove();
        });
    }
}
customElements.define("paragraph-header", ParagraphHeader);



// <paragraph-level>
class ParagraphLevel extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {

        // Get paragraph and level indices from html attributes
        const paragraphIndex = this.getAttribute("data-paragraph-index");
        const levelIndex = this.getAttribute("data-level-index");

        // Generate id to be used as name attribute
        const levelId = `paragraph-${paragraphIndex}-level-${levelIndex}`;
        
        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Attach external stylesheet
        const styleLink = document.createElement("link");
        styleLink.setAttribute("rel", "stylesheet");
        styleLink.setAttribute("href", "/static/easy-read.css");
        
        // Prepare elements     
        const label = document.createElement("label");
        label.setAttribute("for", levelId);
        label.textContent = `Level ${levelIndex}:`; 

        const slotLevelText = document.createElement("slot");
        slotLevelText.setAttribute("name", "slot-level-text");
       
        const textarea = document.createElement("textarea");
        textarea.setAttribute("id", levelId);
        textarea.setAttribute("name", levelId);
        textarea.setAttribute("class", "form-text");
        // textarea.setAttribute("slot", "slot-level-text");

        const delLevelButton = document.createElement("button");
        delLevelButton.setAttribute("class", "button delete del-level-button");
        delLevelButton.setAttribute("type", "button");
        delLevelButton.textContent = "Delete Level";   

        // Append elements to shadow DOM
        shadow.appendChild(styleLink);
        shadow.appendChild(label);
            label.appendChild(slotLevelText);
                slotLevelText.append(textarea); // !! This stops saving to db. I want it to work as fallback
        // this.appendChild(textarea); // !! This saves to db but the fallback is included with the slotted elements
        
        // Delete level
        delLevelButton.addEventListener("click", () => { 
            this.remove();
        });
    }
}
customElements.define("paragraph-level", ParagraphLevel);





















// The following is code which I have yet to update
// This will be done following completion of the CMS


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