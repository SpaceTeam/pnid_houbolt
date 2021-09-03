function createThemeSwitcher()
{
    let logBoxClone = $("#themeSwitcherTemp").clone();
	logBoxClone.removeAttr('id');
	$(document.body).append(logBoxClone);
}

function switchTheme()
{
    let themeSwitcherButton = $(document).find(".themeSwitcher:not(#themeSwitcherTemp)").find("button");
    if (theme.getAttribute('href') == "css/themes/lightTheme.css")
    {
        theme.setAttribute('href', "css/themes/darkTheme.css");
        themeSwitcherButton.html(`<i class="bi bi-brightness-high"></i>`);
    } 
    else
    {
        theme.setAttribute('href', "css/themes/lightTheme.css");
        themeSwitcherButton.html(`<i class="bi bi-moon"></i>`);
    }
}