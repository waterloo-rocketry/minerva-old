const calendar = require("../handlers/calendar-handler");
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
        events = (await calendar.getNextEvents(4)).data.items;
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
            const parameters = await this.parseDescription(event.summary, event.description, channelIDMap);

            const message = await this.generateMessage(event, parameters, timeDifference, isEventSoon, startTimeDate);

            await slack_handler.postMessageToChannel((parameters.alert_type === "alert-main-channel" ? "<!channel>\n" : "") + message, parameters.main_channel, false);

            if (parameters.alert_type === "alert-single-channel") {
                await slack_handler.directMessageSingleChannelGuestsInChannels(
                    message + "\n\n_You have been sent this message because you are a single channel guest who might have otherwise missed this alert._",
                    parameters.additional_channels
                );
            } else {
                await slack_handler.postMessageToChannels(message, parameters.additional_channels, false);
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

module.exports.parseDescription = async function (summary, description, channelIDMap) {
    var parameters;

    try {
        parameters = JSON.parse(description);
    } catch (exception) {
        return Promise.reject("Upcoming *" + meeting + "* contains malformed JSON");
    }

    switch (parameters.event_type) {
        case "meeting":
            break;
        case "test":
            break;
        case "other":
            break;
        case "none":
            return Promise.reject("no-send");
        default:
            return Promise.reject("Upcoming *" + summary + "* contains an unknown or missing `event_type`");
    }

    switch (parameters.alert_type) {
        case "alert":
            break;
        case "alert-single-channel":
            break;
        case "alert-main-channel":
            break;
        case "copy":
            break;
        default:
            return Promise.reject("Upcoming *" + summary + "* contains an unknown or missing `alert_type`");
    }

    if (parameters.main_channel === undefined || parameters.main_channel === "") {
        return Promise.reject("Upcoming meeting *" + summary + "* is missing a `main_channel` element");
    }

    if (parameters.additional_channels === "default") {
        parameters.additional_channels = slack_handler.defaultChannels;
    }

    if (!Array.isArray(parameters.additional_channels)) {
        return Promise.reject("Upcoming meeting *" + summary + "* contains a malformed or missing `additional_channel` element");
    }

    parameters.additional_channels = parameters.additional_channels.filter(value => value != parameters.main_channel);

    if (parameters.agenda !== "" && !Array.isArray(parameters.agenda)) {
        return Promise.reject("Upcoming meeting *" + summary + "* contains a malformed `agenda` element");
    }

    parameters.agenda_string = "";

    for (var i = 0; i < parameters.agenda.length; i++) {
        parameters.agenda_string += "\n    • " + parameters.agenda[i].trim();
    }

    delete parameters.agenda;

    // Get rid of the main_channel if it is within additional channels

    return parameters;
};

module.exports.generateMessage = async function (event, parameters, timeDifference, isEventSoon, startTimeDate) {
    let message = "Reminder: *" + event.summary + "* is occurring ";

    if (isEventSoon) {
        message += "in *" + Math.ceil(timeDifference / 1000 / 60) + " minutes*";
    } else {
        message += "on *" + moment(startTimeDate).tz("America/Toronto").format("MMMM Do, YYYY [at] h:mm A") + "*";
    }

    if (parameters.event_type === "meeting") {
        if (parameters.agenda_string.length === 0) {
            message += "\nThere are currently no agenda items listed for this meeting.";
        } else {
            message += "\nPlease see the agenda items:" + parameters.agenda_string;
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
        message += "\nReact with " + (await slack_handler.getRandomEmoji()) + " if you're coming!";
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
