// n.b. The following elements use a LIFO system of content deletion
// in order to preserve content indicies (data-paragraph-index, data-level-index)
// If the author were to be allowed to delete content out of sequence,
// content indicies would need to be pulled by the server
// rather than pushed by the client. 

// <article-image> 
class ArticleImage extends HTMLElement {
    constructor() {
        super(); 
    }
    connectedCallback() {
        
        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Add styling
        const style = document.createElement("style");

        // Prepare elements 
        const label = document.createElement("label");
        label.setAttribute("for", "article-form-main-image-input");
        label.textContent = "Main image";

        const fileInput = document.createElement("input");
        fileInput.setAttribute("type", "file");
        fileInput.setAttribute("name", "article-form-main-image-input");
        fileInput.setAttribute("class", "image-upload");
        fileInput.setAttribute("accept", "image/*");
        
        const slotImg = document.createElement("slot");
        slotImg.setAttribute("name", "slot-article-image");

        const img = document.createElement("img");
        img.setAttribute("slot", "slot-article-image");
        img.setAttribute("class", "article-form-image");
        
        const slotAlt = document.createElement("slot");
        slotAlt.setAttribute("name", "slot-article-image-alt");

        const altLabel = document.createElement("label");
        altLabel.setAttribute("for", "article-image-alt");
        altLabel.textContent = "Image description:";
        
        const altInput = document.createElement("input");
        altInput.setAttribute("slot", "slot-article-image-alt");
        altInput.setAttribute("name", "article-image-alt");

        const imageId = document.createElement("input");
        imageId.setAttribute("type", "hidden");
        imageId.setAttribute("name", "article-image-id");
        
        const delImageButton = document.createElement("button");
        delImageButton.setAttribute("type", "button");
        delImageButton.setAttribute("class", "button delete del-image-button");
        delImageButton.textContent = "Delete Image";  

        // Append elements to shadow DOM
        shadow.appendChild(style);
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
        
                    // Append elements to light DOM
                    this.appendChild(imageId); // Must be first in db UPDATE                                     
                    this.appendChild(img);
                    this.appendChild(altInput); 
                });
            }
        });

        // Update image inputs 
        slotImg.addEventListener("slotchange", () => {
           
            // Get article image
            let image = slotImg.assignedNodes({flatten: true});

            // If image exists
            if (image[0]) {

                // Display image-alt header
                shadow.insertBefore(altLabel, slotAlt);

                // Display image-delete button
                shadow.appendChild(delImageButton);

                // Remove image input
                label.removeChild(fileInput);
            }
            else {
                
                // Remove image-alt header
                shadow.removeChild(altLabel);

                // Remove image-delete button
                shadow.removeChild(delImageButton);

                // Display empty image input
                label.appendChild(fileInput)
                fileInput.value = ""; 
            }
        });

        // Delete image
        delImageButton.addEventListener("click", () => {  

            // Get image content
            let image = slotImg.assignedNodes();
            let imageAlt = slotAlt.assignedNodes();
            let imageId = document.querySelector("[name='article-image-id']")

            // If image exists
            if (image[0]) {

                // Remove image
                image[0].remove();

                // Remove image alt
                imageAlt[0].remove();

                // Remove hidden ID
                imageId.remove();
            }
        }); 

        // Update style
        updateStyle(this);
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

        // Add styling
        const style = document.createElement("style");

        // Prepare elements    
        const articleContentHeader = document.createElement("h2");
        articleContentHeader.innerHTML = "Article Content"; 

        const slotParagraphs = document.createElement("slot");
        slotParagraphs.setAttribute("name", "slot-article-paragraphs");

        const addParaButton = document.createElement("button");
        addParaButton.setAttribute("type", "button");
        addParaButton.setAttribute("id", "add-para-button");
        addParaButton.setAttribute("class", "content-placeholder");
        addParaButton.textContent = "Add Paragraph";

        const delParaButton = document.createElement("button");
        delParaButton.setAttribute("type", "button");
        delParaButton.setAttribute("class", "button delete del-para-button");
        delParaButton.textContent = "Delete Paragraph";

         // Append elements to shadow DOM
        shadow.appendChild(style);
        shadow.appendChild(articleContentHeader);
        shadow.appendChild(slotParagraphs);
        shadow.appendChild(addParaButton);

        // Add paragraph to article
        addParaButton.addEventListener("click", () => {

            // Generate paragraph index (non-zero)
            let paragraphIndex = document.querySelectorAll("article-paragraph").length + 1;

            // Create paragraph
            let newParagraph = document.createElement("article-paragraph");
            newParagraph.setAttribute("slot", "slot-article-paragraphs");
            newParagraph.setAttribute("data-paragraph-index", paragraphIndex); 
            
            // Append paragraph to DOM
            this.appendChild(newParagraph);

            // // Scroll into view
            // newParagraph.scrollIntoView({block: "center", behavior: "smooth"});
        });

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

        // Delete paragraph
        delParaButton.addEventListener("click", (event) => {  
            let paragraph = event.target.getRootNode().host; 
            paragraph.remove();
        }); 

        // Update style
        updateStyle(this);
    }
}
customElements.define("article-content", ArticleContent);


