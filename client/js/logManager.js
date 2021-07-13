var nrInfo = 0;
var nrWarning = 0;
var nrError = 0;
var nrHardwareError = 0;

function createLogBox()
{
    let logBoxClone = $("#logBox").clone();
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
    }
    else
    {
        logButton.html(`<i class="bi bi-arrow-down"></i>`);
    }
    logTextArea.fadeToggle(100);
}

function updateOverviewCounters()
{
    let logContainer = $(document).find(".logContainer:not(#logBox)");
    let logOverview = logContainer.find(".logMenu").find(".logOverview");
    logOverview.find("#logInfo").find(".logCategoryNumber").text(nrInfo);
    logOverview.find("#logWarning").find(".logCategoryNumber").text(nrWarning);
    logOverview.find("#logError").find(".logCategoryNumber").text(nrError);
    logOverview.find("#logHardwareError").find(".logCategoryNumber").text(nrHardwareError);
}

function printLog(level, message)
{
    let logContainer = $(document).find(".logContainer:not(#logBox)");
    logContainer.find(".logMenu").find("button.btn").removeAttr('disabled');
    let logTextArea = logContainer.find(".logTextArea");
    let logEntryClone = logContainer.find("#logEntryTemp").clone();
    let severityIcon = "";
    switch (level)
    {
        case 0: //info
            severityIcon = `<i class="bi bi-info-circle"></i>`;
            nrInfo += 1;
            break;
        case 1: //warning
            severityIcon = `<i class="bi bi-exclamation-triangle btn-outline-warning"></i>`;
            nrWarning += 1;
            break;
        case 2: //error
            severityIcon = `<i class="bi bi-x-square btn-outline-danger"></i>`;
            nrError += 1;
            break;
        case 3: //hardware error
            severityIcon = `<i class="bi bi-bug btn-outline-danger"></i>`;
            nrHardwareError += 1;
            break;
        default:
            printLog(1, `Encountered unknown log severity level: "${level}"\nDefaulting to "warning"`);
            severityIcon = `<i class="bi bi-exclamation-triangle btn-outline-warning"></i>`;
            nrWarning += 1;
            break;
    }
    logEntryClone.html(severityIcon + " " + message);
    logEntryClone.removeAttr('id');
    logEntryClone.removeAttr('style');
    logTextArea.append(logEntryClone);
    updateOverviewCounters();
}