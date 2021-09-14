function createThemeSwitcher()
{
    let themeSwitcherClone = $("#themeSwitcherTemp").clone();
	themeSwitcherClone.removeAttr('id');
	$(document.body).append(themeSwitcherClone);
}

function switchTheme()
{
    let themeSwitcherButton = $(document).find(".themeSwitcher:not(#themeSwitcherTemp)").find("button");
    //TODO: fetch prefix path first
    if (theme.getAttribute('href') == "css/themes/lightTheme.css")
    {
        theme.setAttribute('href', "css/themes/darkTheme.css");
        themeSwitcherButton.html(`<i class="bi bi-brightness-high"></i>`);
    } 
    else if (theme.getAttribute('href') == "css/themes/darkTheme.css")
    {
        theme.setAttribute('href', "css/themes/lightTheme.css");
        themeSwitcherButton.html(`<i class="bi bi-moon"></i>`);
    }
    else if (theme.getAttribute('href') == "pnid_houbolt/client/css/themes/lightTheme.css")
    {
        theme.setAttribute('href', "pnid_houbolt/client/css/themes/darkTheme.css");
        themeSwitcherButton.html(`<i class="bi bi-brightness-high"></i>`);
    } 
    else if (theme.getAttribute('href') == "pnid_houbolt/client/css/themes/darkTheme.css")
    {
        theme.setAttribute('href', "pnid_houbolt/client/css/themes/lightTheme.css");
        themeSwitcherButton.html(`<i class="bi bi-moon"></i>`);
    }
}