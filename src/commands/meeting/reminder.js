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

    const message = await events.generateMessage(event, parameters, timeDifference, isEventSoon, startTimeDate, emojiPair);

    await slack_handler.postMessageToChannel(message, parameters.mainChannel, false);

    if (parameters.alertType === "alert-single-channel") {
        console.log("[DEBUG] Alert type is 'alert-single-channel'")
        // when we alert single channel guests we simply want to PM them the message
        const responses = await slack_handler.directMessageSingleChannelGuestsInChannels(
            message +
                "\n\n_You have been sent this message because you are a single channel guest who might have otherwise missed this alert.\n\n" +
                "If you're unsure what this message is about, feel free to message the original poster for more information._",
            parameters.channels
        );

        responses = await responses;
        console.log("[DEBUG] Direct Message Responses:" + responses)


        return responses.length + " single-channel-guests messaged.";
    }
};