// <article-paragraph> 
class ArticleParagraph extends HTMLElement {
    constructor() {
        super(); 
    }
    connectedCallback() {

        // Get paragraph index from html attribute
        const paragraphIndex = this.getAttribute("data-paragraph-index");

        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Add styling
        const style = document.createElement("style");

        // Prepare elements    
        const paragraphHeader = document.createElement("h3");
        paragraphHeader.innerHTML = `Paragraph ${paragraphIndex}`; 

        const slotImage = document.createElement("slot");
        slotImage.setAttribute("name", "slot-paragraph-image");

        const slotHeader = document.createElement("slot");
        slotHeader.setAttribute("name", "slot-paragraph-header");

        const slotLevels = document.createElement("slot");
        slotLevels.setAttribute("name", "slot-paragraph-levels");

        const paragraphControls = document.createElement("div");
        paragraphControls.setAttribute("class", "article-form-paragraph-controls");

        const imageControls = document.createElement("div");
        imageControls.setAttribute("class", "article-form-paragraph-controls-image");

        const headerControls = document.createElement("div");
        headerControls.setAttribute("class", "article-form-paragraph-controls-header");

        const levelControls = document.createElement("div");
        levelControls.setAttribute("class", "article-form-paragraph-controls-levels");

        const addImageButton = document.createElement("button");
        addImageButton.setAttribute("type", "button");
        addImageButton.setAttribute("class", "grey-out content-placeholder"); 
        addImageButton.textContent = "Add Image";
        
        const addHeaderButton = document.createElement("button");
        addHeaderButton.setAttribute("type", "button");
        addHeaderButton.setAttribute("class", "grey-out content-placeholder");
        addHeaderButton.textContent = "Add Header";

        const addLevelButton = document.createElement("button");
        addLevelButton.setAttribute("type", "button");
        addLevelButton.setAttribute("class", "button grey-out content-placeholder");
        addLevelButton.textContent = "Add Level";    
                 
        const delParaButton = document.createElement("button");
        delParaButton.setAttribute("type", "button");
        delParaButton.setAttribute("class", "button delete del-para-button");
        delParaButton.textContent = "Delete Paragraph";

        const delLevelButton = document.createElement("button");
        delLevelButton.setAttribute("type", "button");
        delLevelButton.setAttribute("class", "button delete del-level-button"); 
        delLevelButton.textContent = "Delete Level";   

        // Append elements to shadow DOM
        shadow.appendChild(style);
        shadow.appendChild(paragraphHeader);
        shadow.appendChild(paragraphControls);
            paragraphControls.appendChild(slotImage);
            paragraphControls.appendChild(imageControls);
                imageControls.appendChild(addImageButton);
            paragraphControls.appendChild(slotHeader);
            paragraphControls.appendChild(headerControls);
                headerControls.appendChild(addHeaderButton);
            paragraphControls.appendChild(slotLevels);
            paragraphControls.appendChild(levelControls);
                levelControls.appendChild(addLevelButton);   
            paragraphControls.appendChild(delParaButton);

        // Add image to paragraph
        addImageButton.addEventListener("click", () => {

            // Get image content 
            let imageSlot = this.shadowRoot.querySelector("[name='slot-paragraph-image']");
            let imageContent = imageSlot.assignedNodes({flatten: true});
            
            // If no image exists
            if (imageContent.length < 1) {

                // Create image 
                let image = document.createElement("paragraph-image");
                image.setAttribute("slot", "slot-paragraph-image");
                image.setAttribute("data-paragraph-index", paragraphIndex);
                
                // Append header to light DOM
                this.appendChild(image);

                // Scroll into view
                // image.scrollIntoView({block: "center", behavior: "smooth"});
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
                header.setAttribute("slot", "slot-paragraph-header");
                header.setAttribute("data-paragraph-index", paragraphIndex);

                // Append header to light DOM
                this.appendChild(header);

                // Scroll into view
                // header.scrollIntoView({block: "center", behavior: "smooth"});
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

            // Prepare level
            let level = document.createElement("paragraph-level"); 
            level.setAttribute("slot", "slot-paragraph-levels");
            level.setAttribute("data-paragraph-index", paragraphIndex);
            level.setAttribute("data-level-index", levelIndex);
            level.setAttribute("class", "custom-level");
                
            // Append level to light DOM
            this.appendChild(level);       

            // Scroll into view
            // level.scrollIntoView({block: "center", behavior: "smooth"});
        });   

        // Initialise delete-paragraph criteria
        let imageSlotEmpty = true;
        let headerSlotEmpty = true;
        let levelsSlotEmpty = true;

        // Display or remove delete-paragraph button
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
 
        // Delete paragraph
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

        // Mark image slot as empty or filled
        slotImage.addEventListener("slotchange", () => {
            
            // Get image content
            let content = slotImage.assignedNodes({flatten: true});
            
            // If no image exists
            if (content.length < 1) {

                // Mark slot as empty
                imageSlotEmpty = true;

                // Display add-image button
                imageControls.appendChild(addImageButton);
            }         
            else {

                // Mark slot as not empty
                imageSlotEmpty = false;

                // Remove add-image button
                imageControls.removeChild(addImageButton);
            }

            // Update button
            updateDelParaButton();
        });

        // Mark header slot as empty or filled
        slotHeader.addEventListener("slotchange", () => {
            
            // Get header content
            let content = slotHeader.assignedNodes({flatten: true});

            // If no header exists
            if (content.length < 1) {

                // Mark slot as empty
                headerSlotEmpty = true;

                // Display add-header button
                headerControls.appendChild(addHeaderButton)
            } 
            else {

                // Mark slot as not empty
                headerSlotEmpty = false;

                // Remove add-header button
                headerControls.removeChild(addHeaderButton)
            }

            // Update button
            updateDelParaButton();   
        });

        // Mark level slot as empty or filled
        slotLevels.addEventListener("slotchange", () => {

            // Get level content
            let levels = slotLevels.assignedNodes({flatten: true});

            // If no level exists
            if (levels.length < 1) {     

                // Mark slot as empty
                levelsSlotEmpty = true;

                // Display placeholder
                addLevelButton.classList.add("content-placeholder");
            } 
            else {

                // Mark slot as not empty
                levelsSlotEmpty = false;

                // Remove placeholder
                addLevelButton.classList.remove("content-placeholder");

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
                if (levelControls.contains(delLevelButton)) {  

                    // Remove button
                    levelControls.removeChild(delLevelButton);
                }
            }
            else {

                for (let level of levels) {

                    if (level == lastLevel) {
                        
                        // If no button exists
                        if (!levelControls.contains(delLevelButton)) {

                            // Append button 
                            levelControls.appendChild(delLevelButton);
                        }        
                    } 
                    else {

                        // If button exists
                        if (levelControls.contains(delLevelButton)) {

                            // Remove button
                            levelControls.removeChild(delLevelButton);
                        }
                    }
                }  
            }
    
            // Update button
            updateDelParaButton(); 
        });

        // Update style
        updateStyle(this);
    }
}
customElements.define("article-paragraph", ArticleParagraph);



// <paragraph-image>
class ParagraphImage extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {    

