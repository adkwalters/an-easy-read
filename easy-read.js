function showNav() {
    let header = document.getElementById('header-main');
    if (header.style.height === "4rem") {
        header.style.height = "11rem";
        console.log("click logged and 4 found")
    } else {
        header.style.height = "4rem";
    }
}

