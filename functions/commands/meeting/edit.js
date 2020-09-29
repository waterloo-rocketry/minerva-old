const slack_handler = require("../../handlers/slack-handler");
const calendar_handler = require("../../handlers/calendar-handler");
const moment = require("moment-timezone");

module.exports.send = async function (userId, textParams, originChannelId, originChannelName, trigger) {
    try {
        // get parameters
        //const parameters = await this.filterParameters(textParams, originChannelId);

        //const meetingBlock = JSON.parse(filestream.readFileSync("meeting.json"));

        const view = await slack_handler.openView(trigger, require("../../blocks/loading.json"));

        const event = await calendar_handler.getNextEventByTypeAndChannel("meeting", originChannelId);

        console.log(JSON.stringify(event.description));

        const parameters = await calendar_handler.getParametersFromDescription(event.summary, event.description, slack_handler.defaultChannels);

        console.log(parameters);

        // Copy the block so that any changes we make do not get copied to the next time the command is used.
        const meetingBlock = await this.parseMeetingBlock(event, parameters);

        await slack_handler.updateView(view.view.id, meetingBlock);
    } catch (error) {
        if (error.data != undefined && error.data.error === "not_found") {
            // Do nothing, this happens when 'cancel' has already been selected
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

    meetingBlock.blocks[2].element.initial_value = event.location;
    meetingBlock.blocks[4].element.initial_value = parameters.link;
    meetingBlock.blocks[6].accessory.initial_channel = parameters.mainChannel;
    meetingBlock.blocks[8].accessory.initial_channels = parameters.additionalChannels;
    meetingBlock.blocks[10].element.initial_value = "- " + parameters.agenda.join("\n- ");
    meetingBlock.blocks[12].element.initial_value = parameters.extra;
    meetingBlock.blocks[14].accessory.placeholder.text = parameters.alertType;
    meetingBlock.blocks[16].text.text = "Update just this meeting or all future " + event.summary + "?";

    return meetingBlock;
};

/*

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