        // Get paragraph index from html attribute 
        const paragraphIndex = this.getAttribute("data-paragraph-index");

        // Generate labels
        const labelName = `paragraph-${paragraphIndex}-image`;
        const altLabelName = `${labelName}-alt`;
        const imageIdName = `${labelName}-id`;
                        
        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Add styling
        const style = document.createElement("style");

        // Prepare elements       
        const label = document.createElement("label");
        label.setAttribute("for", labelName);
        label.textContent = "Image:";

        const fileInput = document.createElement("input");
        fileInput.setAttribute("type", "file");
        fileInput.setAttribute("name", labelName);
        fileInput.setAttribute("class", "image-upload");
        fileInput.setAttribute("accept", "image/*");
        
        const slotImg = document.createElement("slot");
        slotImg.setAttribute("name", "slot-paragraph-image-src");

        const img = document.createElement("img");
        img.setAttribute("slot", "slot-paragraph-image-src");
        img.setAttribute("class", "article-form-image");
        
        const slotAlt = document.createElement("slot");
        slotAlt.setAttribute("name", "slot-paragraph-image-alt");

        const altLabel = document.createElement("label");
        altLabel.setAttribute("for", altLabelName);
        altLabel.textContent = "Image description:";
        
        const altInput = document.createElement("input");
        altInput.setAttribute("slot", "slot-paragraph-image-alt");
        altInput.setAttribute("name", altLabelName);

