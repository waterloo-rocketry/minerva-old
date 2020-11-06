const slack_handler = require("../../handlers/slack-handler");
const calendar_handler = require("../../handlers/calendar-handler");
const moment = require("moment-timezone");

module.exports.send = async function (userId, textParams, originChannelId, originChannelName, trigger) {
    var view;
    try {
        view = await slack_handler.openView(trigger, require("../../blocks/loading.json"));

        const event = await calendar_handler.getNextEventByTypeAndChannel("meeting", originChannelId);

        const parameters = await calendar_handler.getParametersFromDescription(event.summary, event.description, slack_handler.defaultChannels);

        const meetingBlock = await this.parseMeetingBlock(event, parameters, originChannelId);

        await slack_handler.updateView(view.view.id, meetingBlock);
    } catch (error) {
        if (error.data != undefined && error.data.error === "not_found") {
            // Do nothing, this happens when 'cancel' has already been selected
            return Promise.resolve();
        } else if (JSON.stringify(error).includes("trigger_id")) {
            return Promise.reject("`trigger_id` expired. Sometimes this can happen when this command hasn't been used for a while. Try again.");
        }
        const errorBlock = require("../../blocks/error.json");
        errorBlock.blocks[0].text.text = "An error has occured:\n\n*" + error + "*\n\nSee https://github.com/waterloo-rocketry/minerva for help with commands.";

        // Don't 'await' this since we only care to push the update. If they have closed the view or something, the message in chat will still show the error.
        slack_handler.updateView(view.view.id, errorBlock);
        return Promise.reject(error);
    }
};

module.exports.recieve = async function (meetingBlock) {
    const parameters = await this.extractMeetingParameters(meetingBlock);

    const eventId = parameters.eventId;
    const loc = parameters.location;

    // we do not want these stored in the JSON description
    delete parameters.location;
    delete parameters.eventId;
    delete parameters.updateType;

    const updates = {};

    updates.location = loc;
    updates.description = JSON.stringify(parameters);

    await calendar_handler.updateEventById(eventId, updates);

    return Promise.resolve("Meeting updated");
};

module.exports.parseMeetingBlock = async function (event, parameters, channel) {
    // Doing this copies the block to a new object so that any inputs or changes do not get applied to the next time this block is used.
    const meetingBlock = JSON.parse(JSON.stringify(require("../../blocks/meeting.json")));

    const metadata = {};

    metadata.event_id = event.id;
    metadata.channel = channel;
    metadata.summary = event.summary;

    // This must be stored in a string and not an object or the slack API throws an invalid arguments error
    meetingBlock.private_metadata = JSON.stringify(metadata);

    meetingBlock.blocks[0].text.text =
        "Editing meeting: *" + event.summary + "* occuring on *" + moment(event.start.dateTime).tz("America/Toronto").format("MMMM Do, YYYY [at] h:mm A") + "*";

    meetingBlock.blocks[2].element.initial_value = event.location;
    meetingBlock.blocks[4].element.initial_value = parameters.link;
    meetingBlock.blocks[6].accessory.initial_channel = parameters.mainChannel;
    meetingBlock.blocks[8].accessory.initial_channels = parameters.additionalChannels;
    // If agendaItems is an empty array, no need for a dash
    meetingBlock.blocks[10].element.initial_value = parameters.agendaItems.length != 0 ? "- " + parameters.agendaItems.join("\n- ") : "";
    meetingBlock.blocks[12].element.initial_value = parameters.notes;
    meetingBlock.blocks[14].accessory.placeholder.text = parameters.alertType;
    meetingBlock.blocks[16].text.text =
        "Update just this meeting or all future " +
        event.summary +
        "?\n*Note: this feature has not been implemented yet. Right now, only the next meeting will be updated.*";

    return meetingBlock;
};

module.exports.extractMeetingParameters = async function (meetingBlock) {
    const parameters = {};

    parameters.eventId = meetingBlock.private_metadata.event_id;

    parameters.link = meetingBlock.state.values.link.link.value;
    if (parameters.link === null || parameters.link === undefined) {
        parameters.link = "";
    }

    parameters.location = meetingBlock.state.values.location.location.value;
    if (parameters.location === null || parameters.location === undefined) {
        parameters.location = "";
    }

    parameters.mainChannel = meetingBlock.state.values.main_channel.main_channel.selected_channel;
    parameters.additionalChannels = meetingBlock.state.values.additional_channels.additional_channels.selected_channels;

    // Agenda items come in like
    // - Agenda 1
    // - Agenda 2
    // etc, have to convert back to a JSON list
    if (meetingBlock.state.values.agenda_items.agenda_items.value !== null && meetingBlock.state.values.agenda_items.agenda_items.value !== undefined) {
        parameters.agendaItems = meetingBlock.state.values.agenda_items.agenda_items.value.replace(/- /g, "").split("\n");
    } else {
        parameters.agendaItems = [];
    }

    parameters.notes = meetingBlock.state.values.notes.notes.value;
    if (parameters.notes === null || parameters.notes === undefined) {
        parameters.notes = "";
    }

    if (meetingBlock.state.values.alert_type.alert_type.selected_option === null) {
        parameters.alertType = meetingBlock.blocks[14].accessory.placeholder.text;
    } else {
        parameters.alertType = meetingBlock.state.values.alert_type.alert_type.selected_option;
    }

    parameters.updateType = meetingBlock.state.values.update_type.update_type.selected_option.value;
    parameters.eventType = "meeting";

    return parameters;
};
