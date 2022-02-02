// || Password

// View or hide input password
const passwordInputs = document.querySelectorAll("input#password, input#confirm_password");
for (let input of passwordInputs) {
    // Create icons
    let hidePasswordIcon = document.createElement("i");
    hidePasswordIcon.setAttribute("class", "see-password-icon far fa-eye");
    let showPasswordIcon = document.createElement("i");
    showPasswordIcon.setAttribute("class", "hide-password-icon far fa-eye-slash");
    // Append to input div
    input.parentNode.appendChild(hidePasswordIcon);
    // Show input password
    hidePasswordIcon.addEventListener("click", () => {
        input.setAttribute("type", "text");
        hidePasswordIcon.parentNode.replaceChild(showPasswordIcon, hidePasswordIcon);
    })
    // Hide input password
    showPasswordIcon.addEventListener("click", () => {
        input.setAttribute("type", "password");
        showPasswordIcon.parentNode.replaceChild(hidePasswordIcon, showPasswordIcon);
    })
}


// || Legal Checkbox

// Ensure all registered users have agreed legal contract
const checkbox = document.querySelector("#legal-agreement>input");
const registerForm = document.querySelector(".auth-form");
// Prompt user to agree
if (checkbox) {
    registerForm.addEventListener("submit", (event) => {
        if (!checkbox.checked) {
            alert("Please indicate that you have read and agree to the Terms and Conditions and Privacy Policy.");
            event.preventDefault();
        }
    })
}

