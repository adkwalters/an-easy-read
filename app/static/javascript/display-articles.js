// || No Results Icon
// || Big Add Button
//      - display or hide add button
//      - add new article
//      - add user by email address
// || Action Confirmation
// || Tabs
//      - article display switch
//      - admin's articles
//      - admin's publishers
//      - publisher's articles
//      - publisher's writers
//      - publisher's requests
//      - author's articles
// || Tab Defaults
// || Article Actions
//      - transfer article
//      - hyperlink article
// || Article Status Icons


// || No Results Icon

// Display or hide icon
const noResultsIcon = document.createElement("i");
noResultsIcon.setAttribute("class", "no-results-icon far fa-question-circle");
function reportNoResults() {
    // Check article results length
    let results = display.getElementsByClassName("article-display");
    let addButtons = document.getElementsByClassName("big-add-button");
    if (results.length == 0 && addButtons.length == 0) {
        // Display icon, if not already displayed
        if (!display.contains(noResultsIcon)) {
            display.appendChild(noResultsIcon);
        }
    } else {
        // Hide icon if displayed
        if (display.contains(noResultsIcon)) {
            display.removeChild(noResultsIcon);
        }
    }
}

// Big Add Button

// Display or hide button
const addButton = document.createElement("a");
addButton.setAttribute("class", "big-add-button far fa-plus-square")
function addOrRemoveAddButton(action) {
    if (action == "add") {
        // Display button, if not already displayed
        if (!display.contains(addButton)) {
            let list = display.querySelector("ul");
            list.appendChild(addButton);
        }
    }
    else if (action == "remove") {
        // Hide button if displayed
        if (display.contains(addButton)) {
            addButton.remove();
        }
    }
} 

// Add new article
let addArticleForm = document.getElementById("create-article");
if (addArticleForm) {
    addButton.addEventListener("click", () => { addArticleForm.submit() }) 
}

// Add user by email address
let addEmailForm = document.getElementById("add-user-by-email");
if (addEmailForm) {
    addButton.addEventListener("click", (event) => {
        // Prompt email address
        let email = prompt("Please enter an email address.");
        if (email) {
            // Attach address to form and submit
            let hiddenInput = document.createElement("input");
            hiddenInput.setAttribute("type", "hidden")
            hiddenInput.setAttribute("name", "user_email");
            hiddenInput.value = email;
            addEmailForm.appendChild(hiddenInput);
            addEmailForm.submit();
        }
        else {
            event.preventDefault();
        }
    });
}


// || Action Confirmation

// Get actions requiring confirmation
const actionsToConfirm = ["article-action-delete", "article-action-request", 
    "article-action-reject", "article-action-review", "article-action-publish", 
    "writer-action-remove", "publisher-action-remove"];
// Confirm user action
for (let action of actionsToConfirm) {
    let forms = document.getElementsByClassName(action);
    for (let form of forms) {
        form.addEventListener("click", (event) => {
            if (action == "article-action-delete") {
                if (!confirm("Delete this article?")) {
                    event.preventDefault();
                }
            }
            else if (action == "article-action-request") {
                if (!confirm("Request this article be published?")) {
                    event.preventDefault();
                }
            }
            else if (action == "article-action-reject") {
                if (!confirm("Reject this article's request for publication?")) {
                    event.preventDefault();
                }
            }
            else if (action == "article-action-review") {
                if (!confirm("Review this article?")) {
                    event.preventDefault();
                }
            }
            else if (action == "article-action-publish") {
                if (!confirm("Publish this article?")) {
                    event.preventDefault();
                }
            }
            else if (action == "writer-action-remove") {
                if (!confirm("Remove this writer?")) {
                    event.preventDefault();
                }
            }
            else if (action == "publisher-action-remove") {
                if (!confirm("Remove this publisher?")) {
                    event.preventDefault();
                }
            }
        })
    }
}


// || Tabs

// Get article statuses
const draftArticles = ["draft", "requested", "pending"];
const publishedArticles = ["pub_draft", "pub_requested", "pub_pending", "published"];

// Article Display Switch - show or hide articles with selected status
function switchArticleDisplay(status, display) {
    // Generate classname from status
    let className = "status-" + status;
    // Get articles
    let articlesToDisplay =  document.getElementsByClassName(className);
    for (let article of articlesToDisplay) {
        if (display == "show") {  
            // Display the article
            if (article.classList.contains("article-display-none")) {
                article.classList.replace("article-display-none", "article-display")
            }
        } else { 
            // Hide the article
            if (article.classList.contains("article-display")) {
                article.classList.replace("article-display", "article-display-none")
            }
        }
    } 
}

