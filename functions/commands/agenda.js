const slack_handler = require('../handlers/slack-handler');
const meeting_handler = require('../handlers/calendar-handler');

module.exports.send = async function (user_id, textParams, originChannel) {
    try {
        // get parameters
        const parameters = await filterParameters(textParams, originChannel);

        const event = await meeting_handler.getNextEventByTypeAndChannel("meeting", originChannel);

        if (parameters.modifier === "add") {
            // from next event, get description line 3, += text.replace("add", "").trim();


        } else if (parameters.modifier === "list") {
            const message = generateListMessage(description);
            await slack_handler.postMessageToChannel(message, originChannel);
        } else { // remove

        }

        return Promise.resolve();
    } catch (error) {
        return Promise.reject(error);
    }
}

module.exports.filterParameters = async function (textParams) {
    if (textParams === "") {
        return Promise.reject("Missing required parameter: `add/remove/list`");
    }

    const initialParams = textParams.split(" ");

    if (initialParams.length < 1) {
        return Promise.reject("Missing required parameter: `add/remove/list`")
    };

    const parameters = {
        modifier: "",
        text: ""
    }

    switch (initialParams[0]) {
        case "add":
            break;
        case "remove":
            break;
        case "list":
            break;
        default:
            return Promise.reject("Missing required parameter: `add/remove/list`")
    }
    parameters.modifier = initialParams[0];

    parameters.text = textParams.replace(initialParams[0], "").trim(); // gets rid of the first param (the modifier), then trims leading whitepsace

    if (parameters.modifier === "remove" && isNaN(parameters.text)) {
        return Promise.reject("Second parameter of `remove` modifier must be a numeric value");
    }

    return parameters;
}

module.exports.generateListMessage = async function (description) {
    const agendaArray = description.split("\n")[3].split(",");
    const message = "Please see agenda items:";
    for (var i = 0; i < agendaArray.length; i++) {
        message += "\n    " + (i + 1) + ". " + agendaArray[i].trim();
    }
    return message;
}