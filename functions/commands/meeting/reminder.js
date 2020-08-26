const slack_handler = require("../../handlers/slack-handler");
const calendar_handler = require("../../handlers/calendar-handler");
const events = require("../../scheduled/events.js");

module.exports.send = async function (userId, textParams, originChannel) {
    const event = await calendar_handler.getNextEventByTypeAndChannel("meeting", originChannel);

    const startTimeDate = new Date(event.start.dateTime);
    const timeDifference = startTimeDate.getTime() - Date.now();

    const isEventSoon = false;

    const parameters = await events.parseDescription(event.summary, event.description, new Map());

    const message = await events.generateMessage(event, parameters, timeDifference, isEventSoon, startTimeDate);

    await slack_handler.postMessageToChannel(message, parameters.main_channel, false);
};

module.exports.filterParameters = async function (textParams) {
    return parameters;
};