// Get display area and tabs
const display = document.getElementById("articles-display-panel");
// Admin's articles
const pubLiveArticlesTab = document.getElementById("published-live-tab");
const pubDeletedArticlesTab = document.getElementById("published-deleted-tab");
// Admin's publishers
const addPublisherTab = document.getElementById("add-publisher-tab");
const removePublisherTab = document.getElementById("remove-publisher-tab");
// Publisher's articles
const liveArticlesTab = document.getElementById("live-articles-tab");
const pendingArticlesTab = document.getElementById("pending-articles-tab");
// Publisher's writers
const pubWritersTab = document.getElementById("published-writers-tab");
const unpubWritersTab = document.getElementById("unpublished-writers-tab");
// Publisher's requests
const myRequestsTab = document.getElementById("my-requests-tab");
const allWritersTab = document.getElementById("all-writers-tab");
// Author's articles
const publishedTab = document.getElementById("published-articles-tab");
const draftsTab = document.getElementById("draft-articles-tab");


// Admin's articles
// Display live articles
if (pubLiveArticlesTab) {
    pubLiveArticlesTab.addEventListener("click", () => {
        // Tab
        pubLiveArticlesTab.parentElement.classList.add("dropdown-tab-active");
        pubDeletedArticlesTab.parentElement.classList.remove("dropdown-tab-active");
        // Articles
        switchArticleDisplay("pub_live", "show");
        switchArticleDisplay("pub_deleted", "hide");
        // No results icon
        reportNoResults();
    })
}
// Display articles to delete or transfer
if (pubDeletedArticlesTab) {
    pubDeletedArticlesTab.addEventListener("click", () => {
        // Tab
        pubLiveArticlesTab.parentElement.classList.remove("dropdown-tab-active");
        pubDeletedArticlesTab.parentElement.classList.add("dropdown-tab-active");
        // Articles
        switchArticleDisplay("pub_live", "hide");
        switchArticleDisplay("pub_deleted", "show");
        // No results icon
        reportNoResults();
    })
}

// Admin's publishers
// Add publisher
if (addPublisherTab) {
    addPublisherTab.addEventListener("click", () => {
        // Tab
        addPublisherTab.parentElement.classList.add("dropdown-tab-active");
        removePublisherTab.parentElement.classList.remove("dropdown-tab-active");
        // Publishers
        switchArticleDisplay("remove-publisher", "hide");
        // Add button
        addOrRemoveAddButton("add");
        // No results icon
        reportNoResults();
    })
}
// Display publishers to remove
if (removePublisherTab) {
    removePublisherTab.addEventListener("click", () => {
        // Tab
        removePublisherTab.parentElement.classList.add("dropdown-tab-active");
        addPublisherTab.parentElement.classList.remove("dropdown-tab-active"); 
        // Publishers
        switchArticleDisplay("remove-publisher", "show");
        // Remove add button
        addOrRemoveAddButton("remove");
        // No results icon
        reportNoResults();
    })
}

// Publisher's articles
// Display live articles
if (liveArticlesTab) {
    liveArticlesTab.addEventListener("click", () => {
        // Tab
        liveArticlesTab.parentElement.classList.add("dropdown-tab-active");
        pendingArticlesTab.parentElement.classList.remove("dropdown-tab-active");
        // Articles
        switchArticleDisplay("pub_live", "show");
        switchArticleDisplay("pending", "hide");
        switchArticleDisplay("pub_pending", "hide");
        // No results icon
        reportNoResults();
    })
}
// Display articles under review
if (pendingArticlesTab) {
    pendingArticlesTab.addEventListener("click", () => {
        // Tab
        pendingArticlesTab.parentElement.classList.add("dropdown-tab-active");
        liveArticlesTab.parentElement.classList.remove("dropdown-tab-active");
        // Articles
        switchArticleDisplay("pending", "show");
        switchArticleDisplay("pub_pending", "show");
        switchArticleDisplay("pub_live", "hide");
        // No results icon
        reportNoResults();
    })
}

