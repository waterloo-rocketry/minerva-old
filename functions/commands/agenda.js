const slack_handler = require('../handlers/slack-handler');
const meeting_handler = require('../handlers/calendar-handler');

module.exports.send = async function (user_id, textParams, originChannel) {
    try {
        // get parameters
        const parameters = await this.filterParameters(textParams, originChannel);

        const event = await meeting_handler.getNextEventByTypeAndChannel("meeting", originChannel);

        if (parameters.modifier === "list") {
            const message = await this.generateListMessage(event.description);
            await slack_handler.postEphemeralMessage(message, originChannel, user_id);
        } else { // remove and add can be handled together
            const updates = {
                description: ""
            }
            if (parameters.modifier === "add") {
                updates.description = await this.addAgendaItemToDescription(event.description, parameters.text);
            } else {
                updates.description = await this.removeAgendaItemFromDescription(event.description, parseInt(parameters.text));
            }
            console.log(updates);
            await meeting_handler.updateEventById(event.id, updates);
            return Promise.resolve("Agenda item " + (parameters.modifier === "add" ? "added" : "removed"));
        }
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

    parameters.text = textParams.replace(initialParams[0], "").trim(); // gets rid of the first param (the modifier), then trims leading/trailing whitepsace

    if (parameters.modifier === "remove" && isNaN(parameters.text) || parseInt(parameters.text) < 1) {
        return Promise.reject("Second parameter of `remove` modifier must be a numeric value greater than 0");
    }

    return parameters;
}

module.exports.generateListMessage = async function (description) {
    const agendaArray = description.split("\n")[4].split(",");
    let message = "Please see agenda items:";
    if (agendaArray.length === 1 && agendaArray[0] === "") {
        message = "There are currently no agenda items for the next meeting.";
    } else {
        for (var i = 0; i < agendaArray.length; i++) {
            message += "\n    " + (i + 1) + ". " + agendaArray[i].trim();
        }
    }
    return Promise.resolve(message);
}

module.exports.addAgendaItemToDescription = async function (description, text) {
    let lines = description.split("\n");

    if (lines[4] === "") {
        lines[4] = text;
    } else {
        lines[4] += "," + text;
    }
    return lines.join("\n");
}

module.exports.removeAgendaItemFromDescription = async function (description, indexToRemove) {
    let lines = description.split("\n");
    let items = lines[4].split(",");
    items.splice(indexToRemove - 1, 1);
    lines[4] = items.join(",");
    return lines.join("\n");
}