const calendar_handler = require("../handlers/calendar-handler");
const slack_handler = require("../handlers/slack-handler");
const moment = require("moment-timezone");

const LOWER_BOUND = 300000; // 5 minutes in milliseconds
const UPPER_BOUND = 21600000; // 6 hours in milliseconds

module.exports.checkForEvents = async function () {
    let events;
    try {
        // select 4 events since it's realistically the maximum number of events that could happen at the same time (2 at either the close or far time point)
        // we could increase this, but in order to keep CPU compute & internet transfer down (since this function runs often)
        // we cap this at 4 events
        events = (await calendar_handler.getNextEvents(4)).data.items;
    } catch (error) {
        return Promise.reject(error);
    }
    let results = [];
    for (let event of events) {
        try {
            const startTimeDate = new Date(event.start.dateTime);
            const timeDifference = startTimeDate.getTime() - Date.now();

            const isEventSoon = await this.isEventSoon(timeDifference);

            // We only want to generate the mapping if we need to translate from channel names --> channel IDs to reduce API calls
            // So, if translation is required, generate, if not, return undefined
            const channelIDMap = (await this.isTranslationRequired(event.summary, event.description)) ? await slack_handler.generateChannelNameIdMapping() : undefined;
            const parameters = await calendar_handler.getParametersFromDescription(event.summary, event.description, slack_handler.defaultChannels);

            const emojiPair = !(isEventSoon && parameters.type === "meeting") ? await this.generateEmojiPair() : undefined;

            const message = await this.generateMessage(event, parameters, timeDifference, isEventSoon, startTimeDate, emojiPair);

            const messageResponses = [];

            messageResponses.push(
                await slack_handler.postMessageToChannel((parameters.alert_type === "alert-main-channel" ? "<!channel>\n" : "") + message, parameters.main_channel, false)
            );

            if (parameters.alert_type === "alert-single-channel") {
                const dmMessageResponses = await slack_handler.directMessageSingleChannelGuestsInChannels(
                    message + "\n\n_You have been sent this message because you are a single channel guest who might have otherwise missed this alert._",
                    parameters.additional_channels
                );

                for (let response of dmMessageResponses) {
                    messageResponses.push(response);
                }
            } else {
                const additionalChannnelmessageResponses = await slack_handler.postMessageToChannels(message, parameters.additional_channels, false);

                for (let response of additionalChannnelmessageResponses) {
                    messageResponses.push(response);
                }
            }

            if (emojiPair !== undefined) {
                for (let response of messageResponses) {
                    await this.seedMessageReactions(response.channel, emojiPair, response.ts);
                }
            }
        } catch (error) {
            if (error === "no-send") {
                results.push(Promise.resolve("no-send"));
            } else {
                results.push(Promise.reject(error));
            }
        }
    }
    return Promise.all(results);
};

module.exports.generateMessage = async function (event, parameters, timeDifference, isEventSoon, startTimeDate, emojis) {
    let message = "Reminder: *" + event.summary + "* is occurring ";

    if (isEventSoon) {
        message += "in *" + Math.ceil(timeDifference / 1000 / 60) + " minutes*";
    } else {
        message += "on *" + moment(startTimeDate).tz("America/Toronto").format("MMMM Do, YYYY [at] h:mm A") + "*";
    }

    if (parameters.event_type === "meeting") {
        if (parameters.agenda.length === 0 || parameters.agenda[0] === "") {
            message += "\nThere are currently no agenda items listed for this meeting.";
        } else {
            message += "\nPlease see the agenda items:\n    • " + parameters.agenda.join("\n    • ");
        }
    } else if (parameters.event_type === "test") {
        message += "\nToday's test is located at: " + (event.location === undefined ? "Texas" : event.location);
    }

    if (parameters.extra != "") {
        message += "\nNotes: " + parameters.extra;
    }

    if (isEventSoon && parameters.event_type === "meeting") {
        // prettier-ignore
        message +=
		    "\nWays to attend:" +
		    "\n      :office: In person @ " + event.location +
		    "\n      :globe_with_meridians: Online @ " + (parameters.link === undefined ? "https://meet.jit.si/bay_area" : parameters.link)+
		    "\n      :calling: By phone +1-437-538-3987 (2633 1815 39)";
    } else {
        message += "\nReact with :" + emojis[0] + ": if you're coming, or :" + emojis[1] + ": if you're not!";
    }

    if (parameters.alert_type === "alert" || parameters.alert_type === "alert-single-channel") {
        message = "<!channel>\n" + message;
    }

    return message;
};

module.exports.isEventSoon = async function (timeDifference) {
    if (timeDifference < LOWER_BOUND && timeDifference > 0) {
        // if the time difference is less than 5 minutes, event is soon
        return Promise.resolve(true);
    } else if (timeDifference > UPPER_BOUND - LOWER_BOUND && timeDifference < UPPER_BOUND + LOWER_BOUND) {
        // if the time difference is somewhere around 5:55 and 6:05 hh:mm away
        return Promise.resolve(false);
    } else {
        // it's not in those two times, so skip
        // but returning reject causes error, so add a flag to know that this is an OK error
        return Promise.reject("no-send");
    }
};

module.exports.isTranslationRequired = async function (summary, description) {
    if (description === undefined || description === "") return Promise.reject("Upcoming *" + summary + "* contains an undefined description");
    const lines = description.split("\n");
    return lines[2] === "default" || lines[1] === "alert-single-channel";
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
