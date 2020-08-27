const slack_handler = require("../../handlers/slack-handler");
const calendar_handler = require("../../handlers/calendar-handler");
const moment = require("moment-timezone");

module.exports.send = async function (userId, textParams, originChannelId, originChannelName, trigger) {
    try {
        // get parameters
        //const parameters = await this.filterParameters(textParams, originChannelId);

        //const meetingBlock = JSON.parse(filestream.readFileSync("meeting.json"));

        const view = await slack_handler.openView(trigger, require("../../blocks/loading.json"));

        const event = await calendar_handler.getNextEventByTypeAndChannel("meeting", originChannelName);

        const parameters = calendar_handler.getParametersFromDescription(event.summary, event.description, slack_handler.defaultChannels);

        // Copy the block so that any changes we make do not get copied to the next time the command is used.
        const meetingBlock = this.parseMeetingBlock(event, parameters);

        await slack_handler.updateView(view.view.id, meetingBlock);
    } catch (error) {
        if (error.data.error === "not_found") {
            // Do nothing, since this happens when cancel is selected
            return Promise.resolve();
        } else if (JSON.stringify(error).includes("trigger_id")) {
            return Promise.reject("`trigger_id` expired. Sometimes this can happen when this command hasn't been used for a while. Try again.");
        }
        return Promise.reject(error);
    }
};

module.exports.parseMeetingBlock = async function (event, parameters) {
    // Doing this copies the block to a new object so that any inputs or changes do not get applied to the next time this block is used.
    const meetingBlock = JSON.parse(JSON.stringify(require("../../blocks/meeting.json")));

    meetingBlock.blocks[0].text.text =
        "Editing meeting: *" + event.summary + "* occuring on *" + moment(event.start.dateTime).tz("America/Toronto").format("MMMM Do, YYYY [at] h:mm A") + "*";

    //
    meetingBlock.blocks[2].element.initial_value = event.location;
    meetingBlock.blocks[4].element.initial_value = parameters.link;
};

/*module.exports.filterParameters = async function (textParams) {
    if (textParams === "") {
        return Promise.reject("Missing required parameter: `add/remove/list`");
    }

    textParams = textParams.replace(/\s/g, " ");
    textParams = textParams.replace(/xA0/g, " ");
    const initialParams = textParams.split(" ");

    if (initialParams.length < 1) {
        return Promise.reject("Missing required parameter: `add/remove/list`");
    }

    const parameters = {
        modifier: "",
        text: "",
    };

    switch (initialParams[0]) {
        case "add":
            break;
        case "remove":
            break;
        case "list":
            break;
        case "send":
            break;
        default:
            return Promise.reject("Missing required parameter: `add/remove/list`");
    }
    parameters.modifier = initialParams[0];

    parameters.text = textParams.replace(initialParams[0], "").trim(); // gets rid of the first param (the modifier), then trims leading/trailing whitepsace

    if (parameters.modifier === "remove" && (isNaN(parameters.text) || parseInt(parameters.text) < 1)) {
        return Promise.reject("Second parameter of `remove` modifier must be a positive integer");
    }

    return parameters;
};

module.exports.generateAgendaListMessage = async function (description) {
    const lines = description.split("\n");
    if (lines[4] === undefined || lines[4] === "") {
        return "There are currently no agenda items for the next meeting.";
    }
    const agendaArray = lines[4].split(",");
    let message = "Please see agenda items:";
    if (agendaArray.length === 1 && agendaArray[0] === "") {
        return "There are currently no agenda items for the next meeting.";
    } else {
        for (var i = 0; i < agendaArray.length; i++) {
            message += "\n    " + (i + 1) + ". " + agendaArray[i].trim();
        }
    }
    return Promise.resolve(message);
};

module.exports.addAgendaItemToDescription = async function (description, text) {
    let lines = description.split("\n");

    if (lines[4] === "" || lines[4] === undefined) {
        lines[4] = text;
    } else {
        lines[4] += "," + text;
    }
    return lines.join("\n");
};

module.exports.removeAgendaItemFromDescription = async function (description, index_to_remove) {
    let lines = description.split("\n");
    let items = lines[4].split(",");
    items.splice(index_to_remove - 1, 1);
    lines[4] = items.join(",");
    return lines.join("\n");
};*/
