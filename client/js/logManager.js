var nrInfo = 0;
var nrWarning = 0;
var nrError = 0;
var nrHardwareError = 0;

var autoScroll = true;
var detectScrolling = true;

function createLogBox()
{
    let logBoxClone = $("#logBoxTemp").clone();
	logBoxClone.removeAttr('id');
	$(document.body).append(logBoxClone);
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
    let logContainer = $(document).find(".logContainer:not(#logBoxTemp)");
    let logOverview = logContainer.find(".logMenu").find(".logOverview");
    logOverview.find("#logInfo").find(".logCategoryNumber").text(nrInfo);
    logOverview.find("#logWarning").find(".logCategoryNumber").text(nrWarning);
    logOverview.find("#logError").find(".logCategoryNumber").text(nrError);
    logOverview.find("#logHardwareError").find(".logCategoryNumber").text(nrHardwareError);
}

function updateScroll()
{
    if (autoScroll === true)
    {
        let logContainer = $(document).find(".logContainer:not(#logBoxTemp)");
        let logTextArea = logContainer.find(".logTextArea");
        logTextArea.scrollTop(logTextArea.prop('scrollHeight'));
    }
}

function disableAutoScroll()
{
    autoScroll = false;
    let logContainer = $(document).find(".logContainer:not(#logBoxTemp)");
    let logTextArea = logContainer.find(".logTextArea");
    logTextArea.find("button.scrollButton").fadeIn(100);
}

function activateAutoScroll()
{
    autoScroll = true;
    let logContainer = $(document).find(".logContainer:not(#logBoxTemp)");
    let logTextArea = logContainer.find(".logTextArea");
    logTextArea.animate({scrollTop: $(logTextArea).prop('scrollHeight')}, 200);
    logTextArea.find("button.scrollButton").fadeOut(200);
}

function printLog(level, message)
{
    let logContainer = $(document).find(".logContainer:not(#logBoxTemp)");
    logContainer.find(".logMenu").find("button.btn").removeAttr('disabled');
    let logTextArea = logContainer.find(".logTextArea");
    let logEntryClone = logContainer.find("#logEntryTemp").clone();
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
    logEntryClone.html(severityIcon + " " + message);
    logEntryClone.removeAttr('id');
    logEntryClone.removeAttr('style');
    logTextArea.append(logEntryClone);
    updateOverviewCounters();
    updateScroll();
    console.log(level + ":", message);
}