        const imageId = document.createElement("input");
        imageId.setAttribute("type", "hidden");
        imageId.setAttribute("name", imageIdName);
        
        const delImageButton = document.createElement("button");
        delImageButton.setAttribute("type", "button");
        delImageButton.setAttribute("class", "button delete del-image-button");
        delImageButton.textContent = "Delete Image";  

        // Append elements to shadow DOM
        shadow.appendChild(style);
        shadow.appendChild(label);
            label.appendChild(fileInput);
        shadow.appendChild(slotImg);
        shadow.appendChild(slotAlt);
        shadow.appendChild(delImageButton); 

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
                    this.appendChild(imageId); // Must be first in db UPDATE
                    this.appendChild(img);
                    this.appendChild(altInput); 
                })
            }
        });
    
        // Update image inputs
        slotImg.addEventListener("slotchange", () => {
            
            // Get image
            let images = slotImg.assignedNodes({flatten: true});
            
            // If image exists
            if (images[0]) {

                // Display image-alt label
                shadow.insertBefore(altLabel, slotAlt);

                // Remove image input
                label.removeChild(fileInput);
            }
        });

        // Delete image
        delImageButton.addEventListener("click", () => {  
            this.remove();
        });

        // Update style
        updateStyle(this);
    }
}
customElements.define("paragraph-image", ParagraphImage);



// <paragraph-header>
class ParagraphHeader extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {    

        // Get paragraph index from html attribute 
        const paragraphIndex = this.getAttribute("data-paragraph-index");

        // Generate label
        const labelName = `paragraph-${paragraphIndex}-header`;
                
        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Prepare stylesheet
        const style = document.createElement("style");

        // Prepare elements       
        const label = document.createElement("label");
        label.setAttribute("for", labelName);
        label.textContent = "Header:";

        const slotHeaderText = document.createElement("slot");
        slotHeaderText.setAttribute("name", "slot-header-text");

        const textarea = document.createElement("textarea");
        textarea.setAttribute("slot", "slot-header-text")
        textarea.setAttribute("name", labelName);
        textarea.setAttribute("class", "form-text form-text-header");

