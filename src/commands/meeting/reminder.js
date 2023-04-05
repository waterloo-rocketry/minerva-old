const slack_handler = require("../../handlers/slack-handler");
const calendar_handler = require("../../handlers/calendar-handler");
const events = require("../../scheduled/events.js");

module.exports.send = async function (originChannelId) {
    const event = await calendar_handler.getNextEventByTypeAndChannel("meeting", originChannelId);

    const startTimeDate = new Date(event.start.dateTime);
    const timeDifference = startTimeDate.getTime() - Date.now();

    const isEventSoon = false;

    const parameters = await calendar_handler.getParametersFromDescription(event, slack_handler.defaultChannels);

    const emojiPair = parameters.eventType === "meeting" ? await events.generateEmojiPair() : undefined;

    const message = await events.generateMessage(
        event,
        parameters,
        timeDifference,
        isEventSoon,
        startTimeDate,
        emojiPair,
    );

    await slack_handler.postMessageToChannel(message, parameters.mainChannel, false);
};