// Publisher's writers
// Add writer
if (pubWritersTab) {
    pubWritersTab.addEventListener("click", () => {
        // Tab
        pubWritersTab.parentElement.classList.add("dropdown-tab-active");
        unpubWritersTab.parentElement.classList.remove("dropdown-tab-active");
        // Articles
        switchArticleDisplay("published-writer", "show");
        switchArticleDisplay("unpublished-writer", "hide");
        // Remove add button
        addOrRemoveAddButton("add");
        // No results icon
        reportNoResults();
    })
}
// Display writers to remove
if (unpubWritersTab) {
    unpubWritersTab.addEventListener("click", () => {
        // Tab
        unpubWritersTab.parentElement.classList.add("dropdown-tab-active");
        pubWritersTab.parentElement.classList.remove("dropdown-tab-active");
        // Articles
        switchArticleDisplay("unpublished-writer", "show");
        switchArticleDisplay("published-writer", "hide");
        // Add button
        addOrRemoveAddButton("add");
        // No results icon
        reportNoResults();
    })
}

// Publisher's requests
// Display requests from disassociated writers
if (myRequestsTab) {
    myRequestsTab.addEventListener("click", () => {
        // Tab
        myRequestsTab.parentElement.classList.add("dropdown-tab-active");
        allWritersTab.parentElement.classList.remove("dropdown-tab-active");
        // Articles
        switchArticleDisplay("my-requests", "show");
        switchArticleDisplay("all-requests", "hide");
        // No results icon
        reportNoResults();
    })
}
// Display requests from unassociated writers
if (allWritersTab) {
    allWritersTab.addEventListener("click", () => {
        // Tab
        myRequestsTab.parentElement.classList.remove("dropdown-tab-active");
        allWritersTab.parentElement.classList.add("dropdown-tab-active");
        // Articles
        switchArticleDisplay("my-requests", "hide");
        switchArticleDisplay("all-requests", "show");
        // No results icon
        reportNoResults();
    })
}

// Author's articles
// Display draft articles
if (draftsTab) {
    draftsTab.addEventListener("click", () => {
        // Tab
        draftsTab.parentNode.classList.add("dropdown-tab-active");
        publishedTab.parentNode.classList.remove("dropdown-tab-active");
        // Articles
        for (let article of draftArticles) { switchArticleDisplay(article, "show"); }
        for (let article of publishedArticles) { switchArticleDisplay(article, "hide"); }
        // Add button
        addOrRemoveAddButton("add");
        // No results icon
        reportNoResults();
    });
}
// Display published articles
if (publishedTab) {
    publishedTab.addEventListener("click", () => {
        // Tab
        publishedTab.parentNode.classList.add("dropdown-tab-active");
        draftsTab.parentNode.classList.remove("dropdown-tab-active");
        // Articles
        for (let article of publishedArticles) { switchArticleDisplay(article, "show"); }
        for (let article of draftArticles) { switchArticleDisplay(article, "hide"); }
        // Remove add button
        addOrRemoveAddButton("remove");
        // No results icon
        reportNoResults();
    });
}

// || Tab Defaults

window.addEventListener('load', () => {
    
    // Get publisher page
    let adminPublishersPage = document.getElementById("admin-page");
    let adminArticlesPage = document.getElementById("admin-articles")
    let authorPage = document.getElementById("author-articles");
    let publisherPage = document.getElementById("publisher-articles");
    let pubWritersPage = document.getElementById("publisher-writers");
    let requestsPage = document.getElementById("publisher-requests");

    if (adminArticlesPage) {
        // Show live articles
        pubLiveArticlesTab.parentElement.classList.add("dropdown-tab-active");
        pubDeletedArticlesTab.parentElement.classList.remove("dropdown-tab-active");
        switchArticleDisplay("pub_deleted", "hide");
        reportNoResults();
    } 

    if (adminPublishersPage) {
        // Show tab to add publisher
        addPublisherTab.parentNode.classList.add("dropdown-tab-active");
        removePublisherTab.parentNode.classList.remove("dropdown-tab-active");
        switchArticleDisplay("remove-publisher", "hide");
        addOrRemoveAddButton("add");
        reportNoResults();
    } 

    else if (authorPage) {
        // Show draft articles tab
        draftsTab.parentNode.classList.add("dropdown-tab-active");
        publishedTab.parentNode.classList.remove("dropdown-tab-active");
        for (let article of draftArticles) { switchArticleDisplay(article, "show"); }
        for (let article of publishedArticles) { switchArticleDisplay(article, "hide"); }
        addOrRemoveAddButton("add");
        reportNoResults();
    } 

    else if (publisherPage) {
        // Show live articles tab
        liveArticlesTab.parentElement.classList.add("dropdown-tab-active");
        pendingArticlesTab.parentElement.classList.remove("dropdown-tab-active");
        switchArticleDisplay("pub_live", "show");
        switchArticleDisplay("pending", "hide");
        switchArticleDisplay("pub_pending", "hide");
        reportNoResults(); 
    }

    else if (pubWritersPage) {
        // Show published writers
        pubWritersTab.parentElement.classList.add("dropdown-tab-active");
        unpubWritersTab.parentElement.classList.remove("dropdown-tab-active");
        switchArticleDisplay("published-writer", "show");
        switchArticleDisplay("unpublished-writer", "hide");
        addOrRemoveAddButton("add");
        reportNoResults();    
    }

    else if (requestsPage) {
        // Show requests from publisher's writers
        myRequestsTab.parentElement.classList.add("dropdown-tab-active");
        allWritersTab.parentElement.classList.remove("dropdown-tab-active");
        switchArticleDisplay("my-requests", "show");
        switchArticleDisplay("all-requests", "hide");
        reportNoResults();    
    }
})