        const delHeaderButton = document.createElement("button");
        delHeaderButton.setAttribute("class", "button delete del-header-button");
        delHeaderButton.setAttribute("type", "button");
        delHeaderButton.textContent = "Delete Header";  

        // Append elements to shadow DOM
        shadow.append(style);
        shadow.appendChild(label);
            label.appendChild(slotHeaderText);
        shadow.appendChild(delHeaderButton);
 
        // n.b. The following listeners functions as a fallback for author-
        // designated content. Although slots provide fallback functionality,
        // I am unable to post data from the shadow DOM. I have attempted to use 
        // form-associated custom elements but so far have been unsuccessful.  

        // Append fallback to light DOM
        this.appendChild(textarea); 

        // Overwrite header fallback
        slotHeaderText.addEventListener("slotchange", () => {

            // Get all headers (fallback and intended)
            let headers = slotHeaderText.assignedNodes({flatten: true});

            // If intended header exists
            if (headers[1]) {

                // Remove fallback header
                headers[0].remove();
            }
        });

        // Delete header
        delHeaderButton.addEventListener("click", () => { 
            this.remove();
        });

        // Update style
        updateStyle(this);
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

        // Generate label
        const labelName = `paragraph-${paragraphIndex}-level-${levelIndex}`;
        
        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Prepare elements     
        const label = document.createElement("label");
        label.setAttribute("for", labelName);
        label.textContent = `Level ${levelIndex}:`; 

        const slotLevelText = document.createElement("slot");
        slotLevelText.setAttribute("name", "slot-level-text");
       
        const textarea = document.createElement("textarea");
        textarea.setAttribute("slot", "slot-level-text"); 
        textarea.setAttribute("name", labelName);
        textarea.setAttribute("id", labelName);
        textarea.setAttribute("class", "form-text");

        // Append elements to shadow DOM
        shadow.appendChild(label);
            label.appendChild(slotLevelText);

        // Append fallback to light DOM
        this.appendChild(textarea);

        // Overwrite level fallback
        slotLevelText.addEventListener("slotchange", () => {

            // Get all levels (fallback and designated)
            let levels = slotLevelText.assignedNodes();
                 
            // If designated level exists
            if (levels[1]) {
         
                // Remove fallback level
                levels[0].remove();
            }
        });
    }
}
customElements.define("paragraph-level", ParagraphLevel);


// Update custom element style
function updateStyle(element) {

    // Get shadow root
    const shadow = element.shadowRoot; 

    // Update style property
    shadow.querySelector("style").textContent = `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        h2, 
        h3 { 
            margin-bottom: 1rem;
        }
        label {
            font-size: 1.1rem;
        }
        input,
        button {
            background-color: #fbfdfe;
            font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif;
        }
        .button {
            width: max-content;
            height: max-content;
            padding: 0.4rem 0.8rem;
            border: 1px solid #DDD;
            border-radius: 10px;
            font-size: 1.1rem;
        }
        .grey-out {
            color: #DDD;
        }
        .grey-out:hover {
            color: black;
        }
        .delete {
            color: #DDD;        
        }
        .delete:hover {
            color: red;
        }
        .content-placeholder {
            display: block;
            width: 100%; 
            margin: 1rem 0;
            padding: 1rem 0;
            background: #fbfdfe;
            border: 1px solid #DDD;
            border-radius: 10px;
            font-size: 1.1rem;
        }   
        .article-form-paragraph-controls {
            display: flex;
                flex-direction: column;
            margin-bottom: 5rem;
        }
        .article-form-paragraph-controls-levels {
            display: flex;
                justify-content: space-between;
        } 
        .image-upload {
            display: block;
            width: 100%;
            margin: 1rem auto;
            padding: 1rem;
            border-radius: 10px;
            border: none;
            font-size: 1rem;
        }
        #add-para-button {
            margin-bottom: 0;
        }
        .del-para-button {
            align-self: flex-end;
            margin-top: 0.5rem;
        }    
        .del-image-button,
        .del-header-button {
            float: right;
        }
    `;
}