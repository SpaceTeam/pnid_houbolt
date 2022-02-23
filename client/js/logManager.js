var nrInfo = 0;
var nrWarning = 0;
var nrError = 0;
var nrHardwareError = 0;

var autoScroll = true;
var detectScrolling = true;

var logContainer = undefined;
var logOverview = undefined;
var logTextArea = undefined;

function createLogBox()
{
    //only create new log box if it hasn't been done yet.
    if (logContainer == undefined)
    {
        let logBoxClone = $("#logBoxTemp").clone();
        logBoxClone.removeAttr('id');
        $(document.body).append(logBoxClone);
    }
    
    //store log dom elements in variable as cache to not have to use .find so much
    logContainer = $(document).find(".logContainer:not(#logBoxTemp)");
    logOverview = logContainer.find(".logMenu").find(".logOverview");
    logTextArea = logContainer.find(".logTextArea");
    console.log("stored log container vars", logContainer, logOverview);
}

function toggleLogBox()
{
    if (nrInfo + nrWarning + nrError + nrHardwareError === 0)
    {
        return;
    }
    let logContainer = $(document).find(".logContainer:not(#logBox)");
    let logTextArea = logContainer.find(".logTextArea");
    let logButton = logContainer.find(".logMenu").find("button.btn");
    if (logTextArea.is(":visible"))
    {
        logButton.html(`<i class="bi bi-arrow-up"></i>`);
        logTextArea.fadeToggle(100, disableAutoScroll);
    }
    else
    {
        logButton.html(`<i class="bi bi-arrow-down"></i>`);
        logTextArea.fadeToggle(100, activateAutoScroll);
    }
}

function updateOverviewCounters()
{
    //let logContainer = $(document).find(".logContainer:not(#logBoxTemp)");
    //let logOverview = logContainer.find(".logMenu").find(".logOverview");
    //consider also caching these. probably not super needed as there aren't many nodes in this dom branch, but still
    logOverview.find("#logInfo").find(".logCategoryNumber").text(nrInfo);
    logOverview.find("#logWarning").find(".logCategoryNumber").text(nrWarning);
    logOverview.find("#logError").find(".logCategoryNumber").text(nrError);
    logOverview.find("#logHardwareError").find(".logCategoryNumber").text(nrHardwareError);
}

function updateScroll()
{
    if (autoScroll === true)
    {
        //let logContainer = $(document).find(".logContainer:not(#logBoxTemp)");
        //let logTextArea = logContainer.find(".logTextArea");
        logTextArea.scrollTop(logTextArea.prop('scrollHeight'));
    }
}

function disableAutoScroll()
{
    autoScroll = false;
    //let logContainer = $(document).find(".logContainer:not(#logBoxTemp)");
    //let logTextArea = logContainer.find(".logTextArea");
    logTextArea.find("button.scrollButton").fadeIn(100);
}

function activateAutoScroll()
{
    autoScroll = true;
    //let logContainer = $(document).find(".logContainer:not(#logBoxTemp)");
    //let logTextArea = logContainer.find(".logTextArea");
    logTextArea.animate({scrollTop: $(logTextArea).prop('scrollHeight')}, 200);
    logTextArea.find("button.scrollButton").fadeOut(200);
}

function printLog(level, message)
{
    //let logContainer = $(document).find(".logContainer:not(#logBoxTemp)");
    logContainer.find(".logMenu").find("button.btn").removeAttr('disabled'); //this doesn't have to be run every time something is logged.
    //let logTextArea = logContainer.find(".logTextArea");
    let severityIcon = "";
    switch (level)
    {
        case "info":
            severityIcon = `<i class="bi bi-info-circle iconInfo"></i>`;
            nrInfo += 1;
            break;
        case "warning":
            severityIcon = `<i class="bi bi-exclamation-triangle iconWarning"></i>`;
            nrWarning += 1;
            break;
        case "error":
            severityIcon = `<i class="bi bi-x-square iconError"></i>`;
            nrError += 1;
            break;
        case "hardwareerror":
            severityIcon = `<i class="bi bi-bug iconError"></i>`;
            nrHardwareError += 1;
            break;
        default:
            printLog("info", `Encountered unknown log severity level: "${level}"\nDefaulting to "warning"`);
            severityIcon = `<i class="bi bi-exclamation-triangle btn-outline-warning"></i>`;
            nrWarning += 1;
            break;
    }

    // THIS IS A TEMPORARY FIX FOR PERFORMANCE PROBLEMS
    // LOGGING TOO MANY MESSAGES RESULTS IN GRADUAL SLOWDOWN, BUT SIMPLY
    // NOT RENDERING THE LOGGED MESSAGE (ONLY COUNTING IT) IS NOT THE WAY TO GO
    if (level != "info" && level != "warning") {
        let logEntryClone = logContainer.find("#logEntryTemp").clone();
        logEntryClone.html(severityIcon + " " + message);
        logEntryClone.removeAttr('id');
        logEntryClone.removeAttr('style');
        logTextArea.append(logEntryClone);
        updateScroll();
    }
    updateOverviewCounters();
    console.log(level + ":", message);
}
