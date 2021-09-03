function darkModeToggleButton(text) {
    var element = document.body;
    element.classList.toggle("dark-mode");
    if (theme.getAttribute('href') == "css/lightpnid.css") {
        theme.setAttribute('href', "css/darkpnid.css");

    } else {
        theme.setAttribute('href', "css/lightpnid.css");
    }
}

 
