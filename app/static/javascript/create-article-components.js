// n.b. The following elements use a LIFO system of content deletion
// in order to preserve content indices (data-paragraph-index, data-level-index)
// If the author were to be allowed to delete content out of sequence,
// content indices would no longer be contiguous.

// <article-image> 
class ArticleImage extends HTMLElement {
    constructor() {
        super();

        // Display alert if image has no alt or citation
        this.alert_image_support = () => {

            // Get image alt and citation inputs
            const altInputDiv = this.querySelector("[slot=slot-article-image-alt]");
            const altInput = this.querySelector("[name=article_image_alt]");
            const citeInputDiv = this.querySelector("[slot=slot-article-image-citation]");
            const citeInput = this.querySelector("[name=article_image_cite]");

            // Create alert and append to inputs
            const errorAlert = document.createElement("span");
            errorAlert.setAttribute("class", "form-alert alert-error");
            errorAlert.textContent = "This field is required";
            altInputDiv.appendChild(errorAlert.cloneNode(true));
            citeInputDiv.appendChild(errorAlert.cloneNode(true));

            // Helper function to toggle alert
            const toggleAlert = (div, input) => {
                if (input.value != "") {
                    let alert = div.querySelector("span.form-alert");
                    if (alert) { div.removeChild(alert); }
                } 
                else { div.appendChild(errorAlert.cloneNode(true)); }
            }

            // Toggle alert upon data entry
            altInput.addEventListener("keyup", () => {
                toggleAlert(altInputDiv, altInput)
            });
            citeInput.addEventListener("keyup", () => {
                toggleAlert(citeInputDiv, citeInput)
            });
        }
    }
    connectedCallback() {
        
        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Add styling
        const style = document.createElement("style");

        // Prepare elements
        const form = document.getElementById('article-form');

        const imageLabel = document.createElement("label");
        imageLabel.setAttribute("for", "upload_image");
        imageLabel.textContent = "Main image";

        const altLabel = document.createElement("label");
        altLabel.setAttribute("for", "article_image_alt");
        altLabel.textContent = "Image description";

        const citeLabel = document.createElement("label");
        citeLabel.setAttribute("for", "article_image_cite");
        citeLabel.textContent = "Image credit";

        const imgSlot = document.createElement("slot");
        imgSlot.setAttribute("name", "slot-article-image");

        const altSlot = document.createElement("slot");
        altSlot.setAttribute("name", "slot-article-image-alt");

        const citeSlot = document.createElement("slot");
        citeSlot.setAttribute("name", "slot-article-image-citation");

        const hiddenId = document.createElement("input");
        hiddenId.setAttribute("type", "hidden");
        hiddenId.setAttribute("name", "article_image_id");

        const imageInput = document.createElement("input");
        imageInput.setAttribute("type", "file");
        imageInput.setAttribute("name", "upload_image");
        imageInput.setAttribute("class", "image-upload");
        imageInput.setAttribute("accept", "image/*");

        const altInputDiv = document.createElement("div"); // Required to position error alert
        altInputDiv.setAttribute("slot", "slot-article-image-alt");

        const altInput = document.createElement("input");
        altInput.setAttribute("name", "article_image_alt");

        const citeInputDiv = document.createElement("div"); // Required to position error alert
        citeInputDiv.setAttribute("slot", "slot-article-image-citation");

        const citeInput = document.createElement("input");
        citeInput.setAttribute("name", "article_image_cite");
        citeInput.setAttribute("placeholder", "eg. Image by [name] from [website link]");

        const img = document.createElement("img");
        img.setAttribute("slot", "slot-article-image");
        img.setAttribute("class", "article-form-image");
   
        const delImageButton = document.createElement("button");
        delImageButton.setAttribute("type", "button");
        delImageButton.setAttribute("class", "button delete del-image-button");
        delImageButton.textContent = "Delete Image";  

        // Append elements to shadow DOM
        shadow.appendChild(style);
        shadow.appendChild(imageLabel);
            imageLabel.appendChild(imageInput);
        shadow.appendChild(imgSlot);
        shadow.appendChild(altSlot);
        shadow.appendChild(citeSlot);
  
        // Add article image
        imageInput.addEventListener("change", async () => {

            // Get file
            let file = imageInput.files[0];
        
            if (file) {

                // Reappend file input to light DOM before creation of form data
                this.appendChild(imageInput);
        
                // Create image URL
                img.src = URL.createObjectURL(file);
                
                // Create form data object 
                let formData = new FormData(form);

                // Post form data to server
                return fetch("/add-image", {
                    method: "POST",
                    body: formData
                })
                .then(response => {

                    // Successful upload
                    if (response.ok) { 
                        response.json().then(response => {

                            // Save image ID to hidden input
                            hiddenId.value = response.image_id;
                            imageInput.value = "";

                            // Append elements to light DOM                                   
                            this.appendChild(img);
                            this.appendChild(hiddenId);
                            this.appendChild(altInputDiv);
                                altInputDiv.appendChild(altInput);
                            this.appendChild(citeInputDiv);
                                citeInputDiv.appendChild(citeInput);

                            // Display alert if image has no alt or citation
                            this.alert_image_support();
                        })
                    }
                    // Failed upload
                    else {

                        // Alert author
                        if (response.status === 413) {
                            alert("The file selected is too large. Images must be under 1MB.");
                        } else {
                            alert('The file selected is invalid or not permitted.');
                        }
                        
                        // Reappend file input to shadow DOM
                        imageLabel.appendChild(imageInput);
                        imageInput.value = "";
                    }
                })
                .catch(error => console.error(error));
            }
        });

        // Update image inputs 
        imgSlot.addEventListener("slotchange", () => {
           
            // Get article image
            let image = imgSlot.assignedNodes({flatten: true});

            // If image exists
            if (image[0]) {

                // Display image alt and citation labels
                shadow.insertBefore(altLabel, altSlot);
                shadow.insertBefore(citeLabel, citeSlot);

                // Display image-delete button
                shadow.appendChild(delImageButton);

                // If image file input exists in shadow DOM
                if (imageLabel.contains(imageInput)) {
                    
                    // Remove file input
                    imageLabel.removeChild(imageInput);
                }
            }
            else {
                
                // Remove image alt and citation labels
                shadow.removeChild(altLabel);
                shadow.removeChild(citeLabel);

                // Remove image-delete button
                shadow.removeChild(delImageButton);

                // Display empty image input
                imageLabel.appendChild(imageInput)
                imageInput.value = ""; 
            }
        });

        // Delete image
        delImageButton.addEventListener("click", () => {  

            // Get image content
            let image = imgSlot.assignedNodes();
            let imageAlt = altSlot.assignedNodes();
            let imageCite = citeSlot.assignedNodes();

            // If image exists
            if (image[0]) {

                // Remove image
                image[0].remove();

                // Remove image alt and citation
                imageAlt[0].remove();
                imageCite[0].remove();

                // Remove hidden ID
                hiddenId.remove();
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
        const articleLabel = document.createElement("h2");
        articleLabel.innerHTML = "Article Content"; 

        const paragraphsSlot = document.createElement("slot");
        paragraphsSlot.setAttribute("name", "slot-article-paragraphs");

        const addParaButton = document.createElement("button");
        addParaButton.setAttribute("type", "button");
        addParaButton.setAttribute("id", "add-para-button");
        addParaButton.setAttribute("class", "grey-out content-placeholder");
        addParaButton.textContent = "Add Paragraph";

        const delParaButton = document.createElement("button");
        delParaButton.setAttribute("type", "button");
        delParaButton.setAttribute("class", "button delete del-para-button");
        delParaButton.textContent = "Delete Paragraph";

         // Append elements to shadow DOM
        shadow.appendChild(style);
        shadow.appendChild(articleLabel);
        shadow.appendChild(paragraphsSlot);
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

            // Focus first button in new paragraph and scroll into view
            newParagraph.shadowRoot.querySelector("button").focus();
            newParagraph.scrollIntoView({block: "center", behavior: "smooth"});
        });

        // Display delete-paragraph button for last paragraph only (LIFO)
        paragraphsSlot.addEventListener("slotchange", () => {
            
            // Get all paragraphs
            let paragraphs = paragraphsSlot.assignedNodes({flatten: true});

            // Get last paragraph
            let lastParagraph = paragraphs[paragraphs.length -1];

            for (let paragraph of paragraphs) {
  
                // Get paragraph controls
                let controls = paragraph.shadowRoot.querySelector(".article-form-paragraph-controls");
                let button = controls.querySelector(".del-para-button");

                // paragraph wont be empty due to the paragraph index
                let header = paragraph.getElementsByTagName("paragraph-header");
                let image = paragraph.getElementsByTagName("paragraph-image");
                let level = paragraph.getElementsByTagName("paragraph-level");
 
                // If this is the last paragraph and it has no header or image
                if (paragraph == lastParagraph && header.length == 0 &&
                    image.length == 0 && level.length == 0) {
                    
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

        // Delete paragraph and focus add-paragraph button
        delParaButton.addEventListener("click", (event) => {  
            let paragraph = event.target.getRootNode().host;
            paragraph.parentNode.shadowRoot.querySelector("button").focus();
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
        
        // Generate labels
        const paragraphName = "paragraph-" + paragraphIndex;
        const indexName = paragraphName + "-paragraph_index";
        
        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Add styling
        const style = document.createElement("style");

        // Prepare elements
        const ParagraphLabel = document.createElement("h3");
        ParagraphLabel.innerHTML = `Paragraph ${paragraphIndex}`;

        const indexSlot = document.createElement("slot");
        indexSlot.setAttribute("name", "slot-paragraph-index");

        const imageSlot = document.createElement("slot");
        imageSlot.setAttribute("name", "slot-paragraph-image");

        const headerSlot = document.createElement("slot");
        headerSlot.setAttribute("name", "slot-paragraph-header");

        const levelsSlot = document.createElement("slot");
        levelsSlot.setAttribute("name", "slot-paragraph-levels");

        const fieldList = document.createElement("ul");
        fieldList.setAttribute("id", paragraphName);
        fieldList.setAttribute("slot", "slot-paragraph-index")

        const hiddenIndex = document.createElement("input");
        hiddenIndex.setAttribute("type", "hidden");
        hiddenIndex.setAttribute("name", indexName);
        hiddenIndex.value = paragraphIndex;

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
        addLevelButton.textContent = "Add Summary";    
                 
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
        shadow.appendChild(ParagraphLabel);
        shadow.appendChild(paragraphControls);
            paragraphControls.appendChild(indexSlot);
            paragraphControls.appendChild(imageSlot);
            paragraphControls.appendChild(imageControls);
                imageControls.appendChild(addImageButton);
            paragraphControls.appendChild(headerSlot);
            paragraphControls.appendChild(headerControls);
                headerControls.appendChild(addHeaderButton);
            paragraphControls.appendChild(levelsSlot);
            paragraphControls.appendChild(levelControls);
                levelControls.appendChild(addLevelButton);   
            paragraphControls.appendChild(delParaButton);

        // Append fallback paragraph index to DOM
        this.appendChild(fieldList);
            fieldList.appendChild(hiddenIndex);

        // Overwrite paragraph index fallback 
        indexSlot.addEventListener("slotchange", () => {
            
            // Get all paragraph indices (fallback and intended)
            let indices = indexSlot.assignedNodes({flatten: true});

            // If intended index exists
            if (indices[1]) {

                // Remove fallback index
                indices[0].remove();
            }
        })

        // Add image to paragraph
        addImageButton.addEventListener("click", () => {

            // Get image content 
            let imageContent = imageSlot.assignedNodes({flatten: true});
            
            // If no image exists
            if (imageContent.length < 1) {

                // Create image 
                let image = document.createElement("paragraph-image");
                image.setAttribute("slot", "slot-paragraph-image");
                image.setAttribute("data-paragraph-index", paragraphIndex);
                
                // Append image to light DOM
                this.appendChild(image);

                // Focus first input in image component and scroll into view
                image.shadowRoot.querySelector("input").focus();
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
            let headerContent = headerSlot.assignedNodes({flatten: true});
            
            // If no header exists
            if (headerContent.length < 1) {

                // Create header
                let header = document.createElement("paragraph-header");
                header.setAttribute("slot", "slot-paragraph-header");
                header.setAttribute("data-paragraph-index", paragraphIndex);

                // Append header to light DOM
                this.appendChild(header);

                // Focus first input in header component and scroll into view
                header.querySelector("textarea").focus();
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

            // Prepare level
            let level = document.createElement("paragraph-level"); 
            level.setAttribute("slot", "slot-paragraph-levels");
            level.setAttribute("data-paragraph-index", paragraphIndex);
            level.setAttribute("data-level-index", levelIndex);
            level.setAttribute("class", "custom-level");
                
            // Append level to light DOM
            this.appendChild(level);
            
            // Focus first input in header component and scroll into view
            level.querySelector("textarea").focus();
            level.scrollIntoView({block: "center", behavior: "smooth"});
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

            // Delete paragraph and focus add-paragraph button
            this.parentNode.shadowRoot.querySelector("button").focus();
            this.remove();
        }); 

        // Delete last level (LIFO)
        delLevelButton.addEventListener("click", () => {
            
            // Get last level
            let levels = levelsSlot.assignedNodes({flatten: true});
            let lastLevel = levels[levels.length -1];
            let penultimateLevel = levels[levels.length -2];
            if (penultimateLevel) {
                penultimateLevel.querySelector("textarea").focus();
            }
            
            // Delete last level
            lastLevel.remove();
        })

        // Mark image slot as empty or filled
        imageSlot.addEventListener("slotchange", () => {
            
            // Get image content
            let content = imageSlot.assignedNodes({flatten: true});
            
            // If no image exists
            if (content.length < 1) {

                // Mark slot as empty
                imageSlotEmpty = true;

                // Display and focus add-image button
                imageControls.appendChild(addImageButton);
                addImageButton.focus();
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
        headerSlot.addEventListener("slotchange", () => {
            
            // Get header content
            let content = headerSlot.assignedNodes({flatten: true});

            // If no header exists
            if (content.length < 1) {

                // Mark slot as empty
                headerSlotEmpty = true;

                // Display and focus add-header button
                headerControls.appendChild(addHeaderButton);
                addHeaderButton.focus();
            } 
            else {

                // Mark slot as not empty
                headerSlotEmpty = false;

                // Remove add-header button
                headerControls.removeChild(addHeaderButton);
            }

            // Update button
            updateDelParaButton();   
        });

        // Mark level slot as empty or filled
        levelsSlot.addEventListener("slotchange", () => {

            // Get level content
            let levels = levelsSlot.assignedNodes({flatten: true});

            // If no level exists
            if (levels.length < 1) {     

                // Mark slot as empty
                levelsSlotEmpty = true;

                // Display and focus placeholder
                addLevelButton.classList.add("content-placeholder");
                addLevelButton.textContent = "Add Summary";
                addLevelButton.focus();
            } 
            else {

                // Mark slot as not empty
                levelsSlotEmpty = false;

                // Remove placeholder
                addLevelButton.classList.remove("content-placeholder");
                addLevelButton.textContent = "Add Level";    
            } 
 
            // Update button
            updateDelParaButton(); 
        });

        // Display delete-level button for last level only (LIFO)
        levelsSlot.addEventListener("slotchange", () => {

            // Get levels
            let levels = levelsSlot.assignedNodes({flatten: true});

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

            // Display alert if image has no alt or citation
            this.alert_image_support = () => {

            // Get image alt and citation inputs
            const altInputDiv = this.querySelector("[slot=slot-paragraph-image-alt]");
            const altInput = altInputDiv.querySelector("input");
            const citeInputDiv = this.querySelector("[slot=slot-paragraph-image-citation]");
            const citeInput = citeInputDiv.querySelector("input");

            // Create alert and append to inputs
            const errorAlert = document.createElement("span");
            errorAlert.setAttribute("class", "form-alert alert-error");
            errorAlert.textContent = "This field is required";
            altInputDiv.appendChild(errorAlert.cloneNode(true));
            citeInputDiv.appendChild(errorAlert.cloneNode(true));

            // Helper function to toggle alert
            const toggleAlert = (div, input) => {
                if (input.value != "") {
                    let alert = div.querySelector("span.form-alert");
                    if (alert) { div.removeChild(alert); }
                } 
                else { div.appendChild(errorAlert.cloneNode(true)); }
            }

            // Toggle alert upon data entry
            altInput.addEventListener("keyup", () => {
                toggleAlert(altInputDiv, altInput)
            });
            citeInput.addEventListener("keyup", () => {
                toggleAlert(citeInputDiv, citeInput)
            });
        }
    }
    connectedCallback() {    

        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Add styling
        const style = document.createElement("style");

        // Get paragraph index from html attribute 
        const paragraphIndex = this.getAttribute("data-paragraph-index");

        // Generate input names (matching WTForms)
        const paragraphName = "paragraph-" + paragraphIndex;
        const hiddenIdName = paragraphName + "-paragraph_image_id";
        const imageAltName = paragraphName + "-paragraph_image_alt";
        const imageCiteName = paragraphName + "-paragraph_image_cite";  

        // Prepare elements
        const form = document.getElementById('article-form');

        const fieldList = document.createElement("ul");
        fieldList.setAttribute("id", paragraphName);
        fieldList.setAttribute("name", "slot-paragraph-levels");

        const imageSlot = document.createElement("slot");
        imageSlot.setAttribute("name", "slot-paragraph-image-img");

        const altSlot = document.createElement("slot");
        altSlot.setAttribute("name", "slot-paragraph-image-alt");

        const citeSlot = document.createElement("slot");
        citeSlot.setAttribute("name", "slot-paragraph-image-citation");

        const imageLabel = document.createElement("label");
        imageLabel.setAttribute("for", "upload_image");
        imageLabel.textContent = "Image";

        const altLabel = document.createElement("label");
        altLabel.setAttribute("for", imageAltName);
        altLabel.textContent = "Image description";

        const citeLabel = document.createElement("label");
        citeLabel.setAttribute("for", imageCiteName);
        citeLabel.textContent = "Image credit";

        const imageInput = document.createElement("input");
        imageInput.setAttribute("type", "file");
        imageInput.setAttribute("name", "upload_image");
        imageInput.setAttribute("class", "image-upload");
        imageInput.setAttribute("accept", "image/*");

        const altInputDiv = document.createElement("div"); // Required to position error alert
        altInputDiv.setAttribute("slot", "slot-paragraph-image-alt");

        const altInput = document.createElement("input");
        altInput.setAttribute("name", imageAltName);

        const citeInputDiv = document.createElement("div"); // Required to position error alert
        citeInputDiv.setAttribute("slot", "slot-paragraph-image-citation");

        const citeInput = document.createElement("input");
        citeInput.setAttribute("name", imageCiteName);
        citeInput.setAttribute("placeholder", "eg. Image by [name] from [website link]");

        const img = document.createElement("img");
        img.setAttribute("slot", "slot-paragraph-image-img");
        img.setAttribute("class", "article-form-image");

        const hiddenId = document.createElement("input");
        hiddenId.setAttribute("type", "hidden");
        hiddenId.setAttribute("name", hiddenIdName);
        
        const delImageButton = document.createElement("button");
        delImageButton.setAttribute("type", "button");
        delImageButton.setAttribute("class", "button delete del-image-button");
        delImageButton.textContent = "Delete Image";  

        // Append elements to shadow DOM
        shadow.appendChild(style);
        shadow.appendChild(imageLabel);
            imageLabel.appendChild(imageInput);
        shadow.appendChild(imageSlot);
        shadow.appendChild(altSlot);
        shadow.appendChild(citeSlot);
        shadow.appendChild(delImageButton);

        // Apppend fieldList to light DOM to be sent with form
        this.appendChild(fieldList);

        // Add image
        imageInput.addEventListener("change", async () => {

            // Get file
            let file = imageInput.files[0];

            if (file) {

                // Reappend file input to light DOM before creation of form data
                fieldList.appendChild(imageInput);

                // Create image URL
                img.src = URL.createObjectURL(file);
                
                // Create form data object 
                let formData = new FormData(form);

                // Post form data to server
                return fetch("/add-image", {
                    method: "POST",
                    body: formData
                })
                .then(response => response.json()) 
                .catch(error => {
                    console.error(error);

                    // Alert author
                    alert('The file selected is invalid or not permitted.');
                    
                    // Reappend file input to shadow DOM
                    imageLabel.appendChild(imageInput);
                    imageInput.value = ""; 

                }).then(response => {

                    // Save image ID to hidden input
                    hiddenId.value = response.image_id;
                    imageInput.value = ""; 

                    // Append elements to light DOM
                    this.appendChild(img);
                    this.appendChild(altInputDiv);
                        altInputDiv.appendChild(altInput);
                    this.appendChild(citeInputDiv);
                        citeInputDiv.appendChild(citeInput);
                    fieldList.appendChild(hiddenId);
                    
                    // Display alert if image has no alt or citation
                    this.alert_image_support();
                });
            }
        });
    
        // Update image inputs
        imageSlot.addEventListener("slotchange", () => {
            
            // Get image
            let images = imageSlot.assignedNodes({flatten: true});
            
            // If image exists
            if (images[0]) {

                // Display image alt and citation labels
                shadow.insertBefore(altLabel, altSlot);
                shadow.insertBefore(citeLabel, citeSlot);

                // Remove image input
                imageInput.remove();
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
        const headerName = `paragraph-${paragraphIndex}-paragraph_header`;
                
        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Prepare stylesheet
        const style = document.createElement("style");

        // Prepare elements       
        const headerLabel = document.createElement("label");
        headerLabel.setAttribute("for", headerName);
        headerLabel.textContent = "Header";

        const headerSlot = document.createElement("slot");
        headerSlot.setAttribute("name", "slot-header-text");

        const headerText = document.createElement("textarea");
        headerText.setAttribute("slot", "slot-header-text");
        headerText.setAttribute("name", headerName);
        headerText.setAttribute("class", "form-text form-text-header");

        const delHeaderButton = document.createElement("button");
        delHeaderButton.setAttribute("class", "button delete del-header-button");
        delHeaderButton.setAttribute("type", "button");
        delHeaderButton.textContent = "Delete Header";  

        // Append elements to shadow DOM
        shadow.append(style);
        shadow.appendChild(headerLabel);
            headerLabel.appendChild(headerSlot);
        shadow.appendChild(delHeaderButton);
 
        // n.b. The following listeners functions as a fallback for author-
        // designated content. Although slots provide fallback functionality,
        // I am unable to post data from the shadow DOM. I have attempted to use 
        // form-associated custom elements but so far have been unsuccessful.  

        // Append fallback to light DOM
        this.appendChild(headerText);

        // Overwrite header fallback
        headerSlot.addEventListener("slotchange", () => {

            // Get all headers (fallback and intended)
            let headers = headerSlot.assignedNodes({flatten: true});

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

        // Generate labels
        const paragraphName = "paragraph-" + paragraphIndex;
        const summaryName =  paragraphName + "-summary-" + levelIndex;
        const levelName = summaryName + "-level";
        const textName = summaryName + "-text";
        
        // Attach shadow DOM
        const shadow = this.attachShadow({mode: "open"});

        // Prepare elements     
        const textLabel = document.createElement("label");
        textLabel.setAttribute("for", textName);
        textLabel.textContent = `Level ${levelIndex}`; 

        const textSlot = document.createElement("slot");
        textSlot.setAttribute("name", "slot-level-text");

        const indexSlot = document.createElement("slot");
        indexSlot.setAttribute("name", "slot-level-index");
       
        const summaryText = document.createElement("textarea");
        summaryText.setAttribute("slot", "slot-level-text"); 
        summaryText.setAttribute("name", textName);
        summaryText.setAttribute("id", textName);
        summaryText.setAttribute("class", "form-text");

        const summaryLevel = document.createElement("input");
        summaryLevel.setAttribute("type", "hidden");
        summaryLevel.setAttribute("name", levelName);
        summaryLevel.value = levelIndex;

        const fieldList = document.createElement("ul");
        fieldList.setAttribute("id", summaryName);
        fieldList.setAttribute("slot", "slot-level-index");

        // Append elements to shadow DOM
        shadow.appendChild(textLabel);
            textLabel.appendChild(textSlot);
        shadow.appendChild(indexSlot)

        // Append fallback to light DOM
        this.appendChild(summaryText);
        this.appendChild(fieldList);
            fieldList.appendChild(summaryLevel);

        // Overwrite level fallback
        textSlot.addEventListener("slotchange", () => {

            // Get all levels (fallback and designated)
            let levels = textSlot.assignedNodes({flatten: true});
                 
            // If designated level exists
            if (levels[1]) {
         
                // Remove fallback level
                levels[0].remove();
            }
        });

        // Overwrite index fallback 
        indexSlot.addEventListener("slotchange", () => {
            
            // Get all level indices (fallback and intended)
            let indices = indexSlot.assignedNodes({flatten: true});

            // If intended index exists
            if (indices[1]) {

                // Remove fallback index
                indices[0].remove();
            }
        })
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
            background-color: var(--background);
            font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif;
        }
        .button {
            width: max-content;
            height: max-content;
            padding: 0.4rem 0.8rem;
            background: var(--background);
            border: 1px solid var(--foreground-dark);
            border-radius: 10px;
            font-size: 1.1rem;
            cursor: pointer;
        }
        .grey-out {
            color: var(--foreground-dark);
        }
        .grey-out:hover {
            color: var(--contrast-dark);
        }
        .delete {
            color: var(--foreground-dark);        
        }
        .delete:active {
            color: red;
        }
        .content-placeholder {
            display: block;
            width: 100%; 
            margin: 1rem 0;
            padding: 1rem 0;
            background: var(--background);
            border: 1px solid var(--foreground-dark);
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
            position: relative;
            float: right;
        }
        
        @media (hover: hover) {
            .delete:hover {
                color: red;
            }
        }
    `;
}