// || Article Actions

// Transfer article
let transferForm = document.querySelectorAll(".article-action-transfer");
if (transferForm) {
    for (let form of transferForm) {
        form.addEventListener("click", (event) => {
            // Prompt email address
            let email = prompt("Please enter an email address.");
            if (email) {
                // Attach address to form and submit
                let hiddenInput = document.createElement("input");
                hiddenInput.setAttribute("type", "hidden")
                hiddenInput.setAttribute("name", "user_email");
                hiddenInput.value = email;
                form.appendChild(hiddenInput);
                form.submit();
            }
            else {
                event.preventDefault();
            }
        })
    }
}


// Alert article hyperlink
let linkArticleButton = document.getElementsByClassName("article-action-link");
for (let button of linkArticleButton) {
    button.addEventListener("click", () => {
        // Get published article's metadata 
        let pubNoteId = button.querySelector("input[name='pub-id']").value;
        let slug = button.querySelector("input[name='article-slug']").value;
        // Generate and alert hyperlink
        let hyperlink = "http://127.0.0.1:5000/" + pubNoteId + "/" + slug // !! to be updated
        alert(hyperlink);
    });
}


// || Article Status Icons

// Get displayed articles
let articlesDisplayed = document.querySelectorAll("li.article-display");
// Prepare article decorations (icon and tool tip)
let statusIcon = document.createElement("i");
let iconToolTip = document.createElement("div");
iconToolTip.setAttribute("class", "status-explanation")
statusIcon.appendChild(iconToolTip);
// Match and configure decorations to article by status
for (let article of articlesDisplayed) {
    for (let status of article.classList) {
        // Articles requested for publication
        if (status.includes("requested")) {
            statusIcon.setAttribute("class", "status-icon fas fa-envelope");
            iconToolTip.innerHTML = "Publication request sent";
            article.appendChild(statusIcon.cloneNode(true));
        }
        // Articles under review
        else if (status.includes("pending")) {
            // Publisher's view
            let pendingTab = document.getElementById("pending-articles-tab");
            if (pendingTab) {
                statusIcon.setAttribute("class", "status-icon fas fa-search");
                iconToolTip.innerHTML = "You are reviewing this article";
                article.appendChild(statusIcon.cloneNode(true));
            }
            // Author's view
            else {
                statusIcon.setAttribute("class", "status-icon fas fa-lock");
                iconToolTip.innerHTML = "Article is being reviewed";
                article.appendChild(statusIcon.cloneNode(true));
            }
        }
        // Published articles (omitting published writers)
        else if (status.includes("pub") && !status.includes("published-writer")) {
            statusIcon.setAttribute("class", "status-icon fas fa-book-open");
            iconToolTip.innerHTML = "Article is published and live";
            article.appendChild(statusIcon.cloneNode(true));
            // Outdated daft article
            if (status.includes("pub_draft")) {
                let toolTip = article.querySelector(".status-explanation");
                toolTip.innerHTML = "Outdated: click to copy live version";                 
                let icon = article.querySelector(".status-icon");
                icon.setAttribute("class", "status-icon fas fa-exclamation-circle");
                // Click to trigger update
                icon.addEventListener("click", () => {
                    let form = article.querySelector("form.article-action-update");
                    if (confirm("Update this article to its live version?")) {
                        form.submit()
                    }
                }); 
            }
        }
    }  
}

