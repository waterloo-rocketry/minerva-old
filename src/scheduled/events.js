const calendar_handler = require("../handlers/calendar-handler");
const slack_handler = require("../handlers/slack-handler");
const moment = require("moment-timezone");

const ONE_MINUTE = 60000; // 1 minute in milliseconds
const FIVE_MINUTES = 300000; // 5 minutes in milliseconds
const SIX_HOURS = 21600000; // 6 hours in milliseconds

module.exports.checkForEvents = async function () {
    // select 4 events since it's realistically the maximum number of events that could happen at the same time (2 at either the close or far time point)
    // we could increase this, but in order to keep CPU compute & internet transfer down (since this function runs often)
    // we cap this at 4 events
    const events = (await calendar_handler.getNextEvents(4)).data.items;

    for (let event of events) {
        try {
            const startTimeDate = new Date(event.start.dateTime);
            const timeDifference = startTimeDate.getTime() - Date.now();

            const isEventSoon = await this.isEventSoon(timeDifference);
            const parameters = await calendar_handler.getParametersFromDescription(event, slack_handler.defaultChannels);

            //prettier-ignore
            const emojiPair = (!isEventSoon && parameters.eventType === "meeting") ? await this.generateEmojiPair() : undefined;

            const message = await this.generateMessage(event, parameters, timeDifference, isEventSoon, startTimeDate, emojiPair);

            let channelMessagePromises = [];
            let directMessagePromises = [];

            channelMessagePromises.push(
                slack_handler.postMessageToChannel((parameters.alertType === "alert-main-channel" ? "<!channel>\n" : "") + message, parameters.mainChannel, false)
            );

            if (parameters.alertType === "alert-single-channel") {
                directMessagePromises = slack_handler.directMessageSingleChannelGuestsInChannels(
                    message + "\n\n_You have been sent this message because you are a single channel guest who might have otherwise missed this alert._",
                    parameters.additionalChannels
                );
            } else {
                channelMessagePromises.push(slack_handler.postMessageToChannels(message, parameters.additionalChannels, false));
            }

            channelMessagePromises = await Promise.all(channelMessagePromises);

            if (emojiPair !== undefined) {
                for (let response of channelMessagePromises) {
                    await this.seedMessageReactions(response.channel, emojiPair, response.ts);
                }
            }

            // Your IDE might not recognize the 'await' as doing anything useful, but since directMessageSingleChannelGuestsInChannels is async,
            // the result is wrapped in a promise, thus, it is actually useful.
            directMessagePromises = await directMessagePromises;

            await slack_handler.postMessageToChannel(this.generateResultMessage(event, parameters, isEventSoon, directMessagePromises.length), "minerva-log", false);
        } catch (error) {
            console.log(event.summary + " failed because " + error);
        }
    }
};

module.exports.generateMessage = async function (event, parameters, timeDifference, isEventSoon, startTimeDate, emojis) {
    let message = "Reminder: *" + event.summary + "* is occurring ";

    if (isEventSoon) {
        message += "in *" + Math.ceil(timeDifference / 1000 / 60) + " minutes*";
    } else {
        message += "on *" + moment(startTimeDate).tz("America/Toronto").format("MMMM Do, YYYY [at] h:mm A") + "*";
    }

    if (parameters.eventType === "meeting") {
        if (parameters.agendaItems.length === 0 || parameters.agendaItems[0] === "") {
            message += "\nThere are currently no agenda items listed for this meeting.";
        } else {
            message += "\nPlease see the agenda items:\n    • " + parameters.agendaItems.join("\n    • ");
        }
    } else if (parameters.eventType === "test") {
        message += "\nToday's test is located at: " + (parameters.location === "" ? "Texas" : parameters.location);
    }

    if (parameters.notes != "") {
        message += "\nNotes: " + parameters.notes;
    }

    if (isEventSoon && parameters.eventType === "meeting") {
        message += "\nWays to attend:";
        if (parameters.location !== "") {
            message += "\n      :office: In person @ " + parameters.location;
        }
        if (parameters.link !== "") {
            message += "\n      :globe_with_meridians: Online @ " + parameters.link;
            if (parameters.link === "https://meet.jit.si/bay_area") {
                message += "\n      :calling: By phone +1-437-538-3987 (2633 1815 39)";
            }
        }
    } else {
        message += "\nReact with :" + emojis[0] + ": if you're coming, or :" + emojis[1] + ": if you're not!";
    }

    if ((parameters.alertType === "alert" || parameters.alertType === "alert-single-channel") && isEventSoon) {
        message = "<!channel>\n" + message;
    }

    return message;
};

module.exports.generateResultMessage = function (event, parameters, isEventSoon, totalDirectMessagesSent) {
    let message = "";

    if (isEventSoon) {
        message += "5 minute";
    } else {
        message += "6 hour";
    }

    message += " reminder sent for `" + event.summary + "`. ";

    if (parameters.alertType === "alert-single-channel") {
        message += totalDirectMessagesSent + " single-channel-guests messaged across " + parameters.additionalChannels.length + " channels.";
    } else {
        message += parameters.additionalChannels.length + 1 + " channel";
        if (parameters.additionalChannels != 0) {
            message += "s";
        }
        message += " messaged.";
    }
    return message;
};

module.exports.isEventSoon = async function (timeDifference) {
    if (timeDifference - FIVE_MINUTES < 0 && timeDifference - FIVE_MINUTES > -ONE_MINUTE) {
        // if the time difference minus lower bound plus one minute is less than 1 minute, than event is 5 minutes away. Event is soon.
        return Promise.resolve(true);
    } else if (timeDifference - SIX_HOURS < 0 && timeDifference - SIX_HOURS > -ONE_MINUTE) {
        // if the time difference is within 1 minute of 6 hours away
        return Promise.resolve(false);
    } else {
        // it's not in those two times, so skip
        // but returning reject causes error, so add a flag to know that this is an OK error
        return Promise.reject("Event outside time constraints");
    }
};

module.exports.generateEmojiPair = async function () {
    let emoji1 = await slack_handler.getRandomEmoji();
    let emoji2;

    // make sure that the two reactions are not the same
    for (let i = 0; i < 5; i++) {
        emoji2 = await slack_handler.getRandomEmoji();
        if (emoji2 !== emoji1) {
            return [emoji1, emoji2];
        }
    }

    return ["white_check_mark", "x"];
};

module.exports.seedMessageReactions = async function (channel, emojis, timestamp) {
    await slack_handler.addReactionToMessage(channel, emojis[0], timestamp);
    await slack_handler.addReactionToMessage(channel, emojis[1], timestamp);
};